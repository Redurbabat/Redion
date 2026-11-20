/*
 * RED ION - native iPhone document reader and conservative text editor.
 *
 * Existing IndexedDB via WKWebView remains the sole writable store.
 * This bridge does not create another copy or migrate documents.
 * Only plain direct text blocks and the page title can be edited.
 * Unsupported/complex blocks stay in the classic editor.
 * All writes require authorization, an exact expected value and modified
 * timestamp, a persisted version BEFORE mutation, and a successful flush.
 */
import SwiftUI
import UIKit
import WebKit

private struct RedionNativeTextBlock: Identifiable {
    let id: String
    let type: String
    let text: String
    let edited: String
    let canEdit: Bool
}

private struct RedionNativeDocument: Identifiable {
    let id: String
    let title: String
    let edited: String
    let blocks: [RedionNativeTextBlock]
    let moreBlocks: Bool
    let canEditTitle: Bool
}

private final class RedionNativeEditorModel: ObservableObject {
    @Published var presented = false
    @Published var loading = false
    @Published var saving = false
    @Published var document: RedionNativeDocument?
    @Published var warning: String?
    @Published var editingId: String?
    @Published var proposedText = ""

    private weak var web: WKWebView?
    private var openingId: String?
    private var originalText = ""
    private var originalEdited = ""
    private var generation = 0

    init(web: WKWebView) {
        self.web = web
    }

    func open(_ id: String) {
        guard !id.isEmpty, !saving, let web else { return }
        generation += 1
        let request = generation
        openingId = id
        document = nil
        warning = nil
        loading = true
        presented = true
        web.callAsyncJavaScript(Self.readScript,
            arguments: ["pageId": id], in: nil, in: .page) { [weak self] result in
            DispatchQueue.main.async {
                guard let self, self.generation == request else { return }
                self.loading = false
                switch result {
                case .success(let data):
                    guard let result = data as? [String: Any],
                          result["ok"] as? Bool == true,
                          let title = result["title"] as? String,
                          let edited = result["edited"] as? String,
                          let rows = result["blocks"] as? [[String: Any]] else {
                        self.warning = "Die Seite konnte nicht sicher gelesen werden."
                        return
                    }
                    let blocks = rows.compactMap { row -> RedionNativeTextBlock? in
                        guard let id = row["id"] as? String,
                              let type = row["type"] as? String,
                              let text = row["text"] as? String,
                              let edited = row["edited"] as? String
                        else { return nil }
                        return RedionNativeTextBlock(id: id, type: type,
                            text: text, edited: edited,
                            canEdit: row["canEdit"] as? Bool ?? false)
                    }
                    self.document = RedionNativeDocument(id: id, title: title,
                        edited: edited, blocks: blocks,
                        moreBlocks: result["moreBlocks"] as? Bool ?? false,
                        canEditTitle: result["canEditTitle"] as? Bool ?? false)
                case .failure:
                    self.warning = "Die Daten sind momentan nicht erreichbar."
                }
            }
        }
    }

    func beginEditTitle() {
        guard !saving, let p = document, p.canEditTitle else { return }
        editingId = p.id
        originalText = p.title
        originalEdited = p.edited
        proposedText = p.title
    }

    func beginEditBlock(_ block: RedionNativeTextBlock) {
        guard !saving, block.canEdit else { return }
        editingId = block.id
        originalText = block.text
        originalEdited = block.edited
        proposedText = block.text
    }

    func discardEdit() {
        guard !saving else { return }
        editingId = nil
        proposedText = ""
    }

    func saveEdit() {
        guard !saving, let doc = document, let editingId, let web else { return }
        let proposed = proposedText
        guard proposed != originalText else {
            discardEdit()
            return
        }
        saving = true
        warning = nil
        web.callAsyncJavaScript(Self.writeScript,
            arguments: [
                "pageId": doc.id,
                "blockId": editingId,
                "expectedText": originalText,
                "expectedEdited": originalEdited,
                "replacement": proposed
            ], in: nil, in: .page) { [weak self] result in
            DispatchQueue.main.async {
                guard let self else { return }
                self.saving = false
                if case .success(let data) = result,
                    let payload = data as? [String: Any],
                    payload["ok"] as? Bool == true {
                    self.editingId = nil
                    self.proposedText = ""
                    self.open(doc.id) // Reload truth from Store, not an optimistic mirror.
                } else {
                    // Keep unsaved text in the sheet; never overwrite silently.
                    self.warning = "Nicht gespeichert. Die Seite wurde möglicherweise anderswo geändert oder der Speicher ist nicht bereit. Dein Entwurf bleibt hier erhalten."
                }
            }
        }
    }

