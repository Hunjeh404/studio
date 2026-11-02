// Stage dioramas rebuilt from the six reference illustrations (garden, farm, forest, river, seaside, jungle).
// The maze layout still comes from game.ts; this file only decides how floor, walls, posts, the exit gate,
// props and the backdrop look for each stage.
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

type Cell={walls:boolean[]};
export type ArtContext={scene:T.Scene;n:number;spacing:number;cells:Cell[];software:boolean};
type G=T.Object3D;

export function buildStageArt(stage:number,{scene,n,spacing,cells,software}:ArtContext){
 const mats=new Map<string,T.Material>();
 const mat=(c:string,glow=false)=>{const k=c+(glow?'!':'');let m=mats.get(k);if(!m){m=new T.MeshStandardMaterial({color:c,roughness:.9,...(glow?{emissive:c,emissiveIntensity:.8}:{})});mats.set(k,m);}return m;};
 const seg=(a:number,b:number)=>software?a:b;
 function add(p:G,geo:T.BufferGeometry,c:string,x:number,y:number,z:number,o:{rx?:number;ry?:number;rz?:number;sx?:number;sy?:number;sz?:number;order?:number;glow?:boolean}={}){
  const m=new T.Mesh(geo,mat(c,o.glow));m.position.set(x,y,z);m.rotation.set(o.rx||0,o.ry||0,o.rz||0);m.scale.set(o.sx??1,o.sy??1,o.sz??1);m.castShadow=true;m.receiveShadow=true;if(software)m.renderOrder=o.order??0;p.add(m);return m;}
 const box=(p:G,w:number,h:number,d:number,c:string,x:number,y:number,z:number,r=.05,o={})=>add(p,software||r<=0?new T.BoxGeometry(w,h,d):new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/2,h/2,d/2)),c,x,y,z,o);
 const ball=(p:G,r:number,c:string,x:number,y:number,z:number,sx=1,sy=1,sz=1,o={})=>add(p,new T.SphereGeometry(r,seg(8,14),seg(6,10)),c,x,y,z,{sx,sy,sz,...o});
 const cyl=(p:G,rt:number,rb:number,h:number,c:string,x:number,y:number,z:number,o={})=>add(p,new T.CylinderGeometry(rt,rb,h,seg(8,16)),c,x,y,z,o);
 const cone=(p:G,r:number,h:number,c:string,x:number,y:number,z:number,o={})=>add(p,new T.ConeGeometry(r,h,seg(7,14)),c,x,y,z,o);
 const arc=(p:G,R:number,tube:number,c:string,x:number,y:number,z:number,o={})=>add(p,new T.TorusGeometry(R,tube,seg(6,10),seg(10,20),Math.PI),c,x,y,z,o);
 const group=(x:number,y:number,z:number,ry=0,s=1)=>{const g=new T.Group();g.position.set(x,y,z);g.rotation.y=ry;g.scale.setScalar(s);scene.add(g);return g;};
 const half=(n-1)*spacing/2,S=(n*spacing+1)/2,L=spacing;
 const hash=(i:number)=>{const v=Math.sin(i*127.1+stage*311.7)*43758.5453;return v-Math.floor(v);};

 // ---------- reusable small pieces ----------
 const pebbles=(p:G,c:string,count:number,len:number,y=.07,r=.085)=>{for(let i=0;i<count;i++)ball(p,r,c,-len/2+len*(i+.5)/count,y,0,1.15,.75,.95);};
 const leafTuft=(p:G,c:string,x:number,y:number,z:number,s=1)=>{for(let i=0;i<5;i++){const a=i/5*Math.PI*2;ball(p,.07*s,c,x+Math.cos(a)*.06*s,y,z+Math.sin(a)*.06*s,1.4,.35,.8,{ry:-a});}};
 const grass=(p:G,c:string,x:number,z:number,s=1)=>{for(let i=0;i<4;i++)cone(p,.025*s,.26*s,c,x+(i-1.5)*.03*s,.13*s,z+(i%2)*.03,{rz:(i-1.5)*.25});};
 function fruitTree(p:G,fruit:string){cyl(p,.07,.1,.55,'#9a6b45',0,.27,0);ball(p,.42,'#8db86b',0,.85,0,1,.9,1);ball(p,.3,'#a3c77e',.18,.98,.1);for(let i=0;i<6;i++){const a=i*1.1;ball(p,.07,fruit,Math.cos(a)*.36,.75+(i%3)*.12,Math.sin(a)*.36);}}
 function basket(p:G,fruit:string){cyl(p,.17,.13,.16,'#c8925a',0,.08,0);add(p,new T.TorusGeometry(.15,.016,6,16,Math.PI),'#b98250',0,.16,0);for(let i=0;i<3;i++)ball(p,.065,fruit,(i-1)*.08,.18,(i%2)*.04);}
 function oak(p:G){cyl(p,.08,.12,.6,'#94643d',0,.3,0);ball(p,.38,'#7ea45a',0,.9,0);ball(p,.28,'#8fb565',-.22,.82,.1);ball(p,.28,'#8fb565',.22,.85,-.05);ball(p,.25,'#9cc070',0,1.15,0);}
 function pine(p:G){cyl(p,.05,.07,.3,'#8a5d3a',0,.15,0);cone(p,.3,.45,'#6f9a6a',0,.45,0);cone(p,.24,.4,'#7ba674',0,.7,0);cone(p,.16,.32,'#87b17f',0,.92,0);}

 // ---------- per stage look ----------
 type Look={top:string;dirt:string;dot:string;tile:(c:number)=>string;decal?:(p:G,i:number)=>void;wall:(p:G)=>void;post:(p:G)=>void;gate:(p:G)=>void;props:((p:G)=>void)[];backdrop:()=>void;ground?:{c:string;r:number}};
 const looks:Look[]=[
  { // 1. fruit garden: clipped hedges, clover tiles, wooden leafy arch
   top:'#93bd6e',dirt:'#b77d53',dot:'#c9946a',tile:c=>c%2?'#b6d48f':'#aecd87',
   decal:(p,i)=>{if(i%3)return;for(let k=0;k<3;k++)ball(p,.035,'#8fbd6c',Math.cos(k*2.1)*.035,.01,Math.sin(k*2.1)*.035,1,.3,1);},
   wall:p=>{box(p,L+.05,.42,.26,'#7fae63',0,.21,0,.09);if(!software)for(let i=0;i<5;i++)ball(p,.075,'#8dba6e',-L/2+L*(i+.5)/5,.42,0,1,.55,1.4);},
   post:p=>{box(p,.32,.46,.32,'#78a85d',0,.23,0,.1);},
   gate:p=>{for(const s of [-1,1]){box(p,.13,.1,.13,'#e6d9c1',s*.42,.05,0,.02);box(p,.08,.5,.08,'#b37c4e',s*.42,.34,0,.03);}arc(p,.42,.045,'#b37c4e',0,.58,0);leafTuft(p,'#86b664',-.3,.86,0,1.1);leafTuft(p,'#86b664',.36,.74,.02);leafTuft(p,'#9ac772',-.42,.5,.03,.8);},
   props:[p=>{ball(p,.24,'#7fae63',0,.2,0,1,.85,1);for(let i=0;i<4;i++)ball(p,.07,'#de5b4c',Math.cos(i*1.7)*.18,.24+(i%2)*.08,Math.sin(i*1.7)*.18);},p=>basket(p,'#de5b4c'),p=>basket(p,'#efcf4a'),p=>{for(let k=0;k<3;k++)ball(p,.07,'#8fbd6c',Math.cos(k*2.1)*.07,.12,Math.sin(k*2.1)*.07,1,.4,1);cyl(p,.01,.01,.12,'#7aa65a',0,.06,0);}],
   backdrop:()=>{fruitTree(group(-S-.55,-.25,-S+.9,0,.95),'#de5b4c');fruitTree(group(S-.9,-.25,-S-.55,0,.95),'#efcf4a')}
  },
  { // 2. farm: picket fences, straw and earth tiles, red barn gate
   top:'#e6c260',dirt:'#b77a4c',dot:'#c78f5f',tile:c=>c%2?'#ddb177':'#e7c682',
   decal:(p,i)=>{if(i%3!==1)return;for(let k=0;k<5;k++)ball(p,.025,'#f0c43e',Math.cos(k*1.26)*.035,.01,Math.sin(k*1.26)*.035,1,.4,1);},
   wall:p=>{box(p,L,.05,.05,'#b56e3c',0,.14,-.02,.02);box(p,L,.05,.05,'#b56e3c',0,.3,-.02,.02);for(let i=0;i<4;i++)box(p,.15,.4,.05,'#c27a44',-L/2+L*(i+.5)/4,.2,.02,.06);},
   post:p=>{box(p,.13,.46,.13,'#b56e3c',0,.23,0,.05);},
   gate:p=>{for(const s of [-1,1]){box(p,.16,.1,.16,'#efe0c4',s*.42,.05,0,.02);box(p,.13,.52,.13,'#c85a4c',s*.42,.36,0,.03);}arc(p,.42,.07,'#c85a4c',0,.62,0,{sz:1.6});arc(p,.42,.02,'#f1e3c6',0,.62,.1);box(p,.03,.3,.03,'#f1e3c6',0,.88,.11,0);box(p,.03,.3,.03,'#f1e3c6',-.12,.82,.11,0,{rz:.8});box(p,.03,.3,.03,'#f1e3c6',.12,.82,.11,0,{rz:-.8});},
   props:[p=>{cyl(p,.17,.17,.3,'#e8be4f',0,.17,0,{rz:Math.PI/2});add(p,new T.TorusGeometry(.172,.014,6,18),'#b07a3c',-.07,.17,0,{ry:Math.PI/2});add(p,new T.TorusGeometry(.172,.014,6,18),'#b07a3c',.07,.17,0,{ry:Math.PI/2});},
    p=>{cyl(p,.1,.11,.26,'#b9bec2',0,.13,0);cyl(p,.06,.1,.08,'#aab0b5',0,.3,0);cyl(p,.065,.065,.04,'#9aa1a6',0,.35,0);},
    p=>{box(p,.42,.16,.24,'#b97540',0,.08,0,.03);box(p,.36,.02,.18,'#a9d4e6',0,.16,0,0);},
    p=>{box(p,.3,.1,.22,'#c85a4c',0,.22,0,.04,{rz:-.15});add(p,new T.TorusGeometry(.07,.025,6,14),'#555b5f',.18,.08,0);box(p,.4,.025,.025,'#b07a4c',-.12,.2,.09,0,{rz:.15});box(p,.4,.025,.025,'#b07a4c',-.12,.2,-.09,0,{rz:.15});}],
   backdrop:()=>{const b=group(-S-.6,-.2,-S+.7,.35,.9);box(b,.7,.45,.5,'#c85a4c',0,.22,0,.03);add(b,new T.CylinderGeometry(.42,.42,.74,3),'#a8473d',0,.5,0,{rz:Math.PI/2,sy:1,sx:.75});box(b,.28,.3,.02,'#f1e3c6',.0,.15,.26,0);
    const w=group(S-.85,-.2,-S-.6,0,.9);cyl(w,.12,.18,.6,'#efe0c4',0,.3,0);cone(w,.16,.18,'#c85a4c',0,.69,0);for(let i=0;i<4;i++)box(w,.06,.42,.015,'#f1e3c6',0,.62,.19,0,{rz:i*Math.PI/2+.4});}
  },
  { // 3. forest: mossy logs on stones, leaf tiles, tree-trunk arch
   top:'#8fb047',dirt:'#b47548',dot:'#c58a5c',tile:c=>c%2?'#a3c35a':'#9bbd53',
   decal:(p,i)=>{if(i%3!==2)return;ball(p,.06,i%2?'#e98a3c':'#efb43f',0,.01,0,1.3,.25,.8,{ry:i});},
   wall:p=>{pebbles(p,'#a9a296',4,L,.08,.1);cyl(p,.15,.15,L,'#a8683d',0,.3,0,{rz:Math.PI/2});if(!software){box(p,L*.7,.05,.13,'#6f9a36',0,.45,0,.025);leafTuft(p,'#7fab3e',.15,.47,0,.7);}},
   post:p=>{pebbles(p,'#b4ada0',2,.3,.06,.07);cyl(p,.15,.16,.42,'#a8683d',0,.25,0);cyl(p,.14,.14,.02,'#e9c38f',0,.465,0);},
   gate:p=>{arc(p,.4,.11,'#9b6038',0,.48,0);for(const s of [-1,1]){cyl(p,.1,.14,.5,'#9b6038',s*.4,.25,0);ball(p,.07,'#b4ada0',s*.5,.04,.05);}leafTuft(p,'#86b13f',-.25,.9,0,1.2);leafTuft(p,'#9cc350',.2,.88,0,1.2);},
   props:[p=>{cyl(p,.05,.06,.2,'#f1e5cf',0,.1,0);ball(p,.15,'#d9543f',0,.2,0,1,.6,1);for(let i=0;i<4;i++)ball(p,.025,'#f6ead5',Math.cos(i*1.6)*.09,.26,Math.sin(i*1.6)*.09);cyl(p,.03,.04,.12,'#f1e5cf',.13,.06,.06);ball(p,.08,'#d9543f',.13,.13,.06,1,.6,1);},
    p=>{cyl(p,.18,.22,.24,'#a8683d',0,.12,0);cyl(p,.17,.17,.02,'#e9c38f',0,.25,0);leafTuft(p,'#88ad45',.18,.06,.1,.8);},
    p=>{for(let i=0;i<7;i++){const a=i/7*Math.PI*2;ball(p,.07,'#7fae42',Math.cos(a)*.13,.14,Math.sin(a)*.13,2.4,.4,.8,{ry:-a,rz:.5});}},
    p=>{box(p,.05,.6,.05,'#8e5c36',0,.3,0,.02);box(p,.2,.04,.04,'#8e5c36',.08,.58,0,.02);box(p,.09,.12,.09,'#f6cf75',.16,.48,0,.02,{glow:true});}],
   backdrop:()=>{oak(group(-S-.55,-.25,-S+.9));pine(group(-S-.5,-.25,-S-.3,0,1.1));oak(group(S-.9,-.25,-S-.55));pine(group(.2,-.25,-S-.6,0,1.2));}
  },
  { // 4. river & pond: river-stone walls, paving and plank tiles, footbridge
   top:'#9cbe63',dirt:'#b47b52',dot:'#c58e62',tile:c=>c%5===2?'#c98d58':c%2?'#efe3c9':'#e9dbbd',ground:{c:'#a8d5d0',r:.8},
   decal:(p,i)=>{if(i%5===2)for(const z of [-.2,.2])box(p,.9,.012,.015,'#b07a4a',0,.005,z,0);},
   wall:p=>{for(let i=0;i<3;i++){const h=.32+hash(i+3)*.08;box(p,.36,h,.27,i%2?'#a9a9a2':'#b5b4ad',-L/3+i*L/3,h/2,0,.1);}if(!software){ball(p,.1,'#9cbf56',-.1,.39,0,1.3,.35,1);grass(p,'#86b14d',.3,.15);}},
   post:p=>{box(p,.3,.42,.3,'#a4a49d',0,.21,0,.11);ball(p,.11,'#9cbf56',0,.43,0,1.2,.35,1.2);},
   gate:p=>{box(p,.9,.06,.5,'#c98d58',0,.08,.1,.02);for(const s of [-1,1]){for(const z of [-.12,.32])cyl(p,.04,.04,.42,'#c9925c',s*.45,.25,z);box(p,.04,.04,.5,'#c9925c',s*.45,.42,.1,.015);box(p,.12,.06,.12,'#efe3c9',s*.45,.03,-.12,.02);}},
   props:[p=>{grass(p,'#86b14d',0,0,1.4);for(const x of [-.04,.05]){cyl(p,.008,.008,.5,'#7a9a45',x,.25,0);cyl(p,.035,.035,.14,'#a5683d',x,.48,0);}},
    p=>{ball(p,.3,'#c98d58',0,.1,0,1,.4,.5);ball(p,.27,'#a96f42',0,.13,0,.92,.28,.42);box(p,.05,.03,.24,'#c98d58',0,.14,0,0);},
    p=>{ball(p,.14,'#a9a9a2',0,.05,0,1.3,.4,1);ball(p,.09,'#b5b4ad',.25,.04,.12,1.3,.4,1);ball(p,.08,'#b5b4ad',.05,.04,.26,1.3,.4,1);},
    p=>{cyl(p,.17,.17,.02,'#8ec062',0,.01,0);ball(p,.06,'#f3b7c3',0,.05,0,1,.6,1);ball(p,.03,'#f6dd6b',0,.08,0);cyl(p,.07,.07,.02,'#8ec062',.24,.01,.12);}],
   backdrop:()=>{for(const [x,z] of [[-S-.55,-S+.9],[S-.9,-S-.55]] as const){const w=group(x,-.25,z);cyl(w,.08,.12,.6,'#94643d',0,.3,0);ball(w,.38,'#a6c766',0,.9,0,1,.8,1);if(!software)for(let i=0;i<8;i++){const a=i/8*Math.PI*2;cyl(w,.03,.06,.5,'#b2d073',Math.cos(a)*.3,.62,Math.sin(a)*.3);}}
    for(let i=0;i<3;i++)ball(group(-S-.2+i*.5,-.42,-S-.75),.12,'#b5b4ad',0,0,0,1.4,.5,1);}
  },
  { // 5. seaside: driftwood on white pebbles, sand tiles with shells, rope gate with flag
   top:'#efd69a',dirt:'#c08657',dot:'#d19b6a',tile:c=>c%2?'#f2dca6':'#eed49a',ground:{c:'#9fd3de',r:.9},
   decal:(p,i)=>{if(i%3)return;ball(p,.05,'#f7efe1',0,.01,0,1,.4,.8);},
   wall:p=>{pebbles(p,'#eee8dc',4,L,.09,.11);box(p,L,.15,.11,'#b98353',0,.3,0,.04);},
   post:p=>{ball(p,.1,'#eee8dc',0,.06,0,1.3,.6,1.3);box(p,.13,.42,.13,'#b07a4c',0,.27,0,.04);},
   gate:p=>{for(const s of [-1,1]){box(p,.16,.1,.16,'#eee8dc',s*.4,.05,0,.03);box(p,.12,.66,.12,'#b07a4c',s*.4,.43,0,.04);add(p,new T.TorusGeometry(.08,.018,6,14),'#d8b077',s*.4,.55,0,{rx:Math.PI/2});}add(p,new T.TorusGeometry(.4,.02,6,16,Math.PI),'#d8b077',0,.72,0,{rx:Math.PI});box(p,.025,.4,.025,'#b07a4c',.4,.95,0,0);add(p,new T.PlaneGeometry(.22,.13),'#e8705e',.52,1.07,0,{});},
   props:[p=>{cyl(p,.015,.015,.62,'#b07a4c',0,.31,0);cone(p,.32,.16,'#ec8a7e',0,.64,0);cone(p,.17,.09,'#f6ece0',0,.7,0);ball(p,.03,'#b07a4c',0,.74,0);},
    p=>{cyl(p,.17,.19,.17,'#ecc982',0,.09,0);cyl(p,.11,.12,.14,'#ecc982',0,.24,0);for(let i=0;i<4;i++)box(p,.05,.06,.05,'#ecc982',Math.cos(i*1.57)*.09,.33,Math.sin(i*1.57)*.09,.01);box(p,.015,.18,.015,'#b07a4c',0,.4,0,0);add(p,new T.PlaneGeometry(.1,.06),'#e8705e',.05,.46,0);},
    p=>{for(let i=0;i<5;i++){const a=i/5*Math.PI*2;cone(p,.05,.16,'#ec7b67',Math.cos(a)*.07,.04,Math.sin(a)*.07,{rx:Math.PI/2,ry:0,rz:-a+Math.PI/2,sy:1});}ball(p,.05,'#ec7b67',0,.04,0,1,.5,1);},
    p=>{ball(p,.14,'#f6ece0',0,.16,0);add(p,new T.TorusGeometry(.14,.035,6,18),'#e8705e',0,.16,0,{rx:Math.PI/2});add(p,new T.TorusGeometry(.05,.012,6,12),'#d8b077',0,.33,0);}],
   backdrop:()=>{const l=group(S-.85,-.3,-S-.65,0,.95);ball(l,.3,'#b5b4ad',0,0,0,1.3,.5,1.2);cyl(l,.1,.15,.62,'#f6ece0',0,.4,0);cyl(l,.135,.135,.08,'#e8705e',0,.4,0);cyl(l,.12,.12,.12,'#f7e6a3',0,.77,0,{glow:true});cone(l,.15,.14,'#e8705e',0,.9,0);
    for(let i=0;i<3;i++)add(group(-S-.4+i*.7,-.43,-S-1.1),new T.TorusGeometry(.18,.012,4,12,Math.PI),'#e9f5f5',0,0,0,{rx:-Math.PI/2});}
  },
  { // 6. jungle: mossy temple blocks with vines, root tiles, vine stone arch
   top:'#84ac3e',dirt:'#b06f45',dot:'#c18559',tile:c=>c%2?'#cdb07f':'#c6a875',
   decal:(p,i)=>{if(i%3===1){box(p,.38,.015,.025,'#9b6a3f',0,.005,0,0,{ry:.6});box(p,.2,.015,.02,'#9b6a3f',.12,.005,.06,0,{ry:-.5});}else if(i%4===0)ball(p,.05,'#8fb54a',.15,.01,-.1,1,.3,1);},
   wall:p=>{box(p,L,.34,.26,'#bfa67b',0,.17,0,.04);if(!software){box(p,L*.5,.012,.27,'#a8916a',-L/4,.17,0,0);}box(p,L,.07,.28,'#86b23f',0,.37,0,.03);if(!software){ball(p,.05,'#7ea93a',.1,.26,.14,1,1.4,.5);ball(p,.04,'#7ea93a',.13,.13,.14,1,1.4,.5);leafTuft(p,'#93c04b',-.25,.41,0,.8);}},
   post:p=>{box(p,.3,.44,.3,'#b89e72',0,.22,0,.04);box(p,.32,.08,.32,'#86b23f',0,.46,0,.03);},
   gate:p=>{for(const s of [-1,1]){box(p,.18,.1,.18,'#d8c49c',s*.42,.05,0,.03);box(p,.15,.5,.15,'#c4ab80',s*.42,.35,0,.03);}arc(p,.42,.08,'#c4ab80',0,.6,0,{sz:1.4});leafTuft(p,'#86b23f',-.3,.95,0,1.1);leafTuft(p,'#93c04b',.28,.9,0,1.1);ball(p,.05,'#7ea93a',-.48,.55,.08,1,2,.6);ball(p,.05,'#7ea93a',.48,.4,.08,1,2,.6);},
   props:[p=>{for(let i=0;i<6;i++){const a=i/6*Math.PI*2;ball(p,.12,'#75a23a',Math.cos(a)*.17,.16,Math.sin(a)*.17,2,.35,1,{ry:-a,rz:.45});}},
    p=>{ball(p,.18,'#75a23a',0,.15,0,1.2,.8,1.2);for(let i=0;i<3;i++){const a=i*2.1;ball(p,.06,'#ef8a3b',Math.cos(a)*.13,.27,Math.sin(a)*.13,1,.5,1);ball(p,.02,'#f7cf55',Math.cos(a)*.13,.3,Math.sin(a)*.13);}},
    p=>{ball(p,.24,'#b3a589',0,.18,0,1,1,.8);ball(p,.12,'#86b23f',0,.38,0,1.4,.4,1);box(p,.1,.26,.04,'#8fd0e6',0,.14,.17,.02,{glow:true});for(let i=0;i<3;i++)ball(p,.05,'#f4fbff',(i-1)*.06,.03,.22);},
    p=>{ball(p,.16,'#c9a87a',0,.16,0,1,.95,1);cyl(p,.11,.09,.06,'#c9a87a',0,.31,0);}],
   backdrop:()=>{for(const [x,z] of [[-S-.55,-S+.9],[S-.9,-S-.55]] as const){const t=group(x,-.25,z);cyl(t,.08,.14,.7,'#8e5c36',0,.35,0);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;ball(t,.2,i%2?'#7fae3c':'#8fbd48',Math.cos(a)*.28,.85,Math.sin(a)*.28,1.6,.35,1,{ry:-a,rz:.3});}ball(t,.2,'#8fbd48',0,.95,0,1.3,.5,1.3);if(!software)add(t,new T.TorusGeometry(.2,.02,5,14,Math.PI),'#7ea93a',0,.55,.05,{rx:Math.PI});}}
  }
 ];
 const look=looks[stage-1];

 // ---------- island, ground, tiles ----------
 if(look.ground){const g=new T.Mesh(new T.CircleGeometry(S*1.2+look.ground.r*.1,seg(16,40)),mat(look.ground.c));g.rotation.x=-Math.PI/2;g.position.y=-.5;g.receiveShadow=true;if(software)g.renderOrder=-103;scene.add(g);}
 box(scene,S*2,.46,S*2,look.dirt,0,-.29,0,.16,{order:-102});
 box(scene,S*2+.04,.14,S*2+.04,look.top,0,-.02,0,.08,{order:-101});
 if(!software)for(let side=0;side<4;side++)for(let i=0;i<n+1;i++){const t=-S+.3+i*(2*S-.6)/n,y=-.3+(i%2)*.14,face=S+.005;const [x,z]=side===0?[t,face]:side===1?[face,t]:side===2?[t,-face]:[-face,t];ball(scene,.05,look.dot,x,y,z,side%2?.3:1,1,side%2?1:.3);}
 const point=(c:number)=>new T.Vector3((c%n)*spacing-half,0,Math.floor(c/n)*spacing-half);
 cells.forEach((_,c)=>{const p=point(c);box(scene,1.0,.08,1.0,look.tile(c),p.x,.07,p.z,.04,{order:-100});if(look.decal&&!software){const d=new T.Group();d.position.set(p.x+(hash(c)-.5)*.4,.115,p.z+(hash(c+50)-.5)*.4);scene.add(d);look.decal(d,c);}});

 // ---------- walls, posts and the exit gate ----------
 const vx=(i:number)=>i*spacing-half-spacing/2,used=new Set<number>(),exit=n*n-1;
 const edge=(x0:number,z0:number,alongX:boolean)=>{used.add(z0*(n+1)+x0);used.add((alongX?z0:z0+1)*(n+1)+(alongX?x0+1:x0));const g=group(alongX?vx(x0)+spacing/2:vx(x0),.11,alongX?vx(z0):vx(z0)+spacing/2,alongX?0:Math.PI/2);look.wall(g);};
 cells.forEach((cell,c)=>{const x=c%n,z=Math.floor(c/n);if(cell.walls[0])edge(x,z,true);if(cell.walls[3])edge(x,z,false);if(x===n-1&&cell.walls[1])edge(x+1,z,false);if(z===n-1&&cell.walls[2]&&c!==exit)edge(x,z+1,true);});
 used.forEach(v=>look.post(group(vx(v%(n+1)),.11,vx(Math.floor(v/(n+1))))));
 look.gate(group(vx(n-1)+spacing/2,.11,vx(n)));

 // ---------- props on the island rim and the backdrop ----------
 const rim=[[-S+.25,-S+1.4],[S-1.3,-S+.25],[-S+.25,S-.75],[-S+1.05,S-.25]] as const;
 look.props.forEach((make,i)=>{const [x,z]=rim[i];make(group(x,.05,z,hash(i)*Math.PI*2,.85));});
 look.backdrop();
}
