# A2WF Specification — Version 0.1 (Draft)

**Status:** Proposed Standard  
**Version:** 0.1  
**Date:** 2026-03-18  
**Authors:** Wolfgang Wimmer (SSC Software Sales Consulting)

## Abstract

This document defines the `agent-policy.json` format for the **Agent-to-Web Framework (A2WF)**. It provides a standardized, machine-readable method for website operators to define permissions, capabilities, and interaction rules for AI agents, personal assistants, and other automated systems.

A2WF complements existing web standards like `robots.txt`, `sitemap.xml`, and in-page Schema.org markup by providing granular, agent-specific policies in a single, efficiently consumable file.

## 1. Introduction

### 1.1 Problem Statement

AI agents increasingly interact with websites beyond simple crawling — they fill forms, make purchases, book appointments, and access APIs. Current standards are insufficient:

- **robots.txt** — Binary allow/deny for crawlers; no concept of actions or permissions
- **sitemap.xml** — Lists URLs but lacks semantic context
- **Schema.org** — Describes entities on individual pages but doesn't provide site-level agent policies

Website operators need a standardized way to tell AI agents: *"Here's what you can do, here's what you can't, and here's how to interact with us."*

### 1.2 Solution: agent-policy.json

A single JSON file at `/.well-known/agent-policy.json` that defines:

- **Identity** — Who the website is
- **Permissions** — What agents can read, do, and access
- **Rate Limits** — How often agents can interact
- **Authentication** — What requires credentials
- **Compliance** — Regulatory requirements (GDPR, HIPAA, etc.)

## 2. File Location and Discovery

### 2.1 Well-Known URI (Primary)

The `agent-policy.json` file MUST be placed at:

```
https://example.com/.well-known/agent-policy.json
```

### 2.2 robots.txt Directive (Alternative)

Agents SHOULD also check `robots.txt` for an `AgentPolicy:` directive:

```
User-agent: *
Disallow: /admin/

AgentPolicy: https://example.com/.well-known/agent-policy.json
```

### 2.3 HTML Link Tag (Fallback)

```html
<link rel="agent-policy" type="application/json" href="/.well-known/agent-policy.json">
```

### 2.4 Priority

1. Well-Known URI (highest priority)
2. robots.txt directive
3. HTML link tag

### 2.5 File Serving Requirements

- Content-Type: `application/json`
- Encoding: UTF-8
- CORS: SHOULD include `Access-Control-Allow-Origin: *` for cross-origin agent access

## 3. Format Specification

### 3.1 Top-Level Structure

```json
{
  "specVersion": "0.1",
  "identity": { ... },
  "permissions": { ... },
  "rateLimit": { ... },
  "authentication": { ... },
  "compliance": { ... },
  "agentIdentity": { ... },
  "contact": { ... },
  "extensions": { ... }
}
```

### 3.2 specVersion (REQUIRED)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `specVersion` | String | Yes | The A2WF specification version. Currently `"0.1"` |

### 3.3 identity Object (REQUIRED)

Describes the website and its operator.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Human-readable name of the website/organization |
| `description` | String | Yes | Brief description of the website's purpose |
| `primaryLanguage` | String | Yes | IETF BCP 47 language tag (e.g., `"en"`, `"de-AT"`) |
| `category` | String | No | Website category (e.g., `"e-commerce"`, `"healthcare"`, `"restaurant"`) |
| `url` | String | No | Canonical URL of the website |
| `logo` | String | No | URL to the website's logo |

### 3.4 permissions Object (RECOMMENDED)

Defines what agents are allowed to do.

#### 3.4.1 read

| Field | Type | Description |
|-------|------|-------------|
| `allow` | Array\<String\> | Content areas agents CAN read. `"*"` = everything |
| `deny` | Array\<String\> | Content areas agents MUST NOT read |

#### 3.4.2 actions

| Field | Type | Description |
|-------|------|-------------|
| `allow` | Array\<String\> | Operations agents can perform (e.g., `"search"`, `"add-to-cart"`) |
| `deny` | Array\<String\> | Operations agents must not perform |
| `requireAuth` | Array\<String\> | Operations that require authentication |

#### 3.4.3 data

| Field | Type | Description |
|-------|------|-------------|
| `read` | Array\<String\> | Data types agents can read (e.g., `"product-prices"`, `"availability"`) |
| `write` | Array\<String\> | Data types agents can write/submit |
| `deny` | Array\<String\> | Data types agents must not access |

### 3.5 rateLimit Object (RECOMMENDED)

| Field | Type | Description |
|-------|------|-------------|
| `requestsPerMinute` | Integer | Maximum requests per minute |
| `requestsPerHour` | Integer | Maximum requests per hour |
| `dailyQuota` | Integer | Maximum requests per day |
| `burstLimit` | Integer | Maximum concurrent requests |

### 3.6 authentication Object (OPTIONAL)

