# Hunyuan 고면수 모델 → 면 수 줄이고 기본색 텍스처를 고친 그림으로 바꿔 GLB로. 사용: python3 decimate.py in.glb base.png out.glb 목표삼각형수
import sys, bpy
src, tex, out, target = sys.argv[-4], sys.argv[-3], sys.argv[-2], int(sys.argv[-1])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
ob = [o for o in bpy.context.scene.objects if o.type == 'MESH'][0]
import bmesh  # UV 이음매에서 갈라진 정점을 먼저 합침 (안 합치면 면을 줄일 때 이음매가 벌어져 구멍이 남)
bm = bmesh.new(); bm.from_mesh(ob.data); r = bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5); bm.to_mesh(ob.data); bm.free(); print('merged verts', len(ob.data.vertices))
n = len(ob.data.polygons); m = ob.modifiers.new('dec', 'DECIMATE'); m.ratio = target / n
bpy.context.view_layer.objects.active = ob; bpy.ops.object.modifier_apply(modifier='dec')
mat = ob.data.materials[0]; nt = mat.node_tree; bsdf = nt.nodes.get('Principled BSDF')
img = bpy.data.images.load(tex); node = nt.nodes.new('ShaderNodeTexImage'); node.image = img
nt.links.new(node.outputs['Color'], bsdf.inputs['Base Color'])
for k in ('Metallic', 'Roughness', 'Normal'):
    for l in list(bsdf.inputs[k].links): nt.links.remove(l)
bsdf.inputs['Metallic'].default_value = 0
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_animations=False, export_image_format='JPEG')
print('faces', n, '->', len(ob.data.polygons))
