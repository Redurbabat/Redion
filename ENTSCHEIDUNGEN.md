# ENTSCHEIDUNGEN.md — was stand wo, was wurde gewählt, warum

Eine Zeile pro Fall. Diese Datei ist später mehr wert als der Code, weil man
an ihr sieht, **warum** etwas so ist, wie es ist.

Die Regel dahinter (aus der Arbeitsanweisung):

1. Erst prüfen, ob es wirklich ein Widerspruch ist — meist sind es zwei
   Detailtiefen derselben Sache; dann gilt die genauere.
2. Ein Screenshot schlägt einen Text.
3. Lassen sich beide Wege nebeneinander bauen, ohne dass es umständlicher
   wird: beide bauen.
4. Sonst den besseren wählen — weniger Klicks, weniger Zustände die
   kaputtgehen, näher am Screenshot, später erweiterbar.

---

## E1 · `NOTION-10000X-BESSER.md` Teil 4 gegen den Quelltext

**Was stand wo.** Die Bestandsaufnahme in Teil 4 (2. August) markiert sechs
Punkte als ✗ oder ◐, die im Quelltext gebaut sind:

| Punkt | Teil 4 | Quelltext |
|---|:--:|---|
| Pivot / Kreuztabellen | ✗ | `datenbanken/steuerung.js:204` `alsPivot` — Zeilen × Spalten × Werte × Rechnung × Prozent |
| Datenvalidierung | ✗ | `datenbanken/dienst.js:196–243` — `pflicht`, `eindeutig`, `muster` |
| Feldrechte | ✗ | Spaltenrechte in Oberfläche und Server, `test80`–`test84` |
| Simulator | ✗ | `datenbanken/probelauf/dienst.js` |
| Tests | ✗ | `datenbanken/pruefsaetze/dienst.js` |
| Eigene Formelfunktionen | ◐ | `formeln/laufzeit.js:709` `EIGENE`, `setzeBibliothek` |

**Ist es ein Widerspruch?** Nein — es ist ein Datum. `WAS-REDION-MEHR-KANN.md`
ist vom 3. August und nennt alle sechs als gebaut. Teil 4 ist einen Tag älter
und wurde beim Bauen nicht nachgezogen.

**Gewählt.** Der Quelltext gilt. Er ist die einzige Quelle, die nicht
veralten kann, weil sie das ist, was läuft. `LUECKEN.md` führt die sechs als
gebaut und markiert sie mit „⚠ Teil 4 überholt", damit niemand die alte
Tabelle noch einmal für bare Münze nimmt.

**Nicht getan:** Teil 4 überschrieben. Die Datei ist ein datierter Befund,
kein Verzeichnis — sie umzuschreiben würde die Spur verwischen, an der man
sieht, wann was entstand. `LUECKEN.md` ist ab jetzt der aktuelle Stand.

---

## E2 · Wie die Kataloge gezählt werden

**Was stand wo.** Die Prüflisten in der Doku nennen Stückzahlen (97
Blocktypen, 160 Kürzel, 125 Formeln). Um dagegen zu prüfen, muss man Redions
Zahlen kennen.

**Gewählt.** Die Register **laden und befragen**, nicht `grep`en — dieselbe
Technik wie `test88`/`test89` mit den Diensten. Ein `grep` über `id:` zählt
Kommentare, Beispiele und die Doku im Kopf der Datei mit.

**Warum es zweimal danebenging, und was daraus folgt.** Beide Male, weil die
Schnittstelle geraten statt nachgesehen wurde:

- `Register.tasten.alle()` liefert **Gruppen**, nicht Kürzel. Geraten: 12.
  Mit `flach()`: **127**.
- `Register.formeln.alle()` hängt an `Formula.namen()`. Ohne geladene
  Laufzeit kommt nur der beschriebene Teil. Geraten: 20. Wirklich: **158**.

Eine geratene Schnittstelle sieht aus wie eine erfüllte — sie liefert eine
Zahl, nur die falsche. Dasselbe war schon beim Schreiben von `test88`
passiert (`wert` statt `val`). Es ist offenbar der teuerste wiederkehrende
Fehler in diesem Projekt und steht deshalb hier.

---

## E3 · Wo die Einstellungen wohnen

