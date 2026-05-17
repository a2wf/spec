# A2WF v1.1 - W3C Community Group Meeting

**Date:** 2026-05-27
**Editor:** Wolfgang Wimmer (SSC)
**Status:** Editor's Draft (v1.1.0-draft.2), not stable, not W3C-endorsed
**Community Group:** Proposed, not yet chartered
**Repo:** https://github.com/a2wf/spec
**Live tools:** https://a2wf.github.io/spec/tools/
**Live slides:** https://a2wf.github.io/spec/slides/cg-meeting-2026-05-27/

---

## Slide 1 - Title and status

**Agent-to-Website Framework v1.1**
*A machine-readable policy format for AI-agent governance on websites*

- A2WF pre-Community-Group community review (2026-05-27)
- **Status:** Editor's Draft (v1.1.0-draft.2), not stable, not W3C-endorsed
- The A2WF Community Group is *proposed*, not yet chartered
- v1.0 has been published as informational reference (https://a2wf.org)
- All artefacts under MIT licence

Speaker notes:
- Frame this as "we have done the homework, now we want community ownership"
- Be explicit: A2WF Community Group is "proposed", not yet chartered
- Acknowledge prior input from Paola Di Maio (AIKR CG) and Ian Jacobs (W3C)
- Press S for speaker view

---

## Slide 2 - Why v1.1?

**v1.0 was a one-page declaration. v1.1 makes it operational.**

What v1.0 could not express:
- Nuanced human oversight (`oversight.level`: autonomous / confirmation / notification / handover)
- Machine-readable jurisdictional declarations (`jurisdictions.applicableLaws`)
- Agent identification protocols (DID, VC, HTTP Message Signatures, OAuth)
- Data-handling transparency (DPV alignment)
- Incident-reporting contact and intended timeframe
- Discovery hints (Schema.org Actions, sitemap, rate limits)
- Audit-trail declarations
- Security, Privacy, Internationalisation, and Accessibility Considerations (Sections 10/11)

Liaison feedback that drove v1.1:
- Paola Di Maio (W3C AIKR CG): "use ODRL, reuse Schema.org, link to agent-identity standards"
- Ian Jacobs (W3C Staff): "discovery via /.well-known, not site root"

---

## Slide 3 - Three-layer architecture

```
+----------------------------------+
| Profiles  (e.g. EU Governance Starter)
+----------------------------------+
| Modules   (7 optional, normative)
+----------------------------------+
| Core      (identity, permissions, oversight, discovery)
+----------------------------------+
```

**Related precedents in W3C and adjacent ecosystems:**
ODRL Core + Profiles, DID Core + Method Specs, WebAuthn Core + Extensions, WCAG Levels.
W3C specs commonly use related variability patterns; the W3C QA Framework recognises profiles, modules, and levels as legitimate techniques.

Why three layers and not flat?
- Core stays small enough to be implementable by every operator
- Modules are opt-in and bring domain depth where needed
- Profiles bundle modules for specific markets without forcing global complexity

Speaker notes:
- Be ready for "why not just use ODRL directly?" - answer: ODRL is a strong abstract policy model; A2WF is a low-friction website declaration format. A normative ODRL profile of A2WF is a v1.2 candidate.
- Do not oversell WCAG as a "module" precedent - it is a Levels precedent only.

---

## Slide 4 - Standards re-use, not re-invention

A2WF v1.1 references and aligns with:

| Standard | Used for | Status in A2WF v1.1 |
|---|---|---|
| Schema.org Actions | `permissions[].schemaOrgType` | Conditional normative |
| W3C DID Core | Agent identity resolution | Conditional normative (agentIdentification) |
| W3C VC Data Model 2.0 | Agent credentials | Conditional normative (agentIdentification) |
| HTTP Message Signatures (RFC 9421) | Request authentication | Conditional normative (agentIdentification, auditTrail) |
| OAuth 2.0 (RFC 6749) | Delegated authorisation | Conditional normative (agentIdentification) |
| W3C ODRL 2.2 | Architectural precedent | Informative; companion profile is a v1.2 candidate |
| W3C DPV 2.x | Data-handling vocabulary | Conditional normative (dataHandling) |
| llmstxt.org | Discovery hint, not replaced | Informative compatibility note |
| AIP (IETF Internet-Draft) | Agent identity protocol | Experimental, optional |
| RFC 8615 (.well-known) / RFC 9309 (robots) | Discovery path | Normative |

**A2WF v1.1 is a website declaration envelope. It reuses external vocabularies wherever stable, and adds only the minimum new shape it needs (permissions, oversight, conformance metadata).**

---

## Slide 5 - The seven Modules in v1.1

| Module | Purpose | Conformance |
|---|---|---|
| `dataHandling` | Purposes, retention, lawful basis, controller (DPV-aligned) | Normative Module |
| `agentIdentification` | Accepted identity protocols and credential types | Normative Module |
| `auditTrail` | Lightweight audit posture, retention, accessibility | Normative Module |
| `incidentReporting` | Contact + intended acknowledgement timeframe | Normative Module |
| `discoverabilityHints` | Sitemap, Schema.org Action endpoints, rate-limit hints | Normative Module |
| `jurisdictions` | Region, applicable laws (EU AI Act, GDPR, ...) | Normative Module |
| `codeOfPracticeAlignment` | Alignment with industry codes (not certification) | Normative Module |

Modules are independent. A document can claim zero, one, or all seven via `conformance.moduleClaims`. The Core does not require any module.

---

## Slide 6 - EU Governance Starter Profile

**A neutral example profile, published alongside the spec.**

Profile URI: `https://a2wf.org/profiles/eu-governance-starter/v1`

Requires the following module claims to be present and minimally populated:
- `jurisdictions` (region: EU, applicableLaws includes GDPR, optionally AI Act)
- `dataHandling` (with purposes + retention + lawful basis + controller)
- `agentIdentification` (at least one accepted protocol)
- `auditTrail` (enabled, with retention)
- `incidentReporting` (contactEmail + responseTime)
- `discoverabilityHints` (any one of sitemap, schemaOrgActions)

**What the profile is NOT:**
- NOT a certification
- NOT a compliance audit
- NOT a legal claim
- NOT endorsed by any EU institution

Any vendor may build tools around this profile. The constraints are:
- no W3C / A2WF endorsement claims
- no "certified compliant"
- operator keeps the raw JSON portable and can switch vendors at any time

---

## Slide 7 - Reference tools, live

Three browser tools plus a set of server snippets, all under MIT at https://a2wf.github.io/spec/tools/

- **Wizard** - generate a v1.1 document with six branch presets, Simple and Expert modes, live validation, JSON download. Imports v1.0 and v1.1 documents.
- **Validator** - drag-and-drop validator producing PASS / WARN / FAIL findings with spec section references. Loads the three reference examples.
- **EU Governance Readiness Checker** - fetches a live site's A2WF policy and maps declarations to EU AI Act and GDPR anchors. Produces a vendor "Declaration Coverage Score" (NOT a compliance score).
- **Logger Snippets** - server-side snippets (nginx, Apache, Cloudflare Workers, Express, WordPress) that record AI-agent fetches of the A2WF policy. Privacy-preserving defaults; opt-in forwarding.

All tools are MIT, static, self-hosted, no telemetry. Shared validator core (`validator/v1_1/core.js`) ensures CLI and browser tools agree. The tools include hooks so third parties can wrap them with their own branding via URL parameters; wrapped instances must disclaim "not A2WF-endorsed".

---

## Slide 8 - Conformance model

A2WF v1.1 conformance is qualitative, not numeric.

- A document validates to one of: `valid` (PASS), `valid with warnings` (PASS+WARN), `invalid` (FAIL)
- There is NO 0-100 conformance score in the specification
- Vendor tools MAY publish their own scoring products (e.g. the reference checker's "Declaration Coverage Score") - these are vendor metrics, NOT A2WF conformance signals
- Validator findings carry severity (pass/warn/fail), a section reference, and an explanatory message
- Conformance levels: `basic` and `standard`; profile claims add a third axis

This was a deliberate choice after a 0-100-score model was reviewed and rejected: numeric scores invite false-equivalence claims ("we are at 85, that means compliant") that the framework cannot underwrite.

---

## Slide 9 - Open questions for the CG

Five questions we want directional CG input on. These are not requests for resolution in this call; they are framings for the next ~6 weeks of issue tracking. We will open them as labelled GitHub issues within 48 hours of this meeting.

1. **ODRL profile of A2WF** - should v1.2 include a normative export to ODRL, or keep architectural alignment only? (Paola's first tip)
2. **Trigger expression language** - permissions may carry `conditions`; should the expression syntax be JSONLogic, ODRL Constraints, SHACL, or remain undefined? Currently undefined.
3. **Schema.org Action vocabulary curation** - we curate ~20 Schema.org Actions; should the CG maintain the curated set, or open it to community submissions?
4. **Cache directive precedence** - the spec currently says HTTP Cache-Control / ETag / Last-Modified win, with the document-internal `discovery.cache` as fallback. Is this the right ordering?
5. **Multi-region jurisdictional posture** - sites operating in multiple EU member states declare one `jurisdictions.primary` with an applicableLaws union. Sufficient?

---

## Slide 10 - Roadmap and how to participate

**v1.1 trajectory:**
- v1.1.0-draft.2 today (this CG call)
- v1.1.0-draft.3 after this meeting's feedback (target end of June 2026)
- First CG candidate release Q3 2026

**v1.2 candidates:**
- ODRL profile (companion spec)
- AIP integration (when IETF stabilises)
- DPV 2.x updates
- Profile maintenance + registry

**How to participate:**
- Repo issues: github.com/a2wf/spec/issues
- The five open questions will become labelled issues
- Pull requests welcome on tools/ and on profile drafts
- Office hours: TBD by CG charter

**Liaisons we are tracking:**
- W3C AIKR CG (Paola Di Maio)
- W3C Agent Identity Protocol CG
- DPVCG
- ODRL CG

*Tracked for review only; no formal endorsement or reciprocal liaison agreement yet.*

---

## Appendix - One-slide reading list

For attendees who want to skim before next meeting:
- A2WF v1.1.0-draft.2 spec: https://github.com/a2wf/spec/blob/v1.1-draft/spec/specification-v1.1-draft.2.md
- EU Governance Starter Profile: https://github.com/a2wf/spec/blob/v1.1-draft/profiles/eu-governance-starter.md
- Implementer Guide: https://github.com/a2wf/spec/blob/v1.1-draft/docs/agent-implementer-guide-v1.1.md
- Live tools: https://a2wf.github.io/spec/tools/

---

## Speaker preparation checklist

- [ ] Test screen-share with Wizard + Validator + EU Readiness Checker live
- [ ] Have the three example JSONs at hand (sme-basic, ecommerce-standard, healthcare-eu-governance-profile)
- [ ] Have the ODRL CG outputs page open in a tab for the "why three layers" question
- [ ] Have a fall-back: if a tool demo fails live, switch to the JSON files
- [ ] Open speaker view via Reveal (press S key)
- [ ] Bring water; this is 25-30 minutes of speaking plus 15 of Q&A
