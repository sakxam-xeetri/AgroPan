/**
 * AgroPan — Admin: Crops CRUD
 */

(function () {
    'use strict';

    var API = '../../API/';
    var allItems = [];
    var deleteId = null;

    var tableBody = document.getElementById('tableBody');
    var searchInput = document.getElementById('searchInput');
    var filterType = document.getElementById('filterType');
    var rowCount = document.getElementById('rowCount');
    var addBtn = document.getElementById('addBtn');
    var formModal = document.getElementById('formModal');
    var modalTitle = document.getElementById('modalTitle');
    var modalClose = document.getElementById('modalClose');
    var modalCancel = document.getElementById('modalCancel');
    var modalSave = document.getElementById('modalSave');
    var deleteConfirm = document.getElementById('deleteConfirm');
    var deleteCancel = document.getElementById('deleteCancel');
    var deleteOk = document.getElementById('deleteOk');

    function api(endpoint, body) {
        return fetch(API + endpoint, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            credentials: 'include', body: JSON.stringify(body || {})
        }).then(function (r) { return r.json(); });
    }

    function ts(unix) {
        if (!unix) return '—';
        var d = new Date(unix * 1000);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function toast(msg, type) {
        var el = document.createElement('div');
        el.className = 'toast toast--' + (type || 'success');
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(function () { el.style.animation = 'toastOut 0.3s forwards'; }, 2500);
        setTimeout(function () { el.remove(); }, 2900);
    }

    // ── Load & Render ───────────────────────────────────────
    function loadItems() {
        api('read/crops.php', {}).then(function (res) {
            allItems = (res.success && res.data) ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
            renderTable();
        }).catch(function () {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">Failed to load.</td></tr>';
        });
    }

    function renderTable() {
        var q = searchInput.value.toLowerCase().trim();
        var t = filterType.value;
        var filtered = allItems.filter(function (c) {
            if (t && c.type !== t) return false;
            if (q) {
                var hay = ((c.name || '') + ' ' + (c.type || '')).toLowerCase();
                if (hay.indexOf(q) === -1) return false;
            }
            return true;
        });

        rowCount.textContent = filtered.length + ' crop' + (filtered.length !== 1 ? 's' : '');

        if (!filtered.length) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">No crops found.</td></tr>';
            return;
        }

        tableBody.innerHTML = filtered.map(function (c) {
            return '<tr>' +
                '<td>' + c.crop_id + '</td>' +
                '<td><strong>' + (c.name || '—') + '</strong></td>' +
                '<td><span class="badge badge--success">' + (c.type || '—') + '</span></td>' +
                '<td>NPR ' + (c.price || '—') + '</td>' +
                '<td style="font-size:var(--text-xs)">' + (c.image || '—') + '</td>' +
                '<td style="font-size:var(--text-xs);color:var(--color-text-muted)">' + ts(c.last_updated) + '</td>' +
                '<td><div class="actions-cell">' +
                '<button class="btn btn--icon-sm btn--ghost" title="Edit" data-edit="' + c.crop_id + '"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="btn btn--icon-sm btn--danger" title="Delete" data-del="' + c.crop_id + '"><i class="fa-solid fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');

        tableBody.querySelectorAll('[data-edit]').forEach(function (btn) {
            btn.addEventListener('click', function () { openEdit(this.dataset.edit); });
        });
        tableBody.querySelectorAll('[data-del]').forEach(function (btn) {
            btn.addEventListener('click', function () { confirmDelete(this.dataset.del); });
        });
    }

    searchInput.addEventListener('input', renderTable);
    filterType.addEventListener('change', renderTable);

    // ── Modal ────────────────────────────────────────────────
    function openModal() { formModal.classList.add('is-open'); }
    function closeModal() { formModal.classList.remove('is-open'); clearForm(); }
    modalClose.addEventListener('click', closeModal);
    modalCancel.addEventListener('click', closeModal);
    formModal.addEventListener('click', function (e) { if (e.target === formModal) closeModal(); });

    function clearForm() {
        document.getElementById('fId').value = '';
        document.getElementById('fName').value = '';
        document.getElementById('fType').value = 'grain';
        document.getElementById('fPrice').value = '';
        document.getElementById('fImage').value = '';
    }

    addBtn.addEventListener('click', function () {
        clearForm();
        modalTitle.textContent = 'Add Crop';
        openModal();
    });

    function openEdit(id) {
        var item = allItems.find(function (c) { return String(c.crop_id) === String(id); });
        if (!item) return;
        modalTitle.textContent = 'Edit Crop #' + id;
        document.getElementById('fId').value = item.crop_id;
        document.getElementById('fName').value = item.name || '';
        document.getElementById('fType').value = item.type || 'grain';
        document.getElementById('fPrice').value = item.price || '';
        document.getElementById('fImage').value = item.image || '';
        openModal();
    }

    modalSave.addEventListener('click', function () {
        var id = document.getElementById('fId').value;
        var payload = {
            name: document.getElementById('fName').value.trim(),
            type: document.getElementById('fType').value,
            price: document.getElementById('fPrice').value.trim(),
            image: document.getElementById('fImage').value.trim()
        };

        if (!id) {
            if (!payload.name || !payload.price || !payload.image) {
                toast('All fields are required.', 'error'); return;
            }
            api('create/crops.php', payload).then(function (res) {
                if (res.success) { toast('Crop created.'); closeModal(); loadItems(); }
                else { toast(res.message || 'Failed.', 'error'); }
            }).catch(function () { toast('Network error.', 'error'); });
        } else {
            payload.crop_id = id;
            api('update/crops.php', payload).then(function (res) {
                if (res.success) { toast('Crop updated.'); closeModal(); loadItems(); }
                else { toast(res.message || 'Failed.', 'error'); }
            }).catch(function () { toast('Network error.', 'error'); });
        }
    });

    // ── Delete ───────────────────────────────────────────────
    function confirmDelete(id) { deleteId = id; deleteConfirm.classList.add('is-open'); }
    deleteCancel.addEventListener('click', function () { deleteConfirm.classList.remove('is-open'); deleteId = null; });
    deleteConfirm.addEventListener('click', function (e) { if (e.target === deleteConfirm) { deleteConfirm.classList.remove('is-open'); deleteId = null; } });

    deleteOk.addEventListener('click', function () {
        if (!deleteId) return;
        api('delete/crops.php', { crop_id: deleteId }).then(function (res) {
            if (res.success) { toast('Crop deleted.'); loadItems(); }
            else { toast(res.message || 'Failed.', 'error'); }
        }).catch(function () { toast('Network error.', 'error'); });
        deleteConfirm.classList.remove('is-open'); deleteId = null;
    });

    loadItems();
})();
