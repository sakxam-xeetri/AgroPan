<?php
/**
 * AgroPan API — Delete Question
 * 
 * Deletes a forum question AND all its linked answers.
 * Looks up the question's `answers` field (comma-separated answer IDs)
 * and deletes those answer records too.
 *
 * Method : POST
 * URL    : /API/delete/questions.php
 *
 * Request body (JSON):
 * {
 *   "question_id" : 1
 * }
 */

require_once __DIR__ . '/../database.php';

// ── Read input ──
$input = getJsonInput();

if (empty($input['question_id'])) {
    sendResponse(400, false, 'Missing required field: question_id');
}

try {
    // ── Verify question exists & get linked answers ──
    $stmt = $pdo->prepare("SELECT question_id, answers FROM questions WHERE question_id = :question_id LIMIT 1");
    $stmt->execute([':question_id' => $input['question_id']]);
    $question = $stmt->fetch();

    if (!$question) {
        sendResponse(404, false, 'Question not found');
    }

    // ── Delete linked answers (if any) ──
    if (!empty($question['answers'])) {
        $answerIds = array_filter(explode(',', $question['answers']), function ($id) {
            return is_numeric(trim($id));
        });

        if (!empty($answerIds)) {
            $placeholders = implode(',', array_fill(0, count($answerIds), '?'));
            $stmt = $pdo->prepare("DELETE FROM answers WHERE answer_id IN ($placeholders)");
            $stmt->execute(array_values($answerIds));
        }
    }

    // ── Delete the question ──
    $stmt = $pdo->prepare("DELETE FROM questions WHERE question_id = :question_id");
    $stmt->execute([':question_id' => $input['question_id']]);

    sendResponse(200, true, 'Question and linked answers deleted successfully');

} catch (PDOException $e) {
    sendResponse(500, false, 'Database error: ' . $e->getMessage());
}
