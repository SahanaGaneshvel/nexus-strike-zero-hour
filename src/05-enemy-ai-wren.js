
/* ================= ENEMY AI ================= */
const ETYPE={
  trooper:{hp:100,speed:4.6,dmg:8,rpm:540,burst:[3,6],acc:.42,mag:24,name:'Helix Trooper',color:0xff3d6e,style:'trooper',cover:true},
  heavy:{hp:260,speed:3.1,dmg:7,rpm:720,burst:[6,10],acc:.36,mag:40,name:'Helix Bulwark',color:0xff8a2a,style:'heavy',armored:true,scale:1.08},
  marksman:{hp:80,speed:2.4,dmg:40,rpm:30,burst:[1,1],acc:.72,mag:5,name:'Helix Marksman',color:0xb06bff,style:'marksman',telegraph:1.15},
  dummy:{hp:100,speed:2.5,dmg:0,rpm:1,burst:[1,1],acc:0,mag:1,name:'Range Target',color:0xff3d6e,style:'trooper'}
};
let eid=0;
function spawnEnemy(type,pos,opts){
  opts=opts||{};const T=ETYPE[type];
  const model=makeCharacter(0xff3d6e,T.color,T.style,type==='dummy');
  if(T.scale)model.g.scale.setScalar(T.scale);
  world.add(model.g);
  let laser=null;
  if(T.telegraph){const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));
    laser=new THREE.Line(lg,new THREE.LineBasicMaterial({color:0xff2050,transparent:true,opacity:.85,blending:THREE.AdditiveBlending}));laser.frustumCulled=false;laser.visible=false;scene.add(laser);}
  const e={id:++eid,type,T,model,laser,pos:pos.clone(),vel:new V3(),yaw:opts.yaw||0,hp:T.hp,alive:true,onGround:true,crouch:0,scale:T.scale||1,
    state:'patrol',aware:0,patrol:(opts.patrol||[pos]).map(p=>p.clone()),pi:0,waitT:0,rail:opts.rail?opts.rail.map(p=>p.clone()):null,dummy:type==='dummy',
    path:[],pidx:0,pathGoal:null,repathT:0,senseT:Math.random()*.2,canSee:false,seenT:99,lastKnown:new V3(),lkT:0,reactT:0,
    cover:null,coverT:0,peeking:false,peekT:0,coverHits:0,fireCD:0,burst:0,burstMax:3,burstPause:0,mag:T.mag,reloadT:0,aimT:0,
    stunT:0,flinchT:0,flashT:0,deadT:0,strafeT:0,strafeDir:0,walkPh:0,stepT:0,stuckT:0,lastPos:pos.clone(),wave:opts.wave||0,
    onLand(){}};
  if(opts.combat){e.aware=1;e.state='combat';e.lastKnown.copy(P.pos);e.lkT=10;e.reactT=.6;}
  model.g.position.copy(e.pos);model.g.rotation.y=e.yaw;
  if(type!=='dummy'){const mk=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.mark,depthTest:false,transparent:true}));mk.scale.set(.6,.6,1);mk.position.y=2.4;mk.renderOrder=999;mk.visible=false;model.g.add(mk);e.mark=mk;}
  EN.push(e);return e;
}
function clearEnemies(){for(const e of EN){world.remove(e.model.g);if(e.laser)scene.remove(e.laser);}EN.length=0;for(const c of W.cover)c.taken=null;}
function setState(e,s){
  if(e.state===s)return;e.state=s;
  if(s==='suspicious'){e.waitT=0;SFX.alert(e.pos.clone().setY(1.6));}
  if(s==='patrol'){e.path=[];e.pathGoal=null;}
}
function enterCombat(e){
  if(e.dummy)return;
  const first=e.state!=='combat';
  e.aware=1;e.state='combat';e.lastKnown.copy(P.pos);e.lkT=10;
  if(first){e.reactT=D().react*rand(.8,1.4);SFX.alert(e.pos.clone().setY(1.6));M.detected=Math.max(M.detected,1.5);
    for(const o of EN)if(o!==e&&o.alive&&!o.dummy&&o.state!=='combat'&&o.pos.distanceTo(e.pos)<28){o.aware=Math.max(o.aware,.8);o.lastKnown.copy(P.pos);o.lkT=8;setState(o,'suspicious');setTimeout(()=>{if(o.alive&&o.state!=='combat')enterCombat(o);},rand(500,1300));}
  }
}
function enemyEye(e,out){return out.set(e.pos.x,e.pos.y+lerp(1.55,1.12,e.crouch)*e.scale,e.pos.z);}
function playerChest(out){return out.set(P.pos.x,P.pos.y+lerp(1.3,.85,P.crouch),P.pos.z);}
function sense(e,dt){
  e.canSee=false;if(!P.alive||e.dummy)return;
  const eye=enemyEye(e,T1),tgt=playerChest(T2);const d=eye.distanceTo(tgt);
  if(d>75)return;
  const ang=Math.abs(angDiff(e.yaw,yawTo(P.pos.x-e.pos.x,P.pos.z-e.pos.z)));
  if(!(d<4||e.state==='combat'&&ang<2.2||ang<1.05))return;
  if(!losClear(eye,tgt))return;
  e.canSee=true;e.seenT=0;e.lastKnown.copy(P.pos);e.lkT=10;
  if(e.state==='combat')return;
  const rate=clamp(1.7-d/38,.22,1.7)*(P.crouch>.5?.55:1)*(P.sprinting?1.35:1)*(e.stunT>0?0:1)*D().detect;
  e.aware=Math.min(1,e.aware+rate*dt);
  if(e.aware>=1)enterCombat(e);else if(e.aware>.3&&e.state==='patrol')setState(e,'suspicious');
}
function findCover(e){
  let best=null,bs=1e9;const pe=T2.set(P.pos.x,P.pos.y+1.5,P.pos.z);
  for(const c of W.cover){
    if(c.taken&&c.taken!==e&&c.taken.alive)continue;
    const de=Math.hypot(c.x-e.pos.x,c.z-e.pos.z);if(de>20)continue;
    const dp=Math.hypot(c.x-P.pos.x,c.z-P.pos.z);if(dp<7||dp>42)continue;
    if(!NAV.walk[cellI(c.x,c.z)])continue;
    if(losClear(T1.set(c.x,1.0,c.z),pe))continue;
    const peek=c.h<2?losClear(T3.set(c.x,1.6,c.z),pe):false;
    const s=de+(peek?0:7)+Math.abs(dp-18)*.35;
    if(s<bs){bs=s;best=c;}
  }
  return best;
}
function engagePoint(e){
  const dir=T1.set(e.pos.x-P.pos.x,0,e.pos.z-P.pos.z);const L=dir.length()||1;dir.multiplyScalar(1/L);
  const want=Math.min(L,e.type==='heavy'?11:16);
  return walkablePoint(new V3(P.pos.x+dir.x*want,0,P.pos.z+dir.z*want))||P.pos.clone();
}
function navMove(e,goal,dt){
  if(!goal)return null;
  if(Math.hypot(goal.x-e.pos.x,goal.z-e.pos.z)<.9)return null;
  e.repathT-=dt;
  if(!e.path.length||!e.pathGoal||(e.pathGoal.distanceTo(goal)>4&&e.repathT<1.2)||e.repathT<=0){e.path=findPath(e.pos,goal);e.pidx=0;e.pathGoal=goal.clone();e.repathT=rand(1.5,3);}
  let wp=e.path[e.pidx];
  while(wp&&Math.hypot(wp.x-e.pos.x,wp.z-e.pos.z)<.7&&e.pidx<e.path.length-1){e.pidx++;wp=e.path[e.pidx];}
  if(!wp)return null;
  const dx=wp.x-e.pos.x,dz=wp.z-e.pos.z,d=Math.hypot(dx,dz);if(d<.05)return null;
  e.stuckT+=dt;if(e.stuckT>1.2){if(e.pos.distanceTo(e.lastPos)<.35){e.path=[];e.pos.x+=rand(-.4,.4);e.pos.z+=rand(-.4,.4);}e.stuckT=0;e.lastPos.copy(e.pos);}
  return new V3(dx/d,0,dz/d);
}
function enemyFire(e,dt){
  const T=e.T;
  if(e.reloadT>0){e.reloadT-=dt;if(e.reloadT<=0)e.mag=T.mag;return;}
  if(T.telegraph){
    e.aimT+=dt;
    const mz=e.model.tip.getWorldPosition(T3),pc=playerChest(T4);const wob=(1-Math.min(1,e.aimT/T.telegraph))*.6;
    const arr=e.laser.geometry.attributes.position.array;arr[0]=mz.x;arr[1]=mz.y;arr[2]=mz.z;arr[3]=pc.x+gauss()*wob;arr[4]=pc.y+gauss()*wob;arr[5]=pc.z+gauss()*wob;
    e.laser.geometry.attributes.position.needsUpdate=true;e.laser.visible=true;
    if(e.aimT<T.telegraph)return;
    e.aimT=-rand(1.4,2.2);
  }
  if(e.burstPause>0){e.burstPause-=dt;return;}
  e.fireCD-=dt;if(e.fireCD>0)return;
  e.fireCD=60/T.rpm;e.mag--;if(e.mag<=0)e.reloadT=2.2;
  e.burst++;if(e.burst>=e.burstMax){e.burst=0;e.burstMax=Math.round(rand(T.burst[0],T.burst[1]));e.burstPause=rand(.35,.85);}
  const d=e.pos.distanceTo(P.pos),pv=Math.hypot(P.vel.x,P.vel.z);
  let acc=T.acc+D().acc-d*.006-pv*.03-(P.crouch>.5?.05:0)-(e.strafeDir?.08:0)-e.burst*.02;
  acc=clamp(acc,.03,.88);
  const mz=e.model.tip.getWorldPosition(new V3());
  e.model.flash.visible=true;e.flashT=.05;e.model.flash.material.rotation=Math.random()*TAU;
  if(Math.random()<.4)lightFlash(mz,0xffa060,1.6,7,.05);
  SFX.shot(e.type,e.pos.clone().setY(1.5));
  const aim=playerChest(new V3());
  if(Math.random()<acc&&P.phaseT<=0){
    tracer(mz,aim,0xff9fb4);damagePlayer(T.dmg,e.pos);
  }else{
    const miss=aim.clone().add(new V3(gauss()*1.3,gauss()*.8,gauss()*1.3));const eye=enemyEye(e,new V3());const dir=miss.sub(eye).normalize();
    const h=castShotWorld(eye,dir,120);const end=eye.clone().addScaledVector(dir,h.t);
    tracer(mz,end,0xff9fb4);
    if(h.type==='world'){const n=new V3();n.setComponent(h.axis,h.sign);if(h.col.kind==='glass')shatter(h.col,end);else if(h.col.kind==='barrel')hitBarrel(h.col,T.dmg);else{decal(end,n);sparks(end,n,4,0xffd27a,3,9,.25);}}
    else if(h.type==='ground'){decal(end,new V3(0,1,0));sparks(end,new V3(0,1,0),3,0xb0c0d8,2,9,.3);}
    // near-miss whiz
    if(AU.ctx&&Math.random()<.35){const p=camera.position.clone().add(new V3(gauss(),gauss()*.3,gauss()));tn(outNode(p),now(),.08,rand(2500,4000),rand(800,1200),.08,'sine');}
  }
  if(T.telegraph&&e.laser)e.laser.visible=false;
}
function castShotWorld(origin,dir,maxD){
  const o=[origin.x,origin.y,origin.z],d=[dir.x,dir.y,dir.z];let best={t:maxD,type:null};
  if(d[1]<0){const t=-o[1]/d[1];if(t<best.t)best={t,type:'ground'};}
  for(const c of colliders){if(!c.alive)continue;const h=rayBox(o,d,c.min,c.max,best.t);if(h&&h.t<best.t)best={t:h.t,type:'world',col:c,axis:h.axis,sign:h.sign};}
  return best;
}
function damageEnemy(e,dmg,head,at,dir,splash){
  if(!e.alive)return;
  let d=dmg;if(e.T.armored&&!head){d*=.8;SFX.armor(at);sparks(at,dir?dir.clone().negate():null,8,0xffb03a,3,6,.3);}
  else sparks(at,dir?dir.clone().negate():null,head?14:8,head?0xffc24a:0xff4070,3,6,.35);
  e.hp-=d;e.flashT=.08;e.flinchT=head?.35:.18;
  if(!splash){M.stats.hits++;if(head)M.stats.heads++;SFX.hit(head);}
  if(!e.dummy){if(e.state!=='combat')enterCombat(e);e.lastKnown.copy(P.pos);e.lkT=10;if(e.cover){e.coverHits++;if(e.coverHits>2){e.cover.taken=null;e.cover=null;e.coverHits=0;}}}
  if(e.hp<=0)killEnemy(e,head);
  if(!splash)hitMarker(head,!e.alive);
}
function killEnemy(e,head){
  e.alive=false;e.deadT=0;e.model.flash.visible=false;e.model.glow.color.set(0x220a0e);if(e.laser)e.laser.visible=false;
  if(e.cover){e.cover.taken=null;e.cover=null;}
  e.fallDir=Math.random()<.5?1:-1;
  if(!e.dummy){M.stats.kills++;dropPickup(e.pos);}
  else M.rstats.kills++;
  SFX.kill();addFeed(head?'HEADSHOT':'ELIMINATED',e.T.name);
  killFx(e,head);
  if(M.onKill)M.onKill(e);
}
function updateEnemy(e,dt){
  const m=e.model;
  if(e.flashT>0){e.flashT-=dt;const on=e.flashT>0;for(const mt of m.mats){mt.emissive.setHex(on?0xff6070:0x000000);mt.emissiveIntensity=on?.6:1;}}
  if(e.flashT<=0&&m.flash.visible&&(e.fireFlash=(e.fireFlash||0)+dt)>.05){m.flash.visible=false;e.fireFlash=0;}
  if(!e.alive){
    e.deadT+=dt;const k=Math.min(1,e.deadT*2.4);m.g.rotation.x=-k*Math.PI/2*.98;m.g.rotation.z=e.fallDir*k*.25;
    if(e.deadT>3){m.g.position.y=e.pos.y-(e.deadT-3)*.6;if(e.deadT>3&&e.deadT<3.1)sparks(e.pos.clone().setY(e.pos.y+.4),null,20,0xff3d6e,2,-1,.8);}
    if(e.deadT>4.6)m.g.visible=false;
    if(e.dummy&&e.deadT>1.6)respawnDummy(e);
    return;
  }
  for(const k of ['stunT','flinchT','lkT'])if(e[k]>0)e[k]-=dt;
  e.seenT+=dt;
  if(e.dummy){updateDummy(e,dt);return;}
  const dP=e.pos.distanceTo(P.pos);
  if(dP>95&&e.state!=='combat'){m.g.position.copy(e.pos);m.g.visible=camera.position.distanceTo(e.pos)<74;return;}
  e.senseT-=dt;if(e.senseT<=0){sense(e,.12+Math.max(0,-e.senseT));e.senseT=.12;}
  if(e.stunT>0&&Math.random()<dt*10)sparks(e.pos.clone().setY(e.pos.y+rand(.4,1.8)),null,3,0x7fe8ff,2.5,0,.25);
  let dir=null,speed=e.T.speed,wantCrouch=false,face=null;
  if(e.state==='patrol'){
    e.aware=Math.max(0,e.aware-.08*dt);
    if(e.rail){const tgt=e.rail[e.pi%2];if(e.pos.distanceTo(tgt)<.6){if((e.waitT-=dt)<=0){e.pi++;e.waitT=rand(2,4);}}else{const v=T1.copy(tgt).sub(e.pos).setY(0);if(v.length()>.05)dir=v.normalize().clone();speed*=.5;}}
    else if(e.patrol.length>1){const tgt=e.patrol[e.pi];if(Math.hypot(tgt.x-e.pos.x,tgt.z-e.pos.z)<1){if((e.waitT-=dt)<=0){e.pi=(e.pi+1)%e.patrol.length;e.waitT=rand(1.5,3.5);}else if(Math.random()<dt*.5)e.scan=e.yaw+rand(-1.3,1.3);}
      else{dir=navMove(e,tgt,dt);speed*=.42;}}
    else if(Math.random()<dt*.35)e.scan=e.yaw+rand(-1.4,1.4);
  }else if(e.state==='suspicious'){
    face=e.lastKnown;
    if(e.aware<.05&&e.lkT<=0)setState(e,'patrol');
    else if(!e.rail&&e.pos.distanceTo(e.lastKnown)>3&&e.waitT>.8){dir=navMove(e,e.lastKnown,dt);speed*=.55;}
    e.waitT+=dt;e.aware=Math.max(0,e.aware-.05*dt);
  }else if(e.state==='combat'){
    face=e.canSee?P.pos:e.lastKnown;
    if(e.rail){
      e.strafeT-=dt;if(e.strafeT<=0){e.strafeT=rand(1.5,3);e.strafeDir=pick([-1,0,0,1]);e.peeking=!e.peeking;}
      wantCrouch=!e.peeking&&e.aimT<=0;
      if(e.strafeDir){const a=e.rail[0],b=e.rail[1];const ax=T1.copy(b).sub(a).setY(0).normalize();const s=T2.copy(e.pos).sub(a).dot(ax),L=a.distanceTo(b);
        if((s<.5&&e.strafeDir<0)||(s>L-.5&&e.strafeDir>0))e.strafeDir*=-1;dir=ax.clone().multiplyScalar(e.strafeDir);speed=1.6;}
    }else if(e.type==='heavy'){
      if(!e.canSee||dP>13)dir=navMove(e,e.canSee?engagePoint(e):e.lastKnown,dt);
      else{e.strafeT-=dt;if(e.strafeT<=0){e.strafeT=rand(.6,1.4);e.strafeDir=pick([-1,1,0]);}if(e.strafeDir)dir=new V3(Math.cos(e.yaw)*e.strafeDir,0,-Math.sin(e.yaw)*e.strafeDir);speed=1.8;}
    }else{
      if(e.cover){
        const c=e.cover;
        if(losClear(T1.set(c.x,1.0,c.z),T2.set(P.pos.x,P.pos.y+1.5,P.pos.z))){c.taken=null;e.cover=null;}
        else if(Math.hypot(c.x-e.pos.x,c.z-e.pos.z)>.8){dir=navMove(e,T3.set(c.x,0,c.z).clone(),dt);speed*=1.15;}
        else{e.peekT-=dt;if(e.peekT<=0){e.peeking=!e.peeking;e.peekT=e.peeking?rand(1.3,2.6):rand(.8,1.7);}wantCrouch=!e.peeking||c.h>=2;
          if(c.h>=2&&e.peeking){const side=T1.set(P.pos.x-c.x,0,P.pos.z-c.z).normalize();const perp=new V3(-side.z,0,side.x);dir=perp.multiplyScalar(e.peekSide||(e.peekSide=pick([-1,1])));speed=1.4;wantCrouch=false;if(e.peekT<.3)e.peekSide=-e.peekSide;}
          if(e.seenT>5&&e.peeking){c.taken=null;e.cover=null;}}
      }else{
        e.coverT-=dt;if(e.coverT<=0){e.coverT=rand(1.2,2.5);const c=findCover(e);if(c){e.cover=c;c.taken=e;e.peeking=false;e.peekT=rand(.4,1);}}
        if(!e.cover){if(!e.canSee||dP>24)dir=navMove(e,e.canSee?engagePoint(e):e.lastKnown,dt);
          else{e.strafeT-=dt;if(e.strafeT<=0){e.strafeT=rand(.4,1);e.strafeDir=pick([-1,1,0,1,-1]);}if(e.strafeDir)dir=new V3(Math.cos(e.yaw)*e.strafeDir,0,-Math.sin(e.yaw)*e.strafeDir);speed=3;}}
      }
    }
    if(e.seenT>12&&e.lkT<=0){setState(e,'suspicious');e.aware=.6;e.waitT=1;if(e.cover){e.cover.taken=null;e.cover=null;}}
    if(e.canSee&&e.stunT<=0&&e.flinchT<=0&&!wantCrouch&&mode==='play'){if(e.reactT>0)e.reactT-=dt;else enemyFire(e,dt);}
    else if(e.T.telegraph){e.aimT=Math.min(e.aimT,0);if(e.laser)e.laser.visible=false;}
  }
  if(e.stunT>0){speed*=.25;wantCrouch=false;if(e.laser)e.laser.visible=false;}
  if(e.flinchT>0)speed*=.4;
  // facing
  let ty=null;if(face)ty=yawTo(face.x-e.pos.x,face.z-e.pos.z);else if(dir)ty=yawTo(dir.x,dir.z);else if(e.scan!==undefined)ty=e.scan;
  if(ty!==null){const rate=e.state==='combat'?8:3;e.yaw+=clamp(angDiff(e.yaw,ty),-rate*dt,rate*dt);}
  e.crouch=lerp(e.crouch,wantCrouch?1:0,1-Math.exp(-10*dt));
  e.vel.x=dir?dir.x*speed:0;e.vel.z=dir?dir.z*speed:0;
  moveUnit(e,dt,.4,1.8);
  if(e.rail){const a=e.rail[0],b=e.rail[1];const ax=T1.copy(b).sub(a).setY(0);const L=ax.length();ax.normalize();const s=clamp(T2.copy(e.pos).sub(a).dot(ax),0,L);e.pos.x=a.x+ax.x*s;e.pos.z=a.z+ax.z*s;}
  for(const o of EN){if(o===e||!o.alive)continue;const dx=e.pos.x-o.pos.x,dz=e.pos.z-o.pos.z,d=Math.hypot(dx,dz);if(d<.8&&d>.001&&Math.abs(e.pos.y-o.pos.y)<1){e.pos.x+=dx/d*(.8-d)*.5;e.pos.z+=dz/d*(.8-d)*.5;}}
  const hs=Math.hypot(e.vel.x,e.vel.z);
  if(hs>2.5&&e.onGround){e.stepT-=dt;if(e.stepT<=0){e.stepT=hs>4?.36:.5;if(dP<32)SFX.step(e.pos.clone(),hs>4?.32:.18);}}
  animEnemy(e,dt,hs);
}
function animEnemy(e,dt,hs){
  const m=e.model;e.walkPh+=dt*hs*1.9;const sw=Math.min(1,hs/4.5)*.75;
  m.legL.rotation.x=Math.sin(e.walkPh)*sw;m.legR.rotation.x=-Math.sin(e.walkPh)*sw;
  m.kneeL.rotation.x=-Math.max(0,Math.sin(e.walkPh+1.3))*sw*1.4-e.crouch*1.2;m.kneeR.rotation.x=-Math.max(0,-Math.sin(e.walkPh+1.3))*sw*1.4-e.crouch*1.2;
  m.legL.rotation.x+=e.crouch*1.1;m.legR.rotation.x+=e.crouch*.7;
  const fl=e.flinchT>0?Math.sin(e.flinchT*30)*.12:0;
  m.head.rotation.x=fl;m.head.rotation.z=e.stunT>0?Math.sin(performance.now()/60)*.2:0;
  m.g.position.set(e.pos.x,e.pos.y-e.crouch*.42*e.scale+Math.abs(Math.sin(e.walkPh))*.04*sw,e.pos.z);
  m.g.rotation.set(fl*.5,e.yaw,0);
  m.g.visible=camera.position.distanceTo(e.pos)<74;
}
// range targets
function updateDummy(e,dt){
  e.railT=(e.railT||0)+dt*e.sp;
  const a=e.rail[0],b=e.rail[1],k=.5+.5*Math.sin(e.railT);
  e.pos.set(lerp(a.x,b.x,k),0,lerp(a.z,b.z,k));e.yaw=0;
  animEnemy(e,dt,Math.abs(Math.cos(e.railT))*e.sp*Math.max(1,a.distanceTo(b))*.5);
}
function respawnDummy(e){
  e.alive=true;e.hp=e.T.hp;e.deadT=0;e.model.g.visible=true;e.model.g.rotation.set(0,0,0);e.model.glow.color.set(0xff3d6e);
}

