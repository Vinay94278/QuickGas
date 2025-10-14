$(document).ready(function() {
    // --- 1. INITIALIZATION & VARIABLE DECLARATIONS ---
    const userList = document.getElementById('user-list');
    const addEditModal = new bootstrap.Modal(document.getElementById('user-modal'));
    const deleteModal = new bootstrap.Modal(document.getElementById('delete-confirm-modal'));
    const detailsModal = new bootstrap.Modal(document.getElementById('user-details-modal'));

    const $modalLabel = $('#user-modal-label');
    const $form = $('#user-form');
    const $userIdInput = $('#user-id');
    const $nameInput = $('#name');
    const $emailInput = $('#email');
    const $phoneInput = $('#phone');
    const $addressInput = $('#address');
    const $companyIdInput = $('#company_id');
    const $roleIdInput = $('#role_id');
    const $passwordInput = $('#password');
    const $searchInput = $('#user-search-input');
    const $loadMoreBtn = $('#load-more-btn');
    const $paginationControls = $('#pagination-controls');

    let userToDeleteId = null;
    let currentPage = 0;
    const pageSize = 10;
    let currentSearchTerm = '';
    let totalRecords = 0;

    // Initialize Select2
    const dropdownParent = $('#user-modal .modal-content');
    $companyIdInput.select2({ dropdownParent: dropdownParent, placeholder: 'Select Company' });
    $roleIdInput.select2({ dropdownParent: dropdownParent, placeholder: 'Select Role' });

    // --- 2. DATA FETCHING & RENDERING ---

    // Initial data fetch
    Promise.all([
        loadSelectOptions('/api/companies/all', $companyIdInput, (data) => data.data),
        loadSelectOptions('/api/roles/', $roleIdInput, (data) => data.data)
    ]).then(() => {
        fetchUsers(true);
    }).catch(error => {
        showToast('Error fetching initial data. Please refresh the page.', 'danger');
        console.error("Initialization Error:", error);
    });
    
    function fetchUsers(isNewSearch = false) {
        if (isNewSearch) {
            currentPage = 0;
            userList.innerHTML = ''; // Clear list for new search
        }

        const params = new URLSearchParams({
            start: currentPage * pageSize,
            length: pageSize,
            search: currentSearchTerm,
        });

        apiFetch(`/api/users/all?${params.toString()}`)
            .then(response => {
                if (response.statusCode === 200 && response.data) {
                    const { data: users, recordsFiltered } = response.data;
                    totalRecords = recordsFiltered;
                    renderUserList(users, isNewSearch);
                    updatePaginationControls();
                } else {
                    showToast(response.message || 'Failed to load users.', 'danger');
                    if (isNewSearch) renderUserList([], true);
                }
            })
            .catch(() => {
                showToast('An error occurred while fetching users.', 'danger');
                if (isNewSearch) renderUserList([], true);
            });
    }

    function renderUserList(users, isNewSearch) {
        if (isNewSearch) {
            userList.innerHTML = '';
        }

        if (users.length === 0 && isNewSearch) {
            const message = currentSearchTerm ? 'No users match your search.' : 'No users found. Add one to get started!';
            userList.innerHTML = `<p class="text-center text-muted mt-3">${message}</p>`;
            return;
        }

        users.forEach(user => {
            const userCard = createUserCardElement(user);
            userList.appendChild(userCard);
            initSwipe(userCard);
        });
    }

    function createUserCardElement(user) {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.dataset.id = user.id;

        const companyName = user.company ? user.company.name : 'N/A';
        const roleName = user.role ? user.role.name : 'N/A';

        userCard.innerHTML = `
            <div class="user-content">
                <div class="user-main-info">
                    <div class="user-name">${user.name}</div>
                    <div class="user-email">${user.email}</div>
                </div>
                <div class="user-details-info">
                    <div class="user-company"><strong>Company:</strong> ${companyName}</div>
                    <div class="user-role"><strong>Role:</strong> ${roleName}</div>
                </div>
            </div>
            <div class="swipe-action edit"><i class="fas fa-pencil-alt"></i></div>
            <div class="swipe-action delete"><i class="fas fa-trash-alt"></i></div>
        `;
        return userCard;
    }

    function updatePaginationControls() {
        const usersLoaded = (currentPage + 1) * pageSize;
        if (usersLoaded < totalRecords) {
            $paginationControls.show();
        } else {
            $paginationControls.hide();
        }
    }

    // --- 3. EVENT LISTENERS ---

    $searchInput.on('input', debounce(function() {
        const searchTerm = $(this).val().toLowerCase();
        if (searchTerm !== currentSearchTerm) {
            currentSearchTerm = searchTerm;
            fetchUsers(true);
        }
    }, 300));

    $loadMoreBtn.on('click', function() {
        currentPage++;
        fetchUsers(false);
    });

    $('#add-user-btn').on('click', function() {
        $form[0].reset();
        $userIdInput.val('');
        $modalLabel.text('Add User');
        $passwordInput.prop('required', true);
        $companyIdInput.val('').trigger('change'); // Reset select2
        $roleIdInput.val('').trigger('change');   // Reset select2
        addEditModal.show();
    });

    $form.on('submit', async function(e) {
        e.preventDefault();
        const companyId = $companyIdInput.val();
        const roleId = $roleIdInput.val();

        if (!companyId || !roleId) {
            showToast('Please select a Company and a Role.', 'warning');
            return;
        }
        
        const userData = {
            name: $nameInput.val(),
            email: $emailInput.val(),
            phone: $phoneInput.val(),
            address: $addressInput.val(),
            company_id: parseInt(companyId),
            role_id: parseInt(roleId),
            password: $passwordInput.val()
        };

        const isEdit = $userIdInput.val();
        const url = isEdit ? `/api/users/${isEdit}` : '/api/users/';
        const method = isEdit ? 'PUT' : 'POST';

        if (!isEdit) {
            if (!userData.password) {
                showToast('Password is required for new users.', 'danger');
                return;
            }
        } else {
            if (!userData.password) {
                delete userData.password; // Don't send empty password on edit
            }
        }

        try {
            const data = await apiFetch(url, { method, body: JSON.stringify(userData) });
            if (data.statusCode === 200 || data.statusCode === 201) {
                addEditModal.hide();
                showToast(data.message, 'success');
                fetchUsers(true); // Refresh list from the beginning
            } else {
                showToast(data.message || 'An unknown error occurred.', 'danger');
            }
        } catch (error) {
            showToast('An unexpected network error occurred.', 'danger');
        }
    });

    $('#confirm-delete-btn').on('click', async function() {
        if (userToDeleteId) {
            try {
                const data = await apiFetch(`/api/users/${userToDeleteId}`, { method: 'DELETE' });
                deleteModal.hide();
                if (data.statusCode === 200) {
                    showToast(data.message, 'success');
                    fetchUsers(true); // Refresh list from the beginning
                } else {
                    showToast(data.message || 'An unknown error occurred.', 'danger');
                }
            } catch (error) {
                showToast('An unexpected network error occurred while deleting.', 'danger');
            }
            userToDeleteId = null;
        }
    });

    // --- 4. SWIPE & TAP FUNCTIONALITY ---
    function initSwipe(card) {
        const hammer = new Hammer(card);
        const content = card.querySelector('.user-content');
        const userId = card.dataset.id;

        hammer.on('pan', function(ev) {
            if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) return;
            if (ev.deltaX < 0) {
                card.classList.add('show-edit');
                card.classList.remove('show-delete');
            } else if (ev.deltaX > 0) {
                card.classList.add('show-delete');
                card.classList.remove('show-edit');
            }
            content.style.transform = `translateX(${ev.deltaX}px)`;
        });

        hammer.on('panend', function(ev) {
            card.classList.remove('show-edit', 'show-delete');
            const swipeThreshold = 100;

            if (ev.deltaX > swipeThreshold) {
                userToDeleteId = userId;
                deleteModal.show();
            } else if (ev.deltaX < -swipeThreshold) {
                handleEditClick(userId);
            }

            content.style.transition = 'transform 0.3s ease';
            content.style.transform = 'translateX(0)';
            setTimeout(() => { content.style.transition = ''; }, 300);
        });

        hammer.on('tap', function() {
            showDetailsModal(userId);
        });
    }

    async function handleEditClick(userId) {
        try {
            const data = await apiFetch(`/api/users/${userId}`);
            if (data.statusCode === 200) {
                const user = data.data;
                $form[0].reset();
                $userIdInput.val(user.id);
                $nameInput.val(user.name);
                $emailInput.val(user.email);
                $phoneInput.val(user.phone);
                $addressInput.val(user.address);
                
                // Set dropdowns
                $companyIdInput.val(user.company_id).trigger('change');
                $roleIdInput.val(user.role_id).trigger('change');

                $modalLabel.text('Edit User');
                $passwordInput.prop('required', false);
                addEditModal.show();
            } else {
                showToast(data.message || 'Could not fetch user data.', 'danger');
            }
        } catch (error) {
            showToast('An unexpected error occurred while opening the editor.', 'danger');
        }
    }

    async function showDetailsModal(userId) {
        try {
            const response = await apiFetch(`/api/users/${userId}`);
            if (response.statusCode === 200) {
                const user = response.data;
                const companyName = user.company ? user.company.name : 'N/A';
                const roleName = user.role ? user.role.name : 'N/A';

                const contentEl = document.getElementById('user-details-content');
                contentEl.innerHTML = `
                    <div class="detail-item"><span class="detail-label">ID</span><span class="detail-value">${user.id}</span></div>
                    <div class="detail-item"><span class="detail-label">Name</span><span class="detail-value">${user.name}</span></div>
                    <div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">${user.email}</span></div>
                    <div class="detail-item"><span class="detail-label">Phone</span><span class="detail-value">${user.phone || 'N/A'}</span></div>
                    <div class="detail-item"><span class="detail-label">Address</span><span class="detail-value">${user.address || 'N/A'}</span></div>
                    <div class="detail-item"><span class="detail-label">Company</span><span class="detail-value">${companyName}</span></div>
                    <div class="detail-item"><span class="detail-label">Role</span><span class="detail-value">${roleName}</span></div>
                    <div class="detail-item"><span class="detail-label">Created On</span><span class="detail-value">${new Date(user.created_at).toLocaleString()}</span></div>
                    <div class="detail-item"><span class="detail-label">Last Updated</span><span class="detail-value">${new Date(user.updated_at).toLocaleString()}</span></div>
                `;
                detailsModal.show();
            } else {
                showToast(response.message || 'Could not fetch user details.', 'danger');
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

    function populateSelectWithOptions($selectElement, options, selectedId) {
        $selectElement.empty().append('<option value="">Select an option</option>');
        options.forEach(option => {
            const isSelected = option.id == selectedId;
            const newOption = new Option(option.name, option.id, isSelected, isSelected);
            $selectElement.append(newOption);
        });
        $selectElement.val(selectedId).trigger('change');
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

    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }
});
