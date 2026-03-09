/**
 * DEBT TRACKER ROUTES
 * - All routes under /debts
 */

const express = require('express'); 
const path = require('path'); 
const router = express.Router();

const debtsController = require('../controllers/debtsController');

// Controller
router.get('/get-all', debtsController.getAllDebts);

// Route for /debts
router.get('/', (req, res) => {
    res.sendFile(path.join(viewsPath, 'debt-tracker.html'));
});

module.exports = router;