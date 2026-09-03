"use strict";
/* ============================================================================
 * schale/ueberlagerung/sheet.js — das Blatt von unten, das Inhalt trägt
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/ueberlagerung/sheet.ts`. `npm run bauen:ts`
 * schreibt daraus diese Datei.
 * ==========================================================================*/
/* ===========================================================================
 * BLATT MIT INHALT — die Vorschau am Telefon
 * ===========================================================================
 *
 * WOZU DAS DA IST. `menue.ts` macht aus einem Menü am Telefon ein Blatt von
 * unten. Das reicht für eine Liste von Knöpfen und ist genau richtig dafür.
 * Für INHALT reicht es nicht: eine Seitenvorschau braucht drei Höhen statt
 * einer, sie muss sich mit dem Finger dazwischen ziehen lassen, und sie darf
 * nicht mit dem ersten Tipp verschwinden, weil man darin arbeitet.
 *
 * WARUM ES DAS ÜBERHAUPT BRAUCHT. Bis heute sprang die Vorschau am Telefon
 * zur ganzen Seite (`App.oeffne`). Das ist bequem gebaut und teuer benutzt:
 * die Tabelle darunter ist weg, die Rollposition auch, und der Weg zurück
 * führt über die Navigation. Wer zehn Zeilen ansehen will, navigiert zwanzig
 * Mal. Notion, GoodNotes und die Kontakte-App von iOS lösen das alle gleich
 * — mit einem Blatt, das über dem bleibt, was man gerade angesehen hat.
 *
 * DIE DREI HÖHEN.
 *
 *     zu     ganz unten, aus dem Bild
 *     halb   58 % der sichtbaren Höhe — die Tabelle bleibt oben sichtbar
 *     voll   sichtbare Höhe minus KOPF_FREI, damit man SIEHT, dass etwas
 *            dahinter liegt. Ein Blatt, das den Bildschirm füllt, ist von
 *            einer Seite nicht mehr zu unterscheiden — und dann sucht man
 *            wieder den Zurück-Knopf.
 *
 * DIE GESTE. Am Griff (und am Titel) zieht der Finger das Blatt mit. Beim
 * Loslassen entscheidet nicht die Strecke allein, sondern auch die
 * Geschwindigkeit: ein schneller kurzer Wisch nach unten schliesst, ein
 * langsames Ziehen sucht die nächstliegende Höhe. Aus dem Körper heraus
 * zieht es nur, wenn der Körper schon ganz oben steht — sonst wäre Rollen
 * und Ziehen dieselbe Bewegung.
 *
 * DER FALLSTRICK, DEN E368 GEKOSTET HAT. `touch-action:none` allein genügt
 * nicht. Der Browser entscheidet beim `touchstart`, ob die Berührung ihm
 * gehört; wer erst später abbricht, bekommt ein `pointercancel` und sonst
 * nichts. Deshalb hängt hier ein `touchmove` mit `{ passive: false }` daran,
 * das `preventDefault()` ruft, solange gezogen wird.
 */
