const express = require("express");
const path = require("path");
const router = express.Router();

const productsController = require("../controllers/productsController");

const viewsPath = path.join(__dirname, "../../views");

// Products inventory page
router.get("/", (req, res) => {
  res.sendFile(path.join(viewsPath, "products.html"));
});

// Get all products (with optional search/filter)
router.get("/items", productsController.getProductItems);

// Upload product photo file and return local URL
router.post("/api/upload-photo", productsController.uploadProductPhoto);

// Add new product
router.post("/api/add", productsController.addProduct);

// Update product
router.put("/api/:product_id", productsController.updateProduct);

// Delete product
router.delete("/api/:product_id", productsController.deleteProduct);

module.exports = router;
