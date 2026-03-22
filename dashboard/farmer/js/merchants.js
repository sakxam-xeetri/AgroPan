/**
 * AgroPan — Farmer Dashboard: Merchants Page
 *
 * Loads merchant users and provides search functionality.
 */

(function () {
    'use strict';

    const API = '../../API/';

    const list = document.getElementById('merchantsList');
    const searchInput = document.getElementById('merchantSearch');
    let allMerchants = [];

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


    // ── Load Merchants ──────────────────────────────────────

    function loadMerchants() {
        list.innerHTML = '<div style="text-align:center;padding:var(--space-3xl);color:var(--color-text-light);grid-column:1/-1"><i class="fa-solid fa-spinner fa-spin" style="font-size:1.5rem"></i><p style="margin-top:var(--space-md)">Loading merchants…</p></div>';

        api('read/users.php', {})
            .then(function (res) {
                if (!res.success || !res.data) { showEmpty(); return; }
                var users = Array.isArray(res.data) ? res.data : [res.data];
                // Filter to merchants only
                allMerchants = users.filter(function (u) {
                    return (u.type || '').toLowerCase() === 'merchant';
                });
                if (allMerchants.length === 0) { showEmpty(); return; }
                renderMerchants(allMerchants);
            })
            .catch(function () { showEmpty('Failed to load merchants.'); });
    }

    function showEmpty(msg) {
        list.innerHTML =
            '<div style="text-align:center;padding:var(--space-3xl);color:var(--color-text-light);grid-column:1/-1">' +
            '<div style="font-size:3rem;margin-bottom:var(--space-md)"><i class="fa-solid fa-store"></i></div>' +
            '<p style="font-size:var(--text-lg);font-weight:var(--weight-semibold);margin-bottom:var(--space-xs)">' + (msg || 'No merchants found') + '</p>' +
            '<p>Merchants will appear here once they sign up on AgroPan.</p>' +
            '</div>';
    }

    function renderMerchants(merchants) {
        list.innerHTML = merchants.map(function (m) {
            var initials = (m.name || m.username || '?').split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
            return '<div class="item-card">' +
                '<div class="merchant-card">' +
                '<div class="merchant-card__avatar">' + initials + '</div>' +
                '<div class="merchant-card__info">' +
                '<div class="merchant-card__name">' + escapeHtml(m.name || m.username) + '</div>' +
                '<div class="merchant-card__detail"><i class="fa-solid fa-location-dot"></i> ' + escapeHtml(m.location || 'No location') + '</div>' +
                (m.email ? '<div class="merchant-card__detail"><i class="fa-solid fa-envelope"></i> ' + escapeHtml(m.email) + '</div>' : '') +
                (m.phone ? '<div class="merchant-card__detail"><i class="fa-solid fa-phone"></i> ' + escapeHtml(m.phone) + '</div>' : '') +
                '</div>' +
                '</div>' +
                '<div class="merchant-card__contact">' +
                (m.email ? '<a href="mailto:' + escapeHtml(m.email) + '" class="btn btn--ghost btn--sm"><i class="fa-solid fa-envelope"></i> Email</a>' : '') +
                (m.phone ? '<a href="tel:' + escapeHtml(m.phone) + '" class="btn btn--primary btn--sm"><i class="fa-solid fa-phone"></i> Call</a>' : '') +
                '</div>' +
                '</div>';
        }).join('');
    }


    // ── Search ──────────────────────────────────────────────

    searchInput.addEventListener('input', function () {
        var q = this.value.toLowerCase().trim();
        if (!q) {
            if (allMerchants.length) renderMerchants(allMerchants);
            else showEmpty();
            return;
        }
        var filtered = allMerchants.filter(function (m) {
            return (m.name || '').toLowerCase().indexOf(q) > -1 ||
                (m.username || '').toLowerCase().indexOf(q) > -1 ||
                (m.location || '').toLowerCase().indexOf(q) > -1 ||
                (m.email || '').toLowerCase().indexOf(q) > -1;
        });
        if (filtered.length) renderMerchants(filtered);
        else list.innerHTML = '<div style="text-align:center;padding:var(--space-3xl);color:var(--color-text-light);grid-column:1/-1"><i class="fa-solid fa-search" style="font-size:1.5rem;display:block;margin-bottom:var(--space-sm)"></i>No merchants match "' + escapeHtml(q) + '"</div>';
    });


    // ── Init ────────────────────────────────────────────────

    loadMerchants();

})();
