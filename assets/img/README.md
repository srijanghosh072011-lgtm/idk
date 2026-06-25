# 📸 Photo shopping list — drop-in real images

**The site is fully wired for photos.** Every slot below is a real `<img>` that
shows a branded navy panel until you drop the file in — so nothing ever looks
broken, and adding a photo is just: *save file → refresh.* No code changes, no
rebuild needed.

**Look & feel:** gritty, industrial, trade-authentic — real hands, pipes, tools,
trucks, work boots, job sites. Think "this crew actually does the work," not
glossy stock-model smiles. Lean to the brand: cool/neutral tones play well with
the navy + copper palette.

**Licence:** all links go to **Unsplash** and **Pexels** — both **free for
commercial use, no attribution required.** (Crediting the photographer is a nice
courtesy.) Confirm the licence note on the page before you publish.

---

## How to add each one (≈2 min)

1. Click the **search link** for a slot.
2. Pick a shot matching the description (the gritty/industrial one).
3. Download (Unsplash/Pexels "Download" → a medium size, ~1600px wide is plenty).
4. **Shrink it** at **https://squoosh.app** → export **WebP** or JPG, aim **< 200 KB**.
   (Big photos are the #1 thing that slows a site down.)
5. Save into **this folder** (`assets/img/`) using the **exact filename** shown.
6. Re-upload / push. Done — refresh the page and the photo appears.

> The markup already sets the crop, `width`/`height` (no layout jump) and
> lazy-loading. The hero is flagged high-priority. You don't need to touch code.

---

## 🔴 DO THESE FIRST — hero + services (highest impact)

| Save as | Shows up on | What to grab (gritty/industrial) | Crop | Search link |
|---|---|---|---|---|
| `hero-plumber.jpg` | **Home hero** (the big banner) | A real plumber, hands-on with a wrench under a sink or on a pipe. Room on one side for text. The money shot. | wide 16:10 | https://unsplash.com/s/photos/plumber-working · https://www.pexels.com/search/plumber/ |
| `og-cover.jpg` | Link previews (texts, social) | Same vibe as the hero — can literally be a crop of it, sized 1200×630. | 1.91:1 | reuse hero, or https://unsplash.com/s/photos/plumbing |
| `emergency-pipe.jpg` | Emergency service page **+ home "Emergency" card** | Hands on a burst/leaking pipe, wrench, water. Urgent, wet, real. | tall 3:4 | https://unsplash.com/s/photos/pipe-leak · https://www.pexels.com/search/burst%20pipe/ |
| `drain-camera.jpg` | Drain page **+ home "Drain" card** | A drain snake / auger / inspection camera / floor-drain work. | 4:3 | https://unsplash.com/s/photos/drain-cleaning · https://www.pexels.com/search/drain/ |
| `water-heater.jpg` | Water-heater page **+ home "Water Heaters" card** | Plumber connecting a tank/tankless heater — gas line, venting, fittings. | 4:3 | https://unsplash.com/s/photos/water-heater · https://www.pexels.com/search/water%20heater/ |
| `svc-fixtures.jpg` | Home "Fixtures" card | Installing a faucet / shut-off valves / under-sink supply lines. Tools out. | 16:9 | https://unsplash.com/s/photos/faucet-install · https://www.pexels.com/search/faucet/ |
| `svc-sump.jpg` | Home "Sump Pumps" card | A sump pump in its basin / basement pit, or a backwater valve. | 16:9 | https://unsplash.com/s/photos/sump-pump · https://www.pexels.com/search/sump%20pump/ |
| `svc-leak.jpg` | Home "Leak Detection" card | Hands on copper pipe with a wrench / gauge / detection tool. | 16:9 | https://unsplash.com/s/photos/copper-pipe-repair · https://www.pexels.com/search/pipe%20wrench/ |

---

## 🟠 NEXT — trust + local

| Save as | Shows up on | What to grab | Crop | Search link |
|---|---|---|---|---|
| `team.jpg` | About — the crew | A few uniformed tradespeople by a truck or job site. Friendly but real. | 3:2 | https://unsplash.com/s/photos/plumber-team · https://www.pexels.com/search/construction%20workers/ |
| `about-van.jpg` | Home "why us" + About | A work/service van, or a tech walking to a door with a tool bag. | 3:2 | https://unsplash.com/s/photos/work-van · https://www.pexels.com/search/work%20van/ |
| `regina-home.jpg` | Regina area page | An older character home or a snowy prairie street. | 4:3 | https://unsplash.com/s/photos/canadian-house-winter |
| `white-city.jpg` | White City area page | A newer two-storey executive home, large lot. | 4:3 | https://unsplash.com/s/photos/suburban-house |
| `emerald-park.jpg` | Emerald Park area page | A modern family home with an attached garage. | 4:3 | https://unsplash.com/s/photos/family-home |
| `pilot-butte.jpg` | Pilot Butte area page | A bungalow under a big open prairie sky. | 4:3 | https://unsplash.com/s/photos/prairie-house |

---

## 🟡 LAST — blog headers

| Save as | Shows up on | What to grab | Crop | Search link |
|---|---|---|---|---|
| `blog-frozen-pipe.jpg` | Blog index + frozen-pipe article | Frost/ice on an exposed pipe, or a frozen exterior tap. | 16:9 | https://unsplash.com/s/photos/frozen-pipe |
| `blog-hard-water.jpg` | Blog index + hard-water article | Limescale/mineral buildup on a chrome faucet or aerator, close-up. | 16:9 | https://unsplash.com/s/photos/faucet-closeup |
| `blog-sump.jpg` | Blog index | A sump pump basin / basement floor (can reuse `svc-sump`). | 16:9 | https://unsplash.com/s/photos/basement-sump |

---

## In a hurry?

Just do the **🔴 first group** (8 photos). That covers the hero and every
service card — the parts everyone sees. The rest already look intentional as
navy brand panels, so the site is presentable at every stage.

**Total slots: 17.** Reuse is fine — e.g. one good `svc-sump.jpg` can serve both
the sump card and the blog-sump slot.
