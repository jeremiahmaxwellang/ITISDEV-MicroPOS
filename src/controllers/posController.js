const db = require("../config/database");

/**
 * POSController - Handles all POS and barcode scanning operations
 * Integrates with inventory system and transaction processing
 */

// Scan barcode and retrieve product
exports.scanBarcode = async (req, res) => {
  const { barcode } = req.body;

  if (!barcode || barcode.trim() === "") {
    return res.status(400).json({ error: "Barcode is required" });
  }

  try {
    const [rows] = await db.query(
      `SELECT
        p.product_id,
        p.name,
        p.barcode,
        p.product_type,
        p.selling_price AS price,
        COALESCE(
          SUM(
            CASE
              WHEN pb.status = 'On Shelves' AND pb.expiry_date > NOW()
              THEN COALESCE(pb.stock_quantity, 0)
              ELSE 0
            END
          ),
          0
        ) AS available_stock
      FROM products p
      LEFT JOIN product_batches pb ON p.product_id = pb.product_id
      WHERE p.barcode = ? OR p.product_id = ?
      GROUP BY p.product_id, p.name, p.barcode, p.product_type, p.selling_price`,
      [barcode, parseInt(barcode) || 0]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found", barcode });
    }

    const product = rows[0];

    // Check if product is available
    if (product.product_type === "Services") {
      // Services don't have stock limits
      return res.json({
        success: true,
        product: {
          id: product.product_id,
          name: product.name,
          barcode: product.barcode,
          price: Number(product.price) || 0,
          stock: -1, // -1 means unlimited (for services)
          type: product.product_type
        }
      });
    }

    if (product.available_stock <= 0) {
      return res
        .status(400)
        .json({ error: "Product out of stock", product: product });
    }

    return res.json({
      success: true,
      product: {
        id: product.product_id,
        name: product.name,
        barcode: product.barcode,
        price: Number(product.price) || 0,
        stock: product.available_stock,
        type: product.product_type
      }
    });
  } catch (err) {
    console.error("scanBarcode error:", err);
    res.status(500).json({ error: "Failed to scan barcode" });
  }
};

