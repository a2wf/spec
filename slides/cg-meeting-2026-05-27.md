# A2WF v1.1 - W3C Community Group Meeting

**Date:** 2026-05-27
**Editor:** Wolfgang Wimmer (SSC)
**Status:** Pre-Community-Group Editor's Draft (v1.1.0-draft.2)
**Repo:** https://github.com/a2wf/spec
**Live tools:** https://a2wf.github.io/spec/tools/

---

## Slide 1 - Title and status

**Agent-to-Website Framework v1.1**
*A machine-readable policy format for AI-agent governance on websites*

- v1.0 has been published as informational reference (https://a2wf.org)
- v1.1 is a pre-Community-Group Editor's Draft - NOT a W3C Recommendation
- This meeting is the first formal community review
- Repository: github.com/a2wf/spec, branch `v1.1-draft`
- All artefacts under MIT licence

Speaker notes:
- Frame this as "we have done the homework, now we want community ownership"
- Be explicit: A2WF Community Group is "proposed", not yet chartered
- Acknowledge prior input from Paola Di Maio (AIKR CG) and Ian Jacobs (W3C)

---

## Slide 2 - Why v1.1?

**v1.0 was a one-page declaration. v1.1 makes it operational.**

What v1.0 could not express:
- Nuanced human oversight (`oversight.level`: autonomous / confirmation / notification / handover)
- Machine-readable jurisdictional declarations (`jurisdictions.applicableLaws`)
- Agent identification protocols (DID, VC, HTTP Message Signatures, OAuth)
- Data-handling transparency (DPV alignment)
- Incident-reporting contact and timeframe
- Discovery hints (Schema.org Actions, sitemap, rate limits)
- Audit-trail declarations

Liaison feedback that drove v1.1:
- Paola Di Maio (W3C AIKR CG): "use ODRL, reuse Schema.org, link to agent-identity standards"
- Ian Jacobs (W3C Staff): "discovery via /.well-known, not site root"

Speaker notes:
- Show concrete example: v1.0 humanVerification=true vs v1.1 oversight.oversightDefaults.regulated.level=handover
- The Paola/Ian quotes are real input from earlier rounds; reference them visibly

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

**Precedent:** This is the same shape as ODRL Core + Profiles, WCAG Levels A/AA/AAA, DID Core + Method Specs, WebAuthn Core + Extensions. The W3C-CG-Process explicitly supports this pattern (per ODRL CG outcomes).

Why three layers and not flat?
- Core stays small enough to be implementable by every operator
- Modules are opt-in and bring domain depth where needed
- Profiles bundle modules for specific markets (EU, accessibility, finance) without forcing global complexity

Speaker notes:
- This is the most important structural decision; it is what made GPT-5.5 review say "go ahead"
- Be ready for the question "why not just use ODRL directly?" - answer: ODRL vocabulary is content-licensing oriented; A2WF vocabulary is site-action oriented. ODRL profile of A2WF planned for v1.2 (open issue D-1).

---

## Slide 4 - Standards re-use, not re-invention

A2WF v1.1 references and aligns with:

| Standard | Used for | Status in A2WF |
|---|---|---|
| Schema.org Actions | `permissions[].schemaOrgType` | Conditional normative |
| W3C DID Core | Agent identity resolution | Stable, referenced |
| W3C VC Data Model 2.0 | Agent credentials | Stable, referenced |
| HTTP Message Signatures (RFC 9421) | Request authentication | Stable, referenced |
| OAuth 2.0 (RFC 6749) | Delegated authorisation | Stable, referenced |
| W3C ODRL 2.2 | Architectural precedent | Future profile (v1.2) |
| W3C DPV 2.0 | Data-handling vocabulary | Module-level referenced |
| llmstxt.org | Discovery hint, not replaced | Compatibility note |
| IETF AIP (draft) | Agent identity protocol | Experimental |
| RFC 8615 / RFC 9309 | Discovery path, robots.txt | Stable, normative |

**A2WF v1.1 defines no new identity protocol, no new policy language, no new vocabulary. Everything is a thin coordination layer.**

Speaker notes:
- This slide directly addresses Paola's three tips from the earlier round
- Make sure to read this aloud: "no new identity, no new policy language, no new vocabulary"

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

Speaker notes:
- Stress: "the seven modules are not seven things you have to do; they are seven shapes of declarations you can make if they apply to you"
- Highlight `dataHandling` aligns with DPV - that is the Paola hook

---

## Slide 6 - EU Governance Starter Profile

**A neutral example profile, published alongside the spec, bundling six modules for EU-operating sites.**

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

Vendors are welcome to wrap and brand this profile for their customers, with the constraint that they MUST not claim W3C/A2WF endorsement.

Speaker notes:
- Anticipate the question "Is this a back door to a paid certification market?"
- Answer: profile claim is publisher-declared; vendor reports MUST disclaim. We have built the disclaimer into the reference tools so vendors who use them get it for free.

---

## Slide 7 - Reference tools, live

Three browser-based tools live at https://a2wf.github.io/spec/tools/

- **Wizard** - generate a v1.1 document with six branch presets, Simple and Expert modes, live validation, JSON download. Imports v1.0 and v1.1 documents.
- **Validator** - drag-and-drop validator producing PASS / WARN / FAIL findings with spec section references. Loads the three reference examples.
- **EU Governance Readiness Checker** - fetches a live site's A2WF policy and maps declarations to EU AI Act and GDPR anchors. Produces a vendor "Declaration Coverage Score" (NOT a compliance score). Vendor-brandable via URL parameters.
- **Logger Snippets** - server-side snippets (nginx, Apache, Cloudflare Workers, Express, WordPress) that record AI-agent fetches of the A2WF policy. Privacy-preserving defaults; opt-in forwarding.

All tools are MIT, static, self-hosted, no telemetry. Shared validator core (`validator/v1_1/core.js`) ensures CLI and browser tools agree.

Speaker notes:
- If demo permits, switch to a browser tab with the Wizard and pick the "regulated sector" preset
- For the Readiness Checker, run it against https://a2wf.org itself to show v1.0 detection + migration recommendations

---

## Slide 8 - Conformance model

A2WF v1.1 conformance is qualitative, not numeric.

- A document validates to one of: `valid` (PASS), `valid with warnings` (PASS+WARN), `invalid` (FAIL)
- There is NO 0-100 conformance score in the specification
- Vendor tools MAY publish their own scoring products (e.g. the reference checker's "Declaration Coverage Score" or industry vendors' own metrics) - these are vendor metrics, not A2WF conformance signals
- Validator findings carry severity (pass/warn/fail), a section reference, and an explanatory message
- Conformance levels: `basic` and `standard`; profile claims add a third axis

This was a deliberate choice after a 0-100-score model was reviewed and rejected: numeric scores invite false-equivalence claims ("we are at 85, that means compliant") that the framework cannot underwrite.

Speaker notes:
- This is a strong, defensible position - lean into it
- Mention that a vendor score in our own reference tool is capped at 59 on validation failure, which is the discipline we ask other vendors to apply too

---

## Slide 9 - Open questions for the CG

Five issues we want the CG to chew on:

1. **ODRL profile of A2WF (D-1)** - should v1.2 include a normative export to ODRL, or keep architectural alignment only? (Paola's tip 1)
2. **Trigger expression language (D-3)** - permissions can have `conditions`; should the expression syntax be JSONLogic, ODRL Constraints, SHACL, or undefined? Currently undefined.
3. **Schema.org Action vocabulary curation (D-5)** - we curate ~20 Schema.org Actions; should the CG maintain the curated set, or open it?
4. **Discovery cache directives (D-4)** - cache TTL declared in the document vs HTTP headers - which wins on conflict?
5. **Multi-region jurisdictional posture (D-2)** - sites operating in multiple EU member states declare one `jurisdictions.primary` but applicableLaws are union. Sufficient?

Speaker notes:
- These five issues are deliberately scoped to be discussable in one CG-call cycle (~6 weeks)
- We will open them as GitHub issues on the repo within 48h of this meeting and link them from the call notes

---

## Slide 10 - Roadmap and how to participate

**v1.1 trajectory:**
- v1.1.0-draft.2 today (Editor's Draft, this CG call)
- v1.1.0-draft.3 after this meeting's feedback (target end of June 2026)
- First CG candidate release Q3 2026

**v1.2 candidates:**
- ODRL profile (companion spec)
- AIP integration (when IETF stabilises)
- DPV 2.x updates
- Profile maintenance + registry

**How to participate:**
- Repo issues: github.com/a2wf/spec/issues
- The five open questions will become labeled issues
- Pull requests welcome on tools/ and on profile drafts
- Office hours: TBD by CG charter

**Liaisons we are tracking:**
- W3C AIKR CG (Paola Di Maio) - inventory of standards intersections
- W3C Agent Identity Protocol CG - DID/VC alignment
- DPVCG - DPV vocabulary use
- ODRL CG - profile precedent

Speaker notes:
- Last slide is "what's next + how to help" - end on an invitation, not a closing statement
- Be prepared for the meta-question "should A2WF become a W3C CG and eventually a Working Group?" - answer: that is exactly what this meeting is for

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
- [ ] Bring water; this is 25-30 minutes of speaking plus 15 of Q&A
