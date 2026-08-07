#!/usr/bin/env python3
"""benchmark-difficulty.py
Measures the difficulty of every mahjong layout variant.

For each variant we generate shuffles until N SOLVABLE boards are found
(the game regenerates unsolvable shuffles, so only solvable boards reach
the player). Difficulty = average DFS nodes to solve such boards,
weighed by how many attempts were needed to find them.

Run:  python3 benchmark-difficulty.py [samples] [budget]
Copy the printed ORDERED_STEPS into games/mahjong/index.html.
"""
import sys
import math

SAMPLES = int(sys.argv[1]) if len(sys.argv) > 1 else 10
BUDGET = int(sys.argv[2]) if len(sys.argv) > 2 else 120000
MAX_TRIES = 80


# ------------------------------------------------------------------
# RNG (matches index.html createRng)
# ------------------------------------------------------------------
def create_rng(seed):
    s = seed & 0xFFFFFFFF

    def next_rand():
        nonlocal s
        s = (s * 1664525 + 1013904223) & 0xFFFFFFFF
        return s / 4294967296.0

    return next_rand


def shuffle(arr, rng):
    n = len(arr)
    for i in range(n - 1, 0, -1):
        j = math.floor(rng() * (i + 1))
        arr[i], arr[j] = arr[j], arr[i]
    return arr


# ------------------------------------------------------------------
# LAYOUT BUILDERS - every variant (must match index.html)
# ------------------------------------------------------------------
def even_trim(pts):
    if len(pts) % 2 != 0:
        return pts[: len(pts) - 1]
    return pts


def halfcover_small():
    pts = []
    for y in range(3):
        for x in range(3):
            pts.append({"z": 0, "x": x * 2, "y": y})
    for hy in range(1, 3):
        for hx in range(1, 4, 2):
            pts.append({"z": 1, "x": hx, "y": hy, "isHalf": True})
    return even_trim(pts)  # 9+4=13 -> 12


def halfcover_medium():
    pts = []
    for y in range(4):
        for x in range(4):
            pts.append({"z": 0, "x": x * 2, "y": y})
    for hy in range(1, 4):
        for hx in range(1, 6, 2):
            pts.append({"z": 1, "x": hx, "y": hy, "isHalf": True})
    pts.append({"z": 0, "x": 2, "y": 5})
    return pts  # 26


def halfcover_large():
    pts = []
    for y in range(4):
        for x in range(5):
            pts.append({"z": 0, "x": x * 2, "y": y})
    for hy in range(1, 4):
        for hx in range(1, 8, 2):
            pts.append({"z": 1, "x": hx, "y": hy, "isHalf": True})
    return pts  # 20+12=32


def halfcover_xlarge():
    pts = []
    for y in range(5):
        for x in range(5):
            pts.append({"z": 0, "x": x * 2, "y": y})
    for hy in range(1, 5):
        for hx in range(1, 8, 2):
            pts.append({"z": 1, "x": hx, "y": hy, "isHalf": True})
    return even_trim(pts)  # 25+16=41 -> 40


def cross_small():
    pts = []
    for y in range(5):
        for x in range(5):
            if x == 2 or y == 2:
                pts.append({"z": 0, "x": x * 2, "y": y})  # 9
    pts.append({"z": 1, "x": 2, "y": 2})
    pts.append({"z": 1, "x": 4, "y": 2})
    pts.append({"z": 1, "x": 2, "y": 3})  # 3
    pts.append({"z": 2, "x": 4, "y": 2})
    pts.append({"z": 2, "x": 2, "y": 3})  # 2
    return pts  # 14


def cross_medium():
    pts = []
    for y in range(5):
        for x in range(5):
            if abs(y - 2) <= 1 or abs(x - 2) <= 1:
                pts.append({"z": 0, "x": x * 2, "y": y})  # 21
    for y2 in range(1, 4):
        for x2 in range(1, 4):
            pts.append({"z": 1, "x": x2 * 2, "y": y2})  # 9
    pts.append({"z": 2, "x": 4, "y": 2})
    pts.append({"z": 2, "x": 4, "y": 3})  # 2
    return pts  # 32


