# Redion UI-Komponenten — Bestandsaufnahme und Plan

**Stand: 6. September 2026.** Diese Datei ist Schritt 0 des UI-Auftrags:
was gibt es schon, was fehlt wirklich, und wo widerspricht der Auftrag
einer Entscheidung, die Redion bereits getroffen hat.

Sie ist bewusst zuerst eine KARTE und noch kein Bericht über Gebautes.
Der Grund steht in §45: der teuerste wiederkehrende Fehler dieses Projekts
war, eine Schnittstelle aus dem Gedächtnis zu schreiben statt sie
nachzuschlagen. Dreissig Komponenten „einbauen", ohne vorher zu wissen,
welche davon es längst gibt, wäre derselbe Fehler in gross.

---

## Was der Auftrag selbst als Vorrang setzt

> Bei Konflikt zwischen diesem Prompt und der aktuellen `doku/ARCHITEKTUR.md`
> bzw. aktuellem `main`: **AKTUELLE REDION-ARCHITEKTUR GEWINNT.**

Und:

> Wenn Redion bereits eine Komponente besitzt, die denselben Zweck erfüllt:
> bestehende Implementierung verstehen, vergleichen, erweitern —
> **keine zweite Parallelimplementierung erzeugen.**

Beide Sätze entscheiden die meisten Punkte unten.

---

## Die Karte

**Status-Werte:** `DA` = existiert produktiv · `TEIL` = existiert, aber
unvollständig · `FEHLT` = gibt es nicht · `KONFLIKT` = widerspricht einer
getroffenen Entscheidung · `OFFEN` = noch nicht geprüft

