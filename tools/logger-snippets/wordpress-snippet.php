<?php
/**
 * A2WF logger snippet for WordPress (or any PHP site).
 *
 * Drop this file in your theme directory and include it from functions.php,
 * or paste the function body into functions.php directly.
 *
 * It records a minimal log event matching a2wf-log-event-v1.schema.json
 * every time a client hits /.well-known/a2wf/siteai.json or /siteai.json.
 *
 * Defaults are privacy-preserving:
 *   - No IP, cookies, Authorization, query strings, or full Referer.
 *   - Raw User-Agent NOT included. Categorisation only.
 *
 * Optional configuration (via wp-config.php constants):
 *   A2WF_LOG_ENDPOINT       URL to POST log events to as application/x-ndjson.
 *   A2WF_LOG_TOKEN          Bearer token forwarded to A2WF_LOG_ENDPOINT.
 *   A2WF_LOG_FILE           RECOMMENDED. Absolute path to a dedicated log file
 *                           outside the web root, e.g.
 *                           '/var/log/a2wf/access.log'. The file must be writable
 *                           by the PHP process and readable only by the operator.
 *                           Rotate via logrotate or the host's standard tooling.
 *
 * If neither A2WF_LOG_FILE nor A2WF_LOG_ENDPOINT is configured, the snippet
 * falls back to PHP's error_log(). This is NOT recommended for production:
 *   - records mix with PHP errors,
 *   - records may end up in the host's shared error log readable by other
 *     tenants or support staff,
 *   - log rotation may be controlled by the host, not by you.
 * Use the fallback only for local development, and configure A2WF_LOG_FILE
 * for any real deployment.
 */

if (!function_exists('a2wf_classify_user_agent')) {
    function a2wf_classify_user_agent($ua) {
        if (empty($ua)) return ['category' => 'unknown', 'signatureId' => 'unknown'];
        $signatures = [
            // Order matters: more specific patterns first.
            ['GPTBot',                'openai',       'openai-gptbot'],
            ['ChatGPT-User',          'openai',       'openai-chatgpt-user'],
            ['OAI-SearchBot',         'openai',       'openai-searchbot'],
            ['ClaudeBot',             'anthropic',    'anthropic-claudebot'],
            ['Claude-User',           'anthropic',    'anthropic-claude-user'],
            ['Claude-Web',            'anthropic',    'anthropic-claude-web'],
            ['Claude-SearchBot',      'anthropic',    'anthropic-claude-search'],
            ['anthropic-ai',          'anthropic',    'anthropic-ai'],
            ['PerplexityBot',         'perplexity',   'perplexity-bot'],
            ['Perplexity-User',       'perplexity',   'perplexity-user'],
            ['Google-Extended',       'google',       'google-extended'],
            ['Google-CloudVertexBot', 'google',       'google-cloudvertexbot'],
            ['GoogleOther',           'google',       'google-other'],
            ['Bytespider',            'bytedance',    'bytedance-spider'],
            ['CCBot',                 'common-crawl', 'commoncrawl'],
            ['cohere-ai',             'cohere',       'cohere-ai'],
            ['bingbot',               'microsoft',    'microsoft-bingbot'],
            ['Meta-ExternalAgent',    'meta',         'meta-externalagent'],
            ['Meta-ExternalFetcher',  'meta',         'meta-externalfetcher'],
            ['FacebookBot',           'meta',         'facebookbot'],
            ['Applebot-Extended',     'apple',        'apple-applebot-extended'],
            ['Applebot',              'apple',        'apple-applebot'],
            ['MistralAI-User',        'mistral',      'mistral'],
            ['Diffbot',               'diffbot',      'diffbot'],
            ['YouBot',                'you',          'youbot'],
            ['Amazonbot',             'amazon',       'amazon-amazonbot'],
            ['YandexBot',             'yandex',       'yandex-bot'],
            ['Baiduspider',           'baidu',        'baidu-spider'],
            ['PetalBot',              'huawei',       'huawei-petalbot'],
            ['DuckAssistBot',         'duckduckgo',   'duckassist-bot'],
            ['DuckDuckBot',           'duckduckgo',   'duckduckgo-bot'],
        ];
        foreach ($signatures as $row) {
            if (stripos($ua, $row[0]) !== false) {
                return ['category' => $row[1], 'signatureId' => $row[2]];
            }
        }
        return ['category' => 'unknown', 'signatureId' => 'unknown'];
    }
}

if (!function_exists('a2wf_log_request')) {
    function a2wf_log_request() {
        $path = isset($_SERVER['REQUEST_URI']) ? strtok($_SERVER['REQUEST_URI'], '?') : '';
        if ($path !== '/.well-known/a2wf/siteai.json' && $path !== '/siteai.json') return;
        $ua = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';
        $c = a2wf_classify_user_agent($ua);
        $endpoint = defined('A2WF_LOG_ENDPOINT') ? A2WF_LOG_ENDPOINT : '';
        $event = [
            'a2wfLogVersion'     => '1.0',
            'schemaURI'          => 'https://a2wf.org/schema/a2wf-log-event-v1.json',
            'timestamp'          => gmdate('c'),
            'method'             => isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET',
            'observedPath'       => $path,
            'statusCode'         => http_response_code() ?: 200,
            'userAgentCategory'  => $c['category'],
            'matchedSignatureId' => $c['signatureId'],
            'agentDeclared'      => false,
            'agentVerified'      => false,
            'collectionMode'     => $endpoint ? 'forwarded' : 'local',
            'rawFieldsIncluded'  => [],
        ];
        if ($endpoint) {
            try {
                $parsed = parse_url($endpoint);
                if ($parsed && isset($parsed['scheme'], $parsed['host'])) {
                    $event['forwardingEndpointOrigin'] = $parsed['scheme'] . '://' . $parsed['host']
                        . (isset($parsed['port']) ? ':' . $parsed['port'] : '');
                }
            } catch (Throwable $e) { /* skip on parse error */ }
        }
        $line = wp_json_encode($event);

        // Write locally. A dedicated log file is strongly recommended.
        if (defined('A2WF_LOG_FILE') && A2WF_LOG_FILE) {
            @file_put_contents(A2WF_LOG_FILE, $line . "\n", FILE_APPEND | LOCK_EX);
        } else {
            // Fallback: PHP error_log. NOT recommended for production; records
            // mix with PHP errors and may land in a shared host log. Define
            // A2WF_LOG_FILE for a real deployment.
            error_log('A2WF ' . $line);
        }

        // Forward asynchronously if configured. wp_remote_post() with timeout 1s.
        if ($endpoint && function_exists('wp_remote_post')) {
            $headers = ['Content-Type' => 'application/x-ndjson'];
            if (defined('A2WF_LOG_TOKEN') && A2WF_LOG_TOKEN) {
                $headers['Authorization'] = 'Bearer ' . A2WF_LOG_TOKEN;
            }
            wp_remote_post($endpoint, [
                'headers'  => $headers,
                'body'     => $line . "\n",
                'timeout'  => 1,
                'blocking' => false,
            ]);
        }
    }
    add_action('init', 'a2wf_log_request');
}
