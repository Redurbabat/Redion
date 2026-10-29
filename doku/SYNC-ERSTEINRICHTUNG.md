# iPhone ↔ Windows: erster eigener Redion-Sync-Server

Stand: 29. Oktober 2026. Redur hat bestätigt: Es gibt noch keinen eigenen
Sync-Server. Hier wird die Einrichtung vorbereitet, nicht als erledigt behauptet.
Die installierten Apps bleiben offline benutzbar. Keine Daten werden automatisch hochgeladen.

## Was schon funktioniert – und was fehlt

Redion besitzt einen gemeinsamen Abgleich mit Verschlüsselung privater Inhalte,
getrennten Anhängen, Grabsteinen und Drei-Wege-Konflikten. Die Zwei-Geräte-Läufe
76, 77, 78, 113 und 118 prüfen diese Logik mit synthetischen Daten.
Ein solcher Testserver ist KEIN produktiver Dienst für das iPhone.

In `wrangler.toml` sind D1 (`DB`) und R2 (`R2`) derzeit nicht aktiv gebunden.
Alte Konto-/Datenbankhinweise in den Kommentaren sind keine aktuelle Ressource.
Nicht ungeprüft die historischen Kennungen aktivieren.

Die rein lokale Bestandsprüfung startet mit:

```powershell
node skripte/sync-readiness.mts
```

Sie liest keine `.env`, keine Tokens und keine Notizen. Sie veröffentlicht nichts.
`false` bei Live-/Native-Prüfung ist ehrlich: Eine Konfigurationsdatei kann das
nicht beweisen.

## Vor einer Einrichtung mit echten Daten

1. Auf BEIDEN Geräten extern sichern. Eine Sicherung im iPhone-App-Container
   allein schützt nicht vor App-Löschung. Bei Anhängen `.redion` verwenden.
2. Das richtige eigene Cloudflare-Konto festlegen. Keine alten Konten erraten.
3. Kosten und Abrechnung im Konto selbst prüfen und ausdrücklich freigeben.
   Kein pauschales „kostenlos“: R2 erfordert eine aktivierte Subscription und
   kann oberhalb der Freimengen Kosten erzeugen.
4. Neue D1-Datenbank im richtigen Konto erstellen, vorhandenes
   `server/schema.sql` prüfen/anwenden und die echte `DB`-Bindung eintragen.
   Keine Daten aus einer bestehenden Datenbank löschen oder ungefragt migrieren.
5. Privaten R2-Bucket für PDF-/Bildanhänge anlegen und als `R2` binden.
   Keine öffentliche Bucket-Freigabe. Ohne R2 ist das kein vollständiger
   Dokumentabgleich; der bestehende Server-Dateiweg begrenzt Anhänge auf 100 MB.
6. Eigenen HTTPS-Host und Redions `ADRESSE` festlegen. Geheimnisse nur im
   Anbieter-Dashboard/Secret-Speicher setzen, nie hier oder im Chat posten.

## Zwei Sicherheitstore – nicht einfach abschalten

`worker.ts` verlangt vor API UND statischen Dateien einen gültigen
Cloudflare-Access-Nachweis (`ACCESS_TEAM`, `ACCESS_AUD`). Zusätzlich benötigen
Redions Konto-/Sync-Endpunkte eine eigene Redion-Sitzung und Arbeitsbereichsrechte.
Nur eine D1-Datenbank plus URL einzutragen reicht daher NICHT.

**Vor Freigabe muss die Anmeldung der nativen Apps separat gelöst und geprüft sein:**

- Native Apps haben andere Ursprünge als die Website (`capacitor://localhost`
  bzw. `redion-local://app`). Der bestehende CORS-Helfer normalisiert über
  `URL.origin`. Custom-Schemes dürfen nicht blind als `null` freigegeben werden.
- Eine Anmeldung in Safari oder Edge stellt der lokalen WebView nicht automatisch
  eine passende Access-Sitzung bereit. Auch OAuth-`postMessage` eines normalen
  Web-Popups ist nicht automatisch ein nativer Anmeldeweg.
- Keine globalen Cloudflare-Service-Secrets in IPA, EXE, Web-Code oder IndexedDB
  einbauen. Kein `TOR=offen`, kein CORS-Stern und kein Abschalten der Prüfung als
  Reparatur. Eine gerätegebundene/benutzerspezifische native Authentifizierung
  ist ein eigener Sicherheitsbogen und braucht einen echten Host sowie Tests.
- Das erste Konto braucht eine konfigurierte Anmeldung, beispielsweise GitHub
  OAuth auf der geschützten Website. Ein Gerätecode verknüpft mit einem bereits
  angemeldeten Konto; er erzeugt allein kein erstes Konto.

Dieser Branch ändert weder das Access-Tor noch die CORS-/Serverlogik.
Ohne bestätigten nativen Anmeldeweg bleibt Live-Sync ausdrücklich gesperrt.

## Erst mit Testdaten abnehmen, dann bewusst einschalten

Website-Anmeldung → native Geräteanmeldung → Serverstand mit `ablage: d1` und
`dateien: r2` → gemeinsame Kontozuordnung → Verschlüsselung auf beiden Geräten
entsperren → Abgleich auf jedem Gerät ausdrücklich erlauben.

Dann mit einer Testnotiz und einem Test-PDF prüfen: offline ändern, beide Geräte
gleichzeitig bearbeiten, Konflikt anzeigen/lösen, Anhang-Bytes vergleichen,
App-Neustart, fehlendes Netz und abgelaufene Sitzungen. Keine Klartext- oder
Account-Secrets im Serverprotokoll. Erst danach echte Daten einbeziehen.

Bis dahin ist die bewusste Sicherungsübertragung der verfügbare Weg, kein
automatischer Zwei-Wege-Abgleich. Dazulegen kann bei gleichen Kennungen eine
Sicherungsfassung übernehmen; vorher die aktuelleren Inhalte vergleichen.

## Offizielle Grundlagen

- [D1 erstellen und an einen Worker binden](https://developers.cloudflare.com/d1/get-started/)
- [R2-Subscription und Abrechnung](https://developers.cloudflare.com/r2/get-started/)
- [Access Service Tokens – kein gemeinsam eingebautes Client-Geheimnis](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/)

Es wurde kein Konto eröffnet, keine Subscription aktiviert, keine Ressource
erstellt, kein Deployment gestartet und kein persönlicher Inhalt hochgeladen.
