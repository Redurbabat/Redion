CLAUDE.md — Regeln für Redion

Redion ist eine Notiz-, Datenbank- und Wissens-App im Stil von Notion.  

Sie ist local-first, läuft direkt im Browser, kann ohne Konto benutzt werden und soll optional mit einem Server/Cloudflare erweitert werden.

Die wichtigsten Ziele:

Daten gehören dem Nutzer.

Die App läuft lokal, offline und ohne Server.

Ein optionaler Server darf Sync, Rechte, Teilen und Cloud-Sicherung ermöglichen.

Große Dateien und Anhänge dürfen nicht zu Datenverlust oder Speicherabsturz führen.

Redion bleibt einfach startbar: index.html öffnen oder redion-einzeldatei.html nutzen.

Architektur bleibt modular: kern/, register/, schale/, bereiche/.

Kein Bereich darf einen anderen Bereich direkt abhängig machen.

Jede Änderung muss testbar und sicher sein.



1. Wichtigste Grundregel

Arbeite nur an Redion.

Nicht an anderen Projekten arbeiten:

Nicht an BABAT-RED.

Nicht an STRAN.

Nicht an RED-KURD.

Nicht an musik-/RhythmVerse.

Nicht an fremden Repositories.

Wenn unklar ist, ob eine Änderung zu Redion gehört, zuerst stoppen und prüfen.



2. Projektidentität

Redion ist:

Notizen-App

Datenbank-App

Wissens-App

lokale Notion-Alternative

offline nutzbar

optional cloudfähig

exportierbar

sicherbar

erweiterbar

Redion ist nicht:

ein React-Projekt

ein schweres Framework-Projekt

eine Server-only-App

eine reine Cloud-App

ein Projekt mit Pflichtkonto

ein Projekt mit Abo-Zwang

ein Experimentierplatz für unnötige Dependencies



3. Sprache und Stil

Es gibt zwei Sprachen, und sie sind sauber getrennt. Die vollständige Regel
steht in Abschnitt 53 und in ENTSCHEIDUNGEN.md unter E27; hier das Wichtigste:

Deutsch für alles, was ein Mensch liest — Nutzertexte, Fehlermeldungen,
Kommentare, Dokumentation.

Englisch für neuen TypeScript-Code — Ordner, Dateien, Variablen, Funktionen,
Klassen, Interfaces, Typen, Enums, Tests.

Der bestehende Bestand unter quell/ ist deutsch benannt und bleibt es. Er
wird nicht massenhaft umbenannt, sondern nur dort, wo eine Datei ohnehin
migriert wird.

klare, einfache Benennungen

keine unnötig englischen Marketingbegriffe

keine komplizierten Abkürzungen ohne Grund

Beispiele:

quell/

kern/

register/

bereiche/

ablage/

abgleich/

zugang/

sicherheit/

pruefungen/

doku/



4. Architektur-Grundstruktur

Die bestehende Struktur bleibt verbindlich:

index.html
quell/
  start.js
  kern/
  register/
  schale/
  bereiche/
oeffentlich/
server/
doku/
pruefungen/
bauen.mts
redion-einzeldatei.html

Bedeutung:

index.html

lädt die App.

quell/start.js

ist der einzige Einstiegspunkt.

quell/kern/

enthält gemeinsame Logik, die keinen Bereich kennt.

quell/register/

enthält zentrale Kataloge für Module, Navigation, Blöcke, Eigenschaften, Ansichten, Formeln, Befehle, Tastenkürzel, Vorlagen und Verbindungen.

quell/schale/

enthält App-Aufbau, Seitenleiste, Dialoge, Layout, globale Oberfläche und Stil.

quell/bereiche/

enthält fachliche Bereiche wie Editor, Datenbanken, Wissen, KI, Dateien, Vorlagen, Kommentare, Erwähnungen, Seiten, Planen, Einstellungen und Hilfe.

server/

enthält den optionalen Server für Cloudflare Workers/D1, Sync, Rechte und öffentliche Seiten.

doku/

enthält Architektur- und Entscheidungsdokumentation.

pruefungen/

enthält echte Prüfungen gegen die echte App.



5. Die drei Architekturregeln

Regel 1: Bereiche importieren sich nicht gegenseitig

Ein Bereich darf nur verwenden:

kern/
register/
eigene Dateien

Ein Bereich darf nicht direkt aus einem anderen Bereich importieren.

Nicht erlaubt:

import ... from "../datenbanken/..."
import ... from "../editor/..."
import ... from "../wissen/..."

Wenn ein Bereich etwas von einem anderen Bereich braucht:

Über Ereignisbus lösen.

Oder gemeinsame Logik nach kern/ verschieben.

Oder über register/ bekannt machen.



Regel 2: Neuer Bereich = zwei Register-Einträge

Ein neuer Bereich braucht grundsätzlich nur:

quell/register/module.js
quell/register/navigation.js

Wenn mehr nötig ist, zuerst prüfen, ob der Bereich zu groß oder falsch geschnitten ist.



Regel 3: Neue Dinge sind Register-Objekte

Neue Blockart, Ansicht, Eigenschaft, Formel, Befehl oder Tastenkürzel werden als Objekt im passenden Register eingetragen.

Beispiele:

register/bloecke.js
register/eigenschaften.js
register/ansichten.js
register/formeln.js
register/befehle.js
register/tasten.js
register/vorlagen.js
register/verbindungen.js

Nicht überall verstreut neue Sonderfälle einbauen.



6. Kein Framework-Zwang

Redion läuft bewusst ohne Browser-Framework.

Nicht einführen ohne sehr starken Grund:

React

Vue

Svelte

Angular

Next.js

große UI-Bibliotheken

große State-Management-Libraries

Bundler-Zwang für normale Nutzung

Die App muss weiterhin funktionieren:

index.html doppelklicken

und:

redion-einzeldatei.html öffnen

Node/npm darf für Prüfungen, Bauen und Server genutzt werden, aber nicht als Pflicht für normale Nutzung.



7. Startregel

quell/start.js bleibt der einzige Einstiegspunkt.

Beim Start:

DOM abwarten

App sauber initialisieren

Fehler abfangen

keine stillen Abstürze

keine doppelten Starts

keine Bereichslogik in start.js

Wenn Startlogik wächst, in passende Dateien unter kern/ oder schale/ auslagern.



8. Register-Regeln

Register sind die zentrale Wahrheit.

Neue Funktionen zuerst prüfen:

Ist es ein Block? → register/bloecke.js

Ist es eine Datenbankansicht? → register/ansichten.js

Ist es ein Eigenschaftstyp? → register/eigenschaften.js

Ist es ein Befehl? → register/befehle.js

Ist es ein Tastenkürzel? → register/tasten.js

Ist es eine Formel? → register/formeln.js

Ist es eine Vorlage? → register/vorlagen.js

