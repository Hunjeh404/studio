# Hunyuan 3D GLB를 집 앱 캐릭터 형식으로 바꿈: 키 0.95m·발바닥 y=0·앞 +z, 관절 8개(root, hip, head, armL/R, legL/R, tail, 회전 없이 위치만),
# 위치 규칙으로 정한 스킨 가중치, 기본색 텍스처 하나(2048 JPG, 크림색 흰 털은 중립 흰색으로)
# 사용: python3 -I from_hunyuan.py <in.glb> <out.js> [--auto]   (--auto: 팔이 몸통에 붙은 체형은 블렌더 자동 가중치로, autoweight.py)
import sys, os, io, base64, struct, subprocess, tempfile, numpy as np, pygltflib
AUTO = '--auto' in sys.argv; sys.argv = [a for a in sys.argv if a != '--auto']
from PIL import Image

src, out_js = sys.argv[1:3]
g = pygltflib.GLTF2.load(src); blob = g.binary_blob()
def acc(i):
    a = g.accessors[i]; bv = g.bufferViews[a.bufferView]; n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a.type]
    dt = {5126: np.float32, 5123: np.uint16, 5125: np.uint32, 5121: np.uint8}[a.componentType]
    return np.frombuffer(blob, dtype=dt, count=a.count * n, offset=bv.byteOffset + (a.byteOffset or 0)).reshape(a.count, n).copy()
p = g.meshes[0].primitives[0]
P = acc(p.attributes.POSITION).astype(np.float64); N = acc(p.attributes.NORMAL).astype(np.float64); UV = acc(p.attributes.TEXCOORD_0); IDX = acc(p.indices).reshape(-1)

# 노드 회전(쿼터니언) 적용 → y가 위
q = g.nodes[0].rotation or [0, 0, 0, 1]
x, y, z, w = q
R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
P = P @ R.T; N = N @ R.T
s = 0.95 / (P[:, 1].max() - P[:, 1].min()); P = (P - [0, P[:, 1].min(), 0]) * s
P[:, 0] -= (P[:, 0].min() + P[:, 0].max()) / 2
head = P[:, 1] > 0.6; P[:, 2] -= P[head, 2].mean()  # 머리 중심을 z=0에

# 관절 위치(절대): 목은 몸통이 가장 잘록한 높이(0.3~0.55 사이 가로 폭 최소)
hs = np.arange(0.30, 0.72, 0.01); wid = [np.abs(P[(P[:, 1] > h - 0.005) & (P[:, 1] < h + 0.005), 0]).max() for h in hs]
neck = float(hs[int(np.argmin(wid))])
# 가랑이 높이: 아래에서부터 가운데(|x|<0.012)에 면이 처음 생기는 높이 (다리가 붙어 있으면 낮게 나옴)
crotch = 0.08
for h in np.arange(0.03, 0.4, 0.005):
    if ((P[:, 1] > h - 0.004) & (P[:, 1] < h + 0.004) & (np.abs(P[:, 0]) < 0.012) & (P[:, 2] > -0.06)).any(): crotch = float(h); break  # 앞쪽만 봄(뒤로 늘어진 꼬리 제외)
crotch = max(crotch, 0.08); hip_y = max(0.17, crotch + 0.05)
# 팔과 몸통 사이 틈: 팔 높이에서 |x| 분포에 빈 구간이 있으면 그 시작점이 몸통 끝
ah = (P[:, 1] > neck - 0.2) & (P[:, 1] < neck - 0.08)
occ = np.bincount((np.abs(P[ah, 0]) / 0.005).astype(int), minlength=80) > 3
gap = next((i for i in range(4, len(occ) - 2) if occ[i - 1] and not occ[i] and not occ[i + 1] and occ[i + 2:].any()), None)  # 바깥에 팔이 더 있어야 틈
gap_x = gap * 0.005 if gap else None
band = (P[:, 1] > neck - 0.07) & (P[:, 1] < neck - 0.03); arm_x = float(np.abs(P[band, 0]).max()) * 0.62
if gap_x: arm_x = max(arm_x, gap_x + 0.02)
torso = (P[:, 1] > 0.12) & (P[:, 1] < neck - 0.05)
leg_x = float(np.abs(P[(P[:, 1] < 0.06), 0]).max()) * 0.5
back_z = float(np.percentile(P[(P[:, 1] > 0.3) & (P[:, 1] < neck - 0.03) & (np.abs(P[:, 0]) < 0.08), 2], 3))  # 꼬리보다 높은 곳에서 잰 등 위치
if AUTO:  # 손끝: 몸통 높이에서 가장 바깥쪽 정점들 중 가장 낮은 곳
    side = (P[:, 1] > crotch + 0.05) & (P[:, 1] < neck) & (np.abs(P[:, 0]) > 0.8 * np.abs(P[(P[:, 1] > crotch + 0.05) & (P[:, 1] < neck), 0]).max())
    k = np.argsort(P[side, 1])[:30]; hand = P[side][k]; hand_x = float(np.abs(hand[:, 0]).mean()); hand_y = float(hand[:, 1].mean())
    arm_x = 0.78 * hand_x
