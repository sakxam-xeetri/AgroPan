/**
 * AgroPan — Farmer Dashboard: Marketplace (Crops) Page
 *
 * CRUD operations for crop listings.
 */

(function () {
    'use strict';

    const API = '../../API/';

    const list = document.getElementById('cropsList');
    const modal = document.getElementById('cropModal');
    const modalTitle = document.getElementById('cropModalTitle');
    const form = document.getElementById('cropForm');
    const nameInput = document.getElementById('cropName');
    const typeInput = document.getElementById('cropType');
    const priceInput = document.getElementById('cropPrice');
    const imageInput = document.getElementById('cropImage');
    const editId = document.getElementById('cropEditId');
    const alertBox = document.getElementById('cropAlert');
    const filterSelect = document.getElementById('cropFilter');

    function api(endpoint, body) {
        return fetch(API + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body || {})
        }).then(function (r) { return r.json(); });
    }

    function ts(unix) {
        if (!unix) return '—';
        var d = new Date(unix * 1000);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function showAlert(msg, type) {
        type = type || 'success';
        alertBox.innerHTML = '<div class="alert alert--' + type + '">' +
            '<i class="fa-solid fa-' + (type === 'success' ? 'check-circle' : 'circle-exclamation') + '"></i> ' +
            msg + '</div>';
        setTimeout(function () { alertBox.innerHTML = ''; }, 4000);
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }


    // ── Load Crops ──────────────────────────────────────────

    function loadCrops() {
        var filter = filterSelect.value;
        var body = filter ? { type: filter } : {};
        api('read/crops.php', body)
            .then(function (res) {
                if (!res.success || !res.data) { showEmpty(); return; }
                var crops = Array.isArray(res.data) ? res.data : [res.data];
                if (crops.length === 0) { showEmpty(); return; }
                renderCrops(crops);
            })
            .catch(function () { showEmpty('Failed to load crops.'); });
    }

    function showEmpty(msg) {
        list.innerHTML =
            '<div style="text-align:center;padding:var(--space-3xl);color:var(--color-text-light);grid-column:1/-1">' +
            '<div style="font-size:3rem;margin-bottom:var(--space-md)"><i class="fa-solid fa-wheat-awn"></i></div>' +
            '<p style="font-size:var(--text-lg);font-weight:var(--weight-semibold);margin-bottom:var(--space-xs)">' + (msg || 'No crops listed') + '</p>' +
            '<p style="margin-bottom:var(--space-lg)">List your first crop on the marketplace.</p>' +
            '<button class="btn btn--primary btn--sm" onclick="document.getElementById(\'addCropBtn\').click()"><i class="fa-solid fa-plus"></i> List Crop</button>' +
            '</div>';
    }

    function renderCrops(crops) {
        var defaultImg = '../../gallery/iot';
        list.innerHTML = crops.map(function (c) {
            var rawImg = c.image || '';
            var imgSrc = rawImg && rawImg.indexOf('http') !== 0 ? '../../' + rawImg : (rawImg || defaultImg);
            return '<div class="item-card">' +
                '<img class="crop-card__image" src="' + escapeHtml(imgSrc) + '" alt="' + escapeHtml(c.name) + '" onerror="this.style.display=\'none\'" />' +
                '<div class="crop-card__name">' + escapeHtml(c.name) + '</div>' +
                '<div class="crop-card__price">NPR ' + escapeHtml(String(c.price || 0)) + '/kg</div>' +
                '<div class="crop-card__meta">' +
                '<span class="badge badge--neutral">' + escapeHtml(c.type || 'Other') + '</span>' +
                '<span style="margin-left:auto">' + ts(c.last_updated) + '</span>' +
                '</div>' +
                '<div style="display:flex;gap:var(--space-xs);margin-top:var(--space-md)">' +
                '<button class="btn btn--ghost btn--sm" onclick="editCrop(' + c.crop_id + ')"><i class="fa-solid fa-pen"></i> Edit</button>' +
                '<button class="btn btn--ghost btn--sm" onclick="deleteCrop(' + c.crop_id + ')" style="color:var(--color-danger)"><i class="fa-solid fa-trash-can"></i> Delete</button>' +
                '</div>' +
                '</div>';
        }).join('');
    }


    // ── Modal ───────────────────────────────────────────────

    function openModal(title) {
        modalTitle.textContent = title || 'List New Crop';
        modal.classList.add('is-open');
        nameInput.focus();
    }

    function closeModal() {
        modal.classList.remove('is-open');
        form.reset();
        editId.value = '';
    }

    document.getElementById('addCropBtn').addEventListener('click', function () {
        editId.value = '';
        openModal('List New Crop');
    });

    document.getElementById('closeCropModal').addEventListener('click', closeModal);
    document.getElementById('cancelCropModal').addEventListener('click', closeModal);

    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
    });


    // ── Save ────────────────────────────────────────────────

    document.getElementById('saveCrop').addEventListener('click', function () {
        var name = nameInput.value.trim();
        var type = typeInput.value;
        var price = priceInput.value.trim();
        var image = imageInput.value.trim();

        if (!name || !type || !price) { showAlert('Name, type, and price are required.', 'danger'); return; }

        var id = editId.value;

        if (id) {
            api('update/crops.php', {
                crop_id: parseInt(id),
                name: name,
                type: type,
                price: price,
                image: image || ''
            }).then(function (res) {
                if (res.success) { showAlert('Crop updated!'); closeModal(); loadCrops(); }
                else { showAlert(res.message || 'Update failed.', 'danger'); }
            }).catch(function () { showAlert('Network error.', 'danger'); });
        } else {
            api('create/crops.php', {
                name: name,
                type: type,
                price: price,
                image: image || ''
            }).then(function (res) {
                if (res.success) { showAlert('Crop listed!'); closeModal(); loadCrops(); }
                else { showAlert(res.message || 'Creation failed.', 'danger'); }
            }).catch(function () { showAlert('Network error.', 'danger'); });
        }
    });


    // ── Edit ────────────────────────────────────────────────

    window.editCrop = function (id) {
        api('read/crops.php', { crop_id: id })
            .then(function (res) {
                if (res.success && res.data) {
                    var c = Array.isArray(res.data) ? res.data[0] : res.data;
                    nameInput.value = c.name || '';
                    typeInput.value = c.type || '';
                    priceInput.value = c.price || '';
                    imageInput.value = c.image || '';
                    editId.value = c.crop_id;
                    openModal('Edit Crop');
                }
            });
    };


    // ── Delete ──────────────────────────────────────────────

    window.deleteCrop = function (id) {
        if (!confirm('Delete this crop listing? This cannot be undone.')) return;
        api('delete/crops.php', { crop_id: id })
            .then(function (res) {
                if (res.success) { showAlert('Crop deleted.'); loadCrops(); }
                else { showAlert(res.message || 'Delete failed.', 'danger'); }
            })
            .catch(function () { showAlert('Network error.', 'danger'); });
    };


    // ── Events ──────────────────────────────────────────────

    filterSelect.addEventListener('change', loadCrops);


    // ── Init ────────────────────────────────────────────────

    loadCrops();

})();
