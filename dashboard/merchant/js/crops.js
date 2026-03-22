/**
 * AgroPan — Merchant Dashboard: Browse Crops Page
 *
 * Read-only crop browsing with search, filter, sort, and detail modal.
 * Merchants browse; farmers list. No create/edit/delete here.
 */

(function () {
    'use strict';

    const API = '../../API/';

    const list = document.getElementById('cropsList');
    const searchInput = document.getElementById('cropSearch');
    const filterSelect = document.getElementById('cropFilter');
    const sortSelect = document.getElementById('cropSort');
    const resultCount = document.getElementById('resultCount');
    const detailModal = document.getElementById('cropDetailModal');
    const detailTitle = document.getElementById('detailTitle');
    const detailBody = document.getElementById('detailBody');

    let allCrops = [];

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
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }


    // ── Load Crops ──────────────────────────────────────────

    function loadCrops() {
        list.innerHTML = '<div style="text-align:center;padding:var(--space-3xl);color:var(--color-text-light);grid-column:1/-1"><i class="fa-solid fa-spinner fa-spin" style="font-size:1.5rem"></i><p style="margin-top:var(--space-md)">Loading crops…</p></div>';

        api('read/crops.php', {})
            .then(function (res) {
                if (!res.success || !res.data) { allCrops = []; applyFilters(); return; }
                allCrops = Array.isArray(res.data) ? res.data : [res.data];
                applyFilters();
            })
            .catch(function () { allCrops = []; showEmpty('Failed to load crops.'); });
    }

    function applyFilters() {
        var q = searchInput.value.toLowerCase().trim();
        var type = filterSelect.value;
        var sort = sortSelect.value;

        var filtered = allCrops.filter(function (c) {
            var matchesSearch = !q || (c.name || '').toLowerCase().indexOf(q) > -1;
            var matchesType = !type || (c.type || '').toLowerCase() === type;
            return matchesSearch && matchesType;
        });

        // Sort
        if (sort === 'price-low') {
            filtered.sort(function (a, b) { return parseFloat(a.price || 0) - parseFloat(b.price || 0); });
        } else if (sort === 'price-high') {
            filtered.sort(function (a, b) { return parseFloat(b.price || 0) - parseFloat(a.price || 0); });
        } else if (sort === 'name') {
            filtered.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
        } else {
            // newest — sort by last_updated desc
            filtered.sort(function (a, b) { return (b.last_updated || 0) - (a.last_updated || 0); });
        }

        resultCount.textContent = filtered.length + ' crop' + (filtered.length !== 1 ? 's' : '') + ' found';

        if (filtered.length === 0) {
            showEmpty(q || type ? 'No crops match your search.' : 'No crops available yet.');
            return;
        }

        renderCrops(filtered);
    }

    function showEmpty(msg) {
        list.innerHTML =
            '<div style="text-align:center;padding:var(--space-3xl);color:var(--color-text-light);grid-column:1/-1">' +
            '<div style="font-size:3rem;margin-bottom:var(--space-md)"><i class="fa-solid fa-basket-shopping"></i></div>' +
            '<p style="font-size:var(--text-lg);font-weight:var(--weight-semibold);margin-bottom:var(--space-xs)">' + escapeHtml(msg) + '</p>' +
            '<p>Check back later for new listings from farmers.</p>' +
            '</div>';
    }

    function renderCrops(crops) {
        list.innerHTML = crops.map(function (c) {
            var rawImg = c.image || '';
            var imgSrc = rawImg && rawImg.indexOf('http') !== 0 ? '../../' + rawImg : rawImg;
            var imgHtml = imgSrc
                ? '<img class="crop-card__image" src="' + escapeHtml(imgSrc) + '" alt="' + escapeHtml(c.name) + '" onerror="this.style.display=\'none\'" />'
                : '<div class="crop-card__image" style="display:flex;align-items:center;justify-content:center;color:var(--color-text-light);font-size:2rem"><i class="fa-solid fa-wheat-awn"></i></div>';

            return '<div class="item-card">' +
                imgHtml +
                '<div class="crop-card__name">' + escapeHtml(c.name) + '</div>' +
                '<div class="crop-card__price">NPR ' + escapeHtml(String(c.price || 0)) + '/kg</div>' +
                '<div class="crop-card__meta">' +
                '<span class="badge badge--neutral">' + escapeHtml(c.type || 'Other') + '</span>' +
                '<span style="margin-left:auto">' + ts(c.last_updated) + '</span>' +
                '</div>' +
                '<div class="crop-card__actions">' +
                '<button class="btn btn--primary btn--sm" onclick="viewCropDetail(' + c.crop_id + ')"><i class="fa-solid fa-eye"></i> View Details</button>' +
                '</div>' +
                '</div>';
        }).join('');
    }


    // ── Detail Modal ────────────────────────────────────────

    window.viewCropDetail = function (id) {
        var crop = allCrops.find(function (c) { return c.crop_id === id; });
        if (!crop) return;

        detailTitle.textContent = crop.name || 'Crop Details';

        var detailImg = crop.image && crop.image.indexOf('http') !== 0 ? '../../' + crop.image : (crop.image || '');
        var imgHtml = detailImg
            ? '<img src="' + escapeHtml(detailImg) + '" alt="' + escapeHtml(crop.name) + '" style="width:100%;max-height:240px;object-fit:cover;border-radius:var(--radius-md);margin-bottom:var(--space-lg)" onerror="this.style.display=\'none\'" />'
            : '';

        detailBody.innerHTML =
            imgHtml +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);margin-bottom:var(--space-lg)">' +
            '<div>' +
            '<div style="font-size:var(--text-xs);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Price per kg</div>' +
            '<div style="font-size:var(--text-xl);font-weight:var(--weight-bold);color:var(--color-secondary)">NPR ' + escapeHtml(String(crop.price || 0)) + '</div>' +
            '</div>' +
            '<div>' +
            '<div style="font-size:var(--text-xs);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Type</div>' +
            '<div><span class="badge badge--neutral" style="font-size:var(--text-sm)">' + escapeHtml(crop.type || 'Other') + '</span></div>' +
            '</div>' +
            '</div>' +
            '<div style="padding:var(--space-md);background:var(--color-bg);border-radius:var(--radius-md);font-size:var(--text-sm);color:var(--color-text-muted)">' +
            '<i class="fa-solid fa-clock" style="margin-right:var(--space-xs)"></i> Last updated: ' + ts(crop.last_updated) +
            '</div>';

        detailModal.classList.add('is-open');
    };

    function closeDetailModal() {
        detailModal.classList.remove('is-open');
    }

    document.getElementById('closeDetail').addEventListener('click', closeDetailModal);
    document.getElementById('closeDetailBtn').addEventListener('click', closeDetailModal);
    detailModal.addEventListener('click', function (e) {
        if (e.target === detailModal) closeDetailModal();
    });


    // ── Events ──────────────────────────────────────────────

    searchInput.addEventListener('input', applyFilters);
    filterSelect.addEventListener('change', applyFilters);
    sortSelect.addEventListener('change', applyFilters);


    // ── Init ────────────────────────────────────────────────

    loadCrops();

})();
