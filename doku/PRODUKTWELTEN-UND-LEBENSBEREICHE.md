# Produktwelten und Lebensbereiche

> **Prüfstand:** Die hier beschriebenen Quellen sind implementiert, aber noch
> **nicht abschließend gebaut, integriert oder gemeinsam geprüft**. Diese
> Dokumentation nennt deshalb keine erfundenen Test-, Leistungs- oder
> Abnahmewerte.

## 1. Das Modell in einem Satz

Redion hat zwei unterschiedliche Arbeitsoberflächen, aber weiterhin nur einen
kanonischen Datenbestand:

- **🎓 Lernen & Alltag** ordnet denselben Bestand nach Heute, Lernen,
  Lernpfad, Fehlern, Prüfungen, Schule/Ausbildung, Uni, Arbeit und Fortschritt.
- **🧱 Workspace** ordnet ihn nach Übersicht, Bibliothek, Aufgaben, Kalender,
  Datenbanken, Wiki und Vorlagen.

Eine Seite, Datenbankzeile, Datei oder Lernkarte wird beim Wechsel der Welt
nicht kopiert. Beide Welten lesen die vorhandenen Blöcke, Sammlungen, Ansichten
und Dateien aus `Store` und öffnen zum Bearbeiten wieder deren kanonische
Kennung.

```text
                         ┌─ 🎓 Lernen & Alltag
Store: Block/Seite ──────┼─ 🧱 Workspace
       Collection/View   └─ Lebensbereich-Sichten
       Datei
```

Die Sichten und Zusammenfassungen im Arbeitsspeicher dürfen verworfen und aus
dem Bestand neu abgeleitet werden. Sie sind kein zweiter Store.

## 2. Die zwei Produktwelten

### 2.1 Gemeinsamer Lotse: `Produktwelten`

`src/bereiche/wissen/produktwelten.ts` ist der Router zwischen beiden Welten.
Er besitzt keine Seiten, Karten oder Aufgaben. Er speichert lediglich die
zuletzt gewählte Oberfläche und Ansicht:

| Metaschlüssel | Bedeutung |
| --- | --- |
| `produkt:welt` | `lernen` oder `workspace` |
| `produkt:lernansicht` | zuletzt gewählte Ansicht der Lernwelt |
| `produkt:arbeitsansicht` | zuletzt gewählte Ansicht der Arbeitswelt |

Öffentliche Einstiege sind unter anderem:

- `Produktwelten.start()` – bindet und markiert den Weltwechsler;
- `Produktwelten.aktiv()` – liest die aktive Welt;
- `Produktwelten.lernen(ansicht)`;
- `Produktwelten.workspace(ansicht)`;
- `Produktwelten.zurAktivenWelt()`;
- `Produktwelten.bereicheDialog(objekt)` – Mehrfachzuordnung eines bestehenden
  Blocks bzw. einer Seite.

Der Lotse lädt die Weltmodule defensiv über `globalThis`. Fehlt eines in einer
älteren Einzeldatei, fällt er auf bereits vorhandene Ansichten zurück.

### 2.2 Lernwelt

`src/bereiche/wissen/lernwelt.ts` stellt die Ansichten **Heute**, **Lernen**,
**Lernpfad**, **Meine Fehler**, **Prüfungen**, **Schule/Ausbildung**, **Uni**,
**Arbeit** und **Fortschritt** bereit.

Wichtige Eigenschaften:

- Bereichsfilter werden defensiv aus `Lebensbereiche` gelesen.
- Für Today und Bereichslisten werden die asynchronen Aggregatoren des
  Bereichskerns verwendet; fehlt der Kern, bleiben lokale Ableitungen aus den
  bestehenden Modulen verfügbar.
- Lernkarten bleiben normale `flashcard`-Blöcke.
- Quellen, Themen, Fächer und bestehende SM-2-Verläufe werden weiterverwendet.
- Gamification-Werte wie XP, Level und Streak werden aus dem Lernprotokoll
  abgeleitet. Sie werden nicht als Wissensstand in den SM-2-Zustand geschrieben.
