/*
 * RED ION - echtes SwiftUI-Dock nur im nativen iPhone-Build.
 * Erst nach Capacitor sync an AppDelegate.swift angehaengt.
 * Web/PWA, MCP, Dokumente und gespeicherte Daten bleiben unberuehrt.
 */
import UIKit
import SwiftUI
import WebKit

private final class RedionDockState: ObservableObject {
    @Published var selectedIndex = 0
    @Published var active = false
    @Published var darkTheme = true
    let labels = ["Dokumente", "Heute", "Lernen", "Termine", "Mehr"]
    let symbols = ["book.closed", "house", "graduationcap", "calendar", "ellipsis"]
    var select: ((Int) -> Void)?
    var openTargets: ((Int) -> Void)?
}

private struct RedionSwiftDock: View {
    @ObservedObject var state: RedionDockState

    private var tabs: some View {
        HStack(spacing: 2) {
            ForEach(0..<state.labels.count, id: \.self) { index in
                Button {
                    state.select?(index)
                } label: {
                    VStack(spacing: 3) {
                        Image(systemName: state.symbols[index])
                            .font(.system(size: 21, weight: .regular))
                            .frame(height: 26)
                        Text(state.labels[index])
                            .font(.system(size: 10, weight: state.selectedIndex == index ? .semibold : .regular))
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)
                    }
                    .foregroundStyle(state.selectedIndex == index ? Color.primary : Color.secondary)
                    .frame(maxWidth: .infinity)
                    .frame(height: 57)
                    .background {
                        if state.selectedIndex == index {
                            Capsule()
                                .fill(Color.primary.opacity(0.10))
                                .overlay {
                                    Capsule().strokeBorder(Color.primary.opacity(0.09), lineWidth: 0.7)
                                }
                        }
                    }
                    .contentShape(Capsule())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(state.labels[index])
                .accessibilityAddTraits(state.selectedIndex == index ? [.isSelected] : [])
                .simultaneousGesture(DragGesture(minimumDistance: 22)
                    .onEnded { gesture in
                        if gesture.translation.height < -32 {
                            state.openTargets?(index)
                        }
                    })
            }
        }
        .padding(6)
    }

    var body: some View {
        Group {
            if #available(iOS 26.0, *) {
                tabs.glassEffect(.regular, in: Capsule())
            } else {
                tabs.background(.ultraThinMaterial, in: Capsule())
                    .overlay { Capsule().strokeBorder(Color.primary.opacity(0.12), lineWidth: 0.5) }
            }
        }
        .environment(\.colorScheme, state.darkTheme ? .dark : .light)
        .opacity(state.active ? 1 : 0)
        .allowsHitTesting(state.active)
        .accessibilityHidden(!state.active)
    }
}

private final class RedionNativeDock: NSObject, WKScriptMessageHandler {
    static let shared = RedionNativeDock()
    private static var started = false
    private let state = RedionDockState()
    private weak var webView: WKWebView?
    private var host: UIHostingController<RedionSwiftDock>?
    private var attempt = 0
    private var registered = false

    static func start() {
        guard !started else { return }
        started = true
        let instance = shared
        NotificationCenter.default.addObserver(instance,
            selector: #selector(checkWindow),
            name: UIScene.didActivateNotification, object: nil)
        NotificationCenter.default.addObserver(instance,
            selector: #selector(checkWindow),
            name: UIApplication.didBecomeActiveNotification, object: nil)
        instance.checkWindow()
    }

    @objc private func checkWindow() {
        guard Thread.isMainThread else {
            DispatchQueue.main.async { [weak self] in self?.checkWindow() }
            return
        }
        if let webView, webView.window != nil { return }
        attempt = 0
        locateWebView()
    }

