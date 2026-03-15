/**
 * POS Routes
 * Handles barcode scanning, cart management, and transaction processing
 */

const express = require("express");
const path = require("path");
const router = express.Router();

const posController = require("../controllers/posController");

// View path
const viewsPath = path.join(__dirname, "../../views");

// Main POS interface
router.get("/", (req, res) => {
  res.sendFile(path.join(viewsPath, "pos.html"));
});

// Checkout page
router.get("/checkout", (req, res) => {
  res.sendFile(path.join(viewsPath, "checkout.html"));
});

// API ENDPOINTS

// Scan a barcode and get product info
router.post("/api/scan", posController.scanBarcode);

// Get products for manual search/selection
router.get("/api/products", posController.getProductsForPOS);

// Process a complete transaction
router.post("/api/checkout", posController.processTransaction);

// Get transaction history
router.get("/api/transactions", posController.getTransactionHistory);

// Get specific transaction details
router.get("/api/transactions/:transaction_id", posController.getTransactionDetails);

module.exports = router;
