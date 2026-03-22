/**
 * AgroPan — Farmer Dashboard: Field Data Page
 *
 * Loads sensor readings, live stat cards, device filter, data table.
 */

(function () {
    'use strict';

    const API = '../../API/';

    const deviceFilter = document.getElementById('deviceFilter');
    const dataBody = document.getElementById('dataBody');
    const dataCount = document.getElementById('dataCount');
    const refreshBtn = document.getElementById('refreshData');

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
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
            ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }


    // ── Populate Device Filter ──────────────────────────────

    function loadDeviceFilter() {
        var user = getUser();
        var body = user.username ? { owned_by: user.username } : {};
        api('read/devices.php', body)
            .then(function (res) {
                if (!res.success || !res.data) return;
                var devices = Array.isArray(res.data) ? res.data : [res.data];
                devices.forEach(function (d) {
                    var opt = document.createElement('option');
                    opt.value = d.name;
                    opt.textContent = d.name;
                    deviceFilter.appendChild(opt);
                });
            });
    }


    // ── Load Data ───────────────────────────────────────────

    function loadData() {
        var filter = deviceFilter.value;
        var body = filter ? { device: filter } : {};

        // Show loading
        dataBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)"><i class="fa-solid fa-spinner fa-spin"></i> Loading…</td></tr>';

        api('read/data.php', body)
            .then(function (res) {
                if (!res.success || !res.data) {
                    showEmpty();
                    updateLiveStats(null);
                    return;
                }
                var rows = Array.isArray(res.data) ? res.data : [res.data];
                if (rows.length === 0) { showEmpty(); updateLiveStats(null); return; }

                dataCount.textContent = rows.length + ' record' + (rows.length !== 1 ? 's' : '');

                // Live stats from latest reading
                updateLiveStats(rows[0]);

                // Render table
                dataBody.innerHTML = rows.map(function (r) {
                    return '<tr>' +
                        '<td><strong>' + escapeHtml(r.device || '—') + '</strong></td>' +
                        '<td>' + fmt(r.temperature, '°C') + '</td>' +
                        '<td>' + fmt(r.moisture, '%') + '</td>' +
                        '<td>' + fmt(r.humidity, '%') + '</td>' +
                        '<td>' + fmt(r.gases, ' ppm') + '</td>' +
                        '<td>' + fmt(r.nitrogen, ' mg/kg') + '</td>' +
                        '<td style="font-size:var(--text-xs);color:var(--color-text-muted)">' + ts(r.timestamp) + '</td>' +
                        '</tr>';
                }).join('');
            })
            .catch(function () {
                showEmpty('Failed to load data.');
                updateLiveStats(null);
            });
    }

    function fmt(val, unit) {
        return val != null ? val + unit : '—';
    }

    function showEmpty(msg) {
        dataCount.textContent = '0 records';
        dataBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">' +
            '<i class="fa-solid fa-database" style="font-size:1.5rem;display:block;margin-bottom:var(--space-sm)"></i>' +
            (msg || 'No data readings found.') + '</td></tr>';
    }

    function updateLiveStats(latest) {
        document.getElementById('liveTemp').textContent = latest && latest.temperature != null ? latest.temperature + ' °C' : '— °C';
        document.getElementById('liveMoisture').textContent = latest && latest.moisture != null ? latest.moisture + ' %' : '— %';
        document.getElementById('liveHumidity').textContent = latest && latest.humidity != null ? latest.humidity + ' %' : '— %';
        document.getElementById('liveGas').textContent = latest && latest.gases != null ? latest.gases + ' ppm' : '— ppm';
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }


    // ── Events ──────────────────────────────────────────────

    deviceFilter.addEventListener('change', loadData);
    refreshBtn.addEventListener('click', loadData);


    // ── Init ────────────────────────────────────────────────

    loadDeviceFilter();
    loadData();

})();
