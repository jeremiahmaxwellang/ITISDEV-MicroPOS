const db = require("../config/database");

// Fetch active debts
exports.getActiveDebts = async (req, res) => {
    try {
        const sql = `
            SELECT
            c.first_name,
            c.last_name,
            c.facebook_profile,
            d.debt_amount,
            d.status,
            d.debt_due
            FROM debts d
            JOIN customers c ON c.customer_id = d.customer_id
            WHERE d.status = 'Paid'
            ORDER BY d.debt_due
        `;
        const [results] = await db.query(sql);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Fetch paid debts
exports.getPaidDebts = async (req, res) => {
    try {
        const sql = `
            SELECT
            c.first_name,
            c.last_name,
            c.facebook_profile,
            d.debt_amount,
            d.status,
            d.debt_due
            FROM debts d
            JOIN customers c ON c.customer_id = d.customer_id
            WHERE d.status != 'Paid'
            ORDER BY d.debt_due, status
        `;
        const [results] = await db.query(sql);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
