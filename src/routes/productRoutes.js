const express = require("express");
const path = require("path");
const router = express.Router();

const productsController = require("../controllers/productsController");

router.get("/", (req, res) => {
  res.sendFile(path.join(viewsPath, "products.html"));
});

router.get("/items", productsController.getProductItems);

module.exports = router;
