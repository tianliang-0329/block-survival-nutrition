// Original note scores, synthesized locally. No Minecraft audio or remote files.
const MUSIC_SCORES={
 menu:{bpm:88,wave:'sine',notes:[72,0,76,79,0,76,74,0,69,0,72,76,0,74,72,0,67,0,71,74,0,76,79,0,76,74,72,0,69,67,0,0],bass:[48,45,43,48]},
 meadow:{bpm:118,wave:'triangle',notes:[62,66,69,0,74,69,66,0,64,67,71,0,74,71,67,0,66,69,74,76,74,69,66,0,64,66,69,0,62,0,57,0],bass:[38,43,47,45]},
 forest:{bpm:128,wave:'square',notes:[62,0,65,69,72,69,65,62,60,0,64,67,70,67,64,60,58,62,65,69,65,62,58,0,57,60,64,69,67,64,60,57],bass:[38,36,34,33]},
 end:{bpm:94,wave:'sine',notes:[60,0,67,0,71,74,0,67,59,0,66,0,71,0,0,0],bass:[36,35,40,31]},
 boss:{bpm:144,wave:'square',notes:[50,62,0,65,64,62,57,0,53,65,0,68,67,65,60,0,50,57,62,65,64,60,57,53,49,56,61,64,61,56,52,0],bass:[26,29,26,25]},
 victory:{bpm:112,wave:'triangle',notes:[60,64,67,72,0,67,72,76,0,0,74,72,67,64,60,0],bass:[48,53,55,48],once:true},
 defeat:{bpm:76,wave:'sine',notes:[69,0,65,0,62,0,57,0,0,0,0,0,0,0,0,0],bass:[45,41,38,33],once:true}
};
class AudioEngine{
 constructor(){this.volume=.75;this.musicVolume=.72;this.sfxVolume=.75;this.sfx=true;this.music=true;this.muted=false;this.nodes=new Set();this.limits=new Map();this.now=0;this.musicManager=new MusicManager(this)}
 start(){
  if(!this.ctx){
   const Context=window.AudioContext||window.webkitAudioContext;
   if(!Context)return false;
   try{this.ctx=new Context()}catch{return false}
   this.master=this.ctx.createGain();
   this.musicBus=this.ctx.createGain();
   this.sfxBus=this.ctx.createGain();
   this.musicBus.gain.value=0;
   this.musicBus.connect(this.master);
   this.sfxBus.connect(this.master);
   this.master.connect(this.ctx.destination);
   this.sync();
  }
  if(this.ctx.state!=='running')this.ctx.resume().catch(()=>{});
  return true;
 }
 ramp(param,value,d=.12){
  const t=this.ctx.currentTime;
  const previous=param.value;
  param.cancelScheduledValues(t);
  param.setValueAtTime(previous,t);
  param.linearRampToValueAtTime(value,t+d);
 }
 sync(){
  if(!this.ctx)return;
  this.ramp(this.master.gain,this.muted?0:this.volume);
  this.ramp(this.sfxBus.gain,this.sfx?this.sfxVolume:0);
  this.ramp(this.musicBus.gain,this.music?this.musicVolume*this.musicManager.duck:0,.24);
 }
 setVolume(v){this.volume=Math.max(0,Math.min(1,Number(v)||0));this.sync()}
 note(midi,d=.1,type='square',volume=.2,bus='sfx',slide=1){this.tone(440*2**((midi-69)/12),d,type,volume,slide,bus)}
 tone(f,d=.1,type='square',volume=.2,slide=1,bus='sfx'){if(!this.ctx||this.muted||this.nodes.size>=40||(bus==='music'?!this.music:!this.sfx))return;try{const o=this.ctx.createOscillator(),g=this.ctx.createGain(),t=this.ctx.currentTime;o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f*slide),t+d);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(bus==='music'?this.musicBus:this.sfxBus);o.channel=bus;this.nodes.add(o);o.onended=()=>{this.nodes.delete(o);o.disconnect?.();g.disconnect?.()};o.start(t);o.stop(t+d)}catch{}}
 play(name){const gap={shot:.05,hit:.05,death:.08,xp:.07,hover:.09}[name]||.12;if(this.now-(this.limits.get(name)??-99)<gap)return;this.limits.set(name,this.now);const sounds={hover:[620,.035,'triangle',.07,1.1],craft:[660,.5,'triangle',.22,3],click:[420,.06,'square',.08,1.3],start:[330,.28,'triangle',.22,2],dialogue:[680,.045,'triangle',.08,1.2],shot:[460,.055,'square',.10,.48],hit:[180,.055,'triangle',.17,.55],crit:[1000,.15,'triangle',.19,1.5],death:[140,.15,'triangle',.20,.3],hurt:[105,.22,'sawtooth',.23,.5],dash:[210,.16,'triangle',.22,3],xp:[880,.09,'sine',.15,1.4],up:[440,.34,'triangle',.24,2.5],boss:[85,.6,'sawtooth',.24,1.6],bossAttack:[130,.2,'square',.2,.5],win:[520,.55,'triangle',.24,2],lose:[240,.6,'triangle',.24,.4]};this.tone(...(sounds[name]||sounds.click))}
 update(dt,game){this.now+=dt;if(this.ctx?.state==='running')this.musicManager.update(game)}
}
const MUSIC_TEMPOS={menu:92,meadow:144,forest:156,end:148,boss:168,victory:116,defeat:78};

