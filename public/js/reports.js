document.addEventListener("DOMContentLoaded", () => {
  const periodSelect = document.getElementById("periodSelect");
  const metricsGrid = document.getElementById("metricsGrid");
  const topList = document.getElementById("topList");
  const highlightCard = document.getElementById("highlightCard");
  const listTitle = document.getElementById("listTitle");
  const tabButtons = document.querySelectorAll(".segment");
  const reportsGrid = document.querySelector(".reports-grid");
  const topListCard = document.querySelector(".top-list-card");

  const state = {
    period: "7",
    activeTab: "products",
    data: null
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

    highlightCard.innerHTML = `
      <h3 class="highlight-title">${highlightTitles[state.period]}</h3>
      <div class="highlight-frame">
        <div class="highlight-art" aria-hidden="true">${highlight.art}</div>
      </div>
      <div class="highlight-name">${highlight.name}</div>
      <p class="highlight-meta">${highlight.meta}</p>
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
    reportsGrid.classList.toggle("categories-view", !isProducts);
    topListCard.hidden = !isProducts;
  }

  function renderTopList(list) {
    listTitle.textContent = "Top Selling Products";

    if (!list || list.length === 0) {
      topList.innerHTML = `<li class="top-item"><span>No data available for this period.</span></li>`;
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
    } else {
      renderCategoryPieChart(categories);
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
      renderAll();
    } catch (err) {
      console.error("Failed to load report metrics:", err);
      metricsGrid.innerHTML = `<p style="padding:1rem;color:#d83c6a">Failed to load metrics. Please try again.</p>`;
    }
  }

  tabButtons.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tab.classList.add("active");
      state.activeTab = tab.dataset.tab;
      renderAll();
    });
  });

  periodSelect.addEventListener("change", (event) => {
    state.period = event.target.value;
    fetchAndRender(state.period);
  });

  document.getElementById("zReadingBtn").addEventListener("click", () => {
    showToast("Z-reading generated for today.");
  });

  document.getElementById("downloadBtn").addEventListener("click", () => {
    const mode = state.activeTab === "products" ? "products" : "categories";
    showToast(`Downloaded ${mode} report for last ${state.period} days.`);
  });

  fetchAndRender(state.period);
});