| Field | Type | Description |
|-------|------|-------------|
| `required` | Boolean | Whether authentication is required for any access |
| `methods` | Array\<String\> | Supported auth methods: `"api-key"`, `"oauth2"`, `"bearer"`, `"basic"` |
| `registrationUrl` | String | URL where agents can register for credentials |
| `documentationUrl` | String | URL to authentication documentation |

### 3.7 compliance Object (OPTIONAL)

| Field | Type | Description |
|-------|------|-------------|
| `frameworks` | Array\<String\> | Applicable frameworks: `"GDPR"`, `"HIPAA"`, `"CCPA"`, `"PCI-DSS"` |
| `dataResidency` | String | Country/region where data must remain (ISO 3166-1) |
| `consentRequired` | Boolean | Whether explicit consent is required before data processing |
| `privacyPolicyUrl` | String | URL to privacy policy |
| `termsOfServiceUrl` | String | URL to terms of service |

### 3.8 agentIdentity Object (OPTIONAL)

Defines how agents should identify themselves when interacting.

| Field | Type | Description |
|-------|------|-------------|
| `requireIdentification` | Boolean | Whether agents must identify themselves |
| `identificationMethod` | String | How agents identify: `"user-agent"`, `"header"`, `"parameter"` |
| `headerName` | String | Custom header name for identification (e.g., `"X-Agent-Name"`) |
| `trustedAgents` | Array\<String\> | List of trusted agent identifiers |

### 3.9 contact Object (OPTIONAL)

| Field | Type | Description |
|-------|------|-------------|
| `email` | String | Contact email |
| `url` | String | Contact page URL |
| `supportUrl` | String | Technical support URL |

## 4. Complete Example

```json
{
  "specVersion": "0.1",
  "identity": {
    "name": "Example Online Store",
    "description": "Premium widgets and gadgets with AI-assisted shopping",
    "primaryLanguage": "en",
    "category": "e-commerce",
    "url": "https://www.example-store.com",
    "logo": "https://www.example-store.com/logo.png"
  },
  "permissions": {
    "read": {
      "allow": ["product-catalog", "reviews", "faq", "blog"],
      "deny": ["admin", "internal-api", "customer-data"]
    },
    "actions": {
      "allow": ["search", "add-to-cart", "compare-products"],
      "deny": ["bulk-scrape", "automated-reviews"],
      "requireAuth": ["checkout", "account-management", "wishlist"]
    },
    "data": {
      "read": ["product-prices", "availability", "specifications"],
      "write": ["cart-items", "reviews"],
      "deny": ["customer-emails", "payment-info", "internal-analytics"]
    }
  },
  "rateLimit": {
    "requestsPerMinute": 60,
    "requestsPerHour": 1000,
    "dailyQuota": 10000,
    "burstLimit": 5
  },
  "authentication": {
    "required": false,
    "methods": ["api-key", "oauth2"],
    "registrationUrl": "https://www.example-store.com/developer/register",
    "documentationUrl": "https://www.example-store.com/developer/docs"
  },
  "compliance": {
    "frameworks": ["GDPR"],
    "dataResidency": "EU",
    "consentRequired": true,
    "privacyPolicyUrl": "https://www.example-store.com/privacy",
    "termsOfServiceUrl": "https://www.example-store.com/terms"
  },
  "agentIdentity": {
    "requireIdentification": true,
    "identificationMethod": "header",
    "headerName": "X-Agent-Name"
  },
  "contact": {
    "email": "api-support@example-store.com",
    "url": "https://www.example-store.com/contact",
    "supportUrl": "https://www.example-store.com/developer/support"
  }
}
```

## 5. Relationship to Other Standards

| Standard | Focus | A2WF Relationship |
|----------|-------|-------------------|
| `robots.txt` | Crawl permissions (allow/deny) | A2WF extends with granular agent-specific permissions |
| MCP | How agents connect to tools/servers | A2WF defines what agents CAN do; MCP defines HOW |
| A2A (Google) | Agent-to-agent communication | A2WF provides the web-facing policy layer |
| OpenAI Plugins | OpenAI-specific tool integration | A2WF is vendor-neutral and universal |
| Schema.org | In-page entity markup | A2WF provides site-level agent policies |
| `siteai.json` | Site-level AI summary | A2WF focuses on permissions/policy; siteai.json on identity/content |

## 6. Security Considerations

- Agent-policy files SHOULD NOT contain sensitive credentials
- Rate limits SHOULD be enforced server-side (the policy is advisory)
- Agents SHOULD respect `deny` directives as equivalent to `robots.txt` Disallow
- Websites SHOULD NOT rely solely on `agent-policy.json` for security

## 7. IANA Considerations

This specification defines:
- Well-Known URI: `/.well-known/agent-policy.json`
- Link Relation: `agent-policy`
- robots.txt directive: `AgentPolicy:`

## Appendix A: JSON Schema

A formal JSON Schema for validation is available at:
`https://github.com/a2wf/spec/blob/main/schema/agent-policy.schema.json`

---

*Copyright © 2026 A2WF Contributors. Released under MIT License.*
