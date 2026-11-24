const $=id=>document.getElementById(id), canvas=$('arena'), ctx=canvas.getContext('2d');
let W=1100,H=720; const  clamp=(n,a,b)=>Math.max(a,Math.min(b,n)), rand=(a,b)=>a+Math.random()*(b-a), dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const audio=new AudioEngine();
class Player{constructor(){Object.assign(this,{x:W/2,y:H/2,r:14,hp:120,maxHp:120,speed:205,damage:12,interval:.30,pierce:0,pickup:70,shot:0,dashCd:0,dashing:0,inv:0,dx:1,dy:0,angle:0})}}
class Enemy{constructor(type,x,y){const data={normal:[26,72,15,12,7,'#a1b96a'],fast:[16,135,11,9,8,'#d2a25c'],heavy:[72,43,23,20,18,'#967dad'],boss:[960,48,42,22,0,'#d87767']}[type];Object.assign(this,{type,x,y,hp:data[0],maxHp:data[0],speed:data[1],r:data[2],damage:data[3],xp:data[4],color:data[5],flash:0,kx:0,ky:0,attack:2.5,wind:0,phase:0})}}
class Bullet{constructor(x,y,a,damage,pierce,hostile=false){Object.assign(this,{x,y,px:x,py:y,vx:Math.cos(a)*(hostile?155:610),vy:Math.sin(a)*(hostile?185:610),r:hostile?7:4,damage,left:pierce+1,life:2.5,hostile,hit:new Set(),crit:!hostile&&Math.random()<.13});if(this.crit)this.damage*=2}}
class Orb{constructor(x,y,value){Object.assign(this,{x,y,value,r:5})}}
class Particle{constructor(x,y,color,speed=100,life=.4){let a=rand(0,Math.PI*2),v=rand(15,speed);Object.assign(this,{x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,color,life,max:life,size:rand(2,6)})}}
const input={keys:new Set(),mx:W/2+100,my:H/2,fire:false,touchFire:false,jx:0,jy:0};
const upgrades=FOOD_SKILLS.map(f=>[f.name,f.effect,f.apply,f.id]);
class Game{
 constructor(){this.synergy=0;this.craftResume=null;this.inventory={};this.foodLevels={};this.crafted=new Set();this.unlocked=new Set();this.buffTime=0;this.shield=0;this.round=1;this.roundStart=0;this.foodFlights=[];this.ghosts=[];this.visualTime=0;this.bus=new EventBus();this.machine=new GameStateManager(this.bus);this.dialogue=new DialogueManager(this);this.director=new SpawnDirector();this.tutorial=new TutorialManager(false);this.stageFlags=new Set();this.transitionTimer=0;this.transitionDone=null;this.hudClock=0;this.player=new Player();this.enemies=[];this.bullets=[];this.orbs=[];this.particles=[];this.numbers=[];this.trails=[];this.time=0;this.kills=0;this.level=1;this.xp=0;this.need=24;this.combo=0;this.comboTime=0;this.spawn=1;this.shake=0;this.toastTime=0;this.bossStarted=false;this.choices=[];this.upgradePromptedLevel=0;this.boss=null}
 get state(){return this.machine.current}
 get tutorialStep(){return this.tutorial.step}
 transition(state){
  if(this.state===state){this.hud();return}
  const wasActive=this.machine.active;
  this.machine.set(state);
  if(!wasActive||!this.machine.active)resetControls();
  this.hud();
  if(this.machine.active)canvas.focus({preventScroll:true});
 }
 combatState(){return this.bossStarted?STATES.BOSS_FIGHT:this.tutorial.enabled?STATES.TUTORIAL:STATES.PLAYING}
 signal(name,data){this.bus.emit(name,data);this.tutorial.event(name)}
 start(tutorial=true){const bus=this.bus;Object.assign(this,new Game());this.bus=bus;this.machine.bus=bus;this.dialogue.game=this;this.tutorial=new TutorialManager(tutorial);audio.start();audio.play('start');this.storyOutcome=null;this.enemies.push(new Enemy('normal',W/2+140,H/2));this.bus.emit('GAME_STARTED');$('overlay').innerHTML='';this.transition(this.combatState());this.hud()}
 skipTutorial(){this.tutorial.skip();if(this.machine.active)this.transition(this.combatState())}
 uiUpdate(dt){this.visualTime+=dt;audio.update(dt,this);for(const f of this.foodFlights)f.life-=dt;this.foodFlights=this.foodFlights.filter(f=>f.life>0);for(const f of this.ghosts)f.life-=dt;this.ghosts=this.ghosts.filter(f=>f.life>0);this.effects(dt);this.dialogue.update(dt);this.toastTime-=dt;if(this.toastTime<=0)$('toast').textContent='';this.shake=Math.max(0,this.shake-dt*35);if(this.transitionTimer>0){this.transitionTimer-=dt;if(this.transitionTimer<=0){const cb=this.transitionDone;this.transitionDone=null;cb?.()}}}

