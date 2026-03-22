<?php
/**
 * AgroPan API — Create Warning
 * 
 * Creates a new emergency alert / warning issued by an admin.
 * After a successful insert, emails all active subscribers.
 * All timestamps are Unix timestamps.
 *
 * Method : POST
 * URL    : /API/create/warnings.php
 *
 * Request body (JSON):
 * {
 *   "title"      : "Flood Warning",
 *   "details"    : "Heavy rainfall expected in Terai region for the next 48 hours.",
 *   "valid_till" : "1739340000"
 * }
 */

require_once __DIR__ . '/../database.php';

// ── Read input ──
$input = getJsonInput();

$required = ['title', 'details', 'valid_till'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        sendResponse(400, false, "Missing required field: $field");
    }
}

// ── Insert warning ──
try {
    $timestamp = (string) time();

    $stmt = $pdo->prepare(
        "INSERT INTO warnings (title, details, timestamp, valid_till)
         VALUES (:title, :details, :timestamp, :valid_till)"
    );

    $stmt->execute([
        ':title' => $input['title'],
        ':details' => $input['details'],
        ':timestamp' => $timestamp,
        ':valid_till' => $input['valid_till']
    ]);

    $warningId = $pdo->lastInsertId();

    // ── Notify subscribers ──
    notifyAllSubscribers(
        $pdo,
        'AgroPan Emergency Alert — ' . $input['title'],
        "An emergency alert has been issued:\n\n"
        . "Title      : " . $input['title'] . "\n"
        . "Details    : " . $input['details'] . "\n"
        . "Issued at  : " . $timestamp . "\n"
        . "Valid till : " . $input['valid_till']
    );

    sendResponse(201, true, 'Emergency alert created and subscribers notified', ['warning_id' => (int) $warningId]);

} catch (PDOException $e) {
    sendResponse(500, false, 'Failed to create warning: ' . $e->getMessage());
}
