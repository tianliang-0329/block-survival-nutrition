// Reality knowledge is separate from the Nutrition Core's fantasy combat attributes.
const FOOD_SKILLS=[
{id:'bread',name:'面包',tag:'速射',effect:'攻击频率 +18%',apply:p=>p.interval/=1.18},
{id:'carrot',name:'胡萝卜',tag:'穿透',effect:'穿透 +1',apply:p=>p.pierce++},
{id:'apple',name:'苹果',tag:'吸附',effect:'拾取范围 +25%',apply:p=>p.pickup*=1.25},
{id:'fish',name:'熟鲑鱼',tag:'生命',effect:'生命上限 +20，回复20',apply:p=>{p.maxHp+=20;p.hp=Math.min(p.maxHp,p.hp+20)}},
{id:'potato',name:'烤马铃薯',tag:'冲刺',effect:'冲刺冷却 -15%',apply:p=>{p.dashMax=(p.dashMax||2.5)*.85}},
{id:'milk',name:'牛奶',tag:'护盾',effect:'获得30点护盾',apply:(p,g)=>g.shield+=30},
{id:'soup',name:'蘑菇煲',tag:'协同',effect:'攻击 +12%，组合额外回复10',apply:(p,g)=>{p.damage*=1.12;g.synergy=(g.synergy||0)+10}}
];
const FOOD_KNOWLEDGE={};
const foodRows=[
['bread','面包','谷物','谷薯类是重要的能量来源。','三餐合理安排主食。'],
['carrot','胡萝卜','蔬菜','β-胡萝卜素可在体内转化为维生素A。','蔬菜常换品种，搭配深色蔬菜。'],
['apple','苹果','水果','完整水果提供膳食纤维。','果汁不能替代完整水果。'],
['fish','熟鲑鱼','鱼类','鱼类提供优质蛋白质，部分含Omega-3。','鱼禽蛋瘦肉适量轮换。'],
['potato','烤马铃薯','薯类','马铃薯属于薯类，可作为部分主食。','吃薯类时合理调整其他主食。'],
['milk','牛奶','奶类','奶类提供钙和优质蛋白质。','结合耐受情况选择奶类。'],
['soup','蘑菇煲','混合食物','食物多样有助于满足不同营养需要。','搭配主食、蔬果和蛋白质食物。'],
['steak','熟猪排','畜肉','瘦肉提供蛋白质和多种营养素。','肉类适量，注意荤素搭配。'],
['chicken','烤鸡','禽肉','禽肉是蛋白质食物的一种选择。','外卖可搭配蔬菜与主食。'],
['berries','甜浆果','水果','蔬果提供多种维生素和矿物质。','水果与蔬菜不能完全互相替代。'],
['beet','甜菜','蔬菜','蔬菜多样有助于丰富营养来源。','餐餐有蔬菜，颜色多样。'],
['golden-apple','金苹果','幻想食品','没有一种食物能满足全部营养需要。','现实中无需追求神奇食品。'],
['cake','蛋糕','糕点','甜食可适量享用，无需绝对禁止。','结合整体饮食合理安排份量。']
];
for(const [id,name,category,knowledge,advice] of foodRows)FOOD_KNOWLEDGE[id]={id,name,category,imagePath:`assets/foods/${id}.svg`,gameEffect:FOOD_SKILLS.find(f=>f.id===id)?.effect||'提供食物补给储备',knowledge,advice,unlockCondition:'首次拾取或强化'};
const FOOD_DROPS=[['bread','potato','apple','carrot','chicken'],['steak','soup','beet','berries','fish','bread','carrot'],['golden-apple','bread','fish','milk','cake']];
const ENEMY_ART=[['zombie','skeleton','spider','creeper'],['blaze','magma','piglin','wither-skeleton'],['enderman','endermite','shulker']];
const CHAPTER_KNOWLEDGE=[
 ['先在村庄练走位，边走边观察小怪。','捡到烤薯就能填主食槽。现实里，薯类也能替换一部分米饭或面食。','首领快到了。打开工作台看一下缺哪类，趁现在把餐盘备好。'],
 ['下界也先备餐。上一章做过的餐盘在这一章要重新搭。','熟鱼、烤鸡都能填蛋白质槽。现实点餐时，也可以在鱼、蛋和豆腐之间换着选。','怪多时沿边绕，留一次冲刺躲首领的冲撞。'],
 ['在末地配五类补给。水果、奶类缺哪样，可以向补给箱领取。','水果和蔬菜是不同的补给槽。现实中也可以把水果留到两餐之间吃。','龙盾开了以后窗口有限，边绕小怪边把箭打向龙。']
];
const RECIPES=[
{id:'energy',name:'能量补给',foods:['bread','potato'],knowledge:'谷薯类可以作为主食的重要组成部分。',apply:g=>{g.buffTime=20;g.player.hp=Math.min(g.player.maxHp,g.player.hp+(g.synergy||0))}},
{id:'plants',name:'蔬果组合',foods:['carrot','apple'],knowledge:'蔬果提供维生素、矿物质及膳食纤维。',apply:g=>{g.player.pickup+=45;g.player.hp=Math.min(g.player.maxHp,g.player.hp+25+(g.synergy||0))}},
{id:'balanced',name:'均衡餐盘',foods:['bread','carrot','fish'],knowledge:'主食、蔬果和蛋白质食物合理搭配。',apply:g=>{g.player.damage*=1.3;g.shield+=30;g.player.hp=Math.min(g.player.maxHp,g.player.hp+20+(g.synergy||0))}}
];
