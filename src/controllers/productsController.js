// Purchase Recommendations for Inventory Insights
// Returns products that are hot sellers and need to be restocked based on recent sales
exports.getPurchaseRecommendations = async (req, res) => {
  // Default to last 30 days, can be changed via query param
  const period = parseInt(req.query.period, 10) || 30;
  // How many days of sales to keep in stock (e.g., 7 days)
  const daysOfStock = parseInt(req.query.daysOfStock, 10) || 7;

  try {
    // 1. Get sales velocity (units sold per product in period)
    const [salesRows] = await db.query(
      `SELECT p.product_id, p.name, SUM(o.quantity) AS units_sold
       FROM transaction_orders o
       JOIN products p ON p.product_id = o.product_id
       JOIN transactions t ON t.transaction_id = o.transaction_id
       WHERE t.date_ordered >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY p.product_id, p.name`,
      [period]
    );

    // 2. Get current stock for all products
    const [stockRows] = await db.query(
      `SELECT p.product_id, COALESCE(SUM(CASE WHEN pb.status != 'Discontinued' THEN pb.stock_quantity ELSE 0 END), 0) AS stock
       FROM products p
       LEFT JOIN product_batches pb ON pb.product_id = p.product_id
       GROUP BY p.product_id`
    );

    // 3. Map product_id to stock
    const stockMap = {};
    for (const row of stockRows) {
      stockMap[row.product_id] = Number(row.stock) || 0;
    }

    // 4. Build recommendations
    const recommendations = [];
    // Add products with low stock (<= 5), regardless of sales
    for (const row of stockRows) {
      const product_id = row.product_id;
      const stock = Number(row.stock) || 0;
      if (stock <= 5) {
        // Find sales info if available
        const sale = salesRows.find(s => s.product_id === product_id) || { units_sold: 0, name: row.name };
        recommendations.push({
          product_id,
          name: sale.name || row.name,
          stock,
          unitsSold: Number(sale.units_sold) || 0,
          recommendedStock: null,
          reorderAmount: null,
          lowStock: true
        });
      }
    }
    // Add hot sellers with stock below recommended
    for (const sale of salesRows) {
      const product_id = sale.product_id;
      const unitsSold = Number(sale.units_sold) || 0;
      if (unitsSold === 0) continue;
      const stock = stockMap[product_id] || 0;
      const salesPerDay = unitsSold / period;
      const recommendedStock = Math.ceil(salesPerDay * daysOfStock);
      if (stock < recommendedStock && stock > 5) { // avoid duplicate if already in low stock
        recommendations.push({
          product_id,
          name: sale.name,
          stock,
          unitsSold,
          recommendedStock,
          reorderAmount: recommendedStock - stock,
          lowStock: false
        });
      }
    }
    // Sort: low stock first, then by reorder amount descending
    recommendations.sort((a, b) => {
      if (a.lowStock && !b.lowStock) return -1;
      if (!a.lowStock && b.lowStock) return 1;
      return (b.reorderAmount || 0) - (a.reorderAmount || 0);
    });

    res.json({ recommendations });
  } catch (err) {
    console.error("getPurchaseRecommendations error:", err);
    res.status(500).json({ error: "Failed to generate purchase recommendations." });
  }
};
const db = require("../config/database");
const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");

const productPhotoUploadDir = path.join(process.cwd(), "public", "uploads", "product-photos");
const allowedPhotoMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

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

const SERVICE_CONFIG_DEFS = {
  load: "Load / E-Load",
  cash: "Cash-In / Cash-Out"
};

function getManufacturer(productName) {
  const match = MANUFACTURER_HINTS.find((rule) => rule.matcher.test(productName));
  return match ? match.name : "—";
}

async function ensureServiceProduct(name) {
  const [rows] = await db.query(
    `SELECT product_id, name, selling_price AS price
     FROM products
     WHERE product_type = 'Services' AND LOWER(name) = LOWER(?)
     LIMIT 1`,
    [name]
  );

  if (rows.length > 0) {
    return {
      id: rows[0].product_id,
      name: rows[0].name,
      price: Number(rows[0].price) || 0
    };
  }

  const [insertResult] = await db.query(
    `INSERT INTO products (name, volume, product_type, selling_price, barcode)
     VALUES (?, NULL, 'Services', 0, NULL)`,
    [name]
  );

  return {
    id: insertResult.insertId,
    name,
    price: 0
  };
}

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

