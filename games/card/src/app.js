import {
	accessibleNodes, campChoice, enemyAt, finishTurn, foodOf, intentFor, newFoodRun, nodeAt,
	playFood, recipesForPlay, takeReward, trail, travel,
} from './food-run.js'
import {foodById, foes, groups, recipes, sources} from './pantry.js'
import {setupHints} from './hints.js'
import {portrait, waypoints} from './expedition.js'
import {cardInMotion, flyToTable, reducedMotion} from './card-motion.js'

const app = document.querySelector('#app')
const dialog = document.querySelector('#book')
const title = document.querySelector('#book-title')
const bookBody = document.querySelector('#book-body')
const announcer = document.querySelector('#battle-announcer')
const hints = setupHints(document.querySelector('#hint-panel'))
let state = newFoodRun()
let locked = false
let feedback = {}

const icon = (id, css = '') => `<img class="pixel ${css}" src="./assets/${id}.png" alt="" draggable="false">`
const btn = (action, name, css = '', id = '') =>
	`<button type="button" class="${css}" data-action="${action}" data-id="${id}">${name}</button>`
const meal = recipes.find((recipe) => recipe.id === 'meal')

function hintButton(id, label, text) {
	return `<button type="button" class="hint-toggle" data-hint-toggle
		aria-expanded="false" aria-describedby="${id}">${label}</button>
		<span id="${id}" hidden>${text}</span>`
}

const hint = (id, label, text) =>
	`<span class="hint-trigger" data-hint="${id}">${hintButton(id, label, text)}</span>`

function cardView(food, {card, action, disabled = false, ready = []} = {}) {
	const tag = action ? 'button' : 'article'
	const attr = action ? `type="button" data-action="${action}" data-id="${card?.id ?? food.id}"` : ''
	const upgrade = card?.upgraded ? `<small class="upgrade">升级后 ${[card.damage && card.damage + ' 伤害', card.block && card.block + ' 护盾'].filter(Boolean).join(' / ')}</small>` : ''
	const combo = ready.length ? `<span class="card-ready" title="${ready.map(({name}) => name).join('、')}">可合成${ready.length > 1 ? ' ×' + ready.length : ''}</span>` : ''
	return `<${tag} class="food-card ${food.group} ${combo ? 'combo-ready' : ''}" ${attr} ${disabled ? 'aria-disabled="true"' : ''}>
		<span class="card-top"><span class="cost" aria-label="${food.cost} 行动">${food.cost}</span><span class="card-group">${groups[food.group]}</span></span>
		<span class="card-art">${icon(food.image)}</span>
		<span class="food-description"><span class="food-title"><strong>${card?.name ?? food.name}</strong>${combo}</span><span class="effect">${food.text}</span>
			${food.detail ? `<span class="card-detail">${food.detail}</span>` : ''}${upgrade}</span>
	</${tag}>`
}

function vitality(fighter, label, previous) {
	const hp = Math.max(0, fighter.currentHealth)
	const percent = (value) => 100 * Math.max(0, value) / fighter.maxHealth
	const from = percent(previous ?? hp)
	const to = percent(hp)
	return `<div class="fighter-vitals">
		<div class="life">
			<div class="life-label"><span>耐力</span><strong>${hp}<small> / ${fighter.maxHealth}</small></strong></div>
			<div class="life-track" role="meter" aria-label="${label}耐力" aria-valuemin="0" aria-valuemax="${fighter.maxHealth}"
				aria-valuenow="${hp}" style="--life:${to}%;--life-before:${from}%"><span></span></div>
		</div>
		<div class="shield ${fighter.block > 0 ? 'shield-active' : ''}" aria-label="${label}护盾 ${fighter.block}">
			<b>${fighter.block}</b><span>护盾</span>
		</div>
	</div>`
}

function energyView() {
	const {currentEnergy, maxEnergy} = state.player
	const pips = Array.from({length: maxEnergy}, (_, index) => `<i class="${index < currentEnergy ? 'lit' : ''}"></i>`).join('')
	return `<div class="energy"><strong>${currentEnergy}</strong><span>行动</span><div class="energy-pips" aria-hidden="true">${pips}</div></div>`
}

