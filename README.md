# Finanzen-App

Statische Haushaltsbuch-App auf Basis von `AusgabenEinnahmen.xlsx`. Kein Node, kein Build –
`index.html` einfach im Browser öffnen (Doppelklick genügt) oder über GitHub Pages veröffentlichen.

## Bedienung

- **Bereich** (oben rechts): zwei individuell benennbare Bereiche und `Haushalt`. Jeder Eintrag
  gehört genau einer der beiden Personen. `Haushalt` addiert ausschließlich beide Einzelbereiche;
  es gibt keine Quotenrechnung und keinen dritten gemeinsamen Topf.
- **Monat / Jahr**: schaltet alle Anzeigen zwischen Monats- und Jahreswerten um. Erfasst wird
  immer der Monatsbetrag.
- **Budget**: Beträge, Namen und Zuordnungen direkt bearbeiten. `+ Eintrag` fügt z. B. unter
  *Entertainment* einen neuen Dienst hinzu, `✕` löscht. Über `+ Gruppe in …` entstehen neue
  Kategorien. Das Häkchen deaktiviert einen Eintrag, ohne ihn zu löschen. Bei Einnahmen lassen
  sich zusätzlich Brutto und beliebige Aufschlüsselungsposten dokumentieren; für alle Summen
  zählt ausschließlich das Netto-Feld.
- **Vermögen**: Konten und Depots mit Stichtag.
- **Einstellungen**: Namen, Aufteilungsquote, Export/Import als JSON, Zurücksetzen auf den
  Excel-Stand.

## Speicherung

Alle Daten liegen im `localStorage` des Browsers. Für ein Backup oder den Wechsel des Geräts
die JSON-Datei über *Einstellungen → Als JSON sichern* exportieren.

## GitHub Pages

Der Workflow `.github/workflows/deploy-pages.yml` veröffentlicht die statische App automatisch
bei jedem Push auf `main`.

1. Alle Dateien direkt in den Stammordner des GitHub-Repositories hochladen. Dieser Upload-Ordner ist absichtlich flach; keine Unterordner anlegen.
2. In GitHub unter **Settings → Pages** bei *Build and deployment* die Quelle **Deploy from a branch** wählen, Branch `main` und Ordner `/(root)` einstellen.
3. Bereits hochgeladene Dateien mit gleichem Namen überschreiben oder vorher löschen. Nach dem Speichern ist die Seite nach kurzer Zeit unter GitHub Pages erreichbar.

Hinweis: GitHub Pages liefert die App aus, synchronisiert aber keine Finanzdaten zwischen Geräten.
Diese verbleiben im jeweiligen Browser; für den Transfer den JSON-Export/-Import verwenden.

## Als App installieren

Nach der Veröffentlichung über GitHub Pages ist die App als PWA installierbar und funktioniert
nach dem ersten Öffnen auch ohne Internetverbindung.

- **Android (Chrome):** Browser-Menü öffnen und **App installieren** oder **Zum Startbildschirm hinzufügen** wählen.
- **iPhone (Safari):** Teilen-Symbol öffnen und **Zum Home-Bildschirm** wählen.

Die App verwendet Manifest, Service Worker und ein Homescreen-Icon. Bei einer direkten
`file:///`-Öffnung auf dem PC wird der Offline-Service-Worker aus Sicherheitsgründen nicht aktiviert;
er läuft automatisch über GitHub Pages (HTTPS).

## Dateien

- `index.html` – Grundgerüst
- `styles.css` – Design
- `js/seed.js` – Startdaten aus der Excel-Tabelle
- `js/store.js` – Datenhaltung und Berechnung
- `js/app.js` – Ansichten und Interaktion
