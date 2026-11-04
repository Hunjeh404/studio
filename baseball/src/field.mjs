// Keep one physical scale for the diamond, outfield, stands and camera geometry.
export const UNITS_PER_METRE=Math.hypot(13,13)/27.4318;
export const DIMENSIONS={baseline:27.4318,pitching:18.4404,left:98,center:120,right:98};
export const BASES={0:{x:0,z:0},1:{x:-13,z:13},2:{x:0,z:26},3:{x:13,z:13},4:{x:0,z:0}};
export function outfieldRadius(angle){return(98+22*Math.cos(Math.min(Math.PI/4,Math.abs(angle))*2))*UNITS_PER_METRE;}
export const FENCE=Array.from({length:65},(_,i)=>{const a=-Math.PI/4+i*Math.PI/128,r=outfieldRadius(a);return{x:Math.sin(a)*r,z:Math.cos(a)*r};});
// Foul-ground outline is an illustration estimate; the official fence distances set its scale.
export const FIELD_OUTLINE=[{x:0,z:-12},{x:-10,z:-8},{x:-20,z:4},{x:-39,z:27},{x:-49,z:44},...FENCE,{x:49,z:44},{x:39,z:27},{x:20,z:4},{x:10,z:-8}];
export const BOARD_Z=outfieldRadius(0)+10;
export const HANG_Z=BOARD_Z-1.7;
export const FIELD={1:{x:0,z:DIMENSIONS.pitching*UNITS_PER_METRE},2:{x:0,z:-2.4},3:{x:-15.4,z:15},4:{x:-6.5,z:22},5:{x:15.4,z:15},6:{x:6.5,z:22},7:{x:32,z:51},8:{x:0,z:67},9:{x:-32,z:51}};
// 포수석: 홈 뒤 관중석에서 포수가 화면 아래 가운데, 전광판이 위 가운데에 오도록 (화각 고정). 나머지 고정 시점은 투수석과 타자석의 가운데를 바라보며 시작합니다.
const MID=[0,1.6,DIMENSIONS.pitching*UNITS_PER_METRE/2];
export const CAMERA_PRESETS={catcher:{p:[0,11,-18],t:[0,0,20.6],fov:45,fixedFov:true},first:{p:[-29,17,8],t:MID,fov:43},second:{p:[0,22,39],t:MID,fov:46},third:{p:[29,17,8],t:MID,fov:43},scoreboard:{p:[0,21,BOARD_Z-4],t:MID,fov:48},ball:{p:[-8,10,-9],t:[0,2,11],fov:46}};
