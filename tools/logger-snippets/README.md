# A2WF Logger Snippets

Reference snippets that operators can drop into their own infrastructure to observe traffic to
`/.well-known/a2wf/siteai.json`. The goal is to give a site operator simple visibility into which
AI agents fetch their A2WF policy, without taking on a third-party data processor.

## Privacy and legal posture

These snippets are privacy-preserving **by default**. They are not "GDPR compliant" out of the
box: the operator remains responsible for legal basis, retention, notices, and any onward
forwarding.

By default the snippets do **not** record:

- IP address (no `X-Forwarded-For`, no `CF-Connecting-IP`)
- Cookies, `Authorization`, or any header that may carry credentials
- Query strings or request body
- Full `Referer` (origin only, if at all)
- Raw `User-Agent` string (categorised version only)
- TLS client fingerprints
- Country derived from IP

Optional fields exist for cases where an operator has a clear legal basis to capture them. They
are documented in `a2wf-log-event-v1.schema.json` and named in the snippet's `rawFieldsIncluded`
list so downstream consumers know what to expect.

## Log event schema

Every snippet emits records that match
[`a2wf-log-event-v1.schema.json`](./a2wf-log-event-v1.schema.json). The schema is versioned and
stable across the 1.x line. A field `a2wfLogVersion: "1.0"` and `schemaURI` identify the format.

## Agent classification

User-Agent classification uses the heuristic list in
[`agent-signatures.json`](./agent-signatures.json). The classification is a guess: a User-Agent
string can be forged. Operators MUST NOT treat a category as proof of agent identity. To
establish identity, use the A2WF `agentIdentification` module (DID, VC, HTTP Message
Signatures) in the published A2WF document.

The list is community-maintained. To add or correct a signature, open a Pull Request against
`agent-signatures.json` in the [a2wf/spec](https://github.com/a2wf/spec) repository.

## Forwarding to an external endpoint

Each snippet has a `A2WF_LOG_ENDPOINT` configuration variable. When set, the snippet POSTs each
record as `application/x-ndjson` to that URL. **The endpoint is operator-configured**: there is
no default, and the variable is commented out in the example configurations.

When forwarding is enabled, the snippet:

- Sends only the fields described in `a2wf-log-event-v1.schema.json`
- Sets `collectionMode: "forwarded"` and `forwardingEndpoint` on the record
- Does not block the response to the agent on a forwarding failure

Operators who forward records to a vendor MUST execute a data-processing agreement with that
vendor and disclose the forwarding in their privacy notice.

## Available snippets

- [`nginx.conf.example`](./nginx.conf.example)  -  nginx `log_format` and `access_log` directives
- [`cloudflare-worker.js`](./cloudflare-worker.js)  -  Cloudflare Worker that proxies the file and emits a log record
- [`apache-htaccess.example`](./apache-htaccess.example)  -  Apache `LogFormat` + `CustomLog`
- [`express-middleware.js`](./express-middleware.js)  -  Express.js middleware (Node.js)
- [`wordpress-snippet.php`](./wordpress-snippet.php)  -  Drop-in PHP function for WordPress sites

Each file documents its own configuration variables and required dependencies.

## Retention guidance

The reference snippets do not enforce a retention period. A reasonable starting point for
operators that have no other regulatory constraint is 90 days, with daily rotation. Operators
in regulated sectors should align retention with their sector's requirements (e.g. PCI, HIPAA,
sector audit trails).

Records SHOULD be stored in a location the operator controls (a file on the web server, a
database row, a structured log store) and SHOULD NOT be co-located with personal customer data
unless the operator has accounted for that in their privacy notice.

## What this is not

- This is **not** a managed analytics service.
- These snippets do **not** establish AI-agent identity. They observe declared categories only.
- These snippets do **not** certify legal compliance.
- The presence of a forwarding endpoint variable does **not** indicate any specific destination.
  Operators choose their own destination if any.

## License

These files are released under the MIT License. See the repository `LICENSE`.
