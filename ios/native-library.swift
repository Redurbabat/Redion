/*
 * RED ION - read-only native iPhone document library.
 *
 * RED ION's existing IndexedDB/Store remains the single source of truth.
 * This view only requests metadata through WKWebView's page JS context.
 * No second database, migration, import, write, deletion or new document IDs.
 * Opening a page invokes App.oeffne only after rechecking access rights.
 */
import SwiftUI
import UIKit
import WebKit

private struct RedionNativePage: Identifiable {
    let id: String
    let title: String
    let icon: String
    let parentId: String?
    let edited: String
}

private final class RedionNativeLibraryModel: ObservableObject {
    @Published var pages: [RedionNativePage] = []
    @Published var isLoading = true
    @Published var warning: String? = nil

    func update(from value: Any?) -> Bool {
        guard let result = value as? [String: Any],
              let ready = result["ready"] as? Bool, ready,
              let items = result["documents"] as? [[String: Any]] else {
            return false
        }
        pages = items.compactMap { item in
            guard let id = item["id"] as? String, !id.isEmpty,
                  let title = item["title"] as? String else { return nil }
            return RedionNativePage(id: id, title: title,
                icon: item["icon"] as? String ?? "📄",
                parentId: item["parentId"] as? String,
                edited: item["edited"] as? String ?? "")
        }
        isLoading = false
        warning = nil
        return true
    }
}

private struct RedionNativeLibraryView: View {
    @ObservedObject var model: RedionNativeLibraryModel
    let refresh: () -> Void
    let open: (String) -> Void
    @State private var query = ""

    private var filtered: [RedionNativePage] {
        let list = model.pages
        if query.isEmpty {
            return list.sorted {
                if $0.parentId == nil && $1.parentId != nil { return true }
                if $0.parentId != nil && $1.parentId == nil { return false }
                return $0.edited > $1.edited
            }
        }
        return list.filter {
            $0.title.localizedCaseInsensitiveContains(query)
        }.sorted { $0.edited > $1.edited }
    }

    var body: some View {
        NavigationStack {
            List {
                if model.isLoading {
                    HStack(spacing: 12) {
                        ProgressView()
                        Text("Dokumente werden geladen …")
                            .foregroundStyle(.secondary)
                    }
                } else if let warning = model.warning {
                    ContentUnavailableView("Dokumente nicht verfügbar",
                        systemImage: "exclamationmark.triangle",
                        description: Text(warning))
                } else if filtered.isEmpty {
                    ContentUnavailableView(
                        query.isEmpty ? "Noch keine Seiten" : "Keine Treffer",
                        systemImage: "doc.text.magnifyingglass",
                        description: Text(query.isEmpty
                            ? "Deine vorhandenen RED ION Seiten erscheinen hier, sobald sie geladen sind."
                            : "Suche nach einem anderen Seitentitel."))
                } else {
                    ForEach(filtered) { page in
                        Button {
                            open(page.id)
                        } label: {
                            HStack(spacing: 12) {
                                Text(page.icon.isEmpty ? "📄" : page.icon)
                                    .font(.title3)
                                    .frame(width: 34, height: 36)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(page.title.isEmpty ? "Ohne Titel" : page.title)
                                        .font(.body)
                                        .foregroundStyle(.primary)
                                        .lineLimit(2)
                                    if page.parentId != nil {
                                        Text("Unterseite")
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                }
                                Spacer(minLength: 4)
                                Image(systemName: "chevron.right")
                                    .font(.footnote)
                                    .foregroundStyle(.tertiary)
                            }
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(
                            "Seite öffnen: " + (page.title.isEmpty ? "Ohne Titel" : page.title))
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Dokumente")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: refresh) {
                        Image(systemName: "arrow.clockwise")
                    }
                    .accessibilityLabel("Dokumente neu laden")
                }
            }
            .searchable(text: $query, prompt: "Seiten durchsuchen")
            .refreshable { refresh() }
        }
        .onAppear(perform: refresh)
        .accessibilityIdentifier("redion-native-document-library")
    }
}

private final class RedionNativeLibraryCoordinator {
    private weak var webView: WKWebView?
    private var host: UIHostingController<RedionNativeLibraryView>?
    private let model = RedionNativeLibraryModel()
    private var allowLibrary = true
    private var fetching = false
    private var tries = 0

