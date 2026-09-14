/* kern/einstellung/stand.ts — DER STAND DIESES BAUS (E361, L83)
 * ----------------------------------------------------------------------------
 * Geschrieben von dienststand.mts bei `npm run bauen:ts` — von Hand nicht
 * anfassen. `fassung` ist die Fassung des Dienst-Arbeiters (sw.ts),
 * `inhalt` der Stempel über den Grundstock, `gebaut` der Augenblick, in
 * dem sich der Inhalt zuletzt geändert hat. Die App zeigt es unter
 * „Über diese App", zusammen mit dem Weg, über den sie gerade läuft.
 * ==========================================================================*/
const Stand = { fassung: 1072, inhalt: 'de382b6cb135b18d', gebaut: '2026-09-14T23:05:53.356Z' } as const;

(window as any).Stand = Stand;
