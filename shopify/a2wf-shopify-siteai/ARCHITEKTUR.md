# A2WF Shopify App – Architekturvorschlag

## 1. Empfehlung: Embedded App vs. Theme-Plugin

### Klare Empfehlung
**Embedded App zuerst, Theme App Extension ergänzend.**

### Warum kein reines Theme-Plugin?
Ein reines Theme-Plugin oder nur Theme-App-Extension ist für A2WF zu schwach, weil:
- Governance-Daten nicht in den Theme-Customizer gehören
- `siteai.json` shopweit ist, nicht theme-spezifisch
- mehrere Themes / unpublished themes sonst zu Inkonsistenzen führen
- Validierung, Rechte, Draft/Published und JSON-Preview Admin-Funktionen sind
- Root- oder Proxy-Publishing serverseitige Logik braucht

### Warum Embedded App passt
Die Embedded App ist der richtige Ort für:
- strukturierte Pflege der Policy
- Shop-Metadaten aus Shopify Admin/API
- Validierung vor Veröffentlichung
- Versionierung / Änderungsstand
- Rollen und Verantwortlichkeiten
- Publishing-Status und Delivery-Strategien

### Rolle der Theme App Extension
Die Theme App Extension sollte nur diese Aufgaben haben:
- `<link rel="siteai">` im HTML-Head platzieren
- optional Hinweis-/Status-Snippet für Merchant
- optional Theme-seitige Discovery-Konfiguration

Nicht mehr.

---

## 2. Zielarchitektur

```text
Merchant
  -> Shopify Admin
    -> Embedded App UI
      -> App Backend
        -> Settings Store
        -> Generator
        -> Validator
        -> Delivery Layer

Storefront
  -> Theme App Extension
    -> <link rel="siteai" href="...">

Agent
  -> /siteai.json                 (bevorzugt)
  -> /apps/a2wf/siteai.json       (Fallback via App Proxy)
```

## 3. Domänenmodell

### A. App Settings / Persistence
Empfohlene getrennte Persistenz:

```json
{
  "core": { ... },
  "extensions": { ... },
  "publication": {
    "enabled": true,
    "deliveryMode": "app-proxy",
    "publicPath": "/apps/a2wf/siteai.json",
    "discoverableViaThemeExtension": true,
    "discoverableViaRobots": false
  }
}
```

### B. Generated Artifact
Die App erzeugt daraus das öffentliche Dokument:

```json
{
  "@context": "https://schema.org",
  "specVersion": "1.0",
  "identity": { ... },
  "permissions": { ... },
  "...core": "...",
  "...extensions": "..."
}
```

---

## 4. Empfohlene technische Bausteine

## 4.1 Embedded Admin App
Empfohlener Stack für späteren echten Build:
- Shopify App mit **Remix / React Router Template** oder Next/Node-Backend
- Polaris für Admin UI
- App Bridge für Embedded Navigation

### Kernmodule
- **Core Editor**
- **Extensions Editor**
- **Preview & Validation**
- **Publishing**
- **Discovery Setup**

## 4.2 Settings Store
MVP-tauglich:
- Shopify App installation scoped storage
- optional Prisma/SQLite/Postgres
- Datensatz pro Shop

Empfohlene Struktur:
- `shops`
- `siteai_documents`
- `siteai_revisions` (später)

## 4.3 Generator
Aufgabe:
- Shop-Daten + Merchant-Eingaben in ein sauberes `siteai.json` überführen
- leere Felder entfernen
- Core immer zuerst aufbauen
- Extensions nur bei Aktivierung einmischen

## 4.4 Validator
Empfehlung:
- den vorhandenen Repo-Validator wiederverwenden
- Profile:
  - `core`
  - `core+extensions`

UI-seitig ausgeben:
- Fehler
- Warnungen
- Published / Draft blockieren bei Fehlern

## 4.5 Delivery Layer
Drei Delivery-Modi sind sinnvoll:

### Modus A – Edge Root Publish (best)
- `/siteai.json` liegt am Root
- App bleibt Source of Truth
- externe Edge-Regel mappt Request auf App-Endpoint

### Modus B – Shopify App Proxy (gut genug)
- öffentlich unter `/apps/a2wf/siteai.json`
- Signatur/Authentifizierung der Proxy-Requests Shopify-seitig
- für viele Shops realistischster MVP

### Modus C – Export-only (Notfall)
- Merchant kann JSON exportieren
- manuell extern hosten
- nur als Backup, nicht als Standard

---

## 5. Admin-UX

## 5.1 Navigationsmodell
Empfohlene IA:

1. **Übersicht**
2. **Core Governance**
3. **Extensions**
4. **Preview & Validation**
5. **Publishing**

## 5.2 Dashboard / Übersicht
Sollte zeigen:
- Publishing-Status: Draft / Published / Invalid
- Öffentliche URL
- Letzte Änderung
- Letzte erfolgreiche Validierung
- Delivery-Modus
- Discovery aktiv / nicht aktiv

