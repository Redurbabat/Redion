/* kern/einstellung/stand.ts — DER STAND DIESES BAUS (E361, L83)
 * ----------------------------------------------------------------------------
 * Geschrieben von dienststand.mts bei `npm run bauen:ts` — von Hand nicht
 * anfassen. `fassung` ist die Fassung des Dienst-Arbeiters (sw.ts),
 * `inhalt` der Stempel über den Grundstock, `gebaut` der Augenblick, in
 * dem sich der Inhalt zuletzt geändert hat. Die App zeigt es unter
 * „Über diese App", zusammen mit dem Weg, über den sie gerade läuft.
 * ==========================================================================*/
const Stand = { fassung: 1095, inhalt: 'a4a9eb52822b8b53', gebaut: '2026-09-15T13:46:11.141Z' } as const;

(window as any).Stand = Stand;
