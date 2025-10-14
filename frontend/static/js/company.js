$(document).ready(function() {
    // --- 1. INITIALIZATION & VARIABLE DECLARATIONS ---
    const companyList = document.getElementById('company-list');
    const addEditModal = new bootstrap.Modal(document.getElementById('company-modal'));
    const deleteModal = new bootstrap.Modal(document.getElementById('delete-confirm-modal'));
    const detailsModal = new bootstrap.Modal(document.getElementById('company-details-modal'));
    const importModal = new bootstrap.Modal(document.getElementById('import-modal'));

    const $modalLabel = $('#company-modal-label');
    const $form = $('#company-form');
    const $companyIdInput = $('#company-id');
    const $companyNameInput = $('#company-name');
    const $companyAddressInput = $('#company-address');
    const $searchInput = $('#company-search-input');
    const $loadMoreBtn = $('#load-more-btn');
    const $paginationControls = $('#pagination-controls');

    let companyToDeleteId = null;
    let currentPage = 0;
    const pageSize = 10;
    let currentSearchTerm = '';
    let totalRecords = 0;

    // --- 2. DATA FETCHING & RENDERING ---

    fetchCompanies(true); // Initial load

    function fetchCompanies(isNewSearch = false) {
        if (isNewSearch) {
            currentPage = 0;
            companyList.innerHTML = ''; // Clear list for new search
        }

        const params = new URLSearchParams({
            start: currentPage * pageSize,
            length: pageSize,
            search: currentSearchTerm,
            draw: new Date().getTime() // Unique value to prevent caching issues
        });

        apiFetch(`/api/companies/?${params.toString()}`)
            .then(data => {
                if (data.statusCode === 200 && data.data) {
                    const { data: companies, recordsFiltered } = data.data;
                    totalRecords = recordsFiltered;
                    renderCompanyList(companies, isNewSearch);
                    updatePaginationControls();
                } else {
                    showToast(data.message || 'Failed to load companies.', 'danger');
                    if (isNewSearch) renderCompanyList([], true);
                }
            })
            .catch(() => {
                showToast('An error occurred while fetching companies.', 'danger');
                if (isNewSearch) renderCompanyList([], true);
            });
    }

    function renderCompanyList(companies, isNewSearch) {
        if (isNewSearch) {
            companyList.innerHTML = '';
        }

        if (companies.length === 0 && isNewSearch) {
            const message = currentSearchTerm ? 'No companies match your search.' : 'No companies found. Add one to get started!';
            companyList.innerHTML = `<p class="text-center text-muted mt-3">${message}</p>`;
            return;
        }

        companies.forEach(company => {
            const companyCard = createCompanyCardElement(company);
            companyList.appendChild(companyCard);
            initSwipe(companyCard);
        });
    }

    function createCompanyCardElement(company) {
        const companyCard = document.createElement('div');
        companyCard.className = 'company-card';
        companyCard.dataset.id = company.id;

        companyCard.innerHTML = `
            <div class="company-content">
                <div class="company-name">${company.name}</div>
                <p class="company-address">${company.address}</p>
            </div>
            <div class="swipe-action edit"><i class="fas fa-pencil-alt"></i></div>
            <div class="swipe-action delete"><i class="fas fa-trash-alt"></i></div>
        `;
        return companyCard;
    }

    function updatePaginationControls() {
        const companiesLoaded = (currentPage + 1) * pageSize;
        if (companiesLoaded < totalRecords) {
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
            fetchCompanies(true);
        }
    }, 300));

    $loadMoreBtn.on('click', function() {
        currentPage++;
        fetchCompanies(false);
    });

    $('#add-company-btn').on('click', function() {
        $form[0].reset();
        $companyIdInput.val('');
        $modalLabel.text('Add Company');
        addEditModal.show();
    });

    $form.on('submit', async function(e) {
        e.preventDefault();
        const companyData = {
            name: $companyNameInput.val(),
            address: $companyAddressInput.val(),
        };

        const isEdit = $companyIdInput.val();
        const url = isEdit ? `/api/companies/${isEdit}` : '/api/companies/';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const data = await apiFetch(url, { method, body: JSON.stringify(companyData) });
            if (data.statusCode === 200 || data.statusCode === 201) {
                addEditModal.hide();
                showToast(data.message, 'success');
                fetchCompanies(true); // Refresh list from the beginning
            } else {
                showToast(data.message || 'An unknown error occurred.', 'danger');
            }
        } catch (error) {
            showToast('An unexpected network error occurred.', 'danger');
        }
    });

    $('#confirm-delete-btn').on('click', async function() {
        if (companyToDeleteId) {
            try {
                const data = await apiFetch(`/api/companies/${companyToDeleteId}`, { method: 'DELETE' });
                deleteModal.hide();
                if (data.statusCode === 200) {
                    showToast(data.message, 'success');
                    fetchCompanies(true); // Refresh list from the beginning
                } else {
                    showToast(data.message || 'An unknown error occurred.', 'danger');
                }
            } catch (error) {
                showToast('An unexpected network error occurred while deleting.', 'danger');
            }
            companyToDeleteId = null;
        }
    });

    $('#import-companies-btn').on('click', function() {
        resetImportModal();
        importModal.show();
    });

    $('#start-import-btn').on('click', handleFileImport);

    // --- 4. IMPORT FUNCTIONALITY ---

    function resetImportModal() {
        $('#import-step-1').show();
        $('#import-step-2').hide();
        $('#excel-file-input').val('');
        $('#start-import-btn').prop('disabled', false);
        $('#import-status-text').text('');
        $('#import-progress-bar').css('width', '0%').attr('aria-valuenow', 0);
    }

    async function handleFileImport() {
        const fileInput = document.getElementById('excel-file-input');
        const file = fileInput.files[0];

        if (!file) {
            showToast('Please select a file to import.', 'warning');
            return;
        }

        $('#import-step-1').hide();
        $('#import-step-2').show();
        $('#start-import-btn').prop('disabled', true);

        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                if (jsonData.length <= 1) { // Changed to <= 1 to account for header only
                    showToast('The selected file is empty or contains only a header.', 'danger');
                    resetImportModal();
                    return;
                }

                await processImport(jsonData);
                showToast('Import completed successfully!', 'success');
                setTimeout(() => {
                    importModal.hide();
                    fetchCompanies(true); // Refresh the main list
                }, 1000);

            } catch (error) {
                showToast('Error reading or processing the file. Make sure it is a valid .xlsx file.', 'danger');
                resetImportModal();
            }
        };
        reader.readAsArrayBuffer(file);
    }

    async function processImport(data) {
        const totalRows = data.length - 1; // Exclude header row
        let processedCount = 0;

        // Start from the second row (index 1) to skip header
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const companyName = row[0];
            const companyAddress = row[1];

            if (companyName && companyAddress) {
                try {
                    await apiFetch('/api/companies/', {
                        method: 'POST',
                        body: JSON.stringify({ name: companyName, address: companyAddress }),
                    });
                } catch (err) {
                    // Log the error but continue with the next row
                    console.error(`Failed to import company: ${companyName}`, err);
                }
            }
            processedCount++;
            const progress = Math.round((processedCount / totalRows) * 100);
            $('#import-progress-bar').css('width', `${progress}%`).attr('aria-valuenow', progress);
            $('#import-status-text').text(`Importing ${processedCount} of ${totalRows} companies...`);
        }
    }

    // --- 5. SWIPE & TAP FUNCTIONALITY ---
    function initSwipe(card) {
        const hammer = new Hammer(card);
        const content = card.querySelector('.company-content');
        const companyId = card.dataset.id;

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
                companyToDeleteId = companyId;
                deleteModal.show();
            } else if (ev.deltaX < -swipeThreshold) {
                handleEditClick(companyId);
            }

            content.style.transition = 'transform 0.3s ease';
            content.style.transform = 'translateX(0)';
            setTimeout(() => { content.style.transition = ''; }, 300);
        });

        hammer.on('tap', function() {
            showDetailsModal(companyId);
        });
    }

    async function handleEditClick(companyId) {
        try {
            const data = await apiFetch(`/api/companies/${companyId}`);
            if (data.statusCode === 200) {
                const company = data.data;
                $form[0].reset();
                $companyIdInput.val(company.id);
                $companyNameInput.val(company.name);
                $companyAddressInput.val(company.address);
                $modalLabel.text('Edit Company');
                addEditModal.show();
            } else {
                showToast(data.message || 'Could not fetch company data.', 'danger');
            }
        } catch (error) {
            showToast('An unexpected error occurred while opening the editor.', 'danger');
        }
    }

    async function showDetailsModal(companyId) {
        try {
            const data = await apiFetch(`/api/companies/${companyId}`);
            if (data.statusCode === 200) {
                const company = data.data;
                const contentEl = document.getElementById('company-details-content');
                contentEl.innerHTML = `
                    <div class="detail-item"><span class="detail-label">ID</span><span class="detail-value">${company.id}</span></div>
                    <div class="detail-item"><span class="detail-label">Name</span><span class="detail-value">${company.name}</span></div>
                    <div class="detail-item"><span class="detail-label">Address</span><span class="detail-value">${company.address}</span></div>
                    <div class="detail-item"><span class="detail-label">Created On</span><span class="detail-value">${new Date(company.created_at).toLocaleString()}</span></div>
                    <div class="detail-item"><span class="detail-label">Last Updated</span><span class="detail-value">${new Date(company.updated_at).toLocaleString()}</span></div>
                `;
                detailsModal.show();
            } else {
                showToast(data.message || 'Could not fetch company details.', 'danger');
            }
        } catch (error) {
            showToast('An unexpected network error occurred.', 'danger');
        }
    }

    // --- 6. API & UI HELPERS ---
    async function apiFetch(url, options = {}) {
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (token) { headers['Authorization'] = `Bearer ${token}`; }
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
             const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
             throw new Error(errorData.message);
        }
        return response.json();
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