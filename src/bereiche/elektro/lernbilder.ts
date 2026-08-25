/* ============================================================================
 * bereiche/elektro/lernbilder.ts — Formeldreieck und Sinuskurve
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/elektro/lernbilder.ts`.
 * ----------------------------------------------------------------------------
 * ZWEI BILDER, DIE MEHR ERKLÄREN ALS EIN ABSATZ
 *
 * DAS FORMELDREIECK (Punkt 65) ist die älteste Merkhilfe der Elektrotechnik
 * und immer noch die beste: oben die Grösse, die aus den beiden unteren
 * hervorgeht, und wer eine davon zuhält, sieht die Formel für sie. U zuhalten
 * ergibt R · I, R zuhalten ergibt U / I. Das kann man in dreissig Sekunden
 * lernen und vergisst es nicht mehr.
 *
 * Es wird nicht von Hand gezeichnet, sondern aus der SCHREIBWEISE der Formel
 * abgeleitet. `U = R · I` und `I = U / R` beschreiben dasselbe Dreieck; das
 * Modul erkennt beide Formen und legt sie zusammen. So gibt es genau so viele
 * Dreiecke, wie es dreiteilige Produktformeln gibt — und wenn morgen eine
 * dazukommt, gibt es morgen ihr Dreieck.
 *
 * DIE SINUSKURVE (Punkt 90) beantwortet die Frage, an der im Wechselstrom
 * die meisten hängenbleiben: warum sind 230 V nicht 230 V. Der Scheitelwert
 * ist 325, der Effektivwert 230, und der Momentanwert ist irgendwas
 * dazwischen — je nachdem, wann man hinsieht. Drei Zahlen für dieselbe
 * Spannung, und in einer Zeichnung sind sie in einem Blick auseinander.
 *
 * BEIDE SIND NUR SVG. Kein Rechenwerk, kein Zustand, keine Bibliothek —
 * eine Zeichenkette hinein, eine Zeichenkette heraus. Die Zahlen kommen aus
 * `Register.elektroformeln`, die Bewegung aus einem Schieber daneben.
 * ==========================================================================*/