J = dict(root=(0, 0, 0), hip=(0, hip_y, 0), head=(0, neck, 0), armL=(arm_x, neck - 0.04, 0), armR=(-arm_x, neck - 0.04, 0),
         legL=(leg_x, max(0.1, crotch), 0), legR=(-leg_x, max(0.1, crotch), 0), tail=(0, hip_y - 0.04, back_z))
print('crotch', round(crotch, 3), 'gap_x', gap_x, 'neck', round(neck, 3), 'arm_x', round(arm_x, 3), 'leg_x', round(leg_x, 3), 'back_z', round(back_z, 3))

# 가중치: 부드러운 경계로 머리·팔·다리·꼬리, 나머지는 hip
sm = lambda v, a, b: np.clip((v - a) / (b - a), 0, 1)
X, Y, Z = P[:, 0], P[:, 1], P[:, 2]
wHead = sm(Y, neck - 0.015, neck + 0.02)
# 팔: 어깨 높이 아래, 몸통 바깥쪽(그 높이의 몸통 폭보다 바깥)
armZone = sm(Y, 0.12, 0.17) * (1 - sm(Y, neck - 0.04, neck)) * (1 - wHead)
if gap_x: wArmL = armZone * sm(X, gap_x - 0.004, gap_x + 0.006); wArmR = armZone * sm(-X, gap_x - 0.004, gap_x + 0.006)  # 틈 바깥이 팔
else: wArmL = armZone * sm(X, arm_x * 0.72, arm_x * 0.92); wArmR = armZone * sm(-X, arm_x * 0.72, arm_x * 0.92)
legZone = 1 - sm(Y, max(0.06, crotch - 0.03), max(0.11, crotch + 0.02))  # 가랑이 아래 다리
wLegL = legZone * sm(X, 0.01, 0.04); wLegR = legZone * sm(-X, 0.01, 0.04)
butt_z = float(np.percentile(P[(P[:, 1] > max(0.1, crotch)) & (P[:, 1] < max(0.25, crotch + 0.15)) & (np.abs(P[:, 0]) > 0.05) & (np.abs(P[:, 0]) < 0.15), 2], 2))  # 꼬리 높이의 엉덩이 뒷면(꼬리는 가운데라 옆쪽에서 잼)
tailZone = sm(-Z, -butt_z, -butt_z + 0.03) * (1 - sm(Y, 0.4, 0.45))
wTail = tailZone * (1 - wHead)
Wt = np.stack([np.zeros_like(X), np.ones_like(X), wArmL, wArmR, wHead, wTail, wLegL, wLegR], 1)  # 순서: root hip armL armR head tail legL legR
Wt[:, 1] = np.clip(1 - Wt[:, 2:].sum(1), 0, 1)
if AUTO:
    names8 = ['root', 'hip', 'armL', 'armR', 'head', 'tail', 'legL', 'legR']
    tip = P[np.argmin(P[:, 2])]
    T = dict(root=(0, 0.05, 0), hip=(0, neck, 0), head=(0, 0.95, 0), armL=(hand_x, hand_y, 0), armR=(-hand_x, hand_y, 0),
             legL=(leg_x, 0.0, 0), legR=(-leg_x, 0.0, 0), tail=tuple(tip))
    tmp = tempfile.mkdtemp(); np.savez(f'{tmp}/in.npz', P=P, I=IDX.reshape(-1, 3), J=np.array([J[n] for n in names8]), T=np.array([T[n] for n in names8]))
    subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'autoweight.py'), f'{tmp}/in.npz', f'{tmp}/out.npz'], check=True)
    Wt = np.load(f'{tmp}/out.npz')['W']; print('auto weights')
Wt /= Wt.sum(1, keepdims=True)
order = np.argsort(-Wt, 1)[:, :4]; JW = np.take_along_axis(Wt, order, 1); JW /= JW.sum(1, keepdims=True)
JI = order.astype(np.uint8)

