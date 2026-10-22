
/* ================= MISSION ================= */
const OBJ=[
  {t:'Breach the facility',d:'Hack the main gate terminal, or flank down the east alley to the service door.',pos:new V3(8.5,1.3,-13.6)},
  {t:'Recover the Nexus Core',d:'Reach the reactor atrium and pull the core at the containment console.',pos:new V3(0,1.3,-44.6)},
  {t:'Reach extraction',d:'Get to the landing pad west of the intersection. Take the stairs up.',pos:new V3(-54,4.5,22)},
  {t:'Hold the pad',d:'Stay inside the ring until SKYLARK touches down.',pos:new V3(-54,4.5,22)}
];
const TERMS=[];
let SHIP=null,ESHIP=null;
function initTerminals(){
  terminalMesh('gate',8.5,1.4,-13.85,0,0xff3d6e);
  terminalMesh('service',41.15,1.4,-29.5,Math.PI/2,0xff3d6e);
  terminalMesh('med1',-20,1.4,12.15,0,0x5cff9d);terminalMesh('med2',39.85,1.4,-20,-Math.PI/2,0x5cff9d);terminalMesh('ammo1',-39.85,1.4,-24,Math.PI/2,0xffc24a);
  const T=(id,pos,r,label,hold,enabled,done,tick)=>TERMS.push({id,pos,r,label,hold,enabled,done,tick});
  T('gate',new V3(8.5,0,-13.2),2.6,'Hack the main gate',4,()=>!M.range&&M.stage===0,()=>{breach('gate');},hackTick);
  T('service',new V3(41.6,0,-29.5),2.6,'Override the service door',3,()=>!M.range&&M.stage===0,()=>{breach('service');},hackTick);
  T('core',new V3(0,0,-44.6),2.4,'Extract the Nexus Core',5,()=>!M.range&&M.stage===1,()=>{takeCore();},()=>{if(Math.random()<.2)SFX.hack();});
  for(const id of ['med1','med2'])T(id,W.termMeshes[id].g.position.clone().setY(0),2.2,'Use med station',.5,()=>!M.used[id],()=>{M.used[id]=true;P.hp=100;P.armor=Math.max(P.armor,25);SFX.pickup();toast('HEALTH RESTORED');W.termMeshes[id].scr.material.color.set(0x333a44);});
  T('ammo1',W.termMeshes.ammo1.g.position.clone().setY(0),2.2,'Restock ammunition',.5,()=>!M.used.ammo1,()=>{M.used.ammo1=true;P.w[1].reserve=Math.max(P.w[1].reserve,180);P.w[2].reserve=Math.max(P.w[2].reserve,72);SFX.pickup();toast('AMMUNITION RESTOCKED');W.termMeshes.ammo1.scr.material.color.set(0x333a44);});
  T('drill',W.termMeshes.drill.g.position.clone().setY(0),2.4,'Start live-fire drill',.5,()=>M.range&&!M.drill,startDrill);
  T('reset',W.termMeshes.reset.g.position.clone().setY(0),2.4,'Reset range stats',.4,()=>M.range,()=>{M.stats={kills:0,shots:0,hits:0,heads:0,dmgTaken:0,blocked:0};M.rstats.kills=0;SFX.ui();toast('STATS RESET');});
  SHIP=makeDropship(0x38e8ff);scene.add(SHIP);ESHIP=makeDropship(0xff3d6e);scene.add(ESHIP);
}
function hackTick(dt){
  if(P.holdT<dt*1.5){for(const e of EN)if(e.alive&&!e.dummy&&e.state!=='combat'&&e.pos.distanceTo(P.pos)<40){e.aware=Math.max(e.aware,.7);e.lastKnown.copy(P.pos);e.lkT=10;setState(e,'suspicious');}}
  M.hackBeep=(M.hackBeep||0)-dt;if(M.hackBeep<=0){M.hackBeep=.22;SFX.hack();}
}
function newMissionState(range){
  return {range,stage:0,cp:0,time:0,countdown:0,stats:{kills:0,shots:0,hits:0,heads:0,dmgTaken:0,blocked:0},rstats:{kills:0},detected:0,hold:0,
    used:{},flags:{},alarm:false,sirenT:0,distantT:8,shipT:-1,eshipT:-1,drill:null,onKill:null,comms:[],commT:0,coreAnim:-1};
}
function resetWorld(){
  clearEnemies();
  for(const p of pickups)scene.remove(p.m);pickups.length=0;
  for(const g of W.glass){g.alive=true;g.mesh.visible=true;}
  for(const b of W.barrels){b.alive=true;b.hp=35;b.group.visible=true;}
  for(const id in W.doors){const d=W.doors[id];d.open=false;d.amt=0;d.col.alive=true;d.col.min[1]=0;d.col.max[1]=d.h;d.strip.material.color.set(0xff3d6e);}
  for(const id in W.termMeshes){const tm=W.termMeshes[id];if(id.startsWith('med'))tm.scr.material.color.set(0x5cff9d);if(id==='ammo1')tm.scr.material.color.set(0xffc24a);}
  for(const d of decals)if(d)d.visible=false;
  W.reactorParts.nexus.visible=true;W.reactorParts.nexus.position.set(0,3.2,0);
  setAlarm(false);$('#hex').classList.remove('on');$('#fx').className='';$('#killpop').innerHTML='';
  SHIP.visible=false;ESHIP.visible=false;
  if(AU.amb)AU.amb.ship.g.gain.value=0;
  rebuildNav();
}
const v=(x,y,z)=>new V3(x,y,z);
function spawnGroup(list,opts){for(const s of list)spawnEnemy(s[0],s[1],Object.assign({patrol:s[2],rail:s[3],yaw:s[4]},opts||{}));}
const GROUPS={
  city:[
    ['trooper',v(-6,0,34),[v(-6,0,34),v(-24,0,26),v(-6,0,17)]],
    ['trooper',v(16,0,24),[v(16,0,24),v(32,0,20),v(40,0,26)]],
    ['trooper',v(-4,0,8),[v(-4,0,8),v(-4,0,-6),v(4,0,0)]],
    ['heavy',v(0,0,-9),[v(-8,0,-9),v(8,0,-9)]],
    ['trooper',v(-28,0,-5),[v(-28,0,-5),v(-12,0,-4)]],
    ['marksman',v(-8,6,6),null,[v(-8,6,6),v(4,6,6)],Math.PI],
    ['trooper',v(50,0,0),[v(50,0,0),v(50,0,-30)]],
    ['trooper',v(46,0,-38),[v(46,0,-38)],null,Math.PI]
  ],
  facility:[
    ['trooper',v(-14,0,-20),[v(-14,0,-20),v(12,0,-20)]],
    ['trooper',v(8,0,-27),[v(8,0,-27),v(-8,0,-27)]],
    ['heavy',v(0,0,-29),[v(0,0,-29)],null,Math.PI],
    ['trooper',v(28,0,-36),[v(28,0,-36),v(20,0,-38)]],
    ['trooper',v(-9,0,-60),[v(-9,0,-60),v(-9,0,-40)]],
    ['trooper',v(9,0,-62),[v(9,0,-62),v(9,0,-47)]],
    ['heavy',v(0,0,-66),[v(0,0,-66)],null,Math.PI],
    ['marksman',v(-14,5,-50),null,[v(-14,5,-46),v(-14,5,-68)],-Math.PI/2],
    ['marksman',v(14,5,-60),null,[v(14,5,-46),v(14,5,-68)],Math.PI/2]
  ],
  waveA:[['trooper',v(-2,0,-77)],['trooper',v(2,0,-77)],['trooper',v(0,0,-79)],['heavy',v(0,0,-77)]],
  waveB:[['trooper',v(30,0,22)],['trooper',v(34,0,18)],['trooper',v(34,0,26)],['trooper',v(26,0,26)],['heavy',v(38,0,22)]],
  waveC:[['trooper',v(0,0,40)],['trooper',v(-6,0,44)],['trooper',v(20,0,22)],['trooper',v(24,0,16)],['trooper',v(2,0,-4)],['heavy',v(-24,0,20)],['marksman',v(-8,6,6),null,[v(-8,6,6),v(4,6,6)],Math.PI/2]]
};
function startMission(cp,skipIntro){
  initAudio();
  M=newMissionState(false);M.cp=cp;
  resetWorld();P=newPlayer();setViewmodel('rifle');DRONE.on=false;$('#droneFx').hidden=true;
  M.onKill=null;
  if(cp===0){spawnGroup(GROUPS.city);spawnGroup(GROUPS.facility);P.pos.set(0,0,64);P.yaw=0;}
  else if(cp===1){openDoorInstant('gate');spawnGroup(GROUPS.facility);P.pos.set(0,0,-11);P.yaw=0;M.stage=1;}
  else{openDoorInstant('gate');openDoorInstant('service');M.stage=1;P.pos.set(0,0,-43);P.yaw=Math.PI;takeCore(true);}
  WREN.pos.copy(P.pos).add(v(1,2,1));
  $('#rangeStats').hidden=true;$('#obj').hidden=false;W.lights.range.intensity=0;
  showHud(true);
  if(cp===0&&!skipIntro)startIntro();
  else{mode='play';requestLock(true);fadeIn();banner(cp?'CHECKPOINT':'ZERO HOUR',OBJ[M.stage].t,2.2);if(cp===0)comms('WREN','Drop complete. Helix squads are holding the intersection. The facility gate is due north.',6);}
}
function openDoorInstant(id){const d=W.doors[id];d.open=true;d.amt=d.max;d.col.alive=false;d.col.min[1]=d.max;d.col.max[1]=d.h+d.max;d.strip.material.color.set(0x5cff9d);rebuildNav();}
function breach(which){
  openDoor(which);if(which==='gate')openDoor('service');
  M.stage=1;saveCp(1);SFX.done();
  banner('ACCESS GRANTED',which==='gate'?'Main gate open':'Service door open',2.2,'var(--good)');
  comms('WREN','You\'re in. The Nexus Core is in the reactor atrium, straight north past the courtyard.',6);
}
function takeCore(instant){
  M.stage=2;M.countdown=150;setAlarm(true);
  openDoor('north');
  W.reactorParts.nexus.visible=!instant;M.coreAnim=instant?-1:0;
  spawnGroup(GROUPS.waveA,{combat:true,wave:1});
  if(!instant){saveCp(2);SFX.done();shake(.03,1.2);pulseFx(new V3(0,4,-52),0xff3d6e,14,1.2,.6);lightFlash(new V3(0,6,-52),0xff3d6e,6,30,1);}
  banner('CORE SECURED','The reactor is going critical',2.6,'var(--core)');
  comms('WREN','Core secured! Pulling it destabilised the reactor. You have two and a half minutes. Extraction pad is west of the intersection, top of the stairs.',8);
  setTimeout(()=>{if(M&&M.stage===2)comms('WREN','Blast door opening behind you. Reinforcements!',4);},2500);
}
function setAlarm(on){
  M&&(M.alarm=on);
  W.lights.hemi.color.setHex(on?0x7a3a4a:0x5a6fa8);
  scene.fog.color.setHex(on?0x160810:0x070c18);scene.background.setHex(on?0x12060c:0x050914);
  for(const l of W.lights.city){l.color.setHex(on?0xff3050:l.userData.col);}
}
function saveCp(cp){M.cp=cp;store('zh.cp',{cp,diff:SET.diff});}
function updateMission(dt){
  if(M.range){updateRangeMission(dt);return;}
  // core rising out of the reactor
  if(M.coreAnim>=0){M.coreAnim+=dt;const n=W.reactorParts.nexus;n.position.y=3.2+M.coreAnim*3;n.scale.setScalar(Math.max(.01,1-M.coreAnim/1.4));if(M.coreAnim>1.4){n.visible=false;M.coreAnim=-1;}}
  if(M.stage>=2){
    M.countdown-=dt;
    M.sirenT-=dt;if(M.sirenT<=0){M.sirenT=1.4;SFX.siren();}
    if(AU.amb){AU.amb.reactor.o.frequency.value=48+(150-M.countdown)*.25;AU.amb.reactor.g.gain.value=.5+Math.sin(M.time*8)*.2;}
    if(Math.random()<dt*.6)shake(.006,.3);
    if(M.countdown<=30&&!M.flags.c30){M.flags.c30=true;comms('WREN','Thirty seconds to meltdown! Move!',4);}
    if(M.countdown<=0){meltdown();return;}
    if(M.stage===2&&!M.flags.waveB&&P.pos.z>-13){M.flags.waveB=true;M.eshipT=0;comms('WREN','Helix dropship inbound on the east road!',4);}
    if(M.stage===2&&Math.hypot(P.pos.x+54,P.pos.z-22)<6&&P.pos.y>3){
      M.stage=3;M.shipT=0;M.hold=0;spawnGroup(GROUPS.waveC,{combat:true,wave:3});
      banner('HOLD THE PAD','SKYLARK is inbound',2.2,'var(--core)');comms('SKYLARK','SKYLARK on approach, twenty seconds. Keep that pad clear!',5);
    }
    if(M.stage===3){
      const onPad=Math.hypot(P.pos.x+54,P.pos.z-22)<6&&P.pos.y>3;
      if(onPad)M.hold=Math.min(20,M.hold+dt);else if(!M.flags.offPad||M.time-M.flags.offPad>8){M.flags.offPad=M.time;comms('SKYLARK','I can\'t land without you on the pad!',3);}
      if(M.hold>=20&&onPad)victory();
    }
  }
  updateShips(dt);
  M.distantT-=dt;if(M.distantT<=0){M.distantT=rand(7,16);SFX.distant();}
  if(M.stage===0&&!M.flags.mk&&P.pos.z<42){M.flags.mk=true;comms('WREN','Marksman on the skybridge. A red laser means you\'re being lined up. Break line of sight.',6);}
  if(M.stage===1&&!M.flags.atr&&P.pos.z<-32){M.flags.atr=true;comms('WREN','There\'s the reactor. The containment console is on the south side.',5);}
}
function updateShips(dt){
  // enemy transport delivering wave B
  if(M.eshipT>=0){
    M.eshipT+=dt;const t=M.eshipT;ESHIP.visible=true;
    const a=v(150,45,22),b=v(34,10,22),c=v(60,70,-60);
    if(t<5){ESHIP.position.lerpVectors(a,b,1-Math.pow(1-t/5,3));ESHIP.rotation.set(0,Math.PI/2,0);}
    else if(t<9){ESHIP.position.copy(b);ESHIP.position.y+=Math.sin(t*3)*.15;if(!M.flags.dropB){M.flags.dropB=true;spawnGroup(GROUPS.waveB,{combat:true,wave:2});for(const s of GROUPS.waveB)puff(s[1].clone().setY(.5),v(0,1,0),3,1.5,0x8d98ad,.5);}}
    else if(t<15){ESHIP.position.lerpVectors(b,c,Math.pow((t-9)/6,2));}
    else{ESHIP.visible=false;M.eshipT=-1;}
  }
  // friendly SKYLARK
  if(M.shipT>=0){
    M.shipT+=dt;const t=M.shipT;SHIP.visible=true;
    const a=v(-160,60,80),b=v(-54,16,22),c=v(-54,5.6,22);
    if(t<12){SHIP.position.lerpVectors(a,b,1-Math.pow(1-t/12,3));SHIP.rotation.set(0,Math.atan2(a.x-b.x,a.z-b.z),0);}
    else if(t<19){SHIP.position.lerpVectors(b,c,(t-12)/7);SHIP.rotation.y=lerp(SHIP.rotation.y,0,dt);}
    else SHIP.position.copy(c);
    SHIP.position.y+=Math.sin(M.time*2)*.06;
  }
  if(AU.amb){const s=SHIP.visible?SHIP:ESHIP.visible?ESHIP:null;AU.amb.ship.g.gain.value=s?.9:0;if(s)setPannerPos(AU.amb.ship.p,s.position);}
}
function meltdown(){
  if(mode!=='play')return;
  mode='dead';P.alive=false;
  const p=v(0,10,-52);pulseFx(p,0xffffff,120,2.5,.9);pulseFx(p,0xff3d6e,80,2,.7);SFX.boom(p,true);shake(.08,2);
  const f=$('#fade');f.classList.add('white');f.style.transition='opacity .25s';f.style.opacity=.95;setTimeout(()=>{f.style.transition='opacity 1.6s';f.style.opacity=0;},300);
  endScreen(false,'REACTOR MELTDOWN','The Nexus Core went up with Sector 9.');
}
function playerDied(){
  if(mode!=='play')return;
  P.alive=false;mode='dead';$('#hex').classList.remove('on');DRONE.on=false;$('#droneFx').hidden=true;
  canvas.classList.add('dead');
  if(M.range){setTimeout(()=>{if(!M||!M.range)return;canvas.classList.remove('dead');P.alive=true;P.hp=100;P.armor=50;P.pos.set(0,0,142);P.yaw=0;P.pitch=0;mode='play';toast('RESPAWNED');},1800);return;}
  endScreen(false,'OPERATIVE DOWN','Helix forces overwhelmed you.');
}
function victory(){
  mode='cine';M.victoryT=0;store('zh.cp',null);DRONE.on=false;$('#droneFx').hidden=true;
  if(document.pointerLockElement)document.exitPointerLock();
  comms('SKYLARK','Operative aboard. Punch it!',4);SFX.win();
  for(const e of EN)e.stunT=99;
}
function updateVictory(dt){
  const t=(M.victoryT+=dt);
  camera.position.lerp(v(-34,10,40),1-Math.exp(-dt*1.5));
  const s=SHIP.position;
  if(t>1.2){s.y+=dt*(2+t*2);s.x-=dt*t*4;SHIP.rotation.x=-.15;}
  camera.lookAt(t<3.2?s:v(0,10,-52).lerp(s,.3));
  if(t>3.2&&!M.flags.boom){M.flags.boom=true;const p=v(0,10,-52);pulseFx(p,0xffffff,90,2.6,.9);pulseFx(p,0xffc24a,60,2,.7);sparks(p,null,300,0xffc24a,30,4,2);SFX.boom(p,true);shake(.05,2.5);
    for(let i=0;i<14;i++)puff(p.clone().add(v(gauss()*8,rand(0,10),gauss()*8)),v(gauss()*3,rand(3,7),gauss()*3),rand(10,18),rand(5,8),0x2a2a34,.8);
    const f=$('#fade');f.classList.add('white');f.style.transition='opacity .2s';f.style.opacity=.85;setTimeout(()=>{f.style.transition='opacity 2s';f.style.opacity=0;},250);}
  if(t>7&&!M.flags.res){M.flags.res=true;endScreen(true,'MISSION COMPLETE','The Nexus Core is back in Aegis hands.');}
}
function endScreen(won,title,sub){
  if(!won)SFX.lose();
  setTimeout(()=>{
    if(document.pointerLockElement)document.exitPointerLock();
    const s=M.stats,acc=s.shots?Math.round(s.hits/s.shots*100):0,hs=s.hits?Math.round(s.heads/s.hits*100):0;
    const tm=Math.floor(M.time/60)+':'+String(Math.floor(M.time%60)).padStart(2,'0');
    let grade='';
    if(won){const sc=s.kills*55+acc*9+Math.max(0,720-M.time)-s.dmgTaken*1.2+(SET.diff==='elite'?250:SET.diff==='recruit'?-150:0);grade=sc>=1500?'S':sc>=1100?'A':sc>=750?'B':'C';
      const best=store('zh.best')||{};if(!best.time||M.time<best.time){best.time=M.time;best.grade=grade;store('zh.best',best);}}
    const el=$('#result');el.hidden=false;mode=won?'won':'lost';
    el.innerHTML=`<div class="sheet" style="width:min(720px,100%);background:transparent;border:0;align-items:stretch">
      <div class="eyebrow" style="text-align:center">Operation Zero Hour · ${SET.diff}</div>
      <div class="rbig" style="color:${won?'var(--aegis)':'var(--helix)'}">${title}</div>
      <div style="text-align:center;color:#c7d6ec">${sub}</div>
      ${won?`<div class="grade">${grade}</div><div class="eyebrow" style="text-align:center">Mission grade</div>`:''}
      <div class="rstats"><div><b>${tm}</b><span>MISSION TIME</span></div><div><b>${s.kills}</b><span>ELIMINATIONS</span></div><div><b>${acc}%</b><span>ACCURACY</span></div>
      <div><b>${hs}%</b><span>HEADSHOTS</span></div><div><b>${Math.round(s.dmgTaken)}</b><span>DAMAGE TAKEN</span></div><div><b>${Math.round(s.blocked)}</b><span>BLOCKED BY AEGIS</span></div></div>
      <div class="btns" style="justify-content:center">${!won&&M.cp>0?'<button class="btn pri" id="rCp">Retry from checkpoint</button>':''}<button class="btn ${won||!M.cp?'pri':''}" id="rAgain">${won?'Play again':'Restart mission'}</button><button class="btn" id="rMenu">Main menu</button></div></div>`;
    const go=fn=>()=>{el.hidden=true;canvas.classList.remove('dead');fn();};
    if($('#rCp'))$('#rCp').onclick=go(()=>startMission(M.cp,true));
    $('#rAgain').onclick=go(()=>startMission(0,true));
    $('#rMenu').onclick=go(toMenu);
  },won?0:2000);
}

