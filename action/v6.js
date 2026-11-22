// V6: bounded growth, deterministic pantry, chapter shields, charged bow.
const V6={interval:.62,minInterval:.62/1.4,hp:156,damage:48};
function capBuild(g){const p=g.player;p.interval=Math.max(V6.minInterval,p.interval);p.maxHp=Math.min(156,p.maxHp);p.hp=Math.min(p.hp,p.maxHp);p.damage=Math.min(48,p.damage);p.pickup=Math.min(180,p.pickup);p.pierce=Math.min(2,p.pierce);p.dashMax=Math.max(1.5,p.dashMax||2.5);g.shield=Math.min(50,g.shield);}
const start6=Game.prototype.start;
Game.prototype.start=function(t){start6.call(this,t);this.player.interval=.62;this.player.damage=30;this.need=65;this.chapterMeals={};this.lessonQueue=[];this.noticeSeconds=0;this.mealPrepared=false;this.shieldLessonPending=false;this.hintAt=null;this.hazardClock=0;this.shieldTime=0;this.pantryUsed={};this.pantryClock=0;this.hunger=20;this.breadDrops=0;this.hazards=[];};
const choose6=Game.prototype.choose;Game.prototype.choose=function(i){choose6.call(this,i);capBuild(this)};
const craft6=Game.prototype.craft;
Game.prototype.craft=function(){const groups=new Set(this.craftSlots.map(id=>GROUP_IDS[id]));if(this.round===3&&groups.size<5){$('craftResult').textContent='末地任务配方：加入五类补给，才能激活龙盾窗口。';return false}const ok=craft6.call(this);if(ok){if(this.delivery)this.deliveryMeal=groups.has('fruit');else this.chapterMeals[this.round]=true;this.plateWindow=this.round===3?22:28;this.mealPrepared=!this.bossStarted&&!this.delivery;this.hunger=20;this.buffTime=0;this.shieldTime=20;capBuild(this);audio.play('shieldBreak');this.showMealFeedback?.();}return ok};
const hit6=Game.prototype.hit;Game.prototype.hit=function(e,b){if(e===this.boss){if(!this.chapterMeals?.[this.round]||this.plateWindow<=0){if((this.hintAt??-10)+6<this.time){this.hintAt=this.time;this.shieldLessonPending=true;}return}b={...b,damage:Math.min(96,b.damage)};e.kx=e.ky=0;}hit6.call(this,e,b)};
const boss6=Game.prototype.bossStart;Game.prototype.bossStart=function(){boss6.call(this);const hp=[1800,2400,3200][this.round-1];Object.assign(this.boss,{hp,maxHp:hp,tier:1});this.pantryClock=0;this.plateWindow=this.mealPrepared?(this.round===3?22:28):0;this.mealPrepared=false;audio.play('boss');};
const bossUpdate6=Game.prototype.updateBoss;
Game.prototype.updateBoss=function(e,dt,a){const tier=e.hp/e.maxHp<.3?3:e.hp/e.maxHp<.65?2:1;if(tier!==e.tier){e.tier=tier;audio.play('phase');this.notify('阶段 '+tier+' · '+['','守卫苏醒','召唤与追猎','狂暴！注意预警'][tier]);}bossUpdate6.call(this,e,dt,a);if(e.wind>0&&e.wind<=dt&&tier>=2){for(let j=0;j<Math.min(3,tier);j++){const enemy=new Enemy(this.round===1?'normal':this.round===2?'fast':'heavy',clamp(e.x+90*(j-1),50,W-50),clamp(e.y+90,100,H-65));enemy.art=ENEMY_ART[this.round-1][j%ENEMY_ART[this.round-1].length];this.enemies.push(enemy)}}if(tier===3)e.attack-=dt*.25;this.hazardClock=(this.hazardClock||0)+dt;if(this.hazardClock>6){this.hazardClock=0;this.hazards.push({x:this.player.x,y:this.player.y,r:this.round===1?65:this.round===2?90:110,life:1.6});}};
Game.prototype.pantry=function(){if(this.pantryClock>0)return;const ids=['potato','carrot','fish','apple','milk'];let added=0;for(const id of ids){const group=GROUP_IDS[id];if(!Object.entries(this.inventory).some(([f,n])=>GROUP_IDS[f]===group&&n>0)){this.collectFood(id);added++}}if(added)this.pantryClock=25;this.renderCraft();$('craftResult').textContent=added?'已领取缺项食材。':'储备齐全，可以开始搭配。';};
const update6=Game.prototype.update;
Game.prototype.update=function(dt){
 if(!this.machine.active){update6.call(this,dt);return}
 this.pantryClock=Math.max(0,this.pantryClock-dt);
 this.hunger=Math.max(0,this.hunger-dt*.025);
 this.shieldTime=Math.max(0,(this.shieldTime||0)-dt);
 if(!this.shieldTime)this.shield=0;
 const p=this.player;
 const mouseHeld=input.fire,touchHeld=input.touchFire;
 input.touchFire=touchHeld||input.touchShotQueued;
 input.touchShotQueued=false;
 if(input.touchFire){
  p.charge=Math.max(0,p.interval-p.shot);
 }else{
  p.charge=mouseHeld?(p.charge||0)+dt:0;
  input.fire=p.charge>=p.interval;
  if(input.fire){p.charge=0;p.shot=0}
 }
 update6.call(this,dt);
 input.fire=this.machine.active&&mouseHeld;
 input.touchFire=this.machine.active&&touchHeld;
 for(const h of this.hazards){
  h.life-=dt;
  if(h.life<=0&&dist(h,p)<h.r+p.r)this.hurt(22,h.x,h.y);
 }
 this.hazards=this.hazards.filter(h=>h.life>0);
 capBuild(this);
};
const draw6=draw;draw=function(){draw6();if(!game.hazards?.length)return;ctx.save();ctx.setTransform(view.dpr,0,0,view.dpr,0,0);ctx.translate(view.x,view.y);ctx.scale(view.scale,view.scale);for(const h of game.hazards){ctx.strokeStyle='#ff6633';ctx.lineWidth=4;ctx.fillStyle='#ff442233';ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.font='20px monospace';ctx.fillText('⚠ '+h.life.toFixed(1),h.x-25,h.y);}ctx.restore();};
AudioEngine.prototype.noise=function(d,v,bus='sfx'){if(!this.ctx||this.muted||(bus==='music'?!this.music:!this.sfx)||this.nodes.size>=36)return;try{const c=this.ctx,b=c.createBuffer(1,Math.ceil(c.sampleRate*d),c.sampleRate),data=b.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length)**2;const src=c.createBufferSource(),g=c.createGain();src.buffer=b;g.gain.value=v;src.connect(g);g.connect(bus==='music'?this.musicBus:this.sfxBus);src.start();src.onended=()=>{src.disconnect();g.disconnect()}}catch{}};
const sound6=audio.play.bind(audio);audio.play=function(name){if(name==='bowRelease'||name==='shot'){if(this.now-(this.limits.get('bow6')??-10)<.12)return;this.limits.set('bow6',this.now);this.noise(.08,.1);this.tone(380,.12,'triangle',.13,.3);return}if(['insert','shieldBreak','phase'].includes(name)){if(this.now-(this.limits.get(name)??-10)<.15)return;this.limits.set(name,this.now);this.note(name==='insert'?62:40,.3,'triangle',.18);this.note(name==='phase'?52:79,.35,'square',.05);return}sound6(name)};

