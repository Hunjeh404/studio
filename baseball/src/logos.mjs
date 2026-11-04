import{TEAM_LOGOS}from'./logos-data.mjs';export{TEAM_LOGOS};
const images={};export const teamLogoImage=team=>images[team];export const setTeamLogoImage=(team,image)=>{images[team]=image;};
export async function loadTeamLogos(){await Promise.all(Object.entries(TEAM_LOGOS).map(([team,src])=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[team]=im;resolve();};im.onerror=reject;im.src=src;})));}
export function drawLogoContained(ctx,team,x,y,w,h){const im=images[team];if(!im)return;const ratio=Math.min(w/im.width,h/im.height);ctx.drawImage(im,x+(w-im.width*ratio)/2,y+(h-im.height*ratio)/2,im.width*ratio,im.height*ratio);}
