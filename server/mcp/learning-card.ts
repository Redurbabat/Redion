/* Validated input -> existing flashcard / Trainer format, no second store. */
export function buildLearningCard(args:Record<string,unknown>):{content:string;meta:Record<string,unknown>} {
  const fail=(message:string):never=>{throw new Error(message);};
  const str=(v:unknown,max:number):string=>{
    if(typeof v!=='string'||!v.trim()||v.length>max||v.includes('::'))return fail('Ungültiger Kartentext.');
    return v.trim();
  };
  const question=str(args.question,2000),answer=str(args.answer,2000),kind=args.kind;
  if(!['flashcard','single_select','multi_select','true_false','cloze'].includes(String(kind)))return fail('Unbekannte Kartenart.');
  const chapter=str(args.deck,160),topic=args.topic===undefined?chapter:str(args.topic,160);
  const quiz:Record<string,unknown>={kind:'schreiben',kapitel:chapter,thema:topic,topic,pruefung:false,musterloesung:[answer]};
  if(args.subject!==undefined)quiz.subject=str(args.subject,120);
  if(args.explanation!==undefined)quiz.hinweis=str(args.explanation,1500);
  if(args.source!==undefined)quiz.quelle=str(args.source,300);
  let content=question+' :: '+answer;
  if(kind==='flashcard')quiz.format='flashcard';
  if(kind==='single_select'||kind==='multi_select'||kind==='true_false'){
    if(!Array.isArray(args.options)||args.options.length!==(kind==='true_false'?2:4))return fail('Ungültige Antwortoptionen.');
    const optionen=args.options.map((o:unknown)=>{
      if(!o||typeof o!=='object'||Array.isArray(o))return fail('Ungültige Antwortoption.');
      const row=o as Record<string,unknown>;
      if(Object.keys(row).some(k=>!['text','correct'].includes(k))||typeof row.correct!=='boolean')return fail('Ungültige Antwortoption.');
      return {text:str(row.text,500),richtig:row.correct};
    });
    if(new Set(optionen.map(o=>o.text.toLowerCase())).size!==optionen.length)return fail('Doppelte Antwortoptionen.');
    const count=optionen.filter(o=>o.richtig).length;
    if(kind==='multi_select'?count<2||count>3:count!==1)return fail('Ungültige Anzahl richtiger Antworten.');
    if(kind==='true_false'&&!optionen.every((o,i)=>o.text===(i===0?'Richtig':'Falsch')))return fail('Wahr/Falsch benötigt Richtig und Falsch.');
    quiz.kind='mc';quiz.optionen=optionen;quiz.format=kind;delete quiz.musterloesung;
    content=question+' :: '+optionen.filter(o=>o.richtig).map(o=>o.text).join(' · ');
  }else{
    if(args.options!==undefined)return fail('Diese Kartenart hat keine Antwortoptionen.');
    if(kind==='cloze'){
      if(question.split('___').length!==2||/[{}]/.test(question)||/[{}\n]/.test(answer))return fail('Eine Lücke mit ___ erforderlich.');
      content=question.replace('___','{{'+answer+'}}');
      quiz.kind='luecke';quiz.loesungen=[answer];delete quiz.musterloesung;
    }
  }
  if(args.image!==undefined){
    if(!args.image||typeof args.image!=='object'||Array.isArray(args.image))return fail('Ungültiges Bild.');
    const image=args.image as Record<string,unknown>;
    if(Object.keys(image).some(k=>!['data','alt'].includes(k)))return fail('Ungültige Bildfelder.');
    const data=image.data;
    if(typeof data!=='string'||data.length>12000||!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(data))return fail('Nur kleine PNG/JPEG/WebP-Datenbilder sind erlaubt.');
    let bytes:string;
    try{bytes=atob(data.slice(data.indexOf(',')+1));}catch{return fail('Ungültiges Bildformat.');}
    const png=data.startsWith('data:image/png;')&&bytes.startsWith('\x89PNG\r\n\x1a\n');
    const jpeg=data.startsWith('data:image/jpeg;')&&bytes.startsWith('\xff\xd8\xff');
    const webp=data.startsWith('data:image/webp;')&&bytes.startsWith('RIFF')&&bytes.slice(8,12)==='WEBP';
    if(!png&&!jpeg&&!webp)return fail('Bildtyp stimmt nicht mit den Daten überein.');
    quiz.image={data,alt:str(image.alt,300)};
  }
  return {content,meta:{quiz}};
}

export function buildLearningSet(args:Record<string,unknown>):ReturnType<typeof buildLearningCard>[] {
  if(!Array.isArray(args.cards)||args.cards.length<1||args.cards.length>20)throw new Error('1–20 Lernkarten erforderlich.');
  const cards=args.cards.map((raw:unknown)=>{
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Ungültige Karte.');
    const card=raw as Record<string,unknown>;
    if(Object.keys(card).some(k=>!['kind','question','answer','topic','subject','explanation','source','options','image'].includes(k)))throw new Error('Unbekanntes Kartenfeld.');
    return buildLearningCard({topic:args.topic,subject:args.subject,...card,deck:args.deck});
  });
  if(new TextEncoder().encode(JSON.stringify(cards)).byteLength>60000)throw new Error('Kartenset zu gross; bitte kleinere Sets erstellen.');
  return cards;
}
