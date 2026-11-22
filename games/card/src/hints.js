export function setupHints(panel) {
	let active = null
	let pinned = false
	let dismissed = null
	let leaveTimer

	const rootOf = (element) => element instanceof Element ? element.closest('[data-hint]') : null

	function close() {
		clearTimeout(leaveTimer)
		active?.querySelector('[data-hint-toggle]')?.setAttribute('aria-expanded', 'false')
		panel.hidden = true
		active = null
		pinned = false
	}

	function position() {
		if (!active) return
		const anchor = active.getBoundingClientRect()
		const width = document.documentElement.clientWidth
		const height = document.documentElement.clientHeight
		if (!active.isConnected || anchor.bottom < 0 || anchor.top > height) {
			close()
			return
		}
		const gap = 8
		const left = Math.max(gap, Math.min(anchor.left, width - panel.offsetWidth - gap))
		const above = anchor.top - panel.offsetHeight - gap
		const below = anchor.bottom + gap
		const top = above >= gap
			? above
			: Math.max(gap, Math.min(below, height - panel.offsetHeight - gap))
		panel.style.left = left + 'px'
		panel.style.top = top + 'px'
	}

	function open(root, pin = false) {
		clearTimeout(leaveTimer)
		if (!pin && (root === dismissed || pinned)) return
		if (active !== root) {
			const content = document.getElementById(root.dataset.hint)
			if (!content) return
			close()
			active = root
			panel.textContent = content.textContent
			panel.hidden = false
		}
		pinned = pin
		root.querySelector('[data-hint-toggle]')?.setAttribute('aria-expanded', 'true')
		position()
	}

	function leave(root) {
		if (dismissed === root) dismissed = null
		if (active !== root || pinned || root.querySelector(':focus-visible')) return
		clearTimeout(leaveTimer)
		// Give the pointer time to cross the gap between the trigger and the hint.
		leaveTimer = setTimeout(close, 170)
	}

	document.addEventListener('pointerover', (event) => {
		if (event.pointerType !== 'mouse') return
		if (panel.contains(event.target)) {
			clearTimeout(leaveTimer)
			return
		}
		const root = rootOf(event.target)
		if (root && !root.contains(event.relatedTarget)) {
			dismissed = null
			open(root)
		}
	})

	document.addEventListener('pointerout', (event) => {
		if (event.pointerType !== 'mouse') return
		const root = panel.contains(event.target) ? active : rootOf(event.target)
		if (root && !root.contains(event.relatedTarget) && !panel.contains(event.relatedTarget)) leave(root)
	})

	document.addEventListener('focusin', (event) => {
		const root = rootOf(event.target)
		if (root && event.target.matches(':focus-visible')) {
			dismissed = null
			open(root)
		}
	})

	document.addEventListener('focusout', (event) => {
		const root = rootOf(event.target)
		if (!root || root.contains(event.relatedTarget)) return
		if (dismissed === root) dismissed = null
		if (root === active && !pinned && !root.matches(':hover')) close()
	})

	document.addEventListener('click', (event) => {
		const toggle = event.target.closest('[data-hint-toggle]')
		if (toggle) {
			const root = rootOf(toggle)
			if (active === root && pinned) {
				dismissed = root
				close()
			} else {
				dismissed = null
				open(root, true)
			}
		} else if (active && !panel.contains(event.target) && rootOf(event.target) !== active) {
			close()
		}
	})

	document.addEventListener('keydown', (event) => {
		if (event.key !== 'Escape' || !active) return
		dismissed = active
		close()
	})

	window.addEventListener('resize', position)
	window.addEventListener('scroll', position, {capture: true, passive: true})
	return {close}
}
