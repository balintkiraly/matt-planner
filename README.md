# MATT planner

A small **participant** app for hike/orienteering-style races: enter checkpoints from your race sheet, add bonus combos, mark visits, and see your score. Optional map and area selection to plan routes.

*Vibe coded* - built iteratively with AI pair programming, not from a formal spec.

## What it does

- **Points** — Add checkpoints (ID, coords, base score, task). Click the map to fill in coordinates. Points are color-coded by score (green → red) and purple if they’re in a bonus combo.
- **Bonus combinations** — Define combos (e.g. visit 1, 4, 9 for +200). Score and “in combo” indicators update automatically.
- **Visited** — Mark points as visited; total score (base + bonuses) updates live.
- **Area selection** — Click “Select area”, drag a rectangle on the map to see how many points and what score you’d get in that zone.
- **Persistence** — Data is saved in `localStorage` so a refresh doesn’t wipe it.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (e.g. `http://localhost:5173`).

## Stack

- React 18, TypeScript, Vite  
- Tailwind CSS  
- Leaflet + react-leaflet (map, markers, area selection)

## Scripts

- `npm run dev` — dev server  
- `npm run build` — production build  
- `npm run preview` — preview production build  
- `npm run lint` — ESLint  
