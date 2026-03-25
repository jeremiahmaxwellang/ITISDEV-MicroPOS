/**
 * REPORTS API ROUTES
 * Mounted at /reports (API endpoints only; the HTML page is served by authRoutes)
 */

const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reportsController");
const { requireStoreOwnerSession } = require("../middleware/auth");

router.use(requireStoreOwnerSession);

// GET /reports/metrics?period=7|30|90
router.get("/metrics", reportsController.getReportMetrics);

module.exports = router;
