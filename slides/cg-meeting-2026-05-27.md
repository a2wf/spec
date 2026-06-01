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

## Slide 2 - Why I started A2WF

From a practitioner's view, not a standards exercise.

- AI agents already act on websites: filling forms, booking, ordering, checking out.
- Operators have no machine-readable way to say what is allowed, what needs a human, who is liable.
- robots.txt and AIPREF cover content use, not actions.
- Regulation is coming (EU AI Act, EU Code of Practice, US NIST AI RMF and CAISI). Sites will need a clean answer to "what did your site permit?"
- The pieces exist (Schema.org, ODRL, DPV, DID, VC). What was missing was the simple envelope.

That envelope is A2WF. One JSON file per site, at a fixed location, reusing existing standards.

Speaker note: I am an IT security practitioner. I kept seeing agents acting on customer sites with no rules. I looked for an existing standard, did not find one that fit the site-operator view, and started A2WF to fill that gap on top of what is already there.

---

## Slide 3 - What needs to happen for adoption

A2WF only works if four pieces move together.

| Pillar | What has to change | Who moves it |
|---|---|---|
| Agent identification | Agent frameworks identify themselves on requests instead of mimicking generic browsers. | OpenAI, Anthropic, Google, browser-automation vendors |
| Policy consumption | Agents fetch and respect siteai.json before acting; oversight levels honoured. | Same vendors, plus open-source agent libraries |
| Site publication | Critical mass of websites publishes siteai.json so agents have something to check. | CMS plugins (WordPress, Shopify), site operators, reseller partners |
| Agent detection | Better mechanisms to detect AI agents that ignore or disguise themselves, so non-compliant traffic can be flagged. | Browser-fingerprinting research, WAF / CDN vendors, security community |
| Regulatory anchor | EU AI Act and Code of Practice in the EU, NIST AI RMF and CAISI in the US, cite machine-readable governance as a recognised signal. | EU Commission, NIST, national DPAs, standards bodies |

None of these is purely the CG's job. Our role is to make all four possible and credible.

Speaker note: Honest answer to "is anyone going to actually use this?" The CG ships the spec and reference tools; it cannot force vendor or regulator adoption.

---

## Slide 4 - What has been done so far

Outreach and groundwork before this first community call.

- EU institutions: contacted regarding A2WF and the EU AI Act / Code of Practice alignment.
- NIST CAISI (US): submitted a one-page barrier-to-adoption statement for the listening sessions on AI agent governance; A2WF is also informed by the NIST AI Risk Management Framework.
- W3C liaisons: Paola Di Maio (AIKR CG) and Ian Jacobs (W3C Staff) reviewed the structural direction; their input shaped v1.1.
- Spec work: v1.0 published at a2wf.org; v1.1.0-draft.2 prepared for this call.
- Reference tools: Wizard, Validator, EU Governance Readiness Checker, and server-side logger snippets - all live and MIT-licensed.
- Pilots: early proof-of-concept implementations on financial-sector websites.
- Community: A2WF Community Group founded at W3C (March 2026); 19 participants signed up before the first call.

Speaker note: Credibility slide. We are not arriving with a sketch on a napkin - regulator-side engagement, standards-side liaisons, real tools and POCs.

---

## Slide 5 - Your input required

Open prompts for round-robin. Pick whichever fits your perspective.

1. Where do you see A2WF helping or failing in your sector?
2. Which existing standard or group should we connect with that we have missed?
3. What would make you adopt or recommend siteai.json on a real site?
4. What is the single biggest risk you see with this approach?
5. Which area matters most to you personally - governance, audit, identity, privacy, discovery?

---

## Appendix - One-slide reading list

For attendees who want to skim before next meeting:
- A2WF v1.1.0-draft.2 spec: https://github.com/a2wf/spec/blob/v1.1-draft/spec/specification-v1.1-draft.2.md
- EU Governance Starter Profile: https://github.com/a2wf/spec/blob/v1.1-draft/profiles/eu-governance-starter.md
- Implementer Guide: https://github.com/a2wf/spec/blob/v1.1-draft/docs/agent-implementer-guide-v1.1.md
- Live tools: https://a2wf.github.io/spec/tools/

---

## Appendix - Next steps

- Collect your input from this call into GitHub issues within 48 hours.
- Quiet weeks for liaison review and contributions on the repo.
- Second community call in roughly two months - earlier if input warrants, later if we need more time.
- Direction beyond that is shaped by what we hear from you, not pre-decided here.

Speaker note: The first call is for listening. Two months is a working assumption, not a commitment.

---

## Appendix - What A2WF concerns

Five domains A2WF touches on the agent-web boundary.

| Domain | What A2WF does here | Standards reused |
|---|---|---|
| Governance | Declares which actions are permitted, prohibited, or require human oversight; aligns with EU Code of Practice and AI Act obligations. | Schema.org, ODRL, EU CoP |
| Audit and provenance | Site-side logging contract: what gets recorded, how it is signed, how an auditor can verify declared vs. observed behaviour. | PROV-O, RFC 9421, AIVS (opt-in) |
| Authentication and identity | Expects agents to identify themselves; references identity protocols without redefining them. | DID, VC, AIP (opt-in) |
| Privacy and jurisdiction | Declares personal-data categories, processing purposes, applicable legal regions (GDPR, CCPA, ...). | DPV, ISO-3166 |
| Discovery | Fixed well-known location for the site policy; agents can find it deterministically without crawling. | RFC 8615, RFC 8288 |

