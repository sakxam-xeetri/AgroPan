/**
 * AgroPan — Merchant Dashboard Shell Logic
 *
 * Handles sidebar/tab navigation, iframe routing,
 * user session display, dropdown menu, and logout.
 */

(function () {
    'use strict';

    const API_BASE = '../../API/';
    const iframe = document.getElementById('contentFrame');
    const sidebarLinks = document.querySelectorAll('.dash-sidebar__link[data-page]');
    const tabLinks = document.querySelectorAll('.dash-tab[data-page]');
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logoutBtn');
    const userAvatar = document.getElementById('userAvatar');
    const userDisplayName = document.getElementById('userDisplayName');

    const PAGE_MAP = {
        dashboard: 'dashboard.html',
        crops: 'crops.html',
        farmers: 'farmers.html',
        profile: 'profile.html'
    };

    let currentPage = 'dashboard';

    // ── Navigation ──────────────────────────────────────────

    function navigateTo(page) {
        if (!PAGE_MAP[page]) return;
        currentPage = page;
        iframe.src = PAGE_MAP[page];

        sidebarLinks.forEach(function (link) {
            link.classList.toggle('is-active', link.dataset.page === page);
        });

        tabLinks.forEach(function (tab) {
            tab.classList.toggle('is-active', tab.dataset.page === page);
        });

        userDropdown.classList.remove('is-open');
    }

    window.navigateTo = navigateTo;

    sidebarLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            navigateTo(this.dataset.page);
        });
    });

    tabLinks.forEach(function (tab) {
        tab.addEventListener('click', function (e) {
            e.preventDefault();
            navigateTo(this.dataset.page);
        });
    });

    document.querySelectorAll('.user-dropdown__item[data-page]').forEach(function (item) {
        item.addEventListener('click', function () {
            navigateTo(this.dataset.page);
        });
    });


    // ── User Dropdown ───────────────────────────────────────

    userMenuBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        userDropdown.classList.toggle('is-open');
    });

    document.addEventListener('click', function (e) {
        if (!userDropdown.contains(e.target) && !userMenuBtn.contains(e.target)) {
            userDropdown.classList.remove('is-open');
        }
    });


    // ── Session / User Info ─────────────────────────────────

    function loadUserInfo() {
        var stored = sessionStorage.getItem('agropan_user');
        if (stored) {
            try {
                var user = JSON.parse(stored);
                displayUser(user);
                return;
            } catch (e) { /* fall through */ }
        }

        fetch(API_BASE + 'auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'status' })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.success && data.data && data.data.logged_in) {
                    displayUser(data.data);
                    sessionStorage.setItem('agropan_user', JSON.stringify(data.data));
                } else {
                    window.location.href = '../../login.html';
                }
            })
            .catch(function () {
                displayUser({ name: 'Merchant', username: 'merchant' });
            });
    }

    function displayUser(user) {
        var name = user.name || user.username || 'Merchant';
        var initials = name.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
        userAvatar.textContent = initials;
        userDisplayName.textContent = name.split(' ')[0];
    }

    loadUserInfo();


    // ── Logout ──────────────────────────────────────────────

    logoutBtn.addEventListener('click', function () {
        fetch(API_BASE + 'auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'logout' })
        })
            .then(function () {
                sessionStorage.removeItem('agropan_user');
                window.location.href = '../../login.html';
            })
            .catch(function () {
                sessionStorage.removeItem('agropan_user');
                window.location.href = '../../login.html';
            });
    });

})();
