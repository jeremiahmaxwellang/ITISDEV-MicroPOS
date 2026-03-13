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
    activeTab: "products"
  };

  const metricDataByPeriod = {
    "7": {
      sales: "17,234.59",
      debt: "7,302.00",
      debtors: 14,
      customers: 89
    },
    "30": {
      sales: "68,990.45",
      debt: "18,770.25",
      debtors: 31,
      customers: 242
    },
    "90": {
      sales: "196,232.10",
      debt: "42,511.90",
      debtors: 66,
      customers: 708
    }
  };

  const productsByPeriod = {
    "7": {
      highlight: {
        title: "Best-Seller Product of the Week",
        name: "Stik-O",
        art: "SO",
        meta: "450 units sold"
      },
      list: [
        { name: "Lucky Me Noodles", units: 245, revenue: 3185, profit: 735 },
        { name: "Coca-Cola 1.5L", units: 180, revenue: 2189, profit: 640 },
        { name: "Nescafe 3-in-1", units: 320, revenue: 4987, profit: 1120 },
        { name: "Century Tuna", units: 89, revenue: 1989, profit: 508 }
      ]
    },
    "30": {
      highlight: {
        title: "Best-Seller Product of the Month",
        name: "Lucky Me Noodles",
        art: "LM",
        meta: "1,950 units sold"
      },
      list: [
        { name: "Lucky Me Noodles", units: 1950, revenue: 21560, profit: 5740 },
        { name: "Nescafe 3-in-1", units: 1320, revenue: 18875, profit: 5410 },
        { name: "Coca-Cola 1.5L", units: 840, revenue: 11230, profit: 2985 },
        { name: "Stik-O", units: 760, revenue: 9740, profit: 2440 }
      ]
    },
    "90": {
      highlight: {
        title: "Best-Seller Product of the Quarter",
        name: "Nescafe 3-in-1",
        art: "N3",
        meta: "4,820 units sold"
      },
      list: [
        { name: "Nescafe 3-in-1", units: 4820, revenue: 73420, profit: 22115 },
        { name: "Lucky Me Noodles", units: 4600, revenue: 64980, profit: 16940 },
        { name: "Coca-Cola 1.5L", units: 2200, revenue: 28990, profit: 7790 },
        { name: "Stik-O", units: 2120, revenue: 25985, profit: 6390 }
      ]
    }
  };

  const categoriesByPeriod = {
    "7": [
      { name: "Instant Food", units: 610, revenue: 9122, profit: 2120 },
      { name: "Beverages", units: 430, revenue: 7989, profit: 1803 },
      { name: "Snacks", units: 355, revenue: 5122, profit: 1212 },
      { name: "Household", units: 188, revenue: 3001, profit: 860 }
    ],
    "30": [
      { name: "Instant Food", units: 2620, revenue: 39122, profit: 9420 },
      { name: "Beverages", units: 1990, revenue: 28540, profit: 7010 },
      { name: "Snacks", units: 1330, revenue: 18010, profit: 4240 },
      { name: "Household", units: 789, revenue: 12001, profit: 2985 }
    ],
    "90": [
      { name: "Instant Food", units: 7550, revenue: 118880, profit: 29810 },
      { name: "Beverages", units: 5920, revenue: 88320, profit: 20610 },
      { name: "Snacks", units: 3990, revenue: 54420, profit: 12750 },
      { name: "Household", units: 2280, revenue: 34612, profit: 8580 }
    ]
  };

  function peso(value) {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2
    }).format(value);
  }

  function renderMetrics() {
    const data = metricDataByPeriod[state.period];
    const cards = [
      {
        css: "metric-green",
        label: "Weekly Sales",
        value: `${peso(Number(data.sales.replace(/,/g, "")))}`,
        icon: "PHP"
      },
      {
        css: "metric-gold",
        label: "Debt Balance",
        value: `${peso(Number(data.debt.replace(/,/g, "")))}`,
        icon: "DB"
      },
      {
        css: "metric-rose",
        label: "Total Debtors",
        value: `${data.debtors}`,
        icon: "TD"
      },
      {
        css: "metric-violet",
        label: "Total Customers",
        value: `${data.customers}`,
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

  function renderHighlight() {
    const current = productsByPeriod[state.period].highlight;

    highlightCard.innerHTML = `
      <h3 class="highlight-title">${current.title}</h3>
      <div class="highlight-frame">
        <div class="highlight-art" aria-hidden="true">${current.art}</div>
      </div>
      <div class="highlight-name">${current.name}</div>
      <p class="highlight-meta">${current.meta}</p>
    `;
  }

  function renderCategoryPieChart() {
    const categories = categoriesByPeriod[state.period];
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

  function renderTopList() {
    const isProducts = state.activeTab === "products";
    const list = isProducts
      ? productsByPeriod[state.period].list
      : categoriesByPeriod[state.period];

    listTitle.textContent = isProducts ? "Top Selling Products" : "Top Categories";

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
              <span>Profit: ${peso(item.profit)}</span>
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
    renderMetrics();
    syncLayoutByTab();

    if (state.activeTab === "products") {
      renderHighlight();
      renderTopList();
      return;
    }

    renderCategoryPieChart();
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
    renderAll();
  });

  document.getElementById("zReadingBtn").addEventListener("click", () => {
    showToast("Z-reading generated for today.");
  });

  document.getElementById("downloadBtn").addEventListener("click", () => {
    const mode = state.activeTab === "products" ? "products" : "categories";
    showToast(`Downloaded ${mode} report for last ${state.period} days.`);
  });

  renderAll();
});
