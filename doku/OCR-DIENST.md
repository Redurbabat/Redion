# Der lokale Erkennungsdienst

Redion kann Text aus Bildern, PDF-Ausschnitten und Handschrift lesen. Der
Knopf dafür heisst **„⌁ Erkennen"** und steht am Bild, an der PDF-Seite und
am A4-Blatt.

Damit er etwas tut, muss auf **demselben Rechner** ein kleiner Dienst laufen.
Dieser Dienst liegt bei: `dienste/ocr.mts`.

---

## Warum überhaupt ein eigener Dienst?

Ein Browser kann keine Schrift aus einem Bild lesen. Es gäbe zwei Wege, und
Redion nimmt bewusst den zweiten:

| Weg | Was passiert | Warum nicht / warum doch |
| --- | --- | --- |
| Bild an einen Cloud-Dienst schicken | Der Ausschnitt verlässt den Rechner | Widerspricht dem Grundsatz, dass die Daten dem Nutzer gehören. Ein Konto, ein Vertrag, eine Rechnung — und ein Bild, das man nicht zurückholt. |
| Bild an einen Dienst auf **diesem** Rechner schicken | Der Ausschnitt bleibt da, wo er ist | Kein Konto, kein Netz, kein Abo. Redion sendet ausschliesslich an `localhost` und fragt jedes Mal vorher. |

Redion prüft das nicht nur im Text: `recognition.ts` **weigert sich**, eine
Adresse zu speichern, die nicht auf `localhost`, `127.0.0.1` oder `::1`
zeigt. Eine Cloud-Adresse lässt sich dort gar nicht eintragen.

---

## Einmal einrichten

### 1. `tesseract` installieren

