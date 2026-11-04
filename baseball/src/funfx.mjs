import * as T from'three';import{activeEffects,effectProgress}from'./effects.mjs';
const clamp=x=>Math.max(0,Math.min(1,x));
function starTexture(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const glow=x.createRadialGradient(64,64,4,64,64,63);glow.addColorStop(0,'#fff9ce');glow.addColorStop(.25,'#ffe38988');glow.addColorStop(1,'#ffe38900');x.fillStyle=glow;x.fillRect(0,0,128,128);x.beginPath();for(let i=0;i<10;i++){const r=i%2?14:41,a=-Math.PI/2+i*Math.PI/5;const px=64+Math.cos(a)*r,py=64+Math.sin(a)*r;i?x.lineTo(px,py):x.moveTo(px,py);}x.closePath();x.fillStyle='#fff5b6';x.fill();x.strokeStyle='#eebc45';x.lineWidth=3;x.stroke();const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
function cylinder(scene,color,r){const m=new T.Mesh(new T.CylinderGeometry(r,r,1,6),new T.MeshBasicMaterial({color,toneMapped:false}));scene.add(m);return m;}
function segment(m,a,b){const d=new T.Vector3().subVectors(b,a);m.position.copy(a).add(b).multiplyScalar(.5);m.scale.y=d.length();m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());}
function hitPoint(plan,t){return new T.Vector3(plan.point.x*t,1+Math.sin(t*Math.PI)*(plan.homeRun?15:plan.high?8:plan.pos>=7?5:.8),plan.point.z*t);}
export class FunFxLayer{
 constructor(scene){this.group=new T.Group();this.group.userData.softwareLayer=4;scene.add(this.group);this.enabled=true;const map=starTexture();this.stars=Array.from({length:64},()=>{const m=new T.Sprite(new T.SpriteMaterial({map,transparent:true,depthWrite:false,toneMapped:false}));m.renderOrder=8;this.group.add(m);return m;});this.lines=Array.from({length:16},()=>cylinder(this.group,'#ffe39b',.055));this.boltOuter=Array.from({length:9},()=>cylinder(this.group,'#f7c94e',.15));this.boltCore=Array.from({length:9},()=>cylinder(this.group,'#fff8c6',.067));this.cloud=new T.Group();this.group.add(this.cloud);for(const [x,y,z,r]of[[-1,.1,0,1.25],[.1,.5,0,1.5],[1.5,.05,.2,1.1]]){const m=new T.Mesh(new T.SphereGeometry(r,12,8),new T.MeshBasicMaterial({color:'#6b738b',toneMapped:false}));m.position.set(x,y,z);m.scale.y=.62;this.cloud.add(m);}this.status='';}
 update(play,u,actors,plan,camera,height){for(const s of this.stars)s.visible=false;for(const l of[...this.lines,...this.boltOuter,...this.boltCore])l.visible=false;this.cloud.visible=false;this.status='';if(!this.enabled){const status=document.getElementById('fxStatus');if(status)status.hidden=true;return;}const active=activeEffects(play,u);let starCount=0;
 const star=(p,size,alpha=1,rotation=0)=>{if(starCount>=this.stars.length)return;const m=this.stars[starCount++];m.visible=true;m.position.copy(p);m.scale.setScalar(size);m.material.opacity=alpha;m.material.rotation=rotation;};
 for(const fx of active){const t=effectProgress(fx,u);
  if(fx.kind==='star_trail'&&plan){const end=clamp((u-.35)/.28);const tail=Math.max(0,end-.33);for(let i=0;i<15;i++){const q=i/14,a=tail+(end-tail)*q,p=hitPoint(plan,a);p.x+=Math.sin(i*3.1+u*29)*.28;p.y+=Math.sin(i*2.9+u*21)*.25;const twinkle=.5+.5*Math.sin(i*2.2+u*65);star(p,.55+q*1.0+twinkle*.35,(.12+.75*q)*Math.min(1,(fx.end-u)*7),u*6+i*.6);}
   for(let i=0;i<16;i++){const a=tail+(end-tail)*i/16,b=tail+(end-tail)*(i+1)/16;const line=this.lines[i];line.visible=true;segment(line,hitPoint(plan,a),hitPoint(plan,b));}this.status=fx.label;
  }
  if(fx.kind==='home_run_burst'&&plan){const origin=hitPoint(plan,Math.min(1,(u-.35)/.28));for(let i=0;i<20;i++){const a=i/20*Math.PI*2,r=(1+t*7)*(i%2?.9:1.2),p=new T.Vector3(origin.x+Math.cos(a)*r,origin.y+Math.sin(a)*r*.8,origin.z+Math.sin(a*2)*r*.3);star(p,.7*(1-t)+.25,1-t*.8,i+u*3);}this.status='★ 홈런! 별빛 폭죽!';}
  if(fx.kind==='lightning'){
   const actor=actors.get(fx.targetKey);if(!actor?.group.visible)continue;const p=actor.group.position;this.cloud.visible=true;this.cloud.position.set(p.x,22,p.z);const attack=Math.sin(Math.min(1,t/.35)*Math.PI/2);const endY=22-(22-3)*attack;const nodes=[];for(let i=0;i<=9;i++){const f=i/9;nodes.push(new T.Vector3(p.x+(i===0||i===9?0:Math.sin(i*7.13)*.7),22-(22-endY)*f,p.z+Math.sin(i*4.7)*.18));}
   for(let i=0;i<9;i++){this.boltOuter[i].visible=t<.72;this.boltCore[i].visible=t<.72;segment(this.boltOuter[i],nodes[i],nodes[i+1]);segment(this.boltCore[i],nodes[i],nodes[i+1]);}
   if(t>.28){const shake=Math.sin(t*34)*.11*(1-t);actor.group.position.x+=shake;actor.model.userData.rig.head.rotation.z+=Math.sin(t*29)*.19;for(let i=0;i<6;i++){const a=i/6*Math.PI*2+t*4;star(new T.Vector3(p.x+Math.cos(a)*1.2,3.35+Math.sin(a)*.25,p.z+Math.sin(a)*1.2),.54,1-t*.4,a);}}this.status=fx.targetKey.split(':')[1]+' · '+fx.label;
  }
  if(fx.kind==='speed_lines'){const actor=actors.get(fx.targetKey);if(actor?.group.visible){const p=actor.group.position;for(let i=0;i<5;i++)star(new T.Vector3(p.x+Math.sin(i)*.5,.4+i*.22,p.z+i*.55),.5,1-t*.3);this.status=fx.label;}}
  if(fx.kind==='double_play')this.status=fx.label;
 }
 const status=document.getElementById('fxStatus');if(status){status.textContent=this.status;status.hidden=!this.status;}
 }
}
