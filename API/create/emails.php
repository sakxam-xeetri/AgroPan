<?php
/**
 * AgroPan API — Create Email Subscriber
 * 
 * Registers a new email for receiving sensor data and alert notifications.
 * subscribed_at is set to the current Unix timestamp.
 * is_active defaults to 1 (active).
 *
 * Method : POST
 * URL    : /API/create/emails.php
 *
 * Request body (JSON):
 * {
 *   "email" : "farmer.ram@example.com",
 *   "name"  : "Ram Thapa"
 * }
 */

require_once __DIR__ . '/../database.php';

// ── Read input ──
$input = getJsonInput();

$required = ['email', 'name'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        sendResponse(400, false, "Missing required field: $field");
    }
}

// ── Validate email format ──
if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    sendResponse(400, false, 'Invalid email address format');
}

// ── Check for duplicate email ──
try {
    $stmt = $pdo->prepare("SELECT email_id FROM emails WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $input['email']]);

    if ($stmt->fetch()) {
        sendResponse(400, false, 'This email is already subscribed');
    }
} catch (PDOException $e) {
    sendResponse(500, false, 'Database error: ' . $e->getMessage());
}

// ── Insert subscriber ──
try {
    $stmt = $pdo->prepare(
        "INSERT INTO emails (email, name, subscribed_at, is_active)
         VALUES (:email, :name, :subscribed_at, 1)"
    );

    $stmt->execute([
        ':email' => $input['email'],
        ':name' => $input['name'],
        ':subscribed_at' => (string) time()
    ]);

    $emailId = $pdo->lastInsertId();

    sendResponse(201, true, 'Email subscriber registered successfully', ['email_id' => (int) $emailId]);

} catch (PDOException $e) {
    sendResponse(500, false, 'Failed to register subscriber: ' . $e->getMessage());
}
