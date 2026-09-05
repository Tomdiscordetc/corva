# Ideen (noch nicht eingeplant)

Neue Einfälle landen hier statt im laufenden Abschnitt (siehe `REGELN.md`
Punkt 3). Wenn ein Abschnitt ansteht, wird aus dieser Liste ausgewählt und
in `TASKLIST.md` eingeplant.

- Dunkelmodus (Tokens sind in `theme.css` bereits als Umschaltpunkt vorbereitet)
- Desktop-Benachrichtigungen bei neuer Anfrage
- Tastenkürzel-Übersicht (Shift+? o. ä.)
- Zeitraum-Filter im Dashboard (Heute/Woche/Monat)

## Anmeldeseite ohne laufende Animationen (2026-09-05)

Der Formularbereich startet mit `opacity: 0` und wird per Motion eingeblendet.
In einem Hintergrund-Tab steht `requestAnimationFrame` still, die Seite bleibt
dann bis zum Wechsel auf den Tab dunkel. Für echte Nutzer unkritisch (beim
Sichtbarwerden läuft die Einblendung nach), aber robuster wäre, den sichtbaren
Endzustand als Ausgangspunkt zu nehmen und nur die Bewegung zu animieren —
oder die Einblendung als CSS-Animation zu fahren.
