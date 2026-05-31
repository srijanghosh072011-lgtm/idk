# Gaffer — Football Management

A football (soccer) **management career sim** that runs in your web browser. You're the manager: pick a club, set your formation and tactics, manage fitness and morale, and **simulate your way through the season** with a live highlights feed and a full league table.

Built as a lightweight, dependency-free web app — the depth lives in the systems (match engine, ratings, finances, career), not in heavy 3D graphics. Think *Football Manager*, not *FIFA*.

---

## How to play

**Easiest way:** double-click `index.html`. It opens in your browser and runs. No installing anything.

That's it. Your progress autosaves to the browser after every match (plus a manual Save button).

> If your browser blocks anything when opening the file directly, you can instead run a tiny local server from this folder:
> ```
> python3 -m http.server 8000
> ```
> then visit `http://localhost:8000`. (Optional — only if double-clicking misbehaves.)

---

## What's playable right now (v0.1 — the core loop)

- **Choose your club** from all 20 **Premier League 2025/26** sides — the whole UI recolors to your club.
- **Squad screen** — every player with real attributes, OVR, potential, value, wage, fitness; click anyone for a full profile (FIFA-style face stats, traits, season stats, condition).
- **Tactics** — pick from 7 formations and set mentality / tempo / pressing. A visual pitch shows your XI.
- **Match Day** — your strongest available XI is auto-picked; hit **Play Match**.
- **Match engine** — a calibrated minute-by-minute simulation (weighted by player ratings, tactics, home advantage, weather, fatigue) that reveals the score + **key highlights** one moment at a time, then shows match stats and Man of the Match.
- **League Table** — full standings with form, European/relegation zones, and your club highlighted.
- **Stats** — top scorers, assists, and clean sheets across the league.
- **Save/Load** — autosave after every match + a manual save slot.

The whole AI league simulates alongside you: all 380 fixtures play out, the table is real, and a full season produces realistic results (≈2.6 goals/game, ~82-point title race, ~24-goal Golden Boot).

---

## Project structure

```
index.html            Entry point — open this to play
css/styles.css        Dark "OLED" theme + club-color theming
js/
  core/
    ratings.js         Attribute generation, position-weighted OVR, value & wage
    player.js          Player model: aging, morale, fitness, injuries, form
    club.js            Club model: squad, best-XI selection, team strength, finances
  data/
    clubs.js           20 Premier League clubs (colors, stadiums, reputation)
    squads.js          Real(ish) 2025/26 squads — easy to edit
  engine/
    match.js           The match simulation (score + highlight events + stats)
    league.js          Fixtures (round-robin), table, leaderboards
  save/save.js         localStorage save/load (multi-slot + autosave)
  main.js              Game controller — ties it all together (no DOM here)
  ui/ui.js             All screens, navigation, theming, match reveal
design-system/         UI design tokens (generated)
```

No build step, no dependencies, no server required. Just static files.

---

## Roadmap (planned next, in rough order)

1. **Transfer system** — scouting, bids & negotiations, loans, free agents, two windows.
2. **More leagues** — La Liga, Serie A, Bundesliga, Ligue 1 (playable) + Portugal, Saudi, MLS (players-only, for transfers).
3. **Finance** — full revenue/expense dashboard, facility upgrades, FFP.
4. **Calendar** — day-by-day progression, cups, European competitions, deadline day.
5. **Staff & Youth Academy**, **Press Conferences**, **Manager career & reputation** across multiple clubs.

---

## A note on the data

Clubs, players, ages, nationalities and positions are real (season-start 2025/26 snapshot). The detailed **attribute ratings and values are gameplay approximations**, not official figures — they're tuned to feel right and are trivial to edit in `js/data/squads.js`. Some very late summer-2025 transfers may not be reflected.
