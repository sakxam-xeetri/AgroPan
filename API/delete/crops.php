<?php
/**
 * AgroPan API — Delete Crop
 * 
 * Removes a crop listing from the marketplace.
 *
 * Method : POST
 * URL    : /API/delete/crops.php
 *
 * Request body (JSON):
 * {
 *   "crop_id" : 1
 * }
 */

require_once __DIR__ . '/../database.php';

// ── Read input ──
$input = getJsonInput();

if (empty($input['crop_id'])) {
    sendResponse(400, false, 'Missing required field: crop_id');
}

try {
    // ── Verify crop exists ──
    $stmt = $pdo->prepare("SELECT crop_id FROM crops WHERE crop_id = :crop_id LIMIT 1");
    $stmt->execute([':crop_id' => $input['crop_id']]);

    if (!$stmt->fetch()) {
        sendResponse(404, false, 'Crop not found');
    }

    // ── Delete crop ──
    $stmt = $pdo->prepare("DELETE FROM crops WHERE crop_id = :crop_id");
    $stmt->execute([':crop_id' => $input['crop_id']]);

    sendResponse(200, true, 'Crop deleted successfully');

} catch (PDOException $e) {
    sendResponse(500, false, 'Database error: ' . $e->getMessage());
}
