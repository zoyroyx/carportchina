<?php
declare(strict_types=1);
use PHPMailer\PHPMailer\PHPMailer;
require __DIR__ . '/request-core.php';
require __DIR__ . '/telegram.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Content-Type-Options: nosniff');
function respond(int $status, array $data): never {
    http_response_code($status); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit;
}
$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['GET', 'POST'], true)) { header('Allow: GET, POST'); respond(405, ['ok'=>false]); }
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (($origin !== '' && $origin !== 'https://carportchina.ru') || ($method === 'POST' && $origin !== 'https://carportchina.ru') || ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') respond(403, ['ok'=>false, 'message'=>'Обновите страницу сайта и попробуйте снова.']);
$private = dirname(__DIR__, 2) . '/carportchina-private';
if (!is_file($private . '/config.php')) respond(503, ['ok'=>false, 'message'=>'Отправка временно недоступна. Напишите на corp@carportchina.ru.']);
$config = require $private . '/config.php';
if ($method === 'GET') respond(200, ['token'=>requestToken($config['signing_key'])]);
if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) respond(415, ['ok'=>false]);
$raw = file_get_contents('php://input', false, null, 0, 20001);
if (strlen($raw) > 20000) respond(413, ['ok'=>false]);
$data = json_decode($raw, true);
if (!is_array($data)) respond(400, ['ok'=>false, 'message'=>'Проверьте заполнение формы.']);
if (!is_string($data['token'] ?? null) || !verifyRequestToken($data['token'], $config['signing_key'])) respond(403, ['ok'=>false, 'message'=>'Время отправки истекло. Нажмите «Отправить заявку» ещё раз.']);
try { $request = validateRequest($data); }
catch (InvalidArgumentException $e) { respond(422, ['ok'=>false, 'message'=>$e->getMessage()]); }
if ($data['website'] !== '') respond(422, ['ok'=>false, 'message'=>'Не удалось отправить форму. Напишите на corp@carportchina.ru.']);
require __DIR__ . '/phpmailer/Exception.php';
require __DIR__ . '/phpmailer/PHPMailer.php';
require __DIR__ . '/phpmailer/SMTP.php';
require __DIR__ . '/HostingSMTP.php';
$file = fopen($private . '/requests-state.json', 'c+');
if (!$file || !flock($file, LOCK_EX | LOCK_NB)) respond(503, ['ok'=>false, 'message'=>'Сервис занят. Повторите отправку через несколько секунд.']);
$state = json_decode(stream_get_contents($file), true) ?? [];
try {
    $result = processRequest($state, explode('.', $data['token'])[1], hash_hmac('sha256', 'ip:' . ($_SERVER['REMOTE_ADDR'] ?? ''), $config['signing_key']), hash_hmac('sha256', 'contact:' . strtolower(preg_replace('/[ ()-]/', '', $request['contact'])), $config['signing_key']), function($id) use ($request, $config) {
        $mail = new PHPMailer(true);
        $mail->setSMTPInstance(new HostingSMTP());
        $mail->isSMTP(); $mail->Host = $config['host']; $mail->Port = 465;
        $mail->SMTPAuth = true; $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Username = 'corp@carportchina.ru'; $mail->Password = $config['password'];
        $mail->Timeout = 15; $mail->getSMTPInstance()->Timelimit = 25;
        $mail->CharSet = 'UTF-8'; $mail->Encoding = 'base64';
        $mail->setFrom('corp@carportchina.ru', 'CarPort China — заявки');
        $mail->addAddress('corp@carportchina.ru');
        if (filter_var($request['contact'], FILTER_VALIDATE_EMAIL)) $mail->addReplyTo($request['contact'], $request['name']);
        $mail->Subject = 'Заявка CarPort China №' . $id;
        $mail->Body = requestBody($request, $id);
        if (!$mail->send()) throw new RuntimeException('Mail not accepted');
    }, null, function($id) use ($request, $config) {
        sendTelegramRequest($config, requestBody($request, $id));
    }, function($snapshot) use ($file) {
        rewind($file);
        $json = json_encode($snapshot, JSON_THROW_ON_ERROR);
        if (!ftruncate($file, 0) || fwrite($file, $json) !== strlen($json) || !fflush($file)) throw new RuntimeException('State write failed');
    });
} catch (Throwable $e) {
    // Do not expose SMTP diagnostics or personal data to the client or logs.
    $result = ['ok'=>false, 'status'=>503, 'message'=>'Не удалось отправить заявку. Повторите попытку или напишите на corp@carportchina.ru.'];
}
rewind($file); ftruncate($file, 0); fwrite($file, json_encode($state)); fflush($file); flock($file, LOCK_UN); fclose($file);
if (($result['status'] ?? 200) === 429) header('Retry-After: 900');
respond($result['status'] ?? 200, $result);
