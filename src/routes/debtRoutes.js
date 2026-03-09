/**
 * DEBT TRACKER ROUTES
 * - description
 */

const express = require('express'); 
const path = require('path'); 
const router = express.Router();

// Controller
// Controller call here

router.get('/', (req, res) => {
    res.sendFile(path.join(viewsPath, 'debt-tracker.html'));
});

module.exports = router;