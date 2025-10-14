$(document).ready(function () {
    // --- Sidebar and Logout ---
    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
    });

    $('#logout-link').on('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('accessToken');
        window.location.href = '/';
    });

    // --- Toast Notification --- 
    function showToast(message, type = 'success') {
        const toastId = 'toast-' + Date.now();
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>`;
        if (!$('#toast-container').length) {
            $('body').append('<div id="toast-container" class="position-fixed bottom-0 end-0 p-3" style="z-index: 1055"></div>');
        }
        $('#toast-container').append(toastHtml);
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
        toast.show();
        toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
    }

    // --- Main function to load dashboard data ---
    async function loadDashboard() {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            showToast('Authentication Error: You are not logged in. Please log in.', 'danger');
            return;
        }

        try {
            const response = await fetch('/api/dashboard/', {
                headers: { 'Authorization': 'Bearer ' + token }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `HTTP Error ${response.status}`);
            }

            if (result.statusCode === 200 && result.data) {
                showToast(result.message, 'success');
                const data = result.data;

                // Populate the insight cards
                $('#pending-orders').text(data.total_pending_orders);
                $('#completed-orders').text(data.total_completed_orders);
                $('#out-for-delivery-orders').text(data.total_out_for_delivery_orders);

                // Populate gas requirements table
                const tableBody = $('#gas-requirements-table tbody');
                tableBody.empty();
                $('#gas-requirements-loader').hide();

                if (Object.keys(data.gas_requirements).length > 0) {
                    $.each(data.gas_requirements, (gas, quantity) => {
                        const row = `<tr>
                            <td>
                                <div class="d-flex align-items-center">
                                    <i class="fas fa-burn fa-lg text-primary me-3"></i>
                                    <span class="fw-bold">${gas}</span>
                                </div>
                            </td>
                            <td class="text-end fs-5">${quantity}</td>
                        </tr>`;
                        tableBody.append(row);
                    });
                    $('#gas-requirements-table').show();
                } else {
                    $('#no-gas-requirements').show();
                }

            } else {
                throw new Error(result.message || 'Invalid data format from API.');
            }

        } catch (error) {
            console.error('Dashboard loading error:', error);
            showToast(error.message, 'danger');
            $('#pending-orders, #completed-orders, #out-for-delivery-orders').html('<i class="fas fa-exclamation-circle text-danger"></i>');
            $('#gas-requirements-loader').hide();
        }
    }

    if ($('#pending-orders').length) {
        loadDashboard();
    }
});