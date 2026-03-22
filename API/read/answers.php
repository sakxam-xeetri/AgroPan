<?php
/**
 * AgroPan API — Read Answers
 *
 * Fetch a single answer by answer_id, fetch all answers for a question
 * (by question_id — looks up the question's comma-separated answers field),
 * or fetch all answers.
 *
 * Method : POST
 * URL    : /API/read/answers.php
 *
 * Request body (single):       { "answer_id": 1 }
 * Request body (by question):  { "question_id": 1 }
 * Request body (all):          {} or empty
 */

require_once __DIR__ . '/../database.php';

$input = getJsonInput();

try {
    if (!empty($input['answer_id'])) {
        // ── Fetch single answer ──
        $stmt = $pdo->prepare("SELECT * FROM answers WHERE answer_id = :id LIMIT 1");
        $stmt->execute([':id' => $input['answer_id']]);
        $answer = $stmt->fetch();

        if (!$answer) {
            sendResponse(404, false, 'Answer not found');
        }

        sendResponse(200, true, 'Answer fetched successfully', $answer);

    } elseif (!empty($input['question_id'])) {
        // ── Fetch all answers for a specific question ──
        // First get the comma-separated answer IDs from the question
        $stmt = $pdo->prepare("SELECT answers FROM questions WHERE question_id = :qid LIMIT 1");
        $stmt->execute([':qid' => $input['question_id']]);
        $question = $stmt->fetch();

        if (!$question) {
            sendResponse(404, false, 'Question not found');
        }

        if (empty($question['answers'])) {
            sendResponse(200, true, 'No answers yet for this question', []);
        }

        // Split comma-separated IDs and fetch each answer
        $answerIds = array_filter(explode(',', $question['answers']));
        $placeholders = implode(',', array_fill(0, count($answerIds), '?'));

        $stmt = $pdo->prepare("SELECT * FROM answers WHERE answer_id IN ($placeholders) ORDER BY answer_id ASC");
        $stmt->execute(array_values($answerIds));
        $answers = $stmt->fetchAll();

        sendResponse(200, true, 'Answers fetched successfully', $answers);

    } else {
        // ── Fetch all answers ──
        $stmt = $pdo->query("SELECT * FROM answers ORDER BY answer_id DESC");
        $answers = $stmt->fetchAll();

        sendResponse(200, true, 'Answers fetched successfully', $answers);
    }
} catch (PDOException $e) {
    sendResponse(500, false, 'Database error: ' . $e->getMessage());
}
