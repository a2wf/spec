# A2WF SiteAI Manager (MVP-Plugin)

WordPress-Prototyp für die Pflege und Veröffentlichung von `siteai.json` nach A2WF v1.0.

## Zielbild

Das Plugin trennt bewusst zwei Ebenen:

1. **Core Governance**
   - `identity`
   - `defaults`
   - `permissions`
   - `agentIdentification`
   - `scraping`
   - `humanVerification`
   - `legal`
   - `discovery`
   - `metadata`

2. **Optionale Extensions**
   - `keySections`
   - `mainContact`
   - `publisher`
   - `company`
   - `services`
   - `forms`
   - `apiEndpoints`
   - `search`
   - `faq`
   - `navigation`
   - `ecommerce`
   - `media`
   - `careers`
   - `innovations`
   - `securityDefinitions`
   - `alternateVersions`

## MVP-Funktionen

- Admin-Menü **A2WF SiteAI**
- Tab **Core Governance**
- Tab **Extensions**
- Tab **Preview** mit generiertem JSON
- Rewrite-/Endpoint für `https://example.com/siteai.json`
- JSON-Generierung aus WordPress-Optionen
- einfache JSON-Textareas für komplexe Extension-Strukturen

## Warum diese Trennung?

Die Core-Spec ist normativ und governance-orientiert. Extensions sind beschreibend. Beides in einer UI ohne Trennung zu mischen führt fast zwangsläufig zu Fehlbedienung. Deshalb:

- **Core** = stabile Formfelder, eher policy-/compliance-getrieben
- **Extensions** = flexible JSON-Blöcke, eher content-/site-struktur-getrieben

## Nächste sinnvolle Schritte

1. Schema-basierte Validierung pro Tab
2. Guided Builder für Extensions statt freier JSON-Textareas
3. Auto-Discovery aus WordPress (Menüs, Search, WooCommerce, Contact Forms)
4. Rollen-/Capability-Modell für Redaktion vs. Legal/Tech
5. Export auch als Datei im Uploads-Verzeichnis
6. Gutenberg-/Settings-API-Integration

## Installation im Test-Setup

Plugin-Ordner nach `wp-content/plugins/a2wf-siteai-manager/` kopieren und aktivieren.
