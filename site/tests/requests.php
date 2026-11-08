<?php
declare(strict_types=1);
require __DIR__ . '/../backend/request-core.php';
$checks = 0;
function check(bool $condition, string $message): void { global $checks; $checks++; if (!$condition) throw new RuntimeException($message); }
function rejects(array $data): bool { try { validateRequest($data); return false; } catch (InvalidArgumentException $e) { return true; } }
$key = str_repeat('a', 64); $now = 1794140000; $token = requestToken($key, $now);
check(verifyRequestToken($token, $key, $now), 'Valid token');
check(!verifyRequestToken($token, 'wrong', $now), 'Wrong key');
check(!verifyRequestToken($token, $key, $now + 7201), 'Expired token');
check(!verifyRequestToken($token, $key, $now - 1), 'Future token');
check(!verifyRequestToken($token . 'x', $key, $now), 'Tampered token');
$data = ['name'=>'Тест', 'contact'=>'test@example.com', 'consent'=>true, 'type'=>'parts', 'page'=>'/services/parts/', 'website'=>'', 'details'=>['Автомобиль'=>'Toyota', 'Комментарий'=>"Первая строка\nВторая строка"]];
$valid = validateRequest($data);
$ferrari = validateRequest(array_replace($data, ['type'=>'ferrari_allocation', 'page'=>'/ferrari-849-testarossa-spider/', 'details'=>['Ссылка на вашу конфигурацию'=>'https://carconfigurator.ferrari.com/?configuration=' . str_repeat('a', 300)]]));
check(str_contains(requestBody($ferrari, 'FERRARI'), 'Квота Ferrari 849 Testarossa Spider') && str_contains(requestBody($ferrari, 'FERRARI'), str_repeat('a', 300)), 'Ferrari request preserves long configurator link and direction');
check($valid['contact'] === 'test@example.com', 'Email accepted');
check(validateRequest(array_replace($data, ['contact'=>'+7 (999) 123-45-67']))['contact'] === '+7 (999) 123-45-67', 'Phone accepted');
foreach ([['contact'=>"test@example.com\r\nBcc: victim@example.com"], ['name'=>"Test\r\nInjected"], ['contact'=>'wrong'], ['consent'=>false], ['type'=>'unknown'], ['page'=>'//evil.test'], ['details'=>['Комментарий'=>str_repeat('x', 8001)]], ['details'=>['Nested'=>['array']]]] as $bad) check(rejects(array_replace($data, $bad)), 'Reject invalid request');
$body = requestBody($valid, 'ABC123');
check(str_contains($body, 'Toyota') && str_contains($body, '/services/parts/') && str_contains($body, 'подтверждено'), 'Mail includes context and consent');
$state = []; $sent = 0; $send = function($id) use (&$sent) { $sent++; };
$first = processRequest($state, 'nonce1', 'ip', 'email', $send, $now);
$duplicate = processRequest($state, 'nonce1', 'ip', 'email', $send, $now);
check($first === $duplicate && $sent === 1, 'Retry does not duplicate email');
processRequest($state, 'nonce2', 'ip', 'email', $send, $now);
processRequest($state, 'nonce3', 'ip', 'email', $send, $now);
check(processRequest($state, 'nonce4', 'ip', 'email', $send, $now)['status'] === 429 && $sent === 3, 'Contact rate limit');
check(processRequest($state, 'nonce4', 'ip', 'email', $send, $now + 901)['ok'], 'Rate limit expires');
$failure = [];
try { processRequest($failure, 'fail', 'ip', 'email', function() { throw new RuntimeException('SMTP failed'); }, $now); } catch (RuntimeException $e) {}
check(!isset($failure['sent']['fail']), 'SMTP failure never marked sent');
check(processRequest($failure, 'fail', 'ip', 'email', $send, $now)['ok'], 'Retry after SMTP failure works');
require __DIR__ . '/../backend/phpmailer/SMTP.php';
require __DIR__ . '/../backend/HostingSMTP.php';
class TestHostingSMTP extends HostingSMTP {
    public function readFrom($socket): string { $this->smtp_conn = $socket; return $this->get_lines(); }
}
$smtp = new TestHostingSMTP(); $smtp->Timeout = 1; $smtp->Timelimit = 1;
foreach (["250-host.example\r\n250-AUTH LOGIN\r\n250 OK\r\n", "220 Ready\r\n", "250\r\n"] as $reply) {
    [$reader, $writer] = stream_socket_pair(STREAM_PF_UNIX, STREAM_SOCK_STREAM, STREAM_IPPROTO_IP);
    fwrite($writer, $reply);
    check($smtp->readFrom($reader) === $reply, 'Hosting SMTP reads complete reply');
    fclose($reader); fclose($writer);
}
[$reader, $writer] = stream_socket_pair(STREAM_PF_UNIX, STREAM_SOCK_STREAM, STREAM_IPPROTO_IP);
fwrite($writer, "250-incomplete\r\n");
check($smtp->readFrom($reader) === '', 'Hosting SMTP rejects timed-out partial reply');
fclose($reader); fclose($writer);
echo "Request handler: $checks checks passed\n";
