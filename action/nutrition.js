// Extends V4 combat without replacing movement, collision, director or audio.
const v5Start=Game.prototype.start;
Game.prototype.start=function(t=true){this.meals=[];this.seenGroups=new Set();this.plateWindow=0;this.delivery=false;this.villageDone=false;this.supplyClock=0;v5Start.call(this,t);this.player.damage=18;this.player.pickup=105;};
Game.prototype.collectFood=function(id){const first=!this.seenGroups?.has(GROUP_IDS[id]);this.inventory[id]=(this.inventory[id]||0)+1;this.unlockFood(id);this.seenGroups??=new Set();this.seenGroups.add(GROUP_IDS[id]);this.player.hp=Math.min(this.player.maxHp,this.player.hp+2);if(first){audio.play('up');this.queueFoodLesson?.(GROUP_IDS[id])}this.hud();};
Game.prototype.craft=function(){const ids=[...this.craftSlots],groups=new Set(ids.map(id=>GROUP_IDS[id]));const r=[...PLATE_RECIPES].reverse().find(r=>r.groups.every(k=>groups.has(k)));if(!r||!ids.every(id=>this.inventory[id]>0)){$('craftResult').textContent='Alex：可以继续探索；补上主食、蔬菜与蛋白质食品，就能启动基础连携。';return false}ids.forEach(id=>this.inventory[id]--);this.crafted.add(r.id);this.lastMeal=ids;this.meals.push({name:r.name,foods:ids});this.buffTime=20;this.shield=Math.min(120,this.shield+20+(groups.size-3)*15);this.player.hp=Math.min(this.player.maxHp,this.player.hp+25+(groups.size-3)*10);if(groups.size>=4)this.plateWindow=groups.size===5?25:18;this.craftSlots=[];this.renderCraft();$('craftResult').innerHTML=`<div class="craft-flight">${ids.map(id=>assets.html(id)).join('')}</div><b>${r.name} · 餐盘已成形！</b><br>Alex：${r.reward}。多样来自长期的食物选择。`;audio.play('craft');audio.note(84,.5,'sine',.2);this.burst(this.player.x,this.player.y,'#aaffb0',70,250);this.hud();return true;};
const v5Update=Game.prototype.update;
Game.prototype.update=function(dt){if(this.machine.active){this.plateWindow=Math.max(0,(this.plateWindow||0)-dt);}v5Update.call(this,dt);};
const v5Next=Game.prototype.nextRound;
Game.prototype.nextRound=function(){if(this.round===2&&!this.villageDone){this.villageDone=true;this.delivery=true;this.deliveryMeal=false;['bread','carrot','fish','chicken','apple','milk'].forEach(id=>this.collectFood(id));this.craftResume=STATES.STAGE_TRANSITION;this.craftSlots=[];this.renderCraft();return}this.delivery=false;v5Next.call(this);};
const v5Close=Game.prototype.closeCraft;
Game.prototype.closeCraft=function(){if(this.delivery){if(!this.deliveryMeal){$('craftResult').textContent='Alex：试着在基础套餐中增加水果，带一份多样餐盘进入末地。';return}this.delivery=false;this.craftResume=null;this.nextRound();return}v5Close.call(this);};
const v5End=Game.prototype.end;
Game.prototype.end=function(win){if(!this.machine.active)return;this.storyOutcome=win?'victory':'defeat';v5End.call(this,win);const summary=`<p>收集类别：${[...(this.seenGroups||[])].map(k=>FOOD_GROUPS.find(g=>g[0]===k)?.[1]).filter(Boolean).join('、')}<br>餐盘组合：${(this.meals||[]).map(m=>m.name+'（'+m.foods.map(id=>FOOD_KNOWLEDGE[id].name).join('、')+'）').join('；')||'尚未搭配'}<br>知识解锁：${this.unlocked.size}</p>`;const add=()=>{
 const panel=$('overlay').querySelector('.panel');
 if(!panel)return;
 panel.classList.add('results-panel');
 panel.querySelector('[data-guide]').insertAdjacentHTML('beforebegin',knowledgeCard('多样搭配','没有哪一种食物能解决所有问题。','主食、蔬菜水果和蛋白质来源可以在不同餐次互相补充。','apple')+summary);
 const actions=document.createElement('div');
 actions.className='panel-actions';
 actions.append(panel.querySelector('[data-guide]'),panel.querySelector('[data-restart]'));
 panel.append(actions);
};if(win){const done=this.dialogue.done;this.dialogue.done=()=>{done?.();add()}}else add();};
// Distinct original synthesized event cues.
const v5Sfx=audio.play.bind(audio);audio.play=function(name){v5Sfx(name);if(name==='craft'){this.note(72,.18,'triangle',.12);this.note(79,.35,'sine',.1)}if(name==='up')this.note(91,.14,'sine',.08);};
