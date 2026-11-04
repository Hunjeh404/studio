import * as T from 'three';
import{SPECIES}from'./animals.mjs';import{drawLogoContained}from'./logos.mjs';import{toonMaterial,addToonOutlines}from'./toon.mjs';
const sph=new T.SphereGeometry(1,16,12),cyl=new T.CylinderGeometry(1,1,1,14),cone=new T.ConeGeometry(1,1,16);const mats=new Map();
function mat(color){if(!mats.has(color))mats.set(color,toonMaterial(color));return mats.get(color);}
function ell(parent,color,p,s){const m=new T.Mesh(sph,mat(color));m.position.set(...p);m.scale.set(...s);m.castShadow=true;m.receiveShadow=true;m.userData.outlineEligible=Math.min(...s)>.14;parent.add(m);return m;}
function tube(parent,color,points,r=.05){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const m=new T.Mesh(new T.TubeGeometry(curve,16,r,7,false),mat(color));m.castShadow=true;parent.add(m);return m;}
function rod(parent,color,a,b,r=.08){const v=new T.Vector3(...b).sub(new T.Vector3(...a));const m=new T.Mesh(cyl,mat(color));m.scale.set(r,v.length(),r);m.position.copy(new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());parent.add(m);m.castShadow=true;return m;}
function joint(parent,name,p){const g=new T.Group();g.name=name;g.position.set(...p);parent.add(g);return g;}
const textCache=new Map();
export function labelTexture(text,color='#26382f',bg='#fff9e9'){const key=text+color+bg;if(textCache.has(key))return textCache.get(key);const c=document.createElement('canvas');c.width=256;c.height=80;const x=c.getContext('2d');x.fillStyle=bg;x.beginPath();x.roundRect(0,0,256,80,18);x.fill();x.fillStyle=color;x.textAlign='center';x.textBaseline='middle';x.font='600 34px "Malgun Gothic",sans-serif';x.fillText(text,128,41,230);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;textCache.set(key,texture);return texture;}
function jerseyBadge(parent,text,front){const c=document.createElement('canvas');c.width=128;c.height=128;const x=c.getContext('2d');x.fillStyle='#f7f3e9';x.font='bold 75px Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(text,64,67,120);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(front?.34:.57,front?.34:.57),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));m.position.set(0,front?1.3:1.63,front?.565:-.565);if(!front)m.rotation.y=Math.PI;parent.add(m);return m;}
const logoTextures=new Map();function logoPatch(parent,team,position,size){if(!logoTextures.has(team)){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');if(team==='SS'){x.fillStyle='#fffaf2';x.beginPath();x.roundRect(3,40,250,176,24);x.fill();}drawLogoContained(x,team,8,8,240,240);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;logoTextures.set(team,t);}const m=new T.Mesh(new T.PlaneGeometry(size,size),new T.MeshBasicMaterial({map:logoTextures.get(team),transparent:true,depthWrite:false,toneMapped:false}));m.position.set(...position);parent.add(m);}
export function buildAnimal(kind,team='KT',number=''){const cfg=SPECIES[kind]??SPECIES.bear;const fur=cfg.fur,muzzle=cfg.muzzle;const kit=team==='KT'?'#272b37':'#3677d3',trim=team==='KT'?'#ec4960':'#f5f7f9';
 const root=new T.Group();root.name=kind;const hip=joint(root,'hip',[0,0,0]);const body=joint(hip,'body',[0,0,0]);ell(body,kit,[0,1.6,0],[.67*cfg.body,.77,.5]);ell(body,'#eee6d9',[0,1.0,0],[.56*cfg.body,.35,.45]);
 // The sleeves and paws pivot at the shoulders, legs at the hip.
 const armL=joint(hip,'armL',[.61*cfg.body,2.01,0]);const armR=joint(hip,'armR',[-.61*cfg.body,2.01,0]);
 for(const [arm,sgn]of[[armL,1],[armR,-1]]){ell(arm,kit,[sgn*.06,-.17,0],[.25,.34,.28]);ell(arm,fur,[sgn*.1,-.56,.02],[.22,.36,.23]);ell(arm,fur,[sgn*.1,-.81,.05],[.25,.23,.27]);}
 const legL=joint(root,'legL',[.29,1.0,0]),legR=joint(root,'legR',[-.29,1.0,0]);for(const l of[legL,legR]){ell(l,'#f5eee4',[0,-.27,0],[.24,.38,.28]);ell(l,fur,[0,-.65,.11],[.29,.19,.4]);ell(l,'#343a40',[0,-.78,.13],[.29,.07,.4]);}
 const head=joint(hip,'head',[0,2.75,0]);ell(head,fur,[0,0,0],cfg.head);
 if(kind==='lion')for(let i=0;i<16;i++){const a=i/16*Math.PI*2;ell(head,i%2?'#a87749':'#bb8951',[Math.cos(a)*.77,Math.sin(a)*.7,-.22],[.38,.41,.42]);}
 if(kind==='panda'){ell(head,'#404449',[-.3,.06,.565],[.22,.3,.15]);ell(head,'#404449',[.3,.06,.565],[.22,.3,.15]);}
 if(kind==='raccoon')for(const s of[-1,1])ell(head,'#655e56',[s*.32,.03,.59],[.32,.22,.16]);
 if(kind==='penguin'){ell(head,muzzle,[0,-.1,.45],[.65,.56,.28]);ell(head,'#edb358',[0,-.23,.81],[.22,.12,.26]);}
 else{const protrude=['wolf','fox','dog'].includes(kind)?.85:.7;ell(head,muzzle,[-.17,-.22,protrude-.1],[.3,.22,.24]);ell(head,muzzle,[.17,-.22,protrude-.1],[.3,.22,.24]);ell(head,kind==='koala'?'#5b666b':'#53483e',[0,-.13,protrude+.08],kind==='koala'?[.19,.28,.13]:[.12,.095,.11]);tube(head,'#9b7963',[[-.13,-.35,protrude+.04],[0,-.38,protrude+.07],[.13,-.35,protrude+.04]],.018);}
 const eyeZ=cfg.head[2]*.98+.025+(['panda','raccoon'].includes(kind)?.075:0);for(const s of[-1,1]){ell(head,'#34373c',[s*.29,.09,eyeZ],[.065,.095,.055]);ell(head,'#fffdf1',[s*.29-.017,.12,eyeZ+.05],[.018,.023,.013]);}
 const earColor=kind==='panda'?'#41464a':fur;for(const s of[-1,1]){
  const ear=cfg.ear;
  if(['round','panda','tiny','koala'].includes(ear)){const r=ear==='tiny'?.19:ear==='koala'?.42:.29;ell(head,earColor,[s*.68,.58,-.06],[r,r,.23]);ell(head,kind==='koala'?'#e5e2d8':'#c9a5a0',[s*.68,.59,.12],[r*.58,r*.55,.1]);}
  else if(ear==='point'||ear==='fold'){const m=new T.Mesh(cone,mat(fur));m.position.set(s*.57,.66,-.03);m.scale.set(.3,ear==='fold'?.43:.65,.26);m.rotation.z=-s*.23;m.castShadow=true;head.add(m);ell(head,'#deb3ab',[s*.57,.64,.15],[.14,.2,.035]);}
  else if(ear==='long'){const e=ell(head,fur,[s*.34,.97,-.08],[.23,.88,.23]);e.rotation.z=-s*.12;const inner=ell(head,'#e2b7ac',[s*.36,1.0,.1],[.115,.59,.06]);inner.rotation.z=-s*.12;}
  else if(ear==='drop'){ell(head,fur,[s*.68,.5,-.12],[.24,.24,.23]);const e=ell(head,'#ad825d',[s*.83,.08,-.07],[.3,.57,.25]);e.rotation.z=s*.17;}
  else if(ear==='deer'){const e=ell(head,fur,[s*.69,.58,-.02],[.35,.22,.15]);e.rotation.z=s*.46;ell(head,'#e5c0b2',[s*.7,.59,.095],[.21,.12,.05]);rod(head,'#977956',[s*.36,.55,-.25],[s*.4,1.17,-.25],.05);rod(head,'#977956',[s*.4,1.0,-.25],[s*.65,1.2,-.25],.045);}
 }
 if(kind==='tiger')for(const s of[-1,1])for(let i=0;i<3;i++)tube(head,'#6c5142',[[s*.79,.33-i*.2,.23],[s*.7,.25-i*.2,.47],[s*.55,.22-i*.2,.58]],.035);
 if(['cat','otter','raccoon','squirrel'].includes(kind))for(const s of[-1,1])for(let i=0;i<2;i++)tube(head,'#806c5c',[[s*.28,-.22+i*.09,.78],[s*.58,-.27+i*.16,.77]],.012);
 // Soft baseball cap, leaving ears visible.
 const capY=cfg.head[1]-.03;ell(head,kit,[0,capY,-.04],[.65,.26,.62]);const brim=ell(head,kit,[0,capY-.06,.55],[.68,.055,.4]);
 const tail=joint(hip,'tail',[0,1.08,-.38]);if(cfg.tail==='fluffy'){const e=ell(tail,fur,[.45,.38,-.6],[.39,.42,.83]);e.rotation.y=-.5;ell(tail,muzzle,[.7,.55,-1.1],[.28,.3,.38]);}
 else if(cfg.tail==='squirrel'){const e=ell(tail,fur,[.47,.64,-.57],[.58,.9,.42]);e.rotation.z=-.3;ell(tail,muzzle,[.55,.72,-.9],[.33,.6,.1]);}
 else if(cfg.tail==='puff')ell(tail,muzzle,[0,.12,-.26],[.34,.34,.34]);
 else if(['long','cat','lion','ring','otter'].includes(cfg.tail)){const tailmesh=tube(tail,fur,[[0,0,0],[.2,.18,-.55],[.5,.53,-.8],[.65,.8,-.65]],cfg.tail==='otter'?.2:.11);if(cfg.tail==='lion')ell(tail,'#a5794c',[.65,.8,-.65],[.23,.23,.23]);if(cfg.tail==='ring')for(let i=0;i<3;i++)ell(tail,'#6f6b61',[.18+i*.13,.2+i*.18,-.55-i*.06],[.13,.12,.16]);}
 else ell(tail,fur,[0,.03,-.14],[.2,.2,.2]);
 logoPatch(body,team,[0,1.85,.57],.55);logoPatch(head,team,[0,capY+.08,.59],.27);jerseyBadge(body,number||'•',true);jerseyBadge(body,number||'•',false);
 const bat=joint(armR,'bat',[0,-.78,.02]);rod(bat,'#c59a60',[0,0,0],[0,1.3,0],.065);ell(bat,'#d8b57a',[0,1.12,0],[.105,.42,.105]);bat.visible=false;
 const glove=joint(armL,'glove',[0,-.78,.15]);ell(glove,'#ae794b',[0,0,.09],[.3,.28,.16]);for(let i=-1;i<=1;i++)tube(glove,'#775134',[[i*.08,-.16,.24],[i*.1,.1,.25]],.015);glove.visible=true;
 head.position.y=2.15;for(const child of head.children)child.position.y+=.6;hip.position.y=1.0;for(const child of hip.children)child.position.y-=1.0;addToonOutlines(root);root.updateMatrixWorld(true);const box=new T.Box3().setFromObject(root);const height=box.max.y-box.min.y;const norm=.95/height;root.scale.setScalar(norm);root.position.y=-box.min.y*norm;
 root.userData={kind,team,rig:{hip,hipRest:1.0,head,armL,armR,legL,legR,tail,bat,glove},height:.95,triangleCount:0};root.traverse(o=>{if(o.isMesh&&!o.userData.renderOnly)root.userData.triangleCount+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});
 return root;
}
export function poseAnimal(model,{time=0,run=0,throwing=0,swing=0,catcher=false,batter=false}={}){const r=model.userData.rig;const step=Math.sin(time*14);r.hip.position.y=r.hipRest+(run?Math.abs(step)*.07:Math.sin(time*2.7)*.012);r.head.rotation.z=run?step*.035:0;r.legL.rotation.x=run?step*.58:0;r.legR.rotation.x=run?-step*.58:0;r.armL.rotation.x=run?-step*.55:0;r.armR.rotation.x=run?step*.55:0;r.armL.rotation.z=.08;r.armR.rotation.z=-.08;r.hip.rotation.y=0;r.bat.visible=batter;r.glove.visible=!batter;
 if(batter){r.armR.rotation.x=-1.1;r.armR.rotation.z=-.55;r.armL.rotation.x=-.7;r.armL.rotation.z=.65;r.bat.rotation.z=-.3;if(swing>0){const f=Math.sin(swing*Math.PI);r.hip.rotation.y=-f*1.5;r.armR.rotation.x=-.5-f*.8;r.armR.rotation.z=-.3-f*1.1;r.armL.rotation.z=.4+f*.6;}}
 if(throwing>0){r.armR.rotation.x=-throwing*2.9;r.armL.rotation.x=-throwing*.65;r.legL.rotation.x=throwing*.7;r.hip.rotation.y=throwing*.22;}
 if(catcher){r.hip.position.y-=.22;r.legL.rotation.x=-.4;r.legR.rotation.x=-.4;r.armL.rotation.x=-.8;}
}
