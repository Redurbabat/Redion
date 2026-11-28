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