// Get all products for manual search/selection
exports.getProductsForPOS = async (req, res) => {
  const { search = "", category = "all" } = req.query;

  try {
    const params = [];
    const filters = [];

    if (search.trim()) {
      filters.push("(p.name LIKE ? OR p.barcode LIKE ?)");
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (category && category !== "all") {
      filters.push("p.product_type = ?");
      params.push(category);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT
        p.product_id,
        p.name,
        p.barcode,
        p.product_type,
        p.selling_price AS price,
        COALESCE(
          SUM(
            CASE
              WHEN pb.status = 'On Shelves' AND pb.expiry_date > NOW()
              THEN COALESCE(pb.stock_quantity, 0)
              ELSE 0
            END
          ),
          0
        ) AS available_stock
      FROM products p
      LEFT JOIN product_batches pb ON p.product_id = pb.product_id
      ${whereClause}
      GROUP BY p.product_id, p.name, p.barcode, p.product_type, p.selling_price
      ORDER BY p.name ASC
      LIMIT 100`,
      params
    );

    const items = rows.map((row) => {
      const stock = Number(row.available_stock) || 0;
      return {
        id: row.product_id,
        name: row.name,
        barcode: row.barcode,
        price: Number(row.price) || 0,
        stock: row.product_type === "Services" ? -1 : stock,
        type: row.product_type
      };
    });

    res.json({ success: true, items });
  } catch (err) {
    console.error("getProductsForPOS error:", err);
    res.status(500).json({ error: "Failed to load products" });
  }
};

// Process a complete transaction
exports.processTransaction = async (req, res) => {
  const { items, customer_id = null, staff_id = null, payment_method = "Cash", notes = "" } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  try {
    // Start a transaction
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      let total_price = 0;

      // Validate all items first
      for (const item of items) {
        const [productRows] = await connection.query(
          `SELECT selling_price FROM products WHERE product_id = ?`,
          [item.product_id]
        );

        if (productRows.length === 0) {
          throw new Error(`Product ${item.product_id} not found`);
        }

        const price = Number(productRows[0].selling_price) || 0;
        total_price += price * item.quantity;
      }

      // Create transaction record
      const [transactionResult] = await connection.query(
        `INSERT INTO transactions (customer_id, staff_id, total_price, status, payment_method, date_ordered)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [customer_id, staff_id || 1, total_price, "Completed", payment_method]
      );

      const transaction_id = transactionResult.insertId;

      // Add items to transaction_orders
      for (const item of items) {
        const [productRows] = await connection.query(
          `SELECT selling_price FROM products WHERE product_id = ?`,
          [item.product_id]
        );

        const price_each = Number(productRows[0].selling_price) || 0;

        await connection.query(
          `INSERT INTO transaction_orders (transaction_id, product_id, price_each, quantity)
           VALUES (?, ?, ?, ?)`,
          [transaction_id, item.product_id, price_each, item.quantity]
        );

        // Update stock in product_batches
        await connection.query(
          `UPDATE product_batches
           SET stock_quantity = stock_quantity - ?
           WHERE product_id = ? AND status = 'On Shelves' AND expiry_date > NOW()
           LIMIT ?`,
          [item.quantity, item.product_id, 1]
        );
      }

      await connection.commit();

      return res.json({
        success: true,
        transaction_id,
        total_price,
        items_count: items.reduce((sum, item) => sum + item.quantity, 0),
        payment_method
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("processTransaction error:", err);
    res.status(500).json({ error: "Failed to process transaction", message: err.message });
  }
};

// Get transaction history
exports.getTransactionHistory = async (req, res) => {
  const { limit = 10, offset = 0 } = req.query;

  try {
    const [rows] = await db.query(
      `SELECT
        t.transaction_id,
        t.customer_id,
        t.staff_id,
        t.total_price,
        t.date_ordered,
        t.status,
        t.payment_method,
        COUNT(DISTINCT to2.product_id) AS items_count,
        CONCAT(s.first_name, ' ', s.last_name) AS staff_name,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name
      FROM transactions t
      LEFT JOIN staff s ON t.staff_id = s.staff_id
      LEFT JOIN customers c ON t.customer_id = c.customer_id
      LEFT JOIN transaction_orders to2 ON t.transaction_id = to2.transaction_id
      WHERE t.status != 'Cancelled'
      GROUP BY t.transaction_id
      ORDER BY t.date_ordered DESC
      LIMIT ? OFFSET ?`,
      [parseInt(limit) || 10, parseInt(offset) || 0]
    );

    res.json({ success: true, transactions: rows });
  } catch (err) {
    console.error("getTransactionHistory error:", err);
    res.status(500).json({ error: "Failed to fetch transaction history" });
  }
};

// Get transaction details
exports.getTransactionDetails = async (req, res) => {
  const { transaction_id } = req.params;

  try {
    const [transactionRows] = await db.query(
      `SELECT
        t.transaction_id,
        t.total_price,
        t.date_ordered,
        t.status,
        t.payment_method,
        CONCAT(s.first_name, ' ', s.last_name) AS staff_name,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name
      FROM transactions t
      LEFT JOIN staff s ON t.staff_id = s.staff_id
      LEFT JOIN customers c ON t.customer_id = c.customer_id
      WHERE t.transaction_id = ?`,
      [transaction_id]
    );

    if (transactionRows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const [itemRows] = await db.query(
      `SELECT
        p.product_id,
        p.name,
        p.barcode,
        to2.price_each,
        to2.quantity,
        (to2.price_each * to2.quantity) AS subtotal
      FROM transaction_orders to2
      JOIN products p ON to2.product_id = p.product_id
      WHERE to2.transaction_id = ?`,
      [transaction_id]
    );

    res.json({
      success: true,
      transaction: {
        ...transactionRows[0],
        items: itemRows
      }
    });
  } catch (err) {
    console.error("getTransactionDetails error:", err);
    res.status(500).json({ error: "Failed to fetch transaction details" });
  }
};
