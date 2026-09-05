# Notizen im Netz veröffentlichen — Schritt für Schritt

Ziel: Die App liegt unter einer echten Adresse wie
`https://redion.<dein-name>.workers.dev`, lässt sich auf dem iPhone installieren, und die
Anmeldung bei Google funktioniert. Alles kostenlos.

Zeitaufwand beim ersten Mal: etwa zehn Minuten.

---

## Warum überhaupt online?

Solange die App als Datei läuft (`file://`), geht dreierlei nicht:

| Was | Warum nicht |
|---|---|
| Anmeldung bei Google | Google akzeptiert nur echte Adressen als Rückweg |
| Installieren als App | Ein Service Worker braucht `https` |
| Brücke zu iCloud und Jira | Braucht etwas, das zwischen Browser und Dienst steht |

Mit Cloudflare Pages ist alles drei erledigt — und die Daten bleiben trotzdem
auf deinem Gerät. Cloudflare liefert nur die Dateien aus; was du schreibst,
kommt dort nie an.

---

## Teil 1 — Bei Cloudflare veröffentlichen

### 1. Konto anlegen

`dash.cloudflare.com/sign-up` — E-Mail und Passwort, mehr nicht. Keine
Kreditkarte, kein Abo.

### 2. Das Projekt anlegen

Im Menü links: **Workers & Pages** → **Create** → Reiter **Pages** →
**Connect to Git**.

Beim ersten Mal fragt GitHub, ob Cloudflare zugreifen darf. Du kannst den
Zugriff auf das eine Repository beschränken — mehr braucht es nicht.

### 3. Repository wählen

Wähle **Redurbabat/Redion** und klicke **Begin setup**.

### 4. Einstellungen

Cloudflare legt heute standardmässig ein **Worker**-Projekt an, kein
Pages-Projekt. Das ist in Ordnung — das Repository ist dafür eingerichtet.
Die Vorgaben passen:

| Feld | Wert |
|---|---|
| Project name | `notizen` |
| Production branch | `main` |
| Build command | *leer* |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |

**Save and Deploy** drücken. Nach etwa einer Minute steht deine Adresse da:

```
https://redion.<dein-name>.workers.dev
```

Ab jetzt gilt: Jeder `git push` veröffentlicht automatisch neu.

> **Wenn der erste Versuch fehlgeschlagen ist:** Das lag daran, dass
> `wrangler.toml` für Pages geschrieben war und Cloudflare ein Worker-Projekt
> gebaut hat. Ausserdem hätte Cloudflare die ganze `.git`-Ablage mit
> ausgeliefert — darin liegt eine Datei über 25 MB, und mehr lässt Cloudflare
> nicht zu. Beides ist behoben: `wrangler.toml` ist für einen Worker
> geschrieben, und `.assetsignore` sagt, was NICHT ins Netz geht (E270).
> Einmal pushen, dann läuft es.

### So ist das Repository aufgebaut

Es gibt **keinen** `public/`-Ordner. Redion liegt so im Netz, wie es auch
lokal liegt — `index.html` in der Wurzel, der Code darunter. Das ist der
ganze Grund, warum sich die App per Doppelklick öffnen lässt (§6), und
Cloudflare kommt damit zurecht.

```
index.html       ← die App
quell/           ← ihr Code (erzeugt aus src/, mitversioniert)
sw.js            ← Dienst-Arbeiter für Offline
oeffentlich/     ← Symbole, manifest.webmanifest
worker.ts        ← Einstiegspunkt: beantwortet /api/*, liefert sonst die Dateien
server/          ← der Serverteil (cloudflare.ts, kern.ts, schema.sql)
wrangler.toml    ← sagt Cloudflare, was zu tun ist
.assetsignore    ← sagt Cloudflare, was NICHT ins Netz geht
functions/       ← die Brücke
start.bat        ← lokal starten
oeffnen.bat      ← lokal ohne Server öffnen
holen.bat        ← GitHub → dieser Ordner
hochladen.bat    ← dieser Ordner → GitHub
vergleichen.bat  ← nur nachsehen, ändert nichts
```

> **`.assetsignore` ist keine Bequemlichkeit.** `wrangler.toml` bindet
> `[assets] directory = "./"` — also das ganze Verzeichnis. Ohne diese Datei
> gingen `src/`, `pruefungen/`, `node_modules/`, `.git/` und eine etwaige
> `.env` mit ins Netz. Gemessen: **8318 Dateien**, und der Vorgang brach
> ohnehin an einer 78,6-MB-Datei in `.git` ab. Wer sie löscht, veröffentlicht
> beim nächsten Push seinen Quelltext samt allem, was daneben liegt.

### 5. Eigene Adresse (freiwillig)

Hast du eine eigene Domain, geht sie unter **Custom domains** dazu.
Ohne Domain reicht `redion.<dein-name>.workers.dev` völlig.

---

## Teil 2 — Auf dem iPhone installieren

Die App bringt alles mit, was iOS dafür braucht: Manifest, Symbole,
Startbilder, Service Worker.

1. **Safari** auf dem iPhone öffnen — Chrome und Firefox können es dort nicht
2. `https://redion.<dein-name>.workers.dev` aufrufen
3. Unten auf den **Teilen-Knopf** tippen (Quadrat mit Pfeil nach oben)
4. In der Liste nach unten wischen bis **„Zum Home-Bildschirm"**
5. Oben rechts **Hinzufügen**

Danach:

* eigenes Symbol auf dem Bildschirm
* startet ohne Adresszeile, über die volle Höhe
* läuft auch ohne Netz
* iOS räumt die Daten nicht mehr nach sieben Tagen weg — das tut es nur bei
  normalen Safari-Tabs

