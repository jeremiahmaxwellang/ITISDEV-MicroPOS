/**
 * CHECKOUT - Transaction Processing
 * Handles payment processing and receipt generation
 */

document.addEventListener("DOMContentLoaded", () => {
  // ═══════════════════════════════════════════════════════════════════════
  // STATE & CONFIG
  // ═══════════════════════════════════════════════════════════════════════

  const state = {
    cart: null,
    paymentMethod: "Cash",
    isDebt: false,
    processing: false,
    gcashQRImage: null // Store QR code image data
  };

  const TAX_RATE = 0; // 0% tax (can be changed)

  // ═══════════════════════════════════════════════════════════════════════
  // DOM ELEMENTS
  // ═══════════════════════════════════════════════════════════════════════

  const orderItemsList = document.getElementById("orderItemsList");
  const subtotalAmount = document.getElementById("subtotalAmount");
  const taxAmount = document.getElementById("taxAmount");
  const totalAmount = document.getElementById("totalAmount");

  // Payment methods
  const cashRadio = document.getElementById("cashRadio");
  const gcashRadio = document.getElementById("gcashRadio");
  const cashCard = document.getElementById("cashCard");
  const gcashCard = document.getElementById("gcashCard");

  // Input sections
  const paymentInputSection = document.getElementById("paymentInputSection");
  const cashInputBox = document.getElementById("cashInputBox");
  const gcashInputBox = document.getElementById("gcashInputBox");

  // Inputs
  const amountPaidInput = document.getElementById("amountPaid");
  const changeDisplay = document.getElementById("changeDisplay");
  const gcashReference = document.getElementById("gcashReference");
  const gcashCustomerNumber = document.getElementById("gcashCustomerNumber");
  const gcashCustomerName = document.getElementById("gcashCustomerName");

  // GCash QR Code Elements
  const gcashQRUpload = document.getElementById("gcashQRUpload");
  const qrPreview = document.getElementById("qrPreview");
  const qrImage = document.getElementById("qrImage");
  const qrUploadLabel = document.getElementById("qrUploadLabel");
  const removeQRBtn = document.getElementById("removeQRBtn");

  // Buttons
  const confirmPaymentBtn = document.getElementById("confirmPaymentBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const newSaleBtn = document.getElementById("newSaleBtn");

  // Messages
  const confirmationMessage = document.getElementById("confirmationMessage");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const successMessage = document.getElementById("successMessage");
  const transactionIdDisplay = document.getElementById("transactionId");

  // ═══════════════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════

  function formatPeso(value) {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2
    }).format(value);
  }

  function loadCart() {
    const cartData = sessionStorage.getItem("posCart");
    if (!cartData) {
      alert("No cart data found. Redirecting to POS...");
      window.location.href = "/pos";
      return null;
    }

    try {
      state.cart = JSON.parse(cartData);
      state.isDebt = state.cart.isDebt || false;
      return state.cart;
    } catch (err) {
      console.error("Error parsing cart:", err);
      alert("Invalid cart data. Redirecting to POS...");
      window.location.href = "/pos";
      return null;
    }
  }

  function renderOrderItems() {
    if (!state.cart || !state.cart.items) return;

    orderItemsList.innerHTML = state.cart.items
      .map((item) => {
        const itemTotal = item.price * item.quantity;
        return `
          <div class="order-item">
            <div class="order-item-info">
              <p class="order-item-name">${item.name}</p>
              <p class="order-item-details">${formatPeso(item.price)} × ${item.quantity}</p>
            </div>
            <div class="order-item-price">${formatPeso(itemTotal)}</div>
          </div>
        `;
      })
      .join("");
  }

  function calculateTotals() {
    if (!state.cart || !state.cart.items) return;

    const subtotal = state.cart.subtotal || 0;
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    subtotalAmount.textContent = formatPeso(subtotal);
    taxAmount.textContent = formatPeso(tax);
    totalAmount.textContent = formatPeso(total);

    return { subtotal, tax, total };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PAYMENT METHOD HANDLING
  // ═══════════════════════════════════════════════════════════════════════

  function selectPaymentMethod(method) {
    state.paymentMethod = method;

    // Update UI
    cashCard.classList.toggle("active", method === "Cash");
    gcashCard.classList.toggle("active", method === "GCash");
    cashInputBox.style.display = method === "Cash" ? "flex" : "none";
    gcashInputBox.style.display = method === "GCash" ? "flex" : "none";

    updateConfirmationMessage();
  }

  function updateConfirmationMessage() {
    const totals = calculateTotals();
    let message = "";

    if (state.paymentMethod === "Cash") {
      const amountPaid = parseFloat(amountPaidInput.value) || 0;
      const change = amountPaid - totals.total;

      if (amountPaid >= totals.total) {
        message = `You will receive ₱${formatPeso(change)} in change.`;
        changeDisplay.textContent = `Change: ${formatPeso(change)}`;
        changeDisplay.style.color = "var(--brand)";
      } else if (amountPaid > 0) {
        message = `Amount insufficient. Shortage: ₱${formatPeso(totals.total - amountPaid)}`;
        changeDisplay.textContent = `Shortage: ${formatPeso(totals.total - amountPaid)}`;
        changeDisplay.style.color = "var(--danger)";
      } else {
        message = `Please enter the amount paid.`;
        changeDisplay.textContent = "";
      }
    } else if (state.paymentMethod === "GCash") {
      if (!state.gcashQRImage) {
        message = `⚠️ Please upload the GCash QR code to proceed.`;
      } else {
        message = `Send ₱${formatPeso(totals.total)} to the GCash QR code displayed.`;
        if (gcashReference.value) {
          message += ` (Ref: ${gcashReference.value})`;
        }
      }
    }

    confirmationMessage.textContent = message;
  }

  function validatePaymentInput() {
    if (state.paymentMethod === "Cash") {
      const amountPaid = parseFloat(amountPaidInput.value) || 0;
      const totals = calculateTotals();
      return amountPaid >= totals.total;
    } else if (state.paymentMethod === "GCash") {
      return (
        state.gcashQRImage && // QR code must be uploaded
        gcashReference.value.trim() &&
        gcashCustomerNumber.value.trim() &&
        gcashCustomerName.value.trim()
      );
    }
    return false;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GCASH QR CODE HANDLING
  // ═══════════════════════════════════════════════════════════════════════

  function handleQRUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please upload a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      state.gcashQRImage = e.target.result;
      displayQRPreview();
      updateConfirmationMessage();
    };
    reader.readAsDataURL(file);
  }

  function displayQRPreview() {
    if (state.gcashQRImage) {
      qrImage.src = state.gcashQRImage;
      qrPreview.style.display = 'flex';
      qrUploadLabel.style.display = 'none';
    }
  }

  function removeQRCode() {
    state.gcashQRImage = null;
    qrPreview.style.display = 'none';
    qrUploadLabel.style.display = 'flex';
    gcashQRUpload.value = '';
    updateConfirmationMessage();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TRANSACTION PROCESSING
  // ═══════════════════════════════════════════════════════════════════════

  async function processTransaction() {
    if (!validatePaymentInput()) {
      alert("Please complete all payment details");
      return;
    }

    state.processing = true;
    loadingIndicator.style.display = "flex";
    confirmPaymentBtn.disabled = true;

    try {
      const transactionData = {
        items: state.cart.items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity
        })),
        payment_method: state.paymentMethod,
        customer_id: null, // Can be set if customer is known
        staff_id: null // Will be set by backend
      };

      const response = await fetch("/pos/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process transaction");
      }

      // Success!
      showSuccess(data);
    } catch (err) {
      console.error("Transaction error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      state.processing = false;
      loadingIndicator.style.display = "none";
      confirmPaymentBtn.disabled = false;
    }
  }

  function showSuccess(transactionData) {
    loadingIndicator.style.display = "none";
    paymentInputSection.style.display = "none";
    confirmationMessage.style.display = "none";

    transactionIdDisplay.textContent = `Transaction ID: ${transactionData.transaction_id}`;
    successMessage.classList.add("show");
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════════════════

  // Payment method selection
  cashRadio.addEventListener("change", () => selectPaymentMethod("Cash"));
  gcashRadio.addEventListener("change", () => selectPaymentMethod("GCash"));
  cashCard.addEventListener("click", () => {
    cashRadio.checked = true;
    selectPaymentMethod("Cash");
  });
  gcashCard.addEventListener("click", () => {
    gcashRadio.checked = true;
    selectPaymentMethod("GCash");
  });

  // Cash input
  amountPaidInput.addEventListener("input", updateConfirmationMessage);

  // GCash inputs
  gcashReference.addEventListener("input", updateConfirmationMessage);
  gcashCustomerNumber.addEventListener("input", updateConfirmationMessage);
  gcashCustomerName.addEventListener("input", updateConfirmationMessage);

  // GCash QR Code upload
  gcashQRUpload.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handleQRUpload(e.target.files[0]);
    }
  });

  removeQRBtn.addEventListener("click", (e) => {
    e.preventDefault();
    removeQRCode();
  });

  // Drag and drop for QR upload
  const qrUploadContainer = document.querySelector('.qr-upload-container');
  qrUploadContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    qrUploadContainer.style.opacity = '0.7';
  });

  qrUploadContainer.addEventListener('dragleave', () => {
    qrUploadContainer.style.opacity = '1';
  });

  qrUploadContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    qrUploadContainer.style.opacity = '1';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleQRUpload(e.dataTransfer.files[0]);
    }
  });

  // Buttons
  confirmPaymentBtn.addEventListener("click", processTransaction);
  cancelBtn.addEventListener("click", () => window.history.back());
  newSaleBtn.addEventListener("click", () => {
    sessionStorage.removeItem("posCart");
    window.location.href = "/pos";
  });

  // ═══════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════

  if (loadCart()) {
    renderOrderItems();
    calculateTotals();
    selectPaymentMethod("Cash"); // Default to cash
    amountPaidInput.focus();
  }
  
  // Initialize Lucide icons
  lucide.createIcons();
});
