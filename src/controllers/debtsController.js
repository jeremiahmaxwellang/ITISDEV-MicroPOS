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
	        SELECT d.*, c.*, p.created_at AS date_paid
            FROM debts d
            JOIN customers c ON c.customer_id = d.customer_id
            JOIN payments p ON d.debt_id = p.debt_id
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

// Mark customer as paid
exports.markPaid = async (req, res) => {
    const { debt_id } = req.params;
    const { amount_paid, payment_method, proof_of_payment, notes } = req.body;
    const staff_id = req.user?.staff_id || 1; // todo: get logged-in staff

    try {
        // 1. Check debt exists
        const [debts] = await db.query(`SELECT * FROM debts WHERE debt_id = ?`, [debt_id]);
        if (debts.length === 0) {
            return res.status(404).json({ error: 'Debt not found' });
        }

        // 2. Mark debt as paid
        await db.query(`
            UPDATE debts
            SET status = 'Paid'
            WHERE debt_id = ?
        `, [debt_id]);

        // 3. Insert payment record
        await db.query(`
            INSERT INTO payments (debt_id, staff_id, amount_paid, payment_method, proof_of_payment, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [debt_id, staff_id, amount_paid, payment_method, proof_of_payment || null, notes || null]);

        res.json({ success: true, message: 'Debt marked as paid' });

    } catch (err) {
        console.error('markPaid error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getDebtDetails = async (req, res) => {
    const { debt_id } = req.params;

    try {
        // 1. Get debt + customer info
        const [debts] = await db.query(`
            SELECT *
            FROM debts d
            JOIN customers c ON c.customer_id = d.customer_id
            WHERE d.debt_id = ?
        `, [debt_id]);

        if (debts.length === 0) {
            return res.status(404).json({ error: 'Debt not found' });
        }

        const debt = debts[0];

        // 2. Get transaction items — through debt_transactions junction table
        const [items] = await db.query(`
            SELECT
                p.name,
                p.product_type,
                to_.price_each,
                to_.quantity,
                (to_.price_each * to_.quantity) AS subtotal
            FROM debt_transactions dt
            JOIN transactions t        ON t.transaction_id  = dt.transaction_id
            JOIN transaction_orders to_ ON to_.transaction_id = t.transaction_id
            JOIN products p            ON p.product_id      = to_.product_id
            WHERE dt.debt_id = ?
        `, [debt_id]);

        // 3. Get payment history for this debt
        const [payments] = await db.query(`
            SELECT 
                pay.payment_id,
                pay.amount_paid,
                pay.payment_method,
                pay.proof_of_payment,
                pay.notes,
                pay.created_at,
                s.first_name AS staff_first_name,
                s.last_name  AS staff_last_name
            FROM payments pay
            LEFT JOIN staff s ON s.staff_id = pay.staff_id
            WHERE pay.debt_id = ?
            ORDER BY pay.created_at DESC
        `, [debt_id]);

        res.json({
            ...debt,
            items,
            payments
        });

    } catch (err) {
        console.error('getDebtDetails error:', err);
        res.status(500).json({ error: err.message });
    }
};