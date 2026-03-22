<?php
/**
 * AgroPan API — Read Email Subscribers
 *
 * Fetch a single subscriber by email_id, or all active subscribers.
 * Pass { "all": true } to include inactive (unsubscribed) emails too.
 *
 * Method : POST
 * URL    : /API/read/emails.php
 *
 * Request body (single):      { "email_id": 1 }
 * Request body (active only): {} or empty
 * Request body (include all): { "all": true }
 */

require_once __DIR__ . '/../database.php';

$input = getJsonInput();

try {
    if (!empty($input['email_id'])) {
        // ── Fetch single subscriber ──
        $stmt = $pdo->prepare("SELECT * FROM emails WHERE email_id = :id LIMIT 1");
        $stmt->execute([':id' => $input['email_id']]);
        $subscriber = $stmt->fetch();

        if (!$subscriber) {
            sendResponse(404, false, 'Subscriber not found');
        }

        sendResponse(200, true, 'Subscriber fetched successfully', $subscriber);

    } elseif (!empty($input['all'])) {
        // ── Fetch all subscribers (including inactive) ──
        $stmt = $pdo->query("SELECT * FROM emails ORDER BY email_id DESC");
        $subscribers = $stmt->fetchAll();

        sendResponse(200, true, 'All subscribers fetched successfully', $subscribers);

    } else {
        // ── Fetch only active subscribers ──
        $stmt = $pdo->query("SELECT * FROM emails WHERE is_active = 1 ORDER BY email_id DESC");
        $subscribers = $stmt->fetchAll();

        sendResponse(200, true, 'Active subscribers fetched successfully', $subscribers);
    }
} catch (PDOException $e) {
    sendResponse(500, false, 'Database error: ' . $e->getMessage());
}
