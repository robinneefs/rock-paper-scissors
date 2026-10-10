const INK=[26,15,46];
const P={
 p1:{gi:[242,236,255],giS:[169,155,214],belt:[36,28,58],beltS:[20,14,36],band:[255,59,107],bandS:[176,24,70],skin:[255,207,158],skinS:[224,154,110],hair:[45,36,82],hairS:[24,18,48],rim:[63,240,255]},
 p2:{gi:[74,74,170],giS:[44,40,108],belt:[255,207,74],beltS:[196,140,30],band:[255,207,74],bandS:[196,140,30],skin:[236,170,120],skinS:[184,112,74],hair:[30,22,40],hairS:[14,10,22],rim:[255,47,191]},
};
// ---------- SDF helpers (design units, fighter is 48 units tall) ----------
const len=(x,y)=>Math.hypot(x,y);
const circle=(cx,cy,r)=>(x,y)=>len(x-cx,y-cy)-r;
const ellipse=(cx,cy,rx,ry)=>(x,y)=>(len((x-cx)/rx,(y-cy)/ry)-1)*Math.min(rx,ry);
const capsule=(ax,ay,bx,by,r)=>(x,y)=>{const pax=x-ax,pay=y-ay,bax=bx-ax,bay=by-ay;
 const h=Math.max(0,Math.min(1,(pax*bax+pay*bay)/(bax*bax+bay*bay)));return len(pax-bax*h,pay-bay*h)-r;};
const rbox=(cx,cy,hw,hh,r)=>(x,y)=>{const qx=Math.abs(x-cx)-hw+r,qy=Math.abs(y-cy)-hh+r;
 return len(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-r;};
const poly=(pts)=>(x,y)=>{let d=1e9,s=1;for(let i=0,j=pts.length-1;i<pts.length;j=i++){
 const [ax,ay]=pts[j],[bx,by]=pts[i];const ex=bx-ax,ey=by-ay,wx=x-ax,wy=y-ay;
 const h=Math.max(0,Math.min(1,(wx*ex+wy*ey)/(ex*ex+ey*ey)));d=Math.min(d,len(wx-ex*h,wy-ey*h));
 if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)s=-s;}return s*d;};
const U=(...f)=>(x,y)=>Math.min(...f.map(g=>g(x,y)));
const I=(...f)=>(x,y)=>Math.max(...f.map(g=>g(x,y)));
const above=(yy)=>(x,y)=>y-yy;
const between=(a,b)=>(x,y)=>Math.max(a-y,y-b);
const tri=(c,a,b,d)=>poly([[c.x+a[0],c.y+a[1]],[c.x+b[0],c.y+b[1]],[c.x+d[0],c.y+d[1]]]);

const POSES={
 idle:{head:[1,13],torso:[0,28],shF:[4,23.5],elF:[9.5,27],fiF:[12.5,21.5],shB:[-5,23.5],elB:[2,29.5],fiB:[8,26],
  hipF:[3.5,33],knF:[8,39.5],ftF:[10.5,46],hipB:[-3.5,33],knB:[-7.5,39.5],ftB:[-10,46]},
 attack:{head:[4,14],torso:[2,28.5],shF:[6,23.5],elF:[13,23.5],fiF:[21,23.5],shB:[-3,24],elB:[-2,30],fiB:[4,29],
  hipF:[5,33],knF:[11,39],ftF:[14.5,46],hipB:[-2,33],knB:[-7,40],ftB:[-12.5,46]},
 block:{head:[0,15.5],torso:[0,29.5],shF:[4,25],elF:[9.5,29],fiF:[9,18.5],shB:[-4,25],elB:[5.5,30],fiB:[11,22],
  hipF:[3.5,34.5],knF:[9,40],ftF:[11,46],hipB:[-3.5,34.5],knB:[-9,40],ftB:[-11,46]},
};

