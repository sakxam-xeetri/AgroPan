<?php
/**
 * AgroPan — Authentication & Session Management
 * 
 * Handles user login, logout, and session status checks.
 * Uses PHP native sessions with secure cookie settings.
 * 
 * This file serves TWO purposes:
 * 
 * 1. INCLUDE MODE — Other pages include this file to access session helpers:
 *      require_once __DIR__ . '/API/auth.php';
 *      // or from inside API/:
 *      require_once __DIR__ . '/auth.php';
 *    This gives you: startSecureSession(), isLoggedIn(), getLoggedInUser(),
 *    requireLogin(), and the $pdo connection.
 * 
 * 2. ENDPOINT MODE — Call directly via POST for login/logout/status:
 *      POST /API/auth.php  { "action": "login",  "username": "...", "password": "..." }
 *      POST /API/auth.php  { "action": "logout" }
 *      POST /API/auth.php  { "action": "status" }
 * 
 * Session data stored:
 *   $_SESSION['user_id']   — int
 *   $_SESSION['username']  — string
 *   $_SESSION['name']      — string
 *   $_SESSION['email']     — string
 *   $_SESSION['phone']     — string
 *   $_SESSION['type']      — "farmer" or "merchant"
 *   $_SESSION['location']  — string
 *   $_SESSION['logged_in'] — true
 */

// ── Database connection (reuse database.php) ──
require_once __DIR__ . '/database.php';

// ── Secure Session Starter ──
/**
 * Starts a PHP session with secure cookie settings.
 * Safe to call multiple times — will not restart an active session.
 */
function startSecureSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return; // Already started
    }

    // Secure cookie params
    session_set_cookie_params([
        'lifetime' => 86400,      // 24 hours
        'path' => '/',
        'domain' => '',         // Current domain
        'secure' => false,      // Set true in production with HTTPS
        'httponly' => true,       // JS cannot access the session cookie
        'samesite' => 'Lax',      // CSRF protection
    ]);

    session_name('AGROPAN_SESSION');
    session_start();
}

// ── Helper: Check if user is logged in ──
/**
 * Returns true if a user is currently authenticated.
 *
 * Usage from any page:
 *   require_once __DIR__ . '/API/auth.php';
 *   startSecureSession();
 *   if (isLoggedIn()) { ... }
 *
 * @return bool
 */
function isLoggedIn(): bool
{
    return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true
        && isset($_SESSION['user_id']);
}

// ── Helper: Get logged-in user data ──
/**
 * Returns an array of the currently logged-in user's session data.
 * Returns null if not logged in.
 *
 * @return array|null
 */
function getLoggedInUser(): ?array
{
    if (!isLoggedIn()) {
        return null;
    }

    return [
        'user_id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'name' => $_SESSION['name'],
        'email' => $_SESSION['email'],
        'phone' => $_SESSION['phone'],
        'type' => $_SESSION['type'],
        'location' => $_SESSION['location'],
    ];
}

// ── Helper: Require login (redirect/block) ──
/**
 * If the user is NOT logged in, sends a 401 JSON response and exits.
 * Use this at the top of any API endpoint or page that requires auth.
 *
 * Usage:
 *   require_once __DIR__ . '/auth.php';
 *   startSecureSession();
 *   requireLogin();
 *   // ... only authenticated users reach here
 */
function requireLogin(): void
{
    if (!isLoggedIn()) {
        sendResponse(401, false, 'Authentication required. Please log in.');
    }
}

// ── Start session for all modes ──
startSecureSession();


// ═══════════════════════════════════════════════════════════
//  ENDPOINT MODE — Only runs when called directly via POST
// ═══════════════════════════════════════════════════════════

// If this file is being included by another script, stop here.
// Only process actions when auth.php is the entry point.
if (basename($_SERVER['SCRIPT_FILENAME']) !== 'auth.php') {
    return; // Included mode — helpers are available, no action processing
}

// ── Must be POST ──
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(405, false, 'Method not allowed. Use POST.');
}

$input = getJsonInput();

if (empty($input['action'])) {
    sendResponse(400, false, 'Missing required field: action (login|logout|status)');
}

$action = strtolower(trim($input['action']));


// ─────────────────────────────────────────────────
//  ACTION: login
// ─────────────────────────────────────────────────
if ($action === 'login') {

    // Validate required fields
    if (empty($input['username'])) {
        sendResponse(400, false, 'Missing required field: username');
    }
    if (empty($input['password'])) {
        sendResponse(400, false, 'Missing required field: password');
    }

    $username = trim($input['username']);
    $password = $input['password'];

    try {
        // Look up user by username
        $stmt = $pdo->prepare(
            "SELECT user_id, username, email, phone, name, location, type, password
             FROM users WHERE username = :username LIMIT 1"
        );
        $stmt->execute([':username' => $username]);
        $user = $stmt->fetch();

        if (!$user) {
            sendResponse(401, false, 'Invalid username or password');
        }

        // Verify password (bcrypt)
        if (!password_verify($password, $user['password'])) {
            sendResponse(401, false, 'Invalid username or password');
        }

        // ── Regenerate session ID to prevent session fixation ──
        session_regenerate_id(true);

        // ── Store user data in session ──
        $_SESSION['user_id'] = (int) $user['user_id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['name'] = $user['name'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['phone'] = $user['phone'];
        $_SESSION['type'] = $user['type'];
        $_SESSION['location'] = $user['location'];
        $_SESSION['logged_in'] = true;

        // ── Update last_login timestamp ──
        $stmt = $pdo->prepare("UPDATE users SET last_login = :ts WHERE user_id = :uid");
        $stmt->execute([
            ':ts' => (string) time(),
            ':uid' => $user['user_id']
        ]);

        sendResponse(200, true, 'Login successful', [
            'user_id' => (int) $user['user_id'],
            'username' => $user['username'],
            'name' => $user['name'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'type' => $user['type'],
            'location' => $user['location'],
        ]);

    } catch (PDOException $e) {
        sendResponse(500, false, 'Database error: ' . $e->getMessage());
    }
}


// ─────────────────────────────────────────────────
//  ACTION: logout
// ─────────────────────────────────────────────────
if ($action === 'logout') {

    // Clear all session data
    $_SESSION = [];

    // Delete the session cookie
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }

    // Destroy the session
    session_destroy();

    sendResponse(200, true, 'Logged out successfully');
}


// ─────────────────────────────────────────────────
//  ACTION: status
// ─────────────────────────────────────────────────
if ($action === 'status') {

    if (isLoggedIn()) {
        sendResponse(200, true, 'User is logged in', getLoggedInUser());
    } else {
        sendResponse(200, false, 'Not logged in');
    }
}


// ─────────────────────────────────────────────────
//  Unknown action
// ─────────────────────────────────────────────────
sendResponse(400, false, 'Unknown action: ' . $action . '. Use login, logout, or status.');
