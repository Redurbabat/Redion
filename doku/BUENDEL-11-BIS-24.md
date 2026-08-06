# Bündel 11 bis 24 — die Nachrichten zu den Commits

**Warum diese Datei.** Der Ordner auf dem Laptop hat eine eigene
Git-Geschichte; die Commits aus der Werkstatt lassen sich dort nicht
anhängen, ohne die vorhandene zu zerreissen. Übertragen werden deshalb die
Dateien — und die Nachrichten stehen hier, damit das WARUM nicht verloren
geht. In den Nachrichten steht, was ohne sie niemand mehr rekonstruieren
kann: welcher Fehler dahinterstand und warum die Lösung so und nicht anders
aussieht.

**Der Stand am Ende: 159 → 0 JavaScript-Dateien.** `tsc` meldet in allen
drei Konfigurationen nichts, und Vollprüflauf 25 zeigt **84 grün, 0 rot**.
Jede einzelne Suite liefert dieselben Zahlen wie vor der Migration — bis auf
eine, die eine überholte Zahl verloren hat (siehe Bündel 22).

---

## Umzug nach TypeScript, Stapel 11: Wissen, KI-Kontext, Abgleich

`1235cbb2`

Fünf Dateien von JavaScript nach TypeScript, 159 → 154:

  src/bereiche/ki/kontext.ts               (BM25-Suche, Einbettungen)
  src/bereiche/ki/ansicht/baukasten.ts     (Formel- und Filter-Assistent)
  src/bereiche/wissen/bibliothek.ts        (Bibliothek, Meine Aufgaben)
  src/bereiche/verbinden/ansicht/wolke.ts  (Wolken-Ansicht)
  src/kern/abgleich/zusammenfuehren.ts     (Drei-Wege-Zusammenführung)

Dabei gefunden und behoben, nicht nur umbenannt:

  · zusammenfuehren: `ziel.innerHTML` ohne Prüfung. Wäre das Fenster
    zwischen zwei Neuzeichnungen geschlossen worden, hätte das mitten im
    Zeichnen geworfen und die Konfliktliste wäre halb stehen geblieben.
  · zusammenfuehren: `setzeTief` griff auf `pfad[i]` zu, ohne dass der
    Pfad Einträge haben musste. Bei leerem Pfad schrieb es nach
    `obj[undefined]`.
  · baukasten: `e.message` im `catch`. Wirft etwas, das kein Fehler ist
    (ein abgebrochener Netzaufruf liefert manchmal eine Zeichenkette),
    stand im Hinweis "undefined" statt der Ursache.
  · baukasten: `z[1]` aus dem Zaun-Muster ohne Prüfung — ein Codeblock
    ohne Inhalt hätte `undefined` in die Formel geschrieben.
  · bibliothek: `Date.parse` bekam einen unbekannten Wert; jetzt geht
    immer eine Zeichenkette hinein.
  · bibliothek: die Suchfelder waren als `HTMLElement` geführt, `.value`
    und `.selectionStart` gab es darauf gar nicht.
  · kontext: `VERWANDT[k]` konnte fehlen — bei einem unbekannten Stamm
    hätte die Worterweiterung geworfen.
  · kontext: `beiFortschritt` wurde mit zwei Werten gerufen, war aber für
    einen erklärt. Die Gesamtzahl kam im Fortschritt nie an.

Die LCS-Tabelle in baukasten läuft jetzt über `Int32Array` mit den zwei
Helfern `tab`/`setzeTab` — dasselbe Muster wie in fassungen.ts.

Alle Prüfungen grün: 87 (Quelltext), 105 (erzeugtes JavaScript),
109 (keine neue JavaScript-Datei).

---

## Prüfung 33: auf die Spalte warten statt 700 ms hoffen

`d926bf88`

Die Prüfung "Neue Spalte steht direkt rechts daneben" ist im vollen Lauf
zweimal rot geworden, einzeln jedes Mal grün. Ursache war keine Regression,
sondern eine feste Frist: nach dem Klick auf OK wurde 700 ms gewartet und
dann das Schema gelesen. Laufen 113 Prüfungen hintereinander, reicht das auf
einer belasteten Maschine nicht.

Jetzt wartet sie mit waitForFunction darauf, dass die Spalte tatsächlich im
Schema steht — bis 8 s. Bleibt sie aus, sagt die Meldung, dass der Rechner
zu langsam war, statt eine Prüfung über die Spaltenfolge scheitern zu
lassen, die mit der Spaltenfolge nichts zu tun hat.

Dieselbe Bauart wie beim Fenster darüber, aus derselben Sitzung.

---

## Umzug nach TypeScript, Stapel 12: Probelauf, Transaktion, Links, Meeting, PWA

`a02b2d00`

Fünf Dateien von JavaScript nach TypeScript, 154 → 149:

  src/bereiche/datenbanken/probelauf/dienst.ts  (Was würde passieren?)
  src/kern/ablage/befehle.ts                    (Notions interne Befehle)
  src/bereiche/wissen/verweise.ts               ([[Links]], Rückverweise, Graph)
  src/bereiche/verbinden/besprechung.ts         (Besprechungsnotizen)
  src/bereiche/einstellungen/pwa.ts             (Als App installieren)

Der schwerste Fund steckte im Probelauf selbst:

  · `Links.rueckverweise` gibt es nicht — die Funktion heisst `verweiseAuf`.
    Weil der Aufruf hinter `&& Links.rueckverweise` stand, fiel das nie auf:
    die Liste war immer leer, und beim Löschen einer Seite kam der Satz
    „N andere Seiten verweisen hierher" kein einziges Mal. Genau der
    Hinweis, für den es diesen Probelauf gibt. Dazu las die Ausgabe
    `r.text` am falschen Objekt — der Titel steht unter `r.seite.text`.

Weiter behoben:

  · befehle: `set` und `update` schrieben bei leerem Pfad nach
    `obj[undefined]`. Jetzt kommt eine ehrliche Fehlermeldung zurück.
  · befehle: `window.Verlauf` und `window.Protokoll` — beide Module
    stehen gar nicht am `window`, die Abfrage war immer falsch. Damit
    wurde vor einer Transaktion nie ein Schritt zum Rückgängigmachen
    gemerkt und nichts protokolliert.
  · befehle: fünf Stellen `o.querySelector('#tx-…').value` ohne Prüfung.
  · pwa: `getSelection().getRangeAt(0)` ohne Auswahl — genau dann warf es.
  · pwa: `e.touches[0]` viermal ungeprüft.
  · pwa: `neueFassung` wurde gesetzt und nie gelesen; mit weggefallen.
  · besprechung: `inp.files[0]`, `r.blob` und die drei Einstellungsfelder
    ohne Prüfung; `auswerten` wurde mit einem Wert zu wenig gerufen.
  · verweise: der Graph griff auf `knoten[i]` und `ctx` ungeprüft zu.
  · Vier `catch (e) { … e.message }`: wirft etwas, das kein `Error` ist,
    stand im Hinweis "undefined" statt der Ursache.

