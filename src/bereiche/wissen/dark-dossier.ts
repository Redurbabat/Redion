/* ============================================================================
 * bereiche/wissen/dark-dossier.ts — DARK (2017–2020) als Redion-Fach
 * ----------------------------------------------------------------------------
 * Vollständige Spoiler. Der Inhalt ist eine redaktionelle Zusammenfassung der
 * Serie, kein Transkript. Die Diagramme sind eigene SVG-Schaubilder; es werden
 * bewusst keine Netflix-Screenshots oder Poster in Redion kopiert.
 * ==========================================================================*/

const DarkDossier = (() => {
  const absatz = (elternId, text) => Store.addBlock(elternId, 'text', { text });
  const h1 = (elternId, text) => Store.addBlock(elternId, 'h1', { text });
  const h2 = (elternId, text) => Store.addBlock(elternId, 'h2', { text });
  const punkt = (elternId, text) => Store.addBlock(elternId, 'bullet', { text });
  const hinweis = (elternId, text) => Store.addBlock(elternId, 'callout', { text });
  const trenn = (elternId) => Store.addBlock(elternId, 'divider', {});
  const karte = (elternId, frage, antwort) => Store.addBlock(elternId, 'flashcard', {
    text: frage + ' :: ' + antwort,
  });

  const svg = (breite, hoehe, inhalt) =>
    'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + breite + '" height="' + hoehe +
      '" viewBox="0 0 ' + breite + ' ' + hoehe + '">' +
      '<rect width="100%" height="100%" rx="28" fill="#111318"/>' +
      '<style>text{font-family:Arial,sans-serif;fill:#f4f4f5}.muted{fill:#a1a1aa}.accent{fill:#f6c344}.line{stroke:#f6c344;stroke-width:3;fill:none}.soft{stroke:#71717a;stroke-width:2;fill:none}.box{fill:#1d2027;stroke:#3f3f46;stroke-width:2}</style>' +
      inhalt + '</svg>');

  const bild = (elternId, src, caption) => Store.addBlock(elternId, 'image', { src, caption });

  const cover = () => svg(1200, 480,
    '<circle cx="600" cy="240" r="146" class="line"/><circle cx="520" cy="240" r="146" class="line"/><circle cx="680" cy="240" r="146" class="line"/>' +
    '<text x="600" y="92" font-size="28" text-anchor="middle" class="muted">REDION · SERIENFACH</text>' +
    '<text x="600" y="240" font-size="90" text-anchor="middle" font-weight="700">DARK</text>' +
    '<text x="600" y="304" font-size="30" text-anchor="middle">2017–2020 · Winden · Zeit · Welten · Ursprung</text>' +
    '<text x="600" y="404" font-size="22" text-anchor="middle" class="muted">Eigenes Schaubild · keine Netflix-Grafik</text>');

  const zeitBild = () => svg(1400, 500,
    '<text x="700" y="64" font-size="34" text-anchor="middle" font-weight="700">Die Hauptzeiten des Knotens</text>' +
    '<path d="M110 260 H1290" class="line"/>' +
    [1888,1921,1953,1986,2019,2052].map((jahr, i) => {
      const x = 120 + i * 234;
      return '<circle cx="' + x + '" cy="260" r="13" fill="#f6c344"/><text x="' + x + '" y="215" font-size="27" text-anchor="middle">' + jahr + '</text>' +
        '<text x="' + x + '" y="312" font-size="18" text-anchor="middle" class="muted">' +
        ['Sic Mundus entsteht','Adam & Sic Mundus','Ulrich / Helge','Mikkel / AKW','Verschwinden','Nach Apokalypse'][i] + '</text>';
    }).join('') +
    '<path d="M120 350 C350 450 590 450 824 350" class="soft"/><path d="M824 350 C1050 450 1250 430 1290 350" class="soft"/>' +
    '<text x="700" y="452" font-size="21" text-anchor="middle" class="muted">Der Höhlengang verbindet zunächst 33-Jahres-Schritte; spätere Geräte lösen diese Grenze.</text>');

  const weltenBild = () => svg(1200, 610,
    '<text x="600" y="65" font-size="34" text-anchor="middle" font-weight="700">Drei Welten — nur eine ist der Ursprung</text>' +
    '<circle cx="330" cy="270" r="170" fill="#18202b" stroke="#60a5fa" stroke-width="4"/>' +
    '<circle cx="870" cy="270" r="170" fill="#2a1b23" stroke="#fb7185" stroke-width="4"/>' +
    '<circle cx="600" cy="455" r="125" fill="#27251b" stroke="#f6c344" stroke-width="4"/>' +
    '<text x="330" y="245" font-size="31" text-anchor="middle">Adams Welt</text><text x="330" y="284" font-size="20" text-anchor="middle" class="muted">Jonas wird Adam</text>' +
    '<text x="870" y="245" font-size="31" text-anchor="middle">Evas Welt</text><text x="870" y="284" font-size="20" text-anchor="middle" class="muted">Martha wird Eva</text>' +
    '<text x="600" y="440" font-size="28" text-anchor="middle">Ursprungswelt</text><text x="600" y="477" font-size="18" text-anchor="middle" class="muted">Tannhaus vor der Spaltung</text>' +
    '<path d="M460 345 L535 408" class="line"/><path d="M740 345 L665 408" class="line"/>' +
    '<text x="600" y="560" font-size="20" text-anchor="middle" class="muted">Der Knoten existiert, weil Tannhaus in der Ursprungswelt seine Familie retten will.</text>');

  const familieBild = () => svg(1400, 720,
    '<text x="700" y="58" font-size="34" text-anchor="middle" font-weight="700">Der wichtigste Familienknoten — stark vereinfacht</text>' +
    '<rect x="525" y="95" width="350" height="72" rx="18" class="box"/><text x="700" y="137" font-size="24" text-anchor="middle">Jonas + Martha (Evas Welt)</text>' +
    '<path d="M700 167 V220" class="line"/><rect x="540" y="220" width="320" height="72" rx="18" class="box"/><text x="700" y="263" font-size="24" text-anchor="middle">Der Unbekannte</text>' +
    '<path d="M700 292 V345" class="line"/><rect x="525" y="345" width="350" height="72" rx="18" class="box"/><text x="700" y="388" font-size="24" text-anchor="middle">mit Agnes → Tronte Nielsen</text>' +
    '<path d="M700 417 V465" class="line"/><rect x="525" y="465" width="350" height="72" rx="18" class="box"/><text x="700" y="508" font-size="24" text-anchor="middle">Tronte → Ulrich → Mikkel</text>' +
    '<path d="M700 537 V585" class="line"/><rect x="525" y="585" width="350" height="72" rx="18" class="box"/><text x="700" y="628" font-size="24" text-anchor="middle">Mikkel = Michael → Jonas</text>' +
    '<text x="110" y="230" font-size="21" class="muted">Bartosz + Silja</text><text x="110" y="265" font-size="21" class="muted">→ Noah + Agnes</text>' +
    '<path d="M330 260 C430 260 440 370 525 380" class="soft"/>' +
    '<text x="1010" y="315" font-size="21" class="muted">Noah + Elisabeth → Charlotte</text><text x="1010" y="350" font-size="21" class="muted">Charlotte + Peter → Elisabeth</text>' +
    '<path d="M1005 370 C910 410 930 500 875 520" class="soft"/>' +
    '<text x="700" y="692" font-size="18" text-anchor="middle" class="muted">Die Serie enthält mehrere Bootstrap- und Abstammungs-Paradoxien; dieses Bild zeigt nur die tragende Schleife.</text>');

  const geraeteBild = () => svg(1400, 520,
    '<text x="700" y="60" font-size="34" text-anchor="middle" font-weight="700">Wie Zeitreisen im Verlauf der Serie möglich werden</text>' +
    [
      ['Höhlengang','33 Jahre','1953 ↔ 1986 ↔ 2019'],
      ['Bunkerstuhl','Prototyp','tödliche Versuche'],
      ['Tannhaus-Gerät','tragbar','33-Jahres-Zyklen'],
      ['Gottespartikel','Datum frei','stabile dunkle Materie'],
      ['Goldene Kugel','Welt + Zeit','Adam ↔ Eva ↔ Ursprung']
    ].map((a,i)=>{
      const x=34+i*272;
      return '<rect x="'+x+'" y="130" width="240" height="250" rx="22" class="box"/>' +
        '<text x="'+(x+120)+'" y="190" font-size="23" text-anchor="middle" font-weight="700">'+a[0]+'</text>' +
        '<text x="'+(x+120)+'" y="245" font-size="21" text-anchor="middle" class="accent">'+a[1]+'</text>' +
        '<text x="'+(x+120)+'" y="300" font-size="17" text-anchor="middle" class="muted">'+a[2]+'</text>' +
        (i<4?'<path d="M'+(x+240)+' 255 H'+(x+272)+'" class="line"/>':'');
    }).join('') +
    '<text x="700" y="456" font-size="19" text-anchor="middle" class="muted">Nicht jedes Gerät folgt denselben Regeln; genau deshalb kann die Handlung später die 33-Jahres-Grenze verlassen.</text>');

  const seite = (elternId, titel, icon) => Store.addPage(elternId, { text: titel, icon });

  const bauen = () => {
    const root = Store.addPage(null, {
      text: 'Dark (2017–2020) — Die komplette Zeitreise erklärt',
      icon: '◌',
      heftArt: 'fach',
      vorlage: 'dark-2017-dossier',
    });

    hinweis(root.id, '⚠️ VOLLSTÄNDIGE SPOILER: Dieses Fach erklärt alle drei Staffeln einschließlich Identitäten, Familienbeziehungen, Parallelwelten und Finale.');
    bild(root.id, cover(), 'DARK 2017–2020 — eigenes Redion-Schaubild');
    absatz(root.id, 'Dark ist eine deutsche Science-Fiction-Mysteryserie von Baran bo Odar und Jantje Friese. Netflix veröffentlichte Staffel 1 am 1. Dezember 2017, Staffel 2 am 21. Juni 2019 und Staffel 3 am 27. Juni 2020. Insgesamt sind es 26 Folgen.');
    hinweis(root.id, 'Die Bilder in diesem Fach sind selbst erstellte Schaubilder. Es werden keine Netflix-Screenshots, Poster oder Standbilder kopiert. Für offizielle Bilder und Trailer stehen Links auf der Quellenseite.');

    const orient = seite(root.id, '1 · Schnellorientierung', '◎');
    h1(orient.id, 'Die Idee in einem Satz');
    absatz(orient.id, 'In Winden erzeugt ein fehlgeschlagenes Zeitexperiment von H. G. Tannhaus in einer ursprünglichen Welt zwei miteinander verschlungene Welten. In ihnen sorgen Zeitreisen dafür, dass Menschen ihre eigenen Ursachen hervorbringen. Jonas Kahnwald und Martha Nielsen sind Mittelpunkt dieses Knotens; erst Claudia erkennt, dass der eigentliche Ursprung außerhalb beider Welten liegt.');
    h2(orient.id, 'Die fünf Dinge, die man zuerst verstehen muss');
    punkt(orient.id, 'Mikkel Nielsen verschwindet 2019, landet 1986, wächst dort als Michael Kahnwald auf und wird Jonas’ Vater. Jonas ist deshalb Marthas Neffe.');
    punkt(orient.id, 'Jonas existiert als Jugendlicher, als erwachsener Fremder und schließlich als Adam. Martha aus der zweiten Welt entwickelt sich zu Eva.');
    punkt(orient.id, 'Jonas und Martha aus Evas Welt zeugen den namenlosen „Unbekannten“. Er ist ein zentraler Vorfahr des Nielsen-Stammbaums und verbindet die beiden Welten biologisch.');
    punkt(orient.id, 'Die Apokalypse erzeugt einen kurzen Moment, in dem Ursache und Wirkung unterbrochen werden können. Eva nutzt diesen Schlupfwinkel, um zwei alternative Abläufe gleichzeitig zu erhalten.');
    punkt(orient.id, 'Adams und Evas Welt sind nicht die Ursprungswelt. Sie entstehen erst, weil Tannhaus in der dritten Welt seine bei einem Unfall verlorene Familie retten will.');
    bild(orient.id, weltenBild(), 'Adams Welt, Evas Welt und die Ursprungswelt');

    const timeline = seite(root.id, '2 · Chronologische Zeitlinie — was wann passiert', '↔');
    bild(timeline.id, zeitBild(), 'Die wichtigsten 33-Jahres-Epochen');
    h1(timeline.id, 'Vor dem Knoten: 1971 und 1986 in der Ursprungswelt');
    absatz(timeline.id, '8. November 1971: Marek Tannhaus streitet mit seinem Vater H. G. Tannhaus und fährt mit Sonja und ihrer kleinen Tochter Charlotte fort. Ohne Eingriff würden alle drei bei einem Autounfall sterben. Dieser Verlust treibt Tannhaus später dazu, eine Maschine zu bauen, mit der er die Vergangenheit ändern möchte.');
    absatz(timeline.id, '21. Juni 1986: Tannhaus aktiviert sein Experiment. Statt seine Familie zurückzuholen, spaltet beziehungsweise zerstört das Experiment die Ursprungswelt und erzeugt die beiden verschlungenen Realitäten von Adam und Eva. Von nun an existiert der Knoten.');
    h1(timeline.id, '1888 bis 1921 — aus Jonas wird Adam');
    absatz(timeline.id, '1888: Der erwachsene Jonas, Bartosz, Magnus und Franziska werden durch die Apokalypse aus 2020 in die Vergangenheit geschleudert. Ohne funktionierende Maschine versuchen sie jahrelang, die dunkle Materie zu kontrollieren. Jonas wird zunehmend kompromisslos; aus seinem Ziel, alles zu beenden, entsteht Sic Mundus und schließlich Adam.');
    absatz(timeline.id, 'In den folgenden Jahrzehnten stößt Silja zu Bartosz. Aus ihrer Beziehung gehen Hanno, der später Noah heißt, und Agnes hervor. Damit entsteht ein weiterer Teil der Familienverknotung: Agnes wird später Mutter von Tronte Nielsen.');
    absatz(timeline.id, '1911: Hannah erreicht mit der jungen Silja den inzwischen älteren Jonas. Jonas tötet Hannah und sorgt dafür, dass Silja an den Ort und in die Zeit gelangt, an denen sie ihre Rolle im Knoten erfüllt.');
    absatz(timeline.id, '1921: Sic Mundus besitzt eine kontrollierbare dunkle Materie. Der junge Noah wird von Adam gelenkt. Adam schickt den jungen Jonas in die Zukunft und erklärt ihm, dass bestimmte Ereignisse exakt wiederholt werden müssten, damit der vermeintliche „letzte Zyklus“ eintreten kann.');
    h1(timeline.id, '1953/1954 — Ulrich versucht die Vergangenheit zu ändern');
    absatz(timeline.id, 'Ulrich reist aus 2019 durch die Höhle nach 1953. Er glaubt, der junge Helge Doppler werde später die Kindesentführungen verursachen, und versucht ihn zu töten. Helge überlebt. Ulrich wird von Egon Tiedemann verhaftet und bleibt in der Vergangenheit gefangen. Sein Eingriff verhindert den Knoten nicht, sondern wird selbst Teil davon.');
    absatz(timeline.id, 'Hannah reist später zu Ulrich, lässt ihn jedoch im Gefängnis zurück. Sie beginnt eine Beziehung mit Egon. Aus dieser Verbindung geht Silja hervor — dieselbe Silja, die später mit Bartosz Noah und Agnes bekommt.');
    h1(timeline.id, '1986/1987 — Mikkel wird Michael');
    absatz(timeline.id, '5. November 1986: Der elfjährige Mikkel, der am Vorabend 2019 in der Höhle verschwunden ist, kommt in 1986 an. Ines Kahnwald nimmt ihn auf. Er bleibt in dieser Zeit, wächst auf, nennt sich Michael Kahnwald und heiratet später Hannah. Ihr Sohn ist Jonas.');
    absatz(timeline.id, 'Claudia Tiedemann übernimmt 1986 die Leitung des Kernkraftwerks. Sie erfährt von einem Störfall und den versteckten radioaktiven Rückständen. Die Materie in den Fässern spielt später bei Wurmloch, Gottespartikel und Apokalypse eine entscheidende Rolle.');
    absatz(timeline.id, 'Noah und Helge benutzen im Bunker einen frühen Zeitmaschinen-Prototypen. Erik, Yasin und Mads werden Opfer der Versuche; ihre Körper landen durch die Fehlfunktion in anderen Jahren. Die schrecklichen Funde sind somit Nebenprodukte einer noch unvollkommenen Zeitmaschine.');
    absatz(timeline.id, '1987: Die ältere Claudia versucht, Ereignisse zu korrigieren, verursacht aber im Streit unbeabsichtigt den Tod ihres Vaters Egon. Katharina reist später ebenfalls in diese Zeit, um Ulrich zu befreien, und wird von ihrer eigenen Mutter Helene getötet. Auch diese scheinbar „ändernden“ Handlungen erfüllen den bekannten Ablauf.');
    h1(timeline.id, '2019 — der Einstieg der Serie');
    absatz(timeline.id, '21. Juni 2019: Michael Kahnwald begeht Suizid und hinterlässt einen Brief, der erst zum vorgesehenen Zeitpunkt geöffnet werden soll. Später wird klar: Er weiß, dass er Mikkel ist und dass sein Tod zu den Ereignissen führt, durch die sein jüngeres Ich überhaupt erst nach 1986 gelangt.');
    absatz(timeline.id, '4. November 2019: Jonas kehrt nach psychiatrischer Behandlung zur Schule zurück. Erik Obendorf wird bereits vermisst. Jonas, Bartosz, Martha, Magnus, Mikkel und Franziska gehen zu den Höhlen; Mikkel verschwindet. Am nächsten Tag taucht ein Kinderkörper auf — Mads Nielsen, der 1986 verschwunden war.');
    absatz(timeline.id, 'Jonas entdeckt den Höhlengang, reist nach 1986 und erkennt nach und nach, wer Michael wirklich war. Ulrich folgt einer anderen Spur, landet 1953 und bleibt dort. Der Fremde stellt sich schließlich als erwachsener Jonas heraus. Sein Versuch, das Wurmloch zu schließen, ist paradoxerweise Teil seiner Entstehung.');
    h1(timeline.id, '2020 — der Tag der Apokalypse');
    absatz(timeline.id, 'Im Juni 2020 versucht Jonas verzweifelt, den Zyklus zu brechen. Er reist sogar zum Tag vor Michaels Suizid, muss aber erkennen, dass Claudia und Adam ihn so lenken, dass Michael den bekannten Weg gerade erst akzeptiert.');
    absatz(timeline.id, '27. Juni 2020: Clausen lässt im Kernkraftwerk die radioaktiven Fässer öffnen. Mehrere Zeitmaschinen und die Materie im Kraftwerk reagieren miteinander; über Winden entsteht die Apokalypse. Adam erschießt Martha vor Jonas, weil er glaubt, dieser Schmerz sei notwendig, damit Jonas zu ihm wird.');
    absatz(timeline.id, 'Genau im Moment der Apokalypse entsteht der entscheidende Schlupfwinkel: Für einen Augenblick steht die normale Kausalität still. Dadurch kann es einen Ablauf geben, in dem Martha aus Evas Welt Jonas rettet, und zugleich einen, in dem Bartosz sie abfängt und Jonas sich selbst rettet. Beide Varianten gehören zum Knoten.');
    h1(timeline.id, '2040–2053 — die Zukunft hält die Vergangenheit am Leben');
    absatz(timeline.id, 'Jonas, Claudia und Noah arbeiten nach der Apokalypse an der Stabilisierung der dunklen Materie. Noah und Elisabeth werden ein Paar; ihre Tochter Charlotte wird ihnen als Baby entführt. Später wird klar: Erwachsene Charlotte und erwachsene Elisabeth entführen das Baby selbst und bringen es zu Tannhaus. Charlotte wird dadurch von ihrer eigenen Tochter in ihre eigene Kindheit gebracht — ein Bootstrap-Paradox.');
    absatz(timeline.id, '2052/2053: Jonas sieht das zerstörte Winden und lernt, den Gottespartikel zu benutzen. Adam versucht später, die schwangere Martha aus Evas Welt mit der Energie beider Apokalypsen zu vernichten, weil er ihr ungeborenes Kind für den Ursprung hält. Der Versuch scheitert: Der Unbekannte ist Teil des Knotens, aber nicht dessen äußerste Ursache.');
    h1(timeline.id, 'Die echte Auflösung');
    absatz(timeline.id, 'Claudia erkennt schließlich, dass Regina ohne den Knoten leben kann und dass nicht alle Menschen von Zeitreise-Abstammungen abhängen. Daraus schließt sie, dass eine dritte, ursprüngliche Welt existieren muss. Sie erklärt Adam, dass Tannhaus dort 1986 die Spaltung verursacht hat.');
    absatz(timeline.id, 'Adam schickt einen jungen Jonas in Evas Welt. Jonas holt Martha aus dem Moment heraus, bevor sie endgültig in Evas Bahn gerät. Am 21. Juni 1986 nutzen beide den Moment von Tannhaus’ Experiment, gelangen durch den Zwischenraum der Welten und reisen in die Ursprungswelt zum 8. November 1971.');
    absatz(timeline.id, 'Jonas und Martha stoppen Marek und Sonja auf der Straße und bringen sie dazu, zu Tannhaus zurückzukehren. Der Unfall findet nicht statt. Tannhaus verliert seine Familie nicht, baut die zerstörerische Maschine nicht, Adams und Evas Welt werden nie erzeugt. Die Menschen, die nur durch den Knoten existierten, lösen sich auf.');

    const s1 = seite(root.id, '3 · Staffel 1 (2017) — Folge für Folge', '1');
    h1(s1.id, 'Staffel 1: Das Rätsel wird aufgebaut');
    const eps1 = [
      ['1 · Geheimnisse','Michael Kahnwald hat sich Monate zuvor das Leben genommen. Jonas kehrt nach Winden zurück. Beim nächtlichen Gang zur Höhle verschwindet Mikkel Nielsen; kurz darauf wird ein unbekannter toter Junge gefunden.'],
      ['2 · Lügen','Ulrich verbindet Mikkels Verschwinden mit dem seines Bruders Mads von 1986. Mikkel erwacht in 1986 und begreift anhand der Umgebung, dass er nicht nur verschwunden, sondern durch die Zeit gereist ist.'],
      ['3 · Gestern und Heute','Die Handlung zeigt Winden 1986: junge Versionen der Eltern werden sichtbar, Claudia übernimmt das Kraftwerk und Mikkel sucht einen Weg zurück. Die Zuschauer erkennen, dass die Familien über Jahrzehnte enger verbunden sind als gedacht.'],
      ['4 · Doppelleben','Charlotte untersucht die toten Vögel und die seltsamen Kinderleichen. Die Geheimnisse der Dopplers, Nielsens und Kahnwalds vertiefen sich; Peter, Franziska und weitere Figuren scheinen jeweils etwas zu verbergen.'],
      ['5 · Wahrheiten','Jonas bekommt Hinweise des Fremden. Hannahs Fixierung auf Ulrich und die Spannungen zwischen Jonas, Martha und Bartosz verschärfen sich. Mikkel findet in Ines eine Bezugsperson und beginnt, in 1986 Fuß zu fassen.'],
      ['6 · Sic Mundus Creatus Est','Jonas folgt Karte, Geigerzähler und Höhlenmarkierungen. Er öffnet den Durchgang und reist nach 1986. Ulrich stößt auf familiäre Geheimnisse, während der Name Sic Mundus und der Zeitreise-Mythos konkrete Form annehmen.'],
      ['7 · Kreuzwege','Jonas will Mikkel aus 1986 zurückholen. Der Fremde hält ihn davon ab und erklärt die paradoxe Konsequenz: Würde Mikkel nicht zu Michael, würde Jonas nie geboren. Ulrich verdächtigt Helge und jagt ihn.'],
      ['8 · Was man sät, das wird man ernten','Ulrich gelangt nach 1953. Dort versucht er, den jungen Helge zu töten, um zukünftige Verbrechen zu verhindern. Der Plan scheitert; Ulrich wird festgenommen und wird selbst zu dem rätselhaften Fremden aus Helges Vergangenheit.'],
      ['9 · Alles ist jetzt','Claudia erfährt mehr über die radioaktiven Abfälle. Noah erklärt seine Mission und rekrutiert Bartosz. Hannah nutzt Aleksanders falsche Identität als Druckmittel. Die vermeintlich getrennten Geheimnisse laufen auf den Zeitknoten zu.'],
      ['10 · Alpha und Omega','Mads’ Körper erscheint 2019 im Bunker. Der Fremde offenbart sich als erwachsener Jonas und aktiviert Tannhaus’ Gerät. Das Wurmloch verbindet Jonas und Helge über die Zeiten; Jonas wird nach 2052 geschleudert. Staffel 1 endet mit dem zerstörten Winden.']
    ];
    eps1.forEach(e => { h2(s1.id, e[0]); absatz(s1.id, e[1]); });

    const s2 = seite(root.id, '4 · Staffel 2 (2019) — Folge für Folge', '2');
    h1(s2.id, 'Staffel 2: Jonas trifft Adam und der Zyklus schließt sich');
    const eps2 = [
      ['1 · Anfänge und Enden','1921 zeigt Sic Mundus und einen jungen Noah. 2052 sucht Jonas nach einem Weg aus der Zukunft. 2020 rückt die Abschaltung des Kraftwerks näher, während der Countdown zur Apokalypse läuft.'],
      ['2 · Dunkle Materie','Jonas findet in der Zukunft den instabilen Gottespartikel und reist damit in eine andere Zeit. Claudias ältere und jüngere Versionen kommen einander näher; die Fässer im Kraftwerk werden als Schlüssel der Zeitphänomene wichtiger.'],
      ['3 · Gespenster','Die Angehörigen suchen weiter nach den Vermissten. Ulrich sitzt Jahrzehnte später als alter Mann in der Psychiatrie. Egon beginnt zu verstehen, dass der Gefangene von 1953 und der Mann aus seiner Gegenwart zusammengehören.'],
      ['4 · Die Reisenden','Jonas erreicht 1921 und trifft Adam — sein entstelltes älteres Ich. Adam präsentiert Sic Mundus als Organisation, die den Knoten versteht, aber seine Erklärung ist strategisch: Er lenkt Jonas weiterhin.'],
      ['5 · Vom Suchen und Finden','Adam schickt Jonas zum 20. Juni 2019, damit er Michaels Suizid verhindert. Jonas glaubt, endlich einen echten Ansatzpunkt gefunden zu haben. Parallel verdichten sich in 2020 die Wege von Charlotte, Peter, Katharina und den Reisenden.'],
      ['6 · Ein unendlicher Kreis','Jonas spricht mit Michael. Dabei wird klar, dass Michael den Suizid noch gar nicht fest geplant hatte. Claudia erscheint und überzeugt beide, dass die bekannten Ereignisse stattfinden müssen. Jonas verursacht damit ungewollt die Ursache, die er verhindern wollte.'],
      ['7 · Der weiße Teufel','Claudia versucht, Egon zu retten, verursacht aber seinen Tod. Katharina versteht endgültig, dass Mikkel und Michael dieselbe Person sind. Die Figuren erkennen immer deutlicher, dass ihr Widerstand gegen das Schicksal häufig genau dieses Schicksal erzeugt.'],
      ['8 · Enden und Anfänge','Am 27. Juni 2020 öffnen sich die entscheidenden Portale. Clausen lässt die Fässer öffnen, die Apokalypse beginnt, Charlotte und Elisabeth berühren sich über einen Zeitspalt. Adam erschießt Martha. Unmittelbar danach erscheint eine andere Martha und sagt Jonas sinngemäß: Die Frage ist nicht nur wann, sondern aus welcher Welt.']
    ];
    eps2.forEach(e => { h2(s2.id, e[0]); absatz(s2.id, e[1]); });

    const s3 = seite(root.id, '5 · Staffel 3 (2020) — Folge für Folge', '3');
    h1(s3.id, 'Staffel 3: Zwei Welten sind noch nicht die ganze Wahrheit');
    const eps3 = [
      ['1 · Déjà-vu','Jonas kommt in einer Welt an, in der er selbst nie geboren wurde. Martha steht dort im Zentrum einer spiegelbildlichen Familienkonstellation. Viele Ereignisse ähneln Adams Welt, aber Rollen und Beziehungen sind verschoben.'],
      ['2 · Die Überlebenden','In Adams Welt leben die Bunker-Überlebenden nach der Apokalypse weiter. Katharina sucht Ulrich in 1987. In Evas Welt wird Jonas in die dortige Logik eingeführt und erkennt, dass Martha zu der Gegenspielerin Eva werden kann.'],
      ['3 · Adam und Eva','Eva erklärt ihr Ziel: Nicht Vernichtung, sondern Erhaltung des Knotens. Der Unbekannte — Kind von Jonas und Martha — erscheint in drei Altersstufen gleichzeitig und führt Aufgaben aus, die die Schleife sichern.'],
      ['4 · Der Ursprung','Jonas und Martha kommen sich näher und zeugen den Unbekannten. Die Serie enthüllt, dass er mit Agnes Tronte zeugt und dadurch ein zentraler Vorfahr der Nielsen-Linie ist. Was als „Ursprung“ präsentiert wird, ist jedoch noch nicht die äußerste Ursache.'],
      ['5 · Leben und Tod','In Evas Welt wird Jonas von einer älteren Martha erschossen; diese Version von Jonas wird niemals Adam. In Adams Welt sterben Peter und andere Figuren auf den bekannten Wegen. Die parallelen Abläufe zeigen, dass der Apokalypse-Moment mehrere Realitäten verzweigt.'],
      ['6 · Licht und Schatten','Adam und Eva bewegen Figuren gezielt wie Schachsteine. Martha wird in verschiedene Richtungen geschickt, sodass Versionen von ihr unterschiedliche Aufgaben erfüllen. Adam bereitet seinen Versuch vor, Martha und ihr ungeborenes Kind auszulöschen.'],
      ['7 · Zwischen der Zeit','Die Folge ordnet viele Lücken: Bartosz und Silja werden Eltern von Noah und Agnes; Charlotte wird von Charlotte und Elisabeth entführt und zu Tannhaus gebracht; Jonas altert zu Adam. Claudia arbeitet sich zwischen beide Welten und erkennt dabei einen Widerspruch um Regina.'],
      ['8 · Das Paradies','Claudia erklärt Adam die Ursprungswelt. Adam entscheidet diesmal anders und schickt Jonas zu Martha. Beide gelangen nach 1971 in Tannhaus’ ursprünglicher Welt und verhindern den Autounfall seiner Familie. Damit entfällt der Grund für Tannhaus’ Maschine; die zwei Knotenwelten lösen sich auf.']
    ];
    eps3.forEach(e => { h2(s3.id, e[0]); absatz(s3.id, e[1]); });

    const fam = seite(root.id, '6 · Familien & Figuren — wer ist wer?', '⌘');
    bild(fam.id, familieBild(), 'Vereinfachter Familienknoten');
    h1(fam.id, 'Kahnwald / Nielsen');
    punkt(fam.id, 'Jonas Kahnwald: Sohn von Michael/Mikkel und Hannah. Seine Lebensstufen sind Jonas → der Fremde → Adam.');
    punkt(fam.id, 'Mikkel Nielsen = Michael Kahnwald: Sohn von Ulrich und Katharina, Bruder von Martha und Magnus; 2019 nach 1986 versetzt, später Jonas’ Vater.');
    punkt(fam.id, 'Martha Nielsen in Adams Welt: Jonas’ große Liebe; sie wird von Adam am Tag der Apokalypse erschossen.');
    punkt(fam.id, 'Martha aus Evas Welt: Jonas’ Gegenstück; sie wird über mehrere Abzweigungen schließlich zu Eva und ist Mutter des Unbekannten.');
    punkt(fam.id, 'Der Unbekannte: namenloser Sohn von Jonas und Martha aus Evas Welt. Mit Agnes zeugt er Tronte und bindet damit Jonas/Martha an ihre eigene genealogische Voraussetzung zurück.');
    h1(fam.id, 'Tiedemann / Sic Mundus');
    punkt(fam.id, 'Bartosz Tiedemann: Sohn von Regina und Aleksander/Boris. Er reist 1888 mit Jonas, Magnus und Franziska zurück, wird Siljas Partner und Vater von Noah und Agnes.');
    punkt(fam.id, 'Claudia Tiedemann: zentrale Analytikerin des Knotens. Sie spielt Adam und Eva gegeneinander aus, weil sie einen Weg sucht, Regina zu retten. Sie entdeckt die Ursprungswelt.');
    punkt(fam.id, 'Silja: Tochter von Hannah und Egon Tiedemann; Partnerin von Bartosz; Mutter von Hanno/Noah und Agnes.');
    punkt(fam.id, 'Hanno Tauber / Noah: Sohn von Bartosz und Silja. Er glaubt lange an Adam, arbeitet mit Helge an der Zeitmaschine und wird mit Elisabeth Vater von Charlotte.');
    punkt(fam.id, 'Agnes: Tochter von Bartosz und Silja, Schwester Noahs; mit dem Unbekannten Mutter von Tronte Nielsen.');
    h1(fam.id, 'Doppler — die Mutter-Tochter-Schleife');
    punkt(fam.id, 'Charlotte Doppler und Peter Doppler sind Eltern von Franziska und Elisabeth.');
    punkt(fam.id, 'Elisabeth und Noah sind wiederum Eltern von Charlotte. Das heißt: Charlotte ist zugleich Elisabeths Mutter und Tochter; Elisabeth ist zugleich Charlottes Tochter und Mutter.');
    punkt(fam.id, 'Baby Charlotte wird 2041 von erwachsener Charlotte und Elisabeth entführt und 1971 zu H. G. Tannhaus gebracht. Dadurch hat sie innerhalb des Knotens keinen gewöhnlichen genealogischen Anfang.');
    h1(fam.id, 'Weitere Schlüsselpersonen');
    punkt(fam.id, 'H. G. Tannhaus: Uhrmacher und Autor. In den Knotenwelten baut er Geräte nach Plänen/Objekten, die aus der Zukunft zu ihm kommen. In der Ursprungswelt verursacht sein Versuch, die tote Familie zurückzuholen, die Entstehung der beiden Welten.');
    punkt(fam.id, 'Ulrich Nielsen: versucht, Helge als Kind zu töten und den Lauf zu ändern; genau dadurch wird der bekannte Lauf erfüllt.');
    punkt(fam.id, 'Katharina Nielsen: versucht Ulrich aus 1987 zu befreien und wird von ihrer Mutter Helene getötet. Der Anhänger, den sie trägt, gelangt später an den Strand und wird Teil einer weiteren geschlossenen Ursache-Wirkungs-Kette.');
    punkt(fam.id, 'Hannah Kahnwald: Mutter von Jonas; reist nach 1954, hat dort eine Beziehung mit Egon und wird Mutter von Silja.');
    punkt(fam.id, 'Regina Tiedemann: Claudias Tochter. Dass Regina in der Ursprungswelt existieren kann, hilft Claudia zu erkennen, dass sie nicht vom Knoten abstammen muss.');

    const mech = seite(root.id, '7 · Zeitreise-Regeln & Geräte', '⚙');
    bild(mech.id, geraeteBild(), 'Vom Höhlengang bis zur goldenen Kugel');
    h1(mech.id, '33 Jahre sind eine Eigenschaft bestimmter Wege — nicht des gesamten Universums');
    absatz(mech.id, 'Der Höhlengang verbindet anfangs Zeitpunkte in 33-Jahres-Abständen, passend zum wiederkehrenden Zyklus. Deshalb dominieren 1953, 1986 und 2019 sowie später 1921 und 2054/2053 die Wahrnehmung. Andere Maschinen können jedoch gezielter reisen.');
    h2(mech.id, 'Bunkerstuhl');
    absatz(mech.id, 'Noah und Helge testen eine frühe Maschine im Bunker. Die Konstruktion erzeugt zunächst tödlichen Druck beziehungsweise Energie um die Köpfe der Kinder. Erik, Yasin und Mads sterben; ihre Körper werden zeitlich versetzt. Spätere Fassungen schaffen eine lebende Übertragung.');
    h2(mech.id, 'Tannhaus-Gerät');
    absatz(mech.id, 'Die tragbare Messingmaschine entsteht selbst in einer Bootstrap-Schleife: Pläne, ein beschädigtes älteres Gerät und Wissen werden zu Tannhaus gebracht, damit er genau die Maschine baut, die später wieder in seine Werkstatt gelangt.');
    h2(mech.id, 'Gottespartikel / dunkle Materie');
    absatz(mech.id, 'Die schwarze, schwebende Materie kann als Portal stabilisiert werden. Sic Mundus besitzt eine frühe kontrollierte Form; in der Zukunft arbeitet Jonas jahrelang daran. Mit stabiler Kontrolle ist die Reise nicht mehr nur an die Höhlen-33-Jahres-Schritte gebunden.');
    h2(mech.id, 'Goldene Kugel');
    absatz(mech.id, 'Evas kugelförmiges Gerät kann nicht nur Zeiten, sondern auch Welten wechseln. Es ist deshalb entscheidend für die Bewegungen zwischen Adams und Evas Realität und am Ende für den Weg zur Ursprungswelt.');
    h2(mech.id, 'Bootstrap-Paradox');
    absatz(mech.id, 'Ein Objekt oder Wissen kann in einer Schleife existieren, ohne einen normalen „ersten Erfinder“ zu haben. Beispiele sind Tannhaus’ Buch/Pläne und die Lebensgeschichte von Charlotte innerhalb des Knotens. Die Ursache kommt aus der Zukunft, die Wirkung erzeugt später genau diese Ursache.');
    h2(mech.id, 'Der Schlupfwinkel der Apokalypse');
    absatz(mech.id, 'Für einen winzigen Moment der Apokalypse wird die normale Kette von Ursache und Wirkung unterbrochen. Eva nutzt diesen Augenblick, um dieselbe Person in unterschiedliche Handlungsrichtungen zu schicken. So können widersprüchlich wirkende Versionen gleichzeitig zum Gesamtzyklus gehören.');

    const worlds = seite(root.id, '8 · Adam, Eva und die Ursprungswelt', '∞');
    bild(worlds.id, weltenBild(), 'Die drei Welten');
    h1(worlds.id, 'Adam');
    absatz(worlds.id, 'Adam glaubt, dass menschliches Begehren die Schleife immer neu erzeugt. Er will den Knoten vernichten und meint lange, das ungeborene Kind von Jonas und Martha sei der Ursprung. Er manipuliert sein jüngeres Ich genau mit den Erfahrungen, die ihn selbst zu Adam gemacht haben.');
    h1(worlds.id, 'Eva');
    absatz(worlds.id, 'Eva will den Knoten erhalten, weil ihr Sohn, der Unbekannte, nur darin existiert. Sie kennt den Apokalypse-Schlupfwinkel und sorgt dafür, dass verschiedene Versionen Marthas unterschiedliche Wege nehmen. Ihr „Licht“ ist deshalb nicht moralisch gut; es ist das Gegenprojekt zu Adams Vernichtungsplan.');
    h1(worlds.id, 'Claudia');
    absatz(worlds.id, 'Claudia akzeptiert weder Adams noch Evas Ziel. Sie will vor allem Regina retten. Indem sie Informationen aus beiden Welten sammelt, ihre Gegenfigur ausschaltet und lange genug zwischen den Fraktionen arbeitet, erkennt sie: Manche Menschen sind Produkte der Schleife, andere nicht. Eine dritte Welt erklärt diesen Unterschied.');
    h1(worlds.id, 'Ursprungswelt');
    absatz(worlds.id, 'Hier gibt es den ursprünglichen Tannhaus und seine Familie. Der Tod von Marek, Sonja und Charlotte im Jahr 1971 ist der emotionale Auslöser. Tannhaus’ Maschine von 1986 erschafft aus seinem Rettungsversuch die beiden Knotenwelten. Der wahre Ursprung ist somit nicht eine Person im Stammbaum, sondern dieses Experiment.');

    const ende = seite(root.id, '9 · Das Ende vollständig erklärt', '✓');
    h1(ende.id, 'Warum Adams Plan nicht funktioniert');
    absatz(ende.id, 'Adam bündelt die Energie der Apokalypsen und vernichtet die schwangere Martha. Er erwartet, dass damit der Unbekannte — und somit alle von ihm abhängigen Abstammungsschleifen — nie existiert. Aber Adam greift nur einen Knoten innerhalb der zwei erzeugten Welten an. Die Ursache, die beide Welten überhaupt erzeugt, bleibt unberührt.');
    h1(ende.id, 'Was Claudia anders macht');
    absatz(ende.id, 'Claudia sucht nicht nur nach einem Ereignis im bekannten Stammbaum. Sie vergleicht beide Welten. Regina ist ihr entscheidender Hinweis: Regina kann unabhängig von den Zeitreise-Abstammungen existieren. Daraus entwickelt Claudia die Hypothese einer Welt außerhalb des Knotens und findet Tannhaus als Ursache der Spaltung.');
    h1(ende.id, 'Warum Jonas und Martha ausgewählt werden');
    absatz(ende.id, 'Adam nutzt den Schlupfwinkel und führt diesmal nicht den bekannten Ablauf fort. Er gibt Jonas die Möglichkeit, Martha aus Evas Welt herauszuholen. Die beiden bilden als Verbindung der zwei Knotenwelten das Paar, das den Weg in den Zwischenraum und anschließend zur Ursprungswelt nimmt.');
    h1(ende.id, '8. November 1971');
    absatz(ende.id, 'Jonas und Martha erscheinen vor Marek und Sonja. Sie überzeugen das Paar, nicht über die gefährliche Strecke weiterzufahren, sondern zu H. G. Tannhaus zurückzukehren. Der tödliche Unfall bleibt aus. Tannhaus erlebt damit nicht den Verlust, der ihn später zum Bau der Maschine treiben würde.');
    h1(ende.id, 'Warum sich so viele Figuren auflösen');
    absatz(ende.id, 'Ohne Tannhaus’ Experiment entstehen Adams und Evas Welt nicht. Wer nur durch Zeitreisen, Weltwechsel oder genealogische Schleifen existiert, hat in der Ursprungswelt keine Entstehungskette. Jonas, die beiden Marthas in ihrer Knotenform, der Unbekannte und große Teile der Nielsen-/Sic-Mundus-Abstammung verschwinden daher zusammen mit den Welten.');
    h1(ende.id, 'Die letzte Tischszene');
    absatz(ende.id, 'In der wiederhergestellten Ursprungswelt sitzen unter anderem Hannah, Katharina, Regina, Peter, Bernadette und Torben Wöller zusammen. Regina ist gesund. Während eines Stromausfalls beschreibt Hannah einen Traum von Dunkelheit und Auflösung und sagt später, „Jonas“ gefalle ihr als Name für ihr ungeborenes Kind. Die Serie lässt das als Echo beziehungsweise poetische Spur stehen; sie bestätigt keine wörtliche Wiedergeburt des bekannten Jonas.');
    hinweis(ende.id, 'Kurzform des Endes: Nicht Jonas muss „gewinnen“ und nicht Martha muss „verlieren“. Der Knoten endet, weil seine äußere Ursache — Tannhaus’ Trauer und sein Experiment — nie entsteht.');

    const faq = seite(root.id, '10 · Häufige Verwirrungen', '?');
    const fragen = [
      ['Ist Adam wirklich Jonas?','Ja. Adam ist eine sehr alte Version von Jonas aus Adams Welt. Der erwachsene „Fremde“ ist die Zwischenstufe.'],
      ['Ist Eva wirklich Martha?','Ja. Eva ist die alte Martha aus der zweiten Welt.'],
      ['Warum ist Jonas Marthas Neffe?','Martha ist Mikkels Schwester. Mikkel wird zu Michael und ist Jonas’ Vater. Damit ist Martha die Tante von Jonas.'],
      ['Wer ist der Unbekannte?','Der namenlose Sohn von Jonas und Martha aus Evas Welt. Er erscheint meist gleichzeitig als Kind, Erwachsener und alter Mann.'],
      ['Ist der Unbekannte der wahre Ursprung?','Nein. Er ist die zentrale genealogische Verbindung der beiden Welten, aber die Welten selbst entstehen durch Tannhaus’ Experiment in der Ursprungswelt.'],
      ['Warum kann Jonas zweimal unterschiedlich handeln?','Am Apokalypse-Moment bricht die normale Kausalität kurz auf. Dadurch entstehen zwei Varianten des Ablaufs, die Eva gezielt erhält.'],
      ['Warum tötet Adam Martha?','Er will Jonas den Schmerz geben, der ihn zu Adam formt, und später den vermeintlichen Ursprung vernichten. Beides ist Teil seiner falschen Theorie über den Knoten.'],
      ['Wer ist Charlottes Mutter?','Elisabeth. Gleichzeitig ist Charlotte Elisabeths Mutter. Ihre Abstammung ist ein Bootstrap-Paradox.'],
      ['Wer sind Noahs Eltern?','Bartosz Tiedemann und Silja. Silja ist die Tochter von Hannah und Egon.'],
      ['Warum kann Regina am Ende leben?','Ihre Existenz hängt nicht vom zentralen Zeitreise-Stammbaum ab. In der Ursprungswelt wird sie geboren, ohne dass der Knoten existieren muss.'],
      ['Was bedeutet Sic Mundus Creatus Est?','Der Satz wird als Name/Motto der Zeitreise-Gemeinschaft verwendet. In der Handlung steht Sic Mundus für Adams Organisation und deren Versuch, den Zyklus zu steuern.'],
      ['Ist 33 Jahre eine absolute Zeitreise-Regel?','Nein. Der Höhlengang und bestimmte Geräte nutzen den 33-Jahres-Rhythmus; spätere Technologie kann andere Daten und sogar andere Welten erreichen.']
    ];
    fragen.forEach(f => { h2(faq.id, f[0]); absatz(faq.id, f[1]); });

    const cards = seite(root.id, '11 · Lernkarten', '▣');
    h1(cards.id, 'Die wichtigsten Beziehungen zum Wiederholen');
    [
      ['Wer ist Michael Kahnwald wirklich?','Mikkel Nielsen, der 2019 nach 1986 reist und dort aufwächst.'],
      ['Wer sind Jonas’ Eltern?','Michael/Mikkel Kahnwald und Hannah Kahnwald.'],
      ['Wer wird aus Jonas?','Zuerst der erwachsene Fremde, später Adam.'],
      ['Wer wird aus Martha der zweiten Welt?','Eva.'],
      ['Wer ist der Unbekannte?','Der Sohn von Jonas und Martha aus Evas Welt.'],
      ['Mit wem zeugt der Unbekannte Tronte?','Mit Agnes.'],
      ['Wer sind Agnes’ Eltern?','Bartosz Tiedemann und Silja.'],
      ['Wer sind Noahs Eltern?','Bartosz Tiedemann und Silja.'],
      ['Wer ist Siljas Mutter?','Hannah; ihr Vater ist Egon Tiedemann.'],
      ['Wer sind Charlottes Eltern im Knoten?','Noah und Elisabeth.'],
      ['Wer ist Elisabeths Mutter?','Charlotte — die zugleich Elisabeths Tochter ist.'],
      ['Was geschieht am 27. Juni 2020 in Adams Welt?','Die Winden-Apokalypse.'],
      ['Was ist Claudias entscheidende Entdeckung?','Eine dritte Ursprungswelt existiert außerhalb von Adams und Evas Knoten.'],
      ['Was erzeugt Adams und Evas Welt?','Tannhaus’ fehlgeschlagenes Experiment in der Ursprungswelt 1986.'],
      ['Welches Ereignis verhindern Jonas und Martha im Finale?','Den tödlichen Autounfall von Marek, Sonja und Charlotte Tannhaus am 8. November 1971.'],
      ['Warum verschwindet der Knoten danach?','Ohne den Unfall baut Tannhaus die Maschine nicht; die zwei Knotenwelten werden nie erzeugt.']
    ].forEach(k => karte(cards.id, k[0], k[1]));

    const quellen = seite(root.id, '12 · Quellen, Rechte & offizielle Bilder', '↗');
    h1(quellen.id, 'Quellen für die Faktenprüfung');
    punkt(quellen.id, '[Netflix – offizielle Dark-Seite](https://www.netflix.com/de/title/80100172) — Staffeln, Folgen, Trailer und offizielle Kurzbeschreibungen.');
    punkt(quellen.id, '[Netflix Media Center – Dark](https://media.netflix.com/en/only-on-netflix/80100172) — offizielle Serien-/Staffel-Informationen.');
    punkt(quellen.id, '[Offizieller Dark Guide](https://dark.netflix.io/) — Netflix’ interaktive Figuren-, Zeit- und Weltenübersicht.');
    punkt(quellen.id, '[Wikipedia – Dark](https://de.wikipedia.org/wiki/Dark_(Fernsehserie)) — Veröffentlichungsdaten, Episodenübersicht und Handlungsabgleich.');
    h1(quellen.id, 'Warum hier keine Netflix-Screenshots stecken');
    absatz(quellen.id, 'Dieses Redion-Fach soll offline funktionieren und sauber weitergegeben werden können. Deshalb enthält es ausschließlich eigene Schaubilder und redaktionelle Zusammenfassungen. Offizielle Standbilder, Poster und Trailer bleiben bei Netflix und werden nur verlinkt.');
    h1(quellen.id, 'Stand');
    absatz(quellen.id, 'Redaktioneller Stand: 30. September 2026. Inhalt umfasst alle 3 Staffeln / 26 Folgen und ist ausdrücklich als vollständige Spoiler-Erklärung gedacht.');

    trenn(root.id);
    absatz(root.id, 'Empfohlene Reihenfolge: Schnellorientierung → Chronologische Zeitlinie → Staffeln → Familien → Zeitreise-Regeln → Welten → Ende → Lernkarten.');
    return root;
  };

  if (typeof Register !== 'undefined' && Register.vorlagen && Register.vorlagen.melde) {
    Register.vorlagen.melde({
      id: 'dark-2017-dossier',
      icon: '◌',
      name: 'Dark (2017–2020) — komplette Zeitreise erklärt',
      text: 'Vollständiges Serienfach mit Zeitlinie, allen 26 Folgen, Familienknoten, Zeitreise-Regeln, drei Welten, Finale, eigenen Schaubildern und Lernkarten.',
      quelle: 'Netflix / Netflix Media Center; redaktionell zusammengefasst, eigene Diagramme',
      bauen,
    });
  }

  return { bauen };
})();