/* ================= FIRING RANGE ================= */
function startRange(){
  initAudio();M=newMissionState(true);resetWorld();P=newPlayer();setViewmodel('rifle');DRONE.on=false;$('#droneFx').hidden=true;
  P.pos.set(0,0,142);P.yaw=0;
  const lanes=[[v(-12,0,124),v(-4,0,124),.9],[v(6,0,124),v(6,0,124),0],[v(-14,0,114),v(-2,0,114),.7],[v(4,0,114),v(14,0,114),1.2],[v(-10,0,104),v(10,0,104),.6],[v(0,0,96),v(0,0,96),0]];
  for(const l of lanes){const e=spawnEnemy('dummy',l[0],{rail:[l[0],l[1]]});e.sp=l[2];e.railT=rand(0,TAU);}
  M.onKill=e=>{if(M.drill&&e.type!=='dummy'){M.drill.left--;if(M.drill.left<=0){const t=M.drill.t;const best=store('zh.drill');if(!best||t<best)store('zh.drill',t);banner('DRILL CLEARED',t.toFixed(1)+' s'+(!best||t<best?' · new best':''),2.4,'var(--good)');M.drill=null;SFX.done();}}};
  $('#obj').hidden=true;$('#rangeStats').hidden=false;W.lights.range.intensity=1.1;
  showHud(true);mode='play';requestLock(true);fadeIn();
  banner('FIRING RANGE','Use the green terminal behind you to start a live drill',3);
  comms('RANGE','Targets are live. Cooldowns are shortened and ammo is unlimited here.',5);
}
function startDrill(){
  for(const s of [v(-12,0,92),v(0,0,90),v(12,0,92)])spawnEnemy('trooper',s,{combat:true});
  M.drill={t:0,left:3};banner('DRILL STARTED','Three hostile troopers at the far end',1.8,'var(--helix)');SFX.alert(v(0,1,92));
}
function updateRangeMission(dt){
  if(M.drill)M.drill.t+=dt;
  for(let i=EN.length-1;i>=0;i--){const e=EN[i];if(!e.alive&&!e.dummy&&e.deadT>5){world.remove(e.model.g);if(e.laser)scene.remove(e.laser);EN.splice(i,1);}}
}

