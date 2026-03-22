<?php
/**
 * AgroPan API — Read Data (Sensor Readings)
 *
 * Fetch a single reading by data_id, filter by device name, or fetch all.
 * Results are ordered by timestamp descending (newest first).
 *
 * Method : POST
 * URL    : /API/read/data.php
 *
 * Request body (single):    { "data_id": 1 }
 * Request body (by device): { "device": "Field-Sensor-A1" }
 * Request body (all):       {} or empty
 */

require_once __DIR__ . '/../database.php';

$input = getJsonInput();

try {
    if (!empty($input['data_id'])) {
        // ── Fetch single reading ──
        $stmt = $pdo->prepare("SELECT * FROM data WHERE data_id = :id LIMIT 1");
        $stmt->execute([':id' => $input['data_id']]);
        $reading = $stmt->fetch();

        if (!$reading) {
            sendResponse(404, false, 'Sensor reading not found');
        }

        sendResponse(200, true, 'Sensor reading fetched successfully', $reading);

    } elseif (!empty($input['device'])) {
        // ── Filter by device ──
        $stmt = $pdo->prepare("SELECT * FROM data WHERE device = :device ORDER BY timestamp DESC");
        $stmt->execute([':device' => $input['device']]);
        $readings = $stmt->fetchAll();

        sendResponse(200, true, 'Sensor readings fetched successfully', $readings);

    } else {
        // ── Fetch all readings ──
        $stmt = $pdo->query("SELECT * FROM data ORDER BY timestamp DESC");
        $readings = $stmt->fetchAll();

        sendResponse(200, true, 'Sensor readings fetched successfully', $readings);
    }
} catch (PDOException $e) {
    sendResponse(500, false, 'Database error: ' . $e->getMessage());
}