**Was stand wo.** `CLAUDE.md` Regel 3: *„Neue Blockart, Ansicht, Eigenschaft,
Befehl, Kürzel, Einstellung = ein Objekt in der passenden `register/`-Datei."*
Gemessen: `register/einstellungen.js` hat **11** Einträge, die
Einstellungsseite zeichnet **143** Optionen in 24 Bereichen aus einer eigenen
Liste in `bereiche/einstellungen/ansicht/seite.js`.

**Ist es ein Widerspruch?** Ja, aber kein inhaltlicher: die Funktion ist da
und sogar reicher als Notions 111. Es ist die Regel, die nicht eingehalten
wird.

**Gewählt.** **Jetzt nicht umbauen.** 143 Optionen ins Register zu heben ist
ein Umzug ohne Verhaltensänderung — genau die Art Arbeit, die `CLAUDE.md`
einen eigenen Schritt nennt. Sie neben eine inhaltliche Änderung zu legen,
wäre der Fehler, vor dem dieselbe Datei warnt: *„ein Umzug, der Verhalten
ändert, ist kein Umzug, sondern zwei Änderungen gleichzeitig."*

Eingetragen als eigene Aufgabe. Der Gewinn ist echt, aber er ist Ordnung,
nicht Funktion — und deshalb kommt er nach dem, was der Mensch merkt.

---

## E4 · Kein SQL, keine echte Datenbank-Engine (Idee 2)

**Was stand wo.** Idee 2 der 36: Ansichten mit SQL definieren, auf Tabellen
und materialisierten Views aufbauen.

**Gewählt.** **Wird nicht gebaut.** Nicht aus Bequemlichkeit, sondern weil es
mit dem Kern der App unvereinbar ist: sie läuft per Doppelklick auf
`index.html`, ohne Bauschritt und ohne Abhängigkeit. Eine SQL-Engine im
Browser hiesse SQLite über WebAssembly — eine Abhängigkeit von mehreren
hundert Kilobyte, die `CLAUDE.md` ausdrücklich ausschliesst.

**Was stattdessen.** Idee 34 aus derselben Liste — eine **lesbare
Abfragesprache** — löst dasselbe Problem für dieselben Leute, ohne die
Architektur zu brechen. Sie steht in `LUECKEN.md` als **C2**. Die Idee wird
also nicht verworfen, sondern auf den Weg gebracht, der hier gangbar ist.

---

## E5 · Die 62 Integrationen

**Was stand wo.** Teil 13 nennt 62 Integrationen. Redion hat 8.

**Gewählt.** **Nicht als Fleissarbeit einplanen.** Der Unterschied ist keine
Frage des Aufwands: die meisten der 62 verlangen OAuth mit einem
Anbietergeheimnis, und ein Geheimnis im Quelltext wäre für alle dasselbe —
`CLAUDE.md` verbietet das ausdrücklich, und zwar zu Recht.

Ohne Server geht nur, was einen **persönlichen** Schlüssel akzeptiert, den
der Mensch selbst einträgt. Das ist die Bauart, die Redion für die KI schon
benutzt.

Der ehrliche Eintrag in `LUECKEN.md` lautet deshalb nicht „54 fehlen",
sondern „54 fehlen, davon gehen ohne Server nur die mit persönlichem
Schlüssel". Welche das sind, ist noch nicht durchgezählt — das gehört vor das
Bauen, nicht danach.

---

## E6 · Keine CSP für die App selbst — und kein `<meta>` dafür

**Was stand wo.** Die Muss-Liste des Auftrags verlangt „sichere Security
Headers". `LUECKEN.md` hatte dazu vermerkt: *„Vorsicht: eine CSP, die `inline`
verbietet, bricht die App — sie besteht aus `innerHTML`."*

**Nachgemessen, bevor entschieden wurde.** Der Vermerk war fast richtig, aber
aus dem falschen Grund: `innerHTML` allein ist für eine CSP kein Problem —
`script-src` betrifft `<script>`-Tags, `javascript:` und `eval`, nicht das
Einsetzen von Markup. Die echten Hindernisse sind andere:

