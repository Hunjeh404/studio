import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {stageData,target,words,shuffledWords,isStageOrder} from '../src/lib/game.ts';
let cases=0;
for(let stage=1;stage<=6;stage++){
 const game=stageData(stage),{n,cells,route,checkpoints}=game;
 assert.deepEqual(game,stageData(stage));
 const visited=new Set([0]),queue=[0],directions=[[0,-1],[1,0],[0,1],[-1,0]];
 for(let i=0;i<queue.length;i++){
  const c=queue[i];for(let d=0;d<4;d++){
   if(cells[c].walls[d])continue;
   const [dx,dz]=directions[d],x=c%n+dx,z=Math.floor(c/n)+dz;
   assert.ok(x>=0&&x<n&&z>=0&&z<n,'No route may leave the board');
   const next=z*n+x;assert.equal(cells[next].walls[(d+2)%4],false,'Walls must agree in both directions');
   if(!visited.has(next)){visited.add(next);queue.push(next);}
  }
 }
 assert.equal(visited.size,n*n,'All cells must be connected');
 assert.equal(route[0],0);assert.equal(route.at(-1),n*n-1);
 for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],dx=b%n-a%n,dz=Math.floor(b/n)-Math.floor(a/n);
  assert.equal(Math.abs(dx)+Math.abs(dz),1);
  const direction=directions.findIndex(d=>d[0]===dx&&d[1]===dz);
  assert.equal(cells[a].walls[direction],false,'Animated movement cannot cross a wall');
 }
 assert.equal(new Set(checkpoints.map(c=>c.cell)).size,checkpoints.length);
 for(const checkpoint of checkpoints)assert.equal(route[checkpoint.routeIndex],checkpoint.cell);
 assert.equal(game.words.length,checkpoints.length);
 for(const id of game.words)for(const accent of ['en-GB','en-US'])assert.ok(target(id,accent).ipa);
 const allowed=stage<=2?[1]:stage<=4?[1,2]:[2,3];
 for(const id of game.words)assert.ok(allowed.includes(target(id,'en-GB').tier),`stage ${stage} must not use ${id}`);
 for(let k=0;k<20;k++){const order=shuffledWords(stage);assert.ok(isStageOrder(stage,order));}
 assert.equal(isStageOrder(stage,[...game.words.slice(1),'zzz']),false);assert.equal(isStageOrder(stage,game.words.slice(1)),false);
 cases++;
}
assert.equal(words.filter(w=>w.kind==='fruit').length,20);assert.equal(words.filter(w=>w.kind==='animal').length,30);assert.equal(new Set(words.map(w=>w.id)).size,50);
for(const w of words)assert.ok([1,2,3,4,5,6].some(s=>stageData(s).words.includes(w.id)),`${w.id} must appear in a stage`);
const migration=readdirSync(new URL('../supabase/migrations/',import.meta.url)).sort().filter(f=>f.includes('words')).at(-1);
const sql=readFileSync(new URL(`../supabase/migrations/${migration}`,import.meta.url),'utf8');
for(let stage=1;stage<=6;stage++){const m=sql.match(new RegExp(`set targets='([^']+)'::jsonb where stage=${stage};`));assert.ok(m,`stage ${stage} missing in ${migration}`);assert.deepEqual(JSON.parse(m[1]),stageData(stage).words,`server words for stage ${stage} must match game.ts`);}
assert.throws(()=>stageData(0));assert.throws(()=>stageData(7));
console.log(`${cases} combinations passed: connected mazes, valid routes, reproducible layouts, distinct checkpoints, stage word tiers, shuffled orders and all 50 words used.`);
