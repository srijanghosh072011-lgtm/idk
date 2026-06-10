# Tideline — Don't Let Paradise Fade

A single-page coastal conservation site. The hero shows a pristine beach that
crossfades into the same beach polluted when you hover (tap on touch devices),
then tells the story in chapters: the problem, how it happens, the fix, and a
call to action.

## Run it

No build step — it's a single self-contained `index.html`.

```bash
npx http-server .   # or just open index.html in a browser
```

## Structure

- `index.html` — all markup, styles, and scripts
- `assets/hero-clean.webp` — hero image, pristine state
- `assets/hero-polluted.webp` — hero image, polluted state (shown on hover/tap)