def cross_large():
    pts = []
    for y in range(5):
        for x in range(5):
            if abs(y - 2) <= 1 or abs(x - 2) <= 1:
                pts.append({"z": 0, "x": x * 2, "y": y})  # 21
    for y2 in range(4):
        for x2 in range(4):
            pts.append({"z": 1, "x": x2 * 2 + 2, "y": y2 + 1})  # 16
    for y3 in range(2):
        for x3 in range(2):
            pts.append({"z": 2, "x": x3 * 2 + 4, "y": y3 + 2})  # 4
    pts.append({"z": 3, "x": 6, "y": 3})  # 1
    return pts  # 42


def pyramid_small():
    pts = []
    layers = [(3, 3), (2, 2), (1, 1)]
    for z, (w, h) in enumerate(layers):
        ox = round((3 - w) / 2)
        oy = round((3 - h) / 2)
        for y in range(h):
            for x in range(w):
                pts.append({"z": z, "x": (x + ox) * 2, "y": y + oy})
    return pts  # 14


def pyramid_medium():
    pts = []
    layers = [(4, 4), (3, 3), (2, 2), (1, 1)]
    for z, (w, h) in enumerate(layers):
        ox = round((4 - w) / 2)
        oy = round((4 - h) / 2)
        for y in range(h):
            for x in range(w):
                pts.append({"z": z, "x": (x + ox) * 2, "y": y + oy})
    return pts  # 30


def pyramid_large():
    pts = []
    layers = [(5, 5), (4, 4), (3, 3), (2, 2), (2, 1)]
    for z, (w, h) in enumerate(layers):
        ox = round((5 - w) / 2)
        oy = round((5 - h) / 2)
        for y in range(h):
            for x in range(w):
                pts.append({"z": z, "x": (x + ox) * 2, "y": y + oy})
    return pts  # 56


def fortress_small():
    pts = []
    for y in range(4):
        for x in range(4):
            pts.append({"z": 0, "x": x * 2, "y": y})  # 16
    for y1 in range(4):
        for x1 in range(4):
            if y1 == 0 or y1 == 3 or x1 == 0 or x1 == 3:
                pts.append({"z": 1, "x": x1 * 2, "y": y1})  # 12
    for c in [(0, 0), (3, 0), (0, 3), (3, 3)]:
        pts.append({"z": 2, "x": c[0] * 2, "y": c[1]})  # 4
    return pts  # 32


def fortress_medium():
    pts = []
    for y in range(5):
        for x in range(5):
            pts.append({"z": 0, "x": x * 2, "y": y})  # 25
    for y1 in range(5):
        for x1 in range(5):
            if y1 == 0 or y1 == 4 or x1 == 0 or x1 == 4:
                pts.append({"z": 1, "x": x1 * 2, "y": y1})  # 16
    for c in [(0, 0), (4, 0), (0, 4), (4, 4)]:
        pts.append({"z": 2, "x": c[0] * 2, "y": c[1]})  # 4
    pts.append({"z": 3, "x": 4, "y": 2})  # 1
    return pts  # 46


def fortress_large():
    pts = []
    for y in range(6):
        for x in range(6):
            pts.append({"z": 0, "x": x * 2, "y": y})  # 36
    for y1 in range(6):
        for x1 in range(6):
            if y1 == 0 or y1 == 5 or x1 == 0 or x1 == 5:
                pts.append({"z": 1, "x": x1 * 2, "y": y1})  # 20
    for c in [(0, 0), (5, 0), (0, 5), (5, 5)]:
        pts.append({"z": 2, "x": c[0] * 2, "y": c[1]})  # 4
    pts.append({"z": 3, "x": 6, "y": 2})
    pts.append({"z": 3, "x": 6, "y": 3})  # 2
    return pts  # 62


def dragon_small():
    pts = []
    for x0 in range(4):
        pts.append({"z": 0, "x": x0 * 2, "y": 0})  # 4
    for x1 in range(1, 3):
        pts.append({"z": 0, "x": x1 * 2, "y": 1})  # 2
    for x2 in range(4):
        pts.append({"z": 0, "x": x2 * 2, "y": 2})  # 4
    for x3 in range(1, 3):
        pts.append({"z": 0, "x": x3 * 2, "y": 3})  # 2
    for yz in range(1, 3):
        for xz in range(1, 3):
            pts.append({"z": 1, "x": xz * 2, "y": yz})  # 4
    return pts  # 16


