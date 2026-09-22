/* ══ DER INHALT DES NIN-TRAINERS — Regeln der Technik, Kapitel 5, 6, 7 (E679) ══
   Redur, 22. September 2026: „erstelle mir direkt lerne quiz im redion für
   kapitel 5,6,7 und bei der regel der technik und alles beschriftet mit
   nummern, seiten im nin compact, wie im test und noch multiple choice
   fragen, schreiben usw alles".

   Die Quelle sind die drei Kapitelblätter von Heinz Boxler (NIN 2020:
   5.1 Aufteilung in Stromkreise, 6.1 Stromversorgung für Sicherheitszwecke,
   7.1–7.6 Äussere Einflüsse), die NIN Compact 2024 (Seitenzahlen = gedruckte
   Zahl unten auf der Seite), die Antworten des Lehrers von den Folien und
   der Wortlaut der NEV (Totalrevision 2015). Wo Blatt und Buch sich
   widersprechen, steht beides (Prüffinger 12 / 12,5 mm; Kanal EI60 / EI 30).

   Die 34 PRÜFUNGSFRAGEN sind die zwei Probeprüfungen, die nach dem Muster
   der echten Tests des Lehrers gebaut wurden (Prüfung 200329 und 260602:
   20 Minuten, 22–27 Punkte, Blattreihenfolge, „Nennen Sie zwei", Ankreuzen
   mit vier Kästchen). Jede trägt Nummer und Punkte wie auf dem Blatt.

   Drei Aufgabenformen wie beim Staatskunde-Kapitel: `mc`, `schreiben`,
   `luecke`. Jede Aufgabe nennt ihre Seite in der NIN Compact. */