Zwei neue Werkzeuge, beide nach demselben Muster wie typenhilfe.mts:

  benannte.mts      liest die TS7006-Meldungen und setzt Typen für benannte
                    Parameter — aus einer kurzen Liste sicherer Namen,
                    sonst `any`. 131 Stellen in diesem Stapel.
  deklarationen.mts dasselbe für TS7034: `let x = null` → `let x: any`.

Die Liste in benannte.mts enthielt kurz `k: number`. In befehle.ts heisst
`k` der ganze Anfrage-Umschlag — der Eintrag ist wieder raus, mit einer
Zeile im Kopf, warum: ein Name gehört nur hinein, wenn er in JEDER Datei
dasselbe bedeutet.

Prüfungen grün: 87, 105, 109 (Struktur) und 49, 66, 67, 71 (Funktion).

---

## Umzug nach TypeScript, Stapel 13: Pflege, Kalender, Wolke, Seitenleiste, Mail

`498b9cd4`

Fünf Dateien von JavaScript nach TypeScript, 149 → 144:

  src/bereiche/einstellungen/pflege.ts   (Bestandspflege, Dubletten, Fehlerliste)
  src/bereiche/verbinden/kalender.ts     (ICS, Google Kalender, Abos)
  src/kern/abgleich/maschine.ts          (Wolke: anmelden, hoch, runter)
  src/schale/aufbau/seitenleiste.ts      (Baum, Abschnitte, Reiter)
  src/bereiche/verbinden/mail.ts         (Gmail, EML, Kürzel, Regeln)

DERSELBE FEHLER EIN ZWEITES MAL

  `Links.rueckverweise` — die Funktion, die es nicht gibt — stand auch in
  pflege.ts, in der Suche nach verwaisten Seiten:

      const verlinkt = Links.rueckverweise ? (…).length : 0;

  Der Ausdruck zählte immer 0. Damit galt JEDE leere Seite ohne Eltern als
  verwaist, auch wenn zehn andere Seiten auf sie zeigten — und die
  Bestandspflege schlug vor, sie wegzuräumen. Gestern in probelauf/dienst.js
  gefunden, heute hier: derselbe falsche Name, zwei Dateien, beide Male
  hinter einer Prüfung versteckt, die ihn stumm schaltete.

Weiter behoben:

  · maschine: `window.Protokoll` (dreimal) und `window.Werkzeuge` — beide
    Module hängen nicht am `window`. Nach dem Veröffentlichen einer Seite
    wurde deshalb nie protokolliert, und der HTML-Aufbau fiel immer auf den
    einfachen Weg zurück.
  · maschine: `zustand.unlesbar`, `.gemischt` und `.strittig` gab es im
    Anfangszustand gar nicht — `zustand.gemischt || 0` las beim ersten Mal
    `undefined`. Jetzt stehen sie im Typ.
  · maschine: `fetch` bekam `body: undefined` bei GET. Mit
    `exactOptionalPropertyTypes` ist das etwas anderes als kein Körper.
  · seitenleiste: `document.getElementById('tree').innerHTML = ''` ohne
    Prüfung — zeichnet jemand vor dem Aufbau der Schale, warf das und die
    ganze Leiste blieb leer. 27 weitere Zugriffe auf denselben Knoten.
  · pflege: die Dublettengruppen lagen als `o.__gruppen` am DOM-Knoten —
    ein Feld, das es an einem `div` nicht gibt. Jetzt eine Variable im
    Verschluss.
  · kalender und mail: sechsmal `isNaN(datum)` mit einem `Date` statt
    einer Zahl. Das ist immer `false` — ein unlesbares Datum rutschte
    ungeprüft durch und wurde zu "Invalid Date".
  · kalender: `zielDatenbank()`, `alleAbosHolen()` und `uebernehmen()`
    wurden mit weniger Werten gerufen, als sie erklärt hatten.
  · mail: `inp.files` und die sechs Felder des Regel-Fensters ungeprüft.
  · Sechs `catch (e) { … e.message }`.

Prüfungen: `npx tsc --noEmit` und `tsconfig.bauen.json` beide sauber.

---

## Umzug nach TypeScript, Stapel 14: Stand, Agenten, Austausch, Zusatzblöcke, API

`3649a756`

Fünf Dateien von JavaScript nach TypeScript, 144 → 139:

  src/bereiche/hilfe/stand.ts                  (Anforderungsliste, 16 Teile)
  src/bereiche/ki/agenten.ts                   (Agenten, Worker, Werkzeuge)
  src/bereiche/dateien/ausgeben.ts             (Word, Excel, ZIP, Einlesen)
  src/bereiche/bloecke/arten/zeichenflaeche.ts (Whiteboard, Diagramm, Mathe)
  src/bereiche/verbinden/schnittstelle.ts      (Notion-kompatible API)

Behoben, was dabei ans Licht kam:

  · ausgeben: `ordnerFuer(pfad)` bekam den Pfad als Text und teilte ihn mit
    `split('/')` — der Parameter war aber als Liste erklärt. Zweimal
    dieselbe Funktion, zweimal derselbe Fehler; beide Male lief es nur, weil
    JavaScript nicht nachfragt.
  · ausgeben: die CRC-Schleife las `teil[i]` und `crcTafel[…]` ungeprüft.
  · ausgeben: `quelle[4]` ohne Prüfung, ob es die Quelle überhaupt gibt.
  · ausgeben: `Pflege.fehlerMerken('Einlesen …', err)` — die Werte standen
    vertauscht. In der Fehlerliste stand der Ort im Textfeld und der Fehler
    im Ortsfeld.
  · schnittstelle: `window.Transaktion` und `window.Protokoll` — beide
    hängen nicht am `window`. Notions interne Adressen `/api/v3/` wurden
    deshalb NIE an das Transaktionsmodul weitergereicht, sondern liefen in
    den normalen Beantworter und kamen als 404 zurück.
  · schnittstelle: fünf Felder des Probierfensters ungeprüft angefasst.
  · agenten: `schritt.ergebnis` gab es im Typ nicht — der Schritt wurde
    ohne das Feld gebaut und später beschrieben.
  · zeichenflaeche: `setAttribute` bekam Zahlen statt Zeichenketten,
    `getContext('2d')` wurde ungeprüft benutzt.
  · stand: `b('h2', …)` wurde mit zwei statt drei Werten gerufen.