const Elektrolernbilder = (() => {

  const esc = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* ------------------------------------------------------------------------
   * 1. DAS FORMELDREIECK
   * ----------------------------------------------------------------------*/

  type Dreieck = {
    /** Die Grösse oben — sie steht über dem Bruchstrich. */
    oben: string;
    /** Die beiden unten, nebeneinander. */
    links: string;
    rechts: string;
    /** Aus welcher Formel es stammt. */
    formel: string;
    /** Die drei Formeln, die man daraus ablesen kann. */
    ablesbar: [string, string, string];
  };

  /**
   * Ein Dreieck aus einer Schreibweise lesen.
   *
   * Erkannt werden die zwei Formen, in denen dieselbe Beziehung geschrieben
   * wird — als Produkt und als Bruch:
   *
   *     U = R · I     →  oben U, unten R und I
   *     I = U / R     →  oben U, unten I und R
   *
   * Alles andere gibt `null`. Das ist Absicht: eine Formel mit vier Grössen
   * oder mit einer Wurzel hat kein Dreieck, und eines zu erfinden wäre eine
   * Merkhilfe, die falsch merkt.
   */
  const ausSchreibweise = (schreibweise: string): Dreieck | null => {
    const roh = String(schreibweise || '').replace(/\s+/g, ' ').trim();
    /* Nur einfache Namen: Buchstaben, Ziffern, Indexzeichen. Klammern und
       Konstanten wie π sind ein Zeichen dafür, dass es kein Dreieck ist. */
    const teil = '([A-Za-zΦΩμµ][A-Za-z0-9₀₁₂₃ₙ_]*)';
    const produkt = new RegExp(`^${teil} = ${teil} · ${teil}$`);
    const bruch = new RegExp(`^${teil} = ${teil} / ${teil}$`);

    let oben = '', links = '', rechts = '';
    const mP = produkt.exec(roh);
    const mB = bruch.exec(roh);
    if (mP) { oben = mP[1]!; links = mP[2]!; rechts = mP[3]!; }
    else if (mB) { oben = mB[2]!; links = mB[1]!; rechts = mB[3]!; }
    else return null;
    if (oben === links || oben === rechts || links === rechts) return null;

    return {
      oben, links, rechts, formel: roh,
      ablesbar: [
        `${oben} = ${links} · ${rechts}`,
        `${links} = ${oben} / ${rechts}`,
        `${rechts} = ${oben} / ${links}`
      ]
    };
  };

  /** Alle Dreiecke, die es im Formelregister gibt — ohne Doppelte. */
  const alleDreiecke = (): Dreieck[] => {
    const R = (typeof Register !== 'undefined' && Register.elektroformeln)
      ? Register.elektroformeln : null;
    if (!R) return [];
    const raus: Dreieck[] = [];
    const gesehen = new Set<string>();
    (R.alle() as any[]).forEach(f => {
      const d = ausSchreibweise(f.schreibweise);
      if (!d) return;
      /* `U = R · I` und `I = U / R` sind DASSELBE Dreieck. Der Schlüssel ist
         deshalb die sortierte Menge der drei Grössen und nicht die
         Schreibweise — sonst stünde dieselbe Merkhilfe dreimal da. */
      const schluessel = [d.oben, d.links, d.rechts].slice().sort().join('|');
      if (gesehen.has(schluessel)) return;
      gesehen.add(schluessel);
      raus.push(d);
    });
    return raus;
  };

  /**
   * Das Dreieck als SVG.
   *
   * `zeigeAuf` blendet eine Grösse AUS und die zugehörige Formel ein — genau
   * die Bewegung, die man mit dem Daumen macht. Sie ist der ganze Sinn der
   * Merkhilfe und deshalb keine Zusatzfunktion, sondern der Normalfall.
   */
  const dreieckSvg = (d: Dreieck | null, opt: { zeigeAuf?: string;
                                                breite?: number } = {}): string => {
    if (!d) return '';
    const b = opt.breite || 200;
    const h = Math.round(b * 0.88);
    const zu = opt.zeigeAuf;
    const feld = (name: string, x: number, y: number) => {
      const verdeckt = zu === name;
      return `<g class="fd-feld${verdeckt ? ' verdeckt' : ''}" data-groesse="${esc(name)}">` +
        `<circle cx="${x}" cy="${y}" r="${Math.round(b * 0.13)}" ` +
        `fill="${verdeckt ? 'currentColor' : 'transparent'}" opacity="${verdeckt ? '.18' : '1'}"/>` +
        `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" ` +
        `font-size="${Math.round(b * 0.16)}" font-weight="700" ` +
        `fill="currentColor"${verdeckt ? ' opacity=".12"' : ''}>${esc(name)}</text></g>`;
    };
    const m = Math.round(b * 0.06);
    return `<svg class="fd-dreieck" viewBox="0 0 ${b} ${h}" width="${b}" height="${h}" ` +
      `role="img" aria-label="Formeldreieck ${esc(d.formel)}">` +
      `<path d="M${b / 2},${m} L${b - m},${h - m} L${m},${h - m} Z" ` +
      `fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" opacity=".55"/>` +
      /* Der Bruchstrich. Er ist der Grund, warum das Dreieck funktioniert:
         oben durch unten, und unten mal unten. */
      `<line x1="${m + b * 0.08}" y1="${h * 0.54}" x2="${b - m - b * 0.08}" y2="${h * 0.54}" ` +
      `stroke="currentColor" stroke-width="1.5" opacity=".35"/>` +
      /* Und das Malzeichen zwischen den unteren beiden. */
      `<text x="${b / 2}" y="${h * 0.79}" text-anchor="middle" dominant-baseline="central" ` +
      `font-size="${Math.round(b * 0.1)}" fill="currentColor" opacity=".4">·</text>` +
      feld(d.oben, b / 2, h * 0.31) +
      feld(d.links, b * 0.29, h * 0.79) +
      feld(d.rechts, b * 0.71, h * 0.79) +
      `</svg>`;
  };

  /** Welche Formel man abliest, wenn man `groesse` zuhält. */
  const formelFuer = (d: Dreieck | null, groesse: string): string => {
    if (!d) return '';
    if (groesse === d.oben) return d.ablesbar[0];
    if (groesse === d.links) return d.ablesbar[1];
    if (groesse === d.rechts) return d.ablesbar[2];
    return '';
  };

  /* ------------------------------------------------------------------------
   * 2. DIE SINUSKURVE
   * ------------------------------------------------------------------------
   * Warum sind 230 V nicht 230 V? Weil drei verschiedene Zahlen dieselbe
   * Spannung beschreiben, und im Bild liegen sie übereinander.
   * ----------------------------------------------------------------------*/

  type Kurve = {
    /** Effektivwert in Volt — das, was auf dem Typenschild steht. */
    ueff: number;
    /** Frequenz in Hertz. */
    f: number;
    /** Wo der bewegliche Punkt steht, in Grad. */
    winkel: number;
  };

  const WURZEL2 = Math.SQRT2;

  /** Die drei Zahlen zu einer Kurve. */
  const werte = (k: Kurve): {
    scheitel: number; effektiv: number; momentan: number;
    periode: number; zeit: number;
  } => {
    const scheitel = k.ueff * WURZEL2;
    const bogen = k.winkel * Math.PI / 180;
    return {
      scheitel,
      effektiv: k.ueff,
      momentan: scheitel * Math.sin(bogen),
      periode: k.f > 0 ? 1 / k.f : 0,
      zeit: k.f > 0 ? (k.winkel / 360) / k.f : 0
    };
  };

  const rund = (x: number, stellen = 1): number =>
    Number(x.toFixed(stellen));

  /**
   * Die Kurve als SVG.
   *
   * Gezeichnet wird EINE Periode, mit Nulllinie, Scheitelwert, Effektivwert
   * als waagrechte Linie und einem beweglichen Punkt. Der Effektivwert steht
   * bewusst als LINIE da und nicht als Zahl am Rand: dass er unter dem
   * Scheitel liegt, ist die ganze Aussage, und eine Zahl daneben zeigt das
   * nicht.
   */
  const kurveSvg = (k: Kurve, opt: { breite?: number; hoehe?: number } = {}): string => {
    const b = opt.breite || 720;
    const h = opt.hoehe || 300;
    /* Der linke Rand trägt die Beschriftung „û 325.3" — rechtsbündig an der
       Achse. Bei 46 px ragte sie links aus der Zeichenfläche heraus und war
       angeschnitten: die Zahl stand da, das Zeichen davor nur halb. Gemessen
       an der längsten Beschriftung, die vorkommt, und nicht geschätzt. */
    const linksRand = 68, rechtsRand = 16, obenRand = 18, untenRand = 32;
    const zeichenB = b - linksRand - rechtsRand;
    const zeichenH = h - obenRand - untenRand;
    const mitte = obenRand + zeichenH / 2;
    const w = werte(k);
    const massstab = (zeichenH / 2) / (w.scheitel * 1.12);

    const yVon = (v: number) => mitte - v * massstab;
    const xVon = (grad: number) => linksRand + (grad / 360) * zeichenB;

    /* Die Kurve selbst, in Zweigradschritten. Feiner bringt nichts sichtbar
       und macht die Zeichenkette doppelt so lang. */
    const punkte: string[] = [];
    for (let g = 0; g <= 360; g += 2)
      punkte.push(`${xVon(g).toFixed(1)},${yVon(w.scheitel * Math.sin(g * Math.PI / 180)).toFixed(1)}`);

    const px = xVon(k.winkel), py = yVon(w.momentan);

    const linie = (v: number, klasse: string, text: string) =>
      `<line class="${klasse}" x1="${linksRand}" y1="${yVon(v).toFixed(1)}" ` +
      `x2="${b - rechtsRand}" y2="${yVon(v).toFixed(1)}"/>` +
      `<text class="sk-mass" x="${linksRand - 6}" y="${yVon(v).toFixed(1)}" ` +
      `text-anchor="end" dominant-baseline="central">${esc(text)}</text>`;

    return `<svg class="sk-kurve" viewBox="0 0 ${b} ${h}" width="${b}" height="${h}" ` +
      `role="img" aria-label="Sinuskurve, Effektivwert ${rund(k.ueff)} Volt">` +
      /* Nulllinie und Gradachse */
      `<line class="sk-null" x1="${linksRand}" y1="${mitte}" x2="${b - rechtsRand}" y2="${mitte}"/>` +
      [90, 180, 270].map(g =>
        `<line class="sk-teil" x1="${xVon(g).toFixed(1)}" y1="${obenRand}" ` +
        `x2="${xVon(g).toFixed(1)}" y2="${h - untenRand}"/>`).join('') +
      [0, 90, 180, 270, 360].map(g =>
        `<text class="sk-grad" x="${xVon(g).toFixed(1)}" y="${h - untenRand + 16}" ` +
        `text-anchor="middle">${g}°</text>`).join('') +
      /* Scheitel und Effektivwert */
      linie(w.scheitel, 'sk-scheitel', 'û ' + rund(w.scheitel)) +
      linie(w.effektiv, 'sk-effektiv', 'U ' + rund(w.effektiv)) +
      linie(-w.effektiv, 'sk-effektiv', '') +
      /* Die Kurve */
      `<polyline class="sk-linie" points="${punkte.join(' ')}"/>` +
      /* Der bewegliche Punkt mit seiner Lotrechten */
      `<line class="sk-lot" x1="${px.toFixed(1)}" y1="${mitte}" ` +
      `x2="${px.toFixed(1)}" y2="${py.toFixed(1)}"/>` +
      `<circle class="sk-punkt" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5"/>` +
      `<text class="sk-jetzt" x="${(px + 9).toFixed(1)}" y="${(py - 9).toFixed(1)}">` +
      `${rund(w.momentan)} V</text>` +
      `</svg>`;
  };

  /**
   * Die ganze Lernansicht: Kurve, Schieber, drei Zahlen.
   *
   * Der Schieber ist ein `input[type=range]` und kein gezogener Punkt im SVG.
   * Das ist keine Bequemlichkeit: ein Schieber lässt sich mit der Tastatur
   * bedienen, hat einen Namen für den Screenreader und funktioniert am
   * Telefon ohne Zielgenauigkeit (§38, §37).
   */
  const sinusFlaeche = (start: Partial<Kurve> = {}): HTMLElement => {
    const wurzel = document.createElement('div');
    wurzel.className = 'sk-wrap';
    const k: Kurve = {
      ueff: start.ueff ?? 230,
      f: start.f ?? 50,
      winkel: start.winkel ?? 45
    };

    const male = (): void => {
      const w = werte(k);
      wurzel.innerHTML =
        `<div class="sk-bild">${kurveSvg(k)}</div>` +
        `<div class="sk-regler">` +
        `<label><span>Winkel</span>` +
        `<input type="range" class="sk-winkel" min="0" max="360" step="1" ` +
        `value="${k.winkel}" aria-label="Winkel in Grad"><b>${k.winkel}°</b></label>` +
        `<label><span>Effektivwert</span>` +
        `<input type="number" class="sk-ueff" min="1" max="1000" step="1" ` +
        `value="${rund(k.ueff)}" aria-label="Effektivwert in Volt"><b>V</b></label>` +
        `<label><span>Frequenz</span>` +
        `<input type="number" class="sk-f" min="1" max="1000" step="1" ` +
        `value="${rund(k.f)}" aria-label="Frequenz in Hertz"><b>Hz</b></label>` +
        `</div>` +
        `<div class="sk-zahlen">` +
        `<div class="sk-zahl"><b>${rund(w.scheitel)} V</b>` +
        `<span>Scheitelwert û = U · √2</span></div>` +
        `<div class="sk-zahl"><b>${rund(w.effektiv)} V</b>` +
        `<span>Effektivwert U — was auf dem Typenschild steht</span></div>` +
        `<div class="sk-zahl"><b>${rund(w.momentan)} V</b>` +
        `<span>Momentanwert u = û · sin ${k.winkel}°</span></div>` +
        `<div class="sk-zahl"><b>${rund(w.periode * 1000, 2)} ms</b>` +
        `<span>Periodendauer T = 1 / f</span></div>` +
        `<div class="sk-zahl"><b>${rund(w.zeit * 1000, 2)} ms</b>` +
        `<span>vergangene Zeit bei ${k.winkel}°</span></div>` +
        `</div>`;
    };

    wurzel.addEventListener('input', e => {
      const f = e.target as HTMLInputElement;
      const zahl = Number(f.value);
      if (!Number.isFinite(zahl)) return;
      if (f.classList.contains('sk-winkel')) k.winkel = Math.max(0, Math.min(360, zahl));
      else if (f.classList.contains('sk-ueff')) k.ueff = Math.max(1, zahl);
      else if (f.classList.contains('sk-f')) k.f = Math.max(1, zahl);
      else return;
      /* Beim Schieber NICHT alles neu zeichnen — der Finger läge sonst nach
         jedem Pixel auf einem neuen Element und der Zug bräche ab. Nur die
         Zeichnung und die Zahlen werden ersetzt. */
      const bild = wurzel.querySelector('.sk-bild');
      if (bild) bild.innerHTML = kurveSvg(k);
      const w2 = werte(k);
      const zahlen = wurzel.querySelectorAll('.sk-zahl b');
      const texte = wurzel.querySelectorAll('.sk-zahl span');
      const setze = (i: number, wert: string, text?: string) => {
        const el = zahlen[i]; if (el) el.textContent = wert;
        if (text !== undefined) { const t = texte[i]; if (t) t.textContent = text; }
      };
      setze(0, rund(w2.scheitel) + ' V');
      setze(1, rund(w2.effektiv) + ' V');
      setze(2, rund(w2.momentan) + ' V', `Momentanwert u = û · sin ${k.winkel}°`);
      setze(3, rund(w2.periode * 1000, 2) + ' ms');
      setze(4, rund(w2.zeit * 1000, 2) + ' ms', `vergangene Zeit bei ${k.winkel}°`);
      const marke = wurzel.querySelector('.sk-regler b');
      if (marke) marke.textContent = k.winkel + '°';
    });

    male();
    return wurzel;
  };

  /* ------------------------------------------------------------------------
   * 3. DIE DREIECKS-FLÄCHE
   * ----------------------------------------------------------------------*/
  const dreieckFlaeche = (): HTMLElement => {
    const wurzel = document.createElement('div');
    wurzel.className = 'fd-wrap';
    const liste = alleDreiecke();
    let wahl = 0;
    let zu = '';

    const male = (): void => {
      const d = liste[wahl] || null;
      wurzel.innerHTML =
        `<div class="fd-wahl">` + liste.map((x, i) =>
          `<button class="fd-knopf${i === wahl ? ' an' : ''}" data-nr="${i}">` +
          `${esc(x.oben)} = ${esc(x.links)} · ${esc(x.rechts)}</button>`).join('') +
        `</div>` +
        (d
          ? `<div class="fd-bild">${dreieckSvg(d, zu ? { zeigeAuf: zu } : {})}</div>` +
            `<p class="fd-hinweis">${zu
              ? `Zugehalten: <b>${esc(zu)}</b> — abgelesen: <b>${esc(formelFuer(d, zu))}</b>`
              : 'Eine Grösse antippen, um sie zuzuhalten — dann steht die Formel für sie da.'}</p>` +
            `<ul class="fd-alle">` + d.ablesbar
              .map(f => `<li>${esc(f)}</li>`).join('') + `</ul>`
          : `<div class="ea-leer"><p>Es gibt keine Formel mit drei Grössen.</p></div>`);
    };

    wurzel.addEventListener('click', e => {
      const b = (e.target as Element).closest<HTMLElement>('[data-nr]');
      if (b) { wahl = Number(b.dataset.nr) || 0; zu = ''; male(); return; }
      const g = (e.target as Element).closest<HTMLElement>('[data-groesse]');
      if (!g) return;
      const name = g.dataset.groesse || '';
      zu = (zu === name) ? '' : name;
      male();
    });

    male();
    return wurzel;
  };

  /* Zwei Befehle. */
  if (typeof Register !== 'undefined' && Register.befehle) {
    Register.befehle.melde({
      titel: 'Elektro: Formeldreieck', gruppe: 'Elektro',
      tun: () => {
        if (typeof Elektroarbeitsplatz !== 'undefined')
          Elektroarbeitsplatz.zeigeAls('Formeldreieck', dreieckFlaeche());
      }
    });
    Register.befehle.melde({
      titel: 'Elektro: Sinuskurve', gruppe: 'Elektro',
      tun: () => {
        if (typeof Elektroarbeitsplatz !== 'undefined')
          Elektroarbeitsplatz.zeigeAls('Sinuskurve', sinusFlaeche());
      }
    });
  }

  return { ausSchreibweise, alleDreiecke, dreieckSvg, formelFuer, dreieckFlaeche,
           werte, kurveSvg, sinusFlaeche };
})();

(window as any).Elektrolernbilder = Elektrolernbilder;
