/**
 * AgroPan — Admin: Sensor Data CRUD
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
        api('read/data.php', {}).then(function (res) {
            allItems = (res.success && res.data) ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
            renderTable();
        }).catch(function () {
            tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">Failed to load.</td></tr>';
        });
    }

    function renderTable() {
        var q = searchInput.value.toLowerCase().trim();
        var filtered = allItems.filter(function (d) {
            if (!q) return true;
            return (d.device || '').toLowerCase().indexOf(q) !== -1;
        });

        rowCount.textContent = filtered.length + ' reading' + (filtered.length !== 1 ? 's' : '');

        if (!filtered.length) {
            tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">No data found.</td></tr>';
            return;
        }

        tableBody.innerHTML = filtered.map(function (d) {
            return '<tr>' +
                '<td>' + d.data_id + '</td>' +
                '<td><strong>' + (d.device || '—') + '</strong></td>' +
                '<td>' + (d.temperature != null ? d.temperature : '—') + '</td>' +
                '<td>' + (d.moisture != null ? d.moisture : '—') + '</td>' +
                '<td>' + (d.humidity != null ? d.humidity : '—') + '</td>' +
                '<td>' + (d.gases != null ? d.gases : '—') + '</td>' +
                '<td>' + (d.nitrogen != null ? d.nitrogen : '—') + '</td>' +
                '<td style="font-size:var(--text-xs);color:var(--color-text-muted)">' + ts(d.timestamp) + '</td>' +
                '<td><div class="actions-cell">' +
                '<button class="btn btn--icon-sm btn--ghost" title="Edit" data-edit="' + d.data_id + '"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="btn btn--icon-sm btn--danger" title="Delete" data-del="' + d.data_id + '"><i class="fa-solid fa-trash"></i></button>' +
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
        document.getElementById('fDevice').value = '';
        document.getElementById('fTemp').value = '';
        document.getElementById('fMoisture').value = '';
        document.getElementById('fHumidity').value = '';
        document.getElementById('fGases').value = '';
        document.getElementById('fNitrogen').value = '';
    }

    addBtn.addEventListener('click', function () {
        clearForm();
        modalTitle.textContent = 'Add Sensor Reading';
        openModal();
    });

    function openEdit(id) {
        var item = allItems.find(function (d) { return String(d.data_id) === String(id); });
        if (!item) return;
        modalTitle.textContent = 'Edit Reading #' + id;
        document.getElementById('fId').value = item.data_id;
        document.getElementById('fDevice').value = item.device || '';
        document.getElementById('fTemp').value = item.temperature || '';
        document.getElementById('fMoisture').value = item.moisture || '';
        document.getElementById('fHumidity').value = item.humidity || '';
        document.getElementById('fGases').value = item.gases || '';
        document.getElementById('fNitrogen').value = item.nitrogen || '';
        openModal();
    }

    modalSave.addEventListener('click', function () {
        var id = document.getElementById('fId').value;
        var payload = {
            device: document.getElementById('fDevice').value.trim(),
            temperature: document.getElementById('fTemp').value.trim(),
            moisture: document.getElementById('fMoisture').value.trim(),
            humidity: document.getElementById('fHumidity').value.trim(),
            gases: document.getElementById('fGases').value.trim(),
            nitrogen: document.getElementById('fNitrogen').value.trim()
        };

        if (!id) {
            if (!payload.device || !payload.temperature || !payload.moisture || !payload.humidity || !payload.gases || !payload.nitrogen) {
                toast('All fields are required.', 'error'); return;
            }
            api('create/data.php', payload).then(function (res) {
                if (res.success) { toast('Reading created.'); closeModal(); loadItems(); }
                else { toast(res.message || 'Failed.', 'error'); }
            }).catch(function () { toast('Network error.', 'error'); });
        } else {
            payload.data_id = id;
            api('update/data.php', payload).then(function (res) {
                if (res.success) { toast('Reading updated.'); closeModal(); loadItems(); }
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
        api('delete/data.php', { data_id: deleteId }).then(function (res) {
            if (res.success) { toast('Reading deleted.'); loadItems(); }
            else { toast(res.message || 'Failed.', 'error'); }
        }).catch(function () { toast('Network error.', 'error'); });
        deleteConfirm.classList.remove('is-open'); deleteId = null;
    });

    loadItems();
})();