Ist es eine Verbindung? → register/verbindungen.js

Ist es Navigation? → register/navigation.js

Ist es ein Bereich? → register/module.js

Keine doppelten Kataloge einführen.



9. Speicherregeln

Der lokale Speicher ist Kern der App.

Aktuelle wichtige Speicher:

blocks
collections
views
meta
versions
dateien
stuecke
basis
vorrat

Regeln:

Keine Datenverluste riskieren.

Keine Migration ohne Tests.

Keine Speicheränderung ohne Rückwärtsdenken.

Große Dateien nicht als riesige JSON-Strings behandeln.

Blobs nicht blind mit JSON.stringify() sichern.

IDs nicht unnötig ändern.

Referenzen zwischen Blöcken, Dateien und Datenbanken müssen stabil bleiben.

Import darf vorhandene Daten nur löschen, wenn das Format diese Daten wirklich abdeckt.

Kaputte Daten müssen möglichst abgefangen werden.



10. IndexedDB-Regeln

IndexedDB bleibt Hauptspeicher im Browser.

Beim Arbeiten an IndexedDB:

Transaktionen klein halten.

Fehler sinnvoll melden.

Schemaänderungen dokumentieren.

Migrationen idempotent bauen.

Keine langen Blockaden im UI-Thread.

Große Blobs stückweise verarbeiten.

Datei-Stücke nicht unnötig vollständig in den Arbeitsspeicher laden.

Bei Multi-Tab-Nutzung an Überschreibungen denken.



11. Backup-Regeln

Backup ist eine Sicherheitsfunktion. Es darf niemals Daten gefährden.

Redion unterstützt zwei Sicherungsarten:

.json
.redion

.json

Für reine Daten ohne Anhänge.

Eigenschaften:

lesbar

einfach

gut für Text, Seiten, Datenbanken, Einstellungen

enthält keine echten großen Anhänge

Regel:

Wenn eine .json-Sicherung Anhänge nicht enthält, darf der Import vorhandene Anhänge nicht löschen.

.redion

Für vollständige Sicherungen mit Anhängen.

Eigenschaften:

.redion = ZIP-artiges Paket
daten.json
dateien.json
dateien/

Regeln:

Große Dateien stückweise verarbeiten.

Nicht vollständige Videos/Bilder in den Arbeitsspeicher laden.

Echte Dateinamen erhalten.

Gleiche Namen eindeutig machen.

Datei-IDs beim Import erhalten, wenn Blöcke darauf verweisen.

Prüfsummen stückweise berechnen.

Über 4 GB klare Fehlermeldung statt kaputtes Archiv.

.redion darf beim Ersetzen alte fremde Anhänge entfernen, weil das Format Anhänge abdeckt.

.json darf das nicht.



12. .redion-Format dokumentieren

Wenn am .redion-Format gearbeitet wird, die Dokumentation aktualisieren oder erstellen:

doku/REDION-FORMAT.md

Diese Doku soll enthalten:

Was ist .redion?
Warum nicht nur JSON?
Aufbau des Archivs
daten.json
dateien.json
dateien/
Dateinamen-Regeln
ID-Regeln
Import-Regeln
Lösch-Regeln
Speichergrenzen
4-GB-Grenze
ZIP64-Entscheidung
Kompatibilität



13. Export-/Import-Regeln

Export und Import müssen zuverlässig sein.

Export darf nicht:

Daten verschweigen

Anhänge scheinbar sichern, aber leer speichern

bei großen Dateien abstürzen

still beschädigte Archive erzeugen

nur auf starken PCs funktionieren

Import darf nicht:

Datei-IDs brechen

Blöcke von Anhängen trennen

vorhandene Anhänge löschen, wenn die Sicherung keine Anhänge kennt

unklare Versionen blind überschreiben

bei Fehlern halbe Zustände hinterlassen

Immer testen:

exportieren
alles löschen
importieren
Byte für Byte vergleichen



14. Datei- und Anhangsregeln

Anhänge sind echte Nutzerdaten.

Dazu gehören:

Bilder

Videos

Audios

PDFs

sonstige Dateien

Regeln:

Dateiname erhalten, wenn möglich.

MIME-Typ erhalten, wenn möglich.

Größe speichern.

Kennung stabil halten.

Blöcke müssen ihre Dateien nach Import wiederfinden.

Große Dateien stückweise speichern und lesen.

Data-URL nur für kleine Dateien und bestehende Logik, nicht als Zukunftslösung für große Anhänge.

Keine willkürliche 12-MB-Grenze als endgültige Lösung betrachten, wenn .redion/Blob-Speicher große Dateien sauber kann.



15. Versionsregeln

Versionen sind Schutz gegen Fehler.

Regeln:

Versionsverlauf darf nicht still unbegrenzt wachsen.

Mindestens die geplanten Fassungen müssen erhalten bleiben.

Automatische Fassungen dürfen Nutzerdaten nicht zerstören.

Zwei Tabs dürfen einander nicht unbemerkt überschreiben.

Versionen müssen mit Import/Export zusammenpassen.

Alte Versionen dürfen nur nach klarer Regel gelöscht werden.

Wenn an Versionen gearbeitet wird, Multi-Tab-Fälle testen.



16. Multi-Tab-Regeln

Redion kann in mehreren Tabs geöffnet sein.

Dabei gilt:

Änderungen aus Tab A dürfen Tab B nicht still überschreiben.

Speicherstand muss erkannt werden.

Konflikte müssen mindestens erkannt oder entschärft werden.

Versionen helfen, aber ersetzen keine saubere Konfliktlogik.

Tests für zwei Tabs sind wichtig.



17. Datenmodell-Regeln

Blöcke, Seiten, Datenbanken und Zeilen müssen stabil bleiben.

Regeln:

Eine Zeile ist eine Seite.

Datenbank-Ansichten zeigen auf ein Schema.

Blöcke behalten stabile IDs.

Beziehungen behalten stabile IDs.

Rollups und Formeln dürfen nicht direkt fremden Code ausführen.

Datenbankeigenschaften müssen typgerecht gespeichert werden.

Import/Export muss alle Typen berücksichtigen.



18. Editor-Regeln

Der Editor ist zentral und darf nicht unnötig weiter aufgebläht werden.

Wenn möglich, große Editor-Dateien aufteilen in:

rendern
tastatur
auswahl
inline-format
slash-menue
block-aktionen
einbettungen
kommentare
drag-drop

Regeln:

Bestehende Tastenkürzel nicht brechen.

Slash-Menü stabil halten.

Markdown-Kürzel testen.

Inline-Formatierung testen.

Blöcke müssen ohne Datenverlust umwandelbar sein.

Unbekannte Blocktypen nicht löschen.

HTML und Einbettungen sicher behandeln.



19. Sicherheitsregeln Browser

Niemals unsichere HTML-Ausgabe einbauen.

Regeln:

