const db = require("../config/database");

const MANUFACTURER_HINTS = [
  { matcher: /coca[-\s]?cola/i, name: "Coca-Cola Beverages" },
  { matcher: /piattos/i, name: "Jack 'n Jill" },
  { matcher: /pancit\s*canton|lucky\s*me/i, name: "Lucky Me / Monde Nissin" },
  { matcher: /nescafe|milo|nestle/i, name: "Nestle" },
  { matcher: /bear\s*brand/i, name: "Nestle" },
  { matcher: /century\s*tuna/i, name: "Century Pacific" },
  { matcher: /alaska/i, name: "Alaska Milk" },
  { matcher: /skyflakes/i, name: "M.Y. San" },
  { matcher: /rebisco/i, name: "Rebisco" },
  { matcher: /surf|ariel|downy/i, name: "P&G / Unilever" },
  { matcher: /del\s*monte/i, name: "Del Monte" },
  { matcher: /load|gcash|photocopy/i, name: "In-Store Service" }
];

function getManufacturer(productName) {
  const match = MANUFACTURER_HINTS.find((rule) => rule.matcher.test(productName));
  return match ? match.name : "—";
}

// Get all products for the Inventory page
exports.getProductItems = async (req, res) => {
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
         p.product_type AS category,
         p.selling_price AS price, p.photo,
         COALESCE(
           SUM(
             CASE
               WHEN pb.status != 'Discontinued'
               THEN COALESCE(pb.stock_quantity, 0)
               ELSE 0
             END
           ),
           0
         ) AS stock
       FROM products p
       LEFT JOIN product_batches pb ON pb.product_id = p.product_id
       ${whereClause}
       GROUP BY p.product_id, p.name, p.barcode, p.product_type, p.selling_price, p.photo
       ORDER BY p.name ASC`,
      params
    );

    const items = rows.map((row) => {
      const stock = Number(row.stock) || 0;
      return {
        id: row.product_id,
        name: row.name,
        barcode: row.barcode || null,
        manufacturer: getManufacturer(row.name),
        category: row.category,
        price: Number(row.price) || 0,
        photo: row.photo || null,
        stock,
        lowStock: stock > 0 && stock <= 5
      };
    });

    res.json({ items });
  } catch (err) {
    console.error("getProductItems error:", err);
    res.status(500).json({ error: "Failed to load products." });
  }
};

// Add a new product
exports.addProduct = async (req, res) => {
  const { name, category, price, stock, barcode, photo } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: "Name and category are required" });
  }

  try {
    // Check barcode uniqueness if provided
    if (barcode && barcode.trim()) {
      const [existing] = await db.query(
        "SELECT product_id FROM products WHERE barcode = ?",
        [barcode.trim()]
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: "Barcode already exists for another product" });
      }
    }

    const [result] = await db.query(
      `INSERT INTO products (name, product_type, selling_price, barcode, photo)
       VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), category, parseFloat(price) || null, barcode?.trim() || null, photo || null]
    );

    const product_id = result.insertId;

    // Create initial stock batch if stock > 0
    const stockQty = parseInt(stock) || 0;
    if (stockQty > 0) {
      await db.query(
        `INSERT INTO product_batches (product_id, stock_quantity, status, purchase_date)
         VALUES (?, ?, 'On Shelves', NOW())`,
        [product_id, stockQty]
      );
    }

    res.json({
      success: true,
      product_id,
      message: `Product "${name}" added successfully`
    });
  } catch (err) {
    console.error("addProduct error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Barcode already exists for another product" });
    }
    res.status(500).json({ error: "Failed to add product", detail: err.message });
  }
};

// Update an existing product
exports.updateProduct = async (req, res) => {
  const { product_id } = req.params;
  const { name, category, price, barcode, photo } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: "Name and category are required" });
  }

  try {
    // Check barcode uniqueness (exclude current product)
    if (barcode && barcode.trim()) {
      const [existing] = await db.query(
        "SELECT product_id FROM products WHERE barcode = ? AND product_id != ?",
        [barcode.trim(), product_id]
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: "Barcode already exists for another product" });
      }
    }

    await db.query(
      `UPDATE products SET name = ?, product_type = ?, selling_price = ?, barcode = ?, photo = ?
       WHERE product_id = ?`,
      [name.trim(), category, parseFloat(price) || null, barcode?.trim() || null, photo || null, product_id]
    );

    res.json({ success: true, message: `Product updated successfully` });
  } catch (err) {
    console.error("updateProduct error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Barcode already exists for another product" });
    }
    res.status(500).json({ error: "Failed to update product" });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  const { product_id } = req.params;

  try {
    // Check if product is used in any transactions
    const [orders] = await db.query(
      "SELECT transaction_id FROM transaction_orders WHERE product_id = ? LIMIT 1",
      [product_id]
    );

    if (orders.length > 0) {
      // Soft delete: mark batches as discontinued instead
      await db.query(
        "UPDATE product_batches SET status = 'Discontinued' WHERE product_id = ?",
        [product_id]
      );
      return res.json({ success: true, message: "Product discontinued (has transaction history)" });
    }

    // Hard delete if no transaction history
    await db.query("DELETE FROM product_batches WHERE product_id = ?", [product_id]);
    await db.query("DELETE FROM products WHERE product_id = ?", [product_id]);

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error("deleteProduct error:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
};
