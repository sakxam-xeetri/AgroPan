<?php
/**
 * AgroPan API — Update Answer
 *
 * Updates an existing answer's text or votes.
 * answer_id is required.
 *
 * Method : POST
 * URL    : /API/update/answers.php
 *
 * Request body (JSON):
 * {
 *   "answer_id" : 1,
 *   "answer"    : "Updated answer text here",
 *   "upvotes"   : "1,5,9"
 * }
 */

require_once __DIR__ . '/../database.php';

$input = getJsonInput();

if (empty($input['answer_id'])) {
    sendResponse(400, false, 'Missing required field: answer_id');
}

// ── Updatable fields ──
$allowed = ['answer', 'answered_by', 'upvotes', 'downvotes'];
$setClauses = [];
$params = [':id' => $input['answer_id']];

foreach ($allowed as $field) {
    if (isset($input[$field])) {
        $setClauses[] = "$field = :$field";
        $params[":$field"] = $input[$field];
    }
}

if (empty($setClauses)) {
    sendResponse(400, false, 'No fields provided to update');
}

try {
    $check = $pdo->prepare("SELECT answer_id FROM answers WHERE answer_id = :id LIMIT 1");
    $check->execute([':id' => $input['answer_id']]);
    if (!$check->fetch()) {
        sendResponse(404, false, 'Answer not found');
    }

    $sql = "UPDATE answers SET " . implode(', ', $setClauses) . " WHERE answer_id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    sendResponse(200, true, 'Answer updated successfully');

} catch (PDOException $e) {
    sendResponse(500, false, 'Failed to update answer: ' . $e->getMessage());
}
