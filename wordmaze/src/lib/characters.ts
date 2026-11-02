export type AnimalId='cat'|'bear'|'rabbit'|'dog'|'tiger'|'penguin'|'poodle'|'siamese'|'calico'|'lioness'|'lion'|'otter';
export const characters=[
 {id:'cat',name:'고양이',icon:'🐱',price:0,skill:'가벼운 첫걸음',description:'첫 단어를 맞히면 기록에서 1.5초를 줄여 드립니다.'},
 {id:'bear',name:'곰',icon:'🐻',price:60,skill:'느긋한 쉼표',description:'한 번, 시간을 멈추고 5초 동안 쉴 수 있습니다.'},
 {id:'rabbit',name:'토끼',icon:'🐰',price:90,skill:'깡충 뛰기',description:'한 번, 단어 하나를 건너뜁니다.'},
 {id:'dog',name:'강아지',icon:'🐶',price:70,skill:'다시 해 봐요',description:'첫 오답 때 기록에서 2초를 줄여 드립니다.'},
 {id:'tiger',name:'호랑이',icon:'🐯',price:120,skill:'연속 질주',description:'3단어를 연속으로 맞히면 2초 단축합니다. 최대 두 번 적용됩니다.'},
 {id:'penguin',name:'펭귄',icon:'🐧',price:100,skill:'작은 발걸음',description:'단어를 맞힐 때마다 0.25초를 줄여 드립니다.'},
 {id:'poodle',name:'초코푸들',icon:'🐩',price:80,skill:'천천히 두 번',description:'예시 발음을 더 천천히 두 번 읽어 드립니다.'},
 {id:'siamese',name:'샴고양이',icon:'🐈',price:80,skill:'또박또박 힌트',description:'단어를 나누어 읽는 힌트를 표시합니다.'},
 {id:'calico',name:'삼색고양이',icon:'🐈',price:110,skill:'행운의 별빛',description:'멀티플레이를 클리어하면 별빛 5개를 더 받습니다.'},
 {id:'lioness',name:'암사자',icon:'🦁',price:150,skill:'든든한 보호',description:'단어를 다르게 인식한 첫 문제를 한 번 통과시켜 드립니다.'},
 {id:'lion',name:'숫사자',icon:'🦁',price:140,skill:'마지막 포효',description:'마지막 단어를 한 번 건너뛸 수 있습니다.'},
 {id:'otter',name:'해달',icon:'🦦',price:100,skill:'긴 단어 미끄럼',description:'6글자 이상 단어를 처음 맞히면 3초를 줄여 드립니다.'},
] as const;
export const character=(id:string)=>characters.find(a=>a.id===id)||characters[0];
export const syllables:Record<string,string>={apple:'ap · ple',banana:'ba · na · na',grape:'grape',orange:'or · ange',pear:'pear',peach:'peach',cherry:'cher · ry',lemon:'lem · on',kiwi:'ki · wi',melon:'mel · on',strawberry:'straw · ber · ry',pineapple:'pine · ap · ple',watermelon:'wa · ter · mel · on',mango:'man · go',coconut:'co · co · nut',tomato:'to · ma · to',olive:'ol · ive',lime:'lime',blueberry:'blue · ber · ry',avocado:'av · o · ca · do',
 cat:'cat',dog:'dog',pig:'pig',cow:'cow',duck:'duck',fish:'fish',bee:'bee',fox:'fox',owl:'owl',bat:'bat',monkey:'mon · key',panda:'pan · da',koala:'ko · a · la',zebra:'ze · bra',tiger:'ti · ger',whale:'whale',snake:'snake',horse:'horse',sheep:'sheep',mouse:'mouse',
 frog:'frog',turtle:'tur · tle',dolphin:'dol · phin',giraffe:'gi · raffe',squirrel:'squir · rel',octopus:'oc · to · pus',elephant:'el · e · phant',butterfly:'but · ter · fly',crocodile:'croc · o · dile',kangaroo:'kan · ga · roo'};
