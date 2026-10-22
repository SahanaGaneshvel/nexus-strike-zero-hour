
/* ================= CHARACTERS ================= */
function makeCharacter(visorColor,accentColor,style,holo){
  const g=new THREE.Group();const ac=new THREE.Color(accentColor);const mats=[];
  const H=holo?new THREE.MeshBasicMaterial({color:accentColor,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false}):null;
  const std=o=>{const m=new THREE.MeshStandardMaterial(Object.assign({envMap:ENV,emissive:0x000000},o));mats.push(m);return m;};
  const suit=H||std({color:0x141925,roughness:.85,metalness:.15});
  const armor=H||std({color:ac.clone().multiplyScalar(.3).add(new THREE.Color(0x1a2030)),roughness:.3,metalness:.82});
  const metal=H||std({color:0x3a4558,roughness:.3,metalness:.9});
  const dark=H||std({color:0x0a0d14,roughness:.5,metalness:.6});
  const glow=new THREE.MeshBasicMaterial({color:visorColor});
  const accent=H||new THREE.MeshBasicMaterial({color:accentColor});
  const fin=m=>{m.castShadow=!holo;return m;};
  const at=(me,x,y,z,p,r,s)=>{me.position.set(x,y,z);if(r)me.rotation.set(r[0],r[1],r[2]);if(s)me.scale.set(s[0],s[1],s[2]);(p||g).add(fin(me));return me;};
  const box=(w,h,d,x,y,z,m,p,r,s)=>at(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m),x,y,z,p,r,s);
  const cyl=(rt,rb,h,x,y,z,m,p,r,s,seg)=>at(new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||12),m),x,y,z,p,r,s);
  const sph=(rad,x,y,z,m,p,s,r)=>at(new THREE.Mesh(new THREE.SphereGeometry(rad,16,12),m),x,y,z,p,r,s);
  const grp=(x,y,z,p)=>{const o=new THREE.Group();o.position.set(x,y,z);(p||g).add(o);return o;};
  const heavy=style==='heavy',slim=style==='marksman';
  const bw=heavy?1.2:slim?.92:1;
  const leg=(sx)=>{
    const hip=grp(sx*.11*bw,.95,0);
    cyl(.085*bw,.068*bw,.42,0,-.21,0,suit,hip);box(.13*bw,.2,.05,0,-.16,-.075,armor,hip,[.1,0,0]);
    const knee=grp(0,-.43,0,hip);
    sph(.066,0,0,-.035,armor,knee,[1,1,.75]);cyl(.068,.052,.4,0,-.2,0,suit,knee);box(.1*bw,.28,.05,0,-.17,-.06,armor,knee);
    box(.125*bw,.1,.25,0,-.45,-.045,dark,knee);box(.127*bw,.022,.25,0,-.49,-.045,accent,knee);
    return {hip,knee};
  };
  const L=leg(-1),R=leg(1);
  cyl(.17*bw,.15*bw,.18,0,.98,0,suit,null,null,[1,1,.75],10);
  box(.37*bw,.06,.25,0,1.04,0,dark);box(.07,.045,.02,0,1.04,-.128,accent);
  cyl(.15*bw,.17*bw,.2,0,1.14,0,suit,null,null,[1,1,.72],10);
  cyl(.25*bw,.17*bw,.36,0,1.37,0,suit,null,null,[1,1,.66],10);
  box(.36*bw,.25,heavy?.14:.08,0,1.4,-.12,armor,null,[-.08,0,0]);
  box(.022,.17,.012,-.09*bw,1.41,-.17-(heavy?.03:0),accent,null,[-.08,0,0]);box(.022,.17,.012,.09*bw,1.41,-.17-(heavy?.03:0),accent,null,[-.08,0,0]);
  box(.24*bw,.06,.2,0,1.56,0,armor);cyl(.05,.06,.08,0,1.6,0,dark);
  const head=grp(0,1.67,0);
  sph(.135,0,0,0,armor,head,[1,1.08,1.12]);
  sph(.118,0,-.008,-.045,glow,head,[1.05,slim?.22:.4,.96]);
  box(.17,.06,.1,0,-.095,-.07,dark,head);
  cyl(.045,.045,.03,.14,0,0,metal,head,[0,0,Math.PI/2]);cyl(.045,.045,.03,-.14,0,0,metal,head,[0,0,Math.PI/2]);
  const pS=heavy?1.55:slim?.75:1;
  sph(.1,.27*bw,1.5,0,armor,null,[1.1*pS,.8*pS,pS]);sph(.1,-.27*bw,1.5,0,armor,null,[1.1*pS,.8*pS,pS]);
  const arm=(sx,ux,uz,ex)=>{
    const sh=grp(sx*.25*bw,1.47,0);sh.rotation.set(ux,0,uz);
    cyl(.056,.05,.28,0,-.14,0,suit,sh);
    const el=grp(0,-.28,0,sh);el.rotation.x=ex;
    sph(.05,0,0,-.01,armor,el);cyl(.05,.044,.26,0,-.13,0,suit,el);
    box(.095,.15,.095,0,-.15,0,armor,el);box(.1,.02,.1,0,-.09,0,accent,el);box(.07,.085,.09,0,-.29,-.01,dark,el);
    return {sh,el};
  };
  const AR=arm(1,.6,-.3,1.0),AL=arm(-1,1.05,.55,.45);
  const gun=grp(.08,1.27,-.36);
  const gl=slim?.7:heavy?.5:.42;
  box(.065,.1,gl,0,0,0,dark,gun);box(.05,.065,.2,0,.005,-gl/2-.08,metal,gun);
  if(heavy){cyl(.05,.05,.3,0,.0,-.32,metal,gun,[Math.PI/2,0,0]);box(.1,.16,.12,0,-.13,-.04,metal,gun);}
  else box(.04,.14,.07,0,-.11,-.06,metal,gun,[-.15,0,0]);
  if(slim){cyl(.03,.03,.24,0,.09,-.02,dark,gun,[Math.PI/2,0,0]);}
  box(.067,.012,gl*.7,0,.03,-.06,glow,gun);
  const tip=new THREE.Object3D();tip.position.set(0,.01,-gl/2-.25);gun.add(tip);
  const fl=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.flash,color:0xffd090,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));fl.scale.set(.5,.5,1);fl.visible=false;tip.add(fl);
  if(heavy){
    box(.46,.46,.2,0,1.33,.22,armor);box(.32,.05,.02,0,1.42,.33,accent);box(.32,.05,.02,0,1.28,.33,accent);
    box(.04,.07,.26,0,.17,-.01,armor,head);box(.045,.02,.22,0,.21,-.02,accent,head);
    box(.08,.06,.32,.33*bw+.09,1.57,0,armor);box(.08,.06,.32,-.33*bw-.09,1.57,0,armor);
  }else if(slim){
    const hood=new THREE.Mesh(new THREE.SphereGeometry(.17,16,12,0,TAU,0,Math.PI*.62),suit);at(hood,0,.02,.025,head,[-.25,0,0],[1.05,1.1,1.15]);
    box(.36,.55,.025,0,.78,.14,suit,null,[.12,0,0]);box(.025,.55,.02,.17,.78,.135,accent,null,[.12,0,0]);box(.025,.55,.02,-.17,.78,.135,accent,null,[.12,0,0]);
    box(.16,.24,.08,0,1.36,.17,dark);
  }else{
    box(.3,.34,.14,0,1.34,.2,armor);box(.24,.03,.01,0,1.36,.275,glow);
    cyl(.008,.008,.38,.09,1.66,.24,metal,null,[-.15,0,0]);sph(.022,.09,1.86,.27,glow);
  }
  // awareness marker: a small glowing chevron above the head, hidden until the enemy notices you
  return {g,legL:L.hip,legR:R.hip,kneeL:L.knee,kneeR:R.knee,armR:AR.sh,armL:AL.sh,head,gun,tip,flash:fl,glow,mats};
}
function makeDrone(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.OctahedronGeometry(.22,0),MT.car);body.scale.set(1.3,.6,1.6);g.add(body);
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),new THREE.MeshBasicMaterial({color:0x38e8ff}));eye.position.set(0,0,-.3);g.add(eye);
  const rotors=[];for(const p of [[-.32,-.3],[.32,-.3],[-.32,.3],[.32,.3]]){const arm=new THREE.Mesh(new THREE.BoxGeometry(.04,.03,.34),MT.metal);arm.position.set(p[0]/2,0,p[1]/2);arm.lookAt(0,0,0);g.add(arm);
    const r=new THREE.Mesh(new THREE.CircleGeometry(.13,16),new THREE.MeshBasicMaterial({color:0x9ff4ff,transparent:true,opacity:.35,side:THREE.DoubleSide}));r.rotation.x=-Math.PI/2;r.position.set(p[0],.06,p[1]);g.add(r);rotors.push(r);}
  g.userData={eye,rotors};scene.add(g);return g;
}

