export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function cardInMotion(button) {
	if (reducedMotion()) return null
	const rect = button.getBoundingClientRect()
	if (!rect.width || !rect.height) return null
	const ghost = document.createElement('div')
	ghost.className = button.className + ' flying-card'
	ghost.innerHTML = button.innerHTML
	ghost.setAttribute('aria-hidden', 'true')
	Object.assign(ghost.style, {
		left: rect.left + 'px',
		top: rect.top + 'px',
		width: rect.width + 'px',
		height: rect.height + 'px',
	})
	return {ghost, rect}
}

export function flyToTable(flight, slot) {
	if (!flight || !slot) return
	const {ghost, rect} = flight
	const to = slot.getBoundingClientRect()
	if (!to.width) return
	const visibleSlot = to.top >= 0 && to.bottom <= window.innerHeight
	const dx = to.left + to.width / 2 - (rect.left + rect.width / 2)
	const dy = to.top + to.height / 2 - (rect.top + rect.height / 2)
	const scale = Math.min(to.width / rect.width, to.height / rect.height)
	const transform = (x, y, s, rotation) => `translate(${x}px,${y}px) scale(${s}) rotate(${rotation}deg)`
	// The previous card is already on the table after a rapid second play.
	document.querySelector('.flying-card')?.remove()
	document.body.append(ghost)
	const start = {transform: transform(0, 0, 1, 0), opacity: 1}
	const frames = visibleSlot ? [
		start,
		{transform: transform(dx * 0.08, -10, 1.03, -3), opacity: 1, offset: 0.26},
		{transform: transform(dx, dy, scale, 0), opacity: 0.75, offset: 0.86},
		{transform: transform(dx, dy, scale, 0), opacity: 0},
	] : [start, {transform: transform(0, -26, 0.84, -3), opacity: 0}]
	const motion = ghost.animate(frames, {duration: visibleSlot ? 310 : 175, easing: 'ease-out'})
	if (visibleSlot) {
		slot.animate([
			{opacity: 0.2, offset: 0},
			{opacity: 0.2, offset: 0.7},
			{opacity: 1, transform: 'scale(.96)', offset: 0.88},
			{opacity: 1, transform: 'scale(1)'},
		], {duration: 330})
	}
	motion.finished.then(() => ghost.remove(), () => ghost.remove())
}