function renderScore(context,track,tier){
 const score=MUSIC_SCORES[track];
 const rate=22050, step=30/MUSIC_TEMPOS[track];
 const count=Math.max(32,score.notes.length);
 const buffer=context.createBuffer(1,Math.round(rate*step*count),rate);
 const data=buffer.getChannelData(0);
 let seed=1313;
 function add(index,duration,volume,wave){
  const offset=Math.round(index*step*rate);
  const length=Math.round(duration*rate);
  for(let i=0;i<length;i++){
   const t=i/rate;
   const envelope=Math.min(1,t/.009)*Math.max(0,1-i/length)**1.5;
   data[(offset+i)%data.length]+=wave(t)*volume*envelope;
  }
 }
 function note(i,midi,length,volume,brightness){
  const omega=2*Math.PI*440*2**((midi-69)/12);
  add(i,length,volume,t=>Math.sin(omega*t)+brightness*(.5*Math.sin(omega*2*t)+.24*Math.sin(omega*3*t)));
 }
 const quiet=['menu','defeat','victory'].includes(track);
 for(let i=0;i<count;i++){
  const lead=score.notes[i%score.notes.length];
  const root=score.bass[Math.floor(i/8)%4];
  if(lead)note(i,lead,step*1.5,.22,quiet?.3:.92);
  if(i%2===0)note(i,root+(i%8===4?12:0),step*(quiet?3.2:1.7),.24,.34);
  if(i%8===0){
   note(i,root+19,step*7.5,.09,.24);
   note(i,root+24,step*7.5,.09,.24);
  }
  if(!quiet&&i%4===0)add(i,.18,.32,t=>Math.sin(2*Math.PI*(49*t+2.9*(1-Math.exp(-27*t)))));
  if(!quiet&&i%2===0)add(i,i%4===2?.13:.038,i%4===2?.15:.058,()=>{
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   return seed/2147483648-1;
  });
  if(track==='boss'&&tier>=2&&i%2===1)note(i,root+12,step,.13,.86);
  if(track==='boss'&&tier>=3)note(i,root+36+[0,7,12,7][i%4],step*.8,.08,.7);
 }
 return buffer;
}

class MusicManager{
 constructor(engine){
  this.engine=engine;
  this.duck=1;
  this.buffers=new Map();
 }
 update(game){
  const {state,round}=game;
  let next=this.track||'menu';
  if(game.storyOutcome==='victory'&&state===STATES.DIALOGUE)next='victory';
  else if(state===STATES.VICTORY||state===STATES.DEFEAT)next=state;
  else if(state===STATES.BOSS_FIGHT||state===STATES.BOSS_WARNING)next='boss';
  else if([STATES.TITLE,STATES.INTRO,STATES.STAGE_TRANSITION].includes(state))next='menu';
  else if(game.machine.active)next=['meadow','forest','end'][round-1];

  const duck=state===STATES.PAUSED?.24:
   state===STATES.DIALOGUE||state===STATES.LEVEL_UP?.52:
   state===STATES.INTRO?.68:1;
  if(duck!==this.duck){this.duck=duck;this.engine.sync()}
  const tier=next==='boss'?(game.boss?.tier||1):1;
  if(next!==this.track||tier!==this.tier)this.switchTo(next,tier);
 }
 switchTo(track,tier){
  const {ctx,musicBus}=this.engine;
  const key=track+':'+tier;
  if(!this.buffers.has(key))this.buffers.set(key,renderScore(ctx,track,tier));
  const source=ctx.createBufferSource();
  const gain=ctx.createGain();
  source.buffer=this.buffers.get(key);
  source.loop=true;
  gain.gain.value=0;
  source.connect(gain).connect(musicBus);
  const now=ctx.currentTime;
  const old=this.current;
  const offset=track===this.track&&old?(now-old.started)%source.buffer.duration:0;
  source.start(now,offset);
  this.engine.ramp(gain.gain,1,.42);
  if(old){
   this.engine.ramp(old.gain.gain,0,.42);
   old.source.stop(now+.45);
  }
  source.onended=()=>{source.disconnect();gain.disconnect()};
  this.track=track;
  this.tier=tier;
  this.current={source,gain,started:now-offset};
 }
}