 notify(s,seconds=3.5){$('toast').textContent=s;this.toastTime=seconds}
 burst(x,y,color,count=10,speed=100){for(let i=0;i<count&&this.particles.length<450;i++)this.particles.push(new Particle(x,y,color,speed))}
 number(x,y,text,color='#f5ecc8',big=false){this.numbers.push({x,y,text,color,big,life:.8});if(this.numbers.length>90)this.numbers.shift()}
 dash(){const p=this.player;if(!this.machine.active||p.dashCd>0)return;let x=(input.keys.has('d')||input.keys.has('arrowright')?1:0)-(input.keys.has('a')||input.keys.has('arrowleft')?1:0)+input.jx,y=(input.keys.has('s')||input.keys.has('arrowdown')?1:0)-(input.keys.has('w')||input.keys.has('arrowup')?1:0)+input.jy;let l=Math.hypot(x,y);p.dx=l?x/l:Math.cos(p.angle);p.dy=l?y/l:Math.sin(p.angle);p.dashing=.18;p.inv=.27;p.dashCd=p.dashMax||2.5;audio.play('dash');this.signal('PLAYER_DASHED')}
 hurt(d,x,y){let p=this.player;if(!this.machine.active||p.inv>0)return;const blocked=Math.min(this.shield,d);this.shield-=blocked;d-=blocked;p.hp=Math.max(0,p.hp-d);p.inv=1;this.shake=9;let a=Math.atan2(p.y-y,p.x-x);p.x=clamp(p.x+Math.cos(a)*22,35,W-35);p.y=clamp(p.y+Math.sin(a)*22,85,H-50);this.signal('PLAYER_DAMAGED',d);audio.play('hurt');this.burst(p.x,p.y,'#ff857c',18);this.number(p.x,p.y,'−'+d,'#ff8f85',true);if(p.hp<=0)this.end(false)}
 hit(e,b){if(!this.machine.active||e.dead)return;e.hp-=b.damage;e.flash=.1;const a=Math.atan2(b.vy,b.vx);e.kx+=Math.cos(a)*155;e.ky+=Math.sin(a)*155;this.number(e.x,e.y-e.r,Math.round(b.damage)+(b.crit?' 暴击!':''),b.crit?'#ffda77':'#f2f4da',b.crit);this.burst(b.x,b.y,b.crit?'#ffe38c':'#e2edba',6);audio.play(b.crit?'crit':'hit');if(b.crit)this.shake=3;if(e.hp<=0)this.kill(e)}
 kill(e){if(e.dead)return;e.dead=true;this.ghosts.push({x:e.x,y:e.y,type:e.type,r:e.r,life:.28});this.kills++;this.signal('ENEMY_KILLED',e);this.combo=this.comboTime>0?this.combo+1:1;this.comboTime=3;audio.play('death');this.burst(e.x,e.y,e.color,20,180);if(e.type==='boss'){this.clearRound();return}this.addExperience(e.xp); if(Math.random()<.22){const pool=this.round===1?['potato','carrot','apple','fish','bread']:this.round===2?['beet','chicken','berries','potato','milk']:['fish','carrot','milk','apple','potato'];const id=pool[Math.floor(Math.random()*pool.length)];if(id!=='bread'||(this.breadDrops||0)<2){if(id==='bread')this.breadDrops=(this.breadDrops||0)+1;const o=new Orb(e.x,e.y,0);o.id=id;this.orbs.push(o)}}if(this.combo%5===0){this.notify(this.combo+' 连击 · 势不可挡');this.shake=4}}
 gain(n,id="bread"){if(!this.machine.active)return;this.collectFood(id);this.addExperience(n);audio.play('xp');this.signal('ORB_COLLECTED',n);if(this.foodFlights.length<5)this.foodFlights.push({id,x:this.player.x,y:this.player.y,life:.65})}
 addExperience(amount){
  const ready=this.xp>=this.need;
  this.xp+=amount;
  if(!ready&&this.xp>=this.need)this.hud();
 }
 levelup(){
  if(!this.machine.active||this.xp<this.need)return;
  this.upgradePromptedLevel=this.level;
  if(!this.choices.length)this.choices=[...upgrades].filter(u=>(this.foodLevels[u[3]]||0)<5).sort(()=>Math.random()-.5).slice(0,3);
  if(!this.choices.length)return;
  this.transition(STATES.LEVEL_UP);
  this.signal('PLAYER_LEVEL_UP');
  audio.play('up');this.burst(this.player.x,this.player.y,'#e5ff9c',50,240);$('overlay').innerHTML=`<div class="panel"><div class="eyebrow">LEVEL UP · ${this.level+1}</div><h2>营养补给核心 · 选择食品</h2><button data-close-upgrade>稍后再选</button><p>${this.level===1?STORY.firstUpgrade:"幻想强化立即生效；营养知识描述现实食物"}</p><div class="cards">${this.choices.map((u,i)=>`<button class="card rarity-${i}" data-choice="${i}">${assets.html(u[3],"upgrade-icon")}<small class="rarity">${["实用","精制","珍藏"][i]}</small><strong>${u[0]}</strong><small>${u[1]}</small><small class="knowledge">现实 · ${FOOD_KNOWLEDGE[u[3]].knowledge}</small></button>`).join('')}</div></div>`}
 choose(i){if(this.state!=='levelup'||!this.choices[i])return;const u=this.choices[i];u[2](this.player,this);this.foodLevels[u[3]]=(this.foodLevels[u[3]]||0)+1;this.unlockFood(u[3]);this.xp-=this.need;this.level++;this.choices=[];this.need=Math.round(this.need*1.24);this.signal('UPGRADE_SELECTED',u[0]);this.transition(this.combatState());this.player.inv=1;$('overlay').innerHTML='';this.notify(u[0]+' · '+u[1]);this.burst(this.player.x,this.player.y,'#d5ff97',50,240);this.hud()}
 unlockFood(id){if(!FOOD_KNOWLEDGE[id])return;this.unlocked.add(id);try{const saved=JSON.parse(localStorage.getItem('nutrition-codex')||'[]');localStorage.setItem('nutrition-codex',JSON.stringify([...new Set([...saved,id])]))}catch{}}
 collectFood(id){this.inventory[id]=(this.inventory[id]||0)+1;if(!this.unlocked.has(id)){this.unlockFood(id);this.notify('艾莉丝：'+FOOD_KNOWLEDGE[id].knowledge)}}
 openCraft(){if(!this.machine.active)return;this.signal('CRAFT_OPENED');this.craftResume=this.combatState();this.transition(STATES.PAUSED);this.craftSlots=[];this.renderCraft()}
 renderCraft(){const available=Object.keys(this.inventory).filter(id=>this.inventory[id]>0);$('overlay').innerHTML=`<div class="panel crafting"><div class="eyebrow">NUTRITION CORE · 营养补给核心</div><h2>工作台 · 合理搭配</h2><p>点击食品放入三格；每项配方每局合成一次。</p><div class="craft-slots">${[0,1,2].map(i=>`<button data-remove-food="${i}">${this.craftSlots[i]?assets.html(this.craftSlots[i]):'+'}</button>`).join('')}<b> → </b>${assets.html('workbench')}</div><div class="food-grid">${available.map(id=>`<button data-add-food="${id}">${assets.html(id)}<small>${FOOD_KNOWLEDGE[id].name} ×${this.inventory[id]}</small></button>`).join('')}</div><div class="recipes">${RECIPES.map(r=>`<p>${this.crafted.has(r.id)?'✓ ':''}${r.name}：${r.foods.map(id=>FOOD_KNOWLEDGE[id].name).join(' + ')}</p>`).join('')}</div><p id="craftResult">组合转化为幻想战斗能力</p><button class="primary" data-make-meal>合成</button><button data-close-craft>返回战斗</button></div>`}
 craft(){const r=RECIPES.find(r=>r.foods.length===this.craftSlots.length&&r.foods.every(id=>this.craftSlots.includes(id)));if(!r||this.crafted.has(r.id)||!r.foods.every(id=>this.inventory[id]>0)){$('craftResult').textContent='配方不匹配、食材不足或本局已合成';return false}r.foods.forEach(id=>this.inventory[id]--);this.crafted.add(r.id);this.lastMeal=r.foods;r.apply(this);this.craftSlots=[];this.renderCraft();$('craftResult').innerHTML='<div class=craft-flight>'+r.foods.map(id=>assets.html(id)).join('')+'</div><b>BALANCED MEAL!</b><br>艾莉丝：'+r.knowledge;audio.play('craft');this.burst(this.player.x,this.player.y,'#fff1a0',70,250);return true}
 closeCraft(){if(!this.craftResume)return;const state=this.craftResume;this.craftResume=null;this.transition(state);$('overlay').innerHTML=''}
 pause(){if(this.craftResume){this.closeCraft();return}if(this.machine.active){this.resumeState=this.state;this.transition(STATES.PAUSED);this.bus.emit('GAME_PAUSED');$('overlay').innerHTML='<div class="panel"><h2>休息一下</h2><button class="primary" data-resume>继续战斗</button><p>音量 <input id="volume" type="range" min="0" max="100" value="'+Math.round(audio.volume*100)+'"></p></div>';$('volume').oninput=e=>audio.setVolume(e.target.value/100)}else if(this.state===STATES.PAUSED){this.transition(this.resumeState);this.bus.emit('GAME_RESUMED');$('overlay').innerHTML=''}}
 bossStart(){this.bossStarted=true;this.transition(STATES.BOSS_FIGHT);this.bus.emit('BOSS_SPAWNED');this.player.inv=1.5;this.boss=new Enemy('boss',W/2,160);Object.assign(this.boss,{hp:LEVELS[this.round-1].hp,maxHp:LEVELS[this.round-1].hp,speed:LEVELS[this.round-1].speed,lockAngle:0,attackType:'ring',chargeTime:0});this.enemies.push(this.boss);this.notify('艾莉丝：小怪还在，边走边拉弓，别让它们围住你。');this.shake=10;audio.play('boss')}
 clearRound(){this.bus.emit('BOSS_DEFEATED',this.round);if(this.round===3){this.end(true);return}this.bullets=[];this.enemies=[];this.transition(STATES.STAGE_TRANSITION);audio.play('win');$('overlay').innerHTML=`<div class="panel clear-panel"><div class="eyebrow">CHECKPOINT CLEARED</div><h2>第${this.round}关 · 已突破</h2><div class="reward-food">${assets.html('bread')}${assets.html('apple')}${assets.html('soup')}</div><p>营地补给 · 回复25生命<br>强化全部保留，下一道守卫更强。</p><button class="primary" data-next-round>前往${LEVELS[this.round].name} →</button></div>`;}
 nextRound(){if(this.state!==STATES.STAGE_TRANSITION||!this.boss?.dead)return;this.round++;this.roundStart=this.time;this.bossStarted=false;this.boss=null;this.orbs=[];this.stageFlags.clear();this.player.hp=Math.min(this.player.maxHp,this.player.hp+25);this.player.x=W/2;this.player.y=H/2;this.player.inv=1.5;this.spawn=.6;$('overlay').innerHTML='';this.transition(this.combatState());this.notify('艾莉丝：'+CHAPTER_KNOWLEDGE[this.round-1][0])}
 end(win){if(!this.machine.active)return;this.transition(win?STATES.VICTORY:STATES.DEFEAT);this.bus.emit(win?'GAME_VICTORY':'GAME_DEFEAT');if(win)this.bus.emit('BOSS_DEFEATED');else this.bus.emit('PLAYER_DIED');audio.play(win?'win':'lose');this.burst(this.player.x,this.player.y,win?'#dbed8d':'#e58379',100,300);$('overlay').innerHTML=`<div class="panel"><div class="eyebrow">${win?'ARENA CLEARED':'TRY AGAIN'}</div><div class="reward-food">${assets.html(win?"cake":"mushroom")}${assets.html(win?"bread":"soup")}</div><h1>${win?'突围成功':'本次止步'}</h1><p>${win?STORY.victory:STORY.defeat}</p><div class="result"><span><b>${this.kills}</b>击杀</span><span><b>${this.level}</b>等级</span><span><b>${Math.floor(this.time)}s</b>存活</span></div><p>食品强化：${Object.keys(this.foodLevels).map(id=>FOOD_KNOWLEDGE[id].name).join("、")||"无"}<br>已合成 ${this.crafted.size} · 解锁知识 ${this.unlocked.size}<br>末影龙：${win?"已击败":"尚未击败"}</p><button data-guide>查看食品图鉴</button><button class="primary" data-restart>再来一局</button></div>`;if(win){const result=$('overlay').innerHTML;this.dialogue.open('ending',STATES.DIALOGUE,()=>{this.transition(STATES.VICTORY);$('overlay').innerHTML=result})}}
 updateBoss(e,dt,a){const config=LEVELS[this.round-1];e.attack-=dt;if(e.chargeTime>0){e.chargeTime-=dt;e.x+=Math.cos(e.lockAngle)*410*dt;e.y+=Math.sin(e.lockAngle)*410*dt;this.trails.push({x:e.x,y:e.y,life:.13});return}if(e.attack<=0&&e.wind<=0){e.wind=1.15;e.phase++;e.lockAngle=a;e.attack=config.gap;e.attackType=e.phase%3===2?'charge':e.phase%3===0?'fan':'ring'}if(e.wind>0){e.wind-=dt;if(e.wind<=0){if(e.attackType==='charge'){e.chargeTime=.48;audio.play('dash')}else{const count=e.attackType==='ring'?config.count:5+this.round*2;for(let j=0;j<count;j++){let angle=e.attackType==='ring'?j*Math.PI*2/count+e.phase*.28:e.lockAngle+(j-(count-1)/2)*.16;this.bullets.push(new Bullet(e.x,e.y,angle,15,0,true))}if(this.round>1&&e.attackType==='ring')for(let j=-1;j<=1;j++)this.bullets.push(new Bullet(e.x,e.y,e.lockAngle+j*.19,18,0,true));audio.play('bossAttack')}this.shake=4}}}
 update(dt){if(!this.machine.active)return;this.director.stages(this);if(!this.machine.active)return;this.time+=dt;this.buffTime=Math.max(0,this.buffTime-dt);this.comboTime-=dt;let p=this.player;p.inv=Math.max(0,p.inv-dt);p.dashCd=Math.max(0,p.dashCd-dt);p.shot-=dt;
 let x=(input.keys.has('d')||input.keys.has('arrowright')?1:0)-(input.keys.has('a')||input.keys.has('arrowleft')?1:0)+input.jx,y=(input.keys.has('s')||input.keys.has('arrowdown')?1:0)-(input.keys.has('w')||input.keys.has('arrowup')?1:0)+input.jy,l=Math.hypot(x,y);if(l>1){x/=l;y/=l}if(l>.1)this.signal('PLAYER_MOVED');
 if(p.dashing>0){p.dashing-=dt;x=p.dx*3.8;y=p.dy*3.8;this.trails.push({x:p.x,y:p.y,life:.2})}p.x=clamp(p.x+x*p.speed*dt,35,W-35);p.y=clamp(p.y+y*p.speed*dt,90,H-55);
 if(input.touchFire){let nearest=this.enemies.filter(e=>!e.dead).sort((a,b)=>dist(p,a)-dist(p,b))[0];if(nearest)p.angle=Math.atan2(nearest.y-p.y,nearest.x-p.x)}else p.angle=Math.atan2(input.my-p.y,input.mx-p.x);
 if((input.fire||input.touchFire)&&p.shot<=0){p.shot=p.interval*(this.buffTime>0?.65:1);let b=new Bullet(p.x+Math.cos(p.angle)*22,p.y+Math.sin(p.angle)*22,p.angle,p.damage,p.pierce);this.bullets.push(b);this.burst(b.x,b.y,'#ffe9a6',4,65);audio.play('shot');this.signal('SHOT_FIRED')}
 this.spawn-=dt;if(!this.bossStarted&&this.spawn<=0){this.spawn=this.director.interval(this.time-this.roundStart,this.round);if(this.enemies.length<30){let side=Math.floor(rand(0,4)),ex=side===0?40:side===1?W-40:rand(40,W-40),ey=side===2?95:side===3?H-60:rand(95,H-60);if(dist(p,{x:ex,y:ey})<150){ex=p.x<W/2?W-45:45}let type=this.time-this.roundStart<12&&this.round===1?'normal':Math.random()<.3?'heavy':Math.random()<.48?'fast':'normal';const enemy=new Enemy(type,ex,ey);enemy.art=ENEMY_ART[this.round-1][Math.floor(Math.random()*ENEMY_ART[this.round-1].length)];this.enemies.push(enemy);this.bus.emit('ENEMY_SPAWNED',enemy)}}
 for(const e of this.enemies){if(e.dead)continue;e.flash=Math.max(0,e.flash-dt);let a=Math.atan2(p.y-e.y,p.x-e.x);if(e.type==='boss'){this.updateBoss(e,dt,a);}if(!(e.wind>0)&&!(e.chargeTime>0)){e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt}e.x=clamp(e.x+e.kx*dt,e.r+20,W-e.r-20);e.y=clamp(e.y+e.ky*dt,85+e.r,H-40-e.r);e.kx*=Math.exp(-dt*12);e.ky*=Math.exp(-dt*12);if(dist(e,p)<e.r+p.r)this.hurt(e.damage,e.x,e.y);if(this.state==='defeat')break}
 if(!this.machine.active){this.hud();return;}
 for(const b of this.bullets){if(!this.machine.active)break;b.px=b.x;b.py=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.hostile){if(dist(b,p)<b.r+p.r){this.hurt(b.damage,b.x,b.y);b.life=0}}else for(const e of this.enemies){if(e.dead||b.hit.has(e)||b.left<=0)continue;const vx=b.x-b.px,vy=b.y-b.py,t=clamp(((e.x-b.px)*vx+(e.y-b.py)*vy)/(vx*vx+vy*vy||1),0,1);if(Math.hypot(e.x-b.px-vx*t,e.y-b.py-vy*t)<e.r+b.r){b.hit.add(e);this.hit(e,b);b.left--;if(b.hit.size>1)this.number(e.x,e.y-35,'贯穿!','#9ee8d9')}}}
 if(!this.machine.active){this.hud();return;}
 this.bullets=this.bullets.filter(b=>b.life>0&&b.left>0&&b.x>15&&b.x<W-15&&b.y>65&&b.y<H-20).slice(-260);this.enemies=this.enemies.filter(e=>!e.dead);
 for(let i=this.orbs.length-1;i>=0;i--){let o=this.orbs[i],d=dist(o,p);if(d<p.pickup){let a=Math.atan2(p.y-o.y,p.x-o.x);o.x+=Math.cos(a)*280*dt;o.y+=Math.sin(a)*280*dt}if(d<19){this.orbs.splice(i,1);this.burst(o.x,o.y,'#a6e483',7,65);this.gain(o.value,o.id);if(!this.machine.active)break}}if(this.orbs.length>220){let o=this.orbs.shift();this.orbs[0].value+=o.value}
 for(let i=0;i<this.enemies.length;i++)for(let j=i+1;j<this.enemies.length;j++){let a=this.enemies[i],b=this.enemies[j],d=dist(a,b),over=a.r+b.r-d;if(over>0&&d>0){let nx=(a.x-b.x)/d,ny=(a.y-b.y)/d;a.x+=nx*over*.2;b.x-=nx*over*.2;a.y+=ny*over*.2;b.y-=ny*over*.2}}
 this.hudClock+=dt;if(this.hudClock>.07){this.hudClock=0;this.hud()}}
 effects(dt){for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}for(const n of this.numbers){n.y-=35*dt;n.life-=dt}for(const t of this.trails)t.life-=dt;this.particles=this.particles.filter(p=>p.life>0);this.numbers=this.numbers.filter(n=>n.life>0);this.trails=this.trails.filter(t=>t.life>0)}
 hud(){const p=this.player;$('hpText').textContent=`${Math.ceil(p.hp)} / ${p.maxHp}`;$('hp').style.width=p.hp/p.maxHp*100+'%';$('stats').textContent=`击杀 ${this.kills} · Lv.${this.level}`;$('stage').textContent=this.bossStarted?'03 / 裂地守卫':this.time<30?'01 / 初入荒地':'02 / 怪物围攻';$('time').textContent=`${Math.floor(this.time/60)}:${String(Math.floor(this.time%60)).padStart(2,'0')} · ${this.bossStarted?'移动躲避弹幕':Math.ceil(100-this.time)+'秒后守卫降临'}`;$('level').textContent=`Lv.${this.level} · FOOD SUPPLY ${this.xp}/${this.need} · 护盾 ${this.shield} · 攻击 ${Math.round(p.damage)} / ${(1/p.interval).toFixed(1)}发/秒`;$('xp').style.width=Math.min(100,this.xp/this.need*100)+'%';$('dash').style.width=(1-p.dashCd/(p.dashMax||2.5))*100+'%';$('dashText').textContent=p.dashCd>0?`冲刺 ${p.dashCd.toFixed(1)}s`:'冲刺 READY';$('combo').textContent=this.comboTime>0&&this.combo>1?`${this.combo} COMBO`:'';$('bossHud').style.display=this.bossStarted?'block':'none';if(this.boss)$('bossHp').style.width=Math.max(0,this.boss.hp/this.boss.maxHp*100)+'%';if(typeof refreshVisualHUD==='function')refreshVisualHUD(this);$('tutorial').style.display=this.machine.active&&this.tutorial.enabled?'block':'none';document.body.dataset.guide=this.tutorial.enabled?String(this.tutorialStep):'';document.body.dataset.low=p.hp/p.maxHp<.3?'true':'false';$('tip').textContent=TUTORIAL_TIPS[Math.min(4,this.tutorialStep)]}
}
const game=new Game();
let view={scale:1,x:0,y:0,width:W,height:H};
const touchScreen=matchMedia('(pointer: coarse)');
const phonePortrait=matchMedia('(pointer: coarse) and (orientation: portrait)');
let forcedLandscape=false;
function resize(){
 const rotated=phonePortrait.matches;
 if(rotated!==forcedLandscape){
  forcedLandscape=rotated;
  document.documentElement.toggleAttribute('data-forced-landscape',rotated);
  resetControls();
 }
 const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
 const oldWidth=W,oldHeight=H;
 H=touchScreen.matches?520:720;
 W=touchScreen.matches?Math.max(1,Math.round(H*w/h)):1100;
 const dpr=Math.min(devicePixelRatio||1,2),scale=Math.min(w/W,h/H);
 canvas.width=w*dpr;canvas.height=h*dpr;
 view={width:w,height:h,dpr,scale,x:(w-W*scale)/2,y:(h-H*scale)/2};
 if(W===oldWidth&&H===oldHeight)return;
 const sx=W/oldWidth,sy=H/oldHeight;
 for(const e of [game.player,...game.enemies,...game.orbs,...game.bullets,...(game.hazards||[])]){
  e.x*=sx;
  e.y*=sy;
 }
 game.player.x=clamp(game.player.x,35,W-35);
 game.player.y=clamp(game.player.y,90,H-55);
}
function box(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
let last=0;function frame(t){const dt=Math.min((t-last)/1000||0,.04);last=t;game.uiUpdate(dt);game.update(dt);if(typeof draw==='function')draw();requestAnimationFrame(frame)}
function canvasPoint(e){
 const bounds=canvas.getBoundingClientRect();
 return forcedLandscape
  ?{x:e.clientY-bounds.top,y:bounds.right-e.clientX}
  :{x:e.clientX-bounds.left,y:e.clientY-bounds.top};
}
function point(e){
 const {x,y}=canvasPoint(e);
 input.mx=(x-view.x)/view.scale;
 input.my=(y-view.y)/view.scale;
}
canvas.addEventListener('pointermove',point);
canvas.addEventListener('pointerdown',e=>{
 if(e.button!==0||!game.machine.active)return;
 point(e);
 input.fire=true;
 canvas.setPointerCapture(e.pointerId);
});
function stopMouseShot(){input.fire=false}
canvas.addEventListener('pointerup',stopMouseShot);
canvas.addEventListener('pointercancel',stopMouseShot);
canvas.addEventListener('lostpointercapture',stopMouseShot);

const movementKeys=new Set(['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright']);
const physicalMovement={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d'};
function controlKey(event){return physicalMovement[event.code]||event.key.toLowerCase()}
window.addEventListener('keydown',event=>{
 const key=controlKey(event);
 if(key==='escape'){
  if(event.repeat)return;
  if(game.dialogue.done)game.dialogue.finish();
  else if(game.state===STATES.LEVEL_UP)closeUpgrade();
  else game.pause();
  return;
 }
 if(!game.machine.active||event.target.closest?.('input,textarea,select,[contenteditable]'))return;
 if(movementKeys.has(key)){
  event.preventDefault();
  input.keys.add(key);
  return;
 }
 if(key===' ')event.preventDefault();
 if(event.repeat)return;
 if(key===' ')game.dash();
 if(key==='c')game.openCraft();
 if(key==='u')game.levelup();
 if(key==='m'){audio.muted=!audio.muted;syncAudio()}
});
window.addEventListener('keyup',event=>input.keys.delete(controlKey(event)));
function pauseWhenInactive(){
 resetControls();
 if(game.machine.active)game.pause();
}
window.addEventListener('blur',pauseWhenInactive);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseWhenInactive()});
function syncAudio(){$('sfx').textContent='音效 '+(audio.sfx&&!audio.muted?'开':'关');$('music').textContent='音乐 '+(audio.music&&!audio.muted?'开':'关')}
$('sfx').onclick=()=>{if(audio.muted){audio.muted=false;audio.sfx=true}else audio.sfx=!audio.sfx;syncAudio()};$('music').onclick=()=>{if(audio.muted){audio.muted=false;audio.music=true}else audio.music=!audio.music;syncAudio()};$('pause').onclick=()=>game.pause();$('skip').onclick=()=>game.skipTutorial();$('overlay').onclick=e=>{const el=e.target.closest('button');if(!el)return;if(el.hasAttribute('data-next-round'))game.nextRound();if(el.hasAttribute('data-next'))game.dialogue.next();if(el.hasAttribute('data-skip-dialogue'))game.dialogue.finish();if(el.hasAttribute('data-restart'))game.start(false);if(el.hasAttribute('data-resume'))game.pause();if(el.dataset.choice!==undefined)game.choose(+el.dataset.choice)};

