// Match the recognizer's first final transcript, never a guessed target or an interim result.
export function normalizeWord(value:unknown):string {
 if(typeof value!=='string'||value.length>120)return '';
 return value.normalize('NFKC').toLowerCase().replace(/[.,!?;:。！？]/g,'').trim().replace(/\s+/g,' ');
}
// Compound words the recognizer may return as two words.
const splitWords=new Set(['pineapple','watermelon','blueberry','butterfly']);
export function matchesWord(transcript:unknown,target:string):boolean {
 const heard=normalizeWord(transcript);
 return heard!==''&&(heard===target||heard.replace(/ /g,'')===target&&splitWords.has(target));
}
export interface RecognitionResult {isFinal:boolean;0?:{transcript:string};}
export interface RecognitionEvent {results:ArrayLike<RecognitionResult>;}
export interface WordRecognition {
 lang:string;continuous:boolean;interimResults:boolean;maxAlternatives:number;
 onstart:(()=>void)|null;onend:(()=>void)|null;
 onresult:((event:RecognitionEvent)=>void)|null;
 onerror:((event:{error:string})=>void)|null;
 start():void;stop():void;abort():void;
}
export type RecognitionConstructor=new()=>WordRecognition;
export function recognitionConstructor():RecognitionConstructor|undefined {
 if(typeof window==='undefined')return;
 const w=window as unknown as {SpeechRecognition?:RecognitionConstructor;webkitSpeechRecognition?:RecognitionConstructor};
 return w.SpeechRecognition||w.webkitSpeechRecognition;
}
export function recognitionError(code:string):string {
 switch(code){
  case 'not-allowed':case 'service-not-allowed':return '마이크 사용을 허용해 주세요. 권한을 차단하셨다면 브라우저 설정에서 변경해 주세요.';
  case 'audio-capture':return '마이크를 사용할 수 없습니다. 다른 앱의 마이크 사용을 확인해 주세요.';
  case 'network':return '음성인식에 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 말해 주세요.';
  case 'language-not-supported':return '선택한 영어를 인식하지 못했습니다. 다른 영어 설정이나 브라우저를 이용해 주세요.';
  case 'no-speech':return '소리가 들리지 않습니다. 마이크 가까이에서 다시 말해 주세요.';
  default:return '단어를 인식하지 못했습니다. 버튼을 다시 누르고 말해 주세요.';
 }
}
export function startWordRecognition(options:{Constructor:RecognitionConstructor;lang:string;onListening:()=>void;onProcessing:()=>void;onResult:(transcript:string)=>void;onError:(message:string)=>void}) {
 const rec=new options.Constructor();rec.lang=options.lang;rec.continuous=false;rec.interimResults=false;rec.maxAlternatives=1;
 let done=false,started=false,released=false,transcript='',processing=false;
 let hold:ReturnType<typeof setTimeout>|undefined,deadline:ReturnType<typeof setTimeout>|undefined;
 const clear=()=>{clearTimeout(hold);clearTimeout(deadline);rec.onstart=null;rec.onend=null;rec.onresult=null;rec.onerror=null;};
 const fail=(message:string)=>{if(done)return;done=true;clear();try{rec.abort();}catch{}options.onError(message);};
 const pending=()=>{if(processing)return;processing=true;options.onProcessing();};
 const stop=()=>{if(done||released)return;released=true;clearTimeout(hold);clearTimeout(deadline);pending();if(started){try{rec.stop();}catch{fail(recognitionError('aborted'));}}deadline=setTimeout(()=>fail('단어 인식 응답이 늦습니다. 다시 말해 주세요.'),10000);};
 rec.onstart=()=>{if(done)return;started=true;if(released){try{rec.stop();}catch{fail(recognitionError('aborted'));}}else options.onListening();};
 rec.onresult=event=>{if(done)return;const parts:string[]=[];for(let i=0;i<event.results.length;i++){const r=event.results[i];if(r.isFinal&&r[0])parts.push(r[0].transcript);}transcript=parts.join(' ').trim();pending();};
 rec.onerror=event=>fail(recognitionError(event.error));
 rec.onend=()=>{if(done)return;done=true;clear();options.onResult(transcript);};
 hold=setTimeout(stop,7000);deadline=setTimeout(()=>fail('마이크 준비가 늦습니다. 권한을 확인하고 다시 말해 주세요.'),15000);
 try{rec.start();}catch{fail('음성인식을 시작하지 못했습니다. 버튼을 다시 눌러 주세요.');}
 return {stop,cancel(){if(done)return;done=true;clear();try{rec.abort();}catch{}}};
}
