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
                    <td class="td-phone">${d.phone_number}</td>
                    <td><span class="td-peso ${status}">₱${d.debt_balance}</span></td>
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
        '/debts/active',
        '/debts/paid'
    ];

    async function loadDebts(tabIndex) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;">Loading...</td></tr>`;

        try {
            const res = await fetch(endpoints[tabIndex]);
            if(!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();

            renderRows(data);
        } catch (err) {
            tableBody.innerHTML =`<tr><td colspan="6" style="text-align:center;color:red;padding:2rem;">Failed to load data.</td></tr>`;
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