- `Lernwelt.render(ziel, ansicht)` bettet die Welt in ein vorhandenes Ziel ein;
  `Lernwelt.oeffnen(ansicht)` öffnet sie über die bestehende App-Schale.

Die Lernwelt verwaltet ihre persönlichen Anzeigepräferenzen mit einem
aktorbezogenen Schlüssel der Form `lernwelt:<actorId>:<name>`.

### 2.3 Arbeitswelt

`src/bereiche/wissen/arbeitswelt.ts` erzeugt mit `Arbeitswelt.snapshot()` eine
flüchtige, schreibgeschützte Sicht auf:

- Seiten, Wurzelseiten, Favoriten und kürzlich geöffnete Seiten;
- Datenbanken samt vorhandenen Ansichten;
- Inhaltsblöcke, Dateien, PDFs, Whiteboards und Tabellenblätter;
- Aufgaben und Termine;
- Wiki-Seiten, Aliasse und Rückverweise;
- vorhandene Vorlagen;
- Reiter und geteilte Fenster über den bestehenden Fensterdienst.

Die Originalobjekte bleiben in `Store`. Aktionen öffnen Seiten, Blöcke oder
Datenbankansichten über die vorhandenen Dienste. `Arbeitswelt.render(...)`
liefert einen Controller; `Arbeitswelt.oeffnen(...)` öffnet die Sonderansicht.

Der Workspace prüft Seiten- und Sammlungsrechte. Ein Lebensbereichsfilter ist
in seinem Snapshot derzeit jedoch noch nicht angeschlossen; die Bereichsfilter
werden zuerst von der Lernwelt genutzt. Das ist eine bewusste, noch offene
Integrationsgrenze und kein Anlass, einen zweiten Workspace-Bestand anzulegen.

## 3. Lebensbereiche sind Mehrfachzuordnungen

Lebensbereiche beantworten die Frage „In welchen Sichten soll dieses Objekt
erscheinen?“. Beispiele sind:

- ⚡ Elektro-Ausbildung
- 🎓 Uni
- 💼 Arbeit
- 🏠 Privat

Sie sind weder Datenbanken noch Ordner und besitzen keinen Inhalt. Ein Objekt
kann gleichzeitig mehreren Bereichen zugeordnet sein.

### 3.1 Bereichsdefinitionen

Definitionen liegen weiterhin im vorhandenen Metafach:

```ts
Store.getMeta('bereiche', [])
```

Neue Definitionen haben diese Form:

```ts
{
  id: string,
  name: string,
  icon: string,
  art: 'schule' | 'ausbildung' | 'uni' | 'arbeit' |
       'privat' | 'weiterbildung' | 'frei',
  created: ISODateTime,
  edited: ISODateTime
}
```

Ältere Einträge ohne `art`, `created` oder `edited` bleiben lesbar. Das Listen
normalisiert sie nur für die Ausgabe und schreibt sie dabei nicht zurück.

### 3.2 Direkte Zuordnung

Die neue kanonische Mehrfachzuordnung ist ein generisches Metafeld am bereits
vorhandenen Objekt:

```ts
objekt.meta.lebensbereiche = ['bereich-a', 'bereich-b'];
```

Das gilt additiv für:

- Seiten und andere Blöcke;
- Collections;
- Dateien im vorhandenen Dateifach.

Die alte einzelne Seitenzuordnung `block.bereich` bleibt ein lesbarer
Legacy-Fallback. Sie wird nicht beim Start oder Listen in das neue Feld
verschoben. Nur das ausdrückliche Entfernen genau dieser Zuordnung darf das
passende Legacy-Feld leeren.

### 3.3 Direkte und wirksame Zuordnung

`direkteBereichIds(satz)` liest nur die unmittelbar am Satz gespeicherten
Kennungen sowie den alten Einzelwert.

`bereicheVon(ref)` berechnet zusätzlich wirksame Zuordnungen:

