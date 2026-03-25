// --- Debt Tracker Page JS (from debts.html) ---
let allDebts = { active: [], paid: [] };
let currentTab = 'active';

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
    const tableBody = document.getElementById('debtsTableBody');
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
    const blacklisted = debts.filter(d => d.is_blacklisted === 'T');
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
        const initials = `${debt.first_name?.[0] ?? ''}${debt.last_name?.[0] ?? ''}`.toUpperCase() || '?';

        const isPaid = debt.status === 'Paid';
        const isOverdue = debt.status === 'Overdue';
        const isBlacklisted = debt.is_blacklisted === 'T';

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
            : `<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">
            <button class="debt-details-btn" onclick="viewDebtDetails(${idx})">
                <i data-lucide="package" style="width:14px;height:14px;"></i>
                Details
            </button>
            <button class="debt-pay-btn" onclick="markPaid(${idx})">
                <i data-lucide="check" style="width:14px;height:14px;"></i>
                Pay
            </button>
            <button 
                class="debt-blacklist-btn ${isBlacklisted ? 'unblacklist' : ''}" 
                onclick="toggleBlacklist(${idx})"
                title="${isBlacklisted ? 'Remove from blacklist' : 'Blacklist customer'}"
            >
                <i data-lucide="ban" style="width:14px;height:14px;"></i>
                ${isBlacklisted ? 'Unblacklist' : 'Blacklist'}
            </button>
        </div>`;

        return `
            <div class="debt-row" data-idx="${idx}">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:40px;height:40px;background:${iconBg};border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <span style="color:${iconColor};font-size:13px;font-weight:700;font-family:'Poppins',sans-serif;">${initials}</span>
                    </div>
                    <span style="color:rgba(0,0,0,0.80);font-size:15px;font-family:'Poppins',sans-serif;">${fullName}</span>
                </div>
                <div style="text-align:center;color:rgba(0,0,0,0.80);font-size:13px;font-family:'Poppins',sans-serif;">${debt.phone_number || '—'}</div>
                <div style="text-align:center;color:#00B928;font-size:13px;font-family:'Arimo',sans-serif;">${formatCurrency(debt.debt_amount)}</div>
                                <!-- Debt limit — only show on active tab, hide on paid -->
                <div style="display:flex;align-items:center;justify-content:center;">
                    ${!isPaidTab ? `
                        <div
                            class="debt-limit-cell"
                            onclick="editDebtLimit(this, ${debt.customer_id}, ${debt.debt_limit || 1000})"
                            title="Click to edit"
                        >
                            ${formatCurrency(debt.debt_limit || 1000)}
                            <i data-lucide="pencil" style="width:11px;height:11px;margin-left:4px;color:#99A1AF;"></i>
                        </div>
                    ` : '—'}
                </div>
                <div style="display:flex;align-items:center;gap:6px;color:#4A5565;font-size:14px;font-family:'Arimo',sans-serif;">
                    <i data-lucide="calendar" style="width:16px;height:16px;color:#99A1AF;flex-shrink:0;"></i>
                    ${debt.status === 'Paid' ? formatDate(debt.date_paid) : formatDate(debt.debt_due)}
                </div>
                <div style="display:flex;justify-content:center;">${statusBadge}</div>
                <div style="display:flex;justify-content:center;">${actionBtns}</div>
                </div>
        `;
    }).join('');

    if (window.lucide && window.lucide.createIcons) lucide.createIcons();
}

function editDebtLimit(el, customer_id, currentLimit) {
    if (el.querySelector('input')) return; // already editing

    el.innerHTML = `
        <input
            type="number"
            class="debt-limit-input"
            value="${parseFloat(currentLimit) || 1000}"
            min="0"
            step="0.01"
            onclick="event.stopPropagation()"
            onkeydown="handleDebtLimitKey(event, this, ${customer_id})"
        />
    `;

    const input = el.querySelector('input');
    input.focus();
    input.select();
    input.addEventListener('blur', () => saveDebtLimit(el, customer_id, input.value));
}

function handleDebtLimitKey(event, input, customer_id) {
    if (event.key === 'Enter') input.blur();
    if (event.key === 'Escape') loadDebts(); // cancel
}