| | Anzahl | verlangt |
|---|--:|---|
| `style="…"`-Attribute | **562** | `style-src 'unsafe-inline'` |
| Inline-`<script>` in `index.html` | 2 | `script-src 'unsafe-inline'` |
| `new Function` (`erweiterungen.js`, `ki/agenten.js`) | 2 Stellen | `'unsafe-eval'` |
| fremde Adressen (KI-Anbieter, Google, GitHub, Wikipedia, Ollama …) | 20+ | `connect-src`, nie vollständig |

**Gewählt.** Die App bekommt **keine** CSP. Eine mit `'unsafe-inline'
'unsafe-eval'` ist keine Sicherheitsmassnahme, sondern eine Zeile, die wie eine
aussieht — und das ist schlechter als keine, weil sie beim nächsten Blick für
erledigt gehalten wird.

Die beiden `new Function` sind ausserdem **Absicht**: dort läuft, was der
Mensch selbst als Erweiterung oder Agent geschrieben hat. Das ist der Zweck
dieser Stellen. Eine CSP, die sie verbietet, würde eine Funktion abschalten,
nicht eine Lücke.

Was die App **doch** bekommt: `X-Content-Type-Options`, `Referrer-Policy`,
`X-Frame-Options`, `Permissions-Policy` — die stehen schon in
`oeffentlich/_headers` und kosten nichts.

**Und die veröffentlichte Seite bekommt die strenge CSP**, weil sie sie
verträgt: sie braucht kein einziges Skript. `default-src 'none'`. Genau dort
ist sie am meisten wert — es ist die einzige Seite, die ein fremder Browser
darstellt, und `sauber()` auf dem Server arbeitet mit regulären Ausdrücken
statt mit einem Parser.

**Kein `<meta http-equiv="Content-Security-Policy">`.** Es gälte auch für
`file://`. Redion läuft per Doppelklick auf `index.html` — das ist der Kern der
Sache, nicht eine Vorliebe. Eine CSP im Dokument würde diesen Weg mitregeln,
und zwar dort, wo es keinen Server gibt, der sie anpassen könnte. Als
Kopfzeile trifft sie nur, was wirklich über einen Server geht.

**Offen als D3b:** die 562 Stilattribute in Klassen überführen. Erst danach ist
eine CSP für die App mehr als Zierde.

---

## E7 · Die Schonfrist beim Sichtbarmachen des Papierkorbs

**Die Lage.** Weggelegte Blöcke waren bis jetzt unsichtbar: `trashed()` zeigte
nur Seiten, und beide Aufräumungen liefen über `trashed()`. Ein Block, den
jemand vor zwei Jahren mit `Strg`+`Umschalt`+`Rücktaste` weggelegt hat, liegt
also noch da — mit einem `trashedAt` von damals.

Sichtbar machen heisst: er kommt in die Liste. Es heisst aber auch, dass die
Aufräumung ihn jetzt findet. Bei der voreingestellten Frist von 30 Tagen wäre
er acht Sekunden nach dem ersten Start endgültig gelöscht — **bevor ihn je
jemand zu sehen bekam**. Der Auftrag endet mit dem Satz: *Redion darf niemals
so gebaut werden, dass Nutzer ihre Daten unbemerkt verlieren.* Das wäre genau
das, und ausgerechnet als Nebenwirkung einer Reparatur, die Daten retten soll.

**Die beiden Wege, die zur Wahl standen.**

*Die Fristen zurücksetzen* — jedem weggelegten Block ein neues `trashedAt`
geben. Einfach, und falsch: es schreibt eine Unwahrheit in die Daten. Der
Block wurde nicht heute weggelegt, und im Papierkorb stünde „gelöscht vor
einem Moment" für etwas, das zwei Jahre alt ist. Wer das später liest, hält
es für die Wahrheit.

*Einen Stichtag merken* — `papierkorbSichtbarSeit` wird beim ersten Lauf der
neuen Aufräumung einmal gesetzt. Für Blöcke gilt `max(trashedAt, Stichtag)`.
Das ist der gewählte Weg: die Daten bleiben, wie sie sind, und die Frist zählt
ab dem Tag, an dem sie überhaupt zu sehen waren.

**Für Seiten gilt der Stichtag nicht.** Sie waren immer sichtbar, ihre Frist
lief immer. Sie jetzt mitzuverlängern wäre eine zweite Änderung im selben
Schritt — und `CLAUDE.md` sagt, warum man das nicht tut.

