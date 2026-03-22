/**
 * AgroPan — Admin: Warnings CRUD
 */

(function () {
    'use strict';

    var API = '../../API/';
    var allItems = [];
    var deleteId = null;
    var nowUnix = Math.floor(Date.now() / 1000);

    var tableBody = document.getElementById('tableBody');
    var searchInput = document.getElementById('searchInput');
    var filterStatus = document.getElementById('filterStatus');
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
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
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

    function isActive(w) {
        return w.valid_till && Number(w.valid_till) > nowUnix;
    }

    // ── Load & Render ───────────────────────────────────────
    function loadItems() {
        api('read/warnings.php', {}).then(function (res) {
            allItems = (res.success && res.data) ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
            renderTable();
        }).catch(function () {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">Failed to load.</td></tr>';
        });
    }

    function renderTable() {
        nowUnix = Math.floor(Date.now() / 1000);
        var q = searchInput.value.toLowerCase().trim();
        var s = filterStatus.value;

        var filtered = allItems.filter(function (w) {
            if (s === 'active' && !isActive(w)) return false;
            if (s === 'expired' && isActive(w)) return false;
            if (q && (w.title || '').toLowerCase().indexOf(q) === -1) return false;
            return true;
        });

        rowCount.textContent = filtered.length + ' warning' + (filtered.length !== 1 ? 's' : '');

        if (!filtered.length) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">No warnings found.</td></tr>';
            return;
        }

        tableBody.innerHTML = filtered.map(function (w) {
            var active = isActive(w);
            var statusBadge = active
                ? '<span class="badge badge--danger"><i class="fa-solid fa-circle-exclamation"></i> Active</span>'
                : '<span class="badge badge--neutral">Expired</span>';
            var details = (w.details || '').length > 60 ? w.details.substring(0, 60) + '…' : (w.details || '—');
            return '<tr>' +
                '<td>' + w.warning_id + '</td>' +
                '<td><strong>' + (w.title || '—') + '</strong></td>' +
                '<td style="font-size:var(--text-xs);max-width:200px;white-space:normal;word-break:break-word">' + details + '</td>' +
                '<td>' + statusBadge + '</td>' +
                '<td style="font-size:var(--text-xs);color:var(--color-text-muted)">' + ts(w.timestamp) + '</td>' +
                '<td style="font-size:var(--text-xs);color:var(--color-text-muted)">' + ts(w.valid_till) + '</td>' +
                '<td><div class="actions-cell">' +
                '<button class="btn btn--icon-sm btn--ghost" title="Edit" data-edit="' + w.warning_id + '"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="btn btn--icon-sm btn--danger" title="Delete" data-del="' + w.warning_id + '"><i class="fa-solid fa-trash"></i></button>' +
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
    filterStatus.addEventListener('change', renderTable);

    // ── Modal ────────────────────────────────────────────────
    function openModal() { formModal.classList.add('is-open'); }
    function closeModal() { formModal.classList.remove('is-open'); clearForm(); }
    modalClose.addEventListener('click', closeModal);
    modalCancel.addEventListener('click', closeModal);
    formModal.addEventListener('click', function (e) { if (e.target === formModal) closeModal(); });

    function clearForm() {
        document.getElementById('fId').value = '';
        document.getElementById('fTitle').value = '';
        document.getElementById('fDetails').value = '';
        document.getElementById('fValidTill').value = '';
    }

    function unixToDatetimeLocal(unix) {
        if (!unix) return '';
        var d = new Date(unix * 1000);
        var pad = function (n) { return n < 10 ? '0' + n : n; };
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
            'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    addBtn.addEventListener('click', function () {
        clearForm();
        modalTitle.textContent = 'New Warning';
        modalSave.textContent = 'Publish';
        // Default valid_till to 48h from now
        var defaultTime = new Date(Date.now() + 48 * 3600 * 1000);
        document.getElementById('fValidTill').value = unixToDatetimeLocal(Math.floor(defaultTime.getTime() / 1000));
        openModal();
    });

    function openEdit(id) {
        var item = allItems.find(function (w) { return String(w.warning_id) === String(id); });
        if (!item) return;
        modalTitle.textContent = 'Edit Warning #' + id;
        modalSave.textContent = 'Save';
        document.getElementById('fId').value = item.warning_id;
        document.getElementById('fTitle').value = item.title || '';
        document.getElementById('fDetails').value = item.details || '';
        document.getElementById('fValidTill').value = unixToDatetimeLocal(item.valid_till);
        openModal();
    }

    modalSave.addEventListener('click', function () {
        var id = document.getElementById('fId').value;
        var title = document.getElementById('fTitle').value.trim();
        var details = document.getElementById('fDetails').value.trim();
        var validTillStr = document.getElementById('fValidTill').value;
        var validTill = validTillStr ? String(Math.floor(new Date(validTillStr).getTime() / 1000)) : '';

        if (!title || !details || !validTill) {
            toast('All fields are required.', 'error'); return;
        }

        if (!id) {
            api('create/warnings.php', { title: title, details: details, valid_till: validTill }).then(function (res) {
                if (res.success) { toast('Warning published & subscribers notified.'); closeModal(); loadItems(); }
                else { toast(res.message || 'Failed.', 'error'); }
            }).catch(function () { toast('Network error.', 'error'); });
        } else {
            api('update/warnings.php', { warning_id: id, title: title, details: details, valid_till: validTill }).then(function (res) {
                if (res.success) { toast('Warning updated.'); closeModal(); loadItems(); }
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
        api('delete/warnings.php', { warning_id: deleteId }).then(function (res) {
            if (res.success) { toast('Warning deleted.'); loadItems(); }
            else { toast(res.message || 'Failed.', 'error'); }
        }).catch(function () { toast('Network error.', 'error'); });
        deleteConfirm.classList.remove('is-open'); deleteId = null;
    });

    loadItems();
})();
