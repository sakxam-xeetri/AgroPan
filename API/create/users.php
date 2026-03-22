<?php
/**
 * AgroPan API — Create User
 * 
 * Registers a new farmer or merchant account.
 * Passwords are hashed with bcrypt before storage.
 * last_login is set to the current Unix timestamp.
 *
 * Method : POST
 * URL    : /API/create/users.php
 *
 * Request body (JSON):
 * {
 *   "username" : "ram_thapa",
 *   "email"    : "ram@example.com",
 *   "phone"    : "9801234567",
 *   "name"     : "Ram Thapa",
 *   "location" : "Chitwan",
 *   "type"     : "farmer",
 *   "password" : "securePassword123"
 * }
 */

require_once __DIR__ . '/../database.php';

// ── Read input ──
$input = getJsonInput();

$required = ['username', 'email', 'phone', 'name', 'location', 'type', 'password'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        sendResponse(400, false, "Missing required field: $field");
    }
}

// ── Validate type ──
$validTypes = ['farmer', 'merchant', 'admin'];
if (!in_array($input['type'], $validTypes)) {
    sendResponse(400, false, "Invalid type. Must be 'farmer', 'merchant', or 'admin'");
}

// ── Check for duplicate username or email ──
try {
    $stmt = $pdo->prepare("SELECT user_id FROM users WHERE username = :username OR email = :email LIMIT 1");
    $stmt->execute([
        ':username' => $input['username'],
        ':email' => $input['email']
    ]);

    if ($stmt->fetch()) {
        sendResponse(400, false, 'Username or email already exists');
    }
} catch (PDOException $e) {
    sendResponse(500, false, 'Database error: ' . $e->getMessage());
}

// ── Hash password ──
$hashedPassword = password_hash($input['password'], PASSWORD_BCRYPT);

// ── Insert user ──
try {
    $stmt = $pdo->prepare(
        "INSERT INTO users (username, email, phone, name, location, type, last_login, password)
         VALUES (:username, :email, :phone, :name, :location, :type, :last_login, :password)"
    );

    $stmt->execute([
        ':username' => $input['username'],
        ':email' => $input['email'],
        ':phone' => $input['phone'],
        ':name' => $input['name'],
        ':location' => $input['location'],
        ':type' => $input['type'],
        ':last_login' => (string) time(),
        ':password' => $hashedPassword
    ]);

    $userId = $pdo->lastInsertId();

    sendResponse(201, true, 'User registered successfully', ['user_id' => (int) $userId]);

} catch (PDOException $e) {
    sendResponse(500, false, 'Failed to create user: ' . $e->getMessage());
}
