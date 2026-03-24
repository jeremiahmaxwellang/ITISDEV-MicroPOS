/**
 * DEBT TRACKER ROUTES
 * - All routes under /debts
 */

const express = require('express'); 
const path = require('path'); 
const router = express.Router();

const debtsController = require('../controllers/debtsController');

const viewsPath = path.join(__dirname, '../../views');

// Controller
router.get('/active', debtsController.getActiveDebts);
router.get('/paid', debtsController.getPaidDebts);
router.post('/create-debt', debtsController.createDebt);
router.patch('/:debt_id/pay', debtsController.markPaid);

// Route for /debts
router.get('/', (req, res) => {
    res.sendFile(path.join(viewsPath, 'debts.html'));
});

module.exports = router;