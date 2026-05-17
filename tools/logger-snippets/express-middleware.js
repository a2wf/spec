/**
 * A2WF logger middleware for Express.js (Node 18+).
 *
 * Mount this on routes that serve /.well-known/a2wf/siteai.json and optionally /siteai.json.
 * It records a minimal log event matching a2wf-log-event-v1.schema.json.
 *
 * Defaults are privacy-preserving:
 *   - No IP, cookies, Authorization, query strings, or full Referer.
 *   - Raw User-Agent NOT included. Categorisation only.
 *
 * Optional environment variables:
 *   A2WF_LOG_ENDPOINT       URL to POST log events to as application/x-ndjson.
 *   A2WF_LOG_TOKEN          Bearer token forwarded to A2WF_LOG_ENDPOINT.
 *
 * Without A2WF_LOG_ENDPOINT, the middleware writes records to stdout as one JSON
 * line per request. Capture them with your normal log shipping (PM2, systemd,
 * Docker, etc.).
 */

'use strict';

const SIGNATURES = [
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

function classify(ua) {
  if (!ua) return { category: 'unknown', signatureId: 'unknown' };
  for (const s of SIGNATURES) if (s.pattern.test(ua)) return { category: s.category, signatureId: s.id };
  return { category: 'unknown', signatureId: 'unknown' };
}

function buildEvent(req, statusCode, responseBytes) {
  const ua = req.headers['user-agent'] || '';
  const { category, signatureId } = classify(ua);
  const endpoint = process.env.A2WF_LOG_ENDPOINT;
  const event = {
    a2wfLogVersion: '1.0',
    schemaURI: 'https://a2wf.org/schema/a2wf-log-event-v1.json',
    timestamp: new Date().toISOString(),
    method: req.method,
    observedPath: req.path,
    statusCode,
    responseBytes,
    userAgentCategory: category,
    matchedSignatureId: signatureId,
    agentDeclared: false,
    agentVerified: false,
    collectionMode: endpoint ? 'forwarded' : 'local',
    rawFieldsIncluded: [],
  };
  if (endpoint) {
    try {
      event.forwardingEndpointOrigin = new URL(endpoint).origin;
    } catch (_e) { /* malformed env var, skip */ }
  }
  return event;
}

async function forward(event) {
  const endpoint = process.env.A2WF_LOG_ENDPOINT;
  if (!endpoint) return;
  const headers = { 'Content-Type': 'application/x-ndjson' };
  if (process.env.A2WF_LOG_TOKEN) headers.Authorization = `Bearer ${process.env.A2WF_LOG_TOKEN}`;
  try {
    await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(event) + '\n' });
  } catch (_e) {
    // Swallow forwarding errors; do not block the response to the agent.
  }
}

function a2wfLogger() {
  return function (req, res, next) {
    const start = Date.now();
    let bytes = 0;
    const origWrite = res.write.bind(res);
    const origEnd = res.end.bind(res);
    res.write = (chunk, ...args) => { if (chunk) bytes += Buffer.byteLength(chunk); return origWrite(chunk, ...args); };
    res.end = (chunk, ...args) => {
      if (chunk) bytes += Buffer.byteLength(chunk);
      const ev = buildEvent(req, res.statusCode, bytes);
      const endpoint = process.env.A2WF_LOG_ENDPOINT;
      if (endpoint) {
        // Forwarding mode: only forward, do not also write to stdout.
        forward(ev);
      } else {
        // Local mode: write one JSON line per request to stdout.
        process.stdout.write(JSON.stringify(ev) + '\n');
      }
      return origEnd(chunk, ...args);
    };
    next();
  };
}

module.exports = { a2wfLogger, classify };

// Example usage:
//
//   const express = require('express');
//   const { a2wfLogger } = require('./express-middleware.js');
//   const app = express();
//   app.use('/.well-known/a2wf/siteai.json', a2wfLogger(), express.static('a2wf/siteai.json'));
//   app.use('/siteai.json',                   a2wfLogger(), express.static('a2wf/siteai.json'));
//   app.listen(3000);
