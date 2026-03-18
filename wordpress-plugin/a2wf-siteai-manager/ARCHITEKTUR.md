# A2WF WordPress-Plugin – Architektur- und Produktvorschlag

## 1) Plugin-Architektur

### Leitidee
Ein WordPress-Plugin für A2WF sollte **nicht** primär als "JSON-Editor" gedacht werden, sondern als **Policy- und Capability-Manager**. Die JSON-Datei ist das Veröffentlichungsformat, nicht die Arbeitsoberfläche.

### Empfohlene Module

- **Admin UI**
  - Tabs: Core, Extensions, Preview
  - später Wizard/Validator
- **Settings Store**
  - persistiert strukturierte Optionen in `wp_options`
- **Generator**
  - baut aus den Settings das finale `siteai.json`
- **Endpoint/Publisher**
  - liefert `/siteai.json` aus
- **Detectors** (später)
  - WooCommerce, Search, Form Plugins, Mehrsprachigkeit, Menüs
- **Validator** (später)
  - prüft Required/Recommended/JSON Schema

### Datenmodell
- Speicherung intern getrennt in:
  - `core`
  - `extensions`
- Ausgabe als **ein kombiniertes JSON-Dokument**, sofern Extensions aktiviert sind.

## 2) Admin-UX-Vorschlag

### MVP-UX
- **Tab 1: Core Governance**
  - Identity
  - Defaults
  - Permissions
  - Agent Identification
  - Scraping
  - Human Verification
  - Legal / Discovery / Metadata
- **Tab 2: Extensions**
  - pro Extension ein eigener JSON-Block
  - bewusst als Advanced Area markiert
- **Tab 3: Preview**
  - readonly JSON
  - Copy/Open actions

### Produktiv-UX mittelfristig
Empfohlen ist langfristig ein **zweistufiges UX-Modell**:

1. **Guided Editor** für 80 % der Nutzer
2. **Advanced JSON / Developer View** für Feinheiten

### Wichtigste UX-Regel
Core-Policies und Extensions dürfen optisch und semantisch nicht vermischt werden. Sonst entsteht der falsche Eindruck, dass `forms` oder `apiEndpoints` Berechtigungen vergeben würden.

## 3) Empfohlene Dateistruktur

```text
wordpress-plugin/
  a2wf-siteai-manager/
    a2wf-siteai-manager.php
    README.md
    ARCHITEKTUR.md
    assets/
      css/admin.css
      js/admin.js
    includes/
      class-a2wf-siteai-manager-plugin.php
      class-a2wf-siteai-manager-admin.php
      class-a2wf-siteai-manager-settings.php
      class-a2wf-siteai-manager-generator.php
      class-a2wf-siteai-manager-endpoint.php
```

### Warum so?
Das ist absichtlich klein und WordPress-kompatibel. Für ein MVP ist das besser als zu früh ein komplexes Build-System einzuführen.

## 4) MVP-Implementierung / Scaffold

Umgesetzt im Prototyp:

- Plugin-Bootstrap
- Settings-Klasse mit Defaults und Sanitizing
- Generator für finales JSON
- Rewrite-Endpoint für `/siteai.json`
- Admin-Oberfläche mit Core-/Extensions-/Preview-Tab

### Noch nicht im MVP
- JSON Schema Validation
- Auto-Erkennung aus WordPress-Plugins
- granularere Rechte/Rollen
- Import bestehender `siteai.json`
- Guided Builder für jede Extension-Struktur

## 5) Empfehlung: Core vs. Extensions im Plugin trennen

### Meine klare Empfehlung
**Technisch gemeinsam ausgeben, redaktionell getrennt bearbeiten.**

#### Bearbeitungsebene
- **Core** in normalen WordPress-Formularen
- **Extensions** in separatem Tab mit optionalen, teils JSON-basierten Advanced-Feldern

#### Veröffentlichungs-/Exportebene
- eine gemeinsame `siteai.json`
- Extensions nur einmischen, wenn `extensions.enabled = true`

### Warum das die richtige Trennung ist

#### Core ist stabiler
Core-Felder sind relativ klar definierte Governance-Objekte. Sie profitieren von festen Formularfeldern, Hilfe-Texten und Validierung.

#### Extensions sind heterogener
Extensions sind absichtlich offen, beschreibend und je nach Website-Typ sehr unterschiedlich. Ein Formularzwang ist hier schnell zu starr.

#### Produktlogik
- Legal/Compliance/Operations pflegen eher Core
- Content/SEO/Produkt/Tech pflegen eher Extensions

Das spricht auch organisatorisch für eine Trennung.

## Empfehlungsfazit

Wenn das Plugin ernsthaft produktisiert werden soll, würde ich so vorgehen:

1. **MVP wie hier**: Core-Formulare + Extension-JSON-Blöcke + Endpoint
2. **v0.2**: Validator + Inline-Hinweise + bessere Preview
3. **v0.3**: Detektoren für WordPress/WooCommerce/Formulare/Suche
4. **v0.4**: geführter Extension-Builder pro Site-Typ

Der wichtigste Produktentscheid ist aus meiner Sicht bereits klar:

> **Core = Governance Editor**
> **Extensions = Capability/Description Editor**

Genau diese Trennung sollte das Plugin in IA, UX, Code und Zuständigkeiten sichtbar machen.
