<?php
/**
 * AgroPan API — Update User
 *
 * Updates an existing user's details. user_id is required.
 * If password is provided, it is re-hashed with bcrypt.
 * last_login is auto-set to current Unix timestamp on every update.
 *
 * Method : POST
 * URL    : /API/update/users.php
 *
 * Request body (JSON):
 * {
 *   "user_id"  : 1,
 *   "name"     : "Ram Kumar Thapa",
 *   "location" : "Kathmandu"
 * }
 */

require_once __DIR__ . '/../database.php';

$input = getJsonInput();

if (empty($input['user_id'])) {
    sendResponse(400, false, 'Missing required field: user_id');
}

// ── Updatable fields ──
$allowed = ['username', 'email', 'phone', 'name', 'location', 'type', 'password'];
$setClauses = [];
$params = [':id' => $input['user_id']];

foreach ($allowed as $field) {
    if (isset($input[$field]) && $input[$field] !== '') {
        if ($field === 'password') {
            $setClauses[] = "password = :password";
            $params[':password'] = password_hash($input['password'], PASSWORD_BCRYPT);
        } else {
            $setClauses[] = "$field = :$field";
            $params[":$field"] = $input[$field];
        }
    }
}

// Always update last_login
$setClauses[] = "last_login = :last_login";
$params[':last_login'] = (string) time();

if (count($setClauses) <= 1) {
    // Only last_login — no actual user data to update
    sendResponse(400, false, 'No fields provided to update');
}

// ── Validate type if provided ──
if (!empty($input['type']) && !in_array($input['type'], ['farmer', 'merchant', 'admin'])) {
    sendResponse(400, false, "Invalid type. Must be 'farmer', 'merchant', or 'admin'");
}

try {
    // ── Verify user exists ──
    $check = $pdo->prepare("SELECT user_id FROM users WHERE user_id = :id LIMIT 1");
    $check->execute([':id' => $input['user_id']]);
    if (!$check->fetch()) {
        sendResponse(404, false, 'User not found');
    }

    // ── Execute update ──
    $sql = "UPDATE users SET " . implode(', ', $setClauses) . " WHERE user_id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    sendResponse(200, true, 'User updated successfully');

} catch (PDOException $e) {
    sendResponse(500, false, 'Failed to update user: ' . $e->getMessage());
}
