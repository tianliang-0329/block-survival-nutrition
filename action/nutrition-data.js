// V5 data: categories are game archives, never a per-meal prescription.
const FOOD_GROUPS=[['staple','谷薯主食','bread'],['vegetable','蔬菜','carrot'],['fruit','水果','apple'],['protein','鱼禽肉蛋豆','fish'],['dairy','奶类补给','milk']];
const GROUP_IDS={bread:'staple',potato:'staple',carrot:'vegetable',beet:'vegetable',soup:'vegetable',apple:'fruit',berries:'fruit',fish:'protein',steak:'protein',chicken:'protein',milk:'dairy',cake:'extra','golden-apple':'extra'};
const NUTRITION_SOURCE='中国居民膳食指南（2022）：准则一、三、四；中国食物成分表（标准版第6版），对应食材条目。蘑菇煲按游戏食谱归档，实际营养取决于配料。';
for(const f of Object.values(FOOD_KNOWLEDGE)){f.group=GROUP_IDS[f.id];f.source=NUTRITION_SOURCE;}
FOOD_KNOWLEDGE.berries.knowledge='浆果含水分、膳食纤维及维生素，具体含量因品种而异。';
FOOD_KNOWLEDGE.beet.knowledge='甜菜根含碳水化合物及膳食纤维；与叶菜营养构成不同。';
FOOD_KNOWLEDGE.soup.knowledge='蘑菇可提供膳食纤维；蘑菇煲的盐和脂肪含量取决于配料与烹调。';
FOOD_KNOWLEDGE.steak.knowledge='猪肉提供蛋白质和维生素B1，肥瘦部位脂肪含量差异大。';
FOOD_KNOWLEDGE.chicken.knowledge='鸡肉提供蛋白质，带皮与烹调方式会影响脂肪含量。';
FOOD_DROPS.forEach((row)=>{for(const id of ['bread','carrot','fish','apple','milk'])if(!row.includes(id))row.push(id)});
const PLATE_RECIPES=[{id:'basic',name:'基础补给',groups:['staple','vegetable','protein'],reward:'回复25 · 护盾20 · 连携速射20秒'}, {id:'diverse',name:'多样补给',groups:['staple','vegetable','protein','fruit'],reward:'回复35 · 护盾35 · 破盾窗口18秒'}, {id:'rich',name:'丰富补给',groups:['staple','vegetable','protein','fruit','dairy'],reward:'回复45 · 护盾50 · 破盾窗口25秒'}];
