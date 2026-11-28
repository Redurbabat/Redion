# RED Bit – separate Server-Lesefreigabe (Pilot)

Stand: 28.11.2026. Eigener Feature-Branch, Basis main 67876aa.
RED Bit PR #62 enthält zwölf lokale Werkzeuge, aber noch keinen Remote-Transport.
Dieser Pilot ergänzt eine **vorbereitende**, je RED-ID-v2-Sitzung widerrufbare
Lesefreigabe. Er liefert **keine Musikdaten**, nimmt keine Befehle entgegen
und erweitert keine bestehenden identity:read-, Sync-, Share- oder MCP-Rechte.
`externalAppActions:false` bleibt unverändert.

## Aktivierung und Ablauf

Standard: aus. Nur der Serverbetreiber kann den Pilot mit
`REDION_ENABLE_RED_BIT_PERMISSIONS=1` für den privaten HTTPS-Home-Server
aktivieren. Keine Änderung der Deploy-Defaults. Kein öffentliches Deployment.

1. RED Bit wie bisher mit RED ID v2 verbinden.
2. Der Besitzer meldet sich mit seiner RED ION Gerätesitzung an und wählt
   die Sitzungs-ID der RED-Bit-Installation aus `GET /red-id/v2/sessions`.
3. `POST /home/red-bit/grant` mit exakt `{"sessionId":"session_…","confirm":true}`.
   Der Server akzeptiert nur eine aktive RED-Bit-Sitzung desselben Owners.
   Der Scope ist fest `music:status:read`, höchstens eine Stunde, begrenzt
   durch die Gültigkeit der Sitzung. Kein vom Client bestimmter Scope.
4. `GET /red-bit/v1/permission` mit dem RED-Bit-Access-Token zeigt nur
   Scope, Ablaufzeit und `remoteAvailable:false`. Ohne Freigabe: 403.
   Falsche App, alter Token oder gesperrtes Konto: 401.
5. Owner-Inventar: `GET /home/red-bit/grants`. Widerruf:
   `POST /home/red-bit/revoke` mit derselben bestätigten Parameterform.
   Ein Logout/Session-Widerruf löscht die Freigabe per SQLite-Trigger.
   Access-Token-Rotation derselben Sitzung erhält die befristete Freigabe.

Keine neue App-Berechtigung wird automatisch angelegt. Bei abgeschaltetem
Pilot sind alle vier Routen 404. Noch gültige Freigaben bleiben bis zum
expliziten Widerruf, Session-Ende oder Ablauf gespeichert; vor erneutem
Aktivieren ggf. betreffende RED-ID-Sitzungen widerrufen. Nur die
Sitzungs-ID, Owner-ID und Ablaufzeit werden im privaten SQLite gespeichert,
keine Titel, Dateien, Tokens oder Wiedergabezustände. Das Owner-Inventar
ist auf 128 Einträge begrenzt. Die App-Freigabe bleibt separat erforderlich.

## Abnahme und nächste Schritte

`node --test pruefungen/red-bit-permissions.test.mts`

Prüft mit dem tatsächlichen Home-Router und temporärem SQLite: Standard aus,
Owner-Bestätigung, App-/Sitzungsisolation, Rotation, Ablauf, Widerruf,
gesperrtes Konto, Origin und Eingabegrenzen. Nicht als Geräteabnahme oder
vollständiger Remote-MCP-Nachweis werten. Graphify-Stand vor Änderung:
faa0e0ec; Aktualisierung des lokalen Graphen noch offen.

Vor einem Remote-Transport: getrennte App-Zustimmung für Serveraktionen,
ein beschränkter, authentifizierter Auftragskanal, zeitlich begrenzte
Aufträge, eindeutige Gerätezuordnung, Wiederholungsschutz über Neustarts,
Rate-Limits und redigierte Audits, Prüfung von Widerruf und iOS-Lifecycle.
Keine Musikbefehle über die vorhandenen identity:read-Tokens oder RED ION
Workspace-OAuth-Grants.

## Separater Status-Auftragskanal (zweiter Pilot)

Zusätzlich `REDION_ENABLE_RED_BIT_READ_JOBS=1` erforderlich, neben der
Berechtigungsfreigabe. Owner kann eine bestätigte Statusabfrage für exakt
eine autorisierte RED-Bit-Sitzung erstellen. POST-Routen:

- /home/red-bit/read-request: sessionId, zufällige 32 Hex-Zeichen als id,
  issuedAt (Millisekunden, höchstens 30 s alt), confirm:true.
- /red-bit/v1/read-claim: confirm:true, nur mit RED-Bit-Access-Token,
  einmalige Abholung der ausstehenden Abfrage.
- /red-bit/v1/read-complete: id und begrenztes Statusobjekt.
- /home/red-bit/read-result: sessionId und id, nur Owner.

