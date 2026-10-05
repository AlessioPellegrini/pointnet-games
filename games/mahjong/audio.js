/* ============================================================
   MAHJONG ARCADE — audio.js
   Background music player (playlist in assets/music/).
   - Sequential playlist, loops back to the first on the end.
   - Avvio su interazione utente (PLAY splash / prima interazione).
   - Toggle 🔊/🔇 con volume e mute salvati in localStorage.
   ============================================================ */
'use strict';

var AUDIO_PLAYLIST_ARCADE = [
	{ src: 'assets/music/zen-remix-main-arcade-melody.mp3', title: 'Zen Remix Main Arcade Melody' },
	{ src: 'assets/music/zen-arcade.mp3', title: 'Zen Arcade' },
	{ src: 'assets/music/mahjong-zen-secondary-theme.mp3', title: 'Mahjong Zen (Secondary Theme)' },
	{ src: 'assets/music/mahjong-zen-secondary-theme-safri-duo.mp3', title: 'Mahjong Zen (Tribute to Safri Duo)' },
	{ src: 'assets/music/mahjong-synco-mashup.mp3', title: 'Mahjong Synco (Mashup)' },
	{ src: 'assets/music/bamboo-shadows.mp3', title: 'Bamboo Shadows' },
	{ src: 'assets/music/bamboo-shadows-remix.mp3', title: 'Bamboo Shadows (Remix)' }
];

/* Playlist for Classic Mode challenges (files in assets/music/classic/) */
var AUDIO_PLAYLIST_CLASSIC = [
	{ src: 'assets/music/classic/zen-classic-arcade-main-theme.mp3', title: 'Zen Classic (Main Theme)' }
];

var AUDIO_PLAYLIST = AUDIO_PLAYLIST_ARCADE;

var audioState = {
	sfxMuted: false,
	currentMode: 'arcade',
	initDone: false
};

var AUDIO_STORE_KEY = 'wp_mahjong_arcade_audio';

function loadSfxPrefs() {
	try {
		var raw = localStorage.getItem(AUDIO_STORE_KEY);
		if (raw) {
			var p = JSON.parse(raw);
			if (p && typeof p.sfxMuted === 'boolean') audioState.sfxMuted = p.sfxMuted;
		}
	} catch (e) {}
}

function saveSfxPrefs() {
	try {
		var raw = localStorage.getItem(AUDIO_STORE_KEY);
		var data = raw ? JSON.parse(raw) : {};
		data.sfxMuted = audioState.sfxMuted;
		localStorage.setItem(AUDIO_STORE_KEY, JSON.stringify(data));
	} catch (e) {}
}

function initAudio() {
	if (audioState.initDone) return;
	audioState.initDone = true;
	loadSfxPrefs();

	if (typeof PointNetMusicPlayer === 'function' && !window.pointnetMusicPlayer) {
		window.pointnetMusicPlayer = new PointNetMusicPlayer({
			storageKey: AUDIO_STORE_KEY,
			playlist: AUDIO_PLAYLIST,
			fallbackPlaylist: AUDIO_PLAYLIST_ARCADE,
			onStateChange: function () {
				updateSfxButtons();
			}
		});
	}
	updateAudioButtons();
}

function playMusic() {
	if (!audioState.initDone) initAudio();
	if (window.pointnetMusicPlayer) window.pointnetMusicPlayer.play();
}

function pauseMusic() {
	if (window.pointnetMusicPlayer) window.pointnetMusicPlayer.pause();
}

function toggleMusic() {
	if (!audioState.initDone) initAudio();
	if (window.pointnetMusicPlayer) window.pointnetMusicPlayer.togglePlay();
}

function setMusicMode(mode) {
	if (!mode) mode = 'arcade';
	var targetList = (mode === 'classic') ? AUDIO_PLAYLIST_CLASSIC : AUDIO_PLAYLIST_ARCADE;
	AUDIO_PLAYLIST = targetList;

	if (!audioState.initDone) initAudio();
	if (window.pointnetMusicPlayer) {
		window.pointnetMusicPlayer.fallbackPlaylist = AUDIO_PLAYLIST_ARCADE;
		if (audioState.currentMode !== mode || window.pointnetMusicPlayer.playlist !== targetList) {
			audioState.currentMode = mode;
			window.pointnetMusicPlayer.setPlaylist(targetList, window.pointnetMusicPlayer.playing);
		}
	} else {
		audioState.currentMode = mode;
	}
}

