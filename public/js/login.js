/**
 * AgroPan — Login Page Logic
 *
 * Handles form validation, API calls to /API/auth.php,
 * password visibility toggle, and error/success feedback.
 */

(function () {
    'use strict';

    // ── DOM References ──────────────────────────────────────
    const form = document.getElementById('loginForm');
    const submitBtn = document.getElementById('loginSubmit');
    const alertBox = document.getElementById('loginAlert');
    const alertText = document.getElementById('loginAlertText');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');

    const API_AUTH = 'API/auth.php';


    // ── Password visibility toggle ──────────────────────────
    togglePassword.addEventListener('click', function () {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
    });


    // ── Helpers ─────────────────────────────────────────────

    function showAlert(message, type) {
        alertBox.className = 'auth__alert';
        alertBox.classList.add(type === 'error' ? 'auth__alert--error' : 'auth__alert--success');

        const icon = alertBox.querySelector('i');
        icon.className = type === 'error'
            ? 'fa-solid fa-circle-exclamation'
            : 'fa-solid fa-circle-check';

        alertText.textContent = message;
    }

    function hideAlert() {
        alertBox.className = 'auth__alert';
        alertText.textContent = '';
    }

    function setFieldError(groupId, errorId, message) {
        const group = document.getElementById(groupId);
        const error = document.getElementById(errorId);
        group.classList.add('form-group--error');
        group.classList.remove('form-group--success');
        error.textContent = message;
    }

    function clearFieldError(groupId, errorId) {
        const group = document.getElementById(groupId);
        const error = document.getElementById(errorId);
        group.classList.remove('form-group--error');
        error.textContent = '';
    }

    function setLoading(loading) {
        submitBtn.disabled = loading;
        submitBtn.classList.toggle('auth__submit--loading', loading);
    }


    // ── Live validation on blur ─────────────────────────────

    usernameInput.addEventListener('blur', function () {
        if (!this.value.trim()) {
            setFieldError('groupUsername', 'usernameError', 'Username is required');
        } else {
            clearFieldError('groupUsername', 'usernameError');
        }
    });

    passwordInput.addEventListener('blur', function () {
        if (!this.value) {
            setFieldError('groupPassword', 'passwordError', 'Password is required');
        } else {
            clearFieldError('groupPassword', 'passwordError');
        }
    });

    // Clear errors on input
    usernameInput.addEventListener('input', function () {
        clearFieldError('groupUsername', 'usernameError');
        hideAlert();
    });

    passwordInput.addEventListener('input', function () {
        clearFieldError('groupPassword', 'passwordError');
        hideAlert();
    });


    // ── Form Submit ─────────────────────────────────────────

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        hideAlert();

        // Client-side validation
        let valid = true;

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username) {
            setFieldError('groupUsername', 'usernameError', 'Username is required');
            valid = false;
        }

        if (!password) {
            setFieldError('groupPassword', 'passwordError', 'Password is required');
            valid = false;
        }

        if (!valid) return;

        // API call
        setLoading(true);

        try {
            const response = await fetch(API_AUTH, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'login',
                    username: username,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                showAlert('Login successful! Redirecting…', 'success');

                // Store user data in sessionStorage for client-side use
                if (data.data) {
                    sessionStorage.setItem('agropan_user', JSON.stringify(data.data));
                }

                // Redirect based on user type
                var userType = (data.data && data.data.type) ? data.data.type.toLowerCase() : 'farmer';
                var dashboardPath;
                if (userType === 'admin') {
                    dashboardPath = 'dashboard/admin/index.html';
                } else if (userType === 'merchant') {
                    dashboardPath = 'dashboard/merchant/index.html';
                } else {
                    dashboardPath = 'dashboard/farmer/index.html';
                }

                // Redirect after brief delay
                setTimeout(function () {
                    window.location.href = dashboardPath;
                }, 800);
            } else {
                showAlert(data.message || 'Invalid username or password', 'error');
                setLoading(false);
            }
        } catch (err) {
            showAlert('Network error — please check your connection and try again.', 'error');
            setLoading(false);
            console.error('Login error:', err);
        }
    });
})();
