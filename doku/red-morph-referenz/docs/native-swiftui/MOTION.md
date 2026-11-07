# Motion-Regeln und Rezepte (SwiftUI)

| Intent | Empfehlung | Umsetzung |
| --- | --- | --- |
| Direktes Feedback | 0.18–0.28 s, sanfte Feder | `KitMotion.quick` |
| Auswahlwechsel | 0.3–0.4 s, stabil | `KitMotion.gentle` |
| Sheet oder Dual-Dock | ca. 0.45–0.55 s | `KitMotion.sheet` |
| Spielerische Bestätigung | 0.3–0.4 s mit Bounce | `KitMotion.playful` |
| Karten → Detail | Geometrie-Verbindung | `matchedGeometryEffect` |
| Aufklappen | Verschieben und Opacity | `KitTransition.slideUp` |
| Tooltip / Overlay | Fade und Scale | `KitTransition.fadeScale` |

## Gesten

- Drag: Während der Geste folgt die Oberfläche dem Finger; beim Loslassen snappt sie zur nächsten logischen Position.
- Kontextdock: Wischen hoch = Werkzeugreihe öffnen, wischen runter = schließen; Pfeiltaste als Alternative.
- Karten: Nur ziehen, wenn es echten Nutzen gibt. Konflikte mit ScrollViews und Edge-Swipe vermeiden.
- macOS: Hover subtil; kein Hover als Voraussetzung für Zugriff. Rechtsklick/⌘⇧D nur ergänzend.

## Effekte

- Shake: nur bei konkreter Fehlereingabe, nicht als Dauereffekt.
- Pulse/Glow: sparsam zur Signalgebung, nicht für alle Buttons.
- Shimmer: nur während echter Ladezustände.
- Konfetti: seltene abgeschlossene Aktionen, optional abschaltbar.
- Morph: die Beziehung zwischen Ursprung und Ziel muss eindeutig bleiben.
- Parallax/3D: nicht auf Textflächen, Reduce Motion beachten.
- Sound/Haptik: optional, nicht als einziges Feedback.

## Tests

In Xcode auf Simulator **und** Hardware testen: Reduce Motion, VoiceOver, Dark Mode, große Schrift, langsames Gerät, unterbrochene Interaktionen, gedrosselte Framerate und Tastaturbedienung.