function playTrackIndex(idx) {
	if (!audioState.initDone) initAudio();
	if (window.pointnetMusicPlayer) window.pointnetMusicPlayer.playIndex(idx);
}

function nextTrack() {
	if (window.pointnetMusicPlayer) window.pointnetMusicPlayer.next();
}

function prevTrack() {
	if (window.pointnetMusicPlayer) window.pointnetMusicPlayer.prev();
}

function randomTrack() {
	if (window.pointnetMusicPlayer) window.pointnetMusicPlayer.random();
}

function setMusicVolume(val) {
	if (window.pointnetMusicPlayer) window.pointnetMusicPlayer.setVolume(val);
}

function toggleSfx() {
	if (!audioState.initDone) initAudio();
	audioState.sfxMuted = !audioState.sfxMuted;
	saveSfxPrefs();
	updateAudioButtons();
	if (!audioState.sfxMuted) {
		playSfx('click');
	}
}

/* ============================================================
   PROCEDURAL SFX ENGINE (Web Audio API)
   Zero external asset dependencies, 0ms latency, pitch-dynamic.
   ============================================================ */
var sfxCtx = null;

function getSfxContext() {
	if (!sfxCtx && typeof window !== 'undefined') {
		var AC = window.AudioContext || window.webkitAudioContext;
		if (AC) sfxCtx = new AC();
	}
	if (sfxCtx && sfxCtx.state === 'suspended') {
		sfxCtx.resume().catch(function () {});
	}
	return sfxCtx;
}

