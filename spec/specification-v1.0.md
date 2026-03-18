# A2WF Agent-to-Web Framework — siteai.json Specification

**Version 1.0 — Proposed Standard (Core)**
**Date:** March 2026
**Author:** Wolfgang Wimmer
**Organization:** SSC Software Sales Consulting
**Website:** https://a2wf.org
**License:** MIT
**Feedback:** github.com/a2wf/spec

---

## 1. Introduction

### 1.1. Abstract

This document defines the `siteai.json` format, Version 1.0, as part of the Agent-to-Web Framework (A2WF). It provides a standardized, machine-readable method for website operators to:

- Declare granular access policies defining what AI agents may and may not do on their digital properties.
- Require agent identification, human-in-the-loop verification for sensitive actions, and enforce rate limits.
- Reference applicable legal frameworks (EU AI Act, GDPR, CCPA) in machine-readable form.

The format complements existing web standards like robots.txt, sitemap.xml, MCP (Model Context Protocol), A2A (Agent-to-Agent Protocol), and in-page Schema.org markup. It leverages Schema.org vocabulary where appropriate and introduces specific structures for AI agent governance that no existing standard provides.

> **Note:** Optional site description extensions (keySections, mainContact, publisher, company, services, forms, apiEndpoints, search, faq, navigation, ecommerce, media, careers, innovations, securityDefinitions, alternateVersions) are defined in the companion document **"A2WF Site Description Extensions v1.0"** and are NOT part of this core specification.

### 1.2. Problem Statement

AI agents increasingly interact with websites — browsing products, comparing prices, booking appointments, filling forms, extracting data. Website operators face a critical gap:

**No AI Agent Access Governance** — No standard exists that gives the website operator a machine-readable way to declare:

- What agents are **ALLOWED** to do (read catalogs, search, compare prices)
- What agents **MUST NOT** do (bulk scrape, fake reviews, unauthorized transactions)
- What requires **HUMAN VERIFICATION** (checkout, booking, contact forms)
- How agents must **IDENTIFY** themselves (name, operator, purpose)
- What **LEGAL TERMS** apply (Terms of Service, jurisdiction, regulatory compliance)
- What **RATE LIMITS** are enforced (per action, per minute, per hour)

Current agent-side standards (MCP, A2A, enterprise IAM) govern agents from the agent operator's perspective. A2WF fills the gap by providing governance from the **website operator's perspective**.

### 1.3. Proposed Solution: siteai.json

`siteai.json` is a standardized JSON file provided by website operators as a machine-readable access policy declaring permissions, restrictions, agent identification requirements, and legal terms.

### 1.4. Relationship to Schema.org

This specification leverages Schema.org vocabulary where applicable for site-level concepts (WebSite, Organization, ContactPoint), avoiding reinvention of standard terms. However, it complements Schema.org by introducing governance structures not covered by Schema.org: permissions, scraping policies, agent identification, human verification, legal enforcement.

An AI agent uses `siteai.json` first to get the governance rules, then uses detailed Schema.org markup found on specific pages for in-depth entity information.

### 1.5. Relationship to Existing Standards

| Standard | Purpose | Perspective | Granularity |
|----------|---------|-------------|-------------|
| robots.txt | Crawl permissions | Website (binary) | Allow/disallow per path |
| sitemap.xml | URL listing | Content | URLs only |
| Schema.org | Structured data | Content (in-page) | Entity descriptions |
| MCP | Agent-to-tool connection | Agent side | Agent capabilities |
| A2A | Agent-to-agent comms | Agent side | Skills & coordination |
| llms.txt | Content guide for LLMs | Content | Curated page list |
| **siteai.json** | **Site governance** | **WEBSITE OWNER** | **Per-action permissions** |

### 1.6. Approach to Multilinguality

Each `siteai.json` file MUST declare its primary language via the REQUIRED `identity.inLanguage` property. For websites with distinct language versions, the RECOMMENDED approach is to provide separate `siteai.json` files for each major language, discoverable via HTML `<link>` tags or referenced in an `alternateVersions` array within the primary file.

### 1.7. Intended Audience

- **Website Operators & Developers** (Producers): How to create and provide siteai.json files.
- **AI Developers & Agent Builders** (Consumers): How to discover and consume siteai.json files.
- **Tool & CMS Developers** (Facilitators): How to build tools or plugins for generating and validating siteai.json files.
- **Regulators & Compliance Officers**: How siteai.json enables machine-readable AI governance.

