/**
 * AgroPan — Farmer Dashboard: Overview Page
 *
 * Loads stats, latest readings, active warnings, and activity feed.
 */

(function () {
    'use strict';

    const API = '../../API/';

    function getUser() {
        try {
            return JSON.parse(parent.sessionStorage.getItem('agropan_user')) || {};
        } catch (e) { return {}; }
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


    // ── Load Stats ──────────────────────────────────────────

    function loadStats() {
        var user = getUser();
        var username = user.username || '';

        // Devices (filtered by owner)
        api('read/devices.php', username ? { owned_by: username } : {})
            .then(function (res) {
                var count = (res.success && res.data) ? (Array.isArray(res.data) ? res.data.length : 1) : 0;
                document.getElementById('statDevices').textContent = count;
            })
            .catch(function () { document.getElementById('statDevices').textContent = '0'; });

        // Data points
        api('read/data.php', {})
            .then(function (res) {
                var count = (res.success && res.data) ? (Array.isArray(res.data) ? res.data.length : 1) : 0;
                document.getElementById('statDataPoints').textContent = count;
            })
            .catch(function () { document.getElementById('statDataPoints').textContent = '0'; });

        // Crops
        api('read/crops.php', {})
            .then(function (res) {
                var count = (res.success && res.data) ? (Array.isArray(res.data) ? res.data.length : 1) : 0;
                document.getElementById('statCrops').textContent = count;
            })
            .catch(function () { document.getElementById('statCrops').textContent = '0'; });

        // Warnings (active)
        api('read/warnings.php', { active: true })
            .then(function (res) {
                var count = (res.success && res.data) ? (Array.isArray(res.data) ? res.data.length : 1) : 0;
                document.getElementById('statAlerts').textContent = count;
            })
            .catch(function () { document.getElementById('statAlerts').textContent = '0'; });
    }


    // ── Latest Readings ─────────────────────────────────────

    function loadReadings() {
        api('read/data.php', {})
            .then(function (res) {
                var body = document.getElementById('readingsBody');
                if (!res.success || !res.data) {
                    body.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">No data readings yet.</td></tr>';
                    return;
                }
                var rows = Array.isArray(res.data) ? res.data : [res.data];
                // Show latest 8
                rows = rows.slice(0, 8);
                body.innerHTML = rows.map(function (r) {
                    return '<tr>' +
                        '<td><strong>' + (r.device || '—') + '</strong></td>' +
                        '<td>' + (r.temperature != null ? r.temperature + '°C' : '—') + '</td>' +
                        '<td>' + (r.moisture != null ? r.moisture + '%' : '—') + '</td>' +
                        '<td>' + (r.humidity != null ? r.humidity + '%' : '—') + '</td>' +
                        '<td style="font-size:var(--text-xs);color:var(--color-text-muted)">' + ts(r.timestamp) + '</td>' +
                        '</tr>';
                }).join('');
            })
            .catch(function () {
                document.getElementById('readingsBody').innerHTML =
                    '<tr><td colspan="5" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">Failed to load readings.</td></tr>';
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
                        '<div class="activity-item__text">' + (w.title || w.message || 'Warning') + '</div>' +
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
        // Show a simple placeholder with login time
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
            '<div class="activity-item__icon stat-card__icon--accent"><i class="fa-solid fa-seedling"></i></div>' +
            '<div class="activity-item__content">' +
            '<div class="activity-item__text">Dashboard loaded successfully</div>' +
            '<div class="activity-item__time">Just now</div>' +
            '</div>' +
            '</div>';
    }


    // ── Init ────────────────────────────────────────────────

    loadStats();
    loadReadings();
    loadWarnings();
    loadActivity();

})();
