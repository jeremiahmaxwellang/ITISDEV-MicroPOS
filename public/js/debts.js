document.addEventListener('DOMContentLoaded', function () {

    getDebts();

    // Helper for fetching Customer Debts
    function getDebts() {
        fetch(`/debts/get-all`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

                return res.json();
            })
            .then(data => {
                console.log(data);
                const tableBody = document.querySelector("#debts-table tbody");

                tableBody.innerHTML = "";

                data.forEach((item) => {
                    const row = document.createElement("tr");

                    var fn = item.first_name
                    ? item.first_name.charAt(0).toUpperCase() 
                    : "";

                    var ln = item.last_name
                    ? item.last_name.charAt(0).toUpperCase() 
                    : "";

                    var status = item.status.toLowerCase();

                    row.innerHTML = `
                    <td>
                        <div class="td-name">
                        <div class="td-avatar">${fn}${ln}</div>
                        ${item.first_name} ${item.last_name}
                        </div>
                    </td>
                    <td class="td-phone">${item.phone_number}</td>
                    <td><span class="td-peso ${status}">₱${item.debt_balance}</span></td>
                    <td>${item.debt_due}</td>
                    <td><span class="status-badge ${status}">${item.status}</span></td>
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
                `;

                    tableBody.appendChild(row);
                });
            })
            .catch((err) => console.error("✗ Error loading debts:", err));
    }

});