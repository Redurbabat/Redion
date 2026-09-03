# Auftrag 01 — Das Menüband wird ruhig

Stand: 3. September 2026 · Zweig: `claude/region-detailed-analysis-pzqqb4`

Dies ist ein vollständiger Arbeitsauftrag. Er ist so geschrieben, dass eine
frische Sitzung ihn ohne Rückfragen ausführen kann — mit einer Ausnahme, und
die steht in Abschnitt 5. Dort ist eine Entscheidung zu treffen, die Redur
gehört, nicht dem Werkzeug.

---

## 1 · Was erreicht werden soll

Redion soll sich anfühlen wie GoodNotes und Notion zusammen: **fast nichts zu
sehen, nichts entfernt.** Dies ist der erste von fünf Schritten dorthin — der
kleinste mit dem größten sichtbaren Unterschied.

Konkret: In der ruhigen Fassung trägt die Menüleiste keine Reiter mehr,
solange das Band zugeklappt ist. Sie kommen zurück, sobald jemand das Band
aufklappt — an derselben Stelle, in derselben Reihenfolge.

**Nichts wird gelöscht.** Kein Knopf verlässt den Baum, keine Handlung wird
abgemeldet, kein Register angefasst.

---

## 2 · Ausgangslage, nachgemessen

Gemessen an der laufenden App bei 1440 × 900, Willkommensdialog entfernt,
Band zugeklappt:

    44 anklickbare Dinge auf dem Startbild