## 5.3 Core Governance UX
Kein Freitext-JSON als Standard.

Stattdessen strukturierte Formulare:
- Identity-Form
- Permission-Matrix
- Agent Identification
- Scraping
- Human Verification
- Legal
- Discovery
- Metadata

### Permission-Matrix für Shopify besonders sinnvoll
Für Shopify sollten Default-Werte schon vorbereitet sein:
- `read.productCatalog`: typischerweise `allowed: true`
- `read.pricing`: typischerweise `allowed: true`
- `read.availability`: typischerweise `allowed: true`
- `action.search`: oft `allowed: true`
- `action.addToCart`: optional
- `action.checkout`: wenn erlaubt, fast immer `humanVerification: true`
- `data.paymentInfo`: immer `false`
- `data.customerRecords`: immer `false`

## 5.4 Extensions UX
**Separater Bereich, nicht im selben Formularfluss wie Core.**

Empfohlene Unterteilung:
- Kontakt & Organisation
- Navigation & Key Sections
- Commerce
- Formulare & APIs
- FAQ / Search / Media
- Sprachen & Alternate Versions

### Für MVP pragmatisch
- Formulare für häufige Fälle
- JSON-Textarea als Fallback für seltene/extensible Blöcke

## 5.5 Preview & Validation
Zwingend als eigener Screen:
- pretty printed JSON
- Fehler/Warnungen aus Validator
- Copy / Download
- „Publish blockiert“ bei Fehlern

## 5.6 Publishing Screen
Optionen:
- Veröffentlichung aktiv / aus
- Delivery-Modus
- Public URL
- Head-Discovery aktiviert
- robots.txt-Hinweis
- Test-Request / Health Check

---

## 6. Wie `/siteai.json` in Shopify sauber ausgeliefert wird

## 6.1 Realistische Einschätzung
**Shopify ist für eine freie Root-Datei wie `/siteai.json` nicht ideal.**

Ein Embedded App Backend kann öffentliches JSON gut ausliefern, aber die Storefront-URL am Root ist ohne zusätzliche Schicht nicht immer sauber kontrollierbar.

## 6.2 Beste saubere Lösung
Wenn der Merchant eigene Domain-/Proxy-Kontrolle hat:
- Cloudflare Worker / Fastly / Nginx / Reverse Proxy
- Route `/siteai.json`
- Antwort direkt aus App-Backend oder aus gecachtem JSON-Artifact

Das ist die sauberste Spezifikations-Umsetzung.

## 6.3 Shopify-nativer MVP
Per **App Proxy**:
- öffentliche URL z. B. `/apps/a2wf/siteai.json`
- Response Header: `Content-Type: application/json; charset=utf-8`
- GET und HEAD unterstützen
- aggressiv cachen, aber invalidieren bei Publish

Zusätzlich per Theme App Extension:

```html
<link rel="siteai" type="application/json" href="/apps/a2wf/siteai.json">
```

Optional in `robots.txt.liquid` dokumentieren.

## 6.4 Was ich nicht empfehlen würde
- JSON in Theme-Assets „verstecken“ und hoffen, dass das Root-Problem damit gelöst ist
- `siteai.json` nur als normale Seite/Template ausgeben
- Pflege an ein einzelnes Theme binden

Das führt funktional und organisatorisch in die falsche Richtung.

---

## 7. Core vs Extensions – wie trennen?

## Redaktionell
**Getrennt pflegen.**

### Core
- normativ
- compliance-/policy-lastig
- kleine, stabile Feldmenge
- stark validierbar

### Extensions
- beschreibend
- heterogen
- site- bzw. business-spezifisch
- teilweise halbstrukturiert

## Technisch
**Gemeinsam publizieren, getrennt modellieren.**

Empfohlene Regel:
- Core immer vorhanden
- Extensions optional aktivierbar
- Generator merged erst beim Publish

## UX-Regel
Die App darf nie den Eindruck erwecken, dass `forms`, `search` oder `apiEndpoints` Berechtigungen vergeben. Das tun sie nicht. Core gewinnt immer.

---

## 8. Roadmap

### MVP
- Core-Editor
- Extensions-Editor
- JSON-Preview
- Repo-Validator-Anbindung
- App-Proxy-Publikation
- Theme App Extension für `<link rel="siteai">`

### v0.2
- Import bestehender JSON
- Revisionen / Draft vs Published
- Health Check der Public URL
- bessere Shopify-spezifische Defaults

### v0.3
- Auto-Discovery aus Shop-Daten
  - Shop Name / Domain / Locale
  - Search vorhanden
  - Contact Page
  - Policies
  - ggf. Markets/Locales

### v0.4
- Guided Extension Builders
- Rollenmodell
- mehrsprachige Policy-Varianten
- Edge-Publishing-Connector
