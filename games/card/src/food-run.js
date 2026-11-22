import {produce} from 'immer'
import actions from './game/actions.js'
import {Card} from './game/cards.js'
import {Monster} from './game/monster.js'
import {CampfireRoom, MonsterRoom, StartRoom} from './game/rooms.js'
import {getCurrRoom, isCurrRoomCompleted, isDungeonCompleted} from './game/utils-state.js'
import {shuffle} from './utils.js'
import {foodById, foes, recipes, rewardPool, starter} from './pantry.js'

export const trail = [
	[{id: 'start', name: '营地', next: ['market']}],
	[{id: 'market', next: ['breakfast', 'repeat']}],
	[{id: 'breakfast', next: ['web', 'salt']}, {id: 'repeat', next: ['web', 'salt']}],
	[{id: 'web', next: ['camp', 'caries']}, {id: 'salt', next: ['camp', 'caries', 'pressure']}],
	[{id: 'camp', name: '篝火补给', next: ['boss']}, {id: 'caries', next: ['boss']}, {id: 'pressure', next: ['boss']}],
	[{id: 'boss', next: []}],
]

export function makeFood(id) {
	const food = foodById[id]
	const card = new Card({
		name: food.name,
		type: food.damage ? 'attack' : 'skill',
		energy: food.cost,
		target: food.damage ? 'enemy' : 'player',
		damage: food.damage,
		block: food.block,
		exhaust: food.exhaust,
		description: food.text + (food.detail ?? ''),
		image: food.image,
	})
	card.foodId = id
	return card
}

export function upgradeFood(card) {
	return {
		...card,
		name: card.name + ' +',
		upgraded: true,
		damage: card.damage ? card.damage + 3 : 0,
		block: card.block ? card.block + 3 : 0,
	}
}

function makeTrail() {
	const graph = trail.map((floor, y) => floor.map((entry, x) => {
		let room = StartRoom()
		if (entry.id === 'camp') room = CampfireRoom()
		const foe = foes[entry.id]
		if (foe) room = MonsterRoom(Monster({
			name: foe.name, hp: foe.hp, block: foe.block, intents: foe.pattern,
		}))
		return {...entry, x, y, room, type: room.type, edges: entry.next, didVisit: y === 0}
	}))
	return {graph, x: 0, y: 0, pathTaken: [[0, 0]]}
}

export const nodeAt = (state) => state.dungeon.graph[state.dungeon.y][state.dungeon.x]
export const enemyAt = (state) => getCurrRoom(state).monsters?.[0]
export const foodOf = (card) => foodById[card.foodId]
export const emptyTable = () => ({groups: [], cards: [], recipes: [], prep: 0, repeat: false})

export function newFoodRun() {
	const state = actions.setDungeon(actions.createNewState(), makeTrail())
	return {
		...state, deck: starter.map(makeFood), phase: 'intro',
		table: emptyTable(), round: 1, rewards: [], learned: [], crafted: 0,
		message: '把食材带进工作台，试试能配出什么。',
	}
}

export function accessibleNodes(state) {
	return (state.dungeon.graph[state.dungeon.y + 1] ?? []).filter(
		(node) => nodeAt(state).edges.includes(node.id),
	)
}

export function travel(state, id) {
	if (!['route', 'intro'].includes(state.phase)) return state
	const node = accessibleNodes(state).find((node) => node.id === id)
	if (!node) return state
	let next = actions.move(state, {move: {x: node.x, y: node.y}})
	if (id === 'market') {
		next = {...next, hand: state.deck.slice(0, 5), drawPile: shuffle(state.deck.slice(5))}
	}
	if (id === 'web') next = actions.addCardToHand(next, {card: makeFood('water')})
	return {
		...next, phase: node.room.type === 'campfire' ? 'camp' : 'fight',
		round: 1, rewards: [], table: emptyTable(), hit: 0, combined: false, repeatTriggered: false,
		message: '',
	}
}

function tally(cards, group) {
	return cards.filter((id) => foodById[id].group === group).length
}

function isBossSecondPhase(state) {
	const enemy = enemyAt(state)
	return nodeAt(state).id === 'boss' && enemy.currentHealth <= enemy.maxHealth / 2
}

export function intentFor(state) {
	const enemy = enemyAt(state)
	const {id} = nodeAt(state)
	const intent = {...enemy.intents[enemy.nextIntent]}
	const {table} = state
	const sweets = tally(table.cards, 'treat')
	if (id === 'market' && sweets > 0 && sweets === table.cards.length) intent.damage += 6
	if (id === 'breakfast' && !table.groups.includes('staple')) intent.energyLoss = 1
	if (id === 'web' && !table.recipes.includes('field')) intent.drawLoss = 1
	if (id === 'caries' && sweets > 1) intent.damage += 7 * (sweets - 1)
	if (id === 'pressure') intent.damage += 3 * (state.round - 1)
	if (id === 'boss' && isBossSecondPhase(state) && table.recipes.length === 0) intent.damage += 9
	return intent
}

function adjustEnemy(state, change) {
	return produce(state, (draft) => change(enemyAt(draft)))
}

function blockPlayer(state, amount) {
	return produce(state, (draft) => {draft.player.block += amount})
}

function checkBattleEnd(state) {
	if (!isCurrRoomCompleted(state)) return state
	const id = nodeAt(state).id
	const won = isDungeonCompleted(state)
	return {
		...state, phase: won ? 'win' : 'reward', won, endedAt: won ? Date.now() : undefined,
		learned: [...state.learned, id],
		rewards: won ? [] : shuffle(rewardPool).slice(0, 3),
	}
}

