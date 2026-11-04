import * as T from 'three';
import{GLTFLoader}from'three/addons/loaders/GLTFLoader.js';
import{drawLogoContained}from'./logos.mjs';import{toonMaterial}from'./toon.mjs';
// studio/public/chars의 블렌더 캐릭터를 그대로 씁니다 (한 팀 = 한 동물).
import CAT from'../../public/chars/cat.js';import LION from'../../public/chars/lion.js';
const SOURCES={cat:CAT,lion:LION};const loaded={};
// studio 집 페이지의 캐릭터 재질과 같은 3단 명암
const charGrad=new T.DataTexture(new Uint8Array([195,232,255]),3,1,T.RedFormat);charGrad.minFilter=charGrad.magFilter=T.NearestFilter;charGrad.needsUpdate=true;
export async function loadCharacters(){await Promise.all(Object.entries(SOURCES).map(([kind,b64])=>loaded[kind]??new Promise((ok,no)=>{const bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)).buffer;new GLTFLoader().parse(bin,'',g=>{loaded[kind]=g.scene;g.scene.userData.cap=trimForCap(g.scene,CAP_CUT[kind]);ok();},no);})));}
// 모자: 눈 위로 머리(귀·갈기 포함)를 잘라내고 그 자리를 모자로 덮어, 귀나 갈기가 모자를 뚫고 나오지 않게 합니다.
const CAP_CUT={cat:.33,lion:.32};
function trimForCap(scene,cut){const head=scene.getObjectByName('head');let rx=0,zMin=9,zMax=-9;
 for(const o of head.children){if(!o.isMesh||!/head_geo|mane_geo/.test(o.name))continue;const g=o.geometry;const p=g.attributes.position,idx=g.index.array,keep=[];
  for(let i=0;i<p.count;i++){const y=p.getY(i);if(y>cut-.02&&y<cut+.06){rx=Math.max(rx,Math.abs(p.getX(i)));zMin=Math.min(zMin,p.getZ(i));zMax=Math.max(zMax,p.getZ(i));}}
  for(let i=0;i<idx.length;i+=3){const cy=(p.getY(idx[i])+p.getY(idx[i+1])+p.getY(idx[i+2]))/3;if(cy<=cut)keep.push(idx[i],idx[i+1],idx[i+2]);}
  g.setIndex(keep);}
 return{cut,rx:rx+.025,rz:(zMax-zMin)/2+.025,cz:(zMax+zMin)/2};}
const CAP={KT:{crown:'#2b2b33',brim:'#232329',button:'#d6232f'},SS:{crown:'#3677d3',brim:'#2c63b5',button:'#f5f7f9'}};
function addCap(head,team,{cut,rx,rz,cz}){const cap=new T.Group();cap.name='cap';head.add(cap);const H=Math.min(rx,rz)*.9;
 const crown=new T.Mesh(new T.SphereGeometry(1,32,14,0,Math.PI*2,0,Math.PI/2),new T.MeshToonMaterial({color:CAP[team].crown,gradientMap:charGrad,side:T.DoubleSide}));crown.scale.set(rx,H,rz);crown.position.set(0,cut-.012,cz);crown.castShadow=true;cap.add(crown);
 const brim=new T.Mesh(new T.CylinderGeometry(1,1,1,28,1,false,-Math.PI/2,Math.PI),new T.MeshToonMaterial({color:CAP[team].brim,gradientMap:charGrad}));brim.scale.set(rx,.03,rz+.16);brim.position.set(0,cut-.012,cz);const band=new T.Mesh(new T.CylinderGeometry(1,1,1,40,1,true),new T.MeshToonMaterial({color:CAP[team].crown,gradientMap:charGrad,side:T.DoubleSide}));band.scale.set(rx,.032,rz);band.position.set(0,cut-.012,cz);cap.add(band);brim.castShadow=true;cap.add(brim);
 const button=new T.Mesh(new T.SphereGeometry(.022,12,8),new T.MeshToonMaterial({color:CAP[team].button,gradientMap:charGrad}));button.position.set(0,cut-.012+H,cz);cap.add(button);
 const a=.62,logo=decal(patchTexture(team),Math.min(.17,rx*.5));logo.position.set(0,cut-.012+H*Math.sin(a)+.006,cz+rz*Math.cos(a)+.006);logo.rotation.x=-a*.9;cap.add(logo);return cap;}
