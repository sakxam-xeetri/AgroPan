/**
 * AgroPan — Admin: Users CRUD
 */

(function () {
    'use strict';

    var API = '../../API/';
    var allUsers = [];
    var deleteId = null;

    // ── DOM refs ────────────────────────────────────────────
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
    var passwordHint = document.getElementById('passwordHint');
    var passwordLabel = document.getElementById('passwordLabel');

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


    // ── Load & Render ───────────────────────────────────────
    function loadUsers() {
        api('read/users.php', {}).then(function (res) {
            allUsers = (res.success && res.data) ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
            renderTable();
        }).catch(function () {
            tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">Failed to load users.</td></tr>';
        });
    }

    function renderTable() {
        var q = searchInput.value.toLowerCase().trim();
        var t = filterType.value;
        var filtered = allUsers.filter(function (u) {
            if (t && u.type !== t) return false;
            if (q) {
                var hay = ((u.name || '') + ' ' + (u.username || '') + ' ' + (u.email || '') + ' ' + (u.location || '')).toLowerCase();
                if (hay.indexOf(q) === -1) return false;
            }
            return true;
        });

        rowCount.textContent = filtered.length + ' user' + (filtered.length !== 1 ? 's' : '');

        if (!filtered.length) {
            tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">No users found.</td></tr>';
            return;
        }

        tableBody.innerHTML = filtered.map(function (u) {
            var badgeClass = u.type === 'farmer' ? 'badge--success' : u.type === 'merchant' ? 'badge--warning' : 'badge--admin';
            return '<tr>' +
                '<td>' + u.user_id + '</td>' +
                '<td><strong>' + (u.name || '—') + '</strong></td>' +
                '<td>' + (u.username || '—') + '</td>' +
                '<td>' + (u.email || '—') + '</td>' +
                '<td>' + (u.phone || '—') + '</td>' +
                '<td><span class="badge ' + badgeClass + '">' + (u.type || '—') + '</span></td>' +
                '<td>' + (u.location || '—') + '</td>' +
                '<td style="font-size:var(--text-xs);color:var(--color-text-muted)">' + ts(u.last_login) + '</td>' +
                '<td><div class="actions-cell">' +
                '<button class="btn btn--icon-sm btn--ghost" title="Edit" data-edit="' + u.user_id + '"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="btn btn--icon-sm btn--danger" title="Delete" data-del="' + u.user_id + '"><i class="fa-solid fa-trash"></i></button>' +
                '</div></td>' +
                '</tr>';
        }).join('');

        // bind edit/delete
        tableBody.querySelectorAll('[data-edit]').forEach(function (btn) {
            btn.addEventListener('click', function () { openEdit(this.dataset.edit); });
        });
        tableBody.querySelectorAll('[data-del]').forEach(function (btn) {
            btn.addEventListener('click', function () { confirmDelete(this.dataset.del); });
        });
    }


    // ── Search & Filter ─────────────────────────────────────
    searchInput.addEventListener('input', renderTable);
    filterType.addEventListener('change', renderTable);


    // ── Modal helpers ───────────────────────────────────────
    function openModal() { formModal.classList.add('is-open'); }
    function closeModal() { formModal.classList.remove('is-open'); clearForm(); }

    modalClose.addEventListener('click', closeModal);
    modalCancel.addEventListener('click', closeModal);
    formModal.addEventListener('click', function (e) { if (e.target === formModal) closeModal(); });

    function clearForm() {
        document.getElementById('fUserId').value = '';
        document.getElementById('fName').value = '';
        document.getElementById('fUsername').value = '';
        document.getElementById('fEmail').value = '';
        document.getElementById('fPhone').value = '';
        document.getElementById('fLocation').value = '';
        document.getElementById('fType').value = 'farmer';
        document.getElementById('fPassword').value = '';
    }


    // ── Add ──────────────────────────────────────────────────
    addBtn.addEventListener('click', function () {
        clearForm();
        modalTitle.textContent = 'Add User';
        passwordLabel.textContent = 'Password *';
        passwordHint.textContent = '';
        document.getElementById('fUsername').disabled = false;
        openModal();
    });


    // ── Edit ─────────────────────────────────────────────────
    function openEdit(id) {
        var user = allUsers.find(function (u) { return String(u.user_id) === String(id); });
        if (!user) return;
        modalTitle.textContent = 'Edit User #' + id;
        passwordLabel.textContent = 'Password';
        passwordHint.textContent = 'Leave blank to keep current password.';
        document.getElementById('fUserId').value = user.user_id;
        document.getElementById('fName').value = user.name || '';
        document.getElementById('fUsername').value = user.username || '';
        document.getElementById('fUsername').disabled = true;
        document.getElementById('fEmail').value = user.email || '';
        document.getElementById('fPhone').value = user.phone || '';
        document.getElementById('fLocation').value = user.location || '';
        document.getElementById('fType').value = user.type || 'farmer';
        document.getElementById('fPassword').value = '';
        openModal();
    }


    // ── Save (create or update) ──────────────────────────────
    modalSave.addEventListener('click', function () {
        var userId = document.getElementById('fUserId').value;
        var payload = {
            name: document.getElementById('fName').value.trim(),
            username: document.getElementById('fUsername').value.trim(),
            email: document.getElementById('fEmail').value.trim(),
            phone: document.getElementById('fPhone').value.trim(),
            location: document.getElementById('fLocation').value.trim(),
            type: document.getElementById('fType').value
        };

        var pw = document.getElementById('fPassword').value;
        if (pw) payload.password = pw;

        if (!userId) {
            // Create
            if (!payload.name || !payload.username || !payload.email || !payload.phone || !payload.location || !pw) {
                toast('All fields including password are required for new users.', 'error');
                return;
            }
            api('create/users.php', payload).then(function (res) {
                if (res.success) {
                    toast('User created successfully.');
                    closeModal();
                    loadUsers();
                } else {
                    toast(res.message || 'Failed to create user.', 'error');
                }
            }).catch(function () { toast('Network error.', 'error'); });
        } else {
            // Update
            payload.user_id = userId;
            if (!payload.name && !payload.email && !payload.phone && !payload.location && !payload.type && !pw) {
                toast('No changes to save.', 'error');
                return;
            }
            api('update/users.php', payload).then(function (res) {
                if (res.success) {
                    toast('User updated successfully.');
                    closeModal();
                    loadUsers();
                } else {
                    toast(res.message || 'Failed to update user.', 'error');
                }
            }).catch(function () { toast('Network error.', 'error'); });
        }
    });


    // ── Delete ───────────────────────────────────────────────
    function confirmDelete(id) {
        deleteId = id;
        deleteConfirm.classList.add('is-open');
    }

    deleteCancel.addEventListener('click', function () { deleteConfirm.classList.remove('is-open'); deleteId = null; });
    deleteConfirm.addEventListener('click', function (e) { if (e.target === deleteConfirm) { deleteConfirm.classList.remove('is-open'); deleteId = null; } });

    deleteOk.addEventListener('click', function () {
        if (!deleteId) return;
        api('delete/users.php', { user_id: deleteId }).then(function (res) {
            if (res.success) {
                toast('User deleted.');
                loadUsers();
            } else {
                toast(res.message || 'Failed to delete.', 'error');
            }
        }).catch(function () { toast('Network error.', 'error'); });
        deleteConfirm.classList.remove('is-open');
        deleteId = null;
    });


    // ── Init ────────────────────────────────────────────────
    loadUsers();

})();