Die Seitenleiste ist auf dem Telefon eine Schublade: über **☰** oben links
oder durch Wischen von links.

> **Sicherung nicht vergessen.** Auch als App liegen die Daten nur auf dem
> Gerät. Unter *Einstellungen → Import und Export* ab und zu eine Sicherung
> ziehen. Löscht man die App, sind die Daten weg.

---

## Teil 3 — Anmeldung bei Google einrichten

Nötig für Google Kalender und Gmail. Kostenlos, dauert fünf Minuten.

### 1. Projekt anlegen

`console.cloud.google.com` → oben ein neues Projekt anlegen, Name egal.

### 2. Die zwei Schnittstellen einschalten

**APIs & Dienste → Bibliothek**, dort suchen und je auf *Aktivieren*:

* **Google Calendar API**
* **Gmail API**

### 3. Zustimmungsbildschirm

**APIs & Dienste → OAuth-Zustimmungsbildschirm**

* Nutzertyp: **Extern**
* App-Name: `Notizen`
* Support-E-Mail: deine
* Weiter, weiter, speichern

Solange die App auf *Testing* steht, trage dich unter **Zielgruppe →
Testnutzer** selbst ein. Sonst lässt Google dich nicht durch.

### 4. Client-ID erzeugen

**APIs & Dienste → Anmeldedaten → Anmeldedaten erstellen →
OAuth-Client-ID → Webanwendung**

Zwei Felder sind wichtig:

**Autorisierte JavaScript-Ursprünge** — genau die Adresse aus deiner
Adresszeile, ohne Schrägstrich am Ende:
```
https://redion.dein-name.workers.dev
```

**Autorisierte Weiterleitungs-URIs**
```
https://redion.dein-name.workers.dev/index.html
```

> Läuft die App auch zu Hause über `start.bat`, trag zusätzlich
> `http://localhost:8080` und `http://localhost:8080/index.html` ein.

**Erstellen** drücken. Die Client-ID sieht so aus:

```
123456789012-abcdefghijk.apps.googleusercontent.com
```

Das **Client-Geheimnis** wird nicht gebraucht. Diese App ist ein
Browserprogramm; ein Geheimnis wäre dort ohnehin keins.

### 5. In die App eintragen

App öffnen → **Einstellungen → Verbindungen → Google** → Client-ID einfügen →
**Verbinden**.

Es geht ein Google-Fenster auf, du meldest dich an, das Fenster schliesst
sich. Fertig.

---

## Teil 4 — Die Brücke

Manche Dienste lassen einen Browser nicht direkt heran: iCloud, Jira, viele
Kalenderadressen. Dafür liegt `functions/api/bruecke.ts` im Repo — Cloudflare
führt sie von selbst aus, ohne Einrichtung.

Die App findet sie automatisch unter `/api/bruecke`. In den Einstellungen
muss nichts eingetragen werden.

Die Brücke spricht nur mit Gegenstellen, die in der Liste am Anfang der Datei
stehen — sonst wäre sie ein offenes Tor. Wer weitere braucht, trägt sie dort
ein und pusht.

---

## Teil 5 — Danach

### Neue Fassung veröffentlichen

```
git add -A
git commit -m "Was sich geändert hat"
git push
```

Cloudflare merkt es und veröffentlicht in etwa einer Minute neu. Die
installierte App auf dem iPhone meldet sich beim nächsten Start selbst:
*„Es liegt eine neue Fassung bereit."*

### Vorschau vor der Veröffentlichung

Jeder andere Branch bekommt eine eigene Vorschauadresse. Gut zum Ausprobieren,
bevor etwas auf `main` landet.

### Was Cloudflare sieht

Nur, dass jemand die Dateien geladen hat. Deine Notizen liegen in der
IndexedDB deines Browsers und werden nie irgendwohin geschickt. Die einzigen
Ausnahmen sind die, die du selbst einschaltest: Google-Kalender, Gmail,
GitHub, Wikipedia — und die gehen direkt vom Browser zum Dienst, nicht über
Cloudflare.

---

## Wenn etwas klemmt

| Zeichen | Ursache | Abhilfe |
|---|---|---|
| Weisse Seite | Falsches Verzeichnis | `wrangler.toml` muss auf `./public` zeigen |
| Deploy scheitert in Sekunden | `.git` grösser als 25 MB wurde mit ausgeliefert | Behoben — die App liegt in `public` |
| „It looks like you've run a Workers-specific command in a Pages project" | Alte `wrangler.toml` mit `pages_build_output_dir` | Behoben |
| `redirect_uri_mismatch` | Adresse steht nicht bei Google | Genau die Adresse aus der Adresszeile eintragen, mit `/index.html` |
| `access_denied` | Nicht als Testnutzer eingetragen | Zielgruppe → Testnutzer → eigene Adresse |
| Anmeldefenster geht nicht auf | Pop-up blockiert | Für diese Seite erlauben |
| „Zum Home-Bildschirm" fehlt | Nicht Safari | In Safari öffnen |
| Alte Fassung nach dem Push | Service Worker hält fest | App schliessen und neu öffnen, oder auf den Hinweis tippen |
| Kalender-Abo geht nicht | Der Anbieter blockt den Browser | Die Brücke greift automatisch — sonst ICS-Datei herunterladen und einlesen |

---

## Kostet das etwas?

Nein. Cloudflare Pages ist für private Projekte kostenlos: unbegrenzt
Besucher, 500 Veröffentlichungen im Monat, 100.000 Funktionsaufrufe am Tag.
Google Kalender und Gmail haben ein kostenloses Kontingent, das für den
eigenen Gebrauch reicht.

Die App selbst kostet nichts und wird nie etwas kosten — sie läuft in deinem
Browser.
