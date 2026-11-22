// Presentation only: no collision or gameplay mutation in this module.
let scenery=null,sceneryKey='';
function drawScenery(){
 const overworld=game.round===1;
 const theme=game.round===3?'endstone':game.round===2?'netherrack':'grass';
 const key=[W,H,theme,assets.ready].join('/');
 if(key!==sceneryKey){
  sceneryKey=key;
  scenery=document.createElement('canvas');
  scenery.width=W;
  scenery.height=H;
  const c=scenery.getContext('2d');
  c.imageSmoothingEnabled=false;
  if(overworld)drawMeadow(c);
  else{
   c.fillStyle='#263b2b';
   c.fillRect(0,0,W,H);
   for(let y=70;y<H-35;y+=32)for(let x=16;x<W-16;x+=32)assets.draw(c,theme,x,y,32,32);
   c.fillStyle='#20342c44';
   c.fillRect(25,80,W-50,H-125);
  }
  for(let x=16;x<W-16;x+=32){
   assets.draw(c,overworld?'plank':'stone',x,65,32,12);
   assets.draw(c,overworld?'plank':'stone',x,H-43,32,15);
  }
  if(!overworld){
   for(let y=80;y<H-40;y+=32){
    assets.draw(c,'stone',10,y,18,32);
    assets.draw(c,'stone',W-28,y,18,32);
   }
  }
  for(let x=75;x<W-60;x+=72){
   c.fillStyle=overworld?'#a4763c':'#8a7049';
   c.fillRect(x,54,7,20);
   c.fillRect(x,60,54,4);
   c.fillStyle=overworld?'#d9ac61':'#bd9d63';
   c.fillRect(x,54,3,20);
  }
  for(let y=120;y<H-90;y+=116){
   assets.draw(c,'flowers',30,y,26,26);
   assets.draw(c,overworld?'flowers':'mushroom',W-51,y+30,24,24);
  }
  assets.draw(c,'workbench',45,32,44,44);
  assets.draw(c,'furnace',W-90,30,44,44);
  assets.draw(c,'chest',W/2-22,28,44,44);
 }
 ctx.drawImage(scenery,0,0);
 drawWorldLandmarks();
 const t=game.visualTime||0;
 if(!overworld)for(const x of [105,W-105]){
  box(x,52,5,22,'#62452f');
  box(x-3,46,11,10,Math.floor(t*8)%2?'#e9bf68':'#d58c49');
  box(x,43,5,8,'#f3dda1');
 }
 for(let i=0;i<7;i++){
  const x=55+(i*157)%(W-90),y=110+(i*107+t*7)%(H-180);
  box(x,y,2,2,overworld?'#fff6b7b0':'#e2d69b55');
 }
}
function drawMeadow(c){
 const sun=c.createLinearGradient(W*.2,0,W*.86,H);
 sun.addColorStop(0,'#c6e68b');
 sun.addColorStop(.38,'#99cc63');
 sun.addColorStop(1,'#76aa56');
 c.fillStyle=sun;
 c.fillRect(0,0,W,H);
 // Java's grass tile is grayscale. Tint it with the meadow underneath.
 const motif=32;
 if(assets.cache.has('grass')){
  c.save();
  c.globalAlpha=.17;
  c.globalCompositeOperation='multiply';
  for(let y=0;y<H;y+=motif)for(let x=0;x<W;x+=motif)assets.draw(c,'grass',x,y,motif,motif);
  c.restore();
 }
 for(let y=85;y<H-48;y+=28)for(let x=20;x<W-23;x+=28){
  const pattern=(x*31+y*17)%47;
  if(pattern<24){
   c.fillStyle=pattern<8?'#efffa331':'#56884526';
   c.fillRect(x+pattern%12,y+pattern%8,5+pattern%9,3+pattern%5);
  }
 }
 c.fillStyle='#dec18a';
 c.fillRect(0,31,W,18);
 c.fillRect(20,H-30,W-40,11);
 c.fillStyle='#f1d9a0';
 c.fillRect(0,32,W,5);
 c.fillRect(20,H-29,W-40,3);
 const foliage=[['#79ae4a','#528044','#a9d16b'],['#88ba55','#608842','#b7da77']];
 for(const [i,x] of [45,W-72,126,W-151].entries()){
  const y=i<2?H-92:H-55;
  const [leaf,shade,shine]=foliage[i%2];
  c.fillStyle='#4e72463f';
  c.fillRect(x+6,y+14,34,22);
  c.fillStyle='#b38751';
  c.fillRect(x+13,y+16,8,14);
  c.fillStyle=shade;
  c.fillRect(x,y,32,19);
  c.fillStyle=leaf;
  c.fillRect(x+3,y-6,26,20);
  c.fillStyle=shine;
  c.fillRect(x+7,y-5,14,5);
  c.fillStyle='#dd7154';
  c.fillRect(x+9,y+7,4,4);
  c.fillRect(x+22,y+10,4,4);
 }
}
function actor(e,player=false){const id=player?'player':e.type==='boss'?(game.round>1?'boss-'+game.round:'boss'):(e.art||e.type);let size=player?46:e.type==='boss'?102:e.type==='heavy'?61:e.type==='fast'?36:45;const phase=Math.floor((game.visualTime||0)*(player?8:6))%4;box(e.x-size*.32,e.y+size*.27,size*.64,6,'#182a2855');ctx.save();if(player&&game.state==='defeat'){ctx.translate(e.x,e.y);ctx.rotate(Math.PI/2);ctx.translate(-e.x,-e.y);ctx.globalAlpha=.65}if(e.flash>0||player&&e.inv>0)ctx.globalAlpha=.65;assets.draw(ctx,id,e.x-size/2,e.y-size/2,size,size,phase);ctx.restore();if(e.flash>0){box(e.x-5,e.y-5,10,3,'#fff4d2');box(e.x-2,e.y-8,3,10,'#fff4d2')}if(!player&&e.hp<e.maxHp&&e.type!=='boss'){box(e.x-e.r,e.y-size/2-6,e.r*2,4,'#29342b');box(e.x-e.r,e.y-size/2-6,e.r*2*Math.max(0,e.hp/e.maxHp),3,'#dbad68')}}
function draw(){ctx.setTransform(view.dpr,0,0,view.dpr,0,0);ctx.imageSmoothingEnabled=false;box(0,0,view.width,view.height,game.round===1?'#a7ce83':'#23362d');ctx.save();ctx.translate(Math.round(view.x),Math.round(view.y));ctx.scale(view.scale,view.scale);if(game.shake>0)ctx.translate(Math.round(rand(-game.shake*.5,game.shake*.5)),Math.round(rand(-game.shake*.5,game.shake*.5)));drawScenery();for(const o of game.orbs){const bob=Math.sin((game.visualTime||0)*3+o.x)*2;assets.draw(ctx,o.id||'bread',o.x-12,o.y-12+bob,24,24)}for(const t of game.trails){ctx.globalAlpha=t.life*2;assets.draw(ctx,'player',t.x-22,t.y-22,44,44,0)}ctx.globalAlpha=1;
 for(const e of game.enemies){if(e.wind>0){ctx.strokeStyle='#e5a45f';ctx.lineWidth=3;ctx.setLineDash([10,7]);ctx.strokeRect(e.x-e.r-15,e.y-e.r-15,e.r*2+30,e.r*2+30);ctx.setLineDash([]);if(e.attackType==='charge'){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.lockAngle||0);box(30,-14,160,28,'#df8e4c55');ctx.restore()}}actor(e)}
 const p=game.player;actor(p,true);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.rotate(Math.PI/4);assets.draw(ctx,(input.fire||input.touchFire)?'bow'+Math.min(2,Math.floor((p.charge||0)/p.interval*3)):'bow',7,-23,32,32);ctx.restore();for(const b of game.bullets){if(!b.hostile){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vy,b.vx)+Math.PI/4);assets.draw(ctx,'arrowMC',-12,-12,24,24);ctx.restore();continue}box(b.x-b.r-1,b.y-b.r-1,b.r*2+2,b.r*2+2,b.hostile?'#683c32':'#735b35');box(b.x-b.r,b.y-b.r,b.r*2,b.r*2,b.hostile?'#e89b61':b.crit?'#edc674':'#f8e1a2')}
 for(const a of game.particles){ctx.globalAlpha=a.life/a.max;box(a.x,a.y,a.size,a.size,a.color)}ctx.globalAlpha=1;ctx.textAlign='center';for(const n of game.numbers){ctx.globalAlpha=Math.min(1,n.life*3);ctx.font=`bold ${n.big?23:16}px monospace`;ctx.fillStyle='#27392d';ctx.fillText(n.text,n.x+2,n.y+2);ctx.fillStyle=n.color;ctx.fillText(n.text,n.x,n.y)}ctx.globalAlpha=1;
 for(const f of game.ghosts||[]){ctx.save();ctx.globalAlpha=f.life/.28;ctx.translate(f.x,f.y);ctx.rotate((1-f.life/.28)*.4);const size=(f.type==='boss'?90:42)*f.life/.28;assets.draw(ctx,f.type,-size/2,-size/2,size,size,0);ctx.restore()}
 for(const f of game.foodFlights||[]){const progress=1-f.life/.65;assets.draw(ctx,f.id,f.x+(45-f.x)*progress,f.y+(90-f.y)*progress,22,22)}
 if(game.state==='boss_warning'){ctx.globalAlpha=.18+.1*Math.sin((game.visualTime||0)*8);box(0,70,W,H-110,'#7b4238');ctx.globalAlpha=1}ctx.restore()}