| # | Komponente | Status | Wo es in Redion steht | Bemerkung |
|---|---|---|---|---|
| A | Baumansicht | **TEIL** | `src/schale/aufbau/seitenleiste.ts` | Der Baum existiert samt Auf-/Zuklappen, je Abschnitt gemerkt. Was fehlt, ist die Herauslösung als wiederverwendbare Komponente und die Tastatursteuerung nach ARIA-Muster. |
| B | Grosser Datei-Browser | **FEHLT** | — | `src/bereiche/dateien/` hat Ablage, Import, Ausgabe, Erkennung — aber keine Browser-Ansicht. Echte Lücke. |
| C | Kompakte Ordnerkarte | **FEHLT** | — | — |
| D | Segmented Control | **FEHLT** | — | Nirgends `role="radiogroup"` oder ein Äquivalent. **Bester erster Baustein**: nützlich, kollidiert mit nichts. |
| E | Quick-Action-Plus | **TEIL** | `App.erstellenBlatt`, `Menue.menu` | Ein „Neu"-Weg existiert; ein Menüsystem auch. Zu prüfen, ob eine eigene Komponente mehr ist als eine zweite Liste (§8). |
| F | Share-/Export-Radialmenü | **TEIL** | 92 Fundstellen zu „teilen" | Teilen und Export gibt es an vielen Stellen. Ein Radialmenü wäre eine neue Darstellung, keine neue Funktion. |
| G | AI Prompt Composer | **DA** | `index.html:388–412` | **Existiert vollständig** — `＋` Anhang, Eingabefeld, `↑` Senden, dazu zwölf Quick-Actions und eine Werkzeugzeile (Quellen, Fähigkeiten, Modus, Diktat). Genau der Aufbau, den der Auftrag beschreibt. §19 sagt: nicht zweitbauen. |
| H | Generate → Generating | **FEHLT** | — | Die Aktionen existieren (Karteikarten, Datenbank bauen, Seite aufbauen); ein einheitlicher Zustandsknopf dafür nicht. Echte Lücke. |
| I | KI-Aktivitätsanzeige | **DA** | `src/schale/ueberlagerung/orb.ts` (E403) | Die Denkkugel erfüllt bereits, was der Auftrag verlangt: hört auf, wenn niemand hinsieht; steht still bei `prefers-reduced-motion`; trägt ihren Zustand **als Text**, nicht nur als Bewegung. |
| J | Circuit AI | **FEHLT** | — | Spezialkomponente für Elektro-Analyse. |
| K | KI-Toggle | **TEIL** | KI-Quellen in den Einstellungen | Schalter existieren; die Darstellung nicht. |
| L | Orb Option Row | **TEIL** | `einstellungen/ansicht/seite.ts` (`schalter(…)`) | Titel + Untertitel + Schalter gibt es als Zeilenform. |
| M | Upload-Status | **TEIL** | `dateien/ablage.ts`: `teile`, `angekommen`, `zustand` | Die **Daten** sind da (`'wartet' \| 'laeuft' \| 'fertig'`, Stückzähler) — die Anzeige mit Pille und Balken fehlt. Gute Lücke: echter State ohne Fake-Prozente. |
| N | Download → Open | **FEHLT** | — | — |
| O | Printer Process | **TEIL** | `wissen/werkzeuge.ts:2158` (`print()`) | Drucken existiert; die Zustandsanzeige nicht. |
| P | Server/Data Sync | **TEIL** | `wolkeStand`, `abgleich/maschine.ts` | Der Zustand existiert. Siehe **L132** — der Abgleich meldet vier verschiedene Gründe als einen. |
| Q | Standardspinner | **KONFLIKT** | siehe unten | **E46 hat gegen Kreisel entschieden.** |
| R | Liquid/Progress | **FEHLT** | — | — |
| S | Gear-Loader | **FEHLT** | — | — |
| T | Pixel-Loader | **FEHLT** | — | — |
| U | Orbit/Black-Hole | **FEHLT** | — | — |
| V | Candlestick-Analyseindikator | **FEHLT** | — | Die Umbenennung zu „Analyseindikator" im Auftrag ist richtig und passt zu §38. |
| W | Aurora/Hero-Start | **FEHLT** | — | — |
| X | Glass Workflow Cards | **FEHLT** | — | — |
| Y | Template-Karussell | **FEHLT** | — | Vorlagen gibt es (`Galerie`, `Register.vorlagen`), ein Karussell nicht. |
| Z | Gesture Hand | **FEHLT** | — | Nur Onboarding — und der Rundgang (E55) ist der Ort dafür. |
| AA | Device Controller | **FEHLT** | — | Elektro. |
| AB | Logout-Button | **TEIL** | Einstellungen → Konto | Der Weg existiert. |
| AC | Gemini-Icon | **OFFEN** | `src/register/symbole.ts` | Anbieter-Logos gehören getrennt behandelt — die Regel des Auftrags ist richtig. |
| AD | Google-Meet-Icon | **OFFEN** | — | Nur bei echter Integration. |

---

## Drei Konflikte, die Redur entscheiden muss

### 1. Der Standardspinner widerspricht E46

Der Auftrag sagt: *„STANDARD: Neutraler 10-Segment-Spinner"* und *„Es darf
nur EIN neutraler Standardspinner produktiv bleiben."*

**E46 hat das Gegenteil entschieden** — aus Redurs eigener Vorgabe §23:

> „Use skeletons, not random spinners everywhere."
>
> Der Grund ist nicht Mode. Ein Kreisel sagt „warte". Ein Skelett sagt
> „hier kommen sechs Zeilen mit einem Symbol links und einem Datum rechts" —
> man weiss, was gleich dasteht, das Auge hat schon einen Platz dafür, und
> wenn der Inhalt kommt, springt nichts.

Die Skelette sind gebaut (`werkzeuge.css`, `.sk-*`), begründet bis in die
Strichbreiten, und von `test126 §5` mit Gegenprobe gehalten. Ein Kreisel
existiert in Redion **gar nicht** — gemessen, nicht vermutet.