Nutzertext immer escapen.

Kein rohes innerHTML mit ungeprüften Nutzerdaten.

Links prüfen.

Einbettungen erlauben nur bekannte sichere Quellen oder klare Sandbox-Regeln.

Kein fremder Code aus Formeln.

Kein eval().

Keine geheimen Werte in LocalStorage, außer bewusst verschlüsselte Inhalte.

Verschlüsselte Seiten mit AES-GCM sauber behandeln.

Passwort nie speichern.

Schlüssel nur im Speicher halten, wenn möglich.

Sichere Escape-Funktion muss wirklich escapen:

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

Nicht falsch ersetzen:

.replace(/</g, '<')
.replace(/>/g, '>')



20. Formel-Regeln

Formeln sind keine JavaScript-Ausführung.

Regeln:

Kein eval().

Kein Function().

Eigener Tokenizer, Parser und Auswerter bleiben.

Fehler müssen verständlich angezeigt werden.

Live-Vorschau darf nicht abstürzen.

Formeln dürfen keine Seiteneffekte haben.

Listenfunktionen und Textfunktionen sauber trennen.

+ für Textverkettung bleibt dokumentiert.

concat() bleibt für Listen.

Neue Formelfunktionen:

im Register eintragen

dokumentieren

testen

Grenzfälle prüfen



21. KI-Regeln

Redion nutzt lokale KI:

Ollama
WebLLM

Regeln:

Kein Text verlässt ungefragt den Rechner.

Keine Cloud-KI ohne ausdrückliche Entscheidung.

Keine API-Schlüssel im Repository.

WebLLM-Modell-Download klar erklären.

Ollama-Verbindung robust prüfen.

KI-Funktionen müssen ohne KI sauber deaktiviert bleiben.

KI darf Daten nicht verändern, ohne dass Nutzer es auslöst.

KI-Ausgaben in Datenbanken/Seiten müssen als normale Änderungen behandelbar sein.

KI-Felder in Datenbanken dürfen nicht blockieren.



22. Server-Regeln

Der Server ist optional.

Server darf ermöglichen:

Konto

Sitzung

Sync

Rechte

öffentliche Seiten

Freigaben

Feldrechte

Protokoll

Marken

MCP/API

Cloudflare Workers + D1

Server darf nicht Voraussetzung sein für:

lokale Notizen

lokale Datenbanken

lokale KI

lokale Sicherung

lokale Nutzung

Wenn Server kaputt ist, muss lokale App weiter funktionieren.



23. Cloudflare-Regeln

Cloudflare ist optionaler Cloud-Modus.

Mögliche Teile:

Cloudflare Pages
Cloudflare Workers
Cloudflare D1
Cloudflare R2
KV optional
Durable Objects später

Regeln:

D1 für strukturierte Sync-/Account-Daten.

R2 für große Dateien und Anhänge.

Keine großen Blobs in D1 speichern.

R2-Objekte mit stabilen IDs.

Uploads mit Größenprüfung.

Downloads mit Berechtigungsprüfung.

Öffentliche Seiten strikt von privaten Daten trennen.

Cloud-Modus darf local-first nicht zerstören.

Nutzer muss lokal bleiben können.



24. Konto-Regeln

Ein Konto ist optional.

Regeln:

App muss ohne Konto funktionieren.

Konto darf nur aktiv werden, wenn Nutzer es will.

Lokale Daten dürfen nicht automatisch hochgeladen werden.

Nutzer muss wählen können:

nur lokal
lokal + Sync
Cloud-Arbeitsbereich
offline exportieren
.redion herunterladen

Logout darf lokale Daten nicht ohne Warnung löschen.

Account-Daten und Workspace-Daten trennen.

Sessions hashen.

Tokens nicht im Klartext speichern, wenn vermeidbar.



25. Sync-Regeln

Sync ist schwierig und darf nicht leichtfertig geändert werden.

Regeln:

Jede Änderung braucht Version/Zeit/Gerät.

Konflikte müssen erkannt werden.

Gelöschte Daten brauchen Tombstones.

Attachments separat syncen.

Lokaler Stand bleibt führend, solange Nutzer nicht anders entscheidet.

Offline-Änderungen müssen später zusammengeführt werden.

Sync darf nicht still Daten verlieren.

Tests für zwei Geräte / zwei Tabs / Konflikte schreiben.



26. Rechte-Regeln

Rechte müssen wirklich sperren.

Rollen:

voll
edit
komm
lesen
kein

Regeln:

UI-Rechte und Server-Rechte müssen übereinstimmen.

Server entscheidet final.

Kein Zugriff darf nicht versehentlich Rechtezeile löschen.

Feldrechte dürfen nicht durch Export/Import kaputtgehen.

Öffentliche Seiten nie private Daten mitliefern.

Tests für Rechtefälle sind Pflicht.



27. Öffentliches Teilen

Ohne Server ist Teilen Export.

Mit Server kann Teilen echte Freigabe sein.

Regeln:

Öffentliche Seiten nur explizit veröffentlichen.

Private Blöcke nicht mitliefern.

Anhänge öffentlicher Seiten brauchen eigene öffentliche Freigabe.

Widerruf muss funktionieren.

Teilen darf nicht versehentlich ganzen Arbeitsbereich veröffentlichen.

Suchmaschinen/Crawler nur Demo oder veröffentlichte Inhalte sehen lassen.



28. PWA- und Offline-Regeln

Redion soll offline funktionieren.

Regeln:

App-Shell cachebar.

Daten bleiben lokal.

Service Worker darf keine alten kritischen Dateien endlos halten.

Update-Hinweis anzeigen, wenn nötig.

Offline-Export muss möglich bleiben.

redion-einzeldatei.html bleibt wichtige Fallback-Form.

Keine Online-Pflicht für Kernfunktionen.



29. Einzeldatei-Regeln

redion-einzeldatei.html ist wichtig.

Regeln:

node bauen.mts muss sie reproduzierbar erzeugen.

Keine externen Laufzeitabhängigkeiten in der Einzeldatei.

Größe beobachten.

Nach Änderungen an Kern/Schale/Bereichen prüfen, ob Einzeldatei neu gebaut werden muss.

CI darf erkennen, wenn Build-Artefakt nicht aktuell ist.

Einzeldatei darf keine Secrets enthalten.



30. Tests / Prüfungen

Prüfungen sind Pflicht.

Wichtige Befehle:

npm install
npx playwright install chromium
npm run pruefen
npm run pruefen -- --schnell
node pruefungen/lauf/test87.mjs
node bauen.mts

Regeln:

Jede Speicheränderung braucht Test.

Jede Import/Export-Änderung braucht Test.

Jede Rechteänderung braucht Test.

Jede Formeländerung braucht Test.

Jede Backup-Änderung braucht Test.

Große-Datei-Fälle testen.

Multi-Tab-Fälle testen, wenn betroffen.

