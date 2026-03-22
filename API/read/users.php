<?php
/**
 * AgroPan API — Read Users
 *
 * Fetch a single user by user_id, or all users.
 * Password field is excluded from responses for security.
 *
 * Method : POST
 * URL    : /API/read/users.php
 *
 * Request body (single):  { "user_id": 1 }
 * Request body (all):     {} or empty
 */

require_once __DIR__ . '/../database.php';

$input = getJsonInput();

try {
    if (!empty($input['user_id'])) {
        // ── Fetch single user ──
        $stmt = $pdo->prepare(
            "SELECT user_id, username, email, phone, name, location, type, last_login
             FROM users WHERE user_id = :id LIMIT 1"
        );
        $stmt->execute([':id' => $input['user_id']]);
        $user = $stmt->fetch();

        if (!$user) {
            sendResponse(404, false, 'User not found');
        }

        sendResponse(200, true, 'User fetched successfully', $user);

    } else {
        // ── Fetch all users ──
        $stmt = $pdo->query(
            "SELECT user_id, username, email, phone, name, location, type, last_login
             FROM users ORDER BY user_id DESC"
        );
        $users = $stmt->fetchAll();

        sendResponse(200, true, 'Users fetched successfully', $users);
    }
} catch (PDOException $e) {
    sendResponse(500, false, 'Database error: ' . $e->getMessage());
}