let stickId=null,fireId=null,stickOrigin=null;
const stick=$('stick'),fireButton=$('fire');
function stickMove(event){
 if(event.pointerId!==stickId)return;
 const sx=event.clientX-stickOrigin.x,sy=event.clientY-stickOrigin.y;
 const x=forcedLandscape?sy:sx,y=forcedLandscape?-sx:sy;
 const radius=stickOrigin.radius,distance=Math.hypot(x,y);
 const scale=distance<2?0:Math.min(1,radius/distance);
 input.jx=x*scale/radius;
 input.jy=y*scale/radius;
 $('knob').style.transform=`translate(${x*scale}px,${y*scale}px)`;
}
function releaseStick(event){
 if(event&&event.pointerId!==stickId)return;
 const id=stickId;
 stickId=null;
 stickOrigin=null;
 input.jx=input.jy=0;
 $('knob').style.transform='';
 if(id!==null&&stick.hasPointerCapture(id))stick.releasePointerCapture(id);
}
function releaseFire(event){
 if(event&&event.pointerId!==fireId)return;
 const id=fireId;
 fireId=null;
 fireButton.classList.remove('is-pressed');
 input.touchFire=false;
 if(id!==null&&fireButton.hasPointerCapture(id))fireButton.releasePointerCapture(id);
}
function resetControls(){
 input.keys.clear();
 input.fire=false;
 input.touchShotQueued=false;
 releaseStick();
 releaseFire();
}
stick.onpointerdown=event=>{
 if(!game.machine.active||stickId!==null)return;
 event.preventDefault();
 stickId=event.pointerId;
 const bounds=stick.getBoundingClientRect();
 stickOrigin={x:bounds.left+bounds.width/2,y:bounds.top+bounds.height/2,radius:stick.clientWidth*.31};
 stick.setPointerCapture(stickId);
 stickMove(event);
};
stick.onpointermove=stickMove;
stick.onpointerup=stick.onpointercancel=stick.onlostpointercapture=releaseStick;
fireButton.onpointerdown=event=>{
 if(!game.machine.active||fireId!==null)return;
 event.preventDefault();
 fireId=event.pointerId;
 input.touchShotQueued=true;
 input.touchFire=true;
 fireButton.classList.add('is-pressed');
 fireButton.setPointerCapture(fireId);
};
fireButton.onpointerup=fireButton.onpointercancel=fireButton.onlostpointercapture=releaseFire;
$('dashButton').onpointerdown=event=>{event.preventDefault();game.dash()};
window.addEventListener('resize',resize);
 for(const query of [touchScreen,phonePortrait]){
  if(query.addEventListener)query.addEventListener('change',resize);
  else query.addListener(resize);
 }
resize();
game.hud();
