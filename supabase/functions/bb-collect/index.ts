// 애니멀리그 경기 수집기: 다음 스포츠(주) → KBO 문자중계(백업) → bb_games / bb_events
import { convertDaum } from './daum.mjs';
import { kboLiveText } from './kbo.mjs';

const URL_ = Deno.env.get('SUPABASE_URL')!, KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const DAUM = 'https://sports.daum.net/api/hermes/game';
const SERIES: Record<string, number> = { 정규시즌: 0, 와일드카드: 4, 준플레이오프: 3, 플레이오프: 5, 한국시리즈: 7 };
const DONE = ['END', 'CANCEL', 'SUSPENDED'];

async function db(path: string, init: RequestInit = {}) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers ?? {}) } });
  if (!r.ok) throw new Error(`db ${path} ${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json().catch(() => null);
}
const getJson = async (u: string) => { const r = await fetch(u, { signal: AbortSignal.timeout(15000) }); if (!r.ok) throw new Error(`${r.status} ${u}`); return r.json(); };
const kst = (d = new Date()) => new Date(d.getTime() + 9 * 3600e3);
const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
const kboId = (cp: string) => { const [c, y] = cp.split('|'); return y + c.slice(4); };

async function refreshList(from: string, to: string) {
  const j = await getJson(`${DAUM}/list.json?leagueCode=kbo&fromDate=${from}&toDate=${to}`);
  const rows = (j.list ?? []).map((g: any) => {
    const c = String(g.cpGameId).split('|')[0], sd = String(g.startDate);
    return { game_id: String(g.gameId), kbo_id: kboId(g.cpGameId), game_date: `${sd.slice(0, 4)}-${sd.slice(4, 6)}-${sd.slice(6, 8)}`, start_time: g.startTime, away: c.slice(8, 10), home: c.slice(10, 12), status: g.gameStatus, series: g.gameType?.gameTypeId === 3 ? `${g.gameDetailType?.nameKo} ${g.matchSeq}차전` : g.gameDetailType?.nameKo, updated_at: new Date().toISOString() };
  });
  if (rows.length) await db('bb_games?on_conflict=game_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(rows) });
  return rows;
}

async function fromDaum(gameId: string) {
  const d = await getJson(`${DAUM}/get.json?gameId=${gameId}&detail=liveData`);
  if (!d.liveData?.liveText?.length && d.gameStatus !== 'BEFORE') throw new Error('daum empty');
  return d;
}
async function fromKbo(row: any) {
  const meta = row.source_meta;
  if (!meta) throw new Error('no daum meta for kbo backup');
  const seriesId = SERIES[(row.series ?? '').split(' ')[0]] ?? 0;
  const r = await fetch(`https://www.koreabaseball.com/Game/LiveTextView2.aspx?leagueId=1&seriesId=${seriesId}&gameId=${row.kbo_id}&gyear=${row.kbo_id.slice(0, 4)}`, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`kbo ${r.status}`);
  const items = kboLiveText(await r.text(), { T: meta.homeStartPitcher?.nameKo, B: meta.awayStartPitcher?.nameKo });
  if (!items.length) throw new Error('kbo empty');
  return { ...meta, liveData: { liveText: items } };
}

async function collect(gameId: string, force?: 'daum' | 'kbo') {
  const [row] = await db(`bb_games?game_id=eq.${gameId}&select=*`);
  let d: any, source = 'daum';
  try { if (force === 'kbo') throw new Error('forced'); d = await fromDaum(gameId); }
  catch (e) { if (force === 'daum') throw e; source = 'kbo'; d = await fromKbo(row ?? {}); }
  const g = convertDaum(d);
  const { events, ...meta } = g;
  const old = row?.event_count ?? 0, from = source === 'daum' ? Math.max(0, old - 10) : 0;
  const rows = events.slice(from).map((ev: any) => ({ game_id: gameId, seq: ev.id, ev }));
  const patch: any = { meta, event_count: events.length, source, collected_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  if (source === 'daum') { const { liveData, ...sm } = d; patch.source_meta = sm; patch.status = d.gameStatus; }
  await db(`bb_games?game_id=eq.${gameId}`, { method: 'PATCH', body: JSON.stringify(patch) });
  for (let i = 0; i < rows.length; i += 300) await db('bb_events?on_conflict=game_id,seq', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(rows.slice(i, i + 300)) });
  if (events.length < old) await db(`bb_events?game_id=eq.${gameId}&seq=gte.${events.length}`, { method: 'DELETE' });
  return { gameId, source, events: events.length, wrote: rows.length, status: patch.status };
}

async function tick() {
  const now = kst(), today = ymd(now);
  await refreshList(today, today);
  const games = await db(`bb_games?game_date=eq.${now.toISOString().slice(0, 10)}&select=game_id,start_time,status`);
  const hm = now.getUTCHours() * 60 + now.getUTCMinutes();
  const live = games.filter((g: any) => { const s = +g.start_time.slice(0, 2) * 60 + +g.start_time.slice(2); return !DONE.includes(g.status) && hm >= s - 20; });
  const out: any[] = [];
  for (let round = 0; round < 3 && live.length; round++) {
    if (round) await new Promise(r => setTimeout(r, 18000));
    for (const g of live) { try { const r = await collect(g.game_id); out.push(r); g.status = r.status ?? g.status; } catch (e) { out.push({ gameId: g.game_id, error: String(e) }); } }
    live.splice(0, live.length, ...live.filter((g: any) => !DONE.includes(g.status)));
  }
  return out;
}

Deno.serve(async req => {
  const key = req.headers.get('x-collect-key');
  const ok = key && (await db(`bb_config?key=eq.collect_key&select=value`))?.[0]?.value === key;
  if (!ok) return new Response('forbidden', { status: 403 });
  const q = req.method === 'POST' ? await req.json().catch(() => ({})) : Object.fromEntries(new URL(req.url).searchParams);
  try {
    let result: any;
    if (q.mode === 'backfill') {
      const list = await refreshList(q.from, q.to);
      result = [];
      for (const g of list.filter((g: any) => g.status === 'END')) { try { result.push(await collect(g.game_id)); } catch (e) { result.push({ gameId: g.game_id, error: String(e) }); } }
    } else if (q.mode === 'collect') result = await collect(q.gameId, q.force);
    else if (q.mode === 'selftest') {
      const [row] = await db(`bb_games?game_id=eq.${q.gameId}&select=*`);
      const a = convertDaum(await fromDaum(q.gameId)).events, b = convertDaum(await fromKbo(row)).events;
      const diff = a.map((e: any, i: number) => [e, b[i]]).filter(([e, f]: any) => !f || e.text !== f.text || e.type !== f.type || JSON.stringify(e.state_after) !== JSON.stringify(f.state_after) || (e.pitcher ?? '') !== (f.pitcher ?? '') || (e.batter ?? '') !== (f.batter ?? ''));
      result = { daum: a.length, kbo: b.length, diffs: diff.length, sample: diff.slice(0, 8).map(([e, f]: any) => [e.id, e.text, e.type, f?.text, f?.type, e.pitcher, f?.pitcher, e.batter, f?.batter]) };
    } else result = await tick();
    return Response.json({ ok: true, result });
  } catch (e) { return Response.json({ ok: false, error: String(e) }, { status: 500 }); }
});
