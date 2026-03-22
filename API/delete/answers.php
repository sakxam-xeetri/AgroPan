<?php
/**
 * AgroPan API — Delete Answer
 * 
 * Deletes an answer and removes its ID from the parent question's
 * `answers` field (comma-separated list).
 *
 * Method : POST
 * URL    : /API/delete/answers.php
 *
 * Request body (JSON):
 * {
 *   "answer_id" : 1
 * }
 */

require_once __DIR__ . '/../database.php';

// ── Read input ──
$input = getJsonInput();

if (empty($input['answer_id'])) {
    sendResponse(400, false, 'Missing required field: answer_id');
}

try {
    // ── Verify answer exists ──
    $stmt = $pdo->prepare("SELECT answer_id FROM answers WHERE answer_id = :answer_id LIMIT 1");
    $stmt->execute([':answer_id' => $input['answer_id']]);

    if (!$stmt->fetch()) {
        sendResponse(404, false, 'Answer not found');
    }

    $answerId = (string) $input['answer_id'];

    // ── Remove answer_id from parent question's answers field ──
    // Find all questions that reference this answer_id
    $stmt = $pdo->query("SELECT question_id, answers FROM questions");
    $questions = $stmt->fetchAll();

    foreach ($questions as $q) {
        if (empty($q['answers']))
            continue;

        $ids = explode(',', $q['answers']);
        $ids = array_map('trim', $ids);

        if (in_array($answerId, $ids)) {
            $ids = array_filter($ids, function ($id) use ($answerId) {
                return $id !== $answerId;
            });
            $updatedAnswers = implode(',', $ids);

            $updateStmt = $pdo->prepare("UPDATE questions SET answers = :answers WHERE question_id = :qid");
            $updateStmt->execute([
                ':answers' => $updatedAnswers,
                ':qid' => $q['question_id']
            ]);
        }
    }

    // ── Delete the answer ──
    $stmt = $pdo->prepare("DELETE FROM answers WHERE answer_id = :answer_id");
    $stmt->execute([':answer_id' => $input['answer_id']]);

    sendResponse(200, true, 'Answer deleted successfully');

} catch (PDOException $e) {
    sendResponse(500, false, 'Database error: ' . $e->getMessage());
}
