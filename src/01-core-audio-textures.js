'use strict';
if(!window.THREE){document.getElementById('fatal').hidden=false;throw new Error('Three.js failed to load');}
const $=s=>document.querySelector(s);
const V3=THREE.Vector3;
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const TAU=Math.PI*2;
const gauss=()=>(Math.random()+Math.random()+Math.random()-1.5)*0.9;
const pick=a=>a[Math.floor(Math.random()*a.length)];
function angDiff(a,b){let d=(b-a)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d;}
const yawTo=(dx,dz)=>Math.atan2(-dx,-dz);
const T1=new V3(),T2=new V3(),T3=new V3(),T4=new V3();

/* ================= SETTINGS ================= */
const SET={sens:1.6,fov:82,vol:.75,music:.55,fps:false,invert:false,diff:'operative',quality:'high'};
try{Object.assign(SET,JSON.parse(localStorage.getItem('zh.settings')||'{}'))}catch(e){}
function saveSet(){try{localStorage.setItem('zh.settings',JSON.stringify(SET))}catch(e){}}
function store(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||'null');localStorage.setItem(k,JSON.stringify(v));}catch(e){return null}}
const DIFF={recruit:{acc:-.14,dmg:.65,detect:.7,react:.65},operative:{acc:0,dmg:1,detect:1,react:.45},elite:{acc:.1,dmg:1.3,detect:1.35,react:.3}};
const D=()=>DIFF[SET.diff]||DIFF.operative;

/* ================= RENDERER ================= */
const canvas=$('#gl');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}
catch(e){document.getElementById('fatal').hidden=false;throw e;}
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x050914);
scene.fog=new THREE.FogExp2(0x070c18,.0135);
const camera=new THREE.PerspectiveCamera(SET.fov,innerWidth/innerHeight,.05,600);
camera.rotation.order='YXZ';scene.add(camera);
const vmScene=new THREE.Scene();
const vmCam=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.01,10);vmScene.add(vmCam);
vmScene.add(new THREE.HemisphereLight(0x9fc4ff,0x1a1a28,.95));
const vmKey=new THREE.DirectionalLight(0xffffff,.8);vmKey.position.set(1,2,1);vmScene.add(vmKey);
const vmFlash=new THREE.PointLight(0xffc27a,0,3);vmFlash.position.set(.15,-.1,-.7);vmScene.add(vmFlash);

let composer=null,rpMain=null,rpVM=null,bloomPass=null;
try{
  if(THREE.EffectComposer&&THREE.UnrealBloomPass&&THREE.RenderPass){
    composer=new THREE.EffectComposer(renderer);
    rpMain=new THREE.RenderPass(scene,camera);composer.addPass(rpMain);
    rpVM=new THREE.RenderPass(vmScene,vmCam);rpVM.clear=false;rpVM.clearDepth=true;composer.addPass(rpVM);
    bloomPass=new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.8,.5,.8);composer.addPass(bloomPass);
  }
}catch(e){console.warn('Bloom unavailable, using plain rendering',e);composer=null;}
function onResize(){
  const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);
  for(const c of [camera,vmCam]){c.aspect=w/h;c.updateProjectionMatrix();}
  if(composer)composer.setSize(w,h);
}
function applyQuality(){
  const hi=SET.quality==='high';
  PERF.max=Math.min(devicePixelRatio||1,hi?1.25:1);PERF.pr=PERF.max;
  renderer.setPixelRatio(PERF.pr);if(composer&&composer.setPixelRatio)composer.setPixelRatio(PERF.pr);
  if(renderer.shadowMap.enabled!==hi){renderer.shadowMap.enabled=hi;scene.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true);});}
  onResize();
}
addEventListener('resize',onResize);
// dynamic resolution: drop render scale when the frame rate sags, recover when there is headroom
const PERF={pr:1,max:1,acc:0,frames:0,fps:60};
function perfTick(rdt){
  PERF.acc+=rdt;PERF.frames++;
  if(PERF.acc<1.5)return;
  PERF.fps=PERF.frames/PERF.acc;PERF.acc=0;PERF.frames=0;
  const el=document.getElementById('fpsBox');if(el){el.hidden=!SET.fps;if(SET.fps)el.textContent=Math.round(PERF.fps)+' FPS · '+Math.round(PERF.pr*100)+'%';}
  let np=PERF.pr;
  if(PERF.fps<48&&PERF.pr>.6)np=Math.max(.6,PERF.pr-.15);
  else if(PERF.fps>58&&PERF.pr<PERF.max)np=Math.min(PERF.max,PERF.pr+.1);
  if(np!==PERF.pr){PERF.pr=np;renderer.setPixelRatio(np);if(composer&&composer.setPixelRatio)composer.setPixelRatio(np);onResize();}
}