/* ================= KILL PRESENTATION ================= */
const STREAK={n:0,t:0};
const STREAK_NAMES=['','','DOUBLE KILL','TRIPLE KILL','QUAD KILL','RAMPAGE'];
function killFx(e,head){
  // body breaks down into energy shards
  const c=e.pos.clone().setY(e.pos.y+1.1);
  sparks(c,null,head?60:36,head?0xffc24a:0xff3d6e,head?6:4,2,.9);
  pulseFx(c,head?0xffc24a:0xff3d6e,head?2.6:1.8,.35,.55);
  if(head){const hp=c.clone().setY(e.pos.y+1.7);sparks(hp,null,30,0xffffff,7,4,.5);lightFlash(hp,0xffc24a,3,8,.25);}
  if(e.dummy)return;
  // slow motion on headshots and multi-kills
  STREAK.n=STREAK.t>0?STREAK.n+1:1;STREAK.t=3.2;
  if(head||STREAK.n>=2){slowT=head?.32:.22;}
  const label=STREAK.n>=2?STREAK_NAMES[Math.min(STREAK.n,5)]:head?'HEADSHOT':'ELIMINATED';
  const col=head?'var(--core)':STREAK.n>=2?'var(--aegis)':'var(--helix)';
  const kp=$('#killpop');kp.innerHTML=`<div class="kp" style="--c:${col}"><div class="x"><i class="ring"></i></div><b>${label}</b><small>${e.T.name.toUpperCase()} · +${head?150:100}</small></div>`;
  if(AU.ctx&&STREAK.n>=2){const t=now();for(let i=0;i<STREAK.n;i++)tn(AU.master,t+i*.07,.15,1000+i*260,1400+i*260,.08,'triangle');}
}