Die Liste in benannte.mts hat `s` und `t` verloren. Aus
`const formZeichnen = (s) =>` wurde `(s: string)` — und die Form auf der
Zeichenfläche hatte plötzlich kein `art` mehr. Dieselbe Lehre wie bei `k`
im letzten Stapel, jetzt als Kommentar im Werkzeug.

`npx tsc --noEmit` und `tsconfig.bauen.json` beide sauber.

---

## Umzug nach TypeScript, Stapel 15: die Ablage, Vorlagen, Datenbankdienst, Einstellungen

`0b0e91d0`

Vier Dateien von JavaScript nach TypeScript, 139 → 135:

  src/kern/ablage/indexdb.ts                 (Store — 1507 Zeilen)
  src/bereiche/vorlagen/daten.ts             (die fertigen Vorlagen)
  src/bereiche/datenbanken/dienst.ts         (Werte, Formeln, Rollups, Filter)
  src/bereiche/einstellungen/ansicht/seite.ts (das Einstellungsfenster)

DER STORE IST DER SCHWERPUNKT

  `Store` benutzt jede andere Datei. Solange er in `global.d.ts` als `any`
  stand, prüfte niemand die Aufrufe. Nach dem Umzug meldete `tsc` 449
  Fehler in dreissig Dateien — fast alle davon zu Recht.

  Zwei davon waren echte Löcher:

  · raster: `sichere()` rief `Store.saveView(view)`, sonst
    `Store.save('views', view)`. Beides gibt es nicht — die Ablage kennt nur
    `updateView`. Beide Zweige waren tot: eine geänderte Spaltenbreite wurde
    NIE gespeichert, nach dem Neuladen standen die alten Breiten wieder da.
  · pflege: `Einstellungen.sicherungSchreiben` gibt es nicht; die Sicherung
    schreibt `App.sicherungSpeichern`. Der Knopf lief immer in den Notweg.

  Dazu neun Stellen `Store.getBlock(x.dataset.b)` — `dataset` kann fehlen.
  Statt neun Prüfungen nehmen `getBlock`, `getCollection` und `getView`
  jetzt auch `undefined` an und geben ehrlich `null` zurück.

Weiter behoben:

  · indexdb: `cache` war als `{}` erklärt — kein einziger Zugriff
    `cache.blocks[id]` war für TypeScript gültig.
  · indexdb: `getMeta(k, fallback = null)` hiess für TypeScript „gibt immer
    null zurück"; rund neunzig Aufrufe im Rest der App waren dadurch falsch.
  · vorlagen/daten: neunmal `Store.addView(…)` und direkt danach
    `Store.updateView(x.id, …)` ohne Prüfung dazwischen. Jetzt einmal als
    Helfer `sicht()`.
  · dienst und seite: sechsmal `isNaN(datum)` mit einem `Date`.
  · Prüfung 113: die Regel zur Ausgangsschlange sucht im erzeugten
    JavaScript. Seit `maschine.js` von `tsc` kommt, bricht die Zeile anders
    um — der Ausdruck erlaubt jetzt beliebigen Zwischenraum. Dieselbe Regel,
    andere Schreibweise.

`npx tsc --noEmit` und `tsconfig.bauen.json` beide sauber.
Prüfungen 87, 105, 109 und 113 grün.

---

## Umzug nach TypeScript, Stapel 16: Formeln, Werkzeuge, KI-Dienst

`d32f8ef1`

Drei Dateien von JavaScript nach TypeScript, 135 → 132:

  src/bereiche/datenbanken/formeln/laufzeit.ts (die Formelmaschine, 1681)
  src/bereiche/wissen/werkzeuge.ts             (Palette, Karteikarten, Export, 1811)
  src/bereiche/ki/dienst.ts                    (Chat, Anbieter, Modelle, 1813)

DREI FUNKTIONEN, DIE ES NIE GAB

  · `KI.panel()` — die Seitenleiste rief das beim Klick auf „Redion-KI".
    Die Funktion existiert nicht; das Fenster öffnet `App.kiPanel`. In
    `register/navigation` war der Aufruf ungeschützt: ein Klick warf.
    In `register/module` stand `KI.panel && KI.panel()` davor — dort tat
    der Punkt „KI" schlicht nichts.
  · `Werkzeuge.alsHtmlDatei` — in den Einstellungen unter „Seite als HTML".
    Gibt es nicht; die Einzeldatei schreibt `einzelDatei()`.
  · `Werkzeuge.posteingangMelden('⏰ Wieder da: …', x.id)` in
    `planen/dienst` — die Funktion nimmt EIN Objekt, keine zwei Werte.
    `m.text` war damit `undefined`: eine zurückgestellte Seite meldete sich
    im Posteingang mit einer leeren Zeile.

  Dazu `Werkzeuge.palette('datenbank')`: der Wert fiel stumm auf den Boden.
  `palette` nimmt jetzt eine Vorgabe an und füllt das Suchfeld damit.

Weiter behoben:

  · laufzeit: sechsmal Datumsrechnung mit `Date` statt `getTime()` —
    `d1 - d2` und `isNaN(d)` gaben in TypeScript nichts Sinnvolles.
  · laufzeit: `F[n](args)` wurde zweimal nachgeschlagen; jetzt einmal.
  · ki/dienst: `r.body.getReader()` zweimal ohne Prüfung — bei einer
    Antwort ohne Körper warf das mitten im Strom.
  · ki/dienst: `window.SpeechRecognition` und `navigator.gpu` ehrlich
    abgefragt statt behauptet.
  · werkzeuge: `allesAlsExcel()` gibt `null` zurück, wenn es keine
    Datenbank gibt — `.catch` darauf warf.
  · werkzeuge: das Druckfenster benutzte `f.contentDocument` und
    `f.contentWindow` ungeprüft.
  · Rund vierzig `catch (e) { … e.message }` und ebenso viele
    ungeprüfte `querySelector(…).value`.

Neues Werkzeug `rueckgabe.mts`: setzt Rückgabetypen für Funktionen, die
sich gegenseitig aufrufen (TS7023). Der Formelparser besteht aus zwölf
solchen — `strichrechnung` ruft `punktrechnung` ruft `potenz` ruft
`unaer` ruft `atom`, und `atom` ruft für die Klammer wieder ganz oben an.

Prüfung 33: das Menü der Spalte „Art" von der Gruppierung darüber stand im
vollen Lauf noch offen, und `.menu button[data-a="neurechts"]` traf
DIESES. Die neue Spalte landete rechts von „Art" statt rechts von „Menge".
Jetzt wird das alte Menü entfernt und das neue abgewartet — keine feste
Frist mehr, die unter Last zu kurz ist. 78/78 statt 77/77.

`npx tsc --noEmit` sauber. Prüfungen 33, 87, 105, 109, 40, 66, 71 grün.

---

## Umzug nach TypeScript, Stapel 17: die Schale und der Editor

`22f3c432`

