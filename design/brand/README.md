# Corva — Cut

Eigenständig gezeichneter SVG-Entwurf. Tom hat am 05.09.2026 ausdrücklich
bestätigt, das Logo von Hand als SVG zu erstellen. Der blockierte
Higgsfield-Workflow wird dafür nicht verwendet.

Das kompakte C nimmt den Namen direkt auf. Eine ruhige Rundung und zwei
parallele diagonale Abschlüsse bilden eine einzige gefüllte Silhouette.
Die Form benötigt weder Konturlinien noch Verläufe oder einen Kreisrahmen.

## Dateien

- `corva-mark.svg`: editierbarer Master, 64 × 64 ViewBox, transparenter Hintergrund.
- `logo-review.html`: Vorschau mit Wortmarke, Hell/Dunkel und kleinen Größen.
- `../../public/brand/corva-mark.svg`: dunkler Download für helle Flächen.
- `../../public/brand/corva-mark-light.svg`: weißer Download für dunkle Flächen.
- `../../src/components/brand/CorvaMark.tsx`: gemeinsame React-Komponente;
  nutzt `currentColor` und die vorhandenen Tokens des umgebenden Elements.
- `../../public/favicon.svg`: kontrastreiches App-Icon mit derselben Geometrie.

Die Wortmarke verwendet die bereits lokal vorhandene Inter, Gewicht 600.
Das Signet ist vollständig als Pfad beschrieben und benötigt keine Schrift.
Alle Varianten müssen exakt denselben Pfad behalten. Empfohlener Freiraum:
mindestens eine Konturstärke (12 ViewBox-Einheiten) zur angrenzenden Beschriftung.

## Integration

Nach Claudes Login-/Design-Commit `3283060` eingebaut: `Logo` und `LogoLockup`
verwenden das neue Signet in der Anmeldung, Entsperrsequenz, Navigation und
auf den Rechtstextseiten. Der Splash blendet dieselbe gefüllte Silhouette ein.
Claudes bestehende View-Transition `corva-mark` vom Login zur Seitenleiste
bleibt unverändert erhalten. Das Favicon ist unabhängig vom Browser-Theme
kontrastreich; die Signet-Downloads haben einen transparenten Hintergrund.
