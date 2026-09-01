# AUFGABEN.md

Diese Datei ist die Arbeitsliste für Redion.

Sie beantwortet:

```txt
Was wird als Nächstes gemacht?
Warum ist es wichtig?
Wo gehört es hin?
Wann ist es fertig?
Welche Tests müssen laufen?
```

**Wo was steht**

| Datei | Frage |
|---|---|
| `ENTSCHEIDUNGEN.md` | Warum wurde etwas so entschieden? |
| `AUFGABEN.md` | Was wird als Nächstes gebaut? |
| `LUECKEN.md` | Was fehlt noch im Produkt? |

---

## Grundregel

Jede Aufgabe braucht: **Ziel · Warum · Dateien · Fertig wenn · Tests ·
Priorität.**

Die Phasen stehen in der Reihenfolge, in der sie einander leichter machen.
Was **erledigt** ist, bleibt mit zwei bis fünf Zeilen stehen — damit man
sieht, worauf das Nächste aufbaut, ohne die ganze Geschichte zu lesen.

---

## Aktueller Stand

**30. August 2026 · Holen und Hochladen, je ein Skript (E271)**

> Redur: „eine holt die von github auf laptop und die andere umgekehrt".
> `holen.bat` und `hochladen.bat`, je eine Richtung, keines fasst die andere
> an. Beide wirft nichts weg bzw. überschreibt nichts Fremdes.
> **Der eigentliche Fund kam aus der Prüfung: das Verzeichnis ist ÖFFENTLICH**
> (`"private": false`, nachgemessen) — und `.gitignore` deckte `*.redion`
> nicht ab. Da E270 gerade automatische `.redion`-Sicherungen eingeführt hat,
> hätte ein `git add -A` Redurs ganzen Arbeitsbereich öffentlich ins Netz
> laden können. Geschlossen, bevor es passieren konnte.
> Dazu acht in echten Git-Repos nachgemessene Fehler in den Skripten selbst,
> darunter zwei mit Datenverlust. test87 §11 mit zehn Punkten, drei
> Gegenproben rot.
> Als Nächstes E269: Auswahl-Feinschliff der Zeichenschicht.

**30. August 2026 · Deine Daten auf allen Geräten (E270)**

> Redurs Wunsch war „alles auf iCloud". Ein Browser kann das nicht — also
> zwei Wege, die es wirklich einlösen, und beide waren gebaut und keiner
> benutzbar. Der eigene Cloudflare-Server ist fertig (Konten, Abgleich,
> Drei-Wege-Merge, E2E, R2) und war nur nicht scharfgeschaltet, während
> die Oberfläche an VIER Stellen behauptete, es gäbe ihn nicht.
> Dazu ein Sicherheitsfund: `[assets] directory = "./"` hätte ohne
> `.assetsignore` das ganze Verzeichnis veröffentlicht — gemessen brach
> `wrangler deploy` sogar an einer 78,6-MB-Datei in `.git` ab, Redur
> hätte also gar nicht veröffentlichen können.
> Neu ausserdem: Sicherung in einen Ordner (liegt er in iCloud Drive,
> lädt der Dienst sie selbst hoch), alle fünf Minuten und nur bei echter
> Änderung, 7 Tage plus je Monat einer, gelöscht wird nur das eigene
> Namensmuster und erst nach `close()`.
> test270: 65 Punkte, fünf Gegenproben einzeln rot gesehen.
> **Was Redur selbst tun muss:** die sechs Befehle in
> SERVER-EINRICHTEN.md, Schritt 0 — sein Cloudflare-Konto kann ich nicht
> bedienen. Danach sagt „Wolke → Server prüfen" in Worten, ob es steht.
> Danach E271: holen.bat und hochladen.bat (erledigt, siehe oben).

**30. August 2026 · Der Zeitmesser — Lernzeit messen statt schätzen (E268)**

> Schwebendes Feld mit Stoppuhr und Timer (5/25 Min), das sich merkt, an
> welcher Seite gearbeitet wurde; jede Sitzung landet mit Dauer und Seite
> in `zeit:sitzungen` (höchstens fünfzig). Schliessen stoppt nicht.
> Löst den alten Punkt „Pomodoro/Lernzeit echt messen statt schätzen".
> test268: 15 Punkte, drei Gegenproben rot — und ein Fund über die
> Prüfung selbst: die Pausenprobe war bei 1,4 s Wartezeit keine Prüfung
> (Rundung frass den Unterschied), erst 2,6 s machen sie rotfähig (§55.2).
> Danach E270: Redions Server scharfschalten (erledigt, siehe oben).

**30. August 2026 · Haftnotiz und Lineal auf der Zeichenschicht (E267)**

> Marken-Art `zettel`: aufziehen, Redions mehrzeiliges Blatt fragt nach
> Text (neu: Dialog.mehrzeilig — kein prompt()), Tinte nach Helligkeit,
> Umbruch in tspans, Abbruch räumt weg. Lineal-Schalter rastet
> Linie/Pfeil auf 15°-Schritte. test267: 16 Punkte, drei Gegenproben
> rot. Weiter: Zeitmesser (E268), Auswahl-Feinschliff (E269).

**30. August 2026 · Das Abdeckband — Active Recall auf Blatt und PDF (E266)**

> Neue Marken-Art `abdeck` in der einen Zeichenschicht: deckende Fläche
> über Lösungen, Antippen im Schreiben-Modus deckt auf/zu — NUR als
> Laufzeit-Attribut, die Ablage schweigt (kein edited, kein Sync-
> Rauschen). Neuladen/Druck/Folien zeigen zu. Knopf „Abdecken" in
> Blatt-Leiste und Menüband. test266: 12 Punkte, drei Gegenproben rot
> gesehen. Weiter: Haftnotiz+Lineal (E267), Zeitmesser (E268),
> Auswahl-Feinschliff (E269).

**30. August 2026 · Die Heft-Bibliothek aus Redurs GoodNotes-Dossier (E265)**

> Das Regal wird die Bibliothek aus dem Dossier: Reiter Dokumente/
> Favoriten/Papierkorb (wiederherstellen ja, endgültig löschen nur in
> der einen Löschmaschine), Fächer aus normalen Seiten (additives Feld
> `heftArt`, kein Datenmodell), Neu-Menü mit Papier-Schnellwahl über
> die neuen App.erstellenWege/erstellenWeg (die Kachel bleibt der
> Ein-Klick-Weg), Gitter/Liste, klickbarer Stern, Deckelfarbe aus
> `p.color` mit Whitelist, Verschlüsseln im Kontextmenü. test265: 38
> Punkte, drei Gegenproben rot gesehen — eine davon entlarvte einen
> leer-grünen Prüfpunkt (§55.2). Als Nächstes das Abdeckband (E266).

**30. August 2026 · Die Notizhefte: ein Regal, das sofort schreiben lässt (E264)**

> Neue Ansicht „Notizhefte" (Redurs GoodNotes-Wunsch, als Ablauf, nicht
> als Optik): Weiterschreiben-Karte, Deckel mit echtem Papiermuster,
> EIN Klick bis zum Schreibzeiger im linierten Blatt. Ein Heft ist eine
> Ansichtsregel (Seite mit Blatt-Kind, keine PDF-Seite) — kein neues
> Datenmodell. Startwerte „notizhefte"/„notizheft" in Einstellungen UND
> start() im selben Schritt (E236-Lehre). test264: 25 Punkte, drei
> Gegenproben rot gesehen. Als Nächstes E265: das Regal wird die
> GoodNotes-Bibliothek aus Redurs Dossier (Fächer, Favoriten,
> Papierkorb-Reiter, Liste, Deckelfarbe, Sperren im Menü) — dann
> Abdeckband (E266), Haftnotiz+Lineal (E267), Zeitmesser (E268),
> Auswahl-Feinschliff (E269).

**29. August 2026 · Hauptknopf-Verlauf und einklinkende Reiter (E263)**

> Amdion Phase 1, weiter: die Hauptknopf-Fläche als EINE Marke
> (--haupt-flaeche, Verlauf nach unten ins Dunkle — Amdions Aufhellung
> fiel bei der Messung auf 3,77 durch), getragen von .rb.haupt UND den
> echten is-primary-Knöpfen; der Lernwelt-Hover ist jetzt je Modus
> richtig herum. Der aktive Reiter klinkt mit drei Rändern in die
> Fläche ein statt auf einer Linie zu sitzen. Sechs Suiten grün.

**29. August 2026 · „⚡ Schaltung": Netz, Türklingel und Co. (E262)**

> Redurs Wunsch, zweistufig: erst L1 und N mit Quelle auf einen Klick,
> dann fertige Beispielschaltungen „direkt im Code". Der Knopf öffnet
> jetzt ein Menü: Netz, Ausschaltung, Wechselschaltung (Treppenhaus-
> Verhalten geprüft), Türklingel an 12 V — und die eigenen Vorlagen,
> die sich bisher nur speichern, aber nirgends einsetzen liessen (§47).
> test263 auf 17 Punkte gewachsen, zwei neue Gegenproben einzeln rot.

**29. August 2026 · Schaltplan: Einfügen und Schalten gehen wieder (E261)**

> Redur fand es mit der Maus: `closest('[data-id]')` lief am SVG vorbei
> bis zum Block-Kasten (der trägt `data-id = block.type`) — Einfügen
> per Klick ging im Seiten-Editor vom ersten Tag an ins Leere, kein
> Prüflauf hatte je echt geklickt. Jetzt sucht `teilAm()` nur im SVG,
> der Teil-Dialog kommt per eigener Doppeltipp-Erkennung (dblclick
> stirbt am Neuzeichnen, am Telefon gibt es keins), und das doppelte
> CSS-Raster aus E260 ist zurückgenommen. test263 neu, drei Gegenproben
> einzeln rot, test238/239/240 grün.

**29. August 2026 · Papier-Token und geteilte Anatomien (E260)**

> Amdion Phase 1 wird sichtbar: `--paper`/`--paper-ink`/`--grid`, das
> A4-Blatt ist im Dunkeln warm statt reinweiss, der Schaltplan liegt
> auf Amdions Punktraster. Neu: `anatomie.css` (Stufe 2) mit
> stat-karte, kicker, leer-zustand, hebt und ansicht-herein — je mit
> sofortigem Nutzer in Lernwelt und Menüband. test245 fing die doppelt
> gepflegte Papier-Tinte; zehn Suiten grün, Bilder im Chat.

**29. August 2026 · Bewegung wohnt nur noch in grund.css (E259)**

> Phase-1-Vorarbeit des Amdion-Bogens: das Dauern-Doppel aus marken.css
> (E43) gegen grund.css (E198) ist aufgelöst — grund.css gewann bisher
> nur durch Ladereihenfolge. Die gerichteten Kurven ziehen mit um,
> `--ease-standard` ist jetzt ein Alias der EINEN Kurve. Gegenprobe
> einzeln rot, test126/245/40 grün.

**29. August 2026 · Amdion ist die Vorlage — der Übernahme-Bogen beginnt (E258)**

> Redur will Redion „genau so" wie seinen eigenen Prototyp Amdion.
> Übernommen wird die Gestalt, nie Code oder Datenlayouts (Amdion ist
> funktional eine Teilmenge). Das Regiebuch mit acht Phasen steht in
> doku/AMDION-UEBERNAHME.md — Phase 1 ist Designsprache und
> Shell-Look, beginnend mit dem Motion-Token-Doppel aus marken.css
> gegen grund.css.

**29. August 2026 · Die Randleiste zählt die Kopfzeile mit (E257)**

> Der doppelte Lauf-Abfang von test248 war kein Flattern: seit E236
> mass `--inhalt-oben` nur die Menüleiste, und das Inhaltsverzeichnis
> wuchs bei vielen Überschriften über die Seitenknöpfe. Jetzt zählt
> die Kopfzeile mit; test248 misst es als stehenden Wächter.

**29. August 2026 · Hausaufgaben und Lernziele je Fach (E256)**

