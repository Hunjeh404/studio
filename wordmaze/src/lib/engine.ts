import {isStageOrder,shuffledWords,type Accent} from './game.ts';
import {character,type AnimalId} from './characters.ts';
export const ENGINE='wordmaze-azure-v5';
// Azure pronunciation score needed to pass: stage 1-2 60, 3-4 70, 5-6 80 (same as the server).
export type Difficulty='easy'|'normal'|'hard';
export const difficulties:{id:Difficulty;name:string}[]=[{id:'easy',name:'쉬움'},{id:'normal',name:'보통'},{id:'hard',name:'어려움'}];
// Difficulty moves the stage mark by -10 / 0 / +10 (same as the server).
export const passMark=(stage:number,difficulty:Difficulty='normal')=>(stage<=2?60:stage<=4?70:80)+(difficulty==='easy'?-10:difficulty==='hard'?10:0);
export type Heard={score:number;spoken:boolean};
export type PlayMode='single'|'multi';
export type Player={name:string;balance:number;animal:AnimalId;owned:AnimalId[]};
export type Run={id:string;stage:number;targets:string[];accent:Accent;difficulty:Difficulty;animal:AnimalId;progress:number;startedAt:number;creditMs:number;pauseUntil:number;pauseMs:number;abilityUsed:boolean;passiveUsed:boolean;streak:number;streakBonuses:number;complete:boolean;elapsed:number};
export type Verdict={run:Run;pass:boolean;tip:string;reward?:number;newBest?:boolean;record?:boolean};
export function createRun(stage:number,accent:Accent,animal:AnimalId,now=Date.now(),order?:string[],difficulty:Difficulty='normal'):Run {const targets=order===undefined?shuffledWords(stage):order;if(!isStageOrder(stage,targets))throw Error('Unknown stage order');return{id:globalThis.crypto?.randomUUID?.()||`local-${now}-${Math.random().toString(36).slice(2)}`,stage,targets:[...targets],accent,difficulty,animal,progress:0,startedAt:now,creditMs:0,pauseUntil:0,pauseMs:0,abilityUsed:false,passiveUsed:false,streak:0,streakBonuses:0,complete:false,elapsed:0};}
export function elapsed(run:Run,now=Date.now()):number {const pendingPause=Math.max(0,run.pauseUntil-now);return Math.max(0,now-run.startedAt-run.creditMs-run.pauseMs+pendingPause);}
export function localStep(run:Run,heard:Heard|null,ability=false,now=Date.now()):Verdict {
 const spoken=!!heard?.spoken,score=Math.round(Math.max(0,Math.min(100,heard?.score??0))),mark=passMark(run.stage,run.difficulty);
 const next={...run},word=run.targets[run.progress];
 if(run.complete||!word)throw Error('도전을 다시 시작해 주세요.');
 if(now<run.pauseUntil)throw Error('쉼표 시간이 끝난 뒤 말해 주세요.');
 let pass=false,rescued=false,tip='';
 if(ability){
  if(run.abilityUsed)throw Error('이번 도전의 능력을 이미 사용했습니다.');
  if(run.animal==='bear'){next.abilityUsed=true;next.pauseUntil=now+5000;next.pauseMs+=5000;return{run:next,pass:false,tip:'5초 동안 쉬어 가세요. 시간은 멈춥니다.'};}
  if(run.animal!=='rabbit'&&!(run.animal==='lion'&&run.progress===run.targets.length-1))throw Error('지금 사용할 수 없는 능력입니다.');
  next.abilityUsed=true;pass=true;tip='동물친구의 능력으로 한 칸 통과했습니다.';
 }else{
  pass=spoken&&score>=mark;
  if(!pass&&spoken&&run.animal==='lioness'&&!run.passiveUsed){pass=true;rescued=true;next.passiveUsed=true;tip='암사자가 첫 오답을 지켜 주었습니다. 한 칸 통과했습니다.';}
  if(!pass){next.streak=0;if(run.animal==='dog'&&!run.passiveUsed&&spoken){next.creditMs+=2000;next.passiveUsed=true;}return{run:next,pass:false,tip:spoken?`발음 점수 ${score}점이에요. ${mark}점 이상이면 통과합니다. 다시 말해 주세요.`:'단어가 들리지 않습니다. 다시 말해 주세요.'};}
  if(!rescued){next.streak++;if(run.animal==='cat'&&run.progress===0)next.creditMs+=1500;if(run.animal==='penguin')next.creditMs+=250;if(run.animal==='tiger'&&next.streak%3===0&&next.streakBonuses<2){next.creditMs+=2000;next.streakBonuses++;}if(run.animal==='otter'&&!run.passiveUsed&&word.length>=6){next.creditMs+=3000;next.passiveUsed=true;}}
 }
 next.progress++;next.complete=next.progress===run.targets.length;next.elapsed=elapsed(next,now);
 return {run:next,pass:true,tip:tip||(ability?'통과했습니다. 다음 단어를 만나 보세요.':`발음 점수 ${score}점, 통과했습니다!`)};
}
export const activeAbility=(run:Run)=>!run.abilityUsed&&(run.animal==='bear'||run.animal==='rabbit'||(run.animal==='lion'&&run.progress===run.targets.length-1));
export const recordKey=(stage:number,difficulty:Difficulty,animal:string)=>`${ENGINE}:${stage}:${difficulty}:${animal}`;
export type RecordRow={name:string;timeMs:number;animal?:string};
export function clearReward(stage:number,animal:string,improved:boolean){return 10+stage*2+(animal==='calico'?5:0)+(improved?10:0);}
export function validAnimal(id:string):id is AnimalId{return character(id).id===id;}
