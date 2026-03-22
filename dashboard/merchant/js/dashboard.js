/**
 * AgroPan — Merchant Dashboard: Overview Page
 *
 * Loads marketplace stats, latest crop listings, warnings, activity.
 */

(function () {
    'use strict';

    const API = '../../API/';

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
        if (!unix) return '—';
        var d = new Date(unix * 1000);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
            ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    function relativeTime(unix) {
        if (!unix) return '';
        var diff = Math.floor(Date.now() / 1000) - unix;
        if (diff < 60) return 'Just now';
        if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
        return Math.floor(diff / 86400) + 'd ago';
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }


    // ── Load Stats ──────────────────────────────────────────

    function loadStats() {
        // Crops count
        api('read/crops.php', {})
            .then(function (res) {
                var crops = (res.success && res.data) ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
                document.getElementById('statCrops').textContent = crops.length;

                // Count unique types
                var types = {};
                crops.forEach(function (c) { if (c.type) types[c.type] = true; });
                document.getElementById('statTypes').textContent = Object.keys(types).length;
            })
            .catch(function () {
                document.getElementById('statCrops').textContent = '0';
                document.getElementById('statTypes').textContent = '0';
            });

        // Farmers count
        api('read/users.php', {})
            .then(function (res) {
                if (!res.success || !res.data) { document.getElementById('statFarmers').textContent = '0'; return; }
                var users = Array.isArray(res.data) ? res.data : [res.data];
                var farmers = users.filter(function (u) { return (u.type || '').toLowerCase() === 'farmer'; });
                document.getElementById('statFarmers').textContent = farmers.length;
            })
            .catch(function () { document.getElementById('statFarmers').textContent = '0'; });

        // Active warnings
        api('read/warnings.php', { active: true })
            .then(function (res) {
                var count = (res.success && res.data) ? (Array.isArray(res.data) ? res.data.length : 1) : 0;
                document.getElementById('statAlerts').textContent = count;
            })
            .catch(function () { document.getElementById('statAlerts').textContent = '0'; });
    }


    // ── Latest Crop Listings ────────────────────────────────

    function loadCrops() {
        api('read/crops.php', {})
            .then(function (res) {
                var body = document.getElementById('cropsBody');
                if (!res.success || !res.data) {
                    body.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">No crops listed yet.</td></tr>';
                    return;
                }
                var rows = Array.isArray(res.data) ? res.data : [res.data];
                rows = rows.slice(0, 8);
                body.innerHTML = rows.map(function (c) {
                    return '<tr>' +
                        '<td><strong>' + escapeHtml(c.name || '—') + '</strong></td>' +
                        '<td><span class="badge badge--neutral">' + escapeHtml(c.type || '—') + '</span></td>' +
                        '<td style="font-weight:var(--weight-semibold);color:var(--color-secondary)">NPR ' + escapeHtml(String(c.price || 0)) + '</td>' +
                        '<td style="font-size:var(--text-xs);color:var(--color-text-muted)">' + ts(c.last_updated) + '</td>' +
                        '</tr>';
                }).join('');
            })
            .catch(function () {
                document.getElementById('cropsBody').innerHTML =
                    '<tr><td colspan="4" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">Failed to load crops.</td></tr>';
            });
    }


    // ── Active Warnings ─────────────────────────────────────

    function loadWarnings() {
        var container = document.getElementById('warningsContainer');
        api('read/warnings.php', { active: true })
            .then(function (res) {
                if (!res.success || !res.data) {
                    container.innerHTML = '<div class="empty-state"><div class="empty-state__icon"><i class="fa-solid fa-shield-check"></i></div><p class="empty-state__text">No active warnings — all clear!</p></div>';
                    return;
                }
                var warnings = Array.isArray(res.data) ? res.data : [res.data];
                if (warnings.length === 0) {
                    container.innerHTML = '<div class="empty-state"><div class="empty-state__icon"><i class="fa-solid fa-shield-check"></i></div><p class="empty-state__text">No active warnings — all clear!</p></div>';
                    return;
                }
                container.innerHTML = '<div class="activity-list">' + warnings.map(function (w) {
                    var severity = (w.severity || '').toLowerCase();
                    var iconClass = severity === 'high' ? 'stat-card__icon--danger' :
                        severity === 'medium' ? 'stat-card__icon--alert' :
                            'stat-card__icon--secondary';
                    return '<div class="activity-item">' +
                        '<div class="activity-item__icon ' + iconClass + '"><i class="fa-solid fa-triangle-exclamation"></i></div>' +
                        '<div class="activity-item__content">' +
                        '<div class="activity-item__text">' + escapeHtml(w.title || w.message || 'Warning') + '</div>' +
                        '<div class="activity-item__time">' + relativeTime(w.timestamp) + '</div>' +
                        '</div></div>';
                }).join('') + '</div>';
            })
            .catch(function () {
                container.innerHTML = '<div style="text-align:center;color:var(--color-text-light);padding:var(--space-md)">Could not load warnings.</div>';
            });
    }


    // ── Activity Feed ───────────────────────────────────────

    function loadActivity() {
        var feed = document.getElementById('activityFeed');
        var user = getUser();
        var loginTime = user.last_login ? relativeTime(user.last_login) : 'recently';
        feed.innerHTML =
            '<div class="activity-item">' +
            '<div class="activity-item__icon stat-card__icon--primary"><i class="fa-solid fa-right-to-bracket"></i></div>' +
            '<div class="activity-item__content">' +
            '<div class="activity-item__text">You logged in</div>' +
            '<div class="activity-item__time">' + loginTime + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="activity-item">' +
            '<div class="activity-item__icon stat-card__icon--accent"><i class="fa-solid fa-basket-shopping"></i></div>' +
            '<div class="activity-item__content">' +
            '<div class="activity-item__text">Marketplace loaded</div>' +
            '<div class="activity-item__time">Just now</div>' +
            '</div>' +
            '</div>';
    }


    // ── Init ────────────────────────────────────────────────

    loadStats();
    loadCrops();
    loadWarnings();
    loadActivity();

})();