- Ein Kindblock erbt die Bereiche seiner Elternseite.
- Eine Datenbankzeile kann die Bereiche ihrer Collection und der kanonischen
  Datenbankseite nutzen.
- Eine Collection kann Bereiche über ihren Datenbankblock bzw. dessen Seite
  erhalten.
- Eine Datei kann die Bereiche ihres führenden Blocks erhalten.

Diese Vererbung ist eine Lesesicht. Es werden keine Bereichskennungen in alle
Kinder kopiert.

## 4. API von `Lebensbereiche`

Der Kern liegt in `src/bereiche/wissen/lebensbereiche.ts` und wird im Browser
als `window.Lebensbereiche` bereitgestellt.

### 4.1 Bereichs- und Zuordnungs-API

| API | Verhalten |
| --- | --- |
| `auflisten()` | Liest und sortiert gültige Bereichsdefinitionen. |
| `anlegen({ id?, name, icon?, art?, pageId? })` | Legt eine Definition idempotent an. Gleicher Name ohne explizite ID ergibt wieder denselben Bereich. |
| `direkteBereichIds(satz)` | Liest direkte neue und alte Zuordnungen. |
| `bereicheVon(ref)` | Liefert asynchron alle wirksamen, lesbaren Bereiche. |
| `zuordnen(ref, bereichId)` | Ergänzt asynchron genau diese direkte Zuordnung. |
| `entfernen(ref, bereichId)` | Entfernt asynchron genau diese direkte Zuordnung. |

Ein Objektverweis hat die Form:

```ts
type ObjektRef = {
  art: 'page' | 'block' | 'collection' | 'file';
  id: string;
};
```

Übergebene Objekte werden nicht blind zurückgeschrieben. Vor einer Änderung
holt der Kern den kanonischen Satz anhand seiner Kennung erneut aus `Store`.
Das verhindert, dass eine veraltete UI-Kopie neuere Daten überschreibt.

### 4.2 Idempotenz und Grenzen

- Eine vorhandene Zuordnung wird nicht doppelt gespeichert.
- Das Entfernen einer nicht vorhandenen direkten Zuordnung ändert nichts.
- Neue Objekte erhalten höchstens 32 direkte Bereichszuordnungen.
- Der Kern listet höchstens 64 Bereichsdefinitionen.
- Aggregatoren geben je Aufruf höchstens 200 Einträge zurück.
- Ein Ableitungslauf scannt höchstens 50.000 Blöcke bzw. Collections.

Diese Zahlen sind Quellcodegrenzen, keine gemessenen Leistungswerte. Ein
Bestand oberhalb einer Scan-Grenze braucht später eine indexierte Abfrage;
der Kern behauptet nicht, dann vollständig zu sein.

## 5. Lesende Aggregatoren

Alle Aggregatoren sind asynchron. Gemeinsame Optionen sind:

```ts
{
  bereichIds?: string[],
  limit?: number,
  von?: string | number | Date,
  bis?: string | number | Date,
  jetzt?: string | number | Date,
  einschliesslichErledigt?: boolean,
  nurMeine?: boolean
}
```

Jeder Eintrag trägt mindestens:

```ts
{
  ref: ObjektRef,
  titel: string,
  pageId: string,
  bereichIds: string[],
  zeit: ISODateTime
}
```

Die spezialisierten Ableitungen sind:

- `aufgaben(options)` – offene `todo`-Blöcke sowie Datenbankzeilen aus
  Aufgabenquellen mit Status- oder Checkboxfeld; liefert unter anderem
  `erledigt`, `status`, `faellig`, `ueberfaellig` und `collectionId`.
- `termine(options)` – datierte Zeilen expliziter Kalender-, Termin-,
  Prüfungs- oder Event-Sammlungen sowie Terminblöcke; liefert `beginn`, `ende`
  und `collectionId`.
- `zuletzt(options)` – zuletzt geöffnete bzw. bearbeitete Seiten und Dateien.
- `projekte(options)` – explizit über Metadaten, Kennzeichen oder die Tags
  `projekt`/`project` bezeichnete Objekte; liefert `status` und `faellig`.
