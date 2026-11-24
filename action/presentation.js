const GROUP_LESSONS={
 staple:{title:'谷薯主食',text:'米饭、面包和薯类都可以提供能量。',advice:'主食可以换着吃，也可以搭配全谷物。'},
 vegetable:{title:'蔬菜',text:'不同颜色的蔬菜，提供的营养各有侧重。',advice:'点餐时加一份蔬菜，平时换换种类。'},
 fruit:{title:'蔬菜水果 · 水果',text:'完整水果还含有膳食纤维。',advice:'想吃水果时，可以选一份完整水果。'},
 protein:{title:'蛋白质',text:'鱼、禽、肉、蛋和豆类都可以提供蛋白质。',advice:'这几类食物可以轮换着吃。'},
 dairy:{title:'奶类补给',text:'奶类是日常膳食中的钙来源之一。',advice:'可以按个人情况选奶或无糖酸奶。'}
};
const groupCount=(game,group)=>Object.entries(game.inventory)
 .reduce((sum,[id,quantity])=>sum+(GROUP_IDS[id]===group?quantity:0),0);
const groupName=group=>FOOD_GROUPS.find(([id])=>id===group)?.[1]||'其他食物';

function enableMenuMusic(){
 const status=$('audioStatus');
 if(!audio.start()){
  if(status)status.textContent='当前浏览器无法播放背景音乐。';
  return;
 }
 audio.music=true;
 audio.muted=false;
 syncAudio();
 if(status)audio.ctx.resume().then(()=>{
  status.textContent=audio.ctx.state==='running'?'背景音乐已开启':'请再点一次播放背景音乐';
 }).catch(()=>{status.textContent='请再点一次播放背景音乐'});
}

function refreshVisualHUD(g){
 document.body.dataset.scene=g.state;
 document.body.dataset.active=String(g.machine.active);
 $('upgrade').hidden=g.xp<g.need;
 document.body.dataset.chapter=String(g.round);
 const p=g.player;
 $('stage').textContent=['主世界','下界','末地'][g.round-1]+' · 第 '+g.round+' 章';
 const elapsed=g.time-g.roundStart;
 const timeLeft=Math.max(0,Math.ceil(LEVELS[g.round-1].wave-elapsed));
 $('time').textContent=g.bossStarted?'首领战':'首领将在 '+timeLeft+' 秒后到来';
 $('level').textContent='等级 '+g.level+' · 经验 '+g.xp+'/'+g.need+(g.shield?' · 护盾 '+g.shield:'');
 $('bossName').textContent=g.bossStarted
  ?LEVELS[g.round-1].boss+' · '+(g.boss?.tier||1)+' 阶段 · '+(g.plateWindow>0?Math.ceil(g.plateWindow)+' 秒可攻击':'护盾中，需搭配餐盘')
  :'';
 const hunger=Math.ceil(g.hunger??20);
 $('hungerText').textContent='饥饿值 '+hunger+' / 20';
 const vitalKey=[Math.ceil(p.hp/p.maxHp*10),Math.ceil(hunger/2)].join('/');
 if(g.hudVitals!==vitalKey){
  g.hudVitals=vitalKey;
  $('hearts').innerHTML=Array.from({length:10},(_,i)=>'<img src="assets/minecraft/heartMC.png" alt="" class="'+(p.hp/p.maxHp*10>i?'':'empty')+'">').join('');
  $('hunger6').innerHTML=Array.from({length:10},(_,i)=>'<img src="assets/minecraft/hunger.png" alt="" class="'+(hunger/2>i?'':'empty')+'">').join('');
 }
 const counts=FOOD_GROUPS.map(([id])=>groupCount(g,id));
 const plate=g.mealPrepared?'餐盘已备好':g.plateWindow>0?'餐盘已激活':'搭配餐盘';
 const stockKey=[...counts,plate].join('/');
 if(g.hudStock!==stockKey){
  g.hudStock=stockKey;
  document.querySelector('.hotbar').innerHTML=FOOD_GROUPS.map(([id,name,icon],i)=>
   `<span class="stock-slot ${counts[i]?'stocked':''}" title="${name} ${counts[i]}" aria-label="${name} ${counts[i]}">${assets.html(icon)}<b>${counts[i]}</b></span>`
  ).join('');
  $('plateStatus').textContent=plate;
 }
}

