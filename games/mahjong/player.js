/* ============================================================
   MAHJONG ARCADE — player.js (Modular PointNetMusicPlayer)
   ============================================================ */

(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	} else if (typeof module === 'object' && module.exports) {
		module.exports = factory();
	} else {
		root.PointNetMusicPlayer = factory();
	}
}(typeof self !== 'undefined' ? self : this, function () {
	'use strict';

	function formatTime(seconds) {
		if (isNaN(seconds) || seconds < 0) return '0:00';
		var mins = Math.floor(seconds / 60);
		var secs = Math.floor(seconds % 60);
		return mins + ':' + (secs < 10 ? '0' : '') + secs;
	}

	function getFullUrl(relPath) {
		if (!relPath) return '';
		try {
			var base = (typeof document !== 'undefined' && document.baseURI) || window.location.href;
			var baseClean = base.split('#')[0].split('?')[0];
			if (!baseClean.endsWith('/')) {
				baseClean = baseClean.substring(0, baseClean.lastIndexOf('/') + 1);
			}
			var cleanPath = encodeURI(decodeURI(relPath));
			return new URL(cleanPath, baseClean).href;
		} catch (e) {
			try {
				return encodeURI(decodeURI(relPath));
			} catch (err) {
				return relPath;
			}
		}
	}

	function getAlternateUrl(url) {
		if (!url) return null;
		// If URL has %20 or spaces, try slugified / dashed lowercase version
		if (url.indexOf('%20') !== -1 || url.indexOf(' ') !== -1) {
			var decoded = decodeURI(url);
			var filename = decoded.substring(decoded.lastIndexOf('/') + 1);
			var dirPath = decoded.substring(0, decoded.lastIndexOf('/') + 1);
			var altName = filename.toLowerCase().replace(/\s*\([^)]*\)/g, '').replace(/[\s_]+/g, '-').replace(/-+\./, '.');
			return getFullUrl(dirPath + altName);
		}
		return null;
	}

	function PointNetMusicPlayer(options) {
		options = options || {};
		this.storageKey = options.storageKey || 'wp_mahjong_arcade_audio';
		this.playlist = options.playlist || [];
		this.fallbackPlaylist = options.fallbackPlaylist || null;
		this.trackIndex = 0;
		this.playing = false;
		this.muted = !!options.muted;
		this.volume = (typeof options.volume === 'number') ? options.volume : 0.35;
		this.isScrubbing = false;
		this.trackDurations = {};

		this.onTrackChange = options.onTrackChange || null;
		this.onStateChange = options.onStateChange || null;

		this.loadPrefs();
		this.initAudio();

		if (options.bindElements !== false) {
			this.bindUI(options);
		}

		this.preloadDurations();
	}

	PointNetMusicPlayer.prototype.loadPrefs = function () {
		try {
			var raw = localStorage.getItem(this.storageKey);
			if (raw) {
				var p = JSON.parse(raw);
				if (p && typeof p.volume === 'number') this.volume = p.volume;
				if (p && typeof p.musicMuted === 'boolean') this.muted = p.musicMuted;
				else if (p && typeof p.muted === 'boolean') this.muted = p.muted;
			}
		} catch (e) {}
	};

	PointNetMusicPlayer.prototype.savePrefs = function () {
		try {
			var old = {};
			try {
				var raw = localStorage.getItem(this.storageKey);
				if (raw) old = JSON.parse(raw) || {};
			} catch (e) {}

			old.volume = this.volume;
			old.musicMuted = this.muted;
			localStorage.setItem(this.storageKey, JSON.stringify(old));
		} catch (e) {}
	};

	PointNetMusicPlayer.prototype.initAudio = function () {
		var self = this;
		this.audio = new Audio();
		this.audio.loop = false;
		this.audio.preload = 'auto';
		this.audio.volume = this.muted ? 0 : this.volume;

		if (this.playlist.length > 0) {
			this.audio.src = getFullUrl(this.playlist[this.trackIndex].src);
		}

		this.audio.addEventListener('loadedmetadata', function () {
			if (self.playlist[self.trackIndex]) {
				self.trackDurations[self.playlist[self.trackIndex].src] = self.audio.duration;
			}
			self.updateUI();
		});

		this.audio.addEventListener('timeupdate', function () {
			if (!self.isScrubbing) {
				self.updateProgress();
			}
		});

		this.audio.addEventListener('ended', function () {
			self.next();
		});

		this.audio.addEventListener('error', function () {
			if (!self._retriedAlt && self.playlist[self.trackIndex]) {
				var alt = getAlternateUrl(self.playlist[self.trackIndex].src);
				if (alt && alt !== self.audio.src) {
					self._retriedAlt = true;
					self.audio.src = alt;
					self.audio.currentTime = 0;
					if (self.playing || !self.muted) self.play();
					return;
				}
			}
			self._retriedAlt = false;
			self.playing = false;
			if (self.fallbackPlaylist && self.playlist !== self.fallbackPlaylist) {
				console.warn('[PointNetMusicPlayer] Track failed (404), switching to fallback playlist');
				self.setPlaylist(self.fallbackPlaylist, true);
			} else {
				self.updateUI();
			}
		});
	};

	PointNetMusicPlayer.prototype.preloadDurations = function () {
		var self = this;
		if (!this.playlist || !this.playlist.length) return;

		this.playlist.forEach(function (tr) {
			if (!tr.src || self.trackDurations[tr.src]) return;
			try {
				var probe = new Audio();
				probe.preload = 'metadata';
				probe.src = getFullUrl(tr.src);
				probe.addEventListener('loadedmetadata', function () {
					self.trackDurations[tr.src] = probe.duration;
					self.updateUI();
				});
				probe.addEventListener('error', function () {
					var alt = getAlternateUrl(tr.src);
					if (alt && alt !== probe.src) {
						var probe2 = new Audio();
						probe2.preload = 'metadata';
						probe2.src = alt;
						probe2.addEventListener('loadedmetadata', function () {
							self.trackDurations[tr.src] = probe2.duration;
							self.updateUI();
						});
					}
				});
			} catch (e) {}
		});
	};

	PointNetMusicPlayer.prototype.bindUI = function (opts) {
		var self = this;
		opts = opts || {};

		this.dom = {
			title: document.getElementById(opts.titleId || 'jukebox-title'),
			time: document.getElementById(opts.timeId || 'jukebox-time'),
			timeCur: document.getElementById(opts.timeCurId || 'jukebox-time-cur'),
			timeDur: document.getElementById(opts.timeDurId || 'jukebox-time-dur'),
			trackTag: document.getElementById(opts.trackTagId || 'jukebox-track-tag'),
			progress: document.getElementById(opts.progressId || 'jukebox-progress'),
			btnPrev: document.getElementById(opts.prevId || 'btn-prev-track'),
			btnPlay: document.getElementById(opts.playId || 'btn-play-track'),
			btnNext: document.getElementById(opts.nextId || 'btn-next-track'),
			btnRandom: document.getElementById(opts.randomId || 'btn-random-track'),
			select: document.getElementById(opts.selectId || 'jukebox-playlist-select'),
			volume: document.getElementById(opts.volumeId || 'jukebox-volume'),
			volumeVal: document.getElementById(opts.volumeValId || 'jukebox-volume-val'),
			volBtn: document.getElementById(opts.volBtnId || 'jukebox-vol-btn'),
			topBtn: document.getElementById(opts.topBtnId || 'btn-music')
		};

		if (this.dom.btnPrev) {
			this.dom.btnPrev.onclick = function (e) {
				e.stopPropagation();
				self.prev();
			};
		}
		if (this.dom.btnPlay) {
			this.dom.btnPlay.onclick = function (e) {
				e.stopPropagation();
				self.togglePlay();
			};
		}
		if (this.dom.btnNext) {
			this.dom.btnNext.onclick = function (e) {
				e.stopPropagation();
				self.next();
			};
		}
		if (this.dom.btnRandom) {
			this.dom.btnRandom.onclick = function (e) {
				e.stopPropagation();
				self.random();
			};
		}
		if (this.dom.topBtn) {
			this.dom.topBtn.onclick = function (e) {
				e.stopPropagation();
				self.toggleMuted();
			};
		}
		if (this.dom.volBtn) {
			this.dom.volBtn.onclick = function (e) {
				e.stopPropagation();
				self.toggleMuted();
			};
		}

		if (this.dom.select) {
			this.dom.select.onchange = function (e) {
				e.stopPropagation();
				self.playIndex(parseInt(e.target.value, 10));
			};
		}

		if (this.dom.progress) {
			this.dom.progress.oninput = function () {
				self.isScrubbing = true;
				var frac = parseFloat(self.dom.progress.value) / 1000;
				if (self.audio && self.audio.duration) {
					var cur = frac * self.audio.duration;
					if (self.dom.time) {
						self.dom.time.textContent = formatTime(cur) + ' / ' + formatTime(self.audio.duration);
					}
					if (self.dom.timeCur) {
						self.dom.timeCur.textContent = formatTime(cur);
					}
				}
			};
			this.dom.progress.onchange = function () {
				self.isScrubbing = false;
				var frac = parseFloat(self.dom.progress.value) / 1000;
				if (self.audio && self.audio.duration) {
					self.audio.currentTime = frac * self.audio.duration;
				}
				if (!self.playing && !self.muted) {
					self.play();
				}
			};
		}

		if (this.dom.volume) {
			this.dom.volume.value = Math.round(this.volume * 100);
			this.dom.volume.oninput = function (e) {
				e.stopPropagation();
				var val = parseFloat(e.target.value) / 100;
				if (self.muted && val > 0) {
					self.setMuted(false);
				}
				self.setVolume(val);
				if (self.dom.volumeVal) {
					self.dom.volumeVal.textContent = Math.round(val * 100) + '%';
				}
				if (self.dom.volBtn) {
					var icon = (self.muted || val === 0) ? '🔇' : (val < 0.5 ? '🔉' : '🔊');
					self.dom.volBtn.textContent = icon;
				}
			};
		}

		this.updateUI();
	};

	PointNetMusicPlayer.prototype.updateProgress = function () {
		if (!this.audio) return;
		var cur = this.audio.currentTime || 0;
		var dur = this.audio.duration || 0;

		if (this.dom) {
			if (this.dom.time) {
				this.dom.time.textContent = formatTime(cur) + ' / ' + formatTime(dur);
			}
			if (this.dom.timeCur) {
				this.dom.timeCur.textContent = formatTime(cur);
			}
			if (this.dom.timeDur) {
				this.dom.timeDur.textContent = formatTime(dur);
			}
			if (this.dom.progress && !this.isScrubbing) {
				var percent = dur > 0 ? (cur / dur) * 1000 : 0;
				this.dom.progress.value = Math.min(1000, Math.max(0, Math.round(percent)));
			}
		}
	};

	PointNetMusicPlayer.prototype.updateUI = function () {
		if (this.isUpdatingUI || !this.dom) return;
		this.isUpdatingUI = true;

		try {
			var self = this;
			var curTrack = this.playlist[this.trackIndex] || { title: 'Musica' };

			if (this.dom.title) {
				this.dom.title.textContent = (this.trackIndex + 1) + '. ' + curTrack.title;
			}

			if (this.dom.trackTag) {
				this.dom.trackTag.textContent = (this.trackIndex + 1) + '/' + (this.playlist ? this.playlist.length : 1);
			}

			if (this.dom.btnPlay) {
				this.dom.btnPlay.textContent = (!this.muted && this.playing) ? '⏸️' : '▶️';
				this.dom.btnPlay.title = (!this.muted && this.playing) ? 'Metti in pausa' : 'Riproduci';
			}

			if (this.dom.topBtn) {
				this.dom.topBtn.textContent = '🎵';
				this.dom.topBtn.classList.toggle('muted', this.muted);
				this.dom.topBtn.title = this.muted ? 'Attiva musica (Musica: OFF)' : 'Disattiva musica (Musica: ON)';
			}

			if (this.dom.volBtn) {
				var volPct = Math.round(this.volume * 100);
				var icon = (this.muted || volPct === 0) ? '🔇' : (volPct < 50 ? '🔉' : '🔊');
				this.dom.volBtn.textContent = icon;
				this.dom.volBtn.title = this.muted ? 'Attiva musica (Musica: OFF)' : 'Muta musica (Musica: ON)';
			}

			if (this.dom.volumeVal) {
				this.dom.volumeVal.textContent = Math.round(this.volume * 100) + '%';
			}

			if (this.dom.select && this.playlist) {
				var html = '';
				this.playlist.forEach(function (tr, i) {
					var durSec = self.trackDurations[tr.src];
					var durStr = durSec ? ' (' + formatTime(durSec) + ')' : '';
					html += '<option value="' + i + '"' + (i === self.trackIndex ? ' selected' : '') + '>' + (i + 1) + '. ' + tr.title + durStr + '</option>';
				});
				if (this.dom.select.innerHTML !== html) {
					this.dom.select.innerHTML = html;
				} else {
					this.dom.select.value = this.trackIndex;
				}
			}

			if (this.dom.volume && document.activeElement !== this.dom.volume) {
				this.dom.volume.value = Math.round(this.volume * 100);
			}

			this.updateProgress();

			if (typeof this.onStateChange === 'function') {
				this.onStateChange({
					playing: this.playing,
					muted: this.muted,
					track: curTrack,
					index: this.trackIndex
				});
			}
		} finally {
			this.isUpdatingUI = false;
		}
	};

	PointNetMusicPlayer.prototype.play = function () {
		if (!this.audio) return;
		if (this.muted) {
			this.updateUI();
			return;
		}
		var self = this;
		this.audio.volume = this.volume;
		var p = this.audio.play();
		if (p && typeof p.then === 'function') {
			p.then(function () {
				self.playing = true;
				self.updateUI();
			}).catch(function (err) {
				self.playing = false;
				if (self.fallbackPlaylist && self.playlist !== self.fallbackPlaylist) {
					console.warn('[PointNetMusicPlayer] Playback source not available (404), switching to fallback playlist');
					self.setPlaylist(self.fallbackPlaylist, true);
				} else {
					self.updateUI();
				}
			});
		} else {
			this.playing = true;
			this.updateUI();
		}
	};

	PointNetMusicPlayer.prototype.pause = function () {
		if (!this.audio) return;
		this.playing = false;
		this.audio.pause();
		this.updateUI();
	};

	PointNetMusicPlayer.prototype.togglePlay = function () {
		if (this.muted) {
			this.setMuted(false);
			this.play();
			return;
		}
		if (this.playing) {
			this.pause();
		} else {
			this.play();
		}
	};

	PointNetMusicPlayer.prototype.playIndex = function (idx) {
		if (!this.playlist || !this.playlist.length) return;
		this.trackIndex = ((idx % this.playlist.length) + this.playlist.length) % this.playlist.length;
		this.muted = false;
		this.savePrefs();

		if (this.audio) {
			this.audio.src = getFullUrl(this.playlist[this.trackIndex].src);
			this.audio.currentTime = 0;
			this.play();
		}

		if (typeof this.onTrackChange === 'function') {
			this.onTrackChange(this.playlist[this.trackIndex], this.trackIndex);
		}
		this.updateUI();
	};

	PointNetMusicPlayer.prototype.next = function () {
		this.playIndex(this.trackIndex + 1);
	};

	PointNetMusicPlayer.prototype.prev = function () {
		if (this.audio && this.audio.currentTime > 3) {
			this.audio.currentTime = 0;
			if (this.muted) this.setMuted(false);
			this.play();
			this.updateUI();
		} else {
			this.playIndex(this.trackIndex - 1);
		}
	};

	PointNetMusicPlayer.prototype.random = function () {
		if (!this.playlist || this.playlist.length <= 1) {
			this.playIndex(0);
			return;
		}
		var nextIdx = this.trackIndex;
		while (nextIdx === this.trackIndex) {
			nextIdx = Math.floor(Math.random() * this.playlist.length);
		}
		this.playIndex(nextIdx);
	};

	PointNetMusicPlayer.prototype.setVolume = function (vol) {
		this.volume = Math.max(0, Math.min(1, vol));
		if (this.audio) {
			this.audio.volume = this.muted ? 0 : this.volume;
		}
		this.savePrefs();
		this.updateUI();
	};

	PointNetMusicPlayer.prototype.setMuted = function (muted) {
		this.muted = !!muted;
		if (this.audio) {
			this.audio.volume = this.muted ? 0 : this.volume;
			if (this.muted) {
				this.pause();
			}
		}
		this.savePrefs();
		this.updateUI();
	};

	PointNetMusicPlayer.prototype.toggleMuted = function () {
		this.setMuted(!this.muted);
		if (!this.muted) {
			this.play();
		}
	};

	PointNetMusicPlayer.prototype.setPlaylist = function (newList, autoPlay) {
		if (!newList || !newList.length) return;
		this.playlist = newList;
		this.trackIndex = 0;
		this.preloadDurations();

		if (this.audio) {
			this.audio.src = getFullUrl(this.playlist[0].src);
			this.audio.currentTime = 0;
			if (autoPlay && !this.muted) {
				this.play();
			} else {
				this.updateUI();
			}
		}
	};

	return PointNetMusicPlayer;
}));
