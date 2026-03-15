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
    cameraStream: null,
    tax_rate: 0.0,
    debounceTimers: {},
    allProducts: []
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
  const cameraFeed = document.getElementById("cameraFeed");
  const cameraPlaceholder = document.getElementById("cameraPlaceholder");
  const startCameraBtn = document.getElementById("startCameraBtn");
  const stopCameraBtn = document.getElementById("stopCameraBtn");

  // Cart
  const cartItems = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");
  const subtotal = document.getElementById("subtotal");
  const taxAmount = document.getElementById("taxAmount");
  const cartTotal = document.getElementById("cartTotal");
  const clearCartBtn = document.getElementById("clearCartBtn");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const listAsDebtBtn = document.getElementById("listAsDebtBtn");

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

  function calculateTotals() {
    let subtotalAmount = 0;
    state.cart.forEach((item) => {
      subtotalAmount += item.price * item.quantity;
    });

    const tax = subtotalAmount * state.tax_rate;
    const total = subtotalAmount + tax;

    subtotal.textContent = formatPeso(subtotalAmount);
    taxAmount.textContent = formatPeso(tax);
    cartTotal.textContent = formatPeso(total);

    const hasItems = state.cart.length > 0;
    checkoutBtn.disabled = !hasItems;
    listAsDebtBtn.disabled = !hasItems;

    const itemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = itemCount;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRODUCTS LOADING
  // ═══════════════════════════════════════════════════════════════════════

  async function loadProducts() {
    try {
      const response = await fetch("/pos/api/products");
      const data = await response.json();

      if (data.success && data.items) {
        state.allProducts = data.items;
        renderProducts(state.allProducts);
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
            <i data-lucide="package" style="width: 48px; height: 48px; color: #3b5bdb; opacity: 0.6;"></i>
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
    addToCart({ id, name, price, stock });
  };

  // ═══════════════════════════════════════════════════════════════════════
  // CART MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  function addToCart(product) {
    const existing = state.cart.find((item) => item.id === product.id);

    if (existing) {
      existing.quantity += 1;
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

  function updateCartQuantity(productId, newQuantity) {
    const item = state.cart.find((item) => item.id === productId);
    if (item) {
      newQuantity = Math.max(1, Math.min(newQuantity, item.stock));
      item.quantity = newQuantity;
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
        <div class="cart-empty">
          <i data-lucide="shopping-cart" style="width: 48px; height: 48px;"></i>
          <p>Your cart is empty</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    cartItems.innerHTML = state.cart.map((item) => {
      const itemTotal = item.price * item.quantity;
      return `
        <div class="cart-item">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-row">
            <div class="cart-item-qty">
              <button onclick="window.updateQty(${item.id}, -1)">−</button>
              <input type="number" value="${item.quantity}" readonly>
              <button onclick="window.updateQty(${item.id}, 1)">+</button>
            </div>
            <div class="cart-item-price">${formatPeso(itemTotal)}</div>
            <button class="cart-item-remove" onclick="window.removeItem(${item.id})">
              <i data-lucide="x" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </div>
      `;
    }).join("");

    lucide.createIcons();
  }

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
    if (!barcode || !barcode.trim()) {
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
        body: JSON.stringify({ barcode: barcode.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.error || "Product not found", "error");
        barcodeInput.focus();
        return;
      }

      if (data.success && data.product) {
        addToCart(data.product);
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
    if (!query.trim()) {
      renderProducts(state.allProducts);
      return;
    }

    const filtered = state.allProducts.filter((product) =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      (product.barcode && product.barcode.includes(query))
    );

    renderProducts(filtered);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CAMERA BARCODE SCANNING
  // ═══════════════════════════════════════════════════════════════════════

  async function startCamera() {
    try {
      // Stop any existing Quagga instance
      if (typeof Quagga !== "undefined" && Quagga.initialized()) {
        Quagga.stop();
        Quagga.close();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      cameraFeed.srcObject = stream;
      state.cameraStream = stream;
      state.cameraActive = true;

      cameraPlaceholder.style.display = "none";
      cameraFeed.style.display = "block";

      startCameraBtn.style.display = "none";
      stopCameraBtn.style.display = "flex";

      startBarcodeDetection();
      showMessage("Camera started", "success");
    } catch (err) {
      console.error("Camera error:", err);
      if (err.name === "NotAllowedError") {
        showMessage("Camera permission denied. Please enable camera permissions in your browser.", "error");
      } else if (err.name === "NotFoundError") {
        showMessage("No camera found on this device", "error");
      } else if (err.name === "NotReadableError") {
        showMessage("Camera is already in use by another application", "error");
      } else {
        showMessage("Error accessing camera: " + err.message, "error");
      }
      
      // Reset camera UI on error
      cameraFeed.style.display = "none";
      cameraPlaceholder.style.display = "flex";
      startCameraBtn.style.display = "flex";
      stopCameraBtn.style.display = "none";
    }
  }

  function stopCamera() {
    // Stop Quagga2
    if (typeof Quagga !== "undefined") {
      try {
        Quagga.stop();
      } catch (e) {
        console.error("Error stopping Quagga:", e);
      }
    }

    // Stop camera stream
    if (state.cameraStream) {
      state.cameraStream.getTracks().forEach((track) => track.stop());
      state.cameraStream = null;
      state.cameraActive = false;
    }

    cameraFeed.srcObject = null;
    cameraFeed.style.display = "none";
    cameraPlaceholder.style.display = "flex";

    startCameraBtn.style.display = "flex";
    stopCameraBtn.style.display = "none";

    showMessage("Camera stopped", "info");
  }

  function startBarcodeDetection() {
    if (typeof Quagga === "undefined") {
      showMessage("Barcode library not loaded", "error");
      return;
    }

    try {
      Quagga.init(
        {
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: cameraFeed,
            constraints: {
              facingMode: { ideal: "environment" },
              width: { min: 320, ideal: 640 },
              height: { min: 240, ideal: 480 }
            }
          },
          decoder: {
            workers: { numWorkers: 2 },
            multiple: false,
            formats: ["code_128", "code_39", "code_93", "ean_13", "ean_8", "upc_a", "upc_e", "qr"]
          },
          locator: { halfSample: true, patchSize: "medium" },
          frequency: 10
        },
        function (err) {
          if (err) {
            console.error("Quagga init error:", err);
            showMessage("Barcode scanner initialization failed", "error");
            return;
          }

          try {
            Quagga.start();

            Quagga.onDetected(function (result) {
              if (result && result.codeResult && result.codeResult.code) {
                const barcode = result.codeResult.code;
                scanBarcode(barcode);
                if (navigator.vibrate) navigator.vibrate(200);
                showMessage(`Detected: ${barcode}`, "success");
              }
            });

            Quagga.onProcessingError(function (err) {
              console.warn("Quagga processing error:", err);
            });
          } catch (startErr) {
            console.error("Quagga start error:", startErr);
          }
        }
      );
    } catch (err) {
      console.error("Barcode detection error:", err);
      showMessage("Barcode detection error: " + err.message, "error");
    }
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
    if (mode === "camera" && !state.cameraActive) {
      startCamera();
    } else if (mode !== "camera" && state.cameraActive) {
      stopCamera();
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

  function proceedAsDebt() {
    if (state.cart.length === 0) {
      showMessage("Cart is empty", "error");
      return;
    }

    sessionStorage.setItem("posCart", JSON.stringify({
      items: state.cart,
      subtotal: state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      isDebt: true
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
  stopCameraBtn.addEventListener("click", stopCamera);

  // Cart
  clearCartBtn.addEventListener("click", clearCart);
  checkoutBtn.addEventListener("click", proceedToCheckout);
  listAsDebtBtn.addEventListener("click", proceedAsDebt);

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
