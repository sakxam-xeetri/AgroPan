<?php
/**
 * AgroPan API — Create Data
 * 
 * Inserts a new sensor reading from an IoT device.
 * After a successful insert, emails all active subscribers.
 * Timestamp is a Unix timestamp (integer stored as text).
 *
 * Method : POST
 * URL    : /API/create/data.php
 *
 * Request body (JSON):
 * {
 *   "temperature" : "28.5",
 *   "moisture"    : "65",
 *   "humidity"    : "72",
 *   "gases"       : "12",
 *   "nitrogen"    : "40",
 *   "device"      : "Field-Sensor-A1"
 * }
 */

require_once __DIR__ . '/../database.php';

// ── Read input ──
$input = getJsonInput();

// ── Map hardware field names to DB column names ──
// Hardware sends: device_id, soil_moisture, gas_level
// DB expects:    device,    moisture,      gases
if (isset($input['device_id']) && !isset($input['device'])) {
    $input['device'] = $input['device_id'];
}
if (isset($input['soil_moisture']) && !isset($input['moisture'])) {
    $input['moisture'] = $input['soil_moisture'];
}
if (isset($input['gas_level']) && !isset($input['gases'])) {
    $input['gases'] = $input['gas_level'];
}

// nitrogen is optional — hardware may not send it
if (!isset($input['nitrogen'])) {
    $input['nitrogen'] = '0';
}

$required = ['temperature', 'moisture', 'humidity', 'gases', 'device'];
foreach ($required as $field) {
    if (!isset($input[$field]) && $input[$field] !== 0 && $input[$field] !== '0') {
        sendResponse(400, false, "Missing required field: $field");
    }
}

// ── Insert sensor data ──
try {
    $timestamp = (string) time();

    $stmt = $pdo->prepare(
        "INSERT INTO data (timestamp, temperature, moisture, humidity, gases, nitrogen, device)
         VALUES (:timestamp, :temperature, :moisture, :humidity, :gases, :nitrogen, :device)"
    );

    $stmt->execute([
        ':timestamp' => $timestamp,
        ':temperature' => $input['temperature'],
        ':moisture' => $input['moisture'],
        ':humidity' => $input['humidity'],
        ':gases' => $input['gases'],
        ':nitrogen' => $input['nitrogen'],
        ':device' => $input['device']
    ]);

    $dataId = $pdo->lastInsertId();

    // ── Notify subscribers ──
    notifyAllSubscribers(
        $pdo,
        'AgroPan — New Sensor Data Received',
        "New sensor data has been recorded:\n\n"
        . "Device      : " . $input['device'] . "\n"
        . "Temperature : " . $input['temperature'] . " °C\n"
        . "Moisture    : " . $input['moisture'] . " %\n"
        . "Humidity    : " . $input['humidity'] . " %\n"
        . "Gases       : " . $input['gases'] . " ppm\n"
        . "Nitrogen    : " . $input['nitrogen'] . " mg/kg\n"
        . "Timestamp   : " . $timestamp
    );

    sendResponse(201, true, 'Sensor data recorded and subscribers notified', ['data_id' => (int) $dataId]);

} catch (PDOException $e) {
    sendResponse(500, false, 'Failed to record sensor data: ' . $e->getMessage());
}
