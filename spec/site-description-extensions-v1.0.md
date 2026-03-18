# A2WF Site Description Extensions v1.0

**Version 1.0 — Companion Document**
**Date:** March 2026
**Author:** Wolfgang Wimmer
**Organization:** SSC Software Sales Consulting
**Website:** https://a2wf.org
**License:** MIT
**Feedback:** github.com/a2wf/spec

---

## 1. Purpose

This document defines the **optional Site Description Extensions** for A2WF.

While the A2WF **Core Specification** focuses on site governance — permissions, restrictions, agent identification, human verification, discovery, and legal rules — this companion document describes optional fields that help AI agents understand the broader structure and capabilities of a website.

These extensions are intentionally separated from the core because they describe **what the site offers** rather than **what agents are allowed to do**.

### Core vs Extensions

- **Core specification** = governance layer
- **Extensions** = optional descriptive layer

Examples:
- Core answers: *May an agent submit the contact form?*
- Extensions answer: *Does the site have a contact form, booking flow, FAQ, search, or API endpoint?*

---

## 2. Design Principles

1. **Optional only** — no extension field is REQUIRED for core compliance.
2. **Descriptive, not normative** — extensions describe the site; the core governs access.
3. **Schema.org-aligned where possible** — use Schema.org-compatible structures when they fit.
4. **Machine-usable** — fields should help agents find relevant entry points, forms, APIs, and sections.
5. **Safe separation** — extensions must not replace core permission decisions.

---

## 3. Recommended Top-Level Extension Fields

The following fields MAY appear in `siteai.json` as optional extensions, or in a companion representation maintained alongside the core policy.

### 3.1 `keySections`

Important site entry points for high-level orientation.

```json
"keySections": [
  {
    "name": "Pricing",
    "entryPoint": "https://example.com/pricing"
  },
  {
    "name": "Support",
    "entryPoint": "https://example.com/support"
  }
]
```

### 3.2 `mainContact`

Primary contact point for business or support communication.

```json
"mainContact": {
  "@type": "ContactPoint",
  "url": "https://example.com/contact",
  "contactType": "customer support",
  "email": "support@example.com"
}
```

### 3.3 `publisher`

Publishing or operating organization.

```json
"publisher": {
  "@type": "Organization",
  "name": "Example Inc.",
  "url": "https://example.com"
}
```

### 3.4 `company`

Business profile beyond the lightweight `identity` object.

Suggested fields:
- `legalName`
- `industry`
- `headquarters`
- `foundingDate`
- `employeeRange`
- `serviceRegions`

### 3.5 `services`

Services, offers, or major product lines exposed by the website.

```json
"services": [
  {
    "name": "Managed Security Services",
    "url": "https://example.com/services/mss",
    "category": "security"
  }
]
```

### 3.6 `forms`

Structured description of important forms on the website.

This is especially useful because many agent-relevant flows happen through forms.

Suggested fields per form object:
- `name`
- `type` — e.g. `contact`, `signup`, `newsletter`, `checkout`, `booking`, `review`
- `url`
- `method`
- `fields`
- `humanVerificationRecommended`

```json
"forms": [
  {
    "name": "Contact sales",
    "type": "contact",
    "url": "https://example.com/contact",
    "method": "POST",
    "fields": ["name", "email", "message"],
    "humanVerificationRecommended": true
  }
]
```

### 3.7 `apiEndpoints`

Important API or machine interface entry points.

Suggested fields:
- `name`
- `url`
- `kind` — e.g. `openapi`, `graphql`, `rest`, `mcp`, `a2a`
- `documentationUrl`
- `authenticationRequired`

```json
"apiEndpoints": [
  {
    "name": "Public REST API",
    "url": "https://api.example.com/v1",
    "kind": "rest",
    "documentationUrl": "https://developer.example.com/api",
    "authenticationRequired": true
  }
]
```

### 3.8 `search`

Description of search capabilities.

Suggested fields:
- `url`
- `parameter`
- `supportsFilters`
- `searchTypes`

```json
"search": {
  "url": "https://example.com/search",
  "parameter": "q",
  "supportsFilters": true,
  "searchTypes": ["products", "articles"]
}
```

### 3.9 `faq`

High-level FAQ description or entry point.

Suggested fields:
- `url`
- `hasStructuredData`
- `topics`

### 3.10 `navigation`

Optional machine-readable navigation summary.

Use sparingly. This field must not turn `siteai.json` into a sitemap replacement.

Suggested fields:
- `primary`
- `footer`
- `utility`

