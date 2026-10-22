
/* ================= COLLISION WORLD ================= */
const world=new THREE.Group();scene.add(world);
const colliders=[];
function addBox(x1,z1,x2,z2,y1,y2,mat,kind,opts){
  opts=opts||{};
  const m=new THREE.Mesh(new THREE.BoxGeometry(x2-x1,y2-y1,z2-z1),mat);
  m.position.set((x1+x2)/2,(y1+y2)/2,(z1+z2)/2);
  m.castShadow=opts.cast!==false;m.receiveShadow=true;
  if(opts.visible!==false)world.add(m);
  const c={min:[x1,y1,z1],max:[x2,y2,z2],mesh:m,kind:kind||'solid',alive:true};
  if(opts.collide!==false)colliders.push(c);
  return c;
}
const STEP=.38;
function pushOut(p,r,h){
  for(const c of colliders){
    if(!c.alive||c.max[1]<=p.y+STEP||c.min[1]>=p.y+h)continue;
    const cx=clamp(p.x,c.min[0],c.max[0]),cz=clamp(p.z,c.min[2],c.max[2]);
    const dx=p.x-cx,dz=p.z-cz,d2=dx*dx+dz*dz;if(d2>=r*r)continue;
    if(d2>1e-10){const d=Math.sqrt(d2);p.x+=dx/d*(r-d);p.z+=dz/d*(r-d);}
    else{const l=p.x-c.min[0],rr=c.max[0]-p.x,f=p.z-c.min[2],b=c.max[2]-p.z,m=Math.min(l,rr,f,b);
      if(m===l)p.x=c.min[0]-r;else if(m===rr)p.x=c.max[0]+r;else if(m===f)p.z=c.min[2]-r;else p.z=c.max[2]+r;}
  }
}
function groundAt(p,r){let g=0;for(const c of colliders){if(!c.alive)continue;const top=c.max[1];if(top>p.y+STEP||top<=g)continue;
  if(p.x+r>c.min[0]&&p.x-r<c.max[0]&&p.z+r>c.min[2]&&p.z-r<c.max[2])g=top;}return g;}
function ceilingAt(p,r,h){for(const c of colliders){if(!c.alive)continue;if(c.min[1]<=p.y+h-.25||c.min[1]>p.y+h+.3)continue;
  if(p.x+r>c.min[0]&&p.x-r<c.max[0]&&p.z+r>c.min[2]&&p.z-r<c.max[2])return true;}return false;}
function moveUnit(u,dt,r,h){
  const p=u.pos;p.x+=u.vel.x*dt;p.z+=u.vel.z*dt;
  pushOut(p,r,h);pushOut(p,r,h);
  u.vel.y-=18*dt;p.y+=u.vel.y*dt;
  if(u.vel.y>0&&ceilingAt(p,r,h))u.vel.y=0;
  const gh=groundAt(p,r*.75);
  if(p.y<=gh){const fall=u.vel.y;p.y=gh;u.vel.y=0;if(!u.onGround&&u.onLand)u.onLand(fall);u.onGround=true;}
  else if(u.onGround&&p.y-gh<.36&&u.vel.y<=0){p.y=gh;u.vel.y=0;}
  else u.onGround=false;
}
function rayBox(o,d,mn,mx,maxT){
  let tmin=0,tmax=maxT,ax=-1,sg=0;
  for(let i=0;i<3;i++){
    if(Math.abs(d[i])<1e-9){if(o[i]<mn[i]||o[i]>mx[i])return null;continue;}
    let t1=(mn[i]-o[i])/d[i],t2=(mx[i]-o[i])/d[i],s=-1;if(t1>t2){const t=t1;t1=t2;t2=t;s=1;}
    if(t1>tmin){tmin=t1;ax=i;sg=s;}if(t2<tmax)tmax=t2;if(tmin>tmax)return null;
  }
  if(ax<0)return null;return {t:tmin,axis:ax,sign:sg};
}
function raySphere(o,d,c,r,maxT){
  const ox=o[0]-c.x,oy=o[1]-c.y,oz=o[2]-c.z;const b=ox*d[0]+oy*d[1]+oz*d[2];const cc=ox*ox+oy*oy+oz*oz-r*r;
  if(cc<0)return 0;const disc=b*b-cc;if(disc<0)return null;const t=-b-Math.sqrt(disc);return t>=0&&t<=maxT?t:null;
}
const smokes=[];
function losClear(a,b,ignoreGlass){
  const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,L=Math.hypot(dx,dy,dz);if(L<.01)return true;
  const o=[a.x,a.y,a.z],d=[dx/L,dy/L,dz/L];
  for(const c of colliders){if(!c.alive||c.kind==='glass'||c.kind==='rail')continue;if(rayBox(o,d,c.min,c.max,L))return false;}
  for(const s of smokes){if(s.k>.4&&raySphere(o,d,s.pos,s.r*s.k,L)!==null)return false;}
  return true;
}

