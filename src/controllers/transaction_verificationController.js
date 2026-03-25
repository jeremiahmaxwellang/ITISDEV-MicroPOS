const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");
const mySqlPool = require("../config/database");

const viewsPath = path.join(__dirname, "../../views");
const uploadsDir = path.join(process.cwd(), "public", "uploads", "payment-proof");
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function imageUrlToFilePath(imageUrl) {
	const relativePath = String(imageUrl || "").replace(/^\/+/, "");
	return path.join(process.cwd(), "public", relativePath.replace(/^uploads\//, "uploads/"));
}

exports.getTransactionVerificationPage = (req, res) => {
	res.sendFile(path.join(viewsPath, "transaction_verification.html"));
};

exports.uploadPaymentProof = async (req, res) => {
	try {
		if (!req.files || !req.files.proofImage) {
			return res.status(400).json({ message: "Image file is required." });
		}

		const proofImage = req.files.proofImage;
		if (!allowedMimeTypes.has(proofImage.mimetype)) {
			return res.status(400).json({ message: "Only JPG, PNG, WEBP, and GIF images are allowed." });
		}

		const ext = path.extname(proofImage.name || "").toLowerCase() || (() => {
			switch (proofImage.mimetype) {
				case "image/png":
					return ".png";
				case "image/webp":
					return ".webp";
				case "image/gif":
					return ".gif";
				default:
					return ".jpg";
			}
		})();

		const fileName = `proof-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
		const filePath = path.join(uploadsDir, fileName);

		await fs.mkdir(uploadsDir, { recursive: true });
		await proofImage.mv(filePath);

		return res.status(201).json({
			message: "Payment proof uploaded successfully.",
			fileName,
			imageUrl: `/uploads/payment-proof/${fileName}`
		});
	} catch (err) {
		console.error("uploadPaymentProof error:", err);
		return res.status(500).json({ message: "Failed to upload payment proof." });
	}
};

exports.getPaymentProofs = async (req, res) => {
	try {
		const [rows] = await mySqlPool.query(
			`SELECT proof_id, transaction_id, customer_name, gcash_number, amount_paid, date_paid, proof_image_url, created_at
			 FROM payment_proofs
			 ORDER BY created_at DESC`,
			[]
		);

		return res.status(200).json(rows || []);
	} catch (err) {
		console.error("getPaymentProofs error:", err);
		return res.status(500).json({ message: "Failed to fetch payment proofs." });
	}
};

exports.createPaymentProof = async (req, res) => {
	const staffId = req.session.user.staff_id;
	const { transactionId, customerName, gcashNumber, amountPaid, datePaid, imageUrl } = req.body;

	if (!transactionId || !customerName || !gcashNumber || !amountPaid || !datePaid || !imageUrl) {
		return res.status(400).json({ message: "All fields are required." });
	}

	if (!Number.isInteger(Number(transactionId)) || Number(transactionId) <= 0) {
		return res.status(400).json({ message: "A valid transaction ID is required." });
	}

	if (!Number.isFinite(Number(amountPaid)) || Number(amountPaid) <= 0) {
		return res.status(400).json({ message: "Amount paid must be greater than zero." });
	}

	try {
		const [txRows] = await mySqlPool.query(
			"SELECT transaction_id FROM transactions WHERE transaction_id = ? LIMIT 1",
			[Number(transactionId)]
		);

		if (!txRows.length) {
			return res.status(400).json({ message: "Transaction ID does not exist." });
		}

		const [result] = await mySqlPool.query(
			`INSERT INTO payment_proofs
			 (staff_id, transaction_id, customer_name, gcash_number, amount_paid, date_paid, proof_image_url)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[staffId, Number(transactionId), customerName, gcashNumber, Number(amountPaid), datePaid, imageUrl]
		);

		return res.status(201).json({
			message: "Payment proof saved successfully.",
			proof_id: result.insertId
		});
	} catch (err) {
		console.error("createPaymentProof error:", err);
		return res.status(500).json({ message: "Failed to save payment proof." });
	}
};

exports.deletePaymentProof = async (req, res) => {
	const proofId = Number(req.params.proofId);

	if (!Number.isInteger(proofId) || proofId <= 0) {
		return res.status(400).json({ message: "A valid proof ID is required." });
	}

	try {
		const [rows] = await mySqlPool.query(
			"SELECT proof_image_url FROM payment_proofs WHERE proof_id = ?",
			[proofId]
		);

		if (!rows.length) {
			return res.status(404).json({ message: "Payment proof not found." });
		}

		const imageUrl = rows[0].proof_image_url;
		await mySqlPool.query(
			"DELETE FROM payment_proofs WHERE proof_id = ?",
			[proofId]
		);

		if (imageUrl) {
			try {
				await fs.unlink(imageUrlToFilePath(imageUrl));
			} catch (fileErr) {
				if (fileErr.code !== "ENOENT") {
					console.warn("Failed to delete proof image file:", fileErr);
				}
			}
		}

		return res.status(200).json({ message: "Payment proof deleted successfully." });
	} catch (err) {
		console.error("deletePaymentProof error:", err);
		return res.status(500).json({ message: "Failed to delete payment proof." });
	}
};

