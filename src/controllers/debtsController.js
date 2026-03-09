const db = require("../config/database");

// Fetch all debts
exports.getAllDebts = async (req, res) => {
    try {
        const sql = `
            SELECT
            c.first_name,
            c.last_name,
            c.phone_number,
            c.debt_balance,
            d.debt_due,
            d.status,
            c.is_blacklisted
            FROM debts d
            JOIN customers c ON c.customer_id = d.customer_id
            ORDER BY d.debt_due
        `;
        const [results] = await db.query(sql);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};