async function saveDebtLimit(el, customer_id, newValue) {
    const debt_limit = parseFloat(newValue);

    if (isNaN(debt_limit) || debt_limit < 0) {
        showToast('Invalid debt limit value');
        loadDebts();
        return;
    }

    try {
        const response = await fetch(`/debts/${customer_id}/debt-limit`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ debt_limit })
        });

        const data = await response.json();
        if (!response.ok) { alert('Error: ' + data.error); loadDebts(); return; }

        // Update cell in place — no full reload needed
        el.innerHTML = `
            ${formatCurrency(debt_limit)}
            <i data-lucide="pencil" style="width:11px;height:11px;margin-left:4px;color:#99A1AF;"></i>
        `;
        el.onclick = () => editDebtLimit(el, customer_id, debt_limit);
        if (window.lucide) lucide.createIcons();

        showToast('Debt limit updated');

    } catch (err) {
        console.error('saveDebtLimit error:', err);
        alert('Something went wrong.');
        loadDebts();
    }
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

/**
 * Blacklist
 * @param {*} idx 
 * @returns 
 */
async function toggleBlacklist(idx) {
    const debt = allDebts.active[idx];
    if (!debt) return;

    const name = `${debt.first_name || ''} ${debt.last_name || ''}`.trim();
    const isBlacklisted = debt.is_blacklisted === 'T';
    const action = isBlacklisted ? 'remove from blacklist' : 'blacklist';

    if (!confirm(`Are you sure you want to ${action} ${name}?`)) return;

    try {
        const response = await fetch(`/debts/${debt.customer_id}/blacklist`, {
            method: 'PATCH'
        });

        const data = await response.json();
        if (!response.ok) { alert('Error: ' + data.error); return; }

        showToast(data.message);
        loadDebts();

    } catch (err) {
        console.error('toggleBlacklist error:', err);
        alert('Something went wrong. Please try again.');
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

        if (!response.ok) { alert('Error: ' + data.error); return; }

        // Get Debt ID for SMS Reminder
        document.getElementById('sendDebtReminderBtn').dataset.debtId = data.debt_id;

        // -- Customer info --
        const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || '—';
        document.getElementById('debtDetailsHeaderName').textContent = fullName;
        document.getElementById('debtDetailsCustomerName').textContent = fullName;
        document.getElementById('debtDetailsPhone').textContent = data.phone_number || '—';
        document.getElementById('debtDetailsAmount').textContent = formatCurrency(data.debt_amount);

        const statusEl = document.getElementById('debtDetailsStatus');
        statusEl.textContent = data.status || 'Active';
        statusEl.className = 'debt-details-status ' + (
            data.status === 'Paid' ? 'paid' :
                data.status === 'Overdue' ? 'overdue' :
                    data.status === 'Blacklisted' ? 'blacklisted' : 'active'
        );

        // -- Transaction items --
        const txList = document.getElementById('debtDetailsTxList');
        if (data.items && data.items.length > 0) {
            txList.innerHTML = data.items.map(item => `
                <div class="debt-details-tx-item">
                    <div class="debt-details-tx-info">
                        <div class="debt-details-tx-name">${item.name}</div>
                        <div class="debt-details-tx-meta">
                            ${formatCurrency(item.price_each)}
                            <span class="debt-details-tx-qty">Qty: ${item.quantity}</span>
                        </div>
                    </div>
                    <div class="debt-details-tx-amount">${formatCurrency(item.subtotal)}</div>
                </div>
            `).join('');
        } else {
            txList.innerHTML = '<div style="color:#888;padding:1rem;text-align:center;">No transaction items found.</div>';
        }

        // -- Payment history --
        const payList = document.getElementById('debtDetailsPaymentList');
        if (data.payments && data.payments.length > 0) {
            payList.innerHTML = data.payments.map(pay => `
                <div class="debt-details-tx-item">
                    <div class="debt-details-tx-info">
                        <div class="debt-details-tx-name">${pay.payment_method}</div>
                        <div class="debt-details-tx-meta">
                            Recorded by: ${pay.staff_first_name || 'N/A'} ${pay.staff_last_name || ''}
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

    // DEBT REMINDER
    document.getElementById('sendDebtReminderBtn').addEventListener('click', async () => {
        const debtId = document.getElementById('sendDebtReminderBtn').dataset.debtId;

        // Checks if debt is undefined
        if (!debtId || debtId === 'undefined') {
            alert('No debt selected. Please open a debt first.');
            return;
        }

        const btn = document.getElementById('sendDebtReminderBtn');
        btn.disabled = true;
        btn.textContent = 'Sending...';

        try {
            const response = await fetch(`/debts/${debtId}/remind`, { method: 'POST' });
            const data = await response.json();

            if (!response.ok) { alert('Error: ' + data.error); return; }

            showToast('Reminder sent successfully!');

        } catch (err) {
            console.error('sendReminder error:', err);
            alert('Something went wrong.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Send Debt Reminder';
        }
    });
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
                amount_paid: debt.debt_amount,
                payment_method: 'Cash',       // or get from a modal/form
                proof_of_payment: null,
                notes: 'Paid in full'
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