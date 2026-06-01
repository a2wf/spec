# A2WF CG Meeting - Talking points (Wolf)

For the 2026-05-27 first community call. Short spoken lines per slide,
plain English, pragmatic tone. Read out loud, do not project these.

## Self-introduction

"My name is Wolfgang Wimmer, I am based in Austria and work in Slovakia.
My background is IT-security consulting, so I come at this as a
practitioner, not a standards theorist. That is exactly why I see the
need for A2WF: website operators today have no real handle on autonomous
agents acting on their sites, and without clear rules this will turn
into a mess of misuse and liability questions. A2WF is my pragmatic
attempt to solve that on top of standards that already exist."

## Slide 1 - Title and status

"We have done the homework. v1.1 is an editor's draft, not stable, not
W3C-endorsed, and this community group is still proposed. We are here
to hand the work to the community."

## Slide 2 - Why I started A2WF

"I am an IT security practitioner. I kept seeing AI agents acting on
customer sites with no rules: filling forms, booking, ordering.
Operators have no machine-readable way to say what is allowed or what
needs a human. robots.txt covers content use, not actions. Regulation
is coming, so sites will need a clean answer. The building blocks
already exist - Schema.org, ODRL, DPV, DID. What was missing was the
simple envelope. That envelope is A2WF: one JSON file per site, at a
fixed location, reusing existing standards."

## Slide 3 - What needs to happen for adoption

"This is the honest slide. A2WF only works if four pieces move:
agents identify themselves, agents consume the policy, sites publish
it, and regulators recognise it as a signal. The CG cannot force any
of these alone, but a credible spec plus visible reference adopters
makes all four more likely."

## Slide 4 - What has been done so far

"Quick credibility check before the spec details. I have written to
EU contacts on A2WF and Code of Practice alignment. I submitted a
one-page barrier-to-adoption statement to the NIST CAISI listening
sessions on AI agent governance. Paola and Ian gave us structural
input that shaped v1.1. v1.0 is published, v1.1 draft 2 is ready,
the reference tools are live, and we have early proof-of-concepts
on financial-sector sites. Nineteen participants signed up here
before this first call."

## Slide 5 - Reference tools

"Four open-source tools so people do not have to read the spec to use
it: a Wizard that generates a valid file from simple questions, a
Validator for drag-and-drop checking, an EU Governance Readiness
Checker that maps your policy to AI Act and GDPR anchors, and
server-side logger snippets for the common stacks. All MIT, all
static, no telemetry. Vendors can wrap them with their own branding
as long as they disclose 'not A2WF-endorsed'."

## Slide 6 - Standards re-use, not re-invention

"This is the orchestrator story in one table. Schema.org for actions,
DID and VC for identity, DPV for data handling, ODRL as architectural
precedent. The only new shape we add is the minimum envelope:
permissions, oversight, conformance metadata."

## Slide 7 - Open questions for the CG

"Five questions we want directional input on over the next six weeks.
ODRL profile, trigger expression language, Schema.org curation, cache
ordering, and multi-region jurisdictions. These become labelled issues
within 48 hours of this call. Not asking for resolution today."

## Slide 8 - Roadmap and how to participate

"Next draft after this meeting's feedback by end of June. First CG
candidate release Q3. v1.2 candidates already lined up. Repo issues
are the primary working channel. Liaisons tracked for review only -
no endorsements claimed."

## Slide 11 - dropped

The earlier adoption slide is now Slide 3.

## Appendix slides

If anyone asks, the appendix has: the 12-month plan as a discussion
proposal, what A2WF concerns in five buckets, adjacent standards and
groups with their status in v1.1, and a glossary of every acronym
used. Mention they are there, do not walk through them unless asked.

## Closing line

"This is your community group now. I would rather it be useful than
mine."