**Nebenbei entschieden: die Meldung.** Die Aufräumung beim Start lief mit
`still: true` — sie löschte endgültig und sagte nichts. Sie läuft jetzt mit
`still: false`. Eine Einstellung, der jemand einmal zugestimmt hat, rechtfertigt
nicht, dass er nicht erfährt, wann sie zugreift.

---

## E8 · Ausdünnen statt Abschneiden beim Versionsverlauf

**Die Frage, wie sie in `LUECKEN.md` stand:** `VERSIONEN_MAX` sagt 200,
`versionSpeichern` hält 30 — welche Zahl gilt?

**Warum das die falsche Frage war.** Eine Fassung entsteht alle vier Minuten,
solange jemand an einer Seite arbeitet. Ein Nachmittag sind dreissig davon.
Ein Verlauf, der die neuesten dreissig behält, reicht nach diesem Nachmittag
**zwei Stunden** zurück — die Fassung von letzter Woche ist weg, und zwar
still. In der Liste stehen dreissig Einträge; es sieht vollständig aus.

Bei 200 wäre es dasselbe eine Stufe später: ein paar Tage intensiver Arbeit,
und der Monat davor ist verschwunden. Eine reine Zahl kann das nicht lösen,
weil sie alle Fassungen gleich behandelt — die von vor zehn Minuten und die
von vor einem halben Jahr.

**Die drei Wege, die zur Wahl standen.**

*Nach Zeit begrenzen*, wie Notion es tut (7/30/90 Tage je Tarif). Passt dort,
weil dort ein Server den Platz hat. Hier steht der Verlauf in IndexedDB mit
einer Quote, und eine Seite, an der jemand einen Monat lang täglich arbeitet,
sammelt dabei Tausende Fassungen an. Eine Zeitgrenze ohne Zahlgrenze ist auf
einem Gerät keine Grenze.

*Die Zahl erhöhen.* Verschiebt das Problem und kostet das Siebenfache an
Platz für einen Verlauf, der immer noch keine Tiefe hat.

*Ausdünnen* — der gewählte Weg, und der, den Sicherungswerkzeuge seit jeher
gehen: nicht alle Fassungen sind gleich viel wert. Die von heute braucht man
fein aufgelöst, die von vor einem Jahr braucht man überhaupt. Also: die
jüngsten zwölf vollständig, dann eine je Tag für dreissig Tage, dann eine je
Monat, darüber die harte Grenze 200.

Die Zahlen stehen in `konstanten.js` und werden zum ersten Mal auch gelesen.
Sie sind nicht heilig: zwölf ist etwa eine Stunde feiner Auflösung, dreissig
Tage decken den Zeitraum ab, in dem man „was war da vorher?" tatsächlich
fragt.

**Von Hand gesicherte Fassungen bleiben immer, auch über der Grenze.** Wer
zweihundertmal selbst auf „Fassung sichern" gedrückt hat, hat zweihundertmal
eine Absicht gehabt. Die still wegzuräumen, weil eine Zahl im Weg steht, wäre
genau das, was diese App nicht tun darf. Die Grenze greift deshalb nur nach
automatischen Fassungen.

**Und der Knopf.** „Alte Versionen aufräumen" hielt sich an keine der beiden
Zahlen, sondern an eine dritte: `slice(5)`. Ohne Rückfrage, endgültig, ein
Klick. Er ist jetzt dieselbe Regel, sofort statt beim nächsten Speichern
angewandt — und er fragt, mit der Zahl, um die es geht. Ein Knopf, der
fünfundzwanzig Fassungen löscht, ohne die Zahl zu nennen, ist kein
Aufräumknopf.

---

## E9 · Zwei Fenster: auffrischen ja, zusammenführen nein

**Die Lage.** Zwei Tabs, eine IndexedDB, zwei getrennte Zwischenspeicher. Der
Verlust entstand nicht beim Lesen, sondern beim Schreiben: das Fenster mit dem
älteren Stand schrieb ihn über den frischeren.

**Was gebaut wurde und was nicht.** Gebaut ist das **Auffrischen**: was drüben
auf die Platte geht, wird hier nachgelesen. Nicht gebaut ist das
**Zusammenführen**. Wenn zwei Menschen gleichzeitig denselben Absatz tippen,
gewinnt der spätere Schreibvorgang — wie in jedem Editor ohne Server.