function playSfx(type, param) {
	if (audioState.sfxMuted) return;
	var ac = getSfxContext();
	if (!ac) return;

	var t = ac.currentTime;

	if (type === 'click' || type === 'lift') {
		/* ----------------------------------------------------------
		   NATURAL BAMBOO TAP (Shishi-odoshi / Hollow Bamboo Knock)
		   Dual resonance + wood transient, soft & unobtrusive.
		   ---------------------------------------------------------- */
		var osc1 = ac.createOscillator();
		var osc2 = ac.createOscillator();
		var gain = ac.createGain();

		osc1.type = 'triangle';
		osc2.type = 'sine';
		/* Hollow bamboo body modes */
		osc1.frequency.setValueAtTime(740, t);
		osc1.frequency.exponentialRampToValueAtTime(240, t + 0.028);

		osc2.frequency.setValueAtTime(1180, t);
		osc2.frequency.exponentialRampToValueAtTime(420, t + 0.022);

		gain.gain.setValueAtTime(0.12, t);
		gain.gain.exponentialRampToValueAtTime(0.001, t + 0.032);

		osc1.connect(gain);
		osc2.connect(gain);
		gain.connect(ac.destination);

		osc1.start(t);
		osc2.start(t);
		osc1.stop(t + 0.035);
		osc2.stop(t + 0.035);
	}
	else if (type === 'match') {
		/* ----------------------------------------------------------
		   ZEN WATER DROPLET (Suikinkutsu / Water drop into ceramic bowl)
		   Upward pitch sweep bubble formant + gentle bowl resonance.
		   ---------------------------------------------------------- */
		var dropOsc = ac.createOscillator();
		var dropGain = ac.createGain();
		dropOsc.type = 'sine';

		/* Characteristic water drop upward bubble sweep */
		dropOsc.frequency.setValueAtTime(520, t);
		dropOsc.frequency.exponentialRampToValueAtTime(1480, t + 0.018);
		dropOsc.frequency.exponentialRampToValueAtTime(1420, t + 0.08);

		dropGain.gain.setValueAtTime(0.13, t);
		dropGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

		dropOsc.connect(dropGain);
		dropGain.connect(ac.destination);

		dropOsc.start(t);
		dropOsc.stop(t + 0.19);

		/* Soft lingering bowl ring */
		var bowlOsc = ac.createOscillator();
		var bowlGain = ac.createGain();
		bowlOsc.type = 'sine';
		bowlOsc.frequency.setValueAtTime(1420, t + 0.015);
		bowlGain.gain.setValueAtTime(0.05, t + 0.015);
		bowlGain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

		bowlOsc.connect(bowlGain);
		bowlGain.connect(ac.destination);

		bowlOsc.start(t + 0.015);
		bowlOsc.stop(t + 0.33);
	}
	else if (type === 'combo') {
		/* ----------------------------------------------------------
		   CASCADING WATER DROPS & PENTATONIC CHIMES
		   Higher gentle drops as combo builds up.
		   ---------------------------------------------------------- */
		var comboLevel = Math.max(2, Math.min(5, param || 2));
		var dropPitches = {
			2: { start: 600, peak: 1650 },
			3: { start: 720, peak: 1980 },
			4: { start: 850, peak: 2350 },
			5: { start: 980, peak: 2780 }
		};
		var p = dropPitches[comboLevel] || dropPitches[2];

		var osc = ac.createOscillator();
		var gain = ac.createGain();
		osc.type = 'sine';

		osc.frequency.setValueAtTime(p.start, t);
		osc.frequency.exponentialRampToValueAtTime(p.peak, t + 0.016);
		osc.frequency.exponentialRampToValueAtTime(p.peak * 0.95, t + 0.09);

		gain.gain.setValueAtTime(0.12, t);
		gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

		osc.connect(gain);
		gain.connect(ac.destination);

		osc.start(t);
		osc.stop(t + 0.23);

		/* Extra subtle water ripple for combo x4 and x5 */
		if (comboLevel >= 4) {
			var subOsc = ac.createOscillator();
			var subGain = ac.createGain();
			subOsc.type = 'sine';
			subOsc.frequency.setValueAtTime(p.peak * 1.33, t + 0.04);
			subGain.gain.setValueAtTime(0.06, t + 0.04);
			subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

			subOsc.connect(subGain);
			subGain.connect(ac.destination);

			subOsc.start(t + 0.04);
			subOsc.stop(t + 0.33);
		}
	}
	else if (type === 'shuffle') {
		/* ----------------------------------------------------------
		   GENTLE BAMBOO TILES SLIDING / WIND IN LEAVES
		   Soft low-pass filtered noise rustle.
		   ---------------------------------------------------------- */
		var bufferSize = ac.sampleRate * 0.22;
		var buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
		var data = buffer.getChannelData(0);
		for (var i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

		var noise = ac.createBufferSource();
		noise.buffer = buffer;

		var filter = ac.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.setValueAtTime(700, t);
		filter.frequency.exponentialRampToValueAtTime(1100, t + 0.09);
		filter.frequency.exponentialRampToValueAtTime(450, t + 0.22);

		var gain = ac.createGain();
		gain.gain.setValueAtTime(0.01, t);
		gain.gain.linearRampToValueAtTime(0.10, t + 0.04);
		gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

		noise.connect(filter);
		filter.connect(gain);
		gain.connect(ac.destination);

		noise.start(t);
		noise.stop(t + 0.22);
	}
	else if (type === 'deadlock' || type === 'gameover') {
		/* ----------------------------------------------------------
		   SOFT SINGING BOWL / LOW CERAMIC TONE
		   Warm, peaceful low fade.
		   ---------------------------------------------------------- */
		var lowNotes = [261.63, 196.0];
		lowNotes.forEach(function (f, idx) {
			var osc = ac.createOscillator();
			var gain = ac.createGain();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(f, t + idx * 0.08);

			gain.gain.setValueAtTime(0.09, t + idx * 0.08);
			gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.4);

			osc.connect(gain);
			gain.connect(ac.destination);
			osc.start(t + idx * 0.08);
			osc.stop(t + idx * 0.08 + 0.41);
		});
	}
	else if (type === 'victory') {
		/* ----------------------------------------------------------
		   FŪRIN WIND CHIMES (Japanese Glass & Bamboo Bell Chimes)
		   Airy, crystal pentatonic tones carried by a soft breeze.
		   ---------------------------------------------------------- */
		var chimeNotes = [587.33, 880.0, 1174.66, 1567.98]; // D5, A5, D6, G6
		chimeNotes.forEach(function (f, idx) {
			var osc = ac.createOscillator();
			var gain = ac.createGain();
			osc.type = 'sine';
			var startDelay = idx * 0.085;
			osc.frequency.setValueAtTime(f, t + startDelay);

			var dur = 0.55 + idx * 0.15;
			gain.gain.setValueAtTime(0.11, t + startDelay);
			gain.gain.exponentialRampToValueAtTime(0.001, t + startDelay + dur);

			osc.connect(gain);
			gain.connect(ac.destination);
			osc.start(t + startDelay);
			osc.stop(t + startDelay + dur + 0.01);
		});
	}
	else if (type === 'shield_deflect') {
		/* ----------------------------------------------------------
		   METALLIC ENERGY WARD DEFLECT (High-resonance Ping & Hum)
		   Sharp harmonic chime with quick damping.
		   ---------------------------------------------------------- */
		var oscA = ac.createOscillator();
		var oscB = ac.createOscillator();
		var gDeflect = ac.createGain();

		oscA.type = 'sine';
		oscB.type = 'triangle';

		oscA.frequency.setValueAtTime(987.77, t);
		oscA.frequency.exponentialRampToValueAtTime(880.0, t + 0.08);

		oscB.frequency.setValueAtTime(1760.0, t);
		oscB.frequency.exponentialRampToValueAtTime(1318.5, t + 0.06);

		gDeflect.gain.setValueAtTime(0.14, t);
		gDeflect.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

		oscA.connect(gDeflect);
		oscB.connect(gDeflect);
		gDeflect.connect(ac.destination);

		oscA.start(t);
		oscB.start(t);
		oscA.stop(t + 0.25);
		oscB.stop(t + 0.25);
	}
	else if (type === 'shield_shatter') {
		/* ----------------------------------------------------------
		   CRYSTALLINE BARRIER SHATTER (Sparkling Chimes Cascade)
		   Descending bright harmonic burst + low release boom.
		   ---------------------------------------------------------- */
		var notes = [1567.98, 1318.51, 1046.50, 783.99];
		notes.forEach(function (f, idx) {
			var osc = ac.createOscillator();
			var gShatter = ac.createGain();
			osc.type = 'sine';
			var startDelay = idx * 0.045;
			osc.frequency.setValueAtTime(f, t + startDelay);
			osc.frequency.exponentialRampToValueAtTime(f * 0.85, t + startDelay + 0.18);

			gShatter.gain.setValueAtTime(0.12, t + startDelay);
			gShatter.gain.exponentialRampToValueAtTime(0.001, t + startDelay + 0.26);

			osc.connect(gShatter);
			gShatter.connect(ac.destination);
			osc.start(t + startDelay);
			osc.stop(t + startDelay + 0.27);
		});

		var sub = ac.createOscillator();
		var subGain = ac.createGain();
		sub.type = 'triangle';
		sub.frequency.setValueAtTime(220, t);
		sub.frequency.exponentialRampToValueAtTime(110, t + 0.35);
		subGain.gain.setValueAtTime(0.10, t);
		subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
		sub.connect(subGain);
		subGain.connect(ac.destination);
		sub.start(t);
		sub.stop(t + 0.36);
	}
	else if (type === 'chain_deflect') {
		/* ----------------------------------------------------------
		   METALLIC CHAIN CLANK / DEFLECT (Heavy Iron Dull Knock)
		   Low inharmonic clank + short metallic vibration.
		   ---------------------------------------------------------- */
		var cOsc1 = ac.createOscillator();
		var cOsc2 = ac.createOscillator();
		var cGain = ac.createGain();

		cOsc1.type = 'triangle';
		cOsc2.type = 'square';

		cOsc1.frequency.setValueAtTime(260, t);
		cOsc1.frequency.exponentialRampToValueAtTime(110, t + 0.12);

		cOsc2.frequency.setValueAtTime(415, t);
		cOsc2.frequency.exponentialRampToValueAtTime(180, t + 0.08);

		cGain.gain.setValueAtTime(0.18, t);
		cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

		cOsc1.connect(cGain);
		cOsc2.connect(cGain);
		cGain.connect(ac.destination);

		cOsc1.start(t);
		cOsc2.start(t);
		cOsc1.stop(t + 0.23);
		cOsc2.stop(t + 0.23);
	}
	else if (type === 'chain_rattle') {
		/* ----------------------------------------------------------
		   CHAIN LINKS RATTLE (Jangling Iron Links)
		   Rapid staggered high metallic clicks with bandpass filter.
		   ---------------------------------------------------------- */
		var rattlePitches = [720, 880, 620, 950, 780];
		rattlePitches.forEach(function (freq, idx) {
			var rOsc = ac.createOscillator();
			var rGain = ac.createGain();
			var rDelay = idx * 0.032;

			rOsc.type = 'triangle';
			rOsc.frequency.setValueAtTime(freq, t + rDelay);
			rOsc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + rDelay + 0.06);

			rGain.gain.setValueAtTime(0.08, t + rDelay);
			rGain.gain.exponentialRampToValueAtTime(0.001, t + rDelay + 0.07);

			rOsc.connect(rGain);
			rGain.connect(ac.destination);
			rOsc.start(t + rDelay);
			rOsc.stop(t + rDelay + 0.08);
		});
	}
	else if (type === 'chain_unlock') {
		/* ----------------------------------------------------------
		   PADLOCK SPRING SNAP & HEAVY CHAIN RELEASE
		   Crisp lock tumblers snap (2 clicks) + sliding heavy chains.
		   ---------------------------------------------------------- */
		[0, 0.045].forEach(function (dt) {
			var clickOsc = ac.createOscillator();
			var clickGain = ac.createGain();
			clickOsc.type = 'square';
			clickOsc.frequency.setValueAtTime(1800, t + dt);
			clickOsc.frequency.exponentialRampToValueAtTime(400, t + dt + 0.025);
			clickGain.gain.setValueAtTime(0.16, t + dt);
			clickGain.gain.exponentialRampToValueAtTime(0.001, t + dt + 0.03);
			clickOsc.connect(clickGain);
			clickGain.connect(ac.destination);
			clickOsc.start(t + dt);
			clickOsc.stop(t + dt + 0.035);
		});

		var slideNotes = [980, 784, 659, 523, 392];
		slideNotes.forEach(function (f, idx) {
			var sOsc = ac.createOscillator();
			var sGain = ac.createGain();
			var sDelay = 0.06 + idx * 0.035;

			sOsc.type = 'triangle';
			sOsc.frequency.setValueAtTime(f, t + sDelay);
			sOsc.frequency.exponentialRampToValueAtTime(f * 0.8, t + sDelay + 0.12);

			sGain.gain.setValueAtTime(0.12, t + sDelay);
			sGain.gain.exponentialRampToValueAtTime(0.001, t + sDelay + 0.14);

			sOsc.connect(sGain);
			sGain.connect(ac.destination);
			sOsc.start(t + sDelay);
			sOsc.stop(t + sDelay + 0.15);
		});
	}
}

