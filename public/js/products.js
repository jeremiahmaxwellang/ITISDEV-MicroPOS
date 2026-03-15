document.addEventListener("DOMContentLoaded", () => {
  const productBody = document.getElementById("productsBody");
  const searchInput = document.getElementById("searchInput");
  const categorySelect = document.getElementById("categorySelect");
  const addProductBtn = document.getElementById("addProductBtn");
  const exportBtn = document.getElementById("exportBtn");
  const segmentTabs = document.querySelectorAll(".segment-tab");

  const state = {
    search: "",
    category: "all",
    items: [],
    categoriesLoaded: false
  };

  function peso(value) {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2
    }).format(value);
  }

  function getIconByCategory(category) {
    const key = String(category || "").toLowerCase();

    if (key.includes("beverage")) return "BV";
    if (key.includes("canned")) return "CG";
    if (key.includes("instant")) return "IF";
    if (key.includes("snack")) return "SN";
    if (key.includes("service")) return "SV";
    return "PR";
  }

  function showToast(message) {
    let toast = document.querySelector(".toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("show");

    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => {
      toast.classList.remove("show");
    }, 2000);
  }

  function renderRows(items) {
    if (!items.length) {
      productBody.innerHTML = `<tr><td colspan="6" class="empty">No products found.</td></tr>`;
      return;
    }

    productBody.innerHTML = items
      .map((item) => {
        const stockClass = item.lowStock || item.stock === 0 ? "stock-pill low" : "stock-pill";
        const stockText = item.stock === 0 ? "Out" : item.stock;

        return `
          <tr data-id="${item.id}">
            <td>
              <div class="product-cell">
                <span class="product-badge">${getIconByCategory(item.category)}</span>
                <strong>${item.name}</strong>
              </div>
            </td>
            <td>${item.manufacturer}</td>
            <td>${item.category}</td>
            <td><span class="price">${peso(item.price)}</span></td>
            <td><span class="${stockClass}">${stockText}</span></td>
            <td>
              <div class="row-actions">
                <button class="action-btn edit" type="button" data-edit="${item.id}" aria-label="Edit product ${item.name}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>
                  </svg>
                </button>
                <button class="action-btn delete" type="button" data-delete="${item.id}" aria-label="Delete product ${item.name}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                    <path d="M10 11v6"></path>
                    <path d="M14 11v6"></path>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function fillCategories(items) {
    if (state.categoriesLoaded) return;

    const categories = [...new Set(items.map((item) => item.category).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );

    categorySelect.innerHTML = `
      <option value="all">All Categories</option>
      ${categories.map((cat) => `<option value="${cat}">${cat}</option>`).join("")}
    `;

    state.categoriesLoaded = true;
  }

  async function loadProducts() {
    productBody.innerHTML = `<tr><td colspan="6" class="loading">Loading products...</td></tr>`;

    const query = new URLSearchParams({
      search: state.search,
      category: state.category
    });

    try {
      const response = await fetch(`/products/items?${query.toString()}`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const payload = await response.json();
      state.items = Array.isArray(payload.items) ? payload.items : [];
      fillCategories(state.items);
      renderRows(state.items);
    } catch (err) {
      console.error("Failed to load products:", err);
      productBody.innerHTML = `<tr><td colspan="6" class="empty">Failed to load products.</td></tr>`;
    }
  }

  function debounce(fn, delay = 250) {
    let timeoutId;

    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => fn(...args), delay);
    };
  }

  searchInput.addEventListener(
    "input",
    debounce((event) => {
      state.search = event.target.value.trim();
      loadProducts();
    })
  );

  categorySelect.addEventListener("change", (event) => {
    state.category = event.target.value;
    loadProducts();
  });

  addProductBtn.addEventListener("click", () => {
    showToast("Add Product form is not wired yet.");
  });

  exportBtn.addEventListener("click", () => {
    if (!state.items.length) {
      showToast("No products data to export.");
      return;
    }

    const rows = [
      ["Product", "Manufacturer", "Category", "Price", "Stock"],
      ...state.items.map((item) => [item.name, item.manufacturer, item.category, item.price, item.stock])
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "");
            return value.includes(",") || value.includes("\"") || value.includes("\n")
              ? `"${value.replace(/\"/g, '""')}"`
              : value;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    showToast("Products exported.");
  });

  productBody.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit]");
    const deleteButton = event.target.closest("[data-delete]");

    if (editButton) {
      showToast(`Edit for product #${editButton.dataset.edit} coming soon.`);
      return;
    }

    if (deleteButton) {
      const itemId = Number(deleteButton.dataset.delete);
      state.items = state.items.filter((item) => item.id !== itemId);
      renderRows(state.items);
      showToast("Product removed from current list view.");
    }
  });

  segmentTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      segmentTabs.forEach((btn) => btn.classList.remove("active"));
      tab.classList.add("active");
      if (tab.textContent.trim() !== "Products") {
        showToast(`${tab.textContent.trim()} page is not connected yet.`);
      }
    });
  });

  loadProducts();
});
