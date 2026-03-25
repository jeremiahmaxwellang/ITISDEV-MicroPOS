const db = require("../config/database");
const { sendSMS } = require('../utils/sms');

// IPROG SMS DEBT REMINDER
exports.sendDebtReminder = async (req, res) => {
    const { debt_id } = req.params;

    try {
        const [debts] = await db.query(`
            SELECT
                d.debt_id,
                d.debt_amount,
                d.debt_due,
                c.first_name,
                c.last_name,
                c.phone_number,
                c.debt_limit
            FROM debts d
            JOIN customers c ON c.customer_id = d.customer_id
            WHERE d.debt_id = ?
        `, [debt_id]);

        if (debts.length === 0) {
            return res.status(404).json({ error: 'Debt not found' });
        }

        const debt = debts[0];

        if (!debt.phone_number) {
            return res.status(400).json({ error: 'Customer has no phone number on record' });
        }

        const message = `Hi ${debt.first_name}! May utang ka pong ₱${parseFloat(debt.debt_amount).toFixed(2)} na dapat bayaran sa ${new Date(debt.debt_due).toLocaleDateString('en-PH')}. Pakibayad na po sa Juan Sari Sari Store. Salamat!`;
        await sendSMS(debt.phone_number, message);

        res.json({ success: true, message: 'Debt reminder sent successfully' });

    } catch (err) {
        console.error('sendDebtReminder error:', err);
        res.status(500).json({ error: err.message });
    }
};

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
    const { customer_id, first_name, last_name, phone_number, debt_amount, debt_due } = req.body;

    if (!debt_amount || !debt_due) {
        return res.status(400).json({ error: 'debt_amount and debt_due are required' });
    }

    try {
        let finalCustomerId = customer_id;

        if (!finalCustomerId) {
            if (!first_name || !last_name) {
                return res.status(400).json({ error: 'first_name and last_name are required for new customers' });
            }

            const [insertResult] = await db.query(`
                INSERT INTO customers (first_name, last_name, phone_number, debt_limit, is_blacklisted)
                VALUES (?, ?, ?, 1000.00, 'F')
            `, [first_name, last_name, phone_number]);

            finalCustomerId = insertResult.insertId;

        } else {
            // ✅ Check existing customer's debt limit
            const [customers] = await db.query(`
                SELECT c.debt_limit, COALESCE(SUM(d.debt_amount), 0) AS total_active_debt
                FROM customers c
                LEFT JOIN debts d ON d.customer_id = c.customer_id AND d.status != 'Paid'
                WHERE c.customer_id = ?
                GROUP BY c.customer_id
            `, [finalCustomerId]);

            if (customers.length === 0) {
                return res.status(404).json({ error: 'Customer not found' });
            }

            const { debt_limit, total_active_debt } = customers[0];
            const newTotal = parseFloat(total_active_debt) + parseFloat(debt_amount);

            if (debt_limit !== null && newTotal > parseFloat(debt_limit)) {
                return res.status(400).json({
                    error: `Debt limit exceeded. Current debt: ₱${parseFloat(total_active_debt).toFixed(2)}, Limit: ₱${parseFloat(debt_limit).toFixed(2)}, Attempted: ₱${parseFloat(debt_amount).toFixed(2)}`,
                    debt_limit: debt_limit,
                    total_active_debt: total_active_debt,
                    over_by: (newTotal - parseFloat(debt_limit)).toFixed(2)
                });
            }
        }

        await db.query(`
            INSERT INTO debts (customer_id, debt_amount, status, debt_due)
            VALUES (?, ?, 'Unpaid', ?)
        `, [finalCustomerId, debt_amount, debt_due]);

        res.json({ success: true, message: 'Debt added successfully' });

    } catch (err) {
        console.error('createDebt error:', err);
        res.status(500).json({ error: 'Failed to add debt', detail: err.message });
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

exports.blacklistCustomer = async (req, res) => {
    const { customer_id } = req.params;

    try {
        const [customer] = await db.query(
            `SELECT * FROM customers WHERE customer_id = ?`,
            [customer_id]
        );

        if (customer.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Toggle blacklist on/off
        const current = customer[0].is_blacklisted;
        const newValue = current === 'T' ? 'F' : 'T';

        await db.query(
            `UPDATE customers SET is_blacklisted = ? WHERE customer_id = ?`,
            [newValue, customer_id]
        );

        res.json({
            success: true,
            is_blacklisted: newValue,
            message: newValue === 'T' ? 'Customer blacklisted' : 'Customer removed from blacklist'
        });

    } catch (err) {
        console.error('blacklistCustomer error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateDebtLimit = async (req, res) => {
    const { customer_id } = req.params;
    const { debt_limit } = req.body;

    if (debt_limit === undefined || isNaN(debt_limit) || debt_limit < 0) {
        return res.status(400).json({ error: 'Invalid debt limit value' });
    }

    try {
        const [customer] = await db.query(
            `SELECT customer_id FROM customers WHERE customer_id = ?`,
            [customer_id]
        );
        if (customer.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        await db.query(
            `UPDATE customers SET debt_limit = ? WHERE customer_id = ?`,
            [debt_limit, customer_id]
        );

        res.json({ success: true, message: 'Debt limit updated', debt_limit });

    } catch (err) {
        console.error('updateDebtLimit error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Search Customers
exports.searchCustomers = async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
        return res.json([]);
    }

    try {
        const [results] = await db.query(`
            SELECT customer_id, first_name, last_name, phone_number, debt_limit
            FROM customers
            WHERE first_name LIKE ? OR last_name LIKE ? OR phone_number LIKE ?
            LIMIT 8
        `, [`%${q}%`, `%${q}%`, `%${q}%`]);

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};