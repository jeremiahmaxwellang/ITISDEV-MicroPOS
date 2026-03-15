/**
 * POS System - Main JavaScript
 * Handles barcode scanning, camera, cart management, and checkout
 */

document.addEventListener("DOMContentLoaded", () => {
  // ═══════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  const state = {
    cart: [],
    mode: "barcode", // barcode, search, camera
    cameraActive: false,
    cameraStream: null,
    tax_rate: 0, // Can be configured
    debounceTimers: {}
  };

  // ═══════════════════════════════════════════════════════════════════════
  // DOM ELEMENTS
  // ═══════════════════════════════════════════════════════════════════════

  // Mode buttons
  const barcodeModeBtn = document.getElementById("barcodeMode");
  const searchModeBtn = document.getElementById("searchMode");
  const cameraModeBtn = document.getElementById("cameraMode");

  // Input sections
  const barcodeInputSection = document.getElementById("barcodeInputSection");
  const searchInputSection = document.getElementById("searchInputSection");
  const cameraInputSection = document.getElementById("cameraInputSection");

  // Inputs
  const barcodeInput = document.getElementById("barcodeInput");
  const submitBarcodeBtn = document.getElementById("submitBarcode");
  const searchInput = document.getElementById("searchInput");
  const submitSearchBtn = document.getElementById("submitSearch");
  const searchResults = document.getElementById("searchResults");
  const productsGrid = document.getElementById("productsGrid");

  // Camera elements
  const cameraFeed = document.getElementById("cameraFeed");
  const startCameraBtn = document.getElementById("startCamera");
  const stopCameraBtn = document.getElementById("stopCamera");

  // Cart elements
  const cartItems = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");
  const subtotal = document.getElementById("subtotal");
  const taxAmount = document.getElementById("taxAmount");
  const cartTotal = document.getElementById("cartTotal");
  const clearCartBtn = document.getElementById("clearCart");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const listAsDebtBtn = document.getElementById("listAsDebt");

  // Message box
  const messageBox = document.getElementById("messageBox");

  // ═══════════════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════

  function showMessage(text, type = "info") {
    messageBox.textContent = text;
    messageBox.className = `message-box show ${type}`;
    setTimeout(() => {
      messageBox.classList.remove("show");
    }, 3000);
  }

  function formatPeso(value) {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2
    }).format(value);
  }

  function calculateTotals() {
    let subtotal_amount = 0;
    state.cart.forEach((item) => {
      subtotal_amount += item.price * item.quantity;
    });

    const tax = subtotal_amount * state.tax_rate;
    const total = subtotal_amount + tax;

    subtotal.textContent = formatPeso(subtotal_amount);
    taxAmount.textContent = formatPeso(tax);
    cartTotal.textContent = formatPeso(total);

    // Update cart count
    const itemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = itemCount;

    // Enable/disable checkout buttons
    const hasItems = state.cart.length > 0;
    checkoutBtn.disabled = !hasItems;
    listAsDebtBtn.disabled = !hasItems;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CART MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  function addToCart(product) {
    // Check if product already in cart
    const existingItem = state.cart.find((item) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      state.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        quantity: 1
      });
    }

    renderCart();
    calculateTotals();
    showMessage(`Added ${product.name} to cart`, "success");
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter((item) => item.id !== productId);
    renderCart();
    calculateTotals();
  }

  function updateCartQuantity(productId, quantity) {
    const item = state.cart.find((item) => item.id === productId);
    if (item) {
      item.quantity = Math.max(1, quantity);
      renderCart();
      calculateTotals();
    }
  }

  function clearCart() {
    if (confirm("Clear the entire cart?")) {
      state.cart = [];
      renderCart();
      calculateTotals();
      showMessage("Cart cleared", "info");
    }
  }

  function renderCart() {
    if (state.cart.length === 0) {
      cartItems.innerHTML = `
        <p class="empty-state">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          Your cart is empty
        </p>
      `;
      return;
    }

    cartItems.innerHTML = state.cart
      .map((item) => {
        const itemTotal = item.price * item.quantity;
        return `
          <div class="cart-item">
            <div class="cart-item-info">
              <p class="cart-item-name">${item.name}</p>
              <p class="cart-item-price">${formatPeso(item.price)} each</p>
            </div>
            <div class="cart-item-qty">
              <button type="button" onclick="updateQty(${item.id}, -1)">-</button>
              <input type="number" value="${item.quantity}" readonly>
              <button type="button" onclick="updateQty(${item.id}, 1)">+</button>
            </div>
            <div class="cart-item-total">${formatPeso(itemTotal)}</div>
            <button class="cart-item-remove" type="button" onclick="removeItem(${item.id})" title="Remove">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
              </svg>
            </button>
          </div>
        `;
      })
      .join("");
  }

  // Global functions for cart item interactions
  window.updateQty = function (productId, delta) {
    const item = state.cart.find((item) => item.id === productId);
    if (item) {
      updateCartQuantity(productId, item.quantity + delta);
    }
  };

  window.removeItem = function (productId) {
    removeFromCart(productId);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // BARCODE SCANNING
  // ═══════════════════════════════════════════════════════════════════════

  async function scanBarcode(barcode) {
    try {
      const response = await fetch("/pos/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: barcode.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.error || "Product not found", "error");
        return;
      }

      if (data.success) {
        addToCart(data.product);
        barcodeInput.value = "";
        barcodeInput.focus();
      }
    } catch (err) {
      console.error("Scan error:", err);
      showMessage("Error scanning barcode", "error");
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRODUCT SEARCH
  // ═══════════════════════════════════════════════════════════════════════

  async function searchProducts(query) {
    if (!query.trim()) {
      searchResults.innerHTML = "";
      return;
    }

    try {
      const response = await fetch(`/pos/api/products?search=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success && data.items.length > 0) {
        searchResults.innerHTML = data.items
          .map((item) => {
            const stockClass = item.stock === 0 ? " out-of-stock" : "";
            return `
              <div class="search-result-item" onclick="addProductToCart({id: ${item.id}, name: '${item.name}', price: ${item.price}, stock: ${item.stock}})">
                <div class="search-result-info">
                  <p class="search-result-name">${item.name}</p>
                  <p class="search-result-barcode">${item.barcode || "No barcode"}</p>
                </div>
                <div class="search-result-price">${formatPeso(item.price)}</div>
              </div>
            `;
          })
          .join("");
      } else {
        searchResults.innerHTML = '<p style="padding: 16px; color: var(--muted); text-align: center;">No products found</p>';
      }
    } catch (err) {
      console.error("Search error:", err);
      showMessage("Error searching products", "error");
    }
  }

  window.addProductToCart = function (product) {
    addToCart(product);
    searchInput.value = "";
    searchResults.innerHTML = "";
  };

  // ═══════════════════════════════════════════════════════════════════════
  // CAMERA SCANNING
  // ═══════════════════════════════════════════════════════════════════════

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      cameraFeed.srcObject = stream;
      state.cameraStream = stream;
      state.cameraActive = true;
      startCameraBtn.style.display = "none";
      stopCameraBtn.style.display = "flex";

      // Start barcode detection (simplified - replace with actual barcode library if needed)
      detectBarcodeFromCamera();
    } catch (err) {
      if (err.name === "NotAllowedError") {
        showMessage("Camera permission denied", "error");
      } else if (err.name === "NotFoundError") {
        showMessage("No camera found", "error");
      } else {
        console.error("Camera error:", err);
        showMessage("Error accessing camera", "error");
      }
    }
  }

  function stopCamera() {
    if (state.cameraStream) {
      state.cameraStream.getTracks().forEach((track) => track.stop());
      state.cameraStream = null;
      state.cameraActive = false;
    }
    cameraFeed.srcObject = null;
    startCameraBtn.style.display = "flex";
    stopCameraBtn.style.display = "none";
  }

  function detectBarcodeFromCamera() {
    // This is a simplified implementation
    // For production, use a barcode detection library like ZXing or QuaggaJS
    // For now, we'll use a simple OCR-like approach with canvas

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    function captureFrame() {
      if (!state.cameraActive) return;

      try {
        ctx.drawImage(cameraFeed, 0, 0, canvas.width, canvas.height);
        // TODO: Implement actual barcode detection algorithm
        // This would require a barcode detection library
      } catch (err) {
        console.error("Frame capture error:", err);
      }

      requestAnimationFrame(captureFrame);
    }

    // Start frame capture
    if (cameraFeed.readyState === cameraFeed.HAVE_FUTURE_DATA) {
      captureFrame();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MODE SWITCHING
  // ═══════════════════════════════════════════════════════════════════════

  function switchMode(newMode) {
    state.mode = newMode;

    // Update button states
    barcodeModeBtn.classList.toggle("active", newMode === "barcode");
    searchModeBtn.classList.toggle("active", newMode === "search");
    cameraModeBtn.classList.toggle("active", newMode === "camera");

    // Update section visibility
    barcodeInputSection.classList.toggle("active", newMode === "barcode");
    searchInputSection.classList.toggle("active", newMode === "search");
    cameraInputSection.classList.toggle("active", newMode === "camera");

    // Handle camera
    if (newMode === "camera" && !state.cameraActive) {
      startCamera();
    } else if (newMode !== "camera" && state.cameraActive) {
      stopCamera();
    }

    // Focus input
    if (newMode === "barcode") {
      barcodeInput.focus();
    } else if (newMode === "search") {
      searchInput.focus();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHECKOUT
  // ═══════════════════════════════════════════════════════════════════════

  function proceedToCheckout() {
    if (state.cart.length === 0) {
      showMessage("Cart is empty", "error");
      return;
    }

    // Store cart in sessionStorage for checkout page
    sessionStorage.setItem("posCart", JSON.stringify({
      items: state.cart,
      subtotal: state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    }));

    // Redirect to checkout
    window.location.href = "/pos/checkout";
  }

  function proceedAsDebt() {
    if (state.cart.length === 0) {
      showMessage("Cart is empty", "error");
      return;
    }

    // Store cart as debt in sessionStorage
    sessionStorage.setItem("posCart", JSON.stringify({
      items: state.cart,
      subtotal: state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      isDebt: true
    }));

    // Redirect to checkout
    window.location.href = "/pos/checkout";
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════════════════

  // Mode buttons
  barcodeModeBtn.addEventListener("click", () => switchMode("barcode"));
  searchModeBtn.addEventListener("click", () => switchMode("search"));
  cameraModeBtn.addEventListener("click", () => switchMode("camera"));

  // Barcode input
  barcodeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      scanBarcode(barcodeInput.value);
    }
  });
  submitBarcodeBtn.addEventListener("click", () => scanBarcode(barcodeInput.value));

  // Search input
  searchInput.addEventListener("input", (e) => {
    clearTimeout(state.debounceTimers.search);
    state.debounceTimers.search = setTimeout(() => {
      searchProducts(e.target.value);
    }, 300);
  });
  submitSearchBtn.addEventListener("click", () => searchProducts(searchInput.value));

  // Camera buttons
  startCameraBtn.addEventListener("click", startCamera);
  stopCameraBtn.addEventListener("click", stopCamera);

  // Cart buttons
  clearCartBtn.addEventListener("click", clearCart);
  checkoutBtn.addEventListener("click", proceedToCheckout);
  listAsDebtBtn.addEventListener("click", proceedAsDebt);

  // Initialize
  renderCart();
  calculateTotals();
  barcodeInput.focus();
});