Das ist eine bewusste Grenze und keine Lücke. Für echtes gleichzeitiges
Schreiben braucht es CRDTs oder eine Serverrunde; beides steht in
`kern/abgleich/` für den Fall zwischen zwei **Geräten** schon bereit, und
beides wäre zwischen zwei Tabs desselben Browsers ein Apparat für einen Fall,
den es kaum gibt. Der Fall, den es gibt, ist der andere: zwei Fenster, zwei
verschiedene Seiten, und eines wirft die Arbeit des anderen weg, weil es sie
nie gesehen hat. Genau der ist jetzt zu.

**Warum nicht aus der Nachricht übernommen wird.** Die Nachricht könnte den
Satz mitschicken; das wäre eine Runde schneller. Sie wäre aber auch veraltet,
sobald zwei Änderungen sich überholen. Nachgelesen wird deshalb von der
Platte: sie ist die Wahrheit, die Nachricht ist nur der Anlass.

**Warum erst nach dem Schreiben gemeldet wird.** Der erste Wurf meldete
sofort. Das Fenster drüben las nach, fand noch nichts — und schloss daraus,
der Satz sei gelöscht. Eine Meldung über eine Änderung, die es noch nicht
gibt, ist schlimmer als gar keine.

**Warum beim Tippen nicht gezeichnet wird.** Der Zwischenspeicher wird immer
aufgefrischt; daran hängt, dass nichts überschrieben wird. Gezeichnet wird
nur, wenn niemand in einem Feld steht. Sonst springt mitten im Satz der
Schreibzeiger — und eine Reparatur, die beim Tippen stört, wird wieder
ausgebaut, egal wie richtig sie ist.

**`onversionchange`: die Verbindung wird freigegeben, nicht gehalten.** Das
alte Fenster arbeitet danach nicht weiter, sondern sagt es. Weiterschreiben
ginge nur noch in den Arbeitsspeicher, also ins Nichts — und ein Fenster, das
so tut als ob, ist die teuerste Art, Daten zu verlieren.

---

## E10 · `.redion` — und was eine Sicherung löschen darf

**Die Frage aus `LUECKEN.md`:** was geschieht bei einem 500-MB-Video?

**Was nicht ging.** Base64 in derselben JSON-Datei. Es wird um ein Drittel
grösser, liegt vollständig im Arbeitsspeicher, und die Zeichenkette, die
daraus wird, noch einmal daneben. Auf einem Telefon ist das der sichere
Absturz — und zwar mitten in dem Vorgang, der Daten retten soll.

**Der gewählte Weg: ein gewöhnliches ZIP.** Kein eigenes Format, kein
Kunststück. Ein ZIP kommt einem entgegen: sein Inhaltsverzeichnis steht am
Ende, jeder Eintrag hat einen Versatz und eine Länge, und `blob.slice`
schneidet ohne zu lesen. Beim Schreiben wie beim Lesen geht immer nur ein
Megabyte durch den Arbeitsspeicher.

**Zwei Formate, nicht eines.** Ohne Anhänge bleibt es bei `.json`. Wer nur
Text hat, soll seine Sicherung in einem Editor öffnen und lesen können; ein
Archiv um eine einzige JSON-Datei ist eine Hürde ohne Gegenwert. Erst wenn
Anhänge da sind, gibt es einen Grund für die Verpackung — und dann auch
einen guten.

**Die Anhänge liegen unter ihren echten Namen**, nicht unter ihren
Kennungen. Das ist die wichtigste Entscheidung hier. Wer das Archiv in zehn
Jahren öffnet — mit irgendeinem Packprogramm, ohne Redion, vielleicht ohne
dass es Redion noch gibt —, findet darin `dateien/ferien.jpg` und nicht
`dateien/9f3c-…`. Eine Sicherung, die nur die App lesen kann, die sie
geschrieben hat, ist eine halbe Sicherung.

Gleiche Namen werden durchnummeriert. Zwei Bilder dürfen „foto.jpg" heissen;
im Archiv darf ein Name nur einmal vorkommen, sonst überschreibt das
Auspacken das eine mit dem anderen — still, wie immer bei dieser Sorte.