const textCache=new Map();
export function labelTexture(text,color='#26382f',bg='#fff9e9'){const key=text+color+bg;if(textCache.has(key))return textCache.get(key);const c=document.createElement('canvas');c.width=256;c.height=80;const x=c.getContext('2d');x.fillStyle=bg;x.beginPath();x.roundRect(0,0,256,80,18);x.fill();x.fillStyle=color;x.textAlign='center';x.textBaseline='middle';x.font='600 34px "Malgun Gothic",sans-serif';x.fillText(text,128,41,230);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;textCache.set(key,texture);return texture;}
const KIT={KT:'#2b2b33',SS:'#3677d3'};
const patchTextures=new Map();function patchTexture(team){if(!patchTextures.has(team)){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');if(team==='SS'){x.fillStyle='#fffaf2';x.beginPath();x.roundRect(3,40,250,176,40);x.fill();}drawLogoContained(x,team,8,8,240,240);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;patchTextures.set(team,t);}return patchTextures.get(team);}
function numberTexture(text){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#f7f3e9';x.font='bold 78px Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(text,64,68,120);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
function decal(map,size){return new T.Mesh(new T.PlaneGeometry(size,size),new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-4}));}
function rod(parent,color,len,r){const m=new T.Mesh(new T.CylinderGeometry(r,r*.7,len,12),toonMaterial(color));m.position.y=len/2;m.castShadow=true;parent.add(m);return m;}
// 방망이 (손잡이가 원점, +Y 방향으로 뻗음). 타자 손과 던진 방망이가 같은 모양을 씁니다.
export function makeBat(){const g=new T.Group();g.name='bat';rod(g,'#c59a60',.5,.024);const knob=new T.Mesh(new T.SphereGeometry(.02,10,8),toonMaterial('#7a5434'));g.add(knob);return g;}
export function buildAnimal(kind,team='KT',number=''){const src=loaded[kind]??loaded.cat;const model=src.clone(true);
 model.traverse(o=>{if(o.isMesh){const map=o.material.map,vc=!!o.geometry.attributes.color;o.material=new T.MeshToonMaterial(map?{map,gradientMap:charGrad,emissive:0x161412}:vc?{vertexColors:true,gradientMap:charGrad,emissive:0x161412}:{color:o.material.color.clone(),gradientMap:charGrad,emissive:0x161412});o.castShadow=true;o.receiveShadow=true;}});
 // 유니폼: 몸통을 팀 색으로, 가슴에 구단 로고, 등에 등번호
 const bodyGeo=model.getObjectByName('body_geo');if(bodyGeo){bodyGeo.material=new T.MeshToonMaterial({color:KIT[team],gradientMap:charGrad});model.updateMatrixWorld(true);bodyGeo.geometry.computeBoundingBox();const bb=bodyGeo.geometry.boundingBox,cy=bb.min.y+(bb.max.y-bb.min.y)*.55;
  const front=(dir)=>{const o=bodyGeo.localToWorld(new T.Vector3(0,cy,0));o.z=dir*3;const hit=new T.Raycaster(o,new T.Vector3(0,0,-dir)).intersectObject(bodyGeo,false)[0];return hit?bodyGeo.worldToLocal(hit.point.clone()).z:dir>0?bb.max.z:bb.min.z;};
  const logo=decal(patchTexture(team),.17);logo.position.set(0,cy,front(1)+.012);bodyGeo.add(logo);
  if(number){const back=decal(numberTexture(String(number)),.15);back.position.set(0,cy,front(-1)-.012);back.rotation.y=Math.PI;bodyGeo.add(back);}}
 const root=new T.Group();root.name=kind;root.add(model);
 const J=n=>model.getObjectByName(n);const hip=J('hip'),armL=J('armL'),armR=J('armR');addCap(J('head'),team,src.userData.cap);
 const bat=makeBat();bat.position.set(-.47,.1,.12);hip.add(bat);bat.visible=false;
 const glove=new T.Group();glove.name='glove';glove.position.set(0,-.09,.04);armL.add(glove);const g=new T.Mesh(new T.SphereGeometry(.065,16,12),toonMaterial('#ae794b'));g.scale.set(1,.95,.6);g.castShadow=true;glove.add(g);
 root.userData={kind,team,rig:{hip,hipRest:hip.position.y,head:J('head'),armL,armR,legL:J('legL'),legR:J('legR'),tail:J('tail'),bat,glove},height:.95};
 return root;
}
export function poseAnimal(model,{time=0,run=0,throwing=0,swing=0,catcher=false,batter=false}={}){const r=model.userData.rig;const step=Math.sin(time*14);r.hip.position.y=r.hipRest+(run?Math.abs(step)*.018:Math.sin(time*2.7)*.003);r.head.rotation.z=run?step*.035:0;r.legL.rotation.x=run?step*.58:0;r.legR.rotation.x=run?-step*.58:0;r.armL.rotation.x=run?-step*.55:0;r.armR.rotation.x=run?step*.55:0;r.armL.rotation.z=.08;r.armR.rotation.z=-.08;r.hip.rotation.y=0;r.bat.visible=batter;r.glove.visible=!batter;
 if(batter){r.armR.rotation.x=-1.1;r.armR.rotation.z=-.55;r.armL.rotation.x=-.7;r.armL.rotation.z=.65;r.bat.rotation.set(-.35,0,.35);if(swing>0){const f=Math.sin(swing*Math.PI);r.hip.rotation.y=-f*1.5;r.armR.rotation.x=-.5-f*.8;r.armR.rotation.z=-.3-f*1.1;r.armL.rotation.z=.4+f*.6;r.bat.rotation.set(-.35+f*2.0,0,.35-f*.25);}}
 if(throwing>0){r.armR.rotation.x=-throwing*2.9;r.armL.rotation.x=-throwing*.65;r.legL.rotation.x=throwing*.7;r.hip.rotation.y=throwing*.22;}
 if(catcher){r.hip.position.y-=.055;r.legL.rotation.x=-.4;r.legR.rotation.x=-.4;r.armL.rotation.x=-.8;}
}
