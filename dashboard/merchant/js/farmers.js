/**
 * AgroPan — Merchant Dashboard: Farmers Page
 *
 * Loads farmer-type users, shows device counts, provides search and contact.
 */

(function () {
    'use strict';

    const API = '../../API/';

    const list = document.getElementById('farmersList');
    const searchInput = document.getElementById('farmerSearch');
    const farmerCountEl = document.getElementById('farmerCount');

    let allFarmers = [];
    let deviceMap = {}; // username → device count

    function api(endpoint, body) {
        return fetch(API + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body || {})
        }).then(function (r) { return r.json(); });
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function relativeLogin(unix) {
        if (!unix) return 'Never';
        var diff = Math.floor(Date.now() / 1000) - unix;
        if (diff < 3600) return 'Active recently';
        if (diff < 86400) return 'Today';
        if (diff < 172800) return 'Yesterday';
        if (diff < 604800) return Math.floor(diff / 86400) + ' days ago';
        return new Date(unix * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }


    // ── Load Farmers + Device Counts ────────────────────────

    function loadFarmers() {
        list.innerHTML = '<div style="text-align:center;padding:var(--space-3xl);color:var(--color-text-light);grid-column:1/-1"><i class="fa-solid fa-spinner fa-spin" style="font-size:1.5rem"></i><p style="margin-top:var(--space-md)">Loading farmers…</p></div>';

        Promise.all([
            api('read/users.php', {}),
            api('read/devices.php', {})
        ])
            .then(function (results) {
                var usersRes = results[0];
                var devicesRes = results[1];

                // Build device count map
                deviceMap = {};
                if (devicesRes.success && devicesRes.data) {
                    var devices = Array.isArray(devicesRes.data) ? devicesRes.data : [devicesRes.data];
                    devices.forEach(function (d) {
                        var owner = d.owned_by || '';
                        deviceMap[owner] = (deviceMap[owner] || 0) + 1;
                    });
                }

                // Filter to farmers only
                if (!usersRes.success || !usersRes.data) {
                    allFarmers = [];
                    showEmpty();
                    return;
                }
                var users = Array.isArray(usersRes.data) ? usersRes.data : [usersRes.data];
                allFarmers = users.filter(function (u) {
                    return (u.type || '').toLowerCase() === 'farmer';
                });

                if (allFarmers.length === 0) { showEmpty(); return; }
                farmerCountEl.textContent = allFarmers.length;
                renderFarmers(allFarmers);
            })
            .catch(function () {
                allFarmers = [];
                showEmpty('Failed to load farmers.');
            });
    }

    function showEmpty(msg) {
        farmerCountEl.textContent = '0';
        list.innerHTML =
            '<div style="text-align:center;padding:var(--space-3xl);color:var(--color-text-light);grid-column:1/-1">' +
            '<div style="font-size:3rem;margin-bottom:var(--space-md)"><i class="fa-solid fa-tractor"></i></div>' +
            '<p style="font-size:var(--text-lg);font-weight:var(--weight-semibold);margin-bottom:var(--space-xs)">' + (msg || 'No farmers found') + '</p>' +
            '<p>Farmers will appear here once they join AgroPan.</p>' +
            '</div>';
    }

    function renderFarmers(farmers) {
        list.innerHTML = farmers.map(function (f) {
            var name = f.name || f.username || '?';
            var initials = name.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
            var devCount = deviceMap[f.username] || 0;

            return '<div class="item-card">' +
                '<div class="farmer-card">' +
                '<div class="farmer-card__avatar">' + initials + '</div>' +
                '<div class="farmer-card__info">' +
                '<div class="farmer-card__name">' + escapeHtml(name) + '</div>' +
                '<div class="farmer-card__detail"><i class="fa-solid fa-location-dot"></i> ' + escapeHtml(f.location || 'No location set') + '</div>' +
                (f.email ? '<div class="farmer-card__detail"><i class="fa-solid fa-envelope"></i> ' + escapeHtml(f.email) + '</div>' : '') +
                (f.phone ? '<div class="farmer-card__detail"><i class="fa-solid fa-phone"></i> ' + escapeHtml(f.phone) + '</div>' : '') +
                '<div class="farmer-card__detail"><i class="fa-solid fa-clock"></i> ' + relativeLogin(f.last_login) + '</div>' +
                '</div>' +
                '</div>' +
                (devCount > 0
                    ? '<div class="farmer-card__devices"><i class="fa-solid fa-microchip"></i> ' + devCount + ' IoT device' + (devCount !== 1 ? 's' : '') + ' connected</div>'
                    : '') +
                '<div class="farmer-card__contact">' +
                (f.email ? '<a href="mailto:' + escapeHtml(f.email) + '" class="btn btn--ghost btn--sm"><i class="fa-solid fa-envelope"></i> Email</a>' : '') +
                (f.phone ? '<a href="tel:' + escapeHtml(f.phone) + '" class="btn btn--primary btn--sm"><i class="fa-solid fa-phone"></i> Call</a>' : '') +
                (!f.email && !f.phone ? '<span style="font-size:var(--text-xs);color:var(--color-text-light)">No contact info available</span>' : '') +
                '</div>' +
                '</div>';
        }).join('');
    }


    // ── Search ──────────────────────────────────────────────

    searchInput.addEventListener('input', function () {
        var q = this.value.toLowerCase().trim();
        if (!q) {
            if (allFarmers.length) {
                farmerCountEl.textContent = allFarmers.length;
                renderFarmers(allFarmers);
            } else { showEmpty(); }
            return;
        }
        var filtered = allFarmers.filter(function (f) {
            return (f.name || '').toLowerCase().indexOf(q) > -1 ||
                (f.username || '').toLowerCase().indexOf(q) > -1 ||
                (f.location || '').toLowerCase().indexOf(q) > -1 ||
                (f.email || '').toLowerCase().indexOf(q) > -1;
        });
        farmerCountEl.textContent = filtered.length;
        if (filtered.length) {
            renderFarmers(filtered);
        } else {
            list.innerHTML = '<div style="text-align:center;padding:var(--space-3xl);color:var(--color-text-light);grid-column:1/-1"><i class="fa-solid fa-search" style="font-size:1.5rem;display:block;margin-bottom:var(--space-sm)"></i>No farmers match "' + escapeHtml(q) + '"</div>';
        }
    });


    // ── Init ────────────────────────────────────────────────

    loadFarmers();

})();