Zwei Dateien von JavaScript nach TypeScript, 132 → 130:

  src/schale/aufbau/schale.ts          (App — Start, Suche, Papierkorb, 2077)
  src/bereiche/editor/ansicht/editor.ts (Blocks — Blöcke, Knöpfe, Auswahl, 2635)

Damit ist von `quell/` genau eine Datei übrig: `datenbanken/steuerung.js`.

ZWEI WEITERE TOTE ZWEIGE

  · `App.oeffneZuletzt` gibt es nicht. In `register/module` stand
    `App.oeffneZuletzt && App.oeffneZuletzt()` — der Punkt „Schreiben" in
    der Modulübersicht tat also nichts. Jetzt `App.oeffne(App.aktuelleSeite())`.
  · `Mail.senden` gibt es nicht. Der Knopf-Baustein „Mail schicken" prüfte
    `window.Mail && Mail.senden` und fiel immer auf den `mailto:`-Weg
    zurück. Das Mail-Modul kann lesen und antworten, aber nicht selbst
    verschicken — der `mailto:`-Weg ist jetzt der einzige und ehrliche.

Weiter behoben:

  · schale: `document.getElementById('scroll').scrollTop`,
    `getElementById('sidebar').classList` und `getElementById('ai')` an
    zwölf Stellen ohne Prüfung. Vor dem Aufbau der Schale warf jede davon.
  · schale: `window.Aussehen`, `window.Fenster`, `window.Rundgang` — keins
    der drei hängt am `window`. Eigene Tastenkürzel wurden deshalb NIE
    ausgewertet, die geteilte Ansicht nie gemerkt, und Strg+Umschalt+O
    öffnete den Rundgang nicht.
  · schale: `dupliziereSeite(b)` bekam den Block statt seiner Kennung.
  · editor: `window.Zusatz`, `window.Links`, `window.Dateien`,
    `window.Fenster` — dieselbe Sache, viermal. Inline-Formeln $a^2$ wurden
    nie gerendert, Seitenlinks nie aufgelöst, grosse Dateien nie in Stücken
    abgelegt.
  · editor: `getSelection()` an sechs Stellen ohne Prüfung.
  · editor: `Formula.run(…)` mit zwei statt vier Werten.
  · Rund fünfzig `querySelector(…).value` und `.dataset` ungeprüft.

Prüfungen 33, 40, 45, 55, 66, 70, 87, 105, 109 grün.

---

## Prüfung 112: den Stichentscheid herstellen statt abwarten

`f7151d19`

Die Prüfung „Die Zeilen haben denselben Zeitstempel" hing am Zufall: sie
verlangte, dass mindestens zwei von vier Zeilen in derselben Millisekunde
entstehen. Ob das zutrifft, entscheidet, wie schnell der Rechner gerade ist.
Im vollen Lauf 19 war er langsam genug, dass alle vier in verschiedene
Millisekunden fielen — und die Prüfung wurde rot, obwohl am Stichentscheid
nichts falsch war:

  ["…17.995", "…17.996", "…18.586", "…18.587"]

Jetzt wird der Fall HERGESTELLT statt abgewartet: alle vier Zeilen bekommen
denselben `created`-Wert geschrieben, und danach muss die Reihenfolge
trotzdem `[Alpha, Beta, Gamma, Delta]` sein. Das prüft genau das, was der
Stichentscheid können soll — und es prüft es jedes Mal.

39/39 statt 38/38.

---

## Prüfung 99: die Regel verträgt den Zeilenumbruch von tsc

`1cfdd7b9`

Seit `schale.js` aus TypeScript erzeugt wird, bestimmt der Übersetzer die
Zeilenumbrüche. Aus

    if (schreibtGerade()) return;

werden im erzeugten JavaScript zwei Zeilen, und der Ausdruck
`/schreibtGerade\(\)\) return;/` traf nicht mehr. Die Regel ist dieselbe
geblieben, nur ihre Schreibweise nicht — jetzt steht dort `\s+` statt eines
festen Leerzeichens.

Dasselbe war in Prüfung 113 nötig. Beide Male ist es keine Aufweichung: der
Ausdruck verlangt weiterhin genau diese Zeile und nichts anderes.

23/23 statt 22/23.

---

## Bündel 18: steuerung.ts — quell/ ist umgezogen

`bcb6a562`

Die letzte Datei in `quell/` war zugleich die grösste: 7914 Zeilen, das
Modul `Datenbank`. 871 Typfehler am Anfang, 0 am Ende.

Was der Prüfer dabei gefunden hat — jedes Mal hinter einem `&&` oder `?.`
verborgen, das den Fehler still gemacht hat:

  · `Store.saveView(view)` und `Store.save('views', view)` in raster.ts —
    beide Wege gibt es nicht, die Ablage kennt nur `updateView`. Beide
    Zweige waren tot: eine geänderte Spaltenbreite wurde nie gespeichert,
    nach dem Neuladen standen die alten Breiten wieder da.
  · `o.querySelector('#x').innerHTML = …` an dreissig Stellen ohne jede
    Prüfung. Statt `!` davorzusetzen — das wäre eine Behauptung, keine
    Prüfung — steht jetzt `fuelle(o, '#x', …)`: prüft einmal, tut nichts,
    wenn der Kasten fehlt. Dasselbe für Zeigen und Verstecken: `zeige`.
  · `e.target.closest(…)`, `e.target.value`, `e.target.classList` überall
    ungeprüft. `e.target` ist `EventTarget | null`. Dafür gibt es jetzt
    `elVon`, `feldVon` und `htmlVon` — drei Zeilen, die einmal fragen.
  · `const dann = { art: d }` und danach `dann.wert = …`, `dann.an = …`:
    welche Felder eine Aktion mitbringt, hängt an ihrer Art. Der Satz ist
    jetzt als offen deklariert statt als geschlossen gemeint.
  · Der CSV-Import: `zeilen[0].map(…)` bei leerer Datei, `inp.files[0]`
    ohne Dateiauswahl, `key: null` als Schlüssel eines Verzeichnisses.

`quell/` enthält damit keine von Hand geschriebene JavaScript-Datei mehr —
jede der 30 hat eine Quelle unter `src/`, und `npm run bauen:ts` schreibt
sie. Bestand: 130 → 129 JavaScript-Dateien; was bleibt, sind `pruefungen/`
(111), `server/` (12), Wurzel (4), `functions/` und `oeffentlich/`.

Drei Werkzeuge kommen dazu, dieselbe Machart wie `benannte.mts`:
`domtypen.mts` (querySelector typisieren, nur lesend — schreibende Stellen
fasst es nicht an, `?.` links vom Gleichheitszeichen ist kein JavaScript),
`fuelle.mts` und `unbenutzt.mts`.