Game.prototype.queueFoodLesson=function(group){
 if(GROUP_LESSONS[group])this.lessonQueue.push(GROUP_LESSONS[group]);
};
Game.prototype.warnBoss=function(){
 this.bus.emit('BOSS_WARNING');
 const recipe=this.round===3?'主食、蔬菜、蛋白质食品、水果和奶类':'主食、蔬菜和蛋白质食品';
 if(this.round===2){
  this.notify('首领即将出现。艾莉丝：提前用'+recipe+'搭餐盘，登场时就能破盾。',5);
  return;
 }
 this.dialogue.openLines([{
  speaker:'Alex（艾莉丝）',face:'alex',brief:true,
  title:this.round===3?'末影龙：五类补给破盾':'首个首领：配餐破盾',
  text:'打开工作台，用'+recipe+'搭成餐盘。缺食材可以领补给。',
  advice:'现在备好，首领登场时就能破盾。'
 }],STATES.DIALOGUE,()=>this.transition(this.combatState()));
};
Game.prototype.showMealFeedback=function(){
 const result=$('craftResult');
 result.classList.add('meal-highlight');
 result.innerHTML='<strong>餐盘完成</strong><span>'+(this.delivery?'已配好外卖补给。':this.mealPrepared?'首领登场时自动破盾。':'已开启 '+this.plateWindow+' 秒破盾窗口。')+'</span><small>艾莉丝：点外卖时，也可以从主食、蔬菜和蛋白质来源搭起。</small>';
 if(this.bossStarted&&!this.delivery)this.notify('餐盘已激活。趁护盾打开，边走边攻击。');
};
const activeUpdate=Game.prototype.update;
Game.prototype.update=function(dt){
 activeUpdate.call(this,dt);
 if(!this.machine.active)return;
 // Upgrade after the combat step so it cannot interrupt a hit or replace a Boss guide.
 if(this.xp>=this.need&&this.upgradePromptedLevel!==this.level){
  this.levelup();
  if(!this.machine.active)return;
 }
 this.noticeSeconds=Math.max(0,this.noticeSeconds-dt);
 if(this.shieldLessonPending){
  this.shieldLessonPending=false;
  this.notify('护盾挡住了箭。艾莉丝：打开工作台搭配餐盘，缺食材就领补给。',4);
 }else if(this.time>8&&this.toastTime<=0&&this.noticeSeconds===0&&this.lessonQueue.length){
  this.noticeSeconds=10;
  const lesson=this.lessonQueue.shift();
  this.notify('艾莉丝 · '+lesson.title+'｜'+lesson.text,4);
 }
};

