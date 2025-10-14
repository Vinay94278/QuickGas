
$(document).ready(function() {
    // --- 1. INITIALIZATION & VARIABLE DECLARATIONS ---
    const orderList = document.getElementById('order-list');
    const addEditModal = new bootstrap.Modal(document.getElementById('order-modal'));
    const deleteModal = new bootstrap.Modal(document.getElementById('delete-confirm-modal'));
    const detailsModal = new bootstrap.Modal(document.getElementById('order-details-modal'));

    const $modalLabel = $('#order-modal-label');
    const $form = $('#order-form');
    const $orderIdInput = $('#order-id');
    const $companySelect = $('#company-select');
    const $areaInput = $('#area');
    const $mobileInput = $('#mobile_no');
    const $notesInput = $('#notes');
    const $orderItemsContainer = $('#order-items');
    const $editOrderFields = $('#edit-order-fields');
    const $statusSelect = $('#status-select');
    const $driverSelect = $('#driver-select');

    let orderToDeleteId = null;
    let gasOptionsCache = null; // Cache for gas options

    // Initialize Select2 with the correct dropdownParent
    const dropdownParent = $('#order-modal .modal-content');
    $companySelect.select2({ dropdownParent: dropdownParent });
    $statusSelect.select2({ dropdownParent: dropdownParent });
    $driverSelect.select2({ dropdownParent: dropdownParent });

    // --- 2. DATA FETCHING & RENDERING ---

    fetchOrders();

    function fetchOrders() {
        apiFetch('/api/orders/')
            .then(data => {
                orderList.innerHTML = ''; // Clear existing list
                if (data.statusCode === 200 && data.data.data) {
                    renderOrders(data.data.data);
                } else {
                    showToast(data.message || 'Failed to load orders.', 'danger');
                }
            })
            .catch(() => {
                showToast('An error occurred while fetching orders.', 'danger');
            });
    }

    function renderOrders(orders) {
        orders.forEach(order => renderOrderCard(order));
    }

    function renderOrderCard(order) {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        orderCard.dataset.id = order.id;

        let itemsHtml = '';
        if (order.items && order.items.length > 0) {
            order.items.forEach(item => {
                itemsHtml += `<p>${item.gas_name} <span>${item.quantity}x</span></p>`;
            });
        } else {
            itemsHtml = '<p>No items listed.</p>';
        }

        orderCard.innerHTML = `
            <div class="order-content">
                <div class="company-name">${order.company_name}</div>
                <div class="order-details">
                    <div class="order-items">
                        ${itemsHtml}
                    </div>
                    <div class="order-info">
                        <p class="status"><strong>Status:</strong> <span>${order.status_name || 'N/A'}</span></p>
                        <p class="area"><strong>Area:</strong> <span>${order.area}</span></p>
                    </div>
                </div>
            </div>
            <div class="swipe-action edit"><i class="fas fa-pencil-alt"></i></div>
            <div class="swipe-action delete"><i class="fas fa-trash-alt"></i></div>
        `;

        orderList.appendChild(orderCard);
        initSwipe(orderCard);
    }

    // --- 3. EVENT LISTENERS ---

    $('#add-order-btn').on('click', function() {
        $form[0].reset();
        $orderIdInput.val('');
        $modalLabel.text('Add Order');
        $orderItemsContainer.html('');
        $companySelect.val(null).trigger('change');
        $editOrderFields.hide();
        loadCompanyOptions();
        addEditModal.show();
    });

    $('#add-item-btn').on('click', function() {
        const itemHtml = `
            <div class="row order-item mb-2">
                <div class="col-7"><select class="form-select gas-select" required style="width: 100%;"></select></div>
                <div class="col-3"><input type="number" class="form-control quantity" placeholder="Qty" required inputmode="numeric"></div>
                <div class="col-2"><button type="button" class="btn btn-danger btn-sm remove-item-btn"><i class="fas fa-times"></i></button></div>
            </div>`;
        const $newItem = $(itemHtml);
        $orderItemsContainer.append($newItem);
        const $gasSelect = $newItem.find('.gas-select');
        initializeGasSelect($gasSelect);
        loadGasOptions($gasSelect);
    });

    $orderItemsContainer.on('click', '.remove-item-btn', function() {
        $(this).closest('.order-item').remove();
    });

    $form.on('submit', async function(e) {
        e.preventDefault();
        try {
            const items = $('.order-item').map(function() {
                const gas_id = $(this).find('.gas-select').val();
                const quantity = $(this).find('.quantity').val();
                if (gas_id && quantity) {
                    return { gas_id: parseInt(gas_id), quantity: parseInt(quantity) };
                }
            }).get();

            if (items.length === 0) {
                showToast('Please add at least one item to the order.', 'warning');
                return;
            }

            const isEdit = $orderIdInput.val();
            const orderData = {
                company_id: parseInt($companySelect.val()),
                area: $areaInput.val(),
                mobile_no: $mobileInput.val(),
                notes: $notesInput.val(),
                items: items,
                status_id: isEdit ? parseInt($statusSelect.val()) : undefined,
                driver_id: isEdit ? parseInt($driverSelect.val()) : undefined
            };

            const url = isEdit ? `/api/orders/${isEdit}` : '/api/orders/';
            const method = isEdit ? 'PUT' : 'POST';

            const data = await apiFetch(url, { method, body: JSON.stringify(orderData) });
            const message = data.message || 'An unknown error occurred.';

            if (data.statusCode === 200 || data.statusCode === 201) {
                addEditModal.hide();
                showToast(message, 'success');
                fetchOrders();
            } else {
                showToast(message, 'danger');
            }
        } catch (error) {
            showToast('An unexpected network error occurred.', 'danger');
        }
    });

    $('#confirm-delete-btn').on('click', async function() {
        if (orderToDeleteId) {
            try {
                const data = await apiFetch(`/api/orders/${orderToDeleteId}`, { method: 'DELETE' });
                const message = data.message || 'An unknown error occurred.';
                deleteModal.hide();

                if (data.statusCode === 200) {
                    showToast(message, 'success');
                    fetchOrders();
                } else {
                    showToast(message, 'danger');
                }
            } catch (error) {
                showToast('An unexpected network error occurred while deleting.', 'danger');
            }
            orderToDeleteId = null;
        }
    });

    // --- 4. SWIPE & TAP FUNCTIONALITY ---
    function initSwipe(card) {
        const hammer = new Hammer(card);
        const content = card.querySelector('.order-content');
        const orderId = card.dataset.id;

        hammer.on('pan', function(ev) {
            if (ev.deltaX < 0) { // Swiping left
                card.classList.add('show-edit');
                card.classList.remove('show-delete');
            } else if (ev.deltaX > 0) { // Swiping right
                card.classList.add('show-delete');
                card.classList.remove('show-edit');
            }
            content.style.transform = `translateX(${ev.deltaX}px)`;
        });

        hammer.on('panend', function(ev) {
            card.classList.remove('show-edit', 'show-delete');

            if (ev.deltaX > 100) { 
                orderToDeleteId = orderId;
                deleteModal.show();
            } else if (ev.deltaX < -100) {
                handleEditClick(orderId);
            }

            content.style.transition = 'transform 0.3s ease';
            content.style.transform = 'translateX(0)';
            setTimeout(() => {
                content.style.transition = '';
            }, 300);
        });

        hammer.on('tap', function() {
            showDetailsModal(orderId);
        });
    }

    async function handleEditClick(orderId) {
        try {
            const data = await apiFetch(`/api/orders/${orderId}`);
            if (data.statusCode === 200) {
                const order = data.data;
                $form[0].reset();
                $orderIdInput.val(order.id);
                $modalLabel.text('Edit Order');
                $areaInput.val(order.area);
                $mobileInput.val(order.mobile_no);
                $notesInput.val(order.notes);
                $orderItemsContainer.html('');
                $editOrderFields.show();

                loadCompanyOptions(order.company_id);
                loadStatusOptions(order.status_id);
                loadDriverOptions(order.driver_id);

                if(order.items) {
                    for (const item of order.items) {
                        const itemHtml = `
                            <div class="row order-item mb-2">
                                <div class="col-7"><select class="form-select gas-select" required style="width: 100%;"></select></div>
                                <div class="col-3"><input type="number" class="form-control quantity" value="${item.quantity}" required inputmode="numeric"></div>
                                <div class="col-2"><button type="button" class="btn btn-danger btn-sm remove-item-btn"><i class="fas fa-times"></i></button></div>
                            </div>`;
                        const $newItem = $(itemHtml);
                        $orderItemsContainer.append($newItem);
                        const $gasSelect = $newItem.find('.gas-select');
                        initializeGasSelect($gasSelect);
                        await loadGasOptions($gasSelect, item.gas_id);
                    }
                }
                addEditModal.show();
            } else {
                showToast(data.message || 'Could not fetch order data.', 'danger');
            }
        } catch (error) {
            showToast('An unexpected error occurred while opening the editor.', 'danger');
        }
    }

    async function showDetailsModal(orderId) {
        try {
            const data = await apiFetch(`/api/orders/${orderId}`);
            if (data.statusCode === 200) {
                const order = data.data;
                const contentEl = document.getElementById('order-details-content');

                let itemsHtml = '';
                if (order.items && order.items.length > 0) {
                    order.items.forEach(item => {
                        itemsHtml += `<li><span>${item.gas_name}</span><span>${item.quantity}x</span></li>`;
                    });
                } else {
                    itemsHtml = '<li>No items in this order.</li>';
                }

                contentEl.innerHTML = `
                    <h6>Customer & Order</h6>
                    <div class="detail-item"><span class="detail-label">Company</span><span class="detail-value">${order.company_name}</span></div>
                    <div class="detail-item"><span class="detail-label">Area</span><span class="detail-value">${order.area}</span></div>
                    <div class="detail-item"><span class="detail-label">Mobile</span><span class="detail-value">${order.mobile_no}</span></div>
                    <div class="detail-item"><span class="detail-label">Notes</span><span class="detail-value">${order.notes || 'None'}</span></div>

                    <h6>Status & Assignment</h6>
                    <div class="detail-item"><span class="detail-label">Status</span><span class="detail-value">${order.status_name || 'N/A'}</span></div>
                    <div class="detail-item"><span class="detail-label">Driver</span><span class="detail-value">${order.driver_name || 'Not Assigned'}</span></div>

                    <h6>Items Ordered</h6>
                    <ul>${itemsHtml}</ul>

                    <h6>History</h6>
                    <div class="detail-item"><span class="detail-label">Created On</span><span class="detail-value">${new Date(order.created_at).toLocaleString()}</span></div>
                    <div class="detail-item"><span class="detail-label">Last Updated</span><span class="detail-value">${new Date(order.updated_at).toLocaleString()}</span></div>
                `;

                detailsModal.show();
            } else {
                showToast(data.message || 'Could not fetch order details.', 'danger');
            }
        } catch (error) {
            showToast('An unexpected network error occurred.', 'danger');
        }
    }

    // --- 5. API & UI HELPERS ---
    async function apiFetch(url, options = {}) {
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (token) { headers['Authorization'] = `Bearer ${token}`; }
        const response = await fetch(url, { ...options, headers });
        return response.json();
    }

    async function loadSelectOptions(url, $selectElement, dataExtractor, selectedId = null) {
        try {
            const data = await apiFetch(url);
            if (data.statusCode === 200) {
                const options = dataExtractor(data);
                populateSelectWithOptions($selectElement, options, selectedId);
            } else { console.error(`Failed to load options for ${$selectElement.attr('id')}:`, data.message); }
        } catch (error) { console.error(`Network error loading options for ${$selectElement.attr('id')}:`, error); }
    }

    function loadCompanyOptions(selectedId) { loadSelectOptions('/api/companies/', $companySelect, (data) => data.data.data, selectedId); }
    function loadStatusOptions(selectedId) { loadSelectOptions('/api/order-statuses/', $statusSelect, (data) => data.data, selectedId); }
    function loadDriverOptions(selectedId) { loadSelectOptions('/api/users/drivers', $driverSelect, (data) => data.data, selectedId); }

    async function loadGasOptions($selectElement, selectedId) {
        if (gasOptionsCache) {
            populateSelectWithOptions($selectElement, gasOptionsCache, selectedId);
            return;
        }
        try {
            const data = await apiFetch('/api/gases/');
            if (data.statusCode === 200 && data.data) {
                gasOptionsCache = data.data;
                populateSelectWithOptions($selectElement, gasOptionsCache, selectedId);
            } else {
                console.error('Failed to load gas options:', data.message);
            }
        } catch (error) {
            console.error('Network error loading gas options:', error);
        }
    }

    function populateSelectWithOptions($selectElement, options, selectedId) {
        $selectElement.empty().append('<option value="">Select an option</option>');
        options.forEach(option => {
            const isSelected = option.id == selectedId;
            const newOption = new Option(option.name, option.id, isSelected, isSelected);
            $selectElement.append(newOption);
        });
        $selectElement.val(selectedId).trigger('change');
    }

    function initializeGasSelect($selectElement) {
        const dropdownParent = $('#order-modal .modal-content');
        $selectElement.select2({ dropdownParent: dropdownParent });
    }

    function showToast(message, type = 'info') {
        const toastId = 'toast-' + Date.now();
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>`;
        if (!$('#toast-container').length) { $('body').append('<div id="toast-container" class="position-fixed bottom-0 end-0 p-3" style="z-index: 1055"></div>'); }
        $('#toast-container').append(toastHtml);
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
        toast.show();
        toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
    }
});
