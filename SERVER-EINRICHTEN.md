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

## Schritt 1 — Die Datenbank anlegen

Auf dem Rechner, im Ordner `Redion-App`:

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

Diese vier Zeilen **ans Ende von `wrangler.toml` kopieren.** Die
`database_id` ist bei jedem anders — deshalb steht sie nicht schon drin.

---

## Schritt 2 — Die Tabellen anlegen

```
npx wrangler d1 execute redion --remote --file=server/schema.sql
```

Das legt acht Tabellen an. Sie sind leer, bis sich jemand anmeldet.

---

## Schritt 3 — Veröffentlichen

```
npx wrangler deploy
```

Danach prüfen, ob es läuft:

```
https://deine-adresse/api/stand
```

Da muss stehen: `"ablage": "d1"`. Steht dort `"ablage": "keine"`, ist die
Datenbank noch nicht gebunden — dann ist in Schritt 1 etwas schiefgegangen.

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

Der Server hängt nicht an Cloudflare. `server/kern.js` weiss gar nicht, wo er
läuft — er bekommt eine Anfrage und eine Ablage. Für einen eigenen Rechner:

```
node server/pruefserver.js 8790
```

Das ist zum Ausprobieren gedacht, nicht für den Betrieb: es speichert nichts
über den Neustart hinaus und hat keine Verschlüsselung auf der Leitung. Wer
es ernsthaft selbst betreiben will, schreibt eine dritte Ablage nach dem
Vorbild in `server/ablage.js` — sieben Funktionen, mehr braucht der Kern
nicht.
