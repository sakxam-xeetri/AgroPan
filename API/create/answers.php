<?php
/**
 * AgroPan API — Create Answer
 * 
 * Posts an answer to a forum question.
 * upvotes, downvotes initialized to "0".
 * Also appends the new answer_id to the parent question's `answers` field.
 *
 * Method : POST
 * URL    : /API/create/answers.php
 *
 * Request body (JSON):
 * {
 *   "question_id"  : 1,
 *   "answer"       : "Apply copper-based fungicide before monsoon season.",
 *   "answered_by"  : "sita_sharma"
 * }
 */

require_once __DIR__ . '/../database.php';

// ── Read input ──
$input = getJsonInput();

$required = ['question_id', 'answer', 'answered_by'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        sendResponse(400, false, "Missing required field: $field");
    }
}

// ── Validate question exists ──
try {
    $stmt = $pdo->prepare("SELECT question_id, answers FROM questions WHERE question_id = :qid LIMIT 1");
    $stmt->execute([':qid' => $input['question_id']]);
    $question = $stmt->fetch();

    if (!$question) {
        sendResponse(404, false, 'Question not found');
    }
} catch (PDOException $e) {
    sendResponse(500, false, 'Database error: ' . $e->getMessage());
}

// ── Insert answer ──
try {
    $stmt = $pdo->prepare(
        "INSERT INTO answers (answer, answered_by, upvotes, downvotes)
         VALUES (:answer, :answered_by, '0', '0')"
    );

    $stmt->execute([
        ':answer' => $input['answer'],
        ':answered_by' => $input['answered_by']
    ]);

    $answerId = $pdo->lastInsertId();

    // ── Append answer_id to parent question's answers field ──
    $existingAnswers = $question['answers'];
    $updatedAnswers = empty($existingAnswers) ? (string) $answerId : $existingAnswers . ',' . $answerId;

    $stmt = $pdo->prepare("UPDATE questions SET answers = :answers WHERE question_id = :qid");
    $stmt->execute([
        ':answers' => $updatedAnswers,
        ':qid' => $input['question_id']
    ]);

    sendResponse(201, true, 'Answer posted successfully', [
        'answer_id' => (int) $answerId,
        'question_id' => (int) $input['question_id']
    ]);

} catch (PDOException $e) {
    sendResponse(500, false, 'Failed to post answer: ' . $e->getMessage());
}