### 1.8. Conventions and Terminology

Keywords "REQUIRED", "MUST", "MUST NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", "OPTIONAL" are per RFC 2119.

The format is JSON (RFC 8259), UTF-8 encoded. Data types: String, Object, Array, Boolean, Integer. URLs: valid, preferably canonical and absolute. Language Tags: IETF BCP 47. Date-Time: ISO 8601 / RFC 3339. Schema.org: vocabulary at https://schema.org/.

---

## 2. File Location and Discovery

AI agents MUST attempt to discover the `siteai.json` file using the following methods, in order of preference.

### 2.1. Preferred Method: Root URL

Agents SHOULD first check for a file at the website root:

```
https://{domain}/siteai.json
```

This is the simplest and most direct discovery method. The file SHOULD be accessible without authentication.

### 2.2. Alternative: robots.txt Directive

Agents MAY check `robots.txt` for a `SiteAI:` directive:

```
SiteAI: https://example.com/siteai.json
```

### 2.3. Alternative: HTML `<link>` Tag

As a fallback, agents MAY check the HTML `<head>` of the homepage:

```html
<link rel="siteai" type="application/json" href="/siteai.json">
```

### 2.4. Alternative: Well-Known URI

Agents MAY also check:

```
https://{domain}/.well-known/siteai.json
```

### 2.5. Priority and Retrieval

1. Root URL (`/siteai.json`) MUST be attempted first.
2. If not found, `robots.txt` directive is checked.
3. If not found, HTML `<link>` on the homepage is checked.
4. If not found, `/.well-known/siteai.json` is checked.
5. Agents MUST follow standard HTTP practices (redirects, User-Agent headers, caching).

### 2.6. File Serving Requirements

- The file MUST be served with `Content-Type: application/json`.
- The file MUST be encoded in UTF-8.
- The file SHOULD be served over HTTPS.
- Hosting on the same domain or a trusted CDN is RECOMMENDED.
- Appropriate `Cache-Control` headers SHOULD be set.

---

## 3. Format Specification — Required Elements

### 3.1. Top-Level Structure

A `siteai.json` document MUST consist of a single JSON object. The root object MUST contain:

- `specVersion` (String): **REQUIRED.** Must be `"1.0"`.
- `identity` (Object): **REQUIRED.** Core website identification. See 3.2.
- `permissions` (Object): **REQUIRED.** Agent access policies. See 3.3.

The root object SHOULD contain:

- `@context` (String): **RECOMMENDED.** Should be `"https://schema.org"`.
- `agentIdentification` (Object): **RECOMMENDED.** Agent identity requirements. See 3.5.
- `scraping` (Object): **RECOMMENDED.** Data extraction policies. See 3.6.

The root object MAY contain OPTIONAL keys defined in Sections 4. Consumers MUST ignore any unrecognized keys.

### 3.2. identity Object (REQUIRED)

Provides core identifying and contextual information about the website. Leverages Schema.org WebSite vocabulary.

- `@type` (String): RECOMMENDED. `"WebSite"`. Schema.org type declaration.
- `domain` (String): **REQUIRED.** Canonical absolute URL (corresponds to schema:WebSite.url).
- `name` (String): **REQUIRED.** Official site/brand name (schema:WebSite.name).
- `description` (String): OPTIONAL. General site description (schema:WebSite.description).
- `purpose` (String): RECOMMENDED. Concise AI-focused description of the site's primary goal and intended audience. A2WF-specific field complementing the broader Schema.org description.
- `inLanguage` (String): **REQUIRED.** Primary language, BCP 47 tag (schema:WebSite.inLanguage).
- `category` (String): RECOMMENDED. Website type. Suggested values: `"e-commerce"`, `"healthcare"`, `"restaurant"`, `"news"`, `"finance"`, `"education"`, `"government"`, `"saas"`, `"blog"`, `"portfolio"`, `"nonprofit"`, `"entertainment"`.
- `jurisdiction` (String): RECOMMENDED. Legal jurisdiction (`"EU"`, `"US"`, `"US-CA"`, `"CH"`). A2WF-specific.
- `applicableLaw` (Array of Strings): OPTIONAL. Specific regulations, e.g. `["EU AI Act", "GDPR"]`. A2WF-specific.
- `contact` (String): OPTIONAL. Contact email for policy-related questions.

### 3.3. permissions Object (REQUIRED)