/* ================= NAVIGATION ================= */
const NAV={OX:-72,OZ:-100,CS:1.5,NX:96,NZ:168};
NAV.walk=new Uint8Array(NAV.NX*NAV.NZ);
const NN=NAV.NX*NAV.NZ;
function rebuildNav(){
  const {OX,OZ,CS,NX,NZ}=NAV,w=NAV.walk,m=.5;w.fill(1);
  for(let i=0;i<NX;i++){w[i]=0;w[(NZ-1)*NX+i]=0;}for(let j=0;j<NZ;j++){w[j*NX]=0;w[j*NX+NX-1]=0;}
  for(const c of colliders){
    if(!c.alive||c.max[1]<=.4||c.min[1]>=1.7)continue;
    const i1=Math.max(0,Math.ceil((c.min[0]-m-OX)/CS-.5)),i2=Math.min(NX-1,Math.floor((c.max[0]+m-OX)/CS-.5));
    const j1=Math.max(0,Math.ceil((c.min[2]-m-OZ)/CS-.5)),j2=Math.min(NZ-1,Math.floor((c.max[2]+m-OZ)/CS-.5));
    for(let j=j1;j<=j2;j++)for(let i=i1;i<=i2;i++)w[j*NX+i]=0;
  }
}
const cellI=(x,z)=>{const i=clamp(Math.floor((x-NAV.OX)/NAV.CS),0,NAV.NX-1),j=clamp(Math.floor((z-NAV.OZ)/NAV.CS),0,NAV.NZ-1);return j*NAV.NX+i;};
const cellPos=(c,out)=>out.set(NAV.OX+(c%NAV.NX+.5)*NAV.CS,0,NAV.OZ+(Math.floor(c/NAV.NX)+.5)*NAV.CS);
function nearestWalk(c,maxR){
  if(NAV.walk[c])return c;const NX=NAV.NX,NZ=NAV.NZ,ci=c%NX,cj=Math.floor(c/NX);
  for(let r=1;r<(maxR||12);r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){
    if(Math.abs(di)!==r&&Math.abs(dj)!==r)continue;const i=ci+di,j=cj+dj;if(i<0||j<0||i>=NX||j>=NZ)continue;if(NAV.walk[j*NX+i])return j*NX+i;}
  return -1;
}
function walkablePoint(p){const c=nearestWalk(cellI(p.x,p.z));return c<0?null:cellPos(c,new V3());}
function gridClear(a,b){
  const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz),n=Math.ceil(L/.4);
  for(let k=1;k<n;k++){const t=k/n;if(!NAV.walk[cellI(a.x+dx*t,a.z+dz*t)])return false;}
  return true;
}
const _g=new Float32Array(NN),_p=new Int32Array(NN),_cl=new Uint8Array(NN);
function findPath(from,to){
  const NX=NAV.NX;const s=nearestWalk(cellI(from.x,from.z)),g=nearestWalk(cellI(to.x,to.z));
  if(s<0||g<0)return [];
  _g.fill(1e9);_p.fill(-1);_cl.fill(0);
  const heap=[];const push=(f,i)=>{heap.push([f,i]);let k=heap.length-1;while(k>0){const p=(k-1)>>1;if(heap[p][0]<=heap[k][0])break;[heap[p],heap[k]]=[heap[k],heap[p]];k=p;}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let k=0;for(;;){const l=2*k+1,r=l+1;let m=k;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===k)break;[heap[m],heap[k]]=[heap[k],heap[m]];k=m;}}return top;};
  const gi=g%NX,gj=Math.floor(g/NX);const h=(c)=>{const dx=Math.abs(c%NX-gi),dz=Math.abs(Math.floor(c/NX)-gj);return (dx+dz)+(1.414-2)*Math.min(dx,dz);};
  _g[s]=0;push(h(s),s);let found=false,iter=0;
  while(heap.length&&iter++<12000){
    const cur=pop()[1];if(cur===g){found=true;break;}if(_cl[cur])continue;_cl[cur]=1;
    const ci=cur%NX,cj=Math.floor(cur/NX);
    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){
      if(!di&&!dj)continue;const i=ci+di,j=cj+dj;if(i<0||j<0||i>=NX||j>=NAV.NZ)continue;const n=j*NX+i;if(!NAV.walk[n]||_cl[n])continue;
      if(di&&dj&&(!NAV.walk[cj*NX+i]||!NAV.walk[j*NX+ci]))continue;
      const ng=_g[cur]+(di&&dj?1.414:1);if(ng<_g[n]){_g[n]=ng;_p[n]=cur;push(ng+h(n),n);}
    }
  }
  if(!found)return [];
  const cells=[];for(let c=g;c!==-1;c=_p[c])cells.push(c);cells.reverse();
  const pts=cells.map(c=>cellPos(c,new V3()));
  if(NAV.walk[cellI(to.x,to.z)])pts[pts.length-1]=to.clone().setY(0);
  const out=[];let cur=from.clone().setY(0),i=0;
  while(i<pts.length){let j=pts.length-1;while(j>i&&!gridClear(cur,pts[j]))j--;out.push(pts[j]);cur=pts[j];i=j+1;}
  return out;
}

