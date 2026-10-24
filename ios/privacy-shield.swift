/*
 * Redion – iPhone-Datenschutz im App-Umschalter.
 *
 * Diese Swift-Klasse wird nur nach "npx cap sync ios" im Codemagic-iOS-Build
 * der ohnehin kompilierten AppDelegate.swift hinzugefügt.
 * Die Website, PWA, JS-Oberfläche und IndexedDB werden nicht verändert.
 *
 * Sie verdeckt den Inhalt vor einem Hintergrund-Snapshot, NICHT vor einem
 * entsperrten Nutzer. Sie ist KEINE Face-ID-Authentifizierung.
 */
import UIKit

private final class RedionPrivacyShield: NSObject {
    static let shared = RedionPrivacyShield()
    private static var started = false
    private var covers: [ObjectIdentifier: UIView] = [:]

    static func start() {
        guard !started else { return }
        started = true
        let instance = shared
        let notificationsToCover: [NSNotification.Name] = [
            UIApplication.willResignActiveNotification,
            UIScene.willDeactivateNotification
        ]
        let notificationsToUncover: [NSNotification.Name] = [
            UIApplication.didBecomeActiveNotification,
            UIScene.didActivateNotification
        ]
        for name in notificationsToCover {
            NotificationCenter.default.addObserver(instance,
                selector: #selector(coverForSnapshot),
                name: name, object: nil)
        }
        for name in notificationsToUncover {
            NotificationCenter.default.addObserver(instance,
                selector: #selector(removeSnapshotCover),
                name: name, object: nil)
        }
    }

    @objc private func coverForSnapshot() {
        if Thread.isMainThread {
            showCover()
        } else {
            DispatchQueue.main.async { [weak self] in self?.showCover() }
        }
    }

    @objc private func removeSnapshotCover() {
        if Thread.isMainThread {
            removeCover()
        } else {
            DispatchQueue.main.async { [weak self] in self?.removeCover() }
        }
    }

    private func showCover() {
        for scene in UIApplication.shared.connectedScenes {
            guard let windowScene = scene as? UIWindowScene else { continue }
            for window in windowScene.windows where !window.isHidden {
                let key = ObjectIdentifier(window)
                if let existing = covers[key] {
                    window.bringSubviewToFront(existing)
                    continue
                }
                // Opaque before iOS captures a snapshot. No user notes,
                // document previews, screenshots or private file names.
                let cover = UIView(frame: window.bounds)
                cover.backgroundColor = UIColor(red: 0.09, green: 0.10,
                                                blue: 0.12, alpha: 1.0)
                cover.autoresizingMask = [.flexibleWidth, .flexibleHeight]
                cover.isUserInteractionEnabled = true
                cover.accessibilityIdentifier = "redion-snapshot-privacy-cover"

                let label = UILabel()
                label.text = "Redion"
                label.textColor = .white
                label.font = UIFont.systemFont(ofSize: 23, weight: .semibold)
                label.textAlignment = .center
                label.translatesAutoresizingMaskIntoConstraints = false
                cover.addSubview(label)
                NSLayoutConstraint.activate([
                    label.centerXAnchor.constraint(equalTo: cover.centerXAnchor),
                    label.centerYAnchor.constraint(equalTo: cover.centerYAnchor)
                ])
                window.addSubview(cover)
                window.bringSubviewToFront(cover)
                covers[key] = cover
            }
        }
    }

    private func removeCover() {
        for view in covers.values {
            view.removeFromSuperview()
        }
        covers.removeAll()
    }
}
