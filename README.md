# A2WF — Agent-to-Web Framework

<p align="center">
  <img src="assets/logo.png" alt="A2WF Logo" width="200">
</p>

<p align="center">
  <a href="https://a2wf.org/specification/"><img src="https://img.shields.io/badge/spec-v1.0-0D7377?style=flat-square" alt="Spec v1.0"></a>
  <a href="https://schema.org"><img src="https://img.shields.io/badge/Schema.org-compatible-blue?style=flat-square&logo=schema.org" alt="Schema.org Compatible"></a>
  <a href="https://github.com/a2wf/spec/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT License"></a>
  <a href="https://a2wf.org/convert/"><img src="https://img.shields.io/badge/try-converter-orange?style=flat-square" alt="Try Converter"></a>
</p>

<p align="center">
  <strong>The open standard for structured AI agent interaction with websites.</strong>
</p>

<p align="center">
  <a href="https://a2wf.org">Website</a> ·
  <a href="https://a2wf.org/specification/">Specification</a> ·
  <a href="https://a2wf.org/documentation/">Documentation</a> ·
  <a href="https://a2wf.org/examples/">Examples</a>
</p>

---

## What is A2WF?

A2WF (Agent-to-Web Framework) provides a standardized, machine-readable way for websites to communicate their capabilities, permissions, and interaction rules to AI agents.

**The problem:** AI agents are increasingly interacting with websites — not just crawling, but filling forms, making purchases, booking appointments. Yet website operators have no standardized way to control what agents can do. `robots.txt` was designed for search engine crawlers, not for autonomous AI agents.

**The solution:** A single JSON file at `/siteai.json` that defines:

- **Identity** — Who you are (name, category, language, contact)
- **Permissions** — What agents can read, do, and access
- **Rate Limits** — How often agents can interact
- **Authentication** — What requires login vs. anonymous access
- **Compliance** — GDPR, HIPAA, and other regulatory requirements

## Quick Start

Create `/siteai.json` on your website:

```json
{
    "@context": "https://schema.org",
  "specVersion": "1.0",
  "identity": {
    "@type": "WebSite",
    "name": "My Website",
    "description": "A brief description",
    "inLanguage": "en",
    "category": "business"
  },
  "permissions": {
    "read": {
      "allow": ["public-content", "faq", "products"],
      "deny": ["admin", "internal"]
    },
    "actions": {
      "allow": ["search", "contact"],
      "requireAuth": ["purchase", "account"]
    }
  },
  "rateLimit": {
    "requestsPerMinute": 30,
    "dailyQuota": 5000
  }
}
```

That's it. AI agents will discover and respect your policy automatically.

## How It Works With Existing Standards

| Standard | Purpose | A2WF Relationship |
|----------|---------|-------------------|
| **robots.txt** | Crawl control (allow/deny) | A2WF extends with granular agent permissions |
| **MCP** | How agents connect to tools | A2WF defines what agents CAN do on your site |
| **A2A** | Agent-to-agent communication | A2WF provides the web-facing policy layer |
| **OpenAI Plugins** | OpenAI-specific integration | A2WF is vendor-neutral and universal |

## Examples

See the [`examples/`](./examples) directory for industry-specific policy files:

- 🛒 [E-Commerce](./examples/ecommerce.json)
- 🏥 [Healthcare](./examples/healthcare.json)
- 🍽️ [Restaurant](./examples/restaurant.json)
- 🏦 [Banking](./examples/banking.json)
- 📰 [News & Media](./examples/news-media.json)

## Specification

The full specification is available at [a2wf.org/specification](https://a2wf.org/specification/) and in the [`spec/`](./spec) directory of this repository.

**Current version:** 0.1 (Draft)

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

- **Report issues** — Found a gap? [Open an issue](https://github.com/a2wf/spec/issues)
- **Submit examples** — Share your `siteai.json`
- **Build tools** — Validators, generators, parsers
- **Improve the spec** — PRs welcome

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

<p align="center">
  <sub>Created by <a href="https://ssc-slovakia.com">SSC Software Sales Consulting</a></sub>
</p>
