/**
 * A2WF logger snippet for Cloudflare Workers.
 *
 * This worker:
 *   1. Serves the A2WF document from the operator's origin (transparent passthrough).
 *   2. Records a minimal log event matching a2wf-log-event-v1.schema.json.
 *   3. Optionally forwards the event to an operator-configured endpoint.
 *
 * Defaults are privacy-preserving:
 *   - No IP, cookies, Authorization, query strings, or full Referer.
 *   - Raw User-Agent NOT included. Categorisation only.
 *
 * Deploy this as a Worker bound to a route that covers /.well-known/a2wf/siteai.json
 * and optionally /siteai.json (legacy v1.0 path).
 *
 * Configuration (Worker Environment Variables):
 *   A2WF_LOG_ENDPOINT       Optional. URL to POST log events to as application/x-ndjson.
 *                           Leave unset for no external forwarding.
 *   A2WF_LOG_TOKEN          Optional. Bearer token forwarded to A2WF_LOG_ENDPOINT.
 *   A2WF_ORIGIN_URL         Required. Where to fetch the actual siteai.json from.
 *                           e.g. https://www.example.com/.well-known/a2wf/siteai.json
 *   A2WF_ENABLE_WORKER_LOG  Optional. Set to "1" to emit log records to Worker
 *                           stdout (visible via Cloudflare Logpush or the Worker
 *                           dashboard). Defaults to OFF because Cloudflare Worker
 *                           logs are PLATFORM logs visible to Cloudflare, NOT a
 *                           private operator log.
 *
 * Privacy notes:
 *   - The records emitted by this Worker exclude IPs, cookies, query strings,
 *     and raw User-Agent. Cloudflare nevertheless sees all of those at the
 *     network level. Choosing Cloudflare as a host implies trust in the
 *     Cloudflare platform. This snippet does not change that trust boundary.
 *   - If you forward records to A2WF_LOG_ENDPOINT, you (the operator) are
 *     responsible for the legal basis and for a data-processing agreement with
 *     the endpoint operator.
 */

const AGENT_SIGNATURES = [
  // Same list as tools/logger-snippets/agent-signatures.json. Kept inline for portability.
  // Order matters: more specific patterns first (e.g. Applebot-Extended before Applebot).
  { id: 'openai-gptbot',         category: 'openai',       pattern: /GPTBot/i },
  { id: 'openai-chatgpt-user',   category: 'openai',       pattern: /ChatGPT-User/i },
  { id: 'openai-searchbot',      category: 'openai',       pattern: /OAI-SearchBot/i },
  { id: 'anthropic-claudebot',   category: 'anthropic',    pattern: /ClaudeBot/i },
  { id: 'anthropic-claude-user', category: 'anthropic',    pattern: /Claude-User/i },
  { id: 'anthropic-claude-web',  category: 'anthropic',    pattern: /Claude-Web/i },
  { id: 'anthropic-claude-search', category: 'anthropic',  pattern: /Claude-SearchBot/i },
  { id: 'anthropic-ai',          category: 'anthropic',    pattern: /anthropic-ai/i },
  { id: 'perplexity-bot',        category: 'perplexity',   pattern: /PerplexityBot/i },
  { id: 'perplexity-user',       category: 'perplexity',   pattern: /Perplexity-User/i },
  { id: 'google-extended',       category: 'google',       pattern: /Google-Extended/ },
  { id: 'google-cloudvertexbot', category: 'google',       pattern: /Google-CloudVertexBot/ },
  { id: 'google-other',          category: 'google',       pattern: /GoogleOther/ },
  { id: 'bytedance-spider',      category: 'bytedance',    pattern: /Bytespider/ },
  { id: 'commoncrawl',           category: 'common-crawl', pattern: /CCBot/ },
  { id: 'cohere-ai',             category: 'cohere',       pattern: /cohere-ai/i },
  { id: 'microsoft-bingbot',     category: 'microsoft',    pattern: /bingbot/i },
  { id: 'meta-externalagent',    category: 'meta',         pattern: /Meta-ExternalAgent/ },
  { id: 'meta-externalfetcher',  category: 'meta',         pattern: /Meta-ExternalFetcher/ },
  { id: 'facebookbot',           category: 'meta',         pattern: /FacebookBot/ },
  { id: 'apple-applebot-extended', category: 'apple',      pattern: /Applebot-Extended/ },
  { id: 'apple-applebot',        category: 'apple',        pattern: /Applebot/ },
  { id: 'mistral',               category: 'mistral',      pattern: /MistralAI-User/i },
  { id: 'diffbot',               category: 'diffbot',      pattern: /Diffbot/i },
  { id: 'youbot',                category: 'you',          pattern: /YouBot/i },
  { id: 'amazon-amazonbot',      category: 'amazon',       pattern: /Amazonbot/i },
  { id: 'yandex-bot',            category: 'yandex',       pattern: /YandexBot/i },
  { id: 'baidu-spider',          category: 'baidu',        pattern: /Baiduspider/i },
  { id: 'huawei-petalbot',       category: 'huawei',       pattern: /PetalBot/i },
  { id: 'duckassist-bot',        category: 'duckduckgo',   pattern: /DuckAssistBot/i },
  { id: 'duckduckgo-bot',        category: 'duckduckgo',   pattern: /DuckDuckBot/i },
];

