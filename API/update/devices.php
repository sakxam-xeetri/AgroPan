<?php
/**
 * AgroPan API — Update Device
 *
 * Updates an existing device's details. device_id is required.
 * last_ping is auto-set to the current Unix timestamp on every update.
 *
 * Method : POST
 * URL    : /API/update/devices.php
 *
 * Request body (JSON):
 * {
 *   "device_id" : 1,
 *   "location"  : "Chitwan West Plot"
 * }
 */

require_once __DIR__ . '/../database.php';

$input = getJsonInput();

if (empty($input['device_id'])) {
    sendResponse(400, false, 'Missing required field: device_id');
}

// ── Updatable fields ──
$allowed = ['name', 'location', 'owned_by'];
$setClauses = [];
$params = [':id' => $input['device_id']];

foreach ($allowed as $field) {
    if (isset($input[$field]) && $input[$field] !== '') {
        $setClauses[] = "$field = :$field";
        $params[":$field"] = $input[$field];
    }
}

// Always update last_ping
$setClauses[] = "last_ping = :last_ping";
$params[':last_ping'] = (string) time();

if (count($setClauses) <= 1) {
    sendResponse(400, false, 'No fields provided to update');
}

try {
    $check = $pdo->prepare("SELECT device_id FROM devices WHERE device_id = :id LIMIT 1");
    $check->execute([':id' => $input['device_id']]);
    if (!$check->fetch()) {
        sendResponse(404, false, 'Device not found');
    }

    $sql = "UPDATE devices SET " . implode(', ', $setClauses) . " WHERE device_id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    sendResponse(200, true, 'Device updated successfully');

} catch (PDOException $e) {
    sendResponse(500, false, 'Failed to update device: ' . $e->getMessage());
}