/* ================= WREN, SUPPORT DRONE ================= */
const WREN={g:null,cd:0,pos:new V3()};
function updateWren(dt,t){
  if(!WREN.g)WREN.g=makeDrone();
  const g=WREN.g;g.visible=mode!=='menu'&&!!P&&P.alive&&!M.range;
  if(!g.visible)return;
  const off=new V3(1.2,2.8,1.8).applyAxisAngle(new V3(0,1,0),P.yaw);
  const tgt=P.pos.clone().add(off);tgt.y+=Math.sin(t*1.7)*.12;
  WREN.pos.lerp(tgt,1-Math.exp(-dt*4));if(WREN.pos.distanceTo(tgt)>12)WREN.pos.copy(tgt);
  g.position.copy(WREN.pos);g.rotation.y=P.yaw;
  if(DRONE.k<.3&&WREN.pos.distanceTo(camera.position)<2.6)g.visible=false;g.userData.rotors.forEach((r,i)=>r.rotation.z+=dt*40*(i%2?1:-1));
  WREN.cd-=dt;
  if(WREN.cd<=0&&mode==='play'){
    WREN.cd=1.5;let best=null,bd=32;
    for(const e of EN){if(!e.alive||e.dummy||e.state!=='combat')continue;const d=e.pos.distanceTo(WREN.pos);if(d<bd&&losClear(WREN.pos,T1.set(e.pos.x,e.pos.y+1.2,e.pos.z))){bd=d;best=e;}}
    if(best){const hit=T2.set(best.pos.x,best.pos.y+1.2,best.pos.z).clone();tracer(WREN.pos.clone(),hit,0x38e8ff,.03);sparks(hit,null,6,0x7fe8ff,2,4,.3);
      if(AU.ctx)tn(outNode(WREN.pos),now(),.12,2400,900,.08,'square');
      const wasAlive=best.alive;damageEnemy(best,7,false,hit,null,true);if(wasAlive&&!best.alive)addFeed('WREN','assist kill');}
  }
}
