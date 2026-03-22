<?php
/**
 * AgroPan API — Read Crops
 *
 * Fetch a single crop by crop_id, filter by type, or fetch all.
 *
 * Method : POST
 * URL    : /API/read/crops.php
 *
 * Request body (single):  { "crop_id": 1 }
 * Request body (by type): { "type": "grain" }
 * Request body (all):     {} or empty
 */

require_once __DIR__ . '/../database.php';

$input = getJsonInput();

try {
    if (!empty($input['crop_id'])) {
        // ── Fetch single crop ──
        $stmt = $pdo->prepare("SELECT * FROM crops WHERE crop_id = :id LIMIT 1");
        $stmt->execute([':id' => $input['crop_id']]);
        $crop = $stmt->fetch();

        if (!$crop) {
            sendResponse(404, false, 'Crop not found');
        }

        sendResponse(200, true, 'Crop fetched successfully', $crop);

    } elseif (!empty($input['type'])) {
        // ── Filter by type ──
        $stmt = $pdo->prepare("SELECT * FROM crops WHERE type = :type ORDER BY crop_id DESC");
        $stmt->execute([':type' => $input['type']]);
        $crops = $stmt->fetchAll();

        sendResponse(200, true, 'Crops fetched successfully', $crops);

    } else {
        // ── Fetch all crops ──
        $stmt = $pdo->query("SELECT * FROM crops ORDER BY crop_id DESC");
        $crops = $stmt->fetchAll();

        sendResponse(200, true, 'Crops fetched successfully', $crops);
    }
} catch (PDOException $e) {
    sendResponse(500, false, 'Database error: ' . $e->getMessage());
}