def dragon_medium():
    pts = []
    for x0 in range(6):
        pts.append({"z": 0, "x": x0 * 2, "y": 0})  # 6
    for x1 in range(1, 5):
        pts.append({"z": 0, "x": x1 * 2, "y": 1})  # 4
    for x2 in range(6):
        pts.append({"z": 0, "x": x2 * 2, "y": 2})  # 6
    for y1 in range(3):
        for xi in range(1, 5):
            pts.append({"z": 1, "x": xi * 2, "y": y1})  # 12
    pts.append({"z": 2, "x": 4, "y": 0})  # 1
    return even_trim(pts)  # 6+4+6+12+1=29 -> 28


def dragon_large():
    pts = []
    for x0 in range(6):
        pts.append({"z": 0, "x": x0 * 2, "y": 0})  # 6
    for x1 in range(1, 5):
        pts.append({"z": 0, "x": x1 * 2, "y": 1})  # 4
    for x2 in range(6):
        pts.append({"z": 0, "x": x2 * 2, "y": 2})  # 6
    for x3 in range(1, 5):
        pts.append({"z": 0, "x": x3 * 2, "y": 3})  # 4
    for x4 in range(6):
        pts.append({"z": 0, "x": x4 * 2, "y": 4})  # 6
    for y1 in range(3):
        for xi in range(1, 5):
            pts.append({"z": 1, "x": xi * 2, "y": y1})  # 12
    pts.append({"z": 2, "x": 4, "y": 0})
    pts.append({"z": 2, "x": 6, "y": 0})  # 2
    return pts  # 40


def turtle_small():
    pts = []
    for y in range(3):
        for x in range(4):
            pts.append({"z": 0, "x": x * 2, "y": y})  # 12
    for y1 in range(1, 3):
        for x1 in range(1, 3):
            pts.append({"z": 1, "x": x1 * 2, "y": y1})  # 4
    pts.append({"z": 1, "x": 6, "y": 1})  # head
    pts.append({"z": 0, "x": 2, "y": 3})  # tail
    pts.append({"z": 0, "x": 0, "y": 3})  # front leg
    pts.append({"z": 0, "x": 6, "y": 3})  # front leg
    return pts  # 20


def turtle_medium():
    pts = []
    for y in range(5):
        for x in range(6):
            pts.append({"z": 0, "x": x * 2, "y": y})  # 30
    for y1 in range(1, 4):
        for x1 in range(1, 5):
            pts.append({"z": 1, "x": x1 * 2, "y": y1})  # 12
    for y2 in range(1, 3):
        for x2 in range(2, 4):
            pts.append({"z": 2, "x": x2 * 2, "y": y2})  # 4
    pts.append({"z": 1, "x": 10, "y": 2})  # head
    pts.append({"z": 0, "x": 0, "y": 5})  # tail
    pts.append({"z": 0, "x": 0, "y": 6})  # front leg
    pts.append({"z": 0, "x": 10, "y": 6})  # front leg
    return pts  # 50


def turtle_large():
    pts = []
    for y in range(6):
        for x in range(6):
            pts.append({"z": 0, "x": x * 2, "y": y})  # 36
    for y1 in range(1, 5):
        for x1 in range(1, 5):
            pts.append({"z": 1, "x": x1 * 2, "y": y1})  # 16
    for y2 in range(2, 4):
        for x2 in range(2, 4):
            pts.append({"z": 2, "x": x2 * 2, "y": y2})  # 4
    pts.append({"z": 1, "x": 10, "y": 2})  # head
    pts.append({"z": 0, "x": 0, "y": 6})  # tail
    pts.append({"z": 0, "x": 0, "y": 7})  # front leg
    pts.append({"z": 0, "x": 10, "y": 7})  # front leg
    return pts  # 60


# NOTE: halfcover_large/xlarge and fortress_medium are omitted — benchmarks
# showed they have <3% solvable-shuffle rates, so generateLevel could never
# find playable boards reliably. Only variants with a healthy solvability
# rate are included.
LAYOUT_BUILDERS = {
    "halfcover": {"small": halfcover_small, "medium": halfcover_medium},
    "cross": {"small": cross_small, "medium": cross_medium, "large": cross_large},
    "pyramid": {"small": pyramid_small, "medium": pyramid_medium, "large": pyramid_large},
    "fortress": {"small": fortress_small, "large": fortress_large},
    "dragon": {"small": dragon_small, "medium": dragon_medium, "large": dragon_large},
    "turtle": {"small": turtle_small, "medium": turtle_medium, "large": turtle_large},
}


