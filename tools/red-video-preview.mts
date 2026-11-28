/** Isolierter Offline-Timeline-Pilot: keine Netzwerke, keine fremden Skripte. */
import {readFile,stat,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

export type VideoScene={title:string;body:string;seconds:number};
export type VideoTimeline={version:1;title:string;scenes:VideoScene[]};
const MAX_INPUT=128*1024;
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const str=(v:unknown,max:number):v is string=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const esc=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]??c));

export function validateTimeline(input:unknown):VideoTimeline{
 if(!object(input)||Object.keys(input).length!==3||input.version!==1||!str(input.title,120)||!Array.isArray(input.scenes)||input.scenes.length<1||input.scenes.length>120)throw Error('Ungültige Timeline');
 const scenes:VideoScene[]=input.scenes.map((v:unknown)=>{
  if(!object(v)||Object.keys(v).length!==3||!str(v.title,120)||!str(v.body,600)||typeof v.seconds!=='number'||!Number.isInteger(v.seconds)||v.seconds<2||v.seconds>60)throw Error('Ungültige Szene');
  return {title:v.title,body:v.body,seconds:v.seconds};
 });
 if(scenes.reduce((n,v)=>n+v.seconds,0)>1200)throw Error('Timeline länger als 20 Minuten');
 return {version:1,title:input.title,scenes};
}
export function renderVideoPreview(input:unknown):string{
 const t=validateTimeline(input);
 const sections=t.scenes.map((s,i)=>'<section data-seconds="'+s.seconds+'"'+(i?' hidden':'')+'><small>RED ION / '+(i+1)+' / '+t.scenes.length+'</small><h2>'+esc(s.title)+'</h2><p>'+esc(s.body)+'</p></section>').join('');
 return '<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'"><title>'+esc(t.title)+'</title>'+
 '<style>*{box-sizing:border-box}body{background:#11131a;color:#f5f5fa;font:18px system-ui;margin:0;padding:clamp(16px,4vw,64px)}main{max-width:1000px;margin:auto}section{min-height:48vh;border:1px solid #4a4c55;border-radius:24px;padding:clamp(20px,6vw,70px);background:#20232d;animation:enter .35s ease-out}section[hidden]{display:none}h2{font-size:clamp(28px,5vw,58px)}p{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55}small{color:#ff9292}button{font:inherit;color:inherit;background:#292e3a;padding:12px;border:1px solid #737887;border-radius:12px;margin:8px 8px 0 0}progress{width:100%;margin-top:20px}@keyframes enter{from{opacity:.25;transform:translateY(8px)}to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){section{animation:none}}</style>'+
 '<main><h1>'+esc(t.title)+'</h1>'+sections+'<progress aria-label="Fortschritt" value="0" max="1"></progress><div><button id="prev">Zurück</button><button id="play">Abspielen</button><button id="next">Weiter</button></div><p id="status" aria-live="polite"></p></main>'+
 '<script>(()=>{const scenes=[...document.querySelectorAll("section")],play=document.getElementById("play"),bar=document.querySelector("progress"),status=document.getElementById("status");let index=0,elapsed=0,last=0,running=false,frame=0;const duration=()=>Number(scenes[index].dataset.seconds)*1000;function stop(){running=false;cancelAnimationFrame(frame);play.textContent="Abspielen"}function show(i){scenes[index].hidden=true;index=i;scenes[index].hidden=false;elapsed=0;bar.value=0;status.textContent="Szene "+(index+1)+" von "+scenes.length;last=performance.now()}function tick(now){if(!running)return;elapsed+=Math.max(0,now-last);last=now;while(elapsed>=duration()){if(index===scenes.length-1){bar.value=1;stop();return}const rest=elapsed-duration();show(index+1);elapsed=rest;last=now}bar.value=Math.min(1,elapsed/duration());frame=requestAnimationFrame(tick)}play.onclick=()=>{if(running){stop();return}if(bar.value===1)show(0);running=true;play.textContent="Pause";last=performance.now();frame=requestAnimationFrame(tick)};document.getElementById("prev").onclick=()=>{stop();show(Math.max(0,index-1))};document.getElementById("next").onclick=()=>{stop();show(Math.min(scenes.length-1,index+1))};document.addEventListener("visibilitychange",()=>{if(document.hidden)stop()});show(0)})()</script></html>';
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 const [input,output]=process.argv.slice(2);
 if(!input||!output||process.argv.length!==4||!output.toLowerCase().endsWith('.html'))throw Error('Aufruf: node tools/red-video-preview.mts eingabe.json ausgabe.html');
 const meta=await stat(input);if(!meta.isFile()||meta.size>MAX_INPUT)throw Error('Eingabedatei zu gross oder ungültig');
 const data=await readFile(input);if(data.byteLength>MAX_INPUT)throw Error('Eingabedatei zu gross');
 await writeFile(output,renderVideoPreview(JSON.parse(data.toString('utf8'))),{flag:'wx',mode:0o600});
}
