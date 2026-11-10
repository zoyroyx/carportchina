<?php
declare(strict_types=1);
const REQUEST_CONSENT_VERSION = '2026-11-08.2';

function requestToken(string $key, ?int $now = null): string {
    $payload = ($now ?? time()) . '.' . bin2hex(random_bytes(16));
    return $payload . '.' . hash_hmac('sha256', $payload, $key);
}
function verifyRequestToken(string $token, string $key, ?int $now = null): bool {
    if (!preg_match('/^(\d{10})\.([a-f0-9]{32})\.([a-f0-9]{64})$/D', $token, $m)) return false;
    $age = ($now ?? time()) - (int)$m[1];
    return $age >= 0 && $age <= 7200 && hash_equals(hash_hmac('sha256', $m[1] . '.' . $m[2], $key), $m[3]);
}
function validateRequest(array $data): array {
    foreach (['name', 'contact', 'type', 'page', 'website'] as $key) {
        if (!isset($data[$key]) || !is_string($data[$key])) throw new InvalidArgumentException('Проверьте заполнение формы.');
    }
    $name = trim($data['name']); $contact = trim($data['contact']);
    if ($name === '' || strlen($name) > 320 || preg_match('/[\x00-\x1F\x7F]/', $name)) throw new InvalidArgumentException('Укажите ваше имя.');
    if (strlen($contact) > 120 || preg_match('/[\x00-\x1F\x7F]/', $contact) || !(filter_var($contact, FILTER_VALIDATE_EMAIL) || preg_match('/^\+?[0-9][0-9 ()-]{5,24}[0-9]$/D', $contact) && strlen(preg_replace('/\D/', '', $contact)) >= 7)) throw new InvalidArgumentException('Укажите корректный телефон или email для ответа.');
    if (($data['consent'] ?? false) !== true) throw new InvalidArgumentException('Для отправки подтвердите согласие на обработку данных.');
    if (($data['consentVersion'] ?? '') !== REQUEST_CONSENT_VERSION) throw new InvalidArgumentException('Условия обработки данных обновлены. Обновите страницу, ознакомьтесь с согласием и отправьте форму снова.');
    $types = ['ferrari_allocation', 'general_selection', 'service', 'warranty', 'parts', 'russification', 'film', 'trade_in', 'credit', 'insurance', 'residency', 'business_vat', 'contact'];
    if (!in_array($data['type'], $types, true)) throw new InvalidArgumentException('Неизвестный тип заявки. Обновите страницу.');
    if (!preg_match('~^/[a-zA-Z0-9_/-]*$~D', $data['page']) || strlen($data['page']) > 250) throw new InvalidArgumentException('Некорректная страница заявки.');
    $details = $data['details'] ?? null;
    if (!is_array($details) || count($details) > 12) throw new InvalidArgumentException('Проверьте описание заявки.');
    foreach ($details as $label => $value) {
        if (!is_string($label) || strlen($label) > 250 || preg_match('/[\x00-\x1F\x7F]/', $label) || !is_string($value) || strlen($value) > 8000 || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value)) throw new InvalidArgumentException('Слишком длинное или некорректное описание.');
    }
    return ['name' => $name, 'contact' => $contact, 'type' => $data['type'], 'page' => $data['page'], 'details' => $details, 'consentVersion' => $data['consentVersion']];
}
function requestBody(array $request, string $id): string {
    $labels = ['ferrari_allocation'=>'Квота Ferrari 849 Testarossa Spider · лето 2027', 'general_selection'=>'Подбор автомобиля', 'service'=>'Сервис', 'warranty'=>'Гарантия', 'parts'=>'Запчасти', 'russification'=>'Русификация', 'film'=>'Защитная плёнка', 'trade_in'=>'Trade-in', 'credit'=>'Кредит', 'insurance'=>'Страхование', 'residency'=>'Сопровождение', 'business_vat'=>'Автомобили для бизнеса', 'contact'=>'Обращение'];
    $lines = ['Новая заявка CarPort China №' . $id, 'Дата: ' . gmdate('c'), 'Направление: ' . $labels[$request['type']], 'Имя: ' . $request['name'], 'Контакт: ' . $request['contact'], 'Страница: https://carportchina.ru' . $request['page'], ''];
    foreach ($request['details'] as $label => $value) if (trim($value) !== '') $lines[] = $label . ': ' . trim($value);
    $lines[] = "\nСогласие на обработку персональных данных: подтверждено отдельным флажком.";
    $lines[] = "Версия согласия: " . $request['consentVersion'];
    $lines[] = "Документ: https://carportchina.ru/consent/";
    $lines[] = "Оператор: ООО «ЛОГИСТИК +», ИНН 9717149586.";
    return implode("\n", $lines);
}

// Only random request IDs and keyed hashes are persisted here; no contact details.
function processRequest(array &$state, string $nonce, string $ipHash, string $contactHash, callable $send, ?int $now = null): array {
    $now = $now ?? time();
    $state['sent'] = array_filter($state['sent'] ?? [], fn($item) => $item['time'] > $now - 7200);
    $state['limits'] = array_filter($state['limits'] ?? [], fn($item) => $item['time'] > $now - 900);
    if (isset($state['sent'][$nonce])) return ['ok' => true, 'id' => $state['sent'][$nonce]['id'], 'delivery' => 'smtp_accepted'];
    foreach ([$ipHash => 8, $contactHash => 3, 'global' => 100] as $key => $limit) {
        if (($state['limits'][$key]['count'] ?? 0) >= $limit) return ['ok' => false, 'status' => 429, 'message' => 'Слишком много заявок. Попробуйте через 15 минут или напишите на corp@carportchina.ru.'];
    }
    foreach ([$ipHash, $contactHash, 'global'] as $key) {
        $state['limits'][$key] = ['time' => $state['limits'][$key]['time'] ?? $now, 'count' => ($state['limits'][$key]['count'] ?? 0) + 1];
    }
    $id = strtoupper(substr($nonce, 0, 10));
    $send($id);
    $state['sent'][$nonce] = ['id' => $id, 'time' => $now];
    return ['ok' => true, 'id' => $id, 'delivery' => 'smtp_accepted'];
}