function classify(userAgent) {
  if (!userAgent) return { category: 'unknown', signatureId: 'unknown' };
  for (const s of AGENT_SIGNATURES) {
    if (s.pattern.test(userAgent)) return { category: s.category, signatureId: s.id };
  }
  return { category: 'unknown', signatureId: 'unknown' };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Only handle A2WF discovery paths.
    const isPrimary = path === '/.well-known/a2wf/siteai.json';
    const isLegacy = path === '/siteai.json';
    if (!isPrimary && !isLegacy) return new Response('Not Found', { status: 404 });

    if (!env.A2WF_ORIGIN_URL) {
      return new Response('Worker misconfigured: A2WF_ORIGIN_URL missing', { status: 500 });
    }

    // Fetch the actual A2WF document from origin.
    const originResp = await fetch(env.A2WF_ORIGIN_URL, {
      headers: { 'Cache-Control': 'no-cache' },
      cf: { cacheTtl: 60, cacheEverything: true },
    });

    // Build log event.
    const ua = request.headers.get('user-agent') || '';
    const { category, signatureId } = classify(ua);
    const collectionMode = env.A2WF_LOG_ENDPOINT
      ? 'forwarded'
      : (env.A2WF_ENABLE_WORKER_LOG === '1' ? 'local' : 'platform-only');
    const event = {
      a2wfLogVersion: '1.0',
      schemaURI: 'https://a2wf.org/schema/a2wf-log-event-v1.json',
      timestamp: new Date().toISOString(),
      method: request.method,
      observedPath: path,
      statusCode: originResp.status,
      userAgentCategory: category,
      matchedSignatureId: signatureId,
      agentDeclared: false,
      agentVerified: false,
      collectionMode,
      rawFieldsIncluded: [],
    };
    if (env.A2WF_LOG_ENDPOINT) {
      // Use the URL's origin only, never the full URL with potential tenant ID or token.
      try {
        event.forwardingEndpointOrigin = new URL(env.A2WF_LOG_ENDPOINT).origin;
      } catch (_e) { /* malformed env var, skip */ }
    }

    // Forward asynchronously; do not block response.
    if (env.A2WF_LOG_ENDPOINT) {
      const forwardHeaders = { 'Content-Type': 'application/x-ndjson' };
      if (env.A2WF_LOG_TOKEN) forwardHeaders['Authorization'] = `Bearer ${env.A2WF_LOG_TOKEN}`;
      ctx.waitUntil(
        fetch(env.A2WF_LOG_ENDPOINT, {
          method: 'POST',
          headers: forwardHeaders,
          body: JSON.stringify(event) + '\n',
        }).catch(() => {}),
      );
    }
    // Emit to Worker stdout only when explicitly enabled. Worker stdout is
    // platform-visible (Cloudflare can see it via Logpush and the dashboard);
    // treat this as platform logging, not operator-private storage.
    if (env.A2WF_ENABLE_WORKER_LOG === '1') {
      console.log(JSON.stringify(event));
    }

    // Pass through the document, preserving content type and cache headers.
    return new Response(originResp.body, {
      status: originResp.status,
      headers: {
        'Content-Type': originResp.headers.get('Content-Type') || 'application/json',
        'Cache-Control': originResp.headers.get('Cache-Control') || 'public, max-age=3600',
      },
    });
  },
};
