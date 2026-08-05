# Das Aussehen des Tabellenblocks

Fünf Entscheidungen, bevor die erste Zeile CSS entsteht. Sie stehen hier, weil
sie sonst niemand mehr nachvollziehen kann — und weil die nächste Person am
Block sie kennen muss, statt sie neu zu erfinden.

---

## 1 · Wer benutzt das, in welcher Lage?

Jemand, der aus **Excel** kommt und in Redion eine Rechnung braucht — Haushalt,
Angebot, Trainingsplan. Am Rechner mit Maus und Tastatur, und am **iPhone 13
Pro Max** mit dem Daumen.

Daraus folgt das Wichtigste: **Wiedererkennung schlägt Eigenständigkeit.** Wer
`A1` anklickt und tippt, muss bekommen, was er erwartet. Ein Tabellenblock, der
sich originell verhält, ist ein schlechter Tabellenblock.

## 2 · Welcher Stil?

**Notion, unverändert.** Redion sieht aus wie Notion — das ist der ganze Punkt
des Projekts, und ein Block, der aus der Reihe tanzt, wäre der einzige.

Konkret heisst das: ruhig, textlastig, feine Linien statt Kästen, fast keine
Schatten, kleine Radien (4–6 px), viel Weissraum an den Rändern und **wenig**
innerhalb der Tabelle. Eine Tabelle ist dicht; das ist ihre Aufgabe.

Das eine, was von Excel kommt statt von Notion: **die Auswahl.** Dazu unten.

## 3 · Welche Palette?

**Keine neue Farbe.** Alles aus `dunkel.css` und `hell.css`:

```txt
--bg          Zellfläche
--bg-card     Zeilen- und Spaltenköpfe, Bearbeitungszeile
--bg-hover    Zelle unter dem Zeiger, Kopf der ausgewählten Spalte
--line        Trennlinie zwischen Kopf und Raster
--line-soft   das Gitter selbst
--text        Zellinhalt
--text-dim    Kopfbeschriftung A B C, 1 2 3
--accent      die Auswahl (#2eaadc — Notions Blau)
--c-red       Fehlerwerte
```

Jede Farbe, die hier nicht steht, ist ein Fehler. Sie würde im Hellmodus
falsch aussehen, und zwar erst, wenn jemand hell arbeitet.

## 4 · Welche Schrift?

`--font` für alles — dieselbe wie im Rest der App. Aber mit einem Zusatz, der
den Unterschied zwischen „Tabelle" und „Liste von Text" ausmacht:

```css
font-variant-numeric: tabular-nums;
```

**Ziffern gleicher Breite.** Ohne das steht `1.111` schmaler als `8.888`, und
eine Spalte mit Beträgen franst rechts aus. Das sieht man nicht bewusst, aber
man merkt, dass etwas nicht stimmt.

Die Bearbeitungszeile bekommt `--mono`: dort steht eine Formel, und in einer
Formel zählt jedes Zeichen einzeln.

## 5 · Was ist das eine Element, an das man sich erinnert?

**Der Auswahlrahmen mit dem Anfasser.**

```txt
        ┌─────────┐
        │   42    │   2 px --accent, INNEN liegend, ohne Radius
        └───────■─┘   6 px Quadrat unten rechts
```

Zwei Kleinigkeiten, die zusammen den Unterschied machen:

- **Innen liegend** (`inset box-shadow` statt `border`). Ein Rahmen aussen
  verschiebt das Raster um zwei Pixel, und die ganze Tabelle zuckt beim
  Anklicken.
- **Ohne Radius.** Runde Ecken sind überall sonst in Redion richtig; hier
  nicht. Ein Tabellenprogramm hat scharfe Zellen — Excel, Numbers, Sheets,
  alle. Eine runde Auswahl fühlt sich sofort falsch an, ohne dass man sagen
  kann, warum.

Der Anfasser unten rechts zeigt, dass man die Auswahl ziehen kann. Er ist das
Zeichen, an dem ein Mensch die Tabelle als Tabelle erkennt.

---

## Masse

| | Rechner | Telefon | warum |
|---|--:|--:|---|
| Zeilenhöhe | 32 px | 40 px | 32 ist Notions Zeilenhöhe · am Finger zu wenig |
| Spaltenbreite | 110 px | 110 px | genug für „1.234,56" |
| Kopfspalte links | 44 px | 44 px | Platz für vierstellige Zeilennummern |
| Schriftgrösse Zelle | 14 px | 16 px | **unter 16 px zoomt iOS beim Antippen** |
| Schriftgrösse Kopf | 12 px | 12 px | |