function tableView() {
	const {table} = state
	const recent = table.cards
	const isOpening = nodeAt(state).id === 'market' && state.round === 1
	const didEndTurn = state.round > 1 && recent.length === 0
	const notableEvent = state.combined || state.repeatTriggered || didEndTurn
	const recipeNames = table.recipes.map((id) => recipes.find((recipe) => recipe.id === id).name)
	const mealMissing = meal.need.filter((group) => !table.groups.includes(group))
	const missingLabel = mealMissing.length && mealMissing.length < meal.need.length
		? '三件套缺' + mealMissing.map((group) => groups[group]).join('、') : ''
	const firstPlay = nodeAt(state).id === 'market' && state.round === 1 && !recent.length
	return `<section class="worktable ${state.combined ? 'assembled' : ''}" aria-label="本回合工作台">
		<div class="table-title">${icon('crafting_table_top')}<h2>工作台</h2>
			${isOpening ? hint('hint-opening', '首轮提示', '试试烤马铃薯 → 熟鲑鱼 → 胡萝卜。同一回合可以一次合成两套配方。') : ''}
			<button type="button" data-book="recipes">看配方</button></div>
		<div class="craft-row">
			<div class="craft-input">
				<div class="table-groups">${['staple', 'protein', 'plant', 'water'].map((group) =>
					`<span class="${table.groups.includes(group) ? 'filled ' + group : mealMissing.length === 1 && mealMissing[0] === group ? 'needed' : ''}">${groups[group]}</span>`).join('')}</div>
				<div class="played-track" aria-label="本回合打出的牌">
					${recent.map((id) => {
						const food = foodById[id]
						return `<div class="played-card ${food.group}">${icon(food.image)}<span>${food.name}</span></div>`
					}).join('')}
					${Array.from({length: Math.max(0, 3 - recent.length)}, () => '<span class="empty-slot" aria-hidden="true"></span>').join('')}
					${firstPlay ? '<span class="empty-table">从手牌选一张</span>' : ''}
				</div>
			</div>
			<span class="craft-arrow" aria-hidden="true"></span>
			<div class="craft-output ${recipeNames.length ? 'ready' : ''}">
				<span class="output-slot" aria-hidden="true">${recipeNames.length ? icon('mushroom_stew') : ''}</span>
				<div>${recipeNames.length
					? `<div class="active-recipes" aria-label="已合成">${recipeNames.map((name) => `<span>${name}</span>`).join('')}</div>`
					: '<span class="output-label">待合成</span>'}
					${missingLabel ? `<span class="recipe-gap">${missingLabel}</span>` : ''}</div>
			</div>
		</div>
		<p class="work-log">${notableEvent ? state.message : ''}</p>
	</section>`
}

function supplyFeedback() {
	const {loss, blocked, guardGain, shieldBroken, comboCount} = feedback
	const changes = [
		state.hit ? '敌方 −' + state.hit : '',
		guardGain ? '护盾 +' + guardGain : '',
		shieldBroken ? '破盾' : '',
		comboCount ? '合成 ' + comboCount + ' 项' : '',
		loss ? '耐力 −' + loss : '',
		blocked ? '挡下 ' + blocked : '',
	]
	return changes.filter(Boolean).join(' · ')
}

function turnControls(intent, down) {
	const damage = intent.damage ?? 0
	const incoming = Math.max(0, damage - state.player.block)
	const forecast = incoming ? '预计受伤 ' + incoming : damage ? '可全挡攻击' : '本轮无攻击'
	const mightPlay = state.hand.some((card) => card.energy <= state.player.currentEnergy)
	return `<div class="turn-controls">
		${!down ? `<span class="turn-forecast ${incoming ? 'exposed' : 'covered'}">${forecast}</span>` : ''}
		${btn('end', '结束回合', mightPlay ? 'turn-button' : 'primary')}
	</div>`
}

