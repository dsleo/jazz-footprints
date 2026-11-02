"""Who is matched most? Directional statistics over the published catalog.

Only *substantial* matches count here (STRONG_N+ aligned notes at STRONG_SIM+
similarity): shorter ones are mostly shared idiom and swamp the totals. For
every such passage between solos by different musicians, in different
compositions and different recording years, the earlier solo is the *source*
and the later one the *echo*. A matched pair of solos counts once however many
passages it shares. Writes static/stats.json and embeds it in static/stats.html.
Each claim carries the passages behind it, so the page can show and play them.
"""
from __future__ import annotations

import bisect
import gzip
import json
import re
import statistics
from collections import Counter, defaultdict

from .corpus import ROOT

CATALOG = ROOT / "static" / "catalog" / "index.json.gz"
OUTPUT = ROOT / "static" / "stats.json"
PAGE = ROOT / "static" / "stats.html"
MIN_SOLOS = 8       # ponytail: fewer solos is too noisy to rank at all
STRONG_N = 12       # aligned notes; 8-11 note matches are mostly stock licks
STRONG_SIM = .85
PRIOR = 5000        # solo pairs of "average" evidence mixed into every musician's rate


def orient(r: list, early_is_a: bool) -> dict:
    """A catalog row as a source (earlier) -> echo (later) passage."""
    a, b = (0, 1) if early_is_a else (1, 0)
    s0, s1, e0, e1 = (2, 3, 4, 5) if early_is_a else (4, 5, 2, 3)
    va, vb = (12, 13) if early_is_a else (13, 12)
    return {"e": r[a], "l": r[b], "e0": r[s0], "e1": r[s1], "l0": r[e0], "l1": r[e1], "n": r[6],
            "s": round(r[8], 3), "ve": r[va], "vl": r[vb], "key": f"{r[0]}.{r[2]}.{r[1]}.{r[4]}"}


def quality(ev: dict) -> tuple:
    """Prefer passages you can also watch, then longer and closer ones."""
    return (ev["ve"] is not None and ev["vl"] is not None, ev["n"] * ev["s"])


def collect(index: dict) -> dict:
    solos = index["solos"]
    pairs: dict[tuple[int, int], dict] = {}
    for r in index["rows"]:
        if r[6] < STRONG_N or r[8] < STRONG_SIM:
            continue
        a, b = solos[str(r[0])], solos[str(r[1])]
        if a["composition_id"] == b["composition_id"] or a["year"] == b["year"] or a["performer"] == b["performer"]:
            continue
        ev = orient(r, a["year"] < b["year"])
        k = (ev["e"], ev["l"])
        if k not in pairs:
            pairs[k] = {"count": 0, "best": ev}
        pairs[k]["count"] += 1
        if quality(ev) > quality(pairs[k]["best"]):
            pairs[k]["best"] = ev
    return pairs


