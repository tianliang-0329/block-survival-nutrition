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

const sampleRate = 22050

function makeLoop(score) {
	const rate = sampleRate
	const step = 30 / score.bpm
	const samples = new Float32Array(Math.round(32 * step * rate))
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
	let peak = 0
	for (const value of samples) peak = Math.max(peak, Math.abs(value))
	if (peak) for (let i = 0; i < samples.length; i++) samples[i] *= .87 / peak
	return samples
}

function wavUrl(samples) {
	const bytes = new ArrayBuffer(44 + samples.length * 2)
	const view = new DataView(bytes)
	const label = (offset, text) => {
		for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
	}
	label(0, 'RIFF')
	view.setUint32(4, bytes.byteLength - 8, true)
	label(8, 'WAVEfmt ')
	view.setUint32(16, 16, true)
	view.setUint16(20, 1, true)
	view.setUint16(22, 1, true)
	view.setUint32(24, sampleRate, true)
	view.setUint32(28, sampleRate * 2, true)
	view.setUint16(32, 2, true)
	view.setUint16(34, 16, true)
	label(36, 'data')
	view.setUint32(40, samples.length * 2, true)
	for (let i = 0; i < samples.length; i++) view.setInt16(44 + i * 2, Math.round(samples[i] * 32767), true)
	return URL.createObjectURL(new Blob([bytes], {type: 'audio/wav'}))
}

export class CanteenSound {
	constructor(button, media) {
		this.button = button
		this.media = media
		this.wanted = 'camp'
		this.enabled = true
		this.status = 'idle'
		this.revision = 0
		this.tracks = new Map()
		this.media.volume = .72
		try { this.enabled = localStorage.getItem('canteen-music-v22') !== 'off' } catch {}
		this.updateButton()
		this.media.addEventListener('playing', () => {
			if (this.enabled && !document.hidden && !this.media.paused) {
				this.stopFallback()
				this.status = 'playing'
				this.updateButton()
			}
		})
		this.media.addEventListener('pause', () => {
			if (this.status === 'playing' && !this.fallback) {
				this.status = 'idle'
				this.updateButton()
			}
		})
		document.addEventListener('visibilitychange', () => {
			if (document.hidden) {
				this.stopMusic()
				this.ctx?.suspend().catch(() => {})
			} else if (this.unlocked) {
				this.ctx?.resume().catch(() => {})
				this.playMusic()
			}
		})
	}

	updateButton() {
		const playing = this.enabled && this.status === 'playing'
		this.button.textContent = !this.enabled ? '音乐关' : playing ? '音乐开'
			: this.status === 'starting' ? '音乐加载中' : this.status === 'blocked' ? '点此重试音乐' : '播放音乐'
		this.button.setAttribute('aria-pressed', String(playing))
	}

	toggle() {
		if (this.enabled && this.status !== 'playing') { this.unlock(); return }
		this.enabled = !this.enabled
		try { localStorage.setItem('canteen-music-v22', this.enabled ? 'on' : 'off') } catch {}
		if (this.enabled) this.unlock()
		else this.stopMusic()
		this.updateButton()
	}

	initEffects() {
		if (!this.ctx) {
			const Context = window.AudioContext || window.webkitAudioContext
			if (!Context) return
			this.ctx = new Context()
			this.effects = this.ctx.createGain()
			this.effects.gain.value = .55
			this.effects.connect(this.ctx.destination)
		}
		this.resumePending = this.ctx.resume().catch(() => {})
	}

	unlock() {
		this.unlocked = true
		try { this.initEffects() } catch {}
		this.playMusic()
	}

	setScene(track) {
		if (track === this.wanted) return
		this.wanted = track
		this.playMusic()
	}

	stopFallback() {
		if (!this.fallback) return
		this.fallback.source.stop()
		this.fallback.source.disconnect()
		this.fallback.gain.disconnect()
		this.fallback = null
	}

	stopMusic() {
		this.revision++
		this.media.pause()
		this.stopFallback()
		this.status = 'idle'
		this.updateButton()
	}

	playMusic() {
		if (!this.enabled || !this.unlocked || document.hidden) return
		const track = this.wanted
		if (track === this.track && (this.status === 'starting' || this.status === 'playing')) return
		const revision = ++this.revision
		if (!this.tracks.has(track)) {
			const samples = makeLoop(scores[track])
			let url
			try { url = wavUrl(samples) } catch {}
			this.tracks.set(track, {samples, url})
		}
		const {samples, url} = this.tracks.get(track)
		this.stopFallback()
		this.status = 'starting'
		this.track = track
		this.updateButton()
		const fallback = async () => {
			if (this.ctx && this.ctx.state !== 'running' && this.resumePending) {
				await Promise.race([this.resumePending, new Promise(resolve => setTimeout(resolve, 800))])
			}
			if (revision !== this.revision || !this.enabled) return
			if (this.ctx?.state === 'running') {
				try {
					const ctx = this.ctx
					const source = ctx.createBufferSource()
					source.buffer = ctx.createBuffer(1, samples.length, sampleRate)
					source.buffer.getChannelData(0).set(samples)
					source.loop = true
					const gain = ctx.createGain()
					gain.gain.value = .68
					source.connect(gain).connect(ctx.destination)
					source.start()
					this.fallback = {source, gain}
					this.status = 'playing'
					this.updateButton()
					return
				} catch {}
			}
			this.status = 'blocked'
			this.updateButton()
		}
		if (!url) { fallback(); return }
		try {
			if (this.media.src !== url) this.media.src = url
			this.media.play()?.catch(fallback)
		} catch { fallback() }
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