/* ================= EFFECTS ================= */
const SP_N=900;
const SP={pos:new Float32Array(SP_N*3),col:new Float32Array(SP_N*3),vel:new Float32Array(SP_N*3),base:new Float32Array(SP_N*3),life:new Float32Array(SP_N),max:new Float32Array(SP_N),grav:new Float32Array(SP_N),i:0,pts:null};
function initSparks(){
  for(let i=0;i<SP_N;i++)SP.pos[i*3+1]=-999;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(SP.pos,3));g.setAttribute('color',new THREE.BufferAttribute(SP.col,3));
  SP.pts=new THREE.Points(g,new THREE.PointsMaterial({size:.09,map:TEX.soft,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  SP.pts.frustumCulled=false;scene.add(SP.pts);
}
const _c=new THREE.Color();
function sparks(p,n,count,color,speed,grav,life){
  _c.set(color);
  for(let k=0;k<count;k++){
    const i=SP.i;SP.i=(SP.i+1)%SP_N;
    SP.pos[i*3]=p.x;SP.pos[i*3+1]=p.y;SP.pos[i*3+2]=p.z;
    let vx=gauss(),vy=gauss(),vz=gauss();if(n){vx+=n.x*1.4;vy+=n.y*1.4;vz+=n.z*1.4;}
    const s=(speed||4)*rand(.4,1);SP.vel[i*3]=vx*s;SP.vel[i*3+1]=vy*s+(n?0:1);SP.vel[i*3+2]=vz*s;
    SP.base[i*3]=_c.r;SP.base[i*3+1]=_c.g;SP.base[i*3+2]=_c.b;
    SP.max[i]=SP.life[i]=(life||.45)*rand(.5,1);SP.grav[i]=grav===undefined?9:grav;
  }
}
function updateSparks(dt){
  for(let i=0;i<SP_N;i++){
    if(SP.life[i]<=0)continue;SP.life[i]-=dt;
    if(SP.life[i]<=0){SP.pos[i*3+1]=-999;continue;}
    SP.vel[i*3+1]-=SP.grav[i]*dt;
    SP.pos[i*3]+=SP.vel[i*3]*dt;SP.pos[i*3+1]+=SP.vel[i*3+1]*dt;SP.pos[i*3+2]+=SP.vel[i*3+2]*dt;
    if(SP.pos[i*3+1]<.02){SP.pos[i*3+1]=.02;SP.vel[i*3+1]*=-.3;SP.vel[i*3]*=.6;SP.vel[i*3+2]*=.6;}
    const f=SP.life[i]/SP.max[i];SP.col[i*3]=SP.base[i*3]*f;SP.col[i*3+1]=SP.base[i*3+1]*f;SP.col[i*3+2]=SP.base[i*3+2]*f;
  }
  SP.pts.geometry.attributes.position.needsUpdate=true;SP.pts.geometry.attributes.color.needsUpdate=true;
}
const tracers=[];const tracerGeo=new THREE.BoxGeometry(1,1,1);tracerGeo.translate(0,0,.5);
function tracer(a,b,color,w){
  let t=tracers.find(x=>x.life<=0);
  if(!t){if(tracers.length>50)return;t={mesh:new THREE.Mesh(tracerGeo,MT.tracer.clone()),life:0};scene.add(t.mesh);tracers.push(t);}
  t.mesh.material.color.set(color||0xfff0c0);t.mesh.position.copy(a);t.mesh.lookAt(b);const s=w||.018;t.mesh.scale.set(s,s,Math.max(.01,a.distanceTo(b)));t.mesh.visible=true;t.life=t.max=w?.12:.06;
}
function updateTracers(dt){for(const t of tracers){if(t.life<=0)continue;t.life-=dt;t.mesh.material.opacity=Math.max(0,t.life/t.max)*.9;if(t.life<=0)t.mesh.visible=false;}}
const decals=[];let decalI=0;const decalGeo=new THREE.PlaneGeometry(.1,.1);
function decal(p,n,size){
  let d=decals[decalI];
  if(!d){d=new THREE.Mesh(decalGeo,new THREE.MeshBasicMaterial({map:TEX.decal,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4}));scene.add(d);decals[decalI]=d;}
  decalI=(decalI+1)%160;d.position.copy(p).addScaledVector(n,.006);d.lookAt(T1.copy(d.position).add(n));d.rotation.z=Math.random()*TAU;d.scale.setScalar(size||1);d.visible=true;
}
const shells=[];
function shell(p,v){
  let s=shells.find(x=>x.life<=0);
  if(!s){if(shells.length>30)return;s={mesh:new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.028,6),MT.brass),vel:new V3(),spin:new V3(),life:0};scene.add(s.mesh);shells.push(s);}
  s.mesh.position.copy(p);s.vel.copy(v);s.spin.set(rand(-20,20),rand(-20,20),rand(-20,20));s.life=1.6;s.mesh.visible=true;s.bounced=false;
}
function updateShells(dt){for(const s of shells){if(s.life<=0)continue;s.life-=dt;s.vel.y-=11*dt;s.mesh.position.addScaledVector(s.vel,dt);
  s.mesh.rotation.x+=s.spin.x*dt;s.mesh.rotation.y+=s.spin.y*dt;s.mesh.rotation.z+=s.spin.z*dt;
  const gh=groundAt(s.mesh.position,.01);if(s.mesh.position.y<gh+.01){s.mesh.position.y=gh+.01;s.vel.y*=-.35;s.vel.x*=.5;s.vel.z*=.5;s.spin.multiplyScalar(.5);
    if(!s.bounced&&AU.ctx){s.bounced=true;tn(AU.master,now(),.05,rand(3000,4500),rand(2500,3500),.03,'sine');}}
  if(s.life<=0)s.mesh.visible=false;}}