function battle() {
	const {id, y} = nodeAt(state)
	const foe = foes[id]
	const place = waypoints[id]
	const enemy = enemyAt(state)
	const intent = intentFor(state)
	const base = enemy.intents[enemy.nextIntent]
	const changed = intent.damage > base.damage
	const notes = [
		`<b class="${changed ? 'warn' : ''}">${intent.damage} 伤害${changed ? ` <small>+${intent.damage - base.damage}</small>` : ''}</b>`,
		intent.block ? `<b>${intent.block} 护盾</b>` : '',
		intent.energyLoss ? '<b class="warn">下回合 −1 行动</b>' : '',
		intent.drawLoss ? '<b class="warn">下回合 −1 抽牌</b>' : '',
	].join('')
	const down = enemy.currentHealth <= 0
	const {loss, blocked, guardGain} = feedback
	const steps = trail.length - 1
	const pips = Array.from({length: steps}, (_, i) =>
		`<i class="${i + 1 < y ? 'passed' : i + 1 === y ? 'current' : ''}"></i>`).join('')
	const recent = supplyFeedback()
	return `<section class="arena encounter-${id} ${down ? 'foe-down' : ''}" aria-label="对战">
		<header class="encounter-header">
			<div><p class="eyebrow encounter-position">第 ${y} / ${steps} 站 <span class="trail-pips" aria-hidden="true">${pips}</span></p><strong>${place.name}</strong></div>
			<span class="round-state">第 ${state.round} 回合 <b>${down ? '战斗结束' : '你的回合'}</b></span>
		</header>
		<div class="battlefield">
			<div class="fighter player-side">
				<p class="fighter-name">营地旅人</p>
				<div class="fighter-art ${loss ? 'struck' : ''} ${state.player.block ? 'guarded' : ''}">
					${portrait('player')}
					${loss ? `<span class="hit" aria-hidden="true">−${loss}</span>` : ''}
					${blocked ? `<span class="hit guard-hit" aria-hidden="true">挡下 ${blocked}</span>` : ''}
					${guardGain ? `<span class="hit guard-hit" aria-hidden="true">护盾 +${guardGain}</span>` : ''}
				</div>
				<div class="vitals">${vitality(state.player, '玩家', feedback.playerBefore)}</div>
			</div>
			<div class="fighter enemy-side">
				<h1 class="fighter-name">${foe.name}</h1>
				<div class="intent"><span class="intent-name">${intent.label}</span>${notes}
					${hint('hint-foe', '机制', foe.rule)}</div>
				<div class="fighter-art ${state.hit ? 'struck' : ''}">
					${portrait(id, foe.image)}
					${state.hit ? `<span class="hit ${state.combined ? 'combo-hit' : ''}" aria-hidden="true">−${state.hit}</span>` : ''}
				</div>
				<div class="enemy-health">${vitality(enemy, foe.name, feedback.foeBefore)}</div>
			</div>
		</div>
		<p class="encounter-story">${place.enter}</p>
	</section>
	<div class="inventory-frame">${tableView()}
	<section class="hand-panel">
		<div class="hand-header">${energyView()}<div class="pile-info"><h2>手牌</h2>
			<small>抽牌 ${state.drawPile.length} · 弃牌 ${state.discardPile.length}${state.exhaustPile.length ? ` · 消耗 ${state.exhaustPile.length}` : ''}</small>
			<small class="pocket-vitals">耐力 ${state.player.currentHealth} · 护盾 ${state.player.block}${state.table.cards.length ? ` · 桌上 ${state.table.cards.length} 张` : ''}</small></div>
			${turnControls(intent, down)}
			${recent ? `<small class="hand-feedback">${recent}</small>` : ''}
		</div>
		<div class="hand">${state.hand.map((card) => {
			const food = foodOf(card)
			const disabled = card.energy > state.player.currentEnergy
			return cardView(food, {action: 'play', card, disabled, ready: disabled || down ? [] : recipesForPlay(state.table, food)})
		}).join('') || '<p>手牌已打完，可以结束回合。</p>'}</div>
	</section></div>`
}

function intro() {
	return `<section class="hero">
		<div class="hero-copy"><p class="eyebrow">炊火营地 · 膳食卡牌远征</p>
		<h1>方块食堂</h1>
		<p class="hero-hook">“If it’s not in Minecraft, don’t eat it.”</p>
		<p class="hero-text">营地今晚还没开饭。带上食材牌，闯过集市和矿道，把一套能搭得起来的晚餐带回炉火边。</p>
		<div class="hero-actions">${btn('travel', '开局 · 对战零食史莱姆', 'primary', 'market')}
			${hint('hint-how', '玩法', '点手牌可以出牌，每回合补满行动并抽牌。\n同回合打出搭配的食材，自动合成配方。\n对手会预告下一步，再根据你出了什么牌调整。')}</div></div>
		<div class="hero-media" aria-hidden="true">
			<div class="hero-traveler">${portrait('player')}${icon('campfire', 'hero-fire')}</div>
			<div class="hero-rations">${icon('baked_potato')}${icon('cooked_salmon')}${icon('carrot')}</div>
		</div>
	</section>`
}

function reality(id) {
	const foe = foes[id]
	const [link, url] = sources[foe.source]
	return `<aside class="field-note"><span>回到现实</span><p>${foe.note}</p><a href="${url}" target="_blank" rel="noreferrer">${link}</a></aside>`
}

