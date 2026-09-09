# Den Redion-Server einrichten

**Zeitaufwand: etwa zehn Minuten. Kosten: keine.**

Redion braucht keinen Server. Ohne ihn liegt alles auf dem Gerät, und das
bleibt der Normalfall — wer diese Anleitung überspringt, verliert nichts von
dem, was bisher da war.

Mit Server kommen vier Dinge dazu, die ohne ihn nicht gehen:

1. Dieselben Notizen auf Rechner und Telefon
2. Rechte, die wirklich sperren statt nur auszublenden
3. Eine Seite, die man jemandem schicken kann, der kein Redion hat
4. Eine Schnittstelle, die auch von aussen erreichbar ist

---

## Was das kostet

Nichts, und das ist keine Werbeaussage, sondern nachrechenbar:

| | kostenlos bis | was Redion braucht |
|---|---|---|
| Cloudflare Workers | 100 000 Anfragen am Tag | ein Abgleich sind zwei Anfragen |
| Cloudflare D1 | 5 GB, 5 Mio. Zeilen lesen am Tag | Text braucht kaum Platz |
| GitHub OAuth | unbegrenzt | für die Anmeldung |
| Google OAuth | unbegrenzt | dasselbe |

Bei zwei Geräten und einem Abgleich alle zwei Minuten sind das rund 1 500
Anfragen am Tag. Das ist ein Sechzigstel der Grenze.

Es wird **keine Kreditkarte verlangt.** Cloudflare fragt beim kostenlosen
Tarif nicht danach.

---

## Schritt 0 — Genau diese Befehle, der Reihe nach

