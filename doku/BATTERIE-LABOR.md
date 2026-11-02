# Kapitel 12: Batterien direkt im Redion-Schaltplan üben

## Bedienung

Redion öffnen → Schaltplan → **✦ Bereiche → Batterielabor**.
Eine Aufgabe auswählen und **Aufgabe einsetzen** anklicken. Alle Teile
stehen auf der **gewöhnlichen Schaltplan-Zeichenfläche**, nicht in
einem extra Editor. Dort können sie mit den normalen Werkzeugen
verschoben, gedreht und mit **Leitung ziehen** (Taste 2) verbunden werden.

1. **Reihe:** Pluspol der einen Batterie an Minuspol der nächsten.
   **Parallel:** Alle Pluspole und alle Minuspole jeweils zusammen.
2. Ausgewählte Zelle anklicken; **U, Ri, Imax, Q** bearbeiten.
   Fehlende Nennwerte aus Blatt 58 selbst eintragen.
3. Bei Aufgaben mit zusätzlichen Akkus das Feld **Weiteren Akku
   hinzufügen** verwenden (bis zu 64 Akkus).
4. Redion prüft die Verdrahtung und zeigt **U, Ri, Imax, Q** sowie
   Kurzschlüsse, falsche Polarität und offene Stromzweige.
5. Im unteren Fach die Last (R in Ω oder 2-Ω-Widerstandsbeispiele)
   wählen und **Strom einschalten**. Die Lampe leuchtet bei Strom;
   die Anzeige enthält Laststrom, Lastspannung, Leistung und
   Nennstrom-Warnung.
6. **Musterverdrahtung zeigen** zeichnet eine funktionierende Lösung
   mit echten Redion-Leitungen. Auch erforderliche zusätzliche Akkus
   und fehlende Nenndaten werden beim Muster ergänzt. Mit
   Rückgängig kann die eigene Lösung wiederhergestellt werden.
7. **Freies Üben** erlaubt beliebige Reihen-/Parallelschaltungen
   ohne feste Zielspannung.

Ein bestehender Plan wird vor dem Ersetzen nicht ohne Bestätigung
überschrieben.

## Aufgaben (beide vom Nutzer bereitgestellten PDFs)

| Abschnitt | Aufgabenziele |
|---|---|
| Kapitel 12.1, Aufgabe 1a–d | 9 V, 1,5 V, 4,5 V, 3 V; sechs Leclanché-Zellen (500 mAh, 0,3 Ω, 1 A) |
| Kapitel 12.2, Aufgabe 2 | Zwölf Bleiakku-Zellen zu 3 A; 12 A erreichen; im Blatt vier 2-Ω-Widerstände |
| Kapitel 12.2, Aufgabe 3 | Zwölf Leclanché-Zellen zu 1 A; 3 A erreichen; im Blatt vier 2-Ω-Widerstände |
| Kapitel 12.3, Aufgabe 4 | Vier Abgänge: 4 V / 50 A, 6 V / 40 A, 8 V / 20 A, 12 V / 10 A; fehlende Bleiakkus ergänzen |
| Kapitel 12.3, Aufgabe 5 | 24 V / 12 A aus 2 × 12 V / 6 A und 2 × 6 V / 12 A |
| Kapitel 12.4, Aufgabe 6a | 24 V / 6 A aus 12-V- und 6-V-Akkupaketen |
| Kapitel 12.4, Aufgabe 6b | 12 V / 6 A aus 2-V-, 4-V- und 8-V-Akkupaketen |
| Kapitel 12.4, Aufgabe 6c | 28 V / 10 A, zusätzlicher 8-V-/6-A-Akku nötig |
| Blatt 57, Aufgabe 1a | 9 V / 1,5 V aus je sechs Leclanché-Zellen; 0,5 A, 0,5 Ω, 250 mAh |
| Blatt 57, Aufgabe 1b | 6 V / 4 V aus je sechs Bleiakku-Zellen; 12 A, 50 mΩ, 72 Ah |
| Blatt 58, Aufgabe 2 oben | 72 V / 12 A; fehlende U- und I-Angaben |
| Blatt 58, Aufgabe 2 Mitte | 48 V / 12 A; zusätzlicher 24-V-/8-A-Akku |
| Blatt 58, Aufgabe 2 unten | 36 V / 18 A; fehlender Stromwert, 12-V-Akkus parallel |

Die Kapitel-12.2-Blätter geben keine ausdrückliche *Zielspannung* vor.
Die in Redion gewählten 6 V stellen **eine abgeleitete mögliche
Musterlösung** dar. 2 V pro Bleiakku-Zelle und 1,5 V pro
Leclanché-Zelle sind beim jeweiligen Übungsdatensatz als Annahmen
gekennzeichnet. Die Muster sind elektrisch passende
Verdrahtungen, nicht identische Kopien der Papierzeichnungen.

## Schulmodell

- **Reihe:** Spannungen addieren, der schwächste Stromgrenzwert
  begrenzt den gemeinsamen Strom, Innenwiderstände addieren.
- **Parallel:** Nur gleiche *Gesamtzweigspannungen* sind für das
  vereinfachte Modell zulässig. Nennströme addieren sich idealisiert.
  Unterschiedliche Zweigspannungen melden eine Ausgleichsstrom-Gefahr.
- **Gemischte Pakete:** Verschiedene Akkuspannungen in einer
  *Reihenschaltung* werden addiert. Nennströme ohne bekannte
  Innenwiderstände werden nach der Schul-Engpassregel bestimmt,
  nicht als gemessene physikalische Stromaufteilung ausgegeben.
- **Kapazität Q:** Wird nur angezeigt, wenn die erforderlichen
  Nennkapazitäten vorliegen. Andere fehlende Nenndaten werden
  nicht geschätzt.
- **Last:** Bei bekanntem Ri gilt I = U_leerlauf / (R_last + Ri).
  Fehlt Ri, verwendet die Lampe die ausdrücklich benannte ideale
  Näherung I = U_leerlauf / R_last. Eine echte Glühlampe ist nicht
  ohmsch konstant. Der Schalter im Fach ist eine Lernsimulation.
- **Vier Ausgänge:** In Kapitel 12.3/4 wird jeder Ausgang
  unabhängig geprüft; gleichzeitige Volllast aller Abgänge
  ist damit nicht nachgewiesen.

Die bisherige **▶ Strom**-Simulation von Redion bleibt für
Batterieübungen gesperrt, weil sie ideale Spannungsquellen voraussetzt.
Stattdessen liest das Batterielabor die **wirkliche Redion-Netzliste**.
Bei normalen Schaltplänen wird die bisherige Simulation nicht verändert.

## Technik und Prüfungen

- Batterie-Rechnung: batterie-labor-kern.js
- Aufgaben, Bauteile, echte Musterleitungen: batterie-aufgaben.js
- Speicherformat mit bis zu 64 Zellen und Mehrfachabgängen:
  src/bereiche/bloecke/arten/schaltplan.ts und quell/.../schaltplan.js
- Darstellung: quell/schale/stil/schaltatelier.css
- Tests: pruefungen/batterie-labor.test.cjs und
  pruefungen/batterie-schaltplan.test.cjs

Kern-/Netztests mit Node.js ausführen:

    node --test pruefungen/batterie-labor.test.cjs pruefungen/batterie-schaltplan.test.cjs

Danach optional Projektprüfungen:

    npm run bauen:ts && npm run typecheck

Eine zusätzliche Browserprobe mit Touch/Maus, Speichern und
Wiederöffnen ist weiterhin erforderlich. Es werden keine
hochgeladenen PDF-Seiten in das Repository kopiert.
