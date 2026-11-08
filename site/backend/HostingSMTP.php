<?php
declare(strict_types=1);

/**
 * The shared host's PHP workers exceed stream_select's compiled FD_SETSIZE.
 * Read the blocking TLS stream with bounded socket timeouts instead. TLS and
 * SMTP authentication remain handled by the unmodified PHPMailer library.
 */
class HostingSMTP extends \PHPMailer\PHPMailer\SMTP {
    protected function get_lines() {
        if (!is_resource($this->smtp_conn)) return '';
        stream_set_blocking($this->smtp_conn, true);
        $deadline = microtime(true) + max(1, min($this->Timeout, $this->Timelimit ?: $this->Timeout));
        $response = '';
        while (!feof($this->smtp_conn) && strlen($response) < 65536) {
            $remaining = $deadline - microtime(true);
            if ($remaining <= 0) break;
            stream_set_timeout($this->smtp_conn, (int)ceil($remaining));
            $line = @fgets($this->smtp_conn, self::MAX_REPLY_LENGTH);
            $meta = stream_get_meta_data($this->smtp_conn);
            if ($line === false || $meta['timed_out']) break;
            $response .= $line;
            if (preg_match('/^\d{3}(?: |\r?\n)/', $line)) return $response;
        }
        $this->setError('Incomplete SMTP reply or socket timeout');
        return '';
    }
}
