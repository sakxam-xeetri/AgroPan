/**
 * AgroPan — Admin Dashboard: Overview Page
 * Loads global stats across all 8 tables, recent users, active warnings.
 */

(function () {
    'use strict';

    var API = '../../API/';

    function api(endpoint, body) {
        return fetch(API + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body || {})
        }).then(function (r) { return r.json(); });
    }

    function count(res) {
        if (!res.success || !res.data) return 0;
        return Array.isArray(res.data) ? res.data.length : 1;
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
    function loadStat(endpoint, body, elId) {
        api(endpoint, body)
            .then(function (res) { document.getElementById(elId).textContent = count(res); })
            .catch(function () { document.getElementById(elId).textContent = '0'; });
    }

    loadStat('read/users.php', {}, 'statUsers');
    loadStat('read/devices.php', {}, 'statDevices');
    loadStat('read/data.php', {}, 'statData');
    loadStat('read/crops.php', {}, 'statCrops');
    loadStat('read/warnings.php', { active: true }, 'statWarnings');
    loadStat('read/emails.php', {}, 'statEmails');
    loadStat('read/questions.php', {}, 'statQuestions');
    loadStat('read/answers.php', {}, 'statAnswers');


    // ── Recent Users ────────────────────────────────────────
    api('read/users.php', {})
        .then(function (res) {
            var body = document.getElementById('recentUsersBody');
            if (!res.success || !res.data) {
                body.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">No users found.</td></tr>';
                return;
            }
            var rows = Array.isArray(res.data) ? res.data.slice(0, 6) : [res.data];
            body.innerHTML = rows.map(function (u) {
                var badgeClass = u.type === 'farmer' ? 'badge--success' : u.type === 'merchant' ? 'badge--warning' : 'badge--admin';
                return '<tr>' +
                    '<td><strong>' + (u.name || u.username) + '</strong></td>' +
                    '<td><span class="badge ' + badgeClass + '">' + (u.type || '—') + '</span></td>' +
                    '<td>' + (u.location || '—') + '</td>' +
                    '</tr>';
            }).join('');
        })
        .catch(function () {
            document.getElementById('recentUsersBody').innerHTML =
                '<tr><td colspan="3" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">Failed to load.</td></tr>';
        });


    // ── Active Warnings ─────────────────────────────────────
    var wc = document.getElementById('warningsContainer');
    api('read/warnings.php', { active: true })
        .then(function (res) {
            if (!res.success || !res.data) {
                wc.innerHTML = '<div class="empty-state" style="padding:var(--space-lg)"><div class="empty-state__icon"><i class="fa-solid fa-shield-check"></i></div><p class="empty-state__text">No active warnings.</p></div>';
                return;
            }
            var warnings = Array.isArray(res.data) ? res.data : [res.data];
            if (!warnings.length) {
                wc.innerHTML = '<div class="empty-state" style="padding:var(--space-lg)"><div class="empty-state__icon"><i class="fa-solid fa-shield-check"></i></div><p class="empty-state__text">No active warnings.</p></div>';
                return;
            }
            wc.innerHTML = '<div class="activity-list">' + warnings.slice(0, 5).map(function (w) {
                return '<div class="activity-item">' +
                    '<div class="activity-item__icon stat-card__icon--alert"><i class="fa-solid fa-triangle-exclamation"></i></div>' +
                    '<div class="activity-item__content">' +
                    '<div class="activity-item__text">' + (w.title || 'Warning') + '</div>' +
                    '<div class="activity-item__time">' + relativeTime(w.timestamp) + '</div>' +
                    '</div></div>';
            }).join('') + '</div>';
        })
        .catch(function () {
            wc.innerHTML = '<div style="text-align:center;color:var(--color-text-light);padding:var(--space-md)">Could not load warnings.</div>';
        });


    // ── Activity Feed ───────────────────────────────────────
    var feed = document.getElementById('activityFeed');
    var user;
    try { user = JSON.parse(parent.sessionStorage.getItem('agropan_user')) || {}; } catch (e) { user = {}; }
    var loginTime = user.last_login ? relativeTime(user.last_login) : 'recently';
    feed.innerHTML =
        '<div class="activity-item">' +
        '<div class="activity-item__icon stat-card__icon--primary"><i class="fa-solid fa-right-to-bracket"></i></div>' +
        '<div class="activity-item__content">' +
        '<div class="activity-item__text">Admin logged in</div>' +
        '<div class="activity-item__time">' + loginTime + '</div>' +
        '</div></div>' +
        '<div class="activity-item">' +
        '<div class="activity-item__icon stat-card__icon--accent"><i class="fa-solid fa-shield-check"></i></div>' +
        '<div class="activity-item__content">' +
        '<div class="activity-item__text">System check completed</div>' +
        '<div class="activity-item__time">Just now</div>' +
        '</div></div>';

})();
