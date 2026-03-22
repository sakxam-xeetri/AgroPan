/**
 * AgroPan — Farmer Dashboard: Devices Page
 *
 * CRUD operations for IoT devices.
 */

(function () {
    'use strict';

    const API = '../../API/';

    // DOM refs
    const list = document.getElementById('devicesList');
    const modal = document.getElementById('deviceModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('deviceForm');
    const nameInput = document.getElementById('deviceName');
    const locInput = document.getElementById('deviceLocation');
    const editId = document.getElementById('deviceEditId');
    const alertBox = document.getElementById('deviceAlert');

    function getUser() {
        try { return JSON.parse(parent.sessionStorage.getItem('agropan_user')) || {}; }
        catch (e) { return {}; }
    }

    function api(endpoint, body) {
        return fetch(API + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body || {})
        }).then(function (r) { return r.json(); });
    }

    function ts(unix) {
        if (!unix) return 'Never';
        var d = new Date(unix * 1000);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
            ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    function showAlert(msg, type) {
        type = type || 'success';
        alertBox.innerHTML = '<div class="alert alert--' + type + '">' +
            '<i class="fa-solid fa-' + (type === 'success' ? 'check-circle' : 'circle-exclamation') + '"></i> ' +
            msg + '</div>';
        setTimeout(function () { alertBox.innerHTML = ''; }, 4000);
    }


    // ── Load Devices ────────────────────────────────────────

    function loadDevices() {
        var user = getUser();
        var body = user.username ? { owned_by: user.username } : {};
        api('read/devices.php', body)
            .then(function (res) {
                if (!res.success || !res.data) {
                    showEmpty();
                    return;
                }
                var devices = Array.isArray(res.data) ? res.data : [res.data];
                if (devices.length === 0) { showEmpty(); return; }
                renderDevices(devices);
            })
            .catch(function () { showEmpty('Failed to load devices.'); });
    }

    function showEmpty(msg) {
        list.innerHTML =
            '<div style="text-align:center;padding:var(--space-3xl);color:var(--color-text-light);grid-column:1/-1">' +
            '<div style="font-size:3rem;margin-bottom:var(--space-md)"><i class="fa-solid fa-microchip"></i></div>' +
            '<p style="font-size:var(--text-lg);font-weight:var(--weight-semibold);margin-bottom:var(--space-xs)">' + (msg || 'No devices yet') + '</p>' +
            '<p style="margin-bottom:var(--space-lg)">Add your first IoT sensor to start monitoring.</p>' +
            '<button class="btn btn--primary btn--sm" onclick="document.getElementById(\'addDeviceBtn\').click()"><i class="fa-solid fa-plus"></i> Add Device</button>' +
            '</div>';
    }

    function renderDevices(devices) {
        list.innerHTML = devices.map(function (d) {
            return '<div class="item-card">' +
                '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:var(--space-md)">' +
                '<div style="width:44px;height:44px;border-radius:var(--radius-md);background:rgba(34,139,34,.1);color:var(--color-primary);display:flex;align-items:center;justify-content:center;font-size:var(--text-lg)"><i class="fa-solid fa-microchip"></i></div>' +
                '<div style="display:flex;gap:var(--space-xs)">' +
                '<button class="btn btn--ghost btn--sm btn--icon" onclick="editDevice(' + d.device_id + ')" title="Edit"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="btn btn--ghost btn--sm btn--icon" onclick="deleteDevice(' + d.device_id + ')" title="Delete" style="color:var(--color-danger)"><i class="fa-solid fa-trash-can"></i></button>' +
                '</div>' +
                '</div>' +
                '<h4 style="font-weight:var(--weight-semibold);margin-bottom:var(--space-xs)">' + escapeHtml(d.name) + '</h4>' +
                '<p style="font-size:var(--text-sm);color:var(--color-text-muted);display:flex;align-items:center;gap:var(--space-xs);margin-bottom:var(--space-sm)"><i class="fa-solid fa-location-dot" style="font-size:var(--text-xs)"></i> ' + escapeHtml(d.location || '—') + '</p>' +
                '<p style="font-size:var(--text-xs);color:var(--color-text-light)"><i class="fa-solid fa-clock"></i> Last ping: ' + ts(d.last_ping) + '</p>' +
                '</div>';
        }).join('');
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }


    // ── Modal ───────────────────────────────────────────────

    function openModal(title) {
        modalTitle.textContent = title || 'Add Device';
        modal.classList.add('is-open');
        nameInput.focus();
    }

    function closeModalFn() {
        modal.classList.remove('is-open');
        form.reset();
        editId.value = '';
    }

    document.getElementById('addDeviceBtn').addEventListener('click', function () {
        editId.value = '';
        openModal('Add Device');
    });

    document.getElementById('closeModal').addEventListener('click', closeModalFn);
    document.getElementById('cancelModal').addEventListener('click', closeModalFn);

    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModalFn();
    });


    // ── Save ────────────────────────────────────────────────

    document.getElementById('saveDevice').addEventListener('click', function () {
        var name = nameInput.value.trim();
        var location = locInput.value.trim();
        if (!name || !location) { showAlert('Name and location are required.', 'danger'); return; }

        var user = getUser();
        var id = editId.value;

        if (id) {
            // Update
            api('update/devices.php', { device_id: parseInt(id), name: name, location: location })
                .then(function (res) {
                    if (res.success) {
                        showAlert('Device updated!');
                        closeModalFn();
                        loadDevices();
                    } else {
                        showAlert(res.message || 'Update failed.', 'danger');
                    }
                })
                .catch(function () { showAlert('Network error.', 'danger'); });
        } else {
            // Create
            api('create/devices.php', {
                name: name,
                location: location,
                owned_by: user.username || 'unknown'
            })
                .then(function (res) {
                    if (res.success) {
                        showAlert('Device created!');
                        closeModalFn();
                        loadDevices();
                    } else {
                        showAlert(res.message || 'Creation failed.', 'danger');
                    }
                })
                .catch(function () { showAlert('Network error.', 'danger'); });
        }
    });


    // ── Edit ────────────────────────────────────────────────

    window.editDevice = function (id) {
        api('read/devices.php', { device_id: id })
            .then(function (res) {
                if (res.success && res.data) {
                    var d = Array.isArray(res.data) ? res.data[0] : res.data;
                    nameInput.value = d.name || '';
                    locInput.value = d.location || '';
                    editId.value = d.device_id;
                    openModal('Edit Device');
                }
            });
    };


    // ── Delete ──────────────────────────────────────────────

    window.deleteDevice = function (id) {
        if (!confirm('Delete this device? This cannot be undone.')) return;
        api('delete/devices.php', { device_id: id })
            .then(function (res) {
                if (res.success) {
                    showAlert('Device deleted.');
                    loadDevices();
                } else {
                    showAlert(res.message || 'Delete failed.', 'danger');
                }
            })
            .catch(function () { showAlert('Network error.', 'danger'); });
    };


    // ── Init ────────────────────────────────────────────────

    loadDevices();

})();
