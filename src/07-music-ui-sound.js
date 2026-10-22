
/* ================= ADAPTIVE MUSIC ================= */
// Four layers on one A-minor loop (Am F C G). Level 0 menu, 1 stealth, 2 combat, 3 escape.
const MUS={g:null,f:null,dl:null,next:0,step:0,level:0,want:0,tempo:92};
const NOTE=n=>440*Math.pow(2,(n-69)/12);
const PROG=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]];
function musicStart(){
  if(!AU.ctx||MUS.g)return;const c=AU.ctx;
  MUS.g=c.createGain();MUS.g.gain.value=SET.music;
  MUS.f=c.createBiquadFilter();MUS.f.type='lowpass';MUS.f.frequency.value=18000;
  MUS.g.connect(MUS.f);MUS.f.connect(AU.master);
  MUS.dl=c.createDelay(1);MUS.dl.delayTime.value=60/92*.75;
  const fb=c.createGain();fb.gain.value=.3;const wet=c.createGain();wet.gain.value=.28;
  MUS.dl.connect(fb);fb.connect(MUS.dl);MUS.dl.connect(wet);wet.connect(MUS.g);
  MUS.next=c.currentTime+.15;
  const h=$('#sndHint');if(h)h.hidden=true;
}
function mVoice(type,freq,t,dur,gain,cut,send,att){
  const c=AU.ctx,o=c.createOscillator();o.type=type;o.frequency.value=freq;
  const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=cut;
  const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+(att||.005));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(f);f.connect(g);g.connect(MUS.g);if(send)g.connect(MUS.dl);o.start(t);o.stop(t+dur+.05);
}
function mKick(t,v){const c=AU.ctx,o=c.createOscillator();o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(42,t+.18);
  const g=c.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.32);o.connect(g);g.connect(MUS.g);o.start(t);o.stop(t+.35);}
function mNoise(t,dur,freq,type,v){const c=AU.ctx,s=c.createBufferSource();s.buffer=AU.noise;const f=c.createBiquadFilter();f.type=type;f.frequency.value=freq;
  const g=c.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(MUS.g);s.start(t,Math.random());s.stop(t+dur+.02);}
function musicStep(s,t){
  const st=s%16,ch=PROG[Math.floor(s/16)%4],L=MUS.level,spb=60/MUS.tempo/4;
  if(st===0){
    for(const n of ch)for(const d of [-7,7])mVoice('sawtooth',NOTE(n-12)*Math.pow(2,d/1200),t,spb*16,.022,L>=3?1500:900,true,.6);
    mVoice('sine',NOTE(ch[0]-24),t,spb*16,L===0?.09:.06,300,false,.5);
  }
  const every=L===0?4:L===1?2:1;
  if(st%every===0&&!(L===1&&Math.random()<.3)){
    const i=st/every;const n=ch[i%3]+12+(Math.floor(i/3)%2?12:0);
    mVoice('square',NOTE(n),t,spb*1.6,L===0?.022:.028,L>=2?2800:1700,true);
  }
  if(L===1&&(st===0||st===8))mKick(t,.22);
  if(L>=2){
    if(st%2===0)mVoice('sawtooth',NOTE(ch[0]-24+(st%8===6?12:0)),t,spb*1.8,.085,L>=3?750:520,false);
    if(st%4===0)mKick(t,.5);
    if(st===4||st===12)mNoise(t,.18,1800,'bandpass',.2);
    if(L>=3||st%2===1)mNoise(t,.04,8000,'highpass',.05);
    if(L>=3&&st===14)mKick(t,.38);
  }
}
function updateMusic(){
  if(!AU.ctx||!MUS.g)return;const c=AU.ctx;
  let L=1;
  if(mode==='menu'||mode==='intro'||mode==='dead'||mode==='lost')L=0;
  else if(M&&!M.range&&M.stage>=2)L=3;
  else if(EN.some(e=>e.alive&&!e.dummy&&e.state==='combat'&&e.seenT<5))L=2;
  else if(M&&M.range&&M.drill)L=2;
  MUS.want=L;
  MUS.g.gain.setTargetAtTime(mode==='lost'||mode==='dead'?SET.music*.45:SET.music,c.currentTime,.4);
  MUS.f.frequency.setTargetAtTime(mode==='paused'?650:18000,c.currentTime,.12);
  if(MUS.next<c.currentTime)MUS.next=c.currentTime+.05;
  while(MUS.next<c.currentTime+.25){
    if(MUS.step%16===0||(MUS.want>MUS.level&&MUS.step%4===0)){MUS.level=MUS.want;MUS.tempo=MUS.level>=3?116:MUS.level===2?104:92;MUS.dl.delayTime.setTargetAtTime(60/MUS.tempo*.75,MUS.next,.05);}
    musicStep(MUS.step,MUS.next);MUS.next+=60/MUS.tempo/4;MUS.step++;
  }
}

/* ================= INTERFACE SOUNDS ================= */
let lastHover=null;
document.addEventListener('pointerover',e=>{const b=e.target.closest('button,select,input');if(b&&b!==lastHover){lastHover=b;if(AU.ctx)tn(AU.master,now(),.03,1700,1900,.025,'sine');}else if(!b)lastHover=null;});
document.addEventListener('click',e=>{if(e.target.closest('button'))SFX.ui();});
document.addEventListener('change',e=>{if(e.target.matches('select,input[type=checkbox]'))SFX.ui();});
document.addEventListener('pointerdown',()=>{initAudio();musicStart();},true);
document.addEventListener('keydown',()=>{if(AU.ctx){musicStart();}},true);
