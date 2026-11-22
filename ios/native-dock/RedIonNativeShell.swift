import SwiftUI
import UIKit
import Capacitor

// Prototype only: this shell is not installed into SceneDelegate yet.
@available(iOS 26.0, *)
enum RedIonSection: String, CaseIterable, Hashable {
    case home, learn, workspace, projects, settings

    var title: String {
        switch self {
        case .home: "Start"
        case .learn: "Lernen"
        case .workspace: "Workspace"
        case .projects: "Projekte"
        case .settings: "Einstellungen"
        }
    }

    var symbol: String {
        switch self {
        case .home: "house"
        case .learn: "book"
        case .workspace: "square.grid.2x2"
        case .projects: "folder"
        case .settings: "gearshape"
        }
    }
}

// Host the Capacitor controller ONCE, outside individual tab contents.
// Moving one UIViewController between five tab hosts is unsafe.
@available(iOS 26.0, *)
struct RedIonCapacitorHost: UIViewControllerRepresentable {
    let controller: CAPBridgeViewController

    func makeUIViewController(context: Context) -> CAPBridgeViewController {
        controller
    }

    func updateUIViewController(_ uiViewController: CAPBridgeViewController, context: Context) {}
}

@available(iOS 26.0, *)
struct RedIonNativeShell: View {
    let bridgeController: CAPBridgeViewController
    @State private var selected: RedIonSection = .home

    var body: some View {
        ZStack {
            // A stable single Capacitor instance owns the entire content area.
            RedIonCapacitorHost(controller: bridgeController)

            // System-owned native tab bar. Tabs intentionally have no second
            // web view; the router handshake must be completed before enabling.
            TabView(selection: $selected) {
                ForEach(RedIonSection.allCases, id: \.self) { section in
                    Tab(section.title, systemImage: section.symbol, value: section) {
                        Color.clear
                            .allowsHitTesting(false)
                    }
                }
            }
            .tabBarMinimizeBehavior(.never)
        }
    }
}
