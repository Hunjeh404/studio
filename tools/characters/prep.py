# 투영용 이미지 + 칸 정보 (2048x512)
import sys, json, numpy as np
from PIL import Image
from scipy import ndimage as nd
src, out_img, out_json = sys.argv[1:4]
im=np.asarray(Image.open(src).convert('RGB').resize((2048,512),Image.LANCZOS)).astype(int)
info={}; full=np.zeros(im.shape[:2],bool)
for k,name in enumerate(['front','side','back','top']):
    p=im[:,k*512:(k+1)*512]; m=np.abs(p-np.array([238,233,216])).sum(2)>7
    m=nd.binary_opening(m,iterations=1);m=nd.binary_closing(m,iterations=2);m=nd.binary_fill_holes(m)
    lab,n=nd.label(m);sizes=nd.sum(m,lab,range(1,n+1));big=lab==(np.argmax(sizes)+1)
    full[:,k*512:(k+1)*512]=big
    ys,xs=np.nonzero(big);top,bot=ys.min(),ys.max();H=bot-top
    if name in('front','back'):
        y=int(bot-.62*H);r=np.nonzero(big[y])[0];cu=(r.min()+r.max())/2
        info[name]=dict(off=k*512,cu=float(cu),top=int(top),bot=int(bot),H=int(H),maxhw=float(max((cu-np.nonzero(big[yy])[0].min()) for yy in range(top,bot) if big[yy].any())))
    elif name=='side':
        o=nd.binary_opening(big,iterations=14);y=int(bot-.25*H);r=np.nonzero(o[y])[0]
        info[name]=dict(off=k*512,cu=float((r.min()+r.max())/2),top=int(top),bot=int(bot),H=int(H))
    else:
        o=nd.binary_opening(big,iterations=10);ys2,xs2=np.nonzero(o)
        info[name]=dict(off=k*512,cu=float((xs2.min()+xs2.max())/2),cy=float((ys2.min()+ys2.max())/2),hw=float((xs2.max()-xs2.min())/2))
info['top']['k']=info['top']['hw']/info['front']['maxhw']
# 배경을 가장 가까운 전경색으로
inner=nd.binary_erosion(full,iterations=2)
idx=nd.distance_transform_edt(~inner,return_distances=False,return_indices=True)
filled=im[idx[0],idx[1]]
Image.fromarray(filled.astype(np.uint8)).save(out_img,quality=88)
json.dump(info,open(out_json,'w'),indent=1); print(json.dumps(info))
