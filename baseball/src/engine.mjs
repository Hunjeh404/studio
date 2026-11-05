import{deriveEffects}from'./effects.mjs';import{gameAwards}from'./awards.mjs';
export const TEAMS={KT:{name:'KT',fullName:'KT 위즈',color:'#252a34',accent:'#ef4355'},SS:{name:'삼성',fullName:'삼성 라이온즈',color:'#3475cf',accent:'#f4f7ff'}};
export const POS={투수:1,포수:2,'1루수':3,'2루수':4,'3루수':5,유격수:6,좌익수:7,중견수:8,우익수:9};
const initialCode={'一':3,'二':4,'三':5,'유':6,'좌':7,'중':8,'우':9,'포':2};
export const clone=x=>JSON.parse(JSON.stringify(x));
export function buildReplay(data,{live=false}={}){
 const {events,official}=data;const defense={KT:{},SS:{}};
 for(const t of ['KT','SS']){
  for(const p of official.starting_lineups[t]){const pos=initialCode[p.position_code_original[0]];if(pos)defense[t][pos]=p.name;}
  defense[t][1]=official.pitchers[t][0].name;
 }
 let s={inning:1,half:'초',team:'SS',score:{KT:0,SS:0},outs:0,bases:{},balls:0,strikes:0,batter:official.starting_lineups.SS[0].name,defense};
 const scenes=[];
 const add=(kind,before,after,es,extra={})=>{const scene={index:scenes.length,kind,before:clone(before),after:clone(after),events:es.map(e=>e.text),sourceIds:es.map(e=>e.id),...extra};scene.effects=deriveEffects(scene);scenes.push(scene);};
 const importState=e=>{s.outs=e.state_after.outs;s.score=clone(e.state_after.score);s.bases=clone(e.state_after.runners);};
 function change(e){
  const t=e.text;const fld=s.team==='KT'?'SS':'KT';
  if(e.type==='pinch_runner'){importState(e);return;}
  const sub=t.match(/^(.+?) (\S+) : (.+?) (\S+) \(으\)로 교체$/);
  if(sub){const [,oldPos,oldName,newPos,newName]=sub;
   if(newPos==='대타'){s.batter=newName;return;}
   for(const p of Object.keys(s.defense[fld]))if(s.defense[fld][p]===oldName)delete s.defense[fld][p];
   if(POS[newPos])s.defense[fld][POS[newPos]]=newName;
  }
  const move=t.match(/^(.+?) (\S+) : (.+?)\(으\)로 수비위치 변경$/);
  if(move){const [,oldPos,name,pos]=move;for(const p of Object.keys(s.defense[fld]))if(s.defense[fld][p]===name)delete s.defense[fld][p];if(POS[pos])s.defense[fld][POS[pos]]=name;}
 }
 for(let i=0;i<events.length;i++){
  const e=events[i];
  if(e.type==='half_inning'){
   const b=clone(s);s.inning=e.inning;s.half=e.half;s.team=e.batting_team;s.outs=0;s.bases={};s.balls=0;s.strikes=0;s.batter='';
   add('inning',b,s,[e],{label:e.text,duration:1.4});
  }else if(e.type==='batter_start'){s.batter=e.text.match(/번타자 (\S+)/)[1];s.balls=0;s.strikes=0;}
  else if(['substitution','position_change','pinch_runner'].includes(e.type)){
   const b=clone(s),es=[e];change(e);
   while(events[i+1]&&['substitution','position_change','pinch_runner'].includes(events[i+1].type)){es.push(events[++i]);change(events[i]);}
   add('change',b,s,es,{label:es[0].text,duration:2});
  }else if(e.type==='pitch'||e.type==='automatic_ball'){
   const b=clone(s),es=[e],pitch=e.naver??{};let result=null;let moves=[];
   const r=e.result??e.text;
   if(r.includes('볼'))s.balls++;
   else if(r.includes('스트라이크')||r.includes('헛스윙'))s.strikes++;
   else if(r.includes('파울'))s.strikes=Math.max(s.strikes,Math.min(2,s.strikes+1));
   while(events[i+1]&&['plate_appearance_result','runner'].includes(events[i+1].type)){
    const n=events[++i];es.push(n);importState(n);if(n.type==='plate_appearance_result')result=n;else moves.push(n);
   }
   if(result){s.balls=0;s.strikes=0;}
   add(e.type==='automatic_ball'?'automatic':'pitch',b,s,es,{pitch,number:e.number,batter:b.batter,pitcher:b.defense[b.team==='KT'?'SS':'KT'][1],result:result?.text??null,batterTo:result?.batter_to??null,homeRun:!!result?.text.includes('홈런'),moves:moves.map(x=>({name:x.player,from:x.from_base,to:x.to_base,out:x.out,text:x.text})),label:result?.text??e.text,duration:result?.text.includes('홈런')?18:result?5.3:moves.length?4.5:2.2});
  }else if(e.type==='plate_appearance_result'){
   const b=clone(s),es=[e],moves=[];importState(e);s.balls=0;s.strikes=0;while(events[i+1]?.type==='runner'){const n=events[++i];es.push(n);importState(n);moves.push({name:n.player,from:n.from_base,to:n.to_base,out:n.out,text:n.text});}add('result',b,s,es,{result:e.text,batter:b.batter,batterTo:e.batter_to,moves,label:e.text,duration:4.5});
  }else if(e.type==='info'&&(/마운드 방문|비디오 판독/.test(e.text))){add('info',s,s,[e],{label:e.text,duration:1.4});}
 }
 if(live){if(scenes.length>1)scenes.pop();return scenes;}const awards=gameAwards(data,scenes);add('ceremony',s,s,[],{awards,label:'경기 종료',duration:16});
 return scenes;
}
export function trajectoryPoint(p,u){
 if(!p)return{x:0,y:50*(1-u),z:5*(1-u)};
 const end=p.crossPlateY??0.7083;const discriminant=p.vy0*p.vy0-2*p.ay*(p.y0-end);
 const tEnd=(-p.vy0-Math.sqrt(Math.max(0,discriminant)))/p.ay;const t=Math.max(0,Math.min(1,u))*tEnd;
 return{x:p.x0+p.vx0*t+.5*p.ax*t*t,y:p.y0+p.vy0*t+.5*p.ay*t*t,z:p.z0+p.vz0*t+.5*p.az*t*t};
}
export function pathToBase(from,to){const route=[];for(let n=from;n<=to;n++)route.push(n);return route;}