def build(index: dict) -> dict:
    solos = index["solos"]
    pairs = collect(index)
    who = lambda i: solos[str(i)]["performer"]
    n_solos = Counter(s["performer"] for s in solos.values())
    years = defaultdict(list)
    for s in solos.values():
        years[s["performer"]].append(s["year"])
    # A 1925 solo can only be a source and a 2015 solo only an echo, so each
    # musician's rate divides by the solo pairs that could have matched.
    ys = sorted(s["year"] for s in solos.values())
    can_give, can_take = Counter(), Counter()
    for s in solos.values():
        can_give[s["performer"]] += len(ys) - bisect.bisect_right(ys, s["year"])
        can_take[s["performer"]] += bisect.bisect_left(ys, s["year"])
    given, taken = Counter(), Counter()
    reach_out, reach_in = defaultdict(set), defaultdict(set)
    duo: dict[tuple[str, str], dict] = {}
    lags = []
    for (e, l), p in pairs.items():
        pe, pl = who(e), who(l)
        given[pe] += 1
        taken[pl] += 1
        reach_out[pe].add(pl)
        reach_in[pl].add(pe)
        d = duo.setdefault((pe, pl), {"count": 0, "best": p["best"]})
        d["count"] += 1
        if quality(p["best"]) > quality(d["best"]):
            d["best"] = p["best"]
        lags.append(solos[str(l)]["year"] - solos[str(e)]["year"])

    base_give = sum(given.values()) / sum(can_give.values())
    base_take = sum(taken.values()) / sum(can_take.values())

    def table(counter: Counter, reach: dict, eligible: Counter, base: float) -> list:
        """Match rate per 1,000 solo pairs, pulled toward the average for musicians with few solos."""
        return [{"name": m, "solos": n_solos[m], "pairs": n, "musicians": len(reach[m]),
                 "raw": round(1000 * n / eligible[m], 1),
                 "rate": round(1000 * (n + PRIOR * base) / (eligible[m] + PRIOR), 2),
                 "years": [min(years[m]), max(years[m])]}
                for m in n_solos if n_solos[m] >= MIN_SOLOS and eligible[m] for n in [counter[m]]]

    src, ech = table(given, reach_out, can_give, base_give), table(taken, reach_in, can_take, base_take)
    by = lambda rows, k: sorted(rows, key=lambda r: -r[k])
    used: set[int] = set()
    shards: dict[int, list] = {}

    def passage(solo: int, start: int, end: int) -> list:
        """[pitch, onset, duration, beat] of the aligned notes, relative to the first note."""
        if solo not in shards:
            shards[solo] = json.load(gzip.open(CATALOG.parent / "notes" / f"{solo}.json.gz"))
        notes = shards[solo][start:end]
        return [[n[1], round(n[2] - notes[0][2], 3), round(n[3], 3), round(n[4] - notes[0][4], 3)] for n in notes]

    def ev_item(ev, name, label, sub, count=None) -> dict:
        used.update((ev["e"], ev["l"]))
        ev = {**ev, "ne": passage(ev["e"], ev["e0"], ev["e1"]), "nl": passage(ev["l"], ev["l0"], ev["l1"])}
        return {"name": name, "label": label, "sub": sub, "count": count, "ev": ev}

    def partners(name, source: bool, limit: int) -> list:
        rows = sorted(((pl if source else pe, d) for (pe, pl), d in duo.items() if (pe if source else pl) == name),
                      key=lambda kv: -kv[1]["count"])
        out = []
        for other, d in rows[:limit]:
            solo = solos[str(d["best"]["l" if source else "e"])]
            out.append(ev_item(d["best"], other, other, f"{solo['title']} · {solo['year']}", d["count"]))
        return out

    def subject(row: dict, source: bool) -> dict:
        n = row["name"]
        text = (f"{n}'s {row['solos']} solos have a substantial passage (12+ notes, 85%+ similar) in {row['pairs']} "
                f"{'later' if source else 'earlier'} solos by {row['musicians']} other musicians."
                + ("" if source else " Each name is someone whose earlier solo they echo."))
        return {"name": n, "items": partners(n, source, 40), "big": str(row["pairs"]), "text": text}

    def leaps(limit):
        seen, out = set(), []
        for (e, l), p in sorted(pairs.items(), key=lambda kv: -(solos[str(kv[0][1])]["year"] - solos[str(kv[0][0])]["year"])):
            ev = p["best"]
            if ev["n"] < 20 or (who(e), who(l)) in seen:
                continue
            seen.add((who(e), who(l)))
            se, sl = solos[str(e)], solos[str(l)]
            out.append(ev_item(ev, who(l), f"{se['performer']} → {sl['performer']}",
                               f"{se['title']} ({se['year']}) → {sl['title']} ({sl['year']})"))
            if len(out) == limit:
                break
        return out

    def rank(rows, k=10):
        return [{"name": r["name"], "value": r["rate"], "label": f"{r['rate']:.1f}",
                 "sub": f"{r['solos']} solos · {r['pairs']} matched"} for r in by(rows, "rate")[:k]]

    top_src, top_ech = by(src, "rate")[:2], by(ech, "rate")[:2]
    explain = ("Score = matches per 1,000 solo pairs that could have matched (a musician's solos against every later "
               "solo by someone else, or every earlier one). Musicians with few solos are pulled toward the average so that "
               "eight lucky solos cannot top the list.")
    A, B = top_src[0], top_ech[0]
    slides = [
        {"id": "sources", "kicker": "Whose phrases come back", "big": f"{A['pairs']}",
         "text": f"{A['name']}'s {A['solos']} solos have a substantial passage (12+ notes, 85%+ similar) in {A['pairs']} later solos by {A['musicians']} other musicians. {top_src[1]['name']} is next. Pick one and hear the closest matches.",
         "subjects": [subject(r, True) for r in top_src],
         "ranking": {"title": "Match rate as a source", "explain": explain, "rows": rank(src)}},
        {"id": "echoes", "kicker": "Who echoes the most", "big": f"{B['pairs']}",
         "text": f"{B['name']}'s {B['solos']} solos have a substantial passage in {B['pairs']} earlier solos by {B['musicians']} other musicians. {top_ech[1]['name']} is next. Each name is someone whose earlier solo they echo.",
         "subjects": [subject(r, False) for r in top_ech],
         "ranking": {"title": "Match rate as an echo", "explain": explain, "rows": rank(ech)}},
        {"id": "time", "kicker": "Across time", "big": f"{statistics.median(lags):.0f} years",
         "text": f"The median gap between a source solo and its echo; {round(100 * sum(g > 20 for g in lags) / len(lags))}% of these pairs span more than 20 years. These are the longest leaps with a long, close match.",
         "subjects": [{"name": "Longest leaps", "items": leaps(14)}]},
    ]
    meta = {str(i): {"p": solos[str(i)]["performer"], "t": solos[str(i)]["title"], "y": solos[str(i)]["year"],
                     "v": solos[str(i)].get("video_id"), "c": solos[str(i)].get("cover")} for i in used}
    return {"scope": {"solo_pairs": len(pairs), "musicians": len(n_solos), "min_solos": MIN_SOLOS,
                      "strong_n": STRONG_N, "strong_sim": STRONG_SIM,
                      "median_lag": statistics.median(lags), "gap_over_20": sum(g > 20 for g in lags) / len(lags)},
            "slides": slides, "solos": meta}


if __name__ == "__main__":
    stats = build(json.load(gzip.open(CATALOG)))
    OUTPUT.write_text(json.dumps(stats, ensure_ascii=False, separators=(",", ":")))
    # Inline copy so stats.html never depends on a second request.
    block = '<script id="stats-data" type="application/json">' + json.dumps(stats, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/") + "</script>"
    PAGE.write_text(re.sub(r'<script id="stats-data".*?</script>', lambda _: block, PAGE.read_text(), flags=re.S))
    print(f"wrote {OUTPUT} ({stats['scope']['solo_pairs']} substantial solo pairs, {OUTPUT.stat().st_size // 1024} KB)")
