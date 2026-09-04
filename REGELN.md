# Arbeitsregeln für Corva

Diese Regeln gelten für jede Änderung an diesem Projekt, unabhängig davon, wer
oder was sie macht.

1. **Ein Abschnitt zur Zeit.** Es wird nichts aus einem späteren Abschnitt des
   Fahrplans (siehe `TASKLIST.md`) angefangen, solange der laufende nicht
   abgehakt ist.
2. **Fertig heißt abgenommen.** Jeder Abschnitt hat eine Abnahmeliste. Erst
   wenn jeder Punkt abgehakt und geprüft ist, gilt er als fertig.
3. **Neue Ideen wandern nach `IDEEN.md`**, nicht in den laufenden Abschnitt.
4. **Nach jeder Änderung testen** — Seite laden, Konsole prüfen, Screenshot,
   und gegen den Stand davor vergleichen. Deployen allein ist nicht fertig.
5. **Keine erfundenen Zahlen ohne Kennzeichnung.** Demo-Daten liegen in einer
   einzigen Datei (`src/demo/`) und sind in der Oberfläche als Demo erkennbar.
6. **Keine externen Nachladungen.** Schriften, Icons, Bibliotheken liegen
   lokal im Projekt — kein Google Fonts, kein CDN (DSGVO, deutsche Kunden).
7. **Farben, Abstände, Radien, Zeiten nur aus Tokens** (`src/styles/theme.css`).
   Keine Komponente definiert eigene Werte.
8. **Design und Daten getrennt.** Komponenten kennen keine API — Daten kommen
   über Hooks (`src/hooks/`). So bleibt der Tausch gegen einen echten Server
   auf wenige Dateien beschränkt.

Der volle Fahrplan mit allen Abschnitten steht in `TASKLIST.md`.
