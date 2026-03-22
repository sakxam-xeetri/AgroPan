/**
 * AgroPan — Admin: Devices CRUD
 */

(function () {
    'use strict';

    var API = '../../API/';
    var allItems = [];
    var deleteId = null;

    var tableBody = document.getElementById('tableBody');
    var searchInput = document.getElementById('searchInput');
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
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
            ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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
        api('read/devices.php', {}).then(function (res) {
            allItems = (res.success && res.data) ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
            renderTable();
        }).catch(function () {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">Failed to load.</td></tr>';
        });
    }

    function renderTable() {
        var q = searchInput.value.toLowerCase().trim();
        var filtered = allItems.filter(function (d) {
            if (!q) return true;
            var hay = ((d.name || '') + ' ' + (d.location || '') + ' ' + (d.owned_by || '')).toLowerCase();
            return hay.indexOf(q) !== -1;
        });

        rowCount.textContent = filtered.length + ' device' + (filtered.length !== 1 ? 's' : '');

        if (!filtered.length) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">No devices found.</td></tr>';
            return;
        }

        tableBody.innerHTML = filtered.map(function (d) {
            return '<tr>' +
                '<td>' + d.device_id + '</td>' +
                '<td><strong>' + (d.name || '—') + '</strong></td>' +
                '<td>' + (d.location || '—') + '</td>' +
                '<td><span class="badge badge--info">' + (d.owned_by || '—') + '</span></td>' +
                '<td style="font-size:var(--text-xs);color:var(--color-text-muted)">' + ts(d.last_ping) + '</td>' +
                '<td><div class="actions-cell">' +
                '<button class="btn btn--icon-sm btn--ghost" title="Edit" data-edit="' + d.device_id + '"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="btn btn--icon-sm btn--danger" title="Delete" data-del="' + d.device_id + '"><i class="fa-solid fa-trash"></i></button>' +
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

    // ── Modal ────────────────────────────────────────────────
    function openModal() { formModal.classList.add('is-open'); }
    function closeModal() { formModal.classList.remove('is-open'); clearForm(); }
    modalClose.addEventListener('click', closeModal);
    modalCancel.addEventListener('click', closeModal);
    formModal.addEventListener('click', function (e) { if (e.target === formModal) closeModal(); });

    function clearForm() {
        document.getElementById('fId').value = '';
        document.getElementById('fName').value = '';
        document.getElementById('fLocation').value = '';
        document.getElementById('fOwner').value = '';
    }

    addBtn.addEventListener('click', function () {
        clearForm();
        modalTitle.textContent = 'Add Device';
        openModal();
    });

    function openEdit(id) {
        var item = allItems.find(function (d) { return String(d.device_id) === String(id); });
        if (!item) return;
        modalTitle.textContent = 'Edit Device #' + id;
        document.getElementById('fId').value = item.device_id;
        document.getElementById('fName').value = item.name || '';
        document.getElementById('fLocation').value = item.location || '';
        document.getElementById('fOwner').value = item.owned_by || '';
        openModal();
    }

    modalSave.addEventListener('click', function () {
        var id = document.getElementById('fId').value;
        var payload = {
            name: document.getElementById('fName').value.trim(),
            location: document.getElementById('fLocation').value.trim(),
            owned_by: document.getElementById('fOwner').value.trim()
        };

        if (!id) {
            if (!payload.name || !payload.location || !payload.owned_by) {
                toast('All fields are required.', 'error'); return;
            }
            api('create/devices.php', payload).then(function (res) {
                if (res.success) { toast('Device created.'); closeModal(); loadItems(); }
                else { toast(res.message || 'Failed.', 'error'); }
            }).catch(function () { toast('Network error.', 'error'); });
        } else {
            payload.device_id = id;
            api('update/devices.php', payload).then(function (res) {
                if (res.success) { toast('Device updated.'); closeModal(); loadItems(); }
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
        api('delete/devices.php', { device_id: deleteId }).then(function (res) {
            if (res.success) { toast('Device deleted.'); loadItems(); }
            else { toast(res.message || 'Failed.', 'error'); }
        }).catch(function () { toast('Network error.', 'error'); });
        deleteConfirm.classList.remove('is-open'); deleteId = null;
    });

    loadItems();
})();
