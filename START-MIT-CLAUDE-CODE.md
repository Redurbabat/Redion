# Mit Claude Code an Redion weiterarbeiten

Diese Datei ist für **dich**, nicht für Claude. Sie sagt, wie du anfängst und
was du hineinkopierst.

---

## Einmalig einrichten

1. **Claude Code installieren** (falls noch nicht):
   ```
   npm install -g @anthropic-ai/claude-code
   ```

2. **In den Projektordner gehen** — dort, wo `CLAUDE.md` liegt:
   ```
   cd %USERPROFILE%\Documents\ChatGPT\Redion\Redion-src
   ```

3. **Claude Code starten:**
   ```
   claude
   ```

`CLAUDE.md` wird von selbst gelesen. Du musst die Regeln nicht wiederholen.

---

## Der Prompt zum Anfangen

Kopiere den Text zwischen den Linien und füge ihn als erste Nachricht ein.

---

```
Du arbeitest an Redion — einer Notiz- und Datenbank-App, die ohne Server und
ohne Konto läuft und deren Daten dem Gerät gehören.

Lies zuerst diese vier Dateien, in dieser Reihenfolge:

  1. CLAUDE.md              die Regeln für die Arbeit hier
  2. doku/ARCHITEKTUR.md    wo liegt was, wer darf wen rufen
  3. AUFGABEN.md            was offen ist, in der Reihenfolge, die Sinn ergibt
  4. doku/WAS-REDION-MEHR-KANN.md   was schon gebaut ist und warum

Alle Informationen zu Notion — was es kann, was nicht, wie jeder Knopf sitzt,
die 21 Lücken und die 36 Ideen, gegen die hier gebaut wird — liegen unter
Desktop\Notion-Doku\Redion-Recherche. Wenn eine Frage lautet „wie macht
Notion das?", steht die Antwort dort. Geprüft und mit Quellen, nicht geraten.
Rate nie, wenn du dort nachsehen kannst.

Alles auf Deutsch: Ordner, Dateinamen, Variablen, Funktionen, Kommentare,
Commit-Texte, Oberfläche. Schweizer Schreibweise, ss statt ß.

Dann fang mit der obersten offenen Aufgabe aus AUFGABEN.md an — A1, die
Seitenleiste herauslösen.

Wie ich arbeiten möchte:

· Stell keine Fragen. Wenn etwas unklar ist, wähl die beste, professionellste
  Lösung und arbeite weiter. Begründe die Entscheidung im Kommentar.
· Arbeite ohne Pause, bis eine Aufgabe wirklich fertig ist. Nicht halb
  machen und als fertig melden — lieber weniger anfangen und das grün
  abschliessen.
· Nach jeder Änderung laufen die betroffenen Prüfläufe, vor jedem Commit ein
  breiter Querschnitt. Ein grüner Lauf ist die einzige Aussage darüber, dass
  etwas fertig ist.
· Ein Umzug, der Verhalten ändert, ist kein Umzug. Erst verschieben und grün
  werden, dann ändern.
· Wirf nie Daten weg. Reparieren heisst auffüllen, nicht überschreiben.
· Fehler, die du unterwegs findest, gehören in den Commit-Text — auch wenn
  sie nichts mit dem Thema zu tun haben. Sie sind das Wertvollste an der
  Arbeit.
· Melde mir alle 30 Minuten den Stand: was fertig ist, was du gerade tust,
  was als Nächstes kommt.
· Commits ja. Wenn du an einem anderen Rechner arbeitest, schiebst du
  nach GitHub — ich hole es mir mit holen.bat. Arbeitest du auf meinem
  Rechner: kein git push, das mache ich mit hochladen.bat.

Wenn du eine Aufgabe abgeschlossen hast: streich sie in AUFGABEN.md, trag
ein, was dabei aufgefallen ist, und mach mit der nächsten weiter.
```

---

## Wenn du an etwas Bestimmtem arbeiten willst

Statt „fang mit A1 an" schreib, was du willst — Claude findet den Rest
selbst:

> Bau B1 aus AUFGABEN.md: Begriffe erkennen, die dasselbe meinen. Die
> Recherche dazu steht in Notion-Doku unter Idee 25.

oder

> In der Tabelle ruckelt das Scrollen ab etwa 500 Zeilen. Finde heraus warum
> und behebe es. Miss vorher und nachher.

---

## Die zwei Richtungen: holen und hochladen

Im Projektordner liegen zwei Skripte zum Doppelklicken. **Jedes geht nur in
eine Richtung**, und keines fasst die andere an. Das ist Absicht: ein
Werkzeug, das mal so und mal so herum arbeitet, macht irgendwann das
Falsche, und beim Austausch zwischen zwei Rechnern heisst „das Falsche"
verlorene Arbeit.

| | Richtung | Wofür |
|---|---|---|
| **`holen.bat`** | GitHub ⟶ dein Ordner | Claude hat woanders gearbeitet und nach GitHub geschoben. Damit holst du es. |
| **`hochladen.bat`** | dein Ordner ⟶ GitHub | Du hast hier etwas geändert und willst es hinbringen. |

