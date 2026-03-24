/**
 * Modern POS System - Main JavaScript
 * Handles barcode scanning, camera, cart management, and checkout
 * Uses responsive, professional UI with dynamic tabs and navbar
 */

document.addEventListener("DOMContentLoaded", () => {
  // ═══════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  const state = {
    cart: [],
    scannerMode: "barcode", // barcode, search, camera
    cameraActive: false,
    cameraStream: null,
    videoCanvas: null,
    tax_rate: 0.0, // Can be configured
    debounceTimers: {}
  };

  // ═══════════════════════════════════════════════════════════════════════
  // DOM ELEMENTS
  // ═══════════════════════════════════════════════════════════════════════

  // Scanner tabs
  const scannerTabs = document.querySelectorAll(".tab-button[data-scanner]");
  const tabContents = document.querySelectorAll(".tab-content");

  // Inputs
  const barcodeInput = document.getElementById("barcodeInput");
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");

  // Camera elements
  const cameraFeed = document.getElementById("cameraFeed");
  const cameraPlaceholder = document.getElementById("cameraPlaceholder");
  const startCameraBtn = document.getElementById("startCameraBtn");
  const stopCameraBtn = document.getElementById("stopCameraBtn");

  // Cart elements
  const cartItems = document.getElementById("cartItems");
  const subtotalEl = document.getElementById("subtotal");
  const taxAmountEl = document.getElementById("taxAmount");
  const totalAmountEl = document.getElementById("totalAmount");
  const clearCartBtn = document.getElementById("clearCartBtn");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const listAsDebtBtn = document.getElementById("listAsDebtBtn");

  // Toast notification
  const messageToast = document.getElementById("messageToast");
  const toastMessage = document.getElementById("toastMessage");

  // Navbar elements
  const navLinks = document.querySelectorAll(".nav-link");

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
    let subtotal = 0;
    state.cart.forEach((item) => {
      subtotal += item.price * item.quantity;
    });

    const tax = subtotal * state.tax_rate;
    const total = subtotal + tax;

    subtotalEl.textContent = formatPeso(subtotal);
    taxAmountEl.textContent = formatPeso(tax);
    totalAmountEl.textContent = formatPeso(total);

    // Enable/disable checkout buttons
    checkoutBtn.disabled = state.cart.length === 0;
    listAsDebtBtn.disabled = state.cart.length === 0;
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
        type: product.type,
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
        <p class="text-muted text-center">No items in cart</p>
      `;
      return;
    }

    cartItems.innerHTML = state.cart
      .map((item) => {
        const itemTotal = item.price * item.quantity;
        return `
          <div class="cart-item" style="display: flex; gap: 1rem; padding: 1rem; background: #f9fafb; border-radius: 0.5rem; margin-bottom: 0.5rem; align-items: center;">
            <div style="flex: 1;">
              <p style="font-weight: 500; color: #1a202c; margin-bottom: 0.25rem;">${item.name}</p>
              <p style="font-size: 0.875rem; color: #718096;">${formatPeso(item.price)} each</p>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <button type="button" onclick="window.updateItemQty(${item.id}, -1)" class="btn btn-sm" style="width: 28px; height: 28px; padding: 0;">−</button>
              <input type="number" value="${item.quantity}" readonly style="width: 40px; text-align: center; border: 1px solid #e2e8f0; border-radius: 0.25rem; padding: 0.25rem;">
              <button type="button" onclick="window.updateItemQty(${item.id}, 1)" class="btn btn-sm" style="width: 28px; height: 28px; padding: 0;">+</button>
            </div>
            <div style="font-weight: 600; color: #2d3748; min-width: 80px; text-align: right;">${formatPeso(itemTotal)}</div>
            <button type="button" onclick="window.removeItemFromCart(${item.id})" class="btn btn-sm btn-secondary" style="width: 28px; height: 28px; padding: 0;">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        `;
      })
      .join("");
    
    lucide.createIcons();
  }

  window.updateItemQty = function (productId, delta) {
    const item = state.cart.find((item) => item.id === productId);
    if (item) {
      updateCartQuantity(productId, item.quantity + delta);
    }
  };

  window.removeItemFromCart = function (productId) {
    removeFromCart(productId);
  };

  window.addProductToCart = function (product) {
    addToCart(product);
    clearSearchResults();
  };

  // ═══════════════════════════════════════════════════════════════════════
  // BARCODE SCANNING
  // ═══════════════════════════════════════════════════════════════════════

  async function scanBarcode(barcode) {
    if (!barcode.trim()) {
      showMessage("Please enter a barcode", "error");
      return;
    }

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

      if (data.success && data.product) {
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
      clearSearchResults();
      return;
    }

    try {
      const response = await fetch(`/pos/api/products?search=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success && data.items && data.items.length > 0) {
        searchResults.innerHTML = data.items
          .map((item) => {
            const outOfStock = item.stock === 0;
            return `
              <div style="padding: 1rem; background: #f9fafb; border-radius: 0.5rem; margin-bottom: 0.5rem; cursor: pointer; transition: background 0.2s;" 
                   onmouseover="this.style.background='#f0f1f3'" 
                   onmouseout="this.style.background='#f9fafb'"
                   onclick="window.addProductToCart({id: ${item.id}, name: '${item.name.replace(/"/g, '\\"')}', price: ${item.price}, stock: ${item.stock}, type: '${item.type}'})">
                <p style="font-weight: 500; color: #1a202c; margin-bottom: 0.25rem;">${item.name}</p>
                <p style="font-size: 0.875rem; color: #718096; margin-bottom: 0.5rem;">Barcode: ${item.barcode || "N/A"}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 600; color: #3b5bdb;">${formatPeso(item.price)}</span>
                  <span style="font-size: 0.875rem; padding: 0.25rem 0.75rem; border-radius: 0.25rem; background: ${outOfStock ? '#fee' : '#efe'}; color: ${outOfStock ? '#c33' : '#3c3'};">
                    ${outOfStock ? 'Out of Stock' : `${item.stock} in stock`}
                  </span>
                </div>
              </div>
            `;
          })
          .join("");
      } else {
        searchResults.innerHTML = '<p style="padding: 1rem; color: #718096; text-align: center;">No products found</p>';
      }
    } catch (err) {
      console.error("Search error:", err);
      showMessage("Error searching products", "error");
    }
  }

  function clearSearchResults() {
    searchResults.innerHTML = "";
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CAMERA BARCODE SCANNING
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

      // Hide placeholder, show video
      cameraPlaceholder.style.display = "none";
      cameraFeed.style.display = "block";

      // Update button states
      startCameraBtn.style.display = "none";
      stopCameraBtn.style.display = "flex";

      // Initialize barcode detection from camera
      startBarcodeDetection();

      showMessage("Camera started. Point at a barcode to scan.", "success");
    } catch (err) {
      console.error("Camera error:", err);
      if (err.name === "NotAllowedError") {
        showMessage("Camera permission denied. Please allow camera access.", "error");
      } else if (err.name === "NotFoundError") {
        showMessage("No camera found on this device", "error");
      } else {
        showMessage("Error accessing camera: " + err.message, "error");
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
    cameraFeed.style.display = "none";
    cameraPlaceholder.style.display = "flex";

    startCameraBtn.style.display = "flex";
    stopCameraBtn.style.display = "none";

    showMessage("Camera stopped", "info");
  }

  function startBarcodeDetection() {
    // Use Quagga2 (quagga.js) for barcode detection
    if (typeof Quagga === "undefined") {
      showMessage("Barcode detection library not loaded", "error");
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
              facingMode: "environment",
              width: { min: 320 },
              height: { min: 240 }
            }
          },
          decoder: {
            workers: {
              numWorkers: 2
            },
            multiple: false,
            formats: [
              "code_128",
              "code_39",
              "code_93",
              "ean_13",
              "ean_8",
              "upc_a",
              "upc_e",
              "ean",
              "qr"
            ]
          },
          locator: {
            halfSample: true,
            patchSize: "medium"
          },
          frequency: 10,
          debug: {
            drawBoundingBox: true,
            showFrequency: false,
            showPattern: false,
            showCanvas: false,
            showImage: false
          }
        },
        function (err) {
          if (err) {
            console.error("Quagga initialization error:", err);
            // Fallback to manual barcode input
            return;
          }

          Quagga.start();

          // Handle detected barcodes
          Quagga.onDetected(function (result) {
            if (result && result.codeResult && result.codeResult.code) {
              const barcode = result.codeResult.code;
              
              // Auto-scan the barcode
              scanBarcode(barcode);
              
              // Vibrate if available
              if (navigator.vibrate) {
                navigator.vibrate(200);
              }

              showMessage(`Barcode detected: ${barcode}`, "success");
            }
          });

          // Handle errors silently
          Quagga.onProcessingError(function (err) {
            // Silently ignore - normal during scanning
          });
        }
      );
    } catch (err) {
      console.error("Barcode detection error:", err);
      showMessage("Barcode scanning unavailable. Use manual input.", "info");
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SCANNER MODE TABS
  // ═══════════════════════════════════════════════════════════════════════

  function switchScannerTab(mode) {
    state.scannerMode = mode;

    // Update tab buttons
    scannerTabs.forEach((tab) => {
      if (tab.dataset.scanner === mode) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });

    // Update tab contents
    tabContents.forEach((content) => {
      if (content.id === `${mode}-tab`) {
        content.classList.add("active");
      } else {
        content.classList.remove("active");
      }
    });

    // Handle camera state
    if (mode === "camera" && !state.cameraActive) {
      startCamera();
    } else if (mode !== "camera" && state.cameraActive) {
      stopCamera();
    }

    // Focus appropriate input
    if (mode === "barcode") {
      barcodeInput.focus();
    } else if (mode === "search") {
      searchInput.focus();
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

    // Store cart in sessionStorage
    sessionStorage.setItem("posCart", JSON.stringify({
      items: state.cart,
      subtotal: state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      isDebt: false
    }));

    // Redirect to checkout
    window.location.href = "/pos/checkout";
  }

  function proceedAsDebt() {
    if (state.cart.length === 0) {
      showMessage("Cart is empty", "error");
      return;
    }

    // Store cart in sessionStorage
    sessionStorage.setItem("posCart", JSON.stringify({
      items: state.cart,
      subtotal: state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      isDebt: true
    }));

    // Redirect to checkout
    window.location.href = "/pos/checkout";
  }

  // ═══════════════════════════════════════════════════════════════════════
  // NAVBAR TAB SWITCHING
  // ═══════════════════════════════════════════════════════════════════════

  function setupNavigation() {
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const tab = link.dataset.tab;
        if (tab === "pos") {
          // Already on POS page
          navLinks.forEach((l) => l.classList.remove("active"));
          link.classList.add("active");
        } else {
          // Navigate to other page
          const paths = {
            products: "/products",
            debts: "/debts",
            reports: "/reports"
          };
          if (paths[tab]) {
            window.location.href = paths[tab];
          }
        }
      });
    });

    // Mark POS as active on initial load
    navLinks.forEach((link) => {
      if (link.dataset.tab === "pos") {
        link.classList.add("active");
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════════════════

  // Scanner tab switching
  scannerTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      switchScannerTab(tab.dataset.scanner);
    });
  });

  // Barcode input
  barcodeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      scanBarcode(barcodeInput.value);
    }
  });

  // Search input with debounce
  searchInput.addEventListener("input", (e) => {
    clearTimeout(state.debounceTimers.search);
    state.debounceTimers.search = setTimeout(() => {
      searchProducts(e.target.value);
    }, 300);
  });

  // Camera buttons
  startCameraBtn.addEventListener("click", startCamera);
  stopCameraBtn.addEventListener("click", stopCamera);

  // Cart buttons
  clearCartBtn.addEventListener("click", clearCart);
  checkoutBtn.addEventListener("click", proceedToCheckout);
  listAsDebtBtn.addEventListener("click", proceedAsDebt);

  // ═══════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════

  function initialize() {
    renderCart();
    calculateTotals();
    setupNavigation();
    barcodeInput.focus();

    // Initialize Lucide icons
    lucide.createIcons();

    // Set up barcode input to auto-focus after any action
    barcodeInput.addEventListener("blur", () => {
      if (state.scannerMode === "barcode") {
        setTimeout(() => barcodeInput.focus(), 100);
      }
    });
  }

  // Run initialization
  initialize();
});
