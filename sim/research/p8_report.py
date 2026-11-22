"""Builds docs/research/results/players-8.json from metrics.ts output (sim/runs/research/p8/all-metrics.json) and the
strategy tagger's output (strategies.json): per roster the deck, centre, rules, games, winners, vote concentration,
judge means and agreement, and the fixed scenarios with their verdicts. Usage: python3 sim/research/p8_report.py"""
import json, statistics as st
R = "sim/runs/research/p8"
M = json.load(open(f"{R}/all-metrics.json"))
G = {g["group"]: g["games"] for g in M}
DECK = {
 "M1": (["werewolf","werewolf","moonsage","duncentaur","sage","sage","centaur","centaur","rustler","sentry","pickpocket","drifter"], 4, {}),
 "M1H": (["werewolf","werewolf","hollowsage","duncentaur","sage","sage","centaur","centaur","rustler","sentry","pickpocket","drifter"], 4, {}),
 "M1HS": (["werewolf","werewolf","hollowsage","duncentaur","sage","sage","centaur","centaur","rustler","sentry","pickpocket","spooker"], 4, {}),
 "M2": (["werewolf","werewolf","phoenix","lure","embercarrier","sage","moonsage","echo","sentry","centaur","rustler","pickpocket"], 4, {}),
 "M3": (["werewolf","werewolf","counterfeiter","hush","signet","sage","sage","centaur","rustler","sentry","pickpocket"], 3, {}),
 "M4": (["werewolf","glamour","poacher","cutpurse","pickpocket","latecomer","sage","sage","sentry","centaur","rustler"], 3, {}),
 "M5": (["werewolf","werewolf","wisp","fogbank","sage","sage","centaur","centaur","rustler","sentry","drifter"], 3, {}),
}
GROUPS = {"M1": ["M1", "F1-M1-duel", "F2-M1-pair"], "M1H": ["H1-M1H-duel", "H2-M1H-pair", "H2c-M1H-pair-covers"],
          "M1HS": ["N-M1HS", "S2-M1HS-pair-spooker", "S3-M1HS-duel-spooker"], "M2": ["M2", "F3-M2-lure", "F4-M2-ember"],
          "M3": ["M3"], "M4": ["M4"], "M5": ["M5"]}
def judges(games):
    js = [j for g in games for j in g.get("judges", [])]
    m = lambda k: round(st.mean(j[k] for j in js), 2) if js else None
    pairs = [g["judges"] for g in games if len(g.get("judges", [])) == 2]
    agree = {k: round(st.mean(abs(p[0][k] - p[1][k]) for p in pairs), 2) for k in ["tomRequired", "deceptionCleverness", "pathDependence", "noise"]} if pairs else {}
    agree["howWonExact"] = f"{sum(p[0]['howWon'] == p[1]['howWon'] for p in pairs)}/{len(pairs)}"
    return {"verdicts": len(js), "tom": m("tomRequired"), "deception": m("deceptionCleverness"), "path": m("pathDependence"), "noise": m("noise"), "agreementMeanAbsDiff": agree}
def band(c, elim): return "scattered" if not elim or c <= 0.4 else "plurality" if c <= 0.6 else "majority" if c < 1 else "unanimous"
def wins(games):
    w = {}
    for g in games: w[g["winner"]] = w.get(g["winner"], 0) + 1
    return w
out = {"players": 8, "note": "Counts, not rates: no group has 10 games. All seats Opus (medium), vote timer 60 s.", "rosters": {}}
for r, groups in GROUPS.items():
    deck, centre, rules = DECK[r]
    allg = [g for k in groups for g in G.get(k, [])]
    natural = [g for k in groups if not any(ch in k for ch in "-") for g in G.get(k, [])]
    scen = []
    for k in groups:
        gs = G.get(k, [])
        if "-" not in k or not gs: continue
        w = wins(gs); top = max(w.values()); minority = len(gs) - top; j = judges(gs)
        scen.append({"label": k, "replays": len(gs), "fingerprintsIdentical": len({g["fingerprint"] for g in gs}) == 1, "winners": w, "minority": minority,
                     "talkLive": minority >= 1 and (j["path"] or 0) >= 2, "c": [round(g["votes"]["c"], 2) for g in gs], "judges": j})
    cs = [round(g["votes"]["c"], 2) for g in allg]
    bands = {}
    for g in allg: b = band(g["votes"]["c"], g["eliminated"]); bands[b] = bands.get(b, 0) + 1
    out["rosters"][r] = {"deck": deck, "centre": centre, "rules": rules or "defaults", "games": len(allg), "naturalGames": len(natural),
        "fixedScenarios": [f"{s['label']} x{s['replays']}" for s in scen], "winners": wins(allg), "c": cs, "cMedian": st.median(cs) if cs else None,
        "bands": bands, "judges": judges(allg), "scenarios": scen}
try: out["strategies"] = json.load(open(f"{R}/strategies.json"))
except FileNotFoundError: pass
json.dump(out, open("docs/research/results/players-8.json", "w"), indent=1)
for r, v in out["rosters"].items():
    print(r, v["games"], v["winners"], "cMed", v["cMedian"], v["bands"], {k: v["judges"][k] for k in ["tom", "deception", "path", "noise"]}, [(s["label"], s["winners"], s["talkLive"]) for s in v["scenarios"]])