Der Aufbau der obersten Leisten, aus dem DOM gelesen (nicht geraten):

    div#menueband.ist-zu
      div.mb-reiter        1440 × 36 px  @ y = 0
        div.mb-marke                     „N"
        button#mb-datei.mb-datei         „Datei"
        div.mb-tabs                      die Reiterknöpfe (.mb-reiter-knopf)
        div.mb-platz                     Platzhalter, unsichtbar
        div.mb-rechts                    Klapp-Pfeil · Suche · KI · Konto
      div.mb-band          0 × 0         zugeklappt durch .ist-zu

    main#main
      header#topbar        1386 × 54 px  @ y = 37
        btn-back · btn-fwd · Brotkrume · btn-ai („KI") · …

Wichtig für später: `#mb-suche`, `#mb-ki` und `#mb-konto` liegen in
`.mb-rechts` — **nicht** in der Kopfzeile. Sie dürfen nicht mit ausgeblendet
werden, sonst ist die Suche unerreichbar. Die Kopfzeile hat zwar ein eigenes
`#btn-ai`, aber keine Suche.

---

## 3 · Der Fund: die Mechanik existiert schon

`src/schale/aufbau/ruhig.ts` (E218/E219) löst genau dieses Problem bereits —
aber nur für die Seitenleiste. Aus seinem eigenen Kopfkommentar:

> Es entfernt nichts. Kein Knopf wird aus dem Baum genommen, keine Handlung
> abgemeldet, keine zweite Liste angelegt. Ein Datenattribut am `body` sagt,
> was gerade zu sehen ist:
>
>     data-ruhig="an"     die fünf Wege plus „Mehr"
>     data-ruhig="offen"  alles, an genau derselben Stelle wie vorher
>     data-ruhig="aus"    die Leiste, wie sie vor E219 war

Von Haus aus steht es auf `an` (`Store.getMeta('ruhig', true)`).

**Dieser Auftrag erfindet nichts Neues. Er weitet diese Mechanik auf die
Menüleiste aus.** Wer stattdessen einen zweiten Schalter, eine zweite Liste
oder einen neuen Knopf baut, hat den Auftrag missverstanden — siehe CLAUDE.md
§8 (keine doppelten Kataloge).

---

## 4 · Die Änderung

### 4.1 Nur eine Datei

    quell/schale/stil/aufbau.css

Diese CSS ist **Quelltext**, kein Erzeugnis — es gibt kein `src/schale/stil/`.
Sie darf von Hand bearbeitet werden. (Zum Gegensatz: `quell/schale/aufbau/*.js`
sind erzeugt und dürfen es nicht.)

Die Regel gehört in den bestehenden `data-ruhig`-Block, der bei etwa Zeile 750
beginnt und ausführlich kommentiert ist. Der neue Abschnitt schließt dort an.

### 4.2 Die Regel

```css
/* DIE MENÜLEISTE, WENN DAS BAND ZU IST.
   Neun Reiter und „Datei" standen auf jedem Bild, auch auf dem Startbild,
   auf dem drei davon nichts tun können. Sie verschwinden hier nicht: die
   Bedingung ist `.ist-zu`, also genau der Zustand, in dem das Band ohnehin
   nichts zeigt. Ein Klick auf den Klapp-Pfeil bringt beides zurück.

   `.mb-rechts` bleibt ausdrücklich stehen — dort hängen Suche, KI und
   Konto, und die Suche gibt es sonst nirgends in der Kopfzeile. */
body[data-ruhig="an"] #menueband.ist-zu #mb-datei,
body[data-ruhig="an"] #menueband.ist-zu .mb-tabs { display: none }
```

### 4.3 Warum kein JavaScript nötig ist

Das ist der Kern des Entwurfs, und er sollte nicht „verbessert" werden:

* **Weg hinein Nr. 1** — `.mb-klapp` heißt bereits „Menüband aufklappen" und
  schaltet `#menueband.ist-zu` um (`menueband.ts`, Zweig `id === '__klapp'`,
  etwa Zeile 1076). Sobald `.ist-zu` fällt, greift die Regel nicht mehr, und
  die Reiter stehen wieder da. **Kein neuer Knopf.**
* **Weg hinein Nr. 2** — `#btn-mehr` in der Seitenleiste setzt
  `data-ruhig="offen"`. Auch dann greift die Regel nicht (sie verlangt `"an"`).
* **Weg hinein Nr. 3** — `Strg + P`, wie für alles Seltene.

Wer hier eine Zeile JavaScript schreibt, sollte zuerst begründen, welchen
dieser drei Wege sie ersetzt.

### 4.4 Was ausdrücklich NICHT getan wird

* `.mb-rechts` nicht ausblenden (Suche wäre weg).
* `.mb-marke` nicht ausblenden (es ist der Weg in die Backstage).
* `.mb-reiter` nicht als Ganzes ausblenden — die Zeile trägt `.mb-rechts`.
* Nichts verschieben. Das Umziehen der Ortsknöpfe ist Auftrag 02.
* Keine Zeile in `menueband.ts`, `ruhig.ts` oder einem Register.

Vertikal gewinnt dieser Schritt **nichts** — die 36-px-Zeile bleibt, weil
`.mb-rechts` darin steht. Der Gewinn ist die Zahl: 44 → 34. Wer mehr
verspricht, misst falsch. Der vertikale Gewinn kommt in Auftrag 03
(schwebende Stiftleiste, rund 120 px).

---

## 5 · Der Konflikt — hier ist eine Entscheidung zu treffen

**Dies ist die wichtigste Stelle des Auftrags. Nicht daran vorbeiarbeiten.**

`pruefungen/lauf/test248.mts` prüft genau die Reiter, die hier ausgeblendet
werden sollen — und zwar auf eine **exakte Zahl**:

    Zeile 144   reiter: z('#menueband .mb-reiter-knopf')

    Zeile 241   p('Über einer Startansicht bleiben fünf Reiter statt acht',
                  imRegal.reiter === 5, …)

    Zeile 265   p('Über einer offenen Seite sind es wieder acht',
                  beiOffenerSeite.reiter === 8, …)

Nach der Änderung sind beide Zahlen **0**. Zwei Zusicherungen werden rot.

Das ist kein Versehen im Prüflauf, sondern eine **Aussage aus E236/E272**, die
dem Auftrag widerspricht. Der Kommentar darüber sagt es wörtlich:

> Unveraendert ist das, worauf es hier ankommt: die drei Reiter, die IN eine
> Seite schreiben, stehen ohne Seite nicht da (`BRAUCHT_SEITE`).

E236/E272 sagen: *die Reiterzeile verdient ihren Platz, weil sie sich schon
anpasst — fünf ohne Seite, acht mit.* Dieser Auftrag sagt: *sie verdient
keinen ständigen Platz.* Beides ist vertretbar. Beides gleichzeitig geht nicht.

### Was zu tun ist

**Den Prüflauf nicht still umschreiben.** Ein Prüflauf, der eine Entscheidung
festhält, ist kein Hindernis — er ist das Gedächtnis des Projekts.

Der Vorschlag, der beide Absichten erhält: Die Zusicherung behält ihre Zahlen,
bekommt aber den Zustand dazu, für den sie gilt — **bei aufgeklapptem Band**.
Denn die Aussage von E236/E272 ist *welche* Reiter dastehen, nicht *dass sie
immer* dastehen. Also vor der Messung das Band aufklappen und die 5 bzw. 8
dort prüfen, und im Ruhezustand zusätzlich die neue Aussage festhalten:
im Regal sind es 0, und die Suche steht trotzdem rechts.

Diese Änderung an test248 ist **eine eigene Entscheidung** und gehört nach
`ENTSCHEIDUNGEN.md` mit neuer Nummer, mit dem Widerspruch im Wortlaut und
mit der Begründung, warum die neue Fassung die alte Aussage nicht verliert.

**Wenn Redur das anders sieht, ist der ganze Auftrag hinfällig** — dann bleibt
die Reiterzeile, und der Weg zur ruhigen Schale beginnt bei Auftrag 03. Das
ist eine legitime Antwort. Sie muss nur ausgesprochen werden, statt dass ein
Prüflauf leise weicher gemacht wird.

---

## 6 · Rot zuerst — der neue Prüflauf

Vor der CSS-Zeile entsteht `pruefungen/lauf/test359.mts`. Er muss **rot sein,
bevor die Regel da ist**, sonst ist er kein Prüflauf, sondern eine Dekoration
(CLAUDE.md §55.2).

Gerüst wörtlich von `test248.mts` übernehmen: eigener HTTP-Server,
`seiteAuf()` samt `rundgangGesehen`, Entfernen der Overlays,
`process.exit(weg ? 1 : 0)` am Ende. Ohne diese letzte Zeile meldet
`alle.mts` den Lauf als kaputt.

Port: **9371**. Nachgemessen sind 8968 (test248) und alles bis 9369 vergeben;
zwei Läufe auf demselben Port scheitern nur, wenn sie gleichzeitig laufen —
und `alle.mts` tut genau das nicht, was die Sache um so leichter übersehbar
macht.

Diese Behauptungen muss er prüfen:

**§1 — In Ruhe sind sie weg**
* `body[data-ruhig]` ist `"an"` (Ausgangslage, nicht Zufall — ausdrücklich
  setzen statt hoffen).
* `#menueband` trägt `.ist-zu`.
* Sichtbare `.mb-reiter-knopf`: **0**.
* `#mb-datei` ist nicht sichtbar.

**§2 — Aber erreichbar, und das ist der eigentliche Punkt**

Die Lehre aus test248 §3, wörtlich zu beherzigen:

> Ein Knopf, den niemand je zu sehen bekommt, ist gelöscht; im Baum zu stehen
> hilft keinem Menschen.

Also nicht prüfen, ob die Reiter im DOM stehen, sondern ob ein Mensch hinkommt:
* Klick auf `.mb-klapp` → sichtbare Reiter **> 0**, und es sind dieselben
  Namen wie mit `data-ruhig="aus"` (an `data-mb-reiter` vergleichen, nicht
  an der Zahl).
* `Ruhig.setzen(false)` → Reiter sichtbar, alte Fassung unverändert.
* `data-ruhig="offen"` → Reiter sichtbar.

**§3 — Die Suche überlebt**
* `#mb-suche`, `#mb-ki`, `#mb-konto` bleiben in **allen** Zuständen sichtbar.
  Das ist die Zusicherung, die verhindert, dass später jemand `.mb-reiter`
  im Ganzen ausblendet.

**§4 — Die Gegenprobe: kann der Lauf überhaupt rot werden?**
* Mit `data-ruhig="aus"` müssen die Reiter **sichtbar** sein. Ohne diese
  Zeile wäre §1 auch dann grün, wenn die Reiter aus einem ganz anderen Grund
  nie erscheinen.
* Die Sichtbarkeitsprüfung misst Breite, Höhe **und** `visibility` — ein
  Element mit `visibility:hidden` ist weder klickbar noch im Tabulator-Weg.
  `RAHMEN` aus test248 macht das bereits richtig; übernehmen statt neu bauen.

**§5 — Am Telefon**
* Bei 390 px Breite darf nichts waagerecht überlaufen
  (`documentElement.scrollWidth - clientWidth === 0`).
* Achtung, und das ist mehr als ein Randfall: `zugeklappt()` in
  `menueband.ts` (Zeile 166) lautet `amTelefon() || meta(...)`. **Am Telefon
  ist das Band also immer zu**, und damit greift die neue Regel dort in jedem
  Fall — die Reiter sind am Telefon von Haus aus weg.

  Das ist erwünscht, nicht versehentlich: E240 hält Redurs vier iPhone-Fotos
  fest, auf denen das Band dauerhaft 371 von 844 px belegte. Am Telefon ist
  das Band seither ein Menü, kein Zustand.

  Der Weg zurück funktioniert dort trotzdem, aber über einen anderen Zweig:
  `__klapp` ruft am Telefon `fluechtig(false)`, und das nimmt `.ist-zu`
  **als Klasse** vom Baum, ohne den Speicher anzufassen. Die Regel hängt an
  genau dieser Klasse, greift also nicht mehr. Prüfen statt annehmen: bei
  390 px tippen und nachsehen, dass die Reiter erscheinen — und dass sie nach
  einer Neuzeichnung wieder weg sind, wie E240 es will.

**§6 — Keine Fehler auf der Seite**, wie in jedem Lauf des Hauses.

---

## 7 · Verifizieren — in dieser Reihenfolge

```
node pruefungen/lauf/test359.mts     # der neue: erst rot, dann grün
node pruefungen/lauf/test248.mts     # der Konflikt aus Abschnitt 5
node pruefungen/lauf/test272.mts     # kennt die Reiternamen
node pruefungen/lauf/test222.mts     # kennt data-ruhig
node pruefungen/lauf/test128.mts     # desgleichen
node pruefungen/lauf/test247.mts
node pruefungen/lauf/test328.mts
node pruefungen/lauf/test33.mts
node pruefungen/lauf/test40.mts

npm run typecheck                    # muss 0 Fehler bleiben
node bauen.mts                       # Einzeldatei nachziehen (§29)
git diff --stat redion-einzeldatei.html   # MUSS sich ändern, s. u.
node bilder.mts schaleBand           # und wirklich hinsehen (§55)
```

Zur Einzeldatei: `redion-einzeldatei.html` bündelt die CSS mit — `data-ruhig`
kommt darin heute 61-mal vor. Nach der Änderung muss die Datei sich ändern,
und die geänderte Fassung gehört in denselben Commit. Der CI-Schritt „Ist die
Einzeldatei nachgezogen?" prüft genau das.

Zum Schluss der volle Lauf:

```
node pruefungen/alle.mts --schnell
```

Er dauert rund 20 Minuten (321 Läufe, drei Sekunden Pause dazwischen).
**Bekannt rot, unabhängig von diesem Auftrag:** `test178` (zwei Punkte, PDF-
Zeichenfläche fällt auf 0 × 0,83 px zusammen). Das ist nicht durch diesen
Auftrag verursacht und muss nicht hier behoben werden — aber es darf auch
nicht als „war schon vorher rot" für einen *anderen* Lauf herhalten. Jeder
weitere rote Lauf gehört zu dieser Änderung.

### Und wirklich hinsehen

CLAUDE.md §55 ist keine Höflichkeitsfloskel. Beim Tabellenblock fand das
Hinsehen vier Fehler, die keine Prüfung hatte. Nach der Änderung:
`node bilder.mts schaleBand` und `node bilder.mts notizheft`, dann die Bilder
aus `bilder/` ansehen und Redur zeigen. Zu prüfen ist mit Augen:

* Sieht die verkürzte Zeile aufgeräumt aus oder verloren? Eine Zeile mit
  „N" links und drei Zeichen rechts kann beides sein.
* Springt beim Aufklappen etwas, oder wächst es?
* Ist der Klapp-Pfeil noch als Weg erkennbar, wenn links neben ihm nichts
  mehr steht?

Die dritte Frage ist die ernsteste: Der Pfeil war bisher das Ende einer
Reihe. Allein an der rechten Kante kann er zu einer Zierde werden, die
niemand anklickt. Fällt das beim Hinsehen auf, ist die Antwort **nicht**,
die Regel zurückzunehmen, sondern dem Pfeil ein Wort zu geben
(„Werkzeuge"). Das wäre dann der einzige neue Knopf — und er ersetzt zehn.

---

## 8 · Fertig heißt

* `test359` grün, und er war vorher nachweislich rot.
* `test248` grün — entweder unverändert, oder bewusst geändert **mit** neuem
  Eintrag in `ENTSCHEIDUNGEN.md`.
* `npm run typecheck` ohne Fehler.
* `redion-einzeldatei.html` neu gebaut und mit committet.
* Kein weiterer Lauf rot außer dem bekannten `test178`.
* Bilder gemacht und angesehen.
* `ENTSCHEIDUNGEN.md`: neuer Eintrag mit dem Widerspruch aus Abschnitt 5 im
  Wortlaut.
* `LUECKEN.md`: die vier verbleibenden Schritte als offene Lücke vermerkt.
* Commit auf `claude/region-detailed-analysis-pzqqb4`, gepusht.

---

## 9 · Grenzen

* Nur Redion. Nicht BABAT-RED, STRAN, RED-KURD, RhythmVerse.
* Kein React, kein Framework, keine neue Abhängigkeit (§6, §47).
* `index.html` muss weiterhin per Doppelklick starten.
* Keine Datenmigration, kein Feldname geändert (§53.3).
* `quell/schale/aufbau/*.js` sind erzeugt — nicht von Hand ändern.
  `quell/schale/stil/*.css` sind Quelle — die schon.
* Nichts löschen. Wenn ein Knopf verschwindet, muss im selben Commit
  nachweisbar sein, wo ein Mensch ihn stattdessen findet.

---

## 10 · Was danach kommt

Dieser Auftrag ist Schritt 1 von 5. Die anderen vier, in Reihenfolge:

2. Die 17 Ortsknöpfe („Heute", „Bibliothek", …) in die linke Leiste — sie
   stehen ohnehin schon in `register/navigation.ts` (39 Einträge).
3. Die Stiftleiste zum Schweben bringen — der Schritt mit dem größten
   Raumgewinn, rund 120 px.
4. Die Heft-Leiste an den Fuß des Papiers, wie GoodNotes.
5. Ein Prüflauf, der die Zahl der sichtbaren Bedienelemente je Zustand
   festhält, damit die Leiste nicht in einem halben Jahr wieder zuwächst.
   Sie ist ja nicht aus Absicht so geworden.
