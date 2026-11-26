/*
 * RED ION iOS - Apple's real system tab bar, without parallel native page overlays.
 * On iOS 26 a system UITabBarController owns four navigation tabs plus UISearchTab.
 * Three primary destinations, Mehr and system search fit without overflow.
 * The standalone UITabBar is only the older-system fallback.
 *
 * The existing Capacitor WKWebView stays the only content/navigation owner.
 * No changes to Redion data, web/PWA, workspace or MCP.
 */
import UIKit
import WebKit

private final class RedionNativeDock: NSObject, WKScriptMessageHandler,
                                      UITabBarDelegate, UITabBarControllerDelegate, UIGestureRecognizerDelegate {
    static let shared = RedionNativeDock()
    private static var started = false

    // Native order is independent of the WebView DOM order.
    private let labels = ["Heute", "Dokumente", "Lernen", "Mehr"]
    private let symbols = ["house", "book.closed", "graduationcap", "ellipsis"]
    private weak var webView: WKWebView?
    private var systemBar: UITabBar?
    private var nativeController: UITabBarController?
    private var sharedContent: UIViewController?
    private var hosts: [UIViewController] = []
    private var applyingWebSelection = false
    private var contentConstraints: [NSLayoutConstraint] = []
    private var keyboardVisible = false
    private var webDockVisible = false
    private var searchButton: UIButton?
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
        NotificationCenter.default.addObserver(instance,
            selector: #selector(keyboardWillShow),
            name: UIResponder.keyboardWillShowNotification, object: nil)
        NotificationCenter.default.addObserver(instance,
            selector: #selector(keyboardWillHide),
            name: UIResponder.keyboardWillHideNotification, object: nil)
        instance.checkWindow()
    }

    @objc private func checkWindow() {
        guard Thread.isMainThread else {
            DispatchQueue.main.async { [weak self] in self?.checkWindow() }
            return
        }
        if let webView, webView.window != nil {
            // Restore the bridge after returning from Files, share or app suspension.
            webView.evaluateJavaScript(Self.bridgeJavaScript, completionHandler: nil)
            return
        }
        attempt = 0
        locateWebView()
    }

    @objc private func keyboardWillShow() {
        keyboardVisible = true
        updateDockVisibility()
    }

    @objc private func keyboardWillHide() {
        keyboardVisible = false
        // Wait for the DOM focus/viewport to settle; do not force a hidden editor dock on.
        webView?.evaluateJavaScript("window.__redionNativeDockSync?.(true);", completionHandler: nil)
        updateDockVisibility()
    }

    private func updateDockVisibility() {
        let visible = webDockVisible && !keyboardVisible
        if #available(iOS 26.0, *), let controller = nativeController {
            if controller.isTabBarHidden == visible {
                controller.setTabBarHidden(!visible, animated: false)
            }
        } else if let bar = systemBar {
            bar.isHidden = !visible
            searchButton?.isHidden = !visible
        }
    }

    private func locateWebView() {
        let windows = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
        for window in windows where !window.isHidden {
            guard let root = window.rootViewController,
                  let web = findWebView(root.view) else { continue }
            webView = web

            if #available(iOS 26.0, *) {
                if nativeController == nil { installSystemController(in: window, content: root) }
            } else if systemBar == nil {
                // No visual imitation, custom blur, capsule background or
                // UITabBarAppearance override. UIKit chooses the OS material.
                let bar = UITabBar(frame: .zero)
                bar.delegate = self
                bar.translatesAutoresizingMaskIntoConstraints = false
                bar.isTranslucent = true
                bar.tintColor = .systemBlue
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
                let search = UIButton(type: .system)
                var configuration: UIButton.Configuration
                if #available(iOS 26.0, *) {
                    configuration = .glass()
                } else {
                    configuration = .gray()
                }
                configuration.cornerStyle = .capsule
                configuration.image = UIImage(systemName: "magnifyingglass")
                configuration.preferredSymbolConfigurationForImage = UIImage.SymbolConfiguration(pointSize: 24, weight: .regular)
                search.configuration = configuration
                search.tintColor = .label
                search.translatesAutoresizingMaskIntoConstraints = false
                search.accessibilityLabel = "Suchen"
                search.accessibilityIdentifier = "redion-native-search"
                search.addTarget(self, action: #selector(openSearch), for: .touchUpInside)
                search.isHidden = true
                root.view.addSubview(bar)
                root.view.addSubview(search)
                NSLayoutConstraint.activate([
                    bar.leadingAnchor.constraint(equalTo: root.view.safeAreaLayoutGuide.leadingAnchor, constant: 8),
                    search.trailingAnchor.constraint(equalTo: root.view.safeAreaLayoutGuide.trailingAnchor, constant: -8),
                    bar.trailingAnchor.constraint(equalTo: search.leadingAnchor, constant: -8),
                    bar.bottomAnchor.constraint(equalTo: root.view.safeAreaLayoutGuide.bottomAnchor, constant: -8),
                    bar.heightAnchor.constraint(equalToConstant: 68),
                    search.centerYAnchor.constraint(equalTo: bar.centerYAnchor),
                    search.widthAnchor.constraint(equalToConstant: 52),
                    search.heightAnchor.constraint(equalToConstant: 52)
                ])
                let swipe = UIPanGestureRecognizer(target: self, action: #selector(onSwipeUp(_:)))
                swipe.delegate = self
                swipe.maximumNumberOfTouches = 1
                bar.addGestureRecognizer(swipe)
                systemBar = bar
                searchButton = search
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

    // One existing Capacitor controller, never five WebViews or new data stores.
    @available(iOS 26.0, *)
    private func installSystemController(in window: UIWindow, content: UIViewController) {
        let controller = UITabBarController()
        sharedContent = content
        hosts = labels.map { _ in UIViewController() }
        let tabs = labels.indices.map { index -> UITab in
            let host = hosts[index]
            return UITab(title: labels[index], image: UIImage(systemName: symbols[index]),
                         identifier: "redion-tab-\(index)") { _ in host }
        }
        // Four destinations plus Apple's search tab: never six root tabs.
        let search = UISearchTab { _ in UIViewController() }
        // RED ION owns search results; no empty native search controller.
        search.automaticallyActivatesSearch = false
        controller.tabs = tabs + [search]
        controller.delegate = self
        controller.selectedTab = tabs.first
        controller.view.tintColor = .systemBlue
        controller.setTabBarHidden(true, animated: false)
        nativeController = controller
        window.rootViewController = controller
        mountSharedContent(in: hosts[0])
        let swipe = UIPanGestureRecognizer(target: self, action: #selector(onSwipeUp(_:)))
        swipe.delegate = self
        swipe.maximumNumberOfTouches = 1
        controller.tabBar.addGestureRecognizer(swipe)
    }

    private func mountSharedContent(in host: UIViewController) {
        guard let content = sharedContent, content.parent !== host else { return }
        NSLayoutConstraint.deactivate(contentConstraints)
        contentConstraints.removeAll()
        if content.parent != nil {
            content.willMove(toParent: nil)
            content.view.removeFromSuperview()
            content.removeFromParent()
        }
        host.addChild(content)
        content.view.translatesAutoresizingMaskIntoConstraints = false
        host.view.addSubview(content.view)
        contentConstraints = [
            content.view.leadingAnchor.constraint(equalTo: host.view.leadingAnchor),
            content.view.trailingAnchor.constraint(equalTo: host.view.trailingAnchor),
            content.view.topAnchor.constraint(equalTo: host.view.topAnchor),
            content.view.bottomAnchor.constraint(equalTo: host.view.bottomAnchor)
        ]
        NSLayoutConstraint.activate(contentConstraints)
        content.didMove(toParent: host)
    }

    @available(iOS 18.0, *)
    func tabBarController(_ tabBarController: UITabBarController, shouldSelectTab tab: UITab) -> Bool {
        if tab is UISearchTab {
            // The system search slot is an action; retain the active Capacitor page.
            openSearch()
            return false
        }
        // Re-tapping Mehr after navigating to Termine must reopen Mehr.
        if !applyingWebSelection, tabBarController.selectedTab?.identifier == tab.identifier,
           let index = tabBarController.tabs.firstIndex(where: { $0.identifier == tab.identifier }),
           hosts.indices.contains(index) {
            webView?.evaluateJavaScript("window.__redionNativeDockSelect?.(\(index));", completionHandler: nil)
            return false
        }
        return tabBarController.tabs.contains { $0.identifier == tab.identifier }
    }

    @available(iOS 18.0, *)
    func tabBarController(_ tabBarController: UITabBarController, didSelectTab selectedTab: UITab, previousTab: UITab?) {
        guard let index = tabBarController.tabs.firstIndex(where: { $0.identifier == selectedTab.identifier }),
              hosts.indices.contains(index) else { return }
        mountSharedContent(in: hosts[index])
        guard !applyingWebSelection else { return }
        webView?.evaluateJavaScript(
            "window.__redionNativeDockSelect?.(\(index));", completionHandler: nil)
        UISelectionFeedbackGenerator().selectionChanged()
    }

    @available(iOS 26.0, *)
    private func syncSystemController(_ controller: UITabBarController, selected: Int,
                                      theme: UIUserInterfaceStyle) {
        applyingWebSelection = true
        if controller.selectedTab?.identifier != controller.tabs[selected].identifier {
            controller.selectedTab = controller.tabs[selected]
        }
        mountSharedContent(in: hosts[selected])
        applyingWebSelection = false
        if controller.overrideUserInterfaceStyle != theme {
            controller.overrideUserInterfaceStyle = theme
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
        webView?.evaluateJavaScript(
            "window.__redionNativeDockSelect?.(\(item.tag));",
            completionHandler: nil)
        UISelectionFeedbackGenerator().selectionChanged()
    }

    @objc private func openSearch() {
        webView?.evaluateJavaScript("window.__redionNativeDockSearch?.();", completionHandler: nil)
    }

    @objc private func onSwipeUp(_ gesture: UIPanGestureRecognizer) {
        guard gesture.state == .ended, let bar = (gesture.view as? UITabBar) else { return }
        let vector = gesture.translation(in: bar)
        guard vector.y < -32, abs(vector.y) > abs(vector.x) else { return }
        let x = gesture.location(in: bar).x
        let slotCount = labels.count + (nativeController == nil ? 0 : 1)
        let index = max(0, Int(x / max(1, bar.bounds.width) * CGFloat(slotCount)))
        guard labels.indices.contains(index) else { return }
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
            guard let self else { return }
            let theme: UIUserInterfaceStyle =
                (data["theme"] as? String) == "light" ? .light : .dark
            self.webDockVisible = (data["visible"] as? Bool) ?? false
            if #available(iOS 26.0, *), let controller = self.nativeController {
                self.syncSystemController(controller, selected: selected, theme: theme)
            } else if let bar = self.systemBar {
                bar.selectedItem = bar.items?[selected]
                bar.overrideUserInterfaceStyle = theme
                self.searchButton?.overrideUserInterfaceStyle = bar.overrideUserInterfaceStyle
            } else { return }
            self.updateDockVisibility()

            // Hide the legacy web bar only AFTER the real system bar exists.
            // It keeps its DOM geometry so Redion's existing content clearance
            // and navigation state still work without data migration.
            self.webView?.evaluateJavaScript(
                "window.__redionNativeDockReady?.();",
                completionHandler: nil)
        }
    }

    private static let bridgeJavaScript = #"""
    (() => {
      if (window.__redionNativeDockBridgeInstalled) {
        window.__redionNativeDockSync?.(true);
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
      // Keep the old DOM as a private click target, not a second accessible
      // toolbar. Programmatic .click() continues to use Redion's one router.
      const legacyBar = document.getElementById('handy-oben');
      window.__redionNativeDockReady = () => {
        document.documentElement.classList.add('redion-ios-native-dock');
        if (legacyBar?.getAttribute('aria-hidden') !== 'true') legacyBar?.setAttribute('aria-hidden', 'true');
      };
      const routeIds = ['hl-start', 'hl-dok', 'hl-lernen', 'hl-mehr'];
      function routeButtons() {
        return routeIds.map(id => document.querySelector('#handy-oben > button[role="tab"]#' + id));
      }
      let barObserver, bodyObserver;
      let frame = false;
      let lastPayload = '';
      function sync() {
        frame = false;
        const buttons = routeButtons();
        if (buttons.some(b => !b)) return;
        if (!barObserver) {
          barObserver = new MutationObserver(queue);
          barObserver.observe(buttons[0].parentElement, {
            attributes: true, subtree: true,
            attributeFilter: ['aria-selected', 'class', 'hidden']
          });
        }
        const current = buttons.findIndex(b => b.getAttribute('aria-selected') === 'true');
        const calendar = document.getElementById('hl-bespr');
        const calendarSelected = calendar?.getAttribute('aria-selected') === 'true';
        const settings = document.querySelector('.einst-fenster');
        const finder = document.querySelector('.finder.such');
        const modal = !!(settings && settings.getClientRects().length) ||
          !!(finder && finder.getClientRects().length);
        const locked = !!document.getElementById('sperrschirm');
        const input = document.activeElement;
        const editing = !!(input && (/^(INPUT|TEXTAREA)$/.test(input.tagName) || input.isContentEditable));
        const bar = buttons[0].parentElement;
        const dockShown = !!(bar && bar.getClientRects().length && getComputedStyle(bar).display !== 'none');
        const keyboard = !!(window.visualViewport && window.visualViewport.height < window.innerHeight - 140);
        // Die Zeichenfläche besitzt ihr eigenes AFFiNE-Werkzeugdock.
        // Die Navigation und Suche liegen dort nicht über den Zeichenwerkzeugen.
        const drawing = Array.from(document.querySelectorAll('.document-studio, .pg-flaeche, .sp-voll, .gfx-presenting-screen'))
          .some(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
        const state = {
          selected: calendarSelected ? routeIds.indexOf('hl-mehr') : current < 0 ? 0 : current,
          locked,
          theme: document.documentElement.dataset.theme || 'dark',
          visible: dockShown && !modal && !locked && !editing && !keyboard && !drawing
        };
        const payload = JSON.stringify(state);
        if (payload === lastPayload) return;
        const handler = window.webkit?.messageHandlers?.redionDock;
        if (handler) { handler.postMessage(state); lastPayload = payload; }
      }
      function queue() {
        if (!frame) { frame = true; requestAnimationFrame(sync); }
      }
      window.__redionNativeDockSync = force => {
        if (force === true) lastPayload = '';
        queue();
      };
      window.__redionNativeDockSelect = index => {
        const b = routeButtons()[index];
        if (b) { b.click(); queue(); }
      };
      window.__redionNativeDockSearch = () => {
        const button = document.getElementById('btn-suche-handy');
        if (button && !button.disabled) button.click();
        queue();
      };
      window.__redionNativeDockTargets = index => {
        const b = routeButtons()[index];
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
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) window.__redionNativeDockSync(true);
      });
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

// Native share, documents and home shortcuts must find the same Capacitor WebView
// even when the system tab controller is the window root.
func redionBridgeWebView(in window: UIWindow?) -> WKWebView? {
    func find(_ view: UIView) -> WKWebView? {
        if let web = view as? WKWebView { return web }
        for child in view.subviews {
            if let web = find(child) { return web }
        }
        return nil
    }
    guard let root = window?.rootViewController else { return nil }
    return find(root.view)
}
