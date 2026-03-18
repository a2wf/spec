# A2WF Validator + Conformance Tests (pragmatischer Vorschlag)

## Empfohlene Repo-Struktur

```text
schema/
  core-v1.0.json
  extensions-companion-v1.0.json
validator/
  index.js
  cli.js
tests/
  core.test.js
  fixtures/
    valid/
    invalid/
spec/
examples/
```

## Warum diese Trennung?

- `schema/`: maschinenlesbare Baseline-Struktur für Generatoren, Editoren, IDE-Support.
- `validator/`: semantische Regeln, die reine JSON-Schemas nur unvollständig ausdrücken.
- `tests/`: Conformance-Tests für gültige/ungültige Dokumente und Regressionen.
- `examples/`: dokumentierende Beispiele, nicht automatisch normative Fixtures.

## Was der aktuelle Validator prüft

### Core
- Pflichtfelder: `specVersion`, `identity`, `permissions`
- `specVersion === "1.0"`
- `identity.domain` als absolute HTTP(S)-URL
- `identity.name` als nichtleerer String
- `identity.inLanguage` als Pflichtfeld
- Strukturen für `defaults`, `scraping`, `agentIdentification`, `humanVerification`, `legal`, `discovery`, `metadata`
- Permission-Regeln mit Pflichtfeld `allowed`
- Enumerationen für `defaults.agentAccess`, `humanVerification.methods`, `legal.euAiActCompliance.riskClassification`
- Konsistenzwarnung: `permissions.action.<x>.humanVerification=true` ohne Eintrag in `humanVerification.requiredFor`
- Drift-Warnung für Top-Level-`$schema` statt `metadata.$schema`

### Extensions Companion
- Typ-/Strukturprüfung für `keySections`, `mainContact`, `publisher`, `company`, `services`, `forms`, `apiEndpoints`, `search`, `faq`, `navigation`, `ecommerce`, `media`, `careers`, `innovations`, `securityDefinitions`, `alternateVersions`
- URL-Felder als absolute HTTP(S)-URLs
- Warnung: `search`-Extension vorhanden, aber `permissions.action.search.allowed` nicht explizit `true`

## CLI-Nutzung

```bash
npm test
node validator/cli.js examples/extensions/ecommerce-rich.json
node validator/cli.js --profile=core examples/ecommerce.json
```

## Conformance-Testfälle

### Bereits abgedeckt

**Positiv:**
- minimales gültiges Core-Dokument
- gültiges kombiniertes Core+Extensions-Dokument
- bestehende Repo-Extensions-Beispiele validieren erfolgreich

**Negativ:**
- fehlendes `identity.inLanguage`
- relative statt absolute Extension-URL
- vorhandene Core-Beispiele zeigen aktuell Spec-Drift und werden explizit als erwartete Fails festgehalten
- Warnung für Top-Level-`$schema`

### Als Nächstes sinnvoll

1. **Discovery-Fälle**
   - gültige `robotsTxt`, `llmsTxt`, `openApi`, `mcpEndpoint`
   - ungültige Nicht-URLs
2. **Legal-Fälle**
   - erlaubte / unerlaubte `riskClassification`
3. **Human-Verification-Fälle**
   - unbekannte Methode
   - unbekannte Action in `requiredFor`
4. **Permission-Matrix**
   - unbekannte Permission-Keys → Warning, nicht Error
   - `allowed` fehlt → Error
5. **Extensions-Konsistenzfälle**
   - `forms.type = checkout`, aber `permissions.action.checkout.allowed = false` → mindestens Warning
   - `apiEndpoints.kind = mcp`, aber `discovery.mcpEndpoint` fehlt → optionale Warning
6. **Datums-/Zeitformatfälle**
   - `metadata.generatedAt`, `lastUpdated`, `expiresAt` enger prüfen

## Wichtige Beobachtung / was noch fehlt

Der Repo-Stand ist noch nicht vollständig konsistent zwischen Spezifikation und Beispielen:

1. **`identity.inLanguage`** ist laut Core-Spec REQUIRED, fehlt aber in mehreren bestehenden Core-Beispielen.
2. **`$schema`** liegt in mehreren Beispielen auf Top-Level, obwohl die Core-Spec es unter `metadata.$schema` beschreibt.
3. Die beigefügten JSON-Schemas sind bewusst **Baseline-Schemas**; die eigentliche Durchsetzung passiert aktuell im JS-Validator.
4. Es gibt noch keine offizielle Entscheidung, ob unbekannte Permission-Namen strikt, locker oder profilbasiert behandelt werden sollen.
5. Für echte Interop-Conformance wäre ein separates `conformance/`-Paket mit normativen Testvektoren plus erwarteten Ergebnissen (`pass|fail|warn`) sinnvoll.

## Empfehlung für den nächsten Schritt

- Entweder **Spec an Examples angleichen** oder **Examples an Spec angleichen**.
- Danach die aktuellen Repo-Beispiele in zwei Klassen aufteilen:
  - `examples/` = nur gültige Referenzbeispiele
  - `tests/fixtures/invalid/` = absichtlich ungültige Negativfälle
- Optional danach Ajv/JSON-Schema-Validation ergänzen, falls ein standardisierter Validator-Output für externe Tools wichtig wird.
