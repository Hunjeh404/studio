import assert from 'node:assert/strict';
import {test} from 'node:test';
import {characters} from '../src/lib/characters.ts';
import {createRun,localStep,elapsed,clearReward,activeAbility,passMark} from '../src/lib/engine.ts';
const good={score:95,spoken:true},bad={score:10,spoken:true},silent={score:0,spoken:false};
import {stageData} from '../src/lib/game.ts';
import {saveLocal,localRecords} from '../src/lib/local.ts';
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
test('all characters can finish every stage and accent entirely locally',()=>{
 const previousFetch=globalThis.fetch;globalThis.fetch=()=>{throw Error('Single-player must not send a network request');};
 try{for(const {id} of characters)for(let stage=1;stage<=6;stage++)for(const [difficulty,accent] of [['easy','en-GB'],['normal','en-US'],['hard','en-GB']]){
  let run=createRun(stage,accent,id,1000,undefined,difficulty),now=1000;const words=run.targets;assert.deepEqual([...words].sort(),[...stageData(stage).words].sort());
  for(const word of words){now+=1000;const d=localStep(run,good,false,now);assert.equal(d.pass,true);run=d.run;}
  assert.equal(run.complete,true);assert.equal(run.progress,words.length);assert.equal(run.elapsed,elapsed(run,now));
  const first=saveLocal(run,'검증');assert.equal(first.record,true);assert.equal(first.newBest,false);assert.equal(localRecords(stage,difficulty,id)[0].timeMs,run.elapsed);
  assert.throws(()=>localStep(run,good,false,now));
 }}finally{globalThis.fetch=previousFetch;}
});
test('specific abilities have their advertised effect and cannot be reused',()=>{
 const order=stageData(1).words,word=order[0],createRunAt=(s,a,c,t)=>createRun(s,a,c,t,order);
 let run=createRunAt(1,'en-GB','cat',1000);assert.equal(localStep(run,good,false,4000).run.creditMs,1500);
 run=createRunAt(1,'en-GB','dog',1000);let d=localStep(run,bad,false,4000);assert.equal(d.run.creditMs,2000);assert.equal(localStep(d.run,bad,false,5000).run.creditMs,2000);assert.equal(localStep(run,silent,false,4000).run.creditMs,0);
 run=createRunAt(1,'en-GB','lioness',1000);d=localStep(run,bad,false,4000);assert.equal(d.pass,true);assert.equal(d.run.progress,1);assert.equal(localStep(d.run,bad,false,5000).pass,false);
 run=createRunAt(1,'en-GB','bear',1000);assert.equal(activeAbility(run),true);d=localStep(run,silent,true,4000);assert.equal(d.run.pauseUntil,9000);assert.equal(elapsed(d.run,5000),3000);assert.throws(()=>localStep(d.run,good,false,5000));assert.equal(localStep(d.run,good,false,10000).pass,true);assert.throws(()=>localStep(d.run,silent,true,10000));
 run=createRunAt(1,'en-GB','rabbit',1000);d=localStep(run,silent,true,4000);assert.equal(d.run.progress,1);assert.throws(()=>localStep(d.run,silent,true,5000));
 run=createRunAt(1,'en-GB','lion',1000);assert.equal(activeAbility(run),false);assert.throws(()=>localStep(run,silent,true,4000));
 assert.equal(clearReward(1,'cat',false),12);assert.equal(clearReward(6,'calico',true),37);
});
test('a run keeps its given order and rejects foreign word lists',()=>{
 const order=[...stageData(2).words].reverse();const run=createRun(2,'en-US','cat',0,order);assert.deepEqual(run.targets,order);assert.equal(localStep(run,good,false,1000).pass,true);
 assert.throws(()=>createRun(2,'en-US','cat',0,stageData(1).words));assert.throws(()=>createRun(2,'en-US','cat',0,[...order,'apple']));
});
test('Azure scores pass only at the stage mark, and silence never passes',()=>{
 for(const [stage,easy,hard] of [[1,50,70],[3,60,80],[5,70,90]]){assert.equal(passMark(stage,'easy'),easy);assert.equal(passMark(stage,'hard'),hard);const h=createRun(stage,'en-GB','cat',0,undefined,'hard');assert.equal(localStep(h,{score:hard-1,spoken:true},false,1000).pass,false);assert.equal(localStep(h,{score:hard,spoken:true},false,1000).pass,true);}
 for(const [stage,mark] of [[1,60],[2,60],[3,70],[4,70],[5,80],[6,80]]){assert.equal(passMark(stage),mark);const run=createRun(stage,'en-GB','cat',0);
  assert.equal(localStep(run,{score:mark-1,spoken:true},false,1000).pass,false);assert.equal(localStep(run,{score:mark,spoken:true},false,1000).pass,true);assert.equal(localStep(run,{score:100,spoken:false},false,1000).pass,false);}
 const tip=localStep(createRun(5,'en-GB','cat',0),{score:72.4,spoken:true},false,1000).tip;assert.match(tip,/72점/);assert.match(tip,/80점/);
});
test('personal records improve without slower runs overwriting them, and corrupt storage is ignored',()=>{
 memory.clear();const run={...createRun(1,'en-GB','cat',0),complete:true,elapsed:5000};saveLocal(run,'첫 기록');assert.equal(saveLocal({...run,elapsed:6000},'느린 기록').record,false);assert.equal(saveLocal({...run,elapsed:4000},'빠른 기록').newBest,true);assert.equal(localRecords(1,'normal','cat')[0].name,'빠른 기록');assert.equal(localRecords(1,'hard','cat').length,0);assert.equal(localRecords(1,'normal','bear').length,0);
 // Accents share a board; 'all' keeps each name's best across animals.
 assert.equal(saveLocal({...run,accent:'en-US',elapsed:4500},'빠른 기록').record,false);
 saveLocal({...run,animal:'bear',elapsed:3000},'빠른 기록');saveLocal({...run,animal:'otter',elapsed:3500},'동생');const all=localRecords(1,'normal','all');assert.deepEqual(all.map(r=>[r.name,r.timeMs,r.animal]),[['빠른 기록',3000,'bear'],['동생',3500,'otter']]);assert.equal(localRecords(1,'easy','all').length,0);
 memory.set('wordmaze-single-records-v2','broken');assert.deepEqual(localRecords(1,'normal','cat'),[]);
});
