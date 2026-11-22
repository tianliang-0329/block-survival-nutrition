export const waypoints = {
	start: {name: '炊火营地', enter: '带上一副食材牌，从零食集市出发。'},
	market: {
		name: '零食集市',
		enter: '回营地的路被一团史莱姆堵住了。先把手里的食材配成一餐。',
		clear: '史莱姆散开，集市的补给箱露了出来。',
	},
	breakfast: {
		name: '晨钟小巷',
		enter: '铃已经响了。迟到幻影还想让你空着背包冲过去。',
		clear: '铃声停了。小巷尽头传来矿镐和蛛网被拉紧的声音。',
	},
	repeat: {
		name: '末影货架',
		enter: '货架上只剩反复补货的同一格。末影卫会复制你打过的食材类别。',
		clear: '货架终于多出一格。给后面的路再挑一份补给。',
	},
	web: {
		name: '农田涵洞',
		enter: '去田里的水道被蛛网缠住了，洞口还留着一瓶白水。',
		clear: '蛛网松开，水道重新流了起来。',
	},
	salt: {
		name: '盐壳矿道',
		enter: '白色矿壳每隔一阵就会长回来。工作台的合成可以把它打开。',
		clear: '矿壳裂开。洞深处还有一处读数不断上升的红石警报。',
	},
	camp: {
		name: '炉火驿站',
		enter: '离出口只剩最后一站。可以歇一歇，也可以趁火还旺练一张牌。',
	},
	caries: {
		name: '糖晶哨站',
		enter: '每多一次甜点出牌，糖晶警报都可能变得更响。先看看它打算做什么。',
		clear: '警报停了。带好补给，去出口的信标。',
	},
	pressure: {
		name: '红石深井',
		enter: '红石的读数会一轮轮升高。得在压力积起来前打通矿井。',
		clear: '井里的红石熄灭了。出口信标已经看得见了。',
	},
	boss: {
		name: '满格信标',
		enter: '信标把饱食刻度填满，照出一个幻象。用工作台带回一份配得起来的晚餐。',
		clear: '信标的假光散去。营地已经点起炉火，等你带着新配方回来。',
	},
}

// The scenes use UV regions of the locally archived vanilla PNGs.
const textures = {
	steve: [64, 64], slime: [64, 32], enderman: [64, 32],
	enderman_eyes: [64, 32], cave_spider: [64, 32], phantom: [64, 64],
}
const silhouettes = {
	player: {
		size: [16, 32],
		faces: [
			['steve', 8, 8, 8, 8, 4, 0],
			['steve', 20, 20, 8, 12, 4, 8],
			['steve', 44, 20, 4, 12, 0, 8],
			['steve', 36, 52, 4, 12, 12, 8],
			['steve', 4, 20, 4, 12, 4, 20],
			['steve', 20, 52, 4, 12, 8, 20],
		],
	},
	market: {
		size: [16, 16],
		faces: [
			['slime', 8, 8, 8, 8, 0, 0, 2],
			['slime', 6, 22, 6, 6, 2, 2, 2],
			['slime', 34, 2, 2, 2, 3, 5, 2],
			['slime', 34, 2, 2, 2, 9, 5, 2],
			['slime', 34, 9, 1, 1, 8, 10, 2],
		],
	},
	repeat: {
		size: [14, 42],
		faces: [
			['enderman', 8, 8, 8, 8, 3, 0],
			['enderman_eyes', 8, 8, 8, 8, 3, 0],
			['enderman', 22, 20, 8, 12, 3, 8],
			['enderman', 58, 2, 2, 23, 1, 8],
			['enderman', 58, 2, 2, 23, 11, 8],
			['enderman', 2, 2, 2, 22, 4, 20],
			['enderman', 2, 2, 2, 22, 8, 20],
		],
	},
	breakfast: {
		size: [26, 13],
		faces: [
			['phantom', 23, 30, 6, 5, 0, 2],
			['phantom', 9, 26, 6, 4, 6, 3],
			['phantom', 5, 5, 7, 3, 10, 6],
			['phantom', 9, 26, 6, 4, 16, 3],
			['phantom', 23, 30, 6, 5, 21, 2],
		],
	},
	web: {
		size: [28, 18],
		faces: [
			['cave_spider', 8, 12, 12, 8, 8, 4],
			['cave_spider', 40, 12, 8, 8, 10, 8],
			['cave_spider', 36, 18, 6, 2, 3, 9],
			['cave_spider', 36, 18, 6, 2, 19, 9],
			['cave_spider', 36, 18, 6, 2, 0, 13],
			['cave_spider', 36, 18, 6, 2, 22, 13],
		],
	},
}

function patch([texture, x, y, width, height, left, top, magnification = 1]) {
	const [sheetWidth, sheetHeight] = textures[texture]
	const backgroundX = 100 * x / (sheetWidth - width)
	const backgroundY = 100 * y / (sheetHeight - height)
	return `<span class="texture-patch" style="--left:${left};--top:${top};--w:${width * magnification};--h:${height * magnification};
		background-image:url('./assets/${texture}.png');background-size:${100 * sheetWidth / width}% ${100 * sheetHeight / height}%;
		background-position:${backgroundX}% ${backgroundY}%"></span>`
}

export function portrait(id, emblem = '') {
	const model = silhouettes[id]
	if (!model) {
		return `<div class="sprite-art construct construct-${id}" aria-hidden="true"><i></i>
			<img src="./assets/${emblem}.png" class="pixel" alt="" draggable="false"><i></i></div>`
	}
	return `<div class="sprite-art model model-${id}" style="--model-w:${model.size[0]};--model-h:${model.size[1]}"
		aria-hidden="true">${model.faces.map(patch).join('')}</div>`
}
