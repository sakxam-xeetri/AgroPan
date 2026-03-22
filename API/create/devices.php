<?php
/**
 * AgroPan API — Create Device
 * 
 * Registers a new IoT field device (ESP32-S3 sensor node).
 * last_ping is set to the current Unix timestamp.
 *
 * Method : POST
 * URL    : /API/create/devices.php
 *
 * Request body (JSON):
 * {
 *   "name"     : "Field-Sensor-A1",
 *   "location" : "Chitwan East Plot",
 *   "owned_by" : "ram_thapa"
 * }
 */

require_once __DIR__ . '/../database.php';

// ── Read input ──
$input = getJsonInput();

$required = ['name', 'location', 'owned_by'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        sendResponse(400, false, "Missing required field: $field");
    }
}

// ── Insert device ──
try {
    $stmt = $pdo->prepare(
        "INSERT INTO devices (name, location, last_ping, owned_by)
         VALUES (:name, :location, :last_ping, :owned_by)"
    );

    $stmt->execute([
        ':name' => $input['name'],
        ':location' => $input['location'],
        ':last_ping' => (string) time(),
        ':owned_by' => $input['owned_by']
    ]);

    $deviceId = $pdo->lastInsertId();

    sendResponse(201, true, 'Device registered successfully', ['device_id' => (int) $deviceId]);

} catch (PDOException $e) {
    sendResponse(500, false, 'Failed to register device: ' . $e->getMessage());
}
