const clamp=x=>Math.max(0,Math.min(1,x));
const beats=[[0,0],[2.6,.26],[6.2,.40],[11.2,.67],[18,1]];
export function playbackProgress(scene,seconds){if(!scene.homeRun)return clamp(seconds/scene.duration);for(let i=1;i<beats.length;i++)if(seconds<=beats[i][0]){const[a,u]=beats[i-1],[b,v]=beats[i];return u+(v-u)*clamp((seconds-a)/(b-a));}return 1;}
export function clockAtProgress(scene,u){u=clamp(u);if(!scene.homeRun)return u*scene.duration;for(let i=1;i<beats.length;i++)if(u<=beats[i][1]){const[a,v]=beats[i-1],[b,w]=beats[i];return a+(b-a)*(u-v)/(w-v);}return 18;}
export function homeRunShot(scene,u){if(!scene.homeRun||u<.24)return null;if(u<.40)return'closeup';if(u<.67)return'flight';return'runners';}
export function runnerProgress(scene,u){return clamp(scene.homeRun?(u-.67)/.33:(u-.36)/.58);}
