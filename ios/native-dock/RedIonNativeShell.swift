import SwiftUI
import UIKit
import Capacitor

// Opt-in native iOS 26 shell. Do not replace the existing SceneDelegate
// until web-to-native navigation and existing Capacitor plugins are tested.
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

// A single CAPBridgeViewController is hosted to preserve the web app's
// session and plugin lifecycle while native tabs change.
@available(iOS 26.0, *)
struct RedIonCapacitorHost: UIViewControllerRepresentable {
    let controller: CAPBridgeViewController

    func makeUIViewController(context: Context) -> CAPBridgeViewController {
        controller
    }

    func updateUIViewController(_ controller: CAPBridgeViewController, context: Context) {}
}

@available(iOS 26.0, *)
struct RedIonNativeShell: View {
    let bridgeController: CAPBridgeViewController
    @State private var selected: RedIonSection = .home

    var body: some View {
        TabView(selection: $selected) {
            ForEach(RedIonSection.allCases, id: \.self) { section in
                Tab(section.title, systemImage: section.symbol, value: section) {
                    Group {
                        if selected == section {
                            RedIonCapacitorHost(controller: bridgeController)
                                .ignoresSafeArea(edges: [])
                        } else {
                            Color.clear
                        }
                    }
                }
            }
        }
        .tabBarMinimizeBehavior(.never)
        // NOTE: Selection-to-web routing must be wired to the actual
        // application router before enabling this shell in production.
    }
}