/* ================= INTRO ================= */
const INTRO={path:new THREE.CatmullRomCurve3([v(70,55,95),v(25,32,45),v(-30,20,12),v(-6,9,78),v(0,1.62,64)]),
  look:new THREE.CatmullRomCurve3([v(0,12,-30),v(0,10,-45),v(-54,4,22),v(0,4,40),v(0,1.62,40)]),dur:15,
  capt:[[.6,4.2,'THE LAST CITY · 2089','Sector 9, under Helix curfew'],[4.8,9.2,'THE NEXUS CORE WAS STOLEN','Helix locked it inside their reactor to power a war.'],[9.8,14,'OPERATION ZERO HOUR','Get in. Pull the core. Get out before the reactor goes.']]};
function startIntro(){mode='intro';INTRO.t=0;$('#cine').classList.remove('off');$('#skip').hidden=false;showHud(false);fadeIn();}
function updateIntro(dt){
  INTRO.t+=dt;const k=Math.min(1,INTRO.t/INTRO.dur),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
  camera.position.copy(INTRO.path.getPoint(e));camera.lookAt(INTRO.look.getPoint(e));
  if(Math.abs(camera.fov-60)>.1){camera.fov=60;camera.updateProjectionMatrix();}
  const c=INTRO.capt.find(c=>INTRO.t>=c[0]&&INTRO.t<c[1]);const ce=$('#capt');
  if(c){if(ce._c!==c){ce._c=c;$('#captT').textContent=c[2];$('#captS').textContent=c[3];}ce.classList.add('on');}else ce.classList.remove('on');
  if(INTRO.t>=INTRO.dur)endIntro();
}
function endIntro(){
  if(mode!=='intro')return;
  $('#cine').classList.add('off');$('#skip').hidden=true;$('#capt').classList.remove('on');
  P.pitch=0;camera.fov=SET.fov;camera.updateProjectionMatrix();
  showHud(true);mode='play';requestLock(true);
  banner('ZERO HOUR',OBJ[0].t,2.2);
  comms('WREN','Drop complete. Helix squads are holding the intersection. The facility gate is due north.',6);
}

