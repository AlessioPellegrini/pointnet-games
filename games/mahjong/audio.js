/* ============================================================
   MAHJONG ARCADE — audio.js
   Background music player (playlist in assets/music/).
   - Sequential playlist, loops back to the first on the end.
   - Avvio richiesto da interazione utente (PLAY) per l'autoplay policy.
   - Toggle 🔊/🔇 con volume e mute salvati in localStorage.
   Depends only on globals. Loaded LAST (after progress.js).
   ============================================================ */
'use strict';

var AUDIO_PLAYLIST = [
	{ src: 'assets/music/bamboo-shadows.mp3', title: 'Bamboo Shadows' },
	{ src: 'assets/music/bamboo-shadows-remix.mp3', title: 'Bamboo Shadows (Remix)' },
	{ src: 'assets/music/Zen arcade.mp3', title: 'Zen Arcade' }
];

var audioState = {
	player: null,
	trackIndex: 0,
	playing: false,
	muted: false,
	volume: 0.35,
	initDone: false
};

var AUDIO_STORE_KEY = 'wp_mahjong_arcade_audio';

function loadAudioPrefs() {
	try {
		var raw = localStorage.getItem(AUDIO_STORE_KEY);
		if (raw) {
			var p = JSON.parse(raw);
			if (p && typeof p.volume === 'number') audioState.volume = p.volume;
			if (p && typeof p.muted === 'boolean') audioState.muted = p.muted;
		}
	} catch (e) {}
}

function saveAudioPrefs() {
	try {
		localStorage.setItem(AUDIO_STORE_KEY, JSON.stringify({
			volume: audioState.volume,
			muted: audioState.muted
		}));
	} catch (e) {}
}

function initAudio() {
	if (audioState.initDone) return;
	audioState.initDone = true;
	loadAudioPrefs();

	audioState.player = new Audio();
	audioState.player.loop = false; /* playlist gestita a mano su 'ended' */
	audioState.player.volume = audioState.volume;
	audioState.player.addEventListener('ended', function () {
		audioState.trackIndex = (audioState.trackIndex + 1) % AUDIO_PLAYLIST.length;
		audioState.player.src = AUDIO_PLAYLIST[audioState.trackIndex].src;
		if (!audioState.muted) audioState.player.play().catch(function () {});
	});
	updateMusicBtn();
}

function playMusic() {
	if (!audioState.initDone) initAudio();
	audioState.player.src = AUDIO_PLAYLIST[audioState.trackIndex].src;
	audioState.player.volume = audioState.muted ? 0 : audioState.volume;
	audioState.playing = true;
	audioState.player.play().catch(function (e) {
		/* Se il browser blocca (autoplay prematuri) restiamo muti,
		   il toggle manuale dell'utente riprenderà. */
		audioState.playing = false;
	});
	updateMusicBtn();
}

function pauseMusic() {
	if (!audioState.player) return;
	audioState.playing = false;
	audioState.player.pause();
	updateMusicBtn();
}

function toggleMusic() {
	if (!audioState.player) initAudio();
	/* Toggle between "muted" and "with audio": never restart the track,
	   just volume 0 / the previously chosen volume. */
	audioState.muted = !audioState.muted;
	if (audioState.playing) {
		audioState.player.volume = audioState.muted ? 0 : audioState.volume;
	}
	saveAudioPrefs();
	updateMusicBtn();
}

function updateMusicBtn() {
	var btn = document.getElementById('btn-music');
	if (!btn) return;
	btn.textContent = audioState.playing && !audioState.muted ? '🔊' : '🔇';
	btn.classList.toggle('muted', audioState.muted || !audioState.playing);
}