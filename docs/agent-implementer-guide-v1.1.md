# A2WF v1.1 Agent and Publisher Implementer Guide

**Companion to:** A2WF v1.1.0-draft.2 specification (`spec/specification-v1.1-draft.2.md`).

**Audience:** Publishers writing a v1.1 document; Consumers (AI agent platforms, integrators) reading one; Validators checking conformance; tooling authors building generators or hosts.

**Scope:** This is a practical guide. The normative source of truth is the specification document; where this guide and the spec disagree, the spec wins.

---

## 1. Three Things to Know Before You Start

1. **A2WF is advisory.** A v1.1 document describes intent. It does not enforce, certify, or substitute for law. Tooling that pretends otherwise is mis-using the framework.
2. **There are two conformance levels.** A2WF-Basic is a minimum viable declaration; A2WF-Standard adds an oversight default model. Anything beyond that is delivered through Optional Normative Modules (Sections 13 to 19 of the spec).
3. **Modules and Profiles are different.** A Module is an optional piece of the spec a Publisher may use. A Profile is a versioned bundle of Modules with extra constraints (for example the EU Governance Starter Profile). Publishers claim Modules via `conformance.moduleClaims` and Profiles via `conformance.profileClaims`.

---

## 2. A Minimal Publisher Walk-Through (Basic Level)

The smallest valid v1.1 document looks like this:

```json
{
  "specVersion": "1.1",
  "identity": {
    "legalName": "Acme GmbH",
    "contactEmail": "ai-policy@acme.example"
  },
  "conformance": { "level": "basic" },
  "permissions": [
    {
      "action": "view",
      "schemaOrgType": "ViewAction",
      "effect": "read-only",
      "allowed": true
    }
  ]
}
```

Steps to publish it:

1. Save the JSON above to `siteai.json` and adapt the values.
2. Add at least one `permissions` entry per action category your site cares about. See the A2WF Action Vocabulary in Section 23.1 of the spec for a curated list (`search`, `purchase`, `register`, `book`, `pay`, `consent`, and so on).
3. Decide on a `schemaOrgType` for each action. This binds your abstract action to a Schema.org Action type and helps Consumers understand what the action means.
4. Serve the file at `https://your-site.example/.well-known/a2wf/siteai.json` with `Content-Type: application/json`.
5. If you previously served a v1.0 document at `https://your-site.example/siteai.json`, keep serving it at that path for at least one Consumer caching cycle, so v1.0 Consumers do not break. The v1.1 spec accepts that legacy path with a Consumer-side warning.
6. Validate the file:
   ```
   node validator/v1_1/cli.js path/to/siteai.json
   ```
   The validator prints PASS or WARN or FAIL per finding, with the relevant spec section.

That is enough for A2WF-Basic.

---

## 3. Going to Standard Level

Standard adds three requirements:

1. A root `oversight` member with `oversightDefaults` covering at least `state-changing` and `commercial` effects.
2. Every `permissions` entry whose `effect` is `state-changing`, `commercial`, or `regulated` either declares its own `oversight` member or relies on the matching `oversightDefaults` entry. The validator catches this.
3. A `discovery.cache.maxAge` is present (Section 9.6).

Minimal Standard example:

```json
{
  "specVersion": "1.1",
  "identity": { ... },
  "conformance": { "level": "standard" },
  "permissions": [
    {
      "action": "view", "schemaOrgType": "ViewAction",
      "effect": "read-only", "allowed": true
    },
    {
      "action": "purchase", "schemaOrgType": "BuyAction",
      "effect": "commercial", "allowed": true,
      "oversight": {
        "level": "confirmation", "channel": "in-band", "method": "ui-prompt",
        "timeout": "PT3M", "onTimeout": "abort"
      }
    }
  ],
  "oversight": {
    "oversightDefaults": {
      "read-only":      { "level": "autonomous" },
      "state-changing": { "level": "notification", "channel": "in-band",
                          "method": "ui-prompt" },
      "commercial":     { "level": "confirmation", "channel": "in-band",
                          "method": "ui-prompt", "timeout": "PT3M",
                          "onTimeout": "abort" },
      "regulated":      { "level": "handover", "channel": "out-of-band",
                          "method": "email" }
    },
    "fallback": { "level": "handover", "channel": "out-of-band", "method": "email" }
  },
  "discovery": {
    "cache": { "maxAge": "PT1H" }
  }
}
```

The four oversight levels are:

- `autonomous`: the Consumer proceeds without human involvement.
- `notification`: the Consumer notifies a human via the declared channel and may proceed.
- `confirmation`: the Consumer must obtain an explicit human confirmation before proceeding.
- `handover`: the Consumer must hand control to a human.

A full Standard-level example for an e-commerce site lives in `examples/v1.1/ecommerce-standard.json`.

---

## 4. Adding Optional Normative Modules

Modules are how you express capabilities beyond the Core. Use only the ones you need.

