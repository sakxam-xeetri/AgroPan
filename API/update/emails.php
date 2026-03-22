<?php
/**
 * AgroPan API — Update Email Subscriber
 *
 * Updates a subscriber's details or toggles active status.
 * email_id is required. Use is_active=0 to unsubscribe, is_active=1 to resubscribe.
 *
 * Method : POST
 * URL    : /API/update/emails.php
 *
 * Request body (JSON):
 * {
 *   "email_id"  : 1,
 *   "is_active" : 0
 * }
 */

require_once __DIR__ . '/../database.php';

$input = getJsonInput();

if (empty($input['email_id'])) {
    sendResponse(400, false, 'Missing required field: email_id');
}

// ── Updatable fields ──
$allowed = ['email', 'name', 'is_active'];
$setClauses = [];
$params = [':id' => $input['email_id']];

foreach ($allowed as $field) {
    if (isset($input[$field]) && $input[$field] !== '') {
        $setClauses[] = "$field = :$field";
        $params[":$field"] = $input[$field];
    }
}

// Handle is_active = 0 explicitly (empty() treats 0 as empty)
if (isset($input['is_active']) && $input['is_active'] === 0) {
    $setClauses[] = "is_active = :is_active";
    $params[':is_active'] = 0;
}

if (empty($setClauses)) {
    sendResponse(400, false, 'No fields provided to update');
}

// ── Validate email format if provided ──
if (!empty($input['email']) && !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    sendResponse(400, false, 'Invalid email address format');
}

try {
    $check = $pdo->prepare("SELECT email_id FROM emails WHERE email_id = :id LIMIT 1");
    $check->execute([':id' => $input['email_id']]);
    if (!$check->fetch()) {
        sendResponse(404, false, 'Subscriber not found');
    }

    $sql = "UPDATE emails SET " . implode(', ', $setClauses) . " WHERE email_id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    sendResponse(200, true, 'Subscriber updated successfully');

} catch (PDOException $e) {
    sendResponse(500, false, 'Failed to update subscriber: ' . $e->getMessage());
}