const Sheet = (() => {
    const KOPF_FREI = 44; /* was oben stehen bleibt, in px */
    const ANTEIL_HALB = 0.58; /* die mittlere Höhe, als Anteil */
    const WISCH_PX = 70; /* ab hier gilt ein Zug als Absicht */
    const SCHWELLE_PX = 12; /* ab hier ist eine Berührung im Körper ein Zug */
    const WISCH_TEMPO = 0.55; /* px je ms — darüber zählt Schwung */
    const sichtbareHoehe = () => {
        const vv = window.visualViewport;
        return Math.round(vv?.height || window.innerHeight || 640);
    };
    /* Die Höhe in px, die eine Stufe bedeutet. */
    const hoeheVon = (h) => {
        const ganz = sichtbareHoehe();
        return h === 'voll'
            ? Math.max(240, ganz - KOPF_FREI)
            : Math.max(200, Math.round(ganz * ANTEIL_HALB));
    };
    let offen = null;
    /**
     * Ein Blatt mit Inhalt öffnen. Gibt den Griff zurück, damit der Aufrufer
     * es später schliessen oder aufziehen kann.
     */
    const oeffne = (opt) => {
        /* Zwei Inhaltsblätter übereinander ergeben keinen Sinn: das zweite
           verdeckt das erste vollständig, und der Grund darunter zählt doppelt. */
        if (offen)
            offen.remove();
        const grund = document.createElement('div');
        grund.className = 'iblatt-grund';
        grund.setAttribute('aria-hidden', 'true');
        const el = document.createElement('div');
        el.className = 'iblatt';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        if (opt.titel)
            el.setAttribute('aria-label', opt.titel.slice(0, 80));
        let stufe = opt.hoehe || 'halb';
        const kopf = document.createElement('div');
        kopf.className = 'iblatt-kopf';
        const griffEl = document.createElement('div');
        griffEl.className = 'iblatt-griff';
        griffEl.setAttribute('aria-hidden', 'true');
        kopf.appendChild(griffEl);
        const zeile = document.createElement('div');
        zeile.className = 'iblatt-zeile';
        const titelEl = document.createElement('div');
        titelEl.className = 'iblatt-titel';
        titelEl.textContent = opt.titel || ''; /* nie als HTML (§19) */
        zeile.appendChild(titelEl);
        (opt.kopfKnoepfe || []).forEach(k => zeile.appendChild(k));
        const zu = document.createElement('button');
        zu.type = 'button';
        zu.className = 'iblatt-zu';
        zu.textContent = '✕';
        zu.setAttribute('aria-label', 'Vorschau schliessen');
        zeile.appendChild(zu);
        kopf.appendChild(zeile);
        el.appendChild(kopf);
        const koerper = document.createElement('div');
        koerper.className = 'iblatt-koerper';
        el.appendChild(koerper);
        let weg = false;
        const schliessen = () => {
            if (weg)
                return;
            weg = true;
            el.classList.remove('auf');
            el.style.height = '0px';
            document.body.classList.remove('iblatt-auf');
            document.removeEventListener('keydown', escape, true);
            window.removeEventListener('resize', beiGroesse);
            window.visualViewport?.removeEventListener('resize', beiGroesse);
            grund.remove();
            if (offen === el)
                offen = null;
            /* Erst nach der Bewegung aus dem Baum nehmen, sonst springt es weg,
               statt zu gleiten. */
            setTimeout(() => el.remove(), 230);
            opt.beimSchliessen?.();
        };
        const escape = (e) => {
            if (e.key !== 'Escape')
                return;
            /* Ein offenes Menü über dem Blatt gehört zuerst weg — sonst schliesst
               Escape beides auf einmal, und der Nutzer verliert mehr als gemeint. */
            if (document.querySelector('.menu'))
                return;
            e.stopPropagation();
            schliessen();
        };
        const setzeHoehe = (h) => {
            stufe = h;
            el.style.height = hoeheVon(h) + 'px';
            el.dataset.stufe = h;
        };
        const beiGroesse = () => { if (!weg)
            el.style.height = hoeheVon(stufe) + 'px'; };
        grund.addEventListener('click', schliessen);
        zu.addEventListener('click', schliessen);
        document.addEventListener('keydown', escape, true);
        window.addEventListener('resize', beiGroesse);
        window.visualViewport?.addEventListener('resize', beiGroesse);
        /* ---- Ziehen ---------------------------------------------------------
           `zug` ist null, solange nichts gezogen wird. `ausKoerper` merkt sich,
           ob die Geste im Körper begann — von dort darf nur gezogen werden,
           solange der Körper oben steht. */
        let zug = null;
        /* Den Zug wirklich übernehmen — erst ab hier gehört die Geste uns. */
        const uebernehmen = (zeigerId) => {
            if (!zug || zug.bereit)
                return;
            zug.bereit = true;
            el.classList.add('zieht');
            /* OHNE DAS HIER REISST DIE GESTE AB, UND ZWAR STILL.
               Das Blatt wächst nach oben, während der Finger nach oben zieht —
               zieht er schneller, als es wächst, steht der Zeiger über dem, was
               DAHINTER liegt, und `pointermove` geht dorthin. Der Zug bleibt dann
               auf halbem Weg stehen, ohne Fehler, ohne Spur. Gefunden hat es
               test361 §3: 490 px vorher, 490 px nachher. */
            try {
                el.setPointerCapture(zeigerId);
            }
            catch { /* alte Browser */ }
        };
        const darfZiehen = (ziel) => {
            const e = ziel instanceof Element ? ziel : null;
            if (!e)
                return null;
            if (e.closest('.iblatt-kopf'))
                return 'griff';
            if (e.closest('.iblatt-koerper'))
                return 'koerper';
            return null;
        };
        el.addEventListener('pointerdown', e => {
            if (e.button !== 0)
                return;
            const wo = darfZiehen(e.target);
            if (!wo)
                return;
            /* Aus dem Körper heraus nur, wenn nichts mehr nach oben zu rollen ist. */
            if (wo === 'koerper' && koerper.scrollTop > 0)
                return;
            /* Ein Knopf, ein Eingabefeld oder eine Auswahl will seine eigene
               Geste — dort wird nicht gezogen. Ein `contenteditable` steht
               BEWUSST nicht in dieser Liste: der halbe Körper ist der Editor,
               und wer ihn ausschliesst, hat den Zug aus dem Körper gar nicht
               gebaut. test361 §9 hat genau das gefunden — der Zug scheiterte am
               Titel, den man ja anfasst, wenn man oben im Blatt beginnt. */
            const el2 = e.target instanceof Element ? e.target : null;
            if (el2?.closest('button, input, textarea, select'))
                return;
            zug = { y0: e.clientY, h0: el.getBoundingClientRect().height, t0: e.timeStamp,
                ausKoerper: wo === 'koerper', bereit: false };
            /* AM GRIFF gehört die Geste uns sofort — dort gibt es nichts anderes
               zu tun. IM KÖRPER erst, wenn der Finger sich wirklich bewegt hat:
               sonst wäre jeder Tipp in einen Textblock ein angefangener Zug, und
               der Schreibzeiger käme nie dorthin, wo man hingetippt hat. */
            if (!zug.ausKoerper)
                uebernehmen(e.pointerId);
        });
        el.addEventListener('pointermove', e => {
            if (!zug)
                return;
            const d = e.clientY - zug.y0;
            /* Aus dem Körper heraus zählt nur nach unten — nach oben ist Rollen. */
            if (zug.ausKoerper && d < 0) {
                if (!zug.bereit)
                    zug = null;
                return;
            }
            if (!zug.bereit) {
                if (d < SCHWELLE_PX)
                    return;
                uebernehmen(e.pointerId);
            }
            const ganz = sichtbareHoehe();
            const neu = Math.max(60, Math.min(ganz - KOPF_FREI, zug.h0 - d));
            el.style.height = neu + 'px';
        });
        /* Ohne das hier entscheidet der Browser beim ersten `touchstart`, dass
           die Geste ihm gehört, und schickt danach nur noch `pointercancel`.
           Das hat E368 einen halben Tag gekostet. */
        el.addEventListener('touchmove', e => { if (zug?.bereit)
            e.preventDefault(); }, { passive: false });
        const losgelassen = (e) => {
            if (!zug)
                return;
            /* Nie übernommen heisst: es war ein Tipp, kein Zug. Nichts tun. */
            if (!zug.bereit) {
                zug = null;
                return;
            }
            const d = e.clientY - zug.y0;
            const ms = Math.max(1, e.timeStamp - zug.t0);
            const tempo = d / ms; /* px je ms, positiv = nach unten */
            const gezogen = zug;
            zug = null;
            el.classList.remove('zieht');
            try {
                el.releasePointerCapture(e.pointerId);
            }
            catch { /* schon los */ }
            /* Schwung schlägt Strecke: ein kurzer schneller Wisch nach unten
               schliesst, auch wenn das Blatt kaum bewegt wurde. */
            if (tempo > WISCH_TEMPO && d > 24) {
                schliessen();
                return;
            }
            if (tempo < -WISCH_TEMPO && d < -24) {
                setzeHoehe('voll');
                return;
            }
            const jetzt = el.getBoundingClientRect().height;
            if (gezogen.h0 - jetzt > WISCH_PX && stufe === 'halb') {
                schliessen();
                return;
            }
            /* Sonst zur nächstliegenden Stufe — und „zu" ist eine davon. */
            const kandidaten = [['zu', 0], ['halb', hoeheVon('halb')], ['voll', hoeheVon('voll')]];
            let beste = kandidaten[0];
            kandidaten.forEach(k => { if (Math.abs(k[1] - jetzt) < Math.abs(beste[1] - jetzt))
                beste = k; });
            if (beste[0] === 'zu')
                schliessen();
            else
                setzeHoehe(beste[0]);
        };
        el.addEventListener('pointerup', losgelassen);
        el.addEventListener('pointercancel', e => {
            if (!zug)
                return;
            try {
                el.releasePointerCapture(e.pointerId);
            }
            catch { /* schon los */ }
            zug = null;
            el.classList.remove('zieht');
            setzeHoehe(stufe);
        });
        /* SOLANGE EIN INHALTSBLATT OFFEN IST, GEHÖREN MENÜS DARÜBER.
           `.menu` liegt auf z-index 600, das Blatt auf 780 — ein Menü, das AUS
           dem Blatt heraus geöffnet wird („⋯"), läge sonst dahinter und wäre
           unsichtbar. Der Knopf hätte dann scheinbar nichts getan. Das steht
           hier und nicht als feste Zahl in `.menu`, weil sonst jedes Menü der
           App über alles andere stiege. */
        document.body.classList.add('iblatt-auf');
        document.body.appendChild(grund);
        document.body.appendChild(el);
        offen = el;
        const griff = { setzeHoehe, schliessen };
        opt.aufbau(koerper, griff);
        /* Erst die Höhe setzen, dann im nächsten Bild aufgleiten lassen —
           sonst gleitet es von 0 auf und ruckelt beim ersten Bild. */
        setzeHoehe(stufe);
        requestAnimationFrame(() => el.classList.add('auf'));
        return griff;
    };
    const istOffen = () => !!offen;
    const schliesseAlle = () => { offen?.querySelector('.iblatt-zu')?.click(); };
    return { oeffne, istOffen, schliesseAlle, KOPF_FREI, ANTEIL_HALB };
})();
window.Sheet = Sheet;
