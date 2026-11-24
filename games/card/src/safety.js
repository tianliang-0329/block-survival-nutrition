export const safetySource = 'https://www.who.int/activities/promoting-safe-food-handling/five-key-to-safer-food'

// One scenario per stop, so changing route still exposes all five kitchen practices.
export const safetyStops = [
	{
		id: 'clean', name: '保持清洁', situation: '刚整理完集市货箱，准备切胡萝卜。',
		choices: [
			{id: 'wipe', label: '在围裙上擦手', feedback: '擦围裙不能代替洗手。处理食材前，要用肥皂和安全的水洗手。'},
			{id: 'wash', label: '用肥皂和水洗手', safe: true},
			{id: 'gloves', label: '不洗手，直接戴手套', feedback: '戴手套也要先洗手，并保持餐具和台面清洁。'},
		],
		tip: '备餐前洗手，也清洁刀具、砧板和台面。',
	},
	{
		id: 'separate', name: '生熟分开', situation: '砧板刚切过生鸡肉，接下来要切直接吃的苹果。',
		choices: [
			{id: 'turn', label: '翻个面接着切', feedback: '翻面可能仍把生肉汁带到水果上。给即食食物用另一块干净砧板。'},
			{id: 'wait', label: '放干以后用原砧板', feedback: '表面变干不能保证安全。生食与即食食物应使用分开的用具。'},
			{id: 'board', label: '换干净砧板和刀', safe: true},
		],
		tip: '生肉用过的刀和砧板要与熟食、即食食物分开，防止交叉污染。',
	},
	{
		id: 'cook', name: '烧熟煮透', situation: '锅里的鸡肉表面变色了，怎么确认可以出锅？',
		choices: [
			{id: 'check', label: '用温度计检查最厚处', safe: true},
			{id: 'surface', label: '表面变色就出锅', feedback: '表面变色不能证明中心熟透。用食品温度计检查最厚处。'},
			{id: 'smell', label: '闻起来香就出锅', feedback: '香味不能判断是否熟透。烹调时要检查食物中心。'},
		],
		tip: '肉、禽、蛋和海鲜要熟透。用食品温度计确认中心达到相应食材的安全温度。',
	},
	{
		id: 'temperature', name: '安全温度', situation: '煮好的饭菜多出一份，准备留到晚些时候吃。',
		choices: [
			{id: 'overnight', label: '放桌上等到晚上', feedback: '熟食不要在室温久放。分装后及时冷藏更安全。'},
			{id: 'cool', label: '分装并及时冷藏', safe: true},
			{id: 'cover', label: '盖上盖子放在温热的灶台', feedback: '盖盖子不能控制温度。要及时冷藏，或维持足够的热度。'},
		],
		tip: '熟食与易腐食材要及时冷藏，熟食不要在室温下放置超过两小时。',
	},
	{
		id: 'supplies', name: '安全用水和原料', situation: '在出口要用水清洗直接入口的水果。',
		choices: [
			{id: 'stream', label: '用看起来干净的溪水', feedback: '看起来清澈不能证明水安全。清洗即食水果应使用安全用水。'},
			{id: 'reuse', label: '用洗过生肉的水', feedback: '洗过生肉的水可能污染水果。使用安全的水和干净用具。'},
			{id: 'water', label: '用安全饮用水洗新鲜水果', safe: true},
		],
		tip: '用安全的水，挑选新鲜可靠的原料；清洗要生吃的蔬果。',
	},
];