/* ================= WEAPONS & VIEWMODEL ================= */
const WEAPONS={
  lancer:{id:'lancer',model:'rifle',name:'VX-9 Lancer',dmg:30,head:3.4,rpm:640,mag:30,reserve:180,auto:true,spread:.0035,moveSpread:.05,bloom:.003,recoil:.016,reload:2.2,ads:1.45},
  marrow:{id:'marrow',model:'pistol',name:'M-7 Marrow',dmg:34,head:3,rpm:380,mag:12,reserve:72,auto:false,spread:.005,moveSpread:.03,bloom:.006,recoil:.024,reload:1.4,ads:1.15}
};
const VM={root:new THREE.Group(),gun:null,kind:null,kick:0,mx:0,my:0,flashT:0,sprint:0,inspect:0};
vmScene.add(VM.root);
const sleeveMat=new THREE.MeshStandardMaterial({color:0x151a26,roughness:.8,metalness:.15});
const vmArmor=new THREE.MeshStandardMaterial({color:0x1d3a4e,roughness:.3,metalness:.85});
const vmGlow=new THREE.MeshBasicMaterial({color:0x38e8ff});
function buildGun(kind){
  const g=new THREE.Group();
  const B=(w,h,d,x,y,z,m,rx)=>{const me=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);me.position.set(x,y,z);me.rotation.x=rx||0;g.add(me);return me;};
  const C=(r,l,x,y,z,m)=>{const me=new THREE.Mesh(new THREE.CylinderGeometry(r,r,l,14),m);me.rotation.x=Math.PI/2;me.position.set(x,y,z);g.add(me);return me;};
  let mz,mag,lh;
  if(kind==='rifle'){
    B(.07,.1,.42,0,0,0,MT.gunDark);B(.058,.072,.26,0,.006,-.32,MT.gunMid);C(.014,.13,0,.012,-.5,MT.gunDark);C(.022,.05,0,.012,-.58,MT.gunMid);
    B(.06,.09,.22,0,-.006,.3,MT.gunMid);B(.045,.12,.055,0,-.1,.09,MT.gunDark,.3);mag=B(.046,.16,.075,0,-.12,-.07,MT.gunMid,-.18);
    B(.032,.05,.12,0,.078,-.02,MT.gunDark);B(.02,.018,.03,0,.11,-.07,skinMat);B(.074,.012,.3,0,.024,-.1,skinMat);B(.074,.03,.04,0,-.03,-.42,skinMat);
    B(.012,.03,.08,.04,.0,-.2,skinMat);
    mz=-.62;lh=[0,-.07,-.3];
  }else{
    B(.042,.058,.21,0,.02,-.02,MT.gunMid);B(.04,.036,.18,0,-.016,-.01,MT.gunDark);B(.038,.13,.055,0,-.08,.06,MT.gunDark,.3);
    mag=B(.03,.1,.04,0,-.11,.07,MT.gunMid,.3);B(.044,.01,.16,0,.05,-.03,skinMat);B(.012,.012,.012,0,.056,-.11,skinMat);
    mz=-.14;lh=[-.02,-.1,.07];
  }
  const muzzle=new THREE.Object3D();muzzle.position.set(0,.012,mz);g.add(muzzle);
  const eject=new THREE.Object3D();eject.position.set(.045,.03,-.02);g.add(eject);
  B(.075,.085,.11,.005,-.1,.1,MT.glove,.3);B(.078,.02,.06,.005,-.055,.075,vmArmor,.3);
  const fore=(px,py,pz,rx,ry,len)=>{const a=new THREE.Group();a.position.set(px,py,pz);a.rotation.set(rx,ry,0);g.add(a);
    const sl=new THREE.Mesh(new THREE.CylinderGeometry(.046,.052,len,12),sleeveMat);sl.rotation.x=Math.PI/2;sl.position.z=len/2;a.add(sl);
    const pl=new THREE.Mesh(new THREE.BoxGeometry(.1,.07,len*.55),vmArmor);pl.position.set(0,.025,len*.3);a.add(pl);
    const gl=new THREE.Mesh(new THREE.BoxGeometry(.012,.012,len*.5),vmGlow);gl.position.set(.03,.062,len*.3);a.add(gl);const gl2=gl.clone();gl2.position.x=-.03;a.add(gl2);
    const cuff=new THREE.Mesh(new THREE.TorusGeometry(.052,.01,6,16),vmGlow);cuff.position.z=len*.62;a.add(cuff);};
  fore(.01,-.13,.14,.35,-.15,.36);
  B(.075,.08,.11,lh[0],lh[1],lh[2],MT.glove);B(.08,.02,.07,lh[0],lh[1]+.045,lh[2],vmArmor);
  fore(lh[0]-.03,lh[1]-.03,lh[2]+.05,.3,.45,.4);
  const fl=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.flash,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));fl.scale.set(.22,.22,1);fl.visible=false;muzzle.add(fl);
  g.userData={muzzle,eject,mag,magY:mag.position.y,flash:fl};
  return g;
}
function setViewmodel(kind){if(VM.kind===kind&&VM.gun)return;if(VM.gun)VM.root.remove(VM.gun);VM.gun=buildGun(kind);VM.gun.scale.setScalar(.8);VM.kind=kind;VM.root.add(VM.gun);}
function vmWorld(obj,out){VM.root.updateMatrixWorld(true);obj.getWorldPosition(out);camera.updateMatrixWorld();return camera.localToWorld(out);}

