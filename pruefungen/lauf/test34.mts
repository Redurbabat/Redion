import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const f: any[] = []; p.on('pageerror', e => f.push('PAGEERROR: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/11434|CONNECTION_REFUSED|ERR_/i.test(m.text())) f.push('CONSOLE: ' + m.text()); });
  const pruef: any[] = []; const ok = (n: any, x: any) => pruef.push([n, !!x]);

  /* Was von einer Spalte hier gelesen wird — `Object.values` eines formlosen
     Schemas gibt sonst `unknown` zurück. */
  type Spalte = { name?: string; type?: string };

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1800);
  /* KEIN ERSTBESUCHER — das Willkommen wegräumen (E55).
     Seit §11 legt sich beim allerersten Öffnen ein Blatt über den ganzen
     Bildschirm. Für den, der Redion zum ersten Mal sieht, ist das richtig;
     hier misst niemand zum ersten Mal, und Playwright wartet dann
     sechzig Sekunden darauf, dass ein Knopf darunter anklickbar wird. */
  await p.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.getElementById('rg-willkommen')?.remove();
    /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
       über alles und fängt Klicks ab (E132). */
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-einladung')?.remove();
  });

  /* ================================================================== *
   * 1) REITERLEISTE DER SEITENLEISTE
   * ================================================================== */
  const reiter = await p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('#side-reiter .sr')].map(x => ({ id: x.dataset.reiter, txt: x.textContent })));
  console.log('   Reiter:', JSON.stringify(reiter.map(r => r.id)));
  /* DREI, NICHT FÜNF (E206).
     Fünf waren es, und zwei davon waren keine Reiter: `suche` rief `suche()`
     und sprang sofort auf `start` zurück, `inbox` rief `Ansichten.posteingang()`
     und ebenso — wortwörtlich dasselbe wie die Zeilen „Suchen" und
     „Posteingang" acht Zeilen tiefer, nur als Zeichen.

     Ein Reiter ist hier etwas, das den BAUM darunter umschaltet. Das tun
     genau drei: `start` den Seitenbaum, `chat` die Agentenliste
     (`KI.seitenleiste`), `bespr` die Besprechungen (`Meeting.seitenleiste`).
     Genau das prüft der zweite Punkt jetzt auch — vorher stand dort nur eine
     Namensliste, die auch dann grün geblieben wäre, wenn ein Reiter gar
     nichts mehr umschaltet. */
  ok('Drei Reiter, und jeder schaltet den Baum um', reiter.length === 3);
  ok('Start, Chat, Besprechungen',
     ['start', 'chat', 'bespr'].every((x, i) => reiter[i]?.id === x));
  ok('Start ist zuerst aktiv', await p.evaluate(() =>
    !!document.querySelector('.sr[data-reiter="start"]')?.classList.contains('on')));

  /* ================================================================== *
   * 2) ABSCHNITTE ANPASSEN
   * ================================================================== */
  await p.evaluate(() => App.abschnitteAnpassen());
  await p.waitForTimeout(500);
  const anpass = await p.evaluate(() => ({
    zeilen: [...document.querySelectorAll<HTMLElement>('.side-item.anpass')].map(x => (x.textContent ?? '').replace(/[⌄›]/g, '')),
    fertig: !!document.querySelector('.anpass-fertig'),
    ueber: [...document.querySelectorAll<HTMLElement>('.side-section span')].some(x => (x.textContent ?? '').startsWith('Abschnitte anpassen'))
  }));
  console.log('   Anpassmodus:', JSON.stringify(anpass.zeilen.map(x => x.replace(/[👁🚫🏷]/g, '').trim())));
  ok('Anpassmodus listet alle Abschnitte', anpass.zeilen.length === 10);   /* 8 Abschnitte + Tab-Namen + Zuruecksetzen */
  ok('Jeder Abschnitt hat ein Auge', anpass.zeilen.filter(x => /👁|🚫/.test(x)).length === 8);
  ok('Tab-Namen ausblenden steht dabei', anpass.zeilen.some(x => /Tab-Namen/.test(x)));
  ok('Erledigt-Knopf ist da', anpass.fertig);
  ok('Überschrift stimmt', anpass.ueber);

  /* Einen Abschnitt ausschalten.

     KEIN FESTER NAME MEHR. Hier stand zuerst „agenten", dann „Werkzeuge",
     dann „Kürzlich verwendet" — und jedes Mal, wenn ein Abschnitt ins
     Menüband umzog (E210, E211), wurde die Prüfung rot, ohne dass etwas
     kaputt war. Sie prüft ja nicht diesen einen Abschnitt, sondern die
     Regel: ein ausgeschalteter verschwindet, die anderen bleiben, und
     wieder einschalten holt ihn zurück.

     Also wird genommen, was GERADE dasteht — der erste sichtbare Abschnitt.
     Damit hält der Punkt jede künftige Umsortierung aus und misst weiter
     das, was er messen soll. */
  /* ERST DEN ANPASSMODUS VERLASSEN. Darin zeichnet die Seitenleiste ihre
     Abschnitte als `.side-item.anpass` und nicht als `.side-section` — die
     Messung kam sonst leer zurück und meldete „kein Abschnitt da", obwohl
     vier dastanden. */
  await p.evaluate(() => App.abschnitteAnpassen());
  await p.waitForTimeout(400);
  const sichtbareAbschnitte = await p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.side-section span')]
      .map(x => (x.textContent ?? '').replace(/[⌄›]/g, '').trim())
      .filter(t => t && !t.startsWith('Abschnitte anpassen')));
  const kennungVon: Record<string, string> = {
    'Werkzeuge': 'werkzeuge', 'Agenten': 'agenten', 'Besprechungen': 'bespr',
    'Kürzlich verwendet': 'kuerzlich', 'Favoriten': 'favoriten',
    'Bereiche': 'bereiche', 'Privat': 'privat', 'Meine Apps': 'apps'
  };
  const opfer = sichtbareAbschnitte.find(t => kennungVon[t]) ?? '';
  const opferId = kennungVon[opfer] ?? '';
  console.log('   Sichtbare Abschnitte:', JSON.stringify(sichtbareAbschnitte), '→ schalte aus:', opfer);
  ok('Es gibt einen sichtbaren Abschnitt zum Ausschalten', !!opferId);

  await p.evaluate((id: string) => App.abschnittSchalten(id), opferId);
  await p.waitForTimeout(500);
  const nachSchalten = await p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.side-section span')].map(x => (x.textContent ?? '').replace(/[⌄›]/g, '')));
  console.log('   Abschnitte jetzt:', JSON.stringify(nachSchalten));
  ok('Ausgeschalteter Abschnitt verschwindet', !nachSchalten.some(t => t.trim() === opfer));
  /* Die anderen bleiben — geprüft an ihrer ANZAHL und nicht an einem Namen:
     genau einer weniger, nicht zwei und nicht null. */
  const nochDa = nachSchalten.map(t => t.trim()).filter(t => t && kennungVon[t]);
  ok('Die anderen bleiben', nochDa.length === sichtbareAbschnitte.length - 1);

  await p.evaluate((id: string) => App.abschnittSchalten(id), opferId);
  await p.waitForTimeout(400);
  ok('Wieder einschalten bringt ihn zurück', await p.evaluate((n: string) =>
    [...document.querySelectorAll<HTMLElement>('.side-section span')]
      .some(x => (x.textContent ?? '').startsWith(n)), opfer));

  /* Tab-Namen ausblenden */
  await p.evaluate(() => { Store.setMeta('tabNamen', false); App.zeichneBaum(); });
  await p.waitForTimeout(400);
  ok('Tab-Namen lassen sich ausblenden', await p.evaluate(() =>
    !!document.getElementById('side-reiter')?.classList.contains('ohne-namen')));
  await p.evaluate(() => { Store.setMeta('tabNamen', true); App.zeichneBaum(); });

  /* ================================================================== *
   * 3) CHAT-REITER
   * ================================================================== */
  await p.evaluate(() => {
    Store.setMeta('chats', [
      { id: 'c1', titel: 'Formel für Kalorien', verlauf: [{ role: 'user', content: 'Formel?' },
        { role: 'assistant', content: 'So geht es.' }], wann: new Date().toISOString(), angeheftet: false },
      { id: 'c2', titel: 'Alte Frage', verlauf: [], wann: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: 'c3', titel: 'Wichtiges', verlauf: [], wann: new Date().toISOString(), angeheftet: true }
    ]);
    App.reiterWechseln('chat');
  });
  await p.waitForTimeout(600);

  /* UND DIE MARKIERUNG WANDERT MIT.
     Seit E236 leuchtet „Start" auch dann, wenn der ORT ein anderer ist —
     Dokumente, Lernen, Mehr —, weil der Baum darunter der Seitenbaum ist.
     Ohne diesen Punkt hier wäre „immer Start" eine grüne Prüfung, und
     genau das wäre der Fehler: schaltet man auf Chat, steht unten die
     Agentenliste, und dann muss auch „Chat" leuchten. */
  const markiert = await p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('#side-reiter .sr')]
      .filter(x => x.classList.contains('on')).map(x => x.dataset.reiter));
  ok('Auf Chat leuchtet genau „Chat"',
     markiert.length === 1 && markiert[0] === 'chat');

  const chat = await p.evaluate(() => ({
    agenten: [...document.querySelectorAll<HTMLElement>('.ki-agenten button')].map(x => (x.textContent ?? '').replace(/[⌄›]/g, '')),
    gruppen: [...document.querySelectorAll<HTMLElement>('.side-section span')].map(x => (x.textContent ?? '').replace(/[⌄›]/g, '')),
    chats: [...document.querySelectorAll<HTMLElement>('.ki-chat .kc-txt')].map(x => x.firstChild?.textContent),
    hatPin: !!document.querySelector('.ki-pin'),
    hatWeg: !!document.querySelector('.ki-weg')
  }));
  console.log('   Chat-Reiter:', JSON.stringify(chat));
  ok('Agentenbilder oben', chat.agenten.length >= 2);
  ok('Neuer Agent zum Anlegen', chat.agenten.some(x => /Neuer Agent/.test(x)));
  ok('Verlauf nach Tagen gruppiert',
     (chat.gruppen ?? '').includes('Angeheftet') && (chat.gruppen ?? '').includes('Heute') &&
     (chat.gruppen ?? '').includes('Diese Woche'));
  ok('Alle drei Chats stehen da', chat.chats.length === 3);
  ok('Angeheftetes zuerst', chat.chats[0] === 'Wichtiges');
  ok('Anheften und Löschen je Zeile', chat.hatPin && chat.hatWeg);

  /* Chat öffnen lädt den Verlauf */
  await p.evaluate(() => KI.chatOeffnen('c1'));
  await p.waitForTimeout(600);
  const geladen = await p.evaluate(() => ({
    offen: !!document.getElementById('ai')?.classList.contains('open'),
    nachrichten: document.querySelectorAll('#chat .msg').length,
    id: KI.zustand.chatId
  }));
  console.log('   Chat geöffnet:', JSON.stringify(geladen));
  ok('Klick öffnet das KI-Panel mit dem Verlauf',
     geladen.offen && geladen.nachrichten === 2 && geladen.id === 'c1');

  /* Anheften umschalten */
  await p.evaluate(() => KI.chatAnheften('c1'));
  await p.waitForTimeout(400);
  ok('Anheften wirkt', await p.evaluate(() =>
    (Store.getMeta('chats', []) || []).find((c: any) => c.id === 'c1')?.angeheftet === true));

  /* Neuer Chat leert */
  await p.evaluate(() => KI.neuerChat());
  await p.waitForTimeout(500);
  ok('Neuer Chat fängt leer an', await p.evaluate(() =>
    KI.zustand.chatId === '' && document.querySelectorAll('#chat .msg').length === 0));

  /* Löschen */
  await p.evaluate(() => KI.chatLoeschen('c2'));
  await p.waitForTimeout(300);
  ok('Chat löschen wirkt', await p.evaluate(() =>
    (Store.getMeta('chats', []) || []).length === 2));

  /* ================================================================== *
   * 4) BESPRECHUNGS-REITER
   * ================================================================== */
  await p.evaluate(() => App.reiterWechseln('bespr'));
  await p.waitForTimeout(600);
  const bespr = await p.evaluate(() => ({
    gruppen: [...document.querySelectorAll<HTMLElement>('.side-section span')].map(x => (x.textContent ?? '').replace(/[⌄›]/g, '')),
    text: document.getElementById('tree')?.textContent ?? ''
  }));
  console.log('   Besprechungen:', JSON.stringify(bespr.gruppen));
  ok('Bevorstehend und Heute', (bespr.gruppen ?? '').includes('Bevorstehend') && (bespr.gruppen ?? '').includes('Heute'));
  ok('Neue Meeting-Notiz zum Anlegen', /Neue Meeting-Notiz/.test(bespr.text ?? ''));
  ok('Bevorstehende Termine erscheinen', /📌/.test(bespr.text ?? ''));

  /* Ohne Termine steht der Weg zum Kalender da */
  const leerText = await p.evaluate(() => {
    const echt = App.kommendeTermine;
    App.kommendeTermine = () => [];
    App.zeichneBaum();
    const t = document.getElementById('tree')?.textContent ?? '';
    App.kommendeTermine = echt;
    App.zeichneBaum();
    return t;
  });
  ok('Ohne Termine wird der Kalender angeboten', /Verbinde deinen Kalender/.test(leerText));

  await p.evaluate(() => App.reiterWechseln('start'));
  await p.waitForTimeout(400);

  /* ================================================================== *
   * 5) KI-EINGABELEISTE: MODUS, FÄHIGKEITEN, PERSONALISIEREN
   * ================================================================== */
  await p.evaluate(() => App.kiPanel(true));
  await p.waitForTimeout(500);

  const leiste = await p.evaluate(() => ({
    knoepfe: [...document.querySelectorAll<HTMLElement>('.ai-leiste button')].map(x => x.id),
    modus: document.getElementById('ai-modus')?.textContent,
    /* `#ai-input` ist ein <textarea> — siehe index.html. */
    platzhalter: document.querySelector<HTMLTextAreaElement>('#ai-input')?.placeholder
  }));
  console.log('   KI-Leiste:', JSON.stringify(leiste));
  ok('Sechs Knöpfe unter dem Feld', leiste.knoepfe.length === 6);
  ok('Modus steht auf Standard', leiste.modus === 'Standard');
  ok('Platzhalter wie bei Notion', /Mach alles mit KI/.test(leiste.platzhalter ?? ''));

  /* Shift+Tab wechselt den Modus */
  await p.click('#ai-input');
  await p.keyboard.press('Shift+Tab');
  await p.waitForTimeout(400);
  const nachTab = await p.evaluate(() => ({ knopf: document.getElementById('ai-modus')?.textContent,
                                            zustand: KI.zustand.modus }));
  console.log('   Nach Shift+Tab:', JSON.stringify(nachTab));
  ok('Shift+Tab schaltet auf Fragen', nachTab.knopf === 'Fragen' && nachTab.zustand === 'fragen');
  await p.keyboard.press('Shift+Tab');
  await p.waitForTimeout(300);
  ok('Nochmal zurück auf Standard', await p.evaluate(() => KI.zustand.modus === 'standard'));

  /* Modusmenü */
  await p.click('#ai-modus');
  await p.waitForTimeout(400);
  const modusMenu = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    if (!m) return null;
    const r = { eintraege: [...m.querySelectorAll<HTMLElement>('[data-m]')].map(x => (x.textContent ?? '').replace(/[⌄›]/g, '')),
                fuss: m.querySelector('.menu-fuss')?.textContent };
    m.remove();
    return r;
  });
  console.log('   Modusmenü:', JSON.stringify(modusMenu));
  ok('Standard und Fragen mit Erklärung',
     /Kann suchen, bearbeiten/.test(modusMenu?.eintraege[0] ?? '') &&
     /Nur Antworten, keine Änderungen/.test(modusMenu?.eintraege[1] ?? ''));
  ok('Der Tipp mit Shift+Tab steht da', /Shift \+ Tab/.test(modusMenu?.fuss || ''));

  /* Plus-Menü */
  await p.click('#ai-plus');
  await p.waitForTimeout(400);
  const plusMenu = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    if (!m) return [];
    const r = [...m.querySelectorAll<HTMLElement>('[data-x]')].map(x => (x.textContent ?? '').replace(/[⌄›]/g, ''));
    m.remove();
    return r;
  });
  console.log('   Plus-Menü:', JSON.stringify(plusMenu));
  ok('Dateien, Erwähnen, Bild',
     plusMenu.length === 3 && /Fotos und Dateien/.test(plusMenu[0] ?? '') &&
     /erwähnen/.test(plusMenu[1] ?? '') && /Bild erstellen/.test(plusMenu[2] ?? ''));

  /* Fähigkeiten */
  await p.click('#ai-faehig');
  await p.waitForTimeout(500);
  const faehig = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    if (!m) return null;
    const r = { eintraege: [...m.querySelectorAll<HTMLElement>('[data-f]')].map(x => (x.textContent ?? '').replace(/[⌄›]/g, '')),
                suche: !!m.querySelector('.menu-suche input'),
                fuss: m.querySelector('.menu-fuss')?.textContent };
    m.remove();
    return r;
  });
  console.log('   Fähigkeiten:', JSON.stringify(faehig?.eintraege));
  ok('Die vier Notion-Fähigkeiten sind da',
     faehig?.eintraege.some(x => /Schreibstil verbessern/.test(x)) &&
     faehig.eintraege.some(x => /Korrekturlesen/.test(x)) &&
     faehig.eintraege.some(x => /Erklären/.test(x)) &&
     faehig.eintraege.some(x => /Neu formatieren/.test(x)));
  ok('Fähigkeit hinzufügen und verwalten',
     faehig?.eintraege.some(x => /hinzufügen/.test(x)) && faehig.eintraege.some(x => /verwalten/.test(x)));
  ok('Menü hat Suche und @-Hinweis', faehig?.suche && /@/.test(faehig.fuss || ''));

  /* Eigene Fähigkeit anlegen */
  await p.evaluate(() => KI.faehigkeitSichern({ id: 'eigen1', icon: '🎯', name: 'Auf den Punkt',
                                                auftrag: 'Kürze auf einen Satz.' }));
  await p.waitForTimeout(300);
  ok('Eigene Fähigkeit wird gemerkt', await p.evaluate(() =>
    KI.faehigkeiten().some((x: any) => x.name === 'Auf den Punkt')));
  await p.evaluate(() => KI.faehigkeitLoeschen('eigen1'));
  ok('Und lässt sich wieder löschen', await p.evaluate(() =>
    !KI.faehigkeiten().some((x: any) => x.name === 'Auf den Punkt')));

  /* Personalisieren */
  await p.evaluate(() => KI.personalisieren());
  await p.waitForTimeout(500);
  const pers = await p.evaluate(() => ({
    feld: !!document.getElementById('pers-name'),
    gesichter: document.querySelectorAll('.pers-gitter button').length,
    anweisung: !!document.getElementById('pers-anw')
  }));
  console.log('   Personalisieren:', JSON.stringify(pers));
  ok('Name, Gesichter und Anweisungen', pers.feld && pers.gesichter >= 10 && pers.anweisung);

  await p.fill('#pers-name', 'Ada');
  await p.evaluate(() => {
    document?.querySelector<HTMLElement>('.pers-gitter [data-g="🦉"]')?.click();
  });
  await p.waitForTimeout(300);
  await p.fill('#pers-name', 'Ada');
  await p.fill('#pers-anw', 'Antworte immer knapp.');
  await p.evaluate(() => document.querySelector<HTMLElement>('[data-a="ok"]')?.click());
  await p.waitForTimeout(500);
  const gemerkt = await p.evaluate(() => ({
    persona: KI.persona(),
    anweisung: Store.getMeta('ki:persoenlich', ''),
    kopf: document.querySelector('.ai-head b')?.textContent
  }));
  console.log('   Gemerkt:', JSON.stringify(gemerkt));
  ok('Name und Gesicht werden übernommen',
     gemerkt.persona.name === 'Ada' && gemerkt.persona.gesicht === '🦉');
  ok('Anweisungen werden mitgespeichert', gemerkt.anweisung === 'Antworte immer knapp.');
  ok('Der Kopf trägt den neuen Namen', /Ada/.test(gemerkt.kopf || ''));

  /* ================================================================== *
   * 6) DATENBANK: UNTER-ELEMENTE
   * ================================================================== */
  const seite = await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Projektplan' });
    const { collectionId } = Store.addDatabase(s.id, 'Schritte', {
      name:   { name: 'Name', type: 'title' },
      status: { name: 'Status', type: 'status',
                options: [{ name: 'Offen', color: 'gray' }, { name: 'Fertig', color: 'green' }] }
    }, 'table');
    ['Konzept', 'Umsetzung', 'Abnahme'].forEach(t => {
      const r = Store.addRow(collectionId, {});
      Store.updateBlock(r.id, { text: t, props: { status: 'Offen' } });
    });
    App.oeffne(s.id);
    return { seite: s.id, coll: collectionId };
  });
  await p.waitForTimeout(700);

  await p.evaluate((c) => {
    const coll = Store.getCollection(c);
    Datenbank.unterElementeAn(coll, true);
  }, seite.coll);
  await p.waitForTimeout(500);

  const unterAn = await p.evaluate((c) => {
    const coll = Store.getCollection(c);
    return { an: !!coll.unterElemente,
             spalten: Object.values<Spalte>(coll.schema).map(d => d.name),
             sichtbar: [...document.querySelectorAll<HTMLElement>('th')].map(x => (x.textContent ?? '').trim()) };
  }, seite.coll);
  console.log('   Unter-Elemente:', JSON.stringify(unterAn));
  ok('Unter-Elemente lassen sich einschalten', unterAn.an);
  ok('Zwei Spalten kommen dazu',
     (unterAn.spalten ?? '').includes('Übergeordnetes Element') &&
     (unterAn.spalten ?? '').includes('Untergeordnete Elemente'));
  ok('Die bleiben aus der Tabelle heraus',
     !unterAn.sichtbar.some(x => /Übergeordnetes/.test(x)));

  /* Unterelement anlegen */
  await p.evaluate((c) => {
    const eltern = Store.rowsOf(c)[0];
    const k = Store.addRow(c, {});
    Store.updateBlock(k.id, { unterVon: eltern.id, text: 'Skizze zeichnen' });
    Store.setProp(eltern.id, 'unterKinder', [k.id]);
    Store.setProp(k.id, 'unterEltern', [eltern.id]);
    App.zeichneSeite();
  }, seite.coll);
  await p.waitForTimeout(600);

  const baum = await p.evaluate(() => ({
    zeilen: [...document.querySelectorAll<HTMLElement>('tbody tr')].map(x => ({
      text: x.querySelector('.tt-t')?.textContent,
      unter: x.classList.contains('unterzeile'),
      klapp: !!x.querySelector('.tt-klapp:not(.leer)'),
      anzahl: x.querySelector('.tt-anzahl')?.textContent
    }))
  }));
  console.log('   Baum:', JSON.stringify(baum.zeilen));
  ok('Unterzeile hängt unter der Hauptzeile',
     baum.zeilen[1] && baum.zeilen[1].text === 'Skizze zeichnen' && baum.zeilen[1].unter);
  ok('Die Elternzeile bekommt einen Schalter', baum.zeilen[0]?.klapp);
  ok('Und zeigt die Anzahl', baum.zeilen[0]?.anzahl === '1');

  /* Zuklappen */
  await p.evaluate(() => document.querySelector<HTMLElement>('.tt-klapp:not(.leer)')?.click());
  await p.waitForTimeout(500);
  ok('Zuklappen versteckt die Unterzeile', await p.evaluate(() =>
    ![...document.querySelectorAll<HTMLElement>('.tt-t')].some(x => x.textContent === 'Skizze zeichnen')));
  await p.evaluate(() => document.querySelector<HTMLElement>('.tt-klapp:not(.leer)')?.click());
  await p.waitForTimeout(400);
  ok('Aufklappen bringt sie zurück', await p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.tt-t')].some(x => x.textContent === 'Skizze zeichnen')));

  /* ================================================================== *
   * 7) ABHÄNGIGKEITEN
   * ================================================================== */
  await p.evaluate((c) => Datenbank.abhaengigkeitenAn(Store.getCollection(c), true), seite.coll);
  await p.waitForTimeout(500);
  const abh = await p.evaluate((c) => {
    const coll = Store.getCollection(c);
    const rows = Store.rowsOf(c);
    /* Abnahme wartet auf Umsetzung */
    Store.setProp(rows[2].id, 'abhBlockiertVon', [rows[1].id]);
    Store.setProp(rows[1].id, 'abhBlockiert', [rows[2].id]);
    App.zeichneSeite();
    return { spalten: Object.values<Spalte>(coll.schema).map(d => d.name),
             wartet: Datenbank.blockiertDurch(Store.getBlock(rows[2].id), coll).map((x: any) => x.text) };
  }, seite.coll);
  await p.waitForTimeout(500);
  console.log('   Abhängigkeiten:', JSON.stringify(abh));
  ok('Blockiert und Blockiert von entstehen',
     (abh.spalten ?? '').includes('Blockiert') && (abh.spalten ?? '').includes('Blockiert von'));
  ok('Eine offene Vorgängerzeile blockiert', (abh.wartet ?? '').includes('Umsetzung'));
  ok('Die Zeile zeigt die Sanduhr', await p.evaluate(() =>
    !!document.querySelector('.tt-blockiert')));

  /* Vorgänger fertig → nicht mehr blockiert */
  await p.evaluate((c) => {
    const rows = Store.rowsOf(c);
    Store.setProp(rows[1].id, 'status', 'Fertig');
    App.zeichneSeite();
  }, seite.coll);
  await p.waitForTimeout(500);
  ok('Ist der Vorgänger fertig, verschwindet die Warnung', await p.evaluate(() =>
    !document.querySelector('.tt-blockiert')));

  /* ================================================================== *
   * 8) ARCHIV UND SPERRE
   * ================================================================== */
  await p.evaluate((c) => {
    const rows = Store.rowsOf(c);
    Store.updateBlock(rows[0].id, { archiviert: true });
    App.zeichneSeite();
  }, seite.coll);
  await p.waitForTimeout(500);
  const archiv1 = await p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.tt-t')].map(x => (x.textContent ?? '').replace(/[⌄›]/g, '')));
  console.log('   Nach Archivieren:', JSON.stringify(archiv1));
  ok('Archiviertes verschwindet aus der Ansicht', !(archiv1 ?? '').includes('Konzept'));

  await p.evaluate((c) => {
    const v = Object.values(Store.cache.views).find(x => x.collectionId === c);
    Store.updateView(v.id, { archivZeigen: true });
    App.zeichneSeite();
  }, seite.coll);
  await p.waitForTimeout(500);
  const archiv2 = await p.evaluate(() => ({
    texte: [...document.querySelectorAll<HTMLElement>('.tt-t')].map(x => (x.textContent ?? '').replace(/[⌄›]/g, '')),
    markiert: !!document.querySelector('.tt-archiv'),
    zeile: !!document.querySelector('tr.archivzeile')
  }));
  console.log('   Archiv sichtbar:', JSON.stringify(archiv2));
  ok('„Archivierte Seiten anzeigen" holt sie zurück', (archiv2.texte ?? '').includes('Konzept'));
  ok('Sie sind als archiviert erkennbar', archiv2.markiert && archiv2.zeile);

  await p.evaluate((c) => {
    Store.updateCollection(c, { gesperrt: true });
    App.zeichneSeite();
  }, seite.coll);
  await p.waitForTimeout(400);
  await p.evaluate(() => {
    const th = [...document.querySelectorAll<HTMLElement>('th')].find(x => (x.textContent ?? '').includes('Status'));
    th?.click();
  });
  await p.waitForTimeout(400);
  ok('Gesperrt lässt kein Spaltenmenü zu', await p.evaluate(() =>
    !document.querySelector('.menu .sp-name')));
  await p.evaluate((c) => Store.updateCollection(c, { gesperrt: false }), seite.coll);

  /* ================================================================== *
   * 9) IN AUFGABEN UMWANDELN
   * ================================================================== */
  await p.evaluate((c) => {
    const coll = Store.getCollection(c);
    coll.istAufgaben = true;
    if (!Object.values<Spalte>(coll.schema).some(d => d.type === 'person'))
      coll.schema.aufgWer = { name: 'Zuständig', type: 'person' };
    Store.updateCollection(c, { schema: coll.schema, istAufgaben: true });
    const rows = Store.rowsOf(c);
    const wer = (Konten.aktiv() || {}).name || 'Ich';
    Store.setProp(rows[2].id, 'aufgWer', wer);
  }, seite.coll);
  await p.waitForTimeout(400);
  const aufg = await p.evaluate(() => Bibliothek.meineAufgaben().map(a => a.titel));
  console.log('   Meine Aufgaben:', JSON.stringify(aufg));
  ok('Umgewandelte Datenbank liefert Aufgaben', (aufg ?? '').includes('Abnahme'));

  /* ================================================================== *
   * 10) NEUE EINSTELLUNGSBEREICHE
   * ================================================================== */
  await p.evaluate(() => Einstellungen.oeffne('analysen'));
  await p.waitForTimeout(700);
  const analysen = await p.evaluate(() => ({
    kacheln: [...document.querySelectorAll<HTMLElement>('.an-kachel')].map(x => (x.textContent ?? '').replace(/[⌄›]/g, '')),
    balken: document.querySelectorAll('.an-balken i').length,
    titel: document.querySelector('.ez-kopf h2, .ez-titel, h2')?.textContent
  }));
  console.log('   Analysen:', JSON.stringify(analysen.kacheln));
  ok('Analysen zeigt sechs Kacheln', analysen.kacheln.length === 6);
  ok('Seiten, Blöcke, Datenbanken dabei',
     analysen.kacheln.some(x => /Seiten/.test(x)) &&
     analysen.kacheln.some(x => /Blöcke/.test(x)) &&
     analysen.kacheln.some(x => /Datenbanken/.test(x)));
  ok('Balken für die letzten Tage', analysen.balken >= 1);

  await p.evaluate(() => Einstellungen.oeffne('verifiziert'));
  await p.waitForTimeout(600);
  const verif = await p.evaluate(() => document.body?.textContent);
  ok('Verifizierte Seiten erklärt sich', /geprüfte Seite trägt oben ein Häkchen/.test(verif));

  await p.evaluate(() => {
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    const s = Store.addPage(null, { text: 'Zu prüfen' });
    App.oeffne(s.id);
  });
  await p.waitForTimeout(500);
  await p.evaluate(() => Einstellungen.oeffne('verifiziert'));
  await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector<HTMLElement>('[data-tun="pruef-setzen"]')?.click());
  await p.waitForTimeout(600);
  const geprueft = await p.evaluate(() => {
    const p2 = Store.getBlock(App.aktuelleSeite());
    return { an: !!p2.geprueft, von: p2.geprueftVon, bis: !!p2.gepruefBis };
  });
  console.log('   Prüfung:', JSON.stringify(geprueft));
  ok('Seite lässt sich als geprüft markieren', geprueft.an && geprueft.bis);

  await p.evaluate(() => Einstellungen.oeffne('worker'));
  await p.waitForTimeout(600);
  const worker = await p.evaluate(() => {
    const t = document.body?.textContent;
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    return { erklaert: /eigenen Faden/.test(t), grenze: /Zeitgrenze/.test(t) };
  });
  ok('Worker-Bereich erklärt den Sandkasten', worker.erklaert && worker.grenze);

  const bereiche = await p.evaluate(() => Einstellungen.BEREICHE.map(b2 => b2[0]));
  console.log('   Bereiche:', bereiche.length, JSON.stringify(bereiche));
  ok('Jetzt 19 Bereiche', bereiche.length === 19);
  ok('Analysen, Worker und Verifizierte Seiten dabei',
     ['analysen', 'worker', 'verifiziert'].every(x => (bereiche ?? '').includes(x)));

  /* Hoher Kontrast */
  await p.evaluate(() => { Store.setMeta('kontrast', true); Einstellungen.anwenden(); });
  await p.waitForTimeout(400);
  ok('Hoher Kontrast wirkt auf den Körper', await p.evaluate(() =>
    document.body?.classList.contains('kontrast')));
  await p.evaluate(() => { Store.setMeta('kontrast', false); Einstellungen.anwenden(); });

  /* Eingabetaste-Option */
  await p.evaluate(() => Store.setMeta('enterZeile', true));
  await p.evaluate(() => App.kiPanel(true));
  await p.waitForTimeout(400);
  await p.fill('#ai-input', 'Testtext');
  await p.click('#ai-input');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(400);
  ok('Mit der Option macht Enter nur eine neue Zeile', await p.evaluate(() =>
    !!document.querySelector<HTMLTextAreaElement>('#ai-input')?.value.startsWith('Testtext')));
  await p.evaluate(() => { Store.setMeta('enterZeile', false);
                           /* Schreibender Zugriff — erst holen, dann prüfen. */
                           const feld = document.querySelector<HTMLTextAreaElement>('#ai-input');
                           if (feld) feld.value = ''; });

  /* ================================================================== *
   * 11) NACH DEM NEULADEN
   * ================================================================== */
  await p.reload();
  await p.waitForTimeout(2000);
  /* Nach dem Neuladen ist die Einrichtung der Hauptwelten wieder da —
     sie erscheint 300 ms nach dem Start und fängt Klicks ab (E132). */
  await p.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
  });
  const danach = await p.evaluate(() => ({
    reiter: document.querySelectorAll('#side-reiter .sr').length,
    persona: KI.persona(),
    chats: (Store.getMeta('chats', []) || []).length,
    unter: Object.values(Store.cache.collections).some(c => c.unterElemente),
    abh: Object.values(Store.cache.collections).some(c => c.abhaengigkeiten),
    aufgaben: Object.values(Store.cache.collections).some(c => c.istAufgaben),
    geprueft: Object.values(Store.cache.blocks).filter(b2 => b2.geprueft).length
  }));
  console.log('   Nach Neuladen:', JSON.stringify(danach));
  /* Auch hier drei statt fünf (E206) — die Zahl steht an ZWEI Stellen in
     dieser Datei, und die erste zu ändern hätte gereicht, um die zweite zu
     übersehen. Der Punkt prüft, dass die Leiste ein Neuladen übersteht,
     nicht wie viele Reiter es gibt; die Zahl bleibt trotzdem fest, weil
     `> 0` auch dann grün wäre, wenn zwei davon verschwinden. */
  ok('Reiterleiste ist wieder da', danach.reiter === 3);
  ok('Die KI heisst weiterhin Ada', danach.persona.name === 'Ada');
  ok('Chats überleben', danach.chats === 2);
  ok('Unter-Elemente und Abhängigkeiten bleiben an', danach.unter && danach.abh);
  ok('Die Aufgabenquelle bleibt gemerkt', danach.aufgaben);
  ok('Die Prüfung bleibt stehen', danach.geprueft >= 1);

  console.log('\n=== ERGEBNIS ===');
  pruef.forEach(([n, x]) => console.log((x ? '✅ ' : '❌ ') + n));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 10).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
  /* EIN RÜCKGABEWERT. Ohne ihn endet der Lauf mit 0, auch wenn oben ein ❌
     steht — und der Orchestrator meldete das jahrelang als „bestanden"
     (E56). Seit dem 8. August liest er die Ausgabe mit; die ehrliche
     Auskunft gehört trotzdem hierher, denn wer den Lauf einzeln startet,
     sieht nur den Rückgabewert. */
  process.exit(pruef.some((x: any) => !x[1]) ? 1 : 0);
})();