    private func locateWebView() {
        let windows = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
        for window in windows where !window.isHidden {
            guard let root = window.rootViewController,
                  let web = findWebView(root.view) else { continue }
            webView = web
            if host == nil {
                let viewController = UIHostingController(rootView: RedionSwiftDock(state: state))
                viewController.view.backgroundColor = .clear
                viewController.view.isOpaque = false
                viewController.view.translatesAutoresizingMaskIntoConstraints = false
                root.addChild(viewController)
                root.view.addSubview(viewController.view)
                NSLayoutConstraint.activate([
                    viewController.view.leadingAnchor.constraint(equalTo: root.view.leadingAnchor, constant: 12),
                    viewController.view.trailingAnchor.constraint(equalTo: root.view.trailingAnchor, constant: -12),
                    viewController.view.bottomAnchor.constraint(equalTo: root.view.safeAreaLayoutGuide.bottomAnchor, constant: -8),
                    viewController.view.heightAnchor.constraint(equalToConstant: 72)
                ])
                viewController.didMove(toParent: root)
                host = viewController
            }
            state.select = { [weak self] index in
                self?.webView?.evaluateJavaScript(
                    "window.__redionNativeDockSelect?.(" + String(index) + ");",
                    completionHandler: nil)
                UISelectionFeedbackGenerator().selectionChanged()
            }
            state.openTargets = { [weak self] index in
                self?.webView?.evaluateJavaScript(
                    "window.__redionNativeDockTargets?.(" + String(index) + ");",
                    completionHandler: nil)
            }
            if !registered {
                let controller = web.configuration.userContentController
                controller.add(self, name: "redionDock")
                controller.addUserScript(WKUserScript(source: Self.bridgeJavaScript,
                    injectionTime: .atDocumentEnd, forMainFrameOnly: true))
                registered = true
            }
            web.evaluateJavaScript(Self.bridgeJavaScript, completionHandler: nil)
            return
        }
        attempt += 1
        if attempt < 80 {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { [weak self] in
                self?.locateWebView()
            }
        }
    }

    private func findWebView(_ view: UIView) -> WKWebView? {
        if let web = view as? WKWebView { return web }
        for child in view.subviews {
            if let web = findWebView(child) { return web }
        }
        return nil
    }

    func userContentController(_ controller: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard message.name == "redionDock",
              let data = message.body as? [String: Any],
              let selected = data["selected"] as? Int,
              (0..<state.labels.count).contains(selected) else { return }
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.state.selectedIndex = selected
            self.state.darkTheme = (data["theme"] as? String) != "light"
            self.state.active = (data["visible"] as? Bool) ?? true
            // Erst die native Leiste bereitstellen, dann das HTML-Dock
            // transparent machen; Geometrie und bisherige .click()-Route bleiben.
            self.webView?.evaluateJavaScript(
                "document.documentElement.classList.add('redion-ios-native-dock')",
                completionHandler: nil)
        }
    }

    private static let bridgeJavaScript = #"""
    (() => {
      if (window.__redionNativeDockBridgeInstalled) {
        window.__redionNativeDockSync?.();
        return;
      }
      window.__redionNativeDockBridgeInstalled = true;
      const sheet = document.createElement('style');
      sheet.textContent =
        "html.redion-ios-native-dock #handy-oben{" +
        "opacity:0!important;pointer-events:none!important}";
      (document.head || document.documentElement).appendChild(sheet);
      const selector = '#handy-oben > button[role="tab"]';
      let barObserver, bodyObserver;
      let frame = false;
      function sync() {
        frame = false;
        const buttons = Array.from(document.querySelectorAll(selector));
        if (buttons.length !== 5) return;
        if (!barObserver) {
          barObserver = new MutationObserver(queue);
          barObserver.observe(buttons[0].parentElement, {
            attributes: true, subtree: true,
            attributeFilter: ['aria-selected', 'class', 'hidden']
          });
        }
        const current = buttons.findIndex(b => b.getAttribute('aria-selected') === 'true');
        const settings = document.querySelector('.einst-fenster');
        const modal = !!(settings && settings.getClientRects().length);
        const input = document.activeElement;
        const editing = !!(input && /^(INPUT|TEXTAREA)$/.test(input.tagName) && input !== document.body);
        window.webkit?.messageHandlers?.redionDock?.postMessage({
          selected: current < 0 ? 0 : current,
          theme: document.documentElement.dataset.theme || 'dark',
          visible: !modal && !editing
        });
      }
      function queue() {
        if (!frame) { frame = true; requestAnimationFrame(sync); }
      }
      window.__redionNativeDockSync = queue;
      window.__redionNativeDockSelect = index => {
        const b = document.querySelectorAll(selector)[index];
        if (b) { b.click(); queue(); }
      };
      window.__redionNativeDockTargets = index => {
        const b = document.querySelectorAll(selector)[index];
        if (b) b.dispatchEvent(new KeyboardEvent('keydown',
          {key:'ArrowUp', bubbles:true, cancelable:true}));
      };
      bodyObserver = new MutationObserver(queue);
      bodyObserver.observe(document.documentElement, {
        attributes:true, attributeFilter:['data-theme']
      });
      document.addEventListener('focusin', queue);
      document.addEventListener('focusout', queue);
      document.addEventListener('DOMContentLoaded', queue, {once:true});
      if (document.body) {
        new MutationObserver(queue).observe(document.body, {
          childList:true, subtree:true
        });
      }
      queue();
    })();
    """#
}
