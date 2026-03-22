<?php
/**
 * AgroPan API — Delete Warning
 * 
 * Removes an emergency alert from the database.
 *
 * Method : POST
 * URL    : /API/delete/warnings.php
 *
 * Request body (JSON):
 * {
 *   "warning_id" : 1
 * }
 */

require_once __DIR__ . '/../database.php';

// ── Read input ──
$input = getJsonInput();

if (empty($input['warning_id'])) {
    sendResponse(400, false, 'Missing required field: warning_id');
}

try {
    // ── Verify warning exists ──
    $stmt = $pdo->prepare("SELECT warning_id FROM warnings WHERE warning_id = :warning_id LIMIT 1");
    $stmt->execute([':warning_id' => $input['warning_id']]);

    if (!$stmt->fetch()) {
        sendResponse(404, false, 'Warning not found');
    }

    // ── Delete warning ──
    $stmt = $pdo->prepare("DELETE FROM warnings WHERE warning_id = :warning_id");
    $stmt->execute([':warning_id' => $input['warning_id']]);

    sendResponse(200, true, 'Warning deleted successfully');

} catch (PDOException $e) {
    sendResponse(500, false, 'Database error: ' . $e->getMessage());
}
