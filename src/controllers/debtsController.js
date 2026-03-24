const db = require("../config/database");

// Fetch active debts
exports.getActiveDebts = async (req, res) => {
    try {
        const sql = `
            SELECT *
            FROM debts d
            JOIN customers c ON c.customer_id = d.customer_id
            WHERE d.status != 'Paid'
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
            SELECT *
            FROM debts d
            JOIN customers c ON c.customer_id = d.customer_id
            WHERE d.status = 'Paid'
            ORDER BY d.debt_due, status
        `;
        const [results] = await db.query(sql);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create new debt
exports.createDebt = async (req, res) => {
    const { first_name, last_name, phone_number, debt_amount, debt_due } = req.body;

    if (!first_name || !last_name || !debt_amount || !debt_due) {
        return res.status(400).json({ error: "Name and category are required" });
    }

    try {
        // Create enw customer if not exists
        const createCustomer = `
        INSERT INTO customers (first_name, last_name, phone_number, debt_limit, is_blacklisted) VALUES
        (?, ?, ?, 1000.00, 'F')
        `;

        const [insertResult] = await db.query(createCustomer, [first_name, last_name, phone_number]);
        const customer_id = insertResult.insertId;
        if (!customer_id) return res.status(404).json({ error: "Customer not found" });

        // Insert Debt

        const createDebt = `
        INSERT INTO debts (customer_id, debt_amount, status, debt_due) VALUES
        (?, ?, 'Unpaid', ?)
        `;

        await db.query(createDebt, [customer_id, debt_amount, debt_due]);

        res.json({ success: true, message: "Debt added successfully" });

    } catch (err) {
        console.error("error:", err);
        res.status(500).json({ error: "Failed to add debt", detail: err.message });
    }
};
