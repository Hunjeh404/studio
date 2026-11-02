export type Accent = 'en-GB' | 'en-US';
export const VERSION = 'browser-word-v1';
export const animals = [
 ['cat','고양이','🐱'],['bear','곰','🐻'],['rabbit','토끼','🐰'],['dog','강아지','🐶'],
 ['tiger','호랑이','🐯'],['penguin','펭귄','🐧'],['poodle','초코푸들','🐩'],['siamese','샴고양이','🐈'],
 ['calico','삼색고양이','🐈'],['lioness','암사자','🦁'],['lion','숫사자','🦁'],['otter','해달','🦦']
] as const;
export const fruits = [
 {id:'apple',ko:'사과',icon:'🍎',ipaGB:'ˈæp.əl',ipaUS:'ˈæp.əl',color:'#e17a6b'},
 {id:'banana',ko:'바나나',icon:'🍌',ipaGB:'bəˈnɑː.nə',ipaUS:'bəˈnæn.ə',color:'#e5c463'},
 {id:'grape',ko:'포도',icon:'🍇',ipaGB:'ɡreɪp',ipaUS:'ɡreɪp',color:'#a293b8'},
 {id:'orange',ko:'오렌지',icon:'🍊',ipaGB:'ˈɒr.ɪndʒ',ipaUS:'ˈɔːr.ɪndʒ',color:'#eaa463'},
 {id:'pear',ko:'배',icon:'🍐',ipaGB:'peə',ipaUS:'per',color:'#b2c779'},
 {id:'peach',ko:'복숭아',icon:'🍑',ipaGB:'piːtʃ',ipaUS:'piːtʃ',color:'#e9b1a0'},
 {id:'cherry',ko:'체리',icon:'🍒',ipaGB:'ˈtʃer.i',ipaUS:'ˈtʃer.i',color:'#cf7482'},
 {id:'lemon',ko:'레몬',icon:'🍋',ipaGB:'ˈlem.ən',ipaUS:'ˈlem.ən',color:'#e4cf6c'},
 {id:'kiwi',ko:'키위',icon:'🥝',ipaGB:'ˈkiː.wiː',ipaUS:'ˈkiː.wiː',color:'#a6bd7c'},
 {id:'melon',ko:'멜론',icon:'🍈',ipaGB:'ˈmel.ən',ipaUS:'ˈmel.ən',color:'#9fbe8c'},
 {id:'strawberry',ko:'딸기',icon:'🍓',ipaGB:'ˈstrɔː.bər.i',ipaUS:'ˈstrɑː.ber.i',color:'#d97580'},
 {id:'pineapple',ko:'파인애플',icon:'🍍',ipaGB:'ˈpaɪnˌæp.əl',ipaUS:'ˈpaɪnˌæp.əl',color:'#c7b76f'},
 {id:'watermelon',ko:'수박',icon:'🍉',ipaGB:'ˈwɔː.təˌmel.ən',ipaUS:'ˈwɑː.t̬ɚˌmel.ən',color:'#80ad91'},
 {id:'mango',ko:'망고',icon:'🥭',ipaGB:'ˈmæŋ.ɡəʊ',ipaUS:'ˈmæŋ.ɡoʊ',color:'#e8b266'}
];
export function target(id:string,accent:Accent) {
 const f=fruits.find(f=>f.id===id);if(!f)throw new Error('Unknown fruit');
 return {...f,ipa:accent==='en-GB'?f.ipaGB:f.ipaUS};
}
export const themes = [
 {name:'작은 과일 정원',sub:'처음 만나는 작은 모험',base:'#aec8a1',wall:'#93b48b',leaf:'#8eaf83'},
 {name:'꽃이 핀 산책길',sub:'굽이굽이, 한 걸음 더',base:'#c1c5a0',wall:'#b8b793',leaf:'#b0b788'},
 {name:'복숭아빛 언덕',sub:'조금 더 넓어진 세상',base:'#d7bfa9',wall:'#c9aa95',leaf:'#b2bb8e'},
 {name:'시원한 강가',sub:'천천히, 또렷하게',base:'#aec9c5',wall:'#91b3ae',leaf:'#8fae9c'},
 {name:'라벤더 숲길',sub:'새로운 길을 찾아서',base:'#c4bcd0',wall:'#b3a5be',leaf:'#9fae9c'},
 {name:'황금빛 과수원',sub:'마지막 출구를 향해',base:'#cfbf91',wall:'#bdad78',leaf:'#9da97a'}
];
function random(seed:number){let a=seed;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function stageData(stage:number){
 if(!Number.isInteger(stage)||stage<1||stage>6)throw new Error('Unknown stage');
 const n=stage<=2?5:stage<=4?6:7,rng=random(257+stage*977);
 const cells=Array.from({length:n*n},()=>({walls:[true,true,true,true]}));const seen=new Set<number>([0]),stack=[0];
 const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
 while(stack.length){const c=stack.at(-1)!,x=c%n,z=Math.floor(c/n),options=dirs.map(([dx,dz],d)=>({x:x+dx,z:z+dz,d})).filter(a=>a.x>=0&&a.x<n&&a.z>=0&&a.z<n&&!seen.has(a.z*n+a.x));if(!options.length){stack.pop();continue;}const a=options[Math.floor(rng()*options.length)],next=a.z*n+a.x;cells[c].walls[a.d]=false;cells[next].walls[(a.d+2)%4]=false;seen.add(next);stack.push(next);}
 const parent=new Map<number,number>([[0,-1]]),q=[0];for(let i=0;i<q.length;i++){const c=q[i];dirs.forEach(([dx,dz],d)=>{if(cells[c].walls[d])return;const next=c+dx+dz*n;if(!parent.has(next)){parent.set(next,c);q.push(next);}});}
 const route:number[]=[];let c=n*n-1;while(c!==-1){route.unshift(c);c=parent.get(c)!;}
 const count=Math.min(5+stage,route.length-2),pool=fruits.map(f=>f.id);for(let i=pool.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 const checkpoints=Array.from({length:count},(_,i)=>({cell:route[Math.floor((i+1)*(route.length-1)/(count+1))],routeIndex:Math.floor((i+1)*(route.length-1)/(count+1)),id:pool[i%pool.length]}));
 return {n,cells,route,checkpoints,theme:themes[stage-1]};
}
export function formatTime(ms:number){return `${Math.floor(ms/60000).toString().padStart(2,'0')}:${Math.floor(ms/1000%60).toString().padStart(2,'0')}.${Math.floor(ms%1000/100)}`;}