The core governance layer. Contains three sub-objects controlling different aspects of AI agent interaction.

#### 3.3.1. Read Permissions

Control what information agents can access (passive operations):

- `productCatalog`: Product listings, descriptions, images, categories.
- `pricing`: Prices, fees, rate cards.
- `availability`: Stock levels, appointment slots, table availability.
- `openingHours`: Business hours, holiday schedules.
- `contactInfo`: Address, phone, email.
- `reviews`: Customer reviews, ratings, testimonials.
- `faq`: Frequently asked questions.
- `companyInfo`: About page, team, history.

#### 3.3.2. Action Permissions

Control what operations agents can perform (active operations):

- `search`: Site search functionality.
- `addToCart`: Adding items to shopping cart.
- `checkout`: Completing a purchase (typically `humanVerification: true`).
- `createAccount`: User registration (often denied).
- `submitReview`: Posting reviews (often denied to prevent fakes).
- `submitContactForm`: Contact form submission.
- `bookAppointment`: Booking reservations/appointments.
- `cancelOrder`: Cancelling orders.
- `requestRefund`: Initiating refund requests.

#### 3.3.3. Data Permissions

Protect sensitive information (typically all denied):

- `customerRecords`: User profiles, personal data.
- `orderHistory`: Past orders, transactions.
- `paymentInfo`: Credit cards, bank details.
- `internalAnalytics`: Traffic data, business metrics.
- `employeeData`: Staff information.

#### 3.3.4. Permission Properties

Each permission value is an object with:

- `allowed` (Boolean): **REQUIRED.** Is this permitted?
- `rateLimit` (Integer): OPTIONAL. Max requests per minute for this action.
- `humanVerification` (Boolean): OPTIONAL. Default: false. Requires human confirmation.
- `note` (String): OPTIONAL. Explanation for agents and humans.

### 3.5. agentIdentification Object (RECOMMENDED)

Defines requirements for AI agent self-identification.

- `requireUserAgent` (Boolean): Agent must include identifying User-Agent header.
- `requiredFields` (Array of Strings): Fields agents must provide: `"agentName"`, `"agentOperator"`, `"agentPurpose"`.
- `allowAnonymousAgents` (Boolean): Default: true. If false, unidentified agents are denied.
- `trustedAgents` (Array of Objects): Whitelist. Each: `{ name, operator, permissions }`.
- `blockedAgents` (Array of Objects): Blacklist. Each: `{ pattern, reason }`.

### 3.6. scraping Object (RECOMMENDED)

Declares policies on automated data extraction.

- `bulkDataExtraction` (Boolean): Default: false. Systematic large-scale extraction.
- `priceMonitoring` (Boolean): Default: false. Automated price change tracking.
- `contentReproduction` (Boolean): Default: false. Reproducing/republishing content.
- `competitiveAnalysis` (Boolean): Default: false. Data collection for competitive intelligence.
- `trainingDataUsage` (Boolean): Default: false. Using content to train AI models.
- `note` (String): OPTIONAL. Additional context or licensing information.

---

## 4. Optional Governance Extensions

### 4.1. defaults Object

Global default settings that apply unless overridden by individual permissions.

- `agentAccess` (String): `"open"` (permissive), `"restricted"` (deny by default), `"minimal"` (deny everything except explicitly allowed).
- `requireIdentification` (Boolean): Default: false.
- `humanVerificationRequired` (Boolean): Default: false. If true, all actions require human verification.
- `maxRequestsPerMinute` (Integer): Global rate limit per minute.
- `maxRequestsPerHour` (Integer): Global rate limit per hour.
- `respectRobotsTxt` (Boolean): Default: true.

### 4.2. humanVerification Object

Defines human-in-the-loop requirements for sensitive actions.

- `methods` (Array of Strings): Accepted methods: `"redirect-to-browser"`, `"email-confirmation"`, `"sms-otp"`.
- `requiredFor` (Array of Strings): Action names requiring human verification.
- `note` (String): OPTIONAL. Additional instructions.

### 4.3. legal Object

References Terms of Service and regulatory frameworks.

- `termsUrl` (String): RECOMMENDED. URL to AI-specific Terms of Service.
- `complianceNote` (String): OPTIONAL. Human-readable compliance statement.
- `dataRetention` (String): OPTIONAL. Rules for agent data retention.
- `euAiActCompliance` (Object): OPTIONAL. EU AI Act specific:
  - `transparencyRequired` (Boolean): Agents must identify as AI.
  - `riskClassification` (String): `"minimal"`, `"limited"`, `"high"`, `"unacceptable"`.
  - `humanOversightMandatory` (Boolean).

