# Project Handoff — Plumbing & HVAC Brochure Website

## What was built

A fully designed, 4-page static brochure website for a home-service business
(plumbing + HVAC). No framework, no build step — plain HTML + Tailwind CSS
(CDN). Opens by double-clicking `index.html`.

### Pages

| File            | Contents                                                                   |
| --------------- | -------------------------------------------------------------------------- |
| `index.html`    | Hero, 8-card services grid, Why Choose Us, How It Works, Recent Work gallery, Reviews, Service Area, Guarantee, FAQ, CTA |
| `services.html` | Detailed service cards with photos — Plumbing (4), Heating (4), Cooling (3), Water Quality (2), Recent Work gallery |
| `about.html`    | Page hero, Our Story, Stats (4-up), Team In Action photos, Values, Certifications |
| `contact.html`  | Booking form, Contact card, Team photo, Map placeholder, Emergency strip, Mini FAQ |

### Image count
- `index.html` — 16 images
- `services.html` — 18 images
- `about.html` — 5 images
- `contact.html` — 1 image

All photos are Unsplash URLs (free commercial licence, zero local assets).
Swap with real client photos when available — see `README.md` for instructions.

---

## Current state

The site is a **ready-to-personalize template**. All client-specific values are
placeholder tokens. Nothing is live yet.

### What still needs to be filled in before launch

| Token                 | Where it appears                        | Action required              |
| --------------------- | --------------------------------------- | ---------------------------- |
| `{Client Name}`       | Every page — nav, footer, copy, meta    | Replace with business name   |
| `{Email}`             | Footer, contact card, form action       | Replace with contact email   |
| `{Phone}` / `tel:`    | Currently shows "Call Us" / empty `tel:`| Add real phone number        |
| `{Google Reviews URL}`| "Read More Reviews" + "Leave a Review"  | Paste Google Maps review link|
| `{Tech 1–3 Name}`     | Removed (Meet the Team was deleted)     | N/A                          |
| `{Office Name}`       | Removed (Meet the Team was deleted)     | N/A                          |
| License `SK-PL-04872` | Footer all pages                        | Replace with real licence #  |
| Address               | Footer + contact card (demo address set)| Confirm or update            |
| Hours                 | Footer + contact card                   | Confirm or update            |
| Testimonial names     | index.html reviews section              | Replace with real reviews    |
| Social links (`#`)    | Top bar + footer all pages              | Add real Facebook/Instagram URLs |
| Privacy / Terms links | Footer all pages                        | Create pages or remove links |
| Google Map            | contact.html map placeholder            | Embed real Google Map iframe |

Run `grep -rn "{" *.html` at any time to see all remaining tokens.

---

## Personalising (quick start)

From the project folder in terminal:

```bash
sed -i \
  -e 's/{Client Name}/Your Business Name/g' \
  -e 's/{Email}/you@yourdomain.com/g' \
  *.html
```

Full token list and one-shot sed command in `README.md`.

---

## Design system (quick reference)

| Element       | Value                                           |
| ------------- | ----------------------------------------------- |
| Primary blue  | `#0B3B8C` (brand-700)                           |
| Hero gradient | `#0A2A6E → #0B3B8C → #1E73E8`                   |
| CTA amber     | `#F59E0B` (accent-500)                          |
| Heading font  | Plus Jakarta Sans 700–800 (Google Fonts)        |
| Body font     | Inter 400–500 (Google Fonts)                    |
| Icons         | Inline SVG (Heroicons / Lucide style)           |
| Breakpoints   | Mobile-first: 375 / 640 / 768 / 1024 / 1440 px |

All colours are defined in a `tailwind.config` block at the top of each HTML
file — edit once per file if you need to rebrand colours.

---

## Known limitations / intentional trade-offs

- **Form is mailto only** — `action="mailto:{Email}"` with `method="get"`.
  Opens user's email client pre-filled. Works for demos; not production-grade.
  Swap for Formspree / Netlify Forms when ready (see `README.md`).
- **No real map** — contact page shows a placeholder block. Embed a Google
  Maps `<iframe>` to replace it (instructions in `README.md`).
- **No analytics** — add Google Analytics / Plausible snippet to `<head>` of
  each page when ready.
- **Social links are `#`** — all Facebook, Instagram, Google Reviews hrefs
  need real URLs before launch.
- **Testimonials are demo content** — three fake reviews. Replace with real
  customer quotes.

---

## Repo & branch

- **Repo:** `srijanghosh072011-lgtm/idk`
- **Branch:** `claude/ui-ux-pro-max-ZgumW`
- **Last commit:** `e2e0906` — Fix three bugs found in audit

---

## How to go live

1. Fill in all tokens (see table above).
2. Swap Unsplash photos for real client photos.
3. Hook up a form backend (Formspree recommended — free tier is fine).
4. Embed real Google Map on contact page.
5. Add social media URLs.
6. Deploy — drag the folder to **Netlify Drop** for the fastest live URL
   (free, no account needed, live in 30 seconds).

See `README.md` for full hosting options.