| Module | Section | Use it when |
|---|---|---|
| `jurisdictions` | 13 | You want to declare which legal regimes you consider applicable. |
| `dataHandling` | 14 | You want to expose machine-readable data-processing categories, purposes, retention, and lawful basis using the DPV vocabulary. |
| `agentIdentification` | 15 | You want to declare which identity, credential, and authentication mechanisms you accept from agents. |
| `auditTrail` | 16 | You want to declare whether you keep an audit trail of agent interactions and which integrity profile, if any, it follows. |
| `incidentReporting` | 17 | You want to publish an endpoint or address for A2WF-related incident reports. |
| `discoverabilityHints` | 18 | You want to expose pointers to sitemap.xml, Schema.org Action endpoints, llms.txt, AI preferences signals, or TDMRep. |
| `codeOfPracticeAlignment` | 19 | You want to declare alignment with one or more codes of practice such as the EU General-Purpose AI Code of Practice. |

When you include a Module member in your document, you must also list it in `conformance.moduleClaims`. The Validator warns if you forget.

Example: adding `dataHandling` (DPV) and `incidentReporting`:

```json
{
  ...,
  "conformance": {
    "level": "standard",
    "moduleClaims": ["dataHandling", "incidentReporting"]
  },
  ...,
  "dataHandling": {
    "dpvProfileURI": "https://w3id.org/dpv/2.0",
    "processing": [
      {
        "categories": ["dpv:Email", "dpv:Name", "dpv:BillingAddress"],
        "purposes": ["dpv:FulfilmentOfContract", "dpv:Billing"],
        "lawfulBasis": ["dpv:Contract"],
        "retention": "P36M",
        "recipients": ["dpv:Processor"],
        "transfers": ["dpv:WithinEU"]
      }
    ],
    "controller": {
      "name": "Acme GmbH",
      "contactEmail": "dpo@acme.example"
    }
  },
  "incidentReporting": {
    "contactEmail": "abuse@acme.example",
    "endpoint": "https://acme.example/.well-known/a2wf/incident",
    "responseTime": "P3D",
    "languages": ["de", "en"]
  }
}
```

Important caveat: `dataHandling` is a declaration scaffold. Validators check syntax. They do not certify legal compliance, and Publishers must not present them as doing so.

---

## 5. Claiming the EU Governance Starter Profile

If your site operates in the EU and you want a single, machine-readable bundle that names jurisdiction, data handling, agent identification, audit trail, incident reporting, and discoverability hints, you can claim the EU Governance Starter Profile (`profiles/eu-governance-starter.md`).

To claim it:

1. Achieve A2WF-Standard level (Section 3 above).
2. Include the six required modules from the profile.
3. Set `conformance.profileClaims` to `["https://a2wf.org/profiles/eu-governance-starter/v1"]`.
4. Run the validator. A profile-aware validator will check the profile rules in addition to the Core rules.

A full example lives in `examples/v1.1/healthcare-eu-governance-profile.json`.

---

## 6. Consumer Implementation

A Consumer is whatever piece of software fetches your A2WF document and decides how to behave on your site. Browsers, AI agent runtimes, integration platforms, and crawlers can all be Consumers.

A Consumer should:

1. Attempt to fetch `https://example.com/.well-known/a2wf/siteai.json` before performing any non-idempotent action on the origin, and before any action the Consumer has reason to consider sensitive or regulated.
2. If the primary path returns 404 or a non-success status, attempt `https://example.com/siteai.json` (the v1.0 legacy path) and log a deprecation warning if it succeeds.
3. Parse the document strictly as JSON. Reject documents that fail to parse.
4. Recognise `specVersion`, `identity`, `permissions`, `oversight`, and `conformance` at minimum.
5. Apply the document only to the origin from which it was fetched.
6. Respect HTTP `Cache-Control`, `Last-Modified`, and `ETag` headers when present, and fall back to `discovery.cache.maxAge` otherwise.
7. Honour `oversight.level` as binding for its own behaviour:
   - `autonomous`: proceed.
   - `notification`: notify a human, proceed.
   - `confirmation`: pause, ask, only then proceed.
   - `handover`: abort the autonomous attempt and surface the handover channel to the human.

A Consumer should not:

- Treat A2WF as an authentication or access-control mechanism. It is a declaration layer; real access control lives in TLS, OAuth, HTTP Message Signatures, and HTTP status codes.
- Treat the absence of an A2WF document as implicit permission for restricted actions.
- Discard unknown members. Forward compatibility depends on Consumers preserving fields they do not recognise.

### 6.1 Resolving Effective Oversight

A Consumer that wants to know which oversight directive applies to a given action follows this resolution order:

1. If the matching Permission Entry has its own `oversight` member, use it.
2. Otherwise, if the document's `oversight.oversightDefaults` contains an entry for the Permission's `effect`, use that.
3. Otherwise, if `oversight.fallback` is present, use it.
4. Otherwise treat the action as `handover` and do not proceed autonomously.

---

## 7. Validator Usage

The reference validator in `validator/v1_1/` reports findings as `pass`, `warn`, or `fail`. There is no numeric conformance score.

CLI usage:

