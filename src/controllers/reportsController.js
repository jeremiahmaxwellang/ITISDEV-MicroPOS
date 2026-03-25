const db = require("../config/database");

const VALID_PERIODS = [7, 30, 90];

const CATEGORY_IMAGE_MAP = {
    beverages: "/images/beverages.png",
    "canned goods": "/images/canned-food.png",
    "instant foods": "/images/noodles.png",
    snacks: "/images/snack.png",
    services: "/images/services.png"
};

function getCategoryImage(category) {
    if (!category) return null;
    const normalized = String(category).trim().toLowerCase();
    return CATEGORY_IMAGE_MAP[normalized] || null;
}

exports.getReportMetrics = async (req, res) => {
    const period = parseInt(req.query.period, 10);

    if (!VALID_PERIODS.includes(period)) {
        return res.status(400).json({ error: "Invalid period. Use 7, 30, or 90." });
    }

    try {
        const [[salesRow]] = await db.query(
            `SELECT COALESCE(SUM(total_price), 0) AS sales
             FROM transactions
             WHERE date_ordered >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [period]
        );

        const [[debtRow]] = await db.query(
            `SELECT COALESCE(SUM(debt_amount), 0) AS debt,
                    COUNT(DISTINCT customer_id) AS debtors
             FROM debts
             WHERE status != 'Paid'`
        );

        const [[customersRow]] = await db.query(
            `SELECT COUNT(DISTINCT customer_id) AS customers
             FROM transactions
             WHERE date_ordered >= DATE_SUB(NOW(), INTERVAL ? DAY)
               AND customer_id IS NOT NULL`,
            [period]
        );

        const [topProducts] = await db.query(
            `SELECT p.name,
                    p.product_type AS category,
                    SUM(o.quantity) AS units,
                    SUM(o.price_each * o.quantity) AS revenue
             FROM transaction_orders o
             JOIN products p ON p.product_id = o.product_id
             JOIN transactions t ON t.transaction_id = o.transaction_id
             WHERE t.date_ordered >= DATE_SUB(NOW(), INTERVAL ? DAY)
             GROUP BY p.product_id, p.name, p.product_type
             ORDER BY revenue DESC
             LIMIT 10`,
            [period]
        );

        const [categories] = await db.query(
            `SELECT p.product_type AS name,
                    SUM(o.quantity) AS units,
                    SUM(o.price_each * o.quantity) AS revenue
             FROM transaction_orders o
             JOIN products p ON p.product_id = o.product_id
             JOIN transactions t ON t.transaction_id = o.transaction_id
             WHERE t.date_ordered >= DATE_SUB(NOW(), INTERVAL ? DAY)
             GROUP BY p.product_type
             ORDER BY revenue DESC`,
            [period]
        );

        const highlight = topProducts.length > 0
            ? {
                name: topProducts[0].name,
                art: topProducts[0].name
                    .split(" ")
                    .map(w => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase(),
                meta: `${Number(topProducts[0].units).toLocaleString()} units sold`,
                category: topProducts[0].category,
                categoryImage: getCategoryImage(topProducts[0].category)
            }
            : null;

        res.json({
            metrics: {
                sales: parseFloat(salesRow.sales),
                debt: parseFloat(debtRow.debt),
                debtors: debtRow.debtors,
                customers: customersRow.customers
            },
            topProducts: topProducts.map(p => ({
                name: p.name,
                category: p.category || "",
                units: p.units,
                revenue: parseFloat(p.revenue),
                profit: 0
            })),
            highlight,
            categories: categories.map(c => ({
                name: c.name,
                units: c.units,
                revenue: parseFloat(c.revenue),
                profit: 0
            }))
        });
    } catch (err) {
        console.error("reportsController error:", err);
        res.status(500).json({ error: "Database error" });
    }
};

exports.getDemandForecast = async (req, res) => {
    const period = parseInt(req.query.period, 10);
    const horizonDays = parseInt(req.query.horizonDays, 10) || 7;

    if (!VALID_PERIODS.includes(period)) {
        return res.status(400).json({ error: "Invalid period. Use 7, 30, or 90." });
    }

    if (!Number.isInteger(horizonDays) || horizonDays <= 0 || horizonDays > 30) {
        return res.status(400).json({ error: "Invalid horizonDays. Use 1 to 30." });
    }

    try {
        const [salesRows] = await db.query(
            `SELECT p.product_id,
                    p.name,
                    p.product_type,
                    COALESCE(SUM(o.quantity), 0) AS units_sold
             FROM products p
             LEFT JOIN transaction_orders o ON o.product_id = p.product_id
             LEFT JOIN transactions t ON t.transaction_id = o.transaction_id
               AND t.date_ordered >= DATE_SUB(NOW(), INTERVAL ? DAY)
             WHERE p.product_type != 'Services'
             GROUP BY p.product_id, p.name, p.product_type`,
            [period]
        );

        const [stockRows] = await db.query(
            `SELECT p.product_id,
                    COALESCE(SUM(
                        CASE
                          WHEN pb.status != 'Discontinued' THEN COALESCE(pb.stock_quantity, 0)
                          ELSE 0
                        END
                    ), 0) AS stock
             FROM products p
             LEFT JOIN product_batches pb ON pb.product_id = p.product_id
             WHERE p.product_type != 'Services'
             GROUP BY p.product_id`
        );

        const stockMap = {};
        for (const row of stockRows) {
            stockMap[row.product_id] = Number(row.stock) || 0;
        }

        const forecast = salesRows
            .map((row) => {
                const unitsSold = Number(row.units_sold) || 0;
                const avgDailyUnits = unitsSold / period;
                const forecastUnits = Math.ceil(avgDailyUnits * horizonDays);
                const currentStock = Number(stockMap[row.product_id] || 0);
                const projectedBalance = currentStock - forecastUnits;

                return {
                    product_id: row.product_id,
                    name: row.name,
                    category: row.product_type,
                    periodDays: period,
                    horizonDays,
                    unitsSold,
                    avgDailyUnits: Number(avgDailyUnits.toFixed(2)),
                    forecastUnits,
                    currentStock,
                    projectedBalance,
                    stockoutRisk: projectedBalance < 0
                };
            })
            .sort((a, b) => {
                if (a.stockoutRisk && !b.stockoutRisk) return -1;
                if (!a.stockoutRisk && b.stockoutRisk) return 1;
                return b.forecastUnits - a.forecastUnits;
            })
            .slice(0, 20);

        return res.json({
            period,
            horizonDays,
            generatedAt: new Date().toISOString(),
            forecast
        });
    } catch (err) {
        console.error("getDemandForecast error:", err);
        return res.status(500).json({ error: "Failed to generate demand forecast." });
    }
};