function updateSfxButtons() {
	var isSfxMuted = audioState.sfxMuted;
	var btnSfx = document.getElementById('btn-sfx');
	if (btnSfx) {
		btnSfx.textContent = isSfxMuted ? '🔇' : '🔊';
		btnSfx.classList.toggle('muted', isSfxMuted);
		btnSfx.title = isSfxMuted ? 'Attiva effetti (Effetti: OFF)' : 'Disattiva effetti (Effetti: ON)';
	}

	var btnSfxDrawer = document.getElementById('btn-sfx-drawer');
	if (btnSfxDrawer) {
		btnSfxDrawer.textContent = isSfxMuted ? '🔇 Effetti: OFF' : '🔊 Effetti: ON';
		btnSfxDrawer.classList.toggle('active', !isSfxMuted);
	}
}

function updateAudioButtons() {
	updateSfxButtons();
	if (window.pointnetMusicPlayer) {
		window.pointnetMusicPlayer.updateUI();
	}
}

var updateMusicBtn = updateAudioButtons;

/* Event binding & auto unlock */
if (typeof document !== 'undefined') {
	function setupAudioBindings() {
		initAudio();
		var btnSfx = document.getElementById('btn-sfx');
		if (btnSfx) {
			btnSfx.onclick = function (e) {
				e.stopPropagation();
				toggleSfx();
			};
		}
		var btnSfxDrawer = document.getElementById('btn-sfx-drawer');
		if (btnSfxDrawer) {
			btnSfxDrawer.onclick = function (e) {
				e.stopPropagation();
				toggleSfx();
			};
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', setupAudioBindings);
	} else {
		setupAudioBindings();
	}

	function unlockAudioGesture() {
		if (window.pointnetMusicPlayer && !window.pointnetMusicPlayer.muted && (!window.pointnetMusicPlayer.playing || (window.pointnetMusicPlayer.audio && window.pointnetMusicPlayer.audio.paused))) {
			window.pointnetMusicPlayer.play();
		}
		if (sfxCtx && sfxCtx.state === 'suspended') {
			sfxCtx.resume().catch(function () {});
		}
		window.removeEventListener('pointerdown', unlockAudioGesture);
		window.removeEventListener('keydown', unlockAudioGesture);
	}
	window.addEventListener('pointerdown', unlockAudioGesture, { passive: true });
	window.addEventListener('keydown', unlockAudioGesture, { passive: true });
}