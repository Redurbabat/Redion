# SwiftUI MasterKit – Integration und Bereinigung

## Ziel
Die React-Website unter `app/` und das native SwiftUI-Kit koexistieren.
Web-Komponenten werden **nicht** irrtümlich als native SwiftUI-Komponenten ausgegeben.

## Importstatus
- SwiftPM: eingebaut (iOS 17+, macOS 14+).
- Kern: kontextabhängiges zweistufiges Dock, Motion-Tokens, Karten, Buttons, Feedback, Drag, Effekte.
- Vier Claude-Skills: eingefügt in `.claude/skills/swiftui-*/`.
- Native UX-/Animations-/Ideenregeln: ergänzt.
- Vollständiges 47-Dateien-Demoarchiv aus Chat: **noch nicht automatisch synchronisiert**. Nach lokalem ZIP-Download führt `tools/import-swiftui-masterkit.sh <ZIP-Datei>` den Rest verlustfrei ein.

## Lösch-Audit
Bestehende `skills/web-design/` (Web-Design-Skill und Referenzen) und `.claude/skills/touch-kit/` werden von der Website beziehungsweise dem React Touch Kit verwendet und sind **nicht nachweislich veraltet**. Sie bleiben unverändert. Kein automatisches Löschen der gesamten Skill-Verzeichnisse.

Unnötige doppelte SwiftUI-Skill-Files werden beim Import nicht in die aktiven `.claude/skills/` kopiert; das Vollarchiv bleibt separat zur Referenz.
