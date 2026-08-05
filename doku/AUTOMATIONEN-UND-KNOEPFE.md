# Automationen und Knöpfe — die vollständige Referenz

**Stand: 2. August 2026**

Die Notion-KI hat dafür drei Hilfeseiten geladen: *Database automations*,
*Buttons* und *Database button property*. Sie kennzeichnet jede Zeile mit
**belegt: ja / teilweise** — und zählt am Ende selbst auf, was sie **nicht**
belegen konnte. Beides steht hier unverändert drin.

Spalte **Wir** = unsere App.

---

## 1. Auslöser für Datenbank-Automationen

Notion hat genau **drei** Auslösertypen:

| Notion | Deutsch | Was auslöst | Wir |
|---|---|---|:--:|
| `Page added` | Seite hinzugefügt | Ein neuer Eintrag kommt in die Datenbank | ✅ |
| `Property edited` | Eigenschaft bearbeitet | Eine bestimmte Spalte ändert sich | ✅ |
| `Every {frequency}` | Wiederkehrend | Läuft nach Zeitplan | ⚠ **fehlt bei uns** |

**Wir haben acht** und damit feiner unterteilt, aber ohne den Zeitplan:

| Bei uns | Entspricht |
|---|---|
| Ein Eintrag wird angelegt | Page added |
| Eine Eigenschaft ändert sich | Property edited |
| Eine Eigenschaft bekommt einen bestimmten Wert | Property edited mit Bedingung |
| Ein Eintrag wird bearbeitet — egal welches Feld | *(hat Notion so nicht)* |
| Ein Eintrag verschwindet aus der Datenbank | *(hat Notion so nicht)* |
| Über das Formular kommt eine Antwort | *(hat Notion so nicht)* |
| Einige Tage **vor** einem Datum | *(hat Notion so nicht)* |
| Einige Tage **nach** einem Datum | *(hat Notion so nicht)* |

### 1.1 Auslöser-Logik

