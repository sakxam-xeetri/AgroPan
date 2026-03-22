<?php
/**
 * AgroPan API — Update Warning
 *
 * Updates an existing emergency alert. warning_id is required.
 * Used to extend validity, edit details, or correct info.
 *
 * Method : POST
 * URL    : /API/update/warnings.php
 *
 * Request body (JSON):
 * {
 *   "warning_id" : 1,
 *   "details"    : "Updated alert details here",
 *   "valid_till" : "1739865600"
 * }
 */

require_once __DIR__ . '/../database.php';

$input = getJsonInput();

if (empty($input['warning_id'])) {
    sendResponse(400, false, 'Missing required field: warning_id');
}

// ── Updatable fields ──
$allowed = ['title', 'details', 'timestamp', 'valid_till'];
$setClauses = [];
$params = [':id' => $input['warning_id']];

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
    $check = $pdo->prepare("SELECT warning_id FROM warnings WHERE warning_id = :id LIMIT 1");
    $check->execute([':id' => $input['warning_id']]);
    if (!$check->fetch()) {
        sendResponse(404, false, 'Warning not found');
    }

    $sql = "UPDATE warnings SET " . implode(', ', $setClauses) . " WHERE warning_id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    sendResponse(200, true, 'Warning updated successfully');

} catch (PDOException $e) {
    sendResponse(500, false, 'Failed to update warning: ' . $e->getMessage());
}