function drawWorldLandmarks(){const t=game.visualTime;
 if(game.round===1){for(const x of [100,W-185]){box(x,103,85,60,'#caa473');box(x-10,95,105,18,'#ad674c');box(x-10,95,105,4,'#e3a574');box(x+10,120,18,20,'#bde5e8');box(x+52,125,22,38,'#715138');for(let i=0;i<7;i++){box(x+i*12,185,8,35,'#59462b');assets.draw(ctx,'wheat',x+i*12,185,16,24)}}assets.draw(ctx,'npc',W/2+55,110,40,40,Math.floor(t*3)%4)}
 else if(game.round===2){for(const x of [70,W-135]){for(let y=130;y<H-100;y+=40)assets.draw(ctx,'lava',x,y,40,40);box(x-5,95,55,25,'#322333');box(x+8,75,29,30,'#462c38')}for(let i=0;i<5;i++){const x=150+i*(W-300)/4;box(x,110,9,50,'#5c303d');box(x-14,90,38,25,'#933945')}}
 else{for(const x of [90,W-120])for(const y of [130,H-200]){box(x,y,35,90,'#241f31');box(x-3,y-6,41,12,'#4d3c60');ctx.globalAlpha=.6+.3*Math.sin(t*3);box(x+7,y-22,21,18,'#c38bef');box(x+12,y-28,11,28,'#f4c8ff');ctx.globalAlpha=1}box(W/2-42,95,84,43,'#211e29');box(W/2-32,104,64,25,'#8662ac')}
}
