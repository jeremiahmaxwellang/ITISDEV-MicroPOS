const db = require("../config/database");

let productPhotoColumnPromise;

async function resolveProductPhotoColumn() {
  if (!productPhotoColumnPromise) {
    productPhotoColumnPromise = (async () => {
      const [rows] = await db.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'products'
           AND COLUMN_NAME = 'photo'`
      );

      return rows.length ? "photo" : null;
    })().catch((err) => {
      productPhotoColumnPromise = null;
      throw err;
    });
  }

  return productPhotoColumnPromise;
}

/**
 * Canonical barcode strategy:
 * - Store/compare primarily as EAN-13 when numeric UPC-A/EAN overlap applies.
 * - UPC-A (12 digits) is normalized to EAN-13 by prefixing `0`.
 * - EAN-13 that starts with `0` also keeps a UPC-A fallback variant.
 * - Non-overlap formats are matched as cleaned exact values.
 */
function computeEan13CheckDigit(first12) {
  if (!/^\d{12}$/.test(first12)) return null;
  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    const digit = Number(first12[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  return String((10 - (sum % 10)) % 10);
}

function normalizeBarcode(raw) {
  const b = String(raw || "")
    .trim()
    .replace(/[^0-9a-zA-Z]/g, "")
    .toUpperCase();

  if (!b) return { canonical: "", variants: [] };

  if (/^\d{12}$/.test(b)) {
    const ean13FromCheckDigit = `${b}${computeEan13CheckDigit(b) || ""}`;
    const ean13FromUpc = `0${b}`;
    const variants = [...new Set([ean13FromCheckDigit, ean13FromUpc, b].filter(Boolean))];
    return { canonical: ean13FromCheckDigit || ean13FromUpc, variants };
  }

  if (/^\d{13}$/.test(b) && b.startsWith("0")) {
    return { canonical: b, variants: [b, b.slice(1)] };
  }

  return { canonical: b, variants: [b] };
}

// Scan barcode and retrieve product
exports.scanBarcode = async (req, res) => {
  const { barcode } = req.body;

  if (!barcode || barcode.trim() === "") {
    return res.status(400).json({ error: "Barcode is required" });
  }

  const { canonical, variants } = normalizeBarcode(barcode);
  if (!variants.length) {
    return res.status(400).json({ error: "Invalid barcode value" });
  }

  const placeholders = variants.map(() => "?").join(", ");

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
              WHEN pb.status = 'On Shelves'
                AND (pb.expiry_date IS NULL OR pb.expiry_date > NOW())
              THEN COALESCE(pb.stock_quantity, 0)
              ELSE 0
            END
          ),
          0
        ) AS available_stock
      FROM products p
      LEFT JOIN product_batches pb ON p.product_id = pb.product_id
      WHERE UPPER(REPLACE(REPLACE(REPLACE(COALESCE(p.barcode, ''), ' ', ''), '-', ''), '.', '')) IN (${placeholders})
      GROUP BY p.product_id, p.name, p.barcode, p.product_type, p.selling_price
      LIMIT 1`,
      variants
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found", barcode: canonical });
    }

    const product = rows[0];

    if (product.product_type === "Services") {
      return res.json({
        success: true,
        product: {
          id: product.product_id,
          name: product.name,
          barcode: product.barcode,
          price: Number(product.price) || 0,
          stock: -1,
          type: product.product_type
        }
      });
    }

    if (product.available_stock <= 0) {
      return res.status(400).json({ error: "Product out of stock", product });
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

// Get all products for manual search/selection in POS
exports.getProductsForPOS = async (req, res) => {
  const { search = "", category = "all" } = req.query;

  try {
    const photoColumn = await resolveProductPhotoColumn();
    const photoSelect = photoColumn ? `p.${photoColumn} AS photo,` : "NULL AS photo,";
    const photoGroupBy = photoColumn ? `, p.${photoColumn}` : "";

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
        ${photoSelect}
        COALESCE(
          SUM(
            CASE
              WHEN pb.status = 'On Shelves'
                AND (pb.expiry_date IS NULL OR pb.expiry_date > NOW())
              THEN COALESCE(pb.stock_quantity, 0)
              ELSE 0
            END
          ),
          0
        ) AS available_stock
      FROM products p
      LEFT JOIN product_batches pb ON p.product_id = pb.product_id
      ${whereClause}
      GROUP BY p.product_id, p.name, p.barcode, p.product_type, p.selling_price${photoGroupBy}
      ORDER BY p.name ASC
      LIMIT 100`,
      params
    );

    const items = rows.map((row) => ({
      id: row.product_id,
      name: row.name,
      barcode: row.barcode,
      price: Number(row.price) || 0,
      photo: row.photo || null,
      stock: row.product_type === "Services" ? -1 : Number(row.available_stock) || 0,
      type: row.product_type
    }));

    res.json({ success: true, items });
  } catch (err) {
    console.error("getProductsForPOS error:", err);
    res.status(500).json({ error: "Failed to load products" });
  }
};

// Search customers by name or phone (used at checkout for Utang)
exports.searchCustomers = async (req, res) => {
  const { search = "" } = req.query;
  try {
    const term = `%${search.trim()}%`;
    const [rows] = await db.query(
      `SELECT customer_id, first_name, last_name, phone_number
       FROM customers
       WHERE first_name LIKE ? OR last_name LIKE ? OR phone_number LIKE ?
       ORDER BY first_name ASC
       LIMIT 10`,
      [term, term, term]
    );
    res.json({ success: true, customers: rows });
  } catch (err) {
    console.error("searchCustomers error:", err);
    res.status(500).json({ error: "Failed to search customers" });
  }
};

// Process a complete transaction
exports.processTransaction = async (req, res) => {
  const sessionStaffId = req.session && req.session.user ? req.session.user.staff_id : null;
  const {
    items,
    customer_id = null,
    staff_id = null,
    payment_method = "Cash",
    customer_name = null,
    gcash_reference = null,
    gcash_customer_number = null,
    gcash_customer_name = null,
    gcash_proof_filename = null,
    amount_paid = null   // for Partial / Split payment
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  const isUtang   = payment_method === "Utang";
  const isPartial = payment_method === "Partial";

  if ((isUtang || isPartial) && !customer_id) {
    return res.status(400).json({ error: "A customer must be selected for Utang/Partial transactions" });
  }
  if (isPartial && (amount_paid === null || Number(amount_paid) <= 0)) {
    return res.status(400).json({ error: "amount_paid must be greater than 0 for Partial transactions" });
  }

  try {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      let total_price = 0;

      // Validate all items and calculate total (service fee + load amount)
      for (const item of items) {
        const [productRows] = await connection.query(
          `SELECT selling_price, product_type FROM products WHERE product_id = ?`,
          [item.product_id]
        );

        if (productRows.length === 0) {
          throw new Error(`Product ${item.product_id} not found`);
        }

        const price = Number(productRows[0].selling_price) || 0;
        const loadAmount = productRows[0].product_type === "Services" ? (Number(item.load_amount) || 0) : 0;
        total_price += price * item.quantity + loadAmount;
      }

      const status = isUtang ? "Unpaid" : isPartial ? "Partial" : "Paid";
      const storedPaymentMethod = (isUtang || isPartial) ? "Other" : payment_method;
      const effectiveStaffId = Number(staff_id || sessionStaffId || 1);

      const [transactionResult] = await connection.query(
        `INSERT INTO transactions (customer_id, staff_id, total_price, status, payment_method, date_ordered)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [customer_id, effectiveStaffId, total_price, status, storedPaymentMethod]
      );

      const transaction_id = transactionResult.insertId;

      for (const item of items) {
        const [productRows] = await connection.query(
          `SELECT selling_price, product_type FROM products WHERE product_id = ?`,
          [item.product_id]
        );

        const price_each = Number(productRows[0].selling_price) || 0;
        const loadAmount = productRows[0].product_type === "Services" ? (Number(item.load_amount) || 0) : 0;

        await connection.query(
          `INSERT INTO transaction_orders (transaction_id, product_id, price_each, quantity, load_amount)
           VALUES (?, ?, ?, ?, ?)`,
          [transaction_id, item.product_id, price_each, item.quantity, loadAmount]
        );

        // Only deduct stock for physical products
        if (productRows[0].product_type !== "Services") {
          await connection.query(
            `UPDATE product_batches
             SET stock_quantity = GREATEST(0, stock_quantity - ?)
             WHERE product_id = ?
               AND status = 'On Shelves'
               AND (expiry_date IS NULL OR expiry_date > NOW())
             ORDER BY expiry_date ASC
             LIMIT 1`,
            [item.quantity, item.product_id]
          );
        }
      }

      // For full Utang: create a debt record for the entire amount
      if (isUtang) {
        const [debtResult] = await connection.query(
          `INSERT INTO debts (customer_id, debt_amount, status, debt_started)
           VALUES (?, ?, 'Unpaid', CURRENT_DATE)`,
          [customer_id, total_price]
        );
        await connection.query(
          `INSERT INTO debt_transactions (debt_id, transaction_id) VALUES (?, ?)`,
          [debtResult.insertId, transaction_id]
        );
      }

      // For Partial: record the upfront payment + create a debt for the remainder
      if (isPartial) {
        const paidNow = Number(amount_paid);
        const debtAmount = total_price - paidNow;

        if (debtAmount <= 0) {
          throw new Error("Partial payment amount must be less than the total transaction amount");
        }

        // Payment record for the amount paid upfront
        await connection.query(
          `INSERT INTO payments (transaction_id, staff_id, amount_paid, payment_method, notes)
           VALUES (?, ?, ?, 'Cash', 'Partial / Split payment — upfront portion')`,
          [transaction_id, effectiveStaffId, paidNow]
        );

        // Debt record for the remaining balance (merge with existing active debt if present)
        const [existingDebtRows] = await connection.query(
          `SELECT debt_id
           FROM debts
           WHERE customer_id = ?
             AND status != 'Paid'
           ORDER BY debt_id DESC
           LIMIT 1
           FOR UPDATE`,
          [customer_id]
        );

        let debtId;
        if (existingDebtRows.length > 0) {
          debtId = existingDebtRows[0].debt_id;
          await connection.query(
            `UPDATE debts
             SET debt_amount = COALESCE(debt_amount, 0) + ?
             WHERE debt_id = ?`,
            [debtAmount, debtId]
          );
        } else {
          const [debtResult] = await connection.query(
            `INSERT INTO debts (customer_id, debt_amount, status, debt_started)
             VALUES (?, ?, 'Unpaid', CURRENT_DATE)`,
            [customer_id, debtAmount]
          );
          debtId = debtResult.insertId;
        }

        await connection.query(
          `INSERT INTO debt_transactions (debt_id, transaction_id) VALUES (?, ?)`,
          [debtId, transaction_id]
        );

        // Payment proof record for the upfront cash
        await connection.query(
          `INSERT INTO payment_proofs (staff_id, customer_name, gcash_number, amount_paid, date_paid, proof_image_url)
           VALUES (?, ?, 'CASH', ?, CURRENT_DATE, NULL)`,
          [effectiveStaffId, customer_name || "Walk-in Customer", paidNow]
        );
      }

      // If GCash, insert payment record
      if (payment_method === "GCash") {
        await connection.query(
          `INSERT INTO payments (transaction_id, staff_id, amount_paid, payment_method, proof_of_payment, notes)
           VALUES (?, ?, ?, 'GCash', ?, ?)`,
          [
            transaction_id,
            effectiveStaffId,
            total_price,
            gcash_proof_filename || null,
            `Ref: ${gcash_reference || ''}; Name: ${gcash_customer_name || ''}; Number: ${gcash_customer_number || ''}`
          ]
        );
      }

      if (payment_method === "Cash" || payment_method === "GCash") {
        const preferredCustomerName = payment_method === "GCash"
          ? (gcash_customer_name || customer_name)
          : customer_name;

        const normalizedCustomerName = String(
          preferredCustomerName || "Walk-in Customer"
        ).trim() || "Walk-in Customer";

        const normalizedPaymentNumber = payment_method === "GCash"
          ? (String(gcash_customer_number || "N/A").trim() || "N/A")
          : "CASH";

        const proofImageUrl = payment_method === "GCash" && gcash_proof_filename
          ? `/uploads/payment-proof/${gcash_proof_filename}`
          : null;

        await connection.query(
          `INSERT INTO payment_proofs
           (staff_id, customer_name, gcash_number, amount_paid, date_paid, proof_image_url)
           VALUES (?, ?, ?, ?, CURRENT_DATE, ?)`,
          [
            effectiveStaffId,
            normalizedCustomerName,
            normalizedPaymentNumber,
            total_price,
            proofImageUrl
          ]
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
        COUNT(DISTINCT o.product_id) AS items_count,
        CONCAT(s.first_name, ' ', s.last_name) AS staff_name,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name
      FROM transactions t
      LEFT JOIN staff s ON t.staff_id = s.staff_id
      LEFT JOIN customers c ON t.customer_id = c.customer_id
      LEFT JOIN transaction_orders o ON t.transaction_id = o.transaction_id
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
        o.price_each,
        o.quantity,
        (o.price_each * o.quantity) AS subtotal
      FROM transaction_orders o
      JOIN products p ON o.product_id = p.product_id
      WHERE o.transaction_id = ?`,
      [transaction_id]
    );

    res.json({
      success: true,
      transaction: { ...transactionRows[0], items: itemRows }
    });
  } catch (err) {
    console.error("getTransactionDetails error:", err);
    res.status(500).json({ error: "Failed to fetch transaction details" });
  }
};
