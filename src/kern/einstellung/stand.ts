/* kern/einstellung/stand.ts — DER STAND DIESES BAUS (E361, L83)
 * ----------------------------------------------------------------------------
 * Geschrieben von dienststand.mts bei `npm run bauen:ts` — von Hand nicht
 * anfassen. `fassung` ist die Fassung des Dienst-Arbeiters (sw.ts),
 * `inhalt` der Stempel über den Grundstock, `gebaut` der Augenblick, in
 * dem sich der Inhalt zuletzt geändert hat. Die App zeigt es unter
 * „Über diese App", zusammen mit dem Weg, über den sie gerade läuft.
 * ==========================================================================*/
const Stand = { fassung: 1275, inhalt: '6f516ddab82e3343', gebaut: '2026-09-21T13:16:52.261Z' } as const;

(window as any).Stand = Stand;
