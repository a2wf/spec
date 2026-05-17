# A2WF Reference Tools

Open-source reference implementations of the A2WF v1.1 toolchain. These tools live alongside the
specification and are intended to make A2WF usable, not to advance any specific vendor.

## What is here

```
tools/
├── index.html              Tools landing page
├── vendor/                 Self-hosted dependencies (Ajv, Alpine, CSS)
├── wizard/                 Browser-based document generator
├── validator-web/          Browser-based document validator
└── logger-snippets/        Server-side logging snippets and event schema
```

## Local preview

Run any static HTTP server in the repository root:

```
python3 -m http.server 8000
# or
npx serve .
```

Then open `http://localhost:8000/tools/`.

## GitHub Pages deployment

GitHub Pages is configured to serve from the repository root. After pushing the `v1.1-draft`
branch, the tools are available at:

```
https://a2wf.github.io/spec/tools/
```

(Replace `a2wf.github.io/spec` with the actual published Pages URL for the repository.)

## Tooling principles

These tools follow three principles:

1. **Static and self-hosted.** No build pipeline. No CDN dependency. Files in `vendor/` are
   versioned binaries, not external references.
2. **No telemetry.** The Wizard and Validator run entirely in the browser. They do not POST
   anywhere. The logger snippets emit records to operator-controlled logs by default; external
   forwarding is opt-in.
3. **Validator parity.** The shared validator core lives at `validator/v1_1/core.js`. The CLI
   validator (`validator/v1_1/cli.js`) and both browser tools import the same module. If a
   document passes one, it passes the other.

## Maintenance

- The `vendor/` directory contains a pre-built Ajv bundle. To rebuild it after a dependency
  upgrade, run from the repository root:

  ```
  npm install --no-save esbuild
  ./node_modules/.bin/esbuild --bundle --format=iife --target=es2020 --minify \
      tools/vendor/_bundle-entry.js --outfile=tools/vendor/ajv-browser-bundle.js
  ```

- The agent-signature list at `tools/logger-snippets/agent-signatures.json` is the canonical
  source. Add a new signature there first; the nginx, Apache, Cloudflare, Express, and
  WordPress snippets each carry an inline copy that should be kept in sync via PR.

- The presets at `tools/wizard/presets.json` are starting points only. Resist the temptation to
  pre-fill regulated or compliance-sensitive defaults; always require the operator to confirm.

## Out of scope

These tools deliberately omit:

- Multi-tenant SaaS, authentication, billing
- Vendor branding (the tools are neutral by design)
- Audit-trail hosting, incident-report inbox
- Promoted listings or directory submission
- Schema-org Action vocabulary beyond the curated set used by the Wizard

Operators or vendors who want any of the above are free to build on top of these tools or fork
them. The repository itself stays neutral.

## License

MIT, same as the rest of the repository.