Geprüft: tsc ohne Meldung (beide Konfigurationen), Suiten 33, 40, 41, 45,
49, 53, 58, 60, 63, 64, 71, 87, 99, 105, 109 — alle grün.

---

## Bündel 19: der Server — server/, worker.ts, functions/

`c50fa463`

Elf Dateien, 2500 Zeilen: der Serverkern, die beiden Ablagen, die fünf
Sicherheitsmodule, der Prüfserver, der Cloudflare-Einstiegspunkt und die
Brücke. Node führt die .ts unmittelbar aus — kein Bauschritt, kein
erzeugtes .js daneben. Dafür steht `allowImportingTsExtensions` an und im
Import die echte Endung: `from './kern.ts'`.

NICHT `any`. Das wäre die schnellste Antwort auf jede Meldung gewesen und
für einen Server, der Anmeldungen, Zugangsschlüssel und Sperren behandelt,
die falsche: ein Typecheck, der nur `any` sieht, prüft nichts und behauptet
trotzdem, geprüft zu haben. In `server/typen.ts` stehen deshalb die fünf
Formen, die der Server ohnehin hatte — sie standen bisher nur in
Kommentaren: Anfrage, Antwort, Ablage, Wer, Umwelt.

Der Gewinn ist nicht die Schreibweise. `Ablage` steht über beiden
Umsetzungen — der im Arbeitsspeicher und der auf D1. Der Kommentar dort
sagt seit dem ersten Tag „Beide können genau dasselbe"; ab jetzt sagt das
der Übersetzer, und zwar bevor jemand veröffentlicht.

Was dabei gefunden wurde:

  · `/v1/pages/abc/children` gab die Seite `abc` zurück. Der vierte
    Pfadteil wurde ausgelesen (`unter = t[3]`) und nie wieder angesehen;
    geprüft wurden nur `pages` und die Kennung. Wer die Unterblöcke wollte,
    bekam die Seite und hielt sie für seine Antwort — eine falsche Antwort
    ist teurer als keine. Jetzt kommt ein 404, der die Wege nennt, die es
    gibt.
  · `new URL(null)` in der Brücke, wenn `?ziel=` fehlt.
  · `konto.id` in `sitzungGeben`, obwohl `hole` auch nichts liefern kann:
    verschwindet das Konto während der Anmeldung, warf der Server mitten
    darin einen 500er ohne Text.
  · `sitzungGeben(ablage, kontoId, geraet)` mit drei von vier Werten — der
    vierte war nie als freiwillig gekennzeichnet.
  · Ein Dutzend `catch (e) { … e.message }`, drei Stellen mit `String(e)`
    statt einer Prüfung.

`pfad` fliegt aus dem Wörterbuch von `benannte.mts` — der dritte Fall
derselben Sorte nach `k` und `s`/`t`. In `src/` ist es der Weg durch den
Blockbaum (`string[]`), in `server/` der Weg in der Adresse (`string`).
Das Werkzeug schrieb prompt sechsmal `string[]` hin, und tsc meldete
`Property 'toLowerCase' does not exist on type 'string[]'` — der Beweis für
die Regel, die seit Bündel 14 darüber steht. Dieselbe falsche Annotation
stand seit einem früheren Bündel auch in `src/kern/ablage/befehle.ts`.

`tsmeldungen.mts` fasst zusammen, womit alle fünf Umzugswerkzeuge anfangen:
tsc laufen lassen und die Ausgabe nehmen. Bis jetzt stand `tsconfig.bauen`
fünfmal fest eingetragen da; ab jetzt sagt `--konfig`, welche gilt.

`test109` prüft mit: dass `server/`, `worker.ts` und `functions/` in
`tsconfig.json` stehen und nicht gleichzeitig ausgeschlossen sind, und dass
`allowImportingTsExtensions` hier an und in der bauenden Konfiguration aus
ist. Ohne diese Zeilen wäre die stille Fassung möglich — grüner Typecheck,
der genau die Stelle nicht ansieht, an der ein Fehler etwas kostet.

Bestand: 129 → 118 JavaScript-Dateien.

Geprüft: tsc ohne Meldung (beide Konfigurationen), `node server/pruefserver.ts`
läuft und antwortet, Suiten 31, 75, 76, 78, 79, 87, 92, 93, 94, 101, 102,
109 und servercheck — alle grün.

---

## Bündel 20: die Wurzel — bauen, bruecke, sw und die Symbole

`e92dfdc9`

Vier Dateien, die letzten ausserhalb von `pruefungen/`:

  bauen.js                     → bauen.mts
  bruecke.js                   → bruecke.mts
  oeffentlich/icons/erzeugen.js → erzeugen.mts
  sw.js                        → src/dienst/sw.ts  (erzeugt `sw.js`)

Die drei Node-Skripte waren CommonJS; sie sind jetzt ESM und laufen
unverändert per `node bauen.mts`. Statt `__dirname` steht dort
`import.meta.dirname` — nicht `new URL(import.meta.url).pathname`, das
liefert unter Windows `/C:/…` mit führendem Schrägstrich, und jeder
Dateizugriff darauf geht ins Leere.

Der Beweis, dass beim Umzug nichts verlorenging: `node
oeffentlich/icons/erzeugen.mts` schreibt alle 23 Symbole neu, und git meldet
für keine einzige PNG-Datei eine Änderung. Byte für Byte dasselbe.

DER DIENSTARBEITER war der einzige Fall, der eine eigene Konfiguration
braucht. Er MUSS in der Wurzel liegen — ein Dienstarbeiter darf nur den
Bereich bedienen, in dem seine eigene Datei steht; läge er unter `quell/`,
könnte er `index.html` nicht mehr beiseitelegen, und die App startete ohne
Netz nicht mehr. `tsconfig.sw.json` schreibt deshalb von `src/dienst` nach
`.` statt nach `quell/`.

Und er braucht eine eigene `lib`. Ein Dienstarbeiter lebt nicht im Fenster:
kein `document`, dafür `caches`, `clients` und `skipWaiting`. Mit der
DOM-Bibliothek hielte TypeScript `self` für ein Fenster — `document` ginge
durch, `self.clients` wäre der Fehler. Genau verkehrt. `WebWorker`
beschreibt die Welt, in der die Datei wirklich läuft; weil beide sich
widersprechen, steht `src/dienst/` in `tsconfig.json` unter `exclude`.

`self` ist dort der ServiceWorkerGlobalScope, den auch `WebWorker` nicht
kennt. Eine Zeile sagt, was dasteht — `const ich = self as unknown as
ServiceWorkerGlobalScope` —, und dafür bekommen alle Ereignisse darunter
ihre richtigen Formen: `e.request`, `e.waitUntil`, `e.respondWith` statt
`any`. Beim Bauen bleibt `const ich = self;` übrig.

