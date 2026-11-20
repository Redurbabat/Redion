/*
 * RED ION iOS - Apple's real system tab bar, not a CSS or custom glass capsule.
 * A standalone UITabBar is a supported UIKit control (Apple Developer: UITabBar).
 * The iOS 26 SDK gives this system component its adaptive Liquid Glass design.
 *
 * The existing Capacitor WKWebView stays the only content/navigation owner.
 * No changes to Redion data, web/PWA, workspace or MCP.
 */
import UIKit
import WebKit

private final class RedionNativeDock: NSObject, WKScriptMessageHandler,
                                      UITabBarDelegate, UIGestureRecognizerDelegate {
    static let shared = RedionNativeDock()
    private static var started = false

    private let labels = ["Dokumente", "Heute", "Lernen", "Termine", "Mehr"]
    private let symbols = ["book.closed", "house", "graduationcap", "calendar", "ellipsis"]
    private weak var webView: WKWebView?
    private let nativeMore = RedionNativeMoreCoordinator()
    private var systemBar: UITabBar?
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

            if systemBar == nil {
                // No visual imitation, custom blur, capsule background or
                // UITabBarAppearance override. UIKit chooses the OS material.
                let bar = UITabBar(frame: .zero)
                bar.delegate = self
                bar.translatesAutoresizingMaskIntoConstraints = false
                bar.isTranslucent = true
                bar.tintColor = .label
                bar.unselectedItemTintColor = .secondaryLabel
                let items = zip(labels, symbols).enumerated().map { index, value in
                    UITabBarItem(title: value.0,
                                 image: UIImage(systemName: value.1),
                                 tag: index)
                }
                bar.setItems(items, animated: false)
                bar.selectedItem = items.first
                bar.isHidden = true // Wait for WebView to report its real tab state.
                bar.accessibilityIdentifier = "redion-native-system-tab-bar"
                root.view.addSubview(bar)
                NSLayoutConstraint.activate([
                    bar.leadingAnchor.constraint(equalTo: root.view.leadingAnchor, constant: 12),
                    bar.trailingAnchor.constraint(equalTo: root.view.trailingAnchor, constant: -12),
                    bar.bottomAnchor.constraint(equalTo: root.view.safeAreaLayoutGuide.bottomAnchor, constant: -8),
                    bar.heightAnchor.constraint(equalToConstant: 68)
                ])
                let swipe = UIPanGestureRecognizer(target: self, action: #selector(onSwipeUp(_:)))
                swipe.delegate = self
                swipe.maximumNumberOfTouches = 1
                bar.addGestureRecognizer(swipe)
                systemBar = bar
                nativeMore.install(root: root, web: web, below: bar)
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

    // Native UITabBar handles pointer tracking, highlighted states, VoiceOver,
    // rendering and material. Only the route is delegated to the old Redion app.
    func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
        guard (0..<labels.count).contains(item.tag) else { return }
        if item.tag == 4 { nativeMore.resetForMoreTab() }
        webView?.evaluateJavaScript(
            "window.__redionNativeDockSelect?.(\(item.tag));",
            completionHandler: nil)
        UISelectionFeedbackGenerator().selectionChanged()
    }

    @objc private func onSwipeUp(_ gesture: UIPanGestureRecognizer) {
        guard gesture.state == .ended, let bar = systemBar else { return }
        let vector = gesture.translation(in: bar)
        guard vector.y < -32, abs(vector.y) > abs(vector.x) else { return }
        let x = gesture.location(in: bar).x
        let index = max(0, min(labels.count - 1,
                               Int(x / max(1, bar.bounds.width) * CGFloat(labels.count))))
        webView?.evaluateJavaScript(
            "window.__redionNativeDockTargets?.(\(index));",
            completionHandler: nil)
    }

    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer,
                           shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool {
        true
    }

    func userContentController(_ controller: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard message.name == "redionDock",
              let data = message.body as? [String: Any],
              let selected = data["selected"] as? Int,
              (0..<labels.count).contains(selected) else { return }
        DispatchQueue.main.async { [weak self] in
            guard let self, let bar = self.systemBar else { return }
            bar.selectedItem = bar.items?[selected]
            bar.overrideUserInterfaceStyle =
                (data["theme"] as? String) == "light" ? .light : .dark
            let visible = (data["visible"] as? Bool) ?? true
            bar.isHidden = !visible
            self.nativeMore.sync(selected: selected, dockVisible: visible)

            // Hide the legacy web bar only AFTER the real system bar exists.
            // It keeps its DOM geometry so Redion's existing content clearance
            // and navigation state still work without data migration.
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
      // Install native-only suppression BEFORE reporting selection to UIKit.
      // Visibility rather than display:none preserves the hidden 5-tab DOM
      // geometry, which Redion's existing route/gesture logic still reads.
      // The old bar, its moving pill, labels and decorative layers must not
      // paint or accept touches under the real system UITabBar.
      const sheet = document.createElement('style');
      sheet.id = 'redion-native-only-tabbar-style';
      sheet.textContent =
        "html.redion-ios-native-dock #handy-oben," +
        "html.redion-ios-native-dock #handy-oben *," +
        "html.redion-ios-native-dock #handy-oben::before," +
        "html.redion-ios-native-dock #handy-oben::after{" +
        "visibility:hidden!important;opacity:0!important;" +
        "pointer-events:none!important;" +
        "}";
      (document.head || document.documentElement).appendChild(sheet);
      document.documentElement.classList.add('redion-ios-native-dock');
      // Keep the old DOM as a private click target, not a second accessible
      // toolbar. Programmatic .click() continues to use Redion's one router.
      const legacyBar = document.getElementById('handy-oben');
      legacyBar?.setAttribute('aria-hidden', 'true');
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
        const editing = !!(input && (/^(INPUT|TEXTAREA)$/.test(input.tagName) || input.isContentEditable));
        const bar = buttons[0].parentElement;
        const dockShown = !!(bar && bar.getClientRects().length && getComputedStyle(bar).display !== 'none');
        const keyboard = !!(window.visualViewport && window.visualViewport.height < window.innerHeight - 140);
        window.webkit?.messageHandlers?.redionDock?.postMessage({
          selected: current < 0 ? 0 : current,
          theme: document.documentElement.dataset.theme || 'dark',
          visible: dockShown && !modal && !editing && !keyboard
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
      window.visualViewport?.addEventListener('resize', queue);
      document.addEventListener('DOMContentLoaded', queue, {once:true});
      if (document.body) {
        new MutationObserver(queue).observe(document.body, {
          childList:true, subtree:true, attributes:true,
          attributeFilter:['class', 'style', 'hidden', 'aria-hidden', 'data-dokument']
        });
      }
      queue();
    })();
    """#
}
