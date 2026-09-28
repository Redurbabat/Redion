/* kern/einstellung/stand.ts — DER STAND DIESES BAUS (E361, L83)
 * ----------------------------------------------------------------------------
 * Geschrieben von dienststand.mts bei `npm run bauen:ts` — von Hand nicht
 * anfassen. `fassung` ist die Fassung des Dienst-Arbeiters (sw.ts),
 * `inhalt` der Stempel über den Grundstock, `gebaut` der Augenblick, in
 * dem sich der Inhalt zuletzt geändert hat. Die App zeigt es unter
 * „Über diese App", zusammen mit dem Weg, über den sie gerade läuft.
 * ==========================================================================*/
const Stand = { fassung: 1394, inhalt: '7c1af04ee9d1f50a', gebaut: '2026-09-28T13:38:02.241Z' } as const;

(window as any).Stand = Stand;
