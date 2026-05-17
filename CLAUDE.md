# Ghosh Designs — Project Context

## Business

**Ghosh Designs** is a web design studio founded by Srijan Ghosh, based in **Regina, SK, Canada**.

**Niche:** Custom websites exclusively for plumbing and home-service businesses.  
**Positioning:** Founding studio, currently accepting first clients. Small, focused, no account managers or offshore handoffs.  
**Owner contact:** srijan.ghosh072011@gmail.com

### Pricing
| Service | Price |
|---|---|
| Website build | $2,500 one-time |
| Monthly hosting plan | $450/month |

**Build includes:** 5–8 pages, mobile-friendly, contact form, professional design, 4–6 week delivery.  
**Monthly plan includes:** Hosting, plugin & theme updates, daily backups, security monitoring, small edits, monthly performance report.

**Pricing rules:** Never drop below $2,500 for a build or $350/mo for the monthly plan without explicit instruction. Never volunteer a discount.

---

## Website

**Live URL:** https://srijanghosh072011-lgtm.github.io/idk/  
**Repo:** srijanghosh072011-lgtm/idk  
**Dev branch:** `claude/design-agency-website-oYTO9`  
**Live branch:** `gh-pages`

> **Every change must be deployed to both branches.** Develop on the feature branch, then deploy to `gh-pages` using the CDN swap (see below).

### Tech Stack
- Single-file `index.html` (~1,500 lines)
- **Tailwind CSS** — local build pipeline
- **Fonts:** Archivo (display/headings) + Space Grotesk (body)
- **No framework, no build tool beyond Tailwind**

### Local build command
```bash
./node_modules/.bin/tailwindcss -i src/input.css -o assets/styles.css --minify
```

### Deploy to gh-pages (CDN swap)
The live site uses the Tailwind CDN instead of the local build. The deploy replaces `<link rel="stylesheet" href="./assets/styles.css" />` with the CDN script + inline config:

```bash
CDN_BLOCK='<script src="https:\/\/cdn.tailwindcss.com"><\/script>\n<script>\n  tailwind.config = {\n    theme: {\n      extend: {\n        fontFamily: {\n          display: ['"'"'Archivo'"'"', '"'"'system-ui'"'"', '"'"'sans-serif'"'"'],\n          sans: ['"'"'"Space Grotesk"'"'"', '"'"'system-ui'"'"', '"'"'sans-serif'"'"'],\n        },\n        colors: {\n          ink: '"'"'#0A0A0A'"'"',\n          muted: '"'"'#525252'"'"',\n          line: '"'"'#E5E5E5'"'"',\n          paper: '"'"'#FAFAFA'"'"',\n          accent: '"'"'#2563EB'"'"',\n          accentSoft: '"'"'#EFF4FF'"'"',\n        },\n        letterSpacing: {\n          tightest: '"'"'-0.05em'"'"',\n        },\n      },\n    },\n  };\n<\/script>'

sed "s|<link rel=\"stylesheet\" href=\"./assets/styles.css\" />|$CDN_BLOCK|" index.html > /tmp/deploy_index.html
git checkout gh-pages
cp /tmp/deploy_index.html index.html
git add index.html
git commit -m "Deploy: <description>"
git push -u origin gh-pages
git checkout claude/design-agency-website-oYTO9
git push origin claude/design-agency-website-oYTO9
```

---

## Visual Identity

| Token | Value |
|---|---|
| `ink` | `#0A0A0A` (near-black) |
| `muted` | `#525252` (grey) |
| `line` | `#E5E5E5` (borders) |
| `paper` | `#FAFAFA` (light bg) |
| `accent` | `#2563EB` (brand blue) |
| `accentSoft` | `#EFF4FF` (light blue tint) |
| Body bg | `#F0F5FF` |

**Display font:** Archivo (900 black for headings)  
**Body font:** Space Grotesk  
**Letter spacing:** `tracking-tightest` = `-0.05em`

---

## Site Sections (top to bottom)

1. **Fixed nav** — GD lockup + "Ghosh Designs" wordmark, Services / Process / About / FAQ links, "Book a call" CTA
2. **Hero** — Dark (`#0A0F1E`), bold headline "Websites that turn calls into jobs.", tilted browser mockup (frozen plumber-site snapshot), multi-blob aurora glow field behind mockup, founding studio bar at bottom
3. **Capabilities marquee** — looping ticker of plumbing service types
4. **Hero library** — auto-scrolling gallery of 6 sample hero designs (emergency, heritage, modern, commercial, eco, trusted-local)
5. **Manifesto** — "We don't do templates." section
6. **Services** — flagship card ($2,500 build + $450/mo plan breakdown), two secondary cards (landing pages, site refreshes)
7. **Process** — 4-step timeline: 01 Discover → 02 Design → 03 Build → 04 Launch
8. **Specialties** — 6-icon grid of plumbing service types
9. **Studio philosophy** — Figma mockup UI (dark), label: "Ghosh Designs / Client Site — Homepage v1"
10. **Concept work** — static scrollable grid of 5 website mockup cards
11. **Why us** — comparison table (typical agency vs. Ghosh Designs)
12. **FAQ** — 5 collapsible questions
13. **Contact / CTA** — form with mailto handler → thank-you state after submit, direct email link
14. **Footer** — GD lockup, sitemap, studio status ("Based in Regina, SK"), copyright

---

## Logo

**Mark:** Rounded square (rx=14) with blue gradient (`#1e40af` → `#0c1445`), bold white "GD" in Archivo 900, tightly kerned.  
**Wordmark:** "Ghosh Designs" in Archivo extrabold.  
**Nav size:** 36×36px mark  
**Footer size:** 40×40px mark  
**CSS class:** `.logo-mark` / `.logo-mark-lg`

---

## Contact Form

Uses a `mailto:` handler — on submit, opens the visitor's email client pre-filled with their name, email, and message addressed to `srijan.ghosh072011@gmail.com`. After submit, the form is replaced with a thank-you card that shows their first name, confirms the email opened, and offers "Send another" / "Back to top" buttons.

**Limitation:** Requires visitor to have an email client configured. Future upgrade: replace with Formspree endpoint (add `action="https://formspree.io/f/XXXX"` and `method="POST"` to the form, remove the JS handler).

---

## Known Pending Items

- **Social proof** — no real testimonials or client work yet. Add when first client is onboarded.
- **About section** — currently just a comparison table, no personal story.
- **Privacy / Terms pages** — footer links go to `#` placeholders.
- **Social links** — Dribbble, Instagram, LinkedIn removed (no profiles yet). Add real URLs when ready.
- **Formspree upgrade** — replace mailto form handler with Formspree for reliable delivery.

---

## Important Notes

- The hero iframe (`id="mockup-iframe"`) points to a **frozen snapshot** of an old version of the site that looks like a plumber's website. Do NOT change this URL to the live gh-pages URL — it will cause an infinite loop (the site showing itself inside itself).
- All copy uses **"we/us"** voice — not "I/me". This is intentional (founding studio positioning).
- The site is intentionally honest about being a new studio ("founding studio", "accepting first clients") — do not add fake testimonials, fake client logos, or fake case studies.
- Pricing language: **never apologise for the price, never volunteer a discount.**
