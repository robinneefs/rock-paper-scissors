// Menu screens drawn on the 216x288 monitor canvas: logo intro, home menu, result menu.
// Pixel-perfect: whole pixels only, text from the 5x7 bitmap font (pixfont.js), fades in palette steps.
// Needs art.js (backdrop, drawFighter, INK) and pixfont.js loaded first.
const SCREENS=(()=>{
const MW=216,MH=288,GY=232;
const C={ink:'#1a0f2e',txt:'#f6f0ff',pink:'#ff2fbf',cyan:'#3ff0ff',gold:'#ffb321',dim:'#6e6096',panel:'#140a2a',sel:'#3a1458',shadow:'#5a0b4a'};
const fill=(ctx,x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
const frame=(ctx,x,y,w,h,c)=>{fill(ctx,x,y,w,1,c);fill(ctx,x,y+h-1,w,1,c);fill(ctx,x,y,1,h,c);fill(ctx,x+w-1,y,1,h,c);};

// fighters are rasterised once per pose into small sprites, then blitted
const cache={};
function fighter(who,pose){const key=who+pose;if(cache[key])return cache[key];
 const W=84,H=74,cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d'),img=c.createImageData(W,H);
 drawFighter(img,W,H,who,42,72,64/48,who==='p1'?1:-1,pose);c.putImageData(img,0,0);return cache[key]=cv;}
function putFighter(ctx,who,pose,x,gy){ctx.fillStyle='rgba(5,0,20,0.6)';ctx.fillRect(Math.round(x-15),gy-1,30,3);ctx.drawImage(fighter(who,pose),Math.round(x-42),gy-72);}

let bgCache=null;
function stage(ctx){if(!bgCache){bgCache=document.createElement('canvas');bgCache.width=MW;bgCache.height=MH;backdrop(bgCache.getContext('2d'),MW,MH,150);}ctx.drawImage(bgCache,0,0);}

// CRT scanlines + rounded corners, same as the fight mock-ups
function crt(ctx){const img=ctx.getImageData(0,0,MW,MH),d=img.data;
 for(let y=0;y<MH;y+=2)for(let x=0;x<MW;x++){const i=(y*MW+x)*4;d[i]*=0.86;d[i+1]*=0.86;d[i+2]*=0.86;}
 for(let y=0;y<4;y++)for(let x=0;x<4-y;x++)for(const [ax,ay] of [[x,y],[MW-1-x,y],[x,MH-1-y],[MW-1-x,MH-1-y]]){const i=(ay*MW+ax)*4;d[i]=24;d[i+1]=16;d[i+2]=40;}
 ctx.putImageData(img,0,0);}

// A menu is data: [{label, tag?, enabled}]. Returns each item's rect so taps can hit-test it.
function menu(ctx,items,sel,y,o={}){const w=o.w||136,x=Math.round((MW-w)/2),ih=17,gap=4,pad=6,blink=o.blink??true;
 const h=pad*2+items.length*ih+(items.length-1)*gap;
 fill(ctx,x-1,y-1,w+2,h+2,C.ink);fill(ctx,x,y,w,h,C.panel);frame(ctx,x,y,w,h,'#4a2f86');
 const rects=[];
 items.forEach((it,i)=>{const iy=y+pad+i*(ih+gap),ix=x+pad,iw=w-pad*2,on=i===sel&&it.enabled!==false;
  if(on){fill(ctx,ix,iy,iw,ih,C.sel);frame(ctx,ix,iy,iw,ih,C.pink);fill(ctx,ix+1,iy+ih,iw,1,C.shadow);
   if(blink)PIXFONT.draw(ctx,'>',ix+4,iy+5,C.gold);}
  else frame(ctx,ix,iy,iw,ih,it.enabled===false?'#2c1d50':'#3b2768');
  const col=it.enabled===false?C.dim:on?'#ffffff':C.txt;
  PIXFONT.draw(ctx,it.label,ix+13,iy+5,col,on?{shadow:C.ink}:{});
  if(it.tag)PIXFONT.draw(ctx,it.tag,ix+iw-4,iy+5,it.enabled===false?'#8c6a2a':C.cyan,{align:'right'});
  rects.push({x:ix,y:iy,w:iw,h:ih,i});});
 return {rects,bottom:y+h};}

// ---- 1. logo intro: level 0..4 (0 = black, 4 = full). Fades in palette steps, never smooth alpha.
function logo(ctx,level){
 fill(ctx,0,0,MW,MH,'#07040f');if(level<=0)return;
 const k=level/4,q=(r,g,b)=>`rgb(${Math.round(r*k)},${Math.round(g*k)},${Math.round(b*k)})`;
 const cx=108,cy=112;
 // emblem: a pixel diamond with a star, the placeholder for the studio mark
 for(let r=0;r<=22;r++){const w=22-r;for(const s of [-1,1]){fill(ctx,cx-w,cy+s*r,1,1,q(255,47,191));fill(ctx,cx+w,cy+s*r,1,1,q(63,240,255));}}
 for(let r=0;r<=18;r++){const w=18-r;for(const s of [-1,1])fill(ctx,cx-w,cy+s*r,w*2+1,1,q(40+r*3,14,70+r*2));}
 const star=['00100','00100','11111','01110','01010'];for(let y=0;y<5;y++)for(let x=0;x<5;x++)if(star[y][x]==='1')fill(ctx,cx-10+x*4,cy-10+y*4,4,4,q(255,214,90));
 PIXFONT.draw(ctx,'YOUR STUDIO',cx,cy+34,q(246,240,255),{align:'center',scale:2,shadow:q(90,11,74)});
 PIXFONT.draw(ctx,'PLACEHOLDER LOGO',cx,cy+56,q(140,124,190),{align:'center'});}

// ---- 2. home menu
const HOME_ITEMS=[{label:'START GAME',tag:'VS CPU',enabled:true},{label:'ONLINE',tag:'SOON',enabled:false}];
function home(ctx,sel=0,t=0){stage(ctx);
 PIXFONT.draw(ctx,'RPS',108,24,C.pink,{align:'center',scale:4,outline:C.ink,shadow:C.shadow});
 PIXFONT.draw(ctx,'FIGHTER',108,60,C.cyan,{align:'center',scale:2,shadow:C.ink});
 PIXFONT.draw(ctx,'ATTACK · THROW · BLOCK',108,80,C.gold,{align:'center',shadow:C.ink});
 const bob=Math.floor(t/420)%2;
 putFighter(ctx,'p1','idle',46,270+bob);putFighter(ctx,'p2','idle',170,270+1-bob);
 const m=menu(ctx,HOME_ITEMS,sel,140,{blink:Math.floor(t/400)%2===0});
 fill(ctx,0,m.bottom+5,MW,13,'rgba(10,4,24,0.75)');
 PIXFONT.draw(ctx,'STICK MOVES · BUTTON SELECTS',108,m.bottom+8,'#c9b8ff',{align:'center',shadow:C.ink});
 return m;}

// ---- 3. result menu (shown over the frozen last frame of the fight)
const RESULT_ITEMS=[{label:'RETRY',enabled:true},{label:'MAIN MENU',enabled:true}];
function result(ctx,o={},t=0){const win=o.win??true,sc=o.score||[2,1],sel=o.sel??0;
 stage(ctx);
 putFighter(ctx,'p1',win?'attack':'block',84,GY);putFighter(ctx,'p2',win?'block':'attack',132,GY);
 ctx.fillStyle='rgba(10,4,24,0.62)';ctx.fillRect(0,0,MW,156);
 PIXFONT.draw(ctx,win?'YOU WIN!':'CPU WINS',108,26,win?C.gold:C.pink,{align:'center',scale:3,outline:C.ink,shadow:win?'#b3165f':C.shadow});
 PIXFONT.draw(ctx,`${sc[0]} - ${sc[1]}`,108,58,C.txt,{align:'center',scale:2,shadow:C.ink});
 PIXFONT.draw(ctx,'ROUNDS',108,76,C.cyan,{align:'center'});
 const m=menu(ctx,RESULT_ITEMS,sel,96,{w:112,blink:Math.floor(t/400)%2===0});
 return m;}

return {MW,MH,GY,C,fill,frame,crt,menu,logo,home,result,putFighter,stage,HOME_ITEMS,RESULT_ITEMS};})();
