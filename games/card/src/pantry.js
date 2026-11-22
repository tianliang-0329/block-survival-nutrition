const food = (id, name, image, group, cost, text, effects = {}) => ({
	id, name, image, group, cost, text, ...effects,
})

export const groups = {
	staple: '主食', protein: '蛋白食材', plant: '蔬果', water: '饮水', treat: '甜点', dish: '菜肴',
}

export const pantry = [
	food('bread', '面包', 'bread', 'staple', 1, '造成 6 点伤害。下一回合多抽 1 张。', {damage: 6, prep: 1}),
	food('potato', '烤马铃薯', 'baked_potato', 'staple', 1, '获得 6 点护盾。下一回合多抽 1 张。', {block: 6, prep: 1}),
	food('salmon', '熟鲑鱼', 'cooked_salmon', 'protein', 1, '造成 8 点伤害。', {damage: 8, after: 'staple', bonus: 4, detail: '台上已有主食时，额外造成 4 点伤害。'}),
	food('chicken', '熟鸡肉', 'cooked_chicken', 'protein', 1, '造成 6 点伤害，获得 4 点护盾。', {damage: 6, block: 4}),
	food('beef', '牛排', 'cooked_beef', 'protein', 2, '造成 16 点伤害。', {damage: 16, after: 'plant', bonus: 8, detail: '台上已有蔬果时，额外造成 8 点伤害。'}),
	food('carrot', '胡萝卜', 'carrot', 'plant', 1, '造成 3 点伤害，获得 4 点护盾。', {damage: 3, block: 4}),
	food('apple', '苹果', 'apple', 'plant', 0, '抽 1 张牌。消耗（本场只用一次）。', {draw: 1, exhaust: true}),
	food('water', '白水', 'potion', 'water', 0, '获得 2 点护盾。消耗（本场只用一次）。', {block: 2, exhaust: true}),
	food('cookie', '曲奇', 'cookie', 'treat', 0, '造成 5 点伤害，返还 1 行动。消耗（本场只用一次）。', {damage: 5, energy: 1, exhaust: true}),
	food('melon', '西瓜片', 'melon_slice', 'plant', 0, '获得 4 点护盾。消耗（本场只用一次）。', {block: 4, exhaust: true}),
	food('beetroot', '甜菜根', 'beetroot', 'plant', 1, '造成 4 点伤害，抽 1 张。', {damage: 4, draw: 1, drawWithWater: 1, detail: '台上已有饮水时，额外抽 1 张。'}),
	food('stew', '蘑菇煲', 'mushroom_stew', 'dish', 1, '获得 9 点护盾，抽 1 张。', {block: 9, draw: 1, energyWithVariety: 1, detail: '台上已有两类食材时，返还 1 行动。'}),
	food('beetSoup', '甜菜汤', 'beetroot_soup', 'dish', 1, '获得 10 点护盾。下一回合多抽 1 张。', {block: 10, prep: 1}),
	food('rabbit', '兔肉煲', 'rabbit_stew', 'dish', 2, '造成 14 点伤害，获得 10 点护盾。', {damage: 14, block: 10, energyWithVariety: 1, detail: '台上已有两类食材时，返还 1 行动。'}),
	food('cake', '蛋糕', 'cake', 'treat', 1, '造成 13 点伤害，抽 2 张。消耗（本场只用一次）。', {damage: 13, draw: 2, exhaust: true}),
	food('pie', '南瓜派', 'pumpkin_pie', 'treat', 1, '造成 10 点伤害，返还 1 行动。消耗（本场只用一次）。', {damage: 10, energy: 1, exhaust: true}),
]

export const foodById = Object.fromEntries(pantry.map((card) => [card.id, card]))

export const recipes = [
	{id: 'meal', name: '工作台三件套', need: ['staple', 'protein', 'plant'], block: 6, damage: 8,
		text: '主食 + 蛋白食材 + 蔬果', result: '额外 8 伤害、6 护盾'},
	{id: 'river', name: '河岸晚餐', need: ['potato', 'salmon', 'carrot'], damage: 12, draw: 1,
		text: '烤马铃薯 + 熟鲑鱼 + 胡萝卜', result: '额外 12 伤害、抽 1 张，可叠加三件套'},
	{id: 'field', name: '农田水道', need: ['plant', 'water'], block: 5, draw: 1,
		text: '任意蔬果 + 白水', result: '额外 5 护盾、抽 1 张'},
	{id: 'camp', name: '炉边热饭', need: ['bread', 'chicken'], energy: 1, block: 4,
		text: '面包 + 熟鸡肉', result: '返还 1 行动、额外 4 护盾'},
	{id: 'dessert', name: '最后一口', need: ['meal', 'treat'], draw: 2,
		text: '先凑齐三件套，再打一张甜点', result: '抽 2 张。甜点仍会触发敌人的响应'},
]

export const starter = ['potato', 'salmon', 'carrot', 'apple', 'cookie',
	'bread', 'chicken', 'water', 'carrot', 'bread', 'salmon']
export const rewardPool = pantry.map((card) => card.id)

