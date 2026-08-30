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
· Commits ja, aber kein git push. Das Hochladen mache ich selbst über
  auto-hochladen.bat.

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

## Nach der Arbeit hochladen

Claude Code committet, lädt aber nicht hoch. Das machst du:

1. `auto-hochladen.bat` auf dem Desktop starten — sie schaut alle 60
   Sekunden nach Änderungen in `Redion-src` und lädt sie hoch.
2. Oder einmalig: `auto-hochladen.bat /einmal`

Beim ersten Mal fragt Windows nach deinem GitHub-Konto. Falls das nicht
klappt: GitHub Desktop öffnen → File → Options → Accounts → Sign in.

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
- **Nichts hochladen.** Commits ja, `push` machst du.
- **Nichts löschen ohne Rückfrage.**