| Notion | Bedeutung | Wir |
|---|---|:--:|
| Ein einzelner Auslöser | | ✅ |
| Mehrere Auslöser, **einer** reicht (`any`) | | ⚠ fehlt |
| Mehrere Auslöser, **alle** müssen (`all`) | mehrere „is edited" müssen in **ca. 3 Sekunden** passieren | ⚠ fehlt |
| Zusätzliche Bedingungen am Auslöser | | ◐ teilweise (über „bekommt bestimmten Wert") |
| Wirkungsbereich: ganze Datenbank **oder** eine bestimmte Ansicht | ändert man den Ansichtsfilter, gilt die Automation für die neue Trefferliste | ⚠ fehlt |

### 1.2 Was Notion beim Auslöser „Eigenschaft bearbeitet" genauer kann

Für **Name, Person, Zahl, Text, Auswahl und Verknüpfung** kann man auswählen,
*welche Art* von Änderung auslösen soll — Notions eigenes Beispiel:
„Telefonnummer beginnt mit 732".

> **Die Notion-KI sagt dazu ausdrücklich:** Die Hilfe listet **keine**
> vollständige Operatorentabelle für diese Auslöser. Sie nennt nur, dass man
> für diese Typen die Art der Änderung wählen kann, und gibt ein Beispiel.
> Mehr ist nicht belegbar.

### 1.3 Grenzen der Auslöser — alle belegt

| Grenze | Bedeutung |
|---|---|
| **Automationen lösen keine Automationen aus** | Eine Datenbankautomation kann keine andere anstossen |
| Knöpfe **schon** | Klickt jemand einen Knopf, der eine Seite anlegt, kann das eine Automation auslösen |
| Wiederkehrend ist nicht kombinierbar | `Every {frequency}` lässt sich mit keinem anderen Auslösertyp paaren |
| Wiederkehrend kann kein „Eigenschaft bearbeiten" | Der Zeitplan-Auslöser funktioniert mit **allen** Aktionen ausser dieser einen |
| 3-Sekunden-Fenster | Bei „alle müssen eintreten" müssen die Änderungen innerhalb von rund 3 Sekunden passieren |
| Eingeschränkter Zugriff | Automationen handeln nicht auf Seiten mit beschränktem Zugriff |
| Ansichtsfilter | Passt die Seite beim Auslösen nicht mehr in die Ansicht, läuft nichts |
| Gesperrte Datenbank | Notion nennt das ausdrücklich als möglichen Grund, warum nichts passiert |

---

## 2. Aktionen einer Datenbank-Automation

| Notion | Deutsch | Einstellungen | Plan | Wir |
|---|---|---|---|:--:|
| `Edit property` | Eigenschaft bearbeiten | Spalte wählen, Wert setzen | — | ✅ |
| `Add page to` | Seite hinzufügen zu | Ziel-Datenbank wählen, Eigenschaften setzen; Erwähnungen und Formeln möglich | Schreibrecht nötig | ⚠ **fehlt** |
| `Edit pages in` | Seiten bearbeiten in | Ziel-Datenbank, welche Seiten, welche Eigenschaften | Schreibrecht nötig | ✅ |
| `Send notification to` | Benachrichtigung senden | bis zu **20 Personen** oder Personen aus einer Personen-Spalte, mit Nachricht | — | ⚠ **fehlt** |
| `Send mail to` | E-Mail senden | Gmail-Konto, An, CC/BCC, Betreff, Nachricht, Anzeigename, Antwortadresse | Gmail nötig | ⚠ **fehlt** |
| `Send webhook` | Webhook senden | HTTP-POST an eine Adresse | nur zahlende Pläne | ✅ |
| `Send Slack notification to` | Slack-Nachricht | Kanal wählen, Nachricht — **Formeln gehen hier nicht** | nur Plus/Business/Enterprise | ⚠ fehlt |
| `Define variables` | Variablen festlegen | Variable benennen, Formel oder Erwähnung, mehrere möglich, in späteren Aktionen nutzbar | — | ⚠ **fehlt** |

**Wir haben zusätzlich**, was Notion nicht hat: KI-Feld ausfüllen lassen ·
Erinnerung anlegen · Unterseite im Eintrag anlegen · Zähler um eins erhöhen ·
Nächsten Termin dieser Aufgabe anlegen · Kurze Meldung zeigen.

### 2.1 „E-Mail senden" im Einzelnen

| Einstellung | Bedeutung |
|---|---|
| Send mail from | das verbundene Gmail-Konto |
| Add Gmail Account | ein weiteres Konto verbinden |
| To | Personen-Spalte, auslösende Person, Seitenersteller oder Person im Arbeitsbereich |
| CC / BCC | wahlweise |
| Subject / Message | mit `@` Erwähnungen, mit `∑` Formeln |
| Send with display name | eigener Absendername |
| Send replies to | Antworten gehen woanders hin |
| Zustellzeit | **bis zu 2 Minuten** |
| Gmail-Grenzen | Empfängerzahl und Tageslimit von Gmail gelten |

### 2.2 „Variablen festlegen" im Einzelnen

Variable benennen · über Formel definieren · duplizieren · weitere hinzufügen ·
`@` für Erwähnungen (Datum, Person, Seite, Gruppe, Spalte des Auslösers) ·
`∑` für Formeln · in **allen späteren Aktionen** verwendbar.

### 2.3 Wo Erwähnungen und Formeln erlaubt sind

| Regel |
|---|
| Erwähnungen und Formeln nur in **Aktionen**, nie im Auslöser |
| Keine Formeln bei „Blöcke einfügen" |
| Keine Formeln bei „Seite oder URL öffnen" |
| Keine Formeln bei „Slack-Nachricht senden" |
| `@` fügt Datum, Person, Seite oder Gruppe ein |
| `∑` fügt eine Formel ein |

---

## 3. Aktionen eines Knopfes

Notion unterscheidet **zwei** Knopfarten, die sich stark, aber nicht
vollständig überschneiden.

| Aktion | Knopf-Block | Knopf-Spalte in der Datenbank | Wir |
|---|:--:|:--:|:--:|
| Insert blocks — Blöcke einfügen | ✅ | *nicht genannt* | ✅ |
| Edit property — Eigenschaft bearbeiten | *nicht genannt* | ✅ | ✅ |
| Add page to — Seite anlegen in | ✅ | ✅ | ✅ |
| Edit pages in — Seiten bearbeiten in | ✅ | ✅ | ✅ |
| Send notification to | ✅ | ✅ | ⚠ **fehlt** |
| Send mail to | ✅ | ✅ | ⚠ **fehlt** |
| Send webhook | ✅ | ✅ | ⚠ **fehlt** |
| Show confirmation — Bestätigung | ✅ | ✅ | ✅ |
| Open page or URL | ✅ | ✅ | ✅ |
| Send Slack notification to | ✅ | ✅ | ⚠ fehlt |
| Define variables | ✅ | ✅ | ⚠ **fehlt** |

Bei „Blöcke einfügen" kann man die Stelle wählen: **über dem Knopf, unter dem
Knopf, ganz oben auf der Seite, ganz unten auf der Seite.**

**Wir haben zusätzlich:** Unterseite anlegen · Timer.

---

## 4. Zeitplan für wiederkehrende Automationen

| Option | Belegt |
|---|:--:|
| `Every {frequency}` — einstellbare Häufigkeit | ✅ |
| täglich | ✅ |
| wöchentlich | ✅ |
| monatlich | ✅ |
| Uhrzeit | ✅ |
| Startdatum | ✅ |
| Enddatum | ✅ |
| Zeitzone | ✅ |

> **Die Notion-KI sagt dazu ausdrücklich:** Die Hilfe schreibt „every day,
> week, month, **and so on**" — ob es darüber hinaus jährlich, stündlich,
> bestimmte Wochentage oder „alle X Wochen" gibt, ist **nicht belegt**.

**Bei uns** gibt es diesen Auslöser nicht. Wiederkehrendes lösen wir anders:
über wiederkehrende Vorlagen und über „Nächsten Termin dieser Aufgabe
anlegen" beim Abhaken. Das deckt den häufigsten Fall ab, aber nicht den
allgemeinen Zeitplan.

---

## 5. Was die Notion-KI selbst nicht belegen konnte

Ihre eigene Aufstellung, unverändert:

| Punkt | Warum unbelegt |
|---|---|
| Die genauen Operatoren beim Auslöser „Eigenschaft bearbeitet" | Die Hilfe sagt nur, dass man die Art der Änderung wählen kann, mit einem Beispiel — keine vollständige Tabelle |
| Welche Häufigkeiten es beim Zeitplan alle gibt | „every day, week, month, and so on" — nicht einzeln aufgezählt |
| Die Detail-Einstellungen von „Webhook senden" | Nutzlast, Kopfzeilen, Anmeldung, Wiederholung stehen auf einer eigenen Hilfeseite, die nicht geladen war |
| Die Felder von „Bestätigung anzeigen" | beschrieben, aber ohne Feldliste |
| Ob normale Knöpfe „Eigenschaft bearbeiten" haben | Die Knopf-Hilfe nennt nur „Seiten bearbeiten in"; die Datenbank-Knopf-Hilfe nennt „Eigenschaft bearbeiten" ausdrücklich |
| Ob Datenbank-Knöpfe „Blöcke einfügen" können | in der geladenen Hilfe nicht gelistet |

---

## 6. Was daraus für uns folgt

### Was wir schon 1:1 haben

Alle drei Auslösertypen im Kern (Seite hinzugefügt, Eigenschaft bearbeitet),
und die Aktionen Eigenschaft bearbeiten, Seiten bearbeiten in, Webhook senden.
Beim Knopf: Blöcke einfügen mit Position, Seite anlegen in, Seiten bearbeiten
in, Eigenschaft bearbeiten, Seite oder URL öffnen, Bestätigung.
Dazu sechs Automationsaktionen und zwei Knopfaktionen, die Notion nicht hat.

### Was wir als Nächstes bauen — nach Wert sortiert

1. **Wiederkehrender Auslöser** („Alle X, um HH:MM, ab …, bis …") — der
   einzige fehlende Auslösertyp und der meistgenutzte in Notion.
2. **Variablen festlegen** — eine Aktion, die Werte für alle folgenden
   Aktionen bereitstellt. Das ist der Baustein, ohne den Ketten stumpf bleiben.
3. **Seite anlegen in** als Automationsaktion (beim Knopf haben wir sie schon).
4. **Benachrichtigung senden** — bei uns in den Posteingang statt an 20 Personen.
5. **E-Mail senden** als Automations- und Knopfaktion — die Mail-Anbindung ist
   da, sie muss nur in die Aktionsliste.
6. **Webhook** auch beim Knopf, nicht nur in der Automation.
7. **Mehrere Auslöser mit „einer reicht" / „alle müssen"** und ein
   Wirkungsbereich Ansicht statt ganze Datenbank.

Slack lassen wir aus — dafür gibt es bei uns keine Anbindung und Notion
verlangt dafür ohnehin einen bezahlten Plan.

---

## Quellen

- Notion-Hilfe: *Database automations*, *Buttons*, *Database button property*
- Notion-KI im laufenden Notion, Runde 7, mit eigener Belegt-Kennzeichnung
  und eigener Liste des Unbelegbaren
