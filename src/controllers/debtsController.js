const db = require("../config/database");

// Fetch active (unpaid/overdue) debts
exports.getActiveDebts = async (req, res) => {
    try {
        const sql = `
            SELECT
                d.debt_id,
                c.first_name,
                c.last_name,
                c.facebook_profile,
                c.phone_number,
                d.debt_amount,
                d.status,
                d.debt_started,
                d.debt_due
            FROM debts d
            JOIN customers c ON c.customer_id = d.customer_id
            WHERE d.status IN ('Unpaid', 'Overdue')
            ORDER BY d.debt_due ASC
        `;
        const [results] = await db.query(sql);
        res.json(results);
    } catch (err) {
        console.error("getActiveDebts error:", err);
        res.status(500).json({ error: err.message });
    }
};

// Fetch paid debts
exports.getPaidDebts = async (req, res) => {
    try {
        const sql = `
            SELECT
                d.debt_id,
                c.first_name,
                c.last_name,
                c.facebook_profile,
                c.phone_number,
                d.debt_amount,
                d.status,
                d.debt_started,
                d.debt_due
            FROM debts d
            JOIN customers c ON c.customer_id = d.customer_id
            WHERE d.status = 'Paid'
            ORDER BY d.debt_due DESC
        `;
        const [results] = await db.query(sql);
        res.json(results);
    } catch (err) {
        console.error("getPaidDebts error:", err);
        res.status(500).json({ error: err.message });
    }
};