### `holen.bat` — den Stand von GitHub holen

Der übliche Fall, seit Claude an einem anderen Rechner arbeitet. Danach hat
dein Ordner genau den Stand von GitHub.

**Es lädt nichts hoch, nie. Und es wirft nichts weg.** Liegt bei dir eigene
Arbeit, wird sie vorher gesichert und benannt — eigene Commits auf einem
Zweig `sicherung/vor-holen-<datum>`, geänderte und neue Dateien in Gits
Ablage. Am Ende steht auf dem Bildschirm, wo beides liegt und wie du es
zurückholst. Erst danach wird gleichgemacht.

Danach: **Redion offen lassen und zweimal neu laden (F5).** Beim ersten Mal
holt der Browser den neuen Dienst-Arbeiter, angezeigt wird dabei aber noch
der alte Stand; beim zweiten Mal kommt alles aus dem neuen. Tabs schliessen
musst du nicht — der Arbeiter übernimmt von selbst (`skipWaiting` und
`clients.claim` in `src/dienst/sw.ts`).

Sieht danach noch etwas seltsam aus, lade ein drittes Mal. Der Grund, ehrlich
gesagt: nur wenn `VERSION` in `src/dienst/sw.ts` erhöht wurde, wird der alte
Speicher komplett weggeworfen; sonst kommt jede Datei einzeln nach, und ein
zu früher zweiter Ladevorgang kann Altes und Neues mischen. Hast du Redion
über `oeffnen.bat` gestartet (also als Datei), läuft gar kein Dienst-Arbeiter
— dann genügt einmal.

### `hochladen.bat` — deinen Stand zu GitHub bringen

Fragt dich in einem Satz, was du geändert hast, hält es fest und schiebt es
hoch.

**Es überschreibt nie fremde Arbeit.** Steht auf GitHub etwas Neueres, als du
hast, bricht es ab und sagt dir, dass zuerst `holen.bat` dran ist. Kein
`--force`, nirgends: ein erzwungener Push wirft die Arbeit von jemand
anderem weg, und das lässt sich nicht rückgängig machen.

### Das alte `auto-hochladen.bat` auf dem Desktop

Das kann weg — `hochladen.bat` im Projektordner ersetzt es. Zwei Skripte für
dieselbe Sache sind eine Gelegenheit zu viel, das falsche zu erwischen.
Der Unterschied: `auto-hochladen.bat` lag auf dem Desktop, war nicht
mitversioniert, und es prüfte nicht, ob drüben etwas Neueres steht.

### Beim ersten Mal

**Zum Holen brauchst du keine Anmeldung.** Das Verzeichnis ist öffentlich
lesbar — `holen.bat` und `git clone` funktionieren ohne Konto. Scheitert
`holen.bat`, ist es immer das Netz.

**Zum Hochladen schon.** Beim ersten Push öffnet Windows dafür ein
Browserfenster; ein GitHub-**Passwort** wird dort nicht mehr angenommen, nur
die Anmeldung im Browser. Und einmalig, sonst scheitert der erste Commit:

```
git config --global user.name  "Redur Babat"
git config --global user.email "redurbabat7@gmail.com"
```

### Ganz ohne Ordner anfangen

Auf einem Rechner, der Redion noch gar nicht hat:

```
cd %USERPROFILE%\Documents\ChatGPT\Redion
git clone https://github.com/Redurbabat/Redion.git Redion-src
```

Danach liegen die beiden Skripte schon drin.

---

## Wenn etwas kaputtgeht

Der letzte funktionierende Stand liegt immer in Git:

```
git log --oneline -10        was zuletzt geschah
git diff HEAD~1              was sich zuletzt geändert hat
git checkout -- .            alles Ungespeicherte verwerfen
git reset --hard HEAD~1      den letzten Commit zurücknehmen
```

Und die Prüfläufe sagen dir, ob es wieder geht:

```
npm run pruefen
```

Beim ersten Mal einmalig `npm install` — das holt Playwright, mit dem die
Läufe einen echten Browser starten. Sonst braucht das Projekt nichts.

---

## Was Claude Code hier nicht tun soll

Steht ausführlich in `CLAUDE.md`, hier die Kurzfassung:

- **Keinen Bauschritt einführen.** Kein Vite, kein Webpack, kein React. Die
  App muss per Doppelklick auf `index.html` laufen — das ist der Kern.
- **Keine Schlüssel im Code.** Der KI-Schlüssel wird von dir in einem Feld
  eingetragen und bleibt im Browser.
- **Auf deinem Rechner nichts hochladen.** Commits ja, `push` machst du
  mit `hochladen.bat`. (An einem anderen Rechner schiebt Claude selbst nach
  GitHub — sonst käme die Arbeit nie bei dir an.)
- **Nichts löschen ohne Rückfrage.**
