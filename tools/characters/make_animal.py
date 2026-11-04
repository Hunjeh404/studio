# python3 make_animal.py <kind> <info.json> <tex.jpg> <out.glb>
import sys, json, math, bpy, bmesh
from mathutils import Matrix, Vector, Euler
KIND, INFO, TEX, OUT = sys.argv[-4:]
info = json.load(open(INFO))
# 좌표: 블렌더 앞 = -Y, 위 = Z, 캐릭터 오른쪽 = -X. (중심, 반지름, 회전)
SPECS = {
 'eagle': dict(
  joints=dict(hip=(0,0,.14), head=(0,0,.38), armL=(.2,-.02,.33), armR=(-.2,-.02,.33), legL=(.1,-.03,.1), legR=(-.1,-.03,.1), tail=(0,.2,.15)),
  parts=dict(
   head=[((0,-.045,.675),(.31,.30,.285)), ((0,-.37,.60),(.05,.07,.035),(.25,0,0))],
   body=[((0,-.04,.235),(.215,.215,.18))],
   armL=[((.275,-.02,.27),(.065,.08,.12),(0,0,.45))], armR=[((-.275,-.02,.27),(.065,.08,.12),(0,0,-.45))],
   legL=[((.1,-.08,.03),(.075,.1,.035))], legR=[((-.1,-.08,.03),(.075,.1,.035))],
   tail=[((0,.215,.16),(.1,.1,.035),(-.45,0,0))])),
 'dino': dict(
  joints=dict(hip=(0,0,.14), head=(0,0,.40), armL=(.21,-.04,.33), armR=(-.21,-.04,.33), legL=(.11,-.03,.1), legR=(-.11,-.03,.1), tail=(0,.2,.15)),
  parts=dict(
   head=[((0,-.085,.68),(.29,.29,.27)), ((0,-.30,.60),(.14,.10,.085))],
   body=[((0,-.035,.235),(.22,.25,.19))],
   armL=[((.27,-.05,.27),(.06,.065,.1),(0,0,.4))], armR=[((-.27,-.05,.27),(.06,.065,.1),(0,0,-.4))],
   legL=[((.11,-.05,.05),(.08,.1,.06))], legR=[((-.11,-.05,.05),(.08,.1,.06))],
   tail=[((.02*i/6*4, .18+.035*i, .19-.017*i),(.09-.009*i,)*3) for i in range(7)])),
 'seagull': dict(
  joints=dict(hip=(0,0,.14), head=(0,0,.42), armL=(.21,0,.35), armR=(-.21,0,.35), legL=(.1,-.03,.1), legR=(-.1,-.03,.1), tail=(0,.25,.2)),
  parts=dict(
   head=[((0,-.06,.70),(.30,.29,.265)), ((0,-.385,.62),(.045,.07,.032),(.2,0,0))],
   body=[((0,-.05,.25),(.23,.25,.20))],
   armL=[((.29,0,.29),(.07,.1,.13),(0,0,.45))], armR=[((-.29,0,.29),(.07,.1,.13),(0,0,-.45))],
   legL=[((.11,-.1,.025),(.08,.11,.03))], legR=[((-.11,-.1,.025),(.08,.11,.03))],
   tail=[((0,.255,.17),(.07,.075,.045),(-.4,0,0))])),
}
S = SPECS[KIND]
bpy.ops.wm.read_factory_settings(use_empty=True)
img = bpy.data.images.load(TEX); TW, TH = img.size
mat = bpy.data.materials.new(KIND+'_tex'); mat.use_nodes = True
nt = mat.node_tree; bsdf = nt.nodes['Principled BSDF']; tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = img
nt.links.new(tn.outputs['Color'], bsdf.inputs['Base Color']); bsdf.inputs['Roughness'].default_value = 1

def make_empty(name, loc, parent=None):
    e = bpy.data.objects.new(name, None); bpy.context.scene.collection.objects.link(e); e.location = loc
    if parent:
        bpy.context.view_layer.update(); e.parent = parent; e.matrix_parent_inverse = parent.matrix_world.inverted()
    return e
root = make_empty('root', (0,0,0))
J = {}
J['hip'] = make_empty('hip', S['joints']['hip'], root)
for n in ['legL','legR']: J[n] = make_empty(n, S['joints'][n], root)
for n in ['head','armL','armR','tail']: J[n] = make_empty(n, S['joints'][n], J['hip'])
J['body'] = make_empty('body', (0,0,.05+S['joints']['hip'][2]*0), J['hip'])

# 모델 높이(부위 제외) -> 그림 스케일
top = max(c[2]+r[2] for c,r,*_ in S['parts']['head'])
Hm = top; s = info['front']['H'] / Hm

def uv_for(p, n, part):
    x,y,z = p
    if part == 'tail' or (abs(n.x) > abs(n.y)*1.1 and n.z <= .72): v = info['side']; u = v['off'] + v['cu'] + y*s; vv = v['bot'] - z*s
    elif n.z > .72: v = info['top']; k = v['k']; u = v['off'] + v['cu'] - x*s*k; vv = v['cy'] + y*s*k
    elif n.y < 0: v = info['front']; u = v['off'] + v['cu'] + x*s; vv = v['bot'] - z*s
    else: v = info['back']; u = v['off'] + v['cu'] - x*s; vv = v['bot'] - z*s
    return (u/TW, 1 - vv/TH)

for part, spheres in S['parts'].items():
    jl = Vector(J[part].matrix_world.translation) if part in J else Vector((0,0,0))
    bpy.context.view_layer.update(); jl = J[part].matrix_world.translation.copy()
    bm = bmesh.new()
    for sp in spheres:
        c, r = sp[0], sp[1]; rot = sp[2] if len(sp) > 2 else (0,0,0)
        if len(r) == 1: r = r*3
        tmp = bmesh.new(); bmesh.ops.create_uvsphere(tmp, u_segments=28, v_segments=18, radius=1)
        M = Matrix.Translation(Vector(c)) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal(Vector((*r,1)))
        bmesh.ops.transform(tmp, matrix=M, verts=tmp.verts)
        me = bpy.data.meshes.new('t'); tmp.to_mesh(me); tmp.free(); bm.from_mesh(me); bpy.data.meshes.remove(me)
    bm.normal_update()
    uvl = bm.loops.layers.uv.new('UVMap')
    for f in bm.faces:
        n = f.normal
        for lp in f.loops: lp[uvl].uv = uv_for(lp.vert.co, n, part)
    bmesh.ops.translate(bm, vec=-jl, verts=bm.verts)   # 관절 기준 좌표로
    me = bpy.data.meshes.new(part+'_geo'); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    me.materials.append(mat)
    ob = bpy.data.objects.new(part+'_geo', me); bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.update(); ob.parent = J[part]; ob.matrix_parent_inverse = Matrix.Identity(4); ob.location = (0,0,0)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_texcoords=True, export_normals=True, export_vertex_color='NONE', export_image_format='JPEG', export_yup=True, export_apply=True)
print('ok', KIND, 'Hm', Hm, 's', s)
