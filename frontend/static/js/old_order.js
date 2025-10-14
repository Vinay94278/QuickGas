/**
 * @file This file handles the logic for the orders page, including displaying,
 * creating, updating, and deleting orders. It uses jQuery, DataTables, and Bootstrap.
 * @author Your Name/Team
 * @version 1.0.0
 */

// Wait for the DOM to be fully loaded before executing the script
$(document).ready(function() {
    // ---
    // --- 1. INITIALIZATION & VARIABLE DECLARATIONS
    // ---

    // Initialize Bootstrap modals for reusability.
    const addEditModal = new bootstrap.Modal(document.getElementById('order-modal'));
    const deleteModal = new bootstrap.Modal(document.getElementById('delete-confirm-modal'));
    const viewModal = new bootstrap.Modal(document.getElementById('view-order-modal'));

    // Cache jQuery selections of frequently used elements for performance.
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

    // State variable to hold the ID of the order marked for deletion.
    let orderToDeleteId = null;

    // Caching variables to store fetched dropdown options, reducing redundant API calls.
    let companyOptions = null;
    let gasOptions = null;
    let statusOptions = null;
    let driverOptions = null;

    // Initialize Select2 for enhanced dropdown functionality.
    // `dropdownParent` is specified to ensure the dropdowns work correctly within a Bootstrap modal.
    $companySelect.select2({ dropdownParent: $('#order-modal') });
    $statusSelect.select2({ dropdownParent: $('#order-modal') });
    $driverSelect.select2({ dropdownParent: $('#order-modal') });

    // ---
    // --- 2. DATATABLE SETUP
    // ---

    const table = $('#order-table').DataTable({
        "processing": true, // Show processing indicator
        "serverSide": true, // Enable server-side processing
        "ajax": {
            "url": "/api/orders/",
            "type": "GET",
            "beforeSend": function(xhr) {
                // Add the JWT token to the request headers for authentication.
                const token = localStorage.getItem('accessToken');
                if (token) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                }
            },
            "data": function(d) {
                // DataTables sends these parameters by default. We're just making it explicit here.
                d.draw = d.draw;
                d.start = d.start; // for pagination offset
                d.length = d.length; // for page size
                d.search = d.search.value; // for search query
            },
            "dataSrc": function(json) {
                // This function processes the raw data from the server.
                if (json.statusCode === 200) {
                    json.recordsTotal = json.data.recordsTotal;
                    json.recordsFiltered = json.data.recordsFiltered;
                    // Add a sequential number for each row.
                    const start = table.page.info().start;
                    json.data.data.forEach((item, index) => {
                        item.seq = start + index + 1;
                    });
                    return json.data.data;
                }
                // Return an empty array in case of an error.
                return [];
            }
        },
        "columns": [
            { "data": "seq", "orderable": false, "searchable": false },
            { "data": "company_name" },
            { "data": "area" },
            {
                "data": "items",
                "orderable": false,
                "searchable": false,
                "render": function(items) {
                    if (!items || items.length === 0) {
                        return '';
                    }
                    return items.map(item => `${item.gas_name}`).join('<br>');
                }
            },
            {
                "data": "items",
                "orderable": false,
                "searchable": false,
                "render": function(items) {
                    if (!items || items.length === 0) {
                        return '';
                    }
                    return items.map(item => item.quantity).join('<br>');
                }
            },
            {
                "data": null,
                "orderable": false,
                "searchable": false,
                "render": (data, type, row) => `
                    <div class="actions-group" role="group">
                        <button class="btn btn-secondary btn-sm view-btn btn-icon" data-id="${row.id}" data-bs-toggle="tooltip" title="View Order">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-info btn-sm edit-btn btn-icon" data-id="${row.id}" data-bs-toggle="tooltip" title="Edit Order">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="btn btn-danger btn-sm delete-btn btn-icon" data-id="${row.id}" data-bs-toggle="tooltip" title="Delete Order">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `
            }
        ],
        "drawCallback": function() {
            // Re-initialize tooltips every time the table is redrawn to ensure they work on new elements.
            $('[data-bs-toggle="tooltip"]').tooltip('dispose').tooltip();
        }
    });

    // ---
    // --- 3. EVENT LISTENERS
    // ---

    /**
     * Handles the 'click' event for the 'Add Order' button.
     * Resets and prepares the modal for creating a new order.
     */
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

    /**
     * Handles the 'click' event for the 'Add Item' button in the order form.
     * Dynamically adds a new row for an order item.
     */
    $('#add-item-btn').on('click', function() {
        const itemHtml = `
            <div class="row order-item mb-2">
                <div class="col-md-6">
                    <select class="form-select gas-select" required style="width: 100%;"></select>
                </div>
                <div class="col-md-4">
                    <input type="number" class="form-control quantity" placeholder="Quantity" required inputmode="numeric">
                </div>
                <div class="col-md-2">
                    <button type="button" class="btn btn-danger btn-sm remove-item-btn"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        const $newItem = $(itemHtml);
        $orderItemsContainer.append($newItem);
        const $gasSelect = $newItem.find('.gas-select');
        initializeGasSelect($gasSelect);
        loadGasOptions($gasSelect);
    });

    /**
     * Uses event delegation to handle 'click' events for 'remove-item-btn'.
     * This is efficient as it attaches a single listener to the container.
     */
    $orderItemsContainer.on('click', '.remove-item-btn', function() {
        $(this).closest('.order-item').remove();
    });

    /**
     * Handles the form submission for both creating and updating an order.
     */
    $form.on('submit', async function(e) {
        e.preventDefault();

        // Collect order items from the form
        const items = $('.order-item').map(function() {
            const gas_id = $(this).find('.gas-select').val();
            const quantity = $(this).find('.quantity').val();
            if (gas_id && quantity) {
                return { gas_id: parseInt(gas_id), quantity: parseInt(quantity) };
            }
        }).get();

        const isEdit = $orderIdInput.val();
        const orderData = {
            company_id: parseInt($companySelect.val()),
            area: $areaInput.val(),
            mobile_no: $mobileInput.val(),
            notes: $notesInput.val(),
            items: items,
            // Only include status and driver if it's an existing order
            status_id: isEdit ? parseInt($statusSelect.val()) : undefined,
            driver_id: isEdit ? parseInt($driverSelect.val()) : undefined
        };

        const url = isEdit ? `/api/orders/${isEdit}` : '/api/orders/';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const data = await apiFetch(url, { method, body: JSON.stringify(orderData) });
            if (data.statusCode === 200 || data.statusCode === 201) {
                addEditModal.hide();
                table.ajax.reload(null, false); // `false` prevents resetting pagination
                showToast(data.message || 'Success!', 'success');
            } else {
                showToast(data.message || 'An error occurred.', 'danger');
            }
        } catch (error) {
            showToast('An unexpected network error occurred.', 'danger');
        }
    });

    /**
     * Event delegation for view, edit, and delete buttons within the DataTable.
     */
    $('#order-table tbody').on('click', '.view-btn', handleViewClick);
    $('#order-table tbody').on('click', '.edit-btn', handleEditClick);
    $('#order-table tbody').on('click', '.delete-btn', handleDeleteClick);

    /**
     * Handles the final confirmation for deleting an order.
     */
    $('#confirm-delete-btn').on('click', async function() {
        if (orderToDeleteId) {
            try {
                const data = await apiFetch(`/api/orders/${orderToDeleteId}`, { method: 'DELETE' });
                deleteModal.hide();
                table.ajax.reload(null, false);
                showToast(data.message || 'Deleted successfully!', 'success');
            } catch (error) {
                showToast('An unexpected error occurred.', 'danger');
            } finally {
                orderToDeleteId = null;
            }
        }
    });


    // ---
    // --- 4. API & DATA HANDLING FUNCTIONS
    // ---

    /**
     * A generic wrapper for the Fetch API that includes the authorization token
     * and standard headers. It simplifies making authenticated API calls.
     * @param {string} url - The API endpoint to call.
     * @param {object} [options={}] - Optional fetch options (e.g., method, body).
     * @returns {Promise<any>} - A promise that resolves to the JSON response.
     */
    async function apiFetch(url, options = {}) {
        const token = localStorage.getItem('accessToken');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            // Throw an error for non-successful HTTP statuses to be caught by the calling function
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    /**
     * Fetches details for a single order and displays them in the 'view' modal.
     * @param {Event} e - The click event object.
     */
    async function handleViewClick(e) {
        const orderId = $(e.currentTarget).data('id');
        try {
            const data = await apiFetch(`/api/orders/${orderId}`);
            if (data.statusCode === 200) {
                const order = data.data;
                $('#view-company-name').text(order.company_name);
                $('#view-order-date').text(formatDateTime(order.created_at));
                $('#view-status').text(order.status_name);
                $('#view-driver').text(order.driver_name || '-');
                $('#view-area').text(order.area);
                $('#view-mobile').text(order.mobile_no);
                $('#view-notes').text(order.notes);

                const $itemsContainer = $('#view-order-items').empty();
                order.items.forEach(item => {
                    $itemsContainer.append(`<p><strong>${item.gas_name}:</strong> ${item.quantity} ${item.gas_unit}</p>`);
                });
                viewModal.show();
            } else {
                showToast(data.message || 'Could not fetch order details.', 'warning');
            }
        } catch (error) {
            showToast('An unexpected error occurred while fetching order details.', 'danger');
        }
    }

    /**
     * Fetches data for an order and populates the 'edit' modal.
     * @param {Event} e - The click event object.
     */
    async function handleEditClick(e) {
        const orderId = $(e.currentTarget).data('id');
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

                // Load all dropdowns with the current order's values
                loadCompanyOptions(order.company_id);
                loadStatusOptions(order.status_id);
                loadDriverOptions(order.driver_id);

                order.items.forEach(item => {
                    const itemHtml = `
                        <div class="row order-item mb-2">
                            <div class="col-md-6"><select class="form-select gas-select" required style="width: 100%;"></select></div>
                            <div class="col-md-4"><input type="number" class="form-control quantity" value="${item.quantity}" required inputmode="numeric"></div>
                            <div class="col-md-2"><button type="button" class="btn btn-danger btn-sm remove-item-btn"><i class="fas fa-trash"></i></button></div>
                        </div>`;
                    const $newItem = $(itemHtml);
                    $orderItemsContainer.append($newItem);
                    const $gasSelect = $newItem.find('.gas-select');
                    initializeGasSelect($gasSelect);
                    loadGasOptions($gasSelect, item.gas_id);
                });
                addEditModal.show();
            } else {
                showToast(data.message || 'Could not fetch order data.', 'warning');
            }
        } catch (error) {
            showToast('An unexpected error occurred while fetching order data.', 'danger');
        }
    }

    /**
     * Shows the delete confirmation modal.
     * @param {Event} e - The click event object.
     */
    function handleDeleteClick(e) {
        orderToDeleteId = $(e.currentTarget).data('id');
        deleteModal.show();
    }

    // ---
    // --- 5. UI HELPER & DYNAMIC CONTENT FUNCTIONS
    // ---

    /**
     * Formats a date string into DD-MM-YY HH:MM AM/PM format.
     * @param {string} dateString - The date string to format.
     * @returns {string} The formatted date and time string.
     */
    function formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const year = String(date.getFullYear()).slice(-2);

        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const strHours = String(hours).padStart(2, '0');

        return `${day}-${month}-${year} ${strHours}:${minutes} ${ampm}`;
    }
    
    /**
     * A generic function to populate a Select2 dropdown from a cached list or via an API call.
     * This reduces code duplication for loading companies, gases, etc.
     * @param {string} url - The API endpoint to fetch data from.
     * @param {jQuery} $selectElement - The jQuery object for the <select> element.
     * @param {Array|null} cachedOptions - A reference to the variable holding cached options.
     * @param {function} dataExtractor - A function to extract the desired array from the API response.
     * @param {number|string|null} [selectedId=null] - The ID to pre-select.
     * @returns {Promise<Array>} - A promise that resolves with the options data.
     */
    async function loadSelectOptions(url, $selectElement, cachedOptions, dataExtractor, selectedId = null) {
        if (cachedOptions) {
            populateSelectWithOptions($selectElement, cachedOptions, selectedId);
            return cachedOptions;
        }
        try {
            const data = await apiFetch(url);
            if (data.statusCode === 200) {
                const options = dataExtractor(data);
                populateSelectWithOptions($selectElement, options, selectedId);
                return options; // Return the fetched options for caching
            }
        } catch (error) {
            console.error(`Failed to load options for ${$selectElement.attr('id')}:`, error);
        }
        return []; // Return empty array on failure
    }

    // Specific functions to load each type of dropdown. They use the generic loader.
    async function loadCompanyOptions(selectedId) {
        companyOptions = await loadSelectOptions('/api/companies/', $companySelect, companyOptions, (data) => data.data.data, selectedId);
    }
    async function loadGasOptions($selectElement, selectedId) {
        gasOptions = await loadSelectOptions('/api/gases/', $selectElement, gasOptions, (data) => data.data, selectedId);
    }
    async function loadStatusOptions(selectedId) {
        statusOptions = await loadSelectOptions('/api/order-statuses/', $statusSelect, statusOptions, (data) => data.data, selectedId);
    }
    async function loadDriverOptions(selectedId) {
        driverOptions = await loadSelectOptions('/api/users/drivers', $driverSelect, driverOptions, (data) => data.data, selectedId);
    }

    /**
     * Populates a given select element with a list of options.
     * @param {jQuery} $selectElement - The jQuery object for the select element.
     * @param {Array<Object>} options - An array of objects, each with 'id' and 'name' properties.
     * @param {number|string|null} selectedId - The ID of the option to be pre-selected.
     */
    function populateSelectWithOptions($selectElement, options, selectedId) {
        $selectElement.empty().append('<option value="">Select an option</option>');
        options.forEach(option => {
            const isSelected = option.id === selectedId;
            const newOption = new Option(option.name, option.id, isSelected, isSelected);
            $selectElement.append(newOption);
        });
        // Set the value and trigger change for Select2 to update its display.
        $selectElement.val(selectedId).trigger('change');
    }

    /**
     * Initializes Select2 on a dynamically created gas selection dropdown.
     * @param {jQuery} $selectElement - The jQuery object for the select.
     */
    function initializeGasSelect($selectElement) {
        $selectElement.select2({ dropdownParent: $('#order-modal') });
    }

    /**
     * Displays a toast notification.
     * @param {string} message - The message to display.
     * @param {string} [type='info'] - The type of toast (e.g., 'success', 'danger', 'warning').
     */
    function showToast(message, type = 'info') {
        // This function dynamically creates and destroys a toast element for notifications.
        // It's a simple way to provide non-blocking feedback to the user.
        const toastContainer = document.createElement('div');
        toastContainer.className = `toast align-items-center text-white bg-${type} border-0`;
        toastContainer.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>`;

        const toastPlacement = document.createElement('div');
        toastPlacement.className = 'position-fixed bottom-0 end-0 p-3';
        toastPlacement.style.zIndex = 1055;
        toastPlacement.appendChild(toastContainer);
        document.body.appendChild(toastPlacement);

        const toast = new bootstrap.Toast(toastContainer, { delay: 3000 });
        toast.show();

        // Clean up the DOM after the toast is hidden
        toastContainer.addEventListener('hidden.bs.toast', () => toastPlacement.remove());
    }
});
