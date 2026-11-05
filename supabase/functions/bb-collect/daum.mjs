// 다음 스포츠 경기 데이터(game/get.json?detail=liveData) → 재생용 경기 데이터
const STUFF={FAST:'직구',TWOS:'투심',CUTT:'커터',SLID:'슬라이더',SWEE:'스위퍼',CURV:'커브',CHUP:'체인지업',FORK:'포크',SPLI:'스플리터',SINK:'싱커',KNUC:'너클볼'};
const POS_CODE={포수:'포','1루수':'一','2루수':'二','3루수':'三',유격수:'유',좌익수:'좌',중견수:'중',우익수:'우',지명타자:'지'};
const BASE={'1':1,'2':2,'3':3};

function typeOf(x){
 const t=x.text,s=x.textstyle;
 if(s===0)return'half_inning';
 if(s===8)return'batter_start';
 if(s===1)return'pitch';
 if(s===13||s===23)return'plate_appearance_result';
 if(s===14||s===24)return/대주자 .+\(으\)로 교체/.test(t)?'pinch_runner':'runner';
 if(s===2)return/수비위치 변경/.test(t)?'position_change':/대주자 .+\(으\)로 교체/.test(t)?'pinch_runner':'substitution';
 if(/^\d+구 /.test(t)&&x.balltype)return'automatic_ball';
 return'info';
}

function batterTo(t){
 if(/홈런/.test(t))return 4;
 if(/3루타/.test(t))return 3;
 if(/2루타/.test(t))return 2;
 if(/낫 아웃/.test(t))return/아웃\)|태그아웃|터치아웃|송구아웃/.test(t.replace(/^.*낫 아웃/,''))?null:1;
 if(/아웃/.test(t))return null;
 if(/1루타|안타|볼넷|4구|몸에 맞는|출루/.test(t))return 1;
 return null;
}

export function convertDaum(d){
 const cp=String(d.cpGameId).split('|')[0];
 const away=cp.slice(8,10),home=cp.slice(10,12);
 const persons={[home]:d.homePerson??[],[away]:d.awayPerson??[]};
 const nameOf={},players={};
 for(const team of [home,away])for(const p of persons[team]){
  nameOf[p.cpPersonId]=p.nameKo;
  players[`${team}:${p.nameKo}`]={name:p.nameKo,backnum:p.backNumber??'',pcode:p.cpPersonId,posName:p.positionNameKo??null};
 }
 const st={outs:0,score:{[home]:0,[away]:0},runners:{}};
 const snap=()=>({outs:st.outs,score:{...st.score},runners:{...st.runners}});
 const pitchers={[home]:[],[away]:[]};
 const events=(d.liveData?.liveText??[]).map((x,id)=>{
  const t=x.text,type=typeOf(x);
  const inning=Number(x.period.slice(1)),half=x.period[0]==='T'?'초':'말';
  const batting_team=half==='초'?away:home,fielding=half==='초'?home:away;
  const e={id,text:t,type,inning,half,batting_team};
  if(type==='pitch'&&nameOf[x.pitcher]&&!pitchers[fielding].includes(nameOf[x.pitcher]))pitchers[fielding].push(nameOf[x.pitcher]);
  if(type==='half_inning'){st.outs=0;st.runners={};}
  else if(type==='pitch'||type==='automatic_ball'){
   const m=t.match(/^(\d+)구 (.+)$/);
   e.number=m?Number(m[1]):x.ballCount;e.result=m?m[2]:t;
   e.batter=nameOf[x.batter]??x.batterName??'';e.pitcher=nameOf[x.pitcher]??x.pitcherName??'';
   e.naver={speed:x.speed?String(x.speed):'',stuff:STUFF[x.stuff]??x.stuff??'',pitchResult:x.balltype};
  }else if(type==='plate_appearance_result'){
   const name=t.split(' : ')[0];e.batter=name;
   const to=batterTo(t.slice(name.length+3));
   if(to===4)st.score[batting_team]++;
   else if(to)st.runners[name]=to;
   else st.outs++;
   if(to)e.batter_to=to;
  }else if(type==='runner'||type==='pinch_runner'){
   const m=t.match(/^(\d)루주자 (\S+) : (.+)$/);
   if(m){
    const [,from,name,rest]=m;e.player=name;e.from_base=BASE[from];
    if(type==='pinch_runner'){const r=rest.match(/대주자 (\S+)/);e.replacement=r?.[1];delete st.runners[name];if(r)st.runners[r[1]]=e.from_base;}
    else if(/홈인/.test(rest)){e.to_base=4;delete st.runners[name];st.score[batting_team]++;}
    else if(/아웃/.test(rest)){e.out=true;delete st.runners[name];st.outs++;}
    else{const b=rest.match(/(\d)루까지/);if(b){e.to_base=Number(b[1]);st.runners[name]=e.to_base;}}
   }
  }
  e.state_after=snap();
  return e;
 });
 const lineup=team=>persons[team].filter(p=>p.isStarted&&p.battingOrder).sort((a,b)=>a.battingOrder-b.battingOrder)
  .map(p=>({batting_order:p.battingOrder,name:p.nameKo,position_code_original:POS_CODE[p.positionNameKo]??p.positionNameKo}));
 const startP={[home]:d.homeStartPitcher?.nameKo,[away]:d.awayStartPitcher?.nameKo};
 for(const t of [home,away])if(startP[t]&&pitchers[t][0]!==startP[t])pitchers[t]=[startP[t],...pitchers[t].filter(n=>n!==startP[t])];
 const sd=String(d.startDate);
 return{
  game:{date:`${sd.slice(0,4)}.${sd.slice(4,6)}.${sd.slice(6,8)}`,venue:d.field?.nameKo??'',away,home,series:d.gameType?.gameTypeId===3?`${d.gameDetailType?.nameKo??''} ${d.matchSeq}차전`:d.gameDetailType?.nameKo??''},
  events,
  official:{game_id:sd+cp.slice(8),away,home,starting_lineups:{[away]:lineup(away),[home]:lineup(home)},pitchers:{[away]:pitchers[away].map(name=>({name})),[home]:pitchers[home].map(name=>({name}))}},
  players,
 };
}
