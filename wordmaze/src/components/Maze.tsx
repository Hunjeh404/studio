'use client';
import {useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {SVGRenderer} from 'three/addons/renderers/SVGRenderer.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {stageData,target} from '../lib/game';
type Props={stage:number;animal:string;progress:number;view:number;onReady:(v:boolean)=>void};
export default function Maze({stage,animal,progress,view,onReady}:Props){
 const host=useRef<HTMLDivElement>(null),update=useRef<((p:number)=>void)|null>(null),progressRef=useRef(progress),readyRef=useRef(onReady);const [error,setError]=useState('');
 progressRef.current=progress;readyRef.current=onReady;
 useEffect(()=>{update.current?.(progress);},[progress]);
 useEffect(()=>{
  if(!host.current)return;let alive=true,frame=0;setError('');readyRef.current(false);
  let renderer:T.WebGLRenderer|SVGRenderer;let software=false;try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{renderer=new SVGRenderer();renderer.setQuality('high');software=true;}
  const el=host.current;el.appendChild(renderer.domElement);if(renderer instanceof T.WebGLRenderer){renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;}else renderer.setClearColor(new T.Color('#f6f3e9'),0);
  const scene=new T.Scene(),game=stageData(stage),n=game.n,spacing=1.12,half=(n-1)*spacing/2;
  const camera=new T.OrthographicCamera(-6,6,5,-5,.1,100),angle=Math.PI/4+view*Math.PI/2;
  camera.position.set(Math.cos(angle)*12,12,Math.sin(angle)*12);camera.lookAt(0,.2,0);
  if(software)scene.add(new T.AmbientLight('#fff9ec',.85));scene.add(new T.HemisphereLight(0xfffcf0,0xb2a995,2.8));const sun=new T.DirectionalLight(0xfff4dd,software?.6:3.3);sun.position.set(-5,10,7);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);sun.shadow.camera.left=-10;sun.shadow.camera.right=10;sun.shadow.camera.top=10;sun.shadow.camera.bottom=-10;sun.shadow.normalBias=.03;sun.shadow.bias=-.0001;sun.shadow.radius=4;scene.add(sun);
  const material=(color:T.ColorRepresentation)=>new T.MeshStandardMaterial({color,roughness:.92});
  const grass=material(game.theme.base),wallMat=material(game.theme.wall),pathMat=material('#f5e8cb'),dark=material('#a5977b');
  function box(w:number,h:number,d:number,mat:T.Material,x:number,y:number,z:number,r=.06){const mesh=new T.Mesh(software?new T.BoxGeometry(w,h,d):new RoundedBoxGeometry(w,h,d,2,r),mat);mesh.position.set(x,y,z);if(software)mesh.renderOrder=y<-.1?-102:y<=0?-101:h<.15?-100:0;mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);return mesh;}
  function ball(parent:T.Object3D,r:number,mat:T.Material,x=0,y=0,z=0,sx=1,sy=1,sz=1){const b=new T.Mesh(new T.SphereGeometry(r,software?9:14,software?6:10),mat);b.position.set(x,y,z);b.scale.set(sx,sy,sz);b.castShadow=true;parent.add(b);return b;}
  const size=n*spacing+.5;box(size,.42,size,material('#c1b18d'),0,-.28,0,.17);box(size+.04,.16,size+.04,grass,0,-.03,0,.1);
  const point=(cell:number)=>new T.Vector3((cell%n)*spacing-half,.1,Math.floor(cell/n)*spacing-half);
  game.cells.forEach((cell,c)=>{const p=point(c);box(1.025,.08,1.025,pathMat,p.x,.07,p.z,.04);if(cell.walls[0])box(1.18,.42,.16,wallMat,p.x,.30,p.z-spacing/2);if(cell.walls[3])box(.16,.42,1.18,wallMat,p.x-spacing/2,.30,p.z);if(c%n===n-1&&cell.walls[1])box(.16,.42,1.18,wallMat,p.x+spacing/2,.30,p.z);if(Math.floor(c/n)===n-1&&cell.walls[2])box(1.18,.42,.16,wallMat,p.x,.30,p.z+spacing/2);});
  // Low rounded hedges leave both the animal and the next target visible.
  function tree(x:number,z:number,scale=1){const g=new T.Group();g.position.set(x,.05,z);g.scale.setScalar(scale);const trunk=new T.Mesh(new T.CylinderGeometry(.07,.1,.65,8),material('#af9372'));trunk.position.y=.3;g.add(trunk);ball(g,.45,material(game.theme.leaf),0,.95,0,1,1.2,1);ball(g,.31,material('#b8caa0'),.2,1.08,-.08);g.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=true;});scene.add(g);}
  tree(-size/2-.48,-size/2+.3,.9);tree(-size/2-.58,size/2-.5,1.15);tree(size/2-.35,-size/2-.52,.8);
  for(let i=0;i<6;i++){const g=new T.Group();g.position.set(-size/2-.25+i*.2,.03,size/2+.36);ball(g,.09,material(i%2?'#e7c29d':'#e6d4b5'),0,.07,0,1,.6,1);scene.add(g);}
  const makeFruit=(id:string)=>{
   const g=new T.Group();const f=target(id,'en-GB'),mat=material(f.color),green=material('#8ca570'),brown=material('#8e7757');
   if(id==='grape'){for(let k=0;k<9;k++){const row=Math.floor(k/3);ball(g,.1,mat,(k%3-1)*.13*(1-row*.15),.31-row*.12,Math.sin(k*3)*.07);} }
   else if(id==='banana'){const curve=new T.CatmullRomCurve3([new T.Vector3(-.22,.24,0),new T.Vector3(-.08,.02,0),new T.Vector3(.14,.05,0),new T.Vector3(.27,.25,0)]);const m=new T.Mesh(new T.TubeGeometry(curve,12,.065,8,false),mat);g.add(m);}
   else if(id==='cherry'){ball(g,.13,mat,-.12,.12,0);ball(g,.13,mat,.13,.12,.03);const stem=new T.Mesh(new T.TorusGeometry(.14,.012,5,14,Math.PI),brown);stem.position.set(0,.35,0);g.add(stem);}
   else if(id==='pear'){ball(g,.19,mat,0,.16,0,1,1.05,1);ball(g,.12,mat,0,.33,0,.8,1.2,.8);}
   else if(id==='pineapple'){ball(g,.2,mat,0,.2,0,.8,1.3,.8);for(let i=0;i<5;i++){const m=new T.Mesh(new T.ConeGeometry(.055,.25,5),green);m.position.set(Math.cos(i)*.05,.47,Math.sin(i)*.05);m.rotation.z=(i-2)*.15;g.add(m);}}
   else if(id==='watermelon'||id==='melon'){ball(g,.24,mat,0,.20,0,1,.85,1);if(id==='watermelon'){for(let k=0;k<4;k++){const tor=new T.Mesh(new T.TorusGeometry(.235,.013,5,24),material('#617f64'));tor.rotation.y=k*Math.PI/4;tor.position.y=.2;g.add(tor);}}}
   else if(id==='strawberry'){const m=new T.Mesh(new T.ConeGeometry(.17,.33,14),mat);m.rotation.z=Math.PI;m.position.y=.15;g.add(m);for(let i=0;i<5;i++)ball(g,.055,green,Math.cos(i*1.26)*.08,.32,Math.sin(i*1.26)*.08,1,.35,1);}
   else {ball(g,.21,mat,0,.19,0,id==='lemon'?1.25:1,id==='peach'?.9:1,1);}
   if(!['banana','cherry','pineapple','watermelon','melon','strawberry'].includes(id)){const stem=new T.Mesh(new T.CylinderGeometry(.015,.02,.12,6),brown);stem.position.y=id==='pear'?.47:.44;g.add(stem);ball(g,.07,green,.07,stem.position.y-.03,0,1.5,.3,.7);}
   return g;
  };
  const markers=game.checkpoints.map((cp,i)=>{const p=point(cp.cell),g=new T.Group();g.position.copy(p);g.position.y=.16;const fruit=makeFruit(cp.id);
   g.add(fruit);scene.add(g);const ring=new T.Mesh(new T.TorusGeometry(.35,.023,6,36),material('#d9b768'));ring.rotation.x=-Math.PI/2;ring.position.copy(p);ring.position.y=.17;scene.add(ring);return{g,ring,fruit,index:i,baseY:g.position.y};});
  const start=point(0),end=point(n*n-1);const flagPole=new T.Mesh(new T.CylinderGeometry(.02,.02,.8,8),dark);flagPole.position.set(end.x,.51,end.z);scene.add(flagPole);const flag=new T.Mesh(new T.PlaneGeometry(.34,.22),new T.MeshStandardMaterial({color:'#dfaa68',side:T.DoubleSide}));flag.position.set(end.x+.17,.81,end.z);scene.add(flag);
  const hero=new T.Group();hero.position.copy(start);hero.position.y=.13;scene.add(hero);let joints:T.Object3D[]=[],heroReady=false,routePos=0,walkTo=0,walkIndex=1,was=0,dirty=true;
  const placeProgress=(v:number)=>{dirty=true;const targetIndex=v>=game.checkpoints.length?game.route.length-1:v===0?0:game.checkpoints[v-1].routeIndex;
   if(v<was){hero.position.copy(point(game.route[targetIndex]));hero.position.y=.13;routePos=targetIndex;walkIndex=targetIndex+1;}walkTo=targetIndex;was=v;
   markers.forEach((m,i)=>{m.g.visible=i>=v;m.ring.visible=i===v;});
  };update.current=placeProgress;placeProgress(progressRef.current);
  const modelAbort=new AbortController();fetch(`${import.meta.env.BASE_URL}chars/${animal}.js`,{signal:modelAbort.signal}).then(r=>{if(!r.ok)throw Error();return r.text();}).then(source=>{if(!alive)return;const match=source.match(/^export default ['"]([A-Za-z0-9+\/=]+)['"];?\s*$/);if(!match)throw Error();const bytes=Uint8Array.from(atob(match[1]),c=>c.charCodeAt(0));new GLTFLoader().parse(bytes.buffer,'',gltf=>{if(!alive)return;const model=gltf.scene;model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model);const height=bounds.max.y-bounds.min.y;const scale=.86/height;model.scale.setScalar(scale);model.position.y=-bounds.min.y*scale;model.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;if(software){const old=o.material as T.MeshStandardMaterial;let hasColors=!!o.geometry.attributes.color;const map=old.map;if(map?.image){try{const image=map.image;const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,image.width,image.height).data,uv=o.geometry.attributes.uv,colors=new Float32Array(uv.count*3),color=new T.Color();for(let i=0;i<uv.count;i++){const x=Math.max(0,Math.min(image.width-1,Math.floor(uv.getX(i)*image.width))),y=Math.max(0,Math.min(image.height-1,Math.floor(uv.getY(i)*image.height))),j=(y*image.width+x)*4;color.setRGB(pixels[j]/255,pixels[j+1]/255,pixels[j+2]/255,T.SRGBColorSpace);colors.set([color.r,color.g,color.b],i*3);}o.geometry.setAttribute('color',new T.BufferAttribute(colors,3));hasColors=true;}catch{}}o.material=new T.MeshLambertMaterial({color:old.color,vertexColors:hasColors,side:old.side});}}});hero.add(model);dirty=true;joints=['legL','legR','armL','armR'].map(name=>model.getObjectByName(name)).filter(Boolean) as T.Object3D[];heroReady=true;readyRef.current(true);},()=>{if(alive)setError('동물친구를 불러오지 못했습니다. 화면을 새로고침해 주세요.');});}).catch(()=>{if(alive)setError('동물친구를 불러오지 못했습니다. 화면을 새로고침해 주세요.');});
  const resize=()=>{dirty=true;const w=el.clientWidth,h=el.clientHeight;const aspect=w/h;const worldWidth=(n*spacing+1.4)*1.45;const frustum=Math.max((n*spacing+1.3)*1.16,worldWidth/aspect);camera.left=-frustum*aspect/2;camera.right=frustum*aspect/2;camera.top=frustum/2;camera.bottom=-frustum/2;camera.updateProjectionMatrix();renderer.setSize(w,h);};const observer=new ResizeObserver(resize);observer.observe(el);resize();
  const clock=new T.Clock();let lastDraw=0;function draw(){if(!alive)return;frame=requestAnimationFrame(draw);const now=performance.now();if(software&&now-lastDraw<90)return;lastDraw=now;const dt=Math.min(clock.getDelta(),software?.14:.05),time=clock.elapsedTime;let moving=false;
   if(heroReady&&routePos<walkTo){const dest=point(game.route[walkIndex]);dest.y=.13;const delta=dest.clone().sub(hero.position),distance=delta.length();hero.rotation.y=Math.atan2(delta.x,delta.z);const step=dt*3.5;moving=true;if(distance<=step){hero.position.copy(dest);routePos=walkIndex;walkIndex++;}else hero.position.addScaledVector(delta.normalize(),step);}
   joints.forEach((j,i)=>{j.rotation.x=moving?Math.sin(time*15+(i%2)*Math.PI)*.42:Math.sin(time*2)*.025;});
   if(!software)markers.forEach(m=>{if(!m.g.visible)return;m.g.position.y=m.baseY+Math.sin(time*2+m.index)*.035;m.ring.scale.setScalar(1+Math.sin(time*3)*.07);});if(!software||dirty||moving){renderer.render(scene,camera);dirty=false;}}
  draw();return()=>{alive=false;modelAbort.abort();cancelAnimationFrame(frame);observer.disconnect();update.current=null;scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{Object.values(m).forEach(v=>{if(v instanceof T.Texture)v.dispose();});m.dispose();});}});if(renderer instanceof T.WebGLRenderer){renderer.dispose();renderer.forceContextLoss();}renderer.domElement.remove();};
 },[stage,animal,view]);
 return <div className="maze-host" ref={host} role="img" aria-label={`과일 아이소메트릭 3D 미로, ${progress}개 통과`}>{error&&<div className="maze-error">{error}</div>}</div>;
}
