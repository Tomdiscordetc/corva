# Corva — Fahrplan & Tasklist

Siehe `REGELN.md` für die Arbeitsweise. Ein Abschnitt zur Zeit, erst abhaken,
dann weiter.

## Abschnitt 1 — Design-Fundament ✅ ABGESCHLOSSEN (2026-09-04)

- [x] Projekt aufgesetzt (Vite 8 + React 19 + TypeScript, Tailwind v4)
- [x] Design-Tokens (`src/styles/theme.css`): Farbe, Typografie, Abstände,
      Radien, Bewegung, `prefers-reduced-motion`
- [x] Inter Variable lokal eingebunden (kein Google Fonts)
- [x] UI-Bausteine: Button, Input, Card, Skeleton, StatusPill, Avatar,
      Switch, Checkbox, SegmentedControl, EmptyState, Tooltip, DropdownMenu,
      Dialog, Tabs, Table, Toast, CommandPalette (Strg+K)
- [x] Startbildschirm mit sich selbst zeichnendem Signet (nur beim Kaltstart)
- [x] Login mit Lade-/Fehlerzustand (simulierte Anmeldung)
- [x] App-Shell: Icon-Leiste, Kontextspalte (einklappbar), Kopfzeile mit
      Suche/Strg+K, Benachrichtigungen, Benutzermenü mit Rollenvorschau
- [x] Dashboard: Kennzahlen (hochzählend), Verlaufsdiagramm, Pipeline,
      Aufgaben heute, letzte Aktivitäten — inkl. Lade-, Leer- und
      Fehlerzustand (`?scenario=empty|error` zum Vorführen)
- [x] Sprachdatei `src/i18n/de.json`, `en.json` als leere Gegendatei
- [x] Geprüft: Tastaturbedienung, Fokusringe, mobile Breite (390px),
      Tablet/Desktop (1440px), keine externen Netzwerkanfragen, keine
      Konsolenfehler (frischer Tab, End-to-End-Durchlauf)

**Bekannte Lücken (bewusst, siehe Plan):** kein Server, kein echtes Login,
keine Rollenprüfung, kein Dunkelmodus, kein Englisch, keine Kanäle.

## Abschnitt 2 — Restliche Bildschirme gestalten (offen)

- [ ] Kontaktliste + Kontaktakte
- [ ] Posteingang aller Kanäle
- [ ] Kalender
- [ ] Aufgaben
- [ ] Auswertung
- [ ] Einstellungen
- [ ] Team

## Abschnitt 3 — Server-Fundament (offen)

- [ ] Datenbank, Mandanten (tenant_id)
- [ ] Echte Anmeldung, Sessions
- [ ] Die vier Rollen serverseitig durchgesetzt
- [ ] Protokoll (wer sah/änderte was, wann)

## Abschnitt 4 — Fachlichkeit (offen)

- [ ] Kontakte, Pipeline, Termine, Aufgaben, Aktivitäten — echte Daten statt
      Demo (Tausch in `src/hooks/`, Komponenten bleiben unverändert)

## Abschnitt 5 — Kanäle (offen, in dieser Reihenfolge)

- [ ] E-Mail (IMAP/SMTP)
- [ ] Telefonprotokoll
- [ ] WhatsApp Business
- [ ] Instagram/Meta/TikTok

## Abschnitt 6 — Datenschutz-Paket (offen)

- [ ] Löschfristen, Einwilligungen je Kanal, Auskunft und Export,
      Auftragsverarbeitungs-Unterlagen

## Abschnitt 7 — Lizenz- und Abo-System (offen)

- [ ] Pläne, Testphase, Abrechnung, Sperre bei Zahlungsausfall

## Abschnitt 8 — Betrieb (offen)

- [ ] Windows-Server, HTTPS, Backups, Überwachung

## Abschnitt 9 — Desktop-App (offen, optional)

- [ ] Tauri auf demselben Code