- `pdfs(options)` – PDF-Dateien und importierte `pdfseite`-Dokumente, nach
  Datei bzw. Dokumentseite zusammengeführt.
- `lernkarten(options)` – lesbare `flashcard`-Blöcke mit dem persönlichen oder
  alten SM-2-Stand; liefert `neu`, `faellig`, `fehler`, `faelligAm` und
  `zustand`.

Die Sortierung besitzt stets einen stabilen Stichentscheid über Titel bzw.
Kennung. Ungültige Datumswerte werden nicht als gültige Termine ausgegeben.
Kalendertage im Format `YYYY-MM-DD` werden als lokale Kalendertage behandelt,
nicht als UTC-Mitternacht.

## 6. Today-Vertrag

`Lebensbereiche.heute(options)` fasst die Ableitungen für den lokalen
Kalendertag zusammen:

```ts
{
  version: 1,
  tag: 'YYYY-MM-DD',
  erzeugtAm: ISODateTime,
  bereichIds: string[],
  aufgabenHeute: AufgabenEintrag[],
  aufgabenUeberfaellig: AufgabenEintrag[],
  termine: TerminEintrag[],
  zuletzt: AggregatBasis[],
  projekte: ProjektEintrag[],
  pdfs: PdfEintrag[],
  lernkarten: {
    fehler: LernkarteEintrag[],
    faellig: LernkarteEintrag[],
    neu: LernkarteEintrag[]
  }
}
```

Für Today gilt `nurMeine` standardmäßig als aktiv. Der Vertrag enthält bewusst
keine XP-, Level- oder Streak-Wahrheit. Solche Motivationswerte darf die
Lernwelt separat aus Aktivitätsprotokollen ableiten; sie verändern weder
Fälligkeit noch Wissensstand.

## 7. Persönlicher Lernzustand bei geteilten Karten

Der Karteninhalt darf geteilt sein. Der Lernzustand wird über eine Actor- bzw.
Konto-ID getrennt. Der vorbereitete Vertrag liegt am bestehenden Kartenblock:

```ts
card.meta.lernzustaende = {
  version: 1,
  actors: {
    [actorId]: {
      version: 1,
      actorId: string,
      algorithm: 'sm2',
      sr: {
        ease?: number,
        intervall?: number,
        wdh?: number,
        faellig?: ISODateTime,
        zuletzt?: ISODateTime
      },
      reviewVerlauf: Record<reviewId, ReviewEntry>,
      updatedAt: ISODateTime
    }
  }
};
```

Öffentliche Funktionen:

- `Lebensbereiche.lernzustand.aktuellerAktor()` – liefert eine stabile
  Konto-ID oder den als nicht stabil markierten lokalen Actor.
- `Lebensbereiche.lernzustand.lesen(card, actorId?)` – rein lesend;
- `Lebensbereiche.lernzustand.schreiben(ref, actorId, zustand, optionen)` –
  speichert einen bereits berechneten SM-2-Zustand;
- `Lebensbereiche.lernzustand.VERTRAG` – maschinenlesbare Vertragskennung.

Das Lesen liefert:

```ts
{
  version: 1,
  cardId: string,
  actorId: string,
  algorithm: 'sm2',
  sr: Sm2Zustand,
  reviewVerlauf: Record<string, ReviewEntry>,
  quelle: 'person' | 'legacy' | 'leer',
  updatedAt: string
}
```

### 7.1 Legacy-Fallback ohne stille Migration

Bestehende Karten führen ihren lokalen Zustand weiterhin unter:

- `card.sr`;
- `card.reviewVerlauf`;
- `card.lernAlgorithmus`.

Solange eine Karte noch keinen personenbezogenen Actor-Satz besitzt, darf der
aktuelle Actor diesen Stand als `quelle: 'legacy'` lesen. Das Lesen schreibt
nichts um. Sobald ausdrücklich ein personenbezogener Satz angelegt wurde,
wird der alte Gerätestand keinem weiteren Actor als persönlicher Zustand
zugeschrieben.