/* ================= AUDIO ================= */
const AU={ctx:null,master:null,noise:null,amb:null};
function initAudio(){
  if(AU.ctx){if(AU.ctx.state==='suspended')AU.ctx.resume();return;}
  try{
    const C=window.AudioContext||window.webkitAudioContext;AU.ctx=new C();
    AU.master=AU.ctx.createGain();AU.master.gain.value=SET.vol;AU.master.connect(AU.ctx.destination);
    const len=AU.ctx.sampleRate*2,b=AU.ctx.createBuffer(1,len,AU.ctx.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=Math.random()*2-1;AU.noise=b;
    startAmbience();
    musicStart();
  }catch(e){AU.ctx=null;}
}
function setPannerPos(p,pos){if(p.positionX){p.positionX.value=pos.x;p.positionY.value=pos.y;p.positionZ.value=pos.z;}else p.setPosition(pos.x,pos.y,pos.z);}
function outNode(pos,ref){
  if(!pos)return AU.master;
  const p=AU.ctx.createPanner();p.panningModel='HRTF';p.distanceModel='inverse';p.refDistance=ref||3;p.maxDistance=200;p.rolloffFactor=1.1;
  setPannerPos(p,pos);p.connect(AU.master);return p;
}
function nb(dest,t0,dur,freq,q,gain,type){
  const c=AU.ctx,s=c.createBufferSource();s.buffer=AU.noise;s.loop=true;
  const f=c.createBiquadFilter();f.type=type||'bandpass';f.frequency.value=freq;f.Q.value=q;
  const g=c.createGain();g.gain.setValueAtTime(gain,t0);g.gain.exponentialRampToValueAtTime(.001,t0+dur);
  s.connect(f);f.connect(g);g.connect(dest);s.start(t0,Math.random()*1.5);s.stop(t0+dur+.05);
}
function tn(dest,t0,dur,f0,f1,gain,type){
  const c=AU.ctx,o=c.createOscillator();o.type=type||'sine';
  o.frequency.setValueAtTime(f0,t0);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t0+dur);
  const g=c.createGain();g.gain.setValueAtTime(gain,t0);g.gain.exponentialRampToValueAtTime(.001,t0+dur);
  o.connect(g);g.connect(dest);o.start(t0);o.stop(t0+dur+.05);
}
const now=()=>AU.ctx.currentTime;
const SFX={
  shot(kind,pos){if(!AU.ctx)return;const t=now(),d=outNode(pos);
    const k={lancer:[1800,.16,.65,120],marrow:[2400,.12,.5,180],trooper:[2000,.14,.55,140],heavy:[1300,.2,.75,90],marksman:[1100,.5,.9,70]}[kind]||[2000,.12,.6,150];
    nb(d,t,k[1],k[0],.8,k[2]);nb(d,t,k[1]*2.4,700,.5,k[2]*.5,'lowpass');tn(d,t,k[1]*1.4,k[3],40,k[2]*.85,'triangle');
    if(kind==='marksman'){tn(d,t,.4,2600,300,.18,'sawtooth');nb(d,t+.05,1,400,.3,.25,'lowpass');}},
  step(pos,vol){if(!AU.ctx)return;const t=now(),d=outNode(pos);nb(d,t,.07,rand(700,1100),1.3,vol);tn(d,t,.06,130,60,vol*.5)},
  land(){if(!AU.ctx)return;nb(AU.master,now(),.14,500,.8,.28,'lowpass')},
  hit(head){if(!AU.ctx)return;const t=now();tn(AU.master,t,head?.2:.07,head?1900:1150,head?1500:900,.16)},
  kill(){if(!AU.ctx)return;const t=now();tn(AU.master,t,.1,880,880,.11,'square');tn(AU.master,t+.08,.22,1320,1320,.1,'square')},
  armor(pos){if(!AU.ctx)return;nb(outNode(pos),now(),.12,4200,2,.3)},
  hurt(){if(!AU.ctx)return;const t=now();nb(AU.master,t,.18,380,.7,.35,'lowpass');tn(AU.master,t,.15,95,50,.35)},
  dry(){if(!AU.ctx)return;nb(AU.master,now(),.03,4000,4,.2)},
  reload(){if(!AU.ctx)return;const t=now();nb(AU.master,t+.15,.04,2600,3,.22);nb(AU.master,t+.6,.05,1800,3,.25);nb(AU.master,t+1,.06,3200,4,.22)},
  swap(){if(!AU.ctx)return;nb(AU.master,now(),.08,2200,2,.15)},
  ui(){if(!AU.ctx)return;tn(AU.master,now(),.07,900,1400,.07,'square')},
  deny(){if(!AU.ctx)return;tn(AU.master,now(),.14,220,180,.12,'square')},
  pickup(){if(!AU.ctx)return;const t=now();tn(AU.master,t,.08,1000,1600,.1,'triangle');tn(AU.master,t+.06,.12,1600,2200,.08,'triangle')},
  glass(pos){if(!AU.ctx)return;const t=now(),d=outNode(pos);nb(d,t,.7,5200,.6,.8,'highpass');for(let i=0;i<5;i++)tn(d,t+i*.04,.25,rand(2500,6000),rand(2000,5000),.08)},
  boom(pos,big){if(!AU.ctx)return;const t=now(),d=outNode(pos,big?20:5);nb(d,t,big?4:2.6,260,.4,1.6,'lowpass');tn(d,t,big?3:1.8,95,22,1.1);nb(AU.master,t,big?2.5:1,180,.4,big?.9:.4,'lowpass')},
  emp(pos){if(!AU.ctx)return;const t=now(),d=outNode(pos);tn(d,t,.7,140,2400,.35,'sawtooth');nb(d,t,.6,3000,1,.4);tn(d,t+.1,.9,60,30,.5)},
  phase(){if(!AU.ctx)return;const t=now();nb(AU.master,t,.35,1800,.6,.5,'bandpass');tn(AU.master,t,.3,300,1800,.15,'sine')},
  shieldUp(){if(!AU.ctx)return;const t=now();tn(AU.master,t,.5,220,880,.2,'triangle');tn(AU.master,t+.05,.6,330,1320,.1,'sine')},
  shieldHit(){if(!AU.ctx)return;const t=now();tn(AU.master,t,.12,1800,900,.12,'sine');nb(AU.master,t,.08,5000,2,.12)},
  shieldDown(){if(!AU.ctx)return;tn(AU.master,now(),.4,880,200,.15,'triangle')},
  beep(pos,hi){if(!AU.ctx)return;tn(outNode(pos),now(),.08,hi?2600:1900,hi?2600:1900,.22,'square')},
  hack(){if(!AU.ctx)return;tn(AU.master,now(),.05,rand(1200,2400),rand(1200,2400),.05,'square')},
  done(){if(!AU.ctx)return;const t=now();[660,880,1320].forEach((f,i)=>tn(AU.master,t+i*.08,.2,f,f,.1,'triangle'))},
  radio(){if(!AU.ctx)return;const t=now();nb(AU.master,t,.08,2500,1,.15);tn(AU.master,t,.05,1800,1800,.05,'square')},
  spark(pos){if(!AU.ctx)return;nb(outNode(pos),now(),.25,6000,.8,.3,'highpass')},
  door(pos){if(!AU.ctx)return;const t=now(),d=outNode(pos,6);nb(d,t,1.6,250,1,.6,'lowpass');tn(d,t,1.4,60,95,.3,'sawtooth')},
  alert(pos){if(!AU.ctx)return;const t=now(),d=outNode(pos);tn(d,t,.12,700,1100,.18,'square')},
  siren(){if(!AU.ctx)return;const t=now();tn(AU.master,t,.7,600,950,.06,'sawtooth');tn(AU.master,t+.7,.7,950,600,.06,'sawtooth')},
  win(){if(!AU.ctx)return;const t=now();[392,523,659,784,1046].forEach((f,i)=>tn(AU.master,t+i*.13,.6,f,f,.1,'triangle'))},
  lose(){if(!AU.ctx)return;const t=now();[392,330,262,196].forEach((f,i)=>tn(AU.master,t+i*.18,.6,f,f,.1,'triangle'))},
  distant(){if(!AU.ctx)return;const a=rand(0,TAU),p=new V3(camera.position.x+Math.cos(a)*120,10,camera.position.z+Math.sin(a)*120);const n=Math.floor(rand(3,8));for(let i=0;i<n;i++){const t=now()+i*rand(.08,.14),d=outNode(p,25);nb(d,t,.14,1500,.8,.4);}}
};
function startAmbience(){
  const c=AU.ctx;
  const mk=(freq,gain,type)=>{const s=c.createBufferSource();s.buffer=AU.noise;s.loop=true;const f=c.createBiquadFilter();f.type=type||'lowpass';f.frequency.value=freq;const g=c.createGain();g.gain.value=gain;s.connect(f);f.connect(g);g.connect(AU.master);s.start();return {g,f};};
  AU.amb={city:mk(180,.07),rain:mk(5000,.018,'highpass')};
  // reactor hum, positional
  const o=c.createOscillator();o.type='sawtooth';o.frequency.value=48;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=260;
  const g=c.createGain();g.gain.value=.5;const p=outNode(new V3(0,6,-52),8);o.connect(lp);lp.connect(g);g.connect(p);o.start();
  AU.amb.reactor={o,g,lp};
  // drone engine (dropship), positional and moved each frame
  const e=c.createBufferSource();e.buffer=AU.noise;e.loop=true;const ef=c.createBiquadFilter();ef.type='bandpass';ef.frequency.value=420;ef.Q.value=.6;
  const eg=c.createGain();eg.gain.value=0;const ep=outNode(new V3(0,-100,0),14);e.connect(ef);ef.connect(eg);eg.connect(ep);e.start();
  AU.amb.ship={g:eg,p:ep};
}
function updateListener(){
  if(!AU.ctx)return;const l=AU.ctx.listener;
  const p=camera.getWorldPosition(T1),f=T2.set(0,0,-1).applyQuaternion(camera.quaternion),u=T3.set(0,1,0).applyQuaternion(camera.quaternion);
  if(l.positionX){l.positionX.value=p.x;l.positionY.value=p.y;l.positionZ.value=p.z;l.forwardX.value=f.x;l.forwardY.value=f.y;l.forwardZ.value=f.z;l.upX.value=u.x;l.upY.value=u.y;l.upZ.value=u.z;}
  else{l.setPosition(p.x,p.y,p.z);l.setOrientation(f.x,f.y,f.z,u.x,u.y,u.z);}
}

