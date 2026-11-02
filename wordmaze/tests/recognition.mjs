import assert from 'node:assert/strict';
import {mock} from 'node:test';
import {matchesWord,normalizeWord,startWordRecognition,recognitionConstructor} from '../src/lib/word-recognition.ts';
assert.equal(recognitionConstructor(),undefined);
for(const [heard,word] of [['APPLE.','apple'],[' apple! ','apple'],['pine apple','pineapple'],['water melon','watermelon'],['blue berry','blueberry'],['Butter fly','butterfly'],['Kangaroo!','kangaroo']])assert.equal(matchesWord(heard,word),true);
assert.equal(matchesWord('kanga roo','kangaroo'),false);
for(const heard of ['',null,{},'banana','apple banana','an apple','apples','apple sauce','a'.repeat(121)])assert.equal(matchesWord(heard,'apple'),false);
assert.equal(normalizeWord('  apple   banana '),'apple banana');
class Fake {
 static last;
 constructor(){Fake.last=this;this.stops=0;this.aborts=0;}
 start(){}stop(){this.stops++;}abort(){this.aborts++;}
}
function attempt(lang='en-GB'){
 const events=[];const handle=startWordRecognition({Constructor:Fake,lang,onListening:()=>events.push('listen'),onProcessing:()=>events.push('processing'),onResult:t=>events.push(['result',t]),onError:e=>events.push(['error',e])});return {events,handle,rec:Fake.last};
}
const a=attempt();assert.equal(a.rec.lang,'en-GB');assert.equal(a.rec.interimResults,false);assert.equal(a.rec.maxAlternatives,1);a.rec.onstart();a.handle.stop();a.handle.stop();assert.equal(a.rec.stops,1);a.rec.onresult({results:[{isFinal:true,0:{transcript:'Apple.'},1:{transcript:'banana'}}]});assert.equal(a.events.filter(e=>Array.isArray(e)).length,0);a.rec.onend();assert.deepEqual(a.events,['listen','processing',['result','Apple.']]);a.handle.stop();assert.equal(a.rec.stops,1);
const b=attempt('en-US');b.handle.stop();assert.equal(b.rec.stops,0);b.rec.onstart();assert.equal(b.rec.stops,1);b.rec.onresult({results:[{isFinal:false,0:{transcript:'apple'}}]});b.rec.onend();assert.deepEqual(b.events,['processing',['result','']]);
const c=attempt();const staleEnd=c.rec.onend;c.handle.cancel();staleEnd();assert.deepEqual(c.events,[]);assert.equal(c.rec.aborts,1);
for(const code of ['not-allowed','service-not-allowed','network','no-speech','audio-capture','language-not-supported']){const d=attempt();const end=d.rec.onend;d.rec.onerror({error:code});end();assert.equal(d.events.length,1);assert.equal(d.events[0][0],'error');assert.equal(d.rec.aborts,1);}
const e=attempt();e.rec.onresult({results:[{isFinal:true,0:{transcript:'apple'}},{isFinal:true,0:{transcript:'banana'}}]});e.rec.onend();assert.deepEqual(e.events.at(-1),['result','apple banana']);
mock.timers.enable({apis:['setTimeout']});
const timed=attempt();timed.rec.onstart();mock.timers.tick(7000);assert.equal(timed.rec.stops,1);mock.timers.tick(10000);assert.equal(timed.events.at(-1)[0],'error');mock.timers.reset();
console.log('Recognition checks passed: strict final words, both locales, early release, duplicate stop, interim rejection, cancellation, permission/network/silence errors and timeout.');
