# Batterieanlagen im Schaltplan (Übungswerkzeug)

## Starten

Im Redion-Schaltplan auf **🔋 Batterien** in der Zeichenleiste drücken.
Das öffnet die eigenständige Übungsfläche `batterie-labor.html` in einem
neuen Tab. Der normale Schaltplanblock und seine bestehende Stromsimulation
werden nicht geändert. Das Labor hält die Drähte **nur während des geöffneten
Besuchs**; die Übung speichert noch keine eigenen Blöcke.

## Nachgebildete Aufgaben (eigene Grafik, keine Kopie der Arbeitsblätter)

- `Kap. 12 - Schaltungen von Spannungsquellen`, S. 12.1, Aufgabe 1 a–d:
  6 Leclanché-Zellen, je 1,5 V (aus der Abbildung), Ri=0,3 Ω,
  Q=500 mAh, Imax=1 A. Ziel: 9 / 1,5 / 4,5 / 3 V.
- `Kap. 12-Ü - Schaltungen von Spannungsquellen`, Blatt 57,
  Aufgabe 1a: 6 Leclanché-Zellen, Ri=0,5 Ω, Q=250 mAh,
  Imax=0,5 A. Ziel: 9 und 1,5 V.
- Dasselbe Blatt 57, Aufgabe 1b: 6 Bleiakku-Zellen, Ri=50 mΩ,
  Q=72 Ah, Imax=12 A, unter Annahme einer Nennspannung von 2 V/Zelle.
  Ziel: 6 und 4 V.
- Kap. 12.2, Aufgaben 2 und 3: je 12 Zellen und geforderte
  Strombelastbarkeit 12 A / 3 A. Die in den Aufgaben nicht genannten
  Innenwiderstände und Kapazitäten bleiben ausdrücklich *unbekannt*.
  Die üblichen Zell-Nennspannungen (Blei 2 V, Leclanché 1,5 V)
  sind als **Annahme** in der Oberfläche beschriftet.

Kap. 12.3–12.4 und Blatt 58 mit verschiedenartigen Batteriepaketen
sind **noch keine** interaktiven Aufgaben. Die vorhandene Version kann
nur Anlagen aus **gleichartigen Einzelzellen** berechnen; das verhindert
eine irreführende ideale Parallelschaltung verschieden grosser Spannungen.

## Bedienung

1. Aufgabe wählen. Jede Zelle hat zwei eindeutig beschriftete Anschlüsse.
2. Einen Anschluss und dann den zweiten anklicken. Drähte zwischen
   Ausgängen, Zellen und dem anderen Pol bilden gemeinsame Netze.
   Alternativ stehen zwei Tastatur-bedienbare Auswahllisten bereit.
3. Angetippte Leitungen lassen sich entfernen; die vollständige Liste
   ist aufklappbar. `Alle Leitungen entfernen` setzt die Übung zurück.
4. Eine passende Reihenzahl kann unter **Verbindung als Starthilfe**
   automatisch aufgebaut und danach frei verändert werden.
5. Das Messergebnis entsteht aus der tatsächlichen Verdrahtung.
   Ein einstellbarer Verbraucherwiderstand und ein Schalter zeigen
   zusätzlich den Laststrom (sofern Ri bekannt ist).

Eine Kreuzung zweier gezeichneter Leitungen **ohne gemeinsame
Endkontakte** ist keine elektrische Verbindung.

## Rechnung und Grenzen

Die Netzprüfung in `batterie-labor-kern.js` fasst alle verbundenen
Klemmen zunächst zu Netzen zusammen und überprüft die Polung und
gleiche Zahl von Zellstufen zwischen den Ausgängen. Eine Zelle muss
auf einem vollständigen Strompfad zwischen Ausgang − und + liegen;
Kurzschluss, offene Nebenäste und vertauschte Polarität werden abgewiesen.

Für bekannte Innenwiderstände löst die Netzprüfung das reine
Widerstandsnetz bei 1 A Teststrom. So entstehen Gesamt-Ri und der
Stromanteil jeder Zelle, auch bei verzweigten Reihen-/Parallel-Netzen.
Die Anlage erreicht maximal den kleinsten Wert von
`Zell-Imax / Zell-Stromanteil`. Für die Nutzkapazität wird ebenso
`Zell-Q / Zell-Stromanteil` bis zur ersten entladenen Zelle angesetzt.
Das ist eine **vereinfachte Unterrichtsrechnung** bei identischen,
gleich geladenen Zellen ohne Alterung und ohne variable Entladekurve.

Bei geschlossenem Versuchsschalter und vorgegebenem rein ohmschen
Verbraucherwiderstand R wird
`I = U_leerlauf / (Ri_gesamt + R)` und `U_last = I * R` gezeigt.
Ohne R ist der Lampenstrom **nicht bestimmt**. Ein fehlendes Ri
darf nicht durch die nominelle Lastspannung ersetzt werden.
Das Labor ist keine reale Akku-Bauanleitung und berechnet
keine Ausgleichsströme ungleicher Zellen.

## Prüfen

`node --test pruefungen/batterie-labor.test.cjs`

Die Tests decken 6er-Reihe, 6er-Parallel, 3s2p, 2s3p,
Bleiakku-Zellen, 12 Zellen, falsche Polung, Kurzschluss,
offenen Nebenast und ungleiche Spannungen ab.

Die neue Seite braucht unter Cloudflare die zwei Dateien im
Projektstamm. Anders als die normale Redion-Einzeldatei ist das
Labor **keine mit eingebettete Funktion**; für diesen Verteilweg
wäre eine separate Einbettung nötig.