**Vorschlag:** E46 bleibt. Skelett dort, wo die Form vorhersagbar ist;
ein Kreisel nur für den Fall, den ein Skelett nicht abdeckt — ein Knopf,
der arbeitet. Das ist keine Ablehnung des Auftrags, sondern seine eigene
Regel („aktuelle Architektur gewinnt") angewandt.

### 2. „System | Hell | Dunkel" widerspricht den acht Schemata

Der Auftrag will das Segmented Control als Themensteuerung mit drei
Werten. Redion hat **acht Farbschemata** plus frei wählbare Akzentfarbe
(`einstellungen/ansicht/aussehen.ts:50`), jedes mit eigenem Hell- und
Dunkel-Akzent — E-Eintrag dort begründet, warum ein Wert für beide nicht
reicht.

Drei Werte wären ein Rückbau von acht auf drei.

**Vorschlag:** Das Segmented Control wird gebaut (es fehlt wirklich), aber
für Fälle mit 2–4 exklusiven Optionen — Liste/Raster, Ansichtsmodi,
Elektro-Modi. Die Schema-Wahl bleibt, wie sie ist.

Der „Sun/Moon-Toggle", der laut Auftrag in die Reserve soll, **existiert
nicht** — es gibt nichts zu verschieben.

### 3. Der Uiverse-Code liegt mir nicht vor

Abschnitt 3 und 4 verlangen, zwölf ausgeschiedene Komponenten
*vollständig mit Code* in die Reserve zu legen: 4-Circle, 6-Circle,
aro-15, Jimu, Gradient-7, Geometric, 8-Side-3D, Gooey, Runner, Billiard,
Sun/Moon, Sparkle-Generate.

**Diesen Code habe ich nicht.** Er steht nicht im Repository, und er war
nicht Teil des Auftrags. Ich kann ihn auch nicht rekonstruieren — eine
nachgebaute Fassung wäre nicht der Code, den Redur bewertet hat, sondern
eine Behauptung darüber, und genau davor warnt §55.2.

**Was ich ohne ihn bauen kann:** das Reserve-Verzeichnis, sein README,
das Datenmodell und die Galerie — als leeres, funktionierendes Regal.
Sobald Redur die HTML/CSS-Schnipsel liefert (Datei, Zip oder eingefügt),
wandern sie hinein.

---

## Was zuerst gebaut wird

Nach dem Auftrag (Phase 1) und dieser Karte:

1. **Segmented Control** — fehlt wirklich, kollidiert mit nichts, wird
   von mehreren späteren Punkten gebraucht.
2. **Upload-Status** — die Daten existieren bereits (`zustand`, `teile`,
   `angekommen`); es fehlt nur die Anzeige. Kein Fake-Fortschritt nötig.
3. **Generate → Generating** — die KI-Aktionen existieren, der
   Zustandsknopf fehlt.
4. **Baumansicht** herauslösen — der grösste Punkt, und der mit dem
   grössten Risiko: die Seitenleiste ist die meistbenutzte Fläche der App.

Nicht gebaut wird, was schon da ist (G, I) oder was einer getroffenen
Entscheidung widerspricht (Q).

---

## Namensraum

Der Auftrag schlägt `.redion-ui-*` vor. Redion arbeitet durchgängig mit
Präfixen von zwei bis vier Buchstaben (163 Stück, `doku/CSS-NAMENSRAEUME.md`).
Ein siebenstelliges `redion-` wäre in dieser Umgebung ein Fremdkörper —
und der Zweck der Regel ist Kapselung, nicht Länge.

**Vorschlag:** Neue gemeinsame UI-Bauteile bekommen `ru-` („Redion UI"),
eingetragen im Verzeichnis wie jeder andere Namensraum. Das erfüllt die
Regel des Auftrags („keine ungekapselten globalen Klassennamen") und
bleibt bei Redions Bauart.

`.redion-reserve-*` bleibt für die Reserve — sie ist eine eigene Seite
ausserhalb der App, dort stört die Länge nicht.
