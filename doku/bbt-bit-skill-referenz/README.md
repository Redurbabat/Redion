# BBT-Bit-Skills als Redion-Referenz

Die zehn Dateien in diesem Ordner sind **Original-Referenzen** aus `Redurbabat/BBT-Bit/.agents/skills/` (Stand der Uebernahme: 2026-11-07). Sie werden nicht als aktive Redion-Skills geladen.

**Wichtig:** BBT-Bit ist eine Musik-App mit SwiftUI, Kotlin und Rust. Redion ist eine local-first Notiz-/Dokumenten-App mit TypeScript, Electron/Windows und Capacitor/Swift/iOS. Daher duerfen insbesondere `bbt-player`, `bbt-streaming`, `bbt-audio-engine` und Musik-Liquid-Motion nicht ungeprueft auf Redion angewendet werden.

Uebertragbare Prinzipien: `swiftui-component-smith` -> Redion-Komponenten, `swiftui-ux-auditor` -> Redion-UX, `swiftui-motion-director`/`bbt-liquid-motion` -> bestehendes `redion-animationen`, `swiftui-idea-lab` -> Workspace-Architektur, `bbt-ios-testing` -> Redion-Plattformtests, `bbt-release` -> Redion-Releases. Die adaptierten aktiven Skills liegen unter `.agents/skills/`.

Die Referenzen sind **keine** Anweisung, Audio-Streaming, Decoder oder Musikplayer in Redion einzubauen. Vor Verwendung immer den aktuellen Quellstand der beiden Repositories pruefen.
