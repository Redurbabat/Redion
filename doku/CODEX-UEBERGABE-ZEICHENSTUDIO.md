# Codex-Übergabe: Redion-Zeichenstudio nach Goodnotes-Referenzen

**14. September 2026 · Arbeitsplan und ehrlicher Zwischenstand, keine Fertigmeldung.**

## 1. Auftrag zum direkten Weitergeben

> Arbeite im vorhandenen Redion-Projekt am Stift-/Zeichenteil weiter. Lies zuerst
> diese Übergabe, `CLAUDE.md`, E572 in `ENTSCHEIDUNGEN.md` und L157 in
> `LUECKEN.md`. Verwende den bereits angelegten Arbeitszweig und erhalte alle
> lokalen Änderungen. Baue das PDF-/Notizheft-Zeichenstudio anhand der sieben
> Goodnotes-Referenzen fertig: obere Werkzeugleiste, kontextbezogenes schwebendes
> Dock, Radierergrößen und Moduswahl, Formenwahl, Haftnotizfarben, Elementgalerie,
> Laser Punkt/Linie und sichtbares bedienbares Lineal. Alle zusätzlichen
> Redion-Werkzeuge bleiben erhalten. Ergänze dezente Mac-Dock-artige Hover- und
> Auswahlbewegung und verbessere die Icons. Dokumentiere Plan, Entscheidungen,
> erledigte Teile und echte Restlücken laufend. Prüfe die tatsächliche App,
> einschließlich Zeichnen, Undo/Redo, Speicherung, kleiner Bildschirme,
> reduzierter Bewegung und Offline-/Einzeldatei-Start. Zeige am Ende ein echtes
> Ergebnisbild. Nichts auf GitHub pushen, keine PR und `main` nicht verändern.

## 2. Arbeitsort und Git-Stand

```text
C:\Users\redur\Documents\ChatGPT\Redion\Redion-src
Remote: https://github.com/Redurbabat/Redion.git
Arbeitszweig: codex/drawing-reference-toolbar
Basis: d4a53c8e — E571 — Im Band selbst schieben
```

`git fetch origin` lief erfolgreich. Der neueste abgerufene Remote-Zweig nach
Commitdatum war `origin/claude/redion-tafel-wort`. Das ist **kein** Nachweis einer
GitHub-Push-Uhrzeit. Der lokale Baum war vor Beginn sauber. Der neue Zweig basiert
direkt darauf. Die hier begonnenen Änderungen sind **nicht committet und nicht
gepusht**. Nicht erneut eine alte `main` holen oder über den Zwischenstand kopieren.

Beim Weiterarbeiten zuerst `git status --short --branch` und `git diff` ansehen.
Falls zwischenzeitlich jemand Änderungen ergänzt hat, diese erhalten. Keine
Reparatur durch `reset --hard`, `clean`, pauschales Restore oder Force-Push.

## 3. Was der Nutzer genau will

- „Letzte Branche“ ansehen und darauf die Zeichenoberfläche verbessern.
- Anordnung und Bedienung wie in den beigefügten Goodnotes-Bildern.
- **Mehr Funktionen in Redion nicht entfernen:** in denselben Stil einordnen.
- Macbook-Dock-artige Animationen beim Überfahren und Wechseln.
- Die bisherigen Icons gefallen ihm nicht: Konturen/Erkennbarkeit verbessern,
  nicht nur eine Farbe darüberlegen.
- **Alles vollständig dokumentieren**, auch den Plan, in Lücken und Entscheidungen.
- Einen vollständigen Plan für eine andere Codex-Aufgabe übergeben.

Nicht Teil dieses Auftrags: Blender/Gesichtsmodell, KI-Composer, KI-Buttons,
Elektro-Simulation umbauen, neue Cloud-Anbindung oder Veröffentlichung.

## 4. Die sieben Referenzen

Gemeinsamer Bildaufbau: Dokumentreiter oben, darunter eine ruhige Iconleiste,
aktive Icons auf einer abgerundeten helleren Fläche; viel Papier; kleine
schwebende Undo-/Redo-Kapsel links; ein dunkles kompaktes Kontext-Dock unten.
Die Redion-Themenfarben sollen trotzdem weiter funktionieren (E554).

