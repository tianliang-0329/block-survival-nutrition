
const portraitTouch=matchMedia('(pointer: coarse) and (orientation: portrait)');
let pendingLandscapeStart=false;
function startWithOrientation(){
 if(!portraitTouch.matches){game.start(true);return}
 pendingLandscapeStart=true;
 $('overlay').innerHTML=`<div class="panel orientation-panel">
  <h2>横过手机，开始冒险</h2>
  <p>左手拖摇杆，右手点按或按住攻击。</p>
  <div class="panel-actions"><button data-play-portrait>先用竖屏玩</button><button data-back-title>返回</button></div>
 </div>`;
}
function beginWhenLandscape(){
 if(!pendingLandscapeStart||portraitTouch.matches)return;
 pendingLandscapeStart=false;
 game.start(true);
}
if(portraitTouch.addEventListener)portraitTouch.addEventListener('change',beginWhenLandscape);
else portraitTouch.addListener(beginWhenLandscape);
function closeUpgrade(){
 game.transition(game.combatState());
 $('overlay').innerHTML='';
}
$('upgrade').onclick=()=>game.levelup();

const FOOD_NAMES={bread:'面包',apple:'苹果',carrot:'胡萝卜',potato:'烤薯',steak:'烤肉',mushroom:'蘑菇',melon:'西瓜',fish:'烤鱼',cookie:'曲奇',soup:'蘑菇汤',cake:'蛋糕',wheat:'麦穗',berries:'浆果',chicken:'烤鸡',beet:'甜菜',cheese:'奶酪'};
const UPGRADE_ART=['carrot','bolt','boot','armor','soup','arrow','gem'];
const LEVELS=[{name:'主世界 OVERWORLD',boss:'劫掠巨兽',wave:45,hp:640,speed:52,gap:3.4,count:10},{name:'下界 NETHER',boss:'凋灵',wave:45,hp:820,speed:57,gap:3.0,count:12},{name:'末地 THE END',boss:'末影龙',wave:45,hp:1040,speed:62,gap:2.7,count:14}];
function showTitle(){pendingLandscapeStart=false;game.storyOutcome=null;game.transitionDone=null;game.transitionTimer=0;game.dialogue.done=null;game.transition(STATES.TITLE);game.enemies=[];game.bullets=[];game.orbs=[];$('overlay').innerHTML=`<div class="panel title-panel"><div class="eyebrow">BLOCKS · BITES · BRAVERY</div><div class="menu-hero"><div class="hero-sprite"></div>${assets.html('bread','floating-food f1')}${assets.html('carrot','floating-food f2')}${assets.html('apple','floating-food f3')}</div><h1>方块<span>突围</span></h1><h2>饥饿值危机</h2><p class="subtitle">从主世界到末地，一场关于食物与生存的冒险。</p><div class="route"><span>01 主世界</span><i>▪ ▪ ▪</i><span>02 下界</span><i>▪ ▪ ▪</i><span>03 末地</span></div><button class="primary start" data-start>开始冒险 <span>→</span></button><div class="menu-secondary"><button data-story-intro>查看序章</button><button data-guide>食品图鉴 / 操作</button><button data-settings>声音设置</button><button data-unlock-music>播放背景音乐</button></div><p id="audioStatus" role="status"></p></div>`}
function showSettings(fromTitle=false){const back=fromTitle?'data-back-title':'data-back-pause';$('overlay').innerHTML=`<div class="panel settings"><div class="eyebrow">CAMP SETTINGS</div><h2>营地设置</h2>${[['volume','主音量',audio.volume],['musicVolume','背景音乐',audio.musicVolume],['sfxVolume','音效',audio.sfxVolume]].map(([id,n,v])=>`<label>${n}<input id="${id}" type="range" min="0" max="100" value="${Math.round(v*100)}" aria-label="${n}"></label>`).join('')}<div class="menu-secondary"><button data-music-toggle>音乐 ${audio.music?'开':'关'}</button><button data-sfx-toggle>音效 ${audio.sfx?'开':'关'}</button></div><button class="primary" ${back}>返回</button></div>`;for(const id of ['volume','musicVolume','sfxVolume'])$(id).oninput=e=>{audio[id]=Number(e.target.value)/100;audio.sync()}}
function renderPausePanel(){$('overlay').innerHTML=`<div class="panel pause-panel"><div class="eyebrow">REST AT THE CAMP</div><h2>喘口气，再出发</h2><div class="pause-food">${assets.html('soup')}${assets.html('bread')}</div><button class="primary" data-resume>继续冒险</button><div class="menu-secondary"><button data-restart>重新挑战</button><button data-settings>声音设置</button><button data-title>返回营地</button></div></div>`}
function showPause(){game.pause()}
const originalOverlayClick=$('overlay').onclick;
$('overlay').onclick=e=>{const b=e.target.closest('button');if(!b)return;audio.start();audio.play('click');if(b.hasAttribute('data-start')){startWithOrientation();return}
 if(b.hasAttribute('data-play-portrait')){pendingLandscapeStart=false;game.start(true);return}
 if(b.hasAttribute('data-story-intro')){game.dialogue.open('intro',STATES.INTRO,showTitle);return}
 if(b.hasAttribute('data-close-upgrade')){closeUpgrade();return}
 if(b.hasAttribute('data-unlock-music')){enableMenuMusic();return}if(b.hasAttribute('data-title')||b.hasAttribute('data-back-title'))return showTitle();if(b.hasAttribute('data-settings'))return showSettings(game.state===STATES.TITLE);if(b.hasAttribute('data-back-pause')){renderPausePanel();return}if(b.hasAttribute('data-music-toggle')){audio.music=!audio.music;audio.sync();syncAudio();return showSettings(game.state===STATES.TITLE)}if(b.hasAttribute('data-sfx-toggle')){audio.sfx=!audio.sfx;audio.sync();syncAudio();return showSettings(game.state===STATES.TITLE)}if(b.hasAttribute('data-guide')){showCodex();return}
 if(b.dataset.addFood){game.addIngredient(b.dataset.addFood);return}
 if(b.hasAttribute('data-pantry')){game.pantry();return}
 if(b.dataset.removeFood!==undefined){game.craftSlots.splice(+b.dataset.removeFood,1);game.renderCraft();return}
 if(b.hasAttribute('data-make-meal')){game.craft();return}
 if(b.hasAttribute('data-close-craft')){game.closeCraft();return}
 originalOverlayClick(e)};
$('pause').onclick=showPause;
document.addEventListener('pointerover',e=>{if(e.target.closest?.('button'))audio.play('hover')});
document.addEventListener('pointerdown',()=>audio.start(),{once:true});
const syncOld=syncAudio;syncAudio=function(){syncOld();audio.sync()};
// V2 keyboard pause remains available; enrich its panel without adding input listeners.
const basePause=game.pause.bind(game);game.pause=function(){basePause();if(this.state==='paused'&&!this.craftResume&&!this.codexReturn)renderPausePanel()};
$('craft').onclick=()=>game.openCraft();
showTitle();
requestAnimationFrame(frame);
