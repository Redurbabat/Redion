/*
 * RED ION - native iPhone More, Settings and Files screens.
 *
 * The SwiftUI views below are rendered by UIKit, not inside WKWebView.
 * The existing web workspace remains the source of truth for documents,
 * accounts, sync, MCP and features not yet ported to iOS.
 * Files are inspected read-only. There is NO automatic data migration,
 * deletion, schema reset or second document store.
 */
import SwiftUI
import UIKit
import WebKit
import QuickLook

private struct RedionNativeMenuItem: Identifiable {
    let id: String
    let title: String
    let subtitle: String
    let symbol: String
}

private struct RedionNativeMenuRow: View {
    let title: String
    let subtitle: String
    let symbol: String

    var body: some View {
        Label {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .foregroundStyle(.primary)
                Text(subtitle)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            .padding(.vertical, 4)
        } icon: {
            Image(systemName: symbol)
                .frame(width: 28)
                .foregroundStyle(.secondary)
        }
    }
}

private struct RedionNativeMoreView: View {
    let openWeb: (String) -> Void

    private let workspace = [
        RedionNativeMenuItem(id: "workspace", title: "Seiten & Wissen",
            subtitle: "Deine Seiten und Sammlungen", symbol: "doc.text"),
        RedionNativeMenuItem(id: "schublade", title: "Arbeitsbereich",
            subtitle: "Seitenbaum und Bereiche", symbol: "square.grid.2x2")
    ]
    private let tools = [
        RedionNativeMenuItem(id: "kompass", title: "Kompass",
            subtitle: "Alle Funktionen entdecken", symbol: "safari"),
        RedionNativeMenuItem(id: "befehle", title: "Befehle",
            subtitle: "Aktionen suchen und starten", symbol: "command"),
        RedionNativeMenuItem(id: "tasten", title: "Tastenkürzel",
            subtitle: "Übersicht der Befehle", symbol: "keyboard"),
        RedionNativeMenuItem(id: "vorlagen", title: "Vorlagen",
            subtitle: "Vorbereitete Seiten", symbol: "square.on.square")
    ]
    private let data = [
        RedionNativeMenuItem(id: "sichern", title: "Sicherung erstellen",
            subtitle: "Deine bestehenden Daten sichern", symbol: "externaldrive"),
        RedionNativeMenuItem(id: "import", title: "Importieren",
            subtitle: "Dateien und Sicherungen einlesen", symbol: "square.and.arrow.down"),
        RedionNativeMenuItem(id: "inbox", title: "Posteingang",
            subtitle: "Erinnerungen und Nachrichten", symbol: "tray"),
        RedionNativeMenuItem(id: "wolke", title: "Wolke",
            subtitle: "Konto und Geräteabgleich", symbol: "icloud"),
        RedionNativeMenuItem(id: "papierkorb", title: "Papierkorb",
            subtitle: "Gelöschte Seiten wiederherstellen", symbol: "trash")
    ]

    private func entries(_ items: [RedionNativeMenuItem]) -> some View {
        ForEach(items) { item in
            Button {
                openWeb(item.id)
            } label: {
                RedionNativeMenuRow(title: item.title,
                    subtitle: item.subtitle, symbol: item.symbol)
            }
            .tint(.primary)
            .accessibilityHint("Öffnet die bestehende RED ION Funktion")
        }
    }

