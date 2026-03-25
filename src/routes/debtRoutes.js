/**
 * DEBT TRACKER ROUTES
 * - All routes under /debts
 */

const express = require('express'); 
const path = require('path'); 
const router = express.Router();

const debtsController = require('../controllers/debtsController');
const { requireStaffSession } = require('../middleware/auth');

const viewsPath = path.join(__dirname, '../../views');

// Protect all debt routes - require staff login
router.use(requireStaffSession);

// Controller
router.get('/active', debtsController.getActiveDebts);
router.get('/paid', debtsController.getPaidDebts);
router.get('/:debt_id/details', debtsController.getDebtDetails);

router.post('/create-debt', debtsController.createDebt);

router.patch('/:debt_id/pay', debtsController.markPaid);
router.patch('/:customer_id/blacklist', debtsController.blacklistCustomer);
router.patch('/:customer_id/debt-limit', debtsController.updateDebtLimit);

// Route for /debts
router.get('/', (req, res) => {
    res.sendFile(path.join(viewsPath, 'debts.html'));
});

module.exports = router;