export const sources = {
	diet: ['世卫组织 · 健康饮食', 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet'],
	sugar: ['世卫组织 · 游离糖与龋齿', 'https://www.who.int/news-room/fact-sheets/detail/sugars-and-dental-caries'],
	salt: ['世卫组织 · 减钠', 'https://www.who.int/news-room/fact-sheets/detail/sodium-reduction'],
	fiber: ['美国 NIDDK · 便秘与饮食', 'https://www.niddk.nih.gov/health-information/digestive-diseases/constipation/eating-diet-nutrition'],
}

const counter = (kind, target, penalty, relief) => ({kind, target, penalty, relief})

export const foes = {
	market: {
		name: '零食史莱姆', image: 'slime_ball', track: '零食替正餐', hp: 62,
		pattern: [
			{damage: 10, label: '试探弹跳', counter: counter('variety', 2, 4, 3)},
			{damage: 14, block: 6, label: '分裂护壳', counter: counter('guard', 8, 4, 2)},
			{damage: 21, interrupt: 8, label: '蓄力重压'},
		],
		rule: '只出甜点时额外造成 6 伤害。遇到蓄力重压，合成任意配方可以削弱它。',
		note: '零食也可以出现在日常饮食里。长期把甜点当作正餐，会挤占其他食物的位置。', source: 'diet',
	},
	breakfast: {
		name: '迟到幻影', image: 'clock_00', track: '赶课漏餐', hp: 61,
		pattern: [
			{damage: 11, label: '铃声响起', counter: counter('variety', 2, 4, 3)},
			{damage: 17, label: '赶课冲刺', counter: counter('guard', 8, 5, 3)},
		],
		rule: '本回合没出主食时，下回合少 1 行动。铺主食可关掉这一意图。',
		note: '早课可以提前准备多种食物搭配。主食、蛋白食物和蔬果是便于记住的选餐思路。', source: 'diet',
	},
	repeat: {
		name: '单格末影卫', image: 'ender_eye', track: '每天只吃同一套', hp: 64,
		pattern: [
			{damage: 12, label: '盯上背包', counter: counter('variety', 3, 5, 4)},
			{damage: 15, label: '单格复制', counter: counter('recipe', 1, 4, 3)},
		],
		rule: '每回合首次打出重复类别时，它先获得 9 点护盾。混着打或用组合伤害破盾。',
		note: '多样化要看一段时间的饮食。轮换食物有助于摄入不同营养素。', source: 'diet',
	},
	web: {
		name: '黏网爬蛛', image: 'string', track: '膳食纤维摄入不足', hp: 68,
		pattern: [{damage: 13, label: '缠网'}, {damage: 16, label: '收紧', counter: counter('guard', 8, 5, 4)}],
		rule: '回合结束时，若没同时打出蔬果与白水，下回合少抽 1 张。每场还能额外获得一瓶白水。',
		note: '全谷物、豆类、蔬果都可以提供膳食纤维。摄入足量膳食纤维和液体，有助于预防或缓解部分便秘。', source: 'fiber',
	},
	salt: {
		name: '盐壳矿卫', image: 'quartz', track: '长期高钠饮食', hp: 72, block: 14,
		pattern: [
			{damage: 12, block: 12, label: '盐壳再生', counter: counter('recipe', 1, 5, 4)},
			{damage: 20, block: 7, interrupt: 8, label: '矿镐蓄力'},
		],
		rule: '开局与行动后均有护盾。触发任意工作台配方时，先清掉现有盐壳，再结算配方。',
		note: '长期摄入过多钠会升高血压，增加心血管疾病风险。可以留意高钠调味料和加工食品的标签。', source: 'salt',
	},
	caries: {
		name: '龋齿警报', image: 'sugar', track: '频繁接触游离糖', hp: 68,
		pattern: [
			{damage: 12, label: '警报闪烁', counter: counter('variety', 2, 5, 3)},
			{damage: 17, label: '二次警报', counter: counter('guard', 10, 5, 3)},
		],
		rule: '同回合每打出第 2 张及之后的甜点，下一击就额外造成 7 点伤害。',
		note: '龋病涉及多个因素，减少游离糖暴露有助于降低风险。游戏中的回合和出牌次数仅用于表现节奏。', source: 'sugar',
	},
	pressure: {
		name: '血压警报', image: 'redstone', track: '盐壳矿道 · 高血压风险', hp: 74,
		pattern: [{damage: 10, block: 8, label: '红石读数'}, {damage: 15, label: '报警', counter: counter('recipe', 1, 6, 4)}],
		rule: '每多拖一回合，后续攻击都增加 3 点伤害。护盾只能挡当前一击，尽早接上配方。',
		note: '长期高钠饮食只是高血压的多个风险因素之一。现实中的血压需通过规范测量判断。游戏里的警报读数是回合计数。', source: 'salt',
	},
	boss: {
		name: '满格幻象', image: 'golden_apple', track: '终局 · 饱食满格的迷思', hp: 138, block: 12,
		pattern: [
			{damage: 14, label: '饱食刻度', counter: counter('variety', 3, 5, 4)},
			{damage: 12, block: 12, label: '金光护壳', counter: counter('guard', 10, 6, 3)},
			{damage: 23, interrupt: 8, label: '蓄力扫击'},
		],
		enraged: [
			{damage: 20, label: '过载冲击', counter: counter('recipe', 1, 7, 5)},
			{damage: 15, block: 10, label: '光幕回护', counter: counter('guard', 12, 6, 4)},
			{damage: 27, interrupt: 10, label: '满格蓄力'},
		],
		rule: '上半场首个重复类别给它 9 护盾。半血后攻势升级，没合成配方时额外造成 7 伤害。蓄力回合可用配方削弱。',
		note: '饱腹感和膳食多样性是不同的概念。把视野拉到一段时间，看食物搭配和习惯。', source: 'diet',
	},
}
