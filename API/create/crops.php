<?php
/**
 * AgroPan API — Create Crop
 * 
 * Adds a new crop listing to the marketplace.
 * last_updated is set to the current Unix timestamp.
 *
 * Method : POST
 * URL    : /API/create/crops.php
 *
 * Request body (JSON):
 * {
 *   "name"  : "Basmati Rice",
 *   "image" : "gallery/crop-rice.jpg",
 *   "type"  : "grain",
 *   "price" : "120"
 * }
 */

require_once __DIR__ . '/../database.php';

// ── Read input ──
$input = getJsonInput();

$required = ['name', 'image', 'type', 'price'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        sendResponse(400, false, "Missing required field: $field");
    }
}

// ── Insert crop ──
try {
    $stmt = $pdo->prepare(
        "INSERT INTO crops (name, image, type, price, last_updated)
         VALUES (:name, :image, :type, :price, :last_updated)"
    );

    $stmt->execute([
        ':name' => $input['name'],
        ':image' => $input['image'],
        ':type' => $input['type'],
        ':price' => $input['price'],
        ':last_updated' => (string) time()
    ]);

    $cropId = $pdo->lastInsertId();

    sendResponse(201, true, 'Crop listing created successfully', ['crop_id' => (int) $cropId]);

} catch (PDOException $e) {
    sendResponse(500, false, 'Failed to create crop: ' . $e->getMessage());
}
