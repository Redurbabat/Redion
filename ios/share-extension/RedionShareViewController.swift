import UIKit
import UniformTypeIdentifiers

// A separate iOS Share Extension process. It NEVER opens Redion's
// IndexedDB or uploads shared contents; only an App Group inbox is writable.
final class RedionShareViewController: UIViewController {
    private let groupID = "group.ch.redurbabat.redion.share"
    private var started = false

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        guard !started else { return }
        started = true
        view.backgroundColor = .systemBackground
        let label = UILabel()
        label.text = "In Redion übernehmen …"
        label.textColor = .label
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)
        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            label.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 20)
        ])
        let providers = (extensionContext?.inputItems as? [NSExtensionItem] ?? [])
            .flatMap { $0.attachments ?? [] }
        if let url = providers.first(where: {
            $0.hasItemConformingToTypeIdentifier(UTType.url.identifier)
        }) {
            load(url, type: UTType.url.identifier, kind: "url")
        } else if let text = providers.first(where: {
            $0.hasItemConformingToTypeIdentifier(UTType.plainText.identifier)
        }) {
            load(text, type: UTType.plainText.identifier, kind: "text")
        } else if let text = providers.first(where: {
            $0.hasItemConformingToTypeIdentifier(UTType.text.identifier)
        }) {
            load(text, type: UTType.text.identifier, kind: "text")
        } else {
            fail("Redion unterstützt hier Text und Weblinks.")
        }
    }

    private func load(_ provider: NSItemProvider, type: String, kind: String) {
        provider.loadItem(forTypeIdentifier: type, options: nil) { [weak self] item, error in
            guard let self = self, error == nil else {
                self?.fail("Der geteilte Inhalt konnte nicht gelesen werden.")
                return
            }
            let value: String?
            if let url = item as? URL {
                value = url.absoluteString
            } else if let string = item as? String {
                value = string
            } else if let data = item as? Data {
                value = String(data: data, encoding: .utf8)
            } else {
                value = nil
            }
            guard let value = value?.trimmingCharacters(in: .whitespacesAndNewlines),
                  !value.isEmpty, value.count <= 60000 else {
                self.fail("Der geteilte Text ist leer oder zu groß.")
                return
            }
            if kind == "url" {
                guard let url = URL(string: value),
                      ["https", "http"].contains(url.scheme?.lowercased() ?? ""),
                      url.user == nil, url.password == nil, value.count <= 4096 else {
                    self.fail("Nur normale Weblinks können übernommen werden.")
                    return
                }
            }
            do {
                guard let group = FileManager.default.containerURL(
                    forSecurityApplicationGroupIdentifier: self.groupID) else {
                    throw NSError(domain: "RedionShare", code: 1,
                        userInfo: [NSLocalizedDescriptionKey: "App Group fehlt"])
                }
                let inbox = group.appendingPathComponent("Inbox", isDirectory: true)
                try FileManager.default.createDirectory(at: inbox,
                    withIntermediateDirectories: true)
                let id = UUID().uuidString.lowercased()
                let record: [String: Any] = [
                    "id": id, "kind": kind, "value": value, "version": 1
                ]
                let bytes = try JSONSerialization.data(withJSONObject: record)
                try bytes.write(to: inbox.appendingPathComponent(id + ".json"), options: .atomic)
                // Never report success until the local App Group write succeeded.
                // Redion will import and ACK the item upon its next foreground.
                DispatchQueue.main.async {
                    self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
                }
            } catch {
                self.fail("Nicht gespeichert. App Group für Redion prüfen.")
            }
        }
    }

    private func fail(_ message: String) {
        DispatchQueue.main.async {
            let error = NSError(domain: "RedionShare", code: 2,
                userInfo: [NSLocalizedDescriptionKey: message])
            self.extensionContext?.cancelRequest(withError: error)
        }
    }
}
