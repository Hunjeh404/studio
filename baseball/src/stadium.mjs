import * as T from'three';import{FIELD_OUTLINE}from'./field.mjs';import{toonMaterial}from'./toon.mjs';
const center={x:0,z:34},width=10.2,height=5.8;
function offset(p,d){const x=p.x-center.x,z=p.z-center.z,n=Math.hypot(x,z);return{x:p.x+x/n*d,z:p.z+z/n*d};}
function bandGeometry(innerOffset,innerHeight,outerOffset,outerHeight){const g=new T.BufferGeometry(),vertices=[],indices=[],count=FIELD_OUTLINE.length;for(const p of FIELD_OUTLINE){const a=offset(p,innerOffset),b=offset(p,outerOffset);vertices.push(a.x,innerHeight,a.z,b.x,outerHeight,b.z);}for(let i=0;i<count;i++){const a=i*2,b=((i+1)%count)*2;indices.push(a,b,a+1,a+1,b,b+1);}g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;}
export function addStadium(scene){const group=new T.Group();group.name='empty_grandstands';scene.add(group);
 // One smooth, unlit seating surface: no individual chair edges, step lines or alternating rows.
 const surface=new T.Mesh(bandGeometry(0,.25,width,height),toonMaterial('#c7e1d7'));surface.name='plain_seating_surface';group.add(surface);
 const wall=new T.Mesh(bandGeometry(width,-.25,width,height),toonMaterial('#a6c6b8'));wall.name='grandstand_outer_wall';group.add(wall);
 const edgePoints=[...FIELD_OUTLINE,FIELD_OUTLINE[0]].map(p=>{const q=offset(p,width);return new T.Vector3(q.x,height+.025,q.z);});const edge=new T.Line(new T.BufferGeometry().setFromPoints(edgePoints),new T.LineBasicMaterial({color:'#6f977e',toneMapped:false}));edge.name='grandstand_outer_boundary';group.add(edge);return group;
}
