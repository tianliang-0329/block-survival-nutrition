const scores = {
	camp: {bpm: 102, melody: [67, 71, 74, 0, 76, 74, 71, 69, 65, 69, 72, 0, 74, 72, 69, 67], roots: [43, 45, 41, 43]},
	fight: {bpm: 126, melody: [62, 0, 65, 69, 67, 65, 62, 0, 60, 64, 67, 0, 69, 67, 64, 60], roots: [38, 46, 36, 45], drums: true},
	boss: {bpm: 144, melody: [62, 65, 63, 62, 57, 0, 62, 58, 60, 63, 60, 0, 61, 64, 67, 64], roots: [38, 34, 36, 37], drums: true},
	bossLate: {bpm: 154, melody: [74, 0, 69, 74, 75, 72, 69, 0, 69, 70, 72, 67, 74, 70, 69, 65], roots: [38, 34, 36, 37], drums: true},
	win: {bpm: 112, melody: [67, 72, 76, 79, 0, 76, 74, 72], roots: [48, 53, 55, 48]},
	lost: {bpm: 82, melody: [69, 0, 65, 0, 64, 62, 0, 57], roots: [45, 41, 38, 45]},
}
const effects = {
	play: [60, 67], recipe: [60, 64, 67, 76], tactic: [52, 64], interrupt: [65, 60, 48],
	enemy: [46, 42], reward: [65, 69, 72], travel: [62, 69],
}
const hz = (note) => 440 * 2 ** ((note - 69) / 12)

function makeLoop(ctx, score) {
	const rate = 22050
	const step = 30 / score.bpm
	const buffer = ctx.createBuffer(1, Math.round(32 * step * rate), rate)
	const samples = buffer.getChannelData(0)
	function voice(index, frequency, duration, volume, color) {
		const start = Math.round(index * step * rate)
		const length = Math.round(duration * rate)
		for (let i = 0; i < length; i++) {
			const t = i / rate
			const phase = 2 * Math.PI * frequency * t
			const envelope = Math.min(1, t / .009) * (1 - i / length) ** 2
			samples[(start + i) % samples.length] += volume * envelope * (Math.sin(phase) + color * Math.sin(2 * phase))
		}
	}
	for (let i = 0; i < 32; i++) {
		const root = score.roots[Math.floor(i / 8) % score.roots.length]
		const melody = score.melody[i % score.melody.length]
		if (melody) voice(i, hz(melody), step * 1.8, .21, .38)
		if (i % 2 === 0) voice(i, hz(root), step * 2, .24, .21)
		if (i % 8 === 0) voice(i, hz(root + 19), step * 6, .115, .2)
		if (score.drums && i % 4 === 0) voice(i, 57, .12, .23, .2)
		if (score.drums && i % 4 === 2) voice(i, 147, .064, .085, .6)
	}
	return buffer
}

export class CanteenSound {
	constructor(button) {
		this.button = button
		this.enabled = true
		this.buffers = new Map()
		try { this.enabled = localStorage.getItem('canteen-sound') !== 'off' } catch {}
		this.updateButton()
		document.addEventListener('visibilitychange', () => {
			if (!this.ctx) return
			const operation = document.hidden ? this.ctx.suspend() : this.ctx.resume()
			operation.catch(() => {})
		})
	}
	updateButton() {
		this.button.textContent = this.enabled ? this.ctx ? '音乐开' : '播放音乐' : '音乐关'
		this.button.setAttribute('aria-pressed', String(this.enabled))
	}
	toggle() {
		// The first click should start the soundtrack, not mute it.
		if (!this.ctx && this.enabled) { this.unlock(); return }
		this.enabled = !this.enabled
		try { localStorage.setItem('canteen-sound', this.enabled ? 'on' : 'off') } catch {}
		this.updateButton()
		if (this.enabled) this.unlock()
		if (this.music) this.music.gain.setTargetAtTime(this.enabled ? .76 : 0, this.ctx.currentTime, .06)
	}
	unlock() {
		try {
			if (!this.ctx) {
				const Context = window.AudioContext || window.webkitAudioContext
				if (!Context) {
					this.button.textContent = '音乐不可用'
					this.button.disabled = true
					return
				}
				this.ctx = new Context()
				this.master = this.ctx.createGain()
				this.music = this.ctx.createGain()
				this.effects = this.ctx.createGain()
				this.master.gain.value = .65
				this.music.gain.value = this.enabled ? .76 : 0
				this.effects.gain.value = .68
				this.music.connect(this.master)
				this.effects.connect(this.master)
				this.master.connect(this.ctx.destination)
			}
			this.ctx.resume().catch(() => {})
			this.setScene(this.wanted || 'camp')
			this.updateButton()
		} catch {}
	}
	setScene(track) {
		this.wanted = track
		if (!this.ctx || this.track === track) return
		const {ctx, music} = this
		if (!this.buffers.has(track)) this.buffers.set(track, makeLoop(ctx, scores[track]))
		const source = ctx.createBufferSource()
		const channel = ctx.createGain()
		source.buffer = this.buffers.get(track)
		source.loop = true
		const now = ctx.currentTime
		channel.gain.value = 0
		source.connect(channel).connect(music)
		source.start()
		channel.gain.linearRampToValueAtTime(.78, now + .28)
		source.onended = () => { source.disconnect(); channel.disconnect() }
		if (this.current) {
			this.current.channel.gain.setTargetAtTime(0, now, .06)
			this.current.source.stop(now + .3)
		}
		this.current = {source, channel}
		this.track = track
	}
	effect(action) {
		if (!this.ctx || this.ctx.state !== 'running') return
		for (const [i, midi] of (effects[action] || []).entries()) {
			const start = this.ctx.currentTime + .055 * i
			const tone = this.ctx.createOscillator()
			const gain = this.ctx.createGain()
			tone.type = 'triangle'
			tone.frequency.value = hz(midi)
			gain.gain.setValueAtTime(0, start)
			gain.gain.linearRampToValueAtTime(.18, start + .012)
			gain.gain.exponentialRampToValueAtTime(.001, start + .18)
			tone.connect(gain).connect(this.effects)
			tone.start(start)
			tone.stop(start + .19)
			tone.onended = () => { tone.disconnect(); gain.disconnect() }
		}
	}
}
