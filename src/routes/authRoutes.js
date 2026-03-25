/*
    AUTHENTICATION ROUTES
    Assigned to: Justin

    Purpose:
    - Contain routes for login, signup, registration
*/

const express = require('express');
const path = require('path');
const mySqlPool = require('../config/database'); // your MySQL pool
const { getSessionUser, requireStoreOwnerSession } = require('../middleware/auth');
const { hashPassword, verifyPassword } = require('../utils/passwords');
const router = express.Router();

const viewsPath = path.join(__dirname, '../../views');

// Login page
router.get('/', (req, res) => {
    res.sendFile(path.join(viewsPath, 'login.html'));
});

// Signup page
router.get('/signup', (req, res) => {
    res.sendFile(path.join(viewsPath, 'signup.html'));
});

// Reports page
router.get('/reports', requireStoreOwnerSession, (req, res) => {
    res.sendFile(path.join(viewsPath, 'reports.html'));
});

function createUserPayload(user) {
    return {
        staff_id: user.staff_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        phone_number: user.phone_number
    };
}

function persistSession(req, user) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((regenerateErr) => {
            if (regenerateErr) {
                return reject(regenerateErr);
            }

            req.session.user = user;
            req.session.save((saveErr) => {
                if (saveErr) {
                    return reject(saveErr);
                }

                return resolve();
            });
        });
    });
}

function destroySession(req) {
    return new Promise((resolve, reject) => {
        req.session.destroy((destroyErr) => {
            if (destroyErr) {
                return reject(destroyErr);
            }

            return resolve();
        });
    });
}

router.get('/session', (req, res) => {
    const user = getSessionUser(req);

    if (!user) {
        return res.status(401).json({ message: 'Authentication required.' });
    }

    return res.json({ authenticated: true, user });
});

router.post('/logout', async (req, res) => {
    try {
        await destroySession(req);
        res.clearCookie('micropos.sid');
        return res.json({ message: 'Logged out successfully.' });
    } catch (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed.' });
    }
});

router.get('/logout', async (req, res) => {
    try {
        if (req.session) {
            await destroySession(req);
        }
        res.clearCookie('micropos.sid');
        return res.redirect('/');
    } catch (err) {
        console.error('Logout redirect error:', err);
        return res.redirect('/');
    }
});

// --- POST /signup ---
router.post('/signup', async (req, res) => {
    const { email, password, first_name, last_name, role, phone_number } = req.body;

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const safeRole = role === 'Store Owner' ? 'Store Owner' : 'Employee';

    if (!normalizedEmail || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (String(password).length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    try {
        const [existing] = await mySqlPool.query(
            'SELECT staff_id FROM staff WHERE email = ? LIMIT 1',
            [normalizedEmail]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: 'Email is already registered.' });
        }

        const hashedPassword = hashPassword(password);

        const [result] = await mySqlPool.query(
            `INSERT INTO staff (email, password, first_name, last_name, role, phone_number)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                normalizedEmail,
                hashedPassword,
                first_name ? String(first_name).trim() : null,
                last_name ? String(last_name).trim() : null,
                safeRole,
                phone_number ? String(phone_number).trim() : null
            ]
        );

        const user = createUserPayload({
            staff_id: result.insertId,
            email: normalizedEmail,
            first_name: first_name ? String(first_name).trim() : null,
            last_name: last_name ? String(last_name).trim() : null,
            role: safeRole,
            phone_number: phone_number ? String(phone_number).trim() : null
        });

        await persistSession(req, user);

        return res.status(201).json({
            message: 'Account created successfully.',
            redirect: '/pos',
            user
        });
    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({ message: 'Database error during signup.' });
    }
});

// --- POST /login ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Check staff account in DB
        const [rows] = await mySqlPool.query(
            `SELECT staff_id, email, password, first_name, last_name, role, phone_number
             FROM staff
             WHERE email = ?
             LIMIT 1`,
            [normalizedEmail]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = rows[0];
        const passwordMatch = verifyPassword(String(password), user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const sessionUser = createUserPayload(user);
        await persistSession(req, sessionUser);

        return res.json({
            redirect: '/pos',
            user: sessionUser
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Database error during login.' });
    }
});

module.exports = router;
