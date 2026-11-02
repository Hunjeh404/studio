import assert from 'node:assert/strict';
import {test} from 'node:test';
import {characters} from '../src/lib/characters.ts';
import {createRun,localStep,elapsed,clearReward,activeAbility} from '../src/lib/engine.ts';
import {stageData} from '../src/lib/game.ts';
import {saveLocal,localRecords} from '../src/lib/local.ts';
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
test('all characters can finish every stage and accent entirely locally',()=>{
 const previousFetch=globalThis.fetch;globalThis.fetch=()=>{throw Error('Single-player must not send a network request');};
 try{for(const {id} of characters)for(let stage=1;stage<=6;stage++)for(const accent of ['en-GB','en-US']){
  let run=createRun(stage,accent,id,1000),now=1000;const words=stageData(stage).checkpoints;
  for(const word of words){now+=1000;const d=localStep(run,word.id,false,now);assert.equal(d.pass,true);run=d.run;}
  assert.equal(run.complete,true);assert.equal(run.progress,words.length);assert.equal(run.elapsed,elapsed(run,now));
  const first=saveLocal(run,'검증');assert.equal(first.record,true);assert.equal(first.newBest,false);assert.equal(localRecords(stage,accent,id)[0].timeMs,run.elapsed);
  assert.throws(()=>localStep(run,'apple',false,now));
 }}finally{globalThis.fetch=previousFetch;}
});
test('specific abilities have their advertised effect and cannot be reused',()=>{
 const word=stageData(1).checkpoints[0].id;
 let run=createRun(1,'en-GB','cat',1000);assert.equal(localStep(run,word,false,4000).run.creditMs,1500);
 run=createRun(1,'en-GB','dog',1000);let d=localStep(run,'wrong',false,4000);assert.equal(d.run.creditMs,2000);assert.equal(localStep(d.run,'wrong',false,5000).run.creditMs,2000);assert.equal(localStep(run,'',false,4000).run.creditMs,0);
 run=createRun(1,'en-GB','lioness',1000);d=localStep(run,'wrong',false,4000);assert.equal(d.pass,true);assert.equal(d.run.progress,1);assert.equal(localStep(d.run,'wrong',false,5000).pass,false);
 run=createRun(1,'en-GB','bear',1000);assert.equal(activeAbility(run),true);d=localStep(run,'',true,4000);assert.equal(d.run.pauseUntil,9000);assert.equal(elapsed(d.run,5000),3000);assert.throws(()=>localStep(d.run,word,false,5000));assert.equal(localStep(d.run,word,false,10000).pass,true);assert.throws(()=>localStep(d.run,'',true,10000));
 run=createRun(1,'en-GB','rabbit',1000);d=localStep(run,'',true,4000);assert.equal(d.run.progress,1);assert.throws(()=>localStep(d.run,'',true,5000));
 run=createRun(1,'en-GB','lion',1000);assert.equal(activeAbility(run),false);assert.throws(()=>localStep(run,'',true,4000));
 assert.equal(clearReward(1,'cat',false),12);assert.equal(clearReward(6,'calico',true),37);
});
test('personal records improve without slower runs overwriting them, and corrupt storage is ignored',()=>{
 memory.clear();const run={...createRun(1,'en-GB','cat',0),complete:true,elapsed:5000};saveLocal(run,'첫 기록');assert.equal(saveLocal({...run,elapsed:6000},'느린 기록').record,false);assert.equal(saveLocal({...run,elapsed:4000},'빠른 기록').newBest,true);assert.equal(localRecords(1,'en-GB','cat')[0].name,'빠른 기록');assert.equal(localRecords(1,'en-US','cat').length,0);assert.equal(localRecords(1,'en-GB','bear').length,0);memory.set('wordmaze-single-records-v2','broken');assert.deepEqual(localRecords(1,'en-GB','cat'),[]);
});