### 4.4. discovery Object

Links to complementary web resources.

- `mcpEndpoint` (String): URL to MCP server card.
- `a2aAgentCard` (String): URL to A2A agent card.
- `robotsTxt` (String): URL to robots.txt.
- `llmsTxt` (String): URL to llms.txt file.
- `schemaOrg` (Boolean): Whether Schema.org markup is present on the site.
- `openApi` (String): URL to OpenAPI specification.

### 4.5. metadata Object

- `$schema` (String): URL of the JSON Schema for validation.
- `schemaVersion` (String): Specification version (e.g. `"1.0"`).
- `generatedAt` (String): RFC 3339 timestamp of generation.
- `author` (String): Policy creator.
- `lastUpdated` (String, ISO date): Last modification date.
- `expiresAt` (String, ISO date): Policy expiration date.
- `changelogUrl` (String): URL to policy change history.

---

## 5. Enforcement

### 5.1. Voluntary Compliance

Like robots.txt, A2WF relies primarily on voluntary compliance by reputable AI agents. Major agent vendors (OpenAI, Anthropic, Google, Microsoft) are expected to respect published policies as part of responsible AI deployment.

### 5.2. Technical Enforcement

Website operators MAY enforce policies through:

- HTTP 403 responses to non-compliant agents
- Rate limiting based on declared limits
- Web Application Firewalls (WAF) with agent-aware rules
- User-Agent-based blocking for agents that violate declared policies

### 5.3. Legal Enforcement

