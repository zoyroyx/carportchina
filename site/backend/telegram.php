<?php
declare(strict_types=1);

function telegramText(string $body): string {
    // Bound UTF-16 length (Telegram limit is 4096); retain the contact at the top.
    $characters = preg_split('//u', $body, -1, PREG_SPLIT_NO_EMPTY);
    $text = ''; $units = 0;
    foreach ($characters as $character) {
        $units += strlen($character) === 4 ? 2 : 1;
        if ($units > 3800) return $text . "\n… Полное описание — в письме с тем же номером заявки.";
        $text .= $character;
    }
    return $text;
}

function sendTelegramRequest(array $config, string $body, ?callable $transport = null): void {
    $token = $config['telegram_token'] ?? '';
    $chat = (string)($config['telegram_chat'] ?? '');
    if (!preg_match('/^\d+:[A-Za-z0-9_-]+$/D', $token) || !preg_match('/^-\d+$/D', $chat)) throw new RuntimeException('Telegram configuration unavailable');
    $payload = json_encode(['chat_id' => $chat, 'text' => telegramText($body), 'link_preview_options' => ['is_disabled' => true]], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    if ($transport) {
        $response = $transport($payload);
    } else {
        // Suppress stream diagnostics: the URL contains a credential.
        $context = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/json\r\n", 'content' => $payload, 'timeout' => 15, 'ignore_errors' => true, 'follow_location' => 0], 'ssl' => ['verify_peer' => true, 'verify_peer_name' => true]]);
        $response = @file_get_contents('https://api.telegram.org/bot' . $token . '/sendMessage', false, $context);
    }
    $result = is_string($response) ? json_decode($response, true) : null;
    if (($result['ok'] ?? false) !== true || !is_int($result['result']['message_id'] ?? null) || (string)($result['result']['chat']['id'] ?? '') !== $chat) throw new RuntimeException('Telegram delivery not confirmed');
}