/* ================= PLAYER ================= */
let P=null,M=null;
const EN=[];
const pickups=[];
const keys={},mouse={left:false,right:false};
let mode='boot',locked=false,lockFailed=false,lockFails=0;
let timeScale=1,slowT=0,PM=null;
const DRONE={on:false,k:0,pos:new V3(),look:new V3()};
function newPlayer(){
  return {isPlayer:true,pos:new V3(),vel:new V3(),yaw:0,pitch:0,hp:100,armor:50,alive:true,onGround:true,crouch:0,
    w:{1:{def:WEAPONS.lancer,mag:30,reserve:180},2:{def:WEAPONS.marrow,mag:12,reserve:72}},slot:1,
    fireCD:0,spray:0,recoilP:0,recoilY:0,reloading:false,reloadT:0,switchT:0,ads:0,trigLatch:false,stepT:0,bobT:0,jumpCD:0,sprinting:false,
    ab:{q:{cd:0,max:7},e:{cd:0,max:18},x:{cd:0,max:22}},phaseT:0,phaseDir:new V3(),aegisT:0,interact:null,holdT:0,
    onLand(v){if(v<-6){SFX.land();VM.kick=Math.min(1.4,-v*.08);}}};
}
const curW=()=>P.w[P.slot];
function requestLock(fromClick){
  const fail=()=>{if(fromClick&&++lockFails>=2)lockFailed=true;};
  if(!canvas.requestPointerLock){lockFailed=true;return;}
  try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(fail);}catch(e){fail();}
}
document.addEventListener('pointerlockchange',()=>{
  locked=document.pointerLockElement===canvas;
  if(locked){lockFailed=false;lockFails=0;}
  else if(mode==='play')pauseGame();
});
function startReload(){
  const w=curW();if(P.reloading||w.mag>=w.def.mag||(w.reserve<=0&&!M.range)||!P.alive)return;
  P.reloading=true;P.reloadT=w.def.reload;VM.inspect=0;SFX.reload();
}
function switchTo(slot){if(!P.alive||P.slot===slot)return;P.slot=slot;P.reloading=false;P.switchT=.4;P.spray=0;VM.inspect=0;SFX.swap();setViewmodel(curW().def.model);}
function castShot(origin,dir,maxD){
  const o=[origin.x,origin.y,origin.z],d=[dir.x,dir.y,dir.z];
  let best={t:maxD,type:null};
  if(d[1]<0){const t=-o[1]/d[1];if(t<best.t)best={t,type:'ground'};}
  for(const c of colliders){if(!c.alive)continue;const h=rayBox(o,d,c.min,c.max,best.t);if(h&&h.t<best.t)best={t:h.t,type:'world',col:c,axis:h.axis,sign:h.sign};}
  for(const e of EN){
    if(!e.alive)continue;const hy=e.pos.y+lerp(1.67,1.24,e.crouch)*(e.scale||1);
    const th=raySphere(o,d,T3.set(e.pos.x,hy,e.pos.z),.17*(e.scale||1),best.t);if(th!==null&&th<best.t)best={t:th,type:'enemy',e,head:true};
    const r=.3*(e.scale||1);const hb=rayBox(o,d,[e.pos.x-r,e.pos.y,e.pos.z-r],[e.pos.x+r,hy-.15,e.pos.z+r],best.t);if(hb&&hb.t<best.t)best={t:hb.t,type:'enemy',e,head:false};
  }
  return best;
}
function fire(w){
  const def=w.def;w.mag--;P.fireCD=60/def.rpm;P.trigLatch=true;VM.inspect=0;
  const hs=Math.hypot(P.vel.x,P.vel.z);
  let spread=def.spread+def.moveSpread*Math.min(1,hs/5.4)+(P.onGround?0:.08)+Math.min(P.spray,12)*def.bloom;
  spread*=lerp(1,.6,P.crouch)*lerp(1,.7,P.ads);
  camera.updateMatrixWorld();
  const dir=new V3(gauss()*spread,gauss()*spread,-1).normalize().applyQuaternion(camera.quaternion);
  const origin=camera.getWorldPosition(new V3());
  const hit=castShot(origin,dir,250);
  const end=origin.clone().addScaledVector(dir,hit.t);
  handleHit(hit,end,dir,def);
  const mz=vmWorld(VM.gun.userData.muzzle,new V3());
  tracer(mz,end,0xfff0c0);
  SFX.shot(def.id,null);
  VM.flashT=.05;lightFlash(mz,0xffb060,2.4,9,.06);vmFlash.intensity=2;
  const ej=vmWorld(VM.gun.userData.eject,new V3());
  shell(ej,new V3(rand(1.2,2),rand(1.5,2.5),rand(-.3,.3)).applyQuaternion(camera.quaternion).add(P.vel));
  P.recoilP+=def.recoil*(1+Math.min(P.spray,8)*.09);
  P.recoilY+=(Math.random()-.5)*def.recoil*.8+(P.spray>5?Math.sin(P.spray*.6)*def.recoil*.35:0);
  P.recoilP=Math.min(P.recoilP,.3);P.spray++;VM.kick=1;
  M.stats.shots++;
  // gunfire is loud: nearby enemies investigate
  for(const e of EN)if(e.alive&&e.state!=='combat'&&!e.dummy&&e.pos.distanceTo(P.pos)<34){e.aware=Math.max(e.aware,.65);e.lastKnown.copy(P.pos);e.lkT=8;if(e.state==='patrol')setState(e,'suspicious');}
  if(w.mag===0)setTimeout(()=>{if(P&&P.alive&&curW()===w)startReload();},220);
}
function handleHit(hit,end,dir,def){
  if(hit.type==='enemy'){
    const e=hit.e;const dmg=def.dmg*(hit.head?def.head:1);
    damageEnemy(e,dmg,hit.head,end,dir);
  }else if(hit.type==='world'){
    const c=hit.col;const n=new V3();n.setComponent(hit.axis,hit.sign);
    if(c.kind==='glass')shatter(c,end);
    else if(c.kind==='barrel')hitBarrel(c,def.dmg);
    else{decal(end,n);sparks(end,n,6,0xffd27a,4,9,.3);if(Math.random()<.3)puff(end,n.clone().multiplyScalar(.6),.5,.6,0x6a7488,.4);}
  }else if(hit.type==='ground'){
    const n=new V3(0,1,0);decal(end,n);sparks(end,n,5,0xb0c0d8,2.5,9,.35);
  }
}
function shatter(c,p){
  if(!c.alive)return;c.alive=false;c.mesh.visible=false;
  const cx=(c.min[0]+c.max[0])/2,cz=(c.min[2]+c.max[2])/2,w=Math.max(c.max[0]-c.min[0],c.max[2]-c.min[2]);
  const along=c.max[0]-c.min[0]>c.max[2]-c.min[2];
  for(let i=0;i<12;i++)sparks(new V3(along?cx+rand(-w/2,w/2):cx,rand(.3,c.max[1]),along?cz:cz+rand(-w/2,w/2)),null,8,0xbff4ff,3,9,1.2);
  SFX.glass(p);rebuildNav();
  for(const e of EN)if(e.alive&&e.state!=='combat'&&e.pos.distanceTo(p)<25){e.aware=Math.max(e.aware,.5);e.lastKnown.copy(p);e.lkT=6;if(e.state==='patrol')setState(e,'suspicious');}
}
function hitBarrel(c,dmg){if(!c.alive)return;c.hp-=dmg;sparks(new V3((c.min[0]+c.max[0])/2,.9,(c.min[2]+c.max[2])/2),null,6,0xffb03a,3,6,.4);if(c.hp<=0)explodeBarrel(c);}
function explodeBarrel(c){
  if(!c.alive)return;c.alive=false;c.group.visible=false;rebuildNav();
  explosion(new V3((c.min[0]+c.max[0])/2,.6,(c.min[2]+c.max[2])/2),6,130,true);
}
function explosion(p,radius,dmg,fromPlayer){
  pulseFx(p,0xffb03a,radius,.6,.7);pulseFx(p,0xff3d6e,radius*.6,.4,.6);sparks(p,null,90,0xffc24a,11,7,1.1);
  for(let i=0;i<8;i++)puff(p.clone().add(new V3(gauss(),rand(0,1),gauss())),new V3(gauss(),rand(1,2.5),gauss()),rand(2.5,4),rand(2.5,4),0x3a3f4c,.75);
  lightFlash(p.clone().setY(2),0xffa040,8,24,.6);SFX.boom(p);decal(new V3(p.x,.02,p.z),new V3(0,1,0),26);
  const dc=camera.position.distanceTo(p);if(dc<30)shake(.05*(1-dc/30)+.01,.6);
  for(const e of EN){if(!e.alive)continue;const d=e.pos.distanceTo(p);if(d<radius)damageEnemy(e,dmg*(1-d/radius)+20,false,e.pos.clone().setY(1),null,true);}
  if(P.alive){const d=P.pos.distanceTo(p);if(d<radius)damagePlayer(dmg*.6*(1-d/radius),p);}
  for(const b of W.barrels)if(b.alive&&new V3((b.min[0]+b.max[0])/2,.6,(b.min[2]+b.max[2])/2).distanceTo(p)<radius*.8)setTimeout(()=>explodeBarrel(b),rand(120,300));
  for(const g of W.glass)if(g.alive&&new V3((g.min[0]+g.max[0])/2,1.5,(g.min[2]+g.max[2])/2).distanceTo(p)<radius+2)shatter(g,p);
}
function hitMarker(head,kill){const h=$('#hitm');h.className='on'+(head?' head':'')+(kill?' kill':'');clearTimeout(h._t);h._t=setTimeout(()=>h.className='',kill?280:120);}
function damagePlayer(amount,srcPos){
  if(!P.alive||mode!=='play')return;
  if(P.phaseT>0)return;
  if(P.aegisT>0){const hx=$('#hex');hx.classList.add('hit');clearTimeout(hx._t);hx._t=setTimeout(()=>hx.classList.remove('hit'),90);SFX.shieldHit();M.stats.blocked+=amount;return;}
  amount*=M.range?.5:D().dmg;
  if(P.armor>0){const a=Math.min(P.armor,amount*.6);P.armor-=a;amount-=a;}
  P.hp-=amount;M.stats.dmgTaken+=amount;
  SFX.hurt();const f=$('#flash');f.style.transition='none';f.style.opacity=Math.min(1,.4+amount/30);requestAnimationFrame(()=>{f.style.transition='opacity .6s';f.style.opacity=0;});
  shake(.012,.15);
  if(srcPos){const a=yawTo(srcPos.x-P.pos.x,srcPos.z-P.pos.z),rel=angDiff(P.yaw,a);
    const el=document.createElement('div');el.className='dd';el.style.transform=`rotate(${-rel}rad)`;$('#dmgDir').appendChild(el);
    requestAnimationFrame(()=>requestAnimationFrame(()=>el.style.opacity=0));setTimeout(()=>el.remove(),900);}
  if(P.hp<=0){P.hp=0;playerDied('down');}
}

