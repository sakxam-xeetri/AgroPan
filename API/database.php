<?php
/**
 * AgroPan — Database Connection
 * 
 * Centralized PDO connection for all API endpoints.
 * Include this file at the top of every CRUD script:
 *   require_once __DIR__ . '/../database.php';
 * 
 * Uses PDO with prepared statements for SQL injection prevention.
 * Returns a $pdo connection object and a helper function for
 * sending JSON responses.
 */

// ── Database credentials ──
define('DB_HOST', 'localhost');
define('DB_NAME', 'agropan');
define('DB_USER', 'root');
define('DB_PASS', '');          // Default XAMPP — no password
define('DB_CHARSET', 'utf8mb4');

// ── CORS & Headers ──
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ── PDO Connection ──
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,   // Throw exceptions on error
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,         // Return associative arrays
        PDO::ATTR_EMULATE_PREPARES => false,                    // Use real prepared statements
    ];

    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit();
}

// ── Helper: Send JSON Response ──
/**
 * Sends a JSON response and terminates the script.
 *
 * @param int    $statusCode  HTTP status code (200, 201, 400, 404, 500)
 * @param bool   $success     Whether the operation succeeded
 * @param string $message     Human-readable message
 * @param array  $data        Optional data payload
 */
function sendResponse(int $statusCode, bool $success, string $message, array $data = []): void
{
    http_response_code($statusCode);
    $response = [
        'success' => $success,
        'message' => $message,
    ];
    if (!empty($data)) {
        $response['data'] = $data;
    }
    echo json_encode($response);
    exit();
}

// ── Helper: Get JSON Input ──
/**
 * Reads and decodes the raw JSON request body.
 *
 * @return array  Decoded JSON as associative array (empty array if no body)
 */
function getJsonInput(): array
{
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return [];
    }
    $decoded = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendResponse(400, false, 'Invalid JSON input: ' . json_last_error_msg());
    }
    return $decoded;
}

// ── Helper: Send Email Notification ──
/**
 * Sends an email notification to all active subscribers in the emails table.
 * Called by create/data.php (new sensor data) and create/warnings.php (new alert).
 * Uses SMTP via PHPMailer-style direct socket for reliability.
 *
 * @param PDO    $pdo     Database connection
 * @param string $subject Email subject line
 * @param string $body    Email body (plain text)
 */

// ── SMTP Email Credentials ──
define('SMTP_HOST', 'localhost');           // SMTP server hostname (e.g. mail.zenithkandel.com.np)
define('SMTP_USERNAME', 'lifeline@zenithkandel.com.np');
define('SMTP_PASSWORD', '8038@Zenith');
define('SMTP_PORT', 465);                  // 465 = SSL, 587 = TLS
define('SMTP_FROM', 'lifeline@zenithkandel.com.np');
define('SMTP_FROM_NAME', 'LifeLine Emergency');

/**
 * Send a single email via SMTP (SSL on port 465).
 *
 * @param string $to      Recipient email
 * @param string $subject Subject line
 * @param string $body    Plain-text body
 * @return bool  True on success
 */
function smtpSend(string $to, string $subject, string $body): bool
{
    $host = SMTP_HOST;
    $port = SMTP_PORT;
    $user = SMTP_USERNAME;
    $pass = SMTP_PASSWORD;
    $from = SMTP_FROM;
    $fromName = SMTP_FROM_NAME;

    $ctx = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true,
        ],
    ]);

    $prefix = ($port == 465) ? 'ssl://' : 'tcp://';
    $sock = @stream_socket_client($prefix . $host . ':' . $port, $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);
    if (!$sock) {
        error_log("SMTP connect failed: $errstr ($errno)");
        return false;
    }

    // Helper to read server response
    $read = function () use ($sock) {
        $r = '';
        while ($line = fgets($sock, 515)) {
            $r .= $line;
            if (isset($line[3]) && $line[3] === ' ')
                break;
        }
        return $r;
    };

    // Helper to send a command and check expected code
    $cmd = function (string $command, int $expect) use ($sock, $read) {
        fwrite($sock, $command . "\r\n");
        $resp = $read();
        if ((int) substr($resp, 0, 3) !== $expect) {
            error_log("SMTP error on '$command': $resp");
            return false;
        }
        return true;
    };

    // 1. Greeting
    $read();

    // 2. EHLO
    if (!$cmd('EHLO ' . gethostname(), 250)) {
        fclose($sock);
        return false;
    }

    // 3. If port 587, start TLS
    if ($port == 587) {
        if (!$cmd('STARTTLS', 220)) {
            fclose($sock);
            return false;
        }
        stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT);
        if (!$cmd('EHLO ' . gethostname(), 250)) {
            fclose($sock);
            return false;
        }
    }

    // 4. AUTH LOGIN
    if (!$cmd('AUTH LOGIN', 334)) {
        fclose($sock);
        return false;
    }
    if (!$cmd(base64_encode($user), 334)) {
        fclose($sock);
        return false;
    }
    if (!$cmd(base64_encode($pass), 235)) {
        fclose($sock);
        return false;
    }

    // 5. MAIL FROM
    if (!$cmd('MAIL FROM:<' . $from . '>', 250)) {
        fclose($sock);
        return false;
    }

    // 6. RCPT TO
    if (!$cmd('RCPT TO:<' . $to . '>', 250)) {
        fclose($sock);
        return false;
    }

    // 7. DATA
    if (!$cmd('DATA', 354)) {
        fclose($sock);
        return false;
    }

    // 8. Message headers + body
    $date = date('r');
    $message = "From: $fromName <$from>\r\n"
        . "To: $to\r\n"
        . "Subject: $subject\r\n"
        . "Date: $date\r\n"
        . "MIME-Version: 1.0\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n"
        . "\r\n"
        . $body . "\r\n"
        . ".";

    if (!$cmd($message, 250)) {
        fclose($sock);
        return false;
    }

    // 9. QUIT
    $cmd('QUIT', 221);
    fclose($sock);
    return true;
}

function notifyAllSubscribers(PDO $pdo, string $subject, string $body): void
{
    try {
        $stmt = $pdo->query("SELECT email, name FROM emails WHERE is_active = 1");
        $subscribers = $stmt->fetchAll();

        if (empty($subscribers)) {
            return; // No active subscribers
        }

        foreach ($subscribers as $subscriber) {
            $personalBody = "Hello " . $subscriber['name'] . ",\n\n" . $body;
            $personalBody .= "\n\n---\nAgroPan — Nepal's Smart Agriculture Platform\n";
            $personalBody .= "To unsubscribe, contact admin@agropan.com";

            smtpSend($subscriber['email'], $subject, $personalBody);
        }
    } catch (PDOException $e) {
        // Silently fail — email notification should not break the main operation
        error_log('AgroPan email notification error: ' . $e->getMessage());
    }
}