    func install(root: UIViewController, web: WKWebView, below bar: UITabBar) {
        webView = web
        guard host == nil else { return }
        let controller = UIHostingController(rootView:
            RedionNativeLibraryView(model: model,
                refresh: { [weak self] in self?.refresh() },
                open: { [weak self] id in self?.openPage(id) }))
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

    func restoreForDocumentsTab() {
        allowLibrary = true
        tries = 0
    }

    func sync(selected: Int, dockVisible: Bool) {
        let show = selected == 0 && dockVisible && allowLibrary
        let wasHidden = host?.view.isHidden ?? true
        host?.view.isHidden = !show
        if show && wasHidden { refresh() }
    }

    private func refresh() {
        guard !fetching, let web = webView, allowLibrary else { return }
        fetching = true
        model.isLoading = true
        web.evaluateJavaScript(Self.listJavaScript) { [weak self] value, error in
            guard let self else { return }
            self.fetching = false
            if error == nil && self.model.update(from: value) {
                self.tries = 0
            } else if self.tries < 12 && self.allowLibrary {
                self.tries += 1
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { [weak self] in
                    self?.refresh()
                }
            } else {
                self.model.isLoading = false
                self.model.warning = "Der vorhandene RED ION Speicher ist noch nicht bereit. Die Originaldaten wurden nicht verändert."
            }
        }
    }

    private func openPage(_ id: String) {
        guard !id.isEmpty, let web = webView else { return }
        web.callAsyncJavaScript(Self.openJavaScript,
            arguments: ["pageId": id], in: nil, in: .page) { [weak self] response in
            guard let self else { return }
            if case .success(let value) = response, let accepted = value as? Bool, accepted {
                self.allowLibrary = false
                self.host?.view.isHidden = true
            } else {
                self.model.warning = "Diese Seite konnte nicht geöffnet werden. Deine Daten bleiben erhalten."
            }
        }
    }

    // Only metadata is transferred. Same permissions as editor automation.
    // Do not read page blocks, user text, file contents or cloud credentials.
    private static let listJavaScript = #"""
    (() => {
      if (typeof Store === 'undefined' || typeof Konten === 'undefined' ||
          typeof Konten.darf !== 'function' ||
          !Store.cache?.blocks || typeof App === 'undefined' ||
          typeof App.oeffne !== 'function') {
        return {ready:false, documents:[]};
      }
      const documents = Object.values(Store.cache.blocks)
        .filter(p => p && p.alive && p.type === 'page' &&
          p.parentTable !== 'collection' && !p.system && !p.archiviert &&
          Konten.darf('lesen', p.id))
        .slice(0, 1500).map(p => ({
          id: String(p.id),
          title: String(p.text || ''),
          icon: String(p.icon || '📄').slice(0, 12),
          parentId: typeof p.parentId === 'string' ? p.parentId : null,
          edited: String(p.edited || '')
        }));
      return {ready:true, documents};
    })()
    """#

    // Use WKWebView's argument binding instead of interpolating untrusted IDs
    // into executable JavaScript. Revalidate permissions before navigation.
    private static let openJavaScript = #"""
    const p = typeof Store !== 'undefined' &&
        typeof Store.getBlock === 'function' ? Store.getBlock(pageId) : null;
    if (!p || !p.alive || p.type !== 'page' || p.system ||
        typeof Konten === 'undefined' || !Konten.darf('lesen', p.id) ||
        typeof App === 'undefined' || typeof App.oeffne !== 'function') {
      return false;
    }
    App.oeffne(p.id);
    return true;
    """#
}