Ein Fund dabei: `kunden[0].postMessage(…)` — die Liste war zehn Zeilen
vorher auf „nicht leer" geprüft, aber zwischen Prüfung und Zugriff liegt
ein `await`. Schliesst jemand in diesem Augenblick das letzte Fenster, warf
der Arbeiter statt zu antworten. Jetzt kommt ein 503 mit Text.

Auch in `bruecke.mts`: `new URL(null)` ohne `?ziel=`, und
`res.writeHead(antwort.statusCode)` — ohne Statuszeile von der Gegenstelle
warf das mitten im Weiterreichen; jetzt 502.

Zwei Prüfläufe wachsen mit. `test105` bekommt einen fünften Abschnitt für
den Dienstarbeiter: baut ihn in ein leeres Verzeichnis und vergleicht mit
dem, was eingecheckt ist. Die stille Fassung wäre hier besonders teuer —
ein veralteter Dienstarbeiter bedient die App weiter, aus dem Speicher, mit
dem alten Stand; man merkt es nicht am Bildschirm, sondern erst, wenn
jemand ohne Netz etwas Altes sieht. `test109` kennt jetzt die eine Ausnahme
von der Regel „erzeugt heisst quell/".

`tsconfig.json` steht auf `**/*.mts` statt `*.mts`. Der Stern ohne die zwei
Sterne trifft nur die Wurzel — `oeffentlich/icons/erzeugen.mts` wäre
ungeprüft dagestanden, und niemand hätte es gemerkt: sie liefe ja.

Bestand: 118 → 114 JavaScript-Dateien. Was bleibt, ist `pruefungen/`.

Geprüft: tsc ohne Meldung (alle drei Konfigurationen), `node bauen.mts`,
`node bruecke.mts` und `node oeffentlich/icons/erzeugen.mts` laufen,
Suiten 31, 32, 64, 87, 105, 109, 110, 113 — alle grün.

---

## Bündel 21: die Prüfläufe — 35 Dateien von .mjs nach .mts

`089ed464`

799 Typfehler am Anfang, 0 am Ende. Kein Lauf hat eine Prüfzeile verloren
oder dazubekommen; die Zahlen sind überall dieselben wie vorher.

DIE WICHTIGSTE REGEL BEI PRÜFLÄUFEN ist eine andere als bei Anwendungscode:
eine Prüfung darf nicht still grün werden. Ein `?.` an der falschen Stelle
macht aus einem fehlenden Satz ein `undefined`, und `pruef('…', x, false)`
besteht — ohne irgendetwas geprüft zu haben. Wo das drohte, steht deshalb
eine sichtbare rote Meldung oder ein Abbruch mit Satz, nicht das kürzere
Fragezeichen.

