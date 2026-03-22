<?php
/**
 * AgroPan API — Read Warnings (Emergency Alerts)
 *
 * Fetch a single warning by warning_id, only currently active alerts,
 * or all alerts.
 *
 * Method : POST
 * URL    : /API/read/warnings.php
 *
 * Request body (single):      { "warning_id": 1 }
 * Request body (active only): { "active": true }
 * Request body (all):         {} or empty
 */

require_once __DIR__ . '/../database.php';

$input = getJsonInput();

try {
    if (!empty($input['warning_id'])) {
        // ── Fetch single warning ──
        $stmt = $pdo->prepare("SELECT * FROM warnings WHERE warning_id = :id LIMIT 1");
        $stmt->execute([':id' => $input['warning_id']]);
        $warning = $stmt->fetch();

        if (!$warning) {
            sendResponse(404, false, 'Warning not found');
        }

        sendResponse(200, true, 'Warning fetched successfully', $warning);

    } elseif (!empty($input['active'])) {
        // ── Fetch only currently valid alerts (valid_till > now) ──
        $now = (string) time();
        $stmt = $pdo->prepare("SELECT * FROM warnings WHERE valid_till > :now ORDER BY timestamp DESC");
        $stmt->execute([':now' => $now]);
        $warnings = $stmt->fetchAll();

        sendResponse(200, true, 'Active warnings fetched successfully', $warnings);

    } else {
        // ── Fetch all warnings ──
        $stmt = $pdo->query("SELECT * FROM warnings ORDER BY timestamp DESC");
        $warnings = $stmt->fetchAll();

        sendResponse(200, true, 'Warnings fetched successfully', $warnings);
    }
} catch (PDOException $e) {
    sendResponse(500, false, 'Database error: ' . $e->getMessage());
}
