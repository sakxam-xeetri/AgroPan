<?php
/**
 * AgroPan API — Read Questions
 *
 * Fetch a single question by question_id, filter by type, or fetch all.
 * The `answers` field contains comma-separated answer_ids.
 *
 * Method : POST
 * URL    : /API/read/questions.php
 *
 * Request body (single):  { "question_id": 1 }
 * Request body (by type): { "type": "disease" }
 * Request body (all):     {} or empty
 */

require_once __DIR__ . '/../database.php';

$input = getJsonInput();

try {
    if (!empty($input['question_id'])) {
        // ── Fetch single question ──
        $stmt = $pdo->prepare("SELECT * FROM questions WHERE question_id = :id LIMIT 1");
        $stmt->execute([':id' => $input['question_id']]);
        $question = $stmt->fetch();

        if (!$question) {
            sendResponse(404, false, 'Question not found');
        }

        sendResponse(200, true, 'Question fetched successfully', $question);

    } elseif (!empty($input['type'])) {
        // ── Filter by type ──
        $stmt = $pdo->prepare("SELECT * FROM questions WHERE type = :type ORDER BY question_id DESC");
        $stmt->execute([':type' => $input['type']]);
        $questions = $stmt->fetchAll();

        sendResponse(200, true, 'Questions fetched successfully', $questions);

    } else {
        // ── Fetch all questions ──
        $stmt = $pdo->query("SELECT * FROM questions ORDER BY question_id DESC");
        $questions = $stmt->fetchAll();

        sendResponse(200, true, 'Questions fetched successfully', $questions);
    }
} catch (PDOException $e) {
    sendResponse(500, false, 'Database error: ' . $e->getMessage());
}