Keine Mocks, wenn echte App geprüft werden kann.

Wenn ein Fehler gefunden wird, zuerst Test schreiben oder bestehenden Test erweitern.



31. Aktuelle wichtige Tests

Besonders wichtig:

test87.mjs
test96
test100.mjs

Bedeutung:

test87.mjs

prüft Architektur- und Sicherheitsgrenzen.

test96

hat gezeigt, dass Anhänge bei JSON-Backup fehlten oder leer wurden.

test100.mjs

prüft .redion-Sicherung mit echten Bytes, Anhängen, Löschen und Wiederherstellen.

Diese Tests nicht entfernen. Bei Änderung an Backup/ZIP/Dateien zuerst diese Tests beachten.



32. Doku-Regeln

Dokumentation ist Teil des Produkts.

Wichtige Dateien:

README.md
AUFGABEN.md
LUECKEN.md
ENTSCHEIDUNGEN.md
CLOUDFLARE.md
SERVER-EINRICHTEN.md
START-MIT-CLAUDE-CODE.md
doku/ARCHITEKTUR.md

Regeln:

Entscheidungen in ENTSCHEIDUNGEN.md festhalten.

Lücken in LUECKEN.md festhalten.

Aufgaben in AUFGABEN.md halten.

Cloud/Server nicht nur im Kopf planen.

.redion-Format dokumentieren.

README nicht mit internen Details überladen, aber wichtige Nutzerfunktionen erwähnen.

Keine falschen Versprechen.



33. README-Regeln

README soll Nutzern erklären:

Was Redion ist.

Wie man es startet.

Was lokal ist.

Was optional Server/Cloud ist.

Wie man sichert.

Was .redion ist.

Was Grenzen sind.

Wie man testet.

Wo Code liegt.

README soll nicht:

unfertige Features als fertig verkaufen

Cloudpflicht suggerieren

lokale Nutzung kleinreden

Sicherheitsrisiken verschweigen



34. Entscheidungen dokumentieren

Wenn eine technische Entscheidung getroffen wird, in ENTSCHEIDUNGEN.md dokumentieren.

Beispiele:

Warum .redion statt Base64-JSON?

Warum keine ZIP64-Unterstützung?

Warum .json vorhandene Anhänge nicht löscht?

Warum IDs beim Import erhalten bleiben?

Warum Server optional bleibt?

Warum D1/R2 getrennt werden?



35. Lücken dokumentieren

Wenn etwas fehlt, nicht verstecken.

In LUECKEN.md eintragen:

fehlende Tests

bekannte Grenzen

offene Sicherheitsfragen

fehlende UI

Performance-Risiken

Cloudflare-To-dos

Rechte-Lücken

Import/Export-Lücken

Eine bekannte Lücke ist besser als ein stiller Fehler.



36. Performance-Regeln

Redion soll auch auf schwächeren Geräten laufen.

Regeln:

Große Dateien nicht vollständig in RAM laden.

Lange Arbeit in Stücke teilen.

UI nicht blockieren.

Große Listen virtualisieren oder begrenzen, wenn nötig.

Suchindizes nicht unnötig neu bauen.

WebLLM nicht automatisch laden.

Datenbankansichten nicht unnötig komplett neu rendern.

Mobile Geräte beachten.

Speicherverbrauch bei Export/Import messen.



37. Mobile-Regeln

Redion soll mobil nutzbar bleiben.

Regeln:

Touchflächen mindestens 44 px.

Kein Desktop-only UI für Kernfunktionen.

Dialoge müssen auf kleinen Bildschirmen passen.

Side Peek darf mobil nicht unbedienbar werden.

Toolbar darf nicht verdecken.

Tastatur auf Mobile beachten.

Große Datei-Backups dürfen Mobile nicht abstürzen lassen.



38. Barrierefreiheit

Regeln:

Buttons mit Text oder aria-label.

Fokus sichtbar.

Tastaturbedienung erhalten.

Kontrast im Hell- und Dunkelmodus prüfen.

Keine Information nur über Farbe.

Dialoge fokussierbar.

Escape schließt passende Overlays.

Screenreader nicht durch leere Icons verwirren.



39. CSS-Regeln

Stil bleibt in Stil-Dateien.

Keine großen Inline-Style-Blöcke.

Bestehende Struktur respektieren:

quell/schale/stil/

Regeln:

Hell/Dunkel getrennt sauber halten.

Gemeinsame Tokens nutzen, wenn vorhanden.

Kein neues Designsystem ohne Grund.

Notion-ähnliche Klarheit vor Effekten.

Animationen sparsam.

Reduced Motion respektieren.



40. Server-Sicherheitsregeln

Für Server/Cloudflare:

Eingaben validieren.

JSON-Größen begrenzen.

Rate-Limits einplanen.

CORS strikt halten.

Keine offenen Admin-Endpunkte.

Tokens hashen.

Keine Secrets committen.

Fehler nicht mit internen Details an Nutzer senden.

D1-Queries sicher bauen.

Rechte serverseitig prüfen.

Öffentliche Seiten getrennt behandeln.

Uploads scannen/validieren, soweit möglich.

Dateinamen säubern.

Pfad-Traversal verhindern.



41. Bridge-Regeln

Für Bridge/Proxy-Funktionen:

Keine offene Proxy-Schleuder bauen.

Nur erlaubte Hosts.

Pfade prüfen.

Header begrenzen.

Auth-Header nicht unnötig weiterreichen.

Keine privaten lokalen Ziele erlauben.

Keine beliebigen URLs.

CORS nicht wild öffnen.

Tests für Allowlist.



42. Secrets-Regeln

Niemals ins Repository:

API-Schlüssel

Tokens

Passwörter

private URLs

persönliche Zugangsdaten

Cloudflare Secrets

OAuth Client Secrets

Nur Beispiele in:

.env.beispiel

Echte Secrets gehören in:

lokale .env

Cloudflare Secrets

sichere Passwortverwaltung



43. Git-Regeln

Nicht direkt wild auf main arbeiten.

Kleine Branches.

Kleine PRs.

Eine Änderung = ein klares Ziel.

Tests nennen.

Risiken nennen.

Keine generierten Großdateien ändern, wenn nicht nötig.

Wenn redion-einzeldatei.html neu gebaut wurde, sicherstellen, dass es zur Quelle passt.

Keine fremden Projekte anfassen.



44. PR-Regeln

Jede PR soll beantworten:

Was wurde geändert?
Warum?
Welche Dateien?
Welche Tests?
Welche Risiken?
Welche Daten können betroffen sein?
Ist Import/Export betroffen?
Ist Server/Cloud betroffen?
Ist redion-einzeldatei.html betroffen?

Bei Daten-/Speicheränderungen zusätzlich:

Wie wird Datenverlust verhindert?
Wie werden alte Daten migriert?
Wie wird Rückwärtskompatibilität behandelt?