// ---------- fighter rasteriser ----------
function drawFighter(img,W,H,who,ox,oy,k,facing,poseName){
 const C=P[who],p=POSES[poseName];
 const buf=new Array(W*H).fill(null);   // [r,g,b,kind] kind: 0 ink,1 fill
 const toD=(px,py)=>[(px+0.5-ox)/(k*facing),(py+0.5-oy)/k+48];
 const sh=Math.max(1,Math.round(1.1*k));             // shade thickness in px
 const bx0=Math.max(0,Math.floor(ox-30*k)),bx1=Math.min(W,Math.ceil(ox+30*k)),by0=Math.max(0,Math.floor(oy-50*k)),by1=Math.min(H,oy+2);
 function part(f,base,shade,opt={}){
  const ink=opt.ink!==false;
  for(let py=by0;py<by1;py++)for(let px=bx0;px<bx1;px++){
   const [X,Y]=toD(px,py);const d=f(X,Y)*k;
   if(d<0){let col=base;
     if(shade){const [X2,Y2]=toD(px+sh*0.7,py+sh);if(f(X2,Y2)>=0)col=shade;}
     buf[py*W+px]=[...col,1];}
   else if(ink&&d<1)buf[py*W+px]=[...INK,0];
  }}
 const v=(a)=>a; const [hx,hy]=p.head; const c={x:hx,y:hy};
 const leg=(hip,kn,ft)=>U(capsule(...hip,...kn,3.9),capsule(...kn,...ft,3.4));
 const foot=(ft)=>ellipse(ft[0]+1.6,ft[1]+0.4,3.7,1.9);
 // back leg + foot
 part(foot(p.ftB),C.skinS,null);
 part(leg(p.hipB,p.knB,p.ftB),C.gi.map((v,i)=>Math.round((v+C.giS[i])/2)),C.giS);
 // back arm
 part(capsule(...p.shB,...p.elB,3.2),C.giS,null);
 part(capsule(...p.elB,...p.fiB,2.3),C.skinS,null);
 part(circle(...p.fiB,3.2),C.skinS,null);
 // torso
 const [tx,ty]=p.torso;
 part(rbox(tx,ty,8.6,6.6,3.2),C.gi,C.giS);
 part(poly([[tx-2.6,ty-6.5],[tx+3.8,ty-6.5],[tx+1,ty-0.8]]),C.skin,C.skinS,{ink:false});
 part(capsule(tx-2.6,ty-6.5,tx+1.4,ty+2,0.45),C.giS,null,{ink:false});
 part(capsule(tx+3.8,ty-6.5,tx+1.2,ty-0.6,0.45),C.giS,null,{ink:false});
 // front leg + foot
 part(leg(p.hipF,p.knF,p.ftF),C.gi,C.giS);
 part(foot(p.ftF),C.skin,C.skinS);
 // belt
 part(rbox(tx,ty+4.6,8.8,1.4,0.6),C.belt,C.beltS);
 part(U(capsule(tx+3,ty+5,tx+4.5,ty+9.5,0.9),capsule(tx+4,ty+5,tx+7,ty+8.5,0.9)),C.belt,C.beltS);
 // head
 part(circle(c.x-3.2,c.y+1.5,1.9),C.skin,C.skinS);
 part(ellipse(c.x,c.y,9.6,9),C.skin,C.skinS);
 part(circle(c.x-3.2,c.y+1.2,1.6),C.skin,C.skinS,{ink:true});
 // headband tails (behind hair knot)
 part(U(capsule(c.x-9,c.y-3.2,c.x-15.5,c.y-5.5,1.15),capsule(c.x-9,c.y-2.6,c.x-14.5,c.y+1.5,1.05)),C.band,C.bandS);
 // hair
 const hair=U(
  I(ellipse(c.x-1,c.y-2.6,10.4,8.2),above(c.y-1.6)),
  I(ellipse(c.x-5.2,c.y-0.5,5.6,6.4),(x,y)=>x-(c.x-3.8)),
  tri(c,[-9,-1],[-16,-3.5],[-8.5,-6]),
  tri(c,[-8,-5],[-13,-11.5],[-3.5,-8.5]),
  tri(c,[-4,-8],[-3,-15],[2,-8.5]),
  tri(c,[1,-8.5],[6.5,-13.5],[7,-6]),
  tri(c,[5,-6],[11.5,-4],[8.5,-1.5]),
  tri(c,[3,-3],[8.5,0],[6.5,-5]));
 part(hair,C.hair,C.hairS);
 // headband
 part(I(ellipse(c.x,c.y-0.3,10.2,9.6),between(c.y-4.4,c.y-2.3)),C.band,C.bandS);
 part(circle(c.x-9.3,c.y-3,1.7),C.band,C.bandS);
 // front arm (on top)
 part(capsule(...p.shF,...p.elF,3.3),C.gi,C.giS);
 part(capsule(...p.elF,...p.fiF,2.4),C.skin,C.skinS);
 part(circle(...p.fiF,3.4),C.skin,C.skinS);
 if(poseName==='block') part(circle(...p.fiB,3.3),C.skin,C.skinS);

 // rim light on back edge + top
 for(let py=by0;py<by1;py++)for(let px=bx0;px<bx1;px++){
  const q=buf[py*W+px];if(!q||q[3]!==1)continue;
  const n1=buf[py*W+px-facing],n2=buf[py*W+px-2*facing];
  if(n1&&n1[3]===0&&!n2)buf[py*W+px]=[...C.rim,1];
 }
 // face (pixel rects)
 const rect=(dx,dy,w,h,col,minw=1,minh=1)=>{
  const pw=Math.max(minw,Math.round(w*k)),ph=Math.max(minh,Math.round(h*k));
  const cx=ox+facing*dx*k,cy=oy+(dy-48)*k;
  const x0=Math.round(cx-pw/2),y0=Math.round(cy-ph/2);
  for(let y=y0;y<y0+ph;y++)for(let x=x0;x<x0+pw;x++)buf[y*W+x]=[...col,1];
  return [x0,y0,pw,ph];};
 const eyeY=c.y+1.2;
 for(const ex of [c.x+2.6,c.x+7]){
  const [x0,y0,pw]=rect(ex,eyeY,1.6,3.4,INK,1,2);
  if(k>1.2)buf[y0*W+(facing>0?x0+pw-1:x0)]=[255,255,255,1];
  // brow, slanting down toward the nose
  const bw=Math.max(2,Math.round(2.4*k));
  for(let i=0;i<bw;i++){const xx=Math.round(ox+facing*(ex-1.2)*k)+facing*i;
   const yy=y0-Math.max(2,Math.round(1.6*k))+(i>=bw/2?1:0);buf[yy*W+xx]=[...INK,1];}
 }
 if(k>=1.3){rect(c.x+4.6,c.y+5.6,1.4,0.7,[150,60,70]);}
 if(k>=1.6){rect(c.x+1.2,c.y+4,1.4,0.7,[255,140,160]);}
 // composite
 for(let i=0;i<W*H;i++){const q=buf[i];if(!q)continue;img.data[i*4]=q[0];img.data[i*4+1]=q[1];img.data[i*4+2]=q[2];img.data[i*4+3]=255;}
}

