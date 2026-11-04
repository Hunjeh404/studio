import{trajectoryPoint}from'./engine.mjs';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const wrapAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
// One world-space ball target drives every player's gaze, regardless of camera.
export function ballTarget(scene,u,plan){
 if(scene.kind!=='pitch'||u<=.09)return{x:0,y:2.1,z:12};
 if(u<.35){const p=trajectoryPoint(scene.pitch?.trajectory,clamp((u-.09)/.26,0,1));return{x:-p.x*.32,y:Math.max(.12,p.z*.4),z:p.y*.24};}
 if(plan){const f=clamp((u-.35)/.28,0,1);if(u<.63)return{x:plan.point.x*f,y:1+Math.sin(f*Math.PI)*(plan.homeRun?15:plan.high?8:plan.pos>=7?5:.8),z:plan.point.z*f};
  if(plan.throws.length){const chain=[plan.point,...plan.throws.map(x=>x.point)],q=clamp((u-.63)/.26,0,1)*(chain.length-1),j=Math.min(chain.length-2,Math.floor(q)),t=q-j;return{x:chain[j].x+(chain[j+1].x-chain[j].x)*t,y:1.4+Math.sin(t*Math.PI)*.8,z:chain[j].z+(chain[j+1].z-chain[j].z)*t};}
  return{x:plan.point.x,y:plan.homeRun?Math.max(.2,1-(u-.63)*9):1.5,z:plan.point.z};
 }
 if(scene.moves?.some(m=>m.out)&&u>.4){const f=clamp((u-.4)/.3,0,1);return{x:0,y:1+Math.sin(f*Math.PI)*2,z:26*f};}
 if(scene.moves?.some(m=>/폭투/.test(m.text))){const f=clamp((u-.35)/.25,0,1);return{x:3*f,y:.25,z:-2*f};}
 return{x:0,y:1.1,z:0};
}
export function gazePose(position,target,{catcher=false,pitcher=false,run=false,angle}={}){
 const dx=target.x-position.x,dz=target.z-position.z,flat=Math.hypot(dx,dz),targetYaw=flat>.12?Math.atan2(dx,dz):(angle??0);
 // The catcher always sets up toward the mound; runners keep their travel heading.
 const bodyYaw=catcher?0:pitcher?Math.PI:run&&Number.isFinite(angle)?angle:targetYaw;
 return{bodyYaw,headYaw:clamp(wrapAngle(targetYaw-bodyYaw),-1.05,1.05),headPitch:clamp(-Math.atan2(target.y-(catcher?1.75:2.05),Math.max(1,flat)),-.48,.42)};
}