# ------------------------------------------------------------------
# SOLVER (matches index.html, but also returns node count)
# ------------------------------------------------------------------
def make_key(z, x, y):
    return f"{z},{x},{y}"


def build_board(tiles):
    board = {}
    for t in tiles:
        t["key"] = make_key(t["z"], t["x"], t["y"])
        board[t["key"]] = t
    return board


def has_tile(board, z, x, y):
    t = board.get(make_key(z, x, y))
    return bool(t and not t["removed"] and not t["staging"])


def has_half_cover_above(board, tile):
    def half_at(z, x, y):
        t = board.get(make_key(z, x, y))
        return bool(t and not t["removed"] and not t["staging"] and t.get("isHalf"))

    above_y = tile["z"] + 1
    return (half_at(above_y, tile["x"] - 1, tile["y"]) or
            half_at(above_y, tile["x"] + 1, tile["y"]) or
            half_at(above_y, tile["x"] - 1, tile["y"] + 1) or
            half_at(above_y, tile["x"] + 1, tile["y"] + 1))


def is_free(board, tile):
    if tile["removed"] or tile["staging"]:
        return False
    if has_tile(board, tile["z"] + 1, tile["x"], tile["y"]):
        return False
    if has_half_cover_above(board, tile):
        return False
    has_left = has_tile(board, tile["z"], tile["x"] - 2, tile["y"])
    has_right = has_tile(board, tile["z"], tile["x"] + 2, tile["y"])
    return not (has_left and has_right)


def solve_board_with_count(board):
    tile_list = [t for t in board.values() if not t["staging"]]
    removed = set()
    nodes = 0
    aborted = False

    def has_live(z, x, y):
        t = board.get(make_key(z, x, y))
        return bool(t and not t["removed"] and not t["staging"] and t["key"] not in removed)

    def has_live_half(z, x, y):
        t = board.get(make_key(z, x, y))
        return bool(t and not t["removed"] and not t["staging"] and t["key"] not in removed and t.get("isHalf"))

    def is_free_for_solver(t):
        if t["key"] in removed:
            return False
        if has_live(t["z"] + 1, t["x"], t["y"]):
            return False
        if (has_live_half(t["z"] + 1, t["x"] - 1, t["y"]) or
                has_live_half(t["z"] + 1, t["x"] + 1, t["y"]) or
                has_live_half(t["z"] + 1, t["x"] - 1, t["y"] + 1) or
                has_live_half(t["z"] + 1, t["x"] + 1, t["y"] + 1)):
            return False
        has_left = has_live(t["z"], t["x"] - 2, t["y"])
        has_right = has_live(t["z"], t["x"] + 2, t["y"])
        return not (has_left and has_right)

    def rec():
        nonlocal nodes, aborted
        if aborted:
            return True
        nodes += 1
        if nodes > BUDGET:
            aborted = True
            return True
        if len(removed) == len(tile_list):
            return True
        free = []
        for t in tile_list:
            if t["key"] not in removed and is_free_for_solver(t):
                free.append(t)
        if not free:
            return False

        by_sym = {}
        for t in free:
            by_sym.setdefault(t["symbol"], []).append(t)
        syms = sorted(by_sym.keys(), key=lambda s: len(by_sym[s]))
        for sym in syms:
            members = by_sym[sym]
            for i2 in range(len(members)):
                for j in range(i2 + 1, len(members)):
                    a = members[i2]
                    b = members[j]
                    removed.add(a["key"])
                    removed.add(b["key"])
                    if rec():
                        return True
                    removed.discard(a["key"])
                    removed.discard(b["key"])
        return False

    ok = rec()
    return {"solvable": None if aborted else ok, "nodes": nodes}


# ------------------------------------------------------------------
# DECK BUILDER (mirrors generateLevel)
# ------------------------------------------------------------------
BENCH_SYMBOLS = [f"S{i}" for i in range(1, 23)]


