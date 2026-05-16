# A2WF EU Governance Starter Profile, Version 1.0

**Profile URI:** `https://a2wf.org/profiles/eu-governance-starter/v1`

**Status:** Editor's Draft, 2026-05-16. Published as a companion to the A2WF v1.1 specification.

**Owner:** A2WF Community Group (proposed).

**Relationship to A2WF v1.1:** This document defines a Profile in the sense of A2WF v1.1 Section 2.6. It bundles a set of Optional Normative Modules and adds further constraints. It does not modify the A2WF v1.1 Core.

**License:** The text of this document is made available under the [W3C Software and Document License](https://www.w3.org/copyright/software-license-2023/).

---

## 1. Purpose

The EU Governance Starter Profile provides a single, machine-readable bundle that allows a website operating in the European Union to publish, in one A2WF document, the declarations most commonly requested by EU-facing governance, transparency, and AI-policy workflows. These include:

- jurisdictional declarations,
- machine-readable data-handling declarations referencing DPV terminology,
- accepted agent-identification protocols,
- audit-trail capabilities (light),
- incident-reporting endpoints, and
- discoverability hints for machine-readable interfaces.

This profile **does not** make A2WF declarations a substitute for legal advice, certification, or audit. It defines a structural baseline that operators can use to expose machine-readable transparency, and that downstream tools and resellers can use as a starting point for their own products.

---

## 2. Non-Claims

The profile and any conforming A2WF document MUST NOT be interpreted as:

- a determination of legal compliance with GDPR, the EU AI Act, the Digital Services Act, the Data Act, the Cyber Resilience Act, sector regulations, or national implementations of any of the foregoing;
- a certification of organisational compliance with any code of practice, including the EU General-Purpose AI Code of Practice;
- evidence of audit integrity in a forensic or evidential sense;
- a substitute for the publisher's own risk assessment, data-protection-impact assessment, or AI governance framework.

The profile is a **declaration scaffold**. Legal effect is created by the publisher's underlying contracts, processes, technical safeguards, and statutory obligations, not by the A2WF document.

---

## 3. Required A2WF Core State

A document conforming to this profile MUST be a valid A2WF v1.1 document at level `standard` (Section 5.3 of the Core specification).

Required Core members:

- `specVersion`: `"1.1"`
- `identity`: see Section 6 below for additional constraints
- `conformance`:
  - `level`: `"standard"`
  - `moduleClaims`: MUST include `jurisdictions`, `dataHandling`, `agentIdentification`, `auditTrail`, `incidentReporting`, `discoverabilityHints`
  - `profileClaims`: MUST include `"https://a2wf.org/profiles/eu-governance-starter/v1"`
- `permissions`: at least one entry; every entry with `effect` in {`state-changing`, `commercial`, `regulated`} MUST resolve oversight per Core §7.6
- `oversight`: `oversightDefaults` MUST cover `state-changing`, `commercial`, and `regulated`
- `discovery`: `cache.maxAge` MUST be present
- `metadata`: `lastUpdated` MUST be present
- `relatedSignals`: SHOULD reference at least `robotsTxt` and `securityTxt`

---

## 4. Required Modules

### 4.1 `jurisdictions`

MUST include at least one entry whose `region` is one of: `EU`, `EEA`, or a member-state ISO 3166-1 alpha-2 code.

MUST include `establishmentPrimary: true` on exactly one entry.

`applicableLaws` SHOULD include at minimum:
- `{ "id": "https://w3id.org/a2wf/laws/eu/gdpr", "shortName": "GDPR" }`
- and one of: EU AI Act, Digital Services Act, Data Act, Cyber Resilience Act - whichever the publisher considers relevant.

`applicableLaws` MUST NOT be presented as exhaustive. The Core disclaimer in Section 13.3 applies.

### 4.2 `dataHandling`

MUST include `dpvProfileURI` set to a DPV 2.x release URI.

`processing` MUST include at least one entry whose `categories` and `purposes` use DPV IRIs.

`controller` MUST be present with at least `name` and `contactEmail`.

`processing[*].retention` SHOULD be present using ISO 8601 durations.

`processing[*].lawfulBasis` SHOULD be present using DPV IRIs where available.

Validators of this profile MUST report missing required fields as `fail` and MUST NOT report syntactically valid entries as `pass` for legal-compliance purposes.

### 4.3 `agentIdentification`

`acceptedProtocols` MUST include at least one entry with `status: "stable"`. Recommended stable entries include:
- W3C DID Core 1.0 (identifier-resolution)
- W3C VC Data Model 2.0 (credential-presentation)
- HTTP Message Signatures, RFC 9421 (request-authentication)
- OAuth 2.0, RFC 6749 (delegated-authorization)

Experimental entries (for example AIP) are permitted but MUST be draft-pinned with a `version` and SHOULD include an `expiry`.

`requiredFor` SHOULD list at least `regulated`.

### 4.4 `auditTrail` (Light)

`enabled` MUST be `true` for documents claiming this profile.

`events` MUST contain at least:
- `policy-discovered`
- `permission-decision`
- `oversight-requested`
- `oversight-completed`

`retention` MUST be present. The duration is publisher-defined and SHOULD be justified by the publisher's data-minimisation analysis. A value of `P12M` is shown in examples elsewhere in the A2WF repository as a non-binding illustration only; it is not a default and is not a recommended value.

`privacy` MUST be present with `minimise: true`.

`integrity` MAY be any value defined in Core §16.2; this profile does not require a specific integrity model.

`accessEndpoint` is OPTIONAL. The semantics of access at that endpoint are out of scope.

### 4.5 `incidentReporting`

MUST be present.

`contactEmail` MUST be present.

`responseTime` SHOULD be present and SHOULD declare an intended acknowledgement timeframe. This declaration is not a statutory breach-notification deadline (compare GDPR Art. 33's 72-hour rule) and MUST NOT be presented as such.

`languages` SHOULD include `en` and SHOULD include at least one BCP 47 tag corresponding to the publisher's primary establishment language.

### 4.6 `discoverabilityHints`

MUST be present.

MUST include at least one of: `sitemapURI`, `schemaOrgActions`, `llmsTxtURI`, `aiPreferencesURI`, or `tdmReservationURI`.

For most EU sites, the recommended minimum is `sitemapURI` plus `aiPreferencesURI` once the IETF `aipref` work stabilises.

---

## 5. Optional Modules

### 5.1 `codeOfPracticeAlignment`

A document conforming to this profile MAY include `codeOfPracticeAlignment`. If included for the EU General-Purpose AI Code of Practice, the conditional rule in Core §19.3 applies.

This profile does not require alignment claims. Alignment is a separate publisher decision and not part of the Starter baseline.

---

## 6. Identity Constraints

`identity.legalName` MUST be the registered legal name of the data controller for the site.

`identity.contactEmail` SHOULD be a role address (for example `privacy@example.com`) rather than an individual.

`identity.jurisdictionPrimary` MUST be present and SHOULD be the ISO 3166-1 alpha-2 code of the controller's primary establishment.

`identity.legalEntityIdentifier` MAY be included; for EU regulated entities (financial services, medical devices, AI Act high-risk operators) it is RECOMMENDED.

`identity.representatives` SHOULD include a DPO entry where the publisher has appointed one.

---

## 7. Validator Behaviour

A Validator that claims to validate this profile MUST:

1. First validate the document against A2WF v1.1 Core.
2. Then validate the additional profile requirements in Sections 3, 4, and 6.
3. Report findings as `pass`, `warn`, or `fail` per Core §2.4.
4. Emit a `fail` if the document claims this profile in `conformance.profileClaims` but is missing one or more profile-required modules (consistent with A2WF v1.1 Core §5.6).
5. Emit a `fail` if any required module field is absent or syntactically invalid.

A Validator MUST NOT emit a numeric "compliance score" or "readiness score" from this profile. Aggregate counts of `pass`/`warn`/`fail` per module are permitted.

Validators MAY emit a profile-specific finding identifier prefix `eu-gov-starter.*` to distinguish profile findings from Core findings.

---

## 8. Versioning

This profile uses an additive versioning policy:

- A profile minor version (`v1.1`, `v1.2`, ...) MAY add new required fields if they are also added as optional or recommended in the underlying A2WF Core release. Existing documents that conformed to `v1` continue to conform to `v1` URIs even when `v1.1` exists.
- A profile major version (`v2`) MAY redefine required fields. Major versions get a new profile URI.
- The profile URI in `profileClaims` MUST be the exact URI a publisher claims to conform to.

---

## 9. Relationship to Vendor Products

The "A2WF EU Governance Starter Profile" is a neutral profile published alongside the A2WF v1.1 specification. Any vendor MAY implement, validate, host, or provide tooling for this profile without exclusivity or endorsement.

Conformance rules for vendor wrappings:

1. Vendor products MAY reference this profile URI as the underlying technical baseline.
2. Vendor-specific extensions MUST NOT be required for profile conformance. A document produced or hosted by a vendor MUST remain valid under a generic Validator that has no vendor-specific knowledge.
3. Vendor products MUST use their own product name for the offering as a whole.
4. Vendor products MUST NOT claim that conformance to this profile alone constitutes legal compliance with EU regulations.
5. Vendor products MUST NOT use the W3C name, logos, or "official partner / endorsed by W3C / approved by W3C" wording in connection with this profile.

Derivative profiles:

- A derivative profile that claims compatibility with this profile MUST be at least as strict, MUST be published under a different URI, and MUST acknowledge the base profile.
- An independent profile that addresses a different scope MAY define a different baseline. It MUST NOT claim this profile's URI.

Customer portability:

- A Publisher hosting an A2WF document through a vendor MUST be able to export the raw JSON document, host it under its own origin at `/.well-known/a2wf/siteai.json`, and continue to validate the document with any A2WF v1.1 Validator. Vendor lock-in patterns that prevent this are inconsistent with this profile.

---

## 10. Change Log

- **2026-05-16, v1 Editor's Draft:** Initial publication as companion to A2WF v1.1.0-draft.2.

---

## 11. Acknowledgements

This profile incorporates feedback from the W3C AIKR Community Group standards-intersection inventory and community reviewers.

---

## References

- A2WF v1.1 specification: `../spec/specification-v1.1-draft.2.md`
- W3C Data Privacy Vocabulary (DPV) 2.x: https://w3id.org/dpv
- W3C Decentralized Identifiers (DIDs) v1.0: https://www.w3.org/TR/did-core/
- W3C Verifiable Credentials Data Model v2.0: https://www.w3.org/TR/vc-data-model-2.0/
- HTTP Message Signatures, RFC 9421: https://www.rfc-editor.org/rfc/rfc9421
- OAuth 2.0, RFC 6749: https://www.rfc-editor.org/rfc/rfc6749
- Regulation (EU) 2016/679 (GDPR)
- Regulation (EU) 2024/1689 (EU AI Act)
- Regulation (EU) 2022/2065 (Digital Services Act)

*End of A2WF EU Governance Starter Profile v1 Editor's Draft, 2026-05-16.*
