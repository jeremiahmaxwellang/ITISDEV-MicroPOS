// --- Debt Tracker Page JS (from debts.html) ---
let allDebts = { active: [], paid: [] };
let currentTab = 'paid';

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return '—';
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function formatCurrency(amount) {
    return '₱' + parseFloat(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const tableBody = document.getElementById('debtsTableBody');

async function loadDebts() {
    try {
        const [activeRes, paidRes] = await Promise.all([
            fetch('/debts/active'),
            fetch('/debts/paid')
        ]);
        const activeData = await activeRes.json();
        const paidData = await paidRes.json();
        allDebts = {
            active: Array.isArray(activeData) ? activeData : [],
            paid: Array.isArray(paidData) ? paidData : []
        };
        renderAlertCards([...allDebts.active, ...allDebts.paid]);
        renderTable(currentTab === 'paid' ? allDebts.paid : allDebts.active);
    } catch (error) {
        console.error('Error loading debts:', error);
        tableBody.innerHTML =
            '<div style="padding: 2rem; text-align: center; color: #718096; font-family: Poppins, sans-serif;">Error loading debts</div>';
        renderAlertCards([]);
    }
}

function renderAlertCards(debts) {
    const blacklisted = debts.filter(d => d.status === 'Blacklisted');
    const attention = debts.filter(d => d.status === 'Overdue' || d.status === 'Pending');

    const blacklistedEl = document.getElementById('blacklistedContainer');
    if (blacklistedEl) {
        if (blacklisted.length === 0) {
            blacklistedEl.innerHTML = '<div style="text-align: center; color: #E7000B; font-size: 13px; font-family: Poppins, sans-serif; padding: 8px;">No blacklisted customers</div>';
        } else {
            blacklistedEl.innerHTML = blacklisted.map(d => `
                <div class="alert-customer-card danger">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="cust-icon-wrap" style="background: #FEF2F2;">
                            <i data-lucide="user" style="width: 24px; height: 24px; color: #E7000B;"></i>
                        </div>
                        <div>
                            <div style="color: rgba(0,0,0,0.80); font-size: 15px; font-family: Poppins, sans-serif;">${d.first_name || ''} ${d.last_name || ''}</div>
                            <div style="color: #D4183D; font-size: 14px; font-family: Poppins, sans-serif;">Unpaid: ${formatCurrency(d.debt_amount)} (Due: ${formatDate(d.debt_due)})</div>
                        </div>
                    </div>
                    <div class="badge-blacklisted">
                        <i data-lucide="ban" style="width: 12px; height: 12px;"></i>
                        BLACKLISTED
                    </div>
                </div>
            `).join('');
        }
    }

    const attentionEl = document.getElementById('attentionContainer');
    if (attentionEl) {
        const attentionList = attention.slice(0, 2);
        if (attentionList.length === 0) {
            attentionEl.innerHTML = '<div style="text-align: center; color: #AE5A11; font-size: 13px; font-family: Poppins, sans-serif; padding: 8px;">No customers needing attention</div>';
        } else {
            attentionEl.innerHTML = attentionList.map(d => `
                <div class="alert-customer-card warning">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="cust-icon-wrap" style="background: #FFFDE5;">
                            <i data-lucide="user" style="width: 24px; height: 24px; color: #AE5A11;"></i>
                        </div>
                        <div>
                            <div style="color: rgba(0,0,0,0.80); font-size: 15px; font-family: Poppins, sans-serif;">${d.first_name || ''} ${d.last_name || ''}</div>
                            <div style="color: #AE5A11; font-size: 14px; font-family: Poppins, sans-serif;">To Pay: ${formatCurrency(d.debt_amount)} (Due: ${formatDate(d.debt_due)})</div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    if (window.lucide && window.lucide.createIcons) lucide.createIcons();
}

function renderTable(debts) {
    const container = document.getElementById('debtsTableBody');
    if (!container) return;

    if (currentTab === 'paid') {
        document.getElementById('thAmountLabel').textContent = 'Perang Binayaran';
        document.getElementById('thDateLabel').textContent = 'Petsa ng Bayad';
    } else {
        document.getElementById('thAmountLabel').textContent = 'Halaga ng Utang';
        document.getElementById('thDateLabel').textContent = 'Petsa ng Takdang Bayad';
    }

    if (!debts || debts.length === 0) {
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #718096; font-family: Poppins, sans-serif;">Walang nakitang rekord</div>';
        return;
    }

    const isPaidTab = currentTab === 'paid';

    container.innerHTML = debts.map((debt, idx) => {
        const fullName = `${debt.first_name || ''} ${debt.last_name || ''}`.trim() || 'Unknown';
        const isPaid = debt.status === 'Paid';
        const isOverdue = debt.status === 'Overdue';
        const isBlacklisted = debt.status === 'Blacklisted';

        const iconBg = isPaid ? '#E5FFE8' : isOverdue || isBlacklisted ? '#FEE2E2' : '#FEF3C7';
        const iconColor = isPaid ? '#00B928' : isOverdue || isBlacklisted ? '#E7000B' : '#92400E';

        const statusBadge = isPaid
            ? `<span style="background:#E5FFE8;color:#00A63E;font-size:12px;font-family:'Arimo',sans-serif;padding:3px 14px;border-radius:999px;">Paid</span>`
            : isBlacklisted
                ? `<span style="background:#FEE2E2;color:#D4183D;font-size:12px;font-family:'Arimo',sans-serif;padding:3px 10px;border-radius:999px;">Blacklisted</span>`
                : isOverdue
                    ? `<span style="background:#FEE2E2;color:#E7000B;font-size:12px;font-family:'Arimo',sans-serif;padding:3px 14px;border-radius:999px;">Overdue</span>`
                    : `<span style="background:#FEF3C7;color:#92400E;font-size:12px;font-family:'Arimo',sans-serif;padding:3px 14px;border-radius:999px;">Pending</span>`;

        const actionBtns = isPaidTab
            ? `<button class="debt-details-btn" onclick="viewDebtDetails(${idx})">
                     <i data-lucide="package" style="width:14px;height:14px;"></i>
                     Details
                 </button>`
            : `<div style="display:flex;gap:6px;justify-content:center;">
                     <button class="debt-details-btn" onclick="viewDebtDetails(${idx})">
                         <i data-lucide="package" style="width:14px;height:14px;"></i>
                         Details
                     </button>
                     <button class="debt-pay-btn" onclick="markPaid(${idx})">
                         <i data-lucide="check" style="width:14px;height:14px;"></i>
                         Mark Paid
                     </button>
                 </div>`;

        return `
            <div class="debt-row" data-idx="${idx}">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:46px;height:40px;background:${iconBg};border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <span style="color:${iconColor};font-size:20px;font-family:'Poppins',sans-serif;">₱</span>
                    </div>
                    <span style="color:rgba(0,0,0,0.80);font-size:15px;font-family:'Poppins',sans-serif;">${fullName}</span>
                </div>
                <div style="text-align:center;color:rgba(0,0,0,0.80);font-size:13px;font-family:'Poppins',sans-serif;">${debt.phone_number || '—'}</div>
                <div style="text-align:center;color:#00B928;font-size:13px;font-family:'Arimo',sans-serif;">${formatCurrency(debt.debt_amount)}</div>
                <div style="display:flex;align-items:center;gap:6px;color:#4A5565;font-size:14px;font-family:'Arimo',sans-serif;">
                    <i data-lucide="calendar" style="width:16px;height:16px;color:#99A1AF;flex-shrink:0;"></i>
                    ${formatDate(debt.debt_due)}
                </div>
                <div style="display:flex;justify-content:center;">${statusBadge}</div>
                <div style="display:flex;justify-content:center;">${actionBtns}</div>
            </div>
        `;
    }).join('');

    if (window.lucide && window.lucide.createIcons) lucide.createIcons();
}

function switchTab(tab) {
    currentTab = tab;
    const tabActive = document.getElementById('tabActive');
    const tabPaid = document.getElementById('tabPaid');

    if (tab === 'active') {
        tabActive.classList.add('active');
        tabPaid.classList.remove('active');
        renderTable(allDebts.active);
    } else {
        tabPaid.classList.add('active');
        tabActive.classList.remove('active');
        renderTable(allDebts.paid);
    }
}
async function viewDebtDetails(idx) {
    const data = currentTab === 'paid' ? allDebts.paid : allDebts.active;
    const debt = data[idx];
    if (!debt) return;

    // Show modal immediately with loading state
    document.getElementById('debtDetailsModal').style.display = 'flex';
    setTimeout(() => document.getElementById('debtDetailsModal').classList.add('show'), 10);
    document.getElementById('debtDetailsTxList').innerHTML = '<div style="text-align:center;padding:1rem;color:#888;">Loading...</div>';
    document.getElementById('debtDetailsPaymentList').innerHTML = '';

    try {
        const response = await fetch(`/debts/${debt.debt_id}/details`);
        const data = await response.json();

        if (!response.ok) {
            alert('Error: ' + data.error);
            return;
        }

        // -- Customer info --
        const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || '—';
        document.getElementById('debtDetailsHeaderName').textContent = fullName;
        document.getElementById('debtDetailsCustomerName').textContent = fullName;
        document.getElementById('debtDetailsPhone').textContent = data.phone_number || '—';
        document.getElementById('debtDetailsAmount').textContent = formatCurrency(data.debt_amount);

        const statusEl = document.getElementById('debtDetailsStatus');
        statusEl.textContent = data.status || 'Active';
        statusEl.className = 'debt-details-status ' + (
            data.status === 'Paid'        ? 'paid'        :
            data.status === 'Overdue'     ? 'overdue'     :
            data.status === 'Blacklisted' ? 'blacklisted' : 'active'
        );

        // -- Payment history --
        const payList = document.getElementById('debtDetailsPaymentList');
        if (data.payments && data.payments.length > 0) {
            payList.innerHTML = data.payments.map(pay => `
                <div class="debt-details-tx-item">
                    <div class="debt-details-tx-info">
                        <div class="debt-details-tx-name">${pay.payment_method}</div>
                        <div class="debt-details-tx-meta">
                            By: ${pay.staff_first_name || 'N/A'} ${pay.staff_last_name || ''}
                            &nbsp;·&nbsp;
                            ${new Date(pay.created_at).toLocaleDateString('en-PH')}
                        </div>
                        ${pay.notes ? `<div style="font-size:12px;color:#888;">${pay.notes}</div>` : ''}
                    </div>
                    <div class="debt-details-tx-amount">${formatCurrency(pay.amount_paid)}</div>
                </div>
            `).join('');
        } else {
            payList.innerHTML = '<div style="color:#888;padding:1rem;text-align:center;">No payments recorded yet.</div>';
        }

    } catch (err) {
        console.error('viewDebtDetails error:', err);
        document.getElementById('debtDetailsTxList').innerHTML = '<div style="color:red;padding:1rem;text-align:center;">Failed to load details.</div>';
    }
}

// Hide modal on close button or outside click
function closeDebtDetailsModal() {
    const modal = document.getElementById('debtDetailsModal');
    modal.classList.remove('show');
    setTimeout(() => { modal.style.display = 'none'; }, 200);
}
document.addEventListener('DOMContentLoaded', () => {
    // Modal close button
    const closeBtn = document.getElementById('debtDetailsCloseBtn');
    if (closeBtn) closeBtn.onclick = closeDebtDetailsModal;
    // Dismiss by clicking outside
    const detailsModal = document.getElementById('debtDetailsModal');
    if (detailsModal) {
        detailsModal.addEventListener('mousedown', function (e) {
            if (e.target === this) closeDebtDetailsModal();
        });
    }
});

async function markPaid(idx) {
    const debt = allDebts.active[idx];
    if (!debt) return;

    const name = `${debt.first_name || ''} ${debt.last_name || ''}`.trim();
    if (!confirm(`Mark ${name}'s debt as paid?\nAmount: ${formatCurrency(debt.debt_amount)}`)) return;

    try {
        const response = await fetch(`/debts/${debt.debt_id}/pay`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount_paid:      debt.debt_amount,
                payment_method:   'Cash',       // or get from a modal/form
                proof_of_payment: null,
                notes:            'Paid in full'
            })
        });

        const data = await response.json();
        if (!response.ok) { alert('Error: ' + data.error); return; }

        showToast('Payment recorded successfully!');
        loadDebts();

    } catch (err) {
        console.error('Error:', err);
        alert('Something went wrong. Please try again.');
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('debtForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;

        const response = await fetch('/api/debts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: form.first_name.value,
                last_name: form.last_name.value,
                phone_number: form.phone_number.value,
                debt_amount: parseFloat(form.debt_amount.value),
                debt_due: form.debt_due.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert('Error: ' + data.error);
            return;
        }

        alert(data.message); // "Debt added successfully"
    });

    // Search
    const searchDebt = document.getElementById('searchDebt');
    if (searchDebt) {
        searchDebt.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            const data = currentTab === 'paid' ? allDebts.paid : allDebts.active;
            const filtered = data.filter(d => {
                const name = `${d.first_name || ''} ${d.last_name || ''}`.toLowerCase();
                return name.includes(q);
            });
            renderTable(filtered);
        });
    }

    // Modal: open
    const addDebtBtn = document.getElementById('addDebtBtn');
    if (addDebtBtn) {
        addDebtBtn.addEventListener('click', () => {
            document.getElementById('debtModalTitle').textContent = 'List New Debt';
            document.getElementById('debtForm').reset();
            document.getElementById('debtModal').style.display = 'flex';
            document.getElementById('first_name').focus();
        });
    }

    // Modal: close
    ['closeDebtModal', 'cancelDebtModal'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => {
                document.getElementById('debtModal').style.display = 'none';
            });
        }
    });

    const debtModal = document.getElementById('debtModal');
    if (debtModal) {
        debtModal.addEventListener('click', (e) => {
            if (e.target.id === 'debtModal') document.getElementById('debtModal').style.display = 'none';
        });
    }

    // Save
    const saveDebtBtn = document.getElementById('saveDebtBtn');
    if (saveDebtBtn) {
        saveDebtBtn.addEventListener('click', async () => {
            const first_name = document.getElementById('first_name').value.trim();
            const last_name = document.getElementById('last_name').value.trim();
            const totalDebt = parseFloat(document.getElementById('debtTotalAmount').value);
            const amountPaid = parseFloat(document.getElementById('debtAmountPaid').value) || 0;
            const contact = document.getElementById('debtContact').value;
            const notes = document.getElementById('debtNotes').value;

            if (!first_name || !last_name || isNaN(totalDebt)) {
                alert('Please fill in required fields');
                return;
            }

            // Send the data to your backend
            try {
                const response = await fetch('/debts/create-debt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        first_name: first_name,
                        last_name: last_name,
                        phone_number: contact,
                        debt_amount: totalDebt,
                        debt_due: document.getElementById('debtDueDate').value  // add this field to your form
                    })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Failed to save');

                showToast('Debt record saved!');
                document.getElementById('debtModal').style.display = 'none';
                document.getElementById('debtForm').reset();
                loadDebts();
            } catch (error) {
                console.error('Error:', error);
                alert('Error saving debt record: ' + error.message);
            }
        });
    }

    loadDebts();
    if (window.lucide && window.lucide.createIcons) lucide.createIcons();
    setTimeout(() => { if (window.lucide && window.lucide.createIcons) lucide.createIcons(); }, 300);
});