def build_tiles_for(layout_pts, seed):
    symbols_needed = math.ceil(len(layout_pts) / 2)
    deck = []
    for i in range(symbols_needed):
        sym = BENCH_SYMBOLS[i % len(BENCH_SYMBOLS)]
        deck.append(sym)
        if len(deck) < len(layout_pts):
            deck.append(sym)
    rng = create_rng(seed)
    shuffle(deck, rng)
    tiles = []
    for c, co in enumerate(layout_pts):
        tiles.append({
            "z": co["z"], "x": co["x"], "y": co["y"],
            "isHalf": bool(co.get("isHalf")),
            "symbol": deck[c],
            "removed": False,
            "staging": False,
        })
    return tiles


# ------------------------------------------------------------------
# BENCHMARK — sample only SOLVABLE boards (what the player sees)
# ------------------------------------------------------------------
def count_free(board, tiles):
    return sum(1 for t in tiles if is_free(board, t))


results = []

for layout, variants in LAYOUT_BUILDERS.items():
    for variant, fn in variants.items():
        pts = [p for p in fn() if p["y"] >= 0]
        total = len(pts)

        node_samples = []
        free_samples = []
        attempts = 0
        fail_timeouts = 0
        fail_unsolv = 0
        found = 0

        for s in range(MAX_TRIES):
            if found >= SAMPLES:
                break
            attempts += 1
            seed = 5000 + len(results) * 1000 + s
            tiles = build_tiles_for(pts, seed)
            board = build_board(tiles)
            free_now = count_free(board, tiles)
            res = solve_board_with_count(board)
            if res["solvable"] is True:
                node_samples.append(res["nodes"])
                free_samples.append(free_now)
                found += 1
            elif res["solvable"] is None:
                fail_timeouts += 1
            else:
                fail_unsolv += 1

        if found == 0:
            avg_nodes = BUDGET
            avg_free = 0.0
            attempts = MAX_TRIES
            print(f"  {layout}/{variant}  tiles={total}  NO SOLVABLE BOARD FOUND in {MAX_TRIES} tries "
                  f"(timeout {fail_timeouts} / unsolv {fail_unsolv})", flush=True)
        else:
            avg_nodes = round(sum(node_samples) / len(node_samples))
            avg_free = round(sum(free_samples) / len(free_samples), 1)
            print(f"  {layout}/{variant}  tiles={total}  avgNodes={avg_nodes}  avgFree={avg_free:.1f}"
                  f"  tried={attempts} (found {found} / timeout {fail_timeouts} / unsolv {fail_unsolv})",
                  flush=True)

        results.append({
            "layout": layout,
            "variant": variant,
            "tiles": total,
            "avgNodes": avg_nodes,
            "avgFree": avg_free,
            "attempts": attempts,
            "found": found,
            "failTimeout": fail_timeouts,
            "failUnsolv": fail_unsolv,
        })

# Sort by composite difficulty:
#   score = avgNodes * attempts / found
#   - avgNodes  : solver effort on the boards the player actually sees
#   - attempts/found : inverse success rate — variants where only a few
#                      shuffles are solvable produce rare, tightly
#                      constrained boards that play harder
results = [r for r in results if r["found"] > 0]
for r in results:
    r["score"] = r["avgNodes"] * r["attempts"] / max(1, r["found"])
results.sort(key=lambda r: (r["score"], -r["avgFree"], r["tiles"]))
for r in results:
    print(f"        score={r['score']:.1f}", flush=True)

print("\n================ ORDERED BY DIFFICULTY (easiest -> hardest) ================")
for i, r in enumerate(results):
    print(f"{i + 1}. {r['layout']}/{r['variant']}  tiles={r['tiles']}"
          f"  avgNodes={r['avgNodes']}  avgFree={r['avgFree']}"
          f"  tried={r['attempts']} found={r['found']}")

print("\n================= COPY THIS INTO index.html =================")
sym_sets = ["default", "red", "green", "blue", "gold", "dark"]
order_lines = []
for i, r in enumerate(results):
    covered = min(6, i // 3)
    order_lines.append(
        f"\t{{ layout: '{r['layout']}', variant: '{r['variant']}',"
        f" symSet: '{sym_sets[i % len(sym_sets)]}', covered: {covered} }}"
    )
print("var ORDERED_STEPS = [")
print(",\n".join(order_lines))
print("];")