/* ================= HUD ================= */
function showHud(on){$('#hud').hidden=!on;}
let bannerT=0;
function banner(title,sub,dur,color){$('#banT').textContent=title;$('#banT').style.color=color||'var(--ink)';$('#banS').textContent=sub||'';$('#banS').hidden=!sub;$('#banner').classList.add('on');bannerT=dur||2;}
function toast(text){addFeed('',text);}
function addFeed(tag,text){const el=document.createElement('div');el.className='kf';el.innerHTML=(tag?`<b>${tag}</b>`:'')+text;const f=$('#feed');f.prepend(el);while(f.children.length>5)f.lastChild.remove();setTimeout(()=>el.remove(),4500);}
function comms(who,text,dur){M.comms.push({who,text,dur});}
function fadeIn(){const f=$('#fade');f.classList.remove('white');f.style.transition='none';f.style.opacity=1;requestAnimationFrame(()=>{f.style.transition='opacity .9s';f.style.opacity=0;});}
const setT=(el,v)=>{if(el._v!==v){el._v=v;el.textContent=v;}};
const setH=(el,v)=>{if(el._v!==v){el._v=v;el.innerHTML=v;}};
const indPool=[],alPool=[];
function project(p,out){out.copy(p).project(camera);return out;}
function updateHud(dt){
  if(bannerT>0){bannerT-=dt;if(bannerT<=0)$('#banner').classList.remove('on');}
  // comms
  if(M.commT>0){M.commT-=dt;if(M.commT<=0)$('#comms').classList.remove('on');}
  else if(M.comms.length){const c=M.comms.shift();$('#commW').textContent=c.who;$('#commT').textContent=c.text;$('#comms').classList.add('on');M.commT=c.dur;SFX.radio();}
  const w=curW();
  setT($('#hpNum'),String(Math.ceil(P.hp)));$('#hpNum').classList.toggle('low',P.hp<35);
  $('#hpBar i').style.width=P.hp+'%';$('#arBar i').style.width=(P.armor/50*100)+'%';
  $('#lowhp').style.opacity=P.alive&&P.hp<35?(.6+Math.sin(M.time*5)*.3):0;
  setH($('#ammoNum'),`${w.mag}<small> / ${M.range?'∞':w.reserve}</small>`);$('#ammoNum').classList.toggle('low',w.mag<=Math.ceil(w.def.mag*.25));
  setT($('#wName'),w.def.name);
  for(const k of ['q','e','x']){const el=$('#ak-'+k),ab=P.ab[k],c=el.lastChild,max=ab.max*(M.range?.35:1);
    el.classList.toggle('ready',ab.cd<=0);el.classList.toggle('live',(k==='x'&&P.aegisT>0)||(k==='q'&&P.phaseT>0));
    c.style.setProperty('--p',ab.cd>0?ab.cd/max:0);setT(c,ab.cd>0?String(Math.ceil(ab.cd)):'');}
  const hs=Math.hypot(P.vel.x,P.vel.z);
  $('#crosshair').style.setProperty('--g',(4+Math.min(16,hs*1.2+P.spray*.8+(P.onGround?0:8))*(1-P.ads*.6))+'px');
  $('#crosshair').style.display=P.alive&&!P.sprinting&&mode==='play'?'':'none';
  // objective
  if(!M.range){
    const o=OBJ[Math.min(M.stage,3)];setT($('#objS'),`Objective ${M.stage+1} / 4`);setT($('#objT'),o.t);setT($('#objD'),o.d);
    $('#objBar i').style.width=(M.stage===3?M.hold/20*100:P.interact&&P.holdT>0?P.holdT/P.interact.hold*100:0)+'%';
    $('#countdown').hidden=M.stage<2;if(M.stage>=2){const c=Math.max(0,M.countdown);setT($('#cdNum'),Math.floor(c/60)+':'+String(Math.floor(c%60)).padStart(2,'0'));}
    objMarker(o.pos);
  }else{
    $('#countdown').hidden=true;$('#objMark').hidden=true;
    const s=M.stats,best=store('zh.drill');
    setH($('#rangeStats'),`<span>Eliminations</span><b>${M.rstats.kills+s.kills}</b><span>Shots fired</span><b>${s.shots}</b><span>Accuracy</span><b>${s.shots?Math.round(s.hits/s.shots*100):0}%</b><span>Headshots</span><b>${s.hits?Math.round(s.heads/s.hits*100):0}%</b><span>Drill</span><b>${M.drill?M.drill.t.toFixed(1)+' s':'—'}</b><span>Best drill</span><b>${best?best.toFixed(1)+' s':'—'}</b>`);
  }
  // interaction hint
  let hint='';if(P.interact&&mode==='play')hint=`<kbd>F</kbd>${P.interact.hold>1?'Hold to ':''}${P.interact.label.charAt(0).toLowerCase()+P.interact.label.slice(1)}`;
  if(!hint&&M.stage===3&&!M.range&&!(Math.hypot(P.pos.x+54,P.pos.z-22)<6&&P.pos.y>3))hint='Get back inside the extraction ring';
  const he=$('#hint');he.hidden=!hint;setH(he,hint);
  const pr=P.interact&&P.holdT>0?P.holdT/P.interact.hold:0;$('#prog').hidden=!pr;$('#progFill').style.width=(pr*100)+'%';
  $('#lockHint').hidden=!(mode==='play'&&!locked&&!lockFailed);
  // stealth state + enemy indicators
  let maxA=0,det=false;camera.updateMatrixWorld();
  let ii=0,ai=0;const W2=innerWidth,H2=innerHeight;
  for(const e of EN){
    if(!e.alive||e.dummy)continue;
    if(e.state==='combat'&&e.seenT<3)det=true;
    if(e.state!=='combat')maxA=Math.max(maxA,e.aware);
    const show=e.aware>.05&&(e.state!=='patrol'||e.aware>.1);if(!show)continue;
    const hp=T1.set(e.pos.x,e.pos.y+2.35,e.pos.z);const toE=T2.copy(hp).sub(camera.position);
    const fwd=T3.set(0,0,-1).applyQuaternion(camera.quaternion);const front=toE.dot(fwd)>0;
    project(hp,T4);
    if(front&&Math.abs(T4.x)<1&&Math.abs(T4.y)<1){
      let el=indPool[ii];if(!el){el=document.createElement('div');el.className='ei';$('#ind').appendChild(el);indPool[ii]=el;}ii++;
      el.style.display='';el.style.transform=`translate(${(T4.x+1)/2*W2}px,${(1-T4.y)/2*H2}px)`;
      const c=e.state==='combat';el.classList.toggle('det',c);el.style.setProperty('--a',c?1:e.aware);el.dataset.s=c?'!':'?';
    }else if(e.aware>.3){
      let el=alPool[ai];if(!el){el=document.createElement('div');el.className='al';$('#alerts').appendChild(el);alPool[ai]=el;}ai++;
      const rel=angDiff(P.yaw,yawTo(e.pos.x-P.pos.x,e.pos.z-P.pos.z));el.style.display='';el.style.transform=`rotate(${-rel}rad)`;el.classList.toggle('det',e.state==='combat');
    }
  }
  for(;ii<indPool.length;ii++)indPool[ii].style.display='none';for(;ai<alPool.length;ai++)alPool[ai].style.display='none';
  const st=$('#stealth');const s=det?'det':maxA>.25?'sus':'hidden';if(st._s!==s){st._s=s;st.className=s;st.textContent=det?'DETECTED':s==='sus'?'SUSPICIOUS':'HIDDEN';}
  st.hidden=M.range;
  drawCompass();
}
function objMarker(p){
  const el=$('#objMark');if(mode!=='play'){el.hidden=true;return;}
  el.hidden=false;const W2=innerWidth,H2=innerHeight;
  const fwd=T3.set(0,0,-1).applyQuaternion(camera.quaternion),to=T2.copy(p).sub(camera.position);
  project(p,T4);let x=(T4.x+1)/2*W2,y=(1-T4.y)/2*H2;
  if(to.dot(fwd)<0||x<40||x>W2-40||y<60||y>H2-60){const rel=angDiff(P.yaw,yawTo(to.x,to.z));x=W2/2-Math.sin(rel)*W2*.42;y=H2/2-Math.cos(rel)*H2*.38;x=clamp(x,40,W2-40);y=clamp(y,80,H2-140);}
  el.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%)`;el.style.left='0';el.style.top='0';
  setT($('#objDist'),Math.round(P.pos.distanceTo(p))+' m');
}
function drawCompass(){
  const cv=$('#compass'),g=cv.getContext('2d'),W2=440,H2=34;g.clearRect(0,0,W2,H2);
  g.fillStyle='rgba(8,13,24,.7)';g.fillRect(0,0,W2,H2);
  const span=Math.PI*.62,px=r=>W2/2-r/span*(W2/2);
  for(let deg=0;deg<360;deg+=15){const a=deg*Math.PI/180;const rel=angDiff(P.yaw,a);if(Math.abs(rel)>span)continue;const x=px(rel);
    const lbl={0:'N',90:'W',180:'S',270:'E'}[deg];
    g.fillStyle=lbl?'#e4efff':'rgba(200,220,255,.45)';
    if(lbl){g.font='700 15px "Saira Condensed",sans-serif';g.textAlign='center';g.fillText(lbl,x,22);}else g.fillRect(x-.5,deg%45?20:16,1,deg%45?6:10);}
  if(!M.range){const o=OBJ[Math.min(M.stage,3)].pos;const rel=angDiff(P.yaw,yawTo(o.x-P.pos.x,o.z-P.pos.z));const x=px(clamp(rel,-span,span));
    g.fillStyle='#ffc24a';g.save();g.translate(x,8);g.rotate(Math.PI/4);g.fillRect(-4,-4,8,8);g.restore();}
  for(const e of EN){if(!e.alive||e.dummy||e.state!=='combat')continue;const rel=angDiff(P.yaw,yawTo(e.pos.x-P.pos.x,e.pos.z-P.pos.z));if(Math.abs(rel)>span)continue;g.fillStyle='#ff3d6e';g.fillRect(px(rel)-2,H2-4,4,4);}
  g.fillStyle='#38e8ff';g.fillRect(W2/2-1,0,2,6);
}
function updateInteract(dt){
  let best=null,bd=1e9;
  for(const t of TERMS){if(!t.enabled())continue;const d=Math.hypot(P.pos.x-t.pos.x,P.pos.z-t.pos.z);if(d<t.r&&Math.abs(P.pos.y-t.pos.y)<1.5&&d<bd){bd=d;best=t;}}
  if(best!==P.interact)P.holdT=0;
  P.interact=best;
  if(best&&keys.KeyF&&mode==='play'&&P.alive){P.holdT+=dt;if(best.tick)best.tick(dt);if(P.holdT>=best.hold){P.holdT=0;keys.KeyF=false;best.done();}}
  else P.holdT=0;
}

/* ================= MENUS & INPUT ================= */
let settingsFrom='menu';
function toMenu(){
  if(document.pointerLockElement)document.exitPointerLock();
  mode='menu';showHud(false);DRONE.on=false;DRONE.k=0;$('#droneFx').hidden=true;if(PM)PM.g.visible=false;['#pause','#settings','#keysPanel','#result'].forEach(s=>$(s).hidden=true);
  $('#cine').classList.add('off');canvas.classList.remove('dead');
  if(M)resetWorld();M=newMissionState(false);P=newPlayer();P.alive=false;
  spawnGroup(GROUPS.city);spawnGroup(GROUPS.facility);
  camera.fov=60;camera.updateProjectionMatrix();
  renderMenu();$('#menu').hidden=false;fadeIn();
}
function renderMenu(){
  const cp=store('zh.cp');$('#mCont').hidden=!(cp&&cp.cp>0);
  let n=0;document.querySelectorAll('.mbtn').forEach(b=>{if(!b.hidden)b.querySelector('.k').textContent=String(++n).padStart(2,'0');});
  if(cp&&cp.cp>0)$('#mContSub').textContent=cp.cp===1?'Checkpoint · inside the facility':'Checkpoint · core secured, escape';
  const best=store('zh.best');$('#mBest').innerHTML=best?`Best clear · <b>${Math.floor(best.time/60)}:${String(Math.floor(best.time%60)).padStart(2,'0')}</b> · grade <b>${best.grade}</b>`:'No clears recorded yet';
}
function menuCam(t){
  const a=t*.035;const r=62;
  camera.position.set(Math.cos(a)*r,24+Math.sin(t*.11)*6,Math.sin(a)*r*0.9+2);
  camera.lookAt(0,8+Math.sin(t*.07)*3,-24);
}
function pauseGame(){if(mode!=='play')return;mode='paused';$('#pause').hidden=false;for(const k in keys)keys[k]=false;mouse.left=mouse.right=false;$('#pCheck').hidden=M.range||M.cp===0;}
function resumeGame(){$('#pause').hidden=true;mode='play';requestLock(true);}
function openSettings(from){settingsFrom=from;$('#settings').hidden=false;if(from==='pause')$('#pause').hidden=true;
  $('#sSens').value=SET.sens;$('#sFov').value=SET.fov;$('#sVol').value=SET.vol;$('#sMus').value=SET.music;$('#sInv').checked=SET.invert;$('#sDiff').value=SET.diff;$('#sQual').value=SET.quality;$('#sFps').checked=SET.fps;syncOut();}
function syncOut(){$('#oSens').textContent=(+SET.sens).toFixed(1);$('#oFov').textContent=SET.fov+'°';$('#oVol').textContent=Math.round(SET.vol*100)+'%';$('#oMus').textContent=Math.round(SET.music*100)+'%';}
function closeSettings(){$('#settings').hidden=true;if(settingsFrom==='pause')$('#pause').hidden=false;}
function openKeys(from){settingsFrom=from;$('#keysPanel').hidden=false;if(from==='pause')$('#pause').hidden=true;}
function closeKeys(){$('#keysPanel').hidden=true;if(settingsFrom==='pause')$('#pause').hidden=false;}
const fsOK=!!(document.fullscreenEnabled&&document.documentElement.requestFullscreen);
function toggleFull(){try{if(document.fullscreenElement)document.exitFullscreen();else{const r=document.documentElement.requestFullscreen();if(r&&r.catch)r.catch(()=>toast('Fullscreen is not available here'));}}catch(e){}}
$('#mFull').hidden=!fsOK;$('#pFull').hidden=!fsOK;
$('#mStart').onclick=()=>{$('#menu').hidden=true;startMission(0,false);};
$('#mCont').onclick=()=>{const cp=store('zh.cp');$('#menu').hidden=true;startMission(cp?cp.cp:0,true);};
$('#mRange').onclick=()=>{$('#menu').hidden=true;startRange();};
$('#mSet').onclick=()=>openSettings('menu');$('#mKeys').onclick=()=>openKeys('menu');$('#mFull').onclick=toggleFull;
$('#pResume').onclick=resumeGame;
$('#pCheck').onclick=()=>{$('#pause').hidden=true;startMission(M.cp,true);};
$('#pRestart').onclick=()=>{$('#pause').hidden=true;if(M.range)startRange();else startMission(0,true);};
$('#pSet').onclick=()=>openSettings('pause');$('#pKeys').onclick=()=>openKeys('pause');$('#pFull').onclick=toggleFull;
$('#pQuit').onclick=toMenu;
$('#sDone').onclick=closeSettings;$('#kDone').onclick=closeKeys;
$('#sSens').oninput=e=>{SET.sens=+e.target.value;saveSet();syncOut();};
$('#sFov').oninput=e=>{SET.fov=+e.target.value;saveSet();syncOut();if(mode==='play'||mode==='paused'){camera.fov=SET.fov;camera.updateProjectionMatrix();}};
$('#sVol').oninput=e=>{SET.vol=+e.target.value;if(AU.master)AU.master.gain.value=SET.vol;saveSet();syncOut();};
$('#sMus').oninput=e=>{SET.music=+e.target.value;saveSet();syncOut();};
$('#sFps').onchange=e=>{SET.fps=e.target.checked;saveSet();$('#fpsBox').hidden=!SET.fps;};
$('#sInv').onchange=e=>{SET.invert=e.target.checked;saveSet();};
$('#sDiff').onchange=e=>{SET.diff=e.target.value;saveSet();};
$('#sQual').onchange=e=>{SET.quality=e.target.value;saveSet();applyQuality();};
if(matchMedia('(pointer:coarse)').matches&&!matchMedia('(pointer:fine)').matches)$('#touchNote').hidden=false;

addEventListener('keydown',e=>{
  if(['Space','Tab','KeyF','ArrowUp','ArrowDown'].includes(e.code)&&mode!=='menu')e.preventDefault();
  if(mode==='intro'&&(e.code==='Space'||e.code==='Enter'||e.code==='Escape')){endIntro();return;}
  const first=!keys[e.code];keys[e.code]=true;if(!first)return;
  if(mode==='paused'&&e.code==='Escape'&&$('#settings').hidden&&$('#keysPanel').hidden){resumeGame();return;}
  if(mode!=='play')return;
  switch(e.code){
    case 'Escape':if(!locked)pauseGame();break;
    case 'KeyR':startReload();break;
    case 'Digit1':switchTo(1);break;case 'Digit2':switchTo(2);break;
    case 'KeyQ':useAbility('q');break;case 'KeyE':useAbility('e');break;case 'KeyX':useAbility('x');break;
    case 'KeyT':toggleDrone();break;
    case 'KeyV':if(!P.reloading&&P.switchT<=0){VM.inspect=2.4;SFX.swap();}break;
  }
});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.left=mouse.right=false;});
addEventListener('mousemove',e=>{
  if(mode!=='play'||!P.alive)return;if(!locked&&!lockFailed)return;
  const s=SET.sens*.0011*(camera.fov/SET.fov);
  P.yaw-=e.movementX*s;P.pitch=clamp(P.pitch-e.movementY*s*(SET.invert?-1:1),-1.5,1.5);
  VM.mx=clamp(VM.mx+e.movementX*.00025,-.03,.03);VM.my=clamp(VM.my+e.movementY*.00025,-.03,.03);
});
canvas.addEventListener('mousedown',e=>{
  if(mode==='intro'){endIntro();return;}
  if(mode!=='play')return;
  if(!locked&&!lockFailed){requestLock(true);return;}
  if(e.button===0)mouse.left=true;if(e.button===2)mouse.right=true;
});
addEventListener('mouseup',e=>{if(e.button===0)mouse.left=false;if(e.button===2)mouse.right=false;});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('wheel',()=>{if(mode==='play'&&P)switchTo(P.slot===1?2:1);},{passive:true});

/* ================= LOOP ================= */
let last=performance.now();
function frame(ts){
  requestAnimationFrame(frame);
  const rdt=Math.min(.05,(ts-last)/1000);last=ts;const t=ts/1000;
  if(mode==='play'||mode==='menu')perfTick(rdt);
  if(slowT>0){slowT-=rdt;timeScale=lerp(timeScale,.28,.35);}else timeScale=lerp(timeScale,1,.12);
  if(STREAK.t>0)STREAK.t-=rdt;
  const dt=rdt*timeScale;
  try{
    updateEnvironment(dt,t);updateDoors(dt);
    if(mode==='menu'){menuCam(t);for(const e of EN)if(e.alive&&e.state==='patrol')updateEnemy(e,dt);}
    else if(mode==='intro'){updateIntro(dt);M.time+=0;for(const e of EN)updateEnemy(e,dt);}
    else if(mode==='play'){M.time+=dt;updatePlayer(dt);updateInteract(dt);updateMission(dt);for(const e of EN)updateEnemy(e,dt);updateHud(dt);}
    else if(mode==='dead'||mode==='lost'){for(const e of EN)updateEnemy(e,dt);camera.position.y=lerp(camera.position.y,P.pos.y+.35,dt*2.5);camera.rotation.z=lerp(camera.rotation.z,.5,dt*2.5);updateShips(dt);}
    else if(mode==='cine'||mode==='won'){updateVictory(dt);for(const e of EN)updateEnemy(e,dt);}
    if(mode!=='paused'&&P){updateWren(dt,t);updateSparks(dt);updateTracers(dt);updateShells(dt);updatePulses(dt);updatePuffs(dt);updateFlashLights(dt);updateRain(dt);}
    if(P)updateViewmodel(dt);
    updateListener();updateMusic();
  }catch(err){console.error(err);}
  render();
}
function render(){
  const showVM=VM.root.visible;
  if(composer&&SET.quality==='high'){rpVM.enabled=showVM;composer.render();}
  else{renderer.autoClear=false;renderer.setRenderTarget(null);renderer.clear();renderer.render(scene,camera);if(showVM){renderer.clearDepth();renderer.render(vmScene,vmCam);}}
}

/* ================= BOOT ================= */
(async function boot(){
  try{await Promise.race([Promise.all([document.fonts.load('700 76px "Saira Condensed"'),document.fonts.load('500 18px "JetBrains Mono"'),document.fonts.load('500 18px "Chakra Petch"')]),new Promise(r=>setTimeout(r,1800))]);}catch(e){}
  try{
    buildTextures();ENV=makeEnv();buildMaterials();
    buildCity();buildFacility();buildRange();buildLights();initTerminals();
    mergeStatic();W.lights.range.intensity=0;rebuildNav();initSparks();applyQuality();
    toMenu();
    requestAnimationFrame(frame);
  }catch(e){console.error(e);$('#fatal').hidden=false;}
})();
