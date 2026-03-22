<?php
/**
 * AgroPan API — Read Devices
 *
 * Fetch a single device by device_id, filter by owner, or fetch all.
 *
 * Method : POST
 * URL    : /API/read/devices.php
 *
 * Request body (single):   { "device_id": 1 }
 * Request body (by owner): { "owned_by": "ram_thapa" }
 * Request body (all):      {} or empty
 */

require_once __DIR__ . '/../database.php';

$input = getJsonInput();

try {
    if (!empty($input['device_id'])) {
        // ── Fetch single device ──
        $stmt = $pdo->prepare("SELECT * FROM devices WHERE device_id = :id LIMIT 1");
        $stmt->execute([':id' => $input['device_id']]);
        $device = $stmt->fetch();

        if (!$device) {
            sendResponse(404, false, 'Device not found');
        }

        sendResponse(200, true, 'Device fetched successfully', $device);

    } elseif (!empty($input['owned_by'])) {
        // ── Filter by owner ──
        $stmt = $pdo->prepare("SELECT * FROM devices WHERE owned_by = :owner ORDER BY device_id DESC");
        $stmt->execute([':owner' => $input['owned_by']]);
        $devices = $stmt->fetchAll();

        sendResponse(200, true, 'Devices fetched successfully', $devices);

    } else {
        // ── Fetch all devices ──
        $stmt = $pdo->query("SELECT * FROM devices ORDER BY device_id DESC");
        $devices = $stmt->fetchAll();

        sendResponse(200, true, 'Devices fetched successfully', $devices);
    }
} catch (PDOException $e) {
    sendResponse(500, false, 'Database error: ' . $e->getMessage());
}
