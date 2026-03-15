const express = require('express');
const path = require('path');
const db = require('../config/database');
const router = express.Router();

const viewsPath = path.join(__dirname, '../../views');

// Login page
router.get('/', (req, res) => {
    res.sendFile(path.join(viewsPath, 'login.html'));
});

// POST /login — authenticate against staff table
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const [rows] = await db.query(
            'SELECT staff_id, email, first_name, last_name, role FROM staff WHERE email = ? AND password = ?',
            [email, password]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = rows[0];
        return res.json({
            success: true,
            user: {
                id: user.staff_id,
                email: user.email,
                name: `${user.first_name} ${user.last_name}`,
                role: user.role
            },
            redirect: '/pos'
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
