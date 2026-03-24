const express = require("express");

const router = express.Router();
const transactionVerificationController = require("../controllers/transaction_verificationController");
const { requireStaffSession } = require("../middleware/auth");

router.use(requireStaffSession);
router.get("/", transactionVerificationController.getTransactionVerificationPage);
router.post("/api/upload-proof", transactionVerificationController.uploadPaymentProof);
router.get("/api/proofs", transactionVerificationController.getPaymentProofs);
router.post("/api/proofs", transactionVerificationController.createPaymentProof);
router.delete("/api/proofs/:proofId", transactionVerificationController.deletePaymentProof);

module.exports = router;

