# A2WF Shopify SiteAI App (MVP-Scaffold)

Pragmatischer Vorschlag für eine **Shopify Embedded App mit optionaler Theme App Extension**, damit Shopify-Shops ein `siteai.json` für **A2WF Core + optionale Extensions** pflegen und veröffentlichen können.

## Kurzfazit

**Empfehlung: klar eine Embedded App — nicht nur ein Theme-Plugin.**

Warum:
- `siteai.json` ist primär **Governance + Policy + strukturierte Metadaten**, nicht Theme-Dekoration.
- Die Pflege gehört in den **Shopify Admin**, nicht in den Theme Customizer.
- Validierung, Rollen, Versionierung, Preview, Publishing-Status und WooCommerce-/Shop-Datenmapping sind App-Themen.
- Eine Theme App Extension ist trotzdem sinnvoll — aber nur **ergänzend** für Discovery im Storefront-HTML (`<link rel="siteai">`).

## Zielbild

Die App trennt sauber:

1. **Core Governance**
   - `identity`
   - `permissions`
   - `defaults`
   - `agentIdentification`
   - `scraping`
   - `humanVerification`
   - `legal`
   - `discovery`
   - `metadata`

2. **Extensions**
   - `keySections`, `mainContact`, `publisher`, `company`, `services`, `forms`, `apiEndpoints`, `search`, `faq`, `navigation`, `ecommerce`, `media`, `careers`, `innovations`, `securityDefinitions`, `alternateVersions`

Die Ausgabe ist **ein kombiniertes `siteai.json`**, die Bearbeitung aber redaktionell getrennt.

---

## MVP-Scaffold in diesem Ordner

```text
shopify/a2wf-shopify-siteai/
  README.md
  ARCHITEKTUR.md
  package.json
  src/
    config/
      a2wf-keys.js
    lib/
      siteai-generator.js
      siteai-validator.js
      shopify-mappers.js
    examples/
      merchant-settings.example.json
  theme-extension/
    shopify.extension.toml
    blocks/
      siteai-discovery.liquid
```

## Was das Scaffold bewusst ist

- **kein** vollständiges produktionsreifes Shopify-Remix-App-Repo
- **kein** blind generierter CLI-Output
- sondern eine **produktfähige Referenzstruktur** für die wichtigsten Entscheidungen:
  - Datenmodell
  - Trennung Core vs Extensions
  - Delivery-Strategie
  - Generierung + Validierung
  - Theme-Extension für Discovery

## Delivery-Empfehlung für `/siteai.json`

### Beste Lösung
**Root-Datei unter `/siteai.json`** über externe Delivery-Schicht:
- Reverse Proxy
- CDN Worker
- Edge Rule
- Headless Frontdoor

Die Embedded App generiert und hostet das JSON, die Edge-Schicht mappt:

- `/siteai.json` → App/Public-Endpoint

### Shopify-native Fallback-Lösung
Wenn Root-Rewrite nicht möglich ist:
- `siteai.json` über **App Proxy** ausliefern, z. B. `/apps/a2wf/siteai.json`
- per **Theme App Extension** im `<head>` veröffentlichen:

```html
<link rel="siteai" type="application/json" href="/apps/a2wf/siteai.json">
```

- optional zusätzlich `robots.txt.liquid` ergänzen:

```txt
SiteAI: https://shop.example.com/apps/a2wf/siteai.json
```

**Wichtig:** Für die A2WF-Spec ist das ein valider Fallback, aber nicht so gut wie Root-Delivery.

## Produktentscheid in einem Satz

**Embedded App für Authoring, Validation und Publishing-Status; Theme App Extension nur für Discovery und minimale Storefront-Integration.**
