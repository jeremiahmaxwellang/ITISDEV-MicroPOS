const db = require("../config/database");

const VALID_PERIODS = [7, 30, 90];

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
                    SUM(o.quantity) AS units,
                    SUM(o.price_each * o.quantity) AS revenue
             FROM transaction_orders o
             JOIN products p ON p.product_id = o.product_id
             JOIN transactions t ON t.transaction_id = o.transaction_id
             WHERE t.date_ordered >= DATE_SUB(NOW(), INTERVAL ? DAY)
             GROUP BY p.product_id, p.name
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
                meta: `${Number(topProducts[0].units).toLocaleString()} units sold`
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