const flashLights=[];
function lightFlash(pos,color,intensity,dist,dur){
  let l=flashLights.find(x=>x.t<=0);
  if(!l){if(flashLights.length>=1)l=flashLights[0];else{l={light:new THREE.PointLight(0xffffff,0,10,2),t:0};scene.add(l.light);flashLights.push(l);}}
  l.light.color.set(color);l.light.position.copy(pos);l.light.distance=dist;l.base=intensity;l.light.intensity=intensity;l.t=l.max=dur;
}
function updateFlashLights(dt){for(const l of flashLights){if(l.t<=0)continue;l.t-=dt;l.light.intensity=l.base*Math.max(0,l.t/l.max);}}
const pulses=[];
function pulseFx(pos,color,radius,dur,op){
  const m=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),new THREE.MeshBasicMaterial({color,transparent:true,opacity:op||.5,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  m.position.copy(pos);scene.add(m);pulses.push({m,t:0,dur,radius,op:op||.5});
}
function updatePulses(dt){for(let i=pulses.length-1;i>=0;i--){const p=pulses[i];p.t+=dt;const k=p.t/p.dur;p.m.scale.setScalar(.2+p.radius*Math.sqrt(k));p.m.material.opacity=p.op*(1-k);
  if(k>=1){scene.remove(p.m);p.m.geometry.dispose();p.m.material.dispose();pulses.splice(i,1);}}}
// smoke puffs (steam vents, explosions)
const puffs=[];
function puff(pos,vel,size,life,color,op){
  let p=puffs.find(x=>x.t<=0);
  if(!p){if(puffs.length>90)return;p={s:new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.smoke,transparent:true,depthWrite:false})),vel:new V3(),t:0};scene.add(p.s);puffs.push(p);}
  p.s.position.copy(pos);p.vel.copy(vel);p.t=p.max=life;p.size=size;p.op=op||.6;p.s.material.color.set(color||0x8d98ad);p.s.material.rotation=Math.random()*TAU;p.s.visible=true;
}
function updatePuffs(dt){for(const p of puffs){if(p.t<=0)continue;p.t-=dt;const k=1-p.t/p.max;p.s.position.addScaledVector(p.vel,dt);p.vel.multiplyScalar(1-dt*.6);
  const s=p.size*(.5+k*1.2);p.s.scale.set(s,s,1);p.s.material.opacity=p.op*Math.sin(Math.min(1,k*1.4)*Math.PI*.5)*(1-k);p.s.material.rotation+=dt*.2;if(p.t<=0)p.s.visible=false;}}
let shakeT=0,shakeA=0;
function shake(a,t){shakeA=Math.max(shakeA,a);shakeT=Math.max(shakeT,t);}