Aufträge laufen spätestens nach 45 Sekunden ab, höchstens einer gleichzeitig
offen pro Sitzung, 10 Aufträge je 60 Sekunden. Ergebnisse sind nur bis Ablauf
lesbar und werden bei der nächsten autorisierten Job-Operation bereinigt.
Widerruf oder Erneuerung der Freigabe löscht die betreffenden Jobs per Trigger.
Keine Wiederholung nach Claim; IDs bleiben bis 120 s nach Erstellung gespeichert,
ausser beim Widerruf/Erneuerung. Kein dauerhafter Replay-Schutz über neue Grants;
noch kein automatischer Client, kein Schreibwerkzeug und kein ChatGPT-MCP.
Die App muss den Nutzer vor Abholung und Statusübermittlung separat zustimmen
lassen. Kein Einsatz mit produktiven Daten vor echter Geräteabnahme.

## Separate Transportfreigabe (dritter Pilot, keine Ausführung)

Standard aus; explizit REDION_ENABLE_RED_BIT_TRANSPORT_PERMISSIONS=1.
Unabhängig von der Lesefreigabe, eigene SQLite-Tabelle und eigener Scope
music:transport:control, maximal 15 Minuten und höchstens bis Sitzungsende.
Owner-Routen: GET /home/red-bit/transport-grants, POST
/home/red-bit/transport-grant und /home/red-bit/transport-revoke (jeweils
sessionId, confirm:true). GET /red-bit/v1/transport-permission ist nur für
die betreffende RED-Bit-Sitzung. Session-Widerruf entfernt den Grant.
Antworten kennzeichnen remoteAvailable:false und localConfirmationRequired:true.
Noch kein Auftragskanal, keine Befehlsausführung und keine MCP-Werkzeuge.
Vor Wiederaktivierung gegebenenfalls alte Grants bzw. Sitzungen widerrufen.
Für die spätere Ausführung sind separate lokale Bestätigung, Replay-Schutz,
begrenzte Befehle, Widerruf und Geräteabnahme erforderlich.

## Transport-Auftragskanal (vierter Pilot)

Zusätzlich REDION_ENABLE_RED_BIT_TRANSPORT_JOBS=1 erforderlich; beide
Transportflags standardmässig aus. Nur play, pause, next, previous.
Alle Routen POST mit JSON und jeweiligem Bearer-Token:

- Owner /home/red-bit/transport-request: sessionId, id (32 Hex-Zeichen),
  command, issuedAt (Millisekunden, höchstens 15 s alt), confirm:true.
- App /red-bit/v1/transport-claim: confirm:true; liefert einmalig den Auftrag.
- App /red-bit/v1/transport-authorize: id, command, confirm:true; erst nach
  Anzeige und lokaler Bestätigung genau dieses Befehls. Einmaliger Permit
  mit höchstens 5 s Gültigkeit, begrenzt durch den Auftragsablauf.
- App /red-bit/v1/transport-complete: id, outcome (executed, failed oder
  declined); declined nur vor Autorisierung, sonst nur nach Autorisierung.
- Owner /home/red-bit/transport-result: sessionId, id; liest nur Zustand
  und Ergebnis bis Auftragsablauf (max. 30 s nach issuedAt).

Maximal ein offener Auftrag je Sitzung, sechs pro Minute, IDs bleiben
120 s als Replay-Schutz auch nach Grant-Erneuerung oder Widerruf erhalten.
Keine Wiederholung nach Claim oder Autorisierung, auch bei Netzfehlern.
Der Server kann eine bereits erhaltene Ausführungsfreigabe nicht zurückholen;
die native App muss den Permit-Ablauf und den lokalen Zustand unmittelbar
vor Ausführung prüfen. Ergebnis ist eine Client-Quittung, kein unabhängiger
Nachweis der tatsächlichen Wiedergabe. Keine Titel, Dateien oder Tokens im
Auftragsdatensatz. Native App, Dashboard-Steuerung und MCP noch nicht angebunden.
Die Permission-API meldet bis zur Abnahme weiterhin remoteAvailable:false.

## Dashboard-Musiksteuerung

RED ION → Einstellungen → RED Home Server → RED Bit · Musiksteuerung.
Sitzungen und Steuerungsfreigaben manuell abrufen, Zielgerät auswählen,
separate 15-Minuten-Freigabe erteilen. Einen der vier Befehle bestätigen.
In RED Bit → RED Home Server → Server-Musiksteuerung den Auftrag abrufen
und den konkreten Befehl lokal bestätigen. Innerhalb der 30-Sekunden-Frist
im Dashboard das Ergebnis abrufen. Keine automatische Wiederholung.
Eine bestätigte App-Anforderung ist kein unabhängiger Wiedergabenachweis.
Nach unklarem Ausgang zuerst Wiedergabe auf dem Zielgerät prüfen.
Auftrags-IDs bleiben nur im Speicher der geöffneten Dashboard-Ansicht;
nach Navigation ist eine alte Quittung dort nicht mehr abrufbar.
Native Gegenstelle: RED Bit PR #63. CI und echte Geräteabnahme ausstehend.
