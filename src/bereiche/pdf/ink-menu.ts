/* E572: kleine Werkzeugfelder im obersten Browser-Layer. Kein Dokumentinhalt.
 * Die native Klappe übernimmt Escape und Aussenklick, auch im Vollbild.
 */
const InkMenu = (() => {
  const open = (anchor: HTMLElement, title: string, build: (body: HTMLElement, close: () => void) => void): void => {
    document.querySelectorAll<HTMLElement>('.blatt-popover').forEach(node => node.hidePopover());
    const panel = document.createElement('div');
    panel.className = 'blatt-popover'; panel.setAttribute('popover', 'auto');
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', title);
    const heading = document.createElement('header');
    const label = document.createElement('strong'); label.textContent = title;
    const exit = document.createElement('button'); exit.type = 'button';
    exit.textContent = '×'; exit.setAttribute('aria-label', title + ' schließen');
    heading.append(label, exit); panel.append(heading);
    const body = document.createElement('div'); body.className = 'blatt-popover-body'; panel.append(body);
    const close = () => panel.hidePopover();
    exit.onclick = close;
    build(body, close);
    const position = () => {
      const rect = anchor.getBoundingClientRect();
      const width = Math.min(380, window.innerWidth - 24);
      panel.style.width = width + 'px';
      panel.style.left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.left + rect.width / 2 - width / 2)) + 'px';
      const above = rect.top > window.innerHeight / 2;
      panel.style.top = above ? 'auto' : Math.max(12, Math.min(rect.bottom + 12, window.innerHeight - 150)) + 'px';
      panel.style.bottom = above ? Math.max(12, window.innerHeight - rect.top + 12) + 'px' : 'auto';
      panel.style.maxHeight = Math.max(100, (above ? rect.top : window.innerHeight - rect.bottom) - 24) + 'px';
    };
    document.body.append(panel); position();
    anchor.setAttribute('aria-expanded', 'true');
    panel.addEventListener('toggle', event => {
      if ((event as ToggleEvent).newState !== 'closed') return;
      anchor.setAttribute('aria-expanded', 'false');
      window.removeEventListener('resize', position);
      panel.remove();
      if (anchor.isConnected && (document.activeElement === document.body || panel.contains(document.activeElement))) anchor.focus({ preventScroll: true });
    });
    window.addEventListener('resize', position);
    panel.showPopover(); exit.focus({ preventScroll: true });
  };
  return { open };
})();