document.addEventListener('DOMContentLoaded', function () {

    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    const tableBody = document.querySelector('#debts-table tbody');

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-PH', { month: '2-digit', day: '2-digit', year: 'numeric' });
    }

    function getInitials(firstName, lastName) {
        return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
    }

    function renderRows(debts) {
        if (!debts.length) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#aaa;padding:2rem;">No records found.</td></tr>`;
            return;
        }

        tableBody.innerHTML = debts.map(d => {
            const initials = getInitials(d.first_name, d.last_name);
            const fullName = `${d.first_name} ${d.last_name}`;
            const status = d.status.toLowerCase();

            return `
                <tr>
                    <td>
                        <div class="td-name">
                        <div class="td-avatar">${initials}</div>
                        ${fullName}
                        </div>
                    </td>

                    <td class="td-phone">
                        ${d.phone_number}
                    </td>

                    <td><span class="td-peso ${status}">₱${d.debt_amount}</span></td>

                    <td>
                        <span class="td-date ${status}">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            ${formatDate(d.debt_due)}
                        </span>
                    </td>

                    <td>
                        <span class="status-badge ${status}">${d.status}</span>
                    </td>

                    <td>
                    <div class="actions">
                        <button class="btn-details">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                            </svg>
                            Details
                        </button>
                        <button class="btn-pay">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2.5">
                            <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Pay
                        </button>
                    </div>
                    </td>
                </tr>
            `;
        }).join('');


    }

    // Map tab index
    const endpoints = [
        '/debts/paid',
        '/debts/active'
    ];

    async function loadDebts(tabIndex) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;">Loading...</td></tr>`;

        try {
            const res = await fetch(endpoints[tabIndex]);
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();

            renderRows(data);
        } catch (err) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;padding:2rem;">Failed to load data.</td></tr>`;
            console.error(err);
        }
    }

    // Tab click handler
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => { t.classList.remove('active'); t.classList.add('inactive'); });
            tab.classList.add('active'); // set to active
            tab.classList.remove('inactive');
            loadDebts(index);
        });
    });

    loadDebts(0);
});