# A2WF: Agent-to-Website Framework

## Specification, Version 1.1.0-draft.2

**Status:** Pre-Community-Group Editor's Draft, prepared for discussion. This document is not a W3C publication and is not a W3C Recommendation.

**Group:** Proposed for the A2WF Community Group. As of this draft, the Community Group has not been formally chartered at the W3C.

**Date:** 2026-05-16

**Editors:** Wolfgang Wimmer (SSC Software Sales Consulting), with contributions from the A2WF community.

**Repository:** https://github.com/a2wf/spec

**Previous version:** A2WF v1.0 (`spec/specification-v1.0.md`)

**Document License:** The text of this document is made available under the [W3C Software and Document License](https://www.w3.org/copyright/software-license-2023/). The companion software and machine-readable artefacts in this repository (schemas, validators, examples) remain under the MIT License as stated in the repository `LICENSE` file.

**Status disclaimer:** This document is prepared for discussion in advance of, and intended to be contributed to, an A2WF Community Group at the W3C once that group is formally accepted. Until such acceptance, this draft is not a W3C publication, has not been endorsed by the W3C, and does not carry W3C Patent Policy or W3C Community Contributor License Agreement (CLA) effects. Contributions to this repository follow the repository's own MIT license; upon CG acceptance, contributors will be asked to align with the W3C Community CLA.

**Stability:** This is an Editor's Draft circulated for review inside the A2WF community and with external liaisons. It is not stable, may change without notice, and MUST NOT be referenced as a normative standard in production.

---

## Abstract

The Agent-to-Website Framework (A2WF) defines a machine-readable declaration format that allows a website to communicate, to autonomous and semi-autonomous AI agents, which actions are permitted, which require human oversight, which legal regimes apply, and how to discover related signals. Version 1.1 introduces a three-layer architecture: a Core, a set of optional Normative Modules covering data handling, agent identification, audit-trail capability, incident reporting, and discoverability, and a non-normative Appendix containing examples, fixtures and external standards references.

A2WF declarations are advisory policy signals. They do not by themselves create enforcement, legal compliance, certification, or cryptographic proof. Enforcement, certification and legal effect require additional contracts, protocols, or layers that are out of scope for this specification.

---

## Status of This Document

This is a pre-Community-Group Editor's Draft prepared for community discussion. It is not a W3C publication. Comments and issues should be filed at https://github.com/a2wf/spec/issues.

The version published at this URI may change without notice. Implementers seeking a stable reference should wait for a Community Group Final Specification once the A2WF Community Group is chartered at the W3C.

---

## Conformance

As well as sections marked as non-normative, all authoring guidelines, diagrams, examples, and notes in this specification are non-normative. Everything else in this specification is normative.

The key words **MAY**, **MUST**, **MUST NOT**, **OPTIONAL**, **RECOMMENDED**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, and **SHOULD NOT** in this document are to be interpreted as described in BCP 14 [[RFC2119]] [[RFC8174]] when, and only when, they appear in all capitals, as shown here.

Conformance is defined in Section 2 (Conformance Classes) and Section 5 (Conformance Levels). Optional Normative Modules (Sections 13-19) define additional conformance requirements that apply only when a Publisher declares use of the corresponding module.

---

## Table of Contents

### Core (Normative)

1. Charter
2. Conformance Classes
3. Document Structure
4. Identity
5. Conformance Levels
6. Permissions
7. Oversight
8. Rate Limits
9. Discovery and Caching
10. Security Considerations
11. Privacy Considerations
12. Backward Compatibility with v1.0

### Optional Normative Modules

13. Jurisdictions
14. Data Handling
15. Agent Identification
16. Audit Trail (Light)
17. Incident Reporting
18. Discoverability Hints
19. Code of Practice Alignment

### Informative / Registry / Appendix

20. Standards Reference Matrix
21. Related Signals
22. Conflict Resolution
23. Examples
24. Migration Fixtures
25. Future Compatibility

---

# Part I: Core (Normative)

## 1. Charter

### 1.1 Purpose

A2WF defines a JSON-based declaration format that a website publishes to communicate to AI agents which actions are permitted, which require oversight, which legal regimes are claimed to apply, and how to discover further machine-readable signals. The format is published at a well-known URI on the publisher's site and is intended to be machine-parsed by autonomous and semi-autonomous AI agents and supporting tooling.

### 1.2 Scope

A2WF v1.1 is in scope for:

- Declaring per-action permissions and oversight requirements.
- Declaring identity and contact information about the policy publisher.
- Declaring rate limits and discovery metadata.
- Referencing related signals such as robots.txt and llms.txt.
- Optionally declaring data-handling categories, accepted agent-identity protocols, audit-trail capabilities, incident-reporting endpoints, discoverability hints, and code-of-practice alignment.

A2WF v1.1 is **out of scope** for:

- Defining or enforcing legal compliance with any specific regulation, including the EU AI Act, GDPR, US state privacy laws, or sector regulations.
- Defining a forensic audit-log format or cryptographic proof of audit integrity.
- Defining a universal agent-identity protocol.
- Defining a content-licensing or text-and-data-mining-reservation protocol (see [[TDMRep]] and [[AIPREF]]).
- Defining a search-engine ranking or AI-agent visibility signal.
- Acting as a transport, authentication, or access-control mechanism.

### 1.3 Advisory Nature

A2WF declarations are **advisory** policy signals. A declaration by itself does not bind any agent and does not by itself satisfy any legal obligation. Enforcement, certification, or legal effect requires a separate contract, protocol, or enforcement layer that is out of scope for this specification.

This advisory nature is intentional. A2WF chooses to be a stable declaration layer rather than an enforcement protocol, so that diverse enforcement layers, certification programmes, contractual arrangements, and regulatory mappings can build on top of it without locking the Web into a single enforcement model.

### 1.4 Relationship to v1.0

A2WF v1.0 documents remain valid declarations. A2WF v1.1 introduces:

- Conformance Classes and Conformance Levels (Sections 2 and 5).
- A primary discovery path at `/.well-known/a2wf/siteai.json` (Section 9), while continuing to accept the v1.0 legacy path `/siteai.json` with a Consumer warning.
- A four-level oversight model (Section 7) that subsumes the v1.0 boolean `humanVerification`.
- Optional Normative Modules (Sections 13-19) for capabilities that were either absent or under-specified in v1.0.

Section 12 (Backward Compatibility) defines the mapping from v1.0 to v1.1 normatively, with testable fixtures listed in Section 24.

### 1.5 Authoring Principles

- **Stability over expressiveness.** Where a stable W3C Recommendation exists, A2WF references it. Where only experimental drafts exist, A2WF treats them as optional, version-pinned, and labelled experimental.
- **Declaration over enforcement.** A2WF describes intent; other layers act on it.
- **Optional modules over monolithic levels.** Sites adopt only the modules they need.
- **No legal claims.** A2WF MUST NOT be interpreted as a determination of legal compliance.

---

## 2. Conformance Classes

A2WF v1.1 defines the following Conformance Classes. Each class has its own normative requirements. An implementation MAY conform to one or more classes.

### 2.1 A2WF Document

An **A2WF Document** is a JSON document that:

- MUST be encoded as UTF-8.
- MUST be a JSON object as defined by [[RFC8259]].
- MUST contain the member `specVersion` whose value is the string `"1.1"` or, for legacy v1.0 documents being processed under v1.1 backward compatibility rules, the string `"1.0"`.
- For `specVersion: "1.1"` MUST contain the member `conformance` (see Section 5). For `specVersion: "1.0"`, the mapping in Section 12 applies and an implicit `conformance.level = "basic"` is assumed.
- MUST contain the member `identity` (see Section 4).
- MUST contain the member `permissions` (see Section 6) unless `specVersion` is `"1.0"`, in which case Section 12 governs.
- MUST satisfy all Core requirements applicable to the document's declared `conformance.level`.
- MUST satisfy all requirements of every Module that the document uses or claims.

### 2.2 Policy Publisher

A **Policy Publisher** is the actor that produces an A2WF Document.

A Policy Publisher MUST:

- Produce an A2WF Document that conforms to Section 2.1.
- Serve the document over HTTPS [[RFC9110]] at one of the discovery paths defined in Section 9.
- Ensure that the document describes the actual site policy and operational reality at the time of publication.
- Not infer or imply legal compliance with any regulation solely from the presence of A2WF members.

A Policy Publisher SHOULD:

- Re-publish the document when site policy changes.
- Include a `Last-Modified` HTTP header and a valid `Cache-Control` directive.
- Provide the legacy path `/siteai.json` if it previously published v1.0, for at least one Consumer caching cycle after migration.

### 2.3 Consumer

A **Consumer** is an actor (typically an AI agent, agent runtime, or middleware) that fetches and evaluates A2WF Documents.

A Consumer MUST:

- Attempt to fetch the A2WF Document before performing any non-idempotent action on the publisher's site, and before performing any action that the Consumer has reason to believe is sensitive or regulated (for example access to personal data, financial transactions, or regulated content), subject to Section 9 caching rules.
- Parse the document strictly as JSON [[RFC8259]] and reject documents that fail to parse.
- Recognise and process the `specVersion`, `identity`, `permissions`, and `oversight` members at minimum.
- Preserve and pass through unknown members rather than discard them, to support forward compatibility.
- Apply the document only to the origin from which it was fetched.

A Consumer MUST NOT:

- Treat A2WF as an authentication, authorisation, or access-control mechanism. It is a declaration layer; enforcement is the Consumer's own responsibility or that of a separate layer.
- Treat the absence of an A2WF Document as implicit permission for any action that the Consumer would otherwise consider restricted.

A Consumer that does not implement a given Optional Normative Module MAY ignore that module's members, but MUST NOT reinterpret module-defined members as Core permissions.

### 2.4 Validator

A **Validator** is a tool that checks whether an A2WF Document conforms to this specification.

A Validator MUST:

- Validate against the published JSON Schema for the document's declared `specVersion` and `conformance.level`.
- Report each finding as one of `pass`, `warn`, or `fail`. (A2WF v1.1 deliberately does not define a numeric conformance score; see Section 5.4.)
- Validate every Module that the document claims via `moduleClaims` or uses via module-defined members.
- Report unknown members as `warn` (not `fail`) to permit forward compatibility, unless the document's `conformance.strictUnknown` member is `true`.

A Validator MUST NOT:

- Infer or report legal compliance.
- Modify the document under test.

### 2.5 Scanner

A **Scanner** is a tool that crawls a population of sites and produces aggregate reports about A2WF adoption.

A Scanner SHOULD:

- Respect `robots.txt` [[RFC9309]], rate limits declared per Section 8, and the publisher's `discoverabilityHints` declarations if any (Section 18).
- Report adoption findings as factual observations, not as compliance certifications.

A Scanner MUST NOT publish a numeric "A2WF Conformance Score" or "A2WF Compliance Score" derived from A2WF Documents. Aggregate adoption statistics are out of scope of A2WF normative conformance.

> *Note (non-normative): Vendors may publish their own scoring products (for example, "Vendor X Site-Readiness Score"). Such products are vendor metrics, not A2WF conformance signals.*

### 2.6 Profile

A **Profile** is an identified, versioned set of additional A2WF requirements that bundle one or more Modules and may add further constraints. A Profile MUST have:

- A stable URI.
- A version identifier.
- A publisher or owner identifier.
- A list of required Modules and Module-level constraints.
- A statement of relationship to A2WF v1.1.

An example Profile, the "A2WF EU Governance Starter Profile", is published separately in `profiles/eu-governance-starter.md`.

---

## 3. Document Structure

An A2WF v1.1 Document is a single JSON object. The members below are defined in this specification. Members marked **Core** are defined in Sections 4-12. Members marked **Module** are defined in Sections 13-19 and apply only when present.

| Member | Type | Required | Defined in | Notes |
|---|---|---|---|---|
| `specVersion` | string | MUST | §3, §12 | `"1.1"` for current documents, `"1.0"` for legacy |
| `identity` | object | MUST | §4 | Core |
| `conformance` | object | MUST for `specVersion "1.1"`; implicit for v1.0 under §12 | §5 | Core (level, optional claims) |
| `permissions` | array | MUST | §6 | Core (one or more actions) |
| `oversight` | object | MUST at Standard | §7 | Core defaults |
| `rateLimits` | object | MAY | §8 | Core |
| `discovery` | object | MAY at Basic; MUST at Standard | §9 | Core (caching/migration hints) |
| `jurisdictions` | array | MAY (Module) | §13 | Module |
| `dataHandling` | object | MAY (Module) | §14 | Module |
| `agentIdentification` | object | MAY (Module) | §15 | Module |
| `auditTrail` | object | MAY (Module) | §16 | Module |
| `incidentReporting` | object | MAY (Module) | §17 | Module |
| `discoverabilityHints` | object | MAY (Module) | §18 | Module |
| `codeOfPracticeAlignment` | array | MAY (Module) | §19 | Module |
| `relatedSignals` | object | MAY | §21 | Informative pointer block |
| `metadata` | object | MAY | §3.1 | Editorial metadata |

The members `conformance.moduleClaims` and `conformance.profileClaims` are defined within the `conformance` object (Section 5.1), not at the document root.

### 3.1 Editorial Metadata

The `metadata` member MAY contain editorial information that is not normative for Consumers but is useful for tooling and humans. Recognised fields:

- `lastUpdated` (string, ISO 8601 date or date-time)
- `language` (string, BCP 47 language tag) [[BCP47]]
- `documentURI` (string, the canonical URI of this document)
- `previousVersionURI` (string, optional)

Consumers MAY use `metadata.language` for localisation of human-facing strings inside the document.

### 3.2 Unknown Members

Publishers MAY include members not defined in this specification. Consumers MUST preserve such members. Validators MUST report them as `warn` unless `conformance.strictUnknown` is `true`, in which case they MUST be reported as `fail`.

### 3.3 Member Order and Whitespace

Member order and whitespace are not significant. Implementations MUST NOT rely on either.

---

## 4. Identity

The `identity` object identifies the Policy Publisher.

### 4.1 Required Members

- `legalName` (string, MUST): the legal name of the entity responsible for the site.
- `contactEmail` (string, MUST): a contact email for A2WF-related inquiries; MUST be a valid email address per [[RFC5322]].

### 4.2 Recommended Members

- `siteName` (string, SHOULD): the human-facing name of the site.
- `siteURL` (string, SHOULD): the canonical URL of the site.
- `jurisdictionPrimary` (string, SHOULD): ISO 3166-1 alpha-2 country code of the primary establishment.

### 4.3 Optional Members

- `legalEntityIdentifier` (string, MAY): a registered identifier such as an LEI [[ISO17442]], EUID, or local trade-register number, expressed as a URI or scheme-prefixed string.
- `addressURI` (string, MAY): a URI pointing to a structured postal address (for example a Schema.org PostalAddress JSON-LD document).
- `representatives` (array, MAY): a list of named contacts, each with `name`, `role`, and `email`.

### 4.4 Multi-Region Note

A Publisher operating in multiple jurisdictions SHOULD use the `jurisdictions` Module (Section 13) for full enumeration. `identity.jurisdictionPrimary` represents the principal establishment only.

### 4.5 Conformance

A Publisher MUST provide `legalName` and `contactEmail` at all Conformance Levels. Validators MUST report missing required identity fields as `fail`.

---

## 5. Conformance Levels

A2WF v1.1 defines two Conformance Levels for A2WF Documents: **A2WF-Basic** and **A2WF-Standard**. Levels are additive: A2WF-Standard subsumes all A2WF-Basic requirements.

There is no "Advanced" level in v1.1. Capabilities that exceed A2WF-Standard are expressed through Optional Normative Modules (Sections 13-19) and through Profiles (Section 2.6).

### 5.1 The `conformance` Member

The `conformance` member is a JSON object with the following structure:

```json
{
  "level": "basic" | "standard",
  "moduleClaims": ["dataHandling", "jurisdictions"],
  "profileClaims": ["https://a2wf.org/profiles/eu-governance-starter/v1"],
  "strictUnknown": false,
  "claimedFeatures": ["agent-identification.did", "audit-trail.signed"]
}
```

- `level` (string, MUST): one of `"basic"` or `"standard"`.
- `moduleClaims` (array of strings, SHOULD if any Module is used): the canonical names of the Modules that the Publisher claims this document conforms to. Canonical names are listed in Section 3 (Document Structure).
- `profileClaims` (array of strings, MAY): URIs of Profiles whose requirements this document satisfies.
- `strictUnknown` (boolean, MAY, default `false`): if `true`, Validators MUST treat unknown top-level members as `fail` rather than `warn`.
- `claimedFeatures` (array of strings, MAY): informative, fine-grained feature tags for marketing or scanner display. `claimedFeatures` MUST NOT alter the document's `level`.

### 5.2 A2WF-Basic

An A2WF Document conforms to A2WF-Basic if and only if:

- It satisfies all structural requirements of Section 2.1 (A2WF Document).
- It contains `identity` per Section 4.
- It contains at least one entry in `permissions` per Section 6.
- It contains `conformance.level` with value `"basic"` or `"standard"`.
- It does not violate any Module requirement for Modules it uses or claims.

A Basic document SHOULD include `metadata.lastUpdated` and SHOULD provide a Cache-Control HTTP header on the discovery URL. A Basic document MAY include any Optional Normative Module; doing so does not change the level.

> *Note (non-normative): A document with `conformance.level: "standard"` satisfies all Basic requirements by definition. The Basic requirements are the structural floor that every A2WF v1.1 document meets, regardless of declared level.*

### 5.3 A2WF-Standard

An A2WF Document conforms to A2WF-Standard if and only if:

- It satisfies all structural Basic requirements above (identity, at least one permission, Section 2.1 conformance).
- It contains `conformance.level` with value `"standard"`.
- It contains `oversight` with `oversightDefaults` covering at least `state-changing` and `commercial` (Section 7).
- Every entry in `permissions` with an `effect` of `state-changing`, `commercial`, or `regulated` either declares its own `oversight` member, or omits `oversight` and thereby implicitly inherits `oversight.oversightDefaults[effect]` from the document root (Section 7.6).
- It contains a `discovery` member with at least `discovery.cache.maxAge` (Section 9).

> *Note (non-normative): A2WF v1.0's "at least one action with oversight" rule has been replaced by the requirement that defaults exist AND that high-impact actions explicitly resolve their oversight. This closes the gaming pattern where a Publisher could mark a single trivial action with oversight and claim Standard.*

### 5.4 No Numeric Score

A2WF v1.1 does not define a numeric conformance score. Validators MUST report findings as `pass`, `warn`, or `fail`. Aggregations (counts of `pass`/`warn`/`fail` per category) are permitted but MUST NOT be presented as a single 0-100 score.

### 5.5 Module Claims and Self-Declaration

A2WF v1.1 uses self-declared conformance. The presence of `conformance.level: "standard"` is a Publisher's self-declaration. Third-party verification, where it exists, is provided by Profiles and external programmes; it is not built into the Core.

### 5.6 Profile Claims

A document MAY claim conformance to one or more Profiles via `profileClaims`. A claim is valid only if the document satisfies every requirement of the claimed Profile. Validators that recognise the Profile URI MUST validate against it.

---

## 6. Permissions

The `permissions` member is an array of one or more **Permission Entry** objects. Each entry expresses what a category of action is allowed, conditioned, or forbidden, and how the corresponding oversight applies.

### 6.1 Permission Entry Structure

```json
{
  "action": "purchase",
  "schemaOrgType": "BuyAction",
  "effect": "commercial",
  "allowed": true,
  "oversight": { "level": "confirmation", "channel": "in-band" },
  "rateLimit": "checkout-default",
  "conditions": [
    { "kind": "amount-above", "value": 200, "currency": "EUR",
      "escalateTo": "confirmation" }
  ],
  "notes": "Standard checkout flow; out-of-band agreement required for B2B contract purchases."
}
```

### 6.2 Required Members

- `action` (string, MUST): a stable identifier for the action category. SHOULD be drawn from the A2WF Action Vocabulary (Appendix 23.1) or be a fully-qualified URI in the Publisher's namespace.
- `allowed` (boolean, MUST): whether the action is permitted at all. If `allowed` is `false`, a Consumer MUST NOT initiate the action autonomously; `oversight` is informational only when `allowed` is `false`.

### 6.3 Recommended Members

- `schemaOrgType` (string, SHOULD): a Schema.org Action type [[SCHEMA-ORG]] such as `BuyAction`, `SearchAction`, `RegisterAction`. This binds the abstract action to a widely-understood vocabulary.
- `effect` (string, SHOULD): one of `read-only`, `state-changing`, `commercial`, `regulated`. Used by the Standard-level requirement in Section 5.3.

### 6.4 Optional Members

- `oversight` (object, MAY at Basic, see Section 5.3 for Standard): the oversight applied to this action; structure per Section 7.
- `rateLimit` (string, MAY): a named rate-limit reference defined in `rateLimits` (Section 8).
- `conditions` (array, MAY): additional triggers that may escalate or de-escalate oversight; structure per Section 6.5.
- `notes` (string, MAY): human-readable notes for implementers and auditors.

### 6.5 Conditions

A condition is a JSON object using a small, declarative vocabulary. A2WF v1.1 deliberately does not adopt a general expression language. The following condition kinds are defined:

- `amount-above`: `{ "kind": "amount-above", "value": <number>, "currency": <ISO 4217>, "escalateTo": <oversight level> }`
- `amount-below`: analogous, with `deEscalateTo`
- `quantity-above` / `quantity-below`: `{ "kind": "quantity-above", "value": <number>, "unit": <string>, "escalateTo": ... }`
- `category-equals`: `{ "kind": "category-equals", "value": <string>, "escalateTo": ... }`: applies to Schema.org sub-categories or DPV terms (Section 14)
- `user-type-equals`: `{ "kind": "user-type-equals", "value": "anonymous" | "authenticated" | "verified-human", "escalateTo": ... }`
- `time-of-day`: `{ "kind": "time-of-day", "outside": "08:00-20:00", "timezone": <IANA TZ>, "escalateTo": ... }`

A Publisher MAY define additional condition kinds in its own namespace, expressed as URIs in `kind`. Consumers that do not recognise a condition kind MUST treat the surrounding permission as if the condition were not present **and** SHOULD log a warning. Consumers MUST NOT attempt to evaluate unknown condition kinds.

> *Note (non-normative): JSONLogic and similar expression languages were considered for v1.1 and rejected for the normative Core. The reasons are: dependency on a single-vendor library, lack of a stable W3C or IETF reference, and the risk of producing un-auditable nested expressions. A future Module may define a richer condition language layered on top of this vocabulary.*

### 6.6 Default Permission

If a Consumer encounters an action category that is not covered by any entry in `permissions`, the Consumer MUST treat the action as unspecified. Unspecified actions are subject to the Publisher's `oversight.fallback` setting (Section 7.3); in absence of a fallback, the Consumer MUST NOT initiate state-changing, commercial, or regulated actions.

### 6.7 Conformance

- A Basic document MUST contain at least one Permission Entry. Validators MUST report an empty `permissions` as `fail`.
- A Standard document MUST satisfy Section 5.3's escalation rule and MUST declare `effect` for every Permission Entry. Validators MUST report missing `effect` as `fail` at Standard.

---

## 7. Oversight

The `oversight` member, at the document root, declares default oversight policies. Individual Permission Entries may override them.

### 7.1 Oversight Levels

Four oversight levels are defined:

- `autonomous`: the Consumer MAY proceed without contemporaneous human involvement.
- `notification`: the Consumer MUST notify a human via a declared channel before or contemporaneously with proceeding, but is not required to wait for a response.
- `confirmation`: the Consumer MUST obtain an explicit human confirmation before proceeding.
- `handover`: the Consumer MUST hand control of the interaction to a human and MUST NOT proceed autonomously.

### 7.2 Channels and Methods

An oversight directive has the structure:

```json
{
  "level": "confirmation",
  "channel": "in-band" | "out-of-band" | "either",
  "method": "ui-prompt" | "email" | "sms" | "callback" | "webhook" | "phone" | "two-factor" | "publisher-defined",
  "methodURI": "https://example.com/agent-oversight",
  "timeout": "PT5M",
  "onTimeout": "abort" | "escalate" | "proceed-with-notification"
}
```

- `level` (string, MUST): one of the four oversight levels above.
- `channel` (string, governed by Section 7.7): where the human interaction takes place.
- `method` (string, governed by Section 7.7): how the interaction is realised.
- `methodURI` (string, MUST when `method` is `publisher-defined`): HTTPS URI describing the publisher-defined method.
- `timeout` (string, MAY): ISO 8601 duration after which the directive expires.
- `onTimeout` (string, MAY): what the Consumer SHOULD do when the timeout elapses.

### 7.3 Defaults and Fallback

The root `oversight` member contains:

- `oversightDefaults` (object, MUST at Standard): a map from action `effect` values (`read-only`, `state-changing`, `commercial`, `regulated`) to oversight directives.
- `fallback` (object, MAY): the oversight directive applied to unspecified actions (see Section 6.6).

Example:

```json
"oversight": {
  "oversightDefaults": {
    "read-only": { "level": "autonomous" },
    "state-changing": { "level": "notification", "channel": "in-band", "method": "ui-prompt" },
    "commercial": { "level": "confirmation", "channel": "in-band", "method": "ui-prompt", "timeout": "PT2M" },
    "regulated": { "level": "handover", "channel": "out-of-band", "method": "phone" }
  },
  "fallback": { "level": "handover" }
}
```

### 7.4 Backward Compatibility with v1.0 `humanVerification`

A v1.0 document with `humanVerification: true` MUST be processed by v1.1 Consumers as if it had:

```json
"oversight": {
  "fallback": { "level": "confirmation", "channel": "either" }
}
```

Validators MUST issue a `warn` for v1.0 documents being processed under v1.1 rules, recommending migration to explicit `oversightDefaults`.

### 7.5 Conformance

- A Standard document MUST contain `oversightDefaults` covering at least the `state-changing` and `commercial` effect categories.
- A Consumer MUST honour `level: handover` by aborting any autonomous attempt and surfacing the handover channel to its calling human.

### 7.6 Implicit Inheritance

If a Permission Entry does not declare its own `oversight` member, it implicitly inherits `oversight.oversightDefaults[effect]` from the document root, where `effect` is the entry's `effect` value. If neither the entry nor `oversightDefaults` provides a directive for the entry's `effect`, the directive falls back to `oversight.fallback` (Section 7.3); in the absence of a fallback, Consumers MUST treat the action as `handover`.

### 7.7 Channel Requirements

For each oversight level, the `channel` member is governed as follows:

- `autonomous`: `channel` MAY be omitted.
- `notification`: `channel` MUST be present.
- `confirmation`: `channel` MUST be present.
- `handover`: `channel` MUST be present.

The `method` member SHOULD be present for `notification`, and MUST be present for `confirmation` and `handover`. When `method` is `publisher-defined`, `methodURI` MUST be present and MUST be an HTTPS URI.

### 7.8 Accessibility

Oversight methods MUST NOT depend on a single sensory modality where another modality is reasonable. In particular:

- `ui-prompt` SHOULD be operable by keyboard, screen reader, and voice-input users where the underlying site supports those modalities.
- `phone` and `sms` are dependent on auditory and textual modalities respectively and SHOULD be accompanied by an alternative `method` declared in the same `oversightDefaults` entry or in the specific Permission Entry.

See also Sections 11.6 (Internationalization) and 11.7 (Accessibility).

---

## 8. Rate Limits

The `rateLimits` member is an optional object that declares named rate-limit policies. Permission Entries reference them by name (Section 6.4).

### 8.1 Structure

```json
"rateLimits": {
  "default": { "perAgent": "60/min", "perOrigin": "600/min" },
  "checkout-default": { "perAgent": "5/min", "perOrigin": "30/min" },
  "search-default": { "perAgent": "120/min" }
}
```

Each entry is a JSON object whose values are strings of the form `<count>/<window>` where window is one of `sec`, `min`, `hour`, `day`. The keys `perAgent` and `perOrigin` are defined; additional keys MAY be used in a Publisher namespace.

### 8.2 Relationship to HTTP

Rate limits declared here are advisory. Actual enforcement, where it exists, is delivered through HTTP status codes (typically 429 [[RFC9110]]) and is out of scope of this specification. Consumers SHOULD honour declared limits to reduce friction.

### 8.3 Conformance

`rateLimits` is OPTIONAL at all Levels. A Publisher MAY omit the member entirely; in that case, declared per-permission `rateLimit` references MUST be reported by Validators as `fail` (dangling reference).

---

## 9. Discovery and Caching

### 9.1 Primary Discovery Path

The primary discovery path for an A2WF v1.1 document is:

```
/.well-known/a2wf/siteai.json
```

This path uses the `.well-known` URI mechanism defined by [[RFC8615]]. Registration of the `a2wf` well-known name with IANA is planned before this specification reaches Community Group Final Specification status; until that registration is granted, the name `a2wf` is used informally and MAY conflict with future registrations.

The document MUST be served with `Content-Type: application/json`. Consumers SHOULD accept the `charset=utf-8` media-type parameter when present.

### 9.2 Legacy Discovery Path

For backward compatibility with A2WF v1.0, a Publisher MAY continue to serve the same document at:

```
/siteai.json
```

Consumers MUST attempt the primary path first. If the primary path returns 404 or another non-success status, the Consumer SHOULD attempt the legacy path. If the legacy path returns a document, the Consumer MUST emit a deprecation warning into its own logs.

Validators that detect a Publisher serving only the legacy path MUST emit `warn`. Validators that detect a Publisher serving both paths with **different content** MUST emit `fail`.

### 9.3 Link Header

A site MAY advertise discovery via a Link header [[RFC8288]] on its root resource:

```
Link: </.well-known/a2wf/siteai.json>; rel="a2wf-policy"
```

The relation type `a2wf-policy` is informative for v1.1.

### 9.4 Caching

The `discovery` member at the document root contains caching guidance:

```json
"discovery": {
  "cache": { "maxAge": "PT1H", "mustRevalidate": false },
  "legacyPathSupported": true,
  "rotationPolicy": "publish-then-deprecate"
}
```

- `cache.maxAge` (string, SHOULD at Standard): ISO 8601 duration that Consumers SHOULD use as a maximum cache lifetime in the absence of HTTP `Cache-Control` headers.
- `cache.mustRevalidate` (boolean, MAY): if `true`, Consumers SHOULD revalidate before each non-idempotent action.

Consumers MUST respect HTTP `Cache-Control`, `Last-Modified`, and `ETag` headers when present, and use the `discovery.cache` member only as a fallback.

### 9.5 Multi-language

A Publisher operating in multiple languages SHOULD serve a single canonical document at the primary path and use Schema.org or in-document `metadata.language` indicators for human-facing strings. Per-language document variants under different URIs are not defined by this specification.

### 9.6 Conformance

- A Standard document MUST contain `discovery.cache` with at least `maxAge`.
- A Consumer MUST respect Section 9.1 and 9.2 ordering.

---

## 10. Security Considerations

A2WF declarations are advisory. The threats below MUST be considered by Publishers and Consumers.

### 10.1 Spoofed Documents

An attacker who can serve content at the discovery URI can publish a malicious A2WF Document. A Consumer MUST treat an A2WF Document as authoritative only for the origin it was fetched from, MUST require HTTPS, and MUST validate the certificate per [[RFC9110]].

### 10.2 Cache Poisoning and Stale Policy

Cached A2WF Documents may be stale relative to the Publisher's intent. Consumers MUST respect `Cache-Control` and SHOULD revalidate before high-impact actions, especially those with `effect: commercial` or `effect: regulated`.

### 10.3 Downgrade Attacks

A malicious intermediary may attempt to serve a v1.0 document in place of a v1.1 document, removing oversight requirements that the Publisher intended. A Publisher SHOULD set `discovery.legacyPathSupported: false` when it has fully migrated. Consumers MUST emit a warning when they fall back to the legacy path.

### 10.4 Malicious Endpoints

The `incidentReporting` (Section 17), `oversight.method.callback`, and similar endpoints expose URIs that a Consumer may contact. Consumers SHOULD NOT send sensitive content to such endpoints without first verifying that they are served by the same origin or by a clearly identified third party listed in the document.

### 10.5 No Authentication

A2WF is not an authentication or access-control mechanism. Conformance to A2WF does not establish trust between Consumer and Publisher. Where trust is needed, layer A2WF on top of a real authentication mechanism (TLS client auth, OAuth, HTTP Message Signatures [[RFC9421]], or similar).

### 10.6 Optional Module: Audit Trail Limitations

Section 16 (Audit Trail Light) explicitly does not define a forensic log format or cryptographic integrity. Implementers MUST NOT rely on `auditTrail` declarations as legal evidence.

---

## 11. Privacy Considerations

### 11.1 Personal Data in A2WF Documents

The `identity.contactEmail` member is processed personal data under [[GDPR]] when the email refers to a natural person. Publishers SHOULD prefer role addresses (`privacy@example.com`) over individual addresses.

### 11.2 Agent Identification and Tracking

The `agentIdentification` Module (Section 15) describes which agent-identity protocols a site accepts. It does not itself create tracking. However, when combined with logging (Section 16), repeated visits by the same agent identity can constitute tracking. Publishers using both Modules SHOULD declare retention and minimisation in `auditTrail.privacy`.

### 11.3 Data Handling Declarations

The `dataHandling` Module (Section 14) describes intended data uses. It is a declaration, not a determination of lawful basis. Publishers MUST NOT assume that the presence of `dataHandling.lawfulBasis` exempts them from any external lawful-basis determination required by law.

### 11.4 Audit Trail Privacy

Audit-trail Logs SHOULD be minimised. Where logs include personal data, retention MUST be specified in the `auditTrail.retention` member and SHOULD follow the principle of data minimisation.

### 11.5 Children and Special Categories

A Publisher whose site processes data of children, special categories of personal data, or otherwise high-risk processing SHOULD declare so in `dataHandling.categories` using the DPV vocabulary [[DPV]].

### 11.6 Internationalization Considerations

A2WF documents may contain human-readable strings (for example `identity.legalName`, `permission.notes`, `incidentReporting.languages`). The following applies:

- Language tags declared anywhere in the document MUST follow BCP 47 [[BCP47]].
- Date and time values MUST follow ISO 8601 in UTC unless an explicit time zone is given.
- Currency values MUST use ISO 4217 codes.
- Region values MUST use ISO 3166-1 alpha-2 codes (or alpha-3 where alpha-2 is ambiguous).
- Text direction is not encoded by A2WF; Consumers SHOULD detect directionality at display time using language-tag heuristics or Unicode bidirectional handling.

A Publisher MAY localise human-facing strings in a separate companion document referenced from `metadata.documentURI` of a sibling document with a different `metadata.language`. v1.1 does not normatively define the multi-language companion-document scheme.

### 11.7 Accessibility Considerations

A2WF interacts with accessibility in two ways: through oversight method declarations and through human-facing strings.

- Oversight methods (Section 7) MUST follow the modality requirements in Section 7.8.
- Publishers SHOULD design `oversightDefaults` and per-Permission `oversight` so that at least one accessible alternative is available for every state-changing or commercial action.
- Tooling that consumes or displays A2WF documents (Validator reports, Scanner adoption reports, Publisher-side authoring UIs) SHOULD follow WCAG 2.x [WCAG22] guidance to remain accessible to users with disabilities.

---

## 12. Backward Compatibility with v1.0

### 12.1 Acceptance of v1.0 Documents

A v1.1 Consumer MUST accept a document whose `specVersion` is `"1.0"`. Such documents are interpreted under v1.0 semantics, augmented as defined below.

### 12.2 Required Mappings

For a v1.0 document processed by a v1.1 Consumer, the following mappings apply:

| v1.0 member | v1.1 interpretation |
|---|---|
| `humanVerification: true` | `oversight.fallback = { "level": "confirmation", "channel": "either" }` |
| `humanVerification: false` | `oversight.fallback = { "level": "autonomous" }` |
| `extensions.dataHandling.*` | If present, interpreted under v1.0 extensions semantics; not auto-promoted to v1.1 `dataHandling` Module unless `specVersion` is updated. |
| absence of `conformance` | implicit `conformance.level = "basic"` |

### 12.3 Migration Path

A Publisher migrating from v1.0 to v1.1 MUST:

1. Add `specVersion: "1.1"`.
2. Replace any `humanVerification` boolean with an explicit `oversight` block.
3. Add `conformance.level` with at least `"basic"`.
4. Serve the document at `/.well-known/a2wf/siteai.json`.
5. Optionally continue serving the same document at `/siteai.json` for at least one Consumer caching cycle.

### 12.4 Fixtures

Section 24 (Migration Fixtures) lists testable fixtures `v10-to-v11-*.json` that Validators MUST process correctly. Validator test suites that consume these fixtures and produce the expected `pass`/`warn`/`fail` outputs are conformant.

---

# Part II: Optional Normative Modules

The Modules in Sections 13-19 are normative. A Module's requirements apply only when:

- the document includes any member defined by that Module, **or**
- the document's `conformance.moduleClaims` array contains the Module's canonical name, **or**
- a Profile that the document claims requires the Module.

A Consumer that does not implement a Module MAY ignore its members but MUST NOT misinterpret them as Core permissions (Section 2.3).

A Validator MUST validate every Module that the document uses or claims.

---

## 13. Module: Jurisdictions

Canonical name: `jurisdictions`.

### 13.1 Purpose

Declares the legal regimes that the Publisher considers applicable to the site's operation.

### 13.2 Structure

```json
"jurisdictions": [
  {
    "region": "EU",
    "isoCountry": ["AT", "DE"],
    "applicableLaws": [
      { "id": "https://w3id.org/a2wf/laws/eu/ai-act", "shortName": "EU AI Act" },
      { "id": "https://w3id.org/a2wf/laws/eu/gdpr", "shortName": "GDPR" }
    ],
    "establishmentPrimary": true
  }
]
```

- `region` (string, MUST): ISO 3166-1 alpha-2 country code, ISO 3166-2 sub-region, or a recognised supra-national region code (`EU`, `EEA`, `UK`).
- `isoCountry` (array of strings, SHOULD): explicit ISO 3166-1 alpha-2 codes when `region` is supra-national.
- `applicableLaws` (array, MAY): non-exhaustive list of laws the Publisher considers applicable. Each entry has `id` (URI) and `shortName` (string).
- `establishmentPrimary` (boolean, MAY): `true` for the principal establishment.

### 13.3 No Legal Determination

The `applicableLaws` array is a Publisher self-declaration. It MUST NOT be interpreted as a legal determination by A2WF, by Consumers, or by Validators. A Publisher's omission of a law from `applicableLaws` does not exempt the Publisher from that law where it applies.

### 13.4 Conformance

If `jurisdictions` is present, it MUST contain at least one entry, and each entry MUST contain `region`.

---

## 14. Module: Data Handling

Canonical name: `dataHandling`.

### 14.1 Purpose

Declares which categories of data the Publisher processes, for which purposes, on which lawful basis, and for how long. This module references the Data Privacy Vocabulary [[DPV]].

### 14.2 Structure

```json
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
  "controller": { "name": "ACME GmbH", "contactEmail": "dpo@acme.example" }
}
```

- `dpvProfileURI` (string, SHOULD): the DPV release the document binds to. If omitted, Validators MUST emit `warn`.
- `processing` (array, MUST): one or more processing entries.
- Each `processing` entry has:
  - `categories` (array, MUST): IRIs from DPV or another recognised vocabulary.
  - `purposes` (array, MUST): IRIs.
  - `lawfulBasis` (array, SHOULD): IRIs.
  - `retention` (string, SHOULD): ISO 8601 duration.
  - `recipients` (array, MAY): IRIs.
  - `transfers` (array, MAY): IRIs.
- `controller` (object, SHOULD): controller identification, with at least `name` and `contactEmail`.

### 14.3 Vocabulary Use

When DPV terms are used in `categories`, `purposes`, `lawfulBasis`, `recipients`, or `transfers`, the Publisher MUST use IRIs as defined by the referenced DPV release. Validators MUST validate term syntax but MUST NOT infer legal compliance from the presence of DPV terms.

A Publisher MAY use terms from other recognised vocabularies (for example sector-specific privacy ontologies) by using fully-qualified URIs. Consumers that do not recognise a vocabulary MUST treat the entry as opaque.

### 14.4 Disclaimer

> *Note (non-normative): The presence of `dataHandling` does not constitute compliance with GDPR, the EU AI Act, or any other regulation. It exposes machine-readable declarations that may support a Publisher's transparency workflow under such regulations.*

### 14.5 Conformance

If `dataHandling` is present, `processing` MUST contain at least one entry, and each entry MUST have `categories` and `purposes`. Validators MUST report missing required members as `fail`.

---

## 15. Module: Agent Identification

Canonical name: `agentIdentification`.

### 15.1 Purpose

Declares which agent-identity, credential, and authentication mechanisms the Publisher is prepared to accept. A2WF does **not** define a universal agent-identity protocol; it allows declaration of others.

### 15.2 Structure

```json
"agentIdentification": {
  "acceptedProtocols": [
    {
      "id": "did-core-1.0",
      "name": "W3C Decentralized Identifiers (DIDs) v1.0",
      "specification": "https://www.w3.org/TR/did-core/",
      "status": "stable",
      "purpose": "identifier-resolution",
      "version": "1.0"
    },
    {
      "id": "vc-data-model-2.0",
      "name": "W3C Verifiable Credentials Data Model 2.0",
      "specification": "https://www.w3.org/TR/vc-data-model-2.0/",
      "status": "stable",
      "purpose": "credential-presentation",
      "version": "2.0"
    },
    {
      "id": "http-message-signatures",
      "name": "HTTP Message Signatures",
      "specification": "https://www.rfc-editor.org/rfc/rfc9421",
      "status": "stable",
      "purpose": "request-authentication"
    },
    {
      "id": "oauth-2.0",
      "name": "OAuth 2.0",
      "specification": "https://www.rfc-editor.org/rfc/rfc6749",
      "status": "stable",
      "purpose": "delegated-authorization"
    },
    {
      "id": "oauth-2.1-draft",
      "name": "OAuth 2.1",
      "specification": "https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/",
      "status": "experimental",
      "purpose": "delegated-authorization",
      "version": "draft-ietf-oauth-v2-1",
      "expiry": "2026-12-01"
    },
    {
      "id": "aip-draft-00",
      "name": "Agent Identity Protocol (IETF)",
      "specification": "https://datatracker.ietf.org/doc/draft-cao-arango-aip/00/",
      "status": "experimental",
      "purpose": "agent-identity",
      "version": "draft-cao-arango-aip-00",
      "expiry": "2026-11-15"
    }
  ],
  "requiredFor": ["commercial", "regulated"]
}
```

- `acceptedProtocols` (array, MUST): one or more accepted-protocol entries.
- Each protocol entry has:
  - `id` (string, MUST): stable identifier.
  - `name` (string, SHOULD): human-readable name.
  - `specification` (string, SHOULD): URL.
  - `status` (string, MUST): one of `stable`, `experimental`, `deprecated`.
  - `purpose` (string, SHOULD): one of `identifier-resolution`, `credential-presentation`, `request-authentication`, `delegated-authorization`, `agent-identity`, `publisher-defined`.
  - `version` (string, SHOULD when `status` is `experimental`).
  - `expiry` (string, MAY): ISO date when an experimental draft is expected to expire.
- `requiredFor` (array, MAY): list of `effect` categories from Section 6.3 for which the Publisher requires agent identification.

### 15.3 Experimental Protocols

A protocol entry with `status: "experimental"` MUST be pinned to a specific draft version. Consumers MUST NOT assume compatibility with later drafts. Validators MUST emit `warn` if an experimental entry lacks `version` or `expiry`.

### 15.4 Identifier vs Authenticator

A2WF distinguishes between identifier resolution (e.g. resolving a DID to a DID Document) and authentication of a request (e.g. HTTP Message Signatures or OAuth). A Publisher SHOULD declare both kinds when relevant. Consumers MUST NOT treat the mere presence of a DID as authentication of the agent making a request.

### 15.5 Conformance

If `agentIdentification` is present, `acceptedProtocols` MUST contain at least one entry, and each entry MUST contain `id` and `status`.

---

## 16. Module: Audit Trail (Light)

Canonical name: `auditTrail`.

### 16.1 Purpose

Declares whether and how the Publisher maintains an audit trail of agent interactions, and which audit profile (if any) the trail follows. This module declares **capabilities**, not evidence.

### 16.2 Structure

```json
"auditTrail": {
  "enabled": true,
  "events": [
    "policy-discovered",
    "policy-evaluated",
    "permission-decision",
    "oversight-requested",
    "oversight-completed",
    "agent-authentication-attempted",
    "rate-limit-applied",
    "incident-reported"
  ],
  "retention": "P90D",
  "exportFormats": ["application/x-ndjson", "application/json"],
  "accessEndpoint": "https://acme.example/.well-known/a2wf/audit-export",
  "privacy": { "pseudonymise": true, "minimise": true },
  "integrity": "http-message-signature",
  "profiles": []
}
```

- `enabled` (boolean, MUST): whether the Publisher maintains an audit trail.
- `events` (array, SHOULD when `enabled` is `true`): the event categories logged.
- `retention` (string, SHOULD when `enabled`): ISO 8601 duration.
- `exportFormats` (array, MAY): media types in which logs can be exported.
- `accessEndpoint` (string, MAY): declared endpoint, if any, at which Publisher-defined log-access mechanisms operate. The request semantics, authentication, and content negotiation are out of scope for this specification.
- `privacy` (object, SHOULD when logs contain personal data): minimisation flags.
- `integrity` (string, MAY): one of `none`, `http-message-signature`, `w3c-data-integrity`, `aivs-compatible`, or `publisher-defined`.
- `profiles` (array, MAY): URIs of external audit profiles (for example AIVS) to which the trail claims compatibility.

### 16.3 No Forensic Format

A2WF v1.1 does not define a forensic log format and does not require cryptographic log integrity. Publishers MAY declare compatibility with external audit formats by listing profile URIs in `auditTrail.profiles`.

A Publisher MUST NOT claim that A2WF `auditTrail` declarations alone constitute legal evidence. Consumers and Validators MUST NOT present `auditTrail` declarations as evidence of legal compliance or forensic integrity.

### 16.4 Forward Path to External Profiles

When external audit-integrity standards (such as AIVS) stabilise, future A2WF versions or external profiles MAY define normative bindings. Today, such bindings are declared via `auditTrail.profiles` and validated by Validators that recognise those profile URIs.

### 16.5 Conformance

If `auditTrail` is present, `enabled` MUST be set. When `enabled` is `true`, `events` SHOULD be set; if absent, Validators MUST emit `warn`. When `integrity` is `aivs-compatible` or another external profile, the corresponding profile URI MUST appear in `profiles`.

---

## 17. Module: Incident Reporting

Canonical name: `incidentReporting`.

### 17.1 Purpose

Declares where and how to report A2WF-related incidents (policy violations, suspected spoofing, oversight failures).

### 17.2 Structure

```json
"incidentReporting": {
  "contactEmail": "abuse@acme.example",
  "endpoint": "https://acme.example/.well-known/a2wf/incident",
  "responseTime": "P3D",
  "languages": ["en", "de"]
}
```

- `contactEmail` (string, MUST when the module is used): RFC 5322 address.
- `endpoint` (string, MAY): HTTPS URL accepting POST of a JSON incident report.
- `responseTime` (string, SHOULD): ISO 8601 duration that the Publisher declares as an intended acknowledgement timeframe. This is a declaration, not a legal commitment.
- `languages` (array, MAY): BCP 47 tags.

### 17.3 Relationship to security.txt

A Publisher who already maintains a `security.txt` [[RFC9116]] file MAY reference it from `relatedSignals` (Section 21) and omit `incidentReporting`. If both are present, the Publisher SHOULD ensure consistency.

### 17.4 Conformance

If `incidentReporting` is present, `contactEmail` MUST be set.

---

## 18. Module: Discoverability Hints

Canonical name: `discoverabilityHints`.

### 18.1 Purpose

Declares advisory metadata that helps AI-agent crawlers and indexers find machine-readable interfaces on the site. This Module deliberately does **not** define a ranking signal or SEO metric.

### 18.2 Structure

```json
"discoverabilityHints": {
  "sitemapURI": "https://acme.example/sitemap.xml",
  "schemaOrgActions": [
    "https://acme.example/#search-action",
    "https://acme.example/#buy-action"
  ],
  "llmsTxtURI": "https://acme.example/llms.txt",
  "aiPreferencesURI": "https://acme.example/.well-known/ai.txt",
  "tdmReservationURI": "https://acme.example/.well-known/tdmrep.json"
}
```

All members are OPTIONAL. Each is a URI pointing to an existing machine-readable resource.

### 18.3 No Override

Hints are advisory discovery metadata. They MUST NOT override [[RFC9309]] (robots.txt), authorisation requirements, legal restrictions, or content-level AI-preference signals (see Section 22 for conflict resolution).

### 18.4 No Score

A2WF Validators and Scanners MUST NOT derive a "discoverability score" or comparable single-number metric from this Module. Vendors that wish to publish such metrics MUST do so under their own product names and MUST NOT label them as A2WF conformance signals.

### 18.5 Conformance

If `discoverabilityHints` is present, at least one of the members in Section 18.2 MUST be present and MUST be a valid HTTPS URI.

---

## 19. Module: Code of Practice Alignment

Canonical name: `codeOfPracticeAlignment`.

### 19.1 Purpose

Declares the Publisher's claimed alignment with one or more codes of practice or regulatory guidelines. The canonical example is the EU General-Purpose AI Code of Practice; this Module is designed to support other codes via a registry pattern.

### 19.2 Structure

```json
"codeOfPracticeAlignment": [
  {
    "codeId": "https://w3id.org/a2wf/cop/eu-gp-ai",
    "shortName": "EU General-Purpose AI Code of Practice",
    "claimedSections": ["transparency", "training-data-summary"],
    "version": "2026-draft",
    "statementURI": "https://acme.example/legal/cop-eu-gp-ai-statement"
  }
]
```

- `codeId` (string, MUST): URI of the code.
- `shortName` (string, SHOULD): human-readable name.
- `claimedSections` (array, MAY): section identifiers within the code.
- `version` (string, SHOULD): version of the code being claimed.
- `statementURI` (string, MAY): URL of a longer human-readable alignment statement.

### 19.3 Conditional Use

If a document's `jurisdictions` Module declares `region: "EU"` and `applicableLaws` includes the EU AI Act (`https://w3id.org/a2wf/laws/eu/ai-act`), and the Publisher is itself a provider of general-purpose AI models or systems under the EU AI Act, and the Publisher chooses to use this Module, the Publisher SHOULD include at least one alignment entry whose `codeId` is the EU General-Purpose AI Code of Practice.

Publishers that are not GPAI providers (for example operators of regulated sites such as healthcare, finance, or e-commerce that merely fall under the AI Act in other respects) SHOULD NOT claim alignment with the GPAI Code of Practice. They MAY use this Module to claim alignment with other codes relevant to their sector.

### 19.4 No Certification

This Module does not certify alignment. Validators MUST validate only the presence and syntax of declared alignment entries; they MUST NOT assess whether the Publisher actually complies with the external code.

### 19.5 Conformance

If present, at least one entry MUST contain `codeId`.

---

# Part III: Registry, Examples, and Conflict Resolution

The sections in Part III are non-normative **except where explicitly marked normative**. Section 22 (Conflict Resolution) is normative for Consumers; the remaining sections are informative.

## 20. Standards Reference Matrix

This section is non-normative. It classifies the external standards referenced by this specification.

### 20.1 Normative Dependencies

These standards are required to implement A2WF v1.1 Core.

| Standard | Reference | Use |
|---|---|---|
| BCP 14 | [[RFC2119]] [[RFC8174]] | Requirement keywords |
| JSON | [[RFC8259]] | Document syntax |
| HTTPS | [[RFC9110]] | Transport |
| `.well-known` | [[RFC8615]] | Discovery |
| Web Linking | [[RFC8288]] | Discovery (Link header) |
| BCP 47 | [[BCP47]] | Language tags |
| ISO 3166-1/2 | ISO | Region codes |
| ISO 8601 | ISO | Dates and durations |
| ISO 4217 | ISO | Currency codes |
| RFC 5322 | [[RFC5322]] | Email |
| RFC 9309 | [[RFC9309]] | robots.txt (referenced from Section 22) |

### 20.2 Conditional Normative Dependencies

These standards become normative when the corresponding Module is used.

| Standard | Reference | Module |
|---|---|---|
| DPV 2.x | [[DPV]] | Section 14 (Data Handling) |
| Schema.org Actions | [[SCHEMA-ORG]] | Section 6 (Permissions, `schemaOrgType`) |
| DID Core | [[DID-CORE]] | Section 15 (Agent Identification) |
| VC Data Model 2.0 | [[VC-DATA-MODEL-2.0]] | Section 15 (Agent Identification) |
| HTTP Message Signatures | [[RFC9421]] | Section 15 (Agent Identification), Section 16 (Audit Trail integrity) |
| RFC 9116 (security.txt) | [[RFC9116]] | Section 17 (Incident Reporting) |

### 20.3 Experimental Compatibility

These standards are referenced for compatibility only. A2WF v1.1 does not require their implementation, and pinning is by draft version.

| Standard | Status | Section |
|---|---|---|
| Agent Identity Protocol (AIP) | IETF Internet-Draft | §15 |
| AI Verifiable Statements (AIVS) | IETF Internet-Draft | §16 (via `auditTrail.profiles`) |
| EU General-Purpose AI Code of Practice | Draft, 2026 | §19 |
| VCAP (Verifiable Commerce) | IETF Internet-Draft | Out of scope for v1.1 |
| ODRL Information Model 2.2 | [[ODRL]] (W3C Rec) | Future companion profile |

### 20.4 Informative Context

These standards are referenced for context only.

| Standard | Reference |
|---|---|
| NLWeb | Microsoft / community |
| Model Context Protocol (MCP) | Anthropic / community |
| W3C WebAgents CG outputs | W3C CG |
| W3C Agent Identity Protocol CG outputs | W3C CG |
| W3C Semantic Agent Communication CG outputs | W3C CG |
| IETF AI Preferences (`aipref`) | IETF (referenced in §22) |
| TDMRep | Text and Data Mining Reservation Protocol |
| llms.txt | community draft |
| sitemap.xml | sitemaps.org |
| IndexNow | community |

---

## 21. Related Signals

This section is non-normative.

The `relatedSignals` member at the document root provides pointers to other machine-readable signals at the same origin:

```json
"relatedSignals": {
  "robotsTxt": "https://acme.example/robots.txt",
  "llmsTxt": "https://acme.example/llms.txt",
  "securityTxt": "https://acme.example/.well-known/security.txt",
  "aiPreferences": "https://acme.example/.well-known/ai.txt",
  "tdmRep": "https://acme.example/.well-known/tdmrep.json",
  "sitemap": "https://acme.example/sitemap.xml"
}
```

A Consumer MAY use these pointers to fetch and reconcile signals. Section 22 defines conflict resolution.

---

## 22. Conflict Resolution (Normative)

This section is normative for Consumers that fetch multiple signals.

When a Consumer holds an A2WF Document together with other site-level signals, the following precedence applies for the action category each signal addresses:

### 22.1 Crawling and Indexing

- `robots.txt` [[RFC9309]] governs crawling. A2WF MUST NOT be interpreted as overriding `robots.txt` for crawling purposes.
- A2WF `discoverabilityHints` (Section 18) is advisory and MUST NOT override `robots.txt`.

### 22.2 AI Training and Text-and-Data Mining

- IETF AI Preferences (`aipref`), once stable, and TDMRep govern training-data and text-and-data-mining preferences.
- A2WF defers to these signals where they exist. A2WF `dataHandling` (Section 14) is about the Publisher's own data processing, not about third-party training; the two SHOULD be kept distinct.

### 22.3 Agent Actions on the Site

- A2WF is the authoritative A2WF signal for declared site-action policy.
- A2WF does not override authentication, law, contract, or enforcement layers; it provides the declared policy that those layers may consult.

### 22.4 Authentication and Access Control

- TLS, OAuth, HTTP Message Signatures, and HTTP authorisation responses are authoritative for access control.
- A2WF `agentIdentification` (Section 15) declares accepted protocols but does not itself grant access.

### 22.5 Where Signals Conflict

Where two signals appear to conflict, Consumers MUST apply the more restrictive setting **for that action category** and SHOULD log the conflict for operator review.

---

## 23. Examples

This section is non-normative.

### 23.1 A2WF Action Vocabulary (Curated Subset)

A curated, non-exclusive vocabulary of action identifiers. Publishers MAY use these or define their own as URIs.

| Action | Schema.org Type | Typical `effect` |
|---|---|---|
| `search` | `SearchAction` | `read-only` |
| `view` | `ViewAction` | `read-only` |
| `purchase` | `BuyAction` | `commercial` |
| `subscribe` | `SubscribeAction` | `commercial` |
| `register` | `RegisterAction` | `state-changing` |
| `comment` | `CommentAction` | `state-changing` |
| `review` | `ReviewAction` | `state-changing` |
| `download` | `DownloadAction` | `read-only` |
| `share` | `ShareAction` | `state-changing` |
| `book` | `ReserveAction` | `commercial` |
| `cancel` | `CancelAction` | `state-changing` |
| `pay` | `PayAction` | `commercial` |
| `consent` | `AgreeAction` | `regulated` |
| `medical-record-access` | `ViewAction` | `regulated` |
| `financial-transaction` | `TransferAction` | `regulated` |
| `data-export` | `DownloadAction` | `regulated` |
| `account-delete` | `DeleteAction` | `state-changing` |
| `chat` | `CommunicateAction` | `read-only` |
| `report-incident` | `ReportAction` | `state-changing` |
| `legal-acknowledgement` | `AgreeAction` | `regulated` |

### 23.2 Basic Example: A Small Business Site

See `examples/v1.1/sme-basic.json` (companion file in the repository).

### 23.3 Standard Example: An E-Commerce Site

See `examples/v1.1/ecommerce-standard.json` (companion file in the repository).

### 23.4 Profile-Claiming Example: A Healthcare Site

See `examples/v1.1/healthcare-eu-governance-profile.json` (companion file in the repository).

---

## 24. Migration Fixtures

This section is non-normative.

The repository's `tests/fixtures/migration/` directory is planned to contain the following testable migration fixtures. Each fixture pairs a v1.0 input with a v1.1 expected validator output. Fixtures will be added before this specification reaches Community Group Final Specification status:

- `v10-to-v11-human-verification-true.{input,expected}.json`
- `v10-to-v11-human-verification-false.{input,expected}.json`
- `v10-to-v11-extensions-data-handling.{input,expected}.json`
- `v10-to-v11-missing-conformance.{input,expected}.json`
- `v10-to-v11-legacy-discovery-only.{input,expected}.json`

A Validator that consumes these inputs and produces matching outputs conforms to Section 12.

---

## 25. Future Compatibility

This section is non-normative.

A2WF intends to grow through Profiles and through future Modules. The following are planned but not part of v1.1:

- A normative ODRL Profile of A2WF for sites that wish to express policies in ODRL terms.
- An AIVS Audit Profile defining the binding from `auditTrail` to AIVS once AIVS stabilises.
- An AIP Identity Profile defining the binding from `agentIdentification` to AIP once AIP stabilises.
- A Verifiable Commerce (VCAP) Profile for agentic-commerce flows.
- An A2WF Agentic Arbitration Profile for dispute resolution.

External vendors and community groups are encouraged to publish Profiles that bundle Modules for specific markets. The "A2WF EU Governance Starter Profile" is one such example, distributed alongside this specification in `profiles/eu-governance-starter.md`.

---

## Acknowledgements

Thanks to the W3C AIKR Community Group (Paola Di Maio, chair) for the standards-intersection inventory that informed Sections 13 to 19, to Ian Jacobs (W3C) for v1.0 feedback, and to community reviewers for critical reviews of v1.1.

---

## References

### Normative References

- [[!RFC2119]] Bradner, S. "Key words for use in RFCs to Indicate Requirement Levels". BCP 14, RFC 2119, March 1997.
- [[!RFC8174]] Leiba, B. "Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words". BCP 14, RFC 8174, May 2017.
- [[!RFC5322]] Resnick, P. (ed.). "Internet Message Format". RFC 5322, October 2008.
- [[!RFC8259]] Bray, T. (ed.). "The JavaScript Object Notation (JSON) Data Interchange Format". STD 90, RFC 8259, December 2017.
- [[!RFC8288]] Nottingham, M. "Web Linking". RFC 8288, October 2017.
- [[!RFC8615]] Nottingham, M. "Well-Known Uniform Resource Identifiers (URIs)". RFC 8615, May 2019.
- [[!RFC9110]] Fielding, R., Nottingham, M., Reschke, J. "HTTP Semantics". RFC 9110, June 2022.
- [[!RFC9309]] Koster, M., Illyes, G., Zeller, H., Sassman, L. "Robots Exclusion Protocol". RFC 9309, September 2022.
- [[!BCP47]] Phillips, A., Davis, M. "Tags for Identifying Languages". BCP 47.

### Conditional Normative References

- [[DPV]] W3C Data Privacy Vocabulary, version 2.x. https://w3id.org/dpv
- [[SCHEMA-ORG]] Schema.org. https://schema.org/
- [[DID-CORE]] W3C Decentralized Identifiers (DIDs) v1.0. https://www.w3.org/TR/did-core/
- [[VC-DATA-MODEL-2.0]] W3C Verifiable Credentials Data Model v2.0. https://www.w3.org/TR/vc-data-model-2.0/
- [[RFC9421]] Backman, A., Richer, J., Sporny, M. "HTTP Message Signatures". RFC 9421, February 2024.
- [[RFC9116]] Foudil, E., Shafranovich, Y. "A File Format to Aid in Security Vulnerability Disclosure". RFC 9116, April 2022.

### Informative References

- [[ODRL]] W3C ODRL Information Model 2.2. https://www.w3.org/TR/odrl-model/
- [[GDPR]] Regulation (EU) 2016/679.
- [[AIPREF]] IETF AI Preferences working group output (in progress).
- [[TDMRep]] Text and Data Mining Reservation Protocol (W3C CG output).
- [[ISO17442]] ISO 17442 - Legal Entity Identifier.

---

*End of A2WF v1.1.0-draft.2 - Editor's Draft, 2026-05-16.*
