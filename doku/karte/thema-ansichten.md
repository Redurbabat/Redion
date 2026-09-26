<!-- ERZEUGT — NICHT VON HAND ÄNDERN.
     Die Quelle ist doku/karte/karte.json. `node karte.mts` schreibt diese Datei neu;
     was hier von Hand geändert wird, ist beim nächsten Lauf weg. -->


---
tags: [redion, thema, ansichten]
stand: 26. September 2026
---

# Die Ansichten eines Dokuments — AFFiNEs zwei, Redions zwei, und die dritte

Stand 26. September 2026 · Quelle: ein Leser im AFFiNE-Archiv (MIT, nur gelesen) auf Redurs Frage hin: „bei der affine haben wir das es wechsel die ansichten und ich will dort auch die beide und plus von unsere aktuelle stand also mit cover usw also dort 3 bereiche". Jeder Punkt trägt Datei:Zeile vom Tag des Standes; wer später liest, prüft die Zeile, nicht den Satz.

## Die Kurzform

- AFFiNE hat GENAU ZWEI Dokumentmodi, nicht mehr: `type DocMode = 'edgeless' | 'page'` (`blocksuite/affine/model/src/consts/doc.ts:4-6`), gleich im Server (`packages/backend/server/src/models/common/doc.ts:17-25`) und im Umschalter, der hart zwei Einträge hat (`block-suite-mode-switch/index.tsx:25-36`).
- Es sind ZWEI ANSICHTEN DESSELBEN Dokuments, keine zwei Dokumente: beide lesen denselben Baum `affine:page` → `affine:surface` + n × `affine:note`.
- Was oft für einen dritten Modus gehalten wird, ist keiner: Präsentation ist ein Edgeless-WERKZEUG (`frameNavigator`, `blocks/frame/src/present-tool.ts:11`), Journal eine Doc-Eigenschaft, die Seitenleisten-Reiter sind Panels, „All docs" ist eine Liste von Dokumenten.

## Was der Seiten-Modus zeigt

- `PageRootBlockComponent` (`blocks/root/src/page/page-root-block.ts:52`), Hülle in `block-suite-editor/lit-adaper.tsx:256-296`: Doc-Icon, Titel (40 px/700), wahlweise Eigenschaftstabelle, Editor, Starter-Leiste, Rückverweise.
- KEIN Cover- oder Bannerbild. Gesucht nach `docCover|page-cover|coverImage|doc-banner` — es gibt nur das Vorschaubild INNERHALB einer Doc-Link-Karte. Ein Dokument-Cover existiert dort nicht; nur Icon und Titel. **Redion ist an dieser Stelle reicher** (Cover seit E283-Umfeld, `schale/aufbau/kopfleiste.ts:301`).
- Breite: `--affine-editor-width`, umschaltbar über die Doc-Eigenschaft `pageWidth` (`components/page-detail-editor.tsx:42-55`) — dasselbe wie Redions „Volle Breite".
- Unsichtbar im Seiten-Modus: die ganze Surface-Ebene (Formen, Verbinder, Freihand, Rahmen, Gedankenkarten, `affine:edgeless-text`) — der Surface-Block wird durch `affine-surface-void` ersetzt, das `nothing` rendert (`blocks/surface/src/view.ts:39-43`, `surface-block-void.ts:6-10`); dazu alle Notizen mit `displayMode === 'edgeless'` (`page-root-block.ts:407-415`).

## Was der Flächen-Modus zeigt

- `EdgelessRootBlockComponent` (`blocks/root/src/edgeless/edgeless-root-block.ts:51`): Punktraster, darin ein `gfx-viewport`, das BEIDES rendert — die Kinder der Wurzel (die Notizen) UND die Kinder des Surface.
- Der Seitentext erscheint als verschiebbarer Kasten mit eigener Kopfzeile (`note-edgeless-block.ts:247-348`; Kopf mit Titel/Emoji/Einklappen in `view-extensions/edgeless-block-header/edgeless-note-header.tsx:22-60`).
- Dazu die Werkzeuge, die es auf der Seite nicht gibt: Quick (Zeiger, Rahmen, Verbinder, Link) und Senior (Notiz, Form, Stift, Gedankenkarte, Vorlage) — je eine Extension unter `blocksuite/affine/gfx/*/toolbar/`.
- Zoom 10 % bis 600 % in Schritten von 25 (`framework/std/src/gfx/viewport.ts:19-21`); Zoomleiste mit „Fit to screen"; Präsentation springt von Rahmen zu Rahmen.
- Ein Rahmen lässt sich bewusst in die Seite holen: „Insert into Page" legt einen `affine:surface-ref` an (`blocks/frame/src/frame-toolbar.ts:49-70`) — ein VERWEIS, keine Kopie.

## Was beim Umschalten mit dem Inhalt passiert

