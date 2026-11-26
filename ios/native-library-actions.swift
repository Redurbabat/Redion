/*
 * iPhone document-card actions and library filters use UIKit action sheets.
 * The existing Redion menu is the sole source of available actions,
 * permissions, confirmation dialogs and actual execution.
 */
import UIKit
import WebKit

private final class RedionNativeLibraryActions: NSObject, WKScriptMessageHandlerWithReply, UIAdaptivePresentationControllerDelegate {
    static let shared = RedionNativeLibraryActions()
    private weak var installedWebView: WKWebView?
    private weak var activeSheet: UIAlertController?
    private var retries = 0
    private var cancelActive: (() -> Void)?

    static func start() {
        let instance = shared
        NotificationCenter.default.addObserver(instance, selector: #selector(activate),
            name: UIScene.didActivateNotification, object: nil)
        instance.activate()
    }

    @objc private func activate() {
        guard Thread.isMainThread else {
            DispatchQueue.main.async { [weak self] in self?.activate() }
            return
        }
        retries = 0
        install()
    }

    private func install() {
        guard UIDevice.current.userInterfaceIdiom == .phone else { return }
        let windows = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
        guard let web = windows.lazy.filter({ !$0.isHidden })
            .compactMap({ redionBridgeWebView(in: $0) }).first else {
            retries += 1
            if retries < 40 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { [weak self] in self?.install() }
            }
            return
        }
        if installedWebView !== web {
            let controller = web.configuration.userContentController
            controller.removeScriptMessageHandler(forName: "redionLibraryActions", contentWorld: .page)
            controller.addScriptMessageHandler(self, contentWorld: .page, name: "redionLibraryActions")
            controller.addUserScript(WKUserScript(source: Self.bridge, injectionTime: .atDocumentEnd, forMainFrameOnly: true))
            installedWebView = web
        }
        web.evaluateJavaScript(Self.bridge, completionHandler: nil)
    }

    func userContentController(_ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage, replyHandler: @escaping (Any?, String?) -> Void) {
        guard message.name == "redionLibraryActions", message.frameInfo.isMainFrame,
              let web = message.webView, web === installedWebView,
              let window = web.window, window.windowScene?.activationState == .foregroundActive,
              let root = window.rootViewController, root.presentedViewController == nil,
              activeSheet == nil, let payload = message.body as? [String: Any],
              let title = payload["title"] as? String, title.count <= 120,
              let rows = payload["rows"] as? [[String: Any]], (1...24).contains(rows.count) else {
            replyHandler(nil, "Native menu unavailable")
            return
        }
        var entries: [(String, Bool)] = []
        for row in rows {
            guard let name = row["title"] as? String, !name.isEmpty, name.count <= 120,
                  let destructive = row["destructive"] as? Bool else {
                replyHandler(nil, "Invalid menu")
                return
            }
            entries.append((name, destructive))
        }
        let sheet = UIAlertController(title: title, message: nil, preferredStyle: .actionSheet)
        activeSheet = sheet
        var replied = false
        let finish: (Int) -> Void = { [weak self, weak sheet] index in
            guard !replied else { return }
            replied = true
            // Let UIKit dismiss the sheet before the original web action can
            // open another native dialog, file picker or share sheet.
            func afterDismissal(_ remaining: Int) {
                if let sheet, sheet.presentingViewController != nil, remaining > 0 {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                        afterDismissal(remaining - 1)
                    }
                } else {
                    self?.activeSheet = nil
                    self?.cancelActive = nil
                    replyHandler(index, nil)
                }
            }
            DispatchQueue.main.async { afterDismissal(40) }
        }
        for (index, entry) in entries.enumerated() {
            sheet.addAction(UIAlertAction(title: entry.0, style: entry.1 ? .destructive : .default) { _ in finish(index) })
        }
        sheet.addAction(UIAlertAction(title: "Abbrechen", style: .cancel) { _ in finish(-1) })
        // iPhone only; still provide a valid popover anchor for compact UIKit.
        if let popover = sheet.popoverPresentationController {
            popover.sourceView = root.view
            popover.sourceRect = CGRect(x: root.view.bounds.midX, y: root.view.bounds.maxY - 1, width: 1, height: 1)
            popover.permittedArrowDirections = []
        }
        cancelActive = { finish(-1) }
        sheet.presentationController?.delegate = self
        root.present(sheet, animated: true) { [weak self, weak sheet] in
            sheet?.presentationController?.delegate = self
        }
    }

    func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
        guard presentationController.presentedViewController === activeSheet else { return }
        cancelActive?()
    }

    private static let bridge = #"""
    (() => {
      if (window.__redionLibraryActionsInstalled) return;
      window.__redionLibraryActionsInstalled = true;
      let busy = false;
      const selector = '.bib-deckel-mehr[data-mehr-id], .bib [data-orte], .bib [data-art-wahl], .bib [data-form-wahl]';
      const filterTitles = [['data-orte','Ort'],['data-art-wahl','Art'],['data-form-wahl','Darstellung']];
      // Mobile Menue.menu() returns a .blatt before applying desktop role=menu.
      const menuSelector = '.menu.blatt, .menu[role="menu"]';
      document.addEventListener('click', event => {
        // Only an actual user tap on a library card's original action button.
        if (!event.isTrusted || event.detail === 0 || busy ||
            document.hidden || document.getElementById('sperrschirm')) return;
        const anchor = event.target?.closest?.(selector);
        if (!anchor || anchor.disabled || anchor.getAttribute('aria-disabled') === 'true') return;
        const filterTitle = filterTitles.find(([attribute]) => anchor.getAttribute(attribute) !== null)?.[1];
        const handler = window.webkit?.messageHandlers?.redionLibraryActions;
        if (!handler) return;
        const previous = document.querySelector(menuSelector);
        // Capture only observes. The existing click handler creates the
        // authorized menu (it stops bubbling); read it after that event.
        setTimeout(async () => {
          if (busy || document.hidden || document.getElementById('sperrschirm') ||
              !anchor.isConnected || anchor.getAttribute('aria-expanded') !== 'true') return;
          const menu = document.querySelector(menuSelector);
          if (!menu || menu === previous || !menu.isConnected ||
              menu.querySelector('.ru-tropfen-kopf, input, select, textarea')) return;
          // The selected card must still own this specific menu. Otherwise
          // leave the DOM menu alone rather than forwarding a stale action.
          const cardLabel = anchor.getAttribute('aria-label') || '';
          const label = menu.getAttribute('aria-label') || '';
          const heading = (menu.querySelector('.blatt-titel')?.textContent || '').trim();
          if (filterTitle) {
            if ((heading || label) !== filterTitle) return;
          } else if (menu.classList.contains('blatt')) {
            if (!heading || cardLabel !== 'Aktionen für „' + heading + '“') return;
          } else if (label !== cardLabel.slice(0,120)) return;
          const buttons = [...menu.querySelectorAll(filterTitle ? 'button[data-wahl][role="menuitemradio"]' : 'button[data-a]')]
            .filter(b => !b.disabled && !b.hidden && b.getAttribute('aria-disabled') !== 'true' && b.getClientRects().length);
          const rows = buttons.map(b => {
            const clone = b.cloneNode(true);
            clone.querySelectorAll('.mi,.ms').forEach(n => n.remove());
            let name = (clone.textContent || '').trim();
            // Keep the active option and its group visible in a flat UIKit
            // action sheet. The action ID and state remain in Redion.
            if (filterTitle && name) {
              if (filterTitle === 'Ort') {
                const group = b.closest('[role="group"]');
                const groupID = group?.getAttribute('aria-labelledby');
                const groupName = groupID ? document.getElementById(groupID)?.textContent?.trim() : '';
                if (groupName) name = groupName + ': ' + name;
              }
              if (b.getAttribute('aria-checked') === 'true') name = '✓ ' + name;
            }
            return {title: name.slice(0,120),
                    destructive: !filterTitle && (b.hasAttribute('data-gefahr') || b.classList.contains('rot'))};
          });
          if (!rows.length || rows.length > 24 || rows.some(r => !r.title)) return;
          const title = (filterTitle || heading || anchor.getAttribute('aria-label') || 'Aktionen').trim().slice(0,120);
          const backdrop = document.querySelector('.menu-grund');
          const hidden = [menu, backdrop].filter(Boolean).map(el => [el, el.style.visibility, el.getAttribute('aria-hidden')]);
          const restore = () => hidden.forEach(([el, visibility, aria]) => {
            el.style.visibility = visibility;
            if (aria === null) el.removeAttribute('aria-hidden');
            else el.setAttribute('aria-hidden', aria);
          });
          busy = true;
          hidden.forEach(([el]) => { el.style.visibility = 'hidden'; el.setAttribute('aria-hidden','true'); });
          try {
            const selected = await handler.postMessage({title,rows});
            restore();
            if (!menu.isConnected || document.querySelector(menuSelector) !== menu) return;
            if (anchor.isConnected && anchor.getAttribute('aria-expanded') === 'true' &&
                !document.hidden && !document.getElementById('sperrschirm') &&
                Number.isInteger(selected) && selected >= 0 && selected < buttons.length &&
                buttons[selected].isConnected && !buttons[selected].disabled &&
                buttons[selected].getAttribute('aria-disabled') !== 'true') {
              buttons[selected].click();
            } else {
              // Reuse Redion's own cancellation/focus restoration.
              document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
            }
          } catch {
            // UIKit unavailable: keep the original functional web menu.
            restore();
          } finally {
            busy = false;
          }
        },0);
      },true);
    })();
    """#
}