```
node validator/v1_1/cli.js file.json [file2.json ...]
node validator/v1_1/cli.js --json file.json
node validator/v1_1/cli.js --strict file.json
```

In `--strict` mode, `warn` is treated as `fail` for the exit code, useful for CI pipelines.

Programmatic usage:

```js
import { validateFileV11 } from "./validator/v1_1/validator.js";
const result = validateFileV11("./siteai.json");
// result.findings: array of { severity, path, message, specSection }
// result.summary: { pass, warn, fail }
// result.valid: true when summary.fail === 0
```

Findings include:

- Schema violations (missing required members, wrong types, pattern mismatches).
- Conformance-level violations (Standard requires `oversightDefaults`, every commercial action must resolve oversight, and so on).
- Module-claim consistency (member present but missing from `moduleClaims`, or claim listed but member absent).
- Forbidden patterns (numeric conformance scores, legal-compliance claim phrases).
- SHOULD recommendations as warnings (missing `metadata.lastUpdated`, missing `identity.siteURL`, and so on).

The validator does not validate legal claims, audit integrity, or factual correctness of `applicableLaws` and `dataHandling` content. Those are out of scope.

---

## 8. Migrating from v1.0

A v1.1 Consumer accepts v1.0 documents. The mapping is normative and lives in Section 12 of the spec. Key points:

- `humanVerification: true` becomes `oversight.fallback = { "level": "confirmation", "channel": "either" }`.
- `humanVerification: false` becomes `oversight.fallback = { "level": "autonomous" }`.
- A v1.0 document without `conformance` is treated as implicit Basic.

When you migrate a v1.0 document to v1.1:

1. Change `specVersion` to `"1.1"`.
2. Replace the boolean `humanVerification` with an explicit `oversight` block.
3. Add `conformance.level` of at least `"basic"`.
4. Serve the document at `/.well-known/a2wf/siteai.json` while keeping the legacy `/siteai.json` for at least one Consumer caching cycle.
5. Run the validator and address any new findings.

Migration fixtures will land under `tests/fixtures/migration/` before this draft reaches Community Group Final Specification status.

---

## 9. Vendor and Hosting Notes

A Publisher may use a vendor product to author and host its A2WF document. Several rules protect the Publisher and the Consumer:

- The document must be served at the Publisher's origin under `/.well-known/a2wf/siteai.json`. Hosting the document only on a vendor domain breaks the origin trust model.
- The Publisher must be able to export the raw JSON and host it elsewhere at any time. Vendor lock-in patterns are inconsistent with the EU Governance Starter Profile.
- Vendor-specific extensions to the document must be namespaced and must not be required for Core or profile conformance.
- Vendors must not use the W3C name, logos, or wording that suggests W3C endorsement of their product.

A vendor that wraps the neutral profile into a branded product offering is welcome to do so. The wrapper is not a W3C artefact.

---

## 10. Frequently Asked Questions

**Does A2WF replace robots.txt?**

No. robots.txt governs crawling. A2WF governs declared agent-action policy. Section 22 of the spec defines precedence: where signals appear to conflict, Consumers apply the more restrictive setting for the action category in question.

**Does A2WF replace llms.txt?**

No. llms.txt is a content-discovery hint for large language models. A2WF can point to llms.txt via `discoverabilityHints.llmsTxtURI`, but the two address different layers.

**Does A2WF certify legal compliance?**

No. A2WF declarations are advisory. Legal effect comes from contracts, statutory obligations, and the Publisher's own processes. Validators check syntax, not law.

**Why no numeric conformance score?**

Numeric scores invite gaming and marketing misuse. A2WF reports PASS, WARN, FAIL per finding so that downstream tools can present meaningful diagnostics rather than a single number.

**What is the relationship to ODRL?**

A2WF takes its three-layer architecture (Core plus Profiles) from ODRL. A normative ODRL Profile of A2WF that maps the Permission and Oversight models to ODRL terms is planned for v1.2 as a companion specification.

**Can I add custom fields?**

Yes. A2WF preserves unknown top-level members. Validators warn about unknown members unless the Publisher sets `conformance.strictUnknown: true`, in which case they fail. Vendor extensions should be namespaced under a vendor-controlled key.

**Where do I file issues?**

`https://github.com/a2wf/spec/issues`.

---

## 11. Quick Reference

Required at Basic: `specVersion`, `identity` (with `legalName` and `contactEmail`), `conformance.level: "basic"`, `permissions` (at least one entry).

Additionally required at Standard: `oversight.oversightDefaults` covering `state-changing` and `commercial`; every `state-changing`, `commercial`, or `regulated` `permissions` entry resolving oversight either directly or via defaults; `discovery.cache.maxAge`.

Discovery path: `/.well-known/a2wf/siteai.json` (primary), `/siteai.json` (legacy v1.0, accepted with warning).

Validator output: `pass | warn | fail` per finding. No numeric score.

License of this guide: same as the spec, W3C Software and Document License.

*End of A2WF v1.1 Implementer Guide.*