export function recipesForPlay(table, food) {
	const laid = new Set([...table.groups, ...table.cards, ...table.recipes, food.group, food.id])
	const triggered = []
	for (const recipe of recipes) {
		if (table.recipes.includes(recipe.id) || (recipe.id === 'dessert' && food.group !== 'treat')) continue
		if (!recipe.need.every((key) => laid.has(key))) continue
		triggered.push(recipe)
		laid.add(recipe.id)
	}
	return triggered
}

export function playFood(state, uid) {
	const card = state.hand.find((entry) => entry.id === uid)
	if (state.phase !== 'fight' || !card || card.energy > state.player.currentEnergy) return state
	const food = foodOf(card)
	const {table} = state
	const id = nodeAt(state).id
	const repeated = !table.repeat && table.groups.includes(food.group)
		&& (id === 'repeat' || (id === 'boss' && !isBossSecondPhase(state)))
	let next = repeated
		? adjustEnemy(state, (enemy) => {enemy.block += 9})
		: state
	const bonus = table.groups.includes(food.after) ? food.bonus : 0
	next = actions.playCard(next, {
		card: {...card, damage: card.damage + bonus},
		target: card.target === 'enemy' ? 'enemy0' : 'player',
	})
	// The engine stores the original card in its discard/exhaust pile for future turns.
	// Restore its base values after passing a context-specific attack to the engine.
	if (bonus) {
		next = produce(next, (draft) => {
			const pile = card.exhaust ? draft.exhaustPile : draft.discardPile
			pile[pile.length - 1] = card
		})
	}
	const chain = {
		groups: [...new Set([...table.groups, food.group])],
		cards: [...table.cards, food.id],
		recipes: [...table.recipes],
		prep: table.prep + (food.prep ?? 0),
		repeat: repeated || table.repeat,
	}
	const extraDraw = table.groups.includes('water') ? food.drawWithWater ?? 0 : 0
	let draw = (food.draw ?? 0) + extraDraw
	let energy = (food.energy ?? 0) + (table.groups.length >= 2 ? food.energyWithVariety ?? 0 : 0)
	const triggered = recipesForPlay(table, food)
	for (const recipe of triggered) {
		chain.recipes.push(recipe.id)
		if (id === 'salt') next = adjustEnemy(next, (enemy) => {enemy.block = 0})
		if (recipe.block) next = blockPlayer(next, recipe.block)
		if (recipe.damage) next = actions.removeHealth(next, {target: 'enemy0', amount: recipe.damage})
		energy += recipe.energy ?? 0
		draw += recipe.draw ?? 0
	}
	if (energy) next = actions.addEnergyToPlayer(next, {amount: energy})
	if (draw) next = actions.drawCards(next, {amount: draw})

	const message = [
		repeated ? '敌人复制了类别，获得 9 护盾。' : '',
		triggered.length ? '合成 ' + triggered.map((recipe) => recipe.name).join('、') + '！' : food.name + '已上工作台。',
	].filter(Boolean).join(' ')

	return checkBattleEnd({
		...next, table: chain, crafted: state.crafted + triggered.length, message,
		hit: Math.max(0, enemyAt(state).currentHealth - Math.max(0, enemyAt(next).currentHealth)),
		combined: triggered.length > 0,
		repeatTriggered: repeated,
	})
}

export function finishTurn(state) {
	if (state.phase !== 'fight') return state
	const enemy = enemyAt(state)
	const {damage, block, energyLoss, drawLoss} = intentFor(state)
	const index = enemy.nextIntent
	const baseIntent = enemy.intents[index]
	const withIntent = adjustEnemy(state, (draft) => {
		draft.intents[index] = {damage, block}
	})
	let next = actions.endTurn(withIntent)
	next = adjustEnemy(next, (draft) => {draft.intents[index] = baseIntent})
	if (next.player.currentHealth <= 0) return {...next, phase: 'lost'}
	if (drawLoss && next.hand.length) {
		next = produce(next, (draft) => {draft.drawPile.unshift(draft.hand.pop())})
	}
	if (state.table.prep) next = actions.drawCards(next, {amount: state.table.prep})
	const loss = Math.max(0, state.player.currentHealth - next.player.currentHealth)
	return produce(next, (draft) => {
		draft.table = emptyTable()
		draft.round++
		draft.player.currentEnergy -= energyLoss ?? 0
		draft.hit = 0
		draft.combined = false
		draft.repeatTriggered = false
		draft.message = loss ? '上一击消耗了 ' + loss + ' 点耐力。' : '挡住了上一击。'
		if (energyLoss) draft.message += ' 迟到幻影扣除 1 行动。'
		if (drawLoss) draft.message += ' 黏网让你少抽了 1 张。'
	})
}

export function takeReward(state, id) {
	if (state.phase !== 'reward' || (id && !state.rewards.includes(id))) return state
	const next = id ? actions.addCardToDeck(state, {card: makeFood(id)}) : state
	return {...next, rewards: [], phase: 'route'}
}

export function campChoice(state, choice, uid) {
	if (state.phase !== 'camp') return state
	if (choice === 'rest') {
		const next = actions.addHealth(state, {target: 'player', amount: 22})
		return {...next, phase: 'route'}
	}
	if (choice === 'upgrade') {
		const card = state.deck.find((entry) => entry.id === uid)
		if (!card || card.upgraded || (!card.damage && !card.block)) return state
		return {...state, deck: state.deck.map((entry) => entry === card ? upgradeFood(card) : entry), phase: 'route'}
	}
	return state
}
