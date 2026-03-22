/**
 * AgroPan — Signup Page Logic
 *
 * Handles multi-field validation, password strength meter,
 * API call to /API/create/users.php, and auto-login on success.
 */

(function () {
    'use strict';

    // ── DOM References ──────────────────────────────────────
    const form = document.getElementById('signupForm');
    const submitBtn = document.getElementById('signupSubmit');
    const alertBox = document.getElementById('signupAlert');
    const alertText = document.getElementById('signupAlertText');

    const nameInput = document.getElementById('name');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const locationInput = document.getElementById('location');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const termsCheckbox = document.getElementById('terms');

    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirm = document.getElementById('toggleConfirm');

    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');

    const API_CREATE_USER = 'API/create/users.php';
    const API_AUTH = 'API/auth.php';


    // ── Password Visibility Toggles ─────────────────────────

    function setupToggle(btn, input) {
        btn.addEventListener('click', function () {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    setupToggle(togglePassword, passwordInput);
    setupToggle(toggleConfirm, confirmInput);


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

    function setFieldSuccess(groupId, errorId) {
        const group = document.getElementById(groupId);
        const error = document.getElementById(errorId);
        group.classList.remove('form-group--error');
        group.classList.add('form-group--success');
        error.textContent = '';
    }

    function clearField(groupId, errorId) {
        const group = document.getElementById(groupId);
        const error = document.getElementById(errorId);
        group.classList.remove('form-group--error', 'form-group--success');
        error.textContent = '';
    }

    function setLoading(loading) {
        submitBtn.disabled = loading;
        submitBtn.classList.toggle('auth__submit--loading', loading);
    }


    // ── Validators ──────────────────────────────────────────

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidPhone(phone) {
        // Nepal phone: 10 digits, starts with 97 or 98 (mobile) or general 10 digits
        return /^\d{10,15}$/.test(phone.replace(/[\s\-\+]/g, ''));
    }

    function isValidUsername(username) {
        // 3-30 chars, letters, numbers, underscores, hyphens
        return /^[a-zA-Z0-9_\-]{3,30}$/.test(username);
    }


    // ── Password Strength ───────────────────────────────────

    function getPasswordStrength(pw) {
        let score = 0;
        if (pw.length >= 8) score++;
        if (pw.length >= 12) score++;
        if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
        if (/\d/.test(pw)) score++;
        if (/[^a-zA-Z0-9]/.test(pw)) score++;

        if (score <= 1) return { level: 'weak', label: 'Weak', css: 'password-strength__fill--weak' };
        if (score === 2) return { level: 'fair', label: 'Fair', css: 'password-strength__fill--fair' };
        if (score === 3) return { level: 'good', label: 'Good', css: 'password-strength__fill--good' };
        return { level: 'strong', label: 'Strong', css: 'password-strength__fill--strong' };
    }

    passwordInput.addEventListener('input', function () {
        const pw = this.value;
        if (!pw) {
            strengthFill.className = 'password-strength__fill';
            strengthText.textContent = '';
            return;
        }

        const strength = getPasswordStrength(pw);
        strengthFill.className = 'password-strength__fill ' + strength.css;
        strengthText.textContent = 'Strength: ' + strength.label;

        // Clear error if present
        clearField('groupPassword', 'passwordError');
        hideAlert();
    });


    // ── Live Validation on Blur ─────────────────────────────

    nameInput.addEventListener('blur', function () {
        if (!this.value.trim()) {
            setFieldError('groupName', 'nameError', 'Full name is required');
        } else if (this.value.trim().length < 2) {
            setFieldError('groupName', 'nameError', 'Name must be at least 2 characters');
        } else {
            setFieldSuccess('groupName', 'nameError');
        }
    });

    usernameInput.addEventListener('blur', function () {
        const val = this.value.trim();
        if (!val) {
            setFieldError('groupUsername', 'usernameError', 'Username is required');
        } else if (!isValidUsername(val)) {
            setFieldError('groupUsername', 'usernameError', '3–30 characters, letters, numbers, _ or -');
        } else {
            setFieldSuccess('groupUsername', 'usernameError');
        }
    });

    emailInput.addEventListener('blur', function () {
        const val = this.value.trim();
        if (!val) {
            setFieldError('groupEmail', 'emailError', 'Email is required');
        } else if (!isValidEmail(val)) {
            setFieldError('groupEmail', 'emailError', 'Enter a valid email address');
        } else {
            setFieldSuccess('groupEmail', 'emailError');
        }
    });

    phoneInput.addEventListener('blur', function () {
        const val = this.value.trim();
        if (!val) {
            setFieldError('groupPhone', 'phoneError', 'Phone number is required');
        } else if (!isValidPhone(val)) {
            setFieldError('groupPhone', 'phoneError', 'Enter a valid phone number');
        } else {
            setFieldSuccess('groupPhone', 'phoneError');
        }
    });

    locationInput.addEventListener('blur', function () {
        if (!this.value.trim()) {
            setFieldError('groupLocation', 'locationError', 'Location is required');
        } else {
            setFieldSuccess('groupLocation', 'locationError');
        }
    });

    passwordInput.addEventListener('blur', function () {
        if (!this.value) {
            setFieldError('groupPassword', 'passwordError', 'Password is required');
        } else if (this.value.length < 8) {
            setFieldError('groupPassword', 'passwordError', 'Password must be at least 8 characters');
        } else {
            setFieldSuccess('groupPassword', 'passwordError');
        }
    });

    confirmInput.addEventListener('blur', function () {
        if (!this.value) {
            setFieldError('groupConfirm', 'confirmError', 'Please confirm your password');
        } else if (this.value !== passwordInput.value) {
            setFieldError('groupConfirm', 'confirmError', 'Passwords do not match');
        } else {
            setFieldSuccess('groupConfirm', 'confirmError');
        }
    });

    // Clear on input
    [
        [nameInput, 'groupName', 'nameError'],
        [usernameInput, 'groupUsername', 'usernameError'],
        [emailInput, 'groupEmail', 'emailError'],
        [phoneInput, 'groupPhone', 'phoneError'],
        [locationInput, 'groupLocation', 'locationError'],
        [confirmInput, 'groupConfirm', 'confirmError'],
    ].forEach(function (trio) {
        trio[0].addEventListener('input', function () {
            clearField(trio[1], trio[2]);
            hideAlert();
        });
    });


    // ── Form Submit ─────────────────────────────────────────

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        hideAlert();

        // ── Full validation pass ──
        let valid = true;
        const name = nameInput.value.trim();
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        const location = locationInput.value.trim();
        const type = document.querySelector('input[name="type"]:checked')?.value;
        const password = passwordInput.value;
        const confirm = confirmInput.value;

        if (!name || name.length < 2) {
            setFieldError('groupName', 'nameError', !name ? 'Full name is required' : 'Name must be at least 2 characters');
            valid = false;
        }

        if (!username) {
            setFieldError('groupUsername', 'usernameError', 'Username is required');
            valid = false;
        } else if (!isValidUsername(username)) {
            setFieldError('groupUsername', 'usernameError', '3–30 characters, letters, numbers, _ or -');
            valid = false;
        }

        if (!email) {
            setFieldError('groupEmail', 'emailError', 'Email is required');
            valid = false;
        } else if (!isValidEmail(email)) {
            setFieldError('groupEmail', 'emailError', 'Enter a valid email address');
            valid = false;
        }

        if (!phone) {
            setFieldError('groupPhone', 'phoneError', 'Phone number is required');
            valid = false;
        } else if (!isValidPhone(phone)) {
            setFieldError('groupPhone', 'phoneError', 'Enter a valid phone number');
            valid = false;
        }

        if (!location) {
            setFieldError('groupLocation', 'locationError', 'Location is required');
            valid = false;
        }

        if (!password) {
            setFieldError('groupPassword', 'passwordError', 'Password is required');
            valid = false;
        } else if (password.length < 8) {
            setFieldError('groupPassword', 'passwordError', 'Password must be at least 8 characters');
            valid = false;
        }

        if (!confirm) {
            setFieldError('groupConfirm', 'confirmError', 'Please confirm your password');
            valid = false;
        } else if (confirm !== password) {
            setFieldError('groupConfirm', 'confirmError', 'Passwords do not match');
            valid = false;
        }

        if (!termsCheckbox.checked) {
            showAlert('You must agree to the Terms of Service and Privacy Policy.', 'error');
            valid = false;
        }

        if (!valid) return;

        // ── API call — create user ──
        setLoading(true);

        try {
            const response = await fetch(API_CREATE_USER, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    phone: phone,
                    name: name,
                    location: location,
                    type: type,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                showAlert('Account created! Logging you in…', 'success');

                // Auto-login after signup
                try {
                    const loginRes = await fetch(API_AUTH, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'login',
                            username: username,
                            password: password
                        })
                    });

                    const loginData = await loginRes.json();

                    if (loginData.success && loginData.data) {
                        sessionStorage.setItem('agropan_user', JSON.stringify(loginData.data));
                    }
                } catch (loginErr) {
                    // Auto-login failed silently — user can log in manually
                    console.warn('Auto-login after signup failed:', loginErr);
                }

                // Redirect based on user type
                var signedUpType = (type || 'farmer').toLowerCase();
                var dashboardPath = signedUpType === 'merchant'
                    ? 'dashboard/merchant/index.html'
                    : 'dashboard/farmer/index.html';

                // Redirect
                setTimeout(function () {
                    window.location.href = dashboardPath;
                }, 1000);
            } else {
                showAlert(data.message || 'Registration failed. Please try again.', 'error');
                setLoading(false);
            }
        } catch (err) {
            showAlert('Network error — please check your connection and try again.', 'error');
            setLoading(false);
            console.error('Signup error:', err);
        }
    });
})();
