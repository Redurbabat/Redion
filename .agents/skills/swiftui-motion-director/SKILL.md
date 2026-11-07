---
name: swiftui-motion-director
description: Designs purpose-driven interactions and animation systems for native SwiftUI apps across iPhone and Mac.
---

> **Redion-Kontext:** Nur für tatsächlich native SwiftUI-Implementierungen, nicht WebView. Ursprüngliche `docs/native-swiftui/` sind unter `doku/red-morph-referenz/docs/native-swiftui/` abgelegt. Keine SwiftUI-Runtime übernommen.

# SwiftUI Motion Director

1. Verstehe zuerst Nutzerjob, Interaktionshäufigkeit und Plattformkontext.
2. Prüfe `docs/native-swiftui/UX_RULES.md`, `docs/native-swiftui/MOTION.md`, `native/swiftui/README.md`.
3. Schlage genau drei kreative Varianten vor: Calm / Expressive / Pro.
4. Je Variante: Komponentenhierarchie, Zustände, Motion Timing, Touch/Mouse/Keyboard, Reduce Motion, Testfälle.
5. Erzeuge SwiftUI-Code mit `KitPalette`, `KitMotion`, `KitTransition`; vermeide unnötige Drittanbieter-Pakete.
6. Bewerte Entdeckbarkeit, Nutzen, Latenz, Performance und Accessibility.
7. Nie rein dekorative Endlosschleifen als Pflichtanimation verwenden.