function rewards() {
	const {id} = nodeAt(state)
	return `<section class="interlude"><p class="eyebrow">${waypoints[id].name} · 补给箱</p><h1>挑一张带走</h1>
		<p>${waypoints[id].clear}</p>
		<div class="hand reward-hand">${state.rewards.map((key) => cardView(foodById[key], {action: 'reward'})).join('')}</div>
		${btn('reward', '跳过奖励', 'quiet')}
		${reality(id)}</section>`
}

function journeyMap() {
	const current = nodeAt(state).id
	const available = accessibleNodes(state).map((node) => node.id)
	return `<ol class="journey-map" aria-label="远征路线">${trail.map((floor, y) => {
		const record = state.dungeon.pathTaken.find(([_x, visitedFloor]) => visitedFloor === y)
		return `<li><span class="map-stop">${y ? '第 ' + y + ' 站' : '出发'}</span>
			<div class="map-nodes">${floor.map((node, x) => {
				const status = node.id === current ? 'current' : record?.[0] === x ? 'visited' : available.includes(node.id) ? 'available' : ''
				return `<span class="map-node ${status}" ${status === 'current' ? 'aria-current="step"' : ''}>
					${icon(foes[node.id]?.image ?? (node.id === 'camp' ? 'campfire' : 'crafting_table_top'))}
					${waypoints[node.id].name}<small>${{current: '当前', visited: '已走过', available: '下一站可选'}[status] ?? ''}</small></span>`
			}).join('')}</div></li>`
	}).join('')}</ol>`
}

function route() {
	const previous = waypoints[nodeAt(state).id]
	return `<section class="interlude route-screen"><p class="eyebrow">${previous.name} · 耐力 ${state.player.currentHealth} / ${state.player.maxHealth}</p><h1>下一站</h1>
		<div class="route-layout"><div class="choices">${accessibleNodes(state).map((node) => {
			const foe = foes[node.id]
			return btn('travel', `${icon(foe?.image ?? 'campfire')}<strong>${foe?.name ?? node.name}</strong>
				<span>${foe?.track ?? '恢复耐力或升级一张牌'}</span><small>${waypoints[node.id].name}</small>`, 'choice', node.id)
		}).join('')}</div>${journeyMap()}</div></section>`
}

function camp() {
	return `<section class="interlude"><p class="eyebrow">第 4 站</p><h1>篝火补给</h1>
		<p>恢复耐力，或升级一张伤害牌 / 护盾牌。二选一。</p>
		${btn('rest', '休息 · 恢复 22 点耐力', 'primary')}
		<div class="hand reward-hand">${state.deck.filter((card) => !card.upgraded && (card.damage || card.block))
			.map((card) => cardView(foodOf(card), {card, action: 'upgrade'})).join('')}</div></section>`
}

function finalScreen() {
	const win = state.phase === 'win'
	return `<section class="interlude"><p class="eyebrow">${win ? '闯关成功' : '耐力耗尽'}</p>
		<h1>${win ? '晚餐带回来了' : '回营地再备一餐'}</h1>
		<p>${win ? waypoints.boss.clear : `${waypoints[nodeAt(state).id].name}的路还没打通。回去换一份食材再出发。`}</p>
		<p>这趟完成了 ${state.crafted} 次配方，过了 ${state.learned.length} 场对战。</p>
		${btn('restart', '再来一局', 'primary')}
		${win ? reality('boss') : ''}</section>`
}

const views = {intro, fight: battle, reward: rewards, route, camp, win: finalScreen, lost: finalScreen}

function render(phase = state.phase) {
	hints.close()
	app.innerHTML = views[phase]()
}

function openBook(tab) {
	const pages = {
		recipes: ['配方册', `<p>同一回合内，每条配方最多触发一次。不同配方可以叠加。</p>
			<ol class="recipe-list">${recipes.map((recipe) =>
				`<li><strong>${recipe.name}</strong><span>${recipe.text}</span><small>${recipe.result}</small></li>`).join('')}</ol>`],
		map: ['补给路线', journeyMap()],
		deck: ['牌库 · ' + state.deck.length + ' 张', `<div class="hand book-deck">${state.deck
			.map((card) => cardView(foodOf(card), {card})).join('')}</div>`],
		sources: ['科普与素材来源', `<p>卡牌数值、敌人和配方为游戏规则。通关代表完成挑战，现实中的风险与健康管理需按专业科普资料理解。</p>
			<ul class="source-list">${Object.values(sources).map(([name, url]) =>
				`<li><a href="${url}" target="_blank" rel="noreferrer">${name}</a></li>`).join('')}
				<li><a href="https://github.com/oskarrough/slaytheweb" target="_blank" rel="noreferrer">Slay the Web · 战斗与牌堆引擎（AGPL-3.0-or-later）</a></li>
				<li><a href="https://github.com/PrismarineJS/minecraft-assets" target="_blank" rel="noreferrer">PrismarineJS · Minecraft Java 1.21.4 贴图存档</a></li>
				<li><a href="https://www.minecraft.net/en-us/usage-guidelines" target="_blank" rel="noreferrer">Minecraft · 使用指南</a></li></ul>`],
	}
	const page = pages[tab]
	if (!page) return
	title.textContent = page[0]
	bookBody.innerHTML = page[1]
	if (!dialog.open) dialog.showModal()
}

