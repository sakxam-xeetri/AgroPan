<?php
/**
 * AgroPan API — Update Question
 *
 * Updates an existing question's text, type, votes, or linked answers.
 * question_id is required.
 *
 * Method : POST
 * URL    : /API/update/questions.php
 *
 * Request body (JSON):
 * {
 *   "question_id" : 1,
 *   "question"    : "Updated question text here",
 *   "upvotes"     : "2,5,8,12"
 * }
 */

require_once __DIR__ . '/../database.php';

$input = getJsonInput();

if (empty($input['question_id'])) {
    sendResponse(400, false, 'Missing required field: question_id');
}

// ── Updatable fields ──
$allowed = ['question', 'type', 'asked_by', 'upvotes', 'downvotes', 'answers'];
$setClauses = [];
$params = [':id' => $input['question_id']];

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
    $check = $pdo->prepare("SELECT question_id FROM questions WHERE question_id = :id LIMIT 1");
    $check->execute([':id' => $input['question_id']]);
    if (!$check->fetch()) {
        sendResponse(404, false, 'Question not found');
    }

    $sql = "UPDATE questions SET " . implode(', ', $setClauses) . " WHERE question_id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    sendResponse(200, true, 'Question updated successfully');

} catch (PDOException $e) {
    sendResponse(500, false, 'Failed to update question: ' . $e->getMessage());
}
