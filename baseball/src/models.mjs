import * as T from 'three';
import{GLTFLoader}from'three/addons/loaders/GLTFLoader.js';
import{drawLogoContained}from'./logos.mjs';import{toonMaterial}from'./toon.mjs';
// studio/public/chars의 블렌더 캐릭터를 그대로 씁니다 (한 팀 = 한 동물).
import CAT from'../../public/chars/cat.js';import LION from'../../public/chars/lion.js';
const SOURCES={cat:CAT,lion:LION};const loaded={};
// studio 집 페이지의 캐릭터 재질과 같은 3단 명암
const charGrad=new T.DataTexture(new Uint8Array([195,232,255]),3,1,T.RedFormat);charGrad.minFilter=charGrad.magFilter=T.NearestFilter;charGrad.needsUpdate=true;
export async function loadCharacters(){await Promise.all(Object.entries(SOURCES).map(([kind,b64])=>loaded[kind]??new Promise((ok,no)=>{const bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)).buffer;new GLTFLoader().parse(bin,'',g=>{loaded[kind]=g.scene;ok();},no);})));}
const textCache=new Map();
export function labelTexture(text,color='#26382f',bg='#fff9e9'){const key=text+color+bg;if(textCache.has(key))return textCache.get(key);const c=document.createElement('canvas');c.width=256;c.height=80;const x=c.getContext('2d');x.fillStyle=bg;x.beginPath();x.roundRect(0,0,256,80,18);x.fill();x.fillStyle=color;x.textAlign='center';x.textBaseline='middle';x.font='600 34px "Malgun Gothic",sans-serif';x.fillText(text,128,41,230);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;textCache.set(key,texture);return texture;}
const KIT={KT:'#2b2b33',SS:'#3677d3'};
const patchTextures=new Map();function patchTexture(team){if(!patchTextures.has(team)){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');if(team==='SS'){x.fillStyle='#fffaf2';x.beginPath();x.roundRect(3,40,250,176,40);x.fill();}drawLogoContained(x,team,8,8,240,240);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;patchTextures.set(team,t);}return patchTextures.get(team);}
function numberTexture(text){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#f7f3e9';x.font='bold 78px Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(text,64,68,120);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
function decal(map,size){return new T.Mesh(new T.PlaneGeometry(size,size),new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-4}));}
function rod(parent,color,len,r){const m=new T.Mesh(new T.CylinderGeometry(r,r*.7,len,12),toonMaterial(color));m.position.y=len/2;m.castShadow=true;parent.add(m);return m;}
export function buildAnimal(kind,team='KT',number=''){const src=loaded[kind]??loaded.cat;const model=src.clone(true);
 model.traverse(o=>{if(o.isMesh){const map=o.material.map,vc=!!o.geometry.attributes.color;o.material=new T.MeshToonMaterial(map?{map,gradientMap:charGrad,emissive:0x161412}:vc?{vertexColors:true,gradientMap:charGrad,emissive:0x161412}:{color:o.material.color.clone(),gradientMap:charGrad,emissive:0x161412});o.castShadow=true;o.receiveShadow=true;}});
 // 유니폼: 몸통을 팀 색으로, 가슴에 구단 로고, 등에 등번호
 const bodyGeo=model.getObjectByName('body_geo');if(bodyGeo){bodyGeo.material=new T.MeshToonMaterial({color:KIT[team],gradientMap:charGrad});model.updateMatrixWorld(true);bodyGeo.geometry.computeBoundingBox();const bb=bodyGeo.geometry.boundingBox,cy=bb.min.y+(bb.max.y-bb.min.y)*.55;
  const front=(dir)=>{const o=bodyGeo.localToWorld(new T.Vector3(0,cy,0));o.z=dir*3;const hit=new T.Raycaster(o,new T.Vector3(0,0,-dir)).intersectObject(bodyGeo,false)[0];return hit?bodyGeo.worldToLocal(hit.point.clone()).z:dir>0?bb.max.z:bb.min.z;};
  const logo=decal(patchTexture(team),.17);logo.position.set(0,cy,front(1)+.012);bodyGeo.add(logo);
  if(number){const back=decal(numberTexture(String(number)),.15);back.position.set(0,cy,front(-1)-.012);back.rotation.y=Math.PI;bodyGeo.add(back);}}
 const root=new T.Group();root.name=kind;root.add(model);
 const J=n=>model.getObjectByName(n);const hip=J('hip'),armL=J('armL'),armR=J('armR');
 const bat=new T.Group();bat.name='bat';bat.position.set(0,-.08,.03);armR.add(bat);rod(bat,'#c59a60',.42,.022);bat.visible=false;
 const glove=new T.Group();glove.name='glove';glove.position.set(0,-.09,.04);armL.add(glove);const g=new T.Mesh(new T.SphereGeometry(.065,16,12),toonMaterial('#ae794b'));g.scale.set(1,.95,.6);g.castShadow=true;glove.add(g);
 root.userData={kind,team,rig:{hip,hipRest:hip.position.y,head:J('head'),armL,armR,legL:J('legL'),legR:J('legR'),tail:J('tail'),bat,glove},height:.95};
 return root;
}
export function poseAnimal(model,{time=0,run=0,throwing=0,swing=0,catcher=false,batter=false}={}){const r=model.userData.rig;const step=Math.sin(time*14);r.hip.position.y=r.hipRest+(run?Math.abs(step)*.018:Math.sin(time*2.7)*.003);r.head.rotation.z=run?step*.035:0;r.legL.rotation.x=run?step*.58:0;r.legR.rotation.x=run?-step*.58:0;r.armL.rotation.x=run?-step*.55:0;r.armR.rotation.x=run?step*.55:0;r.armL.rotation.z=.08;r.armR.rotation.z=-.08;r.hip.rotation.y=0;r.bat.visible=batter;r.glove.visible=!batter;
 if(batter){r.armR.rotation.x=-1.1;r.armR.rotation.z=-.55;r.armL.rotation.x=-.7;r.armL.rotation.z=.65;r.bat.rotation.z=-.3;if(swing>0){const f=Math.sin(swing*Math.PI);r.hip.rotation.y=-f*1.5;r.armR.rotation.x=-.5-f*.8;r.armR.rotation.z=-.3-f*1.1;r.armL.rotation.z=.4+f*.6;}}
 if(throwing>0){r.armR.rotation.x=-throwing*2.9;r.armL.rotation.x=-throwing*.65;r.legL.rotation.x=throwing*.7;r.hip.rotation.y=throwing*.22;}
 if(catcher){r.hip.position.y-=.055;r.legL.rotation.x=-.4;r.legR.rotation.x=-.4;r.armL.rotation.x=-.8;}
}
