/**
 * @file This file handles the logic for the gases page, including displaying,
 * creating, updating, and deleting gases. It uses jQuery, DataTables, and Bootstrap.
 * @author Your Name/Team
 * @version 1.0.0
 */

// Wait for the DOM to be fully loaded before executing the script
$(document).ready(function() {
    // ---
    // --- 1. INITIALIZATION & VARIABLE DECLARATIONS
    // ---

    // Initialize Bootstrap modals for reusability.
    const addEditModal = new bootstrap.Modal(document.getElementById('gas-modal'));
    const deleteModal = new bootstrap.Modal(document.getElementById('delete-confirm-modal'));

    // Cache jQuery selections of frequently used elements for performance.
    const $modalLabel = $('#gas-modal-label');
    const $form = $('#gas-form');
    const $gasIdInput = $('#gas-id');
    const $gasNameInput = $('#gas-name');
    const $gasUnitInput = $('#gas-unit');
    const $gasDescriptionInput = $('#gas-description');

    // State variable to hold the ID of the gas marked for deletion.
    let gasToDeleteId = null;

    // ---
    // --- 2. DATATABLE SETUP
    // ---

    const table = $('#gas-table').DataTable({
        "processing": true, // Show processing indicator
        "serverSide": true, // Enable server-side processing
        "ajax": {
            "url": "/api/gases/",
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
                    json.recordsTotal = json.data.length;
                    json.recordsFiltered = json.data.length;
                    // Add a sequential number for each row.
                    const start = table.page.info().start;
                    json.data.forEach((item, index) => {
                        item.seq = start + index + 1;
                    });
                    return json.data;
                }
                // Return an empty array in case of an error.
                return [];
            }
        },
        "columns": [
            { "data": "seq", "orderable": false, "searchable": false },
            { "data": "name" },
            { "data": "unit" },
            { "data": "description" },
            {
                "data": null,
                "orderable": false,
                "searchable": false,
                "render": (data, type, row) => `
                    <div class="actions-group" role="group">
                        <button class="btn btn-info btn-sm edit-btn btn-icon" data-id="${row.id}" data-bs-toggle="tooltip" title="Edit Gas">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="btn btn-danger btn-sm delete-btn btn-icon" data-id="${row.id}" data-bs-toggle="tooltip" title="Delete Gas">
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
     * Handles the 'click' event for the 'Add Gas' button.
     * Resets and prepares the modal for creating a new gas.
     */
    $('#add-gas-btn').on('click', function() {
        $form[0].reset();
        $gasIdInput.val('');
        $modalLabel.text('Add Gas');
        addEditModal.show();
    });

    /**
     * Handles the form submission for both creating and updating a gas.
     */
    $form.on('submit', async function(e) {
        e.preventDefault();

        const isEdit = $gasIdInput.val();
        const gasData = {
            name: $gasNameInput.val(),
            unit: $gasUnitInput.val(),
            description: $gasDescriptionInput.val(),
        };

        const url = isEdit ? `/api/gases/${isEdit}` : '/api/gases/';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const data = await apiFetch(url, { method, body: JSON.stringify(gasData) });
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
     * Event delegation for edit and delete buttons within the DataTable.
     */
    $('#gas-table tbody').on('click', '.edit-btn', handleEditClick);
    $('#gas-table tbody').on('click', '.delete-btn', handleDeleteClick);

    /**
     * Handles the final confirmation for deleting a gas.
     */
    $('#confirm-delete-btn').on('click', async function() {
        if (gasToDeleteId) {
            try {
                const data = await apiFetch(`/api/gases/${gasToDeleteId}`, { method: 'DELETE' });
                deleteModal.hide();
                table.ajax.reload(null, false);
                showToast(data.message || 'Deleted successfully!', 'success');
            } catch (error) {
                showToast('An unexpected error occurred.', 'danger');
            } finally {
                gasToDeleteId = null;
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
     * Fetches data for a gas and populates the 'edit' modal.
     * @param {Event} e - The click event object.
     */
    async function handleEditClick(e) {
        const gasId = $(e.currentTarget).data('id');
        try {
            const data = await apiFetch(`/api/gases/${gasId}`);
            if (data.statusCode === 200) {
                const gas = data.data;
                $form[0].reset();
                $gasIdInput.val(gas.id);
                $modalLabel.text('Edit Gas');
                $gasNameInput.val(gas.name);
                $gasUnitInput.val(gas.unit);
                $gasDescriptionInput.val(gas.description);
                addEditModal.show();
            } else {
                showToast(data.message || 'Could not fetch gas data.', 'warning');
            }
        } catch (error) {
            showToast('An unexpected error occurred while fetching gas data.', 'danger');
        }
    }

    /**
     * Shows the delete confirmation modal.
     * @param {Event} e - The click event object.
     */
    function handleDeleteClick(e) {
        gasToDeleteId = $(e.currentTarget).data('id');
        deleteModal.show();
    }

    // ---
    // --- 5. UI HELPER FUNCTIONS
    // ---

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
