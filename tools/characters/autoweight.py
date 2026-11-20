# 블렌더 자동 가중치(뼈 열 확산)로 스킨 가중치 계산. from_hunyuan.py가 --auto일 때 부름.
# 입력 npz: P(정점, y가 위), I(삼각형), J(관절 8개 위치), T(뼈 끝 위치) / 출력 npz: W(정점 x 8, 순서 root hip armL armR head tail legL legR)
# 사용: python3 autoweight.py in.npz out.npz
import sys, numpy as np, bpy, bmesh
from mathutils import Vector
from scipy.spatial import cKDTree
src, out = sys.argv[-2], sys.argv[-1]
d = np.load(src); P, I, J, T = d['P'], d['I'], d['J'], d['T']
names = ['root', 'hip', 'armL', 'armR', 'head', 'tail', 'legL', 'legR']
parent = dict(hip=None, armL='hip', armR='hip', head='hip', tail='hip', legL='hip', legR='hip')
S = 10.0  # 블렌더 열 확산은 1m 아래 작은 메시에서 실패해서 10배로 키워 계산
bl = lambda v: Vector((v[0] * S, -v[2] * S, v[1] * S))  # y가 위(glTF) → z가 위(블렌더)
bpy.ops.wm.read_factory_settings(use_empty=True)
# 이음매에서 갈라진 정점을 합친 메시로 계산 (갈라진 채로는 열 확산이 섬마다 끊김)
Pu, inv = np.unique(np.round(P, 5), axis=0, return_inverse=True); inv = inv.reshape(-1)
me = bpy.data.meshes.new('m'); me.from_pydata([tuple(bl(p)) for p in Pu], [], [tuple(inv[t]) for t in I]); me.update()
bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6); bm.to_mesh(me); bm.free()
ob = bpy.data.objects.new('m', me); bpy.context.scene.collection.objects.link(ob)
# Hunyuan 메시는 겹치고 구멍이 있어 열 확산이 실패함 → 복셀로 다시 짠 대리 메시에서 계산
rm = ob.modifiers.new('rm', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = 0.06
bpy.context.view_layer.objects.active = ob; bpy.ops.object.modifier_apply(modifier='rm'); print('proxy verts', len(me.vertices))
arm = bpy.data.armatures.new('a'); ao = bpy.data.objects.new('a', arm); bpy.context.scene.collection.objects.link(ao)
bpy.context.view_layer.objects.active = ao; bpy.ops.object.mode_set(mode='EDIT')
for k, n in enumerate(names[1:], 1):
    b = arm.edit_bones.new(n); b.head = bl(J[k]); b.tail = bl(T[k])
for n, p in parent.items():
    if p: arm.edit_bones[n].parent = arm.edit_bones[p]
bpy.ops.object.mode_set(mode='OBJECT')
for o in bpy.context.scene.objects: o.select_set(False)
ob.select_set(True); ao.select_set(True); bpy.context.view_layer.objects.active = ao
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
V = np.array([[v.co.x, v.co.z, -v.co.y] for v in me.vertices]) / S  # 다시 y가 위, 원래 크기
Wm = np.zeros((len(V), 8))
gi = {g.index: names.index(g.name) for g in ob.vertex_groups}
for v in me.vertices:
    for g in v.groups: Wm[v.index, gi[g.group]] = g.weight
empty = Wm.sum(1) < 1e-6; print('weightless verts', int(empty.sum()), 'of', len(V))
Wm[empty, 1] = 1  # 가중치를 못 받은 정점은 hip
tree = cKDTree(V); _, idx = tree.query(P)  # 원래 정점(이음매 갈라진 것 포함)에 옮김
np.savez(out, W=Wm[idx])
