(function () {
  if (window.appDialog) return;

  const originalAlert = window.alert.bind(window);
  const iconByType = {
    info: "info",
    success: "check-circle-2",
    warning: "triangle-alert",
    error: "circle-alert"
  };

  const colorByType = {
    info: "#4f46e5",
    success: "#16a34a",
    warning: "#d97706",
    error: "#dc2626"
  };

  let mounted = false;
  let overlay;
  let titleEl;
  let messageEl;
  let iconWrap;
  let iconEl;
  let cancelBtn;
  let confirmBtn;

  function mount() {
    if (mounted) return;

    const style = document.createElement("style");
    style.textContent = `
      .app-dialog-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.45);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 4000;
        padding: 1rem;
      }
      .app-dialog-card {
        width: 100%;
        max-width: 420px;
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.2);
        overflow: hidden;
        font-family: Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .app-dialog-head {
        display: flex;
        align-items: center;
        gap: .7rem;
        padding: 1rem 1.1rem;
        border-bottom: 1px solid #eef2f7;
      }
      .app-dialog-icon-wrap {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: #eef2ff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .app-dialog-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        color: #1a2035;
      }
      .app-dialog-body {
        padding: 1rem 1.1rem 1.2rem;
        color: #334155;
        font-size: .95rem;
        line-height: 1.45;
        white-space: pre-wrap;
      }
      .app-dialog-actions {
        padding: .85rem 1.1rem 1rem;
        display: flex;
        gap: .65rem;
        justify-content: flex-end;
      }
      .app-dialog-btn {
        border: 1px solid #dbe4ee;
        background: #fff;
        color: #334155;
        border-radius: 10px;
        padding: .55rem 1rem;
        font-size: .9rem;
        font-weight: 600;
        cursor: pointer;
      }
      .app-dialog-btn.primary {
        color: #fff;
        background: #4f46e5;
        border-color: #4f46e5;
      }
    `;

    overlay = document.createElement("div");
    overlay.className = "app-dialog-overlay";
    overlay.innerHTML = `
      <div class="app-dialog-card" role="dialog" aria-modal="true" aria-live="polite">
        <div class="app-dialog-head">
          <span class="app-dialog-icon-wrap"><i data-lucide="info"></i></span>
          <h3 class="app-dialog-title">Notice</h3>
        </div>
        <div class="app-dialog-body"></div>
        <div class="app-dialog-actions">
          <button type="button" class="app-dialog-btn" data-role="cancel">Cancel</button>
          <button type="button" class="app-dialog-btn primary" data-role="confirm">OK</button>
        </div>
      </div>
    `;

    document.head.appendChild(style);
    document.body.appendChild(overlay);

    titleEl = overlay.querySelector(".app-dialog-title");
    messageEl = overlay.querySelector(".app-dialog-body");
    iconWrap = overlay.querySelector(".app-dialog-icon-wrap");
    iconEl = iconWrap.querySelector("i");
    cancelBtn = overlay.querySelector("[data-role='cancel']");
    confirmBtn = overlay.querySelector("[data-role='confirm']");

    mounted = true;
  }

  function drawIcon(type) {
    const color = colorByType[type] || colorByType.info;
    iconWrap.style.background = `${color}1A`;
    iconEl.setAttribute("data-lucide", iconByType[type] || iconByType.info);
    iconEl.style.color = color;
    confirmBtn.style.background = color;
    confirmBtn.style.borderColor = color;
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  function show(options) {
    mount();

    const {
      title = "Notice",
      message = "",
      type = "info",
      confirmText = "OK",
      cancelText = "Cancel",
      showCancel = false
    } = options || {};

    titleEl.textContent = title;
    messageEl.textContent = String(message == null ? "" : message);
    confirmBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;
    cancelBtn.style.display = showCancel ? "inline-flex" : "none";

    drawIcon(type);

    overlay.style.display = "flex";

    return new Promise((resolve) => {
      const onConfirm = () => {
        cleanup();
        resolve(true);
      };
      const onCancel = () => {
        cleanup();
        resolve(false);
      };
      const onOverlay = (event) => {
        if (event.target === overlay) onCancel();
      };
      const onKey = (event) => {
        if (event.key === "Escape") onCancel();
      };

      function cleanup() {
        overlay.style.display = "none";
        confirmBtn.removeEventListener("click", onConfirm);
        cancelBtn.removeEventListener("click", onCancel);
        overlay.removeEventListener("click", onOverlay);
        document.removeEventListener("keydown", onKey);
      }

      confirmBtn.addEventListener("click", onConfirm);
      cancelBtn.addEventListener("click", onCancel);
      overlay.addEventListener("click", onOverlay);
      document.addEventListener("keydown", onKey);
    });
  }

  window.appDialog = {
    alert(message, options) {
      return show({
        title: options && options.title ? options.title : "Notice",
        message,
        type: options && options.type ? options.type : "info",
        confirmText: options && options.confirmText ? options.confirmText : "OK",
        showCancel: false
      });
    },
    confirm(message, options) {
      return show({
        title: options && options.title ? options.title : "Please Confirm",
        message,
        type: options && options.type ? options.type : "warning",
        confirmText: options && options.confirmText ? options.confirmText : "Confirm",
        cancelText: options && options.cancelText ? options.cancelText : "Cancel",
        showCancel: true
      });
    }
  };

  window.alert = function (message) {
    if (document.body) {
      window.appDialog.alert(message, { title: "Notice", type: "info" });
      return;
    }
    originalAlert(message);
  };
})();