45. Reihenfolge bei Arbeit

Immer so arbeiten:

Bestehenden Code lesen.

Bestehende Doku lesen.

Relevante Tests finden.

Kleinen Plan machen.

Kleine Änderung machen.

Tests ausführen.

Doku aktualisieren, wenn nötig.

Ergebnis kurz beschreiben.

Nicht:

zuerst groß umbauen

Tests ignorieren

Doku nachträglich vergessen

mehrere Themen vermischen



46. Prioritäten

Priorität 1:

Daten sicher halten

Priorität 2:

App startet zuverlässig

Priorität 3:

Import/Export/Backup vollständig

Priorität 4:

Editor und Datenbanken stabil

Priorität 5:

Server/Cloud optional und sicher

Priorität 6:

neue Features

Neue Features sind weniger wichtig als Datenintegrität.



47. Nicht tun

Nicht tun:

React einbauen

Vite als Pflicht für normale Nutzung einführen

IndexedDB durch LocalStorage ersetzen

große Dateien in JSON/Base64 sichern

eval() für Formeln verwenden

Bereiche direkt koppeln

Server zur Pflicht machen

Cloud-Sync automatisch aktivieren

private Daten ungefragt hochladen

Anhänge bei JSON-Import löschen

Datei-IDs beim Import brechen

Sicherheitswarnungen entfernen

Tests löschen, weil sie stören

README Dinge versprechen, die nicht funktionieren

Secrets committen



48. Wichtige aktuelle Baustellen

Aktuelle wichtige Punkte:

CLAUDE.md war leer und muss diese Regeln enthalten.
.redion-Backup ist wichtig und muss dokumentiert bleiben.
README sollte .redion-Sicherung mit Anhängen erwähnen.
doku/REDION-FORMAT.md sollte existieren oder erstellt werden.
Cloudflare/R2-Plan sollte mit .redion und Anhängen zusammengedacht werden.
Große Dateien über 4 GB brauchen klare Behandlung.



49. Empfohlene nächste Arbeiten

Nächste Arbeit 1: README ergänzen

README um .redion erklären:

vollständige Sicherung mit Anhängen
ZIP-artiges Paket
große Dateien speicherschonend
JSON bleibt für Textdaten

Nächste Arbeit 2: Format-Doku

Erstellen:

doku/REDION-FORMAT.md

Nächste Arbeit 3: Cloud-Dateien

Cloudflare/R2-Plan:

D1 für Daten
R2 für Anhänge
.redion als Offline-Download

Nächste Arbeit 4: CLAUDE.md aktuell halten

Diese Regeln müssen mit neuen Entscheidungen wachsen.



50. Definition von fertig

Eine Änderung ist erst fertig, wenn:

App startet.

Relevante Tests laufen.

Keine bekannten Datenverluste entstehen.

Import/Export betroffen? Dann geprüft.

Backup betroffen? Dann .json und .redion geprüft.

Große Dateien betroffen? Dann großer Blob-Fall geprüft.

Server betroffen? Dann Rechte/Sicherheit geprüft.

Doku betroffen? Dann aktualisiert.

Keine unnötigen Dependencies eingeführt.

Architekturregeln eingehalten.



51. Wichtigster Satz

Redion darf lieber langsamer neue Funktionen bekommen, als jemals Nutzerdaten zu verlieren.

---

# 52. TypeScript-Ziel und Code-Stil

Redion soll langfristig vollständig auf TypeScript umgestellt werden — professionell, wartbar und ähnlich sauber wie BABAT-RED.

Das Ziel ist:

```txt
TypeScript
klare Typen
modulare Struktur
Build-System
Tests
Cloudflare-kompatibel
weiterhin local-first
weiterhin offlinefähig
weiterhin exportierbar

Wichtig: Die Migration darf Redion nicht kaputt machen. TypeScript ist Ziel, aber Datenintegrität ist wichtiger als Geschwindigkeit.



52.1 Grundsatz

Claude soll neuen Code bevorzugt in TypeScript schreiben.

Neue Dateien sollen, wenn möglich, diese Endungen nutzen:

.ts
.tsx nur wenn echte UI-Komponenten mit JSX nötig sind

Da Redion aktuell kein React-Projekt ist, soll .tsx nur verwendet werden, wenn später bewusst eine UI-Schicht mit JSX eingeführt wird.

Für normalen Redion-Code gilt:

.ts



52.2 Migration nicht auf einmal

Nicht erlaubt:

gesamtes Projekt in einem PR auf TypeScript umstellen
alle Dateien gleichzeitig umbenennen
Build-System ohne Fallback erzwingen
bestehende App unstartbar machen
redion-einzeldatei.html kaputt machen
IndexedDB-Datenmodell ungetestet ändern

Erlaubt und gewünscht:

schrittweise Migration
erst Typen einführen
dann Kernmodule migrieren
dann Tests migrieren
dann UI-Schicht migrieren
dann Build-Ausgabe stabilisieren



52.3 Zielstruktur mit TypeScript

Langfristige Zielstruktur:

src/
  main.ts
  app/
    start.ts
    router.ts
    shell.ts
  core/
    storage/
      indexedDb.ts
      migrations.ts
      exportImport.ts
      redionPackage.ts
      zip.ts
      files.ts
    blocks/
      blockTypes.ts
      blockTree.ts
      blockOps.ts
    databases/
      schema.ts
      views.ts
      filters.ts
      sorts.ts
      formulas/
        tokenizer.ts
        parser.ts
        runtime.ts
        functions.ts
    events/
      bus.ts
      events.ts
    sync/
      syncEngine.ts
      conflicts.ts
      changes.ts
    security/
      crypto.ts
      sanitize.ts
      permissions.ts
    settings/
      settings.ts
      defaults.ts
    utils/
      id.ts
      dates.ts
      objects.ts
      debounce.ts
      errors.ts
  registry/
    blocks.ts
    modules.ts
    navigation.ts
    properties.ts
    views.ts
    formulas.ts
    commands.ts
    shortcuts.ts
    templates.ts
    connections.ts
  areas/
    editor/
    databases/
    knowledge/
    ai/
    files/
    templates/
    comments/
    mentions/
    pages/
    planning/
    settings/
    help/
  styles/
  tests/

Während der Migration darf die alte Struktur weiter existieren:

quell/

Aber neue TypeScript-Struktur soll geordnet aufgebaut werden.



52.4 Kompatibilitätsregel

Solange Redion noch migriert wird, muss mindestens eine stabile Startart funktionieren:

index.html

oder:

redion-einzeldatei.html

Wenn ein Build-System eingeführt wird, muss dokumentiert sein:

npm install
npm run build
npm run pruefen

Die gebaute App muss weiterhin ohne Entwicklungsserver nutzbar sein.



52.5 Build-System

TypeScript darf mit einem Build-System eingeführt werden.

Bevorzugt:

Vite
TypeScript
Vitest oder bestehende Node/Playwright-Tests
Playwright

Aber keine unnötige Framework-Pflicht.

Erlaubt:

typescript
vite
vitest
playwright

Nur mit Begründung:

React
React DOM
große UI-Libraries
State-Management-Libraries
Routing-Libraries
CSS-Frameworks

Wenn React eingeführt werden soll, muss zuerst eine eigene Entscheidung dokumentiert werden:

ENTSCHEIDUNGEN.md

Denn Redion ist nicht automatisch BABAT-RED. TypeScript ja, aber React nur nach Plan.



52.6 TypeScript-Konfiguration

Ziel:

{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true
  }
}

Strenge Typen sind erwünscht.

Wenn eine Datei nicht sofort streng typisierbar ist:

erst isolieren
dann typisieren
nicht überall any verteilen



52.7 any-Regel

any ist nur als Übergang erlaubt.

Bevorzugt:

unknown
Record<string, unknown>
konkrete Interfaces
Union Types

Nicht dauerhaft:

any

Wenn any nötig ist, Kommentar schreiben:

// TODO(ts-migration): alter Datenbestand, Typ wird in Phase X ersetzt.



52.8 Zentrale Typen

Zentrale Typen stehen in:

src/core/types/

Dort ist die Wahrheit, nicht hier. Diese Beispiele zeigen die Form; wenn beide
je auseinandergehen, gilt der Ordner.

Typnamen sind englisch. Feldnamen sind es nicht — sie heissen so, wie sie in
IndexedDB gespeichert sind. Ein Feldname im Typ, der nicht dem gespeicherten
Feld entspricht, ist keine Übersetzung, sondern eine falsche Behauptung, und
ihn zu ändern wäre eine Datenmigration.

export type ID = string
export type ISODateTime = string

export type BlockId = ID
export type PageId = ID
export type CollectionId = ID
export type ViewId = ID
export type FileId = ID

Ein Block, abgelesen aus quell/kern/ablage/indexdb.js (addBlock, Zeile 255):

export interface RedionBlock {
  id: BlockId
  type: string
  text: string
  content: BlockId[]        // Kennungen der Kinder, keine Objekte
  parentId: BlockId | CollectionId | null
  parentTable: 'block' | 'collection'
  color: string
  created: ISODateTime
  edited: ISODateTime
  erstelltVon: string       // deutsch, weil das Feld so gespeichert ist
  alive: boolean            // false = im Papierkorb, nicht endgültig weg
  icon?: string
  collectionId?: CollectionId
  aktiveView?: string
  dateiId?: string
}

export interface RedionPage extends RedionBlock {
  type: 'page'
  id: PageId
}

Eine Datenbankzeile ist derselbe Satz mit parentTable: 'collection'; die
Spaltenwerte stehen unter props.

Eine Datei, abgelesen aus quell/bereiche/dateien/ablage.js:

export interface RedionFile {
  id: FileId
  name: string
  groesse: number
  typ: string
  blockId: BlockId | null
  teile: number
  angekommen: number
  zustand: 'wartet' | 'laeuft' | 'fertig'
  angelegt: ISODateTime
  fertigAm: ISODateTime | null
}

Nicht raten, welche Felder es gibt. Nachsehen (ENTSCHEIDUNGEN.md E21). Diese
Beispiele zeigten hier einmal createdAt, updatedAt, properties, children und
deleted. Vier davon gibt es nicht, und deleted hätte die Bedeutung von alive
genau umgekehrt.



52.9 Datenbank-Typen

Eine Datenbank hält die Spalten. Die Zeilen liegen nicht darin, sondern als
Blöcke im Fach blocks, und zeigen über parentId hierher zurück.

export interface Column {
  name: string
  type: string              // Bezeichner aus Register.eigenschaften
  options?: Array<{ name: string; color?: string }>
  formel?: string
  zielCollection?: CollectionId
}

export type Schema = Record<string, Column>

export interface RedionDatabase {
  id: CollectionId
  name: string
  icon: string
  schema: Schema
  viewIds: ViewId[]
  created: ISODateTime
}

Der Spaltentyp ist bewusst string und keine Aufzählung: Register.eigenschaften
lässt sich zur Laufzeit erweitern. Ein Typ, der das verbietet, wäre falsch
statt streng.

Die zwölf Ansichtsarten stehen dagegen fest und sind eine Aufzählung:
table, board, timeline, calendar, list, gallery, chart, feed, map, dashboard,
pivot, form.



52.10 .redion-Typen

Das Sicherungsformat muss typisiert sein. Backup-Code nie untypisiert lassen.

export interface RedionPackageManifest {
  version: number
  exportiert: ISODateTime
  enthaelt: StoreName[]     // welche Fächer wirklich drin sind
  fehlt: StoreName[]        // welche fehlen; leer heisst vollständig
  hinweis: string           // ein Satz im Klartext für den Menschen
}

export interface RedionPackageData extends RedionPackageManifest {
  blocks: RedionBlock[]
  collections: RedionDatabase[]
  views: RedionView[]
  meta: MetaEntry[]
  versions: RedionVersion[]
}

enthaelt, fehlt und hinweis sind kein Beiwerk. Eine Sicherung, die nicht sagt,
was sie auslässt, ist die gefährlichste Sorte — man merkt es erst, wenn man
sie braucht.

Diese Feldnamen sind deutsch, weil sie wörtlich so in jeder bereits
geschriebenen Sicherungsdatei stehen. Sie umzubenennen würde vorhandene
Sicherungen unlesbar machen.



52.11 Async-Regel in TypeScript

Asynchrone Funktionen müssen klar typisiert werden:

export async function schreibePaket(...): Promise<Blob> {
  ...
}

Nicht:

export async function schreibePaket(...) {
  ...
}

bei öffentlichen Kernfunktionen.



52.12 Fehler-Typen

Fehler sollen eigene Klassen oder klare Result-Typen nutzen.

Beispiel:

export type Ergebnis<T> =
  | { ok: true; wert: T }
  | { ok: false; fehler: string; code?: string }

Für Nutzeraktionen ist oft besser:

return { ok: false, fehler: 'Die Datei ist größer als 4 GB.' }

statt nur:

throw new Error(...)



52.13 DOM-Code in TypeScript

DOM-Code soll typisiert werden.

Gut:

const knopf = document.createElement('button')
knopf.type = 'button'
knopf.textContent = 'Speichern'
knopf.addEventListener('click', () => speichern())

Wenn Element gesucht wird:

const root = document.getElementById('app')
if (!root) throw new Error('App-Container fehlt.')

Nicht:

document.getElementById('app')!.innerHTML = ...

wenn es vermeidbar ist.



52.14 Sichere HTML-Ausgabe

Auch mit TypeScript gilt:

export function esc(wert: unknown): string {
  return String(wert ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

Nutzertext niemals ungeprüft in innerHTML.



52.15 Tests mit TypeScript

Neue Tests bevorzugt in TypeScript, wenn Testsystem bereit ist:

tests/*.test.ts

oder bestehend:

pruefungen/lauf/*.mjs

Während Migration dürfen beide existieren.

Wichtig:

bestehende Prüfungen nicht löschen

neue TypeScript-Tests ergänzen

Playwright-Prüfungen behalten

Backup/Import/Export weiterhin mit echten Bytes testen



52.16 Migrationsphasen

Claude soll TypeScript in Phasen einführen.

Phase TS-0: Analyse

Bestehende Struktur lesen.
Große Dateien identifizieren.
Import-/Export-/Backup-Code finden.
Testlage prüfen.
Migrationsplan schreiben.

Phase TS-1: Tooling

Einführen:

typescript
vite oder eigener Build
tsconfig.json
npm scripts

Ohne App kaputt zu machen.

Phase TS-2: Typen

Einführen:

src/core/types/
Block-Typen
Datei-Typen
Datenbank-Typen
Backup-Typen
Result-Typen

Noch wenig Logik migrieren.

Phase TS-3: Kleine Kernhelfer

Migrieren:

id
datum
objekte
debounce
errors
escape/sanitize

Phase TS-4: .redion und Dateien

Migrieren:

redionPackage.ts
zip.ts
files.ts
exportImport.ts

Mit Tests.

Phase TS-5: IndexedDB-Schicht

Migrieren:

indexedDb.ts
migrations.ts
storage adapters

Sehr vorsichtig.

Phase TS-6: Register

Migrieren:

blocks.ts
properties.ts
views.ts
formulas.ts
commands.ts
navigation.ts
modules.ts

Phase TS-7: Datenbanken und Formeln

Migrieren:

formula tokenizer
parser
runtime
database view logic
filters
sorts
rollups

Phase TS-8: Editor

Editor nur nach Plan migrieren.

Vorher aufteilen:

render
keyboard
selection
slash menu
inline formatting
embeds

Phase TS-9: Server

Cloudflare/Server-Code typisieren:

server/
worker/
D1 types
R2 types
auth/session types
sync types
permissions types

Phase TS-10: Alte JS-Dateien entfernen

Erst wenn:

alle Tests grün
Build stabil
Einzeldatei funktioniert
Import/Export funktioniert



52.17 Ziel wie BABAT-RED, aber Redion-Regeln bleiben

BABAT-RED ist Vorbild für:

TypeScript
klare Module
strikte Typen
Build
Tests
Registry-Struktur
professionelle Architektur

Aber Redion behält eigene Identität:

Notion-artige App
local-first
Datenbanken
Blöcke
Offline
.redion-Paket
optionaler Server

Nicht blind BABAT-RED kopieren.



52.18 Neue Code-Regel

Ab jetzt gilt:

Neuer Kerncode: TypeScript.
Neue Typen: TypeScript.
Neue Tests: bevorzugt TypeScript.
Alten JavaScript-Code nur anfassen, wenn nötig oder im Rahmen einer geplanten Migration.



53. Code-Sprache und TypeScript

Die Sprachregel in einem Satz:

Deutsch für Menschen. Englisch für Code.

Ausführlich steht sie in ENTSCHEIDUNGEN.md unter E27. Hier das, was beim
Arbeiten gebraucht wird.


53.1 Was englisch wird

Alles, was nur der Code liest — und nur in neuem TypeScript:

Ordnernamen           src/core/helpers/
Dateinamen            ids.ts, backup.ts, spreadsheet.ts
Variablen             const activeView = …
Funktionen            createPage() statt seiteErstellen()
Klassen               class FormulaParser
Interfaces und Typen  RedionBlock, ViewLayout, Result<T>
Enums und Unions      'wartet' | 'laeuft' | 'fertig' bleibt als Wert deutsch,
                      der Typname UploadState ist englisch
Testnamen im Code     describe('createPage', …)


53.2 Was deutsch bleibt

Alles, was ein Mensch liest:

Nutzertexte           Knöpfe, Überschriften, Menüs, Platzhalter
Fehlermeldungen       „Die Datei ist größer als 4 GB."
Kommentare            im Code, auch im englisch benannten
Dokumentation         README.md, CLAUDE.md, AUFGABEN.md, LUECKEN.md,
                      ENTSCHEIDUNGEN.md, doku/
Prüfnamen im Text     die Beschreibung, die im Prüfbericht erscheint

Eine englisch benannte Datei mit deutschen Kommentaren ist kein Widerspruch,
sondern genau die Regel.


53.3 Die zwei harten Grenzen

Grenze 1: Feldnamen sind keine Namen, sondern Daten.

Ein Feld heisst so, wie es in IndexedDB gespeichert ist — created, edited,
erstelltVon, alive, groesse, teile, enthaelt, fehlt. Diese Namen zu
übersetzen ist keine Umbenennung, sondern eine Datenmigration, und sie macht
jede vorhandene Sicherung unlesbar. Also nicht.

Typname englisch, Feldname wie gespeichert.

Grenze 2: Keine Massenumbenennung.

Der Bestand unter quell/ ist deutsch benannt und bleibt es. Eine Datei wird
umbenannt, wenn sie ohnehin migriert wird — nicht, weil sie deutsch heisst.

Ein Modul mit fünfzehn Aufrufern darf im Zug seiner Migration umbenannt
werden (so geschehen bei Kennungen → Ids). Ein Modul mit hundert Aufrufern
nicht ohne eigenen Plan.


53.4 Wo neuer Code hingehört

src/                  TypeScript-Quelle, englisch benannt
  core/types/         nur Typen, keine Logik. Erzeugt nichts (noEmit).
  core/helpers/       kleine Helfer, werden nach quell/ ausgegeben
quell/                der laufende Bestand, deutsch benannt

Wichtig bei tsconfig.bauen.json: include darf nicht src/core/** umfassen,
ohne src/core/types/** auszuschliessen. Sonst werden leere .js-Dateien nach
quell/ geschrieben.


53.5 Was das nicht heisst

Kein React. TypeScript ja, React nur nach eigener Entscheidung in
ENTSCHEIDUNGEN.md.

Keine Build-Pflicht. index.html doppelklicken muss weiter funktionieren, und
redion-einzeldatei.html muss sich weiter mit node bauen.mts erzeugen lassen.

Kein grosser Umbau auf einmal. Die Phasen stehen in AUFGABEN.md.

Keine Datenmigration nebenbei. Siehe 53.3, Grenze 1.


53.6 Der wichtigste Satz dieses Abschnitts

Ein englischer Name ist eine Verbesserung. Ein falscher Feldname ist ein
Datenverlust. Im Zweifel nachsehen, nicht übersetzen.



52.19 Wichtigster TypeScript-Satz

Redion soll vollständig TypeScript werden, aber niemals auf Kosten von Datenverlust, kaputtem Backup oder zerstörter Offline-Nutzung.


---

54. Die Sprachen dieses Projekts

Beschlossen in ENTSCHEIDUNGEN.md E28. Der ganze Abschnitt in einem Satz:

    Es entsteht kein neues JavaScript.

54.1 Was benutzt wird

TypeScript   neuer Hauptcode, Typen, Kernlogik, neue Module
JavaScript   nur der bestehende Redion-Code — migrieren, nicht vermehren
HTML         Startdatei, App-Grundseite, Einzeldatei
CSS          Aussehen, Aufbau, Hell/Dunkel, Telefon
SQL          Cloudflare D1: Konten, Abgleich, Rechte, Dateiangaben
Markdown     README, CLAUDE.md, Doku, Aufgaben, Entscheidungen
Shell/Bash   Startskripte, lokale Befehle
YAML         GitHub Actions
JSON         Konfiguration, Sicherungen, .redion, Manifest
TOML         Wrangler

Eine weitere Sprache kommt nur dazu, wenn sie vorher in E28 steht. Ein
Python-Hilfsskript ist genau der Anfang, an dem eine Werkzeugkette entsteht.

54.2 Wo eine neue Datei hingehört

Code, den der BROWSER lädt:

    src/…/name.ts        wird bearbeitet
    npm run bauen:ts     erzeugt quell/…/name.js
    index.html + sw.js   laden das erzeugte .js

Das erzeugte .js wird mitversioniert. Es ist Ausgabe, kein Quelltext — und
es ist der Grund, warum die App weiterhin per Doppelklick startet.

Code, den NODE ausführt — Prüfläufe, bauen, Server:

    pruefungen/lauf/testNN.ts     und direkt starten:
    node pruefungen/lauf/testNN.ts

Kein Übersetzer, kein Paket, kein Schritt zum Vergessen. Node entfernt die
Typen seit 22.18 von selbst.

54.3 Der Preis: löschbare Typen

Node ENTFERNT die Typen, es übersetzt nicht. Was zur Laufzeit etwas erzeugt,
geht deshalb nicht:

    enum          -> stattdessen ein Objekt mit as const
    namespace     -> stattdessen eine Datei
    constructor(private x)  -> stattdessen ein gewöhnliches Feld

Eine einzige solche Zeile nimmt Node die Fähigkeit, die Datei auszuführen,
und der Fehler kommt dann aus einer ganz anderen Ecke. test109 hält das fest.

Und: Node PRÜFT dabei nicht. Das Prüfen bleibt npm run typecheck.

54.4 Wie die Regel durchgesetzt wird

pruefungen/js-bestand.json führt jede von Hand geschriebene .js/.mjs, die es
heute gibt. Das Verzeichnis darf nur schrumpfen.

    eine Datei migriert   -> aus dem Verzeichnis streichen
    eine neue .js angelegt -> test109 wird rot

Erzeugtes JavaScript zählt nicht mit; test105 hält es an seiner .ts.

54.5 Was das nicht heisst

Nicht: den Bestand in einem Zug übersetzen. Die Reihenfolge steht in
doku/TYPESCRIPT-MIGRATION.md und beginnt dort, wo ein Fehler nichts kostet.

Nicht: einen Bauschritt für die App einführen. Das bleibt verboten (§6). Die
zwei Wege oben kommen ohne aus, und genau deshalb sind es diese zwei.


================================================================================
# 55. Bilder machen, nicht nur Code lesen
================================================================================

Beide Gestaltungs-Skills (`redion-ui-design-system`, `redion-mobile-ux`) sagen
denselben Satz, und er ist der wichtigste in beiden:

    Öffne die Seite wirklich, statt nur den Code zu lesen.

    node bilder.mjs                  alle Ansichten, Rechner und Telefon
    node bilder.mjs tabelle          nur die Tabelle
    node bilder.mjs tabelle handy    nur die Tabelle am Telefon

Die Bilder landen in `bilder/` und werden nicht mitversioniert.

55.1 Warum das keine Kür ist

Beim Tabellenblock fand das Hinsehen vier Fehler, die KEINE Prüfung hatte —
und zwei davon konnte keine Prüfung haben, weil sie nur mit Augen sichtbar
sind:

  · Eine abgeschnittene Zahl zeigte eine ANDERE Zahl. `634.2166666667` stand
    als `34.2166666667` da. Beide Zahlen sind gültig; kein Prüflauf konnte
    ahnen, dass die zweite falsch ist.
  · Die Ausrichtungsknöpfe `⟨ ≡ ⟩` sahen auf dem Bildschirm aus wie Klammern.
  · Ein zweiter Fokusrahmen zog eine blaue Linie durchs Bild, die nichts
    bedeutete.
  · Am Telefon stand die halbe Werkzeugleiste ausserhalb des Bildes — darunter
    der Weg zu „Als Excel speichern".

55.2 Und die Lehre daraus für Prüfungen

Die erste Prüfung gegen die abgeschnittene Zahl mass `scrollWidth` gegen
`clientWidth`. Gemessen ergab das für eine 21-stellige Zahl in einer 109 px
breiten Zelle: 109 gegen 109.

Der Grund ist Flexbox — der Text ist ein anonymes Flex-Element und wird
GESTAUCHT statt überzustehen. Es gibt gar keinen überstehenden Inhalt zu
messen; abgeschnitten wird trotzdem.

Eine Prüfung, die immer „passt schon" sagt, ist keine Prüfung. Wer eine neue
schreibt, prüft zuerst, ob sie überhaupt rot werden KANN.

55.3 Nach jeder Änderung ein Bild

Redur will die Bilder direkt im Gespräch sehen — nach jeder Gestaltungs-
änderung und nach jeder neuen Sache. Das ist keine Höflichkeit, sondern der
kürzeste Weg zu den vier Fehlern oben.

55.4 Die Bilder gehen nie auf GitHub

`bilder/` steht in `.gitignore`. Bildschirmfotos sind Arbeitsmaterial, keine
Quelle: sie gehören auf den Rechner, an dem gearbeitet wird — nicht ins
Verzeichnis, nicht in die Einzeldatei, nicht ins Dienst-Skript.

Zwei Gründe, und der zweite ist der wichtigere:

  · Ein Verzeichnis, das mit jedem Durchgang um ein paar hundert Kilobyte
    wächst, ist nach einem Monat grösser als die App.
  · Ein Bild von gestern beantwortet keine Frage von heute. Was zählt, ist
    der Blick auf das, was JETZT gebaut wurde — und dafür gibt es
    `bilder.mts`, zehn Sekunden pro Durchgang.

`bilder.mts` selbst gehört sehr wohl ins Verzeichnis. Es ist das Werkzeug,
nicht das Ergebnis.