/* ================= ABILITIES ================= */
function useAbility(k){
  if(!P.alive||mode!=='play')return;
  const ab=P.ab[k];if(ab.cd>0){SFX.deny();return;}
  const mult=M.range?.35:1;
  if(k==='q'){
    let fx=0,fz=0;if(keys.KeyW)fz+=1;if(keys.KeyS)fz-=1;if(keys.KeyD)fx+=1;if(keys.KeyA)fx-=1;if(!fx&&!fz)fz=1;
    const sy=Math.sin(P.yaw),cy=Math.cos(P.yaw);const d=new V3(-sy*fz+cy*fx,0,-cy*fz-sy*fx).normalize();
    P.phaseDir.copy(d);P.phaseT=.22;SFX.phase();
    const fx2=$('#fx');fx2.className='phase';setTimeout(()=>{if(fx2.className==='phase')fx2.className='';},260);
    for(let i=0;i<6;i++)sparks(P.pos.clone().setY(rand(.4,1.6)),d.clone().negate(),4,0x7ff4ff,3,0,.5);
  }else if(k==='e'){
    const c=P.pos.clone().setY(1.2);
    pulseFx(c,0x38e8ff,10,.7,.6);pulseFx(c,0xffffff,4,.25,.5);sparks(c,null,90,0x7fe8ff,9,3,.8);SFX.emp(c);lightFlash(c,0x38e8ff,6,20,.5);
    const fx2=$('#fx');fx2.className='emp';setTimeout(()=>{if(fx2.className==='emp')fx2.className='';},200);
    let n=0;for(const e of EN)if(e.alive&&e.pos.distanceTo(P.pos)<10){e.stunT=3.5;e.aimT=0;n++;if(!e.dummy&&e.state!=='combat')enterCombat(e);}
    for(const l of W.lights.city)if(l.position.distanceTo(P.pos)<25)l.userData.flicker=1.2;
    if(n)toast(`EMP · ${n} disabled`);
  }else if(k==='x'){
    P.aegisT=4;SFX.shieldUp();$('#hex').classList.add('on');pulseFx(P.pos.clone().setY(1),0xffc24a,2.2,.5,.5);
  }
  ab.cd=ab.max*mult;
}
function updateAbilities(dt){
  for(const k in P.ab)if(P.ab[k].cd>0)P.ab[k].cd=Math.max(0,P.ab[k].cd-dt);
  if(P.aegisT>0){P.aegisT-=dt;if(P.aegisT<=0){$('#hex').classList.remove('on');SFX.shieldDown();}}
  for(const l of W.lights.city){if(l.userData.flicker>0){l.userData.flicker-=dt;l.intensity=Math.random()<.5?0:l.userData.base;if(l.userData.flicker<=0)l.intensity=l.userData.base;}}
}