Die 16 px am Telefon sind keine Geschmacksfrage: Safari zoomt die ganze Seite
hinein, sobald ein Eingabefeld kleiner ist, und danach steht die Tabelle
verrutscht da.

## Was bewusst fehlt

**Keine Schatten** ausser am Menü. Ein Schatten heisst „schwebt darüber" — eine
Zelle schwebt nicht.

**Kein Farbverlauf.** Nirgends.

**Keine Hover-only-Funktion.** Alles, was der Zeiger kann, geht auch mit dem
Finger und mit der Tastatur. Am Telefon gibt es kein Hover, und wer nur mit
der Tastatur arbeitet, hat auch keines.

## Fokus

Jede Zelle ist erreichbar, und wo der Fokus steht, ist zu sehen — der
Auswahlrahmen ist zugleich der Fokusring. Die Tabelle selbst ist **ein**
Tabellenstopp: man springt hinein und bewegt sich darin mit den Pfeiltasten,
statt sich durch tausend Zellen zu tabben.

---

# Nachtrag — was das Hinsehen geändert hat

Das Obige entstand vor der ersten Zeile CSS. Was folgt, entstand danach: beim
Ansehen der Bildschirmfotos. Es steht hier und nicht oben, weil der
Unterschied zählt — das eine sind Absichten, das andere sind Befunde.

## Der Auswahlrahmen ist der Fokusring — beide zugleich geht nicht

Oben steht: „der Auswahlrahmen ist zugleich der Fokusring". Der erste Entwurf
setzte trotzdem einen zweiten, 2 px starken Rahmen um das ganze Raster, wenn
es den Fokus hat. Auf dem Bild zog sich dadurch eine blaue Linie am rechten
Rand entlang, und man wusste nicht, was sie bedeutet.

Jetzt färbt sich der **Rahmen des Blocks**. Leise, eindeutig, und ohne dem
Auswahlrahmen die Aufmerksamkeit zu nehmen.

## `⟨ ≡ ⟩` waren keine Ausrichtungszeichen

Sie sahen auf dem Bildschirm aus wie `(` und `)`. Jetzt drei Striche
unterschiedlicher Länge — das Zeichen für Ausrichtung in jedem Programm, das
es gibt, und ohne fremdes Symbolpaket.

## Die eine Regel, die wichtiger ist als alles Gestalterische

**Eine Zahl, die nicht passt, darf keine andere Zahl sein.**

Rechtsbündig schneidet der Browser vorne ab: aus `634.2166666667` wurde
`34.2166666667`. Vollständig aussehend, plausibel, falsch.

    passt              →  634.2166666667
    passt gekürzt      →  634.216667      (voller Wert im Titel)
    passt gar nicht    →  ###

Die Zeichenbreite wird über eine Leinwand gemessen, nicht über das Layout —
`scrollWidth` sagt bei Flexbox immer „passt schon", weil der Text gestaucht
statt übergestellt wird.

## Die Masse am Telefon, korrigiert

| | vorher | jetzt | warum |
|---|--:|--:|---|
| Spaltenbreite | 110 px | **128 px** | `1’450.00 CHF` ist bei 16 px Schrift 99 px breit, mit Innenabstand 114 — in 110 px stand bei jedem Betrag `###` |
| kleinste Spalte | 88 px | **112 px** | die 88 aus `redion-mobile-ux` stammen aus einer Welt mit kleinerer Schrift |
| Knöpfe in der Leiste | 11 | **2** | 11 × 44 px sind 484 px auf einem 390 px breiten Gerät; die letzten drei standen ausserhalb des Bildes |
| Knopfgrösse | 38 px | **44 px** | die Zahl, die ein Finger braucht |

Die Werkzeugleiste steht am Telefon in einer eigenen Zeile unter der
Bearbeitungszeile. Vorher teilten sie sich eine, und das Eingabefeld wurde auf
null Pixel gequetscht — man konnte keine Formel tippen.

**Format** öffnet ein Blatt von unten mit allem, was gestaltet, plus
„Nach unten ausfüllen" und „Nach rechts ausfüllen". Der Anfasser selbst ist am
Finger ausgeblendet: er hängt an `mousemove`, und am Berührungsbildschirm
würde das Ziehen zum Rollen.
