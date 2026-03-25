/**
 * Shared Sidebar Component
 * Dynamically renders the navigation sidebar on every page.
 * Hover to expand — icons always visible, labels slide in on hover.
 */
(function () {
  'use strict';

  /** Nav items rendered in the main nav section */
  const NAV_ITEMS = [
    { href: '/pos',      icon: 'shopping-cart', label: 'Point of Sale' },
    { href: '/products', icon: 'package',        label: 'Products'      },
    { href: '/debts',    icon: 'file-text',      label: 'Debt Tracker'  },
    { href: '/transaction-verification', icon: 'badge-check', label: 'Transaction Verification' },
    { href: '/reports',  icon: 'bar-chart-2',    label: 'Reports', ownerOnly: true },
  ];

  /** Items pinned to the bottom of the sidebar */
  const BOTTOM_ITEMS = [
    { href: '/settings', icon: 'settings', label: 'Settings', cls: '' },
    { href: '/logout',   icon: 'log-out',  label: 'Logout',   cls: 'sidebar-logout-link', action: 'logout' },
  ];

  /** Returns true when the current URL matches this route */
  function isActive(href) {
    const path = window.location.pathname;
    if (href === '/' || href === '/logout') return false; // never mark logout/home as active
    return path === href || path.startsWith(href + '/');
  }

  /** Build a single nav link element */
  function buildLink(item) {
    const active = isActive(item.href) ? ' active' : '';
    const cls = (item.cls || '') + active;
    const action = item.action ? ` data-action="${item.action}"` : '';
    return `<a href="${item.href}" class="sidebar-link${cls ? ' ' + cls.trim() : ''}" title="${item.label}"${action}>
      <span class="sidebar-icon"><i data-lucide="${item.icon}"></i></span>
      <span class="sidebar-label">${item.label}</span>
    </a>`;
  }

  async function handleLogout(event) {
    event.preventDefault();

    try {
      await fetch('/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      window.location.href = '/';
    }
  }

  async function getCurrentUser() {
    try {
      const response = await fetch('/session', {
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data && data.user ? data.user : null;
    } catch (err) {
      console.error('Session lookup failed:', err);
      return null;
    }
  }

  function canAccessNavItem(item, user) {
    if (item.ownerOnly) {
      return Boolean(user && user.role === 'Store Owner');
    }

    return true;
  }

  /** Build and inject the full sidebar markup */
  async function render() {
    const aside = document.querySelector('aside.sidebar');
    if (!aside) return;

    const user = await getCurrentUser();
    const visibleNavItems = NAV_ITEMS.filter((item) => canAccessNavItem(item, user));

    aside.innerHTML = `
      <!-- Logo / Brand -->
      <div class="sidebar-logo-area">
        <span class="sidebar-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
               fill="none" stroke="white" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </span>
        <span class="sidebar-label sidebar-brand">MicroPOS</span>
      </div>

      <!-- Main navigation -->
      <nav class="sidebar-nav">
        ${visibleNavItems.map(buildLink).join('\n        ')}
      </nav>

      <!-- Bottom utilities -->
      <div class="sidebar-bottom">
        ${BOTTOM_ITEMS.map(buildLink).join('\n        ')}
      </div>
    `;

    const logoutLink = aside.querySelector('[data-action="logout"]');
    if (logoutLink) {
      logoutLink.addEventListener('click', handleLogout);
    }

    // Initialise Lucide icons (guards against Lucide not yet loaded)
    if (window.lucide) {
      lucide.createIcons();
    } else {
      // Wait briefly for Lucide CDN script to finish
      const poll = setInterval(function () {
        if (window.lucide) {
          lucide.createIcons();
          clearInterval(poll);
        }
      }, 30);
    }
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
