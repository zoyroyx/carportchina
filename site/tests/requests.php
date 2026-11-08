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
echo "Request handler: $checks checks passed\n";
