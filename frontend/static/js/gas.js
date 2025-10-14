$(document).ready(function() {
    // --- 1. INITIALIZATION & VARIABLE DECLARATIONS ---
    const gasList = document.getElementById('gas-list');
    const addEditModal = new bootstrap.Modal(document.getElementById('gas-modal'));
    const deleteModal = new bootstrap.Modal(document.getElementById('delete-confirm-modal'));
    const detailsModal = new bootstrap.Modal(document.getElementById('gas-details-modal'));

    const $modalLabel = $('#gas-modal-label');
    const $form = $('#gas-form');
    const $gasIdInput = $('#gas-id');
    const $gasNameInput = $('#gas-name');
    const $gasUnitInput = $('#gas-unit');
    const $gasDescriptionInput = $('#gas-description');

    let gasToDeleteId = null;

    // --- 2. DATA FETCHING & RENDERING ---

    fetchGases();

    function fetchGases() {
        apiFetch('/api/gases/')
            .then(data => {
                gasList.innerHTML = ''; // Clear existing list
                if (data.statusCode === 200 && data.data) {
                    renderGases(data.data);
                } else {
                    showToast(data.message || 'Failed to load gases.', 'danger');
                }
            })
            .catch(() => {
                showToast('An error occurred while fetching gases.', 'danger');
            });
    }

    function renderGases(gases) {
        gases.forEach(gas => renderGasCard(gas));
    }

    function renderGasCard(gas) {
        const gasCard = document.createElement('div');
        gasCard.className = 'gas-card';
        gasCard.dataset.id = gas.id;

        gasCard.innerHTML = `
            <div class="gas-content">
                <div class="gas-name">${gas.name}</div>
                <div class="gas-details">
                    <p class="unit"><strong>Unit:</strong> <span>${gas.unit || 'N/A'}</span></p>
                    <p class="description"><strong>Description:</strong> <span>${gas.description || 'N/A'}</span></p>
            </div>
            </div>
            <div class="swipe-action edit"><i class="fas fa-pencil-alt"></i></div>
            <div class="swipe-action delete"><i class="fas fa-trash-alt"></i></div>
        `;

        gasList.appendChild(gasCard);
        initSwipe(gasCard);
    }

    // --- 3. EVENT LISTENERS ---

    $('#add-gas-btn').on('click', function() {
        $form[0].reset();
        $gasIdInput.val('');
        $modalLabel.text('Add Gas');
        addEditModal.show();
    });

    $form.on('submit', async function(e) {
        e.preventDefault();
        try {
            const isEdit = $gasIdInput.val();
            const gasData = {
                name: $gasNameInput.val(),
                unit: $gasUnitInput.val(),
                description: $gasDescriptionInput.val(),
            };

            const url = isEdit ? `/api/gases/${isEdit}` : '/api/gases/';
            const method = isEdit ? 'PUT' : 'POST';

            const data = await apiFetch(url, { method, body: JSON.stringify(gasData) });
            const message = data.message || 'An unknown error occurred.';

            if (data.statusCode === 200 || data.statusCode === 201) {
                addEditModal.hide();
                showToast(message, 'success');
                fetchGases();
            } else {
                showToast(message, 'danger');
            }
        } catch (error) {
            showToast('An unexpected network error occurred.', 'danger');
        }
    });

    $('#confirm-delete-btn').on('click', async function() {
        if (gasToDeleteId) {
            try {
                const data = await apiFetch(`/api/gases/${gasToDeleteId}`, { method: 'DELETE' });
                const message = data.message || 'An unknown error occurred.';
                deleteModal.hide();

                if (data.statusCode === 200) {
                    showToast(message, 'success');
                    fetchGases();
                } else {
                    showToast(message, 'danger');
                }
            } catch (error) {
                showToast('An unexpected network error occurred while deleting.', 'danger');
            }
            gasToDeleteId = null;
        }
    });

    // --- 4. SWIPE & TAP FUNCTIONALITY ---
    function initSwipe(card) {
        const hammer = new Hammer(card);
        const content = card.querySelector('.gas-content');
        const gasId = card.dataset.id;

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
                gasToDeleteId = gasId;
                deleteModal.show();
            } else if (ev.deltaX < -100) {
                handleEditClick(gasId);
            }

            content.style.transition = 'transform 0.3s ease';
            content.style.transform = 'translateX(0)';
            setTimeout(() => {
                content.style.transition = '';
            }, 300);
        });

        hammer.on('tap', function() {
            showDetailsModal(gasId);
        });
    }

    async function handleEditClick(gasId) {
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
                showToast(data.message || 'Could not fetch gas data.', 'danger');
            }
        } catch (error) {
            showToast('An unexpected error occurred while opening the editor.', 'danger');
        }
    }

    async function showDetailsModal(gasId) {
        try {
            const data = await apiFetch(`/api/gases/${gasId}`);
            if (data.statusCode === 200) {
                const gas = data.data;
                const contentEl = document.getElementById('gas-details-content');

                contentEl.innerHTML = `
                    <h6>Gas Details</h6>
                    <div class="detail-item"><span class="detail-label">Name</span><span class="detail-value">${gas.name}</span></div>
                    <div class="detail-item"><span class="detail-label">Unit</span><span class="detail-value">${gas.unit || 'N/A'}</span></div>
                    <div class="detail-item"><span class="detail-label">Description</span><span class="detail-value">${gas.description || 'N/A'}</span></div>
                    <div class="detail-item"><span class="detail-label">Created On</span><span class="detail-value">${new Date(gas.created_at).toLocaleString()}</span></div>
                    <div class="detail-item"><span class="detail-label">Last Updated</span><span class="detail-value">${new Date(gas.updated_at).toLocaleString()}</span></div>
                `;

                detailsModal.show();
            } else {
                showToast(data.message || 'Could not fetch gas details.', 'danger');
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