Alle Referenzen liegen unter `C:\Users\redur\AppData\Local\Temp\`:

| Bild | Datei | Zu übernehmen |
|---|---|---|
| 1 | `codex-clipboard-e5b85591-62be-4f87-ba12-a05d8ffd1638.png` | Stifte links im unteren Dock, Strichstärken als Linien, runde Farben und weitere Farben |
| 2 | `codex-clipboard-a46ce64a-7d24-4dff-95b5-56c88903e57e.png` | Radierer-Modusfeld und drei unterschiedlich große Kreisvorschauen |
| 3 | `codex-clipboard-78f130b0-9a84-49c7-b1d1-05d192e0f598.png` | Verankerte Element-/Sticker-Galerie, Kategorien und Vorschaukacheln |
| 4 | `codex-clipboard-5257e1b6-aabc-4189-9066-d0921d855fe1.png` | Kontext-Dock für Formen, Strichstärke und Farbe |
| 5 | `codex-clipboard-d6955870-8bb3-41da-bb1f-faa19b3efae3.png` | Pastellfarbene quadratische Haftnotiz-Muster |
| 6 | `codex-clipboard-932dab57-0e5d-4538-8e5d-ebd65909bad4.png` | Laser-Popup mit den beiden großen Optionen Punkt und Linie |
| 7 | `codex-clipboard-152eaed4-9621-4a37-bf31-3516f009ce73.png` | Breites transparentes Lineal mit Skala und Nullpunkt in der Mitte |

Sind Temp-Dateien später weg, nicht behaupten, sie erneut gesehen zu haben:
die obige Beschreibung verwenden oder den Nutzer um erneutes Anhängen bitten.

## 5. Relevante Architektur und Regeln

- Browser: TypeScript unter `src/`, globale Module, kein React und keine
  neuen Runtime-Abhängigkeiten. Übersetztes JavaScript unter `quell/`.
- Node-Werkzeuge/Tests: `.mts`, kein handgeschriebenes neues `.js`/`.mjs`.
- Neue Bezeichner englisch, Kommentare/Nutzertexte/Dokumentation deutsch.
- `Marken` ist die gemeinsame Zeichenmaschine von A4-Blättern und PDF-Seiten.
  Sie hat bereits Druck, Auswahl, Verlauf, Lineal-Winkelrastung und Elemente.
- `DocumentMode` baut das Dokumentstudio und delegiert obere Werkzeugknöpfe
  an die echte aktive `.blatt-werk`. Keine zweite Zeichenmaschine bauen.
- Vorhandene Datenfelder und Markentypen nicht beiläufig umbenennen.
- Leistenposition und benutzereigene Sortierung aus E512/E570/E571 erhalten.
- Alle Haupttrefferflächen mindestens 44 px. Nur Farbe reicht nicht für
  Auswahlzustände: zusätzlich Kontur/Markierung und `aria-pressed`.
- Echte bestehende Theme-Tokens verwenden, keine geratenen CSS-Variablen.
  `pdf-studio.css` kommt nach `bausteine.css`; bestehende Regeln haben teils
  `!important`. Berechnete Styles messen, nicht bloß Quelltext lesen.
- Neue Browserdateien in `index.html` **und** im `GRUNDSTOCK` von
  `src/dienst/sw.ts` registrieren; Dienststand nicht frei erfinden.
- Keine echten Nutzerdokumente als Testfixture verändern. Eigener Browserkontext.
- `Store` und `App` sind lexikalische globale Variablen: in `page.evaluate`
  direkt verwenden, nicht fälschlich `window.Store`.
- Neue Testwächter müssen tatsächlich rot gewesen sein. UI-Screenshots
  ansehen und im Abschluss zeigen; `bilder/` ist ignoriertes Arbeitsmaterial.

## 6. Bereits begonnene Änderungen — noch nicht abgenommen

| Datei | Tatsächlich im Arbeitsbaum begonnen |
|---|---|
| `src/bereiche/pdf/document-mode.ts` | Obere Werkzeuge aus `Marken.WERKZEUGE` statt zweiter Liste; Laser dadurch vorhanden; Lineal-Button; History in den Dokumentkörper verschoben; Reihenfolge aus aktiver Blockleiste; Ereignisse für Werkzeug-Popover |
| `src/bereiche/pdf/marken.ts` | Lineal angebunden; Kantenprojektion für Eingabepunkte; separate Radierergröße; verzögerter Studioaufbau mit Größenknöpfen, Moduswahl, neun Haftnotizfarben, Laserfeld und Element-/Notizgalerie |
| `src/bereiche/pdf/ink-menu.ts` | Neuer nativer Popover-Helfer mit Positionierung, Titel, Schließen und Fokusbehandlung |
| `src/bereiche/pdf/ink-ruler.ts` | Neues SVG-Lineal in Dokumentmaßen; Verschieben, 15°-Drehung, Tastatur, zwei Führungskanten; keine gespeicherte Marke |
| `index.html`, `src/dienst/sw.ts` | Die zwei neuen Browserdateien vor `marken.js` eingetragen |
| `pruefungen/lauf/test524.mts` | Neuer isolierter echter Browserlauf, bisher nur erste Strukturprüfungen; muss erheblich erweitert werden |
| `ENTSCHEIDUNGEN.md` | E572 einschließlich Inhaltsverzeichnis, Gesamtplan, Alternativen und Grenzen |
| `LUECKEN.md` | L157 mit vollständiger Status-/Restliste |

**Noch nicht implementiert:** neue Styles für diese Elemente, Dock-Animationen,
eigentliche Icon-Neuzeichnung, finale responsive Anordnung und vollständige
Abnahmetests. Diese Teile nicht aus dem Vorhandensein der TypeScript-Dateien
als erledigt ableiten.

**Noch nicht gebaut:** `quell/**`, `sw.js` und `redion-einzeldatei.html` für diesen
Bogen. Die neuen Script-Verweise treffen bis zum Build auf fehlende Ausgaben.
Der Arbeitsstand ist daher kein veröffentlichungsfähiger Stand.

## 7. Verbindlicher nächster Arbeitsplan

### A. Zwischenstand stabilisieren

1. Diff lesen und den Typprüfer erneut ausführen. Ein erster Durchlauf meldete
   eine unbenutzte `ids`-Variable in `test524`; dafür wurde anschließend eine
   echte Prüfung des Testblatts ergänzt. Das Ergebnis des erneuten Laufs steht
   im Abschlussnachtrag dieser Datei, falls er bereits abgeschlossen ist.
2. Nicht blind auf dem begonnenen Code aufbauen: die Risiken in Abschnitt 8
   prüfen und den passenden Test jeweils vor der Reparatur ergänzen.
3. TypeScript-Ausgaben erzeugen, damit die Browserprobe wirklich neuen Code lädt.

### B. Stimmige Oberfläche bauen

1. In `quell/schale/stil/pdf-studio.css` die untere Leiste wirklich kontextbezogen
   machen. Aktuell versteckt `.document-studio:not([data-ink-options="open"])`
   unter anderem **die gesamte Formengruppe**. Dies gezielt korrigieren.
2. Stift-Dock: sechs klar erkennbare Stifte, Strichstärken, Farben und Farbmenü.
   Werkzeuge/Extras nicht still entfernen, wenn der Bildschirm zu schmal ist.
3. Radierer-Dock: alter Rundlaufknopf im Studio nicht doppelt neben dem neuen
   Modusfeld zeigen; große Kreisvorschauen und aktuellen Modus klar markieren.
4. Haftnotiz-Dock: normale Tintenfarben hier nicht zusätzlich als zweite
   ungeordnete Palette zeigen. Neue neun Pastellfarben nur im Notizkontext.
5. Form-Dock: alle sieben vorhandenen Formen direkt; Farbe/Dicke dazu.
6. Popup-Stil für `.blatt-popover`, Header/Schließen, Moduswahl,
   `.blatt-laser-options`, Galerie-Tabs und Drei-Spalten-Vorschauraster.
7. History absolut links über dem Dokumentpapier positionieren; sie liegt
   bereits im Dokumentkörper, hat aber noch die alten Toolbar-Styles.
8. Kleine Breite: sinnvolle horizontale Scrollstreifen, nicht ganze App breiter
   als das Display; sichtbarer Hinweis auf weitere Werkzeuge. Kleine Höhe und
   Bildschirmtastatur berücksichtigen. Inspector/Seitenleiste nicht blockieren.
9. Erweiterte Optionen neu ordnen. „Alle Optionen“ darf nicht blind alles
   einschließlich neuer kontextfremder Paletten gleichzeitig zeigen. Der
   Sortiermodus braucht weiterhin seine sichtbaren Originalknöpfe und „Fertig“.

### C. Icons und Mac-Dock-artige Bewegung

1. `src/register/symbole.ts` lesen: `inkPen`, `inkEraser`, `inkLasso`,
   `inkShapes`, `inkLaser`, `inkRuler`, `penFountain`, `penBall`, `penBrush`,
   `penPencil`, `penEarth`, `penWire` existieren. Einheitliches SVG-Register
   nutzen; keine zweite lose Icon-Sammlung neben ihm.
2. Tatsächliche Konturen gezielt verbessern und in Originalgröße ansehen:
   Füller, Kugelschreiber, Pinsel und Bleistift müssen sofort unterscheidbar sein.
   Symbole im Dock ca. 24–28 px innerhalb fester 44-px-Trefferflächen. Den
   bestehenden Unterschiedstest der Stift-Silhouetten berücksichtigen.
3. Hover nur für `(hover: hover) and (pointer: fine)`: aktives Ziel leicht
   anheben/vergrößern, Nachbarn schwächer. Trefferflächen bleiben fest.
4. Federnder kurzer Wechsel auf aktive Auswahl; keine Endlosschleife. Nicht
   bei jedem DOM-Sync erneut animieren. Keine verschluckten Klicks beim Skalieren.
5. Animationen dürfen am Scrollcontainer nicht abgeschnitten werden. Kein
   erzwungenes `overflow:visible`, das die schmale Oberfläche sprengt.
6. `prefers-reduced-motion: reduce` schaltet Vergrößerung/Federn aus. Touch
   funktioniert ohne Hover; im Druck keine Leisten-/Menüdekoration.

### D. Lineal und Datenverhalten abschließen

1. Glas, Skalenstriche, Ziffern und Drehgriff gestalten; ohne Styles ist das
   SVG noch keine transparente Führung. Nur das Lineal selbst darf auf Drag
   reagieren; ein Zug nahe der Außenkante muss beim Zeichner ankommen.
2. Verschieben und Drehen dürfen keinen Strich, keinen Undo-Schritt und keinen
   Speicherinhalt erzeugen. Grenzen bei Blattzoom und Randnotizen prüfen.
3. Kantenführung beginnt nur nahe einer Kante und bleibt für genau diesen Zug
   erhalten. Weit vom Lineal entfernt bleibt Freihand wirklich frei.
4. Alten Linien-/Pfeil-Winkelrastmodus außerhalb der Kante erhalten.
5. Stiftdruckdaten, Marker, Pointer-Abbruch, letzte Position beim Abheben,
   Auswahl, Seitenwechsel, Read-only und Export nicht beschädigen.

## 8. Konkret bekannte Prüfstellen im begonnenen Code

Diese Punkte sind **Risiken zur Prüfung**, nicht alle bereits nachgewiesene Fehler:

- `InkRuler.end()` ist angelegt, aber noch nicht an alle Abschluss-/Abbruch-
  und Werkzeugwechselwege angeschlossen. Nicht mitten im Finish zurücksetzen,
  bevor der letzte Strichpunkt projiziert wurde.
- `setzeWerkzeug('schreiben')` setzt `pointer-events:none` an der Zeichenfläche.
  Klären, wie ein eingeschaltetes Lineal dann erreichbar bleibt bzw. ausdrücklich
  ausgeblendet wird. Lesen/gesperrte Dokumente dürfen nicht zeichnen.
- `InkRuler` begrenzt die Lage an den Dokumentmaßen. Bei Zoom kann das Lineal
  außerhalb des sichtbaren Ausschnitts stehen; sinnvollen Erstplatz prüfen.
- Aktuell `InkMenu` ohne Fallback auf `showPopover`/`hidePopover`; Zielbrowser
  prüfen. Menüs müssen bei Seitenwechsel, Entfernen der Ursprungsfläche und
  Verlassen des Studios schließen. Keine verwaisten Listener/Overlays.
- Fokus-Rückgabe bei Escape und Schließen versus Außenklick prüfen. Ein
  Popup darf bei einem Klick außerhalb nicht den Fokus zurückstehlen.
- `inkSync()` hängt obere Buttons bei jedem Aufruf um. Prüfen, ob Fokus und
  Auswahlanimation dadurch springen; nur umhängen, wenn Reihenfolge geändert.
- Die aktuelle Quellenbeobachtung hört auf Attribute, nicht auf jede
  Sortierbewegung. Benutzerreihenfolge live und nach Neustart testen.
- Zusätzliche Haftnotizswatches dürfen beim Wechsel zum Leiterstift oder
  Laden/Zurücksetzen eigener Farbsätze nicht versehentlich verschwinden oder
  im Stiftkontext sichtbar werden. Neu erzeugte Buttons benötigen Namen und
  richtige Auswahlzustände; native Titel allein nicht blind voraussetzen.
- Neue Studio-Radierergröße wird zunächst auf klein gesetzt. Prüfen, ob sie
  zwischen Seiten wie erwartet bleibt. Sie darf die Tintenbreite nicht ändern.
- `data-ink-options="open"` hat aktuell sehr breite `!important`-Sichtbarkeit.
  Gerade dort die neuen Elemente und den Einrichten-/Sortiermodus nachmessen.
- Ein sichtbar gemachtes SVG-Lineal muss von jeder Ausgabe ausgeschlossen
  bleiben; nicht darauf vertrauen, dass jedes Exportverfahren nur `marks` liest.

## 9. Prüfplan und genaue Befehle

PowerShell im Projektordner, Node ab 22.18; `node_modules` ist bereits vorhanden.

```powershell
git status --short --branch
npm run typecheck
npm run bauen:ts
node bauen.mts
npm run stand
node pruefungen/lauf/test524.mts
node pruefungen/alle.mts 87 105 109 290 343 348 351 353 480 522 523 524
```

Weitere gezielte Tests im Bestand suchen, nicht blind ihre Aussage erraten:
`rg -n 'Lineal|Laser|Radier|pointercancel|Elemente' pruefungen/lauf`.
`test393` hält unter anderem die History-Erreichbarkeit, `test285` den
Dokumentarbeitsplatz. Geänderte alte Layoutannahmen nur mit begründetem
Dokueintrag anpassen, keine funktionalen Wächter entfernen.

`test524` soll zusätzlich zur aktuellen roten Strukturprobe halten:

- echte Stiftstriche und alle sechs Stiftwahlen; gespeicherte Marke lesen;
- Auswahl von Farbe/Dicke und unveränderte Daten beim bloßen Menüöffnen;
- alle Formen einschließlich Rückweg aus Kurve; keine Sackgasse;
- Radierer klein/mittel/groß, Ganz/Teil/Filter, Undo/Redo;
- Haftnotiz in gewählter Farbe aufziehen und Text editieren;
- eigene Elementvorlage wählen, setzen und rückgängig machen;
- Laser Punkt/Linie zeigt und verblasst, `marks` und Verlauf unverändert;
- Lineal schieben/drehen, tatsächlich gerader geführter Strich, freie Linien
  außerhalb der Fangzone, kein Lineal in Speicherung/Export;
- zwei Blätter, Wechsel des aktiven Blatts, neue Seite, Zoom;
- mehr Optionen, eigene Reihenfolge, Leistenplatz, Sortiermodus;
- Fokus/Tastatur/Escape/Außenklick, keine JS-Fehler;
- Desktop, 390 px, 360 px, kleine Höhe; Hell/Dunkel und reduzierte Bewegung;
- Neustart mit gespeicherten Daten, direktes `index.html`, Einzeldatei.

Bereits ausgeführt: `test524` **vor der Implementierung**, Ergebnis **1 grün,
4 rot**. Danach kam eine weitere Fixture-Prüfung dazu; dieser spätere Stand
wurde noch nicht als grün nachgewiesen. Keine volle Testsuite gelaufen.

Bei Build-Rechteproblemen normal die vorgesehene Freigabe nutzen. Nicht eine
Ablehnung durch andere Schreibwege umgehen. Keine Geheimnisse ausgeben.

## 10. Bilder und sichtbare Abnahme

Vorherige reale Bilder liegen lokal in `bilder/`:

- `dokument-rechner-dunkel.png` — bereits angesehen, bisheriges PDF-Studio.
- `drawing-reference-before.png` — aktuelle rote Strukturprobe, Notizheft.

Neue Bilder nach dem tatsächlichen Build erzeugen, z. B. durch Erweiterung von
`test524` oder eines passenden Ziels in `bilder.mts`. Pro Modus mindestens
Stift-Dock, Radierer, Formen, Haftnotizen, Galerie, Laser und Lineal ansehen.
Zusätzlich Desktop und Telefon, hell/dunkel, offene kleine Menüs prüfen.
Keine Mockup-Bilder als Nachweis funktionierender Software ausgeben.

```powershell
node bilder.mts dokument rechner
node bilder.mts dokument handy
```

Den Screenshot aus dem neuen Notizheft-Test zusätzlich verwenden: das
Standardziel `dokument` zeigt eine PDF-Seite, nicht alle neuen Zustände.

## 11. Dokumentationsabschluss

- E572: Planstatus an tatsächliche Ergebnisse anpassen; Fund, Wahl,
  Alternative, Kosten und Auswirkungen nennen. Inhaltsverzeichnis aktuell.
- L157: pro Punkt „geschlossen“ nur mit Beleg; Rest bleibt offen.
- `ERLEDIGTE-AUFGABEN.md`: Abschluss mit Dateien, Testzahlen, Bildnachweisen,
  Risiken und klarer Grenze des Testumfangs ergänzen.
- Änderungen an Markendaten/Format wären zusätzlich in
  `doku/REDION-FORMAT.md` zu erklären; bislang keine Migration geplant.
- Neue kurze CSS-Präfixe in `doku/CSS-NAMENSRAEUME.md` eintragen. Bestehende
  Präfixe `blatt-`/`document-` benötigen kein erfundenes zweites Designsystem.
- Diesen Übergabestand um das tatsächliche Ergebnis ergänzen, nicht rückwirkend
  behaupten, er sei beim Übergeben schon fertig gewesen.

## 12. Bewusst offen / keine Attrappen

Online-GIF-Suche, eine neue Mikrofonaufnahme, Raute/Winkelverbinder/gebogene
Pfeile, freie Zwei-Finger-Linealdrehung und eine vollständige Umgestaltung
der getrennten Whiteboard-/Schaltplan-Editoren sind nicht fertig und werden
hier nicht als vorhanden versprochen. Fehlendes sichtbar in L157 belassen.
Echte Stiftdruck-/Handballenprüfung auf Nutzerhardware bleibt manuell.

**Fertig heißt:** Code und Build stimmen überein; die relevanten Tests sind
grün; reale Bilder wurden angesehen; Daten bleiben erhalten; die vollständige
Dokumentation unterscheidet Umgesetztes von Restlücken. Erst dann eine
Fertigmeldung — bis dahin konkret weiterarbeiten oder ehrlich übergeben.

### Abschlussnachtrag zum Übergabezeitpunkt

`npm run typecheck` nach Ergänzen der Fixture-Prüfung: **grün, Exit 0**.
`git diff --check`: **grün, Exit 0**. Das sind Typ-/Patchprüfungen, kein
Funktionsnachweis. Build, neue Styles, Animationen, Icon-Überarbeitung und
die erweiterte Browserabnahme bleiben ausdrücklich ausstehend.

### Nachtrag: ausdrücklich beauftragte GitHub-Übergabe

Nach der Übergabe hat Redur ausdrücklich verlangt, den Stand auf GitHub zu
pushen. Dafür wird dieser Zwischenstand als WIP auf
`codex/drawing-reference-toolbar` committet und gepusht. Die früheren Angaben
„nicht committet / nicht gepusht“ beschreiben den Zeitpunkt vor diesem Auftrag.
Die Freigabe gilt für diesen Arbeitszweig, nicht für `main`, eine PR oder eine
Veröffentlichung. Fehlender Build und offene Umsetzung bleiben offen; der
Push ist eine Sicherung/Übergabe und kein Fertig- oder Funktionsnachweis.

---

## 13. Umsetzungsstand — 14. September 2026, abends

Dieser Abschnitt ist der Fortschrittsbericht, den Abschnitt 11 verlangt. Er
sagt, was **gemessen** zu ist, was noch offen ist, und an welcher Stelle der
Plan sich beim Nachmessen als anders herausgestellt hat.

### Vorbedingung, die im Plan fehlte: der Zweig war unvollständig

`index.html` lädt seit E572 `quell/bereiche/pdf/ink-menu.js` und
`ink-ruler.js`. Beide lagen im gepushten Commit `5d415d61` **nicht**. Auf
diesem Rechner fiel das nicht auf — die Dateien lagen ungetrackt daneben —,
auf jedem anderen hätte die App zwei Skripte mit 404 geladen. Das war der
erste Handgriff, noch vor Abschnitt 7 A: `npm run bauen:ts`, beide
Erzeugnisse eingecheckt, Dienststand v1071 → v1072.

### Abschnitt 7 A — Zwischenstand stabilisieren: erledigt

| Punkt | Ergebnis |
|---|---|
| A 1 Typprüfer | `npm run typecheck` grün, Exit 0 |
| A 2 Risiken aus Abschnitt 8 prüfen, Test VOR Reparatur | vier Risiken bestätigt und geschlossen, jeder Wächter vorher rot gesehen |
| A 3 TypeScript-Ausgaben erzeugen | `npm run bauen:ts` grün; `test105` und `test109` grün |

Geschlossen wurden dabei, in der Reihenfolge von §46 (rot zuerst):

1. **Das Lineal frass jeden Zeiger.** `test267 §6` war rot („frei 50.2°,
   gerastet 50.2°"), und die Kantenführung war unerreichbar, weil sie auf dem
   Glas beginnt. Jetzt ist das `<g>` durchlässig; Griff und Drehknopf hängen
   **unter** dem Glas. Der erste Versuch — ein Griffstreifen in der Mitte —
   blieb rot: der Prüfzug beginnt bei 55 % Breite und 40 % Höhe, also genau
   dort. 16/16.
2. **`test437` starb an Zusicherung 8.** „Zwölf echte Werkzeuge", es sind
   dreizehn. Der Lauf prüft mit `assert`, nicht mit einem Zähler — rund 26
   Zusicherungen liefen deshalb nie. 34/34.
3. **„Zurück" und „Vor" waren im Studio unerreichbar.** Zwei Ursachen,
   beide gemessen: das Stilblatt verbarg die Gruppe `verlauf` mit, und die
   Kapsel hatte keine Rasterspalte (x = 1440 am Rechner, `top = 812` in einem
   800-px-Fenster am Telefon). Der naheliegende Weg `center.prepend(history)`
   ist **gemessen falsch** — `.document-workspace` wurde damit nie sichtbar
   und `test437` lief nach 15 s aus. Gelöst im Stilblatt. 19/19 und 34/34.
4. **Das Lineal verschwand nach jedem „Zurück".** `redraw()` räumt jedes
   `[data-ink-ui]` aus der Fläche. `remount()` hängt es zurück und vergisst
   die Kante dabei ausdrücklich nicht.

### Abschnitt 7 B — die Oberfläche: B 1 und B 4 zu, der Rest offen

**B 1 (Kontextdock) ist geschlossen**, und beim Nachmessen war es schlimmer
als im Plan beschrieben: das Stilblatt versteckte nicht nur die Formengruppe,
sondern acht Dinge pauschal — geschlossen 62 von 86 Kindern weg, bei
`data-tool="line"` 0 von 7 Formknöpfen, bei `text` 0 von 7 Schriftknöpfen,
bei `select` 0 von 10 Auswahlknöpfen. Welche Gruppe zu welchem Werkzeug
gehört, steht seit E356 in `bausteine.css`; das Studio entscheidet es nicht
zweitens, sondern nimmt nur weg, was doppelt wäre (Werkzeuge, Trenner,
Verlauf). Gemessen danach:

```txt
stift     26/86 sichtbar    stil 6/7, formen 2/3, farbe 15/16, breite 3/5
text      21/86             schrift 6/7, farbe 15/16
select    33/86             auswahl 9/10, breite 3/5, farbe 15/16
radierer   5/86             radierer 5/5, sonst nichts
```

Dabei fiel ein Fund auf, der nicht im Plan stand: **das Lineal gehört auch
dem Stift.** `marken.ts` lässt die Kantenführung für
`['stift','marker','line','arrow']` zu — der Zeichner führte den Stift also
längst am Lineal, nur der Schalter stand nicht bei ihm (E574).

**B 4 (Haftnotiz-Dock) ist geschlossen.** Die neun Pastelle trugen
`data-gruppe="farbe"` und standen damit in JEDEM Werkzeug; die Farbreihe las
sich überall `t t t t t N N N N N N N N N +`. Dazu der Reihenfolgefehler:
`leiterReihe()` hängt die Adern vor das „+", `ink-studio-ready` erzeugt die
Pastelle danach — nach einem Neustart mit dem Leiterstift standen sie mitten
in der Adernreihe. Jetzt eine eigene Gruppe `notizfarbe`, nur beim Zettel;
der Zettel hat seine neun und das „+", keine Tintenpalette daneben.
Dock beim Stift 941 px, beim Zettel 520 px.

**Offen bleiben B 2, B 3, B 5 bis B 9.** B 9 ausdrücklich: „Alle Optionen"
zeigt weiterhin alles. Das ist zum Teil Absicht — `test177`, `test228`,
`test437` und `test515` erreichen über diesen Weg Dinge, die sonst nirgends
stehen; ein blosses Wegnehmen wäre ein Funktionsverlust. Was dort wirklich
störte, waren die NEUEN kontextfremden Paletten, und die sind mit B 4 weg.

### Abschnitt 7 C und 7 D

7 C (Icons, Dock-Bewegung) ist unberührt. 7 D ist zur Hälfte zu: das Lineal
reagiert nur an Griff und Drehknopf (D 1), ein Zug nahe der Kante kommt beim
Zeichner an (D 1, D 3), Verschieben und Drehen erzeugen keine Marke (D 2),
und der alte Winkelraster ausserhalb der Kante ist unverändert (D 4, `test267`).
Das Glas hat seine Skala, Ziffern und den Drehgriff bekommen. Offen bleibt
die Gestaltung im engeren Sinn und die Zoomgrenze aus Abschnitt 8.

### Was dabei an fremden Wächtern auffiel

- `test348` und `test351` haben die neue Lineal-Gruppe **gefangen** — genau
  dafür gibt es sie. Beide tragen jetzt die neue Liste mit geschriebenem Grund.
- `test464` war seit E572 rot, ohne dass am Produkt etwas fehlte: die Zeile
  suchte `'elemente', 'star'` in `document-mode.ts` — einen Eintrag aus der
  Abschrift, die E572 abgeschafft hat. Sie prüft jetzt `Marken.WERKZEUGE.map(`.
- `test290` (CSS-Namensräume) ist rot und **älter als dieser Zweig**. Er wird
  hier nicht mitrepariert, damit er nicht in einem fremden Bogen verschwindet.

### Prüfstand dieses Abschnitts

`test105`, `test109`, `test247`, `test267`, `test343`, `test345`, `test347`,
`test348`, `test351`, `test352`, `test365`, `test393`, `test437`, `test446`,
`test458`, `test461`, `test464`, `test470`, `test477`, `test478`, `test480`,
`test522`, `test523`, `test524` — alle grün. `npm run typecheck` und
`npm run bauen:ts` grün.

**Die Gesamtsuite ist NICHT als grün behauptet.** Sie wurde nicht vollständig
gefahren; `test290` ist bekannt rot.

---

## 14. Umsetzungsstand, zweiter Bogen — Zweig `codex/zeichenstudio-menues-radierer`

Nach E521 („ein Zweig, ein Push, dann ein neuer") beginnt hier ein frischer
Zweig, genau auf dem Stand von E574. Der alte bleibt stehen, wo er steht.

### Abschnitt 8 des Plans — die Risikoliste, abgearbeitet

| Risiko aus Abschnitt 8 | Ergebnis |
|---|---|
| `InkMenu` ohne Fallback auf `showPopover`/`hidePopover` | ✅ Ersatzweg gebaut **und begangen**: `test524` nimmt `showPopover` aus dem Prototyp und verlangt dasselbe noch einmal |
| Menüs müssen bei Seitenwechsel und Verlassen des Studios schliessen | ✅ Das Feld beobachtet seinen Anker. Gemessen vorher: 380 × 54 px offen über einer fremden Textseite |
| Keine verwaisten Listener/Overlays | ✅ `resize`, `keydown`, `pointerdown` und der Beobachter werden in einem einzigen, idempotenten `ende()` abgeräumt |
| Fokus-Rückgabe bei Escape versus Aussenklick | ✅ Escape und „×" geben zurück, ein Aussenklick nicht — vorher entschied das „steht der Fokus auf `body`?", und das trifft genau im Aussenklick-Fall zu |
| `inkSync()` hängt Knöpfe um — Fokus und Animation prüfen | ✅ Gemessen 156 Bewegungen je Klick und `activeElement === BODY`; jetzt 0 und der Knopf behält den Fokus |
| Quellenbeobachtung hört auf Attribute, nicht auf Sortierbewegungen | ✅ Zweiter Beobachter auf der Leiste selbst, ohne `subtree` — `center` mit `childList` hätte bei jedem Strich ausgelöst |
| Radierergrösse bleibt nicht zwischen Seiten | ✅ `meta`-Schlüssel `zeichnen:radierergroesse`; sie ändert die Tintenbreite weiterhin nicht |
| Haftnotizswatches im Stiftkontext / beim Leiterstift | ✅ in E574 geschlossen (eigene Gruppe `notizfarbe`) |
| `data-ink-options="open"` sehr breite `!important`-Sichtbarkeit | ⚠ **offen**, mit Grund: vier Prüfläufe erreichen über diesen Weg Dinge, die sonst nirgends stehen. Was dort wirklich störte — die neuen kontextfremden Paletten — ist mit E574 weg |
| `InkRuler` bei Zoom ausserhalb des Ausschnitts | ⚠ offen |
| Sichtbares Lineal aus jeder Ausgabe ausschliessen | ⚠ offen (es trägt `data-ink-ui` und ist keine Marke; ein eigener Wächter fehlt) |

### Abschnitt 7 B — was dieser Bogen davon erledigt hat

- **B 3 (Radierer-Dock):** zu. Drei sichtbare Kreise in 44-px-Knöpfen statt
  drei leerer 14-px-Felder, der Modus einmal statt zweimal, die Grösse
  gemerkt. Der alte Rundlaufknopf bleibt im Baum und bleibt der Mechanismus —
  er tritt nur dort zurück, wo sein Ersatz wirklich steht.
- **B 6 (Popup-Stil):** zur Hälfte zu. `.blatt-popover` hatte **keine
  einzige Regel**; jetzt Kopf mit Namen und 44-px-„×", Zeilen mit
  Trefferfläche, Auswahlzustand mit Fläche UND Haken (§38), die zwei
  Laserarten als Punkt und auslaufende Spur. Offen bleiben Galerie-Tabs und
  das Drei-Spalten-Vorschauraster.

**Offen aus 7 B:** B 2 (Stift-Dock im Detail), B 5 (Form-Dock), B 7
(History-Stil — die Lage stimmt seit E573, die alten Toolbar-Styles hängen
noch dran), B 8 (kleine Breite, Bildschirmtastatur), B 9 (siehe Tabelle).
**Offen aus 7 C:** alles — Icons und Dock-Bewegung.

### Bilder, die dabei angesehen wurden

`bilder/dock-stift.png`, `dock-zettel.png`, `dock-radierer.png`,
`dock-text.png`, `popover-laser-standard.png`, `popover-laser-hell.png`,
`popover-radierer-standard.png`, `popover-radierer-hell.png`. Sie liegen
nicht im Verzeichnis (§55.4) und werden mit `bilder.mts` oder den
Messskripten neu erzeugt.

### Prüfstand dieses Bogens

`test524` 42/42 — davon elf Zusicherungen neu in diesem Bogen und acht
vorher rot gesehen. Dazu grün: `test174`, `test177`, `test209`, `test228`,
`test239`, `test263`, `test266`, `test267`, `test285`, `test343`, `test344`,
`test349`, `test365`, `test367`, `test393`, `test437`, `test438`, `test439`,
`test461`, `test464`, `test515`, `test522`, `test523`.
`npm run typecheck` und `npm run bauen:ts` grün, Dienststand v1077.

**Die Gesamtsuite ist NICHT als grün behauptet.**

---

## 15. Umsetzungsstand, dritter Bogen — Zweig `codex/zeichenstudio-dock-bewegung`

### Abschnitt 7 C — Icons und Dock-Bewegung

**7 C 3 bis 7 C 6 (Bewegung) sind zu.** Die Entscheidung, die alles andere
nach sich zieht: es bewegt sich das ZEICHEN, nicht der Knopf. Gemessen wächst
das SVG von 25 auf 32,5 px, die zwei Nachbarn auf 28,3 px, und die
Trefferfläche bleibt 44 × 44 — im Layout und für den Zeiger. Damit sind
„feste Trefferflächen", „nichts wird am Rollcontainer abgeschnitten" und
„keine verschluckten Klicks" nicht drei Regeln, die man einhalten muss,
sondern eine Folge der Bauart.

**7 C 1 bis 7 C 2 (Icons) sind halb zu.** `test480 §7` misst seit E515 die
sechs Stifte gegeneinander und deckelt bei 60 %. Die dreizehn WERKZEUGE hat
niemand gemessen — und dort lagen die zwei schlimmsten Paare des Registers:
`inkPen`/`inkLaser` 69 %, `inkText`/`inkImage` 64 %. Beide sind neu
gezeichnet; das schlimmste Paar liegt jetzt bei 52 %. `test480 §7b` hält es
dauerhaft und ist rot gewesen.

Offen bleibt der Eindruck, dass `penBrush` und `penPencil` einander ähneln.
Gemessen liegen sie unter der Grenze, und E515 hat ihre Gestalt bewusst
gewählt — eine gemessene Entscheidung wird nicht durch einen Eindruck
überstimmt. Wer den nächsten Bogen an den Stiften macht, sieht sich das an.

### Abschnitt 7 B 6 — jetzt vollständig

Galerie-Reiter, Dreispaltenraster und die Vorschaukarten für Elemente und
Haftnotizen sind gestaltet. Damit ist B 6 ganz zu; `bilder/popover-*.png`
zeigen alle vier Felder in beiden Themen.

### Was das Hinsehen zusätzlich gefunden hat

Auf `bilder/studio-telefon.png` lag die Verlaufskapsel über der ersten
Zeile. Nachgemessen: bei 390 × 844 deckte sie **87 × 39 px** der
Schreibfläche ab, bei 1440 × 960 **0 × 0**. Sie steht am Telefon jetzt unten
links über dem Dock. `test524 §8` misst beides.

Und auf demselben Bild: die untere Leiste rollt waagrecht, ohne dass etwas
sagt, dass rechts noch mehr steht (Plan 7 B 8). Das bleibt offen und steht
in L157 — gesehen, nicht gemessen.

### Prüfstand dieses Bogens

`test524` 50/50, `test480` 50/50, `test461` 35/35, `test393`, `test437`,
`test522`, `test523` grün. `npm run typecheck` und `npm run bauen:ts` grün.

**Die Gesamtsuite ist NICHT als grün behauptet.**

---

## Nachtrag — Abschnitt 7 B 5 (15. September 2026)

### B 5 war zu, bevor der Bogen begann

„Form-Dock: alle sieben vorhandenen Formen direkt; Farbe/Dicke dazu."
Nachgemessen bei `data-tool="line"`:

```txt
1440 px   form 7/8 sichtbar · farbe 6/7 · breite 3/5 · Dock 1079 px
 390 px   dieselben sieben, 44 × 44 px, ohne Wort
```

Die jeweils fehlenden sind der Gruppentrenner und die Klappe für die freie
Stärke (öffnet sich nach E465 erst auf den zweiten Tipp). E569 hatte die
Kurve nachgetragen, E356 gibt der Gruppe ihren Kontext — der Punkt stand.

### Was stattdessen gefunden wurde (E583)

Der Formenknopf auf dem Blatt zeigt seit E515, WELCHE Form gewählt ist.
**Seine Kopie in der oberen Studioleiste zeigte immer `inkShapes` und immer
den Titel „Form"** — und im Studio ist die obere Reihe die einzige sichtbare
Werkzeugreihe (E573). `zeichenSpiegeln()` in `inkSync` gleicht jetzt
`data-sym`, `data-form`, `title` und `aria-label` ab, allgemein und nur bei
Abweichung: 7 Knotenänderungen bei einem echten Wechsel, 2 bei einem Klick
auf dieselbe Form.

### Und was das Hinsehen dazu fand (E584)

Im Bild des Docks waren „Rechteck" und „Rund" dasselbe Bild. Gemessen mit
der Methode aus `test480 §7`:

```txt
vorher   75 % formRect/formRoundrect · 72 % formEllipse/formRoundrect
         70 % formLine/formArrow
nachher  38 %                        · 29 %
         28 %                          (schlimmstes Paar der Liste: 55 %)
```

Der Pfeil liegt jetzt waagerecht, das runde Rechteck ist kleiner und runder.
Verworfen: eine Fassung mit offenen Eckbögen — sie misst besser (39 %),
zeigt aber nicht die Form, die man bekommt.

### Offen aus 7 B

B 2 (Stift-Dock im Detail), B 7 (History-Stil — die Lage stimmt seit E573,
die alten Toolbar-Styles hängen noch dran), B 8 (kleine Breite ist mit E580
zur Hälfte zu; die Bildschirmtastatur braucht ein echtes Gerät), B 9 (siehe
Tabelle weiter oben — „Alle Optionen" bleibt mit Grund vollständig).
**Offen aus 7 C:** C 2 verlangt Zeichen von 24–28 px in den 44-px-Flächen;
heute sind es 18 px.

### Prüfstand dieses Bogens

`test524` 76/76 (12 Zusicherungen neu, alle 12 rot gesehen), `test480` 54/54
(4 neu, alle 4 rot gesehen). `npm run typecheck` und `npm run bauen:ts` grün.

**Die Gesamtsuite ist NICHT als grün behauptet.**

---

## Nachtrag — Abschnitt 7 C 2, Grössenteil (15. September 2026)

„Symbole im Dock ca. 24–28 px innerhalb fester 44-px-Trefferflächen."

Gemessen waren es **18 px, und zwar überall** — auch dort, wo das Stilblatt
16 oder 20 sagte. Der Grund: `Register.symbole.fuelle` schreibt
`width="18"` als Attribut in das `<svg>`, das Stilblatt bemasst die Hülle
darum, und ein SVG mit eigener Breite kümmert sich nicht um seinen Kasten.
Drei von vier Zahlen hatten keine Wirkung (E585).

```txt
nachher   obere Leiste    25 px in 44 × 44   (war schon richtig)
           390 px unten   24 px in 44 × 44
           390 px seitl.  24 px in 48 × 44
          1440 px unten   16 px in 32–79 × 44   (war 18 und stand über)
```

**Nicht am Rechner auf 24**, gemessen: dort wächst die Leiste von 959 auf
1013 px und der Zubehörknopf von 32 auf 40 — bei 1280 px genau der Umbruch
in eine dritte Zeile, den E576 weggerechnet hat. Am Telefon kostet es
nichts: die Rollbreite bleibt bei 18, 22, 24 und 26 px unverändert 918 px.

### Offen aus 7 C

C 2 verlangt ausserdem, dass Füller, Kugelschreiber, Pinsel und Bleistift
sofort unterscheidbar sind. `test480 §7` misst das seit E515 und ist grün;
mit Augen sind sich `penBrush` und `penPencil` weiterhin ähnlich. Das steht
so im Nachtrag von E577 und bleibt eine Frage an Redur, keine stille
Änderung. C 1, C 3 bis C 6 sind mit E577 zu.

### Prüfstand dieses Bogens

`test524` 83/83 (7 Zusicherungen neu, 5 rot gesehen). Grün dazu: `test87`,
`test174`, `test177`, `test209`, `test228`, `test239`, `test263`, `test266`,
`test267`, `test285`, `test343`, `test344`, `test348`, `test349`, `test351`,
`test365`, `test367`, `test393`, `test429`, `test437`, `test438`, `test439`,
`test461`, `test464`, `test476`, `test480`, `test508`, `test515`, `test522`,
`test523`.

**Die Gesamtsuite ist NICHT als grün behauptet.**

---

## Nachtrag — Abschnitt 7 B 7 und der Rest von 7 C 1 (15. September 2026)

B 7 sagte: „History … hat aber noch die alten Toolbar-Styles." Der alte
Stil war genau eine Zeile — `font-size:1.75rem` —, und sie stand nur da, um
zwei **Schriftzeichen** gross zu machen: `↶` und `↷`.

Gemessen trugen vier Knöpfe des Studios Schriftzeichen, während dreizehn
Werkzeuge daneben gezeichnete SVGs tragen: `ink-undo`, `ink-redo`, `find`
(`🔍`) und `view` (`☷`). Das Register hatte `undo`, `redo`, `search` und
`eye` seit E272 bereit — sie wurden nur nie geholt (E586).

`topButton()` nimmt jetzt einen freiwilligen Zeichennamen. `+`, `‹` und
`⋮⋮` bleiben Text: sie sind Zeichen im Wortsinn und kein Bild.

**Was dabei erhalten bleiben musste:** E396 verlangt, dass abgeschaltete
Verlaufsknöpfe blass sind und nicht durchscheinend. Ein SVG mit
`stroke="currentColor"` hält das von selbst; gemessen steht `stroke` danach
auf demselben Wert wie `color`.

**Zwei Kommentare, die gelogen haben**, stehen jetzt richtig da: der über
den „negativen Unterrand" der Kapsel (den E579 abgeschafft hat) und der
über ihr „Rasterfeld am Rechner" (seit E579 ist sie überall absolut).

### Damit ist aus 7 B nur noch B 2, B 8 und B 9 offen

B 2 (Stift-Dock im Detail), B 8 (kleine Breite ist mit E580 zur Hälfte zu,
die Bildschirmtastatur braucht ein echtes Gerät), B 9 („Alle Optionen"
bleibt mit Grund vollständig — `test177`, `test228`, `test437` und
`test515` erreichen darüber Dinge, die sonst nirgends stehen).
**7 C ist zu**, bis auf die Frage an Redur, ob `penBrush` und `penPencil`
sich genug unterscheiden (gemessen unter der Grenze, mit Augen ähnlich).

### Prüfstand dieses Bogens

`test524` 95/95 (12 Zusicherungen neu, 11 rot gesehen). Grün dazu:
`test202`, `test204`, `test210`, `test285`, `test295`, `test341`,
`test385`, `test395`, `test424`, `test437`, `test438`, `test441`,
`test461`, `test463`, `test506`, `test507`, `test508`, `test509`,
`test510`.

**Die Gesamtsuite ist NICHT als grün behauptet.**

---

## Nachtrag — Abschnitt 7 B 2 und der Rest von 7 C 2 (15. September 2026)

### Der zweite Satz von B 2 war erfüllt

„Werkzeuge/Extras nicht still entfernen, wenn der Bildschirm zu schmal ist."
Gemessen bei vier Breiten stehen immer dieselben **18** Bedienteile im Dock;
was nicht ins Sichtfenster passt, rollt (939 px Inhalt in 736 px bei 768,
918 in 356 bei 390) und ist durch Rollen erreichbar. `test524 §14` hält es,
in der Gegenprobe rot gesehen.

### Der erste Satz war es nicht — und das Mass sagte, er sei es

`test480 §7` misst seit E515 die **Tintendeckung**: `penBrush/penPencil`
kam auf 40 %, weit unter der Grenze. Mit Augen bei 16 px waren die beiden
trotzdem Zwillinge, weil das Auge bei dieser Grösse die **Richtung** liest
und nicht die Bildpunkte — beide ein langer Strich von links unten nach
rechts oben, Δ7°.

`test480 §7d` misst jetzt zusätzlich die Hauptachse der Tinte und die
Länglichkeit. Der Pinsel ist gespiegelt: 128° gegen 45°. Die Gegenprobe
auf die sieben Formen findet mit demselben Mass kein Paar — eine
Zusicherung, die überall anschlägt, sagt nichts (E587).

### Was aus 7 C 2 offen bleibt

`penFountain` liest sich bei 16 px eher wie eine Kartennadel als wie eine
Federspitze. Gemessen ist er sauber getrennt (schlimmstes Paar 46 % mit
`penEarth`, 90°/26 % — ein Klumpen, kein Strich), also ist die Zusage
„sofort unterscheidbar" gehalten. Ob er auch „nach Füller aussieht", ist
eine Frage an Redur und keine stille Änderung.

### Offen aus 7 B

Nur noch **B 8** (die Bildschirmtastatur; die kleine Breite ist mit E580 und
E587 zu) und **B 9** („Alle Optionen" bleibt mit Grund vollständig).
**7 C ist zu.**

### Prüfstand dieses Bogens

`test480` 60/60 (4 Zusicherungen neu, 2 rot gesehen), `test524` 100/100
(5 neu, 1 in der Gegenprobe rot gesehen). Grün dazu: `test343`, `test344`,
`test348`, `test349`, `test351`, `test365`, `test437`, `test438`, `test461`,
`test510`, `test515`, `test522`, `test523`.

**Die Gesamtsuite ist NICHT als grün behauptet.**

---

## Nachtrag — Abschnitt 7 B 8, Tastatur (15. September 2026)

**Der Satz „braucht ein echtes Gerät" war falsch.** `kern/einstellung/app.ts`
liest `visualViewport` und schreibt daraus `--visual-bottom`,
`--visual-height`, `--vh` und `body.tastatur-offen`. Diese vier Signale sind
alles, was ein Stilblatt von der Tastatur je erfährt — wer sie setzt, hat sie.

Gemessen bei 390 × 844 mit 336 px Tastatur (sichtbar bis 508):

```txt
              vorher              nachher
Dock          768–830, 322 verdeckt    432–494, 0 verdeckt
Zurück/Vor    708–760, 252 verdeckt    372–424, 0 verdeckt
obere Leiste  102–155,   0 verdeckt    unverändert
Suchzeile     102–159,   0 verdeckt    unverändert
```

Beide unteren Schwebenden lagen **ganz** dahinter: wer in eine Haftnotiz
oder ein Textfeld tippte, verlor die Stiftleiste und „Zurück" dazu. `bottom`
stand auf dem Rand des LAYOUT-Ausschnitts, und der schrumpft nicht, wenn die
Tastatur aufgeht — deshalb gibt es `visualViewport` überhaupt. `.overlay`,
die Bottom Sheets, `.finder` und das Tabellenfeld rechneten seit je damit;
das Studio war der eine Ort, der es nicht tat (E588).

Ohne Tastatur bleibt alles auf den Pixel, wo es war — der Gegenfall steht
ausdrücklich im Prüflauf.

### Damit ist 7 B ganz zu, bis auf B 9

B 9 („Alle Optionen") bleibt mit Grund vollständig: `test177`, `test228`,
`test437` und `test515` erreichen über diesen Weg Dinge, die sonst nirgends
stehen. Was dort wirklich störte, waren die neuen kontextfremden Paletten,
und die sind mit E574 weg.

### Prüfstand dieses Bogens

`test524` 105/105 (5 Zusicherungen neu, 2 rot gesehen). Grün dazu:
`test285`, `test437`, `test438`, `test461`, `test506`, `test507`, `test508`,
`test509`, `test510`, `test515`, `test522`, `test523`.

**Die Gesamtsuite ist NICHT als grün behauptet.**