Speaker note: Discovery here means a fixed file path agents can fetch directly. The third column makes the orchestrator story concrete.

---

## Appendix - Adjacent standards and groups

Work A2WF touches, complements, or watches - not orchestrated inside our spec, but on the same map.

| Name | Where | Relation to A2WF | Status in v1.1 |
|---|---|---|---|
| AIPREF | IETF WG | Site-side opt-out for AI content use (training, search). Complement: AIPREF covers content use, A2WF covers agent actions. | Watched, not referenced |
| robots.txt + extensions | de-facto / IETF | Crawler access control. A2WF sits on top: once an agent is allowed in, what may it DO? | Watched, not referenced |
| Anthropic ClaudeBot User-Agent convention | Vendor | Voluntary header naming for AI crawlers. Useful identity signal; no standard yet. | Acknowledged, not relied on |
| llms.txt / ai.txt | Community proposals | Markdown summaries for LLM ingestion. Different layer (content-shaping, not governance). | Out of scope |
| NLWeb, MCP, A2A | Industry (Microsoft, Anthropic, Google) | Agent-to-tool and agent-to-agent protocols. Informative context; A2WF stays site-facing. | Informative only |
| W3C AIKR CG (Paola Di Maio) | W3C CG | AI Knowledge Representation, transparency, hybrid symbolic / sub-symbolic AI. Liaison for review of governance vocabulary. | Liaison, review input adopted |
| W3C WebAgents CG (Fabien Gandon) | W3C CG | Agent semantics on the web. Liaison for the agent-side perspective. | Liaison, outreach pending |
| W3C Agent Identity Protocol CG | W3C CG | 50+ members working on agent identity. A2WF's agentIdentification module references their work. | Referenced (opt-in) |
| W3C Semantic Agent Communication CG | W3C CG | Semantic interoperability between agents. Watching for vocabulary alignment. | Watched, not referenced |
| W3C Agentic Arbitration CG | W3C CG | Dispute resolution between agents and sites. Relevant once A2WF gets enforcement signals. | Watched, future fit |
| W3C DPVCG, ODRL CG | W3C CG | Already orchestrated in A2WF (see main glossary). Listed here for completeness. | Normative (when used) |
| WAI-ARIA | W3C WG | Accessibility semantics. Useful precedent for site-side declarations consumed by non-human clients. | Precedent only |

Speaker note: AIPREF is the most frequent "isn't that the same thing?" question - answer is content-use vs. agent-action, different layers. Paola's AIKR CG named explicitly because she is in this audience.

---

## Appendix - Standards glossary

| Acronym | Full name | What it defines |
|---|---|---|
| ODRL | Open Digital Rights Language (W3C Rec) | Machine-readable permissions, prohibitions, and obligations on digital assets. |
| Schema.org | Schema.org Actions vocabulary | Shared vocabulary for actions on the web (BuyAction, ReserveAction, OrderAction). |
| DPV | Data Privacy Vocabulary (W3C DPVCG) | Terms for personal-data categories, processing purposes, legal bases (GDPR-aligned). |
| DID | Decentralized Identifiers (W3C Rec) | Self-sovereign identifiers not tied to a central registry. |
| VC | Verifiable Credentials (W3C Rec) | Cryptographically signed claims an entity can present to prove attributes. |
| PROV-O | Provenance Ontology (W3C Rec) | Who did what, when, with which inputs - audit trail vocabulary. |
| AIP | Agent Identity Protocol (IETF draft) | Header-based identification of AI agents on HTTP requests. |
| AIVS | AI Verifiable Statements (IETF draft) | Agent-side signed log of actions taken, with integrity proofs. |
| EU CoP | EU Code of Practice for general-purpose AI | Voluntary EU Commission code that operationalises AI Act obligations. |
| RFC 8615 | Well-Known URIs (IETF) | Convention for /.well-known/ paths used by our discovery endpoint. |
| RFC 9421 | HTTP Message Signatures (IETF) | Signing HTTP requests and responses for integrity and authenticity. |

Speaker note: A2WF references each of these standards but does not redefine them. Stable W3C Recommendations are normative when their feature block is used; IETF drafts are opt-in experimental until they stabilise.

---

## Speaker preparation checklist

- [ ] Test screen-share with Wizard + Validator + EU Readiness Checker live
- [ ] Have the three example JSONs at hand (sme-basic, ecommerce-standard, healthcare-eu-governance-profile)
- [ ] Have the ODRL CG outputs page open in a tab for the "why three layers" question
- [ ] Have a fall-back: if a tool demo fails live, switch to the JSON files
- [ ] Open speaker view via Reveal (press S key)
- [ ] Bring water; this is 25-30 minutes of speaking plus 15 of Q&A
