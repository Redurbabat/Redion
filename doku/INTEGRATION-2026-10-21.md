# Integration vom 21. Oktober 2026 (E752)

## Auftrag und Herkunft

Redur verlangt, `fix/redion-sicherheit-und-datenschutz-20261021` vollständig
auf `main` zu übernehmen und auf GitHub zu pushen. Basis des Vergleichs:

| Stand | Commit | Behandlung |
|---|---|---|
| GitHub und lokales main vor der Integration | `020f51ce1` | Bleibt Vorfahr, kein Umschreiben |
| Sicherheits-/Glasbranch | `97123abd6` | Vollständig in der Abstammung enthalten |
| Zielleiste, Quellen | `fd4dbc332` | Enthalten |
| Zielleiste, Telefon | `fce1cdb72` | Enthalten |
| Lokale Integration mit vollständiger Zielleisten-Doku | `d8f7c6c30` | Zusammengeführt in `98906028d` |
| Unfertige zusätzliche lokale Symbolfeder | `24365d989` | Separat auf `codex/apple-glass-20oct` gesichert |
| Älterer PDF-Zwischenstand | `19a3de648` | Separat auf `codex/pdf-masterprompt-abschluss` gesichert |

`git merge-base --is-ancestor` bestätigt main, den Sicherheitsbranch und
beide Zielleisten-Zweige als Vorfahren. Der Push erfolgt ohne Force.
Keine vorhandenen Zweige, Arbeitsstände oder Nutzerdaten werden gelöscht.

## Inhalt

- Access-Prüfung vor Assets und API-Routen, `run_worker_first = true`.
- Begrenzte Request-Bodies auch ohne Content-Length; eingeschränkte
  HTTPS-Brücke mit Allowlist, gleicher Herkunft und ohne Redirect-Folgen.
- Apple-inspirierte Glasflächen und Bewegungen aus beiden Etappen des
  genannten Branches; Einstellung für ruhige Bewegung bleibt erhalten.
- Beide Zielleisten einschließlich Touch-Gesten und ihrer vollständigen
  Dokumentation. Die Quelltextkarte verwendet jetzt relative Dateipfade,
  damit ihr Generator auf Windows und Linux dieselben Verweise erzeugt.

Beim Review wurden zwei echte Brückenfehler mit neuen Testfällen zuerst
rot gezeigt und dann repariert: der doppelt maskierte Ziffernausdruck
lehnte normale Content-Length ab; HTTP 205 erhielt einen unzulässigen
Antwortkörper. `test620`: vorher 13 grün / 2 rot, danach 15 grün / 0 rot.
Die Eingabegrenzen wurden dabei nicht gelockert.

Die Cloudflare-/Workers-Prüfvorgaben waren Teil des Reviews. Das
Zugangstor bleibt eingeschaltet; keine Zugangsdaten wurden eingerichtet,
ausgelesen oder veröffentlicht.

## Prüfungen auf dem Windows-Laptop

| Prüfung | Ergebnis |
|---|---|
| Typecheck, TypeScript-/Insel-Build, Dienststand, Einzeldatei | Grün vor der Abschlussdokumentation; Schlusslauf folgt |
| Schnelllauf | 45 von 47 Läufen grün |
| `test620`, Brücke | 15/15 grün, im Schnelllauf |
| `test621`, Access vor Assets/API | 12/12 grün, im Schnelllauf |
| `test31`, Start und PWA | 35/35 grün |
| `test101`, Eingabegrenzen | 30/30 grün |
| `test581`, Druckfedern | 93/93 grün |
| `test582`, Glas und Kontrast | 180/180 grün |
| Touch, Zielleisten, Motion-Browsercheck | Abschluss noch in Arbeit |

`test585` las mit `getAnimations()[0]` seit den zusätzlichen CSS-Übergängen
nicht mehr zuverlässig die Druckfeder. Der Wächter sucht nun gezielt
genau eine Animation der eigenen `scale`-Eigenschaft. Mindestens 20
Stützstellen und das bisherige enge Nachschwingfenster bleiben Pflicht.
Der erste Lauf zeigte den Messfehler und brach später bei einem zerstörten
Browserkontext ab; ein vollständiger Wiederholungslauf ist erforderlich.

### Zwei belegte Windows-Testhilfen bleiben offen

- `test216` erzeugt einen Unix-Shell-Ersatz für Tesseract und einen
  Unix-PATH. Unter Windows läuft dieses Ersatzprogramm nicht; die
  OCR-Erwartungen schlagen deshalb fehl.
- `test578` schreibt mit Windows-Rückstrichen gebildete Dateimuster in
  eine temporäre TypeScript-Konfiguration. TypeScript meldet TS18003
  (keine Eingabedateien). Der eigentliche Projekt-Typecheck ist grün.

Beide Tests und die betroffenen Produkt-/Builddateien sind gegenüber
`020f51ce1` unverändert. Redur erlaubt auf die konkrete Rückfrage:
„Ja, jetzt integrieren und pushen“. Die Tests wurden weder entfernt noch
abgeschwächt. Portierbare Testhilfen bleiben in `AUFGABEN.md` offen.

### Grenze der Abnahme

Ein neuer vollständiger Regressionslauf wurde nicht ausgeführt.
Die zwölf aus E751 dokumentierten alten roten Läufe sind:
201, 270, 332, 348, 351, 365, 425, 448, 470, 493, 524 und 533.
Sie wurden für diesen Bericht nicht erneut vollständig nachgemessen.
Redurs ausdrückliche Ausnahme gilt für diese Integration, nicht pauschal
für spätere Änderungen. Ein grüner GitHub-Schnelllauf wäre ebenfalls kein
vollständiger Regressionslauf.

## Auslieferungsgrenze

GitHub-Push und Cloudflare-Konfiguration sind getrennte Schritte. Es
wurde kein Deployment-Befehl ausgeführt und kein Cloudflare-Zugang
verändert. Ohne `ACCESS_TEAM`/`ACCESS_AUD` antwortet der Worker absichtlich
mit 503. Eine bestehende automatische Bereitstellung muss diese Werte
bereits korrekt haben; ihre Live-Konfiguration wurde hier nicht geprüft.

Bildschirmfotos und lokale Laufprotokolle liegen ausschließlich im
ignorierten Ordner `bilder/` und werden nicht auf GitHub gepusht.
