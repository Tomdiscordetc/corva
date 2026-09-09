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

**Bekannte Lücken (damals bewusst offen):** kein Server, kein echtes Login,
keine Rollenprüfung, kein Dunkelmodus, kein Englisch, keine Kanäle.

## Abschnitt 1.5 — Design-Ausbau ✅ ABGESCHLOSSEN (2026-09-04)

Ergebnis einer 24-Fragen-Runde mit Tom, alle „Empfohlen"-Optionen gewählt.
Baut auf Abschnitt 1 auf, bevor Abschnitt 2 beginnt — betrifft nur
Bestehendes (Login/Shell/Dashboard), keine neuen fachlichen Bildschirme.

- [x] **Dunkelmodus** vollständig ausgeliefert (Tokens waren vorbereitet):
      System + manueller Schalter (3-Wege: System/Hell/Dunkel), Akzentblau im
      Dunkeln etwas heller, WCAG-AA-Kontrast
- [x] **Gerichtete Seitenübergänge**: Vorwärts/Rückwärts in der Navigations-
      reihenfolge rutscht sichtbar unterschiedlich (View Transitions, nur der
      Inhaltsbereich, nicht Icon-Leiste/Kopfzeile), `prefers-reduced-motion`
      schaltet ab
- [x] **Tastenkürzel-Set**: „g" + Buchstabe zum Springen (d=Übersicht,
      c=Kontakte, i=Posteingang, k=Kalender, a=Aufgaben, r=Auswertung,
      e=Einstellungen), „?" öffnet eine Kurzübersicht; Strg+K bleibt bestehen
- [x] **Styleguide-Seite** (`/app/styleguide`, über Strg+K erreichbar): alle
      Farben, Typografie, Bewegungswerte und Bausteine an einem Ort
- [x] **Dezenter Hintergrund-Lade-Indikator** in der Kopfzeile, sichtbar
      während Daten im Hintergrund aktualisiert werden

Zusätzlich dabei behoben:
- Befehlspalette navigierte für **alle** Einträge nach `/app` statt zum
  jeweiligen Bereich (Kopierfehler aus Abschnitt 1)
- Bausteine nutzten feste Neutralwerte (`bg-neutral-950`, `bg-neutral-100`, …),
  die im Dunkelmodus nicht kippen. Jetzt semantische Tokens: `invert`/
  `on-invert` für kräftige Gegenflächen, `surface-muted`/`-hover`/`-subtle`/
  `-press`, `skeleton`, `scrim`
- Styleguide baute Klassennamen per Template-String zusammen
  (`bg-${token}`) — Tailwind erzeugt solche Klassen nicht, Farbfelder wären
  leer geblieben. Jetzt feste Zeichenketten

Bekannte Kleinigkeit: bei sehr schnell aufeinanderfolgenden Seitenwechseln
(Tastenkürzel im Sekundentakt) meldet der Browser einmalig
`InvalidStateError: Transition was aborted` — die View-Transitions-API bricht
den laufenden Übergang ab. Ohne Folgen für die Anzeige; bewusst nicht mit
globalem Abfangen zugekleistert.

Muster, die für Abschnitt 2 vorgemerkt sind (siehe unten, dort erstmals mit
echten Daten/Listen sinnvoll): Drag & Drop, Rechtsklick-Kontextmenü,
Rückgängig-Toast, optimistisches UI, Wischgesten, Live-Validierung in
Formularen.

## Abschnitt 1.6 — Login-Prozess ✅ ABGESCHLOSSEN (2026-09-05)

Die Optik des Logins stand, der Ablauf war aber einstufig: E-Mail + Passwort,
fertig. Drei im Text versprochene Dinge fehlten ganz.

- [x] **Mehrstufiger Ablauf** mit gerichtetem Schiebe-Übergang zwischen den
      Schritten: E-Mail → Passwort → ggf. Bestätigungscode
- [x] **Zwei-Faktor-Schritt**: sechsstelliger Code, Feldwechsel automatisch,
      Einfügen aus der Zwischenablage, erneut senden mit Wartezeit,
      „diesem Gerät vertrauen"
- [x] **Erstes Passwort festlegen** (war im Hinweistext versprochen):
      Stärkeanzeige, Wiederholung, Regeln sichtbar
- [x] **Passwort vergessen** als echter Zweig statt Kurzmeldung
- [x] **Angemeldet bleiben** + Sitzung übersteht das Neuladen
- [x] **Feststelltasten-Warnung** im Passwortfeld
- [x] Tests für Store-Ablauf und die neuen Schritte

## Abschnitt 2 — Restliche Bildschirme gestalten (offen)

Reihenfolge: **Kontakte zuerst** (Tabelle als Standardansicht, Kartenraster
als Umschalt-Option), dann die übrigen. Am Kontakte-Bildschirm werden die in
Abschnitt 1.5 vorgemerkten Muster erstmals angewendet: Drag & Drop
(Pipeline-Status), Rechtsklick-Kontextmenü je Zeile, Rückgängig-Toast beim
Löschen, optimistisches Speichern, Wischgesten auf dem Handy,
Live-Validierung in der Kontaktakte.

- [x] Kontaktliste + Kontaktakte (2026-09-06): Tabelle/Karten/Pipeline,
      Stufen-Schnellfilter mit Zählern, Suche, Filter nach Sparte und
      Zuständigkeit, vier Sortierungen; Akte mit Kanälen, Verlauf und
      verknüpften Aufgaben; Ziehen zwischen den Stufen (dnd-kit, mit
      Tastaturbedienung)
- [ ] **Posteingang aller Kanäle (Liste + Detail nebeneinander) — als Nächstes**
- [ ] Kalender (Standardansicht: Woche)
- [x] Aufgaben (2026-09-05): anlegen, bearbeiten, abhaken, löschen mit
      Rückgängig, Bereiche mit Zählern, Suche, Filter, Sortierung,
      Rechtsklick-Menü, Wischgeste; Bestand seit 2026-09-09 auf dem Server
- [ ] Auswertung (Kennzahlen + wählbarer Vergleichszeitraum, Diagramme
      interaktiv mit Hover-Tooltip)
- [x] Einstellungen (2026-09-04/05): Erscheinungsbild, Benachrichtigungen,
      Konto; im Server-Modus gegen echte Endpunkte
- [ ] Team (noch ohne Route)

Optimistisches Speichern gegen den echten Server läuft seit 2026-09-09 für
Kontakte und Aufgaben: die Oberfläche zeigt die Änderung sofort, der Server
bestätigt sie, und bei einem Fehlschlag wird der Stand vom Server neu geholt.

## Abschnitt 3 — Server-Fundament

- [x] Datenbank, Mandanten (tenant_id) (2026-09-08): SQLite über node:sqlite,
      Migrationen über PRAGMA user_version
- [x] Echte Anmeldung, Sessions (2026-09-08): Passworthash, TOTP,
      Sitzungstabelle, CSRF, Ratenbegrenzung
- [ ] Die vier Rollen serverseitig durchgesetzt — der Server kennt bisher drei
      (admin, manager, employee); Inhaber fehlt noch
- [x] Protokoll (wer sah/änderte was, wann) (2026-09-08): audit-Tabelle

## Abschnitt 4 — Fachlichkeit

- [x] Kontakte, Pipeline, Aufgaben, Aktivitäten (2026-09-09): echte Daten je
      Mandant, Sichtbarkeit nach Rolle, Löschen bleibt 30 Tage umkehrbar.
      Getauscht wurden nur `useContacts` und `useTasks` — die Bildschirme
      blieben unverändert.
- [ ] Termine — kommt mit dem Kalender

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
