$(document).ready(function() {
    // Initialize Bootstrap modals for reusability
    const addEditModal = new bootstrap.Modal(document.getElementById('company-modal'));
    const deleteModal = new bootstrap.Modal(document.getElementById('delete-confirm-modal'));

    // Get references to modal elements
    const modalLabel = document.getElementById('company-modal-label');
    const form = document.getElementById('company-form');
    const companyId = document.getElementById('company-id');
    const companyName = document.getElementById('company-name');
    const companyAddress = document.getElementById('company-address');
    let companyToDeleteId = null; // Variable to store the ID of the company to be deleted

    // Initialize DataTables with server-side processing
    const table = $('#company-table').DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: "/api/companies/",
            type: "GET",
            beforeSend: function(xhr) {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                }
            },
            dataSrc: function(json) {
                if (json.statusCode === 200) {
                    json.recordsTotal = json.data.recordsTotal;
                    json.recordsFiltered = json.data.recordsFiltered;
                    const start = table.page.info().start;
                    json.data.data.forEach((item, index) => {
                        item.seq = start + index + 1;
                    });
                    return json.data.data;
                }
                return [];
            }
        },
        columns: [
            { data: "seq", orderable: false, searchable: false },
            { data: "name" },
            { data: "address" },
            {
                data: null,
                orderable: false,
                searchable: false,
                render: function(data, type, row) {
                    // Render professional icon buttons with tooltips
                    return `
                        <div class="actions-group" role="group">
                            <button class="btn btn-info btn-sm edit-btn btn-icon" data-id="${row.id}" data-bs-toggle="tooltip" title="Edit Company">
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                            <button class="btn btn-danger btn-sm delete-btn btn-icon" data-id="${row.id}" data-bs-toggle="tooltip" title="Delete Company">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        drawCallback: function(settings) {
            // Refresh tooltips every time the table is redrawn (for pagination, search, etc.)
            $('[data-bs-toggle="tooltip"]').tooltip('dispose'); // Remove any lingering tooltips
            $('[data-bs-toggle="tooltip"]').tooltip(); // Re-initialize all tooltips
        }
    });

    // Show modal for adding a new company
    $('#add-company-btn').on('click', function() {
        form.reset();
        companyId.value = '';
        modalLabel.textContent = 'Add Company';
        addEditModal.show();
    });

    // Show modal for editing an existing company
    $('#company-table tbody').on('click', '.edit-btn', function() {
        const data = table.row($(this).parents('tr')).data();
        companyId.value = data.id;
        companyName.value = data.name;
        companyAddress.value = data.address;
        modalLabel.textContent = 'Edit Company';
        addEditModal.show();
    });

    // Handle form submission for both Add and Edit
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const url = companyId.value ? `/api/companies/${companyId.value}` : '/api/companies/';
        const method = companyId.value ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
            },
            body: JSON.stringify({ name: companyName.value, address: companyAddress.value })
        })
        .then(response => response.json())
        .then(data => {
            if (data.statusCode === 200 || data.statusCode === 201) {
                addEditModal.hide();
                table.ajax.reload(null, false); // Reload table without resetting pagination
            }
        });
    });

    // Show the custom delete confirmation modal
    $('#company-table tbody').on('click', '.delete-btn', function() {
        companyToDeleteId = $(this).data('id');
        deleteModal.show();
    });

    // Handle the final confirmed deletion
    $('#confirm-delete-btn').on('click', function() {
        if (companyToDeleteId) {
            fetch(`/api/companies/${companyToDeleteId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
                }
            })
            .then(() => {
                deleteModal.hide();
                table.ajax.reload(null, false); // Reload table without resetting pagination
            });
        }
    });
});
