// Small shared framework. Classic scripts preserve direct file:// launch.
const STATES=Object.freeze({TITLE:'title',INTRO:'intro',TUTORIAL:'tutorial',PLAYING:'playing',DIALOGUE:'dialogue',LEVEL_UP:'levelup',STAGE_TRANSITION:'stage_transition',BOSS_WARNING:'boss_warning',BOSS_FIGHT:'boss_fight',PAUSED:'paused',VICTORY:'victory',DEFEAT:'defeat'});
const ACTIVE_STATES=new Set([STATES.TUTORIAL,STATES.PLAYING,STATES.BOSS_FIGHT]);
class EventBus{
 constructor(){this.listeners=new Map()}
 on(name,fn){if(!this.listeners.has(name))this.listeners.set(name,new Set());this.listeners.get(name).add(fn);return()=>this.listeners.get(name)?.delete(fn)}
 emit(name,data){for(const fn of this.listeners.get(name)||[])fn(data)}
}
class GameStateManager{
 constructor(bus){this.current=STATES.TITLE;this.bus=bus}
 set(next){if(!Object.values(STATES).includes(next))throw Error('Unknown state '+next);const from=this.current;if(from===next)return;this.current=next;this.bus.emit('STATE_CHANGED',{from,to:next})}
 get active(){return ACTIVE_STATES.has(this.current)}
}
const TUTORIAL_TIPS=[
 '艾莉丝：按 WASD、方向键或拖动摇杆，先走几步。',
 '艾莉丝：拉弓时也能走。电脑按住左键，手机点按或按住「攻击」。',
 '艾莉丝：被堵住时按空格或「冲刺」，从空隙穿过去。',
 '艾莉丝：靠近就能捡食材。打开工作台可领补给并搭餐盘。'
];
const STORY={
 intro:[
  {speaker:'你 · 大学生',scene:'campus',face:'student',title:'早八之后，实验室',text:'早上赶课没顾上吃饭，中午匆匆点了外卖。实验课快结束时，你感到不适，只好坐下来休息。'},
  {speaker:'你 · Steve',scene:'overworld',face:'steve',title:'进入方块世界',text:'再睁眼，你站在方块村庄里。低头一看，蓝色上衣、方方的手臂……你变成了 Steve。'},
  {speaker:'Alex（艾莉丝）',scene:'overworld',face:'alex',title:'在村庄站稳脚跟',text:'跟着底栏练移动、拉弓和冲刺。击败小怪有机会捡到食材，别急着追，安全了再去拾取。'},{speaker:'Alex（艾莉丝）',scene:'overworld',face:'alex',title:'先备一份餐盘',text:'点工作台，放进主食、蔬菜和鱼禽肉蛋豆中的一种。缺什么就领什么，首领来之前配好就能先抢到破盾机会。',advice:'比如米饭、青菜和豆腐，可以组成一份午饭。'}
 ],
 ending:[
  {speaker:'Alex（艾莉丝）',scene:'end',face:'alex',title:'多样搭配',text:'没有哪一种食物能解决所有问题。',advice:'让主食、蔬菜水果和蛋白质来源轮换搭配，看长期整体。'},
  {speaker:'同学 · 实验搭档',scene:'campus',face:'classmate',title:'回到实验室',text:'你醒啦？实验记完了。我收好记录本，咱们一起去食堂。'},
  {speaker:'你 · 大学生',scene:'campus',face:'student',title:'一起吃饭',text:'好！我想点米饭、青菜和豆腐，再带个水果。下次早八也给自己留出吃早餐的时间。'}
 ],
 victory:'你击败了末影龙，回到实验室。',defeat:'Alex：保持移动，记得在工作台搭配餐盘。',firstUpgrade:'选择一项战斗强化。食品的现实知识列在下方。'
};

class DialogueManager{
 constructor(game){this.game=game;this.lines=[];this.index=0;this.done=null}
 open(key,state,done){this.openLines(STORY[key],state,done)}
 openLines(lines,state,done){
  this.lines=lines;this.index=0;this.done=done;
  this.game.transition(state);
  this.render();
  audio.play('dialogue');
 }
 render(){
  const line=this.lines[this.index];
  const shelter=line.scene==='campus';
  const art=shelter?'<img class="story-backdrop" src="assets/story/lab.svg" alt="窗边实验台、显微镜和记录本">':'';
  $('overlay').innerHTML=`<div class="dialogue panel" role="dialog" aria-modal="true" aria-labelledby="speaker">
    <div class="story-art scene-${line.scene||'guide'}">
      ${art}<div class="portrait portrait-${line.face}" role="img" aria-label="${line.speaker}"></div>
    </div>
    <div class="dialogue-content">
      <b id="speaker">${line.speaker}</b>
      <h2><mark>${line.title}</mark></h2>
      <p id="dialogueText">${line.text}</p>
      ${line.advice?'<p class="dialogue-advice">'+line.advice+'</p>':''}
      <div class="panel-actions"><button class="primary" data-next>继续 →</button><button data-skip-dialogue>跳过</button></div>
    </div>
  </div>`;
 }
 update(){}
 next(){if(!this.done)return;if(++this.index<this.lines.length)this.render();else this.finish()}
 finish(){if(!this.done)return;const callback=this.done;this.done=null;$('overlay').innerHTML='';callback()}
}
class TutorialManager{
 constructor(enabled=true){this.enabled=enabled;this.move=false;this.attack=false;this.dash=false;this.craft=false}
 get step(){return !this.move?0:!this.attack?1:!this.dash?2:3}
 event(name){
  if(name==='PLAYER_MOVED')this.move=true;
  if(name==='SHOT_FIRED')this.attack=true;
  if(name==='PLAYER_DASHED')this.dash=true;
  if(name==='CRAFT_OPENED')this.craft=true;
  if(this.move&&this.attack&&this.dash&&this.craft)this.skip();
 }
 skip(){this.enabled=false}
}
class SpawnDirector{
 interval(t,round=1){return Math.max(.58,(t<12?1.5:t<25?.95:.7)-(round-1)*.12)}
 stages(game){
  if(game.bossStarted)return;
  const t=game.time-game.roundStart,config=LEVELS[game.round-1];
  if(t>=config.wave){game.bossStart();return}
  const events=[
   [config.wave-5,'boss',()=>{game.stageFlags.add('heavy');game.stageFlags.add('danger');game.warnBoss()}],
   [25,'heavy',()=>game.notify('艾莉丝：'+CHAPTER_KNOWLEDGE[game.round-1][2])],
   [12,'danger',()=>game.notify('艾莉丝：'+CHAPTER_KNOWLEDGE[game.round-1][1])]
  ];
  for(const [time,flag,run] of events){
   if(t>=time&&!game.stageFlags.has(flag)){game.stageFlags.add(flag);run();break}
  }
 }
}