    var body: some View {
        NavigationStack {
            List {
                Section("Dein Arbeitsbereich") {
                    entries(workspace)
                }
                Section("Werkzeuge") {
                    entries(tools)
                }
                Section("Daten und Sicherheit") {
                    entries(data)
                }
                Section("System") {
                    NavigationLink {
                        RedionNativeSettingsView(openWeb: openWeb)
                    } label: {
                        RedionNativeMenuRow(title: "Einstellungen",
                            subtitle: "Native iPhone-Ansicht und weitere Optionen",
                            symbol: "gearshape")
                    }
                    NavigationLink {
                        RedionNativeAboutView()
                    } label: {
                        RedionNativeMenuRow(title: "Über RED ION",
                            subtitle: "Version und iOS-Plattform", symbol: "info.circle")
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Mehr")
        }
        .accessibilityIdentifier("redion-native-more")
    }
}

private struct RedionNativeSettingsView: View {
    let openWeb: (String) -> Void

    var body: some View {
        List {
            Section("Auf diesem iPhone") {
                NavigationLink {
                    RedionNativeFilesView()
                } label: {
                    Label("Sicherungen & Exporte", systemImage: "folder")
                }
                NavigationLink {
                    RedionNativeAboutView()
                } label: {
                    Label("Über diese App", systemImage: "info.circle")
                }
            }
            Section {
                Button {
                    openWeb("einstellungen")
                } label: {
                    Label("Alle RED ION Einstellungen", systemImage: "slider.horizontal.3")
                }
                Button {
                    openWeb("wolke")
                } label: {
                    Label("Konto & Geräteabgleich", systemImage: "icloud")
                }
            } header: {
                Text("Bestehende App-Funktionen")
            } footer: {
                Text("Konten, Daten, MCP und andere vorhandene Einstellungen bleiben unverändert in RED ION. Sie werden schrittweise nativ umgesetzt.")
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Einstellungen")
        .navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("redion-native-settings")
    }
}

private struct RedionNativeFile: Identifiable {
    let url: URL
    let bytes: Int64
    let modified: Date?
    var id: String { url.path }
}

private struct RedionNativeFilesView: View {
    @State private var backups: [RedionNativeFile] = []
    @State private var exports: [RedionNativeFile] = []
    @State private var preview: URL?
    @State private var search = ""

    private func files(in folderName: String) -> [RedionNativeFile] {
        guard let documents = FileManager.default.urls(
            for: .documentDirectory, in: .userDomainMask).first else { return [] }
        let directory = documents.appendingPathComponent(folderName, isDirectory: true)
        guard let urls = try? FileManager.default.contentsOfDirectory(
            at: directory,
            includingPropertiesForKeys: [
                .isRegularFileKey, .isSymbolicLinkKey, .fileSizeKey,
                .contentModificationDateKey
            ],
            options: [.skipsHiddenFiles]) else { return [] }
        return urls.compactMap { url in
            guard let values = try? url.resourceValues(forKeys: [
                .isRegularFileKey, .isSymbolicLinkKey, .fileSizeKey,
                .contentModificationDateKey
            ]), values.isRegularFile == true, values.isSymbolicLink != true
            else { return nil }
            return RedionNativeFile(url: url,
                bytes: Int64(values.fileSize ?? 0),
                modified: values.contentModificationDate)
        }.sorted { ($0.modified ?? .distantPast) > ($1.modified ?? .distantPast) }
    }

    private func reload() {
        backups = files(in: "Backups")
        exports = files(in: "Exporte")
    }

    private func section(_ name: String, files: [RedionNativeFile]) -> some View {
        Section(name) {
            let displayed = files.filter {
                search.isEmpty || $0.url.lastPathComponent.localizedCaseInsensitiveContains(search)
            }
            if displayed.isEmpty {
                Text(files.isEmpty ? "Noch keine Dateien vorhanden" : "Keine passenden Dateien")
                    .foregroundStyle(.secondary)
            } else {
                ForEach(displayed) { file in
                    HStack(spacing: 12) {
                        Button {
                            preview = file.url
                        } label: {
                            Label {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(file.url.lastPathComponent)
                                        .lineLimit(2)
                                        .foregroundStyle(.primary)
                                    Text(ByteCountFormatter.string(
                                        fromByteCount: file.bytes, countStyle: .file))
                                        .font(.footnote)
                                        .foregroundStyle(.secondary)
                                }
                            } icon: {
                                Image(systemName: "doc")
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .buttonStyle(.plain)
                        Spacer(minLength: 4)
                        ShareLink(item: file.url) {
                            Image(systemName: "square.and.arrow.up")
                        }
                        .accessibilityLabel("Datei teilen: \(file.url.lastPathComponent)")
                    }
                }
            }
        }
    }

    var body: some View {
        List {
            section("Sicherungen", files: backups)
            section("Exporte", files: exports)
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Dateien auf diesem iPhone")
        .navigationBarTitleDisplayMode(.inline)
        .searchable(text: $search)
        .onAppear(perform: reload)
        .refreshable { reload() }
        .quickLookPreview($preview)
        .accessibilityIdentifier("redion-native-files")
    }
}

private struct RedionNativeAboutView: View {
    private var version: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "–"
    }
    private var build: String {
        Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "–"
    }

    var body: some View {
        List {
            Section("RED ION") {
                LabeledContent("App-Version", value: version)
                LabeledContent("Build", value: build)
                LabeledContent("Plattform", value: "iOS " + UIDevice.current.systemVersion)
                LabeledContent("Bundle-ID", value: Bundle.main.bundleIdentifier ?? "–")
            }
            Section {
                Text("Diese iPhone-Ansicht ist nativ mit SwiftUI. Die bisherigen RED ION Dokumente und der Workspace bleiben während der Migration in ihrer vorhandenen Speicherung erhalten.")
                    .foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Über RED ION")
        .navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("redion-native-about")
    }
}

private final class RedionNativeMoreCoordinator {
    private weak var webView: WKWebView?
    private var host: UIHostingController<RedionNativeMoreView>?
    private var allowNativeMore = true

    private let allowedActions: Set<String> = [
        "workspace", "schublade", "kompass", "befehle", "tasten",
        "vorlagen", "sichern", "import", "inbox", "wolke",
        "papierkorb", "einstellungen"
    ]

    func install(root: UIViewController, web: WKWebView, below bar: UITabBar) {
        webView = web
        guard host == nil else { return }

        let controller = UIHostingController(
            rootView: RedionNativeMoreView(openWeb: { [weak self] action in
                self?.openWebAction(action)
            }))
        controller.view.translatesAutoresizingMaskIntoConstraints = false
        controller.view.backgroundColor = .systemBackground
        controller.view.isHidden = true
        root.addChild(controller)
        root.view.insertSubview(controller.view, belowSubview: bar)
        NSLayoutConstraint.activate([
            controller.view.topAnchor.constraint(equalTo: root.view.topAnchor),
            controller.view.leadingAnchor.constraint(equalTo: root.view.leadingAnchor),
            controller.view.trailingAnchor.constraint(equalTo: root.view.trailingAnchor),
            controller.view.bottomAnchor.constraint(equalTo: bar.topAnchor, constant: -4)
        ])
        controller.didMove(toParent: root)
        host = controller
    }

    func resetForMoreTab() {
        allowNativeMore = true
    }

    func sync(selected: Int, dockVisible: Bool) {
        if selected != 4 { allowNativeMore = true }
        host?.view.isHidden = !(selected == 4 && dockVisible && allowNativeMore)
    }

    private func openWebAction(_ action: String) {
        guard allowedActions.contains(action), let web = webView else { return }
        // Temporarily expose the existing web workspace. Never fake native
        // versions of cloud sync, import, backup or account operations.
        allowNativeMore = false
        host?.view.isHidden = true
        let javaScript = "document.querySelector('#page .home [data-a=\(action)]')?.click();"
        web.evaluateJavaScript(javaScript, completionHandler: nil)
    }
}
