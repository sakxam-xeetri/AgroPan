<?php
/**
 * AgroPan API — Delete User
 * 
 * Permanently removes a user account from the database.
 *
 * Method : POST
 * URL    : /API/delete/users.php
 *
 * Request body (JSON):
 * {
 *   "user_id" : 1
 * }
 */

require_once __DIR__ . '/../database.php';

// ── Read input ──
$input = getJsonInput();

if (empty($input['user_id'])) {
    sendResponse(400, false, 'Missing required field: user_id');
}

try {
    // ── Verify user exists ──
    $stmt = $pdo->prepare("SELECT user_id FROM users WHERE user_id = :user_id LIMIT 1");
    $stmt->execute([':user_id' => $input['user_id']]);

    if (!$stmt->fetch()) {
        sendResponse(404, false, 'User not found');
    }

    // ── Delete user ──
    $stmt = $pdo->prepare("DELETE FROM users WHERE user_id = :user_id");
    $stmt->execute([':user_id' => $input['user_id']]);

    sendResponse(200, true, 'User deleted successfully');

} catch (PDOException $e) {
    sendResponse(500, false, 'Database error: ' . $e->getMessage());
}