Der Dienst liest mit [Tesseract](https://github.com/tesseract-ocr/tesseract),
dem freien Erkenner. Er ist auf jedem Betriebssystem in zwei Zeilen da:

```bash
# Debian / Ubuntu / Raspberry Pi
sudo apt install tesseract-ocr tesseract-ocr-deu tesseract-ocr-eng

# macOS mit Homebrew
brew install tesseract tesseract-lang

# Windows mit winget
winget install UB-Mannheim.TesseractOCR
# oder mit Chocolatey
choco install tesseract
```

Prüfen, ob es geklappt hat:

```bash
tesseract --version
```

Die Sprachpakete sind einzeln. `deu` und `eng` reichen für den Anfang;
`tesseract --list-langs` zeigt, was da ist.

### 2. Den Dienst starten

```bash
node dienste/ocr.mts
```

Mehr braucht es nicht — kein `npm install`, kein Bauschritt. Node führt die
TypeScript-Datei direkt aus (siehe CLAUDE.md §54.2).

Auf der Konsole steht dann:

```txt
Redion-Erkennungsdienst läuft auf http://127.0.0.1:8765/ocr
Sprachen: deu+eng · Beenden mit Strg + C
```

Andere Einstellungen:

```bash
node dienste/ocr.mts --port 9010          # anderer Port
node dienste/ocr.mts --sprachen deu       # nur Deutsch
node dienste/ocr.mts --sprachen deu+eng+fra
```

### 3. Die Adresse in Redion eintragen

Beim ersten Klick auf **„⌁ Erkennen"** fragt Redion nach der Adresse.
Eintragen:

```txt
http://127.0.0.1:8765/ocr
```

Sie wird gespeichert und beim nächsten Mal nicht mehr erfragt.

---

## Was dabei passiert — und was nicht

Bei jedem Erkennen:

1. Redion schneidet **den markierten Ausschnitt** aus, nicht das ganze Bild.
2. Redion **fragt**, ob dieser Ausschnitt an `http://127.0.0.1:8765` gehen
   darf. Ohne Ja passiert nichts.
3. Der Dienst schreibt den Ausschnitt in eine Zwischendatei, ruft
   `tesseract` auf und **löscht die Zwischendatei wieder** — auch wenn etwas
   schiefgeht.
4. Der erkannte Text kommt zurück und landet **neben** dem Bild, in
   `ocrText`. Das Bild selbst wird nie verändert.

Was **nicht** passiert:

* Nichts verlässt den Rechner. Der Dienst hört nur auf `127.0.0.1` — nicht
  einmal ein anderes Gerät im selben WLAN erreicht ihn.
* Der Dienst behält nichts. Keine Datenbank, keine Protokolldatei, kein
  Zwischenspeicher.
* Der Dienst schickt nichts weiter. Er hat keine einzige ausgehende
  Verbindung.

---

## Grenzen

| Was | Grenze | Warum |
| --- | --- | --- |
| Ausschnitt | 12 MB | Darüber bricht der Dienst ab, **bevor** er den Speicher füllt. |
| Erkannter Text | 20 000 Zeichen je Ausschnitt | Dieselbe Zahl wie in `recognition.ts` — zwei verschiedene Zahlen wären zwei verschiedene Antworten auf dieselbe Frage. |
| Rechenzeit | 60 Sekunden | Danach wird `tesseract` beendet. |
| Sprachangabe | nur `xxx` oder `xxx+yyy` | Sie kommt aus dem Browser und landet in der Befehlszeile eines fremden Programms. Was nicht wie eine Sprachkennung aussieht, wird verworfen und durch die Vorgabe ersetzt. |

Eine **Sicherheit in Prozent** liefert der Dienst nicht. `tesseract stdout`
gibt keine mit, und eine hier hingeschriebene Zahl wäre eine Behauptung über
eine Messung, die nie stattgefunden hat. Redion zeigt dann eben keine an.

---

## Wenn es nicht geht

**„tesseract ist auf diesem Rechner nicht installiert."**
Schritt 1 oben. Danach den Dienst neu starten — er sucht das Programm beim
Aufruf, nicht beim Start.

**„OCR darf hier nur einen Dienst auf localhost verwenden."**
Die eingetragene Adresse zeigt nach aussen. Das ist Absicht und lässt sich
nicht abschalten; siehe oben.

**„OCR-Dienst meldet HTTP 422."**
Der Dienst hat gelesen und nichts gefunden. Meist zu klein, zu schief oder
zu blass. Ein grösserer Ausschnitt hilft mehr als eine andere Sprache.

**„Zeitlimit erreicht."**
Ein sehr grosses Bild mit vielen Sprachen. Kleiner ausschneiden oder
`--sprachen deu` statt `deu+eng+fra`.

**Der Dienst startet nicht, Port belegt.**
`node dienste/ocr.mts --port 9010`, und in Redion dieselbe Zahl eintragen.

---

## Einen anderen Dienst verwenden

Der Dienst ist austauschbar. Redion erwartet nur:

```txt
POST /ocr        multipart/form-data mit den Feldern
                 file      das Bild
                 language  z. B. deu+eng
                 kind      document | handwriting

Antwort 200      application/json
                 { "text": "…",            Pflicht
                   "language": "deu+eng",  freiwillig
                   "engine": "tesseract",  freiwillig
                   "version": "5.9.0",     freiwillig
                   "confidence": null }    freiwillig, 0…1 oder null
```

Wer einen eigenen Erkenner hat — ein anderes Modell, eine andere Sprache,
eine eigene Handschrift-Erkennung — kann ihn unter dieser Schnittstelle
anbieten. Die Adresse muss weiterhin auf `localhost` zeigen.

---

## Geprüft

`pruefungen/lauf/test216.mts`, acht Abschnitte. Die Prüfung stellt
`tesseract` ein eigenes Ersatzprogramm zur Seite — geprüft wird der Dienst,
nicht Tesseract, und die Prüfung läuft damit auf jedem Rechner. §6 nimmt das
Ersatzprogramm wieder weg und verlangt, dass der Dienst dann sagt, was fehlt.
