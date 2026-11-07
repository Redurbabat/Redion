# RED Morph — SwiftUI Motion MasterKit (iPhone + Mac)

**Native SwiftUI-Implementierung der RED-Morph-Designsprache** zum bestehenden React-/Web-UI-Kit. Das vorhandene Webprojekt unter `app/` bleibt unverändert. Der SwiftPM-Modulname `SwiftUIMasterKit` bleibt für bestehende Imports stabil; RED Morph ist zunächst der Designsystem-Name, kein Breaking-API-Rename. Siehe `skills/red-morph/SKILL.md`.

## Sofort verwenden

1. In Xcode: File → Add Package Dependencies → Add Local …
2. Den Ordner `native/swiftui` wählen; Package `SwiftUIMasterKit` hinzufügen.
3. `import SwiftUIMasterKit` verwenden.

```swift
import SwiftUI
import SwiftUIMasterKit

struct WorkspaceView: View {
    @State private var workspace = KitWorkspace.discover
    @State private var expanded = false

    var body: some View {
        NavigationStack {
            Text("Meine App")
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .safeAreaInset(edge: .bottom) {
                    KitLayeredDock(selected: $workspace, isExpanded: $expanded) { group, tool in
                        print(group.rawValue, tool.title)
                    }
                }
        }
    }
}
```

Das zweite Dock erscheint beim **Hochziehen** oder durch die sichtbare Pfeiltaste. Je Hauptbereich sind andere Werkzeuge verfügbar. Auf macOS werden Hover, Kontextmenü und ⌘⇧D unterstützt. Die Werkzeuge sind bewusst Callbacks: Deine App implementiert die PDF-/Notiz-/Designaktionen.

Weitere Richtlinien: `docs/native-swiftui/`. KI-Skills: `.claude/skills/swiftui-*/`.

## Projektstatus

Diese GitHub-Integration enthält zunächst **das native Kernpackage und die vier Design-Skills**. Das ältere, umfassendere 47-Dateien-Archiv aus dem Chat (Demos, zusätzliche Effekte, Xcode-Projekt, Tests) ist **noch nicht vollständig in dieser Repo-Branch ausgepackt**. Deshalb nicht als vollständige Portierung oder geprüften Xcode-Build behandeln.

Systemanforderungen: iOS 17 / macOS 14, Swift 5.9. Ein vollständiger Apple-SDK-Build wurde hier nicht ausgeführt.

Bestehende Web-Skills unter `skills/web-design/` und `.claude/skills/touch-kit/` bleiben erhalten, weil sie weiterhin vom React-Web-UI-Kit benutzt werden. Keine unbelegte Massenlöschung.
