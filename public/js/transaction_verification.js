(function () {
	"use strict";

	const modal = document.getElementById("addModal");
	const detailPopup = document.getElementById("detailPopup");
	const detailCard = document.getElementById("detailCardContent");
	const openModalBtn = document.getElementById("openModalBtn");
	const closeModalBtn = document.getElementById("closeModalBtn");
	const cancelAddBtn = document.getElementById("cancelAddBtn");
	const confirmAddBtn = document.getElementById("confirmAddBtn");
	const paymentsList = document.getElementById("paymentsList");
	const previewContainer = document.getElementById("imagePreviewContainer");

	const custNameInput = document.getElementById("custName");
	const gcashNumInput = document.getElementById("gcashNum");
	const amountInput = document.getElementById("amountPaid");
	const dateInput = document.getElementById("datePaid");
	const imageFileInput = document.getElementById("proofImage");

	let payments = [];
	let currentSelectedFile = null;
	let currentPreviewURL = null;
	let toastTimer = null;
	let currentUser = null;

	function getCurrentUser() {
		return currentUser;
	}

	async function loadCurrentUser() {
		const response = await fetch("/session");
		const payload = await response.json().catch(() => ({ message: "Invalid session response." }));

		if (!response.ok) {
			window.location.href = "/";
			throw new Error(payload.message || "Authentication required.");
		}

		currentUser = payload.user || null;
		if (currentUser) {
			localStorage.setItem("user", JSON.stringify(currentUser));
		}
	}

	function initHeaderUser() {
		const nameEl = document.getElementById("headerUserName");
		const roleEl = document.getElementById("headerUserRole");
		const avatarEl = document.getElementById("headerUserAvatar");

		if (!nameEl || !roleEl || !avatarEl) return;

		try {
			const user = getCurrentUser();
			if (!user) return;

			const firstName = (user.first_name || "").trim();
			const lastName = (user.last_name || "").trim();
			const fullName = `${firstName} ${lastName}`.trim() || user.email || "Staff User";

			nameEl.textContent = fullName;
			roleEl.textContent = user.role || "Employee";

			const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.trim();
			avatarEl.textContent = initials || fullName.slice(0, 2).toUpperCase();
		} catch (err) {
			console.error("Failed to load user details:", err);
		}
	}

	function escapeHtml(value) {
		return String(value || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function formatCurrency(amount) {
		const parsed = Number(amount || 0);
		return `PHP ${parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	function formatPaymentDate(value) {
		if (!value) {
			return "No date";
		}

		const rawValue = String(value).trim();
		const isoDateMatch = rawValue.match(/^(\d{4}-\d{2}-\d{2})/);

		if (isoDateMatch) {
			return isoDateMatch[1];
		}

		const parsedDate = new Date(rawValue);
		if (Number.isNaN(parsedDate.getTime())) {
			return rawValue;
		}

		return parsedDate.toLocaleDateString(undefined, {
			year: "numeric",
			month: "short",
			day: "2-digit"
		});
	}

	function showToast(message) {
		let toast = document.getElementById("tvToast");
		if (!toast) {
			toast = document.createElement("div");
			toast.id = "tvToast";
			toast.className = "toast";
			document.body.appendChild(toast);
		}

		toast.textContent = message;
		toast.classList.add("show");

		if (toastTimer) {
			clearTimeout(toastTimer);
		}

		toastTimer = setTimeout(() => {
			toast.classList.remove("show");
		}, 2000);
	}

	async function loadPayments() {
		try {
			const response = await fetch("/transaction-verification/api/proofs");

			if (!response.ok) {
				const payload = await response.json().catch(() => ({ message: response.statusText }));
				throw new Error(payload.message || "Failed to load payment proofs.");
			}

			const data = await response.json();
			payments = Array.isArray(data)
				? data.map((payment) => ({
					id: payment.proof_id,
					customerName: payment.customer_name,
					gcashNumber: payment.gcash_number,
					amountPaid: payment.amount_paid,
					datePaid: payment.date_paid,
					imageUrl: payment.proof_image_url
				}))
				: [];
		} catch (err) {
			console.error("Failed to load payment proofs:", err);
			payments = [];
			showToast(err.message || "Failed to load payment proofs.");
		}
	}

	async function savePaymentToDB(payment) {
		if (!currentUser || !currentUser.staff_id) {
			throw new Error("No logged-in staff user found.");
		}

		const response = await fetch("/transaction-verification/api/proofs", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				customerName: payment.customerName,
				gcashNumber: payment.gcashNumber,
				amountPaid: payment.amountPaid,
				datePaid: payment.datePaid,
				imageUrl: payment.imageUrl
			})
		});

		const payload = await response.json().catch(() => ({ message: "Invalid server response." }));
		if (!response.ok) {
			throw new Error(payload.message || "Failed to save payment proof.");
		}

		return payload;
	}

	function getEmptyStateMarkup() {
		return `
			<div class="empty-state card-base">
				<i data-lucide="shield-check"></i>
				<h3>No Payment Proofs Yet</h3>
				<p>Click Add Payment Proof to upload the first transaction screenshot.</p>
			</div>
		`;
	}

	function renderPayments() {
		if (!paymentsList) return;

		if (!payments.length) {
			paymentsList.innerHTML = getEmptyStateMarkup();
			refreshIcons();
			return;
		}

		paymentsList.innerHTML = payments
			.map((payment) => {
				const paidDate = formatPaymentDate(payment.datePaid);
				return `
					<article class="payment-card" data-payment-id="${payment.id}">
						<div class="card-top">
							<div>
								<h3 class="customer-name">${escapeHtml(payment.customerName)}</h3>
								<p class="amount-paid">${formatCurrency(payment.amountPaid)}</p>
							</div>
							<span class="gcash-badge">GCASH</span>
						</div>
						<div class="card-meta">
							<span>${escapeHtml(paidDate)}</span>
							<div>
								<button class="icon-btn view-btn" data-payment-id="${payment.id}" type="button" aria-label="View payment proof details">
									<i data-lucide="chevron-right"></i>
								</button>
							</div>
						</div>
					</article>
				`;
			})
			.join("");

		refreshIcons();

		document.querySelectorAll(".payment-card").forEach((card) => {
			card.addEventListener("click", () => {
				const id = Number(card.dataset.paymentId);
				const payment = payments.find((item) => item.id === id);
				if (payment) {
					openDetailPopup(payment);
				}
			});
		});

		document.querySelectorAll(".view-btn").forEach((button) => {
			button.addEventListener("click", (event) => {
				event.stopPropagation();
				const id = Number(button.dataset.paymentId);
				const payment = payments.find((item) => item.id === id);
				if (payment) {
					openDetailPopup(payment);
				}
			});
		});
	}

	function resetPreview() {
		if (!previewContainer) return;

		previewContainer.innerHTML = `
			<div class="preview-placeholder">
				<i data-lucide="image"></i>
				<span>No image selected</span>
			</div>
		`;
		refreshIcons();
	}

	function resetForm() {
		custNameInput.value = "";
		gcashNumInput.value = "";
		amountInput.value = "";
		dateInput.value = "";
		imageFileInput.value = "";
		currentSelectedFile = null;

		if (currentPreviewURL) {
			URL.revokeObjectURL(currentPreviewURL);
			currentPreviewURL = null;
		}

		resetPreview();
	}

	function setDefaultDate() {
		if (!dateInput.value) {
			dateInput.value = new Date().toISOString().slice(0, 10);
		}
	}

	function openModal() {
		resetForm();
		setDefaultDate();
		modal.classList.add("active");
		modal.setAttribute("aria-hidden", "false");
	}

	function closeModal() {
		modal.classList.remove("active");
		modal.setAttribute("aria-hidden", "true");
		resetForm();
	}

	function openDetailPopup(payment) {
		const imageSrc = payment.imageUrl || "";
		const imageHtml = imageSrc
			? `<img src="${imageSrc}" alt="Payment proof image for ${escapeHtml(payment.customerName)}">`
			: '<div class="proof-image-empty">No proof image available</div>';

		detailCard.innerHTML = `
			<div class="detail-title-row">
				<h3 class="detail-title" id="detailTitle">Payment Proof Details</h3>
				<button class="icon-btn" id="closeDetailBtn" type="button" aria-label="Close details popup">
					<i data-lucide="x"></i>
				</button>
			</div>
			<div class="detail-grid">
				<div class="detail-row">
					<span class="detail-label">Customer Name</span>
					<div class="detail-value">${escapeHtml(payment.customerName)}</div>
				</div>
				<div class="detail-row">
					<span class="detail-label">GCash Number</span>
					<div class="detail-value">${escapeHtml(payment.gcashNumber || "Not provided")}</div>
				</div>
				<div class="detail-row">
					<span class="detail-label">Amount Paid</span>
					<div class="detail-value amount">${formatCurrency(payment.amountPaid)}</div>
				</div>
				<div class="detail-row">
					<span class="detail-label">Date Paid</span>
					<div class="detail-value">${escapeHtml(formatPaymentDate(payment.datePaid))}</div>
				</div>
			</div>
			<div class="proof-image-container">
				${imageHtml}
			</div>
		`;

		detailPopup.classList.add("active");
		detailPopup.setAttribute("aria-hidden", "false");

		const closeDetailBtn = document.getElementById("closeDetailBtn");
		if (closeDetailBtn) {
			closeDetailBtn.addEventListener("click", closeDetailPopup);
		}

		refreshIcons();
	}

	function closeDetailPopup() {
		detailPopup.classList.remove("active");
		detailPopup.setAttribute("aria-hidden", "true");
		detailCard.innerHTML = "";
	}

	function onImageChange(event) {
		const file = event.target.files && event.target.files[0];
		if (!file) {
			currentSelectedFile = null;
			if (currentPreviewURL) {
				URL.revokeObjectURL(currentPreviewURL);
				currentPreviewURL = null;
			}
			resetPreview();
			return;
		}

		if (!file.type.startsWith("image/")) {
			showToast("Please select a valid image file.");
			imageFileInput.value = "";
			currentSelectedFile = null;
			resetPreview();
			return;
		}

		currentSelectedFile = file;
		if (currentPreviewURL) {
			URL.revokeObjectURL(currentPreviewURL);
		}
		currentPreviewURL = URL.createObjectURL(file);
		previewContainer.innerHTML = `<img class="preview-img" src="${currentPreviewURL}" alt="Selected payment proof preview">`;
	}

	async function uploadPaymentProofFile(file) {
		const formData = new FormData();
		formData.append("proofImage", file);

		const response = await fetch("/transaction-verification/api/upload-proof", {
			method: "POST",
			body: formData
		});

		const payload = await response.json().catch(() => ({ message: "Invalid upload response." }));
		if (!response.ok) {
			throw new Error(payload.message || "Failed to upload proof image.");
		}

		if (!payload.imageUrl) {
			throw new Error("Upload succeeded but no image URL was returned.");
		}

		return payload.imageUrl;
	}

	async function addPayment() {
		const customerName = custNameInput.value.trim();
		const gcashNumber = gcashNumInput.value.trim();
		const amountPaid = Number(amountInput.value);
		const datePaid = dateInput.value;

		if (!customerName) {
			showToast("Customer name is required.");
			return;
		}
		if (!gcashNumber) {
			showToast("GCash number is required.");
			return;
		}
		if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
			showToast("Amount paid must be greater than zero.");
			return;
		}
		if (!datePaid) {
			showToast("Date paid is required.");
			return;
		}
		if (!currentSelectedFile) {
			showToast("Please upload a screenshot proof image.");
			return;
		}

		confirmAddBtn.disabled = true;
		confirmAddBtn.textContent = "Uploading...";

		try {
			const imageUrl = await uploadPaymentProofFile(currentSelectedFile);
			await savePaymentToDB({
				customerName,
				gcashNumber,
				amountPaid,
				datePaid,
				imageUrl
			});

			await loadPayments();
			renderPayments();
			closeModal();
			showToast("Payment proof saved.");
		} catch (err) {
			showToast(err.message || "Failed to save payment proof.");
		} finally {
			confirmAddBtn.disabled = false;
			confirmAddBtn.innerHTML = '<i data-lucide="save"></i>Save Payment Proof';
			refreshIcons();
		}
	}

	function refreshIcons() {
		if (window.lucide) {
			window.lucide.createIcons();
		}
	}

	function bindEvents() {
		if (openModalBtn) openModalBtn.addEventListener("click", openModal);
		if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
		if (cancelAddBtn) cancelAddBtn.addEventListener("click", closeModal);
		if (confirmAddBtn) confirmAddBtn.addEventListener("click", addPayment);
		if (imageFileInput) imageFileInput.addEventListener("change", onImageChange);

		if (modal) {
			modal.addEventListener("click", (event) => {
				if (event.target === modal) closeModal();
			});
		}

		if (detailPopup) {
			detailPopup.addEventListener("click", (event) => {
				if (event.target === detailPopup) closeDetailPopup();
			});
		}

		document.addEventListener("keydown", (event) => {
			if (event.key === "Escape") {
				if (modal.classList.contains("active")) {
					closeModal();
				}
				if (detailPopup.classList.contains("active")) {
					closeDetailPopup();
				}
			}
		});
	}

	async function init() {
		await loadCurrentUser();
		initHeaderUser();
		bindEvents();
		await loadPayments();
		renderPayments();
		refreshIcons();
		console.log("Transaction Verification module ready.");
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();

