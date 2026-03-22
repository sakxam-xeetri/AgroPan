/**
 * AgroPan — Farmer Dashboard: Profile Page
 *
 * Loads user data, allows profile editing and password change.
 */

(function () {
    'use strict';

    const API = '../../API/';

    const alertBox = document.getElementById('profileAlert');

    // Profile header elements
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileType = document.getElementById('profileType');
    const profileLocation = document.getElementById('profileLocation');
    const profileLastLogin = document.getElementById('profileLastLogin');

    // Edit form elements
    const editName = document.getElementById('editName');
    const editUsername = document.getElementById('editUsername');
    const editEmail = document.getElementById('editEmail');
    const editPhone = document.getElementById('editPhone');
    const editLocation = document.getElementById('editLocation');

    // Password form elements
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    let currentUser = null;

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
        if (!unix) return 'Unknown';
        var d = new Date(unix * 1000);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
            ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    function showAlert(msg, type) {
        type = type || 'success';
        alertBox.innerHTML = '<div class="alert alert--' + type + '">' +
            '<i class="fa-solid fa-' + (type === 'success' ? 'check-circle' : 'circle-exclamation') + '"></i> ' +
            msg + '</div>';
        setTimeout(function () { alertBox.innerHTML = ''; }, 4000);
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }


    // ── Load Profile ────────────────────────────────────────

    function loadProfile() {
        var stored = getUser();
        if (stored.user_id) {
            // Fetch fresh data from API
            api('read/users.php', { user_id: stored.user_id })
                .then(function (res) {
                    if (res.success && res.data) {
                        var user = Array.isArray(res.data) ? res.data[0] : res.data;
                        currentUser = user;
                        displayProfile(user);
                        populateForm(user);
                    } else {
                        // Use stored data as fallback
                        currentUser = stored;
                        displayProfile(stored);
                        populateForm(stored);
                    }
                })
                .catch(function () {
                    currentUser = stored;
                    displayProfile(stored);
                    populateForm(stored);
                });
        } else {
            currentUser = stored;
            displayProfile(stored);
            populateForm(stored);
        }
    }

    function displayProfile(user) {
        var name = user.name || user.username || 'Farmer';
        var initials = name.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2);

        profileAvatar.textContent = initials;
        profileName.textContent = name;
        profileType.textContent = capitalize(user.type || 'farmer');
        profileLocation.textContent = user.location || 'Not set';
        profileLastLogin.textContent = ts(user.last_login);
    }

    function populateForm(user) {
        editName.value = user.name || '';
        editUsername.value = user.username || '';
        editEmail.value = user.email || '';
        editPhone.value = user.phone || '';
        editLocation.value = user.location || '';
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }


    // ── Save Profile ────────────────────────────────────────

    document.getElementById('profileForm').addEventListener('submit', function (e) {
        e.preventDefault();

        if (!currentUser || !currentUser.user_id) {
            showAlert('User not loaded. Please refresh.', 'danger');
            return;
        }

        var name = editName.value.trim();
        var email = editEmail.value.trim();
        var phone = editPhone.value.trim();
        var location = editLocation.value.trim();

        if (!name) { showAlert('Name is required.', 'danger'); return; }

        var body = { user_id: currentUser.user_id };
        if (name !== (currentUser.name || '')) body.name = name;
        if (email !== (currentUser.email || '')) body.email = email;
        if (phone !== (currentUser.phone || '')) body.phone = phone;
        if (location !== (currentUser.location || '')) body.location = location;

        // Check if anything changed
        if (Object.keys(body).length <= 1) {
            showAlert('No changes to save.', 'info');
            return;
        }

        api('update/users.php', body)
            .then(function (res) {
                if (res.success) {
                    showAlert('Profile updated successfully!');
                    // Update session storage
                    var updated = Object.assign({}, currentUser, body);
                    currentUser = updated;
                    try { parent.sessionStorage.setItem('agropan_user', JSON.stringify(updated)); }
                    catch (e) { /* silently fail */ }
                    displayProfile(updated);
                    // Refresh parent header name
                    try {
                        var parentAvatar = parent.document.getElementById('userAvatar');
                        var parentName = parent.document.getElementById('userDisplayName');
                        if (parentAvatar && parentName) {
                            var initials = (updated.name || '').split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
                            parentAvatar.textContent = initials;
                            parentName.textContent = (updated.name || '').split(' ')[0];
                        }
                    } catch (e) { /* cross-origin safety */ }
                } else {
                    showAlert(res.message || 'Update failed.', 'danger');
                }
            })
            .catch(function () { showAlert('Network error. Try again.', 'danger'); });
    });


    // ── Change Password ─────────────────────────────────────

    document.getElementById('passwordForm').addEventListener('submit', function (e) {
        e.preventDefault();

        if (!currentUser || !currentUser.user_id) {
            showAlert('User not loaded. Please refresh.', 'danger');
            return;
        }

        var pwd = newPassword.value;
        var confirm = confirmPassword.value;

        if (!pwd) { showAlert('Please enter a new password.', 'danger'); return; }
        if (pwd.length < 8) { showAlert('Password must be at least 8 characters.', 'danger'); return; }
        if (pwd !== confirm) { showAlert('Passwords do not match.', 'danger'); return; }

        api('update/users.php', {
            user_id: currentUser.user_id,
            password: pwd
        })
            .then(function (res) {
                if (res.success) {
                    showAlert('Password changed successfully!');
                    newPassword.value = '';
                    confirmPassword.value = '';
                } else {
                    showAlert(res.message || 'Password change failed.', 'danger');
                }
            })
            .catch(function () { showAlert('Network error. Try again.', 'danger'); });
    });


    // ── Init ────────────────────────────────────────────────

    loadProfile();

})();
