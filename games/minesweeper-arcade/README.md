# 💣 Minesweeper Arcade

Arcade variant of the classic minesweeper with **progressive levels**: clear the board and advance to the next level. One mistake and you're back to Level 1!

## 🎮 How to Play

- **Goal**: reveal all safe cells without detonating mines, level after level.
- **Left click / tap**: reveal a cell.
- **Right click / long press (mobile)**: place/remove a flag.
- **Shortcuts**: `M` = toggle audio.

## 🏆 Scoring and Progression

```
Level score = max(10, (safe_cells × 10 − time_seconds × 5) × (1 + level × 0.2))
Total score = sum of all completed levels
```

| Level | Grid | Cells | Mines | % |
|---------|---------|-------|-------|---|
| 1 | 7 × 7 | 49 | 5 | 10% |
| 2 | 7 × 7 | 49 | 6 | 12% |
| 3 | 7 × 7 | 49 | 7 | 14% |
| 4 | 8 × 7 | 56 | 9 | 16% |
| 5 | 8 × 7 | 56 | 11 | 20% |
| 6 | 9 × 8 | 72 | 13 | 18% |
| 7 | 9 × 8 | 72 | 15 | 21% |
| 8 | 10 × 9 | 90 | 17 | 19% |
| 9 | 10 × 9 | 90 | 20 | 22% |
| 10 | 11 × 10 | 110 | 23 | 21% |
| 11 | 11 × 10 | 110 | 26 | 24% |
| 12 | 12 × 12 | 144 | 30 | 21% |
| 13 | 12 × 12 | 144 | 35 | 24% |
| 14 | 14 × 14 | 196 | 42 | 21% |
| 15 | 14 × 14 | 196 | 50 | 26% |

- If you **explode**: the accumulated score is submitted to the leaderboard and you start over from Level 1
- Complete all 15 levels: final score submitted as "Max Level"
- **Mobile friendly**: all grids have at most 14 columns — they fit on any screen
- **Gradual progression**: 1-3% increase per level, with slowly growing grids

## 📦 PointNet Games Integration

- `submitScore(score, meta)` — submits the total score with meta `{ difficulty: "arcade", label: "Arcade", level_reached, time_seconds }`
- Leaderboard filtered by `difficulty="arcade"` ("🎮 Arcade" tab on the game page)

## 📝 Changelog

### 1.1.0 (current)
- Version badge (`v1.1.0` in superscript) added to the splash screen title
- High-DPI board rendering: the board rasterizes at the current viewport resolution whenever the iframe grows to fullscreen (two-phase transform re-application), keeping cells and text crisp on WordPress embeds
- Splash screen now shows the game version in superscript after the title, consistent with mahjong

### 1.0.0
- Initial release with **15 progressive levels** and gradual difficulty
- Mobile friendly grids (max 14 columns)
- Progressive scoring with per-level multiplier
- Procedural audio (Web Audio API)
- Splash screen + immersive fullscreen
- Full PointNet Games integration (leaderboard, arcade difficulty, postMessage shim)

## 📄 License

**GPL-2.0+** — GNU General Public License v2 or later.