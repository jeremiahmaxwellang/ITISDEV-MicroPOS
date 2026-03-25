document.addEventListener("DOMContentLoaded", () => {
  const periodSelect = document.getElementById("periodSelect");
  const metricsGrid = document.getElementById("metricsGrid");
  const topList = document.getElementById("topList");
  const highlightCard = document.getElementById("highlightCard");
  const listTitle = document.getElementById("listTitle");
  const tabButtons = document.querySelectorAll(".segment");
  const reportsGrid = document.querySelector(".reports-grid");
  const topListCard = document.querySelector(".top-list-card");

  const recommendationsCard = document.getElementById("recommendationsCard");
  const recommendationsList = document.getElementById("recommendationsList");
  const forecastCard = document.getElementById("forecastCard");
  const forecastList = document.getElementById("forecastList");

  const state = {
    period: "7",
    activeTab: "products",
    data: null,
    recommendations: null,
    forecast: null
  };

  const cache = {};

  const periodLabels = {
    "7": "Weekly Sales",
    "30": "Monthly Sales",
    "90": "Quarterly Sales"
  };

  const highlightTitles = {
    "7": "Best-Seller Product of the Week",
    "30": "Best-Seller Product of the Month",
    "90": "Best-Seller Product of the Quarter"
  };

  function peso(value) {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2
    }).format(value);
  }

  function renderMetrics(metrics) {
    const cards = [
      {
        css: "metric-green",
        label: periodLabels[state.period],
        value: peso(metrics.sales),
        icon: "PHP"
      },
      {
        css: "metric-gold",
        label: "Debt Balance",
        value: peso(metrics.debt),
        icon: "DB"
      },
      {
        css: "metric-rose",
        label: "Total Debtors",
        value: `${metrics.debtors}`,
        icon: "TD"
      },
      {
        css: "metric-violet",
        label: "Total Customers",
        value: `${metrics.customers}`,
        icon: "TC"
      }
    ];

    metricsGrid.innerHTML = cards
      .map(
        (card) => `
        <article class="metric-card ${card.css}">
          <div class="metric-icon">${card.icon}</div>
          <div class="metric-text">
            <p>${card.label}</p>
            <h3>${card.value}</h3>
          </div>
        </article>
      `
      )
      .join("");
  }

  function renderHighlight(highlight) {
    if (!highlight) {
      highlightCard.innerHTML = `<p class="highlight-meta">No sales data available for this period.</p>`;
      return;
    }

    const artMarkup = highlight.categoryImage
      ? `<img class="highlight-image" src="${highlight.categoryImage}" alt="${highlight.category || "Product"} category image">`
      : `<div class="highlight-art" aria-hidden="true">${highlight.art}</div>`;

    const categoryMeta = highlight.category ? ` | Category: ${highlight.category}` : "";

    highlightCard.innerHTML = `
      <h3 class="highlight-title">${highlightTitles[state.period]}</h3>
      <div class="highlight-frame">
        ${artMarkup}
      </div>
      <div class="highlight-name">${highlight.name}</div>
      <p class="highlight-meta">${highlight.meta}${categoryMeta}</p>
    `;
  }

  function renderCategoryPieChart(categories) {
    if (!categories || categories.length === 0) {
      highlightCard.innerHTML = `<p class="highlight-meta">No category data available for this period.</p>`;
      return;
    }

    const totalRevenue = categories.reduce((sum, item) => sum + item.revenue, 0);
    const colors = ["#2f62da", "#7e1ef2", "#f39a00", "#11ba7a", "#6f778d", "#d83c6a"];

    let currentAngle = 0;

    const slices = categories
      .map((item, index) => {
        const percent = totalRevenue ? (item.revenue / totalRevenue) * 100 : 0;
        const start = currentAngle;
        const end = currentAngle + percent;
        currentAngle = end;
        return `${colors[index % colors.length]} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
      })
      .join(", ");

    const labels = categories
      .map((item, index) => {
        const percent = totalRevenue ? (item.revenue / totalRevenue) * 100 : 0;
        return `
          <li class="pie-legend-item">
            <span class="pie-dot" style="background:${colors[index % colors.length]}"></span>
            <span>${item.name}</span>
            <strong>${percent.toFixed(0)}%</strong>
          </li>
        `;
      })
      .join("");

    highlightCard.innerHTML = `
      <h3 class="highlight-title pie-title">Category Sales Share</h3>
      <p class="highlight-meta">Revenue distribution for the last ${state.period} days.</p>
      <div class="pie-chart-wrap">
        <div class="pie-chart" style="background: conic-gradient(${slices});" role="img" aria-label="Category sales distribution pie chart"></div>
      </div>
      <ul class="pie-legend">
        ${labels}
      </ul>
    `;
  }

  function syncLayoutByTab() {
    const isProducts = state.activeTab === "products";
    const isCategories = state.activeTab === "categories";
    const isRecommendations = state.activeTab === "recommendations";
    const isForecast = state.activeTab === "forecast";
    reportsGrid.classList.toggle("categories-view", isCategories);
    topListCard.hidden = !isProducts;
    highlightCard.hidden = !isProducts && !isCategories;
    recommendationsCard.hidden = !isRecommendations;
    forecastCard.hidden = !isForecast;
  }

  function renderForecast(list) {
    if (!list || list.length === 0) {
      forecastList.innerHTML = `<li style="padding:1rem;color:var(--text-sub,#888);list-style:none;">No forecast data for this period.</li>`;
      return;
    }

    forecastList.innerHTML = list.map(item => `
      <li class="recommendation-item">
        <div><strong>${item.name}</strong> <span style="color:#6b7280">(${item.category || "Other"})</span></div>
        <div>Avg/day: <strong>${item.avgDailyUnits}</strong> unit(s)</div>
        <div>Forecast (7d): <strong>${item.forecastUnits}</strong> unit(s)</div>
        <div>Current stock: <strong>${item.currentStock}</strong></div>
        <div style="color:${item.stockoutRisk ? "#d83c6a" : "#059669"};">Projected balance: <strong>${item.projectedBalance}</strong></div>
      </li>
    `).join("");
  }
  function renderRecommendations(list) {
    if (!list || list.length === 0) {
      recommendationsList.innerHTML = `<li style="padding:1rem;color:var(--text-sub,#888);list-style:none;">No recommendations at this time. Your inventory is well stocked!</li>`;
      return;
    }
    recommendationsList.innerHTML = list.map(item => `
      <li class="recommendation-item">
        <div><strong>${item.name}</strong></div>
        <div>Current Stock: <strong>${item.stock}</strong></div>
        <div>Sold (last ${state.period}d): <strong>${item.unitsSold}</strong></div>
        <div>Recommended Stock: <strong>${item.recommendedStock}</strong></div>
        <div style="color:#d83c6a;">Reorder: <strong>${item.reorderAmount}</strong> unit(s)</div>
      </li>
    `).join("");
  }

  function renderTopList(list) {
    listTitle.textContent = "Top Selling Products";

    if (!list || list.length === 0) {
      topList.innerHTML = `<li style="padding:1rem;color:var(--text-sub,#888);list-style:none;">No data available for this period.</li>`;
      return;
    }

    topList.innerHTML = list
      .map(
        (item, index) => `
          <li class="top-item" style="animation-delay:${index * 0.06}s">
            <div class="top-rank">#${index + 1}</div>
            <div class="top-info">
              <strong>${item.name}</strong>
              <span>${item.units} units sold</span>
            </div>
            <div class="top-amount">
              <strong>${peso(item.revenue)}</strong>
              <span>Revenue</span>
            </div>
          </li>
        `
      )
      .join("");
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
    }, 2200);
  }

  function renderAll() {
    if (!state.data) return;
    const { metrics, topProducts, highlight, categories } = state.data;

    renderMetrics(metrics);
    syncLayoutByTab();

    if (state.activeTab === "products") {
      renderHighlight(highlight);
      renderTopList(topProducts);
    } else if (state.activeTab === "categories") {
      renderCategoryPieChart(categories);
    } else if (state.activeTab === "forecast") {
      renderForecast(state.forecast);
    } else if (state.activeTab === "recommendations") {
      renderRecommendations(state.recommendations);
    }
  }

  async function fetchAndRender(period) {
    if (cache[period]) {
      state.data = cache[period];
      renderAll();
      return;
    }

    metricsGrid.innerHTML = `<p style="padding:1rem;color:var(--text-muted,#888)">Loading metrics...</p>`;

    try {
      const response = await fetch(`/reports/metrics?period=${encodeURIComponent(period)}`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      cache[period] = data;
      state.data = data;

      if (state.activeTab === "recommendations") {
        await fetchRecommendations();
      }
      if (state.activeTab === "forecast") {
        await fetchForecast();
      }

      renderAll();
    } catch (err) {
      console.error("Failed to load report metrics:", err);
      metricsGrid.innerHTML = `<p style="padding:1rem;color:#d83c6a">Failed to load metrics. Please try again.</p>`;
    }
  }

  tabButtons.forEach((tab) => {
    tab.addEventListener("click", async () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tab.classList.add("active");
      state.activeTab = tab.dataset.tab;
      if (state.activeTab === "recommendations") {
        await fetchRecommendations();
      }
      if (state.activeTab === "forecast") {
        await fetchForecast();
      }
      renderAll();
    });
  });
  async function fetchRecommendations() {
    recommendationsList.innerHTML = `<li style="padding:1rem;color:var(--text-muted,#888)">Loading recommendations...</li>`;
    try {
      const response = await fetch(`/products/recommendations?period=${encodeURIComponent(state.period)}`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      state.recommendations = data.recommendations || [];
    } catch (err) {
      console.error("Failed to load recommendations:", err);
      state.recommendations = [];
      recommendationsList.innerHTML = `<li style="padding:1rem;color:#d83c6a">Failed to load recommendations. Please try again.</li>`;
    }
  }

  async function fetchForecast() {
    forecastList.innerHTML = `<li style="padding:1rem;color:var(--text-muted,#888)">Loading forecast...</li>`;
    try {
      const response = await fetch(`/reports/forecast?period=${encodeURIComponent(state.period)}&horizonDays=7`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      state.forecast = data.forecast || [];
    } catch (err) {
      console.error("Failed to load forecast:", err);
      state.forecast = [];
      forecastList.innerHTML = `<li style="padding:1rem;color:#d83c6a">Failed to load forecast. Please try again.</li>`;
    }
  }

  periodSelect.addEventListener("change", (event) => {
    state.period = event.target.value;
    state.recommendations = null;
    state.forecast = null;
    fetchAndRender(state.period);
  });


  document.getElementById("downloadBtn").addEventListener("click", () => {
    console.log("[Report Download] Download button clicked. Period:", state.period, "| Active tab:", state.activeTab);

    if (!state.data) {
      console.warn("[Report Download] Aborted — no data loaded for period:", state.period);
      showToast("No data to download.");
      return;
    }

    const periodLabel = { "7": "Last 7 Days", "30": "Last 30 Days", "90": "Last 90 Days" }[state.period] || `Last ${state.period} Days`;
    const { metrics, topProducts, categories } = state.data;

    function escapeCell(val) {
      const s = String(val ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    }

    function row(...cells) {
      return cells.map(escapeCell).join(",");
    }

    const lines = [
      row("MicroPOS Sales Report"),
      row("Period:", periodLabel),
      row("Generated:", new Date().toLocaleString("en-PH")),
      "",
      row("SUMMARY METRICS"),
      row("Metric", "Value"),
      row(periodLabels[state.period] || "Sales", metrics.sales.toFixed(2)),
      row("Debt Balance", metrics.debt.toFixed(2)),
      row("Total Debtors", metrics.debtors),
      row("Total Customers", metrics.customers),
      "",
      row("TOP SELLING PRODUCTS"),
      row("Rank", "Product Name", "Category", "Units Sold", "Revenue (PHP)"),
      ...topProducts.map((p, i) => row(i + 1, p.name, p.category || "", p.units, p.revenue.toFixed(2))),
      "",
      row("SALES BY CATEGORY"),
      row("Category", "Units Sold", "Revenue (PHP)"),
      ...categories.map(c => row(c.name, c.units, c.revenue.toFixed(2)))
    ];

    const csv = lines.join("\r\n");
    const filename = `micropos-report-${state.period}days-${new Date().toISOString().slice(0, 10)}.csv`;

    console.log("[Report Download] CSV built. Rows:", lines.length, "| Top products:", topProducts.length, "| Categories:", categories.length);

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("[Report Download] Success — file triggered for download:", filename);
    showToast(`Report downloaded for ${periodLabel}.`);
  });

  fetchAndRender(state.period);
});
