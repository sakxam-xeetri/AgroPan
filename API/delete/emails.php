<?php
/**
 * AgroPan API — Delete Email Subscriber
 * 
 * Permanently removes an email subscriber from the database.
 * For soft-delete (unsubscribe), use update/emails.php with is_active=0 instead.
 *
 * Method : POST
 * URL    : /API/delete/emails.php
 *
 * Request body (JSON):
 * {
 *   "email_id" : 1
 * }
 */

require_once __DIR__ . '/../database.php';

// ── Read input ──
$input = getJsonInput();

if (empty($input['email_id'])) {
    sendResponse(400, false, 'Missing required field: email_id');
}

try {
    // ── Verify subscriber exists ──
    $stmt = $pdo->prepare("SELECT email_id FROM emails WHERE email_id = :email_id LIMIT 1");
    $stmt->execute([':email_id' => $input['email_id']]);

    if (!$stmt->fetch()) {
        sendResponse(404, false, 'Subscriber not found');
    }

    // ── Delete subscriber ──
    $stmt = $pdo->prepare("DELETE FROM emails WHERE email_id = :email_id");
    $stmt->execute([':email_id' => $input['email_id']]);

    sendResponse(200, true, 'Subscriber deleted successfully');

} catch (PDOException $e) {
    sendResponse(500, false, 'Database error: ' . $e->getMessage());
}
