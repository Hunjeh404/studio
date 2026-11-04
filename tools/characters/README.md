# 새 캐릭터 만들기 (독수리·공룡·갈매기)

턴어라운드 그림(4096x1024, 앞·옆·뒤·위)에서 블렌더 모델(GLB)을 만들어 `public/chars/<종류>.js`(base64)로 넣습니다.

1. `python3 -I prep.py 13_eagle.png 13_eagle.jpg 13_eagle.json` — 투영용 이미지(2048x512)와 칸 정보
2. `python3 make_animal.py eagle 13_eagle.json 13_eagle.jpg eagle.glb` — pip로 설치한 bpy 5.x
3. GLB를 base64로 `public/chars/eagle.js`에 `export default '...'`

관절 이름(root, hip, head, armL/R, legL/R, tail)과 메시 이름(head_geo, body_geo …)은 기존 12종과 같습니다.
야구 앱(애니멀리그) 모자 위치는 baseball/src/models.mjs의 CAP_CUT(eagle .30, dino .29, seagull .32)로 맞춥니다.
