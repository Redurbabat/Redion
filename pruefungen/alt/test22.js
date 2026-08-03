const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const f=[]; p.on('pageerror',e=>f.push('PAGEERROR: '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/11434|CONNECTION_REFUSED|ERR_|X-Frame|frame-ancestors|Refused to display/i.test(m.text()))f.push('CONSOLE: '+m.text());});
  const pruef=[]; const ok=(n,x)=>pruef.push([n,!!x]);

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1500);

  const kat = await p.evaluate(() => {
    const g = {};
    Blocks.TYPEN.forEach(t => g[t.gruppe] = (g[t.gruppe] || 0) + 1);
    return { gesamt: Blocks.TYPEN.length, gruppen: g, dienste: Blocks.DIENSTE.length };
  });
  console.log('   Katalog:', JSON.stringify(kat));
  ok('Slash-Menü hat mindestens 58 Einträge', kat.gesamt >= 58);
  ok('Gruppe Einbetten existiert', kat.gruppen['Einbetten'] >= 15);

  const url = await p.evaluate(() => {
    const e = Blocks.einbettungsAdresse;
    return {
      yt:   e('youtube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
      ytk:  e('youtube', 'https://youtu.be/abc123XYZ'),
      vim:  e('vimeo',   'https://vimeo.com/76979871'),
      maps: e('maps',    'Bahnhofstrasse 1, Zürich'),
      drive:e('drive',   'https://drive.google.com/file/d/1AbC/view?usp=sharing'),
      docs: e('gdocs',   'https://docs.google.com/document/d/1AbC/edit'),
      figma:e('figma',   'https://www.figma.com/file/abc/Test'),
      miro: e('miro',    'https://miro.com/app/board/uXjV123='),
      loom: e('loom',    'https://www.loom.com/share/abc123'),
      spot: e('spotify', 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC'),
      sc:   e('soundcloud','https://soundcloud.com/artist/track'),
      x:    e('twitter', 'https://x.com/anthropicai/status/1234567890'),
      pen:  e('codepen', 'https://codepen.io/team/pen/abcdef')
    };
  });
  console.log('   Adressen:', JSON.stringify(url, null, 0).slice(0, 600));
  ok('YouTube watch wird Einbettung', url.yt === 'https://www.youtube.com/embed/dQw4w9WgXcQ');
  ok('YouTube Kurzlink wird Einbettung', url.ytk === 'https://www.youtube.com/embed/abc123XYZ');
  ok('Vimeo wird Player', url.vim === 'https://player.vimeo.com/video/76979871');
  ok('Maps aus reiner Adresse', url.maps.includes('output=embed') && url.maps.includes('Bahnhofstrasse'));
  ok('Drive wird preview', url.drive.endsWith('/preview'));
  ok('Docs wird preview', url.docs.endsWith('/preview'));
  ok('Figma bekommt embed_host', url.figma.startsWith('https://www.figma.com/embed?'));
  ok('Miro wird live-embed', url.miro.includes('/app/live-embed/'));
  ok('Loom wird embed', url.loom.includes('/embed/'));
  ok('Spotify wird embed', url.spot.includes('open.spotify.com/embed/track/'));
  ok('SoundCloud bekommt Player', url.sc.startsWith('https://w.soundcloud.com/player/'));
  ok('X wird Tweet-Rahmen', url.x.includes('platform.twitter.com/embed/Tweet.html?id=1234567890'));
  ok('CodePen wird embed', url.pen.includes('/embed/'));

  /* Über das Slash-Menü einen YouTube-Block anlegen */
  const gebaut = await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Einbettungstest' });
    const bl = Store.addBlock(s.id, 'text', { text: '' });
    Blocks.umwandeln(bl.id, 'embed-youtube');
    const nach = Store.getBlock(bl.id);
    Store.updateBlock(nach.id, {
      src: Blocks.einbettungsAdresse(nach.dienst, 'https://www.youtube.com/watch?v=xyz789abc'),
      quelle: 'https://www.youtube.com/watch?v=xyz789abc'
    });
    return { typ: nach.type, dienst: nach.dienst, src: Store.getBlock(bl.id).src, seite: s.id };
  });
  console.log('   Block:', JSON.stringify(gebaut));
  ok('Slash legt Einbettungsblock an', gebaut.typ === 'embed' && gebaut.dienst === 'youtube');
  ok('Adresse wird umgeschrieben', gebaut.src === 'https://www.youtube.com/embed/xyz789abc');

  await p.evaluate((id) => App.oeffne(id), gebaut.seite);
  await p.waitForTimeout(700);
  const sicht = await p.evaluate(() => {
    const fr = document.querySelector('#page iframe');
    const a = [...document.querySelectorAll('#page a')].find(x => x.textContent.includes('Original'));
    return { rahmen: !!fr, src: fr && fr.getAttribute('src'), link: a && a.getAttribute('href') };
  });
  console.log('   Ansicht:', JSON.stringify(sicht));
  ok('Rahmen wird gezeichnet', sicht.rahmen && sicht.src.includes('/embed/xyz789abc'));
  ok('Weg zum Original ist da', (sicht.link || '').includes('watch?v=xyz789abc'));

  /* Suche im Slash-Menü */
  const suche = await p.evaluate(() => {
    const q = (w) => Blocks.TYPEN.filter(t =>
      t.name.toLowerCase().includes(w) || t.cmd.some(c => c.startsWith(w))).map(t => t.id);
    return { spotify: q('spotify'), pdf: q('pdf'), karte: q('maps') };
  });
  console.log('   Suche:', JSON.stringify(suche));
  ok('Suche nach spotify findet den Eintrag', suche.spotify.includes('embed-spotify'));
  ok('Suche nach pdf findet den Eintrag', suche.pdf.includes('embed-pdf'));

  await p.evaluate(() => Store.flush());
  await p.waitForTimeout(500);
  await p.reload();
  await p.waitForTimeout(1500);
  const nachher = await p.evaluate(() => {
    const b = Object.values(Store.cache.blocks).find(x => x.type === 'embed' && x.dienst === 'youtube');
    return !!b && b.src.includes('/embed/xyz789abc');
  });
  ok('Überlebt das Neuladen', nachher);

  console.log('\n=== ERGEBNIS ===');
  pruef.forEach(([n, x]) => console.log((x ? '✅ ' : '❌ ') + n));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 8).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
})();
