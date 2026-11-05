// KBO 문자중계(LiveTextView2.aspx) HTML → 다음 liveText와 같은 모양의 항목 (백업용)
const unescape=s=>s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
function styleOf(t){
 if(/^\d+회[초말] .+ 공격$/.test(t))return 0;
 if(/\(으\)로 교체$|수비위치 변경$/.test(t))return 2;
 if(/^\d루주자 /.test(t))return 14;
 if(/^\d+번타자 \S+$/.test(t))return 8;
 if(/^\d+구 /.test(t))return/피치클락|자동/.test(t)?7:1;
 if(/^\S+ : /.test(t))return 13;
 return t.startsWith('경기종료')||/^(승리|패전|세이브)투수|^=+$/.test(t)?99:7;
}
export function kboLiveText(html,start={}){
 const blocks=new Map();
 for(const m of html.matchAll(/rptLiveText(\d+)_spanLiveText_(\d+)"[^>]*>([^<]*)/g)){
  const t=unescape(m[3].replace(/\s+/g,' ').trim().replace(/^- /,''));if(!t)continue;
  const b=Number(m[1]);if(!blocks.has(b))blocks.set(b,[]);blocks.get(b).push([Number(m[2]),t]);
 }
 const lines=[...blocks.keys()].sort((a,b)=>a-b).flatMap(b=>blocks.get(b).sort((x,y)=>y[0]-x[0]).map(x=>x[1]));
 let period='T01',batter='';const pitchers={T:start.T??'',B:start.B??''};const items=[];
 for(const t of lines){
  const textstyle=styleOf(t);
  if(textstyle===0){const m=t.match(/^(\d+)회([초말])/);period=(m[2]==='초'?'T':'B')+m[1].padStart(2,'0');batter='';}
  if(textstyle===8)batter=t.match(/번타자 (\S+)$/)[1];
  const sub=t.match(/^투수 \S+ : 투수 (\S+) \(으\)로 교체$/);if(sub)pitchers[period[0]]=sub[1];
  if(textstyle===2){const pb=t.match(/: 대타 (\S+) \(으\)로 교체$/);if(pb)batter=pb[1];}
  const pitch=textstyle===1||textstyle===7&&/^\d+구 /.test(t);
  items.push({period,textstyle,text:t,batter:'',pitcher:'',batterName:batter,pitcherName:pitchers[period[0]],balltype:pitch?'P':'',speed:0,stuff:'',ballCount:0});
 }
 return items;
}