### 3.11 `ecommerce`

Commerce-specific descriptive metadata.

Suggested fields:
- `currency`
- `supportsCart`
- `supportsCheckout`
- `supportsRefunds`
- `supportsGuestCheckout`
- `inventoryVisibility`

### 3.12 `media`

Media/library capabilities.

Suggested fields:
- `hasImages`
- `hasVideo`
- `hasDownloadableAssets`
- `licenseModel`

### 3.13 `careers`

Hiring/career-related site section.

Suggested fields:
- `jobsUrl`
- `acceptsApplications`
- `applicationMethod`

### 3.14 `innovations`

Used for R&D, product roadmap, patents, or technology showcases.

Suggested fields:
- `labsUrl`
- `roadmapUrl`
- `patentsUrl`
- `researchAreas`

### 3.15 `securityDefinitions`

Optional definitions for security-sensitive flows.

Suggested fields:
- `sensitiveActions`
- `restrictedAreas`
- `verificationMethods`
- `abuseMonitoring`

### 3.16 `alternateVersions`

Links to alternate language, regional, or specialized policy variants.

```json
"alternateVersions": [
  {
    "language": "de-AT",
    "url": "https://example.com/de/siteai.json"
  },
  {
    "language": "en",
    "url": "https://example.com/siteai.json"
  }
]
```

---

## 4. Relationship to the Core Specification

Extensions do **not** override the core.

Examples:
- If `forms` says a contact form exists, but core `permissions.action.submitContactForm.allowed` is `false`, then agents must not submit it.
- If `apiEndpoints` lists a REST API, but core policy does not allow a related action, the core policy wins.
- If `search` exists, agents should still check `permissions.action.search` before using it.

**Rule:** When in doubt, the **Core Specification** takes precedence.

---

## 5. Recommended Usage Patterns

### 5.1 Minimal deployment
Use only the core spec.

### 5.2 Practical deployment
Use core + selected extensions such as:
- `forms`
- `apiEndpoints`
- `search`
- `mainContact`

### 5.3 Rich deployment
Use core + a broader descriptive layer for complex sites such as ecommerce, marketplaces, SaaS platforms, healthcare portals, or large enterprise sites.

---

## 6. Example Combined Document

```json
{
  "@context": "https://schema.org",
  "specVersion": "1.0",
  "identity": {
    "@type": "WebSite",
    "domain": "https://example.com",
    "name": "Example Site",
    "description": "Example description",
    "purpose": "SaaS platform for project collaboration.",
    "inLanguage": "en",
    "category": "saas"
  },
  "permissions": {
    "read": {
      "companyInfo": { "allowed": true },
      "faq": { "allowed": true }
    },
    "action": {
      "search": { "allowed": true, "rateLimit": 20 },
      "submitContactForm": { "allowed": false }
    },
    "data": {
      "customerRecords": { "allowed": false }
    }
  },
  "forms": [
    {
      "name": "Contact sales",
      "type": "contact",
      "url": "https://example.com/contact",
      "fields": ["name", "email", "message"]
    }
  ],
  "apiEndpoints": [
    {
      "name": "Public API",
      "url": "https://api.example.com/v1",
      "kind": "rest",
      "documentationUrl": "https://developer.example.com/api"
    }
  ],
  "search": {
    "url": "https://example.com/search",
    "parameter": "q"
  }
}
```

---

## 7. Guidance for Tool Builders

Tools such as generators, validators, CMS plugins, and editor UIs should:
- always generate valid **core** output first
- treat extensions as optional add-ons
- clearly separate governance controls from descriptive site structure
- avoid confusing extensions with permissions

This separation is especially important in visual editors.

A good UI model is:
- **Governance tab** → core policy
- **Site Capabilities tab** → forms, APIs, search, contact, services
- **Advanced / optional tab** → extensions

---

## 8. Example Files in This Repository

The repository includes practical extension examples:

- `examples/extensions/saas-platform.json`
- `examples/extensions/ecommerce-rich.json`

These examples are intentionally richer than the core examples and demonstrate how optional descriptive fields can coexist with the governance layer.

---

## 9. References

- Core Specification: `spec/specification-v1.0.md`
- Website: https://a2wf.org
- Repository: https://github.com/a2wf/spec
- Schema.org: https://schema.org
- robots.txt: https://www.robotstxt.org/
- llms.txt: https://llmstxt.org/

---

This companion document is intended to evolve separately from the core governance layer while staying compatible with A2WF v1.0.