> Die zwei fehlenden Poster-Zeilen der Schulsäule. Vorlage legt homework
> und goals an (additiv wie beim Stundenplan), das Schul-Dashboard zeigt
> beide Sektionen („N offen", Überfälliges mit dem WORT), der Haken
> schreibt die Checkbox-Spalte der Zeile selbst, die Fachseite filtert
> über die echte Fach-Relation. test262 (11 Punkte, 2 Gegenproben
> einzeln rot), test202/215/250 grün. Bilder im Chat.

**29. August 2026 · Die Löschabsicht überlebt den Import (E255, L74 zu)**

> „Ersetzen" tauschte auch meta — wartende Grabsteine (E249/E254)
> starben mit, und ohne das Oben-Set wäre die Datei-Wache erblindet
> (L6 durch die Hintertür). Jetzt rettet importAll die Vereinigung der
> drei Listen; Kennungen, die die Sicherung wieder mitbringt, nehmen
> ihren Grabstein zurück. test261 §11, Gegenprobe einzeln rot. Die
> offene Konto/Marken-Frage ist ehrlich als L76 notiert.

**29. August 2026 · Endgültig heisst endgültig — jetzt auch für Blöcke (E254, L73 zu)**

> Das Muster „Papierkorb und sofort löschen" entfernte den Satz, bevor
> je ein Abgleich lief — drüben lebte er weiter und kam sogar zurück.
> Jetzt: Merkliste `wolkeBloeckeWeg` nach dem E249-Muster, geschrieben
> in purgeTief (samt Zeilen, Ansichten, Sammlung), versandt vor dem
> Holen, basis-Wache gegen Falschmeldung, zwei Runter-Wachen gegen Echo
> und Leichen. Server unverändert. test261: 16 Punkte, echter
> Prüfserver, zeitweise drei Geräte; Gegenprobe ohne Schreibpunkt →
> 9 rot, darunter B mit {"alive":true}. Folgelücken L74/L75 notiert.

**29. August 2026 · Der Graph bekommt ein Suchfeld — und seinen Boden (E253)**

> Tippen listet Treffer aus dem ganzen Index, Klick/Enter macht den
> Treffer zum neuen Mittelpunkt, Escape leert erst die Suche (§38),
> der Leerfall nennt das Wort (§47). Beifund nach §55: Steuerzeile und
> Seitenfeld des Graphen hatten NIE Stil — rohe Fieldsets, das Panel
> floss als Fliesstext unter die Fläche. Beides steht jetzt in
> werkzeuge.css. test260 (9 Punkte, 2 Gegenproben einzeln rot).

**29. August 2026 · Kartentext sieht überall gleich aus (E252)**

> Der Karteikasten zeichnete **fett** und `Code`, die Lernwelt zeigte an
> sieben Stellen nackte Sternchen — Training, Simulation, Fehlerlisten.
> Jetzt läuft verfasster Kartentext überall durch `Blocks.inline`
> (maskiert zuerst, §19); Getipptes bleibt wörtlich. test259 sucht die
> Karte durch die Runde (die erste Karte ist die Demo-Karte!), prüft
> Auszeichnung UND Maskierung; Gegenprobe mit echtem onerror-Lauf.

**29. August 2026 · Glocke und Wolke-Punkt — am Ende in der Menüleiste (E251)**

> Der Bild-Abgleich fand drei Fertigteile ohne sichtbaren Weg:
> Ungelesenen-Zähler, Abgleichstand, Wolke-Dialog. Der erste Anlauf
> hängte Glocke und Konto an die Kopfzeile — test40/245/248 wurden zu
> Recht rot: die Kopfzeile gehört der SEITE, die App-Zeile ist die
> Menüleiste. Jetzt: `mb-glocke` erscheint nur mit Ungelesenem (auf
> allen Geräten, am Telefon 44 px), der Statuspunkt sitzt an
> `mb-konto`, der Wolke-Dialog steht unter „Mehr → Wolke". Beifang mit
> eigener Lehre: `display:grid` schlägt die `[hidden]`-Regel des
> Browsers — die „versteckte" Glocke stand sichtbar da, und nur eine
> Prüfung des GERECHNETEN Stils sieht das (test258, 15 Punkte, drei
> Gegenproben einzeln rot). test248 stellt seine Ausgangslage seither
> ausdrücklich her, statt auf meldungsfreien Zufall zu hoffen.

**29. August 2026 · Gelöscht heisst gelöscht — auf allen Geräten (E249, L6 zu)**

> Die einzige Datenintegritätszeile der Visionskarte. Lokales Löschen
> einer Datei erreichte den Server nie und wurde beim nächsten Abgleich
> sogar rückgängig gemacht. Jetzt: Merkliste `wolkeDateienWeg` mit
> Oben-Wache (nie Hochgeladenes bleibt stumm), Versand VOR dem Holen
> (sonst belebt das Holen das Gelöschte wieder), 404/403-Regeln,
> Import-„ersetzen" bewusst ohne Grabsteine (§46), Abmelden leert die
> Liste. test256: echter Prüfserver, zwei echte Geräte, 16 Punkte —
> Grabstein überlebt das Neuladen, Server räumt die Bytes, Gerät B
> verliert die Datei. Zweistufige Gegenprobe: ohne Versand behält B die
> Datei; ohne Runter-Wache holt A die eigene Löschung zurück
> (dateienGeholt: 1). Beifund L73: das Block-Vorbild ist selbst undicht.

**29. August 2026 · Die fünf kleinen Pflichten der Karte sind ab (E244–E248)**

> Aus dem Poster-Abgleich, in einem Zug: Seitenzahlen/Kopfzeile beim
> Drucken (E244, test251 liest den eigenen Ausdruck zurück), Prüflauf
> für den DOCX-Import samt handgebauter deutscher Word-Datei (E245,
> test252), Prüflauf für die Rückverweis-Fusszeile — mit der Erkenntnis,
> dass dort ZWEI Wachen dasselbe halten (E246, test253), der
> Quellen-Wähler im Diagramm-Block: Datenbank wählen, gruppieren,
> messen, und Loslassen beim Rückweg (E247, test254), und die Uhr in
> der Elektro-Prüfung: 90 s je Aufgabe, Ablauf gibt ab wie auf Papier
> (E248, test255). Zusammen 53 neue Prüfpunkte, jede Änderung mit
> einzeln rot bewiesenen Gegenproben.

**28. August 2026 · Der Ausdruck wird abgabefähig (E244)**

> Aus dem Poster-Abgleich, „kleine Pflicht" mit grosser Sichtbarkeit:
> Drucken hat jetzt Kopfzeile (Titel), Datum und „Seite X von Y" — in
> @page-Randkästen, die der Browser auf jeder Seite wiederholt und
> selbst zählt. Erste Seite ohne Kopf (dort steht der H1), Rand zieht
> von body nach @page um (kein Doppelrand), Titel mit " und \ sprengen
> die content-Regel nicht. test251 beweist es mit echten Bytes: das
> gedruckte PDF wird über Redions eigenen Einlese-Weg zurückgeholt, und
> Seite 2 trägt „Seite 2 von N" im Suchtext. Zwei Gegenproben einzeln
> rot.

**28. August 2026 · Das Zielbild-Poster, und zwei Löcher noch am selben Abend zu (E242, E243)**

> Redur schickte sein Zielbild als Poster: „So was will ich — da steht
> alles, wie es sein sollte." Sechs Delta-Leser haben die Poster-Punkte
> gemessen (Nachtrag unter „Die Visionskarte"), und die zwei grössten
> Schul-Löcher sind seither gebaut:
>
> **E242 · Zeugnisnote je Semester (L71 zu).** Die Noten-Ansicht mittelte
> alle Schuljahre in einen Topf; ab dem zweiten Semester wäre die Kopfzahl
> falsch gewesen. Jetzt: drei Zeitraum-Knöpfe (Dieses/Letztes Semester,
> Alle), Vorgabe „Dieses Semester", Semestergrenzen Feb/Aug wie die
> Schweizer Schule, Undatiertes zählt zum aktuellen — und die Kopfzeile
> sagt das dazu. test249 §5.
>
> **E243 · Der Stundenplan-Knopf hält sein Versprechen (L70 zu).** Hinter
> „Stundenplan" stand nur die Ausbildungsseite. Jetzt: eigene
> Wochenansicht (Mo–Sa, Samstag nur wenn belegt), Lektionen nach Uhrzeit,
> „Jetzt: Elektrotechnik bis 09:20 in B204" in der Kopfzeile, das WORT
> „jetzt" an der laufenden Lektion (§38), zwei Leerfälle mit Wegen (§47);
> die Schulvorlage legt die Datenbank an — auch nachträglich, ohne
> Doppel. test250, 15 Punkte.

**28. August 2026 · Die Visionskarte: Redurs Satz, neunfach nachgemessen**

> „Kein Word, Excel, PowerPoint mehr … Schule, Noten, Lernen … PDF,
> Fachzeichnen, Elektro-Simulator … Notion, GoodNotes, Graphy, Obsidian."
> Neun strenge Leser haben jede Säule gegen den Bestand gehalten — nur
> Belegbares zählt. Ergebnis als eigener Abschnitt **„Die Visionskarte"**
> weiter unten: sechs Säulen tragen heute nachweislich, Schule trägt zur
> Hälfte, und die grössten Löcher heissen jetzt L69 (.pptx), L70
> (Stundenplan), L71 (Zeugnisnote ohne Semester), L72 (DOCX-Klartext).

**28. August 2026 · Noten: das Heft war da, jetzt rechnet jemand (E241)**

> Redur: „es sollte meine Schule alles begleiten, Noten, Lernen,
> Lernziele." Das Wort NOTEN kam in Redion genau einmal vor — als
> Datenbank der Schulvorlage. Eintragen ging, gerechnet hat niemand.
>
> Neu: Ansicht „Noten" neben den Prüfungen. Je Fach gewichteter Schnitt,
> Zeugnisnote (auf halbe Noten), Balken der letzten Noten, Zielrechner
> („für eine 4.0 braucht die nächste Prüfung mindestens eine …").
> Punkte→Note nach Schweizer Formel; Werte ausserhalb 1–6 fallen heraus
> statt den Schnitt zu heben (Gegenprobe: 13.63). test249, zwölf Punkte,
> drei Gegenproben einzeln rot.

**28. August 2026 · Redurs vier iPhone-Fotos: das Menüband stand dauerhaft offen (E240)**

> Ein einziger Reitertipp schrieb „Band offen" in EINEN Schlüssel für alle
> Startansichten — und zuklappen konnte nur der Pfeil. Auf den Fotos stand
> das Band mit 371 von 844 px über Termine, Lernen, Heute und einer Seite.
>
> Am Telefon ist es jetzt ein MENÜ: liegt über dem Inhalt statt ihn zu
> verdrängen, schliesst bei Tipp daneben, bei Bereichswechsel und nach
> jedem Befehl, und „offen" wird dort nicht mehr gemerkt — geerbte Merker
> von echten Geräten sind damit geheilt, ohne dass jemand etwas löscht.
> Am Rechner bleibt die gemerkte Wahl. Vier neue Punkte in test247 §8,
> drei Gegenproben einzeln rot. Untersucht mit vier parallelen Lesern.

**28. August 2026 · Redion öffnet dort, wo die Sachen liegen (E236)**

> Redur hat zwei Bildschirmfotos einer Notiz-App geschickt und beschrieben,
> wie Redion sich öffnen soll. Fünf Teile — und das meiste davon gab es
> schon, nur an der falschen Stelle.
>
> | | was gewollt war | was es schon gab | was ich tat |
> |---|---|---|---|
> | **1** | Regal mit Deckeln | `Bibliothek` als Tabelle | dritte Form: ein Deckel je Dokument, die Art abgelesen aus dem Inhalt |
> | **2** | „+ Neu" fragt was | `erstellenBlatt()` mit 11 Wegen, versteckt hinterm Stift | 19 Wege in 6 Gruppen, überall erreichbar |
> | **3** | zuletzt geöffnete PDF beim Start | die Einstellung gab es, ausgewertet hat sie niemand | Vorgabe „Dokument, sonst Regal" |
> | **4** | Menüleiste wie am Rechner | `#menueband` (E210), meist versteckt | ganz oben, 35 px, räumt sich selbst auf |
> | **5** | unten max 4–5 | 6 Kreise **oben** | fünf Wege unten, jeder mit Namen |
>
> **Der rote Faden:** kein einziger neuer Katalog (§8). Fünf Umzüge.
>
> **E219 ist zurückgenommen.** Er versteckte die Menüleiste über
> Startansichten, weil dort „sieben Dinge stehen, die alle sagen: nicht
> jetzt". Der Fehler war nicht die Leiste, sondern ihr Inhalt — drei ihrer
> sechs Reiter brauchen eine offene Seite. Das steht jetzt an einer Stelle
> im Register, und die Leiste räumt sich selbst auf.
>
> **Sieben Fehler fand nur das Bild (§55):** die Deckel zeigten „Seite
> 1Seite 2Seite 3" statt Papier; ein `<button>` zentriert seinen Inhalt
> senkrecht; sechs `.menu-liste` schnitten sich gegenseitig ab; der aktive
> Weg unten lag hinter der gleitenden Fläche; die Schublade deckte die neue
> Wegeleiste zu; die Titel auf den Deckeln waren HART abgeschnitten
> („Was Notion 10 0"), weil `text-overflow` für ein Inline-Element nicht
> gilt; und die Papierlinien liefen quer durch den Text wie ein
> Durchstreichen.
>
> **Vier fanden Prüfungen:** test202 kam nicht mehr zum
> Ausbildungs-Dashboard, test141 fand die zugedeckte Schublade und einen
> Punkt Fehler in `--hunten`, test126 den verlorenen Antipp-Übergang, und
> test67 den schwersten: die Sicherungswarnung und die Platzkarte standen
> nur noch in der alten Tabellenform — eine Sicherheitsfunktion (§11) in
> einer Ansicht zurückgelassen, die ab jetzt kaum jemand öffnet.
>
> **Zehn Prüfläufe wanderten mit** (31, 34, 37, 40, 67, 114, 126, 141, 156,
> 247). Bei jedem blieb die FRAGE, nur die Stelle wurde nachgezogen —
> mehrfach dreht sich dabei die Richtung um.
>
> **Und die Deckelform war die erste Vorgabeansicht ohne einen einzigen
> Prüfpunkt.** test33 hat jetzt sechs, jeder einzeln rot gemacht, bevor er
> stehen blieb (§55.2). Neu ist auch L68: die Reiterzeile der Lernwelt hat
> im verschmolzenen Kopf 234 statt 366 px.

**28. August 2026 · der Kopf am Telefon: 236 → 124 px**

> ### Was Redur rot angestrichen hat (E232–E235)
>
> Ein Bildschirmfoto der Lernzentrale, ein roter Kasten über den ganzen
> oberen Bereich, ein Satz: *„dort sollte möglichst wenig sein"*.
>
> Gemessen waren es vier Bänke und 236 px von 844 — und der Name der Welt
> stand dreimal darin: als aktiver Kreis, als Krume, als aktiver Reiter.
>
> | | was gemacht wurde | was es bringt |
> |---|---|---|
> | **E232** | Zurück und die drei Punkte auf 44 × 44 (§37) | die Krume wird 9 % kürzer |
> | **E235 ①** | Kreisleiste 80 → 68, nur am Polster gespart | −12 px |
> | **E235 ②** | Bereichsfilter wird ein Chip in der Reiterzeile | −44 px |
> | **E235 ③** | Krumenzeile und Reiterzeile werden EINE | −56 px |
>
> **Wie ③ ohne Kopplung geht:** ein Bereich markiert seine oberste, klebende
> Zeile mit `data-kopfzeile="eigene"` und sagt damit nur etwas über SICH.
> Die Schale fragt danach — `#main:has(> #scroll > #page >
> [data-kopfzeile="eigene"])` — und nimmt am Telefon ihre eigene Zeile aus
> dem Fluss. Fehlt die Marke, ändert sich nichts (§5).
>
> **Zwei Fehler fand nur das Hinsehen (§55):** die zwei Knöpfe sassen sechs
> Punkte zu hoch auf der Karte (`align-items:stretch` streckt keinen Knopf
> mit fester Höhe), und der GEWÄHLTE Reiter stand halb ausserhalb. Das
> zweite wurde in `Rollrand.zeige()` gelöst, also für alle vier Rollleisten
> auf einmal.
>
> **Und der Preis, ausgesprochen:** die Reiterkarte ist von 322 auf 234 px
> geschrumpft — zweieinhalb statt dreieinhalb sichtbare Reiter. Sie rollt,
> zeigt ihre Kante als Schatten, und der aktive Reiter steht immer im Bild.
>
> **Versprochen waren 112 px, geworden sind es 124.** Die 112 kamen aus einer
> Schätzung, in der die Kreise auf 56 schrumpfen — das ist die Trefferfläche
> selbst und wäre unter §37 gegangen.
>
> **Geprüft:** test67 §11, elf Punkte, vier Gegenproben einzeln gefahren und
> jede rot geworden.

**27. August 2026 · 215 Prüfläufe · acht Fehler aus dem Bilderdurchgang**

> ### Was 92 Bildschirmfotos gefunden haben (E224–E231)
>
> Redur wollte alle Ansichten sehen — Rechner und Telefon, hell und dunkel —
> und wissen, was zu voll ist. Aus dem Hinsehen wurden acht Behebungen, und
> keine davon hätte eine bestehende Prüfung gefunden.
>
> | | was zu sehen war | was dahinter steckte |
> |---|---|---|
> | **E224** | „📕 Elek…" | der Sucher lag über dem Seitentitel, 55 px |
> | **E225** | test67 rot | die Prüfung mass die Überschrift statt den Inhalt |
> | **E226** | test40 rot | `offsetParent` ist keine Sichtbarkeit — dreimal |
> | **E227** | Karte „1’450" | die Kartenansicht las nie ein Zellformat |
> | **E228** | „Whit…" „Scan…" | 7 von 8 Kacheln hatten 45 px für den Text |
> | **E229** | „00:00" | Ganztagstermine verschwanden westlich von Greenwich |
> | **E230** | blasse Zeilen | 11 Texte unter AA, 7 davon trugen Bedeutung |
> | **E231** | „1 Einträge" | die Mehrzahl-Regel stand 146 Zeilen tiefer |
>
> **Der rote Faden, dreimal derselbe:** bei E228, E229 und E231 stand die
> richtige Regel bereits im Projekt — vierzehn Zeilen tiefer, in der
> Kalenderansicht, hundertsechsundvierzig Zeilen tiefer. Eine Entscheidung,
> die an vier Stellen einzeln getroffen werden muss, wird irgendwann an einer
> vergessen. Deshalb steht sie jetzt jeweils an EINER.
>
> **Und dreimal habe ich mich geirrt** und es berichtigt: `634.216667` ist die
> richtige Kürzung und kein abgeschnittener Wert; der doppelte Aufgabeneintrag
> war ein Fehler im Bild-Beispiel, nicht in der App; die beiden Namen des
> Simulationsknopfes sind Absicht und stehen so im Code begründet.
>
> **Neu:** test249 misst den Kontrast in acht Produktwelten × zwei Themen mit
> der WCAG-Formel und einer namentlich begründeten Ausnahmeliste.
>
> **Erledigt am 28. August:** „die zwei Reiterzeilen sind der grösste
> Einzelposten" — Redur hat den Kasten rot angestrichen, und E235 hat die
> Krumenzeile mit der Reiterzeile verschmolzen. 236 → 124 px. Der Block
> ganz oben erzählt es.

**27. August 2026 · die ruhige Fassung ist gebaut**

> ### Ruhig: 52 Rahmenknöpfe werden 15 (E218–E222)
>
> Redur wollte Redion ruhiger, mit weniger Bereichen, ohne dass etwas
> verschwindet. Zuerst gemessen statt geschätzt — alles Anklickbare in
> Seitenleiste, Kopfzeile und Menüband bei 1440 × 900:
>
> | | vorher | ruhig |
> |---|---|---|
> | Seitenleiste | 32 | 8 |
> | Kopfzeile | 13 | 7 |
> | Menüband (Startansicht) | 7 | 0 |
> | **zusammen** | **52** | **15** |
>
> Fünf Wege stehen links: Heute, Lernzentrum, Elektro, Bibliothek, Aufgaben.
> „Mehr" (Strg + M) holt alles zurück, an derselben Stelle, mit denselben
> Knöpfen — der Unterschied ist eine CSS-Regel, kein zweiter Katalog.
> Schalter: Einstellungen → Aussehen → Schrift und Layout.
>
> Dazu kam beim Bauen heraus:
>
> · **Elektro hatte keine eigene Zeile** — eines der 14 Module, das grösste,
>   erreichbar nur über den Workspace. Jetzt hat es eine (öffnet aber einen
>   Rechner, keine Seite — L65).
> · **Die Leiste sagte nicht, wo man ist.** Ein Klick auf „Bibliothek" liess
>   „Workspace" aufleuchten; zwei fest verdrahtete Zeilen kannten nur die
>   Welt. Bei fünf Wegen ist die Markierung der einzige Anhaltspunkt (E221).
> · **Zweimal derselbe Titel.** Lernwelt und Workspace trugen ihren Namen
>   noch einmal unter der Pfadnavigation — 60 und 169 px (E219, E222).
> · **Der Entwurf log an einer Stelle:** die Formatierleiste sollte in den
>   freien Rand rechts, im Bild waren dort 424 px. In der App sind es 150,
>   die Leiste ist 552 breit. Zurückgenommen, Messung im Code festgehalten
>   (E220).
>
> Prüfung: test248 mit 41 Punkten, jeder mit eigener Gegenprobe. Der
> Wächter „nichts ist weg" brauchte drei Anläufe — die ersten beiden waren
> grün, während ein Eintrag dauerhaft versteckt war.

> ### Vorher: 25. August 2026 · 202 Prüfläufe · LUECKEN.md abgearbeitet

> ### Die Lückenliste, zu Ende gegangen (E170–E182)
>
> Jede der 54 Lücken hat jetzt einen Ausgang: gebaut, gemessen, oder mit
> Begründung bewusst nicht gebaut. Keine steht mehr da, ohne zu sagen, was
> mit ihr ist.
>
> **Drei echte Fehler fand dabei nicht das Lesen, sondern das Messen:**
>
> ```txt
> E171  Zwei Blöcke am selben Bild — den einen löschen nahm dem anderen
>       das Bild. Datenverlust, still.
> E174  Der Markdown-Rundlauf gab jedem Block eine neue Kennung; jeder
>       Verweis darauf zeigte danach ins Leere.
> E180  Eine Datenbankansicht zeigte 50 von 2000 Zeilen und sagte es nicht.
> ```
>
> **Vier Lücken waren gar keine — sie waren nie nachgesehen worden:**
>
> ```txt
> L21   verlangte drei Dinge, die es seit E122 gibt (test199, 33 Punkte)
> L22   vermutete Langsamkeit; gemessen sind es 68 ms für die Volltextsuche
>       über 8000 Blöcke (test233)
> L26   „Asana fehlt" — es kam herein, nur als lauter Textspalten (E182)
> L50   „zwei Wahrheiten"; gemessen sagen beide dasselbe (E169)
> ```
>
> **Und vier sind entschieden statt offen**, mit dem Grund dabei: L29 (keine
> eingebettete OCR-Engine — sie wiegt bei jedem Start), L30 (kein
> Erweiterungssystem — fremder Code im selben Fenster wie die Notizen),
> L32 (kein OAuth-Geheimnis im Browser), L50 (kein gemeinsamer Aggregatkern
> für ein Ergebnis, das der Mensch nicht sieht).
>
> Eine bekannte Lücke ist besser als ein stiller Fehler — und eine Lücke,
> die nur auf dem Papier steht, ist auch eine Art Falschaussage.

> ### Stand vom 25. August — Zweig `codex-study-suite`
>
> Alle 60 Abschnitte des grossen Auftrags sind gebaut. 56 tragen einen
> Prüflauf, der rot wird, wenn sie kaputtgehen; vier stehen halb, und bei
> jedem steht dabei, warum. Kein `✗` und kein `?` mehr in
> `doku/AUFTRAG-STAND.md`.
>
> **Was an diesem Tag entstand**
>
> ```txt
> E145  §23 stand als fehlend da und war vollständig gebaut — falsche Lücke
> E146  „Geteilt öffnen" setzte den Zustand, zeichnete das Feld aber nicht neu
> E147  Dateinamen und Quellenangaben suchbar; EINE Funktion für beide Suchen
> E148  Vier Sachen, die nur das Hinsehen fand — darunter 120 von 390 Pixeln,
>       die am Telefon eine Kennung-vor-Klasse-Regel gefressen hat
> E149  Lernpfad und Arbeitssicht festgehalten; XP bewegt kein Wissen
> E150  Der OCR-Dienst liegt jetzt bei — dienste/ocr.mts, doku/OCR-DIENST.md
> E151  Am Telefon stand „Tagesrunde starten" 188 px unter der Falz
> E152  Die unverteilte Aufgabe aus einer Besprechung war für niemanden da
> E153  Wer sich einen Namen gab, verlor SEINE GANZE Aufgabenliste
> E154  Der Obsidian-Rundlauf, einmal ganz durchgelaufen
> E155  Der Weg zurück zur Quelle: ↩ PDF · Seite 14
> ```
>
> **Geschlossen:** L53 (Dienst fehlte), L55 (Suche fand keine Dateinamen),
> L56 (benanntes Konto leerte die Liste). **Neu:** L57 (die Aufgabe findet
> ihr Meeting, aber nicht die Minute).
>
> **Was offen ist**
>
> ```txt
> 1. L57 — braucht eine Änderung an der KI-Anweisung und ein Modell zum
>    Messen. Raten wäre schlechter als weglassen.
>
> 2. §13 Uni und §35 Gemeinsam bleiben halb, aber nicht aus Versäumnis:
>    Semester aus Titeln zu erkennen ist so gewollt, und ohne Server ist
>    Teilen nun einmal ein Export.
>
> 3. §47 Visuelle Qualität hört nicht auf. Der nächste Fund kommt, sobald
>    wieder jemand hinsieht statt zu lesen (§55) — genau so kamen E148 und
>    E151 zustande.
> ```
>
> **Die teuerste Lehre des Tages** steht nicht im Produkt: in sechs von neun
> neuen Prüfläufen war der erste Fehler MEINER, nicht der der App. Ein
> `textContent`, das kein Tippen ist. Ein `|| -1` auf einem Zähler, der bei 0
> anfängt. Ein `clientWidth`, das die Innenabstände mitzählt. Ein `\b2\b`,
> das die 2 aus „SM-2" nahm — und damit einen Punkt aus dem falschen Grund
> GRÜN machte. Der fällt niemandem auf; deshalb steht jede Gegenprobe
> einzeln zurückgenommen in den Einträgen.

**24. August 2026 · 174 Prüfläufe**

> ### Stand vom 24. August, abends — Zweig `codex-study-suite`
>
> **Der grösste Einzelbefund des Tages:** rund 40 000 Zeilen Codex-Arbeit
> waren im Browser nicht vorhanden. Ein Typfehler in `arbeitswelt.ts:337`
> brach `npm run typecheck` ab, dadurch lief `bauen:ts` nie durch, und fünf
> `quell/*.js` fehlten. `index.html` lud sie trotzdem — fünf 404er bei jedem
> Start, ohne Meldung, ohne rote Konsole. Lernwelt, Arbeitswelt,
> Lebensbereiche, Produktwelten und die Einrichtung der Hauptwelten waren
> geschrieben und tot (E132).
>
> Danach war zu sehen, was Codex gebaut hat, und es ist viel: Heute-Dashboard,
> Lernzentrale, Lernpfad, Fehlerzentrum, Prüfungszentrale, Schule, Uni,
> Arbeit, Workspace-Übersicht, Bibliothek, Dokumentmodus, Elektro-Rechner.
> Am Rechner wie am Telefon, ohne waagerechten Überlauf.
>
> **Was an diesem Tag entstand**
>
> ```txt
> E132  Bauschranke gelöst; test101 (der Prüfserver hielt nicht an),
>       test202 (Onboarding blockierte den Lauf), test87 (Kaskade sprang
>       von Stufe 3 auf 2 zurück)
> E133  test206 — die erste Prüfung, die die Produktwelten wirklich öffnet
> E134  Papiervorlagen: blanko, liniert, kariert, Punktraster, Millimeter
> E135  Die Lernwelt rechnete falsch — zwei Ursachen, sieben falsche Zahlen
> ```
>
> **Was offen ist**
>
> ```txt
> 1. L49-L53 sind neu: Fassaden in der Lernwelt · zwei Rechenwege für
>    dieselben Aggregate · die Hauptwelten stehen in keinem Register ·
>    zwei Willkommensdialoge an zwei Starts · „Erkennen" braucht einen
>    Dienst, den Redion nicht mitliefert.
>
> 2. Der grosse Auftrag ist NICHT abgearbeitet. Umgesetzt sind §3 (die
>    zwei Prüfläufe), §21 (Papiervorlagen), §56 (Prüfungen für die
>    Produktwege) und die Voraussetzung für alles andere: dass die Module
>    überhaupt laufen. Offen bleiben unter anderem Uni mit Semestern,
>    Projekte und Meetings in der Arbeitswelt, Whiteboard als eigener
>    Bereich und eine Prüfungssimulation mit Gedächtnis.
>
> 3. Drei Verweise auf Entscheidungen stimmen nicht: electrical.ts:6,
>    calculations.ts:10 und daten.ts:851 nennen E128, und E128 ist „Neue
>    Audioaufnahmen sind Anhänge". Nicht angefasst — welche Entscheidung
>    gemeint war, lässt sich nicht raten.
> ```


> ### ✅ STUDY SUITE · PHASE 1 INK V2 ABGESCHLOSSEN
>
> Die gemeinsame Zeichenschicht von A4-Blatt und PDF-Seite kann jetzt
> transparenten Marker, Linie, Pfeil, Rechteck, Ellipse und sichere
> Textanmerkungen. Auswahlrechteck, Mehrfachauswahl, gemeinsames Verschieben
> und Löschen sowie Aktions-Undo/Redo sind angeschlossen.
>
> `src/core/ink/geometry.ts` ist der neutrale, DOM-freie Geometriekern. Es
> gibt keine zweite Ink-Datenbank und keinen PDF-zu-Whiteboard-Import; die
> additiven Markendaten laufen durch vorhandene Sicherung und Sync.
>
> `test201` (Suite 167, 32 Punkte) hält Markertransparenz, Formen, Text,
> Druckwerte, Coalesced Events, Reduktion, Auswahl/Bewegung/Undo/Redo,
> 390×844, 1366×768, 1440×900, Druck, Backup/Restore und Sync fest.

> ### ✅ STUDY SUITE · PHASEN 2–9 IM CODE ABGESCHLOSSEN
>
> Dokumentmodus · PDF/Notiz → Lernen · Lernen V2 · Audio V2 · Alias/Vault ·
> Scanner/OCR · Ausbildung · Schulbibliothek sind auf den vorhandenen Seiten,
> Blöcken, Anhängen, dem Graphen und SM-2 aufgebaut. Es gibt keinen zweiten
> Store, Graph, PDF-Viewer oder Lernkartenbestand.
>
> Der bewusst gebündelte Abschlusslauf folgt nach Erzeugen der Browserdateien;
> Zwischenläufe wurden auf Wunsch nicht ausgeführt. Der Umsetzungsnachtrag
> steht in `doku/REDION-STUDY-SUITE-AUDIT.md`.

> ### Historischer Übergabestand vor Ink V2 — 22. August, nachmittags
>
> Die Arbeit an E123/E124 ist inhaltlich fertig und committet. Was noch
> aussteht, steht unten unter **„Offen beim Anhalten"**. Wer hier weitermacht,
> liest zuerst diese drei Absätze und braucht sonst nichts.
>
> **Was zuletzt gemacht wurde**
>
> `Store.purgeBlock` löschte die Anhänge in einer abgelösten Aufgabe, auf die
> niemand warten konnte. Wer eine Seite löschte und gleich darauf eine
> Sicherung zurückholte, bekam die Seite zurück und den Anhang nicht — das
> alte Löschen kam an, nachdem das Zurückholen den Anhang schon neu
> geschrieben hatte. Betroffen war NICHT nur das verschlüsselte Paket,
> sondern auch die gewöhnliche `.redion`-Sicherung.
>
> Behoben mit `Store.settled()`: abgelöste Arbeit wird vermerkt, `importAll`
> wartet vorn und hinten darauf. Gemessen bei 1972 Blöcken im Bestand —
> dreimal von drei Läufen der Anhang weg ohne die Behebung, dreimal von drei
> Läufen 900 Bytes zurück mit ihr. Ganze Geschichte: `ENTSCHEIDUNGEN.md` E123.
>
> Nebenbefund beim Messen: das Suchfenster fand eingelesenen PDF-Text nicht
> mehr, während `Store.search` ihn fand — zwei Suchen, zwei Antworten
> (E124). Beide Wege lesen jetzt `text` UND `suchtext`.

### Offen beim Anhalten

```txt
1. DER VOLLE PRÜFLAUF IST NICHT DURCHGELAUFEN.          ← das Wichtigste
   `npm run pruefen` wurde nach 9 von 166 Läufen angehalten (alle 9 grün).
   Einzeln geprüft und grün sind ausserdem: test85, test95, test133,
   test152, test181, test199, test200.
   Zu tun: `node pruefungen/alle.mts > /tmp/voll70.log 2>&1` und das
   Ergebnis ansehen. Dauer etwa 50-60 Minuten.

2. Der Zweig ist noch nicht geschoben.
   Alles liegt auf `zusammenfuehrung`; `claude/redion-head2-desktop-move-j47chf`
   muss daraufgesetzt und geschoben werden.

3. L43 steht offen und ist Absicht.
   Ein Anhang ohne `blockId` bleibt beim endgültigen Löschen für immer
   liegen. Heute belanglos — alle sechs echten Aufrufer von
   `Dateien.ablegen` übergeben `blockId`. Die naheliegende Behebung würde
   MEHR löschen als heute, und das gehört in eine eigene Entscheidung mit
   eigenen Prüfungen, nicht nebenbei in eine Fehlerbehebung (§46).

4. Kleinigkeit: das Bild in Hell wurde nicht erzeugt.
   `data-theme="light"` von aussen auf `documentElement` gesetzt hat die
   App wieder überschrieben. Die geänderte CSS nutzt nur bestehende
   Farbmarken (`--bg-input`, `--line`, `--text`), sollte also mitgehen —
   nachgesehen wurde es aber nicht.
```

### Was dabei entstanden ist

```txt
src/kern/ablage/indexdb.ts      abloesen() + settled(), importAll wartet
src/kern/sicherheit/krypto.ts   Karte „Vollständiges Paket" im Dialog
src/bereiche/ki/kontext.ts      Suchindex liest suchtext
src/schale/aufbau/schale.ts     der Weg ohne Index tut dasselbe
quell/schale/stil/bausteine.css Dateifeld und Knopf auf einer Zeile
pruefungen/lauf/test200.mts     NEU, 29 Punkte, Gegenprobe 10 rot
pruefungen/lauf/test199.mts     §3 vom Wächter zum echten Rundlauf
test85/95/133/152/181           Erwartungen auf den Stand nach dem
                                Zusammenführen gebracht
```


Redion kann heute: lokal starten · offline arbeiten · Seiten und Blöcke
speichern · Datenbanken · Formeln (158 Funktionen, davon 61 unter deutschem
Excel-Namen) · Tabellenblock (E29) mit bedingter Formatierung (E53) ·
lokale KI mit Grenzen für Agenten (E52) · Versionen · Papierkorb ·
`.json`- und `.redion`-Sicherung mit Anhängen, auch über 4 GB (E39) ·
grosse Dateien stückweise · `.ods` lesen und schreiben · als App
installierbar, mit Erinnerungen, die auch ankommen (E40/E41).

**Der React-Umbau (E78) ist widerrufen** — Redur hat ihn am 9. August
nach Ansicht des Rohbaus entfernt (E80). Geblieben sind die Reparaturen
der echten App: E71–E77, E79, test148/152/155.

**Die drei wichtigsten offenen Punkte**

```txt
1. ~~Die TypeScript-Migration selbst~~ · **erledigt** am 6. August —
   0 handgeschriebene JS-Dateien, siehe doku/BUENDEL-11-BIS-24.md
2. ~~Der Spreadsheet-Block — die Funktionen sind da, die Tabelle fehlt~~
   · **erledigt**, siehe Phase 7a und `ENTSCHEIDUNGEN.md` E29
3. ~~Cloudflare, Konto und Sync sind nicht produktionsreif~~
   · **Phase 9 erledigt** am 6. August: G1 Konto (E34) · G2 Anhänge in R2
     (E33) · G3 Konflikte und Offline (test118) · G4 Rechte (E35)
```

**Seit dem 7. August ist das Telefon die Hauptumgebung** (E37). Aus Redurs
Entwurf „Nocturne" sind gebaut: E42–E53 — der Reiter „Mehr" · der Kompass ·
eine eigene Farbwelt mit nachgerechneten Kontrasten · Bewegungsmarken und
Berührungsrückmeldung · das Blatt „Neu erstellen" · das KI-Fenster von
unten · Ladeskelette · versetzte Listenzeilen · Suchfilter als Marken · die
gleitende Reiterpille · eine 56-px-Leiste, deren Höhe an einer Stelle steht.

**Was jetzt obenauf liegt:**

```txt
L10  Mobile — die Bereiche sind durch: Willkommensbildschirm (E55),
     Einstellungen (E58), Sicherungskarte (E57), Menü-Blätter
     (test155), Formatleiste (E81), Ziehen (E83), Mehrfachauswahl
     (E84), Tabellenblock als Karten (E89, Vorschlag — Redur
     entscheidet am Bild). Offen bleibt allein die Prüfung auf einem
     echten Gerät
L12  Barrierefreiheit — gemessen und behoben (E51); es fehlt der
     Durchlauf mit einem echten Vorleseprogramm
L16  ✅ komplett (9. August): sonst-Zweig (E85), Schleifenschutz
     gegen Automations-Kreisel (E86), Schleife über eigene Zeilen
     (gab es längst — erst jetzt gefahrlos)
L18  XLSX/ODS-Rest: Zellformatierung, Kommentare, ODS-Mehrblatt —
     Mehrblatt-XLSX kam mit E91 (Export trug vorher nur das aktive
     Blatt: stille §13-Lücke)
L20  ✅ komplett (9. August): Ausfüllen (E87), Markdown-Tabellen
     (E88), Alt+Umschalt+Klick (test158 §7)
L35  ✅ geschlossen (15. August, E121): Stück-Lesefehler brechen
     Sicherung, Sync und Löschen ab, ohne Dateisatz oder Bytes anzutasten
L37  ✅ komplett (19. August): Seitenanker (E105) · Seitenbilder
     zurückholen (E106) · Textsuche im PDF (E107) · Drucken mit
     Strichen (E108) · geschützte Dateien (E110).
     Die „Neurasterung" war kein Merkmal, sondern ein Rechenfehler:
     1654 px über A4 sind 200 dpi, nicht 140.
     Offen bleibt allein OCR für eingescannte Seiten ohne Textebene —
     und das ist L29, nicht L37.
```

**Redurs vier Wünsche für die Schulaufgaben** (11.–19. August) sind
abgearbeitet:

```txt
leeres A4-Blatt zum Draufschreiben          E100  ✅
daneben stellen (Spalten)                   E102  ✅
Schriftgrösse, Farbe, Schriftart            E101  ✅  (Farbe gab es schon)
PDF durchblättern und darauf schreiben      E103  ✅
… und ein leeres Blatt gleich daneben       E104  ✅
```

Mit E103 kommt die **erste fremde Laufzeitbibliothek** ins Verzeichnis:
pdf.js, Apache-2.0, als Umwandler beim Einlesen — nicht im Anzeigeweg.
Was das kostet und warum es umkehrbar bleibt, steht in E103.

**Erledigt seit dem 6. August:** L11 Agenten-Grenzen (E52) · L33 Web Push
(E54) · L14 ZIP64 (E39) · L4 Fehlerwerte (E36) · L20 Markdown (E59) ·
L15 bedingte Formatierung vollständig (E60) · L35 Stück-Lesefehler (E121) ·
der grösste Teil von L10 und L12.

**Der Fund vom 8. August**, weil er die Art Fehler zeigt, auf die zu achten
ist: `# Titel` wurde eine Überschrift namens `#Titel` — das Kürzelzeichen
blieb im Text stehen. Seit es die Kürzel gibt. Sichtbar auf jedem
Bildschirm, und trotzdem grün, weil jeder Prüflauf nur den **Blocktyp**
verglich. Siehe E59.

---

## Phase 1 · Ordnung und Dokumentation · **erledigt**

Die fünf Steuerdateien sagen jetzt dasselbe.

Vorher widersprachen sie sich: `CLAUDE.md` §3 verlangte deutsche Dateinamen,
§52 gab die Zielstruktur englisch vor, die README ebenfalls. Wer neuen Code
schrieb, konnte beide Seiten belegen — und schrieb deshalb zuerst deutsch.

**Erledigt**

- `ENTSCHEIDUNGEN.md`: **E27 · Code-Sprache** neu · E24 von 196 auf 132
  Zeilen konsolidiert (vier Nachträge, von denen einer einen früheren
  widerrief, sind zu geltenden Regeln geworden)
- `AUFGABEN.md`: diese Datei, zehn Phasen mit ehrlichem Stand
- `LUECKEN.md`: nach Priorität statt nach Nummer
- `CLAUDE.md`: **Abschnitt 53 · Code-Sprache und TypeScript** neu · §3
  präzisiert · 39 Zeilen unredigierter Chat-Text entfernt
- `README.md`: Code-Stil um die Sprachregel ergänzt
- `doku/TYPESCRIPT-MIGRATION.md`, `doku/ARCHITEKTUR.md`,
  `pruefungen/LIESMICH.md`: auf die englischen Pfade nachgezogen

**Dabei gefunden: erfundene Feldnamen an zwei Stellen.** `CLAUDE.md` §52.8
und `README.md` zeigten `createdAt`, `updatedAt`, `properties`, `children`
und `deleted` als Felder eines Blocks. Vier davon gibt es nicht, und
`deleted` hätte die Bedeutung von `alive` genau umgekehrt. Beide Beispiele
waren nie gegen `quell/kern/ablage/indexdb.js:255` geprüft — dieselbe
Fehlerklasse wie die elf falschen Excel-Zuordnungen. Jetzt steht dort die
gemessene Form, mit `src/core/types/` als Wahrheit und dem Rest als Beispiel.

**Fertig wenn** — alles erfüllt: TypeScript-Ziel klar · Code-Sprache klar ·
`.redion` klar · Excel-Ziel klar · Cloudflare als optional klar.

---

## Phase 2 · TypeScript-Grundlage · **erledigt**

```txt
typescript@5.9.3        devDependency
tsconfig.json           strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes
npm run typecheck       tsc --noEmit
npm run bauen:ts        tsc -p tsconfig.bauen.json
src/core/types/         sieben Dateien
doku/TYPESCRIPT-MIGRATION.md
GitHub Actions          Typecheck im schnellen Auftrag
```

**`noEmit` ist die Kernentscheidung.** Es entsteht kein JavaScript und damit
kein Bauschritt, den jemand vergessen kann — die App startet weiterhin per
Doppelklick. Für ausführbaren Code gibt es `tsconfig.bauen.json`, das nach
`quell/` ausgibt; das Erzeugnis wird mitversioniert.

Gegengeprüft: ein absichtlich falscher Typ macht den Lauf rot (`TS2740`). Ein
Typecheck, der grün ist, weil er keine Datei findet, sagt nichts.

---

## Phase 3 · Backup und `.redion` dokumentieren · **erledigt**

`doku/REDION-FORMAT.md` — Aufbau des Archivs · `daten.json` ·
`dateien.json` · Dateinamen- und Kennungsregeln · die zwei Einspielarten und
warum es keine Vorgabe gibt · die Grenzen · wie man ein `.redion` ohne
Redion öffnet.

`pruefungen/LIESMICH.md` beschreibt die fünf Läufe, die man nicht abschwächen
darf, und **wodurch** man sie versehentlich entschärfen würde.

**Dabei gefunden und behoben** — drei Fehler, die alle still waren:

```txt
ein ZIP mit 70 000 Einträgen nannte 4 464 und sah gesund aus
ein fremdes ZIP64-Archiv importierte als „0 Anhänge", ohne Fehler
die verschlüsselte Wiederherstellung meldete Erfolg und warf die Daten weg
```

Gehalten von `test103` (14) und `test104` (20).

**Offen: ZIP64.** Die heutige Regel ist eine ehrliche Fehlermeldung statt
eines kaputten Archivs. Siehe `LUECKEN.md`.

---

## Phase 4 · Excel-Recherche und Tabellenkern planen · **erledigt**

`doku/EXCEL-IN-REDION-RECHERCHE.md`.

**Das Ergebnis drehte die Reihenfolge um.** Angenommen waren rund sechzig zu
bauende Funktionen. Gemessen:

```txt
158  Funktionen im Register, davon 0 ohne Implementierung
 37  des Excel-Startpakets liefen bereits — keine unter deutschem Namen
```

Es fehlten also nicht Funktionen, sondern **Namen**. Heute laufen 61 von 63
unter deutschem Namen; die zwei fehlenden fehlen mit Absicht
(`ENTSCHEIDUNGEN.md` E24, Regel 3).

VBA und Makros sind ausgeschlossen (E25), grosse Abhängigkeiten nur nach
Prüfung (E26).

---

## Phase 5 · Erste TypeScript-Typen · ◐ **grösstenteils erledigt**

Sieben Dateien unter `src/core/types/`, alle aus dem laufenden Code
**gemessen** und seit Phase 1 englisch benannt (E27):

```txt
id.ts        ID · ISODateTime · BlockId … FileId · Result<T> · Done
block.ts     RedionBlock · RedionRow · RedionPage · RedionVersion
database.ts  RedionDatabase · RedionView · Schema · Column · Filter · Sort
file.ts      RedionFile · FileChunk · UploadState
backup.ts    RedionPackageData · RedionPackageManifest · RedionPackage · ImportMode
storage.ts   STORES (alle neun) · StorageLocation · StorageInfo
index.ts     eine Tür für alles davon
```

**Typnamen englisch, Feldnamen nicht.** `RedionBlock` trägt weiter
`created`, `edited`, `erstelltVon`, `alive`, `parentTable` — so stehen sie in
IndexedDB. Ein Feldname, der nicht dem gespeicherten Feld entspricht, wäre
keine Übersetzung, sondern eine falsche Behauptung.

### ~~5a — `spreadsheet.ts`, `formula.ts` und `excel.ts`~~ · erledigt

Drei Dateien, zehn Typen mehr im Sammelpunkt `index.ts`.

**Erst gemessen, dann getippt** — und das Messen war die Arbeit. `formula.ts`
beschreibt, was `laufzeit.js` wirklich zurückgibt: sechs Werttypen, zwei
Ergebnisformen, und bei `ok: false` immer `wert: ''`. Beim Messen kamen
**drei Fehler** heraus, die niemand vermutet hatte — das Semikolon als
Trennzeichen gab es nicht, `2e6` ergab 2, und `check('')` widersprach
`run('')`. Alle drei behoben.

**Die Fehlerwert-Entscheidung steckt in den Typen, nicht in einem Satz.**
`FormulaValue` enthält **keinen** `FormulaErrorCode`, `CellValue` schon. Damit
kann der Spreadsheet-Block später `#DIV/0!` zeigen, ohne dass eine einzige
bestehende Datenbankspalte ihr Ergebnis ändert. Stünden die Fehlerwerte in
`FormulaValue`, müsste jeder Aufrufer damit rechnen — und genau das hat
niemand beschlossen.

**`spreadsheet.ts` ist die einzige Datei im Ordner, die eine Absicht
beschreibt statt eines Zustands.** Ihr Kopf sagt das ausdrücklich: solange
der Block nicht gebaut ist, darf sie ohne Messung geändert werden — danach
nicht mehr.

**Und ein Befund im Vorbeigehen:** `register/formeln.js` bringt 82
beschriebene Einträge mit, `laufzeit.js` meldet danach **180 weitere ohne
Satz** an. 262 Einträge, 180 davon stumm. `was` ist deshalb im Typ
freiwillig — nicht aus Bequemlichkeit, sondern weil es die Wirklichkeit ist.

**Neu: `test108`** hält die Typen gegen die laufende Maschine. `tsc` prüft
sie nur gegen sich selbst; ein Typ, der etwas Schöneres behauptet, ist dort
grün. Genau so sind die vier erfundenen Feldnamen entstanden.

---

## Phase 6 · Erste sichere Migrationen · **erledigt**

Nur kleine, DOM-freie Helfer. **Nicht zuerst:** `editor.js` ·
`steuerung.js` · `indexdb.js` · `bauen.mts` · `server/kern.ts`.

### ~~6a — Kennungen~~ · erledigt

`src/core/helpers/ids.ts` → `quell/core/helpers/ids.js`.

Erste Datei mit vollständig englischer Schnittstelle: aus `Kennungen.lang()`
wurde `Ids.long()`. Vertretbar, weil gemessen nur **fünfzehn Aufrufe in drei
Dateien** — nicht die verbotene Massenumbenennung, sondern der Fall „im
Rahmen einer geplanten Migration".

Verhalten nachweislich unverändert; `test85` prüft alle acht Funktionen,
`test105` hält `.ts` und erzeugtes `.js` zusammen.

### ~~6b — Datum, Objekte, Bytes~~ · erledigt

`date.ts` · `objects.ts` · `bytes.ts` → `quell/core/helpers/`.

**Gezählt, bevor umbenannt wurde** — das ist der Schritt, den E27 verlangt:

| Modul | in `quell/` | in Prüfläufen | Schnittstelle umbenannt? |
|---|--:|--:|---|
| `Datum` | 1 (`pruefen.js`) | 9 | ja → `Dates` |
| `Objekte` | 0 | 9 | ja → `Objects` |
| `Bytes` | 6 (3 Dateien) | 2 | Name blieb, Methoden englisch |

**Verhalten nachweislich unverändert.** Alte und neue Fassung wurden
nebeneinander geladen und über dieselben Eingaben geschickt: 1923 · 1488 · 72
Vergleiche, kein einziger Unterschied. Bei `date` waren die Eingaben die
teuren — beide Zeitumstellungstage, 31. Januar, Schaltjahr, Jahreswechsel,
kaputte `Date`-Objekte. Bei `bytes` Puffer bis 1 000 000 Bytes, also über die
Klippe bei 128 000 hinweg, an der die alte Spread-Fassung brach.

**Eine Regel kam dabei dazu:** eine migrierte Datei lässt **keinen Alias
unter dem alten Namen** zurück. `test85` prüft jetzt ausdrücklich, dass
`Datum` und `Objekte` als globale Namen weg sind. Ein zurückgelassener Alias
wäre bequem und würde genau deshalb dafür sorgen, dass niemand die
Aufrufstellen nachzieht — bis der Alias eines Tages verschwindet und es still
bricht.

### ~~6c — Bremse und Melder~~ · erledigt

`throttle.ts` · `reporter.ts` → `quell/core/helpers/`.

| Modul | in `quell/` | in Prüfläufen | Schnittstelle |
|---|--:|--:|---|
| `Bremse` | 0 | 5 | → `Throttle` |
| `Melder` | 17 (10 Dateien) | 6 | → `Reporter` |

**Verhalten gemessen:** 17 bzw. 22 Abläufe verglichen, kein Unterschied. Bei
den Bremsen mit einer **gefälschten Uhr** für beide Fassungen — sonst hinge
das Ergebnis am Rechner und nicht am Code.

**Zwei Dinge blieben absichtlich deutsch:** die Stufennamen `spur` `info`
`warnung` `fehler` (sie stehen so in der ausgegebenen Protokolldatei) und die
Feldnamen eines Eintrags (`stufe` `wo` `text` `daten` `wann`) — sie sind die
Form eines Datensatzes, den `all()` nach aussen gibt.

**`Tempo` ist ausgesetzt**, nicht vergessen: es greift vierzehnmal ins DOM
und fällt damit nicht unter „kleine, DOM-freie Helfer". Es gehört zu dem
Schritt, der die Bereiche in `dienst` und `ansicht` trennt.

### ~~6d — Säubern~~ · erledigt

`src/core/security/sanitize.ts` → `quell/core/security/sanitize.js`.
Zehn Aufrufe in drei Dateien, siebzehn in Prüfläufen. Aus `Saeubern` wurde
`Sanitize`.

**Nicht unter `helpers/`, sondern unter `security/`** — weil es kein Helfer
ist. Was hier schiefgeht, ist fremder Code im Ursprung der Seite, mit Zugriff
auf alle Notizen und den KI-Schlüssel.

**Das machte zwei Erweiterungen nötig, und die zweite war die wichtigere.**
`tsconfig.bauen.json` schloss nur `src/core/helpers/**` ein, und `test105`
sah auch nur dort nach. Ein neuer Ordner wäre also gebaut worden, ohne dass
irgendetwas ihn prüft — oder gar nicht gebaut worden, während sein veraltetes
`.js` weiterläuft. `test105` sieht jetzt alles unter `src/core/` ausser den
Typen **und meldet jeden Ordner, der im Bauplan fehlt**.

**Verhalten gemessen** — 362 Vergleiche zwischen alter und neuer Fassung,
beide in derselben Browserseite geladen, kein Unterschied. Die Sammlung von
dreissig Angriffen daraus steht jetzt dauerhaft in `test91` Abschnitt 6, samt
Gegenprobe: gewöhnliches HTML muss vollständig ankommen. Ein Säuberer, der
alles wegwirft, wäre sonst in allem grün.

---

## Phase 6 ist damit abgeschlossen.

---

## Phase 6e · Die Sprachregel · **erledigt**

`ENTSCHEIDUNGEN.md` **E28**: die zehn Sprachen dieses Projekts, und der eine
Satz, auf den es ankommt — **es entsteht kein neues JavaScript.**

**Warum das vorher nicht ging und jetzt geht.** Neuer Code für den Browser
musste als `.js` entstehen, weil die App ohne Bauschritt startet — und für
Node schien es keinen Grund zu geben, TypeScript zu nehmen. Nachgemessen:
**Node führt TypeScript seit 22.18 direkt aus.** Es entfernt die Typen und
startet. Damit gibt es zwei Wege, und beide kommen ohne Bauschritt aus:

| Wohin | Wie |
|---|---|
| Browser | `src/…/x.ts` → `npm run bauen:ts` → `quell/…/x.js` |
| Node | `x.mts`, direkt mit `node x.mts` |

**Durchgesetzt, nicht erklärt.** `pruefungen/js-bestand.json` führt jede von
Hand geschriebene `.js`; das Verzeichnis darf nur schrumpfen. Eine neue
`.js` macht `test109.mts` sofort rot — gegengeprobt, in beide Richtungen.

`test109.mts` ist zugleich die erste TypeScript-Datei unter `pruefungen/`
und damit der Beweis, dass der zweite Weg trägt.

**Drei Dinge, die dabei nötig waren:**

- Node-Untergrenze auf **22.18** — in `package.json` und in beiden CI-Jobs.
  Ein Lauf, der auf Node 20 an einem Syntaxfehler scheitert, zeigt in die
  falsche Richtung.
- `pruefungen/**/*.mts` in `tsconfig.json`. Node *entfernt* die Typen, es
  prüft sie nicht — ohne diesen Eintrag wären sie Zierde statt Zusage.
- `@types/node` als einzige neue Abhängigkeit. Reine Typinformation: läuft
  nie, landet nie im Browser, steht unter `devDependencies`.

**Stand beim Beschluss:** 218 Dateien JavaScript, 18 TypeScript.

```txt
quell (Produktcode)   89
pruefungen/lauf       79
pruefungen (sonst)    32
server                12
Wurzel                 4
functions              1
oeffentlich            1
```

**Was das für die nächsten Phasen heisst:** die Zahl 218 ist ab jetzt die
Fortschrittsanzeige. Jede migrierte Datei ist eine Zeile weniger in
`js-bestand.json`.

**Warum** — sie sind klein, DOM-frei und einzeln testbar. Jede migrierte
Datei nimmt einen Eintrag aus der `any`-Liste in `src/global.d.ts`.

**Fertig wenn** je Datei: englischer Name · Verhalten unverändert ·
`npm run bauen:ts` erzeugt das `.js` · `index.html` und `sw.js` nachgezogen ·
alle Läufe grün.

**Achtung** — `Saeubern` gehört zuletzt und ist der einzige der vier, an dem
Sicherheitsverhalten hängt. Aufrufer **zählen**; bei zu vielen bleibt der
öffentliche Name vorerst, und die XSS-Prüfungen laufen vor und nach dem
Umzug.

**Tests** — `npm run typecheck` · `npm run bauen:ts` · `test105` · `test87` ·
`node bauen.mts`

**Priorität** — hoch.

---

## Phase 7a · Der Tabellenkern ohne Oberfläche · **erledigt**

`src/core/spreadsheet/address.ts` und `engine.ts` → `quell/core/spreadsheet/`.
Geprüft von `test110.mts` — **68 Prüfungen in zwei Sekunden, ohne Browser.**

**Die Entscheidung, die alles andere trägt: es gibt keine zweite
Formelmaschine.** Eine Zellformel wird in die Sprache übersetzt, die
`laufzeit.js` seit jeher spricht:

```txt
=SUMME(A1:A3)   →   SUMME(prop("A1"), prop("A2"), prop("A3"))
=A1*2           →   prop("A1")*2
```

`prop()` ist der Zugriff auf eine Spalte einer Datenbankzeile; hier ist es
der Zugriff auf eine Zelle. Dieselbe Maschine, ein anderer Nachschlager. Die
Maschine zu erweitern hätte 158 Funktionen durch neuen Code laufen lassen —
die Sorte Änderung, deren Schaden man Wochen später sieht. Übersetzen kostet
dreissig Zeilen und kann nichts kaputtmachen, was es schon gibt.

**Was der Kern kann:** Adressen (`A1` ↔ Zeile/Spalte, auch `AA`, `ZZ`, `AAA`),
Bereiche in beide Richtungen (`C3:A1` = `A1:C3`), Zellen setzen und lesen,
deutsches Komma als Zahl, Abhängigkeitsgraph in beide Richtungen,
Neuberechnung in der richtigen Reihenfolge, **Zirkelbezüge mit Namen** —
nicht „irgendwo ist einer", sondern welche Zellen.

**Drei Fehler beim Bauen, alle drei vom Lauf gefunden:**

- Der Übersetzer lief dreimal über die Formel und traf im dritten Durchgang
  das `A1` **im Ergebnis des zweiten**: aus `prop("A1")` wurde
  `prop("prop("A1")")`. Jetzt ein einziger Ausdruck mit drei Zweigen — was
  ein Zweig zurückgibt, wird nicht noch einmal angesehen.
- Der Platzhalter für Zeichenketten sah selbst wie eine Zelladresse aus
  (`TXT0` — drei Buchstaben, eine Ziffer) und wurde mitersetzt. Mit dem
  einen Durchgang braucht es gar keinen Platzhalter mehr.
- **Zwei rohe Steuerzeichen** hatten sich in meine Quelle geschlichen. In der
  Einzeldatei hätten sie den ganzen Skriptblock mitgerissen — genau der
  Fehler, für den `test87` Abschnitt 1 existiert.

**Und eine ehrliche Lücke, benannt statt vorgetäuscht:** `#DIV/0!` und
`#ZAHL!` gibt es noch nicht. Die Laufzeit rechnet abwehrend (`1/0 → 0`), sie
*meldet* nichts, also kann der Kern nichts weiterreichen. Dafür bräuchte
`laufzeit.js` einen `FormulaErrorMode` — der Typ steht schon da, der Schritt
ist eigen. Ein halber Fehlerwert wäre schlimmer als keiner: er sähe aus wie
Excel und wäre es an der nächsten Zelle nicht mehr.

---

## Phase 7 · Spreadsheet-MVP

**Der Stand ist besser als erwartet:** alle elf Funktionen, die für den
ersten Wurf vorgesehen waren, rechnen bereits —
`SUMME` `MITTELWERT` `MIN` `MAX` `ANZAHL` `WENN` `UND` `ODER` `HEUTE`
`JETZT` `TEXT`. Es fehlt der **Block**, nicht die Rechenkraft.

### ~~7a — Der Spreadsheet-Block~~ · **erledigt**

**Ziel** — ein Block mit einem echten Zellraster.

**Fertig wenn** — ~~Block im Register~~ · ~~kleine Tabelle anzeigen~~ ·
~~Zellen bearbeiten~~ · ~~`A1`-Bezüge~~ · ~~Bereiche `A1:C10`~~ ·
~~automatische Neuberechnung~~ · ~~Zirkelbezüge erkennen und melden~~ ·
~~Fehlerwerte anzeigen~~

**Und darüber hinaus, weil ein Tabellenblock ohne sie keiner ist:** Zeilen und
Spalten einfügen und löschen mit nachgezogenen Bezügen · Ausfüllen über den
Anfasser · Sortieren · Spaltenbreiten · Ausgabe als `.xlsx` und CSV ·
Bedienung mit der Tastatur.

**Wo es steht** — `src/core/spreadsheet/{address,engine}.ts` (rechnet, kennt
keinen Bildschirm) · `src/bereiche/spreadsheet/ansicht.ts` (zeichnet, rechnet
nicht) · `quell/schale/stil/tabelle.css` · `DESIGN-TABELLE.md`.

**Was es hält** — `test110` (Kern ohne Browser, 111 Punkte) · `test111`
(Browser, 60 Punkte: Neustart, Speichern, Tastatur, hell und dunkel gemessen,
390 px gemessen).

**Was bewusst offen blieb** — mehrere Blätter je Block · Diagramme ·
`#DIV/0!` und `#ZAHL!` · Ziehauswahl am Telefon. Die Gründe stehen in
`ENTSCHEIDUNGEN.md` E29.

**Warum es ein eigener Block ist** — Excel und Redions Datenbanken sind zwei
verschiedene Werkzeuge: dort die Zelle, hier die Zeile als Seite. Ein
Spreadsheet-Block ist ein Block wie jeder andere und passt ohne Sonderfall in
Editor, Sicherung und `.redion`.

**Vorher zu entscheiden** — Fehlerwerte. Ohne sie kann der Block keine
anzeigen; mit ihnen ändert sich das Ergebnis bestehender Formelspalten.
Siehe `ENTSCHEIDUNGEN.md` E24, Regel 3.

**Priorität** — hoch, nach Phase 5a.

### ~~7b — Spreadsheet-Ansicht für Datenbanken~~ · **erledigt**

Als eigene Ansichtsart `raster` (🧮 „Raster") neben Tabelle, Board und den
übrigen. Dieselben Daten, die Bedienung eines Tabellenprogramms:

Pfeiltasten · Umschalt+Pfeil für Bereiche · Tab und Enter · Tippen fängt
sofort an · Entf leert einen ganzen Bereich · Strg+A · Spaltenbreiten zum
Ziehen · Summe und Anzahl in der Fusszeile.

**Und das Eigentliche:** Kopieren und Einfügen als Tabulatortext, also mit
Excel in **beide** Richtungen — und **Einfügen legt fehlende Zeilen an.** Wer
dreissig Zeilen einfügt und zehn hat, verlöre sonst zwanzig, und zwar
lautlos. Genau hier verliert Notion die Leute, die wirklich Daten haben.

**Zwei Vorsichtsmassnahmen:**

- Einfügen ist eine Massenänderung. Vorher wird nachgezählt gesagt, wie viele
  Zeilen dazukommen, wie viele gefüllte Zellen überschrieben werden und wie
  viele Werte wegfallen, weil die Spalte gerechnet wird.
- Gerechnete Spalten (Formel, Rollup, „erstellt am") sind gesperrt und dabei
  **sichtbar**. Ausblenden wäre schlechter: dann fehlte genau die Spalte,
  wegen der man hinsieht.

**Wo es steht** — `src/bereiche/datenbanken/raster.ts`.
**Was es hält** — `test112` (29 Punkte, darunter der Neustart und 390 px).

---

## Phase 8 · CSV/XLSX Import und Export · ◐ **grösstenteils erledigt**

**Reihenfolge**

- ~~CSV-Vorschau vor dem Übernehmen~~ — im Tabellenblock **und** in den
  Datenbanken. Beide sagen vorher nachgezählt, was passiert; der
  Datenbankimport nennt zusätzlich, wie viele Spalten **neu angelegt**
  werden, und legt sie erst nach der Antwort an.
- ~~XLSX-Export~~ — echte `.xlsx` aus dem Tabellenblock und aus jeder
  Datenbank.
- ~~XLSX-Import~~ — in den Tabellenblock, über `Einlesen.xlsxLesen`.
- ~~Typerkennung beim Import in eine Datenbank~~ — `core/import/spaltentyp.ts`
  erkennt Zahl, Datum, Ja/Nein und Auswahl aus den Werten selbst. Die Regel
  dabei: **lieber Text als falsch.** Eine Spalte wird nur dann eine
  Zahlenspalte, wenn JEDER gefüllte Wert eine Zahl ist — ein einziges
  „k. A." in vierhundert Zeilen macht sie zur Textspalte. Eine Zahlenspalte,
  die einen Wert verschluckt, ist schlimmer als eine Textspalte, die keinen
  verschluckt.
- **Offen:** XLSX direkt in eine Datenbank (heute geht XLSX in den
  Tabellenblock, CSV in beides) · Export mit mehreren Blättern aus einer
  Mappe · ODS.

**~~Fertig wenn~~ — ein Rundlauf mit echten Bytes: exportieren, löschen,
importieren, vergleichen.** Erledigt: `test111` baut eine echte `.xlsx`
— ZIP, CRC32, die vier Beipackzettel —, nimmt sie wieder auseinander und
vergleicht Zelle für Zelle, mit Semikolon im Feld, Anführungszeichen,
deutschem Komma, Umlaut und leerer Zeile.

**Der Fund dabei:** der bisherige CSV-Zerleger trennt bei Komma UND
Semikolon UND Tabulator gleichzeitig. Aus `Miete;1450,50;Januar` wurden fünf
Felder statt drei, und der Betrag war weg — es sah nicht nach einem Fehler
aus, sondern nach zwei Spalten mehr. `core/spreadsheet/csv.ts` erkennt das
Zeichen jetzt, ausserhalb von Anführungszeichen gezählt.

**Priorität** — der Rest: niedrig.

---

## Phase 9 · Cloudflare, Konto und Sync

**G4 — Rechte und Freigaben.** ✅ **erledigt** (6. August, E35):
Veröffentlichen nimmt keine Unterseite mehr mit, die Kommentarrolle darf
wirklich kommentieren, und eine Marke mit `lesen` darf lesen (beide
Abgleichswege sind POST — das Tor las daraus „schreibt"). Widerruf in
seinen drei Formen geprüft, und eine offene Seite macht keinen Anhang
öffentlich. `test121`, 24 Punkte. Offen bleibt: Rechte je Datenbankzeile
und zeitlich begrenzte Freigaben — beides eigene Entscheidungen, siehe L8.

**~~G1 — Konto-Modus.~~** ✅ **erledigt** (6. August, E34): Anmelden ist
nicht mehr Zustimmen — der Schalter `wolkeAbgleich` trennt „nur lokal"
von „lokal + Abgleich", die Oberfläche fragt ausdrücklich, `test120`
beweist am echten Server: ohne das Ja bleibt er leer. Abmelden warnt und
lässt die Notizen da; Konto löschen räumt die volle Server-Kaskade und
verlangt die abgetippte Mail; „Alles als .redion sichern" steht daneben.
**Offen bleibt** der Cloud-Arbeitsbereich als eigenes Konzept (mehrere
Bereiche in der Oberfläche wählen und anlegen) — siehe L7.
**Regel:** lokale Daten werden **nie** ohne ausdrückliche Zustimmung
hochgeladen (E1). Das Tor steht in `abgleichen()`.

**~~G2 — R2 für Dateien.~~** ✅ **erledigt** (6. August, E33): Server-Wege
in `server/dateien.ts`, Client-Abgleich in `maschine.ts` Abschnitt 6b —
Metadaten in D1, Bytes in R2, Rechte je Seite, verschlüsselt wie die
Sätze. Geprüft von `test119`, `test118` Abschnitt 3 und `test113`
Abschnitt 8 (der umgedrehte Stolperdraht). Vier benannte Reste stehen in
`LUECKEN.md` L6, allen voran: lokales Löschen wandert noch nicht zum
Server, und `.redion` in R2 fehlt.
**Regel:** grosse Dateien gehören nicht in D1 (E2).

**~~G3 — Sync-Konflikte.~~** ✅ **erledigt** — `test113` (Zusammenführung,
ohne Browser), `test78` (zwei Geräte gleichzeitig), `test118` (offline und
Wiederverbinden, gegen den echten Prüfserver).

Geprüft: ~~derselbe Block geändert~~ · ~~Konflikt wird sichtbar~~ ·
~~keine Daten verloren~~ (sieben Fälle, jeder gegen dieselbe Frage: *steht
am Ende die eine oder die andere Fassung da — oder ist ein Konflikt
gemeldet?*) · ~~die Ausgangsschlange~~.

**Der Fund dabei, und er ist der Grund für diese Reihenfolge:** `zuSchicken`
filtert mit `edited <= marke`, und die Marke wandert nach jeder Runde auf den
Zeitstempel des letzten gesendeten Satzes. Lägen zwei Sätze in **derselben
Millisekunde** und fiele der Schnitt der Runde zwischen sie, wäre der zweite
ab sofort ausgeschlossen — für immer. Er stünde auf dem Gerät und käme nie in
der Wolke an. Kein Fehler, keine Meldung.

Von Hand passiert das nie; beim Einfügen aus Excel, beim CSV-Import und bei
Vorlagen entstehen Sätze in Reihe. Eine Runde zerschneidet jetzt keine
Millisekunde mehr.

**Erledigt am 6. August:** `test118` läuft gegen den echten Prüfserver mit
zwei Chromium-Geräten. „Änderung offline": das Wiederverbinden stösst jetzt
**selbst** einen Abgleich an — vorher zeigte der `online`-Handler nur einen
Toast, und wer offline schrieb, wartete bis zu zwei Minuten auf den Takt.
„Anhänge bleiben verbunden": die dateiId überlebt den Abgleich auf beiden
Geräten, die Bytes bleiben auf dem Ursprungsgerät Byte für Byte unversehrt —
und gehen weiterhin ausdrücklich **nicht** mit (das ist G2; `test113` und
`test118` halten es fest, damit niemand seine Bilder für abgeglichen hält).

**Dabei gefunden:** `/sync/runter` rechnete Marke und `mehr` aus dem
Durchgelassenen statt aus dem Gelesenen — wer viele fremde Seiten vor sich
hatte, bekam `marke = seit`, `mehr = false`, und die eigenen Sätze dahinter
**nie**. Behoben; `test118` Abschnitt 4 wacht darüber, und die Gegenprobe
(beide Fixes kurz zurückgenommen) machte genau die vier erwarteten Punkte
rot.

**Damit ist G3 abgeschlossen.** Es bleiben G1 (Konto-Modus) und G2 (R2 für
Dateien).

---

## Phase 10 · Mobile und iPhone · ◐ **begonnen**

Fokus: iPhone 13 Pro Max (428 px), Safari.

**Gemessen statt geschätzt** — bei 428 px, mit `bilder.mts` und einer
Messung im Browser. Was dabei herauskam:

| | Befund |
|---|---|
| ✓ | Die letzte Zeile jeder Seite ist erreichbar — `#scroll` hat 86 px Platz, die Leiste ist 57 px hoch. Das hatte ich zuerst für kaputt gehalten und **am falschen Element gemessen**. |
| ✓ | Die Knöpfe der unteren Leiste sind 83 × 48 px. |
| ✓ | Die Tabelle und das Raster rollen waagerecht, statt zu quetschen; `env(safe-area-inset-bottom)` ist in Gebrauch; die ganze App rollt **nicht** seitlich. |
| ✗→✓ | Die Zeilen im aufgeklappten Menü waren 33 px hoch. Jetzt 48 — das ist die Liste, mit der man durch die ganze App navigiert. |
| ✗→✓ | Die Symbolknöpfe der Kopfleiste waren 28 px hoch. Jetzt 44. |

**Und ein Fehler, den ich dabei selbst gemacht habe:** Der erste Versuch gab
den Kopfleisten-Knöpfen auch `min-width: 44px`. Acht Knöpfe zu 44 px sind
352 von 390 Pixeln — der **Seitentitel war weg**. Die Skill sagt beides
(„56 px hoch, mit kurzem Seitentitel" und „keine sieben Buttons im Header"),
und eine Kopfleiste ohne Titel ist schlimmer als eine mit schmaleren
Knöpfen: man weiss dann nicht mehr, wo man ist. In einer waagerechten Leiste
ist die Höhe die wichtigere Hälfte.

**Noch offen** — nichts mehr aus dieser Liste; was Mobile grundsätzlich
fehlt, steht in `LUECKEN.md` L10.

**Dateiimport und Offline-Hinweise, nachgesehen am 6. August (390 px):**
Beides gab es schon — aber der Offline-Streifen lag AUF der unteren Leiste,
sein ✕ war 17 × 20 px, das Import-Blatt bot „Ganzen Ordner einlesen" an
(können Telefon-Browser nicht) samt Zieh-Hinweis (zieht auf einem
Touchscreen niemand), und die Rundgang-Einladung verdeckte das offene
Blatt. Alles behoben; `test114` Abschnitte 6 und 7 gehen seither wirklich
offline und öffnen den Import wirklich.

**Am 6. August nachgemessen (390 px):** Kopfleiste 56 px, die
Symbolknöpfe der Seitenleiste 44 × 44, die Seitenzeilen 48 px — alle drei
früheren Punkte sind erledigt. Die Blocksteuerung ersetzt am Telefon das
lange Drücken (`pwa.ts`). Die Messung mit echten Touch-Ereignissen fand
dabei einen Fehler, den kein Direktaufruf je gezeigt hätte: der Klick, den
der Browser dem Loslassen hinterherschickt, traf den Menü-Grund und schloss
das eben geöffnete Menü sofort wieder. Behoben; seither drückt `test114`
Abschnitt 5 wirklich lange und wacht darüber.

**Der Umbau zur Telefon-Schale, 6. August (E37, E38).** Redion ist ab jetzt
zuerst eine Telefon-Seite. Was dabei gebaut wurde:

| | |
|---|---|
| ✓ | **Oben fünf Wege** statt einer Kopfleiste: R · Start · Seiten · Termine · Eingang. Die Kreise sind 52 px, die Leiste hat `env(safe-area-inset-top)`. |
| ✓ | **„Seiten" statt „Chats"** (E38) — der Platz gehört dem, was man täglich tut. Die KI bleibt unten als „KI fragen" und im R-Blatt als „KI und Verlauf". |
| ✓ | **Das R-Blatt** — der Kreis links oben zog vorher die Seitenleiste des Rechners auf 390 px zusammen. Jetzt ein Blatt über den ganzen Bildschirm, zwölf Zeilen zu 56 px. |
| ✓ | **Unten die feste Leiste**: Suche · KI fragen · Neue Seite, Knöpfe 56 px, 28 px Rand. |
| ✓ | **Der Start-Bereich** öffnet am Telefon ohne Adresszusatz — vorher stand da die zuletzt offene Seite. |
| ✓ | **Der Fehlerbalken** sagt nicht mehr „bitte melde mir diesen Text", wenn es keinen gibt (E36); derselbe Fehler ergibt einen Balken statt zehn, und alle landen im Protokoll. |
| ✓ | **Erinnerungen** schlagen die Ortszeit vor, nicht die Weltzeit; ein Kalendereintrag bringt seine Zeit mit; Mitternacht wird 08:00; eine verpasste sagt „Verpasst um HH:MM". |
| ✓ | **Die obere Leiste passte nicht.** Gemessen bei 390 px brauchte sie 421 px mit „Eingang" — die letzte Pille stand ausserhalb des Bildes. Unter 420 px rücken Rand, Abstand und Polster zusammen; die Tasten bleiben 52 px. |
| ✓ | **Der Codeblock zeigte etwas anderes, als dastand.** ⧉ № ↩ und die Sprachwahl lagen quer über der ersten Zeile. Jetzt eine eigene Kopfzeile darüber, Knöpfe 44 px. |
| ✓ | **Ein Rand für die ganze App.** `#page` stand am Telefon auf 18 px, während der Start-Bildschirm daneben mit 28 gebaut war. Jetzt beide 28 (22 unter 380 px). |

**Noch offen am Telefon:** Termine und Eingang haben ihren eigenen Aufbau
noch nicht bekommen, die übrigen Menüs sind noch keine Bottom Sheets, und
der Editor braucht seinen Feinschliff. Steht in `LUECKEN.md` L10.

**Priorität** — hoch (E37: das Telefon ist der Normalfall).

---

## Phase 11 · Nocturne, Zugang und Grenzen · ◐ **grösstenteils erledigt**

Redurs Entwurf für die Telefon-App, dazu zwei Lücken, die beim Bauen
obenauf lagen. Die Entscheidungen stehen einzeln in `ENTSCHEIDUNGEN.md`
E42–E53; hier nur, was daraus wurde.

**Aus dem Entwurf gebaut** (E42–E50, E55): der Reiter „Mehr" und der Bereich
dahinter · der Kompass als Seite darin · eine eigene Farbwelt mit
nachgerechneten Kontrasten statt Notions Palette · drei Bewegungsdauern und
drei Kurven, keine Federn · Berührungsrückmeldung · das Blatt „Neu
erstellen" hinter dem Stift · das KI-Fenster als Blatt von unten ·
Ladeskelette statt Kreisel · versetzt einblendende Listenzeilen · die
Suchfilter als Marken · die gleitende Reiterpille · eine 56-px-Leiste
oben, deren Höhe nur noch an einer Stelle steht · und der
Willkommensbildschirm, der als Erstes sagt, wohin die Daten gehören.

**Zwei Lücken dazu:**

`L12` **Barrierefreiheit** (E51). Sie stand seit Monaten auf „Grundlagen
da, nicht geprüft". Gemessen waren zwei der fünf Punkte in Ordnung und
drei nicht. Der grösste Fund: an 106 Stellen baut Redion Überlagerungen,
und keine davon war für ein Vorleseprogramm ein Dialog, keine nahm den
Fokus auf, aus zweien lief Tab hinaus, und keine gab den Fokus zurück.
Repariert an EINER Stelle. Dazu: null Überschriften auf einer Seite mit
Titel und Überschrift, ein Fenstertitel, der immer „Redion" hiess, und
Meldungen, die kein Vorleseprogramm hörte.

`L11` **Grenzen für Agenten** (E52). Der einzige Eintrag mit „es gibt
keine Grenzen". Notausschalter, Tageslimit und Bestätigung vor jeder
ändernden Handlung — und die Regel, die in der Liste fehlte und die
wichtigste ist: **ohne Aufsicht nur lesen**.

`L15` **Bedingte Formatierung** (E53) im Tabellenblock: zehn Arten,
Farbverlauf und Balken. Offen bleiben Symbolregeln und „überfällig".

**Aus dem Entwurf ist damit alles gebaut** — zuletzt die Zustandswechsel
der Sicherungskarte (E57) und die Einstellungen als zwei Seiten statt zwei
Spalten (E58). Bei 390 px war das die schlechteste Seite der App: für den
Inhalt blieben 129 Pixel.

**Tests** — `test114` (119) · `test126` (22) · `test127` (20) ·
`test128` (46) · `test129` (26) · `test130` (48) · `test131` (44).
Dazu `test114` selbst: aus 85 Punkten sind 137 geworden.

**Priorität** — hoch, solange das Telefon der Normalfall ist.

---

## Phase 12 · Web Push · **erledigt** (8. August, E54)

**Ziel war** — `LUECKEN.md` L33 schliessen: ist Redion um acht Uhr
geschlossen, soll um acht Uhr trotzdem etwas passieren. Steht.

**Der Stand.** Die Hälfte im Browser steht seit dem 7. August (E40): das
Dienst-Skript zeigt Meldungen über `registration.showNotification()` und
nimmt den Tipp darauf entgegen. Was fehlt, ist das Wecken von aussen — und
das geht nur mit Web Push: Schlüsselpaar (VAPID), Anmeldung je Gerät, ein
Dienst, der zur richtigen Zeit sendet.

**Die Entscheidung, die vor dem Bauen fällt: der Stoss ist LEER.**

Ein Web Push kann Inhalt mitbringen. Er müsste dann verschlüsselt werden
(aes128gcm) — aber das ist nicht der Grund, ihn wegzulassen. Der Grund ist:
**der Text einer Erinnerung geht Redions Server nichts an.** „Zahnarzt
14:00" ist genau die Sorte Satz, die local-first schützen soll.

Also trägt der Stoss nichts. Er sagt nur „wach auf". Das Dienst-Skript liest
daraufhin die fälligen Erinnerungen aus der lokalen IndexedDB und zeigt sie.
Der Server erfährt einen **Zeitpunkt** und sonst nichts — kein Titel, kein
Ort, keine Seite.

```txt
Gerät   →  „weck mich am 2026-08-09 um 06:00 UTC"   (nur die Zeit)
Server  →  zur Zeit: ein leerer Stoss an dieses Gerät
Gerät   →  liest lokal nach, was fällig ist, und zeigt es
```

Das ist zugleich die einfachste Bauform: kein Payload heisst keine
Verschlüsselung, nur die VAPID-Signatur (ES256, kann Web Crypto in Workers).

**Was zu bauen ist**

```txt
server/schema.sql     Tabelle `weckrufe`: geraet, endpunkt, p256dh, auth,
                      wann, konto — und ein Index auf `wann`
server/cloudflare.ts  POST /push/anmelden   Anmeldung eines Geräts
                      POST /push/wecken     Zeitpunkt eintragen/ändern
                      DELETE /push/abmelden
                      scheduled()           jede Minute: was fällig ist,
                                            stossen und den Eintrag löschen
server/sicherheit/    VAPID: Schlüssel aus den Secrets, JWT signieren
src/dienst/sw.ts      `push`-Ereignis → fällige Erinnerungen lokal lesen
                      und zeigen
src/bereiche/wissen/  Anmeldung anbieten, wenn Erinnerungen erlaubt sind
```

**Fertig, und geprüft** — ein Gerät meldet sich an · ein Zeitpunkt kommt in
die Tabelle · der geplante Lauf stösst ihn · das Dienst-Skript liest lokal
nach und zeigt, was fällig ist · ein abgelaufener Endpunkt (410) wird
gelöscht statt endlos wiederholt · und **kein Erinnerungstext verlässt das
Gerät**.

**Drei Fehler beim Bauen, alle drei vom Lauf gefunden:** die Argumente von
`feldText` standen vertauscht, womit jedes Gerät „geraet" hiess und zwei
verschiedene Telefone einander fanden · `geraet` hat die Feld-Vorgabe
„Unbekannt", eine fehlende Kennung wäre damit ein gültiges Gerät gewesen ·
und das Prüf-Token brauchte `sit_` davor, sonst kam 401 und es sah nach
einem kaputten Weg aus.

**Tests** — `test131` (Suite 95), 44 Punkte, gegen den echten Kern mit
einem `fetch`, das jeden Stoss mitschreibt statt ihn zu senden. Die
VAPID-Unterschrift wird mit dem öffentlichen Schlüssel nachgerechnet.

**Achtung, zwei Dinge**

Auf dem iPhone zeigt nur die **installierte** App Systemmeldungen (ab iOS
16.4). Das steht schon im Dialog; die Anmeldung darf dort nicht so tun, als
ginge es auch in Safari.

Und ohne Server bleibt alles, wie es ist. Web Push ist eine Zugabe des
Cloud-Modus, keine Voraussetzung (CLAUDE.md §22): wer nur lokal arbeitet,
bekommt seine Erinnerung weiterhin beim nächsten Öffnen, mit „Verpasst um
HH:MM".

**Priorität** — mittel. Der Nutzen ist gross, aber die Zahl der Menschen,
die Redion installiert und einen Server betreibt, ist heute klein.

---

## Wo der grosse Auftrag steht

Der Stand aller 60 Abschnitte steht in **`doku/AUFTRAG-STAND.md`** — mit
Belegen, nicht mit Absichten. Drei Zeichen: ✅ gebaut und geprüft, ◐ gebaut
und teilweise, ✗ offen, ? gebaut und nie laufen gesehen.

Diese fünf standen hier als „die nächsten Arbeiten", und alle fünf sind
inzwischen erledigt:

```txt
§37/§38 Elektro ansehen           test211 läuft
§22 Whiteboard fertig machen      L54, E144
§23 Vorschlagsmodus               E145 — war schon gebaut
§39 OCR entscheiden               L53, E150 — Dienst liegt bei
§28 Suche verbreitern             L55, E147
```

**Was jetzt oben liegt.** Hier standen zuerst drei Punkte, und zwei davon
waren beim Nachsehen längst erledigt — ZIP64 seit E39, die Migration seit
dem 6. August mit einer leeren `js-bestand.json`. Es bleibt einer:

1. **Cloudflare wirklich aufsetzen** (L5–L8, Phase 9). Server, Konto und
   Sync sind geschrieben und geprüft, aber nie gegen echtes D1/R2 gelaufen.
   Solange das so ist, ist „optionaler Server" eine Absicht, keine Aussage.
   Das braucht Zugangsdaten und ein Konto — es ist der einzige verbliebene
   Punkt, den kein Prüflauf im Container erledigen kann.

Alles andere in LUECKEN.md ist entweder gebaut oder mit Begründung bewusst
nicht gebaut. Das heisst nicht, dass Redion fertig ist — es heisst, dass die
Liste ehrlich ist.

---

## Die Visionskarte · 28. August 2026

> Redur: „Ich wollte so etwas machen, das mich Jahre begleitet — dass ich
> kein Word, Excel, PowerPoint mehr brauche. Es sollte meine Schule alles
> begleiten: Noten, Lernen, Lernziele. Und PDF bearbeiten, Fachzeichnen,
> Elektrotechnik-Simulator — und Notion, GoodNotes, Graphy, Obsidian,
> alles dort haben. Und natürlich mehr."

Dieser Satz ist der Massstab. Neun Leser haben ihn am 28. August gegen den
Bestand gemessen — streng: nur was in `src/`, `quell/` oder
`pruefungen/lauf/` belegbar ist, zählt als „kann"; jede Zeile unten hat im
Messprotokoll einen Dateipfad oder einen grün gelaufenen Prüflauf hinter
sich. Die Karte sagt für jede Säule zwei Dinge: **was Redur heute trägt**
und **was zuerst fehlt**.

**Word — trägt für die Schule.** Editor mit Formatierung, fünf Schriften
und Grössen je Block, Drucken/PDF (test182), A4-Blatt mit Papiervorlagen
und Dokumentmodus (test212), DOCX in beide Richtungen mit eigenem
ZIP-Schreiber (test49). Ehrlich: DOCX transportiert in beide Richtungen
nur Klartext-Struktur — `**fett**` steht in Word wörtlich da, Bilder
werden Platzhaltertext, und der Import hat als einziger Einlese-Weg
keinen Prüflauf (→ L72). Beim Drucken fehlen Seitenzahlen, Kopf- und
Fusszeile — für abzugebende Berichte der sichtbarste Unterschied.

**Excel — trägt für die Berufsschule.** Tabellenblock mit A1-Bezügen,
255 Formelfunktionen mit deutschen Namen, XLSX/ODS mehrblattfähig in
beide Richtungen mit echten Bytes geprüft (test110: 191 ok, test165/168/
171/198), Zellformate machen die Rundreise, CHF und Schweizer Zahlen,
bedingte Formatierung, Pivot, Zielwertsuche. Ehrlich: ein Diagramm oder
eine Pivot **aus einem Zellbereich** geht nicht (nur aus Datenbanken),
verbundene Zellen und Zellkommentare fehlen.

**PowerPoint — trägt den Vortrag, nicht die Abgabe.** Vollbild-Vortrag
aus jeder Seite (H1/H2/Trennlinie = neue Folie, Marp-Prinzip), mit A4-
Blättern, Tabellen und Formeln auf der Folie (test183, test35). Ehrlich:
`.pptx` kommt im ganzen Bestand nicht vor (→ L69), das Folienlayout kennt
keinen Export (Druck druckt die Seite, nicht die Folien), keine
Referentenansicht, keine Vortragsvorlage in der Galerie.

**Schule — trägt zur Hälfte.** Prüfungszentrale mit Countdown (test208),
Schulstruktur per Vorlage „Ausbildung" (test202), seit E241 Noten mit
gewichtetem Schnitt, Zeugnisnote und Zielrechner (test249 — der Leser sah
den Stand noch uncommitted; Prüflauf, E241 und Einzeldatei sind
inzwischen da). Ehrlich: hinter dem Knopf „Stundenplan" steht kein
Stundenplan (→ L70), die Zeugnisnote mittelt ohne Semesterfilter alle
Noten aller Zeiten (→ L71), Hausaufgaben mit Fach-Bezug und Lernziele je
Fach gibt es nicht — nur das tägliche Karten-Ziel.

**GoodNotes — trägt den Kernfall.** PDF einlesen, mit dem Stift
beschreiben (Druckstärke, Formen, Textanmerkung, Undo), Original bleibt
Byte für Byte, Papiervorlagen in Blattmassen, Striche lagestabil, PDF-
Text durchsuchbar, Ausschnitt als Karteikarte, beschriftet drucken — fünf
Prüfläufe grün (test174/177/181/207/242). Ehrlich: der Stift-Feinschliff
fehlt — kein Lasso (nur Rechteck-Auswahl), der Radierer löscht nur ganze
Striche, Handschrift-zu-Text braucht den localhost-Dienst, und PDF-Export
geht nur über den Druckdialog.

**Notion — trägt für einen Lernenden.** ~60 Blockarten, Slash-Menü,
13 gerenderte Datenbank-Ansichten (zwei mehr als Notion: Raster, Pivot),
35 Spaltentypen, Relationen/Rollups, 158 Formeln ohne eval (test106:
177 ok), Kommentare, Erwähnungen, Sync mit E2E-Verschlüsselung und
Konfliktzusammenführung (test113: 53 ok). Ehrlich: als Team-Werkzeug
nicht — kein Live-Tippen, @Person ist faktisch Text, Teilen braucht den
selbst aufgesetzten Server. Und im Datei-Sync wandert lokales Löschen
nicht zum Server (L6 — als Datenintegritätslücke die wichtigste Zeile
dieser Karte).

**Fachzeichnen + Elektro-Simulator — trägt nachweislich.** 106 Symbole
nach IEC/EN 60617 mit Schweizer Bestand, Schaltplan-Editor mit drei
Planarten, echte Knotenpotentialanalyse, die die Wheatstone-Brücke
besteht, 183 rechenbare Formeln, Formelbuch mit eigenen Skizzen aus
denselben Fachzeichen, erzeugte Übungen mit Schweizer Notenskala — vier
Prüfläufe, 318/318 (test238/239/241/244). Ehrlich: die Simulation ist
Gleichstrom, eingeschwungen, linear — Wechselstrom (X_L, X_C, cos φ)
lässt sich rechnen, aber nicht im Plan simulieren; Zeitrelais verzögern
nicht; die Prüfungssimulation hat keine Uhr; nur 16 von 183 Formeln
haben einen Schritt-für-Schritt-Weg in Worten.

**Obsidian — trägt die verlinkte Wissensbasis.** Wikilinks mit Alias,
Blockverweise, Rückverweise und unverlinkte Erwähnungen unter jeder
Seite, Graph mit Kräfte-Layout, #Tags mit Tagwolke, Vault-Export als ZIP
mit Frontmatter und verlustfreiem Wiedereinlesen (test219: 31/31).
Ehrlich: Obsidians „der Vault IST der Ordner" gibt es nicht — der
Ordner-Abgleich schreibt nur in eine Richtung, ohne Rücklesen; der Graph
zeigt nur den Teilgraphen um eine Seite; Rückverweise haben keinen
eigenen Prüflauf.

**Graphy/Diagramme — trägt den Schulalltag.** Diagramm-Ansicht mit
Gruppierung, Zeitstufen und Drilldown (test52: 27/27), Dashboard mit
KPI-Kacheln über fremde Datenbanken (test237: 61 ok), Pivot mit Prozent
und CSV, Whiteboard mit 12 Werkzeugen und PNG-Export (test209: 55/55).
Ehrlich: keine zweite Datenreihe (gestapelt/gruppiert), kein XY-/
Streudiagramm — für einen Elektro-Lernenden das naheliegendste: die
U-I-Kennlinie aus der Messreihe geht nicht. Und der Chart-Block kann
seine Datenbank-Quelle lesen, aber keine Oberfläche kann sie setzen.

### Was aus der Karte oben liegt

Nach §46 zuerst die Datenzeile, dann nach Gewicht und Aufwand:

1. ~~**L6 · Datei-Sync-Grabsteine**~~ — GESCHLOSSEN am 29. August (E249,
   test256 mit echtem Server und zwei Geräten). Beifund: das
   Block-Vorbild ist selbst undicht → L73.
2. **L71 · Zeugnisnote je Semester** — ab dem zweiten Semester zeigt die
   Kernzahl der Noten-Ansicht sonst einen falschen Wert. Das Datum je
   Note ist schon da, es fehlt nur der Filter.
3. **L70 · Echter Stundenplan** — Wochenraster mit Lektionen; Unterbau
   (Termine, Kalender, ICS-Wiederholungen) ist vorhanden.
4. **Kleine Pflichten (§30) — alle fünf erledigt am 28./29. August:**
   ~~Prüflauf für den DOCX-Import~~ (E245, test252 — L72 Teil 2, die
   Formatierung, bleibt offen), ~~Prüflauf für Rückverweise/unverlinkte
   Erwähnungen~~ (E246, test253), ~~Quellen-Wähler im Chart-Block~~
   (E247, test254), ~~Seitenzahlen/Kopfzeile beim Drucken~~ (E244,
   test251), ~~Prüfungs-Timer im Elektro-Arbeitsplatz~~ (E248, test255).
5. **Die grossen Sichtbaren:** .pptx-Export (L69), Lasso im Stift,
   Wechselstrom-Simulation, XY-Diagramm, Zwei-Wege-Ordner-Abgleich,
   ~~Hausaufgaben und Lernziele je Fach~~ (E256, test262 — 29. August).

Nichts davon ist eine Wette — jede Zeile stammt aus dem Messprotokoll
vom 28. August und hat dort ihren Beleg.

### Nachtrag: Redurs Zielbild-Poster, Punkt für Punkt

Am Abend des 28. August schickte Redur ein Poster: sein Zielbild als
Bildschirm-Entwurf, elf Abschnitte von „Übersicht & Vision" bis „Weitere
Funktionen". Sechs weitere Leser haben die Poster-Punkte gemessen, die
die neun Säulen oben nicht abdecken. Das Ergebnis in drei Körben:

**Steht schon, mit Prüflauf.** Reiter oben mit Neuer-Tab-Knopf und
Strg+Tab (test46), geteilte Ansicht neben- und übereinander (test206),
Inhaltsverzeichnis-Block (test44), Fassungsvergleich mit Wort-Diff
(test48), HTML-Export (test182), mehrere PDFs gleichzeitig in Reitern,
echtes SM-2 wie Anki (nachrechenbar dieselbe Formel), Lückentext-Karten
mit `{{...}}`, Lernstatistiken, Tagesjournal per Strg+Shift+J (Daily
Notes), Audio-Aufnahme mit Zeitmarken und Notiz-Verknüpfung (test202),
Datenvalidierung für Datenbank-Spalten (Pflicht, Regex, Zahlbereich,
Statusübergänge).

**Gebaut, aber versteckt — reine Sichtbarkeitsarbeit.** Benachrichtigungen
(Posteingang mit Gelesen-Status, aber keine Glocke oben), Sync-Status
(Maschine meldet alles, sichtbar nur im Wolke-Dialog), Konto/Profil
(vollständig, aber nur über die Befehlspalette erreichbar). Alle drei:
Aufwand klein, Logik liegt fertig da.

**Fehlt wirklich, nach Hebel geordnet.**
· *Klein:* Suchfeld in der Graph-Ansicht; Rendering-Gleichstand der
  Karteikarten (Lernwelt zeigt nur esc(), die klassische Ansicht kann
  Mathe); Folien-Übergänge; ~~Kopf-/Fusszeilen + Seitenzahlen im Druck~~
  (gebaut am selben Abend: E244, test251).
· *Mittel:* Zellvalidierung im Tabellenblock (Muster liegt in den
  DB-Prüfregeln fertig); Folien-PDF-Export; Multiple-Choice-Karten im
  SM-2-System (der Elektro-Generator zeigt die Bausteine); Bild und
  Audio auf der Karteikarte; Referentennotizen; Namensmanager;
  Notenverlaufs-Kurve als gelieferte Ansicht; Pomodoro/Lernzeit echt
  messen statt schätzen; Formen-Erkennung beim Zeichnen; Tab-Gruppen;
  2FA am Server.
· *Gross:* Fussnoten; Zitieren mit Literaturverzeichnis; Sparklines;
  Mindmaps; Lineal/Geodreieck; Masterfolien/Designs; englische
  Oberfläche (der Schalter existiert, steht bewusst aus).

Zwei Punkte aus dem Poster sind seit demselben Abend GEBAUT statt offen:
die Zeugnisnote je Semester (E242) und der echte Stundenplan (E243).

---

## Dauerhafte Regeln

**Nach jeder Codeänderung**

```
npm run pruefen -- --schnell
node bauen.mts
```

**Bei Backup, Import oder Export**

```
node pruefungen/lauf/test100.mjs
```

**Bei Architektur oder Sicherheit**

```
node pruefungen/lauf/test87.mjs
```

**Bei TypeScript**

```
npm run typecheck
npm run bauen:ts          wenn eine Datei unter src/core/helpers/ liegt
node pruefungen/lauf/test105.mjs
```

**Vor jedem Push** die volle Runde: `npm run pruefen`.

---

## Fünf Regeln, die aus Fehlern entstanden sind

1. **Nachsehen statt raten.** Kataloge werden geladen und befragt,
   Schnittstellen nachgeschlagen. Der teuerste wiederkehrende Fehler war,
   eine Schnittstelle aus dem Gedächtnis zu schreiben.
2. **Ein Zweitname wird gegen feste Werte geprüft**, nicht gegen die
   Gegenseite — sonst rechnen beide Seiten dasselbe Verkehrte.
3. **Die Nachbarstelle prüfen.** Der häufigste Befund war nie „etwas
   vergessen", sondern „an einer Stelle getan und an der Nachbarstelle
   nicht".
4. **Jede Reparatur gegenprüfen:** zurückdrehen, rot sehen, wieder
   einsetzen. Sonst weiss niemand, ob der Lauf die Sache wirklich hält.
5. **Feldnamen gespeicherter Daten sind keine Namensfrage**, sondern eine
   Migrationsfrage.

* E272 Phase A (Inventar): doku/PREMIUM-SHELL-MATRIX.md angelegt — jeder
  Bandeintrag, jedes Modul, jeder Schalenknopf mit seinem künftigen Ort.
  test272 neu, 40 Punkte auf Port 9050, vier Gegenproben im Lauf und fünf
  von Hand einzeln rot gesehen. Dabei gefunden und behoben: der Knopf
  „Zeitmesser" stand seit E268 nie im Band (`kann()` prüfte das Modul statt
  einer Methode), und sein Zeichen `clock` fehlte im Symbolregister.
  Gemessen statt geschätzt: 141 Bandeinträge, nicht 108. Neue Lücken
  L85–L88.
* E272 Phase B (Marken): Gold in beiden Modi, vier Werte statt drei — der
  Entwurfston #caa85e hat auf Weiss 2,26 und taugt dort nicht einmal als
  Rahmen, deshalb `--gold-tinte` #8a6a20 (4,70 auf der Karte). Sechs Masse
  der Schale und die Schalenfläche #1b1d20 modusfrei in grund.css.
  test272 §10, 16 Punkte, vier Gegenproben rot gesehen. sw v37.
* E272 Phase C (Reiterzeile): premium.css neu, 36 px dunkle Reiterzeile in
  beiden Themen, Reiter nur als Text, Gold für den gewählten. Die grosse
  Suchbox der Kopfzeile ist entfallen (vier Wege zur Suche bleiben), samt
  ihrer Verdrahtung und ihrem CSS. einfach.css hinter einem Präfix
  abgehängt — vier der fünf alten roten Punkte aus L88 wurden dadurch grün,
  der fünfte entpuppte sich als falsches Grün (test247 misst nur 1440 px).
  sw v38.
* E272 Phase D (Band): acht Reiter statt sechs, „Werkzeuge" aufgelöst,
  „Elektro" virtuell. Die 15er-Regel mit reitereigenem „•••" — Band jetzt
  eine Zeile von 72 px (nicht 58: deutsche Namen brauchen zwei Zeilen, und
  §23 verbietet kleinere Schrift). Farben zählen nicht als Befehle.
  test272 §11 misst vier Breiten × acht Reiter; zwei Gegenproben zeigten
  zuerst blinde Prüfungen (L89). sw v39.
* E272 Phase E (Gehen): der Reiter liest aus Register.module und
  Register.navigation statt aus einer eigenen Liste — 45 Einträge. Dazu
  App.schauplatz() und das Ereignis redion:schauplatz als Grundlage der
  Kontextkante. Beide Register führen jetzt ein Feld `zeichen` mit einem
  Strichzeichen; im Band standen sonst dreizehn Emoji nebeneinander (E202).
  Eine Phase-A-Behauptung berichtigt: die fünf unsichtbaren Wege auf Platz
  `unten` sind alle Doppelungen. sw v40.
* E272 Phase G (Datei-Backstage): „Datei" ist kein Reiter, sondern eine
  Fläche mit neun Fächern — `src/schale/aufbau/backstage.ts`, jede Zeile an
  einem Dienst, den es gibt, kein eigener Erstellcode. Sie ist eine
  `.overlay`, damit `fokus.ts` Rolle, Fokusfalle und `inert` auflegt; die
  `tablist` sitzt jetzt auf `.mb-tabs` statt auf der ganzen Zeile. Drei
  Funde nur durch Hinsehen (Namensraum `bs-` doppelt → L90, „Datei" sah aus
  wie ein Reiter, ISO-Datum), Esc schliesst jetzt die oberste Überlagerung.
  L84 aufgelöst: kein Kontrastfehler, ein Messfehler — test128 liest jetzt
  Verläufe und rechnet Alpha-Schichten. sw v41.
* E272 Phase F (Kontextkante): 54 px statt 240. NEU src/register/context.ts
  (Register.kontext, das 16.) und src/schale/aufbau/context-rail.ts. Acht
  Bereiche melden sich selbst an; die Schale nennt keinen beim Namen (§5).
  Elektro und Zeichnen lesen dieselbe Registerquelle wie ihre eigene
  Ansicht. #main ist am Rechner ein Raster, die Lade liegt darin statt mit
  gerechnetem `top`. Ein Baum, nicht zwei: #tree wird in die Lade
  geschoben und zurückgestellt. Strg+\ schaltet die Kante, Strg+M die
  Lade; der Fokusmodus versteckt jetzt auch Band und Kante. Fünf fehlende
  Zeichen ergänzt. Neun Wächter mitgezogen, zwei Gegenproben rot gesehen,
  eine dritte war blind geworden. L91/L92 neu. sw v42.
* E272 Phase I+J (Zuschnitt und Aufräumen): Dokumentmodus bekommt nur Farbe
  und Mass — dunklerer Rand ums Papier, Kopf von 48 auf 40, gewählte
  Vorschauseite in Gold; document-mode.ts/marken.ts/seite.ts unangetastet.
  einfach.css gelöscht (93 Regeln, alle 93 seit Phase C wirkungslos) samt
  ihrem @import in anatomie.css. Die tote Verdrahtung hl-seiten/hl-konto
  bleibt stehen und ist als unverdrahtet markiert — sie ist die einzige
  Stelle, an der die Absicht steht, und Löschen fragt man vorher.
  Viewport-Abnahme 1440/1366/1024/768/390: kein waagrechter Überlauf,
  Kante überall 54, am Telefon aus. sw v43, Einzeldatei 7387 KB.
* E273 (Nachlauf): „Agenten" und „Besprechungen" riefen nach Phase F den
  Modus einer unsichtbaren Seitenleiste — sie öffnen jetzt Agent.panel()
  und Meeting.panel(). NEU test272 §15: jeder der 43 Wege in „Gehen" muss
  eine messbare Wirkung haben; die erste Fassung kannte nur Überlagerungen
  und meldete vier Fehlalarme. Register.module bekommt nimmZurueck, damit
  Gegenproben aufräumen können. L93 neu (Chatverlauf ohne Zuhause).
* E273 Teil B (Blockzeichen, L92): 💡 „Callout" war im Band ein gelber
  Klecks, 🖼 „Bild" im Überlauf ein leeres Kästchen — die Schrift hat das
  Zeichen gar nicht. Blockarten bekommen ein freiwilliges `zeichen` neben
  `icon`; siebenundzwanzig nennen jetzt ein Strichzeichen, die
  typografischen (¶ H₁ ☑ • 1. ▸ ❝ — ▦ ☰ ∑ ⌨) bleiben. Elf Symbole neu,
  zusammen achtzig. test86 prüft, dass jedes `zeichen` ein Symbol nennt,
  das es gibt.
* E273 Teil C (der Ort, L94–L97): sechs Bildschirme in
  ansichten/dienst.ts zeichneten sich selbst in #page, ohne zeigeSonder —
  App.schauplatz() blieb auf dem VORIGEN stehen, und die Kante zeigte
  dessen Knöpfe („Start" mit Tagesplan und Fällig). Sie gehen jetzt durch
  bildschirm(); drei Titel neu in SCHAUPLATZ_NAMEN. Erst dadurch konnten
  Kanten für posteingang (4), kalender (6), notizhefte (4), workspace (2)
  und kompass/mehr (je 3) überhaupt gezeichnet werden. Vier Bereiche
  bekommen KEINE, mit Gründen: datenbank (L95), lernen, ki, papierkorb.
  Drei Vorschläge verworfen (§8/§47). `today` war fast strichgleich mit
  `sun` und hiess an der Kalenderkante „Tagesplan", im Band „helles
  Aussehen" — jetzt ein Kalenderblatt (L97). NEU test272 §16 mit
  Gegenprobe. sw v44.
* E273 Teil D (L93): der Chatverlauf war seit Phase F am Rechner nicht mehr
  zu sehen — er stand nur in `KI.seitenleiste`, und die ist dort
  `display:none`. Er sitzt jetzt im Kopf des KI-Fensters, weil die KI kein
  ORT ist (kiPanel lässt den Schauplatz in Ruhe) und ein Kantenknopf sich
  auf nichts melden könnte. Ein Zeichner für zwei Orte: `chatBaum(ziel)`
  aus `seitenleiste` herausgelöst. Drei Emoji weniger in der Zeile (E202).
  test34 +6 Punkte. sw v45.
* E274: die untere Leiste am Telefon markierte „Heute", während man im
  Posteingang stand — sie las den Reiter der Seitenleiste, und
  `reiterWechseln('inbox')` setzt den danach auf 'start' zurück. Sie liest
  jetzt `redion:schauplatz` (nicht `App.` — test87 §3). Drei Fälle: Ort mit
  Knopf → markiert; Ort ohne Knopf → nichts; `seite`/`leer` → wie bisher der
  Reiter. Möglich erst durch E273, vorher log der Schauplatz auf sechs
  Bildschirmen. Drei Punkte in test114 zogen den falschen Hebel
  (`reiterWechseln` statt Knopfdruck) und zeigen jetzt auf den echten.
  L98 neu. sw v46.
* E275 (L98): der Posteingang und die Kante öffneten bei einem Kommentar an
  einem verschachtelten Block den ELTERNBLOCK wie eine Seite. Beide rufen
  jetzt `App.zeigeBlock(block.id)` — echte Seite, und man landet beim
  Kommentar. `data-komm` war seit jeher tot und ist weg. Wichtiger als der
  Fix: der L98-Eintrag selbst war an zwei Stellen falsch (er sagte „öffnet
  nichts", und er sagte, die Rechnung gebe es nirgends — es gibt sie
  dreimal, plus `App.zeigeBlock` seit E105). Beides stand in LUECKEN, weil
  ich geschrieben statt nachgesehen habe. test56 +4 Punkte.

* E276 (L96, L99): `meldungenAlleGelesen()` als harmloser Zwilling zum
  Leeren — es ändert ein Feld, statt wegzuwerfen; als Kantenknopf „Alle
  gelesen" im Posteingang, sichtbar nur solange etwas ungelesen ist. Und
  test105 §3: der volle Lauf typprüfte NICHT — `tsc` lief nur über
  `tsconfig.bauen.json`, und `pruefungen/` steht dort nicht drin. Ein
  Typfehler in test56.mts ging deshalb durch alle 235 Läufe auf main. Jetzt
  läuft `tsc --noEmit` über das ganze Projekt, mit Gegenprobe und einmal
  rot vorgeführt. sw v47.
* E278 (E277 Teil 1 — L87, L68): `meldeLieferant()` prüft jetzt dieselben
  Einträge wie `melde()`, dazu `nimmZurueckLieferant()`. Die Gegenprobe in
  test272 §8 wurde davon rot, weil sie genau diesen ungeprüften Weg
  benutzte — sie prüft jetzt den Prüfer und dass der Weg zu bleibt. Und
  „•••" plus Stern standen auf jedem Bildschirm, obwohl beide ohne offene
  Seite lautlos nichts tun; sie verschwinden. Dabei eine CSS-Falle:
  `.top-btn{display:flex}` schlägt `[hidden]` — `k.hidden = true` bewirkte
  nichts. test272 §17 neu, test86 +8. sw v47.
* E279 (E277 Teil 2 — L76): Eine eingespielte Sicherung ersetzt Inhalte,
  nicht die Kontoidentität des Geräts. Vorher tauschte „ersetzen" `meta`
  vollständig — wer eine fremde Sicherung einspielte, war danach als jemand
  anderes angemeldet, und der nächste Takt schickte seine Notizen in ein
  fremdes Konto. Jetzt bleiben Anmeldung, Konto, Bereich, Salz, Probe und
  die `api:`-Schlüssel; die drei Sync-Marken gehen auf null, die `basis`
  wird geleert UND für die überlebenden Grabsteine neu gesät (sonst fiele
  E254/E255 durch die Hintertür); und dann FRAGT Redion, statt eine Richtung
  zu wählen — eigener Schlüssel `wolkeNeuAbgleich`, weil ein Umdeuten von
  `wolkeAbgleich` still „nur lokal" gewählt hätte. Dazu: Zugangsdaten
  fliegen aus der offenen Sicherung und stehen im Manifest unter `fehlt`;
  Ordnerzugriff und Freigabeliste reisen gar nicht mit, weil eine Sicherung
  keine Erlaubnis mitbringen kann. Vier statt drei Zustände am Sync-Punkt
  und auf der Kontoseite. test273 neu (34, jeder Abschnitt mit Gegenprobe),
  test261 §11 umgeschrieben (21). L100 offen: beim Dazulegen bleiben die
  Marken stehen. sw v49.
* E280 (E277 Teil 3 — L86): Drei Verdrahtungen, die an nichts hingen
  (`hl-seiten`, `hl-konto` in schale.ts, `weltwechsel` in produktwelten.ts),
  plus die CSS-Leiche `#handy-unten` — rund vierzig Zeilen für eine Leiste,
  die mit E236 wegfiel. Keine Handlung geht verloren; jeder Ersatzweg
  nachgemessen. Neu `test274`: der Wächter liest ZWEI Sammelstellen, weil
  `hl-seiten` nur über `an()` und `weltwechsel` nur über `element()` läuft.
  Er muss Kommentare streichen, sonst meldet er aufgeräumte Wege als tot —
  passiert beim Schreiben zweimal, einmal davon in meiner eigenen Prüfung.
  Nebenfund: `#hl-dok` hatte keine `order`-Regel und stand nur zufällig
  richtig. Und eine Berichtigung: die Suiten melden teils mit ❌, teils mit
  ✗ — `alle.mts` liest beide, ich hatte nur eins gegrept und Redur deshalb
  eine falsche Zuordnung gemeldet. Keine Code-Lücke, ein Lesefehler.
* E281 (E277 Teil 4 — L67): `zahlWort` lag in `arbeitswelt.ts`, also in einem
  BEREICH — nach §5 durfte kein anderer ihn holen, und genau deshalb machten
  elf Dateien es weiter von Hand. Jetzt `core/helpers/plural.ts`, englisch
  benannt wie `Dates` und `Ids`. Er kann drei Dinge mehr als die naive
  Fassung: -1 ist Einzahl, `NaN` wird zum Strich statt zu „NaN Einträge",
  und eine Null-Sonderform, die ohne Angabe nicht einspringt. test275 neu
  (21, ohne Browser). Der 104-Stellen-Umbau bleibt bewusst offen (E277/§45).
* E282 (E277 Teil 5 — L77 Punkt 1, L78 Punkte 3+6): Das Regal merkt sich
  jetzt Reiter und offenes Fach (`heft:reiter`, `heft:fach`), geschrieben
  beim Wechseln und nicht beim Zeichnen — sonst setzte jeder Tastendruck in
  einem offenen Heft eine Meta-Zeile. Zwei Wächter: ein unbekannter Reiter
  und ein gelöschtes oder nicht mehr fachartiges Fach fallen auf die Wurzel,
  statt eine leere Brotkrume zu zeigen (L78 Punkt 5 macht den zweiten Fall
  real). Der Suchtext wird bewusst NICHT gemerkt. Dazu die Brücke, die L77
  seit E264 versprach: unter dem Ergebnis führt eine Zeile in die grosse
  Suche und nimmt das Wort mit (`App.suche(vorgabe)`, Anschlag am Ende) —
  bei JEDER Suche, nicht nur bei null Treffern. Und die Liste hört bei 92ch
  auf statt volle Breite zu laufen. Zwei Funde nur durchs Hinsehen: das
  Suchzeichen in der Brücke blieb leer, weil `Register.symbole.fuelle()` am
  Ende von `render()` läuft und der Tipp-Weg `render` absichtlich meidet;
  und der Satz begann mittig, weil `.rb` seinen Inhalt zentriert. test276
  neu (22). Drag&Drop und tiefe Verschachtelung bleiben offen (Redurs
  eigener Satz in E277).
* E283 (E277 Teil 6 — L85, L91): Redurs dritter Punkt war eine AUSWAHL:
  Vollbild bauen, volle Breite zusammenziehen, Zoom und Senden streichen.
  Vollbild ist gebaut (`App.vollbild`/`vollbildAn`/`vollbildGeht`, Knopf im
  Reiter Ansicht neben „Fokus" — die beiden tun Gegenteiliges: Fokus räumt
  Redions Oberfläche weg, Vollbild den Browser). Drei Fallen darin: ein
  gemerkter Zustand ginge am ersten Escape kaputt (deshalb frisch gelesen +
  `fullscreenchange`-Horcher), `requestFullscreen` gibt es auf dem iPhone
  nicht (deshalb `zeigen()`, sonst §47), und der Aufruf kann auch dort
  abgelehnt werden, wo er möglich ist (deshalb ein Satz statt einer
  Konsolenmeldung). Volle Breite lag an DREI Stellen, nicht an den zwei, die
  L85 nannte — der Schalter im selben Menü war übersehen; jetzt EIN
  `App.volleBreite(p, an?)`, die Kopfleiste über `braucht()` gebunden, damit
  ein Vergessen laut wird. Zoom und Senden sind gestrichen und werden als
  ABWESENHEIT geprüft — ein gestrichener Punkt, der später als halber Knopf
  auftaucht, ist §47. Neues Zeichen `maximize` (vier Ecken, kein Rechteck —
  ein Rechteck hiesse „Fenster" wie `panelL`/`panelR`). Dazu L91 Punkt 1
  beantwortet: die Kante bleibt fest bei 54 px, der Ziehgriff wird nicht
  gebaut und auch nicht entfernt. test277 neu, mit drei Gegenproben.
  Nachlauf im selben Bogen: der volle Lauf über E279–E282 war 239/240 grün,
  und der eine rote (test265) war kein Zufall — er hielt fest, dass
  `Notebook.oeffnen()` zur Wurzel zurückspringt, was E282 gerade umgekehrt
  hatte. Der Fund dahinter ist echt: die Darstellungswahl (Gitter/Liste)
  WIRKT im offenen Fach, stand aber nur an der Wurzel — seit das Fach das
  Neuladen überlebt, war das eine Sackgasse. Sie steht jetzt auch im Fach,
  mit `.nh-form{margin-left:auto}`, sonst rutschte sie als einziges Kind der
  Zeile nach links. Und test265 verliess sich an FÜNF Stellen still auf die
  Wurzel; alle fünf sagen es jetzt über `anDieWurzel()`.
* E284 (Redurs Punkt 5, VORGEZOGEN): Der Import hält jetzt etwas aus. Ein
  `__proto__` in einer eingespielten Sicherung funktionierte — `Object.assign`
  schreibt über `[[Set]]`, also über den geerbten Setzer, und danach gab
  `getMeta` für jeden ungesetzten Schlüssel das zurück, was in der fremden
  Datei stand: `wolkeAbgleich`, `agent:notaus`, jeder `api:`-Schlüssel. Neu
  `core/import/sicherheit.ts` (prototyplose Verzeichnisse statt einer
  Filterliste, eigener Stapel statt Rekursion, Tiefengrenze mit Meldung) und
  `core/import/validierung.ts` (liest endlich die Fassung, die der Export seit
  jeher schreibt). Beides gibt einen BEFUND zurück, keinen stillen Eingriff.
  test278 neu (37) — das erste feindliche Einspielen überhaupt; die anderen
  vierzehn Import-Prüfläufe spielen alle eine Sicherung ein, die Redion selbst
  geschrieben hat. Dabei eine Prüfung, die grün war und trotzdem falsch: sie
  hielt ein leeres `versions`-Fach für einen Hinweis auf eine abgeschnittene
  Datei — `enthaelt` spricht aber über das Format, nicht über den Inhalt.
  Vorschau, Anhangs-Transaktion und die Sicherheitskopie vor dem Ersetzen
  bleiben offen (L101). Was die Bestandsaufnahme sonst fand, steht als L102 —
  darunter zwei Dinge, die schlimmer sind als eine Lücke: der Kalender wirft
  BYDAY wortlos weg und liefert falsche Termine, und die Rechteprüfung der
  Agenten fragt die gerade offene Seite statt der, auf die geschrieben wird.
  sw v50.
* E285 (Redurs Punkt 3): `core/knowledge/rank.ts` — PageRank auf Redions
  vorhandenem Graphen. Reine Funktion, speichert nichts, jederzeit neu
  ausrechenbar; 5000 Knoten unter einer Sekunde gemessen. Zwei Dinge, die die
  abgeschriebene Fassung falsch macht: drei von vier Kantenarten sind in
  Redion GAR NICHT gerichtet (`addEdge` sortiert sie nach Kennung), und
  Sackgassen verschlucken Gewicht — die nachgebaute falsche Rechnung kommt
  auf 0,15 statt 1. Beides prüft test279 mit Gegenprobe. Dabei ein eigener
  Irrtum, der als Kommentar stehenbleibt: mein erstes §4 wollte zeigen, dass
  drei starke Zeiger sechs schwache schlagen, und mass das Gegenteil — zu
  Recht, denn „Qualität schlägt Menge" gilt erst, wenn die Wenigen wirklich
  stark sind. Und die Falle beim Bauen: `tsconfig.bauen.json` führt eine
  Aufzählung der core-Ordner, kein `**`; ein neuer Ordner muss eingetragen
  werden. test279 neu (40). sw v51.
* E286 (Redurs Punkt 1): Die Auftragsmaschine. Fach `auftraege` (Fassung 7),
  `core/jobs/modell.ts` mit den REGELN (reine Funktionen, keine Uhr — die
  Zeit kommt als Zahl herein, deshalb prüft test280 §1 die ganze
  Zustandsmaschine ohne eine Sekunde zu warten) und `kern/auftraege/` mit der
  WIRKUNG. Der Auftrag wird VOR der Arbeit geschrieben; nach einem Neustart
  setzt er beim letzten FERTIGEN Schritt an. Genau das misst §4: die Seite
  wird mitten in der Arbeit neu geladen, und der Auftrag macht bei Schritt 2
  weiter statt von vorn. Redurs Bus-Regel gilt für den zweiten Teil (kein
  Bereich kennt einen anderen), nicht für den ersten: Redions Bus kann kein
  async, keinen Abbruch, keine Reihenfolge (L102 §4) — die Maschine meldet
  darüber und steuert nicht. Die Pacht gegen zwei Tabs ist keine Feldangabe,
  sondern EINE readwrite-Transaktion; §6 misst mit zwei echten Fenstern. Der
  Versuch zählt beim NEHMEN, nicht beim Scheitern — sonst liefe ein Auftrag,
  der zuverlässig abstürzt, ewig. Ein Entwurfsfehler, den die Prüfläufe
  sofort zeigten: `auftraege` immer unter `fehlt` zu nennen machte „nichts
  fehlt" unmöglich; genannt wird es jetzt nur bei wirklich offener Arbeit.
  test280 neu (52); test85/95/96/100 auf Fassung 7 nachgezogen. Noch kein
  Bereich angeschlossen und keine Anzeige — L103. sw v52.
* E287 (Redurs Punkt 2): Die KI sagt, was sie kostet, BEVOR sie ruft.
  `core/ai/kosten.ts` RECHNET (reine Funktionen — 33 der 48 Prüfpunkte
  brauchen keinen Browser), `bereiche/ki/buch.ts` WEISS (Grenzen aus `meta`,
  Buch in `meta`, Ja oder Nein). Vier Grenzen der Reihe nach — je Aufruf, je
  Lauf, je Tag, je Monat —, jede mit 0 abschaltbar, und der Satz nennt beide
  Zahlen statt nur „nein". Geschätzt wird mit 3,6 Zeichen je Token statt 4
  (deutsche Komposita) plus 35 % Aufschlag, und geprüft wird gegen
  `hoechstens`: eine Grenze, die man im Mittel einhält, hält man in der
  Hälfte der Fälle nicht ein. Ein unbekanntes Modell wird DURCHGELASSEN und
  nicht gesperrt — die Preisliste trägt ein Datum, und eine Sperre, die bei
  jedem neuen Modellnamen zuschlägt, ist §47 von der anderen Seite. Lokale
  Modelle werden gar nicht angefasst. `stapelSchaetzen` gibt es, weil
  `embeddingsBauen` in einer Schleife ruft: 2000 Seiten sehen einzeln
  harmlos aus und kosten zusammen 2 Mio Token. Die Prüfung sitzt an EINER
  Stelle, im Wolken-Zweig von `dienst.ts`. test281 neu (48); test72 auf
  Fassung 7 nachgezogen; test280 §2 auf die E286-Entscheidung nachgezogen
  und um die Gegenprobe erweitert (55). Das Buch führt Schätzungen, keine
  gezählten Token, und es gibt keine Oberfläche dafür — L104. sw v53.
* E288 (Redurs Punkt 4): Wissenslücken. `core/knowledge/gaps.ts` FINDET
  (reine Regeln, `jetzt` kommt als Zahl herein), `bereiche/wissen/luecken.ts`
  SAMMELT und ZEIGT. Sechs Arten: Geisterverweise, mehrdeutige Verweise,
  wichtig-aber-verstaubt, offene Fragen, Inseln, dünne Themen. Die zweite
  gibt es bei BABAT-RED nicht und ist die wertvollste — Redions Auflöser
  meldet Mehrdeutigkeit seit jeher, und niemand hat je danach gefragt.
  Zugleich bekommt E285 seine erste Aufgabe: der Wissensrang war gebaut und
  von niemandem benutzt. Gegen die Falle, in die diese Sorte Funktion immer
  läuft (eine Lückenliste findet IMMER etwas — dieselbe Falle wie E284 und
  E286, diese Woche zum dritten Mal): jeder Fund trägt eine Stärke, gezählt
  wird nur, was über der Schwelle liegt, und der Schnitt je Art nennt sich
  selbst. Was das HINSEHEN fand und keine Prüfung finden konnte (§55.1):
  Markdown-Sternchen mitten im Titel, dieselbe Frage zweimal untereinander,
  und — das Wichtigste — 26 der 33 gezählten Lücken waren Zeilen, die eine
  Frage zitieren und gleich beantworten. Aus 33 wurden 10. test282 neu (57).
  Kein Escape-Griff für die anderen Overlays, kein „erledigt", und die
  Ansicht rechnet bei jedem Öffnen neu — L105. sw v54.
* E289 (Redurs Punkt 6, aus RED-KURD): Die Zahl über das eigene Können
  bekommt ihre Grundlage. `core/learning/kompetenz.ts`: die untere Schranke
  des Wilson-Intervalls statt `richtig/gesamt` (drei von drei sind 44 %,
  nicht 100 %), die Haltbarkeit `0,9 ^ (Tage/Abstand)` aus dem vorhandenen
  SM-2-Stand, und unter fünf Belegen wird GAR NICHTS behauptet — stattdessen
  steht da, wie viele Antworten noch fehlen. Übernommen aus RED-KURD ist
  genau eine Idee: die Belegzahl gehört neben den Prozentwert. Nicht
  übernommen sind die vier Fertigkeiten — für Vokabeln richtig, für Redion
  falsch. Die vorhandene `progress`-Zahl bleibt; sie misst ABDECKUNG, sagt
  das jetzt im Titel, und bekommt die Kompetenz als Satz darunter.
  test283 neu (35). Nur Karteikarten als Quelle, keine Haltbarkeits-Anzeige
  — L106. sw v55.
* E290 (L102, Redurs Punkt 10): Wiederholungsregeln, die wirklich gelesen
  werden. `verbinden/kalender.ts` las vier Teile einer Regel und warf alles
  andere STILL weg: aus `FREQ=WEEKLY;BYDAY=MO,WE,FR` wurde ein Termin je
  Woche statt drei. EXDATE und RDATE griff der Einleser nicht einmal auf —
  eine abgesagte Stunde kam bei jedem Einlesen zurück.
  `core/calendar/wiederholung.ts` liest jetzt FREQ, INTERVAL, COUNT, UNTIL,
  BYDAY (auch `2TU`, `-1FR`), BYMONTHDAY (auch von hinten), BYMONTH,
  BYSETPOS, WKST, EXDATE, RDATE — und NENNT, was es nicht versteht, aber nur
  dann. Ein Denkfehler, den der Prüflauf fand: COUNT zählt, was die Regel
  ERZEUGT; EXDATE streicht danach. test284 neu (49); §1 misst den Weg, den
  der Import wirklich geht. Keine Zeitzonen, kein VTODO, der Hinweis
  erreicht die Oberfläche noch nicht — L106. sw v56.
* E296 (L82): Ein PDF öffnet wie in GoodNotes — Doppelklick auf das Deckblatt,
  Seiten untereinander, Schreibschicht darüber. sw v60.
* E297 (L69, erste Hälfte): `core/slides/folien.ts` — die Regel, wo eine Folie
  anfängt, stand im Vortragsmodus und wäre für jede zweite Ausgabe
  abgeschrieben worden. Sie steht jetzt einmal da, und `.pptx` fällt aus
  demselben ZIP-Schreiber wie DOCX und XLSX. test293 neu (26). sw v61.
* E298: `src/core/types/database.ts` behauptete vier Felder, die es nicht
  gibt (`zielCollection`, `rollupRelation`, `rollupZiel`, `rollupArt`), und
  liess acht echte weg; `storage.ts` nannte `belegt`/`zugeteilt` statt
  `benutzt`/`verfuegbar`. Genau der Fehler, den CLAUDE.md §52.8 beschreibt —
  ein Typ ist die Stelle, an der man nachsieht statt zu raten. test294 neu
  (10) misst jetzt jedes Feld gegen den Bestand.
* E300 (Redurs Bild aus GoodNotes): Reiterzeile für offene Dokumente, am
  Telefon wie am Laptop. Ein Dokument verdrängt kein anderes mehr, der
  aktive Reiter scrollt sich selbst ins Bild. test292 neu (45). sw v64.
  Dabei L108 gefunden: `bilder.mts` hat das Telefon bis dahin ohne Tastsinn
  nachgestellt — jedes Telefonbild zeigte Griffe, die es dort nicht gibt.
* E301 (L107): Randstreifen neben der Seite („neben das PDF direkt zeichnen
  wie in OneNote"). Am Telefon wird gescrollt statt gestapelt — gestapelt
  quetschte die Zeichenschicht waagerecht zusammen, und ein Strich bei x=300
  landete bei x=207. Auf dem Bild gefunden. test295 neu (24). sw v65.
* E302 (L105 Punkt 1): Die Lücke war schon zu — `schale.ts` hat seit E272
  Phase G einen gemeinsamen Escape-Griff. Schlimmer: mein erster Wächter und
  mein erstes Modul teilten denselben blinden Fleck (`offsetParent` ist bei
  `position:fixed` immer null, und `.overlay` ist fixed) — der Prüflauf sah
  null Fenster und war grün. Modul zurückgebaut, Wächter berichtigt.
* E303 (Redurs Punkt 8): FSRS-4.5 als reiner Kern, von Hand gerechnet statt
  als Abhängigkeit (§6). Additiv: SM-2 bleibt die Vorgabe, der Übergang
  einer Karte wird im Protokoll vermerkt. Ein Fehler, den nur eine
  REIHENFOLGE-Behauptung fand: die Schwierigkeitsformel aus FSRS-5 mit den
  Gewichten von 4.5 gemischt — Note 3 und 4 landeten beide auf 1.
  test297 neu (59). sw v66.
* E304: Neun CSS-Regeln benutzten `var(--rand)` und eine `var(--hover)` —
  beide gibt es nicht. Ein ungültiges `var()` macht die GANZE Erklärung
  ungültig, also stand dort `border-top-width: 0`. Auf dem Bild gefunden.
* E305 (Redurs Punkt 11): Nur-Quellen-Modus. Die KI antwortet dann
  ausschliesslich aus den eingestellten Quellen und schweigt, wenn nichts
  passt, statt zu raten. test299 neu (19).
* E306 (Redurs Punkt 12): Beziehungsarten in der Datenbank (1:1, 1:n, n:m).
  Die Gegenrichtung wird jetzt wirklich durchgesetzt — vorher konnte eine
  1:1-Beziehung auf einer Seite mehrfach hängen. test300 neu (17).
* E307 (Redurs Punkt 9): Woher eine Zeile kommt. `herkunft: 'ki' | 'quelle'`
  am Block, als Streifen UND in Worten (§38), und sie überlebt die
  Sicherung. Kein erfundener Verlässlichkeitswert daneben. test301 neu (17).
* E308 (Redurs Punkt 7): Der Zeitbudget-Planer. Der Tagesplan rechnete
  `Anzahl × 30 Minuten` und warnte ab acht Stunden — also nie.
  `core/planning/budget.ts` verteilt jetzt ein eingegebenes Budget nach
  Fristen, mit Tagesrate statt Alles-oder-nichts, und prüft getrennt, ob die
  nächsten Tage überhaupt reichen. Diese zweite Rechnung ist die einzige,
  die redet — und sie ist die notwendige und hinreichende EDF-Bedingung,
  nicht ein geratener Schwellwert. Die Dauer einer Karteikarte wird
  gemessen (`core/learning/lerntempo.ts`), nicht geschätzt. test302 neu (64,
  darunter zweihundert Fälle gegen einen zweiten Rechenweg). sw v69.
  Auf dem Bild gefunden: zwei Punkte hintereinander, eine umbrechende
  Kennzahl, ein am Telefon abgeschnittener Titel. Neu offen: L109 (die
  Meldung unten deckt am Telefon die Knöpfe eines Fensters zu), L110
  (`durationMs` wird gelesen und nirgends geschrieben).

**Damit sind Redurs zwölf Punkte alle abgearbeitet** — 1 (E286), 2 (E287),
3 (E285), 4 (E288), 5 (E284), 6 (E289), 7 (E308), 8 (E303), 9 (E307),
10 (E290), 11 (E305), 12 (E306).
* E309 (L108 geschlossen): Neun Griffe, die es am Telefon nicht gab. Von 327
  `:hover`-Regeln machen 39 etwas sichtbar; bei neun war der Grundzustand
  ganz weg und `:hover` der einzige Weg zurück — darunter „⤢ Öffnen" in der
  Datenbanktabelle, die Werkzeugleiste eines Bildes (ein Bild war am Telefon
  unveränderlich), das Anheften einer KI-Antwort und das Zahnrad eines
  Knopf-Blocks. Alle neun haben jetzt einen `@media(hover:none)`-Zweig.
  test303 neu (16); §6 misst in der echten Seite in zwei Browser-
  Zusammenhängen — am Telefon alle neun da, am Rechner alle neun weg.
  Zwei Fehler steckten im Wächter selbst: sein Regelleser zählte
  `@keyframes` als Ende eines Medienzweigs, und seine erste Messung lief
  gegen ein selbst gebautes HTML, in dem eine nachweislich passende Regel
  ohne erkennbaren Grund nicht wirkte.
* E310 (L109 geschlossen, am selben Tag): Die Meldung unten deckte am Telefon
  die Knöpfe eines offenen Fensters zu — gemessen auf 390 × 844: Fuss
  670–789, Meldung 730–773, beide Knöpfe weg. Am Rechner nicht (Fuss
  542–604, Meldung 835–878), also steht die Regel nur im Telefon-Zweig. Der
  Toast geht dort nach OBEN statt ein Stück höher: eine vierte Zahl im
  Stapel der schwebenden Meldungen hiesse, alle Kombinationen aus vier
  Dingen zu pflegen. test304 neu (12); §5 misst, dass die Meldung oben
  wirklich zu SEHEN ist — „deckt nichts mehr zu" wäre sonst auch dann wahr,
  wenn sie gar nicht mehr erschiene.
* E311 (L110 geschlossen, am selben Tag): Die Lernzeit wird gemessen statt
  geraten. `lernwelt.ts` las `durationMs`/`dauerMs`/`durationSeconds`/
  `dauerSekunden` — alle vier schreibt niemand, die Rechnung landete also
  immer im Ersatzzweig (eine Minute je Wiederholung) und sah dabei aus, als
  benutzte sie eine Messung. Jetzt derselbe Weg wie E308, über
  `core/learning/lerntempo.ts`: dreissig Antworten im gemessenen Abstand von
  zwanzig Sekunden sind ~10 Min. statt ~30, und der Untertitel sagt
  „gemessen aus 29 Antworten" statt „geschätzt". Unter zwölf Abständen
  bleibt es bei der bisherigen Minute — dann ändert sich nur die
  Ehrlichkeit des Untertitels. test305 neu (23).
* E312 (L95 geschlossen): Die Datenbank bekommt ihre Kontextkante — sie war
  seit E272 Phase F der einzige Schauplatz ohne eigene. Fünf Griffe:
  Ansicht, Filter, Sortieren, Gruppieren, Spalten. Die drei Gründe aus L95
  sind behoben (Schauplatz, `offeneSammlung()` statt einer blossen Kennung,
  vier nicht ausgeführte Menüs), und beim Bauen kamen zwei weitere ans
  Licht: `sortMenue` hätte ohne Anker geworfen (die Kante gibt jetzt ihren
  Knopf an `tun` weiter), und `schauplatzMelden()` meldete nur bei einer
  Änderung von `App.schauplatz()` — von Seite zu Seite bleibt der „seite",
  die Kante zeichnete sich also NIE neu. Das betraf auch die PDF-Kante.
  Dazu zwei tote Selektoren entfernt (`.pdfseite`, `.blattraum` trafen nie
  etwas) und zwei neue Zeichen (`filter`, `sort`). test306 neu (21); §4
  klickt jeden Griff wirklich an, statt zu behaupten, dass er dasteht.
* E313 (L61 geschlossen): Der Deckel zeigt die Seite. Vorher stand auf dem
  Deckel eines eingelesenen PDF ein weisses Blatt mit dem Wort „PDF" — bei
  Redur die Mehrheit der Dokumente. Nicht auf dem in L61 vorgeschlagenen Weg
  (ein Vorschaubild mitschreiben), sondern auf dem kürzeren: die Seite HAT
  das Bild schon, als echte Datei (`bildDateiId`, `dateiId`).
  `Vorschau.bildDatei()` nimmt die erste in Lesereihenfolge. Keine
  Speicheränderung, keine Migration, und es kann nicht veralten — ein
  mitgeschriebenes Bild von gestern zeigt die Seite von gestern.
  test307 neu (13); §3 misst `naturalWidth` und `blob:`, also ob ein Bild
  wirklich ANKOMMT. Offen bleibt genau ein Fall: ein von Hand beschriebenes
  leeres Blatt hat keine Datei.
  Nebenbei: L64 war seit E212 erledigt, stand aber noch als offen im Titel.
* E314 (L100 geschlossen): Eine dazugelegte Sicherung erreicht den Server.
  `zuSchicken()` überspringt jeden Satz mit `edited <= marke` — richtig für
  hier Entstandenes, falsch für eine eingespielte Sicherung: wer eine von
  vor drei Monaten dazulegt, dessen Sätze sieht der nächste Abgleich NIE,
  und nirgends wird etwas rot. Nicht die Marken leeren (das hiesse
  Vollabgleich bei jedem Dazulegen), sondern eng: `wolkeNachtrag` hält die
  dazugelegten Kennungen, `zuSchicken` nimmt sie mit, Angekommenes wird
  gestrichen. Über 20 000 Sätzen steht eine Marke statt einer Liste. Drei
  Dinge kamen beim Bauen dazu: ein Fehlschlag darf nichts löschen (sonst
  derselbe Fehler eine Ebene tiefer), tote Kennungen werden gestrichen, und
  die Merkliste gehört diesem Gerät (`NUR_HIER`, wie L76). test308 neu (15)
  — mit einem winzigen Abgleich-Server im Lauf, der misst, ob die alten
  Sätze WIRKLICH ankommen.
* E315 (L72 Teil 2, bis auf die Bilder): Fett bleibt fett bis nach Word und
  zurück. Der Export schrieb den ROHEN Blocktext — in Word stand `**fett**`
  wörtlich mit Sternchen da, und wer eine Arbeit abgibt, gibt sie so ab.
  Neu `core/text/inline.ts`: ein Kern für beide Richtungen, weil zwei
  Fassungen derselben Regel auseinanderlaufen und man es erst an der
  abgegebenen Datei merkt. Der Prüflauf fand drei Dinge: die feste Breite
  fehlte in der Gegenrichtung, Word zerschneidet einen Satz in fünf gleich
  ausgezeichnete Läufe (`**a****b**`), und `w:b w:val="0"` heisst
  ausdrücklich NICHT fett. test309 neu (25). Zwei benannte Verluste
  bleiben, beide gemessen: ein Seitenverweis wird in Word zu seinem Text,
  Bilder bleiben Platzhalter.
  Und eine Prüfung, deren Name nicht mehr stimmte: test252 §3 hiess „die
  Sternchen stehen wörtlich da" und war NACH E315 immer noch grün — aus dem
  umgekehrten Grund. sw v70.
* E316 (L101 Punkt 1): Die Vorschau sagt, was sich ändert. Vor dem
  Einspielen stand „Die Datei enthält 1247 Blöcke, hier liegen 1180" — das
  sagt, wie GROSS die Sicherung ist, nicht was sie tut, und es ist die
  letzte Stelle vor einem Vorgang, der löscht. `core/import/vergleich.ts`
  liefert vier Gruppen (neu, ersetzt, gleich, verschwindet), für beide Wege
  getrennt gerechnet. Was verschwindet, wird beim NAMEN genannt — „7 Sätze
  verschwinden" beantwortet die Frage nicht, die man hat; die Frage ist
  „meine?". Und was nicht geschieht, steht nicht da: keine Null, kein Wort
  von Verschwinden beim Dazulegen. `wolkeVersion` zählt nicht mit, sonst
  wäre nach jedem Abgleich jeder Satz „geändert". test310 neu (23). sw v71.
* E317 (L101 Punkt 2): Ein fehlender Anhang wird genannt. Die Anhänge
  kommen nach der Transaktion, jeder einzeln — das bleibt so, ein grosses
  Video in einer Transaktion würde die Ablage minutenlang blockieren (§10).
  Weg musste das Schweigen daneben: zweimal `continue`, und am Ende meldete
  Redion nur, wie viele es GESCHAFFT haben. Ein Block zeigte danach auf eine
  Datei, die es nicht gibt, und niemand hatte etwas gesagt. Jetzt gibt
  `anhaengeEinspielen` `{ da, erwartet, fehlend }` zurück, nennt jeden
  fehlenden beim Namen samt Grund, und jeder Anhang steht in seinem eigenen
  `try` — ein Loch nahm vorher alle FOLGENDEN mit. Wer neunzig von hundert
  retten kann, rettet neunzig. Gegenprobe: im guten Fall kein Wort von
  Fehlen. Nebenbei gelernt, und es kostete zwei Anläufe: `App` steht
  absichtlich nicht auf `window` (src/global.d.ts), in `page.evaluate`
  erreicht man es nur beim blossen Namen. test311 neu (11). sw v72.
* E318 (L101 Punkt 4 — und damit L101 ganz): Der offene Weg wird so streng
  wie der verschlüsselte. Nachgemessen blieben von der Liste zwei Dinge, die
  wirklich übertragbar sind. Erstens: die angekündigte Bytezahl wurde nie
  gelesen. Jeder Dateisatz führt seine `groesse` mit, der offene Weg sah
  nicht hin und schrieb die tatsächliche Länge mit `zustand: 'fertig'` in
  die Ablage — ein halbes Video hiess danach vollständig. Jetzt wird die
  Differenz genannt, in einer eigenen Liste, weil „fehlt" und „kam verkürzt
  an" zwei verschiedene Nachrichten sind; übernommen wird er trotzdem (§46).
  Zweitens: `dateien.json` ging an E284 vorbei — ein blankes `JSON.parse`
  auf eine fremde Datei, deren Inhalt gleich durch `Object.assign` in die
  Ablage geht, bei geladenem Gegenmodul. Drei echte Normalfälle schweigen,
  und fünf der 18 Punkte prüfen genau dieses Schweigen. test312 neu (18).
  sw v73.
* E319 (L104): Das KI-Buch zählt, statt zu schätzen. Jeder Anbieter schickt
  am Ende die wirkliche Tokenzahl; der Strom-Leser suchte nach
  `delta.content` und warf alles andere weg — auch die Abrechnung. Verbucht
  wurde die Schätzung, und die greift bewusst zu hoch: für eine Bremse die
  harmlose Richtung, für „was habe ich diesen Monat ausgegeben" die falsche.
  `core/ai/abrechnung.ts` liest beide Dialekte (Anthropic schickt Ein und
  Aus in zwei Ereignissen, deshalb `zusammen` — und dort gewinnt der
  grössere Wert, nicht der spätere). Gebucht wird weiter zuerst die
  Schätzung, danach ERSETZT `berichtigen` sie; im `finally`, damit auch ein
  Abbruch nicht zu hoch stehen bleibt. `stream_options` geht nur an die vier
  Anbieter mit fester Adresse — „Eigener Server" ist eine fremde Adresse und
  ein 400 wäre teurer als eine ungenaue Zahl. Dazu L104 Punkt 3: die
  Preisliste sagt nach einem halben Jahr, dass sie alt ist, und schweigt
  vorher. test313 neu (25). sw v74.
* E320: Der volle Lauf war rot, und beide Funde waren echt. test290 sah, dass
  E308 das Präfix `pl-` nahm und nicht ins Verzeichnis eintrug — genau dafür
  gibt es das Verzeichnis. test51 meldete vier Abweichungen im Tagesplan, die
  alle dasselbe bedeuteten: E308 hatte die Kacheln inhaltlich UND in der
  Reihenfolge getauscht, und test51 las sie über ihre STELLE. Nachgemessen
  ist das Produkt in allen vier Punkten richtig. Die Kacheln werden jetzt
  über ihr SCHILD gelesen, dazu zwei schärfere Punkte: verplant + frei ergibt
  das Budget, und die Kachel „passt nicht mehr" gegen die gezeichnete Liste
  (nicht gegen die Überschrift daneben — die liest dieselbe Zahl, und ein
  Vergleich zweier Ausgaben desselben Ausdrucks kann nicht rot werden, L89).
  Rot-Probe gemessen: Kachel künstlich um eins erhöht → rot.
  Und was nur das Bild fand: das Budgetfeld war 479 px breit für eine
  zweistellige Zahl, weil `.finder label input{width:100%}` gegen
  `.pl-budget input{width:76px}` gewann. Sein Zwilling im Fuss sass in einem
  `span` statt einem `label` und behielt 62 px — der Unterschied im selben
  Bild machte es sichtbar. test51 41 Punkte (vorher 35). sw v74.
* E321 (L104 Punkt 1): Die KI-Grenzen sind endlich einstellbar. Das Buch gab
  es seit E287, die Griffe auch — sichtbar war nichts, und die Bremsmeldung
  endete ausgerechnet mit „Die Grenzen stehen unter Einstellungen → KI", wo
  nichts stand. Jetzt steht dort „Kosten und Grenzen" mit Monatsbetrag,
  Anbietern, vier Feldern und einem Weg zum Leeren. Die Summe nennt ihre
  Grundlage („2 von 3 Aufrufen gezählt") — möglich erst seit E319. Ohne
  Buchung kein Betrag, die Grenzen aber trotzdem einstellbar. Drei Dinge fand
  erst das Bild: „0.153 USD" mit englischem Punkt im deutschen Text (test281s
  eigene Prosa schrieb daneben längst „0,45 USD"), eine Zeile „groq — 0,00
  USD", die nichts behauptet, und am Telefon das „USD" auf eigener Zeile.
  test314 neu (20). sw v75.
* E322 (L103 Punkt 3): Was gerade läuft, sieht man auch. Die
  Auftragsmaschine meldet seit E286 jeden Schritt — zugehört hat niemand,
  und `offen()`/`abbrechen()` benutzte keine Oberfläche. §47 von der leisen
  Seite: eine Arbeit, die minutenlang läuft und über die die App schweigt.
  Jetzt ein Knopf oben rechts, der NUR erscheint, solange etwas läuft (wie
  die Glocke aus E251), dahinter eine Zeile je Auftrag mit Name, Satz,
  Balken, Stand und Abbrechen. Der Balken fehlt in zwei Fällen, und beide
  sind richtig: bei unbekannter Gesamtzahl wäre er erfunden, und bei
  „wartet" sagte er „0 % fertig", wo „hat noch nicht angefangen" die
  Wahrheit ist — das fand erst das Bild. Beim Bau kollidierte der erste
  Namensraum `auf-` mit dem der Aufgaben, wörtlich L90; das Verzeichnis aus
  E293 hat es gefangen, heisst jetzt `arb-`. test315 neu (25). sw v76.
* E323 (L103 Punkt 4): Nur ein Tab arbeitet. Die Pacht schützte gegen
  denselben Auftrag in zwei Tabs, nicht gegen zwei verschiedene —
  doppelte Last auf schwachen Geräten. Jetzt `navigator.locks` mit
  `ifAvailable`, je Takt statt als Anführerwahl: eine Wahl, die nie erteilt
  wird, hiesse „nie wieder arbeitet ein Tab". Ohne die API bleibt alles wie
  bisher. Der erste Prüflauf war rot und das Produkt hatte recht — die App
  taktet selbst alle vier Sekunden und nimmt dasselbe Schloss, der Aufruf
  von Hand verlor das Rennen. Und dann war die Messung selbst blind: mit
  ausgehängtem Schloss blieb sie grün, weil zwei unabhängige 4-Sekunden-
  Takte sich mit 160-ms-Fenstern fast nie treffen. §2b erzwingt die
  Gleichzeitigkeit und meldet ohne Schloss zwölf Überschneidungen.
  test316 neu (15). sw v77.
* E324 (L105 Punkt 2): Ein abgehakter Fund bleibt weg. Die Kennung war die
  ganze Frage — sie muss über Neuberechnungen gleich bleiben UND sich
  ändern, wenn sich der Fund ändert: wer seine Frage umformuliert, hat eine
  andere Frage. Art + Seite + Titel, normalisiert. Der Satz nennt, wieviel
  abgehakt ist, aber nur wenn es welches gibt; zurück geht immer, denn
  gemerkt wird eine Kennung und nie ein Fund. Der Haken war zuerst 71 px
  breit — dieselbe Spezifitätsfalle wie E320 und E321, beim dritten Mal als
  L111 aufgeschrieben. Und ein Kommentar, der die von E302 widerlegte
  Escape-Behauptung wiederholte, ist berichtigt. test317 neu (25). sw v78.
* E325 (L106 Punkt 2): Was zuerst auffrischen. Die Haltbarkeit wurde seit
  E289 gerechnet und genannt, aber man konnte nichts damit anfangen. Jetzt
  ein Abschnitt über dem Themenfortschritt — die Handlung über dem Bericht.
  Die Reihenfolge war die ganze Arbeit: nicht „am wenigsten haltbar",
  sondern „am meisten verloren". Und das Bild zeigte, dass auch das noch
  nicht reichte: mit roh addierten fälligen Karten stand „Deutsch, 98 %
  sitzt noch" vor „Mathematik, 81 %" — vierzehn Karten aufzufrischen, die
  noch sitzen, ist verschenkte Zeit, und die Überschrift versprach etwas
  anderes. Fällig zählt jetzt mit seinem Zerfall. Schwelle: eine ganze
  verblasste Karte, mit Fliesskomma-Toleranz, weil 10 × (1 − 0,9) eben
  0,9999999999999998 ergibt. test318 neu (18). sw v79.
* E326 (L106 Punkt 6, halb): VTODO wird gelesen, und der Streifen ist lesbar.
  Der ICS-Leser kannte nur VEVENT — wer sein Nextcloud abonnierte, bekam
  seine Termine und wusste nicht, dass Aufgaben mitgeliefert wurden. Jetzt
  eine eigene Liste mit DUE, COMPLETED, PERCENT-COMPLETE und PRIORITY;
  `COMPLETED` ist der einzige Status, der „fertig" heisst, denn `CANCELLED`
  heisst abgesagt. Geprüft wird bei VTODO auf den Titel und nicht auf den
  Anfang: eine Aufgabe ohne Frist ist gültig, ein Termin ohne Anfang nicht.
  In die Kalendertabelle kommen sie absichtlich NICHT — das wäre die
  Falschaussage, die E290 gerade abgeräumt hat; stattdessen zählt ein
  Streifen die offenen. Und dann fand das Bild zwei Dinge, die schwerer
  wogen als der Bogen: die neue `.banner.info`-Regel war TOT (es gab sie
  schon in bausteine.css, die später lädt), und die gewinnende hatte im
  dunklen Thema 3.11:1 — unter den 4.5 aus §38, während warn 6.65 und
  fehler 8.31 hatten. Jetzt 8.38. L111 zum vierten Mal. Die Prüfung mass
  zuerst „hat info einen Hintergrund" und konnte gar nicht rot werden; sie
  misst jetzt den Kontrast in beiden Themen. Dazu hing §1 an der Zeitzone
  des prüfenden Rechners — die Seite bekommt sie jetzt gesagt.
  test319 neu (26). sw v80.
