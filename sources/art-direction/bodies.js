// Parametric body designs (needs art.js + styles.js helpers). Idle guard pose, facing right, feet at y=48.
function drawBody(img,W,H,S,B,ox,oy){
 const k=S.k||1,facing=1,C=S.pal;
 const buf=new Array(W*H).fill(null);
 const toD=(px,py)=>[(px+0.5-ox)/(k*facing),(py+0.5-oy)/k+48];
 const sh=Math.max(1,Math.round(1.1*k));
 function part(f,base,shade,opt={}){
  const ring=opt.ink===false?null:darkc(base,S.seloutF||0.55);
  for(let py=0;py<H;py++)for(let px=0;px<W;px++){
   const [X,Y]=toD(px,py);const d=f(X,Y)*k;
   if(d<0){let col=base;
    if(shade){const [X1,Y1]=toD(px+sh*0.7,py+sh);if(f(X1,Y1)>=0)col=shade;}
    const hv=opt.hi??S.hi;if(hv&&col===base){const [X3,Y3]=toD(px-sh*0.7,py-sh);if(f(X3,Y3)>=0)col=mixc(base,[255,255,255],hv);}
    buf[py*W+px]=col;}
   else if(ring&&d<1)buf[py*W+px]=ring;
  }}
 const grow=(f,g)=>(x,y)=>f(x,y)-g;
 // ---- geometry from parameters ----
 const {hx,hy,rx,ry}=B.head;
 const headF=B.blocky?rbox(hx,hy,rx,ry,2.2):ellipse(hx,hy,rx,ry);
 const hipY=48-1.5-B.legLen, shY=B.torso.top;
 const tw=B.torso.topW,bw=B.torso.botW;
 let torsoF;
 if(B.torso.type==='ball')torsoF=ellipse(0,(shY+hipY+2)/2,Math.max(tw,bw),(hipY+2-shY)/2);
 else if(B.torso.type==='pear')torsoF=U(ellipse(0,shY+4,tw,5),ellipse(0,hipY-2,bw,(hipY-shY)/2.2));
 else if(B.torso.type==='trap')torsoF=grow(poly([[-tw+1.5,shY+1.5],[tw-1.5,shY+1.5],[bw-1.5,hipY+0.5],[-bw+1.5,hipY+0.5]]),1.5);
 else torsoF=rbox(0,(shY+hipY+1)/2,tw,(hipY+1-shY)/2,B.blocky?1:3);
 const s=B.stance,ft=[[s,46.5],[-s,46.5]];
 const hips=[[bw*0.45,hipY],[-bw*0.45,hipY]];
 const knees=hips.map((h,i)=>[(h[0]+ft[i][0])/2+(i?-1:1.5),(h[1]+ft[i][1])/2]);
 const legF=i=>U(capsule(...hips[i],...knees[i],B.legW),capsule(...knees[i],...ft[i],B.legW*0.88));
 const footF=i=>B.blocky?rbox(ft[i][0]+1.4,ft[i][1]+0.4,3.4,1.6,0.5):ellipse(ft[i][0]+1.6,ft[i][1]+0.4,B.foot||3.6,1.9);
 const shF=[tw*0.55,shY+2.2],shB=[-tw*0.55,shY+2.4];
 const fiF=B.fistF||[hx+rx+1.2,hy+ry*0.7],fiB=B.fistB||[hx+rx*0.35,hy+ry+2.2];
 const elbow=(sp,fp,o)=>[(sp[0]+fp[0])/2+o,Math.max(sp[1],fp[1])+B.armDrop];
 const elF=elbow(shF,fiF,1.5),elB=elbow(shB,fiB,0.5);
 const fistF=(p,r)=>B.blocky?rbox(p[0],p[1],r,r,0.8):circle(p[0],p[1],r);
 const backGi=mixc(C.gi,C.giS,0.5);
 // ---- draw back to front ----
 if(B.tail)part(U(capsule(-bw+1,hipY,-bw-5,hipY-4,1.6),capsule(-bw-5,hipY-4,-bw-4,hipY-11,1.5)),C.skin,C.skinS);
 part(footF(1),C.skinS,null);
 part(legF(1),backGi,C.giS);
 part(capsule(...shB,...elB,B.armW),C.giS,null);
 part(capsule(...elB,...fiB,B.armW*0.75),C.skinS,null);
 part(fistF(fiB,B.fist*0.95),C.skinS,null);
 part(torsoF,C.gi,C.giS);
 const lt=[0,shY+0.6];
 part(poly([[lt[0]-2.4,lt[1]],[lt[0]+3.4,lt[1]],[lt[0]+0.8,lt[1]+5.5]]),C.skin,C.skinS,{ink:false});
 part(capsule(lt[0]-2.4,lt[1],lt[0]+1.2,hipY-1,0.45),C.giS,null,{ink:false});
 part(capsule(lt[0]+3.4,lt[1],lt[0]+1,lt[1]+5.8,0.45),C.giS,null,{ink:false});
 part(legF(0),C.gi,C.giS);
 part(footF(0),C.skin,C.skinS);
 const beltW=B.torso.type==='ball'||B.torso.type==='pear'?bw*0.92:bw+0.2;
 part(rbox(0,hipY-1,beltW,1.4,0.6),C.belt,C.beltS);
 part(U(capsule(2.5,hipY-0.6,4,hipY+4,0.9),capsule(3.5,hipY-0.6,6.5,hipY+3,0.9)),C.belt,C.beltS);
 // head
 if(B.cat){
  part(poly([[hx-rx*0.7,hy-ry*0.45],[hx-rx*0.45,hy-ry*1.5],[hx-rx*0.05,hy-ry*0.8]]),C.skin,C.skinS);
  part(poly([[hx+rx*0.1,hy-ry*0.8],[hx+rx*0.5,hy-ry*1.55],[hx+rx*0.78,hy-ry*0.45]]),C.skin,C.skinS);
  part(poly([[hx+rx*0.25,hy-ry*0.85],[hx+rx*0.48,hy-ry*1.3],[hx+rx*0.64,hy-ry*0.7]]),[255,170,180],null,{ink:false});
 }
 part(headF,C.skin,C.skinS);
 if(!B.cat&&!B.noEar)part(circle(hx-rx*0.33,hy+ry*0.13,1.6),C.skin,C.skinS);
 if(B.cat){part(ellipse(hx+rx*0.55,hy+ry*0.42,3.2,2.3),[255,244,228],[236,214,196]);}
 // headband tails
 const by0=hy-ry*0.5,by1=hy-ry*0.27,bmy=(by0+by1)/2;
 part(U(capsule(hx-rx*0.92,bmy,hx-rx*0.92-6.5,bmy-2.5,1.15),capsule(hx-rx*0.92,bmy+0.5,hx-rx*0.92-5.5,bmy+4.5,1.05)),C.band,C.bandS);
 // hair
 if(!B.cat){
  const cap=I(grow(headF,1.1),(x,y)=>y-(hy-ry*0.18-(x>hx+rx*0.35?(x-hx-rx*0.35)*0.6:0)));
  const back=I(grow(headF,1.1),(x,y)=>x-(hx-rx*0.32),(x,y)=>y-(hy+ry*0.5));
  const r=rx/9.6;let extra=[];
  const T=(a,b,c)=>poly([[hx+a[0]*r,hy+a[1]*r],[hx+b[0]*r,hy+b[1]*r],[hx+c[0]*r,hy+c[1]*r]]);
  if(B.hair==='spiky')extra=[T([-9,-1],[-15.5,-3.5],[-8.5,-6]),T([-8,-5],[-12.5,-11.5],[-3.5,-8.5]),T([-4,-8],[-3,-14.5],[2,-8.5]),T([1,-8.5],[6.5,-13],[7,-6])];
  if(B.hair==='big')extra=[T([-9,-1],[-19,-5],[-8.5,-6]),T([-8,-5],[-15,-15],[-3.5,-8.5]),T([-4,-8],[-1,-19],[2,-8.5]),T([1,-8.5],[10,-16],[7,-6]),T([5,-6],[14,-6],[8.5,-1.5])];
  if(B.hair==='round')extra=[capsule(hx+r,hy-ry*1.1,hx+3.2*r,hy-ry*1.3,0.9)];
  if(B.hair==='bun')extra=[circle(hx-rx*0.25,hy-ry*1.12,rx*0.36)];
  part(U(cap,back,...extra),C.hair,C.hairS,{hi:S.hairHi});
  if(B.hair==='bun')part(rbox(hx-rx*0.25,hy-ry*0.86,rx*0.3,0.7,0.3),C.band,C.bandS);
 }
 // headband
 part(I(grow(headF,1.2),between(by0,by1)),C.band,C.bandS);
 part(circle(hx-rx*0.95,bmy,1.6),C.band,C.bandS);
 // front arm
 part(capsule(...shF,...elF,B.armW*1.03),C.gi,C.giS);
 part(capsule(...elF,...fiF,B.armW*0.75),C.skin,C.skinS);
 part(fistF(fiF,B.fist),C.skin,C.skinS);
 // face
 const set=(x,y,col)=>{if(x>=0&&y>=0&&x<W&&y<H)buf[y*W+x]=col;};
 const PX=(X,Y)=>[Math.round(ox+X*k),Math.round(oy+(Y-48)*k)];
 const ew=B.eyeW||2,eh=B.eyeH||4;
 for(const fx of (B.eyeX||[0.27,0.72])){
  const [x,y]=PX(hx+rx*fx-1,hy+ry*0.05);
  for(let j=0;j<eh;j++)for(let i=0;i<ew;i++)set(x+i,y+j,j===0?INK:j>=eh/2?S.iris:INK);
  set(x+ew-1,y+1,[255,255,255]);
 }
 if(S.blush){const [x,y]=PX(hx+rx*0.12,hy+ry*0.48);set(x,y,S.blush);set(x+1,y,S.blush);const [x2,y2]=PX(hx+rx*0.86,hy+ry*0.48);set(x2,y2,S.blush);}
 if(B.cat){const [x,y]=PX(hx+rx*0.62,hy+ry*0.3);set(x,y,[230,90,110]);set(x+1,y,[230,90,110]);}
 else if(S.mouth){const [x,y]=PX(hx+rx*0.5,hy+ry*0.62);set(x,y,S.mouth);}
 for(let i=0;i<W*H;i++){const q=buf[i];if(!q)continue;img.data[i*4]=q[0];img.data[i*4+1]=q[1];img.data[i*4+2]=q[2];img.data[i*4+3]=255;}
}
