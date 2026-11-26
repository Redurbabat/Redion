export function schema6() {
  const plan = {art:'stromlauf-aufgeloest',breite:800,hoehe:700,texte:[],
    ebenen:[{id:'plan',name:'Plan',farbe:'#529cca',sichtbar:true}]};
  const teile = [
    ['G1', 'wechselspannung'], ['S1', 'ch-schema3'], ['S2', 'ch-schema6'],
    ['S3', 'ch-schema3'], ['E1', 'lampe'],
  ].map(([id, zeichen], i) => ({
    id, zeichen, x: 40 + 100 * i, y: 40, drehung: 0, gespiegelt: false,
    bmk: id, nummern: {}, gruppe: '', ebene: 'plan'
  }));
  const leitungen = [
    ['G1','L','S1','3'], ['S1','1','S2','1'], ['S1','2','S2','3'],
    ['S2','2','S3','1'], ['S2','4','S3','2'], ['S3','3','E1','X1'], ['E1','X2','G1','N'],
  ].map(([vonTeil, vonNr, nachTeil, nachNr], i) => ({
    id: 'W' + i, vonTeil, vonNr, nachTeil, nachNr, ebene: 'plan', punkte: []
  }));
  const soll = [true, false, false, true, false, true, true, false];
  const schalter = ['S1', 'S2', 'S3'];
  return { plan:{...plan,teile,leitungen}, soll, schalter };
}