const NinQuiz = (() => {
  type Mc = { id: string; art: 'mc'; thema: string; quelle: string; pruefung?: true; nummer?: string;
              frage: string; antworten: string[]; richtig: number[] };
  type Schreiben = { id: string; art: 'schreiben'; thema: string; quelle: string; pruefung?: true; nummer?: string;
                     frage: string; loesung: string[]; hinweis?: string };
  type Luecke = { id: string; art: 'luecke'; thema: string; quelle: string; pruefung?: true; nummer?: string;
                  frage: string; loesung: string[] };
  type Aufgabe = Mc | Schreiben | Luecke;

  const KAPITEL = 'Regeln der Technik — NIN Kap. 5, 6, 7';

  const THEMEN = [
    { id: 'stromkreise', name: 'Aufteilung in Stromkreise · Blatt 5.1', seite: 'S. 36–37, 100–101' },
    { id: 'sicherheit', name: 'Stromversorgung für Sicherheitszwecke · Blatt 6.1', seite: 'S. 104–105, 231–236' },
    { id: 'raumarten', name: 'Raumarten · Blatt 7.1', seite: 'S. 84–95, 309, 317' },
    { id: 'ip', name: 'Schutzart IP · Blatt 7.2', seite: 'S. 51, 175' },
    { id: 'symbole', name: 'Symbole für Betriebsmittel · Blatt 7.3', seite: 'S. 52' },
    { id: 'zugang', name: 'Zugang zu gefährlichen Teilen · Blatt 7.4', seite: 'S. 176' },
    { id: 'einfluesse', name: 'Äussere Einflüsse · Blatt 7.5', seite: 'S. 169, 174' },
    { id: 'nev', name: 'Niederspannungserzeugnisse NEV · Blatt 7.6', seite: 'S. 71 · NEV' },
  ] as const;

  const P1 = 'Probeprüfung 1';
  const P2 = 'Probeprüfung 2 · Nr. 260923';

  const AUFGABEN: Aufgabe[] = [
    /* ── PROBEPRÜFUNG 1 — 17 Fragen, 27 Punkte, wie Prüfung 260602 ─────── */
    { id: 'p1-1', art: 'schreiben', thema: 'stromkreise', quelle: 'NIN Compact S. 100', pruefung: true, nummer: P1 + ' · 1 · 1,5 Pt.',
      frage: 'Jede Anlage muss in mehrere Stromkreise aufgeteilt werden. Auf welche Teile sollen Störungen und Schäden begrenzt bleiben? Nennen Sie drei.',
      loesung: ['selbstständige Anlageteile', 'einzelne Gebäudekörper', 'einzelne Stockwerke', 'einzelne Räume'] },
    { id: 'p1-2', art: 'schreiben', thema: 'stromkreise', quelle: 'NIN Compact S. 100', pruefung: true, nummer: P1 + ' · 2 · 2 Pt.',
      frage: 'Nennen Sie zwei weitere Gründe, die für eine sinnvolle Unterteilung der Stromkreise sprechen.',
      loesung: ['Vermeidung von Gefahren', 'Begrenzung der Folgen von Fehlern', 'Erleichterung der Prüfung und Wartung',
                'Vermeidung sekundärer Gefahren, z. B. Ausfall des Beleuchtungsstromkreises', 'weniger unerwünschte Auslösungen von RCD', 'Minderung elektromagnetischer Störungen'] },
    { id: 'p1-3', art: 'luecke', thema: 'stromkreise', quelle: 'NIN Compact S. 36', pruefung: true, nummer: P1 + ' · 3 · 1 Pt.',
      frage: 'Für Verbrauchsmittel mit einer Leistung von mehr als ___ kW sind separate Überstrom-Schutzeinrichtungen vorzusehen.',
      loesung: ['2', '2 kW', 'zwei'] },
    { id: 'p1-4', art: 'schreiben', thema: 'stromkreise', quelle: 'NIN Compact S. 36–37, 101', pruefung: true, nummer: P1 + ' · 4 · 2 Pt.',
      frage: 'Nennen Sie zwei Verbraucher in Wohnungen, für die separate Überstromunterbrecher vorzusehen sind.',
      loesung: ['Kochherd', 'Waschmaschine', 'Wassererwärmer', 'Wärmepumpe', 'Geschirrspüler'] },
    { id: 'p1-5', art: 'mc', thema: 'stromkreise', quelle: 'NIN Compact S. 36–37', pruefung: true, nummer: P1 + ' · 5 · 1,5 Pt.',
      frage: 'Auf wie viele Stromkreise soll die Beleuchtung aufgeteilt werden?',
      antworten: ['in Wohnungen auf zwei oder mehr', 'in Wohnungen auf genau einen', 'in Industrie und Gewerbe auf mehrere', 'in Industrie und Gewerbe auf einen pro Raum'],
      richtig: [0, 2] },
    { id: 'p1-6', art: 'schreiben', thema: 'sicherheit', quelle: 'NIN Compact S. 104', pruefung: true, nummer: P1 + ' · 6 · 1,5 Pt.',
      frage: 'Welchem Zweck dient eine Stromversorgung für Sicherheitszwecke?',
      loesung: ['Sie soll eine Gefährdung von Personen in Situationen ausschliessen, in denen die normale Stromversorgung ausfällt.'] },
    { id: 'p1-7', art: 'schreiben', thema: 'sicherheit', quelle: 'NIN Compact S. 105', pruefung: true, nummer: P1 + ' · 7 · 2 Pt.',
      frage: 'Nennen Sie zwei Bauten, in denen eine Sicherheitsbeleuchtung und die Kennzeichnung von Fluchtwegen erforderlich ist.',
      loesung: ['Kinos und Theater', 'Sporthallen', 'Hallenbäder', 'Verkaufsgeschäfte über 1200 m² oder über 300 Personen', 'Restaurants und Hotels',
                'Spitäler', 'Heime', 'Hochhäuser', 'Tiefgaragen und Parkhäuser für mehr als 20 Fahrzeuge'] },
    { id: 'p1-8', art: 'mc', thema: 'sicherheit', quelle: 'NIN Compact S. 232', pruefung: true, nummer: P1 + ' · 8 · 2 Pt.',
      frage: 'Welche Stromquellen sind für Sicherheitszwecke zulässig?',
      antworten: ['Akkumulatoren', 'Primärelemente (nicht wiederaufladbare Batterien)', 'Generatoren, unabhängig von der allgemeinen Stromversorgung betrieben', 'eine separate Einspeisung, die von der normalen Einspeisung tatsächlich unabhängig ist'],
      richtig: [0, 2, 3] },
    { id: 'p1-9', art: 'luecke', thema: 'sicherheit', quelle: 'NIN Compact S. 231', pruefung: true, nummer: P1 + ' · 9 · 1 Pt.',
      frage: 'Für die Sicherheitsbeleuchtung und das Beleuchten und Kennzeichnen von Fluchtwegen ist gemäss VKF eine minimale Betriebsdauer von ___ min notwendig.',
      loesung: ['60', 'sechzig'] },
    { id: 'p1-10', art: 'schreiben', thema: 'sicherheit', quelle: 'NIN Compact S. 232–233', pruefung: true, nummer: P1 + ' · 10 · 2 Pt.',
      frage: 'Wie müssen Kabel ohne Isolationserhalt, z. B. Tdc-Kabel, für Sicherheitszwecke verlegt werden?',
      loesung: ['unter Putz in Beton oder Mauerwerk', 'oder örtlich getrennt in einem Kanal mit Feuerwiderstand von mindestens EI 30'],
      hinweis: 'Das Blatt (NIN 2020) sagt beim Kanal EI60, die NIN Compact 2024 sagt EI 30. EI 60 gilt auf S. 231 für die Abtrennung der Schaltgeräte.' },
    { id: 'p1-11', art: 'schreiben', thema: 'sicherheit', quelle: 'NIN Compact S. 233, S. 56', pruefung: true, nummer: P1 + ' · 11 · 2 Pt.',
      frage: 'Nennen Sie zwei besondere Eigenschaften, die Sicherheitskabel auszeichnen.',
      loesung: ['halogenfrei', 'keine korrosiven oder giftigen Brandgase', 'flammwidrig, selbstverlöschend', 'geringe Rauchentwicklung', 'Isolationserhalt FE', 'Funktionserhalt E (E30 / E60 / E90)'] },
    { id: 'p1-12', art: 'schreiben', thema: 'raumarten', quelle: 'NIN Compact S. 87, S. 91', pruefung: true, nummer: P1 + ' · 12 · 2 Pt.',
      frage: 'Nennen Sie je ein Beispiel: a) feuergefährdeter Raum mit brennbarem Staub, b) Raum mit nichtbrennbarem Staub.',
      loesung: ['a) Schreinerei, Sägerei, Heuboden', 'b) Steinhauerei, Giesserei, Zementfabrik'] },
    { id: 'p1-13', art: 'mc', thema: 'raumarten', quelle: 'NIN Compact S. 84', pruefung: true, nummer: P1 + ' · 13 · 1 Pt.',
      frage: 'Welche Räume gelten als Bauten mit starker Personenbelegung? Kreuzen Sie die richtige Lösung an.',
      antworten: ['Räume für mehr als 100 Personen', 'Räume für mehr als 300 Personen', 'Räume für mehr als 1000 Personen', 'alle Verkaufsräume'],
      richtig: [1] },
    { id: 'p1-14', art: 'schreiben', thema: 'ip', quelle: 'NIN Compact S. 51, 175', pruefung: true, nummer: P1 + ' · 14 · 2,5 Pt.',
      frage: 'Was bedeutet IP 54? Geben Sie die Bedeutung der Abkürzung IP und der beiden Ziffern an.',
      loesung: ['IP = International Protection (Ingress Protection)', '5 = staubgeschützt (Berührungs- und Fremdkörperschutz)', '4 = Spritzwasser aus allen Richtungen (Wasserschutz)'] },
    { id: 'p1-15', art: 'schreiben', thema: 'zugang', quelle: 'NIN Compact S. 176', pruefung: true, nummer: P1 + ' · 15 · 1,5 Pt.',
      frage: 'Was bedeuten die Zusatzbuchstaben B und D im IP-Code, und mit welcher Prüfsonde wird geprüft?',
      loesung: ['B = geschützt gegen Zugang mit dem Finger: Prüffinger Ø 12 mm (Buch 12,5 mm), 80 mm lang', 'D = geschützt gegen Zugang mit Draht: Prüfdraht Ø 1 mm, 100 mm lang'] },
    { id: 'p1-16', art: 'schreiben', thema: 'einfluesse', quelle: 'NIN Compact S. 174', pruefung: true, nummer: P1 + ' · 16 · 2 Pt.',
      frage: 'Was bedeuten folgende Angaben? AG1 · BE3 · CA2 · AD4',
      loesung: ['AG1 = niedrige mechanische Beanspruchung, z. B. Haushalt', 'BE3 = explosionsgefährdete Zonen, z. B. Treibstofflager', 'CA2 = brennbares Bauwerk, Holzhaus', 'AD4 = Spritzwasser, Tropfen aus beliebiger Richtung'] },
    { id: 'p1-17', art: 'mc', thema: 'nev', quelle: 'NEV Art. 8 · NIN Compact S. 71', pruefung: true, nummer: P1 + ' · 17 · 1,5 Pt.',
      frage: 'Welche Angaben muss eine Konformitätserklärung nach NEV Art. 8 enthalten?',
      antworten: ['Name und Adresse des Herstellers', 'Verkaufspreis des Erzeugnisses', 'angewandte Vorschriften und Normen', 'Name der Person, die unterzeichnet'],
      richtig: [0, 2, 3] },

    /* ── PROBEPRÜFUNG 2 · Nr. 260923 — 17 Fragen, 27 Punkte ─────────────── */
    { id: 'p2-1', art: 'schreiben', thema: 'stromkreise', quelle: 'NIN Compact S. 100', pruefung: true, nummer: P2 + ' · 1 · 1,5 Pt.',
      frage: 'Installationen sind so zu unterteilen, dass Störungen und Schäden begrenzt bleiben auf: (drei nennen)',
      loesung: ['selbstständige Anlageteile', 'einzelne Gebäudekörper', 'einzelne Stockwerke', 'einzelne Räume'] },
    { id: 'p2-2', art: 'schreiben', thema: 'stromkreise', quelle: 'NIN Compact S. 36–37', pruefung: true, nummer: P2 + ' · 2 · 2 Pt.',
      frage: 'Ab welcher Leistung sollten für einzelne Verbraucher separate Überstromunterbrecher vorgesehen werden? Nennen Sie zwei solche Verbraucher, die in Wohnungen anzutreffen sind.',
      loesung: ['mehr als 2 kW', 'Kochherd, Waschmaschine, Wassererwärmer, Wärmepumpe, Geschirrspüler'] },
    { id: 'p2-3', art: 'mc', thema: 'stromkreise', quelle: 'NIN Compact S. 36, 101', pruefung: true, nummer: P2 + ' · 3 · 1,5 Pt.',
      frage: 'Eine 3½-Zimmer-Wohnung hat folgende Geräte. Welche erhalten einen eigenen Überstromunterbrecher?',
      antworten: ['Kochherd mit Backofen 3 × 400/230 V, 10 kW', 'Geschirrspüler 230 V, 2,2 kW', 'Wäschetrockner 230 V, 1,2 kW', 'Waschmaschine 230 V, 2,3 kW'],
      richtig: [0, 1, 3] },
    { id: 'p2-4', art: 'schreiben', thema: 'sicherheit', quelle: 'NIN Compact S. 104, 231', pruefung: true, nummer: P2 + ' · 4 · 2 Pt.',
      frage: 'Die Stromversorgung für Sicherheitszwecke ermöglicht den Weiterbetrieb von Einrichtungen, die für Personen lebenswichtig sind. Nennen Sie zwei Beispiele.',
      loesung: ['Brandmeldeanlagen', 'Feuerwehraufzüge', 'Löschwasser- und Sprinklerpumpen', 'Rauch- und Wärmeabzugsanlagen', 'Notbeleuchtung', 'wichtige medizinische Systeme'] },
    { id: 'p2-5', art: 'schreiben', thema: 'sicherheit', quelle: 'NIN Compact S. 231', pruefung: true, nummer: P2 + ' · 5 · 1,5 Pt.',
      frage: 'Was bedeutet die Bezeichnung EI 60?',
      loesung: ['E = Raumabschluss', 'I = wärmeisolierend', '60 = 60 Minuten Feuerwiderstandsdauer'] },
    { id: 'p2-6', art: 'mc', thema: 'sicherheit', quelle: 'NIN Compact S. 231', pruefung: true, nummer: P2 + ' · 6 · 1 Pt.',
      frage: 'Welche minimale Betriebszeit ist für die Beleuchtung und Kennzeichnung von Fluchtwegen gemäss VKF-Brandschutzrichtlinie notwendig? Kreuzen Sie die richtige Lösung an.',
      antworten: ['30 min', '60 min', '90 min', '120 min'],
      richtig: [1] },
    { id: 'p2-7', art: 'mc', thema: 'sicherheit', quelle: 'NIN Compact S. 232', pruefung: true, nummer: P2 + ' · 7 · 2 Pt.',
      frage: 'Wie müssen Stromkreise für Sicherheitszwecke verlegt werden?',
      antworten: ['getrennte Trassenführung', 'zusammen mit den allgemeinen Stromkreisen', 'Trennung mit feuerbeständigem Material', 'geschützt durch eine Fehlerstrom-Schutzeinrichtung RCD'],
      richtig: [0, 2] },
    { id: 'p2-8', art: 'schreiben', thema: 'sicherheit', quelle: 'NIN Compact S. 234', pruefung: true, nummer: P2 + ' · 8 · 1,5 Pt.',
      frage: 'Man unterscheidet bei der Notbeleuchtung zwei Arten. Welche? Nennen Sie dazu eine Unterart der Sicherheitsbeleuchtung.',
      loesung: ['Sicherheitsbeleuchtung und Ersatzbeleuchtung', 'Unterarten: Sicherheitsbeleuchtung für Rettungswege, Antipanikbeleuchtung (Flächenbeleuchtung), Sicherheitsbeleuchtung für gefährliche Arbeitsplätze'] },
    { id: 'p2-9', art: 'schreiben', thema: 'raumarten', quelle: 'NIN Compact S. 317 · Blatt 7.1', pruefung: true, nummer: P2 + ' · 9 · 2 Pt.',
      frage: 'Was ist ein explosionsgefährdeter Bereich? Nennen Sie ein Beispiel.',
      loesung: ['Bereich, in dem die Atmosphäre explosionsfähig werden könnte', 'Beispiel: Treibstofflager, Spritzkabine, Tankstelle, Getreidesilo'] },
    { id: 'p2-10', art: 'schreiben', thema: 'raumarten', quelle: 'NIN Compact S. 86, 309', pruefung: true, nummer: P2 + ' · 10 · 1,5 Pt.',
      frage: 'Was sind elektrische Betriebsräume, und wer hat Zugang? Nennen Sie ein Beispiel.',
      loesung: ['Räume, die vorwiegend elektrische Einrichtungen enthalten und nur für elektrotechnisch unterwiesene Personen (BA4) und Elektrofachkräfte (BA5) zugänglich sind', 'Beispiel: Trafostation, Raum für Schaltgerätekombinationen'] },
    { id: 'p2-11', art: 'mc', thema: 'raumarten', quelle: 'Blatt 7.1', pruefung: true, nummer: P2 + ' · 11 · 1,5 Pt.',
      frage: 'Welche der folgenden Räume sind medizinisch genutzte Räume?',
      antworten: ['Zahnarztpraxis', 'Apotheke, Verkaufsraum', 'Physiotherapie', 'Operationssaal'],
      richtig: [0, 2, 3] },
    { id: 'p2-12', art: 'schreiben', thema: 'ip', quelle: 'NIN Compact S. 51', pruefung: true, nummer: P2 + ' · 12 · 1,5 Pt.',
      frage: 'Schutzart nach IP-System. Ergänzen Sie: Werden für einen Schutzgrad keine bestimmten Anforderungen gestellt, steht anstelle der Ziffer … IP 2X: Schutz gegen Fremdkörper grösser als … mm. IP X5: Schutz gegen …',
      loesung: ['X', '12 mm (Tabelle S. 51; Bild S. 175: 12,5 mm)', 'Strahlwasser'] },
    { id: 'p2-13', art: 'schreiben', thema: 'symbole', quelle: 'NIN Compact S. 52 · Blatt 7.3', pruefung: true, nummer: P2 + ' · 13 · 1,5 Pt.',
      frage: 'Betriebsmittel werden mit Symbolen gekennzeichnet. Tropfen = ? (IP), Raute mit Gitter = ? (IP), Sonne oder T = wärmebeständig ab welcher Umgebungstemperatur?',
      loesung: ['Tropfen = tropfwassersicher, IP X1', 'Raute mit Gitter = staubdicht, IP 6X', 'wärmebeständig: Umgebungstemperatur über 40 °C'] },
    { id: 'p2-14', art: 'schreiben', thema: 'zugang', quelle: 'NIN Compact S. 176 · Blatt 7.4', pruefung: true, nummer: P2 + ' · 14 · 1,5 Pt.',
      frage: 'Mit welcher Sonde wird der Schutz gegen Zugang mit dem Handrücken geprüft? Geben Sie Durchmesser und IP-Code an.',
      loesung: ['Prüfkugel Ø 50 mm', 'IP 1X bzw. IP 0XA', 'Handgriff aus Isoliermaterial Ø 10 mm, 100 mm lang'] },
    { id: 'p2-15', art: 'schreiben', thema: 'einfluesse', quelle: 'NIN Compact S. 174 · Blatt 7.5', pruefung: true, nummer: P2 + ' · 15 · 2 Pt.',
      frage: 'Die äusseren Einflüsse auf Räume werden durch Kurzzeichen gekennzeichnet. Woraus besteht die Kennzeichnung, und was bedeuten die drei Buchstaben an erster Stelle?',
      loesung: ['2 Grossbuchstaben und eine Ziffer', 'A = Umgebungsbedingungen', 'B = Art der Benutzung', 'C = Gebäudekonstruktion'] },
    { id: 'p2-16', art: 'mc', thema: 'einfluesse', quelle: 'NIN Compact S. 169', pruefung: true, nummer: P2 + ' · 16 · 1 Pt.',
      frage: 'Wer bestimmt, ob ein Raum feuergefährdet ist? Kreuzen Sie die richtige Lösung an.',
      antworten: ['der Anlagebesitzer', 'die kantonale Brandschutzbehörde', 'der VSEI', 'der Elektroplaner'],
      richtig: [1] },
    { id: 'p2-17', art: 'schreiben', thema: 'nev', quelle: 'Blatt 7.6 · NEV Art. 3', pruefung: true, nummer: P2 + ' · 17 · 1,5 Pt.',
      frage: 'Was bestätigt der Hersteller mit der CE-Kennzeichnung, und wird das Produkt dabei von einer unabhängigen Stelle geprüft?',
      loesung: ['Der Hersteller bestätigt in Eigenverantwortung die Konformität des Produkts.', 'Nein, keine Prüfung durch eine unabhängige Stelle. CE dient dem freien Warenverkehr in der EU; in der Schweiz ist CE keine Pflicht.'] },

    /* ── BLATT 5.1 · Aufteilung in Stromkreise ───────────────────────────── */
    { id: 's1', art: 'mc', thema: 'stromkreise', quelle: 'NIN Compact S. 100',
      frage: 'Welche Gründe nennt die NIN dafür, eine Anlage in mehrere Stromkreise aufzuteilen?',
      antworten: ['Vermeidung von Gefahren', 'Erleichterung der Prüfung und Wartung', 'Senkung der Anzahl unerwünschter Auslösungen von RCD', 'Senkung der Stromkosten'],
      richtig: [0, 1, 2] },
    { id: 's2', art: 'luecke', thema: 'stromkreise', quelle: 'NIN Compact S. 36',
      frage: 'Wohnungen: Je nach Grösse einer Wohnung werden Installationen auf ___ oder mehr Überstrom-Schutzeinrichtungen unterteilt.',
      loesung: ['zwei', '2'] },
    { id: 's3', art: 'mc', thema: 'stromkreise', quelle: 'NIN Compact S. 101',
      frage: 'Bild 1 «Mehrzimmerwohnungen» — welche Verbraucher haben in der Legende einen eigenen Stromkreis?',
      antworten: ['Kochherd', 'Waschmaschine', 'Beleuchtung und/oder Steckdosen (mehrere Stromkreise)', 'Fernseher'],
      richtig: [0, 1, 2] },
    { id: 's4', art: 'schreiben', thema: 'stromkreise', quelle: 'NIN Compact S. 37',
      frage: 'Warum soll die Beleuchtung in Industrie, Gewerbe und Handel auf mehrere Stromkreise aufgeteilt werden?',
      loesung: ['Wenn ein Stromkreis ausfällt, sollte zumindest ein Teil der Beleuchtung in von Personen genutzten Räumen erhalten bleiben.'] },
    { id: 's5', art: 'luecke', thema: 'stromkreise', quelle: 'NIN Compact S. 100',
      frage: 'Der ___ entscheidet unter Berücksichtigung der Betriebssicherheit und der Anlagekosten, wie eine Anlage unterteilt sein soll.',
      loesung: ['Anlagebesitzer', 'Anlagenbesitzer'] },
    { id: 's6', art: 'schreiben', thema: 'stromkreise', quelle: 'Blatt 5.1 · NIN Compact S. 101',
      frage: 'Aufgabe 3½-Zimmer-Wohnung: Kochherd 10 kW, Geschirrspüler 2,2 kW, Waschmaschine 2,3 kW, Wäschetrockner 1,2 kW. Wie teilen Sie die Stromkreise sinnvoll auf?',
      loesung: ['Kochherd 3×400/230 V, 10 kW: eigener LS 3-polig', 'Geschirrspüler 2,2 kW: eigener LS (mehr als 2 kW)', 'Waschmaschine 2,3 kW: eigener LS', 'Wäschetrockner 1,2 kW: darf mit Steckdosen zusammen (unter 2 kW)',
                'Licht und Steckdosen Küche/Essen, Wohnzimmer, Schlafzimmer: je LS 13 A Typ C, 3×1,5 mm², hinter RCD 30 mA', 'Beleuchtung auf mindestens zwei Stromkreise'] },

    /* ── BLATT 6.1 · Stromversorgung für Sicherheitszwecke ───────────────── */
    { id: 'z1', art: 'luecke', thema: 'sicherheit', quelle: 'NIN Compact S. 231',
      frage: 'Schaltgeräte und Überstrom-Schutzeinrichtungen für Sicherheitszwecke müssen durch eine Abtrennung EI 60 vollständig getrennt oder um mindestens ___ m distanziert sein.',
      loesung: ['0,8', '0.8'] },
    { id: 'z2', art: 'mc', thema: 'sicherheit', quelle: 'NIN Compact S. 231',
      frage: 'Welche Einrichtungen gelten in erster Linie als Anlagen für Sicherheitszwecke (5.6.2)?',
      antworten: ['Notbeleuchtungen (Sicherheitsbeleuchtung)', 'Feuerlöschpumpen und Feuerwehraufzüge', 'Gefahrenmeldeanlagen, Evakuierungs- und Entrauchungsanlagen', 'Aufzüge für den Warentransport'],
      richtig: [0, 1, 2] },
    { id: 'z3', art: 'mc', thema: 'sicherheit', quelle: 'NIN Compact S. 232',
      frage: 'Stromkreise für Sicherheitszwecke — welche Aussagen stimmen?',
      antworten: ['Sie dürfen nicht durch eine Fehlerstrom-Schutzeinrichtung (RCD) geschützt werden.', 'Sie dürfen nicht durch eine Fehlerlichtbogen-Schutzeinrichtung (AFDD) geschützt werden.',
                  'Sie dürfen in keinem Fall durch explosionsgefährdete Bereiche geführt werden.', 'Sie dürfen zusammen mit den allgemeinen Stromkreisen auf derselben Trasse liegen.'],
      richtig: [0, 1, 2] },
    { id: 'z4', art: 'luecke', thema: 'sicherheit', quelle: 'NIN Compact S. 232',
      frage: 'Kabel ohne Isolationserhalt müssen unter Putz in Beton oder Mauerwerk oder örtlich getrennt in einem Kanal mit Feuerwiderstand von mindestens EI ___ verlegt werden.',
      loesung: ['30', 'EI 30'] },
    { id: 'z5', art: 'mc', thema: 'sicherheit', quelle: 'NIN Compact S. 234',
      frage: 'Arten der Notbeleuchtung (5.6.9 Bild 1) — was gehört zur Sicherheitsbeleuchtung?',
      antworten: ['Sicherheitsbeleuchtung für Rettungswege', 'Flächenbeleuchtung (Antipanikbeleuchtung)', 'Sicherheitsbeleuchtung für gefährliche Arbeitsplätze', 'Ersatzbeleuchtung'],
      richtig: [0, 1, 2] },
    { id: 'z6', art: 'luecke', thema: 'sicherheit', quelle: 'NIN Compact S. 235',
      frage: 'Pro Endstromkreis dürfen höchstens ___ Leuchten mit maximal 60 % des Nennstroms der Überstrom-Schutzeinrichtung gespeist werden.',
      loesung: ['20', 'zwanzig'] },
    { id: 'z7', art: 'schreiben', thema: 'sicherheit', quelle: 'NIN Compact S. 104',
      frage: 'Die Stromversorgung für Sicherheitszwecke verhindert auch Arbeitsunfälle in gewissen Produktionsanlagen. Nennen Sie Beispiele.',
      loesung: ['industrielle und gewerbliche Produktionsanlagen', 'Kraftwerke', 'Tiefkühl- und Hochregallager', 'Raffinerien', 'sonstige elektrische Betriebsräume'] },
    { id: 'z8', art: 'mc', thema: 'sicherheit', quelle: 'NIN Compact S. 233',
      frage: 'Isolationserhalt und Funktionserhalt — was stimmt?',
      antworten: ['Isolationserhalt (FE): ein Einzelkabel behält unter Flammeinwirkung eine minimale Isolationsfähigkeit.', 'Funktionserhalt (E): die ganze Kabelanlage (Kabel, Trag- und Befestigungssystem) hält die Funktion im Brandfall aufrecht.',
                  'Funktionserhalt ist erforderlich, wenn die Kabel offen oder zusammen mit Kabeln der allgemeinen Stromversorgung verlegt werden.', 'PVC-Kabel sind Sicherheitskabel, weil sie keine Halogene enthalten.'],
      richtig: [0, 1, 2] },
    { id: 'z9', art: 'luecke', thema: 'sicherheit', quelle: 'NIN Compact S. 232',
      frage: 'Gemäss ___-Brandschutzrichtlinie sind Primärelemente (nicht wiederaufladbare Batterien) als Stromquellen für Sicherheitszwecke nicht zulässig.',
      loesung: ['VKF'] },
    { id: 'z10', art: 'mc', thema: 'sicherheit', quelle: 'NIN Compact S. 235',
      frage: 'Beleuchtungsstärken der Sicherheitsbeleuchtung — was stimmt?',
      antworten: ['Wege zu Ausgängen: min. 1 lx', 'Bekämpfungs- oder Meldeeinrichtungen entlang der Rettungswege: min. 5 lx', 'Arbeiten in Verbindung mit Sicherheitsmassnahmen: min. 15 lx', 'Antipanikbeleuchtung: min. 50 lx'],
      richtig: [0, 1, 2] },

    /* ── BLATT 7.1 · Raumarten ───────────────────────────────────────────── */
    { id: 'r1', art: 'schreiben', thema: 'raumarten', quelle: 'NIN Compact S. 87 · Blatt 7.1',
      frage: 'Feuergefährdete Räume mit brennbarem Staub: Definition und Beispiele.',
      loesung: ['Räume oder Zonen, in welchen leichtbrennbare Stoffe erzeugt, verarbeitet oder in beträchtlichen Mengen aufbewahrt werden und in denen bei der normalen Benützung mit einer Staubablagerung in gefährlichen Mengen zu rechnen ist.', 'Beispiele (Lehrer): Schreinereien, Sägereien, Heuböden'] },
    { id: 'r2', art: 'schreiben', thema: 'raumarten', quelle: 'NIN Compact S. 87 · Blatt 7.1',
      frage: 'Feuergefährdete Räume ohne brennbaren Staub: Definition und Beispiele.',
      loesung: ['Räume oder Zonen, in welchen leichtbrennbare Stoffe in beträchtlichen Mengen gelagert werden.', 'Beispiele (Lehrer): Dachstock, Papierlager, Aktenräume'] },
    { id: 'r3', art: 'luecke', thema: 'raumarten', quelle: 'NIN Compact S. 91',
      frage: 'Räume mit nichtbrennbarem Staub, z. B. gewisse Räume oder Zonen in Zementfabriken, Steinmühlen, ___.',
      loesung: ['Giessereien', 'Giesserei'] },
    { id: 'r4', art: 'luecke', thema: 'raumarten', quelle: 'NIN Compact S. 84',
      frage: 'Bauten und Räume mit starker Personenbelegung: Räume, in denen sich mehr als ___ Personen aufhalten können.',
      loesung: ['300', 'dreihundert'] },
    { id: 'r5', art: 'mc', thema: 'raumarten', quelle: 'NIN Compact S. 86, 309',
      frage: 'Elektrische Betriebsräume — was stimmt?',
      antworten: ['Typischerweise sind dies Trafostationen und Räume für Schaltgerätekombinationen.', 'Der Zugang ist nur für elektrotechnisch unterwiesene Personen (BA4) und Elektrofachkräfte (BA5) möglich.',
                  'Die Türen müssen abschliessbar und mit einem Warnzeichen versehen sein.', 'Sanitäranlagen sollen in elektrischen Betriebsräumen untergebracht werden.'],
      richtig: [0, 1, 2] },
    { id: 'r6', art: 'mc', thema: 'raumarten', quelle: 'NIN Compact S. 317',
      frage: 'Explosionsgefährdete Bereiche — welche Zonen gibt es?',
      antworten: ['Zone 0, 1, 2 für brennbare Gase, Dämpfe und Nebel', 'Zone 20, 21, 22 für brennbare Stäube', 'Zone 0: explosionsfähige Atmosphäre ständig, über lange Zeiträume oder häufig vorhanden', 'Zone 2: explosionsfähige Atmosphäre ständig vorhanden'],
      richtig: [0, 1, 2] },
    { id: 'r7', art: 'schreiben', thema: 'raumarten', quelle: 'Blatt 7.1 (fehlt in der NIN Compact)',
      frage: 'Medizinisch genutzte Räume: Definition und Beispiele.',
      loesung: ['Räume, welche für Untersuchung, Behandlung oder Pflege inklusive physikalischer Therapie von Menschen benützt werden.', 'Beispiele: Arztpraxis, Zahnarztpraxis, Operationssaal, Intensivstation, Dialyse, Physiotherapie'] },
    { id: 'r8', art: 'mc', thema: 'raumarten', quelle: 'NIN Compact S. 87, 90, 95',
      frage: 'Trocken, feucht, nass — welche Zuordnung stimmt?',
      antworten: ['Trockener Raum: in der Regel kein Kondenswasser, Luft nicht mit Feuchtigkeit gesättigt', 'Feuchter Raum: Sicherheit der Betriebsmittel durch Feuchtigkeit, Kondenswasser oder ähnliche Einflüsse beeinträchtigt',
                  'Nasser Raum: Fussboden, mitunter auch Wände, werden mit Wasser abgespritzt', 'Nasser Raum: Raum mit Tropfenbildung an kalten Oberflächen'],
      richtig: [0, 1, 2] },
    { id: 'r9', art: 'schreiben', thema: 'raumarten', quelle: 'NIN Compact S. 317 · Blatt 7.5',
      frage: 'Wer legt die explosionsgefährdeten Bereiche und die Einteilung in Zonen fest?',
      loesung: ['Die Suva und die zuständige kantonale Brandschutzbehörde in Zusammenarbeit mit der für den Arbeitsschutz zuständigen Stelle, aufgrund der Betreiberangaben.'] },

    /* ── BLATT 7.2 · Schutzart IP ────────────────────────────────────────── */
    { id: 'i1', art: 'luecke', thema: 'ip', quelle: 'Blatt 7.2 · NIN Compact S. 175',
      frage: 'IP ist die Abkürzung für ___ Protection.',
      loesung: ['International', 'Ingress'] },
    { id: 'i2', art: 'mc', thema: 'ip', quelle: 'NIN Compact S. 51, 175',
      frage: 'Der IP-Code — was stimmt?',
      antworten: ['Die erste Kennziffer kennzeichnet den Berührungs- und Fremdkörperschutz.', 'Die zweite Kennziffer kennzeichnet den Wasserschutz.',
                  'Ein zusätzlicher Buchstabe (A, B, C oder D) kennzeichnet den Schutz von Personen gegen Zugang zu gefährlichen Teilen.', 'Die erste Kennziffer kennzeichnet den Wasserschutz.'],
      richtig: [0, 1, 2] },
    { id: 'i3', art: 'luecke', thema: 'ip', quelle: 'Blatt 7.2',
      frage: 'Werden für einen Schutzgrad keine bestimmten Anforderungen gestellt, so steht anstelle der Ziffer ein ___.',
      loesung: ['X', 'x'] },
    { id: 'i4', art: 'mc', thema: 'ip', quelle: 'NIN Compact S. 51',
      frage: 'Erste Kennziffer (Fremdkörperschutz) — welche Zuordnung stimmt?',
      antworten: ['IP 1X: Schutz gegen Fremdkörper > 50 mm', 'IP 2X: Schutz gegen Fremdkörper > 12 mm', 'IP 4X: Schutz gegen Fremdkörper > 1 mm', 'IP 6X: staubgeschützt (Eindringen von Staub nicht ausgeschlossen)'],
      richtig: [0, 1, 2] },
    { id: 'i5', art: 'mc', thema: 'ip', quelle: 'NIN Compact S. 51',
      frage: 'Zweite Kennziffer (Feuchtigkeitsschutz) — welche Zuordnung stimmt?',
      antworten: ['IP X1: Schutz gegen Tropfwasser', 'IP X4: Schutz gegen Sprühwasser aus allen Richtungen', 'IP X7: Schutz gegen Eintauchen', 'IP X5: Schutz gegen Untertauchen'],
      richtig: [0, 1, 2] },
    { id: 'i6', art: 'luecke', thema: 'ip', quelle: 'NIN Compact S. 51',
      frage: 'IP 6X bedeutet ___ (kein Eindringen von Staub).',
      loesung: ['staubdicht'] },
    { id: 'i7', art: 'luecke', thema: 'ip', quelle: 'NIN Compact S. 51',
      frage: 'IP X5 bedeutet Schutz gegen ___.',
      loesung: ['Strahlwasser'] },

    /* ── BLATT 7.3 · Symbole für Betriebsmittel ──────────────────────────── */
    { id: 'y1', art: 'mc', thema: 'symbole', quelle: 'NIN Compact S. 52',
      frage: 'Symbole für Betriebsmittel — welche Zuordnung stimmt?',
      antworten: ['tropfwassersicher: IP X1', 'regensicher (nur für Leuchten): IP X3', 'spritzwassersicher: IP X4', 'strahlwassersicher: IP X7'],
      richtig: [0, 1, 2] },
    { id: 'y2', art: 'mc', thema: 'symbole', quelle: 'NIN Compact S. 52',
      frage: 'Welche Zuordnung stimmt?',
      antworten: ['wasserdicht: IP X7', 'druckwasserdicht (Betriebsüberdruck 5 bar): IP X8', 'staubgeschützt: IP 5X', 'staubdicht: IP 5X'],
      richtig: [0, 1, 2] },
    { id: 'y3', art: 'luecke', thema: 'symbole', quelle: 'Blatt 7.3',
      frage: 'Wärmebeständiges Material (Sonne oder T): für Umgebungstemperaturen über ___ °C.',
      loesung: ['40', 'vierzig'] },
    { id: 'y4', art: 'luecke', thema: 'symbole', quelle: 'Blatt 7.3',
      frage: 'Kältebeständiges Material: für Umgebungstemperaturen unter ___ °C.',
      loesung: ['-5', '−5', '5', 'minus 5'] },
    { id: 'y5', art: 'schreiben', thema: 'symbole', quelle: 'Blatt 7.3 · Folien des Lehrers',
      frage: 'Nennen Sie je ein Beispiel für Räume oder Zonen: trocken, feucht, nass (spritzwassersicher), staubig, explosiv, besonders warm, besonders kalt.',
      loesung: ['trocken: Wohnräume, Bad und Küche in Wohnungen (IP X0)', 'feucht: Grossküchen, Kühlhäuser, Keller mit Naturboden (X1)', 'nass: im Freien, Badeanstalten, Gewächshäuser (X4)',
                'staubig: Schreinerei, Sägerei, Heuböden (6X)', 'explosiv: Spritzkabinen, Brennstofflager (Ex)', 'besonders warm: Schmelzereien, Glühereien', 'besonders kalt: Tiefkühlräume, Installationen im Gebirge'] },
    { id: 'y6', art: 'mc', thema: 'symbole', quelle: 'NIN Compact S. 52 · Blatt 7.3',
      frage: 'Welche Umgebungsbedingung hat auf dem Blatt kein Symbol?',
      antworten: ['trocken', 'feucht', 'nass', 'staubig'],
      richtig: [0] },
    { id: 'y7', art: 'luecke', thema: 'symbole', quelle: 'Blatt 7.3',
      frage: 'Sonderisoliertes Material (Doppelquadrat) sind Betriebsmittel mit verstärkter oder zusätzlicher ___, z. B. Handbohrmaschine, Heckenschere.',
      loesung: ['Isolierung', 'Isolation'] },

    /* ── BLATT 7.4 · Zugang zu gefährlichen Teilen ───────────────────────── */
    { id: 'g1', art: 'mc', thema: 'zugang', quelle: 'Blatt 7.4 · NIN Compact S. 176',
      frage: 'Der erweiterte IP-Code (EN 60529) — was stimmt?',
      antworten: ['Er wurde im Jahr 2000 mit der Europanorm EN 60529 eingeführt.', 'Die IP-Kennzeichnung kann mit einem Buchstaben A bis D ergänzt werden.',
                  'Der Zusatzbuchstabe wird nur verwendet, wenn der tatsächliche Schutz gegen Berühren höher ist als der durch die erste Kennziffer angegebene.', 'Der Zusatzbuchstabe ersetzt die erste Kennziffer.'],
      richtig: [0, 1, 2] },
    { id: 'g2', art: 'luecke', thema: 'zugang', quelle: 'NIN Compact S. 176',
      frage: 'A, geschützt gegen Zugang mit dem Handrücken: Eine Prüfkugel mit Ø ___ mm darf keine gefährlichen Teile berühren.',
      loesung: ['50', 'fünfzig'] },
    { id: 'g3', art: 'luecke', thema: 'zugang', quelle: 'Blatt 7.4 · NIN Compact S. 176',
      frage: 'B, geschützt gegen Zugang mit dem Finger: Der Prüffinger mit Ø 12 mm und ___ mm Länge muss ausreichenden Abstand von gefährlichen Teilen haben.',
      loesung: ['80', 'achtzig'] },
    { id: 'g4', art: 'mc', thema: 'zugang', quelle: 'Blatt 7.4',
      frage: 'Welche IP-Codes gehören zu den Buchstaben A bis D?',
      antworten: ['A: IP 0XA', 'B: IP 1XB', 'C: IP 2XC', 'D: IP 4XD'],
      richtig: [0, 1, 2] },
    { id: 'g5', art: 'schreiben', thema: 'zugang', quelle: 'Blatt 7.4',
      frage: 'Der Schutz gegen Zugang zu gefährlichen Teilen kann grundsätzlich auf zwei verschiedene Arten erreicht werden. Welche?',
      loesung: ['kleine Öffnungsweiten im Gehäuse, die das Eindringen von Fremdkörpern und Prüfsonden verhindern, z. B. IP 3X', 'grössere Öffnungsweiten, aber innere Barrieren oder ausreichende Abstände, die den Zugang der in ihrer Länge begrenzten Prüfsonde verhindern, z. B. IP 2XC'] },
    { id: 'g6', art: 'luecke', thema: 'zugang', quelle: 'NIN Compact S. 176',
      frage: 'C, geschützt gegen Zugang mit Werkzeug: Prüfsonde Ø ___ mm und 100 mm Länge.',
      loesung: ['2,5', '2.5'] },
    { id: 'g7', art: 'mc', thema: 'zugang', quelle: 'NIN Compact S. 176',
      frage: 'IK-Code — was stimmt?',
      antworten: ['Der IK-Code steht für die Schutzart durch Gehäuse gegen äussere mechanische Beanspruchung.', 'Er besteht aus zwei Ziffern von 00 bis 10.',
                  'Betriebsmittel für den Gebrauch im Haushalt entsprechen mindestens IK 02, das sind 0,2 Joule.', 'IK 10 entspricht 2 Joule.'],
      richtig: [0, 1, 2] },

    /* ── BLATT 7.5 · Äussere Einflüsse ───────────────────────────────────── */
    { id: 'e1', art: 'luecke', thema: 'einfluesse', quelle: 'NIN Compact S. 174 · Blatt 7.5',
      frage: 'Die Kennzeichnung der äusseren Einflüsse besteht aus einer Gruppe von 2 ___ und einer Ziffer.',
      loesung: ['Grossbuchstaben', 'Großbuchstaben'] },
    { id: 'e2', art: 'mc', thema: 'einfluesse', quelle: 'Blatt 7.5',
      frage: 'Der erste Buchstabe bezeichnet die Gruppe der äusseren Einflüsse. Welche Zuordnung stimmt?',
      antworten: ['A = Umgebungsbedingungen', 'B = Art der Benutzung', 'C = Gebäudekonstruktion', 'C = Art der Benutzung'],
      richtig: [0, 1, 2] },
    { id: 'e3', art: 'mc', thema: 'einfluesse', quelle: 'Blatt 7.5',
      frage: 'Der zweite Buchstabe kennzeichnet die Art der Beeinflussung. Welche Zuordnung stimmt?',
      antworten: ['AD = Auftreten von Wasser', 'AE = Auftreten von festen Fremdkörpern', 'AF = Auftreten von korrosiven oder verschmutzenden Stoffen', 'AG = Auftreten von Wasser'],
      richtig: [0, 1, 2] },
    { id: 'e4', art: 'luecke', thema: 'einfluesse', quelle: 'Blatt 7.5',
      frage: 'AD___ = Spritzwasser, Tropfen aus beliebiger Richtung.',
      loesung: ['4', 'vier'] },
    { id: 'e5', art: 'luecke', thema: 'einfluesse', quelle: 'Blatt 7.5',
      frage: 'AD___ = Tropfwasser, senkrecht fallende Tropfen.',
      loesung: ['2', 'zwei'] },
    { id: 'e6', art: 'luecke', thema: 'einfluesse', quelle: 'Blatt 7.5',
      frage: 'AD___ = Strahlwasser, Wasserstrahl aus beliebiger Richtung.',
      loesung: ['5', 'fünf'] },
    { id: 'e7', art: 'mc', thema: 'einfluesse', quelle: 'NIN Compact S. 174 · Folie des Lehrers',
      frage: 'Was bedeuten folgende Angaben?',
      antworten: ['AG1 = niedrige mechanische Beanspruchung, z. B. Haushalt', 'BE3 = explosionsgefährdete Zonen, z. B. Treibstofflager', 'CA2 = brennbares Bauwerk, Holzhaus', 'AG1 = hohe mechanische Beanspruchung, Industrie'],
      richtig: [0, 1, 2] },
    { id: 'e8', art: 'schreiben', thema: 'einfluesse', quelle: 'NIN Compact S. 169 · Folie des Lehrers',
      frage: 'Die Angaben über die äusseren Einflüsse gelten im Normalfall für den ganzen Raum, können sich aber auch nur auf eine Zone beziehen. Führen Sie ein Beispiel auf.',
      loesung: ['Fahrzeugreparaturhalle mit Waschplatz in einer Ecke.', 'Waschplatz: nasse Zone (AD4) // Rest: trockener Bereich (AD1).'] },
    { id: 'e9', art: 'schreiben', thema: 'einfluesse', quelle: 'NIN Compact S. 169, 317 · Blatt 7.5',
      frage: 'Wer macht die Einteilung der Räume hinsichtlich der äusseren Einflüsse? a) ohne besondere Einflüsse, b) feuergefährdete Bereiche und Ex-Zonen, c) medizinische Bereiche.',
      loesung: ['a) Planer / Installateur zusammen mit dem Anlagebesitzer', 'b) kantonale Brandschutzbehörde in Zusammenarbeit mit dem Arbeitsschutz (Suva); Ex-Zonen: Suva und Brandschutzbehörde', 'c) Betreiber (Spitalleitung, Ärzteschaft) zusammen mit dem Planer'] },
    { id: 'e10', art: 'mc', thema: 'einfluesse', quelle: 'NIN Compact S. 174',
      frage: 'Mechanische Beanspruchung (Tabelle 2) — was stimmt?',
      antworten: ['AG1: niedrige Beanspruchung, Haushalt, Betriebsmittel ≥ IK 02', 'AG2: mittlere Beanspruchung, z. B. Schreinereien, Werkstätten, ≥ IK 07', 'AG3: hohe Beanspruchung, erschwerte industrielle Bedingungen, ≥ IK 08', 'AH = Schlag und Schock'],
      richtig: [0, 1, 2] },

    /* ── BLATT 7.6 · Niederspannungserzeugnisse NEV ──────────────────────── */
    { id: 'n1', art: 'mc', thema: 'nev', quelle: 'NIN Compact S. 27, 71, 80',
      frage: 'NEV und NIV — was stimmt?',
      antworten: ['NEV = Verordnung über elektrische Niederspannungserzeugnisse, SR 734.26: Geräte und Betriebsmittel', 'NIV = Niederspannungs-Installationsverordnung, SR 734.27: Installationen',
                  'In der NEV ist geregelt, welchen Anforderungen Betriebsmittel entsprechen müssen, die in Verkehr gebracht werden.', 'Die NEV regelt die Installationsbewilligung.'],
      richtig: [0, 1, 2] },
    { id: 'n2', art: 'schreiben', thema: 'nev', quelle: 'NEV Art. 8 (Entwurf 2015: Art. 7)',
      frage: 'Wer ein Niederspannungserzeugnis auf dem Markt bereitstellt, muss eine Konformitätserklärung vorlegen können. Welche fünf Angaben muss sie enthalten?',
      loesung: ['1) Produkt oder Produktmodell (Produkt-, Chargen-, Typen- oder Seriennummer)', '2) Name und Adresse der Herstellerin oder ihrer in der Schweiz niedergelassenen Vertretung',
                '3) Beschreibung des Niederspannungserzeugnisses und Angaben zu dessen Identifikation', '4) die angewandten technischen Vorschriften und Normen (EN mit Ausgabestand, IEC mit Edition)',
                '5) Name und Adresse der Person, welche die Konformitätserklärung unterzeichnet'] },
    { id: 'n3', art: 'schreiben', thema: 'nev', quelle: 'NEV Art. 10 (Entwurf 2015: Art. 9 und 12)',
      frage: 'Welche Normen gelten als anerkannte Regeln der Technik, und was gilt, wenn ein Erzeugnis nach diesen Normen hergestellt wird?',
      loesung: ['Die international harmonisierten Normen der IEC und des CENELEC, und wo solche fehlen, schweizerische Normen.', 'Wird ein Erzeugnis nach den bezeichneten Normen hergestellt, wird vermutet, dass die grundlegenden Anforderungen erfüllt sind. Sonst muss die Erfüllung auf andere Weise nachgewiesen werden.'] },
    { id: 'n4', art: 'mc', thema: 'nev', quelle: 'Blatt 7.6 · NEV Art. 3',
      frage: 'Die CE-Kennzeichnung — was stimmt?',
      antworten: ['Sie wurde geschaffen, um den freien Warenverkehr in der EU zu gewährleisten.', 'Der Hersteller bestätigt damit in Eigenverantwortung die Konformität des Produkts.',
                  'Das Produkt wird nicht von einer unabhängigen Stelle überprüft.', 'In der Schweiz ist es Pflicht, die CE-Kennzeichnung anzubringen.'],
      richtig: [0, 1, 2] },
    { id: 'n5', art: 'mc', thema: 'nev', quelle: 'Blatt 7.6 · NEV 3. Abschnitt',
      frage: 'Das Schweizerische Sicherheitszeichen — was stimmt?',
      antworten: ['Es ist freiwillig.', 'Hersteller und Händler lassen ihre Produkte durch das Eidgenössische Starkstrominspektorat ESTI zertifizieren.',
                  'Es weist nach, dass die Sicherheit des Gerätes und die elektromagnetische Verträglichkeit geprüft wurden.', 'Es ersetzt die Konformitätserklärung.'],
      richtig: [0, 1, 2] },
    { id: 'n6', art: 'luecke', thema: 'nev', quelle: 'NIN Compact S. 71',
      frage: 'Verordnung über elektrische Niederspannungserzeugnisse NEV SR ___',
      loesung: ['734.26', '734,26'] },
    { id: 'n7', art: 'luecke', thema: 'nev', quelle: 'Blatt 7.6',
      frage: 'Wenn es technisch nicht möglich ist, das Schweizerische Sicherheitszeichen anzubringen, sind auch andere Kennzeichnungen möglich, z. B. der ___ für CH: «S».',
      loesung: ['Morsecode', 'Morse-Code', 'Morse'] },
    { id: 'n8', art: 'luecke', thema: 'nev', quelle: 'Blatt 7.6',
      frage: 'Das Konformitätszeichen des ___ bietet zusätzlich die laufende Überwachung der Produktion.',
      loesung: ['SEV'] },
  ];

  /* ── DAS KAPITEL ALS SEITE — wie beim Staatskunde-Kapitel (E677) ────────
     Keine zweite Ablage: jede Aufgabe wird eine Lernkarte mit `quiz`, der
     Fortschritt steht am Block in `sr`. Neu gegenüber E677 ist das Feld
     `kapitel`, damit der Trainer zwei Kapitel auseinanderhält, und
     `pruefung: false` an den Themenaufgaben in Schreibform, damit die
     Prüfungsrunde nur die 34 nummerierten Fragen nimmt. */
  const themaName = (id: string): string => THEMEN.find(t => t.id === id)?.name || id;

  const karteVon = (a: Aufgabe): Record<string, unknown> => {
    const gemeinsam: Record<string, unknown> = { kapitel: KAPITEL, thema: a.thema, topic: themaName(a.thema), quelle: a.quelle };
    if (a.nummer) gemeinsam['nummer'] = a.nummer;
    if (a.art === 'mc') {
      const quiz: Record<string, unknown> = { kind: 'mc', ...gemeinsam,
        optionen: a.antworten.map((text, i) => ({ text, richtig: a.richtig.includes(i) })) };
      if (a.pruefung) quiz['pruefung'] = true;
      return { text: a.frage + ' :: ' + a.richtig.map(i => a.antworten[i]).join('; '), quiz };
    }
    if (a.art === 'schreiben') {
      const quiz: Record<string, unknown> = { kind: 'schreiben', ...gemeinsam, musterloesung: a.loesung.slice(), pruefung: a.pruefung === true };
      if (a.hinweis) quiz['hinweis'] = a.hinweis;
      return { text: a.frage + ' :: ' + a.loesung.join(' · '), quiz };
    }
    const quiz: Record<string, unknown> = { kind: 'luecke', ...gemeinsam, loesungen: a.loesung.slice() };
    if (a.pruefung) quiz['pruefung'] = true;
    return { text: a.frage.replace('___', '{{' + (a.loesung[0] || '') + '}}'), quiz };
  };

  const alsSeite = (): any => {
    const seite = Store.addPage(null, { text: 'Regeln der Technik — NIN Kap. 5, 6, 7', icon: '⚡' });
    Store.addBlock(seite.id, 'text', { text: 'Kapitel 5 (Aufteilung in Stromkreise), 6 (Stromversorgung für Sicherheitszwecke) und 7 (Äussere Einflüsse) nach den Kapitelblättern ' +
      'und der NIN Compact 2024. Jede Karte ist eine Aufgabe des Trainers (Lernzentrum → Trainer): zwei Probeprüfungen im Muster des Lehrers mit Nummer und Punkten, ' +
      'dazu Aufgaben je Blatt. Jede Karte nennt die Seite in der NIN Compact. Du kannst jede Karte lesen und ändern.' });
    /* Die Prüfungsfragen zuoberst und in Blattreihenfolge — die
       Prüfungsrunde liest die Seite von oben nach unten (P106). */
    Store.addBlock(seite.id, 'h2', { text: 'Probeprüfung 1 · 17 Fragen · 27 Punkte · 20 Minuten' });
    for (const a of AUFGABEN) if (a.pruefung && a.id.startsWith('p1-')) Store.addBlock(seite.id, 'flashcard', karteVon(a));
    Store.addBlock(seite.id, 'h2', { text: 'Probeprüfung 2 · Nr. 260923 · 17 Fragen · 27 Punkte · 20 Minuten' });
    for (const a of AUFGABEN) if (a.pruefung && a.id.startsWith('p2-')) Store.addBlock(seite.id, 'flashcard', karteVon(a));
    for (const t of THEMEN) {
      Store.addBlock(seite.id, 'h2', { text: t.name + ' · ' + t.seite });
      for (const a of AUFGABEN) if (a.thema === t.id && !a.pruefung) Store.addBlock(seite.id, 'flashcard', karteVon(a));
    }
    return seite;
  };

  if (typeof Register !== 'undefined' && Register.vorlagen && Register.vorlagen.melde) {
    Register.vorlagen.melde({
      id: 'nin-kapitel-5-7', icon: '⚡', name: 'Regeln der Technik — NIN Kap. 5, 6, 7', trainer: true,
      text: 'Die Kapitelblätter 5.1, 6.1 und 7.1–7.6 als Lernkarten für den Trainer: zwei Probeprüfungen mit Nummern und Punkten, Multiple Choice, Schreiben und Lücken, jede mit Seite in der NIN Compact.',
      quelle: 'Kapitelblätter Heinz Boxler (NIN 2020), NIN Compact 2024, NEV', bauen: alsSeite
    });
  }

  return { KAPITEL, THEMEN, AUFGABEN, karteVon, alsSeite };
})();

(window as any).NinQuiz = NinQuiz;