/* ================= TEXTURES ================= */
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const t=new THREE.CanvasTexture(c);t.anisotropy=4;t.userData={canvas:c,g};return t;}
const TEX={};
function buildTextures(){
  TEX.facade=canvasTex(256,512,(g,w,h)=>{
    g.fillStyle='#0a0f1c';g.fillRect(0,0,w,h);
    for(let y=8;y<h;y+=26){g.fillStyle='#060a14';g.fillRect(0,y-5,w,3);
      for(let x=6;x<w;x+=21){const r=Math.random();
        g.fillStyle=r<.12?'#3ad8f0':r<.22?'#e8a050':r<.25?'#e8406e':r<.31?'#7d8fd8':'#101828';
        g.globalAlpha=r<.31?rand(.5,1):1;g.fillRect(x,y,14,15);g.globalAlpha=1;}}
  });
  TEX.facade.wrapS=TEX.facade.wrapT=THREE.RepeatWrapping;
  TEX.ground=canvasTex(512,512,(g,w,h)=>{
    g.fillStyle='#0c1018';g.fillRect(0,0,w,h);
    for(let i=0;i<9000;i++){g.fillStyle=`rgba(${rand(20,60)|0},${rand(25,65)|0},${rand(40,80)|0},${rand(.1,.4)})`;g.fillRect(rand(0,w),rand(0,h),2,2);}
    g.strokeStyle='rgba(56,232,255,.13)';g.lineWidth=2;g.strokeRect(1,1,w-2,h-2);
    for(let i=0;i<6;i++){g.fillStyle='rgba(22,32,56,.6)';g.beginPath();g.ellipse(rand(0,w),rand(0,h),rand(20,70),rand(10,40),rand(0,3),0,TAU);g.fill();}
  });
  TEX.ground.wrapS=TEX.ground.wrapT=THREE.RepeatWrapping;TEX.ground.repeat.set(40,48);
  TEX.panel=canvasTex(256,256,(g,w,h)=>{
    g.fillStyle='#c9d1dc';g.fillRect(0,0,w,h);
    for(let i=0;i<2500;i++){g.fillStyle=`rgba(0,0,0,${rand(0,.05)})`;g.fillRect(rand(0,w),rand(0,h),2,2);}
    g.strokeStyle='#8a94a4';g.lineWidth=3;g.strokeRect(2,2,w-4,h-4);g.beginPath();g.moveTo(0,h/2);g.lineTo(w,h/2);g.moveTo(w/2,0);g.lineTo(w/2,h/2);g.stroke();
    g.fillStyle='#2a3240';g.font='600 14px monospace';g.fillText('HX-9 · BAY '+Math.floor(rand(10,99)),14,h-16);
    g.fillStyle='#ffb03a';for(let i=0;i<8;i++){g.beginPath();g.moveTo(i*36,h/2-10);g.lineTo(i*36+18,h/2-10);g.lineTo(i*36+28,h/2);g.lineTo(i*36+10,h/2);g.fill();}
  });
  TEX.panel.wrapS=TEX.panel.wrapT=THREE.RepeatWrapping;
  TEX.concrete=canvasTex(256,256,(g,w,h)=>{
    g.fillStyle='#1a2030';g.fillRect(0,0,w,h);
    for(let i=0;i<3000;i++){g.fillStyle=`rgba(255,255,255,${rand(0,.04)})`;g.fillRect(rand(0,w),rand(0,h),2,2);}
    g.strokeStyle='#0c1018';g.lineWidth=3;for(let x=0;x<=w;x+=128){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}
    g.beginPath();g.moveTo(0,h/2);g.lineTo(w,h/2);g.stroke();
  });
  TEX.concrete.wrapS=TEX.concrete.wrapT=THREE.RepeatWrapping;
  TEX.crate=canvasTex(128,128,(g,w,h)=>{
    g.fillStyle='#232a38';g.fillRect(0,0,w,h);g.strokeStyle='#11151e';g.lineWidth=8;g.strokeRect(4,4,w-8,h-8);
    g.lineWidth=3;g.beginPath();g.moveTo(8,8);g.lineTo(w-8,h-8);g.stroke();
    g.fillStyle='#e0a83a';for(let i=-2;i<8;i++){g.beginPath();g.moveTo(i*20,h-14);g.lineTo(i*20+10,h-14);g.lineTo(i*20+20,h-4);g.lineTo(i*20+10,h-4);g.fill();}
  });
  TEX.grate=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#1c2332';g.fillRect(0,0,w,h);g.strokeStyle='#0a0e16';g.lineWidth=3;for(let i=0;i<=w;i+=16){g.beginPath();g.moveTo(i,0);g.lineTo(i,h);g.moveTo(0,i);g.lineTo(w,i);g.stroke();}});
  TEX.grate.wrapS=TEX.grate.wrapT=THREE.RepeatWrapping;
  TEX.soft=canvasTex(64,64,(g)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.4,'rgba(255,255,255,.5)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);});
  TEX.flash=canvasTex(128,128,(g)=>{g.translate(64,64);const gr=g.createRadialGradient(0,0,0,0,0,60);gr.addColorStop(0,'rgba(255,255,230,1)');gr.addColorStop(.25,'rgba(255,200,120,.9)');gr.addColorStop(1,'rgba(255,120,40,0)');g.fillStyle=gr;
    for(let i=0;i<6;i++){g.rotate(TAU/6);g.beginPath();g.moveTo(-6,0);g.lineTo(0,-62);g.lineTo(6,0);g.fill();}g.beginPath();g.arc(0,0,22,0,TAU);g.fill();});
  TEX.decal=canvasTex(64,64,(g)=>{const gr=g.createRadialGradient(32,32,0,32,32,30);gr.addColorStop(0,'rgba(0,0,0,.95)');gr.addColorStop(.35,'rgba(10,10,14,.8)');gr.addColorStop(.6,'rgba(40,40,50,.3)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);});
  TEX.smoke=canvasTex(128,128,(g)=>{for(let i=0;i<16;i++){const x=rand(30,98),y=rand(30,98),r=rand(18,40);const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);}});
  TEX.ring=canvasTex(256,256,(g)=>{g.strokeStyle='#ffc24a';g.lineWidth=8;g.beginPath();g.arc(128,128,118,0,TAU);g.stroke();g.setLineDash([18,14]);g.lineWidth=4;g.beginPath();g.arc(128,128,96,0,TAU);g.stroke();g.setLineDash([]);
    g.font='800 44px "Saira Condensed",sans-serif';g.fillStyle='#ffc24a';g.textAlign='center';g.fillText('EXTRACTION',128,140);});
  TEX.mark=canvasTex(64,64,(g)=>{g.strokeStyle='#ff3d6e';g.lineWidth=5;g.shadowColor='#ff3d6e';g.shadowBlur=10;g.beginPath();g.moveTo(32,6);g.lineTo(58,32);g.lineTo(32,58);g.lineTo(6,32);g.closePath();g.stroke();g.fillStyle='#ff3d6e';g.beginPath();g.arc(32,32,6,0,TAU);g.fill();});
  // hex pattern for the Aegis overlay
  const hx=document.createElement('canvas');hx.width=46;hx.height=40;const hg=hx.getContext('2d');hg.strokeStyle='rgba(120,240,255,.9)';hg.lineWidth=1.5;
  const hexP=(cx,cy,r)=>{hg.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i;hg.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}hg.closePath();hg.stroke();};
  hexP(11.5,20,11.5);hexP(34.5,0,11.5);hexP(34.5,40,11.5);
  $('#hex').style.backgroundImage=`url(${hx.toDataURL()})`;
}
function neonTex(text,color,w,h,size){
  return canvasTex(w||512,h||128,(g,W,H)=>{
    g.font=`700 ${size||76}px "Saira Condensed","Arial Narrow",sans-serif`;g.textAlign='center';g.textBaseline='middle';
    g.shadowColor=color;g.shadowBlur=26;g.fillStyle=color;g.fillText(text,W/2,H/2);g.fillText(text,W/2,H/2);
    g.shadowBlur=0;g.fillStyle='rgba(255,255,255,.85)';g.fillText(text,W/2,H/2);
  });
}

/* ================= MATERIALS ================= */
const MT={};let ENV=null;
const skinMat=new THREE.MeshBasicMaterial({color:0x38e8ff});
function makeEnv(){
  const es=new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.SphereGeometry(50,16,8),new THREE.MeshBasicMaterial({color:0x0a1124,side:THREE.BackSide})));
  const pl=(c,x,y,z,w,h)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);es.add(m);};
  pl(0x38e8ff,30,10,0,10,30);pl(0xff3d6e,-30,8,10,8,26);pl(0xffb35c,0,14,-30,20,6);pl(0x6f7fff,10,30,20,30,8);pl(0x20263a,0,-20,0,80,80);
  const pm=new THREE.PMREMGenerator(renderer);const tex=pm.fromScene(es,.04).texture;pm.dispose();return tex;
}
function buildMaterials(){
  const env=ENV;
  MT.ground=new THREE.MeshStandardMaterial({map:TEX.ground,roughness:.36,metalness:.42,envMap:env,envMapIntensity:1.15});
  MT.concrete=new THREE.MeshStandardMaterial({map:TEX.concrete,roughness:.8,metalness:.15,envMap:env});
  MT.panel=new THREE.MeshStandardMaterial({map:TEX.panel,roughness:.45,metalness:.35,envMap:env,color:0xb8c2d2});
  MT.crate=new THREE.MeshStandardMaterial({map:TEX.crate,roughness:.55,metalness:.5,envMap:env});
  MT.metal=new THREE.MeshStandardMaterial({color:0x2a3346,roughness:.35,metalness:.85,envMap:env});
  MT.dark=new THREE.MeshStandardMaterial({color:0x0e121b,roughness:.5,metalness:.7,envMap:env});
  MT.deck=new THREE.MeshStandardMaterial({map:TEX.grate,roughness:.5,metalness:.8,envMap:env});
  MT.rail=new THREE.MeshStandardMaterial({color:0x3a4558,roughness:.3,metalness:.9,envMap:env});
  MT.glass=new THREE.MeshStandardMaterial({color:0x8fe6ff,roughness:.05,metalness:.9,transparent:true,opacity:.22,depthWrite:false,envMap:env,envMapIntensity:2});
  MT.door=new THREE.MeshStandardMaterial({color:0x3a4256,roughness:.4,metalness:.8,envMap:env,emissive:0x1a0606});
  MT.barrel=new THREE.MeshStandardMaterial({color:0x8a1424,roughness:.4,metalness:.6,envMap:env});
  MT.car=new THREE.MeshStandardMaterial({color:0x252e44,roughness:.25,metalness:.9,envMap:env});
  MT.gunDark=new THREE.MeshStandardMaterial({color:0x161b26,roughness:.35,metalness:.85,envMap:env});
  MT.gunMid=new THREE.MeshStandardMaterial({color:0x3a4354,roughness:.4,metalness:.7,envMap:env});
  MT.glove=new THREE.MeshStandardMaterial({color:0x1c2230,roughness:.75,metalness:.1});
  MT.brass=new THREE.MeshStandardMaterial({color:0xd9a441,roughness:.3,metalness:1,envMap:env});
  MT.tracer=new THREE.MeshBasicMaterial({color:0xfff0c0,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false});
}
function facadeMat(w,h){const t=TEX.facade.clone();t.needsUpdate=true;t.repeat.set(Math.max(1,w/9),Math.max(1,h/14));
  return new THREE.MeshStandardMaterial({map:t,emissiveMap:t,emissive:0xffffff,emissiveIntensity:.85,roughness:.5,metalness:.5,envMap:ENV});}
function panelMat(w,h){const t=TEX.panel.clone();t.needsUpdate=true;t.repeat.set(Math.max(1,w/4),Math.max(1,h/4));
  return new THREE.MeshStandardMaterial({map:t,roughness:.45,metalness:.35,envMap:ENV,color:0xb8c2d2});}
