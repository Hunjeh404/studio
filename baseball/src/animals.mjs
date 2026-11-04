export const SPECIES={
 bear:{name:'곰',emoji:'🐻',fur:'#b9875f',muzzle:'#f1dcc1',head:[.9,.77,.76],body:1.1,ear:'round',tail:'stub'},
 polar:{name:'북극곰',emoji:'🐻‍❄️',fur:'#f2eadd',muzzle:'#fffaf0',head:[.94,.78,.79],body:1.15,ear:'round',tail:'stub'},
 wolf:{name:'늑대',emoji:'🐺',fur:'#9da9b6',muzzle:'#eee8dc',head:[.75,.81,.75],body:1,ear:'point',tail:'fluffy'},
 rabbit:{name:'토끼',emoji:'🐰',fur:'#f0e6d9',muzzle:'#fffaf2',head:[.8,.75,.69],body:.88,ear:'long',tail:'puff'},
 fox:{name:'여우',emoji:'🦊',fur:'#d99458',muzzle:'#fff0d5',head:[.79,.72,.75],body:.94,ear:'point',tail:'fluffy'},
 lion:{name:'사자',emoji:'🦁',fur:'#ddad68',muzzle:'#f8e6bc',head:[.81,.72,.72],body:1.1,ear:'round',tail:'lion'},
 tiger:{name:'호랑이',emoji:'🐯',fur:'#e6a666',muzzle:'#fff0cd',head:[.87,.74,.73],body:1.06,ear:'round',tail:'long'},
 otter:{name:'수달',emoji:'🦦',fur:'#9e7859',muzzle:'#f1dfc3',head:[.88,.62,.73],body:.95,ear:'tiny',tail:'otter'},
 cat:{name:'고양이',emoji:'🐱',fur:'#b1b9bb',muzzle:'#f5ede2',head:[.79,.74,.7],body:.9,ear:'point',tail:'cat'},
 dog:{name:'강아지',emoji:'🐶',fur:'#cca780',muzzle:'#f4e5cd',head:[.84,.73,.75],body:1,ear:'drop',tail:'long'},
 bulldog:{name:'불독',emoji:'🐶',fur:'#c9ae95',muzzle:'#eee0ce',head:[.96,.7,.68],body:1.15,ear:'fold',tail:'stub'},
 panda:{name:'판다',emoji:'🐼',fur:'#f1eadd',muzzle:'#fffbf2',head:[.94,.79,.75],body:1.14,ear:'panda',tail:'stub'},
 raccoon:{name:'라쿤',emoji:'🦝',fur:'#b0a793',muzzle:'#eee7d7',head:[.84,.7,.73],body:1,ear:'tiny',tail:'ring'},
 deer:{name:'사슴',emoji:'🦌',fur:'#c39d76',muzzle:'#f6e4cb',head:[.7,.81,.7],body:.9,ear:'deer',tail:'stub'},
 penguin:{name:'펭귄',emoji:'🐧',fur:'#4e5c6a',muzzle:'#f8f4e9',head:[.78,.77,.69],body:1.05,ear:'none',tail:'stub'},
 squirrel:{name:'다람쥐',emoji:'🐿️',fur:'#c09a75',muzzle:'#f5e7ce',head:[.79,.7,.69],body:.87,ear:'tiny',tail:'squirrel'},
 koala:{name:'코알라',emoji:'🐨',fur:'#adb8ba',muzzle:'#e4e9e2',head:[.87,.76,.69],body:1,ear:'koala',tail:'stub'}
};
const presets={
 'KT:고영표':['deer','긴 팔다리와 유연한 투구 동작을 사슴으로 표현'],'KT:스기모토':['polar','불펜에서 버티는 든든한 북극곰'],'KT:전용주':['cat','민첩한 투구 동작의 고양이'],'KT:우규민':['otter','유연한 투구 폼의 수달'],'SS:페덱':['wolf','긴 팔과 힘 있는 투구를 늑대로 표현'],'SS:원태인':['tiger','마운드의 힘 있는 호랑이'],'SS:이승민':['fox','섬세한 투구를 여우로 표현'],'SS:박계범':['raccoon','다양한 내야 역할의 라쿤'],'SS:김상준':['rabbit','경쾌한 움직임의 토끼'],
 'KT:안현민':['bear','장타자의 힘 있는 이미지를 둥근 곰으로 표현'], 'KT:힐리어드':['wolf','큰 보폭의 외야수와 장타 이미지를 늑대로 표현'], 'KT:최원준':['fox','주루와 외야 움직임의 민첩한 이미지'], 'KT:김민혁':['otter','유연한 스윙을 떠올리는 부드러운 수달'], 'KT:김현수':['lion','중심 타자의 묵직한 존재감을 사자로 표현'], 'KT:김상수':['squirrel','내야의 빠르고 섬세한 움직임을 다람쥐로 표현'], 'KT:허경민':['fox','3루수의 빠른 판단을 떠올리는 여우'], 'KT:한승택':['penguin','포수의 안정적인 자세를 둥근 펭귄으로 표현'], 'KT:장준원':['raccoon','여러 내야 동작에 어울리는 재주 많은 라쿤'], 'KT:장성우':['bear','포수의 든든한 이미지'], 'KT:배정대':['rabbit','외야와 주루의 경쾌한 이미지'], 'KT:장진혁':['deer','외야를 넓게 달리는 사슴 이미지'], 'KT:오윤석':['bulldog','코너 내야의 단단한 이미지'], 'KT:권동진':['cat','탄력 있는 내야 움직임의 고양이'], 'KT:류현인':['rabbit','가볍고 빠른 발걸음을 떠올리는 토끼'], 'KT:대니엘':['polar','선발 투수의 든든한 이미지를 북극곰으로 표현'], 'KT:로건':['wolf','길게 뻗는 투구 동작에 어울리는 늑대'], 'KT:손동현':['dog','리듬감 있는 투구에 어울리는 강아지'], 'KT:김정운':['fox','날렵한 투구 이미지를 여우로 표현'], 'KT:오원석':['deer','길게 뻗는 왼팔 동작에 어울리는 사슴'], 'KT:박영현':['tiger','마무리 투수의 힘 있는 이미지를 호랑이로 표현'],
 'SS:김지찬':['rabbit','작은 체구와 빠른 주루에서 받은 토끼 이미지'], 'SS:박승규':['deer','외야를 달리는 경쾌한 사슴 이미지'], 'SS:구자욱':['lion','중심 타자와 외야수의 존재감을 사자로 표현'], 'SS:디아즈':['bear','장타자의 묵직한 힘을 곰으로 표현'], 'SS:최형우':['tiger','베테랑 중심 타자의 힘 있는 이미지'], 'SS:김성윤':['squirrel','빠른 발걸음과 기동력을 다람쥐로 표현'], 'SS:김영웅':['wolf','장타와 내야 움직임을 함께 담은 늑대 이미지'], 'SS:류지혁':['raccoon','다양한 내야 역할에 어울리는 라쿤'], 'SS:강민호':['panda','포수의 든든한 이미지를 판다로 표현'], 'SS:이재현':['cat','유격수의 탄력 있는 움직임에서 받은 고양이 이미지'], 'SS:김도환':['penguin','포수의 안정적인 자세를 펭귄으로 표현'], 'SS:김헌곤':['dog','외야의 활기 있는 강아지 이미지'], 'SS:김현준':['otter','외야의 유연한 움직임을 수달로 표현'], 'SS:전병우':['bulldog','코너 내야와 대타의 단단한 이미지'], 'SS:최원태':['fox','섬세한 투구 동작에 어울리는 여우'], 'SS:양창섭':['wolf','차분하고 길게 뻗는 투구 이미지'], 'SS:장찬희':['polar','마운드 위의 든든함을 북극곰으로 표현'], 'SS:임기영':['deer','유연하게 펼쳐지는 투구 동작의 사슴'], 'SS:김태훈':['bulldog','불펜 투수의 단단한 이미지'], 'SS:배찬승':['tiger','힘 있게 던지는 투수의 호랑이 이미지'], 'SS:사토시':['koala','부드럽고 균형 잡힌 코알라로 배정']
};
export function makeAssignments(players){const out={};for(const key of Object.keys(players)){const [animal,reason]=presets[key]??['dog','캐릭터의 전체 균형을 보고 배정'];out[key]={animal,reason};}return out;}
export function loadAssignments(players){const defaults=makeAssignments(players);try{const saved=JSON.parse(localStorage.getItem('diamond-animals-v1')||'{}');for(const key of Object.keys(defaults))if(SPECIES[saved[key]?.animal])defaults[key]={...defaults[key],...saved[key]};}catch{}return defaults;}
export function saveAssignments(a){try{localStorage.setItem('diamond-animals-v1',JSON.stringify(a));}catch{}}
