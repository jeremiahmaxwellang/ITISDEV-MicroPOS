/*
    AUTHENTICATION ROUTES
    Assigned to: Justin

    Purpose:
    - Contain routes for login, signup, registration
*/

const express = require('express');
const path = require('path');
const mySqlPool = require('../config/database'); // your MySQL pool
const router = express.Router();

const viewsPath = path.join(__dirname, '../../views');

// Login page
router.get('/', (req, res) => {
    res.sendFile(path.join(viewsPath, 'login.html'));
});

// Reports page
router.get('/reports', (req, res) => {
    res.sendFile(path.join(viewsPath, 'reports.html'));
});

// --- POST /login ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check user in DB
        const [rows] = await mySqlPool.query(
            'SELECT * FROM users WHERE email = ? AND passwordHash = ?',
            [email, password]
        );

        if (rows.length > 0) {
            const user = rows[0];

            // Redirect based on role
            switch(user.position) {
                case 'Team Manager':
                    return res.json({ redirect: '/manager_dashboard.html', user: { firstname: user.firstname, lastname: user.lastname, email: user.email, position: user.position } });
                case 'Player':
                    return res.json({ redirect: '/player_dashboard.html', user: { firstname: user.firstname, lastname: user.lastname, email: user.email, position: user.position } });
                case 'Team Coach':
                    return res.json({ redirect: '/coach_dashboard.html', user: { firstname: user.firstname, lastname: user.lastname, email: user.email, position: user.position } });
                default:
                    return res.status(400).send('Role not recognized');
            }
        } else {
            return res.status(401).send('Invalid email or password');
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send('Database error');
    }
});

module.exports = router;
