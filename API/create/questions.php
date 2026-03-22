<?php
/**
 * AgroPan API — Create Question
 * 
 * Posts a new question on the community forum.
 * upvotes, downvotes initialized to "0".
 * answers initialized to empty string (comma-separated answer_ids will be appended later).
 *
 * Method : POST
 * URL    : /API/create/questions.php
 *
 * Request body (JSON):
 * {
 *   "question" : "How to prevent late blight in potatoes?",
 *   "type"     : "disease",
 *   "asked_by" : "ram_thapa"
 * }
 */

require_once __DIR__ . '/../database.php';

// ── Read input ──
$input = getJsonInput();

$required = ['question', 'type', 'asked_by'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        sendResponse(400, false, "Missing required field: $field");
    }
}

// ── Insert question ──
try {
    $stmt = $pdo->prepare(
        "INSERT INTO questions (question, type, asked_by, upvotes, downvotes, answers)
         VALUES (:question, :type, :asked_by, '0', '0', '')"
    );

    $stmt->execute([
        ':question' => $input['question'],
        ':type' => $input['type'],
        ':asked_by' => $input['asked_by']
    ]);

    $questionId = $pdo->lastInsertId();

    sendResponse(201, true, 'Question posted successfully', ['question_id' => (int) $questionId]);

} catch (PDOException $e) {
    sendResponse(500, false, 'Failed to post question: ' . $e->getMessage());
}
