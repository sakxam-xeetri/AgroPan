<?php
/**
 * AgroPan API — Update Data (Sensor Reading)
 *
 * Corrects an existing sensor reading. data_id is required.
 * Used for recalibration adjustments or corrections.
 *
 * Method : POST
 * URL    : /API/update/data.php
 *
 * Request body (JSON):
 * {
 *   "data_id"     : 1,
 *   "temperature" : "29.1",
 *   "moisture"    : "64.0"
 * }
 */

require_once __DIR__ . '/../database.php';

$input = getJsonInput();

if (empty($input['data_id'])) {
    sendResponse(400, false, 'Missing required field: data_id');
}

// ── Updatable fields ──
$allowed = ['timestamp', 'temperature', 'moisture', 'humidity', 'gases', 'nitrogen', 'device'];
$setClauses = [];
$params = [':id' => $input['data_id']];

foreach ($allowed as $field) {
    if (isset($input[$field]) && $input[$field] !== '') {
        $setClauses[] = "$field = :$field";
        $params[":$field"] = $input[$field];
    }
}

if (empty($setClauses)) {
    sendResponse(400, false, 'No fields provided to update');
}

try {
    $check = $pdo->prepare("SELECT data_id FROM data WHERE data_id = :id LIMIT 1");
    $check->execute([':id' => $input['data_id']]);
    if (!$check->fetch()) {
        sendResponse(404, false, 'Sensor reading not found');
    }

    $sql = "UPDATE data SET " . implode(', ', $setClauses) . " WHERE data_id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    sendResponse(200, true, 'Sensor reading updated successfully');

} catch (PDOException $e) {
    sendResponse(500, false, 'Failed to update sensor reading: ' . $e->getMessage());
}
