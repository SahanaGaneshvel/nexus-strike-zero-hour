
/* ================= THE LAST CITY ================= */
const W={doors:{},glass:[],barrels:[],boards:[],spin:[],traffic:[],vents:[],cover:[],lights:{},termMeshes:{},pylons:[]};
const NEON_MATS={};
function neonBar(x1,y1,z1,x2,y2,z2,color,parent,own){
  const mat=own?new THREE.MeshBasicMaterial({color}):(NEON_MATS[color]||(NEON_MATS[color]=new THREE.MeshBasicMaterial({color})));
  const m=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.07,x2-x1),Math.max(.07,y2-y1),Math.max(.07,z2-z1)),mat);
  m.position.set((x1+x2)/2,(y1+y2)/2,(z1+z2)/2);(parent||world).add(m);return m;
}
function sign(text,color,w,h,x,y,z,ry,size){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:neonTex(text,color,512,128,size),transparent:true,depthWrite:false,side:THREE.DoubleSide}));
  m.position.set(x,y,z);m.rotation.y=ry||0;world.add(m);return m;
}
function tower(x1,z1,x2,z2,h,c1,c2){
  const b=addBox(x1,z1,x2,z2,0,h,facadeMat(Math.max(x2-x1,z2-z1),h));
  const e=.06;
  neonBar(x1-e,h-.15,z1-e,x2+e,h+.05,z1+e,c1);neonBar(x1-e,h-.15,z2-e,x2+e,h+.05,z2+e,c1);
  neonBar(x1-e,h-.15,z1-e,x1+e,h+.05,z2+e,c1);neonBar(x2-e,h-.15,z1-e,x2+e,h+.05,z2+e,c1);
  neonBar(x1-e,0,z1-e,x1+e,h,z1+e,c2);neonBar(x2-e,0,z1-e,x2+e,h,z1+e,c2);neonBar(x1-e,0,z2-e,x1+e,h,z2+e,c2);neonBar(x2-e,0,z2-e,x2+e,h,z2+e,c2);
  neonBar(x1-e,4.2,z1-e,x2+e,4.35,z1+e,c2);neonBar(x1-e,4.2,z2-e,x2+e,4.35,z2+e,c2);
  // rooftop machinery
  const cx=(x1+x2)/2,cz=(z1+z2)/2;
  const fan=new THREE.Group();fan.position.set(cx,h+1.2,cz);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,.6,20,1,true),MT.metal);fan.add(hub);
  const blades=new THREE.Group();for(let i=0;i<5;i++){const bl=new THREE.Mesh(new THREE.BoxGeometry(3.8,.08,.6),MT.dark);bl.rotation.y=i/5*TAU;bl.rotation.x=.3;blades.add(bl);}
  fan.add(blades);world.add(fan);W.spin.push({o:blades,ax:'y',sp:rand(2,5)});
  neonBar(cx-.05,h,cz-.05,cx+.05,h+6,cz+.05,0x444c60);const bl=new THREE.Mesh(new THREE.SphereGeometry(.25,8,6),new THREE.MeshBasicMaterial({color:0xff2040}));bl.position.set(cx,h+6.2,cz);world.add(bl);W.spin.push({blink:bl});
  return b;
}
function slab(x1,z1,x2,z2,h,mat){return addBox(x1,z1,x2,z2,0,h,mat||panelMat(Math.max(x2-x1,z2-z1),h));}
function stairs(x1,z1,x2,z2,h,dir,mat){
  const n=Math.max(1,Math.round(h/.3)),rise=h/n;const along=dir[1]==='x'?x2-x1:z2-z1,d=along/n;
  for(let i=0;i<n;i++){const top=rise*(i+1);let a,b;
    if(dir==='+x'){a=x1+d*i;b=a+d;addBox(a,z1,b,z2,0,top,mat||MT.metal);}
    else if(dir==='-x'){b=x2-d*i;a=b-d;addBox(a,z1,b,z2,0,top,mat||MT.metal);}
    else if(dir==='+z'){a=z1+d*i;b=a+d;addBox(x1,a,x2,b,0,top,mat||MT.metal);}
    else{b=z2-d*i;a=b-d;addBox(x1,a,x2,b,0,top,mat||MT.metal);}
  }
  // glowing nosing strip along the flight
  const isX=dir[1]==='x';
  if(isX){neonBar(x1,0,z1-.04,x2,.05,z1,0xffb03a);}else{neonBar(x1-.04,0,z1,x1,.05,z2,0xffb03a);}
}
function cover(x1,z1,x2,z2,h,mat,kind){
  const c=addBox(x1,z1,x2,z2,0,h,mat||MT.crate,kind||'solid');
  const mx=(x1+x2)/2,mz=(z1+z2)/2,o=.9;
  [[mx,z1-o],[mx,z2+o],[x1-o,mz],[x2+o,mz]].forEach(p=>W.cover.push({x:p[0],z:p[1],taken:null,h}));
  return c;
}
function barricade(x1,z1,x2,z2){const c=cover(x1,z1,x2,z2,1.15,MT.dark);const w=x2-x1>z2-z1;neonBar(w?x1:x1-.02,1.0,w?z1-.02:z1,w?x2:x2+.02,1.07,w?z2+.02:z2,0xff3d6e);return c;}
function car(x,z,alongX,col){
  const L=4.2,Wd=2,h=1.25;const x1=alongX?x-L/2:x-Wd/2,x2=alongX?x+L/2:x+Wd/2,z1=alongX?z-Wd/2:z-L/2,z2=alongX?z+Wd/2:z+L/2;
  const c=cover(x1,z1,x2,z2,h,MT.car);c.mesh.scale.y=.75;c.mesh.position.y=h*.375;
  const g=new THREE.Group();g.position.set(x,0,z);if(!alongX)g.rotation.y=Math.PI/2;
  const cab=new THREE.Mesh(new THREE.BoxGeometry(2.2,.55,1.7),MT.glass);cab.position.set(-.2,1.15,0);g.add(cab);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(1.8,.08,1.6),MT.car);roof.position.set(-.2,1.44,0);g.add(roof);
  const tl=new THREE.Mesh(new THREE.BoxGeometry(.06,.1,1.8),new THREE.MeshBasicMaterial({color:0xff2040}));tl.position.set(2.11,.75,0);g.add(tl);
  const hl=new THREE.Mesh(new THREE.BoxGeometry(.06,.08,1.6),new THREE.MeshBasicMaterial({color:col||0x9fe8ff}));hl.position.set(-2.11,.7,0);g.add(hl);
  const pad=new THREE.Mesh(new THREE.BoxGeometry(3.4,.08,1.6),new THREE.MeshBasicMaterial({color:col||0x38e8ff,transparent:true,opacity:.5}));pad.position.set(0,.05,0);g.add(pad);
  world.add(g);return c;
}
function glassPane(x1,z1,x2,z2,h){
  const c=addBox(x1,z1,x2,z2,0,h,MT.glass,'glass',{cast:false});
  const fr=new THREE.Mesh(new THREE.BoxGeometry(x2-x1+.1,.12,z2-z1+.1),MT.metal);fr.position.set((x1+x2)/2,h,(z1+z2)/2);world.add(fr);
  W.glass.push(c);return c;
}
function barrel(x,z){
  const c=addBox(x-.35,z-.35,x+.35,z+.35,0,1.1,MT.barrel,'barrel',{visible:false});
  const g=new THREE.Group();g.position.set(x,0,z);
  const b=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,1.1,14),MT.barrel);b.position.y=.55;b.castShadow=true;g.add(b);
  const s=new THREE.Mesh(new THREE.CylinderGeometry(.355,.355,.12,14),new THREE.MeshBasicMaterial({color:0xffb03a}));s.position.y=.75;g.add(s);
  world.add(g);c.group=g;c.hp=35;c.home=[x,z];W.barrels.push(c);return c;
}
function lamp(x,z,face){
  neonBar(x-.07,0,z-.07,x+.07,6.5,z+.07,0x2a3346);
  const arm=neonBar(x-.05,6.4,z-.05,x+.05+(face||0)*1.4,6.5,z+.05,0x2a3346);
  const hx=x+(face||0)*1.4;
  const head=new THREE.Mesh(new THREE.BoxGeometry(.7,.12,.35),new THREE.MeshBasicMaterial({color:0xcff6ff}));head.position.set(hx,6.35,z);world.add(head);
  const cone=new THREE.Mesh(new THREE.CylinderGeometry(.3,2.6,6.3,20,1,true),LAMP_MAT||(LAMP_MAT=new THREE.MeshBasicMaterial({color:0x9fdcff,transparent:true,opacity:.055,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})));
  cone.position.set(hx,3.15,z);world.add(cone);
}
let LAMP_MAT=null;
function mergeStatic(){
  if(!THREE.BufferGeometryUtils||!THREE.BufferGeometryUtils.mergeBufferGeometries)return;
  const dyn=new Set();
  for(const id in W.doors){dyn.add(W.doors[id].col.mesh);dyn.add(W.doors[id].strip);}
  for(const g of W.glass)dyn.add(g.mesh);
  for(const s of W.spin)if(s.blink)dyn.add(s.blink);
  world.updateMatrixWorld(true);
  const groups=new Map();
  for(const o of world.children.slice()){
    if(!o.isMesh||dyn.has(o)||Array.isArray(o.material)||!o.geometry.index)continue;
    const geo=o.geometry.clone();geo.applyMatrix4(o.matrixWorld);
    for(const k of Object.keys(geo.attributes))if(k!=='position'&&k!=='normal'&&k!=='uv')geo.deleteAttribute(k);
    if(!geo.attributes.normal||!geo.attributes.uv)continue;
    geo.clearGroups();
    const key=o.material.uuid+(o.castShadow?'|s':'|n');
    if(!groups.has(key))groups.set(key,{m:o.material,cast:o.castShadow,geos:[],objs:[]});
    const gr=groups.get(key);gr.geos.push(geo);gr.objs.push(o);
  }
  let before=0,after=0;
  for(const gr of groups.values()){
    if(gr.objs.length<2)continue;
    let merged=null;try{merged=THREE.BufferGeometryUtils.mergeBufferGeometries(gr.geos,false);}catch(e){merged=null;}
    if(!merged)continue;
    for(const o of gr.objs)world.remove(o);
    const mesh=new THREE.Mesh(merged,gr.m);mesh.castShadow=gr.cast;mesh.receiveShadow=true;world.add(mesh);
    before+=gr.objs.length;after++;
  }
  console.info('Merged '+before+' static meshes into '+after);
}
function board(x,y,z,ry,w,h,kind){
  const t=canvasTex(512,256,()=>{});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:true,opacity:.92,side:THREE.DoubleSide,depthWrite:false}));
  m.position.set(x,y,z);m.rotation.y=ry;world.add(m);
  const frame=new THREE.Mesh(new THREE.PlaneGeometry(w+.6,h+.6),new THREE.MeshBasicMaterial({color:0x05080f,side:THREE.DoubleSide}));frame.position.copy(m.position);frame.rotation.y=ry;frame.translateZ(-.05);world.add(frame);
  W.boards.push({tex:t,kind,t:0});
}
function drawBoards(t){
  for(const b of W.boards){
    const g=b.tex.userData.g,w=512,h=256;g.clearRect(0,0,w,h);
    if(b.kind==='news'){
      g.fillStyle='rgba(60,6,16,.85)';g.fillRect(0,0,w,h);g.fillStyle='#ff3d6e';g.fillRect(0,0,w,46);
      g.font='800 34px "Saira Condensed",sans-serif';g.fillStyle='#fff';g.fillText('BREAKING · CITY NET 24',16,34);
      g.font='800 64px "Saira Condensed",sans-serif';g.fillStyle='#fff';g.fillText(M&&M.stage>=2?'REACTOR CRITICAL':'NEXUS CORE STOLEN',16,122);
      g.font='500 22px "JetBrains Mono",monospace';g.fillStyle='#ffc2cf';g.fillText(M&&M.stage>=2?'EVACUATE SECTOR 9 IMMEDIATELY':'HELIX SYNDICATE SEIZES AEGIS VAULT 7',16,164);
      g.fillStyle='#000';g.fillRect(0,206,w,50);g.font='600 26px "JetBrains Mono",monospace';g.fillStyle='#ffc24a';
      const tick='  CURFEW IN EFFECT · SKYWAYS CLOSED · DO NOT APPROACH HELIX PERSONNEL · CURFEW IN EFFECT · SKYWAYS CLOSED ·';
      g.fillText(tick,-((t*120)%900),241);
    }else if(b.kind==='ad'){
      const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'rgba(10,40,60,.9)');gr.addColorStop(1,'rgba(40,10,60,.9)');g.fillStyle=gr;g.fillRect(0,0,w,h);
      g.font='800 76px "Saira Condensed",sans-serif';g.fillStyle='#38e8ff';g.shadowColor='#38e8ff';g.shadowBlur=20;g.fillText('KAIJU NOODLE',20,96);g.shadowBlur=0;
      g.font='500 24px "Chakra Petch",sans-serif';g.fillStyle='#ffd7a0';g.fillText('Open all night. Even tonight.',24,140);
      g.strokeStyle='#ffb35c';g.lineWidth=3;for(let i=0;i<3;i++){g.beginPath();for(let x=0;x<120;x+=4)g.lineTo(380+i*28+Math.sin(x/12+t*4+i)*6,220-x);g.stroke();}
      g.fillStyle='#ffb35c';g.beginPath();g.arc(420,226,58,0,Math.PI);g.fill();
    }else{
      g.fillStyle='rgba(30,0,20,.85)';g.fillRect(0,0,w,h);
      const gl=Math.random()<.08?rand(-14,14):0;
      g.font='800 92px "Saira Condensed",sans-serif';g.fillStyle='#ff3d6e';g.fillText('HELIX',40+gl,120);
      g.font='700 40px "Saira Condensed",sans-serif';g.fillStyle='#fff';g.fillText('ORDER · PROGRESS · OBEDIENCE',40,180);
      g.strokeStyle='#ff3d6e';g.lineWidth=6;g.beginPath();g.arc(420,90,48,t%TAU,t%TAU+4.5);g.stroke();
      if(gl){g.fillStyle='rgba(56,232,255,.4)';g.fillRect(0,rand(0,h),w,rand(4,20));}
    }
    b.tex.needsUpdate=true;
  }
}
function door(id,x1,z1,x2,z2,h,mat){
  const c=addBox(x1,z1,x2,z2,0,h,mat||MT.door,'door');
  const strip=neonBar(x1,h*.5-.05,z1-.03,x2,h*.5+.05,z2+.03,0xff3d6e,null,true);
  W.doors[id]={col:c,strip,h,open:false,amt:0,max:h-.2};return W.doors[id];
}
function updateDoors(dt){
  for(const id in W.doors){const d=W.doors[id];const tgt=d.open?d.max:0;const prev=d.amt;d.amt=lerp(d.amt,tgt,1-Math.exp(-dt*2.2));if(Math.abs(d.amt-tgt)<.01)d.amt=tgt;
    d.col.mesh.position.y=d.h/2+d.amt;d.strip.position.y=d.h*.5+d.amt;
    const wasAlive=d.col.alive;d.col.alive=d.amt<2.2;
    // keep the collider's box in sync so bullets and sight pass below a raised door
    d.col.min[1]=d.amt;d.col.max[1]=d.h+d.amt;
    if(wasAlive!==d.col.alive)rebuildNav();
  }
}
function openDoor(id){const d=W.doors[id];if(!d||d.open)return;d.open=true;d.strip.material.color.set(0x5cff9d);SFX.door(d.col.mesh.position);}
function terminalMesh(id,x,y,z,ry,color){
  const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;
  const body=new THREE.Mesh(new THREE.BoxGeometry(.9,1.2,.18),MT.dark);g.add(body);
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(.7,.5),new THREE.MeshBasicMaterial({color:color||0x38e8ff}));scr.position.set(0,.18,.1);g.add(scr);
  const lt=new THREE.Mesh(new THREE.BoxGeometry(.9,.04,.2),new THREE.MeshBasicMaterial({color:color||0x38e8ff}));lt.position.y=-.55;g.add(lt);
  world.add(g);W.termMeshes[id]={g,scr,lt};return g;
}
function makeDropship(color){
  const g=new THREE.Group();
  const hull=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.9,9,10),MT.car);hull.rotation.x=Math.PI/2;hull.scale.set(1,1,.62);g.add(hull);
  const nose=new THREE.Mesh(new THREE.ConeGeometry(1.4,2.8,10),MT.car);nose.rotation.x=-Math.PI/2;nose.position.z=-5.9;nose.scale.set(1,1,.62);g.add(nose);
  const canopy=new THREE.Mesh(new THREE.SphereGeometry(1,12,8,0,TAU,0,Math.PI/2),MT.glass);canopy.position.set(0,.6,-4.2);canopy.scale.set(.9,.6,1.6);g.add(canopy);
  const wing=new THREE.Mesh(new THREE.BoxGeometry(12,.25,2.8),MT.metal);wing.position.set(0,.2,.8);g.add(wing);
  const fin=new THREE.Mesh(new THREE.BoxGeometry(.2,2.2,2),MT.metal);fin.position.set(0,1.6,3.8);g.add(fin);
  const glow=new THREE.MeshBasicMaterial({color});
  for(const sx of [-5.6,5.6]){
    const eng=new THREE.Mesh(new THREE.CylinderGeometry(.75,.75,2.4,14),MT.dark);eng.position.set(sx,0,.8);g.add(eng);
    const ex=new THREE.Mesh(new THREE.CircleGeometry(.65,16),glow);ex.rotation.x=Math.PI/2;ex.position.set(sx,-1.22,.8);g.add(ex);
    const cone=new THREE.Mesh(new THREE.ConeGeometry(.65,3,14,1,true),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false}));cone.position.set(sx,-2.7,.8);cone.rotation.x=Math.PI;g.add(cone);
    const tip=new THREE.Mesh(new THREE.SphereGeometry(.12,6,4),new THREE.MeshBasicMaterial({color:sx<0?0xff2040:0x40ff80}));tip.position.set(sx*1.07,.2,.8);g.add(tip);
  }
  const stripe=new THREE.Mesh(new THREE.BoxGeometry(.08,.12,8),glow);stripe.position.set(1.3,.2,0);g.add(stripe);const s2=stripe.clone();s2.position.x=-1.3;g.add(s2);
  g.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  return g;
}
function buildCity(){
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(160,200),MT.ground);ground.rotation.x=-Math.PI/2;ground.position.set(0,0,-5);ground.receiveShadow=true;world.add(ground);
  // road markings
  const mk=(x1,z1,x2,z2,c)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(x2-x1,z2-z1),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.55}));m.rotation.x=-Math.PI/2;m.position.set((x1+x2)/2,.012,(z1+z2)/2);world.add(m);};
  for(let z=44;z>-2;z-=6)mk(-.12,z-3,.12,z,0xffc24a);for(let x=-44;x<60;x+=6)mk(x,21.88,x+3,22.12,0xffc24a);
  for(let i=0;i<7;i++){mk(-9+i*2.6,33,-7.6+i*2.6,35.5,0xd8e2f0);}
  // boundary blocks and towers
  addBox(-72,-84,-4,-74,0,24,facadeMat(60,24));addBox(4,-84,72,-74,0,24,facadeMat(60,24));addBox(-4,-84,4,-80,0,24,MT.concrete);
  tower(-72,-74,-62,70,30,0xff3d6e,0x38e8ff);tower(62,-74,72,70,30,0x38e8ff,0xffb35c);
  tower(-72,68,72,78,26,0xffb35c,0x7d6bff);
  tower(-62,46,-8,68,36,0x38e8ff,0xff3d6e);tower(8,46,62,68,42,0xff3d6e,0x38e8ff);
  tower(-46,32,-10,46,28,0xffc24a,0x38e8ff);tower(-62,32,-46,46,20,0x7d6bff,0xff3d6e);
  tower(10,32,62,46,34,0x38e8ff,0xffb35c);
  tower(-62,-2,-10,12,26,0xff3d6e,0xffc24a);tower(10,-2,40,12,30,0x7d6bff,0x38e8ff);
  tower(-62,-74,-40,-2,22,0x38e8ff,0xff3d6e);
  // skyline beyond the walls
  for(let i=0;i<34;i++){const a=i/34*TAU,r=rand(110,140),h=rand(40,110),s=rand(10,20);
    const m=new THREE.Mesh(new THREE.BoxGeometry(s,h,s),facadeMat(s,h));m.position.set(Math.cos(a)*r,h/2,Math.sin(a)*r-5);world.add(m);
    neonBar(m.position.x-s/2,h-.3,m.position.z-s/2,m.position.x+s/2,h,m.position.z+s/2,pick([0x38e8ff,0xff3d6e,0xffb35c,0x7d6bff]));}
  // insertion alley
  cover(-6,56,-3.5,58.5,1.1);cover(3,52,5.5,54,2.2);barrel(5.5,60);
  sign('SECTOR 4 · LAST CITY','#38e8ff',8,1.6,-7.9,7,58,Math.PI/2,64);
  // skybridge over the north road
  stairs(6,12,10,30,6,'-z');
  addBox(6,4,10,12,0,6,MT.metal);
  addBox(-10,4,6,8,5.7,6,MT.deck,'solid');
  addBox(-10,3.8,10,4,6,7,MT.rail,'rail');addBox(-10,8,6,8.2,6,7,MT.rail,'rail');addBox(5.8,8.2,6,12,6,7,MT.rail,'rail');
  neonBar(-10,5.62,7.95,6,5.7,8,0x38e8ff);neonBar(-10,5.62,4,10,5.7,4.05,0x38e8ff);
  sign('SKYWAY 9','#ffb35c',5,1.2,-2,7.6,8.25,0,64);
  // extraction pad
  addBox(-62,12,-46,32,0,4,MT.concrete);
  stairs(-46,13,-36,18,4,'-x');
  neonBar(-46.05,3.9,12,-45.95,4.05,32,0xffc24a);
  const ring=new THREE.Mesh(new THREE.PlaneGeometry(10,10),new THREE.MeshBasicMaterial({map:TEX.ring,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));ring.rotation.x=-Math.PI/2;ring.position.set(-54,4.02,22);world.add(ring);W.padRing=ring;
  for(const p of [[-61,13],[-61,31],[-47,13],[-47,31]]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.6,8),new THREE.MeshBasicMaterial({color:0xffc24a}));l.position.set(p[0],4.3,p[1]);world.add(l);W.spin.push({blink:l,pad:true});}
  // intersection props
  car(-20,22,true,0xff3d6e);car(18,17,true);car(-4,38.1,false,0xffb35c);car(28,26,true);car(2,-6,true,0xff3d6e);car(-30,-8,false);
  barricade(-8,1.7,-4,2.3);barricade(-4,-11,0,-10.4);barricade(-30,27.7,-26,28.3);barricade(34,13.7,38,14.3);barricade(-20,-9.3,-16,-8.7);barricade(16,-8.3,20,-7.7);barricade(28,-6.3,32,-5.7);
  cover(-28,14,-25,16,2.6,MT.metal);neonBar(-28.05,2.5,13.95,-24.95,2.62,16.05,0xffb35c);
  addBox(20,30,26,30.3,0,2.8,MT.metal);glassPane(20,29.7,26,29.85,2.6);addBox(20,28.3,26,30.3,2.8,2.95,MT.metal);
  cover(-5,20,-1,24,1.2,MT.metal);
  cover(-14,-6,-11,-4,1.2);cover(12,-12,15,-10,2.2);cover(-36,-12,-33,-9,1.1);cover(44,4,47,6.6,2.2);
  lamp(-11,40,1);lamp(11,-12,-1);lamp(-11,14,1);lamp(-40,12.6,0);lamp(30,31.5,0);lamp(-11,-12,1);lamp(36,-13,0);
  barrel(-31.5,25.5);barrel(24,-11);barrel(-24,-11.5);barrel(52,-18);barrel(13,30.6);
  // plaza hologram: the stolen core, rendered as a public warning
  const holo=new THREE.Group();holo.position.set(-3,1.2,22);
  const hb=new THREE.Mesh(new THREE.CylinderGeometry(.3,2.2,7,24,1,true),new THREE.MeshBasicMaterial({color:0x38e8ff,transparent:true,opacity:.08,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));hb.position.y=3.5;holo.add(hb);
  const hc=new THREE.Mesh(new THREE.IcosahedronGeometry(1.4,1),new THREE.MeshBasicMaterial({color:0x38e8ff,wireframe:true,transparent:true,opacity:.75}));hc.position.y=5.2;holo.add(hc);
  const hr=new THREE.Mesh(new THREE.TorusGeometry(2.2,.04,6,48),new THREE.MeshBasicMaterial({color:0xffc24a}));hr.position.y=5.2;hr.rotation.x=1.2;holo.add(hr);
  world.add(holo);W.spin.push({o:hc,ax:'y',sp:.6},{o:hr,ax:'z',sp:1.1});
  // billboards
  board(36,15,31.8,Math.PI,18,9,'news');board(-36,15,12.2,0,16,8,'ad');board(9.8,17,4,-Math.PI/2,12,6,'helix');
  sign('KAIJU NOODLE','#ff3d6e',9,2.2,-9.9,8,39,Math.PI/2);sign('ARC NET','#ffb35c',7,1.8,9.9,9,40,-Math.PI/2);sign('VOID BAR','#b06bff',7,1.8,-26,6,12.1,0);
  // east alley
  cover(44,-10,47,-8,1.2);cover(52,-22,55,-20,1.2);cover(45,-50,50,-44,2.6,MT.metal);cover(55,-36,58,-33,1.1);cover(44,-60,47,-57,2.2);
  for(const z of [-6,-26,-48]){const v=new V3(rand(55,60),.2,z);W.vents.push({p:v,t:0});addBox(v.x-.6,v.z-.6,v.x+.6,v.z+.6,0,.3,MT.dark);}
  lamp(50,-30,0);lamp(50,0,0);
  // flying traffic
  for(let i=0;i<12;i++){
    const g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(2.6,.6,1.2),MT.car);g.add(b);
    const tl=new THREE.Mesh(new THREE.BoxGeometry(.05,.15,1.1),new THREE.MeshBasicMaterial({color:0xff2040}));tl.position.x=1.32;g.add(tl);
    const hl=new THREE.Mesh(new THREE.BoxGeometry(.05,.12,1),new THREE.MeshBasicMaterial({color:0xdff6ff}));hl.position.x=-1.32;g.add(hl);
    world.add(g);W.traffic.push({g,r:rand(60,95),h:rand(32,58),sp:rand(.05,.12)*(i%2?1:-1),a:rand(0,TAU),cz:rand(-30,10)});
  }
}
function buildFacility(){
  // perimeter walls with gate and service door
  slab(-40,-15,-6,-14,10);slab(6,-15,40,-14,10);addBox(-6,-15,6,-14,8,10,MT.panel);
  door('gate',-6,-14.9,6,-14.1,8);
  slab(40,-74,41,-36,10);slab(40,-32,41,-15,10);addBox(40,-36,41,-32,4.5,10,MT.panel);
  door('service',40.1,-36,40.9,-32,4.5);
  neonBar(-40,9.9,-15.1,40,10.05,-14.9,0x38e8ff);
  sign('HELIX BIOSYSTEMS · SECTOR 9','#ff3d6e',22,3,0,11.6,-13.9,0,70);
  sign('SERVICE','#ffb03a',3.2,.8,41.06,5.4,-34,Math.PI/2,64);
  for(const x of [-12,12]){const t=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),MT.metal);t.position.set(x,10.5,-14.5);world.add(t);}
  // labs
  slab(-40,-74,-16,-30,9);slab(16,-74,40,-42,9);
  neonBar(-16.05,8.9,-74,-15.95,9.05,-30,0x38e8ff);neonBar(15.95,8.9,-74,16.05,9.05,-42,0x38e8ff);
  for(let z=-34;z>-72;z-=6){neonBar(-15.98,2,z,-15.94,6,z+.08,0x38e8ff);}
  for(let z=-46;z>-72;z-=6){neonBar(15.94,2,z,15.98,6,z+.08,0x38e8ff);}
  // courtyard
  glassPane(-30,-24.15,-20,-24,3);glassPane(20,-24.15,30,-24,3);
  cover(-10,-22,-7,-20,1.2);cover(6,-27,9,-25,1.5);cover(-30,-19,-26,-17,2.2,MT.metal);cover(24,-28,27,-26,1.1);cover(-2,-25,2,-23.5,1.1,MT.dark);
  barrel(-12,-27);barrel(22,-18);
  lamp(-20,-16,0);lamp(20,-16,0);
  // east corridor
  cover(26,-40,29,-38,1.2);cover(33,-34,35,-31,2.2,MT.metal);
  // atrium catwalks and stairs
  stairs(-16,-44,-12,-32,5,'-z');stairs(12,-44,16,-32,5,'-z');
  addBox(-16,-70,-12,-44,4.7,5,MT.deck);addBox(12,-70,16,-44,4.7,5,MT.deck);addBox(-16,-74,16,-70,4.7,5,MT.deck);
  addBox(-12,-70,-11.85,-44,5,6.05,MT.rail,'rail');addBox(11.85,-70,12,-44,5,6.05,MT.rail,'rail');addBox(-12,-70,12,-69.85,5,6.05,MT.rail,'rail');
  neonBar(-12,4.62,-70,-11.9,4.7,-44,0xffb03a);neonBar(11.9,4.62,-70,12,4.7,-44,0xffb03a);
  // north blast door (reinforcements come through here)
  door('north',-4,-74.4,4,-73.9,5.5);
  neonBar(-4,5.3,-79.9,4,5.5,-79.8,0xff2040);
  // reactor
  const R=new THREE.Group();R.position.set(0,0,-52);world.add(R);W.reactor=R;
  const base=new THREE.Mesh(new THREE.CylinderGeometry(5,5.4,1,32),MT.metal);base.position.y=.5;base.receiveShadow=true;R.add(base);
  addBox(-4.2,-56.2,4.2,-47.8,0,1,MT.metal,'solid',{visible:false});
  const baseRing=new THREE.Mesh(new THREE.TorusGeometry(5,.08,6,64),new THREE.MeshBasicMaterial({color:0x38e8ff}));baseRing.rotation.x=Math.PI/2;baseRing.position.y=1.02;R.add(baseRing);
  const shellM=new THREE.Mesh(new THREE.CylinderGeometry(1.8,1.8,14,24,1,true),new THREE.MeshStandardMaterial({color:0x8fe6ff,roughness:.05,metalness:.9,transparent:true,opacity:.25,envMap:ENV,side:THREE.DoubleSide,depthWrite:false}));shellM.position.y=8;R.add(shellM);
  addBox(-1.8,-53.8,1.8,-50.2,1,15,MT.glass,'solid',{visible:false});
  const coreM=new THREE.MeshBasicMaterial({color:0x38e8ff});
  const col=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,14,16),coreM);col.position.y=8;R.add(col);
  const rings=[];for(let i=0;i<4;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(2.4+i*.3,.09,8,48),new THREE.MeshStandardMaterial({color:0x2a3346,metalness:.9,roughness:.3,emissive:0x38e8ff,emissiveIntensity:.6}));r.position.y=3+i*3.2;r.rotation.x=Math.PI/2;R.add(r);rings.push(r);}
  const nexus=new THREE.Mesh(new THREE.IcosahedronGeometry(.7,0),new THREE.MeshStandardMaterial({color:0xffc24a,emissive:0xffa020,emissiveIntensity:2,flatShading:true}));nexus.position.y=3.2;R.add(nexus);
  W.reactorParts={col,coreM,rings,nexus,baseRing,shellM};
  W.lights.reactor=new THREE.PointLight(0x38e8ff,2.4,40,1.6);W.lights.reactor.position.set(0,7,-52);scene.add(W.lights.reactor);
  for(const p of [[-7,-45],[7,-45],[-7,-59],[7,-59]]){
    const c=addBox(p[0]-.5,p[1]-.5,p[0]+.5,p[1]+.5,0,7,MT.metal);
    const top=new THREE.Mesh(new THREE.SphereGeometry(.35,10,8),new THREE.MeshBasicMaterial({color:0x38e8ff}));top.position.set(p[0],7.4,p[1]);world.add(top);
    W.pylons.push(new V3(p[0],7.4,p[1]));W.cover.push({x:p[0]+(p[0]<0?-1:1)*.9,z:p[1],taken:null,h:7});
  }
  const arcGeo=new THREE.BufferGeometry();arcGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(4*8*2*3),3));
  W.arcs=new THREE.LineSegments(arcGeo,new THREE.LineBasicMaterial({color:0x9ff4ff,transparent:true,opacity:.9,blending:THREE.AdditiveBlending}));W.arcs.frustumCulled=false;scene.add(W.arcs);
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(4,7,28,24,1,true),new THREE.MeshBasicMaterial({color:0x7fd8ff,transparent:true,opacity:.05,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));shaft.position.set(0,14,-52);world.add(shaft);W.shaft=shaft;
  // console in front of the reactor
  addBox(-.8,-45.8,.8,-45.2,0,1.05,MT.dark);terminalMesh('core',0,1.45,-45.45,0,0xffc24a);
  sign('NEXUS CONTAINMENT','#ffc24a',8,1.4,0,8,-73.9,0,64);
  cover(-9,-38,-7.6,-36.6,1.1);cover(4.5,-36.5,6,-35,1.6);cover(-8.5,-64,-6.5,-62.5,1.2);cover(3,-63,4.6,-61.4,1.1);
  barrel(9,-60);barrel(-11,-54);
  // crane sweeping over the courtyard
  const crane=new THREE.Group();crane.position.set(-30,0,-60);
  const mast=new THREE.Mesh(new THREE.BoxGeometry(1,22,1),MT.metal);mast.position.y=11;crane.add(mast);
  const jib=new THREE.Group();jib.position.y=22;crane.add(jib);
  const arm=new THREE.Mesh(new THREE.BoxGeometry(1,1,30),MT.metal);arm.position.z=12;jib.add(arm);
  const cable=new THREE.Mesh(new THREE.BoxGeometry(.06,10,.06),MT.dark);cable.position.set(0,-5,24);jib.add(cable);
  const cont=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.6,4),MT.crate);cont.position.set(0,-10.8,24);jib.add(cont);
  const cl=new THREE.Mesh(new THREE.SphereGeometry(.25,8,6),new THREE.MeshBasicMaterial({color:0xff2040}));cl.position.set(0,.8,27);jib.add(cl);
  world.add(crane);W.spin.push({o:jib,crane:true});
  // facility searchlights
  W.search=[];for(const x of [-12,12]){const cone=new THREE.Mesh(new THREE.CylinderGeometry(.2,5,30,20,1,true),new THREE.MeshBasicMaterial({color:0xdff4ff,transparent:true,opacity:.045,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    cone.geometry.translate(0,-15,0);const piv=new THREE.Group();piv.position.set(x,11,-14.5);piv.add(cone);world.add(piv);W.search.push({piv,ph:x});}
}
function buildRange(){
  addBox(-22,84,22,86,0,8,MT.concrete);addBox(-22,146,22,148,0,8,MT.concrete);addBox(-24,84,-22,148,0,8,MT.concrete);addBox(22,84,24,148,0,8,MT.concrete);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(44,62),new THREE.MeshStandardMaterial({map:TEX.grate,roughness:.9,metalness:.25}));fl.material.map=TEX.grate.clone();fl.material.map.needsUpdate=true;fl.material.map.repeat.set(22,31);
  fl.rotation.x=-Math.PI/2;fl.position.set(0,.01,116);world.add(fl);
  addBox(-22,134,-3,134.6,0,1.1,MT.metal);addBox(3,134,22,134.6,0,1.1,MT.metal);
  for(const d of [10,20,30]){const z=134-d;sign(d+' M','#ffc24a',3,.8,-21.9,3,z,Math.PI/2,64);neonBar(-22,.01,z-.05,22,.03,z+.05,0xffc24a);}
  sign('AEGIS FIRING RANGE','#38e8ff',16,2.6,0,6,146.9,Math.PI,72);
  cover(-14,92,-11,94,1.2);cover(8,93,11,95,2.2);cover(-3,99,1,100.6,1.1);cover(13,101,15,104,1.2);cover(-18,101,-15,103,2.2);
  terminalMesh('drill',-6,1.3,141,Math.PI,0x5cff9d);terminalMesh('reset',6,1.3,141,Math.PI,0x38e8ff);
  const l=new THREE.PointLight(0xcfe8ff,1.1,70,1.2);l.position.set(0,12,116);scene.add(l);W.lights.range=l;
}
function buildLights(){
  scene.add(W.lights.hemi=new THREE.HemisphereLight(0x5a6fa8,0x0b0c14,.55));
  const moon=new THREE.DirectionalLight(0x9fb2ff,.55);moon.position.set(40,80,30);moon.castShadow=true;
  moon.shadow.mapSize.set(2048,2048);const sc=moon.shadow.camera;sc.left=-90;sc.right=90;sc.top=100;sc.bottom=-100;sc.near=1;sc.far=220;moon.shadow.bias=-.0006;
  moon.target.position.set(0,0,-10);scene.add(moon,moon.target);W.lights.moon=moon;
  W.lights.city=[];
  lightFlash(new V3(0,-50,0),0xffffff,0,1,.001);
  [[0x38e8ff,-8,8,22,48,1.6],[0xff3d6e,0,9,-8,40,1.4],[0xffc24a,-54,8,22,30,1.3],[0x9fdcff,50,7,-30,40,1.1],[0xdff4ff,0,9,-24,38,1.1]].forEach(a=>{
    const l=new THREE.PointLight(a[0],a[5],a[4],1.6);l.position.set(a[1],a[2],a[3]);scene.add(l);l.userData.base=a[5];l.userData.col=a[0];W.lights.city.push(l);});
  // rain
  const N=2600,pos=new Float32Array(N*6);
  for(let i=0;i<N;i++){const x=rand(-40,40),y=rand(0,40),z=rand(-40,40);pos.set([x,y,z,x+.05,y+.55,z],i*6);}
  const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  W.rain=new THREE.LineSegments(rg,new THREE.LineBasicMaterial({color:0x7fa6ff,transparent:true,opacity:.3,depthWrite:false}));W.rain.frustumCulled=false;scene.add(W.rain);
}
function updateRain(dt){
  const a=W.rain.geometry.attributes.position,p=a.array,cx=camera.position.x,cz=camera.position.z,inRange=cz>80;
  W.rain.visible=!inRange;if(inRange)return;
  for(let i=0;i<p.length;i+=6){
    p[i+1]-=24*dt;p[i+4]-=24*dt;
    if(p[i+1]<0||Math.abs(p[i]-cx)>40||Math.abs(p[i+2]-cz)>40){const x=cx+rand(-40,40),z=cz+rand(-40,40),y=rand(25,40);p[i]=x;p[i+1]=y;p[i+2]=z;p[i+3]=x+.05;p[i+4]=y+.55;p[i+5]=z;}
  }
  a.needsUpdate=true;
}
function updateEnvironment(dt,t){
  for(const s of W.spin){
    if(s.blink){s.blink.visible=Math.sin(t*(s.pad?6:2)+s.blink.position.x)>0;continue;}
    if(s.crane){s.o.rotation.y=Math.sin(t*.12)*1.1+.6;continue;}
    s.o.rotation[s.ax]+=s.sp*dt;
  }
  for(const c of W.traffic){c.a+=c.sp*dt;const x=Math.cos(c.a)*c.r,z=Math.sin(c.a)*c.r+c.cz;c.g.position.set(x,c.h,z);c.g.rotation.y=-c.a+(c.sp>0?-Math.PI/2:Math.PI/2)+Math.PI/2;}
  for(const s of W.search){s.piv.rotation.z=Math.sin(t*.4+s.ph)*.6;s.piv.rotation.x=.5+Math.sin(t*.27+s.ph)*.25;}
  for(const v of W.vents){v.t-=dt;if(v.t<=0){v.t=rand(.15,.35);if(camera.position.distanceTo(v.p)<70)puff(v.p,new V3(rand(-.3,.3),rand(1.5,2.5),rand(-.3,.3)),rand(1.5,2.5),rand(2,3.5),0xa8b4c8,.35);}}
  // reactor
  const R=W.reactorParts,unstable=M&&M.stage>=2;
  R.rings.forEach((r,i)=>{r.rotation.z+=dt*(i%2?1:-1)*(unstable?2.5:.6);r.position.y=3+i*3.2+(unstable?Math.sin(t*20+i)*.05:0);});
  const pulse=.5+.5*Math.sin(t*(unstable?9:2));
  R.coreM.color.setHex(unstable?(pulse>.5?0xff3d6e:0xffb03a):0x38e8ff);
  W.lights.reactor.intensity=(unstable?2.2:1.8)+pulse*(unstable?2.5:.8);W.lights.reactor.color.setHex(unstable?0xff4060:0x38e8ff);
  R.baseRing.material.color.setHex(unstable?0xff3d6e:0x38e8ff);
  if(R.nexus.visible){R.nexus.rotation.y+=dt*1.5;R.nexus.rotation.x+=dt*.7;}
  W.shaft.material.opacity=.04+pulse*.03;
  W.arcT=(W.arcT||0)-dt;
  if(W.arcT<=0){W.arcT=unstable?.05:.09;const pa=W.arcs.geometry.attributes.position,arr=pa.array;let k=0;
    for(const p of W.pylons){let a=new V3(p.x,p.y,p.z);const tgt=new V3(0,rand(4,12),-52);
      for(let s=0;s<8;s++){const f=(s+1)/8;const b=new V3(lerp(p.x,tgt.x,f),lerp(p.y,tgt.y,f),lerp(p.z,tgt.z,f));if(s<7)b.add(new V3(gauss()*.5,gauss()*.5,gauss()*.5));
        arr.set([a.x,a.y,a.z,b.x,b.y,b.z],k);k+=6;a=b;}}
    pa.needsUpdate=true;W.arcs.material.color.setHex(unstable?0xff8fa8:0x9ff4ff);W.arcs.visible=Math.random()<(unstable?.95:.7);}
  if(W.boardT===undefined||(W.boardT-=dt)<=0){W.boardT=.12;drawBoards(t);}
}