exports.uploadProductPhoto = async (req, res) => {
  try {
    if (!req.files || !req.files.productPhoto) {
      return res.status(400).json({ error: "Product photo file is required." });
    }

    const productPhoto = req.files.productPhoto;
    if (!allowedPhotoMimeTypes.has(productPhoto.mimetype)) {
      return res.status(400).json({ error: "Only JPG, PNG, WEBP, and GIF images are allowed." });
    }

    const ext = path.extname(productPhoto.name || "").toLowerCase() || (() => {
      switch (productPhoto.mimetype) {
        case "image/png":
          return ".png";
        case "image/webp":
          return ".webp";
        case "image/gif":
          return ".gif";
        default:
          return ".jpg";
      }
    })();

    const fileName = `product-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
    const filePath = path.join(productPhotoUploadDir, fileName);

    await fs.mkdir(productPhotoUploadDir, { recursive: true });
    await productPhoto.mv(filePath);

    return res.status(201).json({
      message: "Product photo uploaded successfully.",
      fileName,
      imageUrl: `/uploads/product-photos/${fileName}`
    });
  } catch (err) {
    console.error("uploadProductPhoto error:", err);
    return res.status(500).json({ error: "Failed to upload product photo." });
  }
};

// Get all products for the Inventory page
exports.getProductItems = async (req, res) => {
  const { search = "", category = "all" } = req.query;

  try {
    const photoColumn = await resolveProductPhotoColumn();
    const photoSelect = photoColumn ? `p.${photoColumn} AS photo,` : "NULL AS photo,";
    const photoGroupBy = photoColumn ? `, p.${photoColumn}` : "";

    const params = [];
    const filters = [];

    if (search.trim()) {
      filters.push("(p.name LIKE ? OR p.barcode LIKE ? OR p.volume LIKE ?)");
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
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
         p.volume,
         p.barcode,
         p.product_type AS category,
         p.selling_price AS price,
         ${photoSelect}
         COUNT(pb.batch_id) AS total_batches,
         SUM(CASE WHEN pb.status != 'Discontinued' THEN 1 ELSE 0 END) AS active_batches,
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
       GROUP BY p.product_id, p.name, p.volume, p.barcode, p.product_type, p.selling_price${photoGroupBy}
       HAVING total_batches = 0 OR active_batches > 0
       ORDER BY p.name ASC, p.volume ASC`,
      params
    );

    const items = rows.map((row) => {
      const stock = Number(row.stock) || 0;
      return {
        id: row.product_id,
        name: row.name,
        volume: row.volume || null,
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
  const { name, volume, category, price, stock, barcode, photo } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: "Name and category are required" });
  }

  try {
    const photoColumn = await resolveProductPhotoColumn();
    const normalizedPhotoPath = photo || null;
    const volumeVal = volume?.trim() || null;

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

    let result;
    if (photoColumn) {
      [result] = await db.query(
        `INSERT INTO products (name, volume, product_type, selling_price, barcode, ${photoColumn})
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name.trim(), volumeVal, category, parseFloat(price) || null, barcode?.trim() || null, normalizedPhotoPath]
      );
    } else {
      [result] = await db.query(
        `INSERT INTO products (name, volume, product_type, selling_price, barcode)
         VALUES (?, ?, ?, ?, ?)`,
        [name.trim(), volumeVal, category, parseFloat(price) || null, barcode?.trim() || null]
      );
    }

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
  const { name, volume, category, price, barcode, photo } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: "Name and category are required" });
  }

  try {
    const photoColumn = await resolveProductPhotoColumn();
    const normalizedPhotoPath = photo || null;
    const volumeVal = volume?.trim() || null;

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

    if (photoColumn) {
      await db.query(
        `UPDATE products
         SET name = ?, volume = ?, product_type = ?, selling_price = ?, barcode = ?, ${photoColumn} = ?
         WHERE product_id = ?`,
        [name.trim(), volumeVal, category, parseFloat(price) || null, barcode?.trim() || null, normalizedPhotoPath, product_id]
      );
    } else {
      await db.query(
        `UPDATE products
         SET name = ?, volume = ?, product_type = ?, selling_price = ?, barcode = ?
         WHERE product_id = ?`,
        [name.trim(), volumeVal, category, parseFloat(price) || null, barcode?.trim() || null, product_id]
      );
    }

    res.json({ success: true, message: `Product updated successfully` });
  } catch (err) {
    console.error("updateProduct error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Barcode already exists for another product" });
    }
    res.status(500).json({ error: "Failed to update product" });
  }
};

// Get all reported items
exports.getReportedItems = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT rp.report_id, rp.product_id,
              p.name AS product_name, p.volume AS product_volume,
              rp.reason, rp.quantity, rp.cost_loss, rp.reported_at, rp.notes,
              CONCAT(COALESCE(s.first_name,''), ' ', COALESCE(s.last_name,'')) AS reported_by_name
       FROM reported_products rp
       JOIN products p ON p.product_id = rp.product_id
       LEFT JOIN staff s ON s.staff_id = rp.reported_by
       ORDER BY rp.reported_at DESC`
    );
    res.json({ items: rows });
  } catch (err) {
    console.error("getReportedItems error:", err);
    res.status(500).json({ error: "Failed to load reported items." });
  }
};

// Add a reported item (logs the loss and deducts stock)
exports.addReportedItem = async (req, res) => {
  const { product_id, reason, quantity, cost_loss, notes } = req.body;
  const reported_by = req.session?.staff_id || null;

  if (!product_id || !reason || !quantity) {
    return res.status(400).json({ error: "Product, reason, and quantity are required." });
  }

  const qty = parseInt(quantity);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: "Quantity must be greater than 0." });
  }

  try {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Deduct from active batches (FIFO — earliest expiry first)
      const [batches] = await connection.query(
        `SELECT batch_id, stock_quantity FROM product_batches
         WHERE product_id = ? AND status != 'Discontinued' AND stock_quantity > 0
         ORDER BY expiry_date IS NULL ASC, expiry_date ASC, purchase_date ASC`,
        [product_id]
      );

      let remaining = qty;
      for (const batch of batches) {
        if (remaining <= 0) break;
        const deduct = Math.min(remaining, batch.stock_quantity);
        await connection.query(
          `UPDATE product_batches SET stock_quantity = stock_quantity - ? WHERE batch_id = ?`,
          [deduct, batch.batch_id]
        );
        remaining -= deduct;
      }

      // Record the report
      await connection.query(
        `INSERT INTO reported_products (product_id, reason, quantity, cost_loss, notes, reported_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [product_id, reason, qty, parseFloat(cost_loss) || null, notes?.trim() || null, reported_by]
      );

      await connection.commit();
      res.json({ success: true, message: "Report submitted and stock adjusted." });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("addReportedItem error:", err);
    res.status(500).json({ error: "Failed to submit report." });
  }
};

// Delete a reported item record
exports.deleteReportedItem = async (req, res) => {
  const { report_id } = req.params;
  try {
    const [result] = await db.query(
      "DELETE FROM reported_products WHERE report_id = ?",
      [report_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Report not found." });
    }
    res.json({ success: true, message: "Report deleted." });
  } catch (err) {
    console.error("deleteReportedItem error:", err);
    res.status(500).json({ error: "Failed to delete report." });
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
      // Soft delete/archive: mark batches as discontinued
      await db.query(
        "UPDATE product_batches SET status = 'Discontinued' WHERE product_id = ?",
        [product_id]
      );

      // Services may have no batches; create a discontinued marker batch so it is hidden from listings
      const [batchRows] = await db.query(
        "SELECT batch_id FROM product_batches WHERE product_id = ? LIMIT 1",
        [product_id]
      );

      if (batchRows.length === 0) {
        await db.query(
          `INSERT INTO product_batches (product_id, stock_quantity, status, purchase_date)
           VALUES (?, 0, 'Discontinued', NOW())`,
          [product_id]
        );
      }

      return res.json({ success: true, message: "Product archived (has transaction history)" });
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

// Get standalone service configuration used by POS service buttons
exports.getServiceConfig = async (req, res) => {
  try {
    const load = await ensureServiceProduct(SERVICE_CONFIG_DEFS.load);
    const cash = await ensureServiceProduct(SERVICE_CONFIG_DEFS.cash);

    res.json({ success: true, load, cash });
  } catch (err) {
    console.error("getServiceConfig error:", err);
    res.status(500).json({ error: "Failed to load service config." });
  }
};

// Update standalone service configuration
exports.updateServiceConfig = async (req, res) => {
  const { kind, price } = req.body;

  if (!kind || !Object.prototype.hasOwnProperty.call(SERVICE_CONFIG_DEFS, kind)) {
    return res.status(400).json({ error: "Invalid service kind." });
  }

  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ error: "Price must be a valid non-negative number." });
  }

  try {
    const service = await ensureServiceProduct(SERVICE_CONFIG_DEFS[kind]);

    await db.query(
      `UPDATE products
       SET selling_price = ?
       WHERE product_id = ?`,
      [numericPrice, service.id]
    );

    res.json({
      success: true,
      message: "Service configuration updated.",
      service: {
        id: service.id,
        name: service.name,
        price: numericPrice
      }
    });
  } catch (err) {
    console.error("updateServiceConfig error:", err);
    res.status(500).json({ error: "Failed to update service config." });
  }
};