    func close() {
        guard !saving, editingId == nil else { return }
        presented = false
        generation += 1
    }

    private static let readScript = #"""
    const p = typeof Store !== 'undefined' &&
       typeof Store.getBlock === 'function' ? Store.getBlock(pageId) : null;
    const allowed = typeof Konten !== 'undefined' &&
       typeof Konten.darf === 'function';
    const ready = window.__redionNativeLibraryLoaded === true &&
       !document.getElementById('sperrschirm');
    if (!ready || !allowed || !p || !p.alive || p.type !== 'page' ||
        p.system || p.archiviert || !Konten.darf('lesen', p.id)) {
      return {ok:false};
    }
    const all = Store.childrenOf(p.id);
    const direct = all.filter(b => b && b.alive &&
      Konten.darf('lesen', b.id));
    const safeText = b => b.type === 'text' &&
      (!Array.isArray(b.content) || b.content.length === 0) &&
      !b.richText && !b.marks && !b.inline && !b.formatted;
    return {
      ok:true, title:String(p.text || ''), edited:String(p.edited || ''),
      canEditTitle:!Store.speichertNicht() && Konten.darf('bearbeiten',p.id),
      moreBlocks:direct.length > 200,
      blocks:direct.slice(0,200).map(b => ({
        id:String(b.id), type:String(b.type), edited:String(b.edited || ''),
        text:safeText(b) || ['h1','h2','h3','quote','bullet','number','todo','code'].includes(b.type)
          ? String(b.text || '') : '',
        canEdit:!Store.speichertNicht() && safeText(b) &&
          Konten.darf('bearbeiten',p.id) && Konten.darf('bearbeiten',b.id)
      }))
    };
    """#

    private static let writeScript = #"""
    const page = typeof Store !== 'undefined' &&
        typeof Store.getBlock === 'function' ? Store.getBlock(pageId) : null;
    const block = typeof Store !== 'undefined' &&
        typeof Store.getBlock === 'function' ? Store.getBlock(blockId) : null;
    if (!page || !block || !page.alive || !block.alive ||
        page.type !== 'page' || page.system || page.archiviert ||
        window.__redionNativeLibraryLoaded !== true ||
        document.getElementById('sperrschirm') ||
        typeof Konten === 'undefined' ||
        !Konten.darf('bearbeiten',page.id) ||
        !Konten.darf('bearbeiten',block.id) ||
        Store.speichertNicht() || typeof replacement !== 'string' ||
        replacement.length > 1000000 ||
        typeof expectedText !== 'string' ||
        String(block.text || '') !== expectedText ||
        String(block.edited || '') !== expectedEdited) {
      return {ok:false,reason:'invalid_or_conflict'};
    }
    const isTitle = page.id === block.id;
    if (!isTitle) {
      const safe = block.type === 'text' &&
        (!Array.isArray(block.content) || block.content.length === 0) &&
        !block.richText && !block.marks && !block.inline && !block.formatted;
      const isChild = Store.childrenOf(page.id).some(b => b.id === block.id);
      if (!safe || !isChild) return {ok:false,reason:'unsupported'};
    }
    if (block.text === replacement) return {ok:true};
    // No mutations before the prior page version is durably recorded.
    const savedVersion = await Store.versionSpeichern(page.id,
      'vor nativer iPhone-Bearbeitung');
    if (!savedVersion) return {ok:false,reason:'no_version'};
    if (String(block.text || '') !== expectedText ||
        String(block.edited || '') !== expectedEdited ||
        !Konten.darf('bearbeiten',page.id) ||
        !Konten.darf('bearbeiten',block.id)) {
      return {ok:false,reason:'changed_while_saving'};
    }
    Store.updateBlock(block.id,{text:replacement});
    await Store.flush();
    await Store.settled();
    return {ok:true};
    """#
}

private struct RedionNativeEditorView: View {
    @ObservedObject var model: RedionNativeEditorModel
    let openClassic: (String) -> Void

    private func blockTitle(_ type: String) -> String {
        switch type {
        case "h1": return "Überschrift 1"
        case "h2": return "Überschrift 2"
        case "h3": return "Überschrift 3"
        case "text": return "Text"
        case "todo": return "Aufgabe"
        case "bullet": return "Aufzählung"
        case "number": return "Nummerierte Liste"
        case "quote": return "Zitat"
        default: return "Weiterer Inhalt"
        }
    }

    var body: some View {
        NavigationStack {
            List {
                if model.loading {
                    HStack {
                        ProgressView()
                        Text("Seite wird geladen …")
                    }
                } else if let doc = model.document {
                    Section {
                        HStack {
                            Text(doc.title.isEmpty ? "Ohne Titel" : doc.title)
                                .font(.title2.bold())
                            Spacer()
                            if doc.canEditTitle {
                                Button("Bearbeiten") {
                                    model.beginEditTitle()
                                }
                            }
                        }
                    }
                    Section("Inhalte") {
                        if doc.blocks.isEmpty {
                            Text("Keine Textblöcke vorhanden")
                                .foregroundStyle(.secondary)
                        }
                        ForEach(doc.blocks) { block in
                            VStack(alignment: .leading, spacing: 6) {
                                Text(blockTitle(block.type))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                if block.text.isEmpty {
                                    Text(block.canEdit ? "Leerer Absatz" : "Komplexer Inhalt")
                                        .foregroundStyle(.secondary)
                                } else {
                                    Text(block.text)
                                        .textSelection(.enabled)
                                        .lineLimit(9)
                                }
                                if block.canEdit {
                                    Button("Text bearbeiten") {
                                        model.beginEditBlock(block)
                                    }
                                    .font(.footnote)
                                } else {
                                    Text("Im vollständigen Editor verfügbar")
                                        .font(.caption2)
                                        .foregroundStyle(.tertiary)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                        if doc.moreBlocks {
                            Text("Weitere Blöcke im vollständigen Editor")
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                if let warning = model.warning {
                    Section {
                        Text(warning).foregroundStyle(.orange)
                    }
                }
                if let doc = model.document {
                    Section {
                        Button {
                            openClassic(doc.id)
                        } label: {
                            Label("Vollständigen Editor öffnen",
                                  systemImage: "arrow.up.forward.app")
                        }
                    } footer: {
                        Text("Datenbanken, Tabellen, Bilder, Formatierungen und weitere Blockarten bleiben im vollständigen RED ION Editor.")
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Seite")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Schliessen") { model.close() }
                        .disabled(model.saving || model.editingId != nil)
                }
            }
            .sheet(isPresented: Binding(
                get: { model.editingId != nil },
                set: { value in if !value { model.discardEdit() } }
            )) {
                NavigationStack {
                    VStack(alignment: .leading, spacing: 10) {
                        TextEditor(text: $model.proposedText)
                            .font(.body)
                            .padding(6)
                            .background(.regularMaterial,
                                        in: RoundedRectangle(cornerRadius: 12))
                    }
                    .padding()
                    .navigationTitle("Text bearbeiten")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .navigationBarLeading) {
                            Button("Abbrechen") { model.discardEdit() }
                                .disabled(model.saving)
                        }
                        ToolbarItem(placement: .navigationBarTrailing) {
                            Button("Sichern") { model.saveEdit() }
                                .disabled(model.saving)
                        }
                    }
                    if let warning = model.warning {
                        Text(warning)
                            .font(.caption)
                            .foregroundStyle(.orange)
                            .padding()
                    }
                }
                .interactiveDismissDisabled(model.saving)
            }
        }
        .accessibilityIdentifier("redion-native-document-editor")
    }
}