Alles Weitere steht ausführlich darunter. Wer es einfach abarbeiten will:
**PowerShell** öffnen (Windows-Taste, „PowerShell" tippen) und Zeile für
Zeile eingeben. Der Ordner ist der, in dem `index.html` liegt:

```powershell
cd "$env:USERPROFILE\Documents\ChatGPT\Redion\Redion-src"

npx wrangler login
npx wrangler d1 create redion
#   → die vier Zeilen der Ausgabe in wrangler.toml einkommentieren
#     und die database_id eintragen (Schritt 1)
npx wrangler d1 execute redion --remote --file=server/schema.sql
npx wrangler r2 bucket create redion-dateien
#   → auch die [[r2_buckets]]-Zeilen in wrangler.toml einkommentieren
npx wrangler secret put ADRESSE
#   → https://redion.<dein-name>.workers.dev, ohne Schrägstrich am Ende
npx wrangler deploy --dry-run
npx wrangler deploy
```

`--dry-run` lädt nichts hoch — es probiert den Vorgang nur durch. **Worauf
es dabei ankommt: dass keine Fehlermeldung kommt.** Steht dort

```
✘ [ERROR] Asset too large … .git/objects/pack/… 78.6 MiB
```

dann fehlt `.assetsignore` — und dann würde nicht nur der Vorgang abbrechen,
sondern beim nächsten Versuch auch `src/`, `pruefungen/` und eine etwaige
`.env` mit ins Netz gehen.

> Die Zeile `✨ Read 8322 files from the assets directory` steht **auch dann
> da, wenn alles stimmt.** Sie zählt, was im Verzeichnis liegt, bevor
> `.assetsignore` angewandt wird — nicht, was hochgeht. Nachgemessen, damit
> hier nicht steht, man solle auf eine Zahl achten, die nichts bedeutet.

> **Zwei Fallen mit PowerShell.** `npx` heisst dort manchmal `npx.cmd`. Und
> wenn „npx wird nicht erkannt" kommt, fehlt Node.js — von `nodejs.org` das
> LTS-Paket, danach PowerShell einmal schliessen und neu öffnen.

---

## Schritt 1 — Die Datenbank anlegen

Auf dem Rechner, im Ordner `Redion-src` (dort, wo `index.html` liegt):

```
npx wrangler d1 create redion
```

Beim ersten Mal öffnet sich ein Browserfenster für die Anmeldung bei
Cloudflare. Danach kommt eine Ausgabe wie diese:

```
[[d1_databases]]
binding = "DB"
database_name = "redion"
database_id = "a1b2c3d4-…"
```

In `wrangler.toml` steht dieser Block schon — **auskommentiert**, mit `#`
davor. Die `#` entfernen und die `database_id` aus der Ausgabe eintragen.

> **Warum er auskommentiert dasteht und nicht mit einem Platzhalter:**
> Cloudflare prüft die Bindungen beim Veröffentlichen gegen dein Konto. Eine
> Platzhalter-ID lässt `wrangler deploy` **abbrechen** — auskommentiert ist
> also nicht Nachlässigkeit, sondern die einzige Form, die sich vor
> `wrangler d1 create` überhaupt veröffentlichen lässt. `server/cloudflare.ts`
> ist genau dafür gebaut: ohne Datenbank läuft der Rest weiter.

> **Die `database_id` ist kein Geheimnis** und gehört mitcommittet. Sie ist
> kein Schlüssel und ohne Zugang zu deinem Cloudflare-Konto wertlos. Wer sie
> weglässt, veröffentlicht beim nächsten Push einen Server **ohne Datenbank** —
> denn Cloudflare baut aus GitHub, nicht von deinem Rechner. Die echten
> Geheimnisse (`ADRESSE`, `GITHUB_GEHEIM`, `GOOGLE_GEHEIM`, `VAPID_PRIVAT`)
> stehen nie in der Datei, sondern hinter `wrangler secret put` (§42).

---

## Schritt 2 — Die Tabellen anlegen

```
npx wrangler d1 execute redion --remote --file=server/schema.sql
```

Das legt die Tabellen an. Sie sind leer, bis sich jemand anmeldet.

---

## Schritt 2b — Der Speicher für Anhänge (freiwillig)

Bilder, PDFs und Videos gehören nicht in die Datenbank (E2). Sie liegen in
R2, dem Dateispeicher von Cloudflare:

```
npx wrangler r2 bucket create redion-dateien
```

Danach in `wrangler.toml` die drei Zeilen unter `[[r2_buckets]]`
einkommentieren und neu veröffentlichen. Ohne diesen Schritt läuft alles
Übrige weiter — die Datei-Wege antworten dann mit 503 und genau diesem
Hinweis.

---

## Schritt 3 — Veröffentlichen

```
npx wrangler deploy
```

Danach prüfen, ob es läuft:

```
https://deine-adresse/api/stand
```

Da müssen **zwei** Dinge stehen:

```json
{ "ablage": "d1", "dateien": "r2" }
```

`"ablage": "keine"` heisst: die Datenbank ist nicht gebunden — in Schritt 1
ist etwas schiefgegangen. `"dateien": "keine"` heisst: der Dateispeicher
fehlt (Schritt 2b). Dann läuft alles Übrige weiter, aber Bilder, PDFs und
Videos bleiben auf dem Gerät.

**In Redion sagt es dir dieselbe Auskunft in Worten:** Mehr → Daten und
Sicherheit → ☁ Wolke → **Server prüfen**. Der Knopf nennt, was fehlt, und
gibt die Befehle dazu an.

**Ab hier funktioniert der Abgleich schon** — mit dem Gerätecode. Anmelden
über GitHub oder Google braucht noch Schritt 4.

---

## Schritt 4 — Anmelden über GitHub (freiwillig)

Ohne diesen Schritt geht die Anmeldung über den **Gerätecode**: der Rechner
zeigt einen Code, das Telefon tippt ihn ein. Das reicht für ein oder zwei
Geräte völlig.

Wer es bequemer will:

1. Auf **github.com/settings/developers** → *New OAuth App*
2. Ausfüllen:
   - **Application name:** Redion
   - **Homepage URL:** deine Adresse
   - **Authorization callback URL:** `deine-adresse/konto/oauth/github/zurueck`
3. *Register application*, dann *Generate a new client secret*
4. Beides in Cloudflare hinterlegen:

```
npx wrangler secret put GITHUB_ID
npx wrangler secret put GITHUB_GEHEIM
```

Für Google dasselbe unter **console.cloud.google.com** → *APIs & Services* →
*Credentials* → *OAuth client ID* → *Web application*, mit derselben
Rückrufadresse, nur `google` statt `github`. Dann:

```
npx wrangler secret put GOOGLE_ID
npx wrangler secret put GOOGLE_GEHEIM
```

Diese Geheimnisse liegen bei Cloudflare, nicht im Repository — deshalb
`secret put` und nicht `wrangler.toml`.

---

## Schritt 4b — Die eigene Adresse eintragen · **wichtig**

Der Server muss wissen, unter welcher Adresse seine App liegt. Zwei Dinge
hängen daran, und beide sind Sicherheitsfragen:

- **Wohin nach dem Anmelden zurückgesprungen wird.** Diese Adresse bestimmt
  am Ende, wohin der Sitzungsschlüssel geliefert wird. Sie kam früher
  ungeprüft aus der Adresszeile.
- **Wer den Server von aussen lesen darf** (CORS). Vorher durfte das jede
  Seite im Netz — auch bei den Antworten, die ohne Anmeldung kommen.

```
npx wrangler secret put ADRESSE
```

Eintragen: die Adresse, unter der Redion läuft, ohne Schrägstrich am Ende —
zum Beispiel `https://redion.deine-domain.workers.dev`.

Wer die App unter mehreren Adressen erreicht (etwa eine `.pages.dev` und eine
eigene Domäne), trägt die weiteren mit Komma dazu ein:

```
npx wrangler secret put ADRESSEN
```

> **Solange `ADRESSE` fehlt, bleibt der Server bei „jeder darf lesen".** Das
> ist Absicht — wer gerade zum ersten Mal veröffentlicht, soll nicht an einer
> Sperre scheitern, die er noch gar nicht einrichten konnte. Es heisst aber
> auch: **ohne diesen Schritt ist der Server nicht fertig eingerichtet.**
> `localhost` bleibt immer erlaubt, damit das Entwickeln funktioniert.

Ohne eingetragene Adresse lehnt die Anmeldung über GitHub oder Google mit
einer Meldung ab, die sagt, was zu tun ist — sie scheitert nicht stumm.

---

## Schritt 5 — In Redion anmelden

In Redion: **Befehlspalette → „Wolke: anmelden und abgleichen"**.

Dort wird nach einem **Satz für die Verschlüsselung** gefragt. Diesen Satz
merken: aus ihm entsteht der Schlüssel für alle privaten Seiten, und er wird
nie an den Server geschickt. Geht er verloren, ist er weg — dann liegen die
Seiten zwar noch auf dem Server, aber niemand kann sie mehr lesen.

Auf dem zweiten Gerät **denselben Satz** eingeben. Ein anderer Satz ergibt
einen anderen Schlüssel, und dann kommt nichts an. Redion sagt das dann auch
deutlich, statt still nichts zu tun.

---

## Schritt 6 — iPhone und iPad

Der Reihe nach, und der zweite Punkt ist der wichtigste:

1. Die Adresse in **Safari** öffnen. Nicht Chrome, nicht der Browser in einer
   anderen App — nur Safari darf auf iOS eine Seite installieren.
2. **Teilen** (das Kästchen mit dem Pfeil) → **Zum Home-Bildschirm**.

Punkt 2 ist keine Bequemlichkeit. Safari räumt die Daten einer normalen
Webseite nach **sieben Tagen ohne Besuch** weg — Speicher, Ablage, alles. Als
installierte App zählt Redion nicht mehr als „Webseite", und das passiert
nicht. Wer diesen Schritt überspringt, kann nach zwei Wochen Ferien vor einem
leeren Telefon stehen.

3. Redion vom Home-Bildschirm starten.
4. Mehr → Daten und Sicherheit → ☁ **Wolke** → **Mit einem Code von einem
   anderen Gerät.** Der Rechner zeigt den Code, das Telefon tippt ihn ein.
5. **Denselben Satz für die Verschlüsselung** eingeben wie am Rechner. Ein
   anderer Satz ergibt einen anderen Schlüssel, und dann kommt nichts an.
6. **Abgleich einschalten.** Er steht bewusst nicht von selbst an: es
   verlässt nichts dieses Gerät, solange niemand ausdrücklich ja gesagt hat.

### Und der Ordner-Weg, der auf dem Telefon nicht geht

In den Einstellungen gibt es **Sicherung in einen Ordner** — Redion legt dann
alle paar Minuten von selbst eine vollständige Sicherung dort ab. Liegt der
Ordner in iCloud Drive, OneDrive oder Dropbox, lädt der Dienst sie hoch, und
sie erscheint auf dem Telefon in **Dateien**.

Das geht nur am **Rechner** (Chrome oder Edge). Safari auf iPhone und iPad
kann keinen Ordner behalten, und Firefox auch nicht — dort steht in den
Einstellungen deshalb ein Satz statt eines Knopfes. Für das Telefon ist der
Abgleich oben der richtige Weg.

---

## Was der Server sieht und was nicht

Das ist der Teil, der wirklich zählt:

**Er sieht nicht:** private Seiten. Die werden auf dem Gerät verschlüsselt
(AES-GCM 256, Schlüssel über PBKDF2 mit 310 000 Runden) und verlassen es nur
so. Der Server hat kein Stück des Schlüssels.

**Er sieht:** was du ausdrücklich teilst oder veröffentlichst. Anders geht es
nicht — er kann keine Rechte prüfen, was er nicht lesen kann, und keinem
fremden Browser eine Seite schicken, die er nicht kennt. Deshalb steht beim
Teilen ein Schalter mit genau diesem Satz darüber, und nicht in einer
Fussnote.

**Er sieht ausserdem:** wann welches Gerät abgeglichen hat, wer welche Rechte
bekommen hat, welche Marke wann benutzt wurde. Das ist das Protokoll, und es
liegt bewusst dort und nicht auf dem Gerät — ein Protokoll, das der Besitzer
selbst löschen kann, ist keines.

---

## Rechte je Spalte

Eine Freigabe sagt „diese Seite ja". Manchmal ist das zu grob: die
Personalliste soll das Team sehen, die Gehaltsspalte nicht.

Im Spaltenmenü einer Datenbank steht dafür **„Rechte für diese Spalte"**. Je
Person drei Stufen: *sehen und ändern · nur sehen · gar nicht.* Ein Eintrag
für „alle anderen" ist die Grundregel, ein persönlicher sticht ihn.

Geprüft wird das **auf dem Server**, nicht im Browser: beim Herunterladen
wirft er die gesperrten Werte heraus, beim Hochladen dreht er unerlaubte
Änderungen zurück und sagt, welche. Der Rest der Zeile geht durch.

Zwei Grenzen, damit nichts Falsches erwartet wird:

- Der **Besitzer** des Bereichs ist immer aussen vor. Wer sich selbst
  aussperren kann, hat kein Rechtesystem, sondern eine Falle.
- Es gilt für **geteilte** Seiten. Verschlüsselte kann der Server nicht
  filtern — er sieht nur Zufall. Dort hat aber ohnehin nur einer den
  Schlüssel.

---

## Wenn zwei Geräte dasselbe ändern

Der Abgleich wirft nichts weg. Er merkt sich, wie ein Satz aussah, als beide
Geräte ihn gleich sahen, und kann deshalb unterscheiden, wer was geändert
hat: verschiedene Spalten gehen beide durch, verschiedene Stellen im selben
Absatz auch, und angehängte Blöcke bleiben beide stehen.

Nur wenn beide **dieselbe Stelle verschieden** gesetzt haben, gibt es kein
automatisches Richtig. Dann meldet Redion es und zeigt beide Fassungen
nebeneinander — Befehlspalette → **„Zwei Fassungen — offene Konflikte"**. Bis
dort eine Wahl steht, gilt auf jedem Gerät die eigene Fassung.

**Token liegen nie im Klartext** in der Datenbank, nur als Fingerabdruck. Wer
die Datenbank in die Hand bekommt, kann sich damit trotzdem nicht anmelden.

---

## Wenn etwas nicht geht

**`"ablage": "keine"`** — die `[[d1_databases]]`-Zeilen fehlen in
`wrangler.toml` oder die `database_id` stimmt nicht.

**„Der Server ist nicht erreichbar"** — kein Netz, oder die Adresse in den
Einstellungen zeigt woandershin. Die Notizen sind davon nicht betroffen; sie
liegen auf dem Gerät.

**„Die Anmeldung ist abgelaufen"** — Sitzungen halten dreissig Tage. Einfach
noch einmal anmelden.

**„Seiten liegen da, aber der Schlüssel passt nicht"** — auf diesem Gerät
wurde ein anderer Satz eingegeben als auf dem ersten. Denselben nehmen.

**GitHub-Anmeldung meldet `redirect_uri_mismatch`** — die Rückrufadresse in
der OAuth-App muss auf `/konto/oauth/github/zurueck` enden, genau so, ohne
Schrägstrich am Ende.

---

## Ohne Cloudflare

Der Server hängt nicht an Cloudflare. `server/kern.ts` weiss gar nicht, wo er
läuft — er bekommt eine Anfrage und eine Ablage. Für einen eigenen Rechner:

```
node server/pruefserver.ts 8790
```

Das ist zum Ausprobieren gedacht, nicht für den Betrieb: es speichert nichts
über den Neustart hinaus und hat keine Verschlüsselung auf der Leitung. Wer
es ernsthaft selbst betreiben will, schreibt eine dritte Ablage nach dem
Vorbild in `server/ablage.ts` — sieben Funktionen, mehr braucht der Kern
nicht.