# 텍스처: 기본색만, 2048 JPG, 크림색 흰 털 → 중립 흰색 (분홍·민트·파랑 등은 제외)
tex_i = g.textures[g.materials[0].pbrMetallicRoughness.baseColorTexture.index].source
bv = g.bufferViews[g.images[tex_i].bufferView]
im = np.asarray(Image.open(io.BytesIO(blob[bv.byteOffset:bv.byteOffset + bv.byteLength])).convert('RGB').resize((2048, 2048), Image.LANCZOS)).astype(np.float32) / 255
mx = im.max(2); mn = im.min(2); sat = (mx - mn) / np.maximum(mx, 1e-4); L = im @ np.array([0.2126, 0.7152, 0.0722])
r, gg, bb = im[..., 0], im[..., 1], im[..., 2]
warm = np.clip((r - bb) / 0.02, 0, 1) * np.clip((r - gg + 0.01) / 0.02, 0, 1) * np.clip(((gg - bb) / np.maximum(r - bb, 1e-3) - 0.3) / 0.15, 0, 1)
neutral = np.clip((0.04 - (mx - mn)) / 0.02, 0, 1)
wm = np.clip((0.3 - sat) / 0.07, 0, 1) * np.clip((mx - 0.35) / 0.15, 0, 1) * np.maximum(warm, neutral)
im = im * (1 - wm[..., None]) + np.minimum(1, L * 1.13)[..., None].repeat(3, 2) * wm[..., None]
buf = io.BytesIO(); Image.fromarray((im * 255).round().astype(np.uint8)).save(buf, 'JPEG', quality=88); JPG = buf.getvalue()

# GLB 새로 쓰기
data = bytearray(); views = []; accs = []
def add_view(b, target=None):
    while len(data) % 4: data.append(0)
    views.append(pygltflib.BufferView(buffer=0, byteOffset=len(data), byteLength=len(b), target=target)); data.extend(b); return len(views) - 1
def add_acc(arr, ctype, typ, target=None, minmax=False, norm=False):
    v = add_view(arr.tobytes(), target); a = pygltflib.Accessor(bufferView=v, componentType=ctype, count=len(arr), type=typ, normalized=norm or None)
    if minmax: a.min = arr.min(0).tolist(); a.max = arr.max(0).tolist()
    accs.append(a); return len(accs) - 1
F, U = 5126, 5121
aP = add_acc(P.astype(np.float32), F, 'VEC3', 34962, True); aN = add_acc(N.astype(np.float32), F, 'VEC3', 34962)
aT = add_acc(UV.astype(np.float32), F, 'VEC2', 34962); aJ = add_acc(JI, U, 'VEC4', 34962); aW = add_acc(JW.astype(np.float32), F, 'VEC4', 34962)
aI = add_acc(IDX.astype(np.uint32), 5125, 'SCALAR', 34963)
names = ['root', 'hip', 'armL', 'armR', 'head', 'tail', 'legL', 'legR']
ibm = np.stack([np.array([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [-J[n][0], -J[n][1], -J[n][2], 1]], np.float32) for n in names])  # 열 우선
aB = add_acc(ibm.reshape(8, 16), F, 'MAT4')
iv = add_view(JPG)
rel = lambda c, par: [float(J[c][i] - J[par][i]) for i in range(3)]
nodes = [pygltflib.Node(name='armL', translation=rel('armL', 'hip')), pygltflib.Node(name='armR', translation=rel('armR', 'hip')),
         pygltflib.Node(name='head', translation=rel('head', 'hip')), pygltflib.Node(name='tail', translation=rel('tail', 'hip')),
         pygltflib.Node(name='hip', translation=rel('hip', 'root'), children=[0, 1, 2, 3]),
         pygltflib.Node(name='legL', translation=rel('legL', 'root')), pygltflib.Node(name='legR', translation=rel('legR', 'root')),
         pygltflib.Node(name='root', children=[4, 5, 6]), pygltflib.Node(name='body_geo', mesh=0, skin=0), pygltflib.Node(name='rig', children=[8, 7])]
out = pygltflib.GLTF2(asset=pygltflib.Asset(version='2.0', generator='from_hunyuan.py'), scene=0, scenes=[pygltflib.Scene(nodes=[9])], nodes=nodes,
    meshes=[pygltflib.Mesh(name='node_0', primitives=[pygltflib.Primitive(attributes=pygltflib.Attributes(POSITION=aP, NORMAL=aN, TEXCOORD_0=aT, JOINTS_0=aJ, WEIGHTS_0=aW), indices=aI, material=0)])],
    skins=[pygltflib.Skin(joints=[7, 4, 0, 1, 2, 3, 5, 6], inverseBindMatrices=aB, skeleton=7)],
    materials=[pygltflib.Material(pbrMetallicRoughness=pygltflib.PbrMetallicRoughness(baseColorTexture=pygltflib.TextureInfo(index=0), metallicFactor=0, roughnessFactor=1))],
    textures=[pygltflib.Texture(source=0, sampler=0)], samplers=[pygltflib.Sampler(magFilter=9729, minFilter=9987)],
    images=[pygltflib.Image(bufferView=iv, mimeType='image/jpeg')], accessors=accs, bufferViews=views, buffers=[pygltflib.Buffer(byteLength=len(data))])
out.set_binary_blob(bytes(data)); glb = b''.join(out.save_to_bytes())
open(out_js, 'w').write("export default '" + base64.b64encode(glb).decode() + "'\n"); print('saved', len(glb))
