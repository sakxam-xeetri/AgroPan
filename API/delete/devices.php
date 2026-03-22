<?php
/**
 * AgroPan API — Delete Device
 * 
 * Unregisters an IoT device from the platform.
 *
 * Method : POST
 * URL    : /API/delete/devices.php
 *
 * Request body (JSON):
 * {
 *   "device_id" : 1
 * }
 */

require_once __DIR__ . '/../database.php';

// ── Read input ──
$input = getJsonInput();

if (empty($input['device_id'])) {
    sendResponse(400, false, 'Missing required field: device_id');
}

try {
    // ── Verify device exists ──
    $stmt = $pdo->prepare("SELECT device_id FROM devices WHERE device_id = :device_id LIMIT 1");
    $stmt->execute([':device_id' => $input['device_id']]);

    if (!$stmt->fetch()) {
        sendResponse(404, false, 'Device not found');
    }

    // ── Delete device ──
    $stmt = $pdo->prepare("DELETE FROM devices WHERE device_id = :device_id");
    $stmt->execute([':device_id' => $input['device_id']]);

    sendResponse(200, true, 'Device deleted successfully');

} catch (PDOException $e) {
    sendResponse(500, false, 'Database error: ' . $e->getMessage());
}