/* ================= PLAYER UPDATE ================= */
function updatePlayer(dt){
  const w=curW(),def=w.def,ctl=mode==='play';
  P.jumpCD-=dt;
  let fx=0,fz=0;
  if(ctl){if(keys.KeyW)fz+=1;if(keys.KeyS)fz-=1;if(keys.KeyD)fx+=1;if(keys.KeyA)fx-=1;}
  const sy=Math.sin(P.yaw),cy=Math.cos(P.yaw);
  let wx=-sy*fz+cy*fx,wz=-cy*fz-sy*fx;const wl=Math.hypot(wx,wz);if(wl>0){wx/=wl;wz/=wl;}
  const wantCrouch=ctl&&!!keys.KeyC;
  const busy=P.holdT>0;
  P.sprinting=ctl&&(keys.ShiftLeft||keys.ShiftRight)&&fz>0&&!wantCrouch&&P.ads<.2&&!busy;
  let speed=P.sprinting?7.4:5.2;if(wantCrouch)speed=2.6;speed*=lerp(1,.62,P.ads);
  if(busy){wx=wz=0;}
  if(P.phaseT>0){P.phaseT-=dt;P.vel.x=P.phaseDir.x*34;P.vel.z=P.phaseDir.z*34;if(Math.random()<.6)sparks(P.pos.clone().setY(rand(.3,1.7)),null,2,0x7ff4ff,1,0,.4);}
  else{const acc=P.onGround?14:2.2;const k=1-Math.exp(-acc*dt);P.vel.x=lerp(P.vel.x,wx*speed,k);P.vel.z=lerp(P.vel.z,wz*speed,k);}
  P.crouch=lerp(P.crouch,wantCrouch?1:0,1-Math.exp(-14*dt));
  if(ctl&&keys.Space&&P.onGround&&!busy&&P.jumpCD<=0&&!(P.crouch>.5&&ceilingAt(P.pos,.38,1.8))){P.vel.y=5.7;P.onGround=false;P.jumpCD=.3;}
  moveUnit(P,dt,.38,lerp(1.8,1.25,P.crouch));
  const hs=Math.hypot(P.vel.x,P.vel.z);
  if(P.onGround&&hs>3.5&&!wantCrouch){P.stepT-=dt*hs/5.2;if(P.stepT<=0){P.stepT=.36;SFX.step(null,.09);}}
  P.bobT+=dt*hs*1.5*(P.onGround?1:0);
  // weapon
  P.fireCD-=dt;if(P.switchT>0)P.switchT-=dt;
  if(P.reloading){P.reloadT-=dt;if(P.reloadT<=0){const need=def.mag-w.mag,take=M.range?need:Math.min(need,w.reserve);w.mag+=take;if(!M.range)w.reserve-=take;P.reloading=false;}}
  const wantADS=ctl&&!DRONE.on&&mouse.right&&!P.reloading&&!P.sprinting&&P.switchT<=0&&!busy;
  P.ads=lerp(P.ads,wantADS?1:0,1-Math.exp(-16*dt));
  const canFire=ctl&&!DRONE.on&&!P.reloading&&P.switchT<=0&&P.fireCD<=0&&!P.sprinting&&!busy;
  if(mouse.left&&canFire&&(def.auto||!P.trigLatch)){if(w.mag<=0){SFX.dry();P.trigLatch=true;startReload();}else fire(w);}
  if(!mouse.left)P.trigLatch=false;
  if(P.fireCD<-.08){P.spray=Math.max(0,P.spray-dt*14);P.recoilP*=Math.exp(-dt*7);P.recoilY*=Math.exp(-dt*7);}
  updateAbilities(dt);
  // pickups
  for(let i=pickups.length-1;i>=0;i--){const pk=pickups[i];pk.t+=dt;pk.m.rotation.y+=dt*2;pk.m.position.y=pk.y+.35+Math.sin(pk.t*3)*.08;
    if(pk.t>40){scene.remove(pk.m);pickups.splice(i,1);continue;}
    if(pk.m.position.distanceTo(T1.copy(P.pos).setY(P.pos.y+.4))<1.5){
      if(pk.kind==='med'&&P.hp>=100)continue;if(pk.kind==='armor'&&P.armor>=50)continue;
      if(pk.kind==='med')P.hp=Math.min(100,P.hp+35);else if(pk.kind==='armor')P.armor=Math.min(50,P.armor+25);else{P.w[1].reserve+=30;P.w[2].reserve+=12;}
      toast({med:'+35 HEALTH',armor:'+25 ARMOR',ammo:'+30 RIFLE · +12 PISTOL'}[pk.kind]);SFX.pickup();scene.remove(pk.m);pickups.splice(i,1);}
  }
  // camera
  const eye=lerp(1.62,1.04,P.crouch);
  const bob=Math.sin(P.bobT*2)*.028*Math.min(1,hs/5.2);
  camera.position.set(P.pos.x,P.pos.y+eye+bob,P.pos.z);
  let sx=0,sy2=0;if(shakeT>0){shakeT-=dt;sx=gauss()*shakeA;sy2=gauss()*shakeA;if(shakeT<=0)shakeA=0;}
  camera.rotation.set(P.pitch+P.recoilP*.85+sx,P.yaw+P.recoilY+sy2,0);
  updateDroneCam(dt);
  const fovT=DRONE.k>.02?lerp(SET.fov,58,DRONE.k):lerp(SET.fov,SET.fov/def.ads,P.ads)+(P.sprinting?5:0)+(P.phaseT>0?14:0);
  if(Math.abs(camera.fov-fovT)>.01){camera.fov=lerp(camera.fov,fovT,1-Math.exp(-dt*16));camera.updateProjectionMatrix();}
}
function toggleDrone(){
  if(!P.alive||mode!=='play')return;
  DRONE.on=!DRONE.on;SFX.radio();$('#droneFx').hidden=!DRONE.on;
  if(DRONE.on){DRONE.pos.copy(camera.position);P.ads=0;toast('WREN DRONE FEED ONLINE');}
}
function updateDroneCam(dt){
  DRONE.k=lerp(DRONE.k,DRONE.on?1:0,1-Math.exp(-dt*5));
  if(!PM){PM=makeCharacter(0x38e8ff,0x38e8ff,'trooper',false);world.add(PM.g);}
  PM.g.visible=DRONE.k>.05&&P.alive;
  if(PM.g.visible){
    const hs=Math.hypot(P.vel.x,P.vel.z),ph=P.bobT*1.3,sw=Math.min(1,hs/5)*.7;
    PM.legL.rotation.x=Math.sin(ph)*sw;PM.legR.rotation.x=-Math.sin(ph)*sw;
    PM.kneeL.rotation.x=-Math.max(0,Math.sin(ph+1.3))*sw*1.4-P.crouch*1.2;PM.kneeR.rotation.x=-Math.max(0,-Math.sin(ph+1.3))*sw*1.4-P.crouch*1.2;
    PM.g.position.set(P.pos.x,P.pos.y-P.crouch*.42,P.pos.z);PM.g.rotation.set(0,P.yaw,0);
  }
  for(const e of EN)if(e.mark)e.mark.visible=DRONE.k>.5&&e.alive&&!e.dummy;
  if(DRONE.k<.01)return;
  // orbit high behind the player; mouse yaw steers, pitch tilts the boom
  const back=new V3(Math.sin(P.yaw),0,Math.cos(P.yaw));
  const tilt=clamp(-P.pitch,-.6,.9);
  const want=new V3(P.pos.x+back.x*(11+tilt*4),P.pos.y+15+tilt*5,P.pos.z+back.z*(11+tilt*4));
  DRONE.pos.lerp(want,1-Math.exp(-dt*6));
  DRONE.look.lerp(T4.set(P.pos.x-back.x*4,P.pos.y+1,P.pos.z-back.z*4),1-Math.exp(-dt*8));
  const fp=camera.position.clone(),fq=camera.quaternion.clone();
  camera.position.copy(DRONE.pos);camera.lookAt(DRONE.look);
  const k=DRONE.k*DRONE.k*(3-2*DRONE.k);
  camera.position.lerpVectors(fp,DRONE.pos,k);camera.quaternion.copy(fq).slerp(camera.quaternion.clone(),k);
  if(WREN.g)WREN.g.visible=DRONE.k<.6;
}
function dropPickup(p){
  const r=Math.random();const kind=r<.55?'ammo':r<.8?'med':r<.95?'armor':null;if(!kind)return;
  const col={ammo:0xffc24a,med:0x5cff9d,armor:0x38e8ff}[kind];
  const m=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(.32,.22,.22),MT.dark);m.add(b);
  const s=new THREE.Mesh(new THREE.BoxGeometry(.34,.06,.24),new THREE.MeshBasicMaterial({color:col}));m.add(s);
  const h=new THREE.Mesh(new THREE.RingGeometry(.35,.42,24),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.5,side:THREE.DoubleSide}));h.rotation.x=-Math.PI/2;h.position.y=-.33;m.add(h);
  const y=groundAt(p,.2);m.position.set(p.x,y+.35,p.z);scene.add(m);pickups.push({m,kind,t:0,y});
}
function updateViewmodel(dt){
  VM.root.visible=mode==='play'&&P&&P.alive&&DRONE.k<.35;
  if(!VM.gun||!VM.root.visible)return;
  const def=curW().def,hs=Math.hypot(P.vel.x,P.vel.z),t=P.bobT;
  VM.kick*=Math.exp(-dt*14);VM.mx*=Math.exp(-dt*10);VM.my*=Math.exp(-dt*10);
  const ads=P.ads;VM.sprint=lerp(VM.sprint,P.sprinting?1:0,1-Math.exp(-dt*10));
  let x=lerp(.2,0,ads)+Math.cos(t)*.01*Math.min(1,hs/5)*(1-ads)-VM.mx*.4;
  let y=lerp(-.2,def.model==='pistol'?-.061:-.084,ads)+Math.abs(Math.sin(t))*.012*Math.min(1,hs/5)*(1-ads)-VM.sprint*.04+VM.my*.4;
  let z=lerp(-.34,-.27,ads)+VM.kick*.05;
  let rx=VM.kick*.08-VM.sprint*.3,ry=VM.sprint*.6+VM.mx*.6,rz=-VM.sprint*.1;
  if(VM.inspect>0){VM.inspect-=dt;const k=1-VM.inspect/2.4;const a=Math.sin(Math.min(1,k*1.25)*Math.PI);
    ry+=a*-1.15;rz+=a*.5+Math.sin(k*TAU)*.15*a;x+=a*-.05;y+=a*.04;z+=a*.06;rx+=Math.sin(k*Math.PI*2)*.12;}
  if(P.reloading){const r=1-P.reloadT/def.reload,k=Math.sin(Math.min(1,r)*Math.PI);rz+=k*.55;rx-=k*.25;y-=k*.05;
    VM.gun.userData.mag.position.y=VM.gun.userData.magY-(r>.2&&r<.65?Math.sin((r-.2)/.45*Math.PI)*.25:0);}
  else VM.gun.userData.mag.position.y=VM.gun.userData.magY;
  if(P.switchT>0){y-=P.switchT*.5;rx-=P.switchT*.8;}
  if(P.phaseT>0){x+=.04;rz-=.2;}
  VM.root.position.set(x,y,z);VM.root.rotation.set(rx,ry,rz);
  const f=VM.gun.userData.flash;if(VM.flashT>0){VM.flashT-=dt;f.visible=true;f.material.rotation=Math.random()*TAU;const s=rand(.16,.26);f.scale.set(s,s,1);}else f.visible=false;
  vmFlash.intensity*=Math.exp(-dt*30);
  vmCam.fov=lerp(60,54,ads);vmCam.updateProjectionMatrix();
}