Eine Übernahme des alten Standes ist nur bei einem expliziten Schreibaufruf
mit `{ legacyAlsBasis: true }` vorgesehen. `schreiben` berechnet keine
Bewertung und keinen neuen Abstand; der Aufrufer übergibt den fertig
berechneten SM-2-Zustand. Die Lernwelt tut das bei ihrem neuen Bewertungsweg,
während `WissenDienst.planen` der kompatible Legacy-Weg bleibt.

Der Vertrag begrenzt eine Karte auf 128 Actor-Zustände und einen Zustand auf
500 Wiederholungseinträge. Auch das sind Sicherheitsgrenzen aus dem Code,
keine Testergebnisse.

## 8. Rechte und Feldrechte

Der Bereichskern erfindet kein eigenes Rollensystem:

- Für Seiten und Blöcke zählt die besitzende Seite.
- Für Collections zählt die kanonische Datenbankseite, nicht eine verknüpfte
  Zweitansicht.
- Für Dateien zählt der führende Block und dessen Seite.
- Ist das Kontenmodul aktiv und der Besitzer nicht eindeutig bestimmbar, wird
  der Zugriff abgelehnt statt geraten.
- Schreibende Zuordnungen und persönliche Lernzustände verlangen
  Bearbeitungsrecht.
- Aggregatoren geben nur lesbare Objekte aus.
- Bei Datenbankzeilen werden gesperrte Felder über `Feldrechte.darfSehen`
  nicht als Titel, Datum, Status oder Person ausgewertet.

Die Prüfung im Browser ist weiterhin nur die Bedienungsschicht. Bei geteilten
Daten bleibt die vorhandene serverseitige Rechteprüfung die Sicherheitsgrenze.

## 9. Offline-Verhalten und Datenhaltung

Die neuen Kerne verlangen kein Netz:

- Bereichsdefinitionen und Onboarding-Präferenzen liegen im vorhandenen
  `Store`-Metafach.
- Block-, Seiten- und Collection-Zuordnungen nutzen deren bestehende Sätze.
- Dateizuordnungen nutzen das vorhandene Dateifach.
- Ableitungen entstehen aus dem lokalen Cache bzw. IndexedDB-Bestand.

Ein konfigurierter Abgleich darf diese bestehenden Sätze auf dem bereits
vorgesehenen Weg übertragen. Die Module bauen keinen eigenen Sync, keine
zweite IndexedDB und keine separate Bereichsdatenbank.

## 10. Onboarding

`src/bereiche/wissen/produkt_onboarding.ts` stellt global bereit:

- `ProduktOnboarding.vielleichtStarten()`;
- `ProduktOnboarding.oeffnen()`;
- `ProduktOnboarding.zuruecksetzen()`;
- `ProduktOnboarding.profil()`.

Der Dialog hat drei semantische Schritte:

1. bevorzugte Hauptwelt wählen;
2. Elektro-Ausbildung, Uni, Arbeit und/oder Privat auswählen;
3. Auswahl prüfen und ausdrücklich abschließen.

Er ist per Tastatur bedienbar, hält den Fokus im Dialog, kann übersprungen
werden und wechselt auf kleinen Bildschirmen in eine einspaltige Darstellung.
Die Onboarding-Präferenz liegt konto- bzw. gerätebezogen unter
`produktOnboarding:v1`.

Das Öffnen und Weiterblättern schreibt keine Inhaltsdaten. Fehlende
Bereichsdefinitionen werden erst bei **„Einrichtung abschließen“** defensiv
über `Lebensbereiche.auflisten()` und `Lebensbereiche.anlegen()` erzeugt.
Bestehende Seiten, Blöcke, Collections und Dateien werden dabei weder
zugeordnet noch verschoben noch kopiert. Überspringen speichert nur, dass der
Dialog nicht automatisch erneut erscheinen soll.

## 11. Integrationspunkte

Für die vollständige Produktintegration sind folgende Punkte maßgeblich:

