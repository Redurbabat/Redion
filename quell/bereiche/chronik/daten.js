"use strict";
/* ============================================================================
 * chronik/daten.js — die Chronik, wie Redion sie liest
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `chronik/chronik.json`; `node chronik.mts` schreibt daraus
 * diese Datei, UR.md und PROBLEME.md. Eine Wahrheit, drei Ansichten (§8).
 * ==========================================================================*/
const ChronikDaten = {
    "hinweis": "DIE QUELLE. UR.md und PROBLEME.md werden aus dieser Datei erzeugt (node chronik.mts), und die Chronik in Redion liest sie ebenfalls. Eine Wahrheit, drei Ansichten (§8).",
    "ueberRedur": {
        "name": "Redur Babat",
        "wer": [
            "Elektroberuf in der Schweiz — Schaltpläne, NIV, Minuterie, Wechselschaltung, Kreuzschaltung. Die Beispiele in seinen Bildern sind echte Prüfungsaufgaben, keine erfundenen.",
            "Er arbeitet mit GoodNotes auf dem iPad und hält es Redion daneben. Wenn er ein Bild schickt, ist es fast immer GoodNotes — und er will nicht 'so ähnlich', sondern 1:1.",
            "Sein Deutsch ist gesprochen, nicht geschrieben: schnell getippt, ohne Punkt, mit Tippfehlern. Der Inhalt ist dabei IMMER präzise. Wer die Rechtschreibung liest statt den Inhalt, versteht ihn falsch.",
            "Er sagt sehr deutlich, wenn ihm etwas gefällt ('das sieht brutal gut aus') und ebenso deutlich, wenn etwas fehlt ('alter, wieso habe ich keinen Laserpointer').",
            "Er will Tempo. 'Weiter', 'weiter ohne Pause', 'mache es sofort' kommen oft — und meinen: nicht fragen, machen.",
            "Aber er will auch Ehrlichkeit. Er hat mehrfach Regeln gesetzt, die genau das erzwingen: nicht behaupten, die Gesamtsuite sei grün; nichts löschen ohne Rückfrage; Lücken aufschreiben statt verstecken."
        ],
        "wieMitIhmArbeiten": [
            "SEINE SÄTZE SIND DER AUFTRAG, wörtlich. 'Strich Strich Strich, so nur Strich' heisst: zwei Zahlen im Muster, nicht vier. Er hat es zweimal gesagt — das war kein Versehen, das war Nachdruck.",
            "EIN BILD SCHLÄGT EINE BESCHREIBUNG. Wenn er eines schickt, ist die Antwort auch ein Bild.",
            "NICHT FRAGEN, WO ICH ES SELBST MESSEN KANN. Fragen nur, wo die Antwort das Ergebnis ändert und ich sie nicht messen kann (Beispiel: welcher Knopf genau, L139).",
            "WAS ES KOSTET, GEHÖRT DAZU. Er nimmt Kosten in Kauf, wenn sie danebenstehen — und merkt es, wenn sie fehlen."
        ]
    },
    "arbeitsweise": {
        "titel": "Wie ich arbeite, und warum so",
        "grundsaetze": [
            {
                "name": "Erst messen, dann bauen",
                "warum": "Die naheliegende Vermutung war in diesem Durchgang DREIMAL falsch. 'Zeichnen ist zu langsam' — gemessen: flach bei 16,7 ms je Bild, kein Aussetzer. 'Nach 5 Minuten stirbt es, also ist es eine Uhr' — alle zehn Uhren einzeln ausgelöst, jede unschuldig. 'getScreenCTM kostet 15 %' — ohne echte Bilder gemessen, mit Bildern waren es 45 %. Wer ohne Messung baut, baut Wochen an der falschen Stelle.",
                "regel": "CLAUDE.md §36"
            },
            {
                "name": "Zuerst der Prüflauf, dann die Reparatur",
                "warum": "Sonst weiss niemand, ob die Reparatur die Sache wirklich hält. Bei der sterbenden Zeichenfläche war der Lauf vor der Reparatur rot in neun Zusagen — danach grün. Das ist der Beweis, nicht das Gefühl.",
                "regel": "CLAUDE.md §30"
            },
            {
                "name": "Ein Wächter, der nie rot war, ist eine Behauptung",
                "warum": "Dreimal in diesem Durchgang blieb eine Gegenprobe grün, obwohl ich das Gegenteil eingebaut hatte — die Zusage mass das Falsche. 'Alle Schritte der Welle sind gleich gross' ist auch dann wahr, wenn alle null sind.",
                "regel": "CLAUDE.md §55.2"
            },
            {
                "name": "Ein Bild, wenn man etwas sehen kann",
                "warum": "Das Bild hat in diesem Durchgang dreimal etwas gefunden, das kein Prüflauf sehen konnte: die Adernreihe, die beim Öffnen nicht umschaltete; die Seitenleiste, die zu einem 20 px breiten Streifen zusammenfiel; die Welle, die keine war.",
                "regel": "CLAUDE.md §55.3"
            },
            {
                "name": "Was es kostet, steht daneben",
                "warum": "Die Leiste braucht jetzt drei Zeilen statt zwei. Das ist Arithmetik, keine Nachlässigkeit — aber es stillschweigend zu lassen hiesse, eine Zusage zu brechen und zu hoffen, dass es niemand nachmisst. Es steht als L137 in LUECKEN und in den Prüfläufen mit der Rechnung daneben.",
                "regel": "CLAUDE.md §35"
            },
            {
                "name": "Eine Sache, ein Ort",
                "warum": "Zwei Kataloge für dasselbe laufen auseinander, und niemand merkt, welcher gilt. Die zehn Adern stehen EINMAL; die vier Plätze der Leiste stehen EINMAL; das Notizbuch geht über dieselbe Anlege-Maschine wie das Regal.",
                "regel": "CLAUDE.md §8"
            },
            {
                "name": "Nie Daten verlieren",
                "warum": "Jede Reparatur wurde daran gemessen. Der abgebrochene Zug wird ABGESCHLOSSEN, nicht verworfen. Der nasse Schwanz wird NIE gespeichert. Ein ported Fix statt einer Verschlimmbesserung.",
                "regel": "CLAUDE.md §51"
            }
        ],
        "wieIchPlane": [
            "1. Lesen, was da ist — Code und Doku. Der teuerste wiederkehrende Fehler dieses Projekts war, eine Schnittstelle aus dem Gedächtnis zu schreiben statt sie nachzuschlagen.",
            "2. Die zuständigen Prüfläufe suchen. Es gibt über 480; welcher hält, was ich anfasse?",
            "3. Messen, wenn es etwas zu messen gibt.",
            "4. Einen kleinen Plan machen — ein Bogen, ein Ziel.",
            "5. Den Prüflauf schreiben, bevor ich repariere.",
            "6. Bauen, laufen lassen, Gegenprobe rot sehen.",
            "7. Ein Bild ansehen, wenn es etwas zu sehen gibt.",
            "8. Doku: Entscheidung, Lücke, Aufgabe, erledigte Aufgabe.",
            "9. Bauen, Einzeldatei, Dienststand, committen, pushen."
        ]
    },
    "tage": [
        {
            "datum": "2026-09-07",
            "wochentag": "Montag",
            "titel": "Der GoodNotes-Auftrag beginnt",
            "wasIchWeiss": "Von diesem Tag habe ich die Commits und die Entscheidungen, aber NICHT den Wortlaut der Nachrichten — die Sitzung davor liegt nicht mehr vollständig vor. Was hier steht, ist aus git und aus ENTSCHEIDUNGEN.md abgelesen, nicht erinnert.",
            "nachrichten": [],
            "arbeit": [
                {
                    "was": "G8 bis G23 — der PDF-Teil wie GoodNotes: Suche über mehrere Dokumente, eigener PDF-Schreiber, Radierer-Fehler, der Stift wie GoodNotes (Halten, Schutzleiter), Sperrliste, Präsentieren mit Laserpointer, Elemente-Bibliothek, Cornell- und Notenpapier, Seite in ein anderes Dokument",
                    "vonCommit": "969c3ac6",
                    "bisCommit": "1374c9b5",
                    "zeitraum": "19:45 – 23:27",
                    "entscheidungen": "E487 bis E496"
                }
            ],
            "zahlen": {
                "commits": 10,
                "entscheidungen": 10
            },
            "groesstesProblem": "E489 — der Radierer „Band\" radierte nichts: die Markenart wurde falsch verglichen.",
            "interessantestes": "E491 — Redur hat klargestellt, dass Redion keine Notion-Kopie ist: mit Server UND ohne, und der Nutzer entscheidet, wo seine Daten liegen. Das hat die Projektidentität in CLAUDE.md §2 geändert."
        },
        {
            "datum": "2026-09-08",
            "wochentag": "Dienstag",
            "titel": "Der lange Tag: Formelheft, Stift-Dossier, Adern, Flüssigkeit, Leiste — und ein Killer",
            "wasIchWeiss": "Von hier an habe ich den vollen Wortlaut. Alle Zitate sind 1:1.",
            "nachrichten": [
                {
                    "zeit": "ca. 03:30",
                    "wortlaut": "Scha mal das ichh habe schon ein formel samlung in webseite und es sollte die orginale ich dort eintragen können",
                    "gemeint": "Es gibt schon eine Formelsammlung als Webseite. Sie soll im Original in Redion nutzbar sein.",
                    "besser": "Ich habe schon eine Formelsammlung als Webseite. Sie soll in Redion nutzbar sein — im Original, nicht abgetippt.",
                    "besserePrompt": "Ich habe eine fertige Formelsammlung als HTML-Datei. Ich will sie in Redion öffnen können, ohne sie neu zu schreiben. Zeig mir zuerst, welche Wege es gibt, und frag nach, wenn unklar ist, wie ich sie benutzen will."
                },
                {
                    "zeit": "ca. 04:00",
                    "wortlaut": "Also so die orgibal belibt und wo wenn beim elektro wo die elektronsymbil ist beim dokument arbeiten diek im pdf dort shen kann , so das ich es schiben kliner grösser machen kann direk auf dem pdf und ein oder aus halten könenn",
                    "gemeint": "Das Original bleibt unverändert. Beim Arbeiten im Dokument — dort, wo das Fachzeichen-Werkzeug ist — soll das Heft über der PDF sichtbar sein: verschiebbar, in der Grösse ziehbar, ein- und ausschaltbar.",
                    "besser": "Das Original soll unverändert bleiben. Beim Arbeiten an einem PDF will ich das Heft darüber sehen — verschiebbar, in der Grösse veränderbar, und mit einem Knopf ein- und ausschaltbar. Der Knopf soll neben dem Fachzeichen-Werkzeug stehen.",
                    "besserePrompt": "Bau ein Fenster über dem PDF, das meine Formelsammlung zeigt. Es muss: (1) verschiebbar sein, (2) in der Grösse ziehbar, (3) ein Knopf neben dem Fachzeichen schaltet es an und aus, (4) das Original wird nicht verändert. Zeig mir ein Bild, wenn es steht."
                },
                {
                    "zeit": "ca. 08:00",
                    "wortlaut": "Scahe mal dad genauer an  [22-seitiges Stift-Dossier als PDF]",
                    "gemeint": "Lies das technische Dossier über digitale Stifte und PDF-Annotationen gründlich und prüfe Redion dagegen.",
                    "besser": "Sieh dir dieses Dossier genau an und prüfe Redion Punkt für Punkt dagegen. Sag mir, was Redion schon kann, was fehlt, und was davon sich lohnt.",
                    "besserePrompt": "Hier ist ein Fachdossier (22 Seiten). Geh es systematisch durch und prüfe Redion dagegen. Ich will am Ende eine Liste: (a) was Redion schon erfüllt, (b) was fehlt und wie teuer es wäre, (c) was du für die drei wichtigsten Punkte hältst. Erst danach bauen."
                },
                {
                    "zeit": "ca. 10:30",
                    "wortlaut": "weiter ohne pause",
                    "gemeint": "Alle vier vorgeschlagenen Punkte bauen, ohne Rückfragen dazwischen.",
                    "besser": "Bau alle vier Punkte, ohne mich dazwischen zu fragen.",
                    "besserePrompt": "Bau alle vier, in der Reihenfolge, die du für richtig hältst. Frag nur, wenn du sonst Daten riskieren würdest. Melde dich, wenn alle vier stehen."
                },
                {
                    "zeit": "ca. 13:00",
                    "wortlaut": "Weiter",
                    "gemeint": "Weitermachen.",
                    "besser": "Mach weiter.",
                    "besserePrompt": "Mach weiter mit dem nächsten Punkt."
                },
                {
                    "zeit": "ca. 14:00",
                    "wortlaut": "wie kann ich lockal starten und zuert die aktuee github holen",
                    "gemeint": "Wie hole ich den aktuellen Stand von GitHub und starte Redion lokal?",
                    "besser": "Wie hole ich den aktuellen Stand von GitHub und starte Redion bei mir lokal?",
                    "besserePrompt": "Ich bin auf Windows mit PowerShell, der Ordner ist C:\\Users\\redur\\Documents\\ChatGPT\\Redion\\Redion-src. Gib mir die genauen Befehle zum Holen und Starten — und sag mir, woran ich sehe, dass der neue Stand wirklich da ist."
                },
                {
                    "zeit": "ca. 16:40",
                    "wortlaut": "das sieht brutar gur aus so die auge wenn ich das klicke sieht das so gut aus  das sieht gut aus so was wollte ich haben könntets du nicht wenn ich klicke das kommen sondern wenn ich mit maus draus gehe sollte es so kommen und ich will das du es bischen lustig machen will hahhah",
                    "gemeint": "Die Ordnerkarte gefällt. Sie soll beim Überfahren mit der Maus kommen statt beim Klicken — und ein bisschen lustig sein.",
                    "besser": "Die Ordnerkarte sieht sehr gut aus. Sie soll beim Überfahren mit der Maus aufgehen statt beim Klicken. Und mach sie ein bisschen verspielt.",
                    "besserePrompt": "Die Ordnerkarte gefällt mir. Zwei Änderungen: (1) sie soll beim Überfahren mit der Maus aufgehen, nicht erst beim Klick — der Klick soll aber weiter funktionieren; (2) mach die Bewegung verspielter. Zeig mir ein Bild."
                },
                {
                    "zeit": "ca. 17:00",
                    "wortlaut": "die schutz leiter sollte hier sein wie eine farbe und wenn ich mis maus draus so gehe sollte mir dann zeige sutzleiter und für die andere farben auch es sollte folgendes haben ein speiziel stif füge oben wo die stift markiere dort ist  und das ist speiziel für fachzeichen gedacht und es sollto folgendes haben die sutzleiter, die Neutralleiter sollte blau sein und es ist strich strich strich so nur strich , dann für L1 braun, L2 schwarz und L3  grau haben und für s(lampendrat sollte du eine einne passen de farbe finden und korresponierende 1 und korresponiderne 2 und korresponiderde 3 bis 4 sollte verschiedene farbe haben und ja das ist deine arbeit für jetzzt",
                    "gemeint": "Ein eigener Stift für Fachzeichnen. Die Adern als Farbreihe mit Namen beim Überfahren: PE, N (blau, NUR Striche), L1 braun, L2 schwarz, L3 grau, S (Lampendraht, Farbe frei wählbar), und vier verschiedene Farben für die Korrespondierenden 1–4.",
                    "besser": "Bau einen eigenen Stift fürs Fachzeichnen, oben bei den Stiften. Er soll die Adern eines Schaltplans als Farben anbieten, und beim Überfahren soll der Name dastehen — auch bei den gewöhnlichen Farben. Die Adern: PE Schutzleiter, N Neutralleiter blau und NUR gestrichelt (keine Punkte), L1 braun, L2 schwarz, L3 grau, S Lampendraht (Farbe suchst du aus), und 1 bis 4 für die Korrespondierenden in vier verschiedenen Farben.",
                    "besserePrompt": "Gleicher Inhalt, aber mit einem Satz Kontext vorweg: „Ich zeichne Schaltpläne nach Schweizer Norm. Dafür brauche ich …\" — dann weiss ich sofort, warum PE grün-gelb sein muss und warum die Korrespondierenden weit auseinanderliegen müssen."
                },
                {
                    "zeit": "ca. 20:30",
                    "wortlaut": "wie kann ich auktule stand hollen und starten lockal",
                    "gemeint": "Nochmal: wie hole ich den neuen Stand und starte lokal?",
                    "besser": "Wie hole ich den neuen Stand und starte lokal?",
                    "besserePrompt": "Der Stand liegt auf dem Zweig, nicht auf main — gib mir die Befehle dafür, und sag mir dazu, woran ich sehe, dass es geklappt hat."
                },
                {
                    "zeit": "ca. 20:45",
                    "wortlaut": "weiter ohen pause mache die stift teil besser ich muss flüsiger zeichen könne mehr animtaionen und weiter arbiten",
                    "gemeint": "Den Stift-Teil verbessern: flüssiger zeichnen, mehr Animationen. Ohne Pause weiterarbeiten.",
                    "besser": "Mach den Stift-Teil besser: ich will flüssiger zeichnen können, und mehr Bewegung in der Oberfläche. Arbeite ohne Pause weiter.",
                    "besserePrompt": "„Flüssiger\" ist mehrdeutig — ein Satz mehr spart einen halben Tag: „Die Tinte hängt hinter dem Stift her\" oder „es ruckelt\" oder „die Linie zittert\". Ich habe alle drei gemessen; nur die erste war wahr."
                },
                {
                    "zeit": "ca. 22:20",
                    "wortlaut": "mache das 1:1 so im redion alter wieso habe ich keien leserpointer mache es sofort und die fachzeichen stift kommt wenn ich die stioft klicke sollte nebne es also link unten wo die faren dort sind mir zeich welche stift ich will  [fünf GoodNotes-Bilder]",
                    "gemeint": "Die GoodNotes-Leiste 1:1. Es fehlt ein Laserpointer — sofort bauen. Und die Stiftwahl soll sichtbar sein: links unten bei den Farben soll stehen, welche Stifte es gibt.",
                    "besser": "Bau die Leiste wie in GoodNotes. Mir fehlt ein Laserpointer — bitte sofort. Und beim Stift will ich sehen, welche Stifte es gibt: als Reihe links bei den Farben, nicht als Knopf, der weiterschaltet.",
                    "besserePrompt": "Fünf Bilder mit je einem Satz darunter sind besser als fünf Bilder und ein Absatz. „Bild 1: so soll die obere Leiste aussehen. Bild 4: den Laserpointer will ich, mit Punkt und Linie.\""
                },
                {
                    "zeit": "ca. 22:30",
                    "wortlaut": "und die stift sollte ich als komplet webegen können also nach link rechts mitte und ganz oben",
                    "gemeint": "Die Werkzeugleiste soll komplett verschiebbar sein: links, rechts, Mitte (unten schwebend) und ganz oben.",
                    "besser": "Die Werkzeugleiste soll ich komplett verschieben können — nach links, nach rechts, unten in die Mitte oder ganz nach oben.",
                    "besserePrompt": "Genau so, das war klar. Ein Wort mehr hätte geholfen: „Mitte\" heisst bei GoodNotes unten schwebend — das musste ich aus dem Bild schliessen."
                },
                {
                    "zeit": "ca. 22:40",
                    "wortlaut": "und wenn ich oben eine neu pdf einfügen woll kopiert es immer die aktuele pdf wieos lösche das problem",
                    "gemeint": "Beim Einfügen einer neuen PDF wird die aktuelle kopiert. Beheben.",
                    "besser": "Wenn ich oben eine neue PDF einfügen will, kopiert Redion die aktuelle statt die neue zu nehmen. Bitte beheben.",
                    "besserePrompt": "Hier fehlte genau eine Angabe, und sie hat mich zwei Stunden gekostet: WELCHER Knopf. „Oben\" gibt es dreimal — „+ PDF öffnen\", „+\" und das Seitenmenü im Dokument. Ein Bild mit einem Pfeil darauf hätte gereicht."
                },
                {
                    "zeit": "ca. 22:50",
                    "wortlaut": "es sollte so sein wenn ich + klicke sollte mir sage was ich einfügen will pdf oder notizbuch text dokument whiteboard oder schnelnitizen  [zwei GoodNotes-Bilder]",
                    "gemeint": "Das „+\" soll fragen, was eingefügt werden soll: PDF, Notizbuch, Textdokument, Whiteboard oder Schnellnotiz.",
                    "besser": "Wenn ich auf + klicke, soll ein Menü kommen: PDF, Notizbuch, Textdokument, Whiteboard, Schnellnotiz — wie in GoodNotes.",
                    "besserePrompt": "Gut so. Nützlich wäre gewesen: „prüf zuerst, ob es das schon gibt\" — vier der fünf gab es bereits, nur das Notizbuch fehlte."
                },
                {
                    "zeit": "ca. 23:00",
                    "wortlaut": "schua mal wenn ich nache 5_6 minuten die websiet nutze und die stift funktioniert nicht mehr auch maus beim zeiche ich musste wieder neu laden schuae mal das auch an",
                    "gemeint": "Nach 5–6 Minuten Nutzung funktioniert der Stift nicht mehr, die Maus beim Zeichnen auch nicht. Nur Neuladen hilft.",
                    "besser": "Nach ein paar Minuten kann ich nicht mehr zeichnen — weder mit dem Stift noch mit der Maus. Erst nach dem Neuladen geht es wieder. Bitte ansehen.",
                    "besserePrompt": "Das war der wichtigste Satz des Tages und schon fast perfekt. Noch besser mit einer Beobachtung: „es passiert, nachdem ich …\" — jede Handlung davor grenzt die Suche ein. Ich habe es am Ende ohne gefunden, aber über einen Umweg von zwei Stunden."
                }
            ],
            "arbeit": [
                {
                    "was": "E503 — Das eigene Formelheft liegt über dem Dokument, Knopf neben dem Fachzeichen",
                    "vonCommit": "b5ba8692",
                    "bisCommit": "8d6eaf27",
                    "zeitraum": "06:27 – 06:53",
                    "dauer": "ca. 26 min",
                    "pruefungen": "test471 (39 Zusagen)"
                },
                {
                    "was": "E504 — Der Glätter rechnet in Zeit statt in Messungen; der abgebrochene Handballen wird verworfen",
                    "vonCommit": "8d6eaf27",
                    "bisCommit": "bbd6ba24",
                    "zeitraum": "06:53 – 10:56",
                    "dauer": "ca. 4 h (mit der Dossier-Prüfung)",
                    "pruefungen": "test472 (21 Zusagen)"
                },
                {
                    "was": "E505 — CropBox und /Rotate endlich gefahren, Export-Hinweis sichtbar",
                    "vonCommit": "bbd6ba24",
                    "bisCommit": "9ecd6e9f",
                    "zeitraum": "10:56 – 11:10",
                    "dauer": "ca. 14 min",
                    "pruefungen": "test473 (35 Zusagen)"
                },
                {
                    "was": "E506 — Handschrift wird eine echte /Ink-Annotation statt Teil des Bildes",
                    "vonCommit": "9ecd6e9f",
                    "bisCommit": "748789dc",
                    "zeitraum": "11:10 – 11:34",
                    "dauer": "ca. 24 min",
                    "pruefungen": "test474 (30 Zusagen)"
                },
                {
                    "was": "E507 — Die Neigung des Stifts: der Bleistift schattiert",
                    "vonCommit": "748789dc",
                    "bisCommit": "d08e3610",
                    "zeitraum": "11:34 – 13:47",
                    "dauer": "ca. 2 h 13 min",
                    "pruefungen": "test475 (22 Zusagen)"
                },
                {
                    "was": "E508 — Der Blick in den Ordner kommt beim Hinschauen, die Blätter fächern als Welle",
                    "vonCommit": "d08e3610",
                    "bisCommit": "ef877973",
                    "zeitraum": "13:47 – 16:57",
                    "dauer": "ca. 3 h 10 min (mit der Hilfe beim lokalen Checkout)",
                    "pruefungen": "test476 (26 Zusagen)"
                },
                {
                    "was": "E509 + E510 — Der Leiterstift mit zehn Adern; die Mitte einer Linie zählt beim Kritzel-Löschen auch",
                    "vonCommit": "87e393de",
                    "bisCommit": "1858006d",
                    "zeitraum": "16:57 – 17:39",
                    "dauer": "ca. 42 min",
                    "pruefungen": "test477 (42 Zusagen), test439 von 34 auf 38"
                },
                {
                    "was": "E511 — Die Tinte holt die Spitze ein; vier Bewegungen, die etwas sagen",
                    "vonCommit": "1858006d",
                    "bisCommit": "bdd517f8",
                    "zeitraum": "17:39 – 21:21",
                    "dauer": "ca. 3 h 42 min",
                    "pruefungen": "test478 (43 Zusagen)"
                },
                {
                    "was": "E512 — Die Leiste wie GoodNotes: Stiftreihe, Laserpointer, vier Plätze — und die Fläche, die nicht mehr stirbt",
                    "vonCommit": "bdd517f8",
                    "bisCommit": "2f059f1d",
                    "zeitraum": "21:21 – 22:16",
                    "dauer": "ca. 55 min",
                    "pruefungen": "test479 (13 Zusagen), test480 (33 Zusagen)"
                }
            ],
            "zahlen": {
                "commits": 9,
                "entscheidungen": 10,
                "neuePruefungen": 10,
                "neueZusagen": 304,
                "arbeitszeit": "ca. 16 Stunden (06:27 bis 22:16)"
            },
            "groesstesProblem": "Die Zeichenfläche, die nach ein paar Minuten stirbt. Nicht weil sie schwer zu reparieren war — die Reparatur sind zwanzig Zeilen —, sondern weil die Vermutung so überzeugend falsch war. „Nach 5–6 Minuten\" klingt nach einer Uhr, und es gibt eine, die alle fünf Minuten läuft. Ich habe alle zehn Uhren der App einzeln ausgelöst: jede unschuldig. Auch dreissig Runden Zeichnen mit Seitenwechsel blieben grün. Erst als ich aufhörte, nach der ZEIT zu suchen, und fragte, was das Zeichnen überhaupt abschalten KANN, war es in zehn Minuten da: ein einziges verlorenes „abgehoben\", und die Kennung des führenden Zeigers steht für immer.",
            "interessantesteAnfrage": "Die zehn Adern. Nicht wegen der Technik — zehn Farben und zwei Strichmuster —, sondern weil fünf davon in der Norm stehen und fünf ich wählen sollte. „Für S (Lampendraht) sollst du eine passende Farbe finden\" ist ein Auftrag, der ein Urteil verlangt und nicht nur eine Ausführung. Die Begründung steht in E509: Orange, weil es warm ist wie das Licht, an dessen Ende der Draht hängt, und weil es der einzige Ton ist, der zwischen dem Braun von L1 und dem Gelb im Schutzleiter noch Platz hat.",
            "massnahmen": [
                {
                    "zeit": "06:27–06:53",
                    "was": "Neuer Merker `formelheft:*` in `meta` (Fenstergrösse, Lage, Ansicht, eigenes PDF).",
                    "warum": "Damit das Heft dort wieder aufgeht, wo es zuletzt stand.",
                    "risiko": "keins — neue Schlüssel, alte Daten unberührt"
                },
                {
                    "zeit": "10:56",
                    "was": "Der Glätter rechnet mit einer Zeitkonstante statt mit einem festen Anteil je Punkt.",
                    "warum": "Derselbe Filter war auf einem 240-Hz-Stift viermal schwächer als auf einem 60-Hz-Gerät.",
                    "risiko": "Ändert die FORM gespeicherter Striche nicht rückwirkend — nur neue Striche werden anders geglättet."
                },
                {
                    "zeit": "11:34",
                    "was": "Neues Feld `neigung` an Stiftmarken; `druckArt` sagt, ob der Druck gemessen oder gerechnet ist.",
                    "warum": "Der Bleistift soll schattieren, wenn man ihn flach hält.",
                    "risiko": "Alte Marken haben das Feld nicht und sehen aus wie immer — das war die Bedingung."
                },
                {
                    "zeit": "17:39",
                    "was": "Neues Feld `leiter` an Stiftmarken; neuer Merker `zeichnen:leiter`.",
                    "warum": "Ein Strich soll wissen, WELCHE Ader er ist — nicht nur, wie er aussieht.",
                    "risiko": "keins — zusätzlich zum vorhandenen `stil`"
                },
                {
                    "zeit": "22:16",
                    "was": "Neuer Merker `zeichnen:leistenlage` und `zeichnen:laser`.",
                    "warum": "Der Platz der Leiste und die Art des Lasers überleben das Schliessen.",
                    "risiko": "keins"
                }
            ]
        },
        {
            "datum": "2026-09-09",
            "wochentag": "Mittwoch",
            "titel": "Das Notizbuch, die nicht gefundene PDF, dieses Buch hier — und am Abend Redurs Marke",
            "wasIchWeiss": "Voller Wortlaut.",
            "nachrichten": [
                {
                    "zeit": "ca. 03:50",
                    "wortlaut": "speicher das alles im problemw.md hier kommt was für problemn gibt und wie wir das gelschtst habenen , dann ichh will das du eine ur.md erstelles und du dort alles spichert als eien 2 gehirn du muss deine arbeits wie du planst wie du problemn loscht und wie du arbeitets warum so oder nicht so alles dort speichern , alles was du über mich über websiet wirklich alles dort speichern , auch was ich dir schreiben solltes du dort speichern und auch genauer zeit raum genauer datum, und für jeden tag seperat, und was du in einem tag gemacht hast von welche commit bis welche wies viel stunden und alles dort speicher wie vielet tokenst du genutzt hats wie lange hat eine arbeit gedauert , was war das grösste problem , was war das interesanstse das ich wollte und so muss du noch mehr dort schreiben wirklich alles ausser code kommen nicht dort , ausser massnamhen dann welche daten du in welchen tag gändert hast usw alles mit genaue rzeit raum un dwieso und dann wenn ich dir schreiben kopiere meien satzt oder wörter 1:1 dort und unter dem das die satz verbessrung was konnte ich besser schreiben , auch bessere promt usw alles wirklich allte , mache es in einem genur struktur und es sollte auch im redion sichtbar sein wenn ich bei der redion im suche die Red-ur schrieben sollte dort direk die datensich öfnne aber mit zugangsts code 733877 und dort solltest du die graphy verwenden, 3D ansichten und so ist das deine arbeit für jetzzt aber mache das am ender wenn du nicht mehr zu tun hast",
                    "gemeint": "Zwei Dateien: PROBLEME.md (welche Probleme es gab und wie sie gelöst wurden) und UR.md als zweites Gehirn — Arbeitsweise, Planung, Begründungen, alles über Redur und die Webseite, seine Nachrichten 1:1 mit genauem Datum und Uhrzeit, pro Tag getrennt, mit Commits, Stunden, Token, Dauer, grösstem Problem, interessantester Anfrage, Satzverbesserungen und besseren Prompts, Massnahmen und geänderte Daten je Tag. Kein Code darin. In Redion sichtbar: die Suche nach „Red-ur\" öffnet die Daten hinter dem Code 733877, mit Graphen und 3D-Ansichten. Am Ende machen, wenn nichts anderes mehr ansteht.",
                    "besser": "Leg zwei Dateien an: PROBLEME.md mit allen Problemen und ihren Lösungen, und UR.md als zweites Gehirn. In UR.md soll alles stehen ausser Code: wie du planst, wie du Probleme löst, warum so und nicht anders, alles über mich und über die Webseite. Meine Nachrichten kommst du 1:1 hinein, mit genauem Datum und Uhrzeit, für jeden Tag getrennt. Dazu je Tag: von welchem Commit bis zu welchem, wie viele Stunden, wie viele Token, wie lange eine Arbeit gedauert hat, was das grösste Problem war und was die interessanteste Anfrage. Unter jedem meiner Sätze schreibst du, was ich besser hätte schreiben können, und einen besseren Prompt. Massnahmen und geänderte Daten je Tag mit Uhrzeit und Begründung. Alles in einer klaren Struktur. Und es soll in Redion sichtbar sein: wenn ich in der Suche „Red-ur\" eingebe, öffnen sich die Daten — mit dem Zugangscode 733877, mit Graphen und 3D-Ansichten. Mach das zum Schluss, wenn du sonst nichts mehr zu tun hast.",
                    "besserePrompt": "Der Auftrag war vollständig, und das ist selten. Zwei Dinge hätten ihn noch schärfer gemacht: (1) „Was soll passieren, wenn wir eines Tages zwanzig Tage darin haben — soll die Datei wachsen oder je Monat eine neue?\" (2) „Was ist der Code wert?\" — Ich habe ihn als Türschild gebaut, nicht als Schloss, und schreibe das auch so hin: der Quelltext ist öffentlich, wer ihn liest, findet die Zahl. Wenn es ein echtes Schloss sein soll, ist das ein anderer Bogen."
                },
                {
                    "zeit": "ca. 04:00",
                    "wortlaut": "Weiter",
                    "gemeint": "Weitermachen.",
                    "besser": "Mach weiter.",
                    "besserePrompt": "„Weiter mit X\" spart eine Rückfrage, wenn mehrere Dinge offen sind."
                },
                {
                    "zeit": "ca. 04:50",
                    "wortlaut": "Nehme die symbole. Für die redion bitte 1:1",
                    "gemeint": "Die Werkzeugzeichen aus dem mitgeschickten GoodNotes-Bild sollen Redions Zeichenleiste tragen — genau diese Sorte Zeichen, nicht ähnliche.",
                    "besser": "Nimm die Symbole aus dem Bild — dieselbe Strichstärke, dieselbe Farbe — und ersetze damit die Emoji in der Zeichenleiste.",
                    "besserePrompt": "„Ersetze in der Zeichenleiste jedes Emoji durch ein gezeichnetes Zeichen wie im Bild (gleiche Strichstärke, currentColor). Wo ein Buchstabe mehr sagt als ein Strich, sag mir welche und warum.\" — der zweite Satz spart die Rückfrage, was mit dem „Aa\" der Schriftart passieren soll."
                },
                {
                    "zeit": "ca. 06:50",
                    "wortlaut": "Wieter mit L139",
                    "gemeint": "Weiter mit der offenen Lücke L139 — der PDF, die angeblich die aktuelle kopiert.",
                    "besser": "Weiter mit L139.",
                    "besserePrompt": "Hier war nichts zu verbessern: die Nummer war die ganze Auskunft. Genau das ist der Nutzen von LUECKEN.md — zwei Wörter reichen, weil die Frage schon aufgeschrieben ist. Was gefehlt hätte, wenn es die Nummer nicht gäbe: welcher Knopf, in welcher Ansicht."
                },
                {
                    "zeit": "ca. 07:40",
                    "wortlaut": "öfnen eien nue branche und arbeite a jetzt dort und gebe mir immer nach jänder änderungen wie kann ich die aktuele github version auf laptop speichern",
                    "gemeint": "Einen neuen Zweig anlegen, ab jetzt dort arbeiten — und nach jeder Änderung dazusagen, wie der aktuelle Stand von GitHub auf den Laptop kommt.",
                    "besser": "Mach einen neuen Zweig und arbeite ab jetzt dort. Und sag mir nach jeder Änderung, wie ich den aktuellen Stand auf den Laptop hole.",
                    "besserePrompt": "Zwei Sätze statt einem, weil es zwei Aufträge sind — der zweite ist eine Dauerregel, kein einmaliger Wunsch. Und ein Name für den Zweig hätte eine Entscheidung gespart: „nenn ihn X\". Der zweite Teil hat übrigens einen echten Fehler aufgedeckt: es GING gar nicht, den Arbeitsstand zu holen."
                },
                {
                    "zeit": "ca. 08:30",
                    "wortlaut": "geb mir mmer im powerschell im windows die fertige befel o",
                    "gemeint": "Gib mir immer die fertigen PowerShell-Befehle für Windows — zum Kopieren, statt Anleitungen zum Klicken.",
                    "besser": "Gib mir die Befehle immer fertig für PowerShell unter Windows.",
                    "besserePrompt": "„Ich kopiere lieber Befehle, als zu klicken. Gib mir alles als fertige PowerShell-Zeile.\" — der Grund dazu spart die Rückfrage, ob die .bat-Dateien überhaupt noch gewollt sind. (Sie sind es: der Befehl ruft sie auf, weil in ihnen die Rettung steckt.)"
                },
                {
                    "zeit": "ca. 09:10",
                    "wortlaut": "wie kann ich wiessen ob meien github und laptop version gleich sind und ich weiss nich wo meien github ordner ist für BABAT Red schau mal es und gebe mir wie ich im termilan es hollen kann",
                    "gemeint": "Zwei Fragen, beide zu BABAT-RED: wie sehe ich, ob GitHub und Laptop gleich sind — und wo liegt der Ordner, beziehungsweise wie hole ich ihn im Terminal?",
                    "besser": "Für BABAT-RED: wie sehe ich, ob mein Laptop denselben Stand hat wie GitHub? Und ich finde den Ordner nicht — wie hole ich ihn im Terminal?",
                    "besserePrompt": "Das Projekt gehört an den ANFANG, nicht ans Ende. Hier stand es in der Mitte, und die erste Frage wurde deshalb auf Redion bezogen — Redur musste nachschieben: „nein ich meinte für babat red\". Ein Satz pro Frage hätte es auch getrennt."
                },
                {
                    "zeit": "ca. 09:20",
                    "wortlaut": "nein ich meinte für babat red nicht für redion",
                    "gemeint": "Beide Fragen galten BABAT-RED, nicht Redion.",
                    "besser": "Beides meinte ich für BABAT-RED.",
                    "besserePrompt": "Keine Verbesserung nötig — die Korrektur kam sofort und war eindeutig. Sie war nur nötig, weil das Projekt in der Nachricht davor zu spät stand."
                },
                {
                    "zeit": "ca. 09:05",
                    "wortlaut": "red-ion  das ist die neu [Cloudflare-Deploy-Protokoll] könntest du die claudeflare akusatiere von redion zur red-ion wechseln nur wo workerpache ist",
                    "gemeint": "Im Cloudflare-Deploy heisst der Worker red-ion, in wrangler.toml steht redion. Den Namen dort ändern — aber nur den Worker-Namen, nichts anderes.",
                    "besser": "Cloudflare nennt den Worker red-ion, wrangler.toml sagt redion. Ändere nur den Worker-Namen, nicht den Datenbanknamen.",
                    "besserePrompt": "Das „nur wo Workername ist\" war die wichtigste Angabe im Satz und stand am Ende — sie hat verhindert, dass auch database_name geändert wurde, was eine andere Datenbank gewesen wäre. Solche Einschränkungen gehören nach vorn. Das mitgeschickte Protokoll war goldrichtig: darin stand der eigentliche Fehler, nach dem er gar nicht gefragt hatte."
                },
                {
                    "zeit": "ca. 10:20",
                    "wortlaut": "pusche es auf eien neu branche al wenn eine brahce gepuscht ist muss du immer eien neu erstelle so ist besser",
                    "gemeint": "Push das auf einen neuen Zweig — und ab jetzt immer: sobald ein Zweig gepusht ist, einen neuen anlegen.",
                    "besser": "Push das auf einen neuen Zweig. Und ab jetzt bitte immer so: wenn ein Zweig gepusht ist, leg für die nächste Arbeit einen neuen an.",
                    "besserePrompt": "Der zweite Satz ist eine DAUERREGEL, der erste eine einmalige Bitte — getrennt geschrieben sind sie beide klarer. Und ein Wort zum Grund hätte geholfen („damit ich weiss, was in welchem Zweig steht\"); so musste ich ihn selbst erschliessen, und der Grund entscheidet, wie die Zweige heissen sollen."
                },
                {
                    "zeit": "ca. 17:10",
                    "wortlaut": "[Bild: eine schwarz-goldene Marke] Das"
                },
                {
                    "zeit": "ca. 17:55",
                    "wortlaut": "Was ist das alter sieht es wie auf dem bild aus"
                },
                {
                    "zeit": "ca. 18:10",
                    "wortlaut": "[Bild: das Symbol auf dem Startbildschirm, mit weissem Saum] Entferne die weiche rahmen ich will es nicht sehen"
                },
                {
                    "zeit": "ca. 18:30",
                    "wortlaut": "Pusche deien arbeite auf eien neu brache."
                },
                {
                    "zeit": "ca. 18:40",
                    "wortlaut": "[Bilder: die Apple-TV-Leiste und die Leiste von Redion] Könntets du die reduon unter teil wie erste bild machen mit undere inhalten und so wie appes das ich zwischen bereichen mit maus so wenn ich draus von links nach rechst oder umketerk dort gehe das es wie appe mir , jetzt ist bei redion nur wenn man klick kann man wechseln und ich will nicht nur so haben sondern kannst du so rund machen"
                },
                {
                    "zeit": "ca. 19:25",
                    "wortlaut": "[Bild: der Browserreiter mit dem roten R] hier ganz oben link habe ich die r logo wieder lösche es"
                },
                {
                    "zeit": "ca. 19:50",
                    "wortlaut": "cd $HOME\\Dokumente\\Redgit\\Redion / .\\holen.bat claude/redion-e527-schaltung — wieso redgit redion es legen die date nicht hier"
                },
                {
                    "zeit": "ca. 19:55",
                    "wortlaut": "C:\\Users\\redur\\Documents\\ChatGPT\\Redion\\Redion-src"
                }
            ],
            "arbeit": [
                {
                    "was": "E513 — Das Notizbuch fehlte im „Neu erstellen\"; die kopierte PDF gemessen und NICHT gefunden",
                    "vonCommit": "2f059f1d",
                    "bisCommit": "dc9bbcab",
                    "zeitraum": "22:16 – 04:12",
                    "dauer": "ca. 1 h 56 min (der grösste Teil davon die Suche nach der PDF)",
                    "pruefungen": "test265 um eine Zusage erweitert"
                },
                {
                    "was": "E514 — Die Chronik: PROBLEME.md, UR.md und die Ansicht in Redion",
                    "vonCommit": "dc9bbcab",
                    "bisCommit": "dd694ff7",
                    "zeitraum": "04:12 – 04:47",
                    "pruefungen": "test481",
                    "dauer": "ca. 35 min"
                },
                {
                    "was": "E515 — Die Zeichen der Leiste: vierunddreissig gezeichnete statt Emoji, und fünfundsiebzig Pixel, die niemand sah",
                    "vonCommit": "dd694ff7",
                    "bisCommit": "a33cceb1",
                    "zeitraum": "04:47 – 06:45",
                    "pruefungen": "test480 §5 neu (acht Zusagen); test351 war rot und ist wieder grün",
                    "dauer": "ca. 1 h 58 min"
                },
                {
                    "was": "E516 — L139 gefunden: der Import war nie kaputt, das Wort war es",
                    "vonCommit": "a33cceb1",
                    "bisCommit": "0f8f0a1c",
                    "zeitraum": "06:45 – 07:35",
                    "pruefungen": "test482 neu, 28 Zusagen",
                    "dauer": "ca. 50 min"
                },
                {
                    "was": "E517 — Ein Zweig statt main: der Arbeitsstand kommt auf den Laptop",
                    "vonCommit": "0f8f0a1c",
                    "bisCommit": "9812d8a8",
                    "zeitraum": "07:35 – 08:25",
                    "pruefungen": "test353 von 60 auf 81 Zusagen",
                    "dauer": "ca. 50 min"
                },
                {
                    "was": "E518 — Die fertigen PowerShell-Befehle stehen im Verzeichnis, nicht im Gespräch",
                    "vonCommit": "9812d8a8",
                    "bisCommit": "42cf96ba",
                    "zeitraum": "08:25 – 09:05",
                    "pruefungen": "test353 von 81 auf 88 Zusagen",
                    "dauer": "ca. 40 min"
                },
                {
                    "was": "E519 — Der Vergleich sieht gegen deinen Zweig, nicht gegen main",
                    "vonCommit": "42cf96ba",
                    "bisCommit": "9db488d0",
                    "zeitraum": "09:05 – 09:40",
                    "pruefungen": "test353 von 88 auf 105 Zusagen",
                    "dauer": "ca. 35 min"
                },
                {
                    "was": "E520 — Der Worker heisst red-ion, und ein Zeugnis lag im Netz",
                    "vonCommit": "9db488d0",
                    "bisCommit": "db27ad64",
                    "zeitraum": "09:40 – 10:15",
                    "pruefungen": "test270 von 63 auf 74 Zusagen",
                    "dauer": "ca. 35 min"
                },
                {
                    "was": "E521 — Ein Zweig, ein Push, dann ein neuer Zweig",
                    "vonCommit": "db27ad64",
                    "bisCommit": "(dieser Bogen)",
                    "zeitraum": "ab 10:15",
                    "pruefungen": "keiner — eine Arbeitsregel, kein Verhalten der App"
                },
                {
                    "was": "E522 / E522b / E523b — Der volle Lauf: D1 stillgelegt, und drei veraltete Zahlen in Prüfläufen",
                    "vonCommit": "741ae0b1",
                    "bisCommit": "d935341e",
                    "zeitraum": "09:44 – 10:11",
                    "dauer": "ca. 27 min",
                    "pruefungen": "test65, test86, test114, test210 — vier Zusagen derselben Art, alle seit einem früheren Bogen rot"
                },
                {
                    "was": "E524 — Ein fehlender Schrägstrich, und die Chronik wäre im Netz tot gewesen",
                    "vonCommit": "d935341e",
                    "bisCommit": "3a5c6ad2",
                    "zeitraum": "10:11 – 17:02",
                    "dauer": "ca. 20 min Arbeit im Bogen (der Rest des Zeitraums ohne Sitzung)",
                    "pruefungen": "der Ausschluss-Prüflauf aus E520, gegen den echten Ordnerinhalt"
                },
                {
                    "was": "E525 — Redurs Marke, aus einer Quelle gerechnet: 24 Dateien statt 18 Stellen, favicon.ico eingeschlossen",
                    "vonCommit": "3a5c6ad2",
                    "bisCommit": "c0430422",
                    "zeitraum": "17:02 – 17:54",
                    "dauer": "ca. 52 min",
                    "pruefungen": "test483, 25 Zusagen, Gegenprobe rot gesehen"
                },
                {
                    "was": "E525 nachgezogen — der Lichtsaum am Rand ist weg, ohne neu zu schneiden",
                    "vonCommit": "c0430422",
                    "bisCommit": "ebd8e4f8",
                    "zeitraum": "17:54 – 18:23",
                    "dauer": "ca. 29 min",
                    "pruefungen": "am Bild geprüft; die Randdeckung gemessen: 228 → 16"
                },
                {
                    "was": "E526 — Die untere Leiste ist eine Kapsel, und man wischt zwischen den Bereichen",
                    "vonCommit": "ebd8e4f8",
                    "bisCommit": "6347ac43",
                    "zeitraum": "18:23 – 19:16",
                    "dauer": "ca. 53 min",
                    "pruefungen": "test484 (31 Zusagen), test37 und test141 nachgezogen"
                },
                {
                    "was": "E527 — Die Einzeldatei trägt ihr Reitersymbol selbst",
                    "vonCommit": "6347ac43",
                    "bisCommit": "fd418b84",
                    "zeitraum": "19:16 – 19:43",
                    "dauer": "ca. 27 min",
                    "pruefungen": "test483 um zwei Zusagen erweitert, Gegenprobe rot gesehen"
                }
            ],
            "zahlen": {
                "commits": 15,
                "entscheidungen": 15
            },
            "groesstesProblem": "Nicht ein Fehler, sondern eine Kette: Redur fragte nach dem Worker-Namen, und im mitgeschickten Protokoll lagen zwei Dinge, nach denen er nicht gefragt hatte — der echte Deploy-Fehler und ein Zeugnis, das im Netz lag. Das teuerste Muster des Tages war, dass mehrere Werkzeuge richtig rechneten und die falsche Frage beantworteten: vergleichen.bat gegen main, die drei Import-Messungen aus E513, die Ausschlussliste aus E270. Jedes war korrekt und keines war brauchbar.\n\nAM ABEND kam ein zweites dazu, und es war ein Fehler im Fehler: der Ausschnitt der neuen Marke. Der erste Schnitt lag am undurchsichtigen Kern statt an der Kachelkante und verzerrte die Marke ins Quadrat — Redur sah es sofort („sieht es wie auf dem bild aus\"). Der zweite Schnitt sass, nahm aber den weichen Saum mit, und auf dem Startbildschirm wurde daraus ein weisser Rahmen um eine schwarze Kachel. Beide Male hatte Redur recht, und beide Male hätte kein Prüflauf es finden können. Dazu ein Messfehler, den nur das Bild zeigte: der Verkleinerer teilte durch die falsche Zahl, und JEDES verkleinerte Symbol war weissgebrannt — nur das 512er, das gar nicht verkleinert wird, sah richtig aus.",
            "interessantesteAnfrage": "„wenn eine branche gepuscht ist musst du immer eine neue erstellen, so ist besser\" — eine Arbeitsregel, die aus dem Gebrauch kommt, nicht aus einem Lehrbuch. Redur hat gemerkt, was ihm beim Holen fehlte: ein Zweigname, der sagt, was darin steht. Zwei Bögen zuvor hatte er das Holen bekommen; jetzt kam die Regel, die es erst brauchbar macht.\n\nAm Abend dann die Leiste: „kannst du so rund machen\" und „jetzt ist bei redion nur wenn man klick kann man wechseln\". Zwei Sätze, zwei Arbeiten — eine Kapsel und eine Wischgeste. Der Kern der Geste ist ein Satz: sie sucht den nächsten Reiter und DRÜCKT IHN. Damit gilt für den zweiten Bedienweg automatisch alles, was für den ersten gilt; eine eigene Navigationslogik daneben wäre ein zweiter Katalog gewesen (§8).",
            "massnahmen": [
                {
                    "zeit": "04:12",
                    "was": "`Notebook.createNotebook` nach aussen gegeben.",
                    "warum": "Damit „Neu erstellen\" ein Notizbuch anlegen kann, ohne eine zweite Anlege-Maschine zu bauen.",
                    "risiko": "keins — dieselbe Funktion, ein zweiter Aufrufer"
                },
                {
                    "zeit": "05:10",
                    "was": "Vierunddreissig Zeichen in `Register.symbole` ergänzt; die Leiste nennt nur noch ihren Namen.",
                    "warum": "Ein zweiter Zeichensatz in der PDF-Fläche wäre nach dem zweiten Durchgang verschieden, und niemand hätte gemerkt, welcher gilt (§8).",
                    "risiko": "keins an Daten — Oberfläche; die vier Stellen, die ihr Markup neu schreiben, mussten das Malen wiederholen"
                },
                {
                    "zeit": "05:40",
                    "was": "Polsterung der Werkzeugknöpfe 9 → 7 px, Abstand zum Wort 5 → 4 px, Zeichen neben einem Wort 18 → 16 px.",
                    "warum": "Gemessen: mit Wort brauchten die dreizehn Werkzeuge 1190 px von 1168 vorhandenen. Danach 1099 — eine Zeile, 69 px Luft. Wo kein Wort steht, bleibt das Zeichen 18 px, in der Seitenspalte 20.",
                    "risiko": "keins an Daten; die 44-px-Trefffläche hängt an der Höhe, nicht an der Polsterung (§37)"
                },
                {
                    "zeit": "06:20",
                    "was": "Fueller, Kugelschreiber und Zettel neu gezeichnet — nicht an der Spitze, sondern am Umriss.",
                    "warum": "Gemessen: die drei Stifte teilten bis zu 73 % ihrer Tinte bei 16 px. Der erste Versuch mit schärferen Spitzen machte es schlimmer (85 %), weil bei dieser Grösse der Schaft die ganze Tinte trägt. Jetzt: Feder, aufrechter Kugelschreiber, schräger Bleistift — drei Umrisse.",
                    "risiko": "keins an Daten — Oberfläche"
                },
                {
                    "zeit": "07:05",
                    "was": "Die Karte „Weiterarbeiten\" heisst „Weiterlesen\"; beide Importknöpfe heissen „PDF öffnen\".",
                    "warum": "Sichtbar waren im Regal zwei Knöpfe: „PDF öffnen\" holte die zuletzt geöffnete PDF zurück, „PDF importieren\" las eine neue ein. Wer eine PDF öffnen will, drückt „PDF öffnen\" — und bekommt seine aktuelle.",
                    "risiko": "keins an Daten — nur Beschriftung; die Handlungen dahinter sind unverändert"
                },
                {
                    "zeit": "07:20",
                    "was": "Der Importeur beschriftet den Knopf über ein Wortfeld statt über `textContent`.",
                    "warum": "`textContent` wirft die Kindknoten weg, und dort hängt seit E515 das gezeichnete Zeichen. Nach dem ersten Import stand der Knopf ohne Zeichen da — für den Rest der Sitzung, weil er fest in der Startseite steht.",
                    "risiko": "keins an Daten — Oberfläche"
                },
                {
                    "zeit": "07:45",
                    "was": "Neuer Zweig `claude/redion-goodnotes-weiter`, ab hier wird dort gearbeitet.",
                    "warum": "Redur hat darum gebeten. Der alte Zweig bleibt liegen, nichts wird umgeschrieben.",
                    "risiko": "keins — der neue Zweig beginnt genau auf dem Stand des alten"
                },
                {
                    "zeit": "08:05",
                    "was": "`holen.bat` nimmt einen Zweignamen; `holen-zweig.bat` fragt danach.",
                    "warum": "Der Arbeitsstand war vom Laptop aus nicht erreichbar: holen.bat holt main, main steht still bis zum grünen Gesamtlauf, gearbeitet wird auf einem Zweig. Ohne Angabe bleibt es main — wer doppelklickt, soll den geprüften Stand bekommen.",
                    "risiko": "gering, aber genau die Stelle aus E271: ein vergessener origin/main meldet Erfolg und wirft Arbeit weg. Sechs Stellen einzeln geprüft, die Folge in einem echten Repo nachgefahren."
                },
                {
                    "zeit": "08:40",
                    "was": "Die fertigen PowerShell-Befehle in START-MIT-CLAUDE-CODE.md geschrieben, mit einem Wächter dafür.",
                    "warum": "Ein Befehl, der nur im Gespräch steht, ist morgen weg. Und der Alltagsbefehl ruft holen.bat statt git checkout: das kurze git checkout überspränge die ganze Rettung.",
                    "risiko": "keins an Daten; die git-Folge wurde vorher in einem echten Repo gefahren, nicht abgeschrieben"
                },
                {
                    "zeit": "08:55",
                    "was": "Benutzerpfad aus START-MIT-CLAUDE-CODE.md und SERVER-EINRICHTEN.md entfernt.",
                    "warum": "Ein ausgeschriebener Benutzerpfad stimmt auf keinem zweiten Rechner und gehört nicht in ein offenes Verzeichnis. Die drei in ENTSCHEIDUNGEN.md, UR.md und im Audit bleiben: das sind Protokolle.",
                    "risiko": "keins"
                },
                {
                    "zeit": "09:30",
                    "was": "`vergleichen.bat` vergleicht gegen den Zweig, auf dem der Ordner steht.",
                    "warum": "Seit E517 kann ein Arbeitszweig geholt werden; der Vergleich sah weiter fest gegen main und meldete hunderte Unterschiede, die keine sind. Die Vorgabe ist absichtlich eine andere als bei holen.bat: das eine ändert den Ordner (sichere Wahl), das andere sieht nur nach (ehrliche Wahl).",
                    "risiko": "keins — das Skript schreibt weiterhin nichts ausser fetch; sieben git-Stellen einzeln geprüft"
                },
                {
                    "zeit": "09:50",
                    "was": "Worker-Name in wrangler.toml von redion auf red-ion; database_name bleibt redion.",
                    "warum": "Cloudflare hat das Projekt red-ion genannt und überschrieb den Namen bei jedem Bau mit einer Warnung. Eine Warnung, die immer kommt, verdeckt die daneben — genau das war passiert.",
                    "risiko": "keins — Wrangler benutzte ohnehin red-ion; jetzt steht es auch so da"
                },
                {
                    "zeit": "10:05",
                    "was": "Persönliche PDF, Schul Inhalt, chronik/, quell/entwicklung/ und .gitattributes in .assetsignore aufgenommen.",
                    "warum": "Sie standen im Upload-Protokoll und waren damit im Netz abrufbar. Fünf Megabyte Zeugnis unter einer ratbaren Adresse.",
                    "risiko": "keins — GELÖSCHT WURDE NICHTS (§43); die Dateien liegen unverändert im Verzeichnis und gehen nur nicht mehr mit ins Netz"
                },
                {
                    "zeit": "10:25",
                    "was": "Neuer Zweig `claude/redion-cloudflare-l143`; die Regel in CLAUDE.md §43 aufgenommen.",
                    "warum": "Redurs Regel. Der Grund dahinter: ein Zweig, auf den immer weiter geschoben wird, verliert seinen Namen — sechs Bögen lagen unter einem Namen, der nur den ersten beschreibt.",
                    "risiko": "keins — der alte Zweig bleibt unangetastet, der neue beginnt auf seinem Stand; nachgemessen mit einem leeren git diff"
                },
                {
                    "zeit": "17:48",
                    "was": "`oeffentlich/icons/marke.png` als einzige Quelle; `erzeugen.mts` rechnet daraus 24 Dateien, `favicon.ico` eingeschlossen.",
                    "warum": "Das rote R stand an achtzehn Stellen, und die achtzehnte hatte gar keinen Erzeuger — die .ico war von Hand gebaut und wäre als einzige übriggeblieben.",
                    "risiko": "keins an Daten — Oberfläche; der Erzeuger liest jetzt selbst PNG (Signatur, Blöcke, zlib, fünf Zeilenfilter) statt eine Abhängigkeit zu holen"
                },
                {
                    "zeit": "18:23",
                    "was": "Der äussere Ring der Marke verliert seine FARBE, behält seine Deckung.",
                    "warum": "Redur: „Entferne die weiche rahmen\". Ein engerer Schnitt hätte den Saum mitgenommen, aber die Marke wieder vergrössert und verschoben — der Fehler des ersten Anlaufs.",
                    "risiko": "keins — gemessen über eine Distanztransformation auf dem Alphakanal, Randdeckung 228 → 16"
                },
                {
                    "zeit": "19:16",
                    "was": "Neue Datei `quell/schale/aufbau/wischen.ts`; die untere Leiste schwebt als Kapsel.",
                    "warum": "Redurs zwei Sätze zur Apple-TV-Leiste. Der Radius wird aus `--mobile-nav-height` gerechnet statt als Zahl wiederholt — bei 60 px Höhe wären 20 px nur abgerundete Ecken, keine Kapsel.",
                    "risiko": "keins an Daten; die Geste ist gesperrt über waagerecht rollenden Dingen, beim Zeichnen und im Dokument, und §28 verlangte zwei Einträge: das <script> in index.html UND die Zeile im GRUNDSTOCK"
                },
                {
                    "zeit": "19:43",
                    "was": "`bauen.mts` setzt die Symbolbytes als Data-URL in die Einzeldatei ein und wirft, wenn eine Datei fehlt.",
                    "warum": "Die Einzeldatei hat keinen Ordner neben sich (§29) und hatte damit gar kein Reitersymbol — was ein Reiter ohne Zeichen zeigt, entscheidet der Browser: meist das zuletzt gemerkte, also weiter das alte R aus dem Zwischenspeicher.",
                    "risiko": "keins — die Einzeldatei wächst um die Symbolbytes; das Werfen bei fehlender Datei ist Absicht, ein stiller Verweis ins Leere war ja der Fehler"
                }
            ]
        },
        {
            "datum": "2026-09-10",
            "wochentag": "Donnerstag",
            "titel": "Ein einziger Push von Redur — die Bewegungsschicht kommt von aussen",
            "wasIchWeiss": "Nur die Commits. Von diesem Tag liegt mir kein Gespräch vor.",
            "nachrichten": [],
            "arbeit": [
                {
                    "was": "„Aktuelle Website-Version\" — Redur hat einen Stand von aussen eingespielt, in dem `src/schale/bedienung/motion.ts` (+105 Zeilen) und die Bewegungsschicht neu dazukamen",
                    "vonCommit": "fd418b84",
                    "bisCommit": "0ca95cda",
                    "zeitraum": "18:14",
                    "dauer": "unbekannt — ich war an diesem Tag nicht beteiligt",
                    "pruefungen": "keine von mir gefahren"
                }
            ],
            "zahlen": {
                "commits": 1,
                "entscheidungen": 0
            },
            "groesstesProblem": "Keines, das ich gesehen hätte. Der Tag steht hier, damit die Kette der Commits keine Lücke hat: 21 Dateien, 1460 neue Zeilen, und darin die Bewegungsschicht, auf der zwei Tage später E528 bis E535 aufsetzen. Wer später fragt, woher `motion.ts` kommt, findet es hier und nicht bei mir.",
            "interessantesteAnfrage": "Keine — an diesem Tag kam keine Nachricht.",
            "massnahmen": []
        },
        {
            "datum": "2026-09-12",
            "wochentag": "Samstag",
            "titel": "Redurs CSS-Sammlung, dann Office: fünf Bögen Animation, vier Bögen Word und PowerPoint — und zwei eigene Fehler",
            "wasIchWeiss": "Voller Wortlaut.",
            "nachrichten": [
                {
                    "zeit": "ca. 14:30",
                    "wortlaut": "[angehängt: redion_animationen_code.css, 5396 Zeilen] schau mal die aktuele github status und die letzt branche die gemerk wurde und arbeite an redion selbständig weiter und folgende in anhang findes du eine css date die ist mehreren coden für die animationen, anischt, usw dort und du musss ales im redion einsetzen und dabei wirklich alles ich will das du es in passenden orten nutzst"
                },
                {
                    "zeit": "ca. 15:20",
                    "wortlaut": "[Bild der KI-Knöpfe] hier bei ai butons war vorher statt lich eine blur efcek und codex hat das entfernt kannst du das wieder zürück bringen bite"
                },
                {
                    "zeit": "ca. 15:55",
                    "wortlaut": "ich will redion so haben ohne admin zustimmung nimant kann die webseite rein kommen geht so was , und nicht mehr ohne konto oder wo was"
                },
                {
                    "zeit": "ca. 16:00",
                    "wortlaut": "eigenes tor auch jetzt aber zuerst mache die animationen fertig und dann das"
                },
                {
                    "zeit": "ca. 16:05",
                    "wortlaut": "ich will das meien pdf auf meien konto speichern wird egal auf welche gärer ich einloge könntets du das machen und ohne konnto sollte wir mehr die redion nicht nutzen."
                },
                {
                    "zeit": "ca. 16:20",
                    "wortlaut": "es sollte nichti im konto redbbt7 sein"
                },
                {
                    "zeit": "ca. 16:40",
                    "wortlaut": "mach weiter mit den animationen und pusche auf github wenn du fertig bist."
                },
                {
                    "zeit": "ca. 17:10",
                    "wortlaut": "Hast du alle animationen erledigt? Oder ist noch etwas offen"
                },
                {
                    "zeit": "ca. 17:45",
                    "wortlaut": "baue e s so schne wie möglich alles ohne viel test machen"
                },
                {
                    "zeit": "ca. 20:25",
                    "wortlaut": "Erneut versuchen"
                },
                {
                    "zeit": "ca. 20:26",
                    "wortlaut": "weiter schau mal dir die aktuele letzte branche an und arbeite weiter"
                },
                {
                    "zeit": "ca. 20:27",
                    "wortlaut": "3c7da426eded4acfbcd4387fb3fc9ba449d6e9cd es ist das"
                },
                {
                    "zeit": "ca. 20:35",
                    "wortlaut": "alter schreibst du noch etwas im UR.md oder"
                },
                {
                    "zeit": "ca. 20:40",
                    "wortlaut": "[angehängt: loader_.css und redion_animationen_code.css] bie der ai butons war die bulur efeck nicht so es war so es die blur kommen von link bis nach rechts ohen so bumm efeck oder licht es war ganz wenig licht schau mal ob du die code hier findest"
                },
                {
                    "zeit": "ca. 21:00",
                    "wortlaut": "mach weiter mit den restlichen animationen und pusche"
                },
                {
                    "zeit": "ca. 21:05",
                    "wortlaut": "könntets du die redmme akustaieren weil es passt nicht zur aktuele stand"
                },
                {
                    "zeit": "ca. 21:15",
                    "wortlaut": "du muss jetzt mir eine promt gebe für die andere claude code das er nur an den elektro teil arbeitet und die Redur_Babat_FZ_MOE_Lehrpersonen.pdf anchaut und mir die simliation verbessert so wie echt 1:1 , dann ich will das er genau wie echte leben l1,l2,l3 , n usw alle leitung dort einfügen kann, dann die stromrichtungen, wenn etwas falscht angeschlossen wird mir die fehler zeigen, dann ich will das man so und er muss nur an dieser teil arbeiten und auf eine nue brache"
                },
                {
                    "zeit": "ca. 21:30",
                    "wortlaut": "ich will das redion auch die anderen datein auch öfnnen kann z.B. word und powerpoint daten , und dort direk wie die pdf bearbeiten kann und so die pdf , word, oder powerpoint daten auch direk bearbeiten kann aber wichtig die orginal date wird immer geschütze"
                },
                {
                    "zeit": "ca. 21:35",
                    "wortlaut": "beides, drauf schreiben und text ändern und so bei der powerpoint daten willl ich es 1:1 wie powerpoint haben die daten ändern so wie powerpoint eine präsentation erstellen, 1:1 wie powerpoint"
                },
                {
                    "zeit": "ca. 22:00",
                    "wortlaut": "mach du weiter mit den office teil o2"
                },
                {
                    "zeit": "ca. 22:20",
                    "wortlaut": "ja mach o3"
                },
                {
                    "zeit": "ca. 22:48",
                    "wortlaut": "[angehängt: Band_1_Kapitel_4_….ppsx] du kannst das als vorlagen immer nutzen"
                },
                {
                    "zeit": "ca. 22:55",
                    "wortlaut": "könntets wir so mit viedeo efeckt, wenn ich klicke die antwort zeig auch so haben das es die orginale 1:1 öfnnet"
                },
                {
                    "zeit": "ca. 23:00",
                    "wortlaut": "[Bildschirmfoto der Originalfolie] also im orginale daten ist es schonso"
                },
                {
                    "zeit": "ca. 23:10",
                    "wortlaut": "wie kann ich im redio die daten hochladen ?"
                },
                {
                    "zeit": "ca. 23:35",
                    "wortlaut": "mach weiter mit den folien klick"
                },
                {
                    "zeit": "ca. 01:15",
                    "wortlaut": "Weiter ohne pause"
                },
                {
                    "zeit": "ca. 03:30",
                    "wortlaut": "Weiter mit den folieneditor"
                },
                {
                    "zeit": "ca. 04:50",
                    "wortlaut": "Könntest du so eine powerpoint modus im menü einfügen wenn ich das klicke sollte 1:1 wie powerpoint sein oben mit menü, link seiten so das ich präsentaioton erstellen könnne, füge dort auch fertigen vorlagen"
                },
                {
                    "zeit": "ca. 06:20",
                    "wortlaut": "mach weiter mit den menüband"
                },
                {
                    "zeit": "ca. 10:30",
                    "wortlaut": "weiter ohne pause"
                },
                {
                    "zeit": "ca. 12:20",
                    "wortlaut": "weiter mache gleich wie powerpoint"
                },
                {
                    "zeit": "ca. 14:30",
                    "wortlaut": "[Bildschirmfoto des Folienbands] das hier gefelt mir nich die farben, usw es sollte wie die redion farben sein wenn ich die fraben ändere sollte das auch sich ändern und verbesser für die pptx öfnnen und wenn ich die gelbe antworten klicke geht es weiter und zeigt mir nicht die antwort"
                }
            ],
            "arbeit": [
                {
                    "was": "E528 — Die Unschärfe an den KI-Knöpfen ist zurück: drei Zeilen hatten den Originaleffekt überschrieben",
                    "vonCommit": "66ca1e03",
                    "bisCommit": "da61d47b",
                    "zeitraum": "13:36 – 15:33",
                    "dauer": "ca. 1 h 57 min",
                    "pruefungen": "test494 — der Wächter gegen Endlosschleifen im Leerlauf war beim ersten Versuch zu Recht rot"
                },
                {
                    "was": "E529 — Glühfaden und Kartenring: zwei Einträge der Wirkungstabelle hatten gar kein Element",
                    "vonCommit": "da61d47b",
                    "bisCommit": "2689320b",
                    "zeitraum": "15:33 – 15:50",
                    "dauer": "ca. 17 min",
                    "pruefungen": "test495, 16 Zusagen, Gegenprobe rot gesehen (acht Zusagen)"
                },
                {
                    "was": "E530 — L143 stand kopf: die D1-Datenbank gibt es, nur im falschen Konto",
                    "vonCommit": "2689320b",
                    "bisCommit": "5621ad66",
                    "zeitraum": "15:50 – 16:06",
                    "dauer": "ca. 16 min",
                    "pruefungen": "keine — eine Berichtigung in LUECKEN.md, kein Code"
                },
                {
                    "was": "E531 — Der Barcode entsteht beim Drucken, der Ring rahmt die Kennzahl",
                    "vonCommit": "5621ad66",
                    "bisCommit": "6ad7bf4f",
                    "zeitraum": "16:06 – 16:34",
                    "dauer": "ca. 28 min",
                    "pruefungen": "test495 auf 25 Zusagen erweitert"
                },
                {
                    "was": "Bestandsaufnahme: dreizehn Agenten belegen jeden Vorlagenblock einzeln gegen den Code",
                    "vonCommit": "6ad7bf4f",
                    "bisCommit": "6ad7bf4f",
                    "zeitraum": "17:10 – 17:30",
                    "dauer": "ca. 20 min",
                    "pruefungen": "keine — eine Messung: 191 Wirkungen, 42 gebaut, 51 nur Motiv, 98 fehlen"
                },
                {
                    "was": "E532 — Vier Regeln, die geschrieben und nie gesehen wurden: Glasknopf, Pflegekarte, Regler-Knauf, Funkel-Abstufung",
                    "vonCommit": "6ad7bf4f",
                    "bisCommit": "f1eca227",
                    "zeitraum": "17:30 – 17:37",
                    "dauer": "ca. 1 h 07 min",
                    "pruefungen": "keiner — Redurs Entscheidung E533, als L149 eingetragen"
                },
                {
                    "was": "E533 — Redurs Entscheidung: alles bauen, ohne viel Prüfung. Der erste Bauanlauf mit zehn Agenten starb geschlossen am Sitzungslimit",
                    "vonCommit": "f1eca227",
                    "bisCommit": "f1eca227",
                    "zeitraum": "17:45 – 20:20",
                    "dauer": "ca. 10 min bis zum Abbruch, danach Wartezeit",
                    "pruefungen": "keine — es entstand kein Code"
                },
                {
                    "was": "E534 — aus einer anderen Sitzung: Statistikherz, Ticket-Wendekarte, und der gemessene Beweis, dass mein Glasknopf-Fix nicht wirkte",
                    "vonCommit": "ad4ccbc7",
                    "bisCommit": "3c7da426",
                    "zeitraum": "19:43 – 20:23",
                    "dauer": "nicht von mir gefahren",
                    "pruefungen": "test496, 148 Zusagen, zuerst rot gesehen"
                },
                {
                    "was": "Zwei Berichtigungen: E533 beschrieb einen Bau, den es nicht gab; dazu der Nachtrag zu E532",
                    "vonCommit": "3c7da426",
                    "bisCommit": "a95de06f",
                    "zeitraum": "20:23 – 20:29",
                    "dauer": "ca. 6 min",
                    "pruefungen": "keine — nur Dokumentation"
                },
                {
                    "was": "Die Chronik holt drei Tage nach — und trägt zwei eigene Fehler ein (P21, P22)",
                    "vonCommit": "a95de06f",
                    "bisCommit": "a358602e",
                    "zeitraum": "20:29 – 20:36",
                    "dauer": "ca. 7 min",
                    "pruefungen": "keine — nur Chronik"
                },
                {
                    "was": "Zwei Funde neben den Animationen: 34 px auf einem Hauptweg, und ein Schalter, der nur Farbe war (§37, §38)",
                    "vonCommit": "a358602e",
                    "bisCommit": "e2ccf85c",
                    "zeitraum": "20:36 – 20:44",
                    "dauer": "ca. 8 min",
                    "pruefungen": "eigener Lauf, Gegenprobe rot gesehen"
                },
                {
                    "was": "CLAUDE.md zählte 323 Prüfläufe — es sind 438; dazu §5 Regel 1 ohne Wächter (L150) und ein falsches „Strg P“",
                    "vonCommit": "e2ccf85c",
                    "bisCommit": "d4d4c792",
                    "zeitraum": "20:44 – 20:56",
                    "dauer": "ca. 12 min",
                    "pruefungen": "keine — Zählung und Doku"
                },
                {
                    "was": "E536 — Die Unschärfe läuft wieder von links nach rechts: --rmo-delay lag nur auf .rmo-letter, die KI-Knöpfe tragen .ru-funkel-b",
                    "vonCommit": "d4d4c792",
                    "bisCommit": "7d784413",
                    "zeitraum": "20:56 – 21:05",
                    "dauer": "ca. 9 min",
                    "pruefungen": "gemessen im Hover, nicht in Ruhe — in Ruhe ist die Verzögerung immer 0"
                },
                {
                    "was": "Die README stimmte an 48 Stellen nicht — geprüft, nicht überflogen",
                    "vonCommit": "7d784413",
                    "bisCommit": "be80624c",
                    "zeitraum": "21:05 – 21:06",
                    "dauer": "ca. 20 min",
                    "pruefungen": "keine — jede Zusage gegen den Code nachgesehen"
                },
                {
                    "was": "E535 und E537 — die zehn restlichen Vorlagenblöcke, als Fragmente gebaut und zusammengeführt",
                    "vonCommit": "be80624c",
                    "bisCommit": "1fe4b553",
                    "zeitraum": "21:06 – 21:38",
                    "dauer": "ca. 32 min",
                    "pruefungen": "test495 auf den neuen Trommelbau umgeschrieben; das Bild fand die 595 px breite Lampe, die kein Lauf sah"
                },
                {
                    "was": "E538 — O1: Office war die einzige Gruppe ohne Originalschutz; die eingelesene Datei hängt jetzt an Platz 0",
                    "vonCommit": "1fe4b553",
                    "bisCommit": "d1f8e955",
                    "zeitraum": "21:38 – 21:52",
                    "dauer": "ca. 14 min",
                    "pruefungen": "test497 neu, 16 Zusagen, Gegenprobe rot gesehen"
                },
                {
                    "was": "E539 — O2: der ZIP-Teil lernt Durchreichen; rohe Bytes werden nie neu gepackt",
                    "vonCommit": "d1f8e955",
                    "bisCommit": "be69acb8",
                    "zeitraum": "21:52 – 22:18",
                    "dauer": "ca. 26 min",
                    "pruefungen": "test498 neu, 11 Zusagen — die erste Fassung blieb grün, weil sie nur das Verzeichnis las"
                },
                {
                    "was": "E540 — O3: PowerPoint lesen, und eine Folie ist ein Blatt",
                    "vonCommit": "be69acb8",
                    "bisCommit": "28e0aa28",
                    "zeitraum": "22:18 – 22:45",
                    "dauer": "ca. 27 min",
                    "pruefungen": "test499 neu, 17 Zusagen; die Reihenfolgenfalle sprang erst im zweiten Anlauf"
                },
                {
                    "was": "E541 — vier Funde aus Redurs echter .ppsx: unbekannte Endung, 27-fach abgelegtes Logo, Kopfzeile als Titel, 662 ms",
                    "vonCommit": "28e0aa28",
                    "bisCommit": "f6ed8fb8",
                    "zeitraum": "22:45 – 22:53",
                    "dauer": "ca. 8 min",
                    "pruefungen": "test499 auf 22 Zusagen"
                },
                {
                    "was": "E542 — Die Antworten waren alle offen: PowerPoints Ausblend-Animationen werden zu Redions Abdeckband",
                    "vonCommit": "f6ed8fb8",
                    "bisCommit": "811db626",
                    "zeitraum": "22:53 – 23:02",
                    "dauer": "ca. 9 min",
                    "pruefungen": "test499 bleibt 22; die Deckelfarbe wird seit 811db626 aus dem Verlauf gelesen statt geraten"
                },
                {
                    "was": "E543 — Der Wähler verschwieg, was der Einleser längst kann: Redurs Frage nach dem Hochladen fand den unsichtbaren Weg",
                    "vonCommit": "811db626",
                    "bisCommit": "(dieser Bogen)",
                    "zeitraum": "23:10 – 23:30",
                    "dauer": "ca. 20 min",
                    "pruefungen": "test497 §3 neu, von 20 auf 31 grün, sechs Zusagen zuerst rot gesehen"
                },
                {
                    "was": "E544 — Ein Blatt füllt eine Folie, und der Klick schaltet sie weiter (L153 geschlossen)",
                    "vonCommit": "(nach E543)",
                    "bisCommit": "(dieser Bogen)",
                    "zeitraum": "23:35 – 00:40",
                    "dauer": "ca. 65 min",
                    "pruefungen": "test500 neu, 45 Zusagen, vier Gegenproben gefahren; test183/191/293/266/499 grün"
                },
                {
                    "was": "E545 — Der Deckel bekommt seinen Verlauf, und ein Markenfeld bekommt seinen ersten Wächter",
                    "vonCommit": "(nach E544)",
                    "bisCommit": "(dieser Bogen)",
                    "zeitraum": "00:40 – 02:10",
                    "dauer": "ca. 90 min",
                    "pruefungen": "test501 neu, 29 Zusagen, fünf Gegenproben gefahren; test266/499/500/145/183 grün"
                },
                {
                    "was": "E546 — O4 zur Hälfte: das Zeigen einer Folie ändert sie nicht mehr, und die Präsentation geht als Foliensatz auf",
                    "vonCommit": "(nach E545)",
                    "bisCommit": "(dieser Bogen)",
                    "zeitraum": "02:10 – 03:20",
                    "dauer": "ca. 70 min",
                    "pruefungen": "test502 neu, 17 Zusagen, drei Gegenproben gefahren; test191 nachgezogen"
                },
                {
                    "was": "E547 — Die Folienliste zeigt Folien: Mass vom Block, Marken statt Bleistift, Name statt „A4-Blatt“",
                    "vonCommit": "(nach E546)",
                    "bisCommit": "(dieser Bogen)",
                    "zeitraum": "03:30 – 04:40",
                    "dauer": "ca. 70 min",
                    "pruefungen": "test503 neu, 18 Zusagen, vier Gegenproben gefahren"
                },
                {
                    "was": "E548 — „Präsentation\" ist ein Weg: Eintrag im Anlegen-Menü, acht PowerPoint-Layouts, ein Wähler, der sie zeigt",
                    "vonCommit": "(nach E547)",
                    "bisCommit": "(dieser Bogen)",
                    "zeitraum": "04:50 – 06:10",
                    "dauer": "ca. 80 min",
                    "pruefungen": "test504 neu, 27 Zusagen, vier Gegenproben gefahren"
                },
                {
                    "was": "E549 — Reiter „Präsentation\" im Menüband, Folien-Menü in der Dokumentleiste; das ganze Band dort war gemessen schlechter",
                    "vonCommit": "(nach E548)",
                    "bisCommit": "(dieser Bogen)",
                    "zeitraum": "06:20 – 08:10",
                    "dauer": "ca. 110 min",
                    "pruefungen": "test505 neu, 26 Zusagen, vier Gegenproben gefahren (25/1, 14/12, 23/3, 24/2); test114 von 152+1 auf 155 grün, zwei neue Zusagen, beide Gegenproben rot gesehen"
                },
                {
                    "was": "E550 — Das Folienband: Reiter ÜBER der Folie; `start` und `einfuegen` bleiben draussen, weil 79 von 83 ihrer Knöpfe dort nichts tun",
                    "vonCommit": "(nach E549)",
                    "bisCommit": "(dieser Bogen)",
                    "zeitraum": "08:20 – 10:20",
                    "dauer": "ca. 120 min",
                    "pruefungen": "test506 neu, 51 Zusagen, sechs Gegenproben gefahren (42/2, 42/1, 41/2, 41/2, 49/2, 47/4)"
                },
                {
                    "was": "E551 — Eine Folie steht, ein Skript rollt: die Vorgabe haengt am Dokument, nicht an einer Regel fuer alle",
                    "vonCommit": "(nach E550)",
                    "bisCommit": "(dieser Bogen)",
                    "zeitraum": "10:30 – 12:10",
                    "dauer": "ca. 100 min",
                    "pruefungen": "test507 neu, 34 Zusagen, vier Gegenproben gefahren (24/10, 30/4, 30/4, 32/2)"
                },
                {
                    "was": "E552 — „Zeichnen\" wird ein Reiter (die echte Leiste zieht um), und ein Blatt heisst im Foliensatz „Folie\"",
                    "vonCommit": "(nach E551)",
                    "bisCommit": "(dieser Bogen)",
                    "zeitraum": "12:20 – 14:20",
                    "dauer": "ca. 120 min",
                    "pruefungen": "test508 neu, 40 Zusagen, fünf Gegenproben gefahren (Abbruch, 35/3, 36/2, 38/2, 37/3)"
                },
                {
                    "was": "E553 — Der gelbe Deckel deckt auf: der Knopf startete den falschen Vortrag, und ein Zierstrich war als „Antwort\" gebaut",
                    "vonCommit": "(nach E552)",
                    "bisCommit": "(dieser Bogen)",
                    "zeitraum": "14:30 – 16:10",
                    "dauer": "ca. 100 min",
                    "pruefungen": "test509 neu, 21 Zusagen, vier Gegenproben gefahren (Abbruch, 17/4, 18/3, 14/7)"
                },
                {
                    "was": "E554 — Das Dokumentstudio traegt Redions Farben: fuenf feste Hexwerte werden abgeleitet, der gewaehlte Stift wird ein Umriss",
                    "vonCommit": "(nach E553)",
                    "bisCommit": "(dieser Bogen)",
                    "zeitraum": "16:10 – 18:00",
                    "dauer": "ca. 110 min",
                    "pruefungen": "test510 neu, 18 Zusagen — VOR der Reparatur rot (10/8), danach gruen; drei Gegenproben (13/5, 17/1, 16/2)"
                },
                {
                    "was": "E555/E556 — Gruppen im pptx werden mitgelesen, der Hinweis sagt was fehlt, und ein Tipp deckt auch im Laserpointer-Vortrag auf",
                    "vonCommit": "(nach E554)",
                    "bisCommit": "(dieser Bogen)",
                    "zeitraum": "18:00 – 19:40",
                    "dauer": "ca. 100 min",
                    "pruefungen": "test511 neu, 16 Zusagen, drei Gegenproben (7/9, 13/3, 13/3); test509 auf 27 Zusagen mit fuenfter Gegenprobe (25/2)"
                },
                {
                    "was": "E557 — Ein Absatz hat sein eigenes Format: Grad, Gewicht, Farbe, Ebene und Aufzaehlungszeichen je Absatz",
                    "vonCommit": "(nach E556)",
                    "bisCommit": "(dieser Bogen)",
                    "zeitraum": "19:40 – 21:10",
                    "dauer": "ca. 90 min",
                    "pruefungen": "test512 neu, 24 Zusagen, vier Gegenproben (15/9, Abbruch, 23/1, 22/2)"
                }
            ],
            "zahlen": {
                "commits": 31,
                "entscheidungen": 30
            },
            "groesstesProblem": "Zwei Fehler, und beide betrafen etwas, das ich vorher BEHAUPTET hatte.\n\nDer erste: In E531 hatte ich gesagt, es gebe keinen toten Stil mehr. Das galt für die `rmo-`KLASSEN, die ich gezählt hatte, und nicht für die ATTRIBUTREGELN — `[data-rmo~=\"glass\"]` verlor gegen `.fbtns button.prim:not(.ru-funkel)` in derselben Datei, und `.pf-karte` stand als Ziel des Lichteffekts da, ohne dass irgendwo eine Regel dafür existierte. Beide gefunden, weil dreizehn Agenten Block für Block gegen den Code belegen mussten statt aus dem Gedächtnis zu antworten.\n\nDer zweite ist schlimmer, weil er in der Reparatur steckte: ich habe den Glasknopf mit einem `body`-Vorsatz gewinnen lassen wollen. `body [data-rmo~=\"glass\"]` ist (0,1,1), die Klassenregel ist (0,3,1) — ein Element und ein Attribut schlagen drei Klassen nicht. Die Diagnose stimmte, die Rechnung nicht, und ich habe es nicht nachgemessen. Eine andere Sitzung hat es rot gemessen (E534) und repariert. Das ist §55.2 von der peinlichen Seite: ein Wächter, der nie rot war, ist eine Behauptung — und hier war nicht einmal ein Wächter da.",
            "interessantesteAnfrage": "„Hast du alle animationen erledigt? Oder ist noch etwas offen\" — die Frage, auf die eine Liste aus dem Gedächtnis das Naheliegende gewesen wäre. Stattdessen: dreizehn Agenten, einer je Vorlagenblock, jeder musste jede einzelne Wirkung mit Datei und Zeile belegen und im Zweifel „Motiv\" sagen statt „gebaut\". Das Ergebnis war unbequem und brauchbar: von 191 Wirkungen sind 42 gebaut, 51 stehen nur still da, 98 fehlen. Eine ehrliche 22-Prozent-Antwort ist mehr wert als ein „ja, fast alles\" — und sie hat die zwei toten Regeln oben überhaupt erst sichtbar gemacht.",
            "massnahmen": [
                {
                    "zeit": "15:33",
                    "was": "Drei Zeilen aus `motion.css` entfernt, die `ru-funkel-platzen` überschrieben.",
                    "warum": "Redur: „hier bei ai butons war vorher statt licht eine blur efcek\". Der Originaleffekt war nicht abgeschafft worden, weil er störte, sondern weil er beim Umbau im Weg lag.",
                    "risiko": "keins an Daten — Oberfläche; der Leerlauf bleibt still (E528), nur das Anfassen platzt"
                },
                {
                    "zeit": "15:50",
                    "was": "Zwei `ensure(`-Aufrufe in `motion.ts` für Glühfaden und Kartenring.",
                    "warum": "Beide Effekte standen in der Wirkungstabelle und hatten kein Element — der Kartenring war reiner toter Stil. Gefunden durch Abzählen, nicht durch Hinsehen: es fehlte ja nichts, was vorher da war.",
                    "risiko": "keins an Daten — Dekoration, vor Vorleseprogrammen verborgen, lässt Klicks durch"
                },
                {
                    "zeit": "16:06",
                    "was": "`[[d1_databases]]` und `[[r2_buckets]]` bleiben auskommentiert; die gemessenen Tatsachen stehen als Kommentar daneben.",
                    "warum": "Redur: „es sollte nichti im konto redbbt7 sein\". Die Datenbank existiert, aber im falschen Konto — ein Worker findet eine Datenbank nur im EIGENEN.",
                    "risiko": "keins — es wird nichts verbunden; die fünf Befehle für das richtige Konto stehen daneben, damit sie niemand neu erfinden muss"
                },
                {
                    "zeit": "17:37",
                    "was": "`.rmo-glass` als eigenes Element statt weiterer Pseudo-Ebenen am Knopf.",
                    "warum": "`::after` gehört am Knopf schon dem kreisenden Rand des Verlaufseffekts, und ein Knopf kann beide Effekte tragen.",
                    "risiko": "keins an Daten; der Selektor war zunächst FALSCH gerechnet und wirkte nicht — siehe E534"
                },
                {
                    "zeit": "20:29",
                    "was": "E533 und L149 berichtigt: der beschriebene Bau hat nicht stattgefunden.",
                    "warum": "Der Absatz war beim Schreiben des Eintrags schon formuliert und nicht nachgezogen worden, nachdem alle zehn Agenten am Sitzungslimit starben. Aufgeschrieben, was geplant war, statt was geschah.",
                    "risiko": "keins — nur Dokumentation; der falsche Absatz bleibt mit Nachtrag stehen, damit der Fehler auffindbar ist statt weggeputzt (§35)"
                },
                {
                    "zeit": "22:45",
                    "was": "`pptxLesen` in `bereiche/dateien/einlesen.ts`: eine Folie wird ein `blatt`-Block mit Marken, Reihenfolge aus `p:sldIdLst`.",
                    "warum": "Redur: „1:1 wie PowerPoint\". Der Weg über Text allein hätte jede Übungsfolie zerstört — die Antworten liegen unter Abdeckungen.",
                    "risiko": "keins an Daten — das Original hängt seit E538 immer mit dran; die Umwandlung ist verlustbehaftet und sagt es im Hinweis"
                },
                {
                    "zeit": "23:25",
                    "was": "`accept` des Hauptwählers und die zwei Menütexte um PowerPoint und PDF ergänzt.",
                    "warum": "Redur: „wie kann ich im Redion die Daten hochladen?\" — beim Nachsehen stand seine .ppsx im Dateifenster grau, obwohl der Zweig 17 Zeilen tiefer sie liest.",
                    "risiko": "keins an Daten — ein Filter im Dateifenster; `test497 §3` hält die drei Stellen künftig zusammen"
                },
                {
                    "zeit": "00:10",
                    "was": "`EIGENE_FOLIE` im Kern, Schrittzähler im Vortrag, weiches Auflösen, und ein Blatt füllt die Leinwand.",
                    "warum": "Redur: „mach weiter mit den folien klick.\" Davor lag ein grösserer Fehler: eine eingelesene Präsentation war EINE Folie mit allen Blättern übereinander — gemessen, und nur auf dem Bild zu sehen.",
                    "risiko": "keins an Daten — der Schrittstand wird nie gespeichert (E266); `Folien.teilen` ist gemeinsame Regel, deshalb fünf Nachbarläufe mitgefahren"
                },
                {
                    "zeit": "01:40",
                    "was": "`formVerlauf` liest den Verlauf aus `p:spPr`, `verlaufDefs` legt EIN `<defs>` ans Blatt, die Füllung nennt immer auch die feste Farbe.",
                    "warum": "Redur: „1:1 wie das Original\". Sieben Leser haben vorher den Bestand vermessen — der naheliegende Bau mit einer Gruppe um die Marke hätte vier Stellen gebrochen, drei davon still.",
                    "risiko": "§51: ohne Rückfallfarbe wäre ein Deckel bei fehlender Vorlage UNSICHTBAR, also eine offene Antwort. Deshalb steht sie immer daneben — am Browser gemessen, nicht angenommen."
                },
                {
                    "zeit": "02:50",
                    "was": "`Blatt.zeichne` legt keine Zeile mehr an, wenn das Blatt Marken trägt; der .pptx-Einleser setzt `dokumentModus`.",
                    "warum": "Gemessen: 27 Folien öffnen legte 27 leere Textblöcke an, und ihr Platzhalter lag auf dem Folientitel. Und der Dokumentmodus konnte Blatt-Blöcke längst — es fehlte nur die Flagge.",
                    "risiko": "§9: ein Zeichner, der in den Speicher schreibt, ist die gefährlichere Hälfte des Fundes. E118 bleibt für das leere Blatt unverändert, test502 misst beide Richtungen."
                },
                {
                    "zeit": "04:10",
                    "was": "`thumbnail()` nimmt das Seitenverhältnis vom Block und zeichnet die Marken; `sourceLabel` gibt den Folientitel.",
                    "warum": "Die Seitenliste war da (G3) und half nicht: 27 hochkant gequetschte, leere, gleich benannte Kästchen. Alle drei Fehler waren nur im Bild zu sehen.",
                    "risiko": "keins an Daten. Die Abdeckung deckt auch in der Miniatur, weil es derselbe Zeichner ist — gemessen: 69×6 px, rgb(255,204,0)."
                },
                {
                    "zeit": "05:40",
                    "was": "`bereiche/vorlagen/folien.ts` mit acht Layouts, ein Weg im Anlegen-Katalog, zwei Befehle im Register.",
                    "warum": "Redurs Wunsch nach einem PowerPoint-Modus. Die ANSICHT gab es längst (E546/E547) — was fehlte, war der Weg hinein und das, womit man anfängt.",
                    "risiko": "keins an Daten — ein Layout ist eine Markenliste, keine zweite Dokumentform. Der Wähler legt bei Abbruch GAR NICHTS an."
                },
                {
                    "zeit": "07:20",
                    "was": "Ein Reiter „Präsentation\" in `register/menueband.ts`, beliefert von `Folienvorlagen.bandEintraege`; dazu ein Knopf „📽️ Folie\" in der Dokumentleiste, der dasselbe Verzeichnis als Menü öffnet.",
                    "warum": "Redur: „mach weiter mit den menüband\". Das Band im Dokumentmodus einzublenden war der naheliegende Weg und nachweislich der schlechtere — eine zusammengeklappte Ecke „Werkzeuge ⌄\" lag bei 1440 × 852 deckungsgleich über der Dokumentleiste. Also EIN Katalog, zwei Orte (§8).",
                    "risiko": "keins an Daten — Oberfläche. Jeder Eintrag bringt sein `zeigen()` mit: ohne Foliensatz ist der Reiter ganz weg, und `istFoliensatz` verlangt ein QUERES Blatt, damit ein Notizbuch ihn nie bekommt."
                },
                {
                    "zeit": "08:05",
                    "was": "`test114` auf zweiundzwanzig Wege gehoben — und um zwei Zusagen erweitert, die für eine ROLLENDE Liste gelten.",
                    "warum": "Die harte Zahl im Prüflauf trug seit E236 eine Frage mit: „Wegweiser oder Liste?\" Der zweiundzwanzigste Weg hat sie beantwortet, gemessen bei 428 × 926: 10 von 22 ohne Rollen sichtbar, 1787 px Inhalt in 757 px Liste. Also Liste. Wegnehmen wäre eine Funktion weniger (§47), deshalb steht die Antwort als L154 offen.",
                    "risiko": "keins — ein Prüflauf. Beide neuen Zusagen sind rot gesehen worden (154 ok / 1 offen, je)."
                },
                {
                    "zeit": "09:40",
                    "was": "Eine Reiterzeile mit Band zwischen Kopf- und Zeichenleiste des Dokumentstudios, nur bei quer liegendem Foliensatz und erst ab 900 px Fensterbreite.",
                    "warum": "Redur: „oben mit menü … 1:1 wie powerpoint\". E549 hatte den Katalog, nicht den Ort. Welche Reiter hineinkommen, ist nicht gewählt, sondern gemessen: alle 151 Einträge einzeln aufgerufen, bei `start` taten 14 von 14 nichts, bei `einfuegen` 65 von 69 — sie brauchen eine Schreibmarke, die es im Dokumentmodus nicht gibt.",
                    "risiko": "keins an Daten — Oberfläche. Die Folie bleibt 980 × 551 bei 1440 × 852; das Band hat die Luft darunter genommen, nicht die Folie. Gezeichnet wird mit `Menueband.knopf`/`gruppeZeichnen`, also kein zweiter Zeichner (§8)."
                },
                {
                    "zeit": "11:20",
                    "was": "`gemerkterLauf` gibt fuer einen quer liegenden Foliensatz von Haus aus „Einzelseite\", fuer alles andere weiter „Rolle\". Dazu `justify-content:safe center` fuer die stehende Folie und ein Umzug des Knopfes „📽️ Folie\" in die Ansichtsklappe des Telefons.",
                    "warum": "Redur hat zu zwei Dingen zwei Sachen gesagt, die einander nicht widersprechen: „die PDF Seiten … komplet wie one note\" (E299) und „1:1 wie PowerPoint\" (E548/E549). Die Einzelseite gab es seit E398 schon — geaendert wurde nur die Vorgabe, und nur fuer Folien.",
                    "risiko": "keins an Daten — Ansicht. Der Schalter bleibt der staerkere: `meta` gewinnt gegen die Vorgabe, in beide Richtungen geprueft ueber einen echten Druck und ein Neuladen."
                },
                {
                    "zeit": "13:30",
                    "was": "Die Zeichenleiste zieht als Reiter „Zeichnen\" ins Folienband um — dasselbe Element, nicht nachgebaut. Dazu `wortEins`/`wortViele`: im Foliensatz heisst ein Blatt „Folie\".",
                    "warum": "Redur: „weiter mache gleich wie powerpoint\" — die Antwort auf die Frage aus E551. PowerPoint hat einen Reiter „Zeichnen\" und keine zweite Dauerleiste, und es sagt nirgends „Seite\".",
                    "risiko": "Eines, und es ist gemessen: die Leiste ist jetzt ein KIND des Bandes. Wer das Band entfernt, nimmt sie mit — dann hätte ein Fenster unter 900 px keine Zeichenwerkzeuge mehr (§47, weggenommene Funktion durch Unfall). `folienbandNachziehen` bringt sie deshalb zuerst zurück und entfernt dann das Band. Die Daten heissen weiter `blatt` (§53.3)."
                },
                {
                    "zeit": "15:20",
                    "was": "Der Knopf „▶ Präsentieren\" startet bei einem Foliensatz `Werkzeuge.praesentation` statt `zeigenAn`. Und `linie()` in `vorlagen/folien.ts` baut den Zierstrich als `art:'line'` statt als `art:'abdeck'`.",
                    "warum": "Redur: „wenn ich die gelbe antworten klicke geht es weiter und zeigt mir nicht die antwort\". Gemessen: der Dokumentvortrag legt eine Fläche über alles (inset:0, z-index:40), die jeden Zeiger schluckt — ein Tipp schaltete von „Folie 1/2\" auf „Folie 2/2\", der Deckel blieb zu.",
                    "risiko": "keins an Daten. PDF und Heft behalten den Laserpointer (§47, test509 §4 misst es). Der Zierstrich sieht gleich aus, verspricht aber nichts mehr."
                },
                {
                    "zeit": "17:10",
                    "was": "`pdf-studio.css:7`: die fuenf Farbnamen (--pdf-chrome, --pdf-tools, --pdf-on-chrome, --pdf-desk, --pdf-dock) aus festen Hexwerten in Ableitungen echter Tokens. Dazu vierzehn rohe Einzelwerte und der gewaehlte Stift als Umriss statt als Farbpaar.",
                    "warum": "Redur: „es sollte wie die redion farben sein wenn ich die fraben aendere sollte das auch sich aendern\". Gemessen ueber alle acht Schemata: fuenf von acht Flaechen waren byte-gleich, auch unter „Starker Kontrast\" mit --bg #000000.",
                    "risiko": "Zwei, beide gemessen und abgedeckt. (1) --pdf-desk NICHT auf --bg-tief: das hat nur zwei Werte fuer acht Schemata. (2) Der gewaehlte Stift NICHT auf --accent/--auf-accent: das faellt in fuenf von acht unter 4,5:1, in „Starker Kontrast\" auf 1,43:1. Dazu ein Rand am Papier, damit die weisse Folie auf hellem Schreibtisch nicht verschwindet — acht Bilder angesehen."
                },
                {
                    "zeit": "19:00",
                    "was": "`einlesen.ts`: die Formenschleife liest `p:grpSp` rekursiv, bildet `a:chOff`/`a:chExt` ab und bremst bei acht Ebenen; `p:graphicFrame` und gefuellte Formen ohne Text werden gezaehlt statt still fallen gelassen, und der Hinweis nennt sie. `document-mode.ts`: ein Tipp im Laserpointer-Vortrag sucht den Deckel ueber `elementsFromPoint` statt ueber `event.target`.",
                    "warum": "Redur: „verbesser fuer die pptx oefnnen\". Gemessen an einer eigens gebauten Datei: ein gruppierter Deckel kam gar nicht an — DIE ANTWORT STAND OFFEN —, und der Hinweis sagte „1 Folien uebernommen\".",
                    "risiko": "keins an Daten; es kommt MEHR an als vorher. Der einzige Weg, auf dem etwas verschwinden koennte, waere eine falsche Kindabbildung — deshalb baut test511 eine Gruppe mit Faktor zwei und rechnet die zwei Kinderlagen nach."
                },
                {
                    "zeit": "20:30",
                    "was": "`absaetzeLesen` gibt je `a:p` Grad, Gewicht, Farbe, Ebene und Aufzaehlungszeichen; wo sie auseinandergehen, entsteht eine Textmarke je Absatz, gestapelt mit den Hoehen aus `InkGeometry.textLayout`.",
                    "warum": "Redur: „verbesser fuer die pptx oefnnen\". Gemessen: „klein\"(12 pt) + „GROSS\"(36 pt, fett, blau) kam als EINE Marke in 12 pt schwarz an; ein roter Titel kam schwarz; drei Gliederungsebenen kamen flach.",
                    "risiko": "keins an Daten. Absaetze mit gleichem Format bleiben EINE Marke — sonst haette der Editor statt eines Kastens lauter Zeilen. Die Hoehen kommen vom Zeichner selbst, nicht aus einer Schaetzung; die Gegenprobe mit Schaetzung misst 18 pt Abstand statt ueber 40, also Ueberlappung."
                }
            ]
        }
    ],
    "zeitangaben": "EHRLICH ÜBER DIE UHR: genau sind nur die Commit-Zeiten — die stehen in git und sind hier unverändert übernommen. Die Uhrzeiten der Nachrichten sind ABGELEITET: aus ihrer Reihenfolge und den Commits davor und danach. Sie stehen mit „ca.\" da. Eine erfundene Minute wäre schlimmer als eine fehlende (§35).",
    "probleme": [
        {
            "nr": "P1",
            "datum": "2026-09-08",
            "titel": "Die Zeichenfläche stirbt nach ein paar Minuten",
            "schwere": "schwer",
            "symptom": "Nach 5–6 Minuten Nutzung zeichnete weder Stift noch Maus. Nur Neuladen half.",
            "falscheVermutung": "„Nach 5–6 Minuten\" klingt nach einer Uhr. Es gibt eine, die alle fünf Minuten läuft.",
            "wieGefunden": "Alle zehn wiederkehrenden Uhren der App (3 s bis 24 h) einzeln ausgelöst und danach gezeichnet — jede unschuldig. Dreissig Runden Zeichnen mit Seitenwechsel und Neuzeichnen: grün. Erst die andere Frage führte hin: was KANN das Zeichnen überhaupt abschalten?",
            "ursache": "Ein einziges verlorenes `pointerup`. Die Kennung des führenden Zeigers (Schutz gegen den zweiten Finger, E354) bleibt für immer stehen, und danach wird jeder andere Zeiger abgewiesen.",
            "loesung": "Das Ende zählt auch am Fenster; und wer aufsetzt, während der Führende 500 ms geschwiegen hat, übernimmt — der alte Zug wird ABGESCHLOSSEN, nicht verworfen.",
            "warumKeineUhr": "Ein Wecker, der einen Zug nach n Sekunden schliesst, würde auch den Strich eines Menschen durchschneiden, der beim Nachdenken die Hand aufliegen lässt.",
            "beweis": "test479: vor der Reparatur rot in neun Zusagen, danach 13/13.",
            "entscheidung": "E512"
        },
        {
            "nr": "P2",
            "datum": "2026-09-08",
            "titel": "„Flüssiger zeichnen\" — und es war nicht die Geschwindigkeit",
            "schwere": "mittel",
            "symptom": "Redur: „ich muss flüssiger zeichnen können\".",
            "falscheVermutung": "Flüssiger heisst schneller.",
            "wieGefunden": "Gemessen: 1200 Punkte auf einem Blatt mit 200 Marken, je vier Punkte ein Bild — 16,7 ms je Bild, im ersten wie im letzten Drittel, kein einziger Aussetzer über 20 ms.",
            "ursache": "Nicht die Bildrate, sondern WO die Tinte liegt. Bei 0,4 px/ms — dem Tempo der Handschrift — lag die gezeichnete Spitze 7,16 px neben der Stelle, an der der Stift beim Erscheinen des Bildes wirklich ist. Und der Fehler wechselte mit dem Tempo das Vorzeichen.",
            "loesung": "Der nasse Schwanz rechnet an den ROHEN Punkten und beginnt an der zuletzt gemessenen Stelle. Vor der Vermutung steht eine Messung.",
            "kosten": "Bei sehr schnellem Zug bleiben 15,75 px Fehler — die 26-px-Grenze bremst mit Absicht: eine Tinte, die vierzig Pixel vorausschiesst, malt ein Häkchen, das niemand gezogen hat.",
            "beweis": "test478 §3: bei vier Tempi und zwei Abtastraten liegt die Tinte an der Spitze.",
            "entscheidung": "E511"
        },
        {
            "nr": "P3",
            "datum": "2026-09-08",
            "titel": "Eine Messung, die das Falsche mass",
            "schwere": "mittel",
            "symptom": "`getScreenCTM` kostete angeblich 15 % des Zeichenwegs.",
            "falscheVermutung": "Man kann den Zeichenweg messen, ohne dass echte Bilder dazwischen liegen.",
            "wieGefunden": "Dieselbe Messung mit echten Bildern dazwischen: 45 %.",
            "ursache": "Der Browser merkt sich die Bildschirmmatrix, solange nichts am Aufbau schmutzig ist. Beim echten Zeichnen ist er das — der nasse Strich schreibt zwischendurch sein `d`.",
            "loesung": "Die Messung wiederholt, mit `requestAnimationFrame` zwischen den Ereignissen. Die richtige Zahl steht in E511.",
            "lehre": "Eine Messung ohne das, was gemessen werden soll, misst nichts. Das ist derselbe Fehler wie L103 Punkt 2, nur eine Ebene feiner.",
            "entscheidung": "E511"
        },
        {
            "nr": "P4",
            "datum": "2026-09-08",
            "titel": "Die Mitte einer Linie zählte beim Kritzel-Löschen nicht",
            "schwere": "mittel",
            "symptom": "`test439` wurde rot — ein Gekritzel über einer Linie nahm sie nicht mehr weg.",
            "wieGefunden": "Der Lauf war auch auf dem Stand VOR dem Bogen rot (in einem eigenen Arbeitsbaum nachgesehen). Gebrochen hatte es E504 aus demselben Durchgang.",
            "ursache": "Die Hälfte-Regel zählte die GESPEICHERTEN Punkte einer Marke. Ein Strich hat hunderte, eine gerade Linie zwei — ihre Enden. Ein Gekritzel über die Mitte nahm sie deshalb seit E466 nie weg.",
            "loesung": "`InkGeometry.densify` legt Messpunkte auf den Weg; die Regel misst bei beiden die Länge.",
            "gegenrichtung": "Daneben steht die Zusage, dass ein kurzes Gekritzel am Rand die Linie NICHT wegnimmt — eine Reparatur am Löschen darf nicht mehr löschen (§51).",
            "beweis": "test439 von 34 auf 38 Zusagen; Gegenprobe rot gesehen.",
            "entscheidung": "E510"
        },
        {
            "nr": "P5",
            "datum": "2026-09-08",
            "titel": "Die Adernreihe schaltete nur beim Stiftwechsel um",
            "schwere": "klein",
            "symptom": "Wer Redion mit dem Leiterstift schloss und wieder aufmachte, sah die fünf gewöhnlichen Farben und einen Stift, der etwas anderes zeichnet.",
            "wieGefunden": "DAS BILD, nicht der Prüflauf — der klickte sich zum Leiterstift durch und löste den Wechsel damit selbst aus.",
            "ursache": "Die Umschaltung lief nur beim Stiftwechsel, nicht beim Aufbau der Leiste.",
            "loesung": "Ein Aufruf beim Bauen, und eine Zusage, die ohne einen einzigen Klick nachsieht.",
            "lehre": "Ein Prüflauf, der den Zustand selbst herstellt, prüft nicht den Zustand beim Öffnen.",
            "entscheidung": "E509"
        },
        {
            "nr": "P6",
            "datum": "2026-09-08",
            "titel": "Drei Wächter, die nie rot werden konnten",
            "schwere": "mittel",
            "symptom": "Drei Zusagen waren VOR der Arbeit schon grün.",
            "wieGefunden": "Gegenprobe: das Gebaute zurückgedreht — die Zusagen blieben grün.",
            "ursache": "Zwei suchten CSS-Regeln, die es längst gab; eine mass NACH dem Weggehen statt währenddessen. Später kam eine vierte dazu: „alle Schritte der Welle sind gleich gross\" ist auch bei lauter Nullen wahr.",
            "loesung": "Alle vier geschärft: mit der echten Maus messen, die neue Regel beim Namen nennen, im richtigen Augenblick messen, und „grösser als null\" dazu.",
            "lehre": "Wer eine neue Zusage schreibt, prüft zuerst, ob sie überhaupt rot werden KANN (§55.2).",
            "entscheidung": "E508, E511"
        },
        {
            "nr": "P7",
            "datum": "2026-09-08",
            "titel": "Ein CSS-Einschub zerschnitt eine Regel",
            "schwere": "klein",
            "symptom": "`.blatt-farbe-weg` galt nie — die gewöhnlichen Farbtupfer blieben neben den Adern stehen.",
            "wieGefunden": "Erst das Bild. Der Prüflauf fragte nach der KLASSE statt nach der Sichtbarkeit und war zufrieden.",
            "ursache": "Der Einschub landete mitten in einer mehrzeiligen Regel.",
            "loesung": "Regel repariert, und die Zusage misst jetzt mit `getBoundingClientRect`.",
            "entscheidung": "E509"
        },
        {
            "nr": "P8",
            "datum": "2026-09-08",
            "titel": "L2 ist dasselbe Schwarz wie der erste Farbtupfer",
            "schwere": "klein",
            "symptom": "Beim Öffnen leuchtete L2 auf, egal welche Ader zuletzt geführt wurde.",
            "ursache": "Die Hervorhebung verglich FARBEN. `#111111` gibt es zweimal.",
            "loesung": "Sie vergleicht `data-leiter`. Die Farbe ist eine Eigenschaft der Ader, nicht ihr Name.",
            "entscheidung": "E509"
        },
        {
            "nr": "P9",
            "datum": "2026-09-08",
            "titel": "Die gewählte Ader flog nicht mit herein",
            "schwere": "klein",
            "symptom": "Beim Umschalten auf den Leiterstift kamen neun Tupfer als Welle — der zehnte, der gewählte, stand einfach da.",
            "wieGefunden": "Der Prüflauf; er mass den Namen der Bewegung je Tupfer.",
            "ursache": "Der Klecks hing an derselben Klasse wie die Auswahl und gewann gegen die Welle.",
            "loesung": "Zwei Anlässe, zwei Klassen: die Welle gehört dem Erscheinen, der Klecks dem Antippen.",
            "entscheidung": "E511"
        },
        {
            "nr": "P10",
            "datum": "2026-09-08",
            "titel": "Die Seitenleiste war ein 20-Pixel-Streifen",
            "schwere": "mittel",
            "symptom": "Die Werkzeugleiste links am Blatt war nicht zu erkennen.",
            "wieGefunden": "Das Bild, in einer Sekunde.",
            "ursache": "`width:auto; max-width:82px` — absolut gesetzt schrumpft eine Flexbox auf ihren Inhalt, und der hat `min-width:0`.",
            "loesung": "Eine feste Breite: 64 px, und die Knöpfe füllen sie.",
            "lehre": "Kein Prüflauf hätte das gefunden — es gab nichts Falsches zu messen, nur etwas Unsichtbares zu sehen.",
            "entscheidung": "E512"
        },
        {
            "nr": "P11",
            "datum": "2026-09-08",
            "titel": "Ein Zweig, den git checkout zerstört hat",
            "schwere": "schwer",
            "symptom": "Die ganze Arbeit an einem Bogen war weg.",
            "ursache": "`git checkout <datei>` auf eine Datei mit ungesicherten Änderungen. Kein Papierkorb, kein Zurück.",
            "loesung": "Der Bogen wurde aus dem deterministischen Muster neu aufgebaut. Aufgeschrieben als Verstoss gegen den Geist von §43.",
            "lehre": "§43 nennt reset --hard, clean und restore. checkout auf EINE Datei ist genauso endgültig und stand nicht in der Liste. Jetzt steht es in der Chronik.",
            "entscheidung": "E506"
        },
        {
            "nr": "P12",
            "datum": "2026-09-08 / 09-09",
            "titel": "Rückstriche in Prüflauf-Textstücken",
            "schwere": "klein",
            "symptom": "Ein Prüflauf liess sich plötzlich nicht mehr starten: „Expected ',' got …\".",
            "ursache": "Ein Rückstrich in einem KOMMENTAR innerhalb eines Textstücks beendet das Textstück. Fünfmal in diesem Durchgang.",
            "loesung": "Kommentare ohne schräge Anführungszeichen schreiben. Ein Wächter durchsucht die `evaluate`-Textstücke danach.",
            "lehre": "Derselbe Fehler fünfmal heisst: es ist kein Fehler, sondern eine Falle. Fallen gehören abgesichert, nicht gemieden."
        },
        {
            "nr": "P13",
            "datum": "2026-09-09",
            "titel": "„Eine neue PDF kopiert die aktuelle\" — nicht gefunden",
            "schwere": "offen",
            "symptom": "Redur: beim Einfügen einer neuen PDF wird die aktuelle kopiert.",
            "wieGesucht": "Drei Wege gemessen: `dateiAlsDokument` mit zwei verschiedenen PDFs (zwei Dokumente, zwei Quellen, 2 gegen 4 Seiten, 600 gegen 420 pt), der Kopfknopf „PDF öffnen\" bei offener erster Akte, und das „+\" → „PDF einlesen\" ebenso. Alle drei sauber.",
            "offen": "Der vierte Weg — `page-add-pdf` im Seitenmenü des Dokuments — liess sich vom Prüflauf nicht öffnen. Dort wäre auch die plausibelste Ursache: dieser Weg fügt MIT ABSICHT in das offene Dokument ein.",
            "wasFehlt": "Eine Angabe von Redur: welcher Knopf, in welcher Ansicht. Ein Bild mit einem Pfeil würde reichen.",
            "stand": "Nicht behoben und nicht widerlegt. Steht als L139 — nicht gefunden ist etwas anderes als nicht vorhanden."
        },
        {
            "nr": "P14",
            "datum": "2026-09-09",
            "titel": "Die Werkzeugzeile kippte in eine zweite — durch Zeichen, die schöner waren",
            "schwere": "mittel",
            "symptom": "Nach dem Einbau der gezeichneten Zeichen standen die dreizehn Werkzeuge am Rechner in zwei Zeilen statt einer. test351 meldete [2,true] statt [1,true].",
            "falscheVermutung": "Der erste Gedanke war, die Zusage sei zu streng und gehöre gelockert — genau wie zwei Tage zuvor bei test348 und test438, wo aus „zwei Zeilen\" ehrlich „höchstens drei\" wurde. Das wäre hier falsch gewesen: dort war ein Knopf DAZUGEKOMMEN, hier war nur ein Zeichen breiter geworden.",
            "wieGesucht": "Nachgemessen statt geschätzt, in einem Arbeitsbaum am alten Stand: bei 1600 px Fenster und 1184 px Leiste brauchten die dreizehn Knöpfe mit Emoji 1067 px, mit Zeichnung 1142. Der Unterschied sind rund 6 px je Knopf — die Zeichnung ist fest 18 px breit, ein Emoji war im Mittel 12.",
            "ursache": "Nicht die Zeichen, sondern ihre feste Breite: dreizehnmal sechs Pixel.",
            "behebung": "An drei Stellen zurückgeholt, jede mit Grund: Polsterung 9 → 7 px (die Zahl, die die enge Ansicht seit E359 benutzt), Abstand zum Wort 5 → 4, Zeichen neben einem Wort 18 → 16. Wo kein Wort steht, bleibt es gross.",
            "lehre": "Ein Bild hätte das nie gemeldet — zwei Zeilen sehen ordentlich aus. Gefunden hat es eine Zahl, die seit E359 in einem Prüflauf steht. Deshalb sind Zusagen mit Zahlen mehr wert als Zusagen mit Eindrücken (§55.2)."
        },
        {
            "nr": "P15",
            "datum": "2026-09-09",
            "titel": "Drei Stifte, ein Bild — und die Reparatur, die es schlimmer machte",
            "schwere": "mittel",
            "symptom": "Auf einem Blatt mit allen Zeichen nebeneinander sahen Füller, Kugelschreiber und Bleistift aus wie derselbe schräge Stift. In der Stiftreihe stehen sie direkt nebeneinander, und man wählt sie mit den Augen.",
            "falscheVermutung": "„Jeder Stift ist an seiner Spitze zu erkennen.“ Der Satz stand als Kommentar im Register — beim Zeichnen geschrieben, in einer 44-px-Ansicht. In der Leiste sind es 16 px, und dort ist eine Spitze zwei Punkte gross. Der zweite Irrtum kam gleich danach: schärfere Spitzen, ein Luftloch und Griffrillen sollten helfen — gemessen stiegen die drei Paare von 73/69/54 % auf 85/83/81 %.",
            "wieGesucht": "Jedes Zeichen in 16 × 16 gerastert und für jedes Paar gezählt, wie viele Tintenpunkte beide teilen (Schnitt durch Vereinigung). Das gibt eine Zahl, wo vorher ein Eindruck war.",
            "ursache": "Bei 16 px trägt der SCHAFT die ganze Tinte. Jede Verzierung liegt unter einem Punkt und verschwindet, während der gemeinsame Umriss bleibt.",
            "behebung": "Die Umrisse getrennt statt der Spitzen: der Füller ist eine Feder (Schlitz, Luftloch, nach unten spitz), der Kugelschreiber steht aufrecht mit Clip und Kugel, der Bleistift bleibt schräg. Danach kein Paar über 46 %.",
            "stand": "Behoben. `test480 §7` hält die Grenze bei 60 %, und die Gegenprobe mit den drei alten Stiften meldet 73 %.",
            "lehre": "Ein Bild findet, dass etwas gleich AUSSIEHT. Eine Messung sagt, ob eine Reparatur hilft — und diese hat den zweiten Irrtum in dreissig Sekunden gemeldet, statt ihn in die App zu lassen. Beides zusammen, nicht eins davon (§55)."
        },
        {
            "nr": "P16",
            "datum": "2026-09-09",
            "titel": "„Eine neue PDF kopiert die aktuelle\" — der Import war nie kaputt",
            "schwere": "hoch",
            "symptom": "Redur: beim Einfügen einer neuen PDF oben wird immer die aktuelle kopiert. Stand seit dem 8. September als L139 offen — nicht behoben und nicht widerlegt.",
            "falscheVermutung": "Dass es ein Import-Fehler sei. Drei Wege wurden gemessen (E513) und waren sauber; der vierte, das Seitenmenü, galt als letzter Verdächtiger, „weil dieser Weg mit Absicht ins offene Dokument einfügt\". Auch das war falsch — er ist sauber. Die Messungen waren richtig gerechnet und haben trotzdem nichts bewiesen, weil sie fragten, ob der Import die richtige Datei ablegt, statt zu fragen, welchen Knopf ein Mensch drückt.",
            "wieGesucht": "Nachgesehen, was im Regal oben WIRKLICH SICHTBAR ist, statt im Import zu suchen. Gemessen: der Knopf der Kopfleiste ist dort ausgeblendet; sichtbar waren genau zwei, und derjenige mit dem Wort „PDF öffnen\" war der, der die zuletzt geöffnete PDF zurückholt. Der, der importiert, hiess „PDF importieren\". Dazu wurde der vierte Weg endlich gefahren — sein Knopf sitzt im Inspector, und der ist zu, solange ihn niemand aufmacht; ein Klick mehr, und er lässt sich prüfen.",
            "ursache": "Ein Wort an der falschen Stelle. „PDF öffnen\" stand am Knopf, der zurückführt; der Knopf, der öffnet, hiess „importieren\".",
            "behebung": "Beide Importknöpfe heissen „PDF öffnen\" und tragen dasselbe Zeichen; die Karte heisst „Weiterlesen\". `test482 §1` misst den SICHTBAREN Text jedes Knopfes und lässt kein zweites „PDF öffnen\" zu.",
            "stand": "Geschlossen. Der vierte Weg ist gefahren und sauber: zwei Seiten vorher, fünf nachher, zwei Quellen, fünf verschiedene Seitenbilder, die neuen an der richtigen Stelle.",
            "lehre": "Wenn drei gute Messungen einen gemeldeten Fehler nicht finden, ist meist die FRAGE falsch, nicht der Melder. Redur hat genau beschrieben, was er sieht — „oben\", „einfügen\", „kopiert die aktuelle\". Die Antwort stand die ganze Zeit im Bild, nicht im Datenfluss."
        },
        {
            "nr": "P17",
            "datum": "2026-09-09",
            "titel": "Der Laptop bekam den Arbeitsstand gar nicht — drei richtige Regeln ergaben zusammen eine Sackgasse",
            "schwere": "mittel",
            "symptom": "Redur fragte, wie er den aktuellen Stand auf den Laptop holt. Beim Nachsehen: es ging nicht. Sein Ordner zeigte tagelang denselben Stand, während hier zehn Bögen landeten.",
            "falscheVermutung": "Dass die Frage nur nach dem BEFEHL fragt — „doppelklick holen.bat\" wäre die schnelle Antwort gewesen. Sie wäre falsch gewesen: holen.bat holt main, und main hatte den Arbeitsstand nicht.",
            "wieGesucht": "Die drei Regeln nebeneinandergelegt: holen.bat holt main (E271), main bewegt sich erst bei grünem Gesamtlauf (§46), gearbeitet wird auf einem Zweig (§43). Jede für sich richtig; zusammen ist der Arbeitsstand unerreichbar.",
            "ursache": "Keine kaputte Zeile — drei Regeln, die sich gegenseitig aussperren. Solche Fehler stehen in keiner Datei und lassen sich nur durch Nebeneinanderlegen finden.",
            "behebung": "holen.bat nimmt einen Zweignamen, ohne Angabe bleibt es main. holen-zweig.bat fragt danach und hat KEINE eigene Rettungslogik. Sechs git-Stellen einzeln geprüft, die Folge in einem echten Wegwerf-Repo mit Schrägstrich-Zweignamen nachgefahren.",
            "stand": "Behoben. Gegenprobe rot gesehen: ein einziger Befehl zurück auf origin/main, drei Zusagen rot.",
            "lehre": "Wenn eine Frage nach dem Weg gestellt wird, erst nachsehen, ob es den Weg gibt. Die schnelle Antwort wäre hier ein Befehl gewesen, der das Falsche tut — und Redur hätte den alten Stand geholt und geglaubt, er sei der neue."
        },
        {
            "nr": "P18",
            "datum": "2026-09-09",
            "titel": "Der Wächter fing den Satz, der die Regel erklärt",
            "schwere": "klein",
            "symptom": "Die neue Zusage „nirgends ein ausgeschriebener Benutzerpfad\" wurde beim ersten Lauf rot — an genau der Zeile, die erklärt, warum man keinen schreiben soll. Sie schrieb ihn aus.",
            "falscheVermutung": "Keine. Der Wächter war eine Minute alt und hat sofort etwas gefunden — das ist der Normalfall, wenn eine Zusage wirklich messen kann, statt nur zuzustimmen (§55.2).",
            "wieGesucht": "Ein grep über das ganze Verzeichnis danach: fünf weitere Stellen.",
            "ursache": "Ein Beispiel im erklärenden Satz. Die häufigste Art, gegen die eigene Regel zu verstossen.",
            "behebung": "Die Zeile umgeschrieben; SERVER-EINRICHTEN.md gleich mit, dort stand derselbe Pfad in einem cd zum Kopieren. Die drei in ENTSCHEIDUNGEN.md, UR.md und im Audit bleiben stehen — Protokolle schreibt man nicht um.",
            "stand": "Behoben. Der Wächter misst genau die eine Datei, die jemand kopiert.",
            "lehre": "Ein Wächter, der beim ersten Lauf grün ist, hat nichts bewiesen. Dieser war beim ersten Lauf rot, und zwar an einer Stelle, die niemand vermutet hätte."
        },
        {
            "nr": "P19",
            "datum": "2026-09-09",
            "titel": "Ein Skript, das richtig rechnet und die falsche Frage beantwortet",
            "schwere": "mittel",
            "symptom": "vergleichen.bat hätte Redur auf dem Arbeitszweig hunderte Unterschiede gemeldet, die keine sind — es verglich gegen main, und main liegt sechs Bögen zurück.",
            "falscheVermutung": "Keine im engeren Sinn — der Fehler war einen Bogen zuvor selbst aufgeschrieben worden (L142, erster Punkt) und galt als „später\". Dass Redur genau danach fragen würde, war absehbar: er hatte gerade den Arbeitszweig bekommen.",
            "wieGesucht": "Beim Lesen der Frage. Vor der Antwort nachgesehen, was das Skript tatsächlich vergleicht, statt es zu empfehlen.",
            "ursache": "E517 hat holen.bat einen Zweig beigebracht und vergleichen.bat vergessen. Eine Umstellung, die an einer von drei Stellen halt macht.",
            "behebung": "Vorgabe ist der Zweig, auf dem der Ordner steht; vergleichen.bat main sieht ausdrücklich gegen den geprüften Stand. Sieben git-Stellen einzeln geprüft, die vier Antworten von git status -sb in einem echten Repo gemessen.",
            "stand": "Behoben. L142 Punkt 1 geschlossen.",
            "lehre": "Eine Lücke, die man selbst aufschreibt, ist kein Ablagefach — sie ist eine Verabredung. Diese hier wurde nach einem einzigen Bogen fällig, und zwar durch die Frage, für die das kaputte Werkzeug gedacht war. Bevor man ein Werkzeug empfiehlt, sieht man nach, ob es die gestellte Frage beantwortet."
        },
        {
            "nr": "P20",
            "datum": "2026-09-09",
            "titel": "Ein Zeugnis im Netz — gefunden in einem Protokoll, das wegen etwas anderem kam",
            "schwere": "hoch",
            "symptom": "Redur_Babat_FZ_MOE_Lehrpersonen.pdf (5 MB) und Schul Inhalt wurden bei jedem Cloudflare-Deploy mit veröffentlicht. Das Repository ist privat, die Seite nicht.",
            "falscheVermutung": "Keine Vermutung — eine Auslassung, und zwar meine eigene von E270. Dort wurde .assetsignore gebaut, mit dem richtigen Satz „hier bleibt drin, was der Browser wirklich lädt\". Die Regel stimmte, die Liste war unvollständig: sie kannte Werkstatt und Geheimnisse, aber nichts Persönliches — weil damals nichts Persönliches dalag. Eine Liste altert; eine Regel nicht.",
            "wieGesucht": "Gar nicht gesucht. Redur schickte das Protokoll wegen einer Namenswarnung; beim Zeilenlesen der 290 hochgeladenen Dateien standen die beiden mittendrin.",
            "ursache": "Die Ausschlussliste zählte auf, statt zu prüfen. Und die Wurzel des Verzeichnisses ist zugleich das Veröffentlichungsverzeichnis — was dort landet, ist im Netz, sofern es niemand ausschliesst.",
            "behebung": "Ausgeschlossen: die PDF namentlich, dazu *.pdf und *.redion als Regel, Schul Inhalt, chronik/, quell/entwicklung/, .gitattributes. Nichts gelöscht. Der Prüflauf misst jetzt gegen die WIRKLICHKEIT: er liest, was in der Wurzel liegt, wendet die Ausschlüsse an und vergleicht mit dem, was gehen darf.",
            "stand": "Behoben. Gegenprobe rot gesehen, und sie nennt die Datei beim Namen.",
            "lehre": "Ein Protokoll, das wegen einer Kleinigkeit kommt, ganz lesen. Die Warnung, nach der gefragt wurde, war harmlos; darunter lag der Fehler, an dem der Deploy scheiterte, und weiter oben lag ein Zeugnis im Netz. Und: eine Ausschlussliste, die Namen aufzählt, hält bis zur nächsten Datei — eine, die gegen den echten Ordnerinhalt prüft, hält weiter."
        },
        {
            "nr": "P21",
            "datum": "2026-09-12",
            "titel": "Zwei Regeln, die geschrieben waren und nie jemand gesehen hat",
            "schwere": "mittel",
            "symptom": "Der Glasknopf hatte keinen Schatten und keinen Druckweg; die Pflegekarte bekam ein `data-rmo=\"light\"` und zeigte nichts. Beides sah im Quelltext vollständig aus.",
            "falscheVermutung": "Meine eigene aus E531: „es ist kein toter Stil mehr übrig\". Ich hatte die `rmo-`KLASSEN gezählt und daraus auf alles geschlossen. Attributregeln (`[data-rmo~=\"…\"]`) und die Zielliste in `motion.ts` waren nie geprüft.",
            "wieGefunden": "Nicht durch Hinsehen — die Seite sah richtig aus. Dreizehn Agenten mussten jeden Vorlagenblock einzeln gegen den Code belegen, mit Datei und Zeile je Wirkung. Dabei fiel auf, dass zwei Regeln nirgends ankommen.",
            "ursache": "Zweimal dieselbe Sorte: eine Regel zeigt ins Leere. Beim Glasknopf gewann neun Zeilen weiter oben in DERSELBEN Datei ein stärkerer Selektor (drei Klassen gegen ein Attribut). Bei der Pflegekarte stand das Ziel in der Wirkungstabelle, und die Regel dazu wurde nie geschrieben.",
            "loesung": "Der Glasknopf bekam einen ausreichend spezifischen Selektor und endlich seinen Körper (Kuppel, Glanzplatte, Lichtsaum). Die Pflegekarte bekam den Lichtschlitz — bewusst ohne das Anheben der Kacheln, weil sie eine Zeile in einer Liste ist und hebende Zeilen die Liste zappeln lassen.",
            "warumKeineUhr": "—",
            "beweis": "`test496` (aus E534) hält den echten Schatten am Glasknopf und war vorher rot. Für die Pflegekarte steht der Nachweis noch aus, als Teil von L149.",
            "entscheidung": "E532"
        },
        {
            "nr": "P22",
            "datum": "2026-09-12",
            "titel": "Ein Eintrag beschrieb einen Bau, den es nicht gab",
            "schwere": "mittel",
            "symptom": "In ENTSCHEIDUNGEN.md stand unter E533: „Gebaut wurde in einem Zug, zehn Agenten parallel.\" Gebaut wurde nichts. In LUECKEN.md stand aus demselben Grund „gebaut und typgeprüft ist alles\".",
            "falscheVermutung": "Keine Vermutung — eine Reihenfolge. Der Eintrag war geschrieben, WÄHREND die Agenten liefen, im Futur gedacht und im Perfekt formuliert. Danach starben alle zehn am selben Sitzungslimit (HTTP 429), acht ohne eine Zeile, und der Absatz wurde nicht nachgezogen.",
            "wieGefunden": "Beim Wiederaufnehmen der Arbeit: der Zweig war leer, die Fragmente fehlten, und der Eintrag behauptete das Gegenteil.",
            "ursache": "Dokumentation vor der Tatsache geschrieben. Derselbe Fehler wie E21, nur nicht im Code: aufgeschrieben, was erwartet wurde, statt nachgesehen, was geschah.",
            "loesung": "Beide Stellen berichtigt, der falsche Absatz bleibt mit Nachtrag stehen (§35: eine bekannte Lücke ist besser als ein stiller Fehler). E533 ist seither die ENTSCHEIDUNG, E535 der Bau.",
            "warumKeineUhr": "—",
            "beweis": "Die Agentenprotokolle: zehn Abbrüche mit `rate_limit`, HTTP 429, und im Arbeitsordner genau zwei geschriebene Fragmente von zehn.",
            "entscheidung": "E533"
        },
        {
            "nr": "P23",
            "datum": "2026-09-13",
            "titel": "Eine harte Zahl hat gemeldet — und was sie meldete, war nicht die Zahl",
            "schwere": "klein",
            "symptom": "`test114` wurde rot: „Es führt zu einundzwanzig Sachen\" — es waren zweiundzwanzig geworden, weil dieser Bogen „Präsentation\" ins Anlegen-Menü gestellt hat.",
            "falscheVermutung": "Die naheliegende Behebung: die 21 auf 22 heben, fertig. Genau das stand im Prüflauf verboten — die Zeile trug seit E236 den Satz mit, der nächste Zuwachs brauche „eine Antwort, nicht nur eine neue Zahl\".",
            "wieGefunden": "Im Stapel-Lauf nach dem Bogen, 1 von 13 Läufen rot. Nicht durch Hinsehen: das Blatt sieht mit 22 Wegen genauso aus wie mit 21 — man sieht ja beide Male nur den Anfang.",
            "ursache": "Kein Fehler im Code, sondern eine überschrittene Grenze. Gemessen bei 428 × 926: 22 Wege in 6 Überschriften, Liste 757 px hoch, Inhalt 1787 px, ohne Rollen sichtbar 10 von 22. Das Blatt war als WEGWEISER gebaut — es sollte dem, der nicht weiss, dass Redion Karteikarten kann, alles zeigen. Es zeigt noch ein Drittel.",
            "loesung": "Die Zahl gehoben UND die Antwort gegeben: L154 in `LUECKEN.md` mit den drei möglichen Ordnungen und ihren Kosten (zusammenklappbare Gruppen, Suchfeld, zwei Ebenen). Keinen Weg weggenommen — jeder ist eine echte Funktion (§47). Dazu zwei neue Zusagen in `test114`, die für eine rollende Liste gelten: dass sie wirklich rollt (1787 in 757) und dass ihr letzter Eintrag unten ankommt (64 px, ganz sichtbar).",
            "warumKeineUhr": "—",
            "beweis": "Beide neuen Zusagen rot gesehen (§50): einmal das Rollen im Messen weggenommen — „ganz sichtbar: false\"; einmal die Roll-Schwelle auf +2000 gesetzt — „1787 px Inhalt in 757 px\", damit klar ist, dass die Zeile die Messung liest und kein festes `true`. Beide Male 154 ok / 1 offen; behoben 155 grün.",
            "lehre": "Eine harte Zahl in einem Prüflauf ist kein Ärgernis, sondern der einzige Melder, den eine wachsende Liste hat — und sie meldet nicht immer das, wonach sie aussieht. Hier meldete sie nicht „die Zahl stimmt nicht\", sondern „das Blatt ist etwas anderes geworden\". Dieselbe Zeile war ein Jahr davor schon einmal still rot (E513 → E522), weil niemand sie hörte; diesmal war der Preis nur ein Absatz statt eines vollen Laufs.",
            "entscheidung": "E549"
        },
        {
            "nr": "P24",
            "datum": "2026-09-13",
            "titel": "Ein Menüband ohne ein einziges Zeichen — und jede Prüfung wäre grün geblieben",
            "schwere": "klein",
            "symptom": "Auf dem ersten Bild des Folienbands stand die ganze Reihe als nackter Text da: „Neue Folie   Folienliste   Präsentieren   Als PowerPoint   Als PDF   Drucken\". Kein Symbol, keine Kachel, nur Wörter nebeneinander.",
            "falscheVermutung": "Die naheliegende: die Einträge tragen keine Zeichen. Nachgesehen tragen sie welche — `plus`, `page`, `play`, `download`, `printer`, alle gültige Namen aus dem Symbolregister.",
            "wieGefunden": "Nur durch das Bild (§55.3). Gemessen war zu dem Zeitpunkt alles richtig: 6 Knöpfe, richtige Namen, richtige Gruppen, jeder mit `title` und `aria-label`, jeder tat beim Klick das Richtige.",
            "ursache": "`Menueband.knopf` hängt für einen Symbolnamen nur ein LEERES `<span data-sym=\"plus\">` ein. Gemalt wird es später von `Register.symbole.fuelle(wurzel)` — im globalen Band steht dieser Aufruf an drei Stellen, im neuen Folienband an keiner.",
            "loesung": "Ein `Register.symbole.fuelle(flaeche)` nach jedem Füllen der Bandfläche, mit `try` darum: fehlt das Register, bleibt der Name stehen — schlechter, aber nicht kaputt.",
            "warumKeineUhr": "—",
            "beweis": "Die Zusage sucht nicht `data-sym` — der Kasten kann leer sein —, sondern das GEMALTE: ein `<svg>` darin, ein Textzeichen oder eine Farbprobe. Gegenprobe gefahren (den Aufruf wieder herausgenommen): 42 grün, 1 rot, „38 Knöpfe ohne gemaltes Zeichen\".",
            "lehre": "Ein Knopf kann vollständig sein und trotzdem falsch aussehen. Alles, was ein zusammengesetzter Prüflauf fragen konnte — da? richtig benannt? tut es etwas? spricht es mit einem Vorleseprogramm? —, war mit Ja zu beantworten. Was fehlte, war das, was man SIEHT. Genau dafür steht §55.3 in der CLAUDE.md, und genau deshalb reicht dort keine Messung.",
            "entscheidung": "E550"
        },
        {
            "nr": "P25",
            "datum": "2026-09-13",
            "titel": "Das Band fragte die Fensterbreite einmal — und behielt die Antwort",
            "schwere": "klein",
            "symptom": "Ein Fenster von 1440 auf 800 gezogen: das Folienband blieb stehen, obwohl es dort nicht hingehört. Umgekehrt aufgezogen: es kam nie.",
            "falscheVermutung": "Keine — der Fehler war nie sichtbar. Er wurde beim LESEN des eigenen Diffs gefunden, mit der Frage „was würde hier schiefgehen\".",
            "wieGefunden": "Weder gemessen noch auf einem Bild. Beim Durchgehen der eigenen Änderung fiel `innerWidth < BAND_AB` auf: eine Zahl, die beim Zeichnen EINMAL gefragt wird, in einem Studio, das bei `resize` nicht neu zeichnet.",
            "ursache": "`folienbandBauen` liest `innerWidth` beim Aufbau. Das Dokumentstudio hat einen `resize`-Griff (`beiGroesse`), der aber nur Höhen nachrechnet — richtig so, denn ein Neuzeichnen bei jeder Fensterbewegung wäre bei achtzig Seiten teuer. Das Band war dort nur nicht eingetragen.",
            "loesung": "`folienbandNachziehen()` in `beiGroesse`: es vergleicht, ob ein Band da sein SOLL und ob eines da IST, und hängt nur beim Unterschied ein oder aus.",
            "warumKeineUhr": "—",
            "beweis": "Zwei Gegenproben, beide gefahren: die Funktion nichts tun lassen (49 grün, 2 rot — das Band blieb bei 800 px stehen), und sie nur AUSHÄNGEN lassen (47 grün, 4 rot — es kam beim Aufziehen nicht zurück). Die zweite war nötig, weil sonst nur die naheliegende Richtung geprüft gewesen wäre.",
            "lehre": "Zwei Sachen. Erstens: das eigene Diff noch einmal mit der Frage lesen, was daran schiefgehen könnte — dieser Fehler stand in keiner Messung und auf keinem Bild. Zweitens: die erste Form der Gegenprobe (den AUFRUF entfernen) liess den Zweig wegen `noUnusedLocals` gar nicht mehr bauen. Eine Gegenprobe, die nicht baut, ist keine — CLAUDE.md §52.6 beschreibt genau diesen Fall, und ich bin trotzdem hineingelaufen.",
            "entscheidung": "E550"
        },
        {
            "nr": "P26",
            "datum": "2026-09-13",
            "titel": "Ein Knopf nahm dem Titel 44 Pixel — und die Zusage dagegen konnte den Fall nicht sehen",
            "schwere": "mittel",
            "symptom": "Am Telefon zeigte „📽️ Folie\" als einziger Knopf der Dokumentleiste sein WORT (alle anderen nur ihr Zeichen), und das Wort brach im 44-px-Kasten um. Dem Titel eines Foliensatzes blieben 70 px: „Neue Pr…\".",
            "falscheVermutung": "Beim Bauen von E549 gar keine — die Telefonbreite wurde schlicht nicht nachgemessen. Die Bilder dieses Bogens waren Rechnerbilder.",
            "wieGefunden": "Auf dem Bild eines ANDEREN Bogens. Beim Nachsehen, ob die stehende Folie am Telefon mittig sitzt, fiel der umgebrochene Knopf im Kopf auf.",
            "ursache": "Zwei Schichten. Oben: `test285` verlangt fuer den Titel ueber 100 px und haelt das seit E296 — aber er oeffnet ein PDF, und bei einem PDF ist der Folien-Knopf ohnehin versteckt. Die Zusage war da und konnte den Fall nicht sehen. Darunter: derselbe Fehler war 2026 schon einmal gemacht worden. Neben `print` steht in `pdf-studio.css` seit E493 die Zahl 70 als Kommentar — genau diese siebzig.",
            "loesung": "Der Knopf zieht am Telefon in die Ansichtsklappe, denselben Weg, den E468 fuer die Suche und E493 fuer „Praesentieren\" gegangen sind. Titel danach 114 px. `test507 §4` misst es jetzt an einem FOLIENSATZ, also dort, wo `test285` nicht hinsieht.",
            "warumKeineUhr": "—",
            "beweis": "Gegenprobe gefahren: den Knopf oben stehen lassen — 32 gruen, 2 rot, „70 px — vorher 70\". Die Zahl reproduziert sich auf den Pixel.",
            "lehre": "Eine gruene Zusage beweist nur das, was sie ansieht. `test285` prueft die Kopfleiste seit E296 sorgfaeltig — an einem PDF. Ein neuer Knopf, der nur bei EINER Dokumentart erscheint, ist damit unbeobachtet, und dass die Suite gruen bleibt, heisst nichts. Wer eine Bedingung einfuehrt (`hidden = !istFoliensatz(page)`), fuehrt einen zweiten Fall ein, den niemand misst.",
            "entscheidung": "E551"
        },
        {
            "nr": "P27",
            "datum": "2026-09-13",
            "titel": "Eine Gegenprobe blieb gruen — weil die Zusage den gefaehrlichen Weg gar nicht ging",
            "schwere": "mittel",
            "symptom": "Gegenprobe G4 von `test508`: die Zeichenleiste beim Verkleinern des Fensters NICHT in Sicherheit bringen, also den Fall bauen, in dem sie beim Entfernen des Bandes mitgerissen wird. Ergebnis: 40 gruen, 0 rot. Die Zusage meldete nichts.",
            "falscheVermutung": "Kurz die naheliegende: „dann ist der Fehler wohl gar nicht moeglich\". Er war moeglich — nur wurde er nicht ausgeloest.",
            "wieGefunden": "Durch die Gegenprobe selbst. Sie ist genau dafuer da: erst wenn eine Zusage nachweislich rot werden KANN, ist ihr Gruen etwas wert (§55.2, §50).",
            "ursache": "§4 rief nach `setViewportSize(800)` ein `oeffne(deck)` — und baute damit das ganze Studio frisch auf. Die Leiste entstand dabei neu, ganz gleich, ob der Griff beim Schrumpfen sie gerettet haette. Der gefaehrliche Weg (das Band entfernen, WAEHREND die Leiste darin haengt) wurde nie gegangen.",
            "loesung": "Nur noch das Fenster ziehen, sonst nichts — genau das, was ein Mensch tut. Danach meldet die Gegenprobe „0 Knoepfe\": die Leiste waere wirklich weg gewesen.",
            "warumKeineUhr": "—",
            "beweis": "Vorher 40 gruen mit angewandter Gegenprobe; nachher 38 gruen, 2 rot, mit der Meldung „0\" fuer die Zahl der Knoepfe. Dieselbe Gegenprobe, dieselbe Zeile — nur der Weg dorthin war vorher der falsche.",
            "lehre": "Eine Zusage prueft nicht, was sie behauptet, sondern was sie TUT. Ein bequemer Zwischenschritt im Aufbau — hier ein Neuoeffnen — kann genau den Zustand wegraeumen, den die Zeile halten soll. Dritte Mal in dieser Sitzung: `every()` auf leerer Liste, das Register statt der Oberflaeche, und jetzt der Neuaufbau vor der Messung.",
            "entscheidung": "E552"
        },
        {
            "nr": "P28",
            "datum": "2026-09-13",
            "titel": "Ein Lauf, der allein gruen ist und im Stapel rot — zweimal hintereinander",
            "schwere": "klein",
            "symptom": "`test424` meldete im Stapel „PDF page position survives reload\" als rot. Allein gefahren: 50 von 50 gruen. Und beim zweiten Stapel wieder rot.",
            "falscheVermutung": "Die bequeme: „Flake\". §46 laesst sie nicht gelten, und zu Recht — zweimal dasselbe unter denselben Bedingungen ist kein Zufall, sondern eine Bedingung.",
            "wieGefunden": "Im Regressionsstapel nach E552. Danach einzeln nachgefahren, um auszuschliessen, dass der Bogen selbst es gebrochen hat: er war es nicht (er aendert Woerter und den Ort der Zeichenleiste; der Lauf misst eine gemerkte PDF-Seite).",
            "ursache": "Der Lauf wartet nach dem Neuladen auf `.document-workspace` — und liest dann sofort `.document-stage[data-aktiv]`. Die BUEHNE bekommt ihr `data-aktiv` aber erst, wenn die gemerkte Seite wieder gefunden ist. Unter Last (mehrere Laeufe parallel) kommt das Messen dem Zeichnen zuvor. Dieselbe Sorte Fehler stand vier Zeilen darueber schon einmal und ist dort mit `Store.flush()` repariert worden (E440) — nur eben fuer die andere Haelfte.",
            "loesung": "Auf die Buehne warten, statt sie zu erraten: `waitFor` auf `.document-stage[data-aktiv]`, dann `waitForFunction` auf die Seitennummer, beides mit 15 s Grenze. Die Zusage selbst bleibt unveraendert.",
            "warumKeineUhr": "—",
            "beweis": "Vorher: zwei Stapel hintereinander rot, einzeln 50/50 gruen. Nachher: derselbe Stapel gruen. Laeuft die Grenze ab, meldet die Zeile wie vorher rot — entschaerft ist nichts.",
            "lehre": "„Allein gruen, im Stapel rot\" ist eine Aussage ueber den Lauf, nicht ueber die App. Und die bequeme Antwort darauf — einmal nachfahren und weitergehen — ist genau die, die §46 verbietet. Einen Lauf zu entschaerfen, statt ihn robust zu machen, waere §47 mit anderen Mitteln.",
            "entscheidung": "E552"
        },
        {
            "nr": "P29",
            "datum": "2026-09-13",
            "titel": "Zwei Knoepfe hiessen „Praesentieren\" und taten Verschiedenes",
            "schwere": "mittel",
            "symptom": "Redur: „wenn ich die gelbe antworten klicke geht es weiter und zeigt mir nicht die antwort\". Gemessen: „Folie 1/2\" -> Klick -> „Folie 2/2\", der Deckel blieb zu.",
            "falscheVermutung": "Meine erste: der Deckel sei nicht anklickbar (pointer-events, fehlendes data-ink-art, elVon liefert kein Element). Alle drei nachgesehen — alle drei in Ordnung. Der Deckel war nie das Problem.",
            "wieGefunden": "Durch Messen beider Wege nebeneinander. Weg A (`Werkzeuge.praesentation`, den das Band startet): Treffer am Deckel, data-auf=1, Folie bleibt. Weg B (der Knopf in der Dokumentleiste): an der Stelle des Deckels liegt `DIV.document-zeigen-flaeche`.",
            "ursache": "Es gibt ZWEI Vortragsmodi. `Werkzeuge.praesentation` ist der Folienvortrag mit Abdeckungen (E266/E544); `zeigenAn` ist der Dokumentvortrag mit Laserpointer (E493), gebaut fuer ein PDF an der Wand. Der legt eine Flaeche ueber alles (inset:0, z-index:40), die jeden Zeiger schluckt und einen Tipp als „blaettern\" liest. Der Knopf in der Dokumentleiste startete immer den zweiten — auch bei einem Foliensatz.",
            "loesung": "Das Dokument entscheidet: ein Foliensatz bekommt den Folienvortrag, PDF und Heft behalten den Laserpointer.",
            "warumKeineUhr": "—",
            "beweis": "Gegenprobe G3 (den Deckel-Zweig im Folienvortrag ausschalten) meldet woertlich „ist ‚2 / 2‘, soll ‚1 / 2‘\" — 18 gruen, 3 rot. G2 (die Weiche auf jedes Dokument gehen lassen) nimmt dem Heft den Laserpointer: 17 gruen, 4 rot.",
            "lehre": "Zwei Knoepfe mit demselben Namen, die Verschiedenes tun, sind kein Bedienfehler des Nutzers. Er hat den genommen, der dasteht — und er stand im Dokument, also erwartete er den Dokumentvortrag nicht, sondern den Vortrag SEINER Folien. Wo zwei Wege dasselbe Wort tragen, muss der Zustand entscheiden, nicht der Zufall der Platzierung.",
            "entscheidung": "E553"
        },
        {
            "nr": "P30",
            "datum": "2026-09-13",
            "titel": "Ein Zierstrich war als „zugedeckte Antwort\" gebaut — sieben Stueck",
            "schwere": "mittel",
            "symptom": "Eine Zusage legte einen Deckel von 540 x 160 Punkten an; gezeichnet wurde er als 207 x 7 px. Die Zahl passte um den Faktor acht nicht.",
            "falscheVermutung": "Der Massstab sei falsch — viewBox gegen blattBreite/blattHoehe, `preserveAspectRatio=\"none\"` zieht das Marken-SVG mit. Nachgemessen: viewBox 0 0 960 540, --seitenmass 960/540, alles stimmig. Der Massstab war nie das Problem.",
            "wieGefunden": "Beim Nachrechnen der nicht passenden Zahl. Die Zusage hatte den ERSTEN `[data-ink-art=\"abdeck\"]` im Baum genommen — und das war nicht ihrer, sondern der blaue Zierstrich unter der Ueberschrift des Layouts (173 x 6 Punkte).",
            "ursache": "`linie()` in `vorlagen/folien.ts` baute die waagrechte Zierlinie als `art:'abdeck'` — „als flache Abdeckmarke in Akzentfarbe\", mein eigener Kurzschluss aus E548: eine Abdeckmarke ist gefuellt, eine `rectangle` nicht, also nahm ich die gefuellte. `abdeck` heisst aber nicht „gefuellter Kasten\", sondern EINE ZUGEDECKTE ANTWORT (E266): anklickbar, cursor:pointer, und beim Tipp verschwindet die Fuellung.",
            "loesung": "`art:'line'` mit Strichstaerke (`breite`). Sieht gleich aus, verspricht nichts.",
            "warumKeineUhr": "—",
            "beweis": "Gegenprobe G4 (den Zierstrich wieder als Abdeckmarke bauen): 14 gruen, 7 rot, und die Zeile nennt die Zahl — SIEBEN Zierdeckel in acht Layouts.",
            "lehre": "Eine Markenart ist kein Zeichenwerkzeug, sondern eine BEDEUTUNG. Wer sie nimmt, weil sie zufaellig so aussieht, wie er es braucht, erbt alles, was sie sonst noch verspricht. Dieselbe Sorte Fehler wie ein uebersetzter Feldname (§53.3): die Form stimmt, die Aussage nicht.",
            "entscheidung": "E553"
        },
        {
            "nr": "P31",
            "datum": "2026-09-13",
            "titel": "Die naheliegende Farbreparatur haette den Barrierefreiheitsfall zerstoert",
            "schwere": "gross",
            "symptom": "Kein Symptom — der Fehler ist nie gebaut worden. Die erste Untersuchung schlug fuer den gewaehlten Stift `background:var(--accent); color:var(--auf-accent)` vor und schrieb dazu, --auf-accent sei „genau dafuer da ... und in beiden Themen nachgerechnet\".",
            "falscheVermutung": "Genau die: dass ein Token, das in dunkel.css UND hell.css definiert ist, auch den acht SCHEMATA folgt. Es folgt ihnen nicht.",
            "wieGefunden": "Durch die Gegenrede. Ein zweiter Agent hat die Behauptung nicht geglaubt, sondern die acht Schemata einzeln abgelesen und den Kontrast gerechnet. `aussehen.ts:112` setzt pro Schema NUR --accent; --auf-accent, --accent-text und --accent-schwach kommen unveraendert aus dunkel.css/hell.css.",
            "ursache": "Zwei Begriffe, die gleich aussehen und es nicht sind: THEMA (hell/dunkel, zwei Stueck) und SCHEMA (acht Stueck). Ein Token kann „in beiden Themen nachgerechnet\" sein und trotzdem in sechs von acht Schemata falsch stehen.",
            "loesung": "Der gewaehlte Stift wird ein UMRISS: background:var(--bg-hover); color:var(--text); box-shadow:inset 0 0 0 2px var(--accent). Das Paar --text/--bg-hover ist je Thema nachgerechnet, der Akzent traegt keine Schrift — es braucht gar keine eigene Kontrastrechnung je Schema.",
            "warumKeineUhr": "—",
            "beweis": "Gegenprobe G3 baut den verworfenen Vorschlag und misst: nacht 3,07 · wald 2,26 · sand 3,87 · rose 3,15 · kontrast 1,43 — gegen heute 9,30:1. Die gemessenen Zahlen sind dieselben, die die Gegenrede vorher gerechnet hatte.",
            "lehre": "Der Satz „ist in beiden Themen nachgerechnet\" klang wie ein Beleg und war eine Verwechslung. Ein Beleg fuer zwei Faelle ist kein Beleg fuer acht. Und: eine Gegenrede, die den Vorschlag selbst nachrechnet statt ihn zu lesen, ist den Aufwand wert — dieser eine Fund haette §38 an der empfindlichsten Stelle gebrochen, und kein Waechter haette es gemeldet, weil es bis heute keinen gibt.",
            "entscheidung": "E554"
        },
        {
            "nr": "P32",
            "datum": "2026-09-13",
            "titel": "Der Pruefllauf hat meine Rechnung korrigiert, nicht den Code",
            "schwere": "klein",
            "symptom": "`test511 §2` meldete beim ersten Lauf: „{x:216} — erwartet (360, 144)\". Ich hatte die erwartete Lage eines gruppierten Kindes von Hand ausgerechnet.",
            "falscheVermutung": "Meine erste Regung: die Kindabbildung sei falsch. Sie war richtig.",
            "wieGefunden": "Nachgerechnet, statt am Code zu drehen. 914400 EMU sind 72 pt. Die INNENbreite der Gruppe war 144 pt, die AUSSENbreite 288. Das Kind sass also auf der halben INNENbreite, und 72 + 72·2 = 216 — nicht 360.",
            "ursache": "Ich hatte 914400 EMU fuer die halbe Aussenbreite gehalten. Ein Kopfrechenfehler in der ZUSAGE, nicht im Code.",
            "loesung": "Die erwartete Zahl berichtigt und die ganze Rechnung als Tabelle in den Pruefllauf geschrieben — mit allen vier Zwischenwerten, damit der naechste sie nicht wieder im Kopf macht.",
            "warumKeineUhr": "—",
            "beweis": "Die Gegenprobe ohne Abbildung setzt die Kinder auf (0,0) und (72,36) — genau die Innenkoordinaten. Mit Abbildung (72,72) und (216,144). Beide Zahlenpaare stehen jetzt im Kopf des Laufs.",
            "lehre": "§45/E21 („nachsehen, nicht erinnern\") gilt auch fuer Arithmetik. Eine erwartete Zahl, die aus dem Kopf kommt, ist genauso eine Behauptung wie eine erinnerte Schnittstelle — und wenn sie falsch ist, zeigt der rote Lauf auf den Code statt auf einen selbst. Rettung war, die Rechnung aufzuschreiben statt sie nachzubessern.",
            "entscheidung": "E555"
        },
        {
            "nr": "P33",
            "datum": "2026-09-13",
            "titel": "Dieselbe Feldliste hat dasselbe zum zweiten Mal vergessen",
            "schwere": "klein",
            "symptom": "Die Farbe eines Absatzes wurde gelesen und kam trotzdem nicht an: „ist '', soll '#CC0000'\". Grad und Fett desselben Absatzes kamen an.",
            "falscheVermutung": "Das Lesen sei schuld — `getElementsByTagName('a:srgbClr')` finde den Wert im `a:rPr` nicht. Es fand ihn.",
            "wieGefunden": "Durch den Widerspruch: wenn Grad und Fett ankommen, ist `rPr` gefunden. Also lag es hinter dem Lesen.",
            "ursache": "`marken.push` baut die Textmarke aus einer FESTEN Feldliste zusammen — `id, art, point, breiteBox, text, fontSize, fett`. `farbe` stand nicht darin und fiel weg.",
            "loesung": "`...(o.farbe ? { farbe: o.farbe } : {})`, genau wie E545 es vier Zeilen tiefer fuer `verlauf` tun musste.",
            "warumKeineUhr": "—",
            "beweis": "test512 §2 meldete den Fehler und ist nach der Zeile gruen.",
            "lehre": "Eine Feldliste, die aufzaehlt, vergisst beim naechsten Feld wieder — und sie hat es an DIESER Stelle jetzt zweimal getan (E545 mit `verlauf`, E557 mit `farbe`). Sie bleibt trotzdem, denn ein blindes Durchreichen des ganzen Objekts naehme `x`/`y`/`w`/`h` mit in die Ablage. Was sich aendern laesst, ist der Hinweis daneben: die Zeile sagt jetzt, dass sie vergisst.",
            "entscheidung": "E557"
        },
        {
            "nr": "P34",
            "datum": "2026-09-13",
            "titel": "Ein Stichwort in der Lueckenliste, das kleiner klang als es war",
            "schwere": "mittel",
            "symptom": "Redur: „ich will das die orginale pptx so wie es sich oeffnen\". Eine Folie, in die in PowerPoint nur getippt wurde, kam mit geratener Lage, 40 pt und weissem Grund an — also fast jede Folie einer Vorlage.",
            "falscheVermutung": "Der Punkt stand in L151 als „Geerbtes vom Layout und vom Master\", einer von acht Aufzaehlungspunkten, und sein Satz endete mit „kommt weiss an\". Das klang nach Kosmetik. Ich haette ihn beinahe hinter Ausrichtung und Drehung eingereiht.",
            "wieGefunden": "Ein grep, bevor ich etwas annahm: `grep -n \"slideLayout\\|slideMaster\\|notesSlide\" src/bereiche/dateien/einlesen.ts` gab NICHTS zurueck. Nicht „unvollstaendig\" — gar nichts.",
            "ursache": "PowerPoint schreibt in das Folien-XML nur, was die Folie SELBST aendert. Die fehlende Erbkette nahm deshalb nicht nur den Hintergrund, sondern auch Lage und Schriftgrad JEDES Platzhalters — und ein Platzhalter ohne eigene Angaben ist der Normalfall, nicht der Sonderfall.",
            "loesung": "Die zweistufige Kette Folie → Layout → Master ueber `.rels` (nicht ueber Dateinamen) und eine Karte der Platzhalter, in der der Master zuerst steht und das Layout ihn ueberschreibt. Der Hintergrund brauchte dabei keine neue Leitung: `--paper` gab es im Stil schon, es hatte nur nie jemand gesetzt.",
            "warumKeineUhr": "—",
            "beweis": "Die Gegenprobe, die die Kette nicht anwendet, faellt auf genau den alten Zustand zurueck: Titel bei (58,41) in 40 pt statt (36,18) in 44, Hintergrund \"\". 8 gruen, 5 rot.",
            "lehre": "Ein Punkt in der Lueckenliste wird danach eingeschaetzt, WIE ER FORMULIERT IST, nicht danach, was er kostet. „Kommt weiss an\" beschrieb den sichtbarsten, aber kleinsten Teil derselben fehlenden Leitung. Wer eine Luecke abarbeitet, misst zuerst nach, was sie WIRKLICH umfasst — ein grep vor der Schaetzung hat hier eine Kosmetikaufgabe als die groesste Einzelursache entlarvt.",
            "entscheidung": "E558"
        },
        {
            "nr": "P35",
            "datum": "2026-09-13",
            "titel": "Eine Verbesserung, die ihren eigenen Schaden mitbrachte",
            "schwere": "mittel",
            "symptom": "Keins. Alle 17 Zusagen von test513 waren gruen, das Bild sah richtig aus, und der Fehler waere erst bei einer echten Datei von Redur aufgetaucht — als spurlos verschwundener Text.",
            "falscheVermutung": "Dass ein farbiger Hintergrund eine reine Zugabe ist. Er ist es nicht: er aendert die Bedingung, unter der ALLES andere auf dem Blatt gezeichnet wird.",
            "wieGefunden": "Beim Lesen des eigenen Diffs vor dem Commit, gegen den Strich: „was macht das mit dem, was schon da ist?\" Dann nachgesehen statt vermutet — `marken.ts:11` gibt einer Textmarke ohne eigene Farbe `#111111`.",
            "ursache": "Bis E558 war jedes Blatt weiss. Die feste schwarze Tinte war deshalb nie eine Annahme, sondern eine Tatsache — und sie wurde durch dieselbe Zeile zur Annahme, die den Hintergrund einfuehrte. Eine Folie mit dunklem Master und Text ohne eigene Farbe (weil sie im Original aus dem Thema kaeme) waere schwarz auf dunkelblau gewesen.",
            "loesung": "Nicht raten, sondern rechnen: WCAG-Kontrast der Grundfarbe gegen `#111111`. Unter 4,5:1 bekommt ein Absatz OHNE eigene Farbe ausdruecklich Weiss; ein Absatz MIT eigener Farbe behaelt sie immer. Gemessene Kante: #767676 kippt (4,16), #888888 nicht (5,33).",
            "warumKeineUhr": "—",
            "beweis": "test513 §5, vier Zusagen an drei Gruenden plus Weiss. Die Gegenprobe ohne Kippen: 15 gruen, 2 rot. Und ein Bild (`bilder/pptx-tinte.png`), auf dem kein Absatz eine eigene Farbe nennt.",
            "lehre": "Eine neue Faehigkeit ist nie nur eine Zugabe — sie hebt eine stille Voraussetzung auf, unter der der Rest gebaut wurde. Hier war es „das Blatt ist weiss\". Die Frage vor jedem Commit ist deshalb nicht „funktioniert das Neue?\", sondern „welche Annahme des Alten habe ich gerade gekippt?\". Keine Pruefung dieses Bogens haette danach gesucht; das eigene Diff zu lesen schon.",
            "entscheidung": "E558"
        },
        {
            "nr": "P36",
            "datum": "2026-09-13",
            "titel": "Die Pruefung hatte unrecht und der Code recht",
            "schwere": "klein",
            "symptom": "`test514 §4` meldete beim ersten Lauf: „`phClr` wird NICHT geraten — ist '#ffffff', soll ''\". Eine Farbe, von der ich gerade geschrieben hatte, dass sie nicht auflösbar ist, kam als Weiss an.",
            "falscheVermutung": "Dass mein `farbeAus` `phClr` doch irgendwo aufloest — etwa ueber einen Rueckfall im Thema.",
            "wieGefunden": "Nachgesehen statt nachgebessert. `farbeAus` gab tatsaechlich '' zurueck. Das Weiss kam ZWANZIG Zeilen spaeter: die Lesbarkeitsregel aus E558 gibt einem Absatz ohne Farbe auf dunklem Grund ausdruecklich Weiss — und der Grund dieser Prueffolie war Schwarz.",
            "ursache": "Meine Zusage hat zwei verschiedene Dinge fuer dasselbe gehalten: „die Farbe wurde nicht aufgeloest\" und „die Marke hat keine Farbe\". Seit E558 sind das nicht mehr dieselbe Aussage.",
            "loesung": "`phClr` wird jetzt auf HELLEM Grund gemessen, wo die Tinte nicht kippt. Daneben steht der Kommentar, warum — sonst macht der naechste dieselbe Verwechslung in die andere Richtung und schwaecht die Zusage, um sie gruen zu bekommen.",
            "warumKeineUhr": "—",
            "beweis": "Die Gegenprobe G4 (phClr auf irgendwas aufloesen) ist auf dem hellen Grund rot: 12 gruen, 1 rot. Die Zusage kann also weiterhin rot werden — sie misst nur nicht mehr das Falsche.",
            "lehre": "Wenn eine neue Pruefung rot ist, ist die Pruefung genauso verdaechtig wie der Code — und bei einer Zusage, die ich GERADE geschrieben habe, sogar mehr. Der Reflex „den Code anpassen, bis es gruen ist\" haette hier eine richtige Regel kaputtgemacht. Der zweite Reflex — „die Zusage abschwaechen\" — waere genauso falsch gewesen. Richtig war, den Messplatz zu wechseln, damit die Zusage wieder GENAU das misst, was sie behauptet.",
            "entscheidung": "E559"
        }
    ]
};
window.ChronikDaten = ChronikDaten;
