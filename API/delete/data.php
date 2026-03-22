<?php
/**
 * AgroPan API — Delete Sensor Data
 * 
 * Removes a sensor reading record from the database.
 *
 * Method : POST
 * URL    : /API/delete/data.php
 *
 * Request body (JSON):
 * {
 *   "data_id" : 1
 * }
 */

require_once __DIR__ . '/../database.php';

// ── Read input ──
$input = getJsonInput();

if (empty($input['data_id'])) {
    sendResponse(400, false, 'Missing required field: data_id');
}

try {
    // ── Verify record exists ──
    $stmt = $pdo->prepare("SELECT data_id FROM data WHERE data_id = :data_id LIMIT 1");
    $stmt->execute([':data_id' => $input['data_id']]);

    if (!$stmt->fetch()) {
        sendResponse(404, false, 'Sensor data record not found');
    }

    // ── Delete record ──
    $stmt = $pdo->prepare("DELETE FROM data WHERE data_id = :data_id");
    $stmt->execute([':data_id' => $input['data_id']]);

    sendResponse(200, true, 'Sensor data deleted successfully');

} catch (PDOException $e) {
    sendResponse(500, false, 'Database error: ' . $e->getMessage());
}