- Nichts geht verloren. Je Notiz entscheidet `displayMode` mit drei Werten, wo sie erscheint: `NoteDisplayMode { DocAndEdgeless = 'both', DocOnly = 'doc', EdgelessOnly = 'edgeless' }` (`affine/model/src/consts/note.ts:38-42`).
- Auf der Seite Geschriebenes liegt in der ersten Notiz, die bei der Erzeugung `both` bekommt — auf der Fläche also ein Kasten an seiner `xywh`-Stelle.
- Mit dem Notiz-Werkzeug auf der Fläche Angelegtes bekommt `EdgelessOnly` (`gfx/note/src/note-tool.ts:305-318`) und trägt dort ein durchgestrichenes Auge mit „Hidden on page" (`widgets/edgeless-auto-connect/src/index.ts:265-268`).
- Der Schalter „Display in Page" verschiebt den Block dabei in der Kinderliste, damit die LESEREIHENFOLGE auf der Seite stimmt (`blocks/note/src/commands/change-note-display-mode.ts:20-52`) — mit Rückgängig-Hinweis.
- Umgeschaltet wird per Klick oder Alt+S; `mode` steht in der Adresse (`modules/editor/entities/editor.ts:120-198`). Scrollstand (Seite) und Mitte/Zoom (Fläche) werden GETRENNT gemerkt (`editor.ts:45-55`, `287-297`), der Flächen-Ausschnitt zusätzlich in `localStorage` (`shared/src/services/edit-props-store.ts:119-123`).
- Der Umschalter ändert NICHT, was beim nächsten Öffnen kommt. Das tut nur der Menüpunkt im „…" (`block-suite-header/menu/index.tsx:225-227`, setzt `primaryMode` am Dokument).

## Die Kopfzeile aus Redurs Bild

- Reihenfolge in `desktop/pages/workspace/detail-page/detail-page-header.tsx:154-186`: Umschalter, Titel, Vorlage-Abzeichen, Stern, (i), „…", rechts Präsentieren und Teilen.
- „Vorlage" ist NUR EIN HINWEIS, kein Knopf (`detail-page-header.tsx:62-78`); gesetzt wird es über die Eigenschaft `isTemplate`, und solche Dokumente erscheinen dann in der Vorlagenauswahl.
- Der Stern ist ein Favorit und liegt in der NUTZER-Datenbank, nicht in der des Arbeitsbereichs (`modules/db/schema/schema.ts:64-67`) — also pro Mensch, nicht pro Dokument.
- (i) öffnet den Dialog `doc-info`: Eigenschaftstabelle, Datenbank-Rückverweise, Links (`desktop/dialogs/doc-info/info-modal.tsx:97-150`).
- Präsentieren steht nur im Flächen-Modus und erst ab 400 px Breite (`use-header-responsive.ts:18`).

## Redions Stand daneben — und was fehlt

- SEITE: da, und reicher als AFFiNEs. Cover, Symbol, Titel, Sperrhinweis, Werkzeugzeile (`schale/aufbau/kopfleiste.ts:9-18`, Knöpfe :301-309: Cover, Volle Breite, Dokumentmodus, Rechner, Schrift, Vorlage, Mit KI).
- DOKUMENT: da, heisst „Dokumentmodus" (E126, `bereiche/pdf/document-mode.ts:9`). Miniaturen links, Arbeitsfläche, Inspector rechts; `available()` nur wenn die Seite wirklich `pdfseite`- oder `blatt`-Blöcke enthält (:609), `active()` liest `page.dokumentModus` (:610), `toggle()` schreibt es an den Block (:623-627). Der Schalter steht in der WERKZEUGZEILE unter dem Titel, nicht oben als Umschalter.
- FLÄCHE: fehlt als Ansicht. Redions Whiteboard, Gedankenkarte und Schaltplan sind BLÖCKE IN der Seite (`register/bloecke.ts:95-100`), kein Blick AUF die Seite. Das ist der ganze Unterschied.
- Die Datenfrage dahinter (§9, §17): AFFiNEs Fläche geht, weil eine Notiz zugleich Seiteninhalt und Canvas-Element ist (`NoteBlockModel extends GfxCompatible(BlockModel)`, `note-model.ts:119-121`). Redions Blöcke hängen in `content` der Seite und haben keinen Platz. Eine Fläche über die Seite braucht also ein Feld für den Platz und eines dafür, wo ein Block erscheinen soll.
- OFFEN, und es gehört Redur: (a) AFFiNEs Weg — jeder Block bekommt Platz und „wo erscheinen" (gutmütige Vorgabe wie bei `raumVersion`: kein Feld = wie bisher); oder (b) der kleine Weg — die Fläche ist ein Whiteboard über der ganzen Seite, auf dem der Seiteninhalt als EIN Kasten liegt. Beides zugleich wäre §8.

Zurück zur [[Redion|Übersicht]].