**Beim Einspielen behalten die Anhänge ihre alten Kennungen.** Deshalb
werden Dateisatz und Stücke von Hand geschrieben, statt den bequemen Weg
über `Dateien.ablegen` zu nehmen: der vergäbe neue Kennungen, und die Bilder
wären da, ohne dass ein Block sie fände.

**Und was eine Sicherung löschen darf.** „Ersetzen" heisst: der Bestand
sieht danach aus wie die Sicherung. Für die Anhänge gilt das nur, wenn die
Sicherung sie überhaupt abdeckt.

* `.redion` → deckt sie ab, also gehen fremde Anhänge weg. Sie gehörten zu
  Seiten, die es jetzt auch nicht mehr gibt, und lägen sonst für immer
  unerreichbar herum.
* `.json` → sagt in ihrem eigenen Feld `fehlt`, dass sie die Anhänge nicht
  enthält. **Sie werden nicht angefasst.** Etwas wegzuwerfen, weil es in
  einer Datei fehlt, die zugibt es nicht zu kennen, wäre die schlimmste Art
  von Datenverlust, die dieser App einfallen könnte.

**Über 4 GB: ein Satz statt eines kaputten Archivs.** Ein ZIP dieser Bauart
zählt Grössen und Versätze in 32 Bit; darüber braucht es ZIP64, und das ist
ein anderes Format, kein grösseres Feld. Hier wird deshalb abgebrochen, mit
dem Namen der Datei und dem Grund. Ein Archiv, das erst beim Auspacken
auffällt, ist schlimmer als eine Sicherung, die nicht zustande kam.

---

## E11 · Was eine Marke darf — und die Regel, die am ehesten wieder verlorengeht

**Die Lage.** Eine Marke ist ein Zugangsschlüssel für ein Programm, mit
Rechten: `lesen`, `schreiben`, `alles`. Geprüft wurden sie an zwei von neun
Wegen. Über `/bereich` konnte eine Lesemarke schreiben, über `/sync` den
ganzen Bestand ersetzen, und über `/marken` sich selbst eine neue mit `alles`
ausstellen.

**Die Entscheidung, die nicht selbstverständlich ist: Regel 3.** Keine Marke
darf Rechte oder Schlüssel ändern — auch keine mit `alles`. Drei Wege sind
deshalb ganz zu: `/marken`, `/freigabe`, `/feldrecht`.

Dagegen sprach: `alles` heisst `alles`, und wer sich eine solche Marke
ausstellt, weiss doch, was er tut. Das ist richtig — solange die Marke bei
ihm bleibt. Der Fall, für den man baut, ist der andere: sie steht in einer
Konfigurationsdatei, in einem Protokoll, in einem Screenshot. Von dort aus
ist der Unterschied zwischen „darf alles in meinen Daten" und „darf sich
selbst dauerhaft einrichten und andere einladen" der Unterschied zwischen
einem Schaden und einem Übernahme.

Regel 3 sieht wie eine Unbequemlichkeit aus, solange man nicht daran denkt,
dass eine Marke abhandenkommen kann. Genau deshalb steht sie hier
aufgeschrieben: sie wird beim nächsten Umbau als erstes in Frage gestellt.

**Wer schreiben darf, darf auch lesen.** Sonst könnte ein Programm nicht
nachsehen, was es geschrieben hat, und jeder müsste zwei Marken führen. Die
Gegenrichtung gilt nicht: Lesen erlaubt kein Schreiben.

**Das Tor steht an einer Stelle, nicht an neun.** Nach dem Token, vor der
ersten Route. Die zwei alten Fassungen in `v1Weg` und `mcpWeg` rechnen nicht
mehr selbst, sondern rufen dieselbe Funktion — zwei Fassungen derselben
Prüfung laufen irgendwann auseinander, und die falsche merkt niemand. Das
war schon der Befund beim Papierkorb, bei den Kopfzeilen und bei CORS.

**Eine bestehende Marke kann dadurch aufhören zu funktionieren.** Wer sich
früher eine mit der Voreinstellung `lesen` ausgestellt hat und damit schreibt,
bekommt jetzt ein 403. Das ist die Absicht, und die Meldung sagt, was zu tun
ist: eine neue Marke mit den passenden Rechten anlegen. Eine
Sicherheitszusage, die man aus Rücksicht auf bestehende Aufrufe nicht
durchsetzt, ist keine.
