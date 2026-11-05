// 수파베이스에 저장된 경기 불러오기 (수집은 bb-collect 함수가 함)
const URL_='https://rxzqlopkrlftbkzxrqmd.supabase.co/rest/v1/',KEY='sb_publishable_bclbp7IfVuBQpzEFB-yJ5w_LhzyO0yo';
async function get(path){const r=await fetch(URL_+path,{headers:{apikey:KEY}});if(!r.ok)throw new Error(`${r.status} ${path}`);return r.json();}
export const listGames=()=>get('bb_games?select=game_id,game_date,away,home,status,series,event_count&event_count=gt.0&order=game_date,start_time');
export async function fetchEvents(id,from=0){const out=[];for(;;){const rows=await get(`bb_events?game_id=eq.${id}&seq=gte.${from+out.length}&select=ev&order=seq&limit=1000`);out.push(...rows.map(r=>r.ev));if(rows.length<1000)return out;}}
export async function fetchGame(id){const [[row],events]=await Promise.all([get(`bb_games?game_id=eq.${id}&select=status,meta`),fetchEvents(id)]);return{...row.meta,events,status:row.status};}
export async function fetchStatus(id){const [row]=await get(`bb_games?game_id=eq.${id}&select=status,event_count`);return row;}
