const express = require('express');
const path = require('path');

const router = express.Router();

const settingsController = require('../controllers/settingsController');
const { requireStaffSession } = require('../middleware/auth');

const viewsPath = path.join(__dirname, '../../views');

router.use(requireStaffSession);

router.get('/', (req, res) => {
	res.sendFile(path.join(viewsPath, 'settings.html'));
});

router.post('/api/change-password', settingsController.changePassword);
router.get('/api/export-inserts', settingsController.exportInsertsSql);

module.exports = router;
