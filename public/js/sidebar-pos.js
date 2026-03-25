/**
 * Sidebar POS System - Main JavaScript
 * Modern layout with sidebar navigation and product grid
 */

document.addEventListener("DOMContentLoaded", () => {
  // ═══════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  const state = {
    cart: [],
    mode: "products",
    cameraActive: false,
    cameraStarting: false,
    cameraRequested: false,
    quaggaRunning: false,
    quaggaDetectedHandler: null,
    lastScanMs: 0,
    audioCtx: null,
    debounceTimers: {},
    allProducts: [],
    serviceProducts: [],
    serviceMap: {
      load: null,
      cash: null
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // DOM ELEMENTS
  // ═══════════════════════════════════════════════════════════════════════

  // Mode tabs
  const modeTabs = document.querySelectorAll(".mode-tab");
  const modeContents = document.querySelectorAll(".mode-content");

  // Products
  const productsGrid = document.getElementById("productsGrid");
  const searchInput = document.getElementById("searchInput");

  // Barcode
  const barcodeInput = document.getElementById("barcodeInput");

  // Camera
  const cameraContainer = document.getElementById("cameraContainer");
  const cameraPlaceholder = document.getElementById("cameraPlaceholder");
  const startCameraBtn = document.getElementById("startCameraBtn");
  const stopCameraBtn = document.getElementById("stopCameraBtn");

  // Cart
  const cartItems = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");
  const clearCartBtn = document.getElementById("clearCartBtn");
  const checkoutBtn = document.getElementById("checkoutBtn");

  // Services section
  const openLoadServiceBtn = document.getElementById("openLoadServiceBtn");
  const openCashServiceBtn = document.getElementById("openCashServiceBtn");
  const servicesPanelHint = document.getElementById("servicesPanelHint");
  const loadServiceModal = document.getElementById("loadServiceModal");
  const closeLoadModalBtn = document.getElementById("closeLoadModalBtn");
  const loadAmountInput = document.getElementById("loadAmountInput");
  const loadNumberInput = document.getElementById("loadNumberInput");
  const loadNameInput = document.getElementById("loadNameInput");
  const submitLoadServiceBtn = document.getElementById("submitLoadServiceBtn");

  const cashServiceModal = document.getElementById("cashServiceModal");
  const closeCashModalBtn = document.getElementById("closeCashModalBtn");
  const cashModeInput = document.getElementById("cashModeInput");
  const cashAmountInput = document.getElementById("cashAmountInput");
  const cashoutFeeInput = document.getElementById("cashoutFeeInput");
  const submitCashServiceBtn = document.getElementById("submitCashServiceBtn");

  // Toast
  const messageToast = document.getElementById("messageToast");
  const toastMessage = document.getElementById("toastMessage");

  // ═══════════════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════

  function showMessage(text, type = "info") {
    toastMessage.textContent = text;
    messageToast.style.display = "block";
    messageToast.style.backgroundColor = 
      type === "error" ? "#fee" : 
      type === "success" ? "#efe" : "#eef";
    messageToast.style.color = 
      type === "error" ? "#c33" : 
      type === "success" ? "#3c3" : "#33c";

    setTimeout(() => {
      messageToast.style.display = "none";
    }, 3000);
  }

  function formatPeso(value) {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2
    }).format(value);
  }

  function ensureAudioContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    if (!state.audioCtx) {
      state.audioCtx = new AudioCtx();
    }

    if (state.audioCtx.state === "suspended") {
      state.audioCtx.resume().catch(() => {});
    }

    return state.audioCtx;
  }

  function playScanSound() {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    const startAt = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(1046, startAt + 0.08);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.08, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.12);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(startAt);
    oscillator.stop(startAt + 0.12);
  }

  function canonicalizeBarcode(raw, formatHint = "") {
    const cleaned = String(raw || "")
      .trim()
      .replace(/[^0-9a-zA-Z]/g, "")
      .toUpperCase();

    if (!cleaned) return "";

    const normalizedFormat = String(formatHint || "").toLowerCase();

    const computeEan13CheckDigit = (first12) => {
      if (!/^\d{12}$/.test(first12)) return "";
      let sum = 0;
      for (let i = 0; i < 12; i += 1) {
        const digit = Number(first12[i]);
        sum += i % 2 === 0 ? digit : digit * 3;
      }
      return String((10 - (sum % 10)) % 10);
    };

    // Canonical type: EAN-13 for UPC/EAN retail overlap.
    if (normalizedFormat === "upc_a" && /^\d{12}$/.test(cleaned)) {
      return `0${cleaned}`;
    }

    if (/^\d{12}$/.test(cleaned)) {
      const checkDigit = computeEan13CheckDigit(cleaned);
      if (checkDigit) return `${cleaned}${checkDigit}`;
      return `0${cleaned}`;
    }

    return cleaned;
  }

  function calculateTotals() {
    let total = 0;
    state.cart.forEach((item) => {
      total += item.price * item.quantity;
      total += Number(item.presetLoadAmount) || 0;
    });

    cartTotal.textContent = formatPeso(total);

    const hasItems = state.cart.length > 0;
    checkoutBtn.disabled = !hasItems;

    const itemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = itemCount;
  }

  function getLineId(item) {
    return item.lineId || item.id;
  }

  function setServiceButtonsState() {
    if (openLoadServiceBtn) openLoadServiceBtn.disabled = !state.serviceMap.load;
    if (openCashServiceBtn) openCashServiceBtn.disabled = !state.serviceMap.cash;

    if (!servicesPanelHint) return;

    if (!state.serviceMap.load && !state.serviceMap.cash) {
      servicesPanelHint.textContent = "Please configure Load / E-Load and Cash-In / Cash-Out in Inventory Services panel.";
    } else if (!state.serviceMap.load) {
      servicesPanelHint.textContent = "Missing service config: Load / E-Load.";
    } else if (!state.serviceMap.cash) {
      servicesPanelHint.textContent = "Missing service config: Cash-In / Cash-Out.";
    } else {
      servicesPanelHint.textContent = "Service pricing comes from the Inventory Services panel.";
    }
  }

  async function loadServiceConfig() {
    try {
      const response = await fetch("/products/api/services-config");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to load service config");

      state.serviceMap.load = payload.load
        ? {
            id: payload.load.id,
            name: payload.load.name,
            price: Number(payload.load.price) || 0,
            type: "Services"
          }
        : null;

      state.serviceMap.cash = payload.cash
        ? {
            id: payload.cash.id,
            name: payload.cash.name,
            price: Number(payload.cash.price) || 0,
            type: "Services"
          }
        : null;
    } catch (err) {
      console.error("Error loading service config:", err);
      state.serviceMap.load = null;
      state.serviceMap.cash = null;
    }

    setServiceButtonsState();
  }

  function openLoadModal() {
    if (!state.serviceMap.load) {
      showMessage("Load / E-Load service is not configured", "error");
      return;
    }

    loadAmountInput.value = "";
    loadNumberInput.value = "";
    loadNameInput.value = "";
    loadServiceModal.style.display = "flex";
    loadAmountInput.focus();
  }

  function closeLoadModal() {
    loadServiceModal.style.display = "none";
  }

  function openCashModal() {
    if (!state.serviceMap.cash) {
      showMessage("Cash-In / Cash-Out service is not configured", "error");
      return;
    }

    cashModeInput.value = "Cash In";
    cashAmountInput.value = "";
    cashoutFeeInput.value = "0.00";
    cashServiceModal.style.display = "flex";
    cashModeInput.focus();
  }

  function closeCashModal() {
    cashServiceModal.style.display = "none";
  }

  function recalculateCashoutFee() {
    const amount = Number(cashAmountInput.value) || 0;
    const mode = cashModeInput.value || "Cash In";
    const fee = mode === "Cash Out" ? amount * 0.02 : 0;
    cashoutFeeInput.value = fee.toFixed(2);
  }

  function submitLoadService() {
    const service = state.serviceMap.load;
    if (!service) return;

    const amount = Number(loadAmountInput.value) || 0;
    const number = String(loadNumberInput.value || "").trim();
    const customerName = String(loadNameInput.value || "").trim();

    if (amount <= 0) {
      showMessage("Please enter a valid load price", "error");
      return;
    }
    if (!number) {
      showMessage("Please enter the number", "error");
      return;
    }
    if (!customerName) {
      showMessage("Please enter the customer name", "error");
      return;
    }

    addToCart({
      id: service.id,
      lineId: `load-${Date.now()}`,
      name: `Load • ${customerName} (${number})`,
      price: Number(service.price) || 0,
      stock: -1,
      quantity: 1,
      type: "Services",
      isCustomService: true,
      requiresLoadAmount: false,
      presetLoadAmount: amount
    });

    closeLoadModal();
  }

  function submitCashService() {
    const service = state.serviceMap.cash;
    if (!service) return;

    const mode = cashModeInput.value || "Cash In";
    const amount = Number(cashAmountInput.value) || 0;
    const fee = mode === "Cash Out" ? Number(cashoutFeeInput.value) || 0 : 0;

    if (amount <= 0) {
      showMessage("Please enter a valid amount", "error");
      return;
    }

    addToCart({
      id: service.id,
      lineId: `cash-${Date.now()}`,
      name: mode,
      price: fee,
      stock: -1,
      quantity: 1,
      type: "Services",
      isCustomService: true,
      requiresLoadAmount: false,
      presetLoadAmount: amount
    });

    closeCashModal();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRODUCTS LOADING
  // ═══════════════════════════════════════════════════════════════════════

  async function loadProducts() {
    try {
      const response = await fetch("/products/items");
      const data = await response.json();

      const items = Array.isArray(data.items) ? data.items : [];
      if (items.length >= 0) {
        state.allProducts = items.map((item) => ({
          id: item.id,
          name: item.name,
          barcode: item.barcode,
          price: Number(item.price) || 0,
          stock: Number(item.stock) || 0,
          type: item.category,
          photo: item.photo || null
        }));
        await loadServiceConfig();

        const displayProducts = state.allProducts.filter((item) => item.type !== "Services");
        renderProducts(displayProducts);
      }
    } catch (err) {
      console.error("Error loading products:", err);
      showMessage("Error loading products", "error");
    }
  }

  function renderProducts(products) {
    if (products.length === 0) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
          <i data-lucide="package" style="width: 48px; height: 48px; margin: 0 auto 1rem; opacity: 0.3;"></i>
          <p style="color: #718096;">No products found</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    productsGrid.innerHTML = products.map((product) => {
      const outOfStock = product.stock === 0;
      return `
        <div class="product-card" onclick="window.addToCartDirect(${product.id}, '${product.name.replace(/"/g, '\\"')}', ${product.price}, ${product.stock})">
          <div class="product-image">
            ${product.photo
              ? `<img src="${product.photo}" alt="${product.name.replace(/"/g, '&quot;')}" loading="lazy">`
              : `<i data-lucide="package" style="width: 48px; height: 48px; color: #3b5bdb; opacity: 0.6;"></i>`}
          </div>
          <div class="product-info">
            <div class="product-name">${product.name}</div>
            <div class="product-price">${formatPeso(product.price)}</div>
            <div class="product-stock ${outOfStock ? 'low' : ''}">${outOfStock ? 'Out of stock' : `${product.stock} in stock`}</div>
            <button class="product-add-btn">Add to Cart</button>
          </div>
        </div>
      `;
    }).join("");

    lucide.createIcons();
  }

  window.addToCartDirect = function (id, name, price, stock) {
    if (stock === 0) {
      showMessage("This product is out of stock", "error");
      return;
    }
    addToCart({ id, name, price, stock, type: "Product" });
  };

  // ═══════════════════════════════════════════════════════════════════════
  // CART MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  function addToCart(product) {
    const shouldMerge = !product.isCustomService;
    const existing = shouldMerge
      ? state.cart.find((item) => !item.isCustomService && item.id === product.id)
      : null;

    if (existing) {
      existing.quantity += 1;
    } else {
      state.cart.push({
        id: product.id,
        lineId: product.lineId || product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        quantity: product.quantity || 1,
        type: product.type || "Product",
        isCustomService: Boolean(product.isCustomService),
        serviceType: product.serviceType || null,
        presetLoadAmount: Number(product.presetLoadAmount) || 0,
        requiresLoadAmount: Boolean(product.requiresLoadAmount)
      });
    }

    renderCart();
    calculateTotals();
    showMessage(`Added ${product.name} to cart`, "success");
  }

  function removeFromCart(lineId) {
    state.cart = state.cart.filter((item) => String(getLineId(item)) !== String(lineId));
    renderCart();
    calculateTotals();
  }

  function updateCartQuantity(lineId, newQuantity) {
    const item = state.cart.find((entry) => String(getLineId(entry)) === String(lineId));
    if (item) {
      const hasUnlimitedStock = item.stock === -1;
      newQuantity = hasUnlimitedStock
        ? Math.max(1, newQuantity)
        : Math.max(1, Math.min(newQuantity, item.stock));
      item.quantity = newQuantity;
      renderCart();
      calculateTotals();
    }
  }

  async function clearCart() {
    const confirmed = window.appDialog
      ? await window.appDialog.confirm("Clear the entire cart?", {
          title: "Clear Cart",
          type: "warning",
          confirmText: "Clear",
          cancelText: "Cancel"
        })
      : confirm("Clear the entire cart?");

    if (!confirmed) return;

    state.cart = [];
    renderCart();
    calculateTotals();
    showMessage("Cart cleared", "info");
  }

  function renderCart() {
    if (state.cart.length === 0) {
      cartItems.innerHTML = `
        <div class="cart-empty">
          <i data-lucide="shopping-cart" style="width: 48px; height: 48px;"></i>
          <p>Your cart is empty</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    cartItems.innerHTML = state.cart.map((item) => {
      const lineId = getLineId(item);
      const itemTotal = item.price * item.quantity + (Number(item.presetLoadAmount) || 0);
      const quantityControls = `<div class="cart-item-qty">
          <button onclick="window.updateQty('${lineId}', -1)">−</button>
          <input type="number" value="${item.quantity}" readonly>
          <button onclick="window.updateQty('${lineId}', 1)">+</button>
        </div>`;

      return `
        <div class="cart-item">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-row">
            ${quantityControls}
            <div class="cart-item-price">${formatPeso(itemTotal)}</div>
            <button class="cart-item-remove" onclick="window.removeItem('${lineId}')">
              <i data-lucide="x" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </div>
      `;
    }).join("");

    lucide.createIcons();
  }

  window.updateQty = function (lineId, delta) {
    const item = state.cart.find((entry) => String(getLineId(entry)) === String(lineId));
    if (item) {
      updateCartQuantity(lineId, item.quantity + delta);
    }
  };

  window.removeItem = function (lineId) {
    removeFromCart(lineId);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // BARCODE SCANNING
  // ═══════════════════════════════════════════════════════════════════════

  async function scanBarcode(barcode, formatHint = "") {
    const canonicalBarcode = canonicalizeBarcode(barcode, formatHint);

    if (!canonicalBarcode) {
      showMessage("Please enter or scan a barcode", "error");
      return;
    }

    // Clear input and show feedback
    const originalValue = barcodeInput.value;
    barcodeInput.value = "";

    try {
      const response = await fetch("/pos/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: canonicalBarcode })
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.error || "Product not found", "error");
        barcodeInput.focus();
        return;
      }

      if (data.success && data.product) {
        addToCart(data.product);
        playScanSound();
        barcodeInput.focus();
        return;
      }

      showMessage("Error scanning barcode", "error");
      barcodeInput.focus();
    } catch (err) {
      console.error("Scan error:", err);
      showMessage("Error scanning barcode: " + err.message, "error");
      barcodeInput.value = originalValue;
      barcodeInput.focus();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRODUCT SEARCH
  // ═══════════════════════════════════════════════════════════════════════

  function searchProducts(query) {
    const browseItems = state.allProducts.filter((product) => product.type !== "Services");

    if (!query.trim()) {
      renderProducts(browseItems);
      return;
    }

    const filtered = browseItems.filter((product) =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      (product.barcode && product.barcode.includes(query))
    );

    renderProducts(filtered);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CAMERA BARCODE SCANNING
  // ═══════════════════════════════════════════════════════════════════════

  function startCamera() {
    if (state.cameraActive || state.cameraStarting) return;

    // Stop any previous Quagga instance
    if (typeof Quagga !== "undefined" && state.quaggaRunning) {
      try {
        if (state.quaggaDetectedHandler && typeof Quagga.offDetected === "function") {
          Quagga.offDetected(state.quaggaDetectedHandler);
        }
        Quagga.stop();
      } catch (e) {}
      state.quaggaRunning = false;
    }

    state.cameraStarting = true;
    state.cameraRequested = true;

    // Clear any leftover Quagga elements and show container
    cameraContainer.innerHTML = "";
    cameraContainer.style.display = "block";
    cameraPlaceholder.style.display = "none";
    startCameraBtn.style.display = "none";
    stopCameraBtn.style.display = "flex";

    startBarcodeDetection();
  }

  function stopCamera() {
    state.cameraRequested = false;
    state.cameraStarting = false;

    if (typeof Quagga !== "undefined" && state.quaggaRunning) {
      try {
        if (state.quaggaDetectedHandler && typeof Quagga.offDetected === "function") {
          Quagga.offDetected(state.quaggaDetectedHandler);
        }
        Quagga.stop();
      } catch (e) {}
      state.quaggaRunning = false;
    }

    state.quaggaDetectedHandler = null;
    state.cameraActive = false;
    cameraContainer.style.display = "none";
    cameraContainer.innerHTML = ""; // remove Quagga's video/canvas elements
    cameraPlaceholder.style.display = "flex";
    startCameraBtn.style.display = "flex";
    stopCameraBtn.style.display = "none";

    showMessage("Camera stopped", "info");
  }

  function startBarcodeDetection() {
    if (typeof Quagga === "undefined") {
      showMessage("Barcode library not loaded", "error");
      stopCamera();
      return;
    }

    Quagga.init(
      {
        numOfWorkers: 2,
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: cameraContainer, // Quagga creates its own <video> inside here
          constraints: {
            facingMode: { ideal: "environment" },
            width: { min: 320, ideal: 640 },
            height: { min: 240, ideal: 480 }
          }
        },
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader",
            "upc_reader",
            "upc_e_reader"
          ],
          multiple: false
        },
        locator: { halfSample: true, patchSize: "medium" },
        frequency: 10
      },
      function (err) {
        state.cameraStarting = false;

        if (err) {
          console.error("Quagga init error:", err);
          const msg = err.name === "NotAllowedError"
            ? "Camera permission denied"
            : err.name === "NotFoundError"
              ? "No camera found on this device"
              : "Camera error: " + (err.message || err);
          showMessage(msg, "error");
          stopCamera();
          return;
        }

        if (!state.cameraRequested) {
          try { Quagga.stop(); } catch (e) {}
          return;
        }

        Quagga.start();
        state.quaggaRunning = true;
        state.cameraActive = true;
        showMessage("Camera started", "success");

        state.quaggaDetectedHandler = function (result) {
          if (!result || !result.codeResult || !result.codeResult.code) return;
          const now = Date.now();
          if (now - state.lastScanMs < 1500) return;
          state.lastScanMs = now;

          const barcode = result.codeResult.code;
          const format = result.codeResult.format || "";
          if (navigator.vibrate) navigator.vibrate(150);
          scanBarcode(barcode, format);
        };
        Quagga.onDetected(state.quaggaDetectedHandler);
      }
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MODE SWITCHING
  // ═══════════════════════════════════════════════════════════════════════

  function switchMode(mode) {
    state.mode = mode;

    // Update tab buttons
    modeTabs.forEach((tab) => {
      if (tab.dataset.mode === mode) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });

    // Update mode contents
    modeContents.forEach((content) => {
      if (content.id === `${mode}Mode`) {
        content.style.display = "block";
      } else {
        content.style.display = "none";
      }
    });

    // Handle camera
    if (mode !== "camera" && (state.cameraActive || state.cameraStarting)) {
      stopCamera();
    } else if (mode === "camera") {
      cameraPlaceholder.style.display = "flex";
      cameraContainer.style.display = "none";
      startCameraBtn.style.display = "flex";
      stopCameraBtn.style.display = "none";
    }

    // Focus input for barcode mode
    if (mode === "barcode") {
      setTimeout(() => {
        barcodeInput.value = "";
        barcodeInput.focus();
      }, 50);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHECKOUT & DEBT
  // ═══════════════════════════════════════════════════════════════════════

  function proceedToCheckout() {
    if (state.cart.length === 0) {
      showMessage("Cart is empty", "error");
      return;
    }

    sessionStorage.setItem("posCart", JSON.stringify({
      items: state.cart,
      subtotal: state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      isDebt: false
    }));

    window.location.href = "/pos/checkout";
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════════════════

  // Mode tabs
  modeTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      switchMode(tab.dataset.mode);
    });
  });

  // Search
  searchInput.addEventListener("input", (e) => {
    clearTimeout(state.debounceTimers.search);
    state.debounceTimers.search = setTimeout(() => {
      searchProducts(e.target.value);
    }, 300);
  });

  // Barcode
  barcodeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      scanBarcode(barcodeInput.value);
    }
  });

  // Also handle paste events for barcode scanners that paste instead of keypressing
  barcodeInput.addEventListener("change", (e) => {
    if (e.target.value.trim()) {
      scanBarcode(e.target.value);
    }
  });

  // Camera
  startCameraBtn.addEventListener("click", startCamera);
  startCameraBtn.addEventListener("click", ensureAudioContext);
  stopCameraBtn.addEventListener("click", stopCamera);

  // Cart
  clearCartBtn.addEventListener("click", clearCart);
  checkoutBtn.addEventListener("click", proceedToCheckout);

  if (openLoadServiceBtn) openLoadServiceBtn.addEventListener("click", openLoadModal);
  if (openCashServiceBtn) openCashServiceBtn.addEventListener("click", openCashModal);
  if (closeLoadModalBtn) closeLoadModalBtn.addEventListener("click", closeLoadModal);
  if (closeCashModalBtn) closeCashModalBtn.addEventListener("click", closeCashModal);
  if (submitLoadServiceBtn) submitLoadServiceBtn.addEventListener("click", submitLoadService);
  if (submitCashServiceBtn) submitCashServiceBtn.addEventListener("click", submitCashService);
  if (cashModeInput) cashModeInput.addEventListener("change", recalculateCashoutFee);
  if (cashAmountInput) cashAmountInput.addEventListener("input", recalculateCashoutFee);

  if (loadServiceModal) {
    loadServiceModal.addEventListener("click", (event) => {
      if (event.target === loadServiceModal) closeLoadModal();
    });
  }

  if (cashServiceModal) {
    cashServiceModal.addEventListener("click", (event) => {
      if (event.target === cashServiceModal) closeCashModal();
    });
  }

  // Sidebar navigation
  const sidebarNavIcons = document.querySelectorAll(".sidebar-nav-icon[data-page]");
  sidebarNavIcons.forEach((icon) => {
    if (icon.dataset.page === "pos") {
      icon.classList.add("active");
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════

  renderCart();
  calculateTotals();
  loadProducts();

  // Initialize all Lucide icons after content renders
  setTimeout(() => {
    lucide.createIcons();
  }, 100);
});
