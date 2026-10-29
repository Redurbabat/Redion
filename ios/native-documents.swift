// Wird ausschließlich in die generierte SceneDelegate eingebunden.
// Dateien werden koordiniert KOPIERT. Originale werden niemals verändert.
private final class RedionDocumentInbox {
    static let shared = RedionDocumentInbox()
    private var delivering = false
    private var attempts = 0
    private var failed = Set<String>()
    private let allowed = Set(["pdf", "redion", "json", "txt", "md", "png", "jpg", "jpeg", "webp", "gif"])

    private func root() throws -> URL {
        let documents = try FileManager.default.url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
        let inbox = documents.appendingPathComponent("NativeInbox", isDirectory: true)
        try FileManager.default.createDirectory(at: inbox, withIntermediateDirectories: true)
        return inbox
    }

    func accept(_ url: URL, window: UIWindow?) {
        guard url.isFileURL, allowed.contains(url.pathExtension.lowercased()) else { return }
        // Arbeit am File Provider nicht auf dem UIKit-Hauptthread.
        DispatchQueue.global(qos: .userInitiated).async {
            let access = url.startAccessingSecurityScopedResource()
            defer { if access { url.stopAccessingSecurityScopedResource() } }
            do {
                let root = try self.root()
                guard !url.standardizedFileURL.path.hasPrefix(root.standardizedFileURL.path + "/") else { return }
                let id = UUID().uuidString.lowercased()
                let folder = root.appendingPathComponent(id, isDirectory: true)
                var coordinationError: NSError?
                var copyError: Error?
                NSFileCoordinator().coordinate(readingItemAt: url, options: [], error: &coordinationError) { coordinated in
                    do {
                        let values = try coordinated.resourceValues(forKeys: [.isRegularFileKey, .isSymbolicLinkKey, .fileSizeKey])
                        guard values.isRegularFile == true, values.isSymbolicLink != true,
                              let size = values.fileSize, size < 4_294_967_296 else {
                            throw NSError(domain: "RedionDocument", code: 1)
                        }
                        let ext = url.pathExtension.lowercased()
                        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: false)
                        let target = folder.appendingPathComponent("payload." + ext)
                        try FileManager.default.copyItem(at: coordinated, to: target)
                        let copied = try target.resourceValues(forKeys: [.fileSizeKey])
                        guard copied.fileSize == size else { throw NSError(domain: "RedionDocument", code: 2) }
                        let payload: [String: Any] = ["id": id, "name": url.lastPathComponent, "size": size,
                            "path": "NativeInbox/" + id + "/payload." + ext]
                        try JSONSerialization.data(withJSONObject: payload).write(to: folder.appendingPathComponent("manifest.json"), options: .atomic)
                    } catch { copyError = error }
                }
                if let error = coordinationError { throw error }
                if let error = copyError { throw error }
                DispatchQueue.main.async { self.foreground(window: window) }
            } catch {
                DispatchQueue.main.async {
                    let alert = UIAlertController(title: "Datei nicht übernommen", message: "Die Datei konnte nicht vollständig kopiert werden. Das Original bleibt unverändert. Bitte in Dateien erneut mit Redion öffnen.", preferredStyle: .alert)
                    alert.addAction(UIAlertAction(title: "OK", style: .default))
                    window?.rootViewController?.present(alert, animated: true)
                }
            }
        }
    }

    func foreground(window: UIWindow?) {
        attempts = 0
        failed.removeAll()
        drain(window: window)
    }

    private func drain(window: UIWindow?) {
        guard !delivering,
              let web = (window?.rootViewController as? CAPBridgeViewController)?.webView,
              let inbox = try? root(),
              let folders = try? FileManager.default.contentsOfDirectory(at: inbox, includingPropertiesForKeys: nil),
              let folder = folders.sorted(by: { $0.lastPathComponent < $1.lastPathComponent }).first(where: {
                  guard UUID(uuidString: $0.lastPathComponent) != nil && !failed.contains($0.lastPathComponent),
                        let values = try? $0.resourceValues(forKeys: [.isDirectoryKey, .isSymbolicLinkKey]),
                        values.isDirectory == true, values.isSymbolicLink != true else { return false }
                  let manifest = $0.appendingPathComponent("manifest.json")
                  guard let info = try? manifest.resourceValues(forKeys: [.isRegularFileKey, .isSymbolicLinkKey, .fileSizeKey]),
                        info.isRegularFile == true, info.isSymbolicLink != true,
                        let size = info.fileSize, size < 4096,
                        let data = try? Data(contentsOf: manifest),
                        let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                        object["id"] as? String == $0.lastPathComponent else { return false }
                  return true
              }),
              let data = try? Data(contentsOf: folder.appendingPathComponent("manifest.json")), data.count < 4096,
              let payload = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return }
        delivering = true
        web.callAsyncJavaScript("return await (window.RedionNativeDocuments?.receive(payload) ?? 'wait')",
            arguments: ["payload": payload], in: nil, contentWorld: .page) { [weak self] result in
            guard let self = self else { return }
            self.delivering = false
            if case .success(let value) = result, let status = value as? String, status == "done" {
                // Nur unsere bestätigte Arbeitskopie löschen, niemals das Original.
                try? FileManager.default.removeItem(at: folder)
                self.drain(window: window)
            } else if case .success(let value) = result, let status = value as? String, status == "error" {
                self.failed.insert(folder.lastPathComponent)
                self.drain(window: window)
            } else if self.attempts < 45 {
                self.attempts += 1
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.7) { self.drain(window: window) }
            }
        }
    }
}