1. Die TypeScript-Quellen müssen in die erzeugten Browser-Skripte gebaut und
   in der tatsächlichen Startreihenfolge geladen werden.
2. `Lebensbereiche` muss vor den ersten Bereichsaktionen verfügbar sein;
   Lernwelt und Onboarding besitzen defensive Adapter, ersetzen die fehlende
   Integration aber nicht.
3. `Produktwelten.start()` gehört nach dem Aufbau der Navigationsschale in den
   vorhandenen Startpfad.
4. `ProduktOnboarding.vielleichtStarten()` darf erst nach verfügbarem `Store`
   und `document.body` aufgerufen werden.
5. Das Ergebnis des Onboardings muss noch mit der tatsächlichen
   Produktwelt-Präferenz verbunden werden: Das Onboarding kennt zusätzlich
   `beide`, während `Produktwelten` zur Laufzeit genau eine aktive Welt
   (`lernen` oder `workspace`) führt.
6. Die Lernwelt konsumiert `heute`, `aufgaben`, `termine`, `zuletzt`,
   `projekte` und `pdfs` bereits defensiv. Der Workspace braucht noch einen
   sichtbaren Bereichsfilter, wenn dieselbe Filterung dort angeboten werden
   soll.
7. `Produktwelten.bereicheDialog` deckt derzeit die UI-Zuordnung von Seiten
   und Blöcken ab. Der Kern unterstützt zusätzlich Collections und Dateien;
   dafür fehlen noch passende UI-Einstiege.
8. Nach der Integration sind Typecheck, Build, gezielte Vertragsprüfungen und
   eine visuelle Prüfung der vorgesehenen Bildschirmgrößen erforderlich.

## 12. Bewusste Grenzen

- **Keine automatische Datenmigration.** Alte `bereich`-, `sr`- und
  `reviewVerlauf`-Felder bleiben bestehen, bis ein Mensch eine konkrete neue
  Zuordnung oder personenbezogene Übernahme auslöst.
- **Kein Löschen ganzer Bereiche im neuen Kern.** `entfernen` entfernt eine
  Zuordnung von einem Objekt, nicht die Definition samt allen Verweisen. Für
  eine spätere Bereichslöschung braucht es eine eigene, konfliktfeste Aktion.
- **Noch keine personenbezogene Server-Entität für Lernzustände.** Der Vertrag
  trennt Actor-IDs im Kartenmetafeld. Ein nur lesender Empfänger einer
  geteilten Karte kann seinen Zustand deshalb noch nicht unabhängig vom
  Bearbeitungsrecht des Karteninhalts schreiben. Serverseitige Trennung,
  Privatsphäre und Konfliktbehandlung bleiben eine spätere Ausbaustufe.
- **Arbeitswelt noch ohne Bereichsfilter.** Ihr Snapshot ist eine Sicht auf den
  lesbaren Gesamtbestand.
- **Onboarding-Präferenz noch nicht gleich Welt-Router.** Die Auswahl `beide`
  braucht eine konkrete Startnavigation; sie darf nicht still in eine der
  beiden Welten umgedeutet werden.
- **Klassifikation ist absichtlich konservativ.** Projekte brauchen ein
  explizites Kennzeichen oder Tag; Termine eine erkennbare Kalender-/Termin-
  Quelle. Der Kern rät nicht anhand beliebiger Texte, dass etwas ein Projekt
  oder Termin sei.
- **Client-Rechte ersetzen keinen Server.** Offline gehören die Daten dem
  lokalen Gerät. Harte Rechte für geteilte Inhalte bleiben Aufgabe des
  vorhandenen Servers.

## 13. Aktueller Abnahmestand

Die Architektur und die oben genannten Verträge sind in den neuen Quellen
ablesbar. Eine abschließende Aussage über Build, Laufzeit, Zusammenspiel,
mobile Darstellung oder Regressionen ist noch nicht möglich, weil auf Wunsch
noch kein gemeinsamer Abschlusslauf durchgeführt wurde.

**Status: noch nicht abschließend geprüft.**
