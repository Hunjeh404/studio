// Sound Maze pronunciation judge.
// Browser sends a short 16 kHz mono WAV of the child saying one word. This function checks the Supabase session,
// asks Azure pronunciation assessment how close it was to the target word, and
//  - single play: returns the score (records stay on the device),
//  - multiplayer: hands the score to public.wordmaze_judge with the service role so the server decides the step.
// Secrets: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION (set in the Supabase dashboard).
const WORDS = new Set(['apple','banana','grape','orange','pear','peach','cherry','lemon','kiwi','melon','strawberry','pineapple','watermelon','mango','coconut','tomato','olive','lime','blueberry','avocado','cat','dog','pig','cow','duck','fish','bee','fox','owl','bat','monkey','panda','koala','zebra','tiger','whale','snake','horse','sheep','mouse','frog','turtle','dolphin','giraffe','squirrel','octopus','elephant','butterfly','crocodile','kangaroo']);
const ORIGINS = ['https://wordmaze.web.app','https://wordmaze.firebaseapp.com','https://kaylastudio.web.app','http://localhost:5173','http://localhost:4173'];
const cors = (req: Request) => {
  const origin = req.headers.get('origin') || '';
  return {'Access-Control-Allow-Origin': ORIGINS.includes(origin) ? origin : ORIGINS[0], 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin'};
};
const reply = (req: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), {status, headers: {...cors(req), 'Content-Type': 'application/json'}});
const fail = (req: Request, message: string, status = 400) => reply(req, {error: message}, status);

type Azure = {RecognitionStatus?: string; NBest?: {AccuracyScore?: number; Words?: {Word?: string; AccuracyScore?: number; ErrorType?: string}[]}[]};
export function scoreOf(result: Azure, word: string) {
  const spoken = result.RecognitionStatus === 'Success';
  const best = result.NBest?.[0];
  if (!spoken || !best) return {spoken, score: 0};
  const hit = best.Words?.find(w => (w.Word || '').toLowerCase() === word);
  if (hit) return {spoken, score: hit.ErrorType === 'Omission' ? 0 : Math.round(hit.AccuracyScore ?? 0)};
  return {spoken, score: Math.round(best.AccuracyScore ?? 0)};
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', {headers: cors(req)});
  if (req.method !== 'POST') return fail(req, '허용되지 않은 요청입니다.', 405);
  const url = Deno.env.get('SUPABASE_URL')!, anon = Deno.env.get('SUPABASE_ANON_KEY')!, service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const key = Deno.env.get('AZURE_SPEECH_KEY') || '', region = (Deno.env.get('AZURE_SPEECH_REGION') || '').trim().toLowerCase();
  if (!key || !region) return fail(req, '발음 판정 설정이 아직 끝나지 않았습니다.', 503);

  // 1. Signed-in (non-anonymous) users only.
  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const who = await fetch(`${url}/auth/v1/user`, {headers: {apikey: anon, Authorization: `Bearer ${jwt}`}});
  const user = who.ok ? await who.json() : null;
  if (!user?.id || user.is_anonymous) return fail(req, '로그인 후 이용해 주세요.', 401);

  // 2. Validate the request.
  let body: {audio?: string; word?: string; accent?: string; mode?: string; id?: string; progress?: number};
  try { body = await req.json(); } catch { return fail(req, '요청을 읽지 못했습니다.'); }
  const word = String(body.word || ''), accent = body.accent === 'en-US' ? 'en-US' : body.accent === 'en-GB' ? 'en-GB' : '';
  if (!WORDS.has(word) || !accent) return fail(req, '단어 설정을 확인해 주세요.');
  if (typeof body.audio !== 'string' || body.audio.length < 2000 || body.audio.length > 800000) return fail(req, '녹음이 너무 짧거나 깁니다. 다시 말해 주세요.');
  let audio: Uint8Array;
  try { audio = Uint8Array.from(atob(body.audio), c => c.charCodeAt(0)); } catch { return fail(req, '녹음을 읽지 못했습니다.'); }
  if (String.fromCharCode(...audio.slice(0, 4)) !== 'RIFF') return fail(req, '녹음 형식을 확인해 주세요.');

  // 3. Azure pronunciation assessment against the target word.
  const config = btoa(JSON.stringify({ReferenceText: word, GradingSystem: 'HundredMark', Granularity: 'Phoneme', Dimension: 'Comprehensive', EnableMiscue: true}));
  let result: Azure;
  try {
    const r = await fetch(`https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${accent}&format=detailed`, {method: 'POST', headers: {'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000', 'Pronunciation-Assessment': config, Accept: 'application/json'}, body: audio});
    if (r.status === 429) return fail(req, '이번 달 발음 판정 사용량을 모두 썼거나 요청이 많습니다. 잠시 후 다시 해 주세요.', 429);
    if (!r.ok) return fail(req, '발음 판정 서버에 연결하지 못했습니다. 다시 말해 주세요.', 502);
    result = await r.json();
  } catch { return fail(req, '발음 판정 서버에 연결하지 못했습니다. 다시 말해 주세요.', 502); }
  const {spoken, score} = scoreOf(result, word);
  if (body.mode !== 'multi') return reply(req, {score, spoken});

  // 4. Multiplayer: the database decides the step for this user's run.
  const rpc = await fetch(`${url}/rest/v1/rpc/wordmaze_judge`, {method: 'POST', headers: {apikey: service, Authorization: `Bearer ${service}`, 'Content-Type': 'application/json'}, body: JSON.stringify({uid: user.id, args: {id: body.id, progress: body.progress, word, score, spoken}})});
  const data = await rpc.json().catch(() => null);
  if (!rpc.ok) return fail(req, (data && (data.message as string)) || '기록을 확인하지 못했습니다. 다시 말해 주세요.');
  return reply(req, data);
});
