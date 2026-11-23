
# RED ION Live Sync – MCP → iPhone/Windows (23.11.2026)

## Funktionsumfang dieses PRs

Der bestehende bidirektionale Abgleich wird um die **optionale**
Einstellung **«Nahezu live (15 Sekunden)»** ergänzt. Bei geöffneter App
werden Änderungen vom gemeinsamen Serverbestand periodisch eingelesen,
wenn Netzwerk, Anmeldung, Arbeitsbereich und ausdrückliche Sync-Freigabe
stimmen. Der vorhandene Abgleich aktualisiert danach die lokale Oberfläche.

**Kein Echtzeit-Push:** Es gibt hier noch keine WebSocket-/Durable-Object-
Benachrichtigungen. 15 Sekunden sind das Prüfintervall, keine
garantierte Zustellfrist. Netzwerk, iOS-Lebenszyklus, Konflikte
und Serverfehler können die Anzeige verzögern.

Die Apps verwenden weiterhin /sync/runter und /sync/hoch mit den
bestehenden Berechtigungen, Versionen und der Verschlüsselung.
Cloud-MCP schreibt in dieselbe D1-Satztabelle. Eine zweite
Dokumentdatenbank oder eine neue Cloudflare-Ressource ist nicht nötig.

## Änderungen

- Neues Intervall 15 Sekunden, zusätzlich zu 0/120/600 Sekunden.
  Standard bleibt 120; keine bestehende Einstellung wird überschrieben.
- Periodische Abfragen nur bei sichtbarer, online befindlicher App.
  Der eigentliche Abgleich erzwingt weiterhin Konto, Einwilligung,
  Entsperrung und Schutz vor gleichzeitigen Durchläufen.
- Spätes Anmelden aktiviert den Timer sofort; Abmelden beendet ihn.
- Bei Rückkehr in die App oder erneuter Internetverbindung
  wird der sichere Abgleich zusätzlich gestartet.
- Exakter iOS-Ursprung capacitor://localhost ergänzt den vorhandenen
  Windows-Ursprung redion-local://app **nur** auf den bereits
  geschützten Sync-Routen. Keine Wildcards, fremden Origins oder
  Freigaben für andere Serverrouten.

## Einrichtung auf iPhone und Windows

1. Apps mit dem neuen Code erstellen und installieren; ein GitHub-Merge
   allein aktualisiert keine bereits installierte IPA oder EXE.
2. Beide Apps unter Wolke mit demselben RED-ION-Konto, derselben
   sicheren HTTPS-Adresse und demselben Arbeitsbereich verbinden.
3. **Vor dem ersten Abgleich** beide lokalen Datenbestände auf
   iPhone und Windows separat sichern und Konfliktregeln prüfen.
   Verschlüsselungsschlüssel auf beiden Geräten entsperren.
4. Den Abgleich auf jedem Gerät bewusst einschalten und die Option
   «Nahezu live (15 Sekunden)» aktiv auswählen.
5. Beide Apps offen lassen; mit ChatGPT-MCP eine **Testseite**
   erstellen und prüfen, ob sie automatisch auf beiden erscheint.
6. Dann offline, Geräte-Neustart, Konflikte und gesperrte
   Bildschirme ausprobieren. Das sind noch offene Geräte-Abnahmen.

## Kosten und Hintergrundgrenzen

Bei zwei durchgehend sichtbaren Geräten entstehen mit 15-Sekunden-
Intervall etwa **11'520 Abgleichzyklen am Tag**, noch ohne alle
HTTP-Unteraufrufe. Free-Kontingente können dadurch schneller aufgebraucht
sein. Kein Tarifwechsel, keine automatischen Cloudflare-Kosten;
für den Alltag ist der bestehende Zwei-Minuten-Takt sparsamer.

iOS kann geschlossene oder im Hintergrund befindliche Apps nicht
zuverlässig alle 15 Sekunden aufwecken. Echtes serverseitiges
Live-Push über WebSocket/Durable Objects wäre ein separater Ausbau
mit Kosten-, Berechtigungs- und Geräte-Tests.

## Freigabe

    npm run test:live-sync
    npm run test:mcp-cloud
    npm run typecheck

Die CI vergleicht auch die tatsächlich ausgelieferten JavaScript-Dateien
mit den TypeScript-Quellen. Echte iOS- und Windows-Installationen
wurden durch diesen PR noch nicht getestet oder aktualisiert.