function focusNewScreen() {
	window.scrollTo(0, 0)
	const heading = app.querySelector('h1')
	heading?.setAttribute('tabindex', '-1')
	heading?.focus({preventScroll: true})
}

function animatePlayedCard(flight) {
	const slot = app.querySelector('.played-card:last-of-type')
	if (slot) slot.parentElement.scrollLeft = slot.parentElement.scrollWidth
	flyToTable(flight, slot)
}

function present(next, action, flight) {
	const previous = state
	state = next
	feedback = {}
	if (action === 'play') {
		const foeBefore = enemyAt(previous)
		feedback.foeBefore = foeBefore.currentHealth
		feedback.guardGain = Math.max(0, state.player.block - previous.player.block)
		feedback.shieldBroken = foeBefore.block > 0 && enemyAt(state).block === 0
		feedback.comboCount = state.table.recipes.length - previous.table.recipes.length
		announcer.textContent = [
			state.message,
			state.hit ? '对手耐力减少 ' + state.hit : '',
			feedback.guardGain ? '你的护盾增加 ' + feedback.guardGain : '',
		].filter(Boolean).join('。')
	} else if (action === 'end') {
		feedback.playerBefore = previous.player.currentHealth
		feedback.loss = Math.max(0, previous.player.currentHealth - state.player.currentHealth)
		feedback.blocked = Math.min(previous.player.block, intentFor(previous).damage)
		announcer.textContent = state.phase === 'lost' ? '耐力耗尽。' : state.message + '第 ' + state.round + ' 回合。'
	} else {
		announcer.textContent = ''
	}

	if (flight && previous.phase === 'fight' && (state.phase === 'reward' || state.phase === 'win')) {
		locked = true
		render('fight')
		app.querySelector('.hand-panel').inert = true
		animatePlayedCard(flight)
		window.setTimeout(() => {
			locked = false
			render()
			focusNewScreen()
		}, 460)
		return
	}
	render()
	if (previous.phase !== state.phase) {
		focusNewScreen()
		return
	}
	if (action === 'play') {
		animatePlayedCard(flight)
		const nextControl = app.querySelector('.hand [data-action="play"]:not([aria-disabled="true"])')
			?? app.querySelector('[data-action="end"]')
		nextControl?.focus({preventScroll: true})
	}
	if (action === 'end') app.querySelector('[data-action="end"]')?.focus({preventScroll: true})
}

function animateEnemyTurn(next) {
	if (reducedMotion()) {
		present(next, 'end')
		return
	}
	locked = true
	hints.close()
	app.querySelector('.arena').classList.add('enemy-turn')
	app.querySelector('.round-state b').textContent = '对手行动'
	const forecast = app.querySelector('.turn-forecast')
	if (forecast) {
		forecast.textContent = '正在结算'
		forecast.classList.remove('covered', 'exposed')
	}
	announcer.textContent = '对手行动。'
	app.querySelector('.hand-panel').inert = true
	window.setTimeout(() => {
		locked = false
		present(next, 'end')
	}, 290)
}

document.addEventListener('click', (event) => {
	const book = event.target.closest('[data-book]')
	if (book) openBook(book.dataset.book)
	const button = event.target.closest('[data-action]')
	if (!button || locked || button.getAttribute('aria-disabled') === 'true') return
	const {action, id} = button.dataset
	const transitions = {
		travel: () => travel(state, id), play: () => playFood(state, id),
		end: () => finishTurn(state), reward: () => takeReward(state, id),
		rest: () => campChoice(state, 'rest'), upgrade: () => campChoice(state, 'upgrade', id),
		restart: newFoodRun,
	}
	const next = transitions[action]?.()
	if (!next || next === state) return
	if (action === 'end') animateEnemyTurn(next)
	else present(next, action, action === 'play' ? cardInMotion(button) : null)
})

dialog.addEventListener('click', (event) => {
	if (event.target === dialog) dialog.close()
})

render()
