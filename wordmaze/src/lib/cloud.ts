import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_PUBLIC_KEY} from './supabase-config';
let client:SupabaseClient|undefined;
// Only called after the user chooses multiplayer. Single player never initializes Auth or makes a Supabase request.
export function supabase(){return client??=createClient(SUPABASE_URL,SUPABASE_PUBLIC_KEY,{auth:{flowType:'pkce',storageKey:'wordmaze-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});}
export async function rpc<T>(op:string,args:Record<string,unknown>={}):Promise<T>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{const {data,error}=await supabase().rpc('wordmaze_api',{op,args}).abortSignal(controller.signal);if(error)throw Error(error.message||'연결이 늦습니다. 다시 시도해 주세요.');return data as T;}finally{clearTimeout(timer);}}
export async function login(mode:'single'|'multi'='multi'){sessionStorage.setItem('wordmaze-mode',mode);const url=new URL('.',location.href);url.search='';url.hash='';const {error}=await supabase().auth.signInWithOAuth({provider:'google',options:{redirectTo:url.href}});if(error)throw Error('Google 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.');}
// Sends one recording to the wordmaze-judge Edge Function (Azure pronunciation assessment).
export async function judge<T>(body:Record<string,unknown>):Promise<T>{
 const {data,error}=await supabase().functions.invoke('wordmaze-judge',{body});
 if(error){let message='발음을 확인하지 못했습니다. 다시 말해 주세요.';try{const ctx=(error as {context?:Response}).context;const j=ctx?await ctx.json():null;if(j?.error)message=j.error;}catch{}throw Error(message);}
 return data as T;
}