The `legal.termsUrl` field enables legal enforcement by linking to machine-readable policies. Courts have established precedent that violating machine-readable access policies can constitute unauthorized access (eBay v. Bidder's Edge, 2000; CFAA framework).

The EU AI Act (effective August 2026) requires transparency and risk management for AI systems. `siteai.json` provides machine-readable evidence of declared policies.

### 5.4. Audit and Logging

Website operators SHOULD log agent access patterns and compare them against declared policies. The `agentIdentification` section enables meaningful audit trails by requiring agent self-identification.

---

## 6. Security Considerations

### 6.1. Policy Integrity

The `siteai.json` file MUST be served over HTTPS to prevent tampering. Website operators SHOULD implement integrity checks and monitor for unauthorized modifications.

### 6.2. Prompt Injection

The `siteai.json` file contains structured data, not executable content. Agents MUST treat all fields as data, not instructions. String fields (especially `note`) MUST NOT be interpreted as agent commands.

### 6.3. Policy Spoofing

Agents MUST only trust `siteai.json` files served from the domain they describe. Cross-domain policy declarations MUST be rejected unless explicitly referenced via the discovery mechanism.

### 6.4. Denial of Service

Rate limits declared in `siteai.json` are requests from the website operator, not guarantees. Agents SHOULD respect declared limits. Website operators SHOULD implement server-side rate limiting independently of declared policies.

---

## 7. Versioning and Extensibility

### 7.1. Version Strategy

The `specVersion` field identifies the specification version. Major versions (2.0, 3.0) MAY introduce breaking changes. Minor updates within v1.x will remain backward-compatible.

### 7.2. Forward Compatibility

Consumers MUST ignore any unrecognized keys. This ensures that files created with future extensions remain readable by v1.0 consumers.

### 7.3. Extensibility Roadmap

Future extensions may include:
- Dynamic policy endpoints (API-based policy queries)
- Signed policies (cryptographic verification)
- Industry-specific profiles (healthcare, finance, government)
- Agent capability matching (matching agent capabilities to site requirements)

---

## 8. Schema.org Alignment

| siteai.json Field | Schema.org Equivalent |
|---|---|
| `@context` | JSON-LD context |
| `identity.@type` | schema:WebSite |
| `identity.name` | schema:WebSite.name |
| `identity.description` | schema:WebSite.description |
| `identity.inLanguage` | schema:WebSite.inLanguage |
| `identity.domain` | schema:WebSite.url |
| `legal.termsUrl` | schema:WebSite.publishingPrinciples |
| `permissions.*` | *A2WF extension (no Schema.org equiv)* |
| `scraping.*` | *A2WF extension* |
| `agentIdentification.*` | *A2WF extension* |
| `humanVerification.*` | *A2WF extension* |

A2WF extends Schema.org rather than reinventing it. Fields without a Schema.org equivalent represent the novel governance concepts unique to A2WF.

---

## 9. File Ecosystem

| File | Purpose | Since |
|------|---------|-------|
| `/robots.txt` | Crawl permissions | 1994 |
| `/sitemap.xml` | URL listing for search engines | 2005 |
| `/llms.txt` | Content guide for LLMs | 2024 |
| `/.well-known/mcp.json` | MCP server discovery | 2024 |
| **`/siteai.json`** | **AI agent access governance (A2WF)** | **2025** |

Each serves a different purpose. A2WF's siteai.json is the governance layer that sits alongside all of them. The `discovery` section of siteai.json can reference each of these files, creating a unified entry point for AI agents.

---

## 10. Complete Example: E-Commerce Store

```json
{
  "@context": "https://schema.org",
  "specVersion": "1.0",
  "identity": {
    "@type": "WebSite",
    "domain": "https://www.example-store.com",
    "name": "Example Online Store",
    "description": "Premium widgets and gadgets",
    "purpose": "E-commerce store selling premium widgets to consumers in the EU.",
    "inLanguage": "en",
    "category": "e-commerce",
    "jurisdiction": "EU",
    "applicableLaw": ["EU AI Act", "GDPR"],
    "contact": "ai-policy@example-store.com"
  },
  "defaults": {
    "agentAccess": "restricted",
    "requireIdentification": true,
    "maxRequestsPerMinute": 30,
    "respectRobotsTxt": true
  },
  "permissions": {
    "read": {
      "productCatalog": { "allowed": true, "rateLimit": 60 },
      "pricing": { "allowed": true },
      "availability": { "allowed": true, "rateLimit": 30 },
      "reviews": { "allowed": true, "rateLimit": 20 },
      "faq": { "allowed": true }
    },
    "action": {
      "search": { "allowed": true, "rateLimit": 20 },
      "addToCart": { "allowed": true },
      "checkout": {
        "allowed": true,
        "humanVerification": true,
        "note": "Final purchase requires human confirmation."
      },
      "createAccount": { "allowed": false },
      "submitReview": { "allowed": false }
    },
    "data": {
      "customerRecords": { "allowed": false },
      "paymentInfo": { "allowed": false },
      "internalAnalytics": { "allowed": false }
    }
  },
  "scraping": {
    "bulkDataExtraction": false,
    "priceMonitoring": false,
    "trainingDataUsage": false,
    "contentReproduction": false
  },
  "agentIdentification": {
    "requireUserAgent": true,
    "requiredFields": ["agentName", "agentOperator"],
    "allowAnonymousAgents": false
  },
  "humanVerification": {
    "methods": ["redirect-to-browser"],
    "requiredFor": ["checkout"]
  },
  "discovery": {
    "robotsTxt": "https://www.example-store.com/robots.txt",
    "llmsTxt": "https://www.example-store.com/llms.txt",
    "schemaOrg": true
  },
  "legal": {
    "termsUrl": "https://www.example-store.com/legal/ai-terms",
    "euAiActCompliance": {
      "transparencyRequired": true,
      "riskClassification": "limited",
      "humanOversightMandatory": false
    }
  },
  "metadata": {
    "author": "Example Store Legal Team",
    "lastUpdated": "2026-03-18",
    "expiresAt": "2027-03-18"
  }
}
```

---

## 11. References

- **RFC 2119** — Key words for use in RFCs to Indicate Requirement Levels
- **RFC 8259** — The JavaScript Object Notation (JSON) Data Interchange Format
- **Schema.org** — https://schema.org/
- **robots.txt** — https://www.robotstxt.org/
- **EU AI Act** — Regulation (EU) 2024/1689
- **MCP** — Model Context Protocol, Anthropic
- **A2A** — Agent-to-Agent Protocol, Google / Linux Foundation
- **llms.txt** — https://llmstxt.org/
- **NIST AI Risk Management Framework** — https://www.nist.gov/artificial-intelligence

---

*Note: Optional Site Description Extensions (keySections, mainContact, publisher, company, services, forms, apiEndpoints, search, faq, navigation, ecommerce, media, careers, innovations, securityDefinitions, alternateVersions) are defined in the companion document "A2WF Site Description Extensions v1.0" and may be included in the same siteai.json file as additional top-level keys.*
