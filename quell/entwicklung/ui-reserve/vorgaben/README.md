# Vorgaben — der Code, den Redur geschickt hat

Dieser Ordner ist **nicht** die UI-Reserve nebenan. Die Reserve
(`../komponenten/`) archiviert die 50 Uiverse-Einträge des Handoff-Katalogs
mit ihrem Autor. Hier liegt etwas anderes: CSS, das Redur im Gespräch
geschickt hat, mit dem Auftrag „finde heraus, wo das passen könnte".

Die Dateien liegen **unverändert** da, so wie sie ankamen. Sie werden nicht
geladen, nicht gebaut und sind in keinem Register — `test426` hält die
Reserve aus der App heraus, und für diesen Ordner gilt dasselbe.

## Warum sie nicht bei den Originalen liegen

Weil bei den meisten der Autor **nicht dabeisteht**. Ein Eintrag in
`katalog.json` behauptet mit `quelleStatus`, wie sicher der Ursprung ist;
ein Schnipsel ohne Namenszeile kann diese Behauptung nicht tragen. Die
einzige Ausnahme war Nr. 28 „Printer Process Card": dort stand
`/* From Uiverse.io by spotift_5948 */` in der ersten Zeile, der Name
stimmte mit dem Katalog überein, und das CSS liegt deshalb als
`../komponenten/28-printer-process-card/original.css` (E458).

Für alles Übrige gilt: die Vorgabe ist die Vorgabe, und die produktive
Redion-Fassung steht in `src/` — mit dem Grund, warum sie an genau dieser
Stelle steht, in `ENTSCHEIDUNGEN.md`.

## Was hier liegt

| Datei | Was drin ist | Wohin es in Redion ging |
|---|---|---|
| `loader-sammlung.css` | vierzehn Bauteile am Stück, von Redur am 6. September 2026 geschickt | siehe `doku/UI-KOMPONENTEN.md`, Abschnitt „Vorgaben vom 6. September" |
| `folder-card.css` | die 3D-Ordnerkarte, die sich beim Klick öffnet | dito |

## Die eine Regel, die auch hier gilt

**Nichts wird erfunden.** Ein Bauteil bekommt nur dann eine produktive
Fassung, wenn es in Redion etwas gibt, das es anzeigen kann: einen echten
Zustand, eine echte Zahl, eine echte Aktion. Ein Zähler ohne Daten, ein
Fortschritt ohne Anteil oder ein Schalter ohne Modus wäre eine Behauptung —
und die kostet mehr, als das Bauteil hübsch ist (§4.17, Auftrag §0.8).