// ---------- neon backdrop (parametric: horizon hz, any aspect) ----------
function backdrop(ctx,W,H,hz){
 const S=Math.min(W,H);
 const bands=[[11,6,32],[22,8,52],[40,12,78],[70,16,100],[118,22,112],[170,30,112],[214,52,110]];
 const bayer=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
 const img=ctx.createImageData(W,H);
 const put=(x,y,c)=>{if(x<0||y<0||x>=W||y>=H)return;const i=(y*W+x)*4;img.data[i]=c[0];img.data[i+1]=c[1];img.data[i+2]=c[2];img.data[i+3]=255;};
 const skyTop=Math.max(0,hz-S*0.6);
 for(let y=0;y<hz;y++){const t=Math.max(0,(y-skyTop)/(hz-skyTop))*(bands.length-1);const b=Math.floor(t),f=t-b;
  for(let x=0;x<W;x++){put(x,y,bands[Math.min(bands.length-1,b+(f*16>bayer[y&3][x&3]?1:0))]);}}
 let s=7;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
 for(let i=0;i<W*hz/450;i++){const x=Math.floor(rnd()*W),y=Math.floor(rnd()*hz*0.6);put(x,y,rnd()>0.7?[255,255,255]:[160,140,220]);}
 const R=Math.round(S*0.2),cx=Math.round(W/2),cy=hz-Math.round(S*0.06);
 for(let y=cy-R;y<=cy+R&&y<hz;y++){const t=(y-(cy-R))/(2*R);
  const gap=t>0.45&&((y-cy+R)%Math.max(4,Math.round(R/5)))<Math.max(1,Math.round((t-0.4)*R/4));if(gap)continue;
  const col=[255,Math.round(214-t*170),Math.round(70+t*80)];
  for(let x=cx-R;x<=cx+R;x++){if((x-cx)**2+(y-cy)**2<=R*R)put(x,y,col);}}
 const mtn=(pts,fill,edge)=>{for(let x=0;x<W;x++){let top=hz;const u=(x-W/2)/S;
   for(let i=0;i<pts.length-1;i++){const [ax,ay]=pts[i],[bx,by]=pts[i+1];if(u>=ax&&u<=bx)top=Math.round(hz-(ay+(by-ay)*((u-ax)/(bx-ax)))*S);}
   for(let y=top;y<hz;y++)put(x,y,fill);if(top<hz)put(x,top,edge);}};
 mtn([[-1.6,.1],[-1.2,.16],[-.95,.08],[-.6,.18],[-.37,.08],[-.25,.14],[-.1,0],[.1,0],[.3,.16],[.46,.1],[.68,.19],[.95,.11],[1.3,.17],[1.6,.09]],[44,14,84],[255,47,191]);
 mtn([[-1.6,.05],[-1.1,.07],[-.75,.03],[-.45,.06],[-.25,.02],[-.1,0],[.1,0],[.3,.05],[.6,.03],[.9,.07],[1.6,.04]],[28,10,60],[63,240,255]);
 for(let y=hz;y<H;y++)for(let x=0;x<W;x++)put(x,y,[18,6,42]);
 const grid=[196,36,160],gridD=[96,20,96],FH=S*0.4;
 for(let i=1;i<60;i++){const y=hz+Math.round(FH*Math.pow(i/13,2.2));if(y>=H)break;for(let x=0;x<W;x++)put(x,y,i<4?gridD:grid);}
 for(let i=-40;i<=40;i++){const xb=cx+i*S/5;for(let y=hz;y<H;y++){const t=(y-hz)/FH;const x=Math.round(cx+(xb-cx)*t);if(t>0.06&&x>=0&&x<W)put(x,y,t<0.2?gridD:grid);}}
 for(let x=0;x<W;x++)put(x,hz,[255,120,220]);
 ctx.putImageData(img,0,0);
 const T=(x,y,w,h,col)=>{ctx.fillStyle=col;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const g=Math.max(1,Math.round(S/180));
 const topY=hz-Math.round(S*0.38),nY=topY+Math.round(S*0.065),hw=S*0.33,pw=S*0.27;
 const shape=(pad,col)=>{
  T(cx-hw-pad,topY-pad,hw*2+2*pad,g+2*pad,col);
  T(cx-hw-pad,topY-g-pad,g*2+2*pad,g+2*pad,col);T(cx+hw-2*g-pad,topY-g-pad,g*2+2*pad,g+2*pad,col);
  T(cx-hw*0.88-pad,nY-pad,hw*1.76+2*pad,g+2*pad,col);
  T(cx-pw-pad,topY-pad,g+2*pad,hz-topY+pad,col);T(cx+pw-pad,topY-pad,g+2*pad,hz-topY+pad,col);
  T(cx-pad,topY-pad,g+2*pad,nY-topY+2*pad,col);};
 shape(2*g,'rgba(255,47,120,0.18)');shape(g,'rgba(255,47,120,0.35)');shape(0,'#ff6f9a');
}

// ---------- move icons (pixel art via the same SDF raster) ----------
const MOVES={attack:{c:[255,59,107],s:[176,24,70],css:'#ff3b6b',label:'Attack'},
 throw:{c:[255,179,33],s:[196,108,20],css:'#ffb321',label:'Throw'},
 block:{c:[63,240,255],s:[20,150,190],css:'#3ff0ff',label:'Block'}};
function iconSdf(move){
 if(move==='attack'){const pts=[];for(let i=0;i<16;i++){const a=i*Math.PI/8-Math.PI/2,r=i%2?2.8:6.4;pts.push([Math.cos(a)*r,Math.sin(a)*r]);}return poly(pts);}
 if(move==='throw'){const ring=(x,y)=>Math.abs(len(x,y)-4.2)-1.3;
  return U(I(ring,(x,y)=>(x>0&&y<0)?1:-1),poly([[0,-7.4],[3.8,-4.2],[0,-1]]));}
 if(move==='block')return poly([[-5.2,-5.8],[5.2,-5.8],[5.2,0],[0,6.4],[-5.2,0]]);
 if(move==='?'){return U(capsule(-2.3,-3,0,-5,1.3),capsule(0,-5,2.4,-3,1.3),capsule(2.4,-3,0,0,1.3),capsule(0,0,0,1.5,1.3),circle(0,4.8,1.4));}
}
// draws a round badge with an icon into an ImageData at (cx,cy), radius r px
function badge(img,W,H,cx,cy,move,r){
 const buf=new Array(W*H).fill(null);
 const k=r/9;
 const raster=(f,base,shade,ink=true)=>{for(let py=Math.floor(cy-r-2);py<cy+r+2;py++)for(let px=Math.floor(cx-r-2);px<cx+r+2;px++){
   if(px<0||py<0||px>=W||py>=H)continue;const X=(px+0.5-cx)/k,Y=(py+0.5-cy)/k,d=f(X,Y)*k;
   if(d<0){let col=base;if(shade&&f(X+0.9/k,Y+1.2/k)>=0)col=shade;buf[py*W+px]=col;}else if(ink&&d<1)buf[py*W+px]=INK;}};
 const m=MOVES[move]||{c:[242,236,255],s:[150,130,200]};
 raster(circle(0,0,8.6),[36,20,70],null);
 raster((x,y)=>Math.abs(len(x,y)-7.6)-0.9,m.c,null,false);
 raster(iconSdf(move),m.c,m.s);
 for(let i=0;i<W*H;i++){const q=buf[i];if(!q)continue;img.data[i*4]=q[0];img.data[i*4+1]=q[1];img.data[i*4+2]=q[2];img.data[i*4+3]=255;}
}
function iconCanvas(move,px){ // standalone icon for buttons
 const n=20,cv=document.createElement('canvas');cv.width=n;cv.height=n;const ctx=cv.getContext('2d');const img=ctx.createImageData(n,n);
 const buf=new Array(n*n).fill(null),k=1.3,f=iconSdf(move),m=MOVES[move];
 for(let py=0;py<n;py++)for(let px=0;px<n;px++){const X=(px+0.5-n/2)/k,Y=(py+0.5-n/2)/k,d=f(X,Y)*k;
  if(d<0)buf[py*n+px]=f(X+0.9/k,Y+1.2/k)>=0?m.s:m.c;else if(d<1)buf[py*n+px]=INK;}
 for(let i=0;i<n*n;i++){const q=buf[i];if(!q)continue;img.data[i*4]=q[0];img.data[i*4+1]=q[1];img.data[i*4+2]=q[2];img.data[i*4+3]=255;}
 ctx.putImageData(img,0,0);cv.style.width=cv.style.height=px+'px';cv.style.imageRendering='pixelated';return cv;
}
function spark(img,W,cx,cy,r){
 const put=(x,y,c)=>{const i=(y*W+x)*4;img.data[i]=c[0];img.data[i+1]=c[1];img.data[i+2]=c[2];img.data[i+3]=255;};
 for(let a=0;a<8;a++){const ang=a*Math.PI/4+Math.PI/8,L=a%2?r:r*0.6;
  for(let t=2;t<L;t++){put(Math.round(cx+Math.cos(ang)*t),Math.round(cy+Math.sin(ang)*t),t<L*0.5?[255,255,255]:[255,214,90]);}}
 for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++)if(x*x+y*y<=4)put(cx+x,cy+y,[255,255,255]);
}
