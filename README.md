# BMI Metrics

A BMI calculator that also builds a target weight, a day and a week of meals, and a workout plan. It runs entirely in the browser: no server, no tracking, no account. Everything you type stays in `localStorage`.

## Run it locally

Browsers block `fetch` on `file://`, so serve the folder:

```
python -m http.server
```

then open http://localhost:8000.

## Put it on GitHub Pages (no tools needed)

1. On github.com, click **New repository**, name it, keep it **Public**, and create it.
2. Click **uploading an existing file**, then drag in everything from inside this folder: `index.html`, `sw.js`, `icon.svg`, `manifest.webmanifest`, `README.md` and the `css`, `js`, `data` and `tools` folders. Click **Commit changes**.
3. Go to **Settings > Pages**. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose **main** and **/ (root)**, and click **Save**.
4. After a minute your site is live at `https://<you>.github.io/<repo>/`.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | page markup |
| `css/style.css` | theme (Georgia headings, Verdana text, light and dark) |
| `js/app.js` | calculator, meal and workout generators |
| `data/meals.json` | every meal: `n` name, `k` kcal, `p` protein, `l` diet level (0 vegan, 1 vegetarian, 2 with eggs, 3 non-veg), `g` 1 if it counts as a vegetable dish for the "more veggies" mix |
| `data/exercises.json` | exercises as `[name, equipment, compound]`, equipment letters `g` gym, `d` dumbbells, `b` bodyweight |
| `tools/validate_data.py` | checks the JSON and reports menu sizes per diet |
| `sw.js`, `manifest.webmanifest` | offline use and "install to home screen" |

## Add a meal or exercise

Add a line to the right JSON file, run `python tools/validate_data.py`, commit. Plans are generated from your inputs, so a larger list means more variety.

## Not medical advice

This is general guidance. See a doctor before changing your diet or starting exercise if you have a health condition.