const basicGroups=['staple','vegetable','protein'];
Game.prototype.requiredGroups=function(){
 return this.delivery?[...basicGroups,'fruit']:this.round===3?[...basicGroups,'fruit','dairy']:basicGroups;
};
Game.prototype.addIngredient=function(id){
 if(!this.inventory[id]||!GROUP_IDS[id])return;
 const slot=this.craftSlots.findIndex(f=>GROUP_IDS[f]===GROUP_IDS[id]);
 if(slot>=0)this.craftSlots[slot]=id;
 else this.craftSlots.push(id);
 audio.play('insert');
 this.renderCraft();
};
Game.prototype.renderCraft=function(){
 const overlay=$('overlay');
 const scroll=overlay.querySelector('.craft-body')?.scrollTop||0;
 const selected=this.craftSlots;
 const required=this.requiredGroups();
 const missing=required.filter(id=>!groupCount(this,id));
 const placed=required.every(id=>selected.some(f=>GROUP_IDS[f]===id));
 const slots=Array.from({length:9},(_,i)=>{
  const id=selected[i];
  return `<button class="mc-slot" data-remove-food="${i}" aria-label="${id?'移除'+FOOD_KNOWLEDGE[id].name:'空格'}" ${id?'':'disabled'}>${id?assets.html(id):''}</button>`;
 }).join('');
 const inventory=Object.entries(this.inventory).filter(([id,n])=>n>0&&GROUP_LESSONS[GROUP_IDS[id]]).map(([id,n])=>
  `<button data-add-food="${id}" class="ingredient" ${selected.includes(id)?'disabled':''}>${assets.html(id)}<b>${FOOD_KNOWLEDGE[id].name}</b><span>×${n}</span></button>`
 ).join('');
 const cooldown=Math.ceil(this.pantryClock);
 overlay.innerHTML=`<div class="panel crafting">
  <h2>${this.delivery?'村庄外卖补给站':'工作台 · 餐盘合成'}</h2>
  <div class="craft-body">
   <div class="craft-setup">
   <p class="recipe-goal"><strong>本章配方</strong> ${required.map(id=>'<mark>'+groupName(id)+'</mark>').join(' + ')}</p>
   <div class="craft-layout"><div class="grid-nine">${slots}</div><b class="craft-arrow" aria-hidden="true">➜</b>
   <button class="mc-slot result-slot" data-make-meal aria-label="合成餐盘" ${placed?'':'disabled'}>${placed?assets.html('soup'):''}</button></div>
   <p class="craft-instruction">${this.delivery?'艾莉丝：给外卖加份蔬菜和水果，再搭主食和蛋白质食品。':'艾莉丝：每类点一份。点合成格能取回，点同类食物可以替换。'}</p>
   </div>
   <div class="craft-stock">
   <div class="food-grid">${inventory||'<p>库存为空，先领取补给箱。</p>'}</div>
   ${missing.length?`<div class="alex-bubble"><b>Alex</b> 缺少 <strong>${missing.map(groupName).join('、')}</strong>。<button data-pantry ${cooldown?'disabled':''}>${cooldown?'战斗中再等 '+cooldown+' 秒':'领取缺项'}</button></div>`:''}
   <p id="craftResult" role="status"></p>
   <details><summary>配方说明</summary><p>餐盘补充生命并提供限时护盾。每章配方是游戏任务。现实中可以把不同食物安排在一天的不同餐次。</p></details>
   </div>
  </div>
  <div class="panel-actions"><button class="primary" data-make-meal ${placed?'':'disabled'}>完成餐盘</button><button data-close-craft>${this.delivery?'前往末地':'返回战斗'}</button></div>
 </div>`;
 overlay.querySelector('.craft-body').scrollTop=scroll;
};
const craftMeal=Game.prototype.craft;
Game.prototype.craft=function(){
 if(!this.requiredGroups().every(id=>this.craftSlots.some(f=>GROUP_IDS[f]===id)))return false;
 return craftMeal.call(this);
};

function knowledgeCard(title,text,advice,icon){
 return `<article class="knowledge-card"><h3>${icon?assets.html(icon):''}<mark>${title}</mark></h3><p>${text}</p><p class="knowledge-advice">${advice}</p></article>`;
}
function showCodex(){
 const overlay=$('overlay');
 if(game.codexReturn)return;
 const state=game.state;
 const active=game.machine.active;
 const previous=overlay.innerHTML;
 game.codexReturn=()=>{
  game.codexReturn=null;
  if(active){game.transition(state);overlay.innerHTML=''}
  else if(state===STATES.TITLE)showTitle();
  else overlay.innerHTML=previous;
 };
 if(active)game.transition(STATES.PAUSED);
 overlay.innerHTML=`<div class="panel guide"><h2>食品图鉴</h2>
  <div class="codex-body"><div class="codex-grid">${FOOD_GROUPS.map(([id,,icon])=>{
   const entry=GROUP_LESSONS[id];
   return knowledgeCard(entry.title,entry.text,entry.advice,icon);
  }).join('')}</div><details><summary>查看各食材与战斗效果</summary><div class="codex-grid">${Object.values(FOOD_KNOWLEDGE).map(f=>
   knowledgeCard(f.name,f.knowledge,f.advice,f.id).replace('</article>','<p class="game-effect">游戏效果：'+f.gameEffect+'</p></article>')
  ).join('')}</div></details></div>
  <div class="panel-actions"><button data-codex-back>返回</button></div></div>`;
}
$('overlay').addEventListener('click',e=>{
 if(e.target.closest('[data-codex-back]'))game.codexReturn?.();
});
const pauseFromHUD=game.pause.bind(game);
game.pause=function(){
 if(this.codexReturn){this.codexReturn();return}
 pauseFromHUD();
};

const plateButton=document.createElement('button');
plateButton.id='plateStatus';
plateButton.onclick=()=>game.openCraft();
document.querySelector('.inventory-row').insertBefore(plateButton,document.querySelector('.progress'));
const codexButton=document.createElement('button');
codexButton.id='codexQuick';
codexButton.textContent='图鉴';
codexButton.onclick=showCodex;
document.querySelector('.tools').prepend(codexButton);
new ResizeObserver(()=>resize()).observe(canvas);
showTitle();
game.hud();
