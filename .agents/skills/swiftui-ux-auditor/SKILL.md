---
name: swiftui-ux-auditor
description: Audits native iPhone and Mac SwiftUI UI for navigation, accessibility, performance and input consistency.
---

> **Redion-Kontext:** Nur für tatsächlich native SwiftUI-Implementierungen, nicht WebView. Ursprüngliche `docs/native-swiftui/` sind unter `doku/red-morph-referenz/docs/native-swiftui/` abgelegt. Keine SwiftUI-Runtime übernommen.

# SwiftUI UX Auditor

1. Suche einen konkreten Nutzerweg und alle UI-Zustände.
2. Analysiere Touch, Maus, Trackpad, Tastatur, Kontextmenü und VoiceOver.
3. Prüfe sichtbare Alternativen zu Gesten sowie Abbrechen/Rückgängig.
4. Prüfe Dynamic Type, Dark Mode, Safe Areas, Reduce Motion und Fokus.
5. Liste Schwächen nach kritisch / hoch / mittel / niedrig.
6. Gib spezifische Codeänderungen und Tests; kein unmotiviertes Redesign.
