// Style-able version of the fighter rasteriser (needs art.js for SDF helpers + POSES).
const hsh=(x,y,n=0)=>((Math.imul(x+n*31,73856093)^Math.imul(y+n*17,19349663))>>>0)%1000/1000;
const mixc=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
const darkc=(c,f=0.45)=>c.map(v=>Math.round(v*f));

function drawStyled(img,W,H,S,ox,oy,facing,poseName){
 const p=POSES[poseName],C=S.pal,hs=S.hs||1,bw=S.bw||1;
 const c0={x:p.head[0],y:p.head[1]};
 const c={x:c0.x*bw,y:c0.y+9*(1-hs)+(S.neck||0)};
 const top=c.y-(S.hair==='round'?11.5:15)*hs;
 const k=S.px/(48-top);
 const buf=new Array(W*H).fill(null);
 const toD=(px,py)=>[(px+0.5-ox)/(k*facing),(py+0.5-oy)/k+48];
 const sh=Math.max(1,Math.round(1.1*k));
 const x0=Math.max(1,Math.floor(ox-34*k)),x1=Math.min(W-1,Math.ceil(ox+34*k)),y0=Math.max(1,Math.floor(oy-(50-top)*k)),y1=Math.min(H-1,oy+2);
 const OUT=S.outline;
 function part(f,base,shade,opt={}){
  const ring=opt.ink===false||!OUT?null:OUT==='black'?(S.ink||INK):darkc(base,S.seloutF||0.5);
  for(let py=y0;py<y1;py++)for(let px=x0;px<x1;px++){
   const [X,Y]=toD(px,py);const d=f(X,Y)*k;
   if(d<0){let col=base;
    if(S.shade!=='flat'&&shade){
     const sx=sh*0.7,sy=sh;
     const [X1,Y1]=toD(px+sx,py+sy);
     if(S.shade==='tone'){const [X2,Y2]=toD(px+2*sx,py+2*sy);if(f(X2,Y2)>=0&&((px+py)&1))col=shade;}
     else if(f(X1,Y1)>=0)col=shade;
     else if(S.shade==='dither'){const [X2,Y2]=toD(px+2*sx,py+2*sy);if(f(X2,Y2)>=0&&((px+py)&1))col=shade;}
     const hv=opt.hi??S.hi;if(hv&&col===base){const [X3,Y3]=toD(px-sx,py-sy);if(f(X3,Y3)>=0)col=mixc(base,[255,255,255],hv);}
    }
    buf[py*W+px]=col;}
   else if(ring&&d<(S.ow||1)&&!(S.gaps&&hsh(px,py)<S.gaps))buf[py*W+px]=ring;
  }}
 const B=f=>(x,y)=>f(x/bw,y)*Math.min(1,bw);
 const Hd=f=>(x,y)=>f(c0.x+(x-c.x)/hs,c0.y+(y-c.y)/hs)*hs;
 const leg=(hip,kn,ft)=>U(capsule(...hip,...kn,3.9),capsule(...kn,...ft,3.4));
 const foot=(ft)=>ellipse(ft[0]+1.6,ft[1]+0.4,3.7,1.9);
 const backGi=S.shade==='flat'?C.giS:S.shade==='tone'?C.gi:mixc(C.gi,C.giS,0.5);
 part(B(foot(p.ftB)),C.skinS,null);
 part(B(leg(p.hipB,p.knB,p.ftB)),backGi,C.giS);
 part(B(capsule(...p.shB,...p.elB,3.2)),C.giS,null);
 part(B(capsule(...p.elB,...p.fiB,2.3)),C.skinS,null);
 part(B(circle(...p.fiB,S.fist||3.2)),C.skinS,null);
 const [tx,ty]=p.torso;
 part(B(rbox(tx,ty,8.6,6.6,3.2)),C.gi,C.giS);
 if(!S.noLapel){
  part(B(poly([[tx-2.6,ty-6.5],[tx+3.8,ty-6.5],[tx+1,ty-0.8]])),C.skin,C.skinS,{ink:false});
  part(B(capsule(tx-2.6,ty-6.5,tx+1.4,ty+2,0.45)),C.giS,null,{ink:false});
  part(B(capsule(tx+3.8,ty-6.5,tx+1.2,ty-0.6,0.45)),C.giS,null,{ink:false});}
 part(B(leg(p.hipF,p.knF,p.ftF)),C.gi,C.giS);
 part(B(foot(p.ftF)),C.skin,C.skinS);
 part(B(rbox(tx,ty+4.6,8.8,1.4,0.6)),C.belt,C.beltS);
 part(B(U(capsule(tx+3,ty+5,tx+4.5,ty+9.5,0.9),capsule(tx+4,ty+5,tx+7,ty+8.5,0.9))),C.belt,C.beltS);
 // head
 const h=c0;
 part(Hd(ellipse(h.x,h.y,9.6,9)),C.skin,C.skinS);
 if(!S.noEar)part(Hd(circle(h.x-3.2,h.y+1.2,1.6)),C.skin,C.skinS);
 part(Hd(U(capsule(h.x-9,h.y-3.2,h.x-15.5,h.y-5.5,1.15),capsule(h.x-9,h.y-2.6,h.x-14.5,h.y+1.5,1.05))),C.band,C.bandS);
 let hair;
 if(S.hair==='round'){
  hair=U(I(ellipse(h.x-0.6,h.y-2.2,10.6,8.6),(x,y)=>y-(h.y-1.2+(x-h.x>3?-(x-h.x-3)*0.5:0))),
   I(ellipse(h.x-5.2,h.y-0.5,5.8,6.6),(x,y)=>x-(h.x-3.6)),
   circle(h.x+1,h.y-10.6,1.8),capsule(h.x+1,h.y-10.6,h.x+3.5,h.y-12.5,0.9));
 } else if(S.hair==='sharp'){
  const tr=(a,b,d)=>tri(h,a,b,d);
  hair=U(I(ellipse(h.x-1,h.y-2.6,10.4,8.2),above(h.y-1.6)),
   I(ellipse(h.x-5.2,h.y-0.5,5.6,6.4),(x,y)=>x-(h.x-3.8)),
   tr([-9,-1],[-18,-5],[-8.5,-6]),tr([-8,-5],[-14,-14],[-3.5,-8.5]),tr([-4,-8],[-1,-17.5],[2,-8.5]),
   tr([1,-8.5],[9,-15],[7,-6]),tr([5,-6],[13.5,-6],[8.5,-1.5]),tr([2,-3],[7,1.5],[6.5,-5]));
 } else {
  hair=U(I(ellipse(h.x-1,h.y-2.6,10.4,8.2),above(h.y-1.6)),
   I(ellipse(h.x-5.2,h.y-0.5,5.6,6.4),(x,y)=>x-(h.x-3.8)),
   tri(h,[-9,-1],[-16,-3.5],[-8.5,-6]),tri(h,[-8,-5],[-13,-11.5],[-3.5,-8.5]),tri(h,[-4,-8],[-3,-15],[2,-8.5]),
   tri(h,[1,-8.5],[6.5,-13.5],[7,-6]),tri(h,[5,-6],[11.5,-4],[8.5,-1.5]),tri(h,[3,-3],[8.5,0],[6.5,-5]));
 }
 part(Hd(hair),C.hair,C.hairS,{hi:S.hairHi});
 part(Hd(I(ellipse(h.x,h.y-0.3,10.2,9.6),between(h.y-4.4,h.y-2.3))),C.band,C.bandS);
 part(Hd(circle(h.x-9.3,h.y-3,1.7)),C.band,C.bandS);
 part(B(capsule(...p.shF,...p.elF,3.3)),C.gi,C.giS);
 part(B(capsule(...p.elF,...p.fiF,2.4)),C.skin,C.skinS);
 part(B(circle(...p.fiF,S.fist?S.fist+0.2:3.4)),C.skin,C.skinS);
 if(poseName==='block')part(B(circle(...p.fiB,S.fist||3.3)),C.skin,C.skinS);
 // rim light
 if(S.rim)for(let py=y0;py<y1;py++)for(let px=x0;px<x1;px++){
  const RK=S.ink||INK;const q=buf[py*W+px];if(!q||q===RK)continue;const n1=buf[py*W+px-facing],n2=buf[py*W+px-2*facing];
  if(n1===RK&&!n2)buf[py*W+px]=S.rim;}
 // texture (paper / crayon grain)
 if(S.tex)for(let py=y0;py<y1;py++)for(let px=x0;px<x1;px++){const q=buf[py*W+px];if(!q)continue;
  const r=hsh(px,py,3);if(r<S.tex)buf[py*W+px]=mixc(q,[255,255,255],0.18);else if(r>1-S.tex)buf[py*W+px]=darkc(q,0.88);}
 // face (head-space units -> pixels)
 const P=(dx,dy)=>[Math.round(ox+facing*(c.x+(dx)*hs)*k),Math.round(oy+(c.y+(dy)*hs-48)*k)];
 const set=(x,y,col)=>{if(x>=0&&y>=0&&x<W&&y<H)buf[y*W+x]=col;};
 const rect=(x,y,w,hh,col)=>{for(let j=0;j<hh;j++)for(let i=0;i<w;i++)set(facing>0?x+i:x-i,y+j,col);};
 const E=S.eyes, eyeCol=S.eyeCol||INK;
 for(const ex of (S.eyeX||[2.6,7])){
  const [x,y]=P(ex-0.8,1.2-1.7);
  const s=k*hs;
  if(E==='dot'){rect(x,y+Math.round(0.6*s),Math.max(1,Math.round(1.3*s)),Math.max(1,Math.round(2.2*s)),eyeCol);}
  else if(E==='big'){const w=Math.max(2,Math.round(2*s)),hh=Math.max(3,Math.round(3.6*s));
   rect(x,y,w,hh,eyeCol);rect(x,y+Math.ceil(hh/2),w,Math.floor(hh/2),S.iris||eyeCol);rect(x,y,w,1,INK);
   set(facing>0?x+w-1:x-w+1,y+1,[255,255,255]);}
  else if(E==='line'){const w=Math.max(2,Math.round(2.2*s));rect(x,y+Math.round(1.6*s),w,1,eyeCol);
   for(let i=0;i<w;i++)set(facing>0?x+i:x-i,y-Math.round(0.4*s)+(i>=w/2?1:0),eyeCol);}
  else { // anime (default)
   const w=Math.max(1,Math.round(1.6*s)),hh=Math.max(2,Math.round(3.4*s));rect(x,y,w,hh,eyeCol);
   if(s>1.2)set(facing>0?x+w-1:x-w+1,y,[255,255,255]);
   const bw2=Math.max(2,Math.round(2.4*s));for(let i=0;i<bw2;i++)set(facing>0?x-1+i:x+1-i,y-Math.max(2,Math.round(1.6*s))+(i>=bw2/2?1:0),eyeCol);
  }
 }
 if(S.blush){const [x,y]=P(1.2,4.2);rect(x,y,Math.max(1,Math.round(1.6*k*hs)),1,S.blush);const [x2,y2]=P(7.6,4.2);rect(x2,y2,1,1,S.blush);}
 if(S.mouth){const [x,y]=P(4.4,5.8);rect(x,y,Math.max(1,Math.round(1.4*k*hs)),1,S.mouth);}
 if(S.border){const r=S.borderW||2,add=[];for(let py=y0-r;py<y1+r;py++)for(let px=x0-r;px<x1+r;px++){if(px<0||py<0||px>=W||py>=H||buf[py*W+px])continue;
  let near=false;for(let j=-r;j<=r&&!near;j++)for(let i=-r;i<=r;i++){if(Math.abs(i)+Math.abs(j)>r+0)continue;const q=buf[(py+j)*W+px+i];if(q&&py+j<H&&px+i<W){near=true;break;}}
  if(near)add.push(py*W+px);}for(const i of add)buf[i]=S.border;}
 for(let i=0;i<W*H;i++){const q=buf[i];if(!q)continue;img.data[i*4]=q[0];img.data[i*4+1]=q[1];img.data[i*4+2]=q[2];img.data[i*4+3]=255;}
}
