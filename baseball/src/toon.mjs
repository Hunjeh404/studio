import * as T from'three';
const gradient=new T.DataTexture(new Uint8Array([155,212,255]),3,1,T.RedFormat);gradient.minFilter=T.NearestFilter;gradient.magFilter=T.NearestFilter;gradient.generateMipmaps=false;gradient.needsUpdate=true;
const palette=new Map();
export function toonMaterial(color){if(!palette.has(color)){const m=new T.MeshToonMaterial({color,gradientMap:gradient,toneMapped:false});m.userData.cel=true;palette.set(color,m);}return palette.get(color);}
export const INK='#3a3540';
export function addToonOutlines(model){const source=[];model.traverse(o=>{if(o.isMesh&&o.userData.outlineEligible)source.push(o);});for(const parent of source){const ink=new T.Mesh(parent.geometry,new T.MeshBasicMaterial({color:INK,side:T.BackSide,depthWrite:false,toneMapped:false}));ink.name='toon_outline';ink.scale.setScalar(1.022);ink.userData.renderOnly=true;ink.renderOrder=-1;parent.add(ink);}}
