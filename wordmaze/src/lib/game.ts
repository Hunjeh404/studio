export type Accent = 'en-GB' | 'en-US';
export const VERSION = 'browser-word-v1';
export const animals = [
 ['cat','고양이','🐱'],['bear','곰','🐻'],['rabbit','토끼','🐰'],['dog','강아지','🐶'],
 ['tiger','호랑이','🐯'],['penguin','펭귄','🐧'],['poodle','초코푸들','🐩'],['siamese','샴고양이','🐈'],
 ['calico','삼색고양이','🐈'],['lioness','암사자','🦁'],['lion','숫사자','🦁'],['otter','해달','🦦']
] as const;
export const fruits = [
 {id:'apple',kind:'fruit',tier:1,ko:'사과',icon:'🍎',ipaGB:'ˈæp.əl',ipaUS:'ˈæp.əl',color:'#e17a6b'},
 {id:'banana',kind:'fruit',tier:1,ko:'바나나',icon:'🍌',ipaGB:'bəˈnɑː.nə',ipaUS:'bəˈnæn.ə',color:'#e5c463'},
 {id:'grape',kind:'fruit',tier:3,ko:'포도',icon:'🍇',ipaGB:'ɡreɪp',ipaUS:'ɡreɪp',color:'#a293b8'},
 {id:'orange',kind:'fruit',tier:2,ko:'오렌지',icon:'🍊',ipaGB:'ˈɒr.ɪndʒ',ipaUS:'ˈɔːr.ɪndʒ',color:'#eaa463'},
 {id:'pear',kind:'fruit',tier:2,ko:'배',icon:'🍐',ipaGB:'peə',ipaUS:'per',color:'#b2c779'},
 {id:'peach',kind:'fruit',tier:1,ko:'복숭아',icon:'🍑',ipaGB:'piːtʃ',ipaUS:'piːtʃ',color:'#e9b1a0'},
 {id:'cherry',kind:'fruit',tier:2,ko:'체리',icon:'🍒',ipaGB:'ˈtʃer.i',ipaUS:'ˈtʃer.i',color:'#cf7482'},
 {id:'lemon',kind:'fruit',tier:1,ko:'레몬',icon:'🍋',ipaGB:'ˈlem.ən',ipaUS:'ˈlem.ən',color:'#e4cf6c'},
 {id:'kiwi',kind:'fruit',tier:1,ko:'키위',icon:'🥝',ipaGB:'ˈkiː.wiː',ipaUS:'ˈkiː.wiː',color:'#a6bd7c'},
 {id:'melon',kind:'fruit',tier:1,ko:'멜론',icon:'🍈',ipaGB:'ˈmel.ən',ipaUS:'ˈmel.ən',color:'#9fbe8c'},
 {id:'strawberry',kind:'fruit',tier:3,ko:'딸기',icon:'🍓',ipaGB:'ˈstrɔː.bər.i',ipaUS:'ˈstrɑː.ber.i',color:'#d97580'},
 {id:'pineapple',kind:'fruit',tier:3,ko:'파인애플',icon:'🍍',ipaGB:'ˈpaɪnˌæp.əl',ipaUS:'ˈpaɪnˌæp.əl',color:'#c7b76f'},
 {id:'watermelon',kind:'fruit',tier:3,ko:'수박',icon:'🍉',ipaGB:'ˈwɔː.təˌmel.ən',ipaUS:'ˈwɑː.t̬ɚˌmel.ən',color:'#80ad91'},
 {id:'mango',kind:'fruit',tier:1,ko:'망고',icon:'🥭',ipaGB:'ˈmæŋ.ɡəʊ',ipaUS:'ˈmæŋ.ɡoʊ',color:'#e8b266'},
 {id:'coconut',kind:'fruit',tier:2,ko:'코코넛',icon:'🥥',ipaGB:'ˈkəʊ.kə.nʌt',ipaUS:'ˈkoʊ.kə.nʌt',color:'#a88a6b'},
 {id:'tomato',kind:'fruit',tier:2,ko:'토마토',icon:'🍅',ipaGB:'təˈmɑː.təʊ',ipaUS:'təˈmeɪ.t̬oʊ',color:'#dd7a68'},
 {id:'olive',kind:'fruit',tier:2,ko:'올리브',icon:'🫒',ipaGB:'ˈɒl.ɪv',ipaUS:'ˈɑː.lɪv',color:'#9aa36a'},
 {id:'lime',kind:'fruit',tier:2,ko:'라임',icon:'🍋‍🟩',ipaGB:'laɪm',ipaUS:'laɪm',color:'#a9c46f'},
 {id:'blueberry',kind:'fruit',tier:3,ko:'블루베리',icon:'🫐',ipaGB:'ˈbluː.bər.i',ipaUS:'ˈbluːˌber.i',color:'#7f8fc0'},
 {id:'avocado',kind:'fruit',tier:3,ko:'아보카도',icon:'🥑',ipaGB:'ˌæv.əˈkɑː.dəʊ',ipaUS:'ˌæv.əˈkɑː.doʊ',color:'#8fae6a'}
];
export const animalWords = [
 {id:'cat',kind:'animal',tier:1,ko:'고양이',icon:'🐱',ipaGB:'kæt',ipaUS:'kæt',color:'#e8c9a0'},
 {id:'dog',kind:'animal',tier:1,ko:'개',icon:'🐶',ipaGB:'dɒɡ',ipaUS:'dɑːɡ',color:'#d9b48f'},
 {id:'pig',kind:'animal',tier:1,ko:'돼지',icon:'🐷',ipaGB:'pɪɡ',ipaUS:'pɪɡ',color:'#efb7b5'},
 {id:'cow',kind:'animal',tier:1,ko:'소',icon:'🐮',ipaGB:'kaʊ',ipaUS:'kaʊ',color:'#e9e2d4'},
 {id:'duck',kind:'animal',tier:1,ko:'오리',icon:'🦆',ipaGB:'dʌk',ipaUS:'dʌk',color:'#e6cf7c'},
 {id:'fish',kind:'animal',tier:1,ko:'물고기',icon:'🐟',ipaGB:'fɪʃ',ipaUS:'fɪʃ',color:'#9fc2d6'},
 {id:'bee',kind:'animal',tier:1,ko:'벌',icon:'🐝',ipaGB:'biː',ipaUS:'biː',color:'#ecd27a'},
 {id:'fox',kind:'animal',tier:1,ko:'여우',icon:'🦊',ipaGB:'fɒks',ipaUS:'fɑːks',color:'#e3a57a'},
 {id:'owl',kind:'animal',tier:1,ko:'부엉이',icon:'🦉',ipaGB:'aʊl',ipaUS:'aʊl',color:'#c9ad8e'},
 {id:'bat',kind:'animal',tier:1,ko:'박쥐',icon:'🦇',ipaGB:'bæt',ipaUS:'bæt',color:'#a99bb6'},
 {id:'monkey',kind:'animal',tier:2,ko:'원숭이',icon:'🐵',ipaGB:'ˈmʌŋ.ki',ipaUS:'ˈmʌŋ.ki',color:'#e8c9a0'},
 {id:'panda',kind:'animal',tier:2,ko:'판다',icon:'🐼',ipaGB:'ˈpæn.də',ipaUS:'ˈpæn.də',color:'#d9b48f'},
 {id:'koala',kind:'animal',tier:2,ko:'코알라',icon:'🐨',ipaGB:'kəʊˈɑː.lə',ipaUS:'koʊˈɑː.lə',color:'#efb7b5'},
 {id:'zebra',kind:'animal',tier:2,ko:'얼룩말',icon:'🦓',ipaGB:'ˈzeb.rə',ipaUS:'ˈziː.brə',color:'#e9e2d4'},
 {id:'tiger',kind:'animal',tier:2,ko:'호랑이',icon:'🐯',ipaGB:'ˈtaɪ.ɡə',ipaUS:'ˈtaɪ.ɡɚ',color:'#e6cf7c'},
 {id:'whale',kind:'animal',tier:2,ko:'고래',icon:'🐳',ipaGB:'weɪl',ipaUS:'weɪl',color:'#9fc2d6'},
 {id:'snake',kind:'animal',tier:2,ko:'뱀',icon:'🐍',ipaGB:'sneɪk',ipaUS:'sneɪk',color:'#ecd27a'},
 {id:'horse',kind:'animal',tier:2,ko:'말',icon:'🐴',ipaGB:'hɔːs',ipaUS:'hɔːrs',color:'#e3a57a'},
 {id:'sheep',kind:'animal',tier:2,ko:'양',icon:'🐑',ipaGB:'ʃiːp',ipaUS:'ʃiːp',color:'#c9ad8e'},
 {id:'mouse',kind:'animal',tier:2,ko:'쥐',icon:'🐭',ipaGB:'maʊs',ipaUS:'maʊs',color:'#a99bb6'},
 {id:'frog',kind:'animal',tier:3,ko:'개구리',icon:'🐸',ipaGB:'frɒɡ',ipaUS:'frɑːɡ',color:'#e8c9a0'},
 {id:'turtle',kind:'animal',tier:3,ko:'거북',icon:'🐢',ipaGB:'ˈtɜː.təl',ipaUS:'ˈtɝː.t̬əl',color:'#d9b48f'},
 {id:'dolphin',kind:'animal',tier:3,ko:'돌고래',icon:'🐬',ipaGB:'ˈdɒl.fɪn',ipaUS:'ˈdɑːl.fɪn',color:'#efb7b5'},
 {id:'giraffe',kind:'animal',tier:3,ko:'기린',icon:'🦒',ipaGB:'dʒɪˈrɑːf',ipaUS:'dʒəˈræf',color:'#e9e2d4'},
 {id:'squirrel',kind:'animal',tier:3,ko:'다람쥐',icon:'🐿️',ipaGB:'ˈskwɪr.əl',ipaUS:'ˈskwɝː.əl',color:'#e6cf7c'},
 {id:'octopus',kind:'animal',tier:3,ko:'문어',icon:'🐙',ipaGB:'ˈɒk.tə.pəs',ipaUS:'ˈɑːk.tə.pəs',color:'#9fc2d6'},
 {id:'elephant',kind:'animal',tier:3,ko:'코끼리',icon:'🐘',ipaGB:'ˈel.ɪ.fənt',ipaUS:'ˈel.ə.fənt',color:'#ecd27a'},
 {id:'butterfly',kind:'animal',tier:3,ko:'나비',icon:'🦋',ipaGB:'ˈbʌt.ə.flaɪ',ipaUS:'ˈbʌt̬.ɚ.flaɪ',color:'#e3a57a'},
 {id:'crocodile',kind:'animal',tier:3,ko:'악어',icon:'🐊',ipaGB:'ˈkrɒk.ə.daɪl',ipaUS:'ˈkrɑː.kə.daɪl',color:'#c9ad8e'},
 {id:'kangaroo',kind:'animal',tier:3,ko:'캥거루',icon:'🦘',ipaGB:'ˌkæŋ.ɡərˈuː',ipaUS:'ˌkæŋ.ɡəˈruː',color:'#a99bb6'}
];
export const words = [...fruits,...animalWords];
// Each stage always uses these words (1~2 easy, 3~4 easy+medium, 5~6 medium+hard); only the order changes per play.
export const stageWords:string[][] = [
 ['apple','banana','cat','dog','pig','duck'],
 ['kiwi','lemon','mango','cow','fish','bee','fox'],
 ['melon','owl','orange','cherry','tomato','panda','sheep','horse'],
 ['peach','bat','coconut','lime','monkey','koala','zebra','tiger','mouse'],
 ['pear','whale','grape','strawberry','blueberry','frog','turtle','dolphin','giraffe','octopus'],
 ['olive','snake','pineapple','watermelon','avocado','frog','squirrel','elephant','butterfly','crocodile','kangaroo']
];
export function shuffledWords(stage:number,rand=Math.random):string[] {
 const list=[...stageData(stage).words];for(let i=list.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[list[i],list[j]]=[list[j],list[i]];}return list;
}
export function isStageOrder(stage:number,order:unknown):order is string[] {
 const base=stageData(stage).words;return Array.isArray(order)&&order.length===base.length&&[...order].sort().join()===[...base].sort().join();
}
export function target(id:string,accent:Accent) {
 const f=words.find(f=>f.id===id);if(!f)throw new Error('Unknown word');
 return {...f,ipa:accent==='en-GB'?f.ipaGB:f.ipaUS};
}
export const themes = [
 {name:'작은 과일 정원',sub:'처음 만나는 작은 모험'},
 {name:'느긋한 농장',sub:'울타리 사이로 한 걸음 더'},
 {name:'이끼 낀 숲',sub:'나무 사이 오솔길'},
 {name:'강가와 연못',sub:'천천히, 또렷하게'},
 {name:'햇살 바닷가',sub:'조금 더 넓어진 세상'},
 {name:'비밀의 정글',sub:'마지막 출구를 향해'}
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
 const count=stageWords[stage-1].length;if(count>route.length-2)throw new Error('Stage route is too short');
 const checkpoints=Array.from({length:count},(_,i)=>({cell:route[Math.floor((i+1)*(route.length-1)/(count+1))],routeIndex:Math.floor((i+1)*(route.length-1)/(count+1))}));
 return {n,cells,route,checkpoints,words:stageWords[stage-1],theme:themes[stage-1]};
}
export function formatTime(ms:number){return `${Math.floor(ms/60000).toString().padStart(2,'0')}:${Math.floor(ms/1000%60).toString().padStart(2,'0')}.${Math.floor(ms%1000/100)}`;}
