const db = require("../config/database");

const MANUFACTURER_HINTS = [
  { matcher: /coca[-\s]?cola/i, name: "Coca-Cola Beverages" },
  { matcher: /piattos/i, name: "Jack 'n Jill" },
  { matcher: /pancit\s*canton|noodles|nescafe|bear\s*brand/i, name: "Nestle" },
  { matcher: /century\s*tuna/i, name: "Century Pacific" },
  { matcher: /alaska/i, name: "Alaska Milk" },
  { matcher: /skyflakes/i, name: "M.Y. San Corporation" },
  { matcher: /rice|cooking\s*oil/i, name: "Local Supplier" },
  { matcher: /softdrinks/i, name: "Beverage Supplier" },
  { matcher: /load|photocopy/i, name: "In-Store Service" }
];

function getManufacturer(productName, category) {
  const match = MANUFACTURER_HINTS.find((rule) => rule.matcher.test(productName));
  if (match) return match.name;

  if (category === "Services") return "In-Store Service";
  return "Generic Supplier";
}

exports.getProductItems = async (req, res) => {
  const { search = "", category = "all" } = req.query;

  try {
    const params = [];
    const filters = [];

    if (search.trim()) {
      filters.push("p.name LIKE ?");
      params.push(`%${search.trim()}%`);
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
         p.product_type AS category,
         p.selling_price AS price,
         COALESCE(
           SUM(
             CASE
               WHEN pb.status = 'Discontinued' THEN 0
               ELSE COALESCE(pb.stock_quantity, 0)
             END
           ),
           0
         ) AS stock
       FROM products p
       LEFT JOIN product_batches pb ON pb.product_id = p.product_id
       ${whereClause}
       GROUP BY p.product_id, p.name, p.product_type, p.selling_price
       ORDER BY p.name ASC`,
      params
    );

    const items = rows.map((row) => {
      const stock = Number(row.stock) || 0;
      return {
        id: row.product_id,
        name: row.name,
        manufacturer: getManufacturer(row.name, row.category),
        category: row.category,
        price: Number(row.price) || 0,
        stock,
        lowStock: stock > 0 && stock <= 5
      };
    });

    res.json({ items });
  } catch (err) {
    console.error("productsController error:", err);
    res.status(500).json({ error: "Failed to load products." });
  }
};