Und der Fehler, den ich selbst gemacht habe: ein Suchen-und-Ersetzen hat
`window.__x` zu `(window as any).__x` gemacht — auch INNERHALB von
HTML-Nutzlasten, die an den Browser gehen. Dort ist `as` ein Syntaxfehler,
der Handler feuert nie, und `test94` („Was NICHT laufen darf") wäre auch bei
ABGESCHALTETER CSP grün gewesen. Sechs Stellen in test90, test91 und
test94, alle zurückgesetzt und wieder zeichengleich mit der alten .mjs.
Genau deshalb steht in den Läufen jetzt nirgends TypeScript-Syntax in einer
Zeichenkette, die den Browser erreicht.

Was der Übersetzer sonst gefunden hat — jedes Mal eine Prüfung, die weniger
prüfte, als ihr Name sagt:

  · test90 rief ein Modul `Reiter` an, das es nicht gibt — es heisst
    `Fenster`. Der Zweig lief seit jeher nie: `#reiterleiste [title]` hatte
    0 Elemente statt 5. Eine der beiden Stellen, um die es in diesem Lauf
    geht, wurde nie gezeichnet und nie geprüft.
  · test87: `SERVER[r].rang` warf einen TypeError, sobald `REIHE` einen
    Namen nennt, den der Server nicht kennt — also genau in dem Fall, für
    den der Lauf geschrieben ist. Der Absturz riss die hundert Prüfungen
    danach mit. Jetzt wird die eine Zeile rot und der Rest läuft weiter.
  · test78: `Wolke.abgleichen()` gibt `null` zurück (nicht angemeldet, kein
    Bereich, läuft schon). Fünf Stellen lasen direkt `e.angenommen`.
  · test76: ein `find(…)`, das `undefined` liefern kann, und danach
    `.id` — mit `?.` hätte „Ein verschlüsselter Satz taucht dort nicht auf"
    grün gemeldet, ohne etwas anzusehen. Dort steht jetzt ein Abbruch.
  · servercheck: `await import(WURZEL + '/server/kern.ts')` — `WURZEL` gab
    es nicht mehr, der Lauf wäre an dieser Zeile gestorben.
  · test97: `d.collection` gibt es nicht (`addDatabase` liefert
    `collectionId`), und „Der erste Durchgang nimmt nicht alles auf einmal"
    prüft etwas anderes als sein Name sagt. Beides steht jetzt als Frage im
    Text, nicht stillschweigend geändert.
  · test85: vier Prüfungen „der alte Name ist weg" hätten über `window`
    für immer bestanden — die alten Module waren zugleich `const` und
    `window.X`. Sie fragen jetzt wieder nach dem `const`.

`n` fliegt aus dem Wörterbuch von `benannte.mts` — der vierte Fall nach `k`,
`s`/`t` und `pfad`. In `src/` ist es eine Anzahl, in den Prüfläufen der NAME
einer Prüfung. Das Werkzeug schrieb `(n: number)` in vierzig Dateien, und
aus 35 Meldungen wurden 1248.

`fangfehler.mts` kommt dazu: `catch (e) { … e.message … }` wird zu
`catch (e: unknown) { … (e instanceof Error ? e.message : String(e)) … }`.
Nicht `catch (e: any)` — das wäre die kürzere Zeile und würde genau die
Frage wegdrücken, um die es geht. Mit einem regulären Ausdruck geht das
nicht: `return { ok: false, fehler: e.message }` hat eine Klammer im Rumpf.
Also wird gezählt statt gesucht.

Bestand: 114 → 79 JavaScript-Dateien.

Geprüft: tsc ohne Meldung, alle 35 Läufe einzeln grün.

---

## Die Commit-Nachrichten als Dokument — der Laptop hat eine eigene Geschichte

`ca554b6c`

Der Ordner auf dem Laptop führt eine eigene Git-Geschichte; die Commits aus
der Werkstatt lassen sich dort nicht anhängen, ohne die vorhandene zu
zerreissen. Übertragen werden deshalb die Dateien — und ohne diese Datei
wäre aus vierzehn Nachrichten ein einziger Satz geworden.

Was verloren ginge, ist nicht die Aufzählung der Änderungen (die steht im
Diff), sondern das WARUM: welcher Fehler dahinterstand, was vorher geschah
und warum die Lösung so aussieht und nicht anders. Genau das lässt sich
später aus keinem Diff mehr herausholen.

---

## Bündel 22: die letzten 44 Prüfläufe — CommonJS wird ESM-TypeScript

`e4d1e012`

`test31.js` bis `test74.js`, rund 14 000 Zeilen. 2132 Typfehler am Anfang,
0 am Ende. `require` wird `import`, `__dirname` wird `import.meta.dirname`
— nicht `new URL(import.meta.url).pathname`, das liefert unter Windows
`/C:/…` mit führendem Schrägstrich.

DIE GEGENPROBE IST DER EIGENTLICHE TEIL DIESER ARBEIT. Ein Prüflauf, der
nach dem Umzug grün ist, beweist nichts — er könnte grün sein, WEIL er
nichts mehr misst. Deshalb ein vollständiger Durchlauf gegen den Stand von
vorher, Suite für Suite verglichen: 83 Läufe, dieselben Zahlen, eine
einzige Abweichung — und die war test109, der zu Recht meldete, dass ich
`js-bestand.json` noch nicht nachgezogen hatte.

Was der Übersetzer gefunden hat:

  · `Formula.run` verlangte vier Werte und bekommt zwei. Die JSDoc darüber
    sagt seit jeher `@param {Function} [fremdFn]` — die eckigen Klammern
    heissen „freiwillig" —, und der Rumpf fragt an jeder Stelle selbst nach
    (`umgebung && umgebung.zeile`). Nur die Signatur behauptete das
    Gegenteil. Zwei Dutzend Aufrufer geben zwei Werte; JavaScript liess das
    durchgehen, TypeScript nicht, und es hatte recht.
  · `test37` warf sechs Diagnosewerte weg. Sechs Prüfzeilen geben eine
    Einzelheit mit — die gemessene Knopfreihe, den Text der Pille —, und
    `ok` nahm zwei Werte entgegen. Wer eine Zeile rot sah, bekam nur den
    Namen. Jetzt wird die Einzelheit bei einem Fehlschlag gezeigt; im
    grünen Fall ist die Ausgabe unverändert.

Statt `!`-Behauptungen stehen an rund fünfzig Stellen jetzt Wachen mit
Text: `if (!x) throw new Error('#tree ist nicht da — der Lauf misst sonst
nichts.')`. Das ist bei einem Prüflauf keine Förmlichkeit: `?.` an
derselben Stelle hätte aus einem fehlenden Element ein `undefined` gemacht,
und `pruef('…', undefined, false)` wäre GRÜN gewesen. Wo eine Wache nicht
hinpasste — in einem Rückruf ohne Rumpf —, steht `?.`, und die Prüfzeile
wird dann sichtbar rot.

Zwei Helfer wiederholen sich und stehen deshalb im jeweiligen Rückruf:
`aktiv()` für `document.activeElement` (das ist `Element | null` und kennt
weder `dataset` noch `focus`) und `musselement(sel)` für ein Element, ohne
das der Lauf nichts mehr misst.

`test109` verliert seine Zahl. Dort stand `eingetragen.length > 50` gegen
den Fall, dass jemand das Verzeichnis leert — und mit diesem Bündel fällt
der Bestand auf 35. Eine Zahl, die irgendwann von selbst rot wird, prüft
nichts mehr; sie erinnert nur an ihren Aufstellungstag. Was den Fall
wirklich abdeckt, stand zwei Zeilen weiter unten immer schon: die beiden
Mengen — Platte und Verzeichnis — müssen gleich sein. Die Zahl bleibt als
Bericht.

Bestand: 79 → 35 JavaScript-Dateien. Übrig sind `pruefungen/alle.js`,
die 32 toten Läufe in `pruefungen/alt/` und drei `.mjs` unter `server/`.

Geprüft: tsc ohne Meldung in allen drei Konfigurationen, `npm run bauen:ts`,
`node bauen.mts`, Vollprüflauf mit 84 Suiten gegen den Stand von vorher.

---

## Bündel 23: der Prüfläufer selbst — und drei Doppel, die niemand ausführte

`edf8a553`

`pruefungen/alle.js` ist die letzte Datei mit `require`. Sie startet jeden
Lauf als eigenen Prozess, hält drei Sekunden Pause dazwischen und zählt am
Ende zusammen — jetzt als `alle.mts`. `LANGSAM` nennt die beiden Messläufe
wieder richtig: dort stand noch `test73.js`, seit Bündel 22 heissen sie
`.mts`. Ohne diese Zeile hätte `--schnell` sie stillschweigend mitlaufen
lassen und wäre nicht mehr schnell gewesen.

DREI DATEIEN WERDEN NICHT UMGEZOGEN, SONDERN ENTFERNT — und das ist etwas
anderes, deshalb steht es hier ausdrücklich:

  server/servercheck.mjs
  server/test75.mjs
  server/test76.mjs

Sie sind Abschriften dessen, was in `pruefungen/lauf/` steht. Nachgesehen,
nicht vermutet: dieselben Prüfnamen, in derselben Zahl, mit derselben
Prüfsumme (21, 104 und 47 Zeilen). Und niemand ruft sie auf — `alle.mts`
durchsucht `pruefungen/lauf/` und `pruefungen/alt/`, sonst nichts; kein
Ablauf, keine Anleitung, keine Zeile im Repository nennt sie.

Eine zweite Kopie eines Prüflaufs ist schlimmer als keine: sie läuft nicht
mit, veraltet still, und wer sie eines Tages findet, hält sie für die
gültige Fassung. Der Bestand fällt dadurch um drei, ohne dass drei Dateien
umgezogen wären — wer die Zahl liest, soll wissen, welcher Teil davon
Arbeit war und welcher Aufräumen.

Bestand: 35 → 31 JavaScript-Dateien. Übrig sind die 31 toten Läufe in
`pruefungen/alt/` — und die sind ein eigener Fall, über den ich vorher
reden will.

Geprüft: tsc ohne Meldung, `node pruefungen/alle.mts 105 87 31` und
`node pruefungen/alle.mts server` (13 Läufe) grün, `test109` grün.

---

## Bündel 24: pruefungen/alt/ — die Fragen bleiben, die Dateien gehen

`d545099b`

Damit steht im Bestand null. `test109` sagt es selbst:

    TypeScript unter src/:  114
    erzeugtes JavaScript:   114  (zählt nicht)
    noch JavaScript:        0

DIESER SCHRITT IST KEIN UMZUG, UND DAS SOLL MAN DER ZAHL ANSEHEN. Die 31
Dateien in `pruefungen/alt/` wurden nicht nach TypeScript gebracht, sie
wurden entfernt. Sie liefen seit der Umbenennung nicht mehr — sie öffnen
`notizen-einzeldatei.html`, und die gibt es nicht —, und `LIESMICH.md` sagte
über sie seit jeher: „Erwarte Rot."

Behalten wurden sie mit der Begründung, in ihnen stecke Wissen. Das stimmte.
Nur steckte es nicht im Code, der nicht mehr lief, sondern in den FRAGEN, die
sie gestellt haben — und eine Frage braucht keinen lauffähigen Rahmen, um
gelesen zu werden. Sie stehen jetzt in `doku/ALTE-PRUEFLAEUFE.md`: 466
Fragen, Datei für Datei, dazu jeder Kommentar, der mehr als eine Zeile lang
war. 737 Zeilen, in denen man nachsehen kann, was diese Läufe einmal wissen
wollten.

Was das Dokument ausdrücklich NICHT behauptet: dass 466 Prüfungen fehlen.
Die meisten dieser Namen tauchen heute nicht wörtlich auf, weil sie
umformuliert, zusammengefasst oder in eine gründlichere Fassung überführt
wurden — die heutigen Läufe stellen über dreitausend Fragen. Ein Vergleich
von Namen kann das nicht auseinanderhalten, und ein Dokument, das so täte,
wäre schlimmer als keines. Wer eine Lücke vermutet, hat jetzt die Liste, um
nachzusehen.

`--alt` bleibt als Schalter in `alle.mts`: legt jemand den Ordner wieder an,
wird er mitgenommen. Ohne Ordner tut er nichts — das ist die richtige Antwort
auf einen Schalter, dessen Ziel verschwunden ist.

Geprüft: tsc ohne Meldung in allen drei Konfigurationen, `test109` mit
20 ok / 0 offen, `node pruefungen/alle.mts --alt 109` läuft ohne den Ordner
durch.

---

## Bündel 28: der Start-Bildschirm sagt, ob gesichert ist — und die Sicherung sagt es ihm

DER FEHLER ZUERST, denn er ist der Grund für alles andere in diesem Bündel.

Redion merkt sich unter `sicherung:zuletzt`, wann zuletzt gesichert wurde.
Geschrieben hat diese Marke genau eine Stelle: `Krypto.sicherungSchreiben` —
der Weg über den Verschlüsselungs-Dialog. Der Hauptweg,
`App.sicherungSpeichern`, schrieb sie nie. Dorthin führen vier Knöpfe: die
Einstellungen (`export-json`), die PWA-Schublade, die Befehlsleiste und die
Pflegeseite. Wer also normal sicherte — und das tun alle —, dessen Marke blieb
leer.

Solange die Anzeige drei Klicks tief in den Einstellungen lag, ist das nicht
weiter aufgefallen. Sobald sie auf dem Start-Bildschirm steht, ist sie eine
Lüge, die jeden Morgen mitliest: „Noch nie gesichert." — an jemanden, der
gestern gesichert hat.

`sicherungGemerkt(art)` schreibt jetzt beide Marken, in beiden Zweigen von
`sicherungSpeichern` und im `.redion`-Zweig ausdrücklich erst NACH dem
`l.click()` im `try`. Der `catch` daneben sagt „Es wurde nichts geschrieben" —
dann darf auch nichts vermerkt werden.

Die zweite Marke, `sicherung:art`, gibt es, weil die beiden Sicherungen nicht
dasselbe können: `.redion` nimmt die Anhänge mit, `.json` nicht. Wer nur JSON
gesichert hat, hat seine Bilder nicht gesichert. Der ruhige Zustand schreibt
das jetzt dazu.

DIE ANZEIGE IST ABGESTUFT, und das ist keine Kosmetik. Eine Warnung, die
immer gleich laut ist, wird zur Tapete; und wer gelernt hat, sie zu übersehen,
übersieht sie auch, wenn sie stimmt. Deshalb:

    frisch (< 7 Tage)      eine ruhige Zeile, grüner Haken, „Sichern" leise
    über eine Woche        gelber Streifen, Hinweis mit Knopf
    über einen Monat/nie   roter Streifen, eingefärbte Fläche, „Jetzt sichern"

Die Stelle auf der Seite bleibt in allen drei Fällen dieselbe — direkt unter
den Schnellkacheln —, damit beim Wechsel nichts springt. Die Farbe steckt im
linken Rand, nicht in der ganzen Fläche; nur die höchste Stufe färbt.

Ein unlesbarer Zeitstempel gilt als „nie". `Date.parse('irgendwas')` ergibt
`NaN`, und `NaN >= 30` ist `false` — ohne die ausdrückliche Prüfung hätte die
Anzeige bei kaputter Marke „frisch gesichert" behauptet. Fehler dieser Sorte
melden sich nie von selbst.

DAZU ZWEI ABSCHNITTE, die aus derselben Frage kommen: was gehört auf einen
Start-Bildschirm, der auf dem Handy die Seitenleiste ersetzen muss?

`Schnellzugriff` zeigt die Seiten, die mit ★ markiert sind — höchstens vier,
als Kacheln. Der Wunsch war „Ausbildung" und „Mediathek" als eigene Kacheln.
Zwei feste Kacheln einzubauen wäre die kurze Antwort und die falsche gewesen:
der Nächste braucht „Rezepte" und „Trainingsplan". Redion kennt bereits einen
Begriff dafür, dass etwas wichtig ist — den Stern. Kein zweites Anheften, kein
Einstellungsdialog, keine Liste, die man doppelt pflegt. Ohne Sterne erscheint
die Überschrift gar nicht.

`Privat` listet die Seiten oberster Ebene mit der Zahl ihrer Unterseiten.
„Zuletzt bearbeitet" beantwortet: woran war ich dran? „Privat" beantwortet:
was habe ich überhaupt? Auf dem Handy ist das die wichtigere Frage, weil es
dort keinen Seitenbaum gibt.

ZWEI SPRACHFEHLER nebenbei, beide seit jeher da: „1 Karten fällig" auf der
Kachel und „1 Karteikarten sind fällig" in der Meldung beim Start.

Geprüft: `test117` mit 41 Kontrollen, alle grün — die drei Stufen, der
kaputte Zeitstempel, die Marke nach `App.sicherungSpeichern`, beide neuen
Abschnitte, und auf 428 px der Knopf mit 44 px Höhe ohne seitliches Scrollen.
Gegenprobe gemacht: mit einem leeren `sicherungGemerkt` fällt der Lauf mit
3 Fehlern durch — die Prüfung misst also wirklich den Fehler und nicht sich
selbst. Bilder in hell und dunkel, Desktop und iPhone-Breite. tsc ohne Meldung
in allen drei Konfigurationen, voller Durchlauf 88 grün / 0 rot.

---
