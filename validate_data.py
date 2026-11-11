#!/usr/bin/env python3
"""Check data/*.json before every deploy. Errors fail the build; warnings only inform."""
import json, sys, pathlib
D = pathlib.Path(__file__).resolve().parent.parent / "data"
SLOTS = ["Breakfast", "Lunch", "Snack", "Dinner"]
DIETS = ["vegan", "vegetarian", "vegetarian + eggs", "non-vegetarian"]
errors, warnings = [], []

meals = json.loads((D / "meals.json").read_text(encoding="utf8"))
for slot in SLOTS:
    items = meals.get(slot)
    if not items:
        errors.append(f"meals.json: missing slot {slot}"); continue
    seen = set()
    for m in items:
        n = m.get("n", "?")
        if not isinstance(m.get("n"), str) or not m["n"].strip(): errors.append(f"{slot}: meal without a name")
        if n in seen: errors.append(f"{slot}: duplicate meal '{n}'")
        seen.add(n)
        if not isinstance(m.get("k"), (int, float)) or not 20 <= m["k"] <= 1200: errors.append(f"{slot}/{n}: kcal out of range")
        if not isinstance(m.get("p"), (int, float)) or not 0 <= m["p"] <= 100: errors.append(f"{slot}/{n}: protein out of range")
        if m.get("l") not in (0, 1, 2, 3): errors.append(f"{slot}/{n}: l must be 0-3")
    print(f"{slot:<10}", "  ".join(f"{DIETS[d]}: {sum(m['l'] <= d for m in items)}" for d in range(4)))
    for d in range(4):
        c = sum(m["l"] <= d for m in items)
        if c < 7: warnings.append(f"{slot} has only {c} {DIETS[d]} meals, so the weekly menu will repeat")

ex = json.loads((D / "exercises.json").read_text(encoding="utf8"))
for g in ("push", "pull", "legs", "core"):
    if g not in ex: errors.append(f"exercises.json: missing group {g}"); continue
    for e in ex[g]:
        if len(e) != 3 or not set(e[1]) <= set("gdb") or e[2] not in (0, 1): errors.append(f"{g}/{e[0]}: bad entry")
    for env, label in (("g", "gym"), ("d", "dumbbells"), ("b", "bodyweight")):
        c = sum(env in e[1] for e in ex[g])
        if c < 2: warnings.append(f"{g} has only {c} {label} exercise(s)")

for w in warnings: print("warning:", w)
for e in errors: print("ERROR:", e)
sys.exit(1 if errors else 0)
