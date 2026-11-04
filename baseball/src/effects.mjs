// Shared event rules: replay and a future live adapter use this same module.
const POS={투수:1,포수:2,'1루수':3,'2루수':4,'3루수':5,유격수:6,좌익수:7,중견수:8,우익수:9};
const hash=s=>{let n=2166136261;for(const c of s){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return(n>>>0).toString(36);};
export function deriveEffects(play){
 const effects=[],before=play.before??{},team=before.team??play.team,fld=team==='KT'?'SS':'KT';const text=play.result??'';const all=play.events??(text?[text]:[]);const id=String(play.id??play.pitch?.ptsPitchId??play.sourceIds?.join('-')??hash(all.join('|')));const add=(kind,extra={})=>effects.push({id:id+':'+kind+':'+effects.length,kind,...extra});
 if(/(?:[123]루타|내야안타|홈런)/.test(text)&&!/아웃|실책으로 출루/.test(text))add('star_trail',{start:.35,end:.92,label:'반짝! 클린 히트!',homeRun:/홈런/.test(text)});
 if(play.homeRun||/홈런/.test(text))add('home_run_burst',{start:.44,end:.82,label:'홈런!'});
 if(/병살타/.test(text))add('double_play',{start:.65,end:.98,label:'더블 플레이!'});
 const targets=new Set();const lightning=(key,cause,start=.65)=>{if(!key||key.endsWith(':undefined')||targets.has(key))return;targets.add(key);add('lightning',{targetKey:key,cause,start,end:Math.min(.99,start+.28),label:cause==='wild_pitch'?'앗! 폭투!':cause==='caught_stealing'?'앗! 도루 실패!':cause==='passed_ball'?'앗! 포일!':'앗! 수비 실책!'});};
 for(const row of all){
  if(/폭투/.test(row))lightning(before.defense?.[fld]?.[1]?fld+':'+before.defense[fld][1]:null,'wild_pitch',.43);
  if(/포일/.test(row))lightning(before.defense?.[fld]?.[2]?fld+':'+before.defense[fld][2]:null,'passed_ball',.45);
  if(/실책/.test(row)){
   const detail=row.match(/\(([^)]*실책[^)]*)\)/)?.[1]??row;const found=[...detail.matchAll(/(투수|포수|1루수|2루수|3루수|유격수|좌익수|중견수|우익수)[^:()→>]*?(?:송구|포구)?\s*실책/g)];
   const pos=found.length?POS[found[0][1]]:null;const name=pos?before.defense?.[fld]?.[pos]:null;if(name)lightning(fld+':'+name,'fielding_error',.66);
  }
 }
 for(const m of play.moves??[]){if(m.out&&/도루실패/.test(m.text))lightning(team+':'+m.name,'caught_stealing',.68);else if(/도루로/.test(m.text))add('speed_lines',{targetKey:team+':'+m.name,start:.36,end:.9,label:'슝! 도루 성공!'});}
 return effects;
}
export function effectProgress(effect,u){return Math.max(0,Math.min(1,(u-effect.start)/(effect.end-effect.start)));}
export function activeEffects(play,u){return(play.effects??deriveEffects(play)).filter(e=>u>=e.start&&u<=e.end);}
export class LiveEffectBridge{
 constructor(){this.seen=new Set();}
 accept(play){const effects=deriveEffects(play);return effects.filter(e=>{const id=(play.gameId??'game')+':'+e.id;if(this.seen.has(id))return false;this.seen.add(id);return true;});}
 reset(){this.seen.clear();}
}
