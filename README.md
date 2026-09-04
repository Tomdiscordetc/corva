# Corva — CRM für Versicherungsvermittler

Bündelt E-Mail, Telefon, WhatsApp und Social Media an einem Ort. Als Lizenz
(monatlich/jährlich) für Vertriebsagenturen gedacht.

Siehe [`REGELN.md`](REGELN.md) für die Arbeitsweise und
[`TASKLIST.md`](TASKLIST.md) für den Fahrplan. Aktueller Stand: Abschnitt 1
(Design-Fundament) abgeschlossen — reine Oberfläche mit Demo-Daten, noch ohne
Server.

## Entwicklung

```bash
npm install
```

```bash
npm run dev
```

Im Browser öffnen: <http://localhost:5173> (oder den in der Konsole
angezeigten Port).

Demo-Zustände des Dashboards vorführen: `/app?scenario=empty` bzw.
`/app?scenario=error` an die URL anhängen (nur nach dem Anmelden).

Anmeldung ist in diesem Abschnitt simuliert: jede E-Mail mit „@" und ein
Passwort ab 4 Zeichen meldet an.

## Technik

Vite 8, React 19, TypeScript, Tailwind CSS v4 (OKLCH-Farbtokens), Motion v13
(Animationen + View Transitions), React Router v7, TanStack Query v5,
Zustand, Radix-UI-Primitives, Inter Variable (lokal gebündelt).

## Struktur

| Pfad | Inhalt |
|---|---|
| `src/styles/theme.css` | Alle Design-Tokens (Farbe, Abstand, Radius, Bewegung) |
| `src/components/ui/` | Wiederverwendbare Bausteine |
| `src/components/shell/` | App-Gerüst (Icon-Leiste, Kontextspalte, Kopfzeile) |
| `src/routes/` | Seiten |
| `src/demo/` | Demo-Daten (später gegen echte Endpunkte getauscht) |
| `src/hooks/` | Datenschicht — einziger Ort, der später den Server anspricht |
| `src/i18n/` | Sprachdateien |
