<?php
/**
 * AgroPan API — Update Crop
 *
 * Updates an existing crop listing. crop_id is required.
 * last_updated is auto-set to the current Unix timestamp.
 *
 * Method : POST
 * URL    : /API/update/crops.php
 *
 * Request body (JSON):
 * {
 *   "crop_id" : 1,
 *   "price"   : "135"
 * }
 */

require_once __DIR__ . '/../database.php';

$input = getJsonInput();

if (empty($input['crop_id'])) {
    sendResponse(400, false, 'Missing required field: crop_id');
}

// ── Updatable fields ──
$allowed = ['name', 'image', 'type', 'price'];
$setClauses = [];
$params = [':id' => $input['crop_id']];

foreach ($allowed as $field) {
    if (isset($input[$field]) && $input[$field] !== '') {
        $setClauses[] = "$field = :$field";
        $params[":$field"] = $input[$field];
    }
}

// Always update last_updated
$setClauses[] = "last_updated = :last_updated";
$params[':last_updated'] = (string) time();

if (count($setClauses) <= 1) {
    sendResponse(400, false, 'No fields provided to update');
}

try {
    $check = $pdo->prepare("SELECT crop_id FROM crops WHERE crop_id = :id LIMIT 1");
    $check->execute([':id' => $input['crop_id']]);
    if (!$check->fetch()) {
        sendResponse(404, false, 'Crop not found');
    }

    $sql = "UPDATE crops SET " . implode(', ', $setClauses) . " WHERE crop_id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    sendResponse(200, true, 'Crop updated successfully');

} catch (PDOException $e) {
    sendResponse(500, false, 'Failed to update crop: ' . $e->getMessage());
}
