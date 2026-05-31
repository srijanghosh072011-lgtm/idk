# Ghosh Designs — Project Handoff

## The Business
**Ghosh Designs** — web design studio for plumbing and home-service businesses.  
**Owner:** Srijan Ghosh  
**Email:** srijan.ghosh072011@gmail.com  
**Location:** Regina, SK, Canada  
**Live site:** https://ghoshdesigns.ca  
**Repo:** srijanghosh072011-lgtm/idk (GitHub)

---

## Pricing
| Service | Price |
|---|---|
| Website build | $2,500 CAD (currently $1,750 — 30% founding discount) |
| Monthly hosting plan | $450/month |

**Rules:** Never go below $2,500 build / $350/mo hosting without explicit instruction. Never volunteer a discount.

---

## Tech Stack
- Single-file `index.html` (~1,500 lines)
- **Tailwind CSS** — local build pipeline
- **Fonts:** Archivo (headings) + Space Grotesk (body)
- No framework, no build tool beyond Tailwind

### Local build command
```bash
./node_modules/.bin/tailwindcss -i src/input.css -o assets/styles.css --minify
```

### Deploy to gh-pages (CDN swap)
```bash
CDN_BLOCK='<script src="https:\/\/cdn.tailwindcss.com"><\/script>\n<script>\n  tailwind.config = {\n    theme: {\n      extend: {\n        fontFamily: {\n          display: ['"'"'Archivo'"'"', '"'"'system-ui'"'"', '"'"'sans-serif'"'"'],\n          sans: ['"'"'"Space Grotesk"'"'"', '"'"'system-ui'"'"', '"'"'sans-serif'"'"'],\n        },\n        colors: {\n          ink: '"'"'#0A0A0A'"'"',\n          muted: '"'"'#525252'"'"',\n          line: '"'"'#E5E5E5'"'"',\n          paper: '"'"'#FAFAFA'"'"',\n          accent: '"'"'#2563EB'"'"',\n          accentSoft: '"'"'#EFF4FF'"'"',\n        },\n        letterSpacing: {\n          tightest: '"'"'-0.05em'"'"',\n        },\n      },\n    },\n  };\n<\/script>'

sed "s|<link rel=\"stylesheet\" href=\"./assets/styles.css\" />|$CDN_BLOCK|" index.html > /tmp/deploy_index.html
git checkout gh-pages
git pull origin gh-pages
cp /tmp/deploy_index.html index.html
git add index.html
git commit -m "Deploy: <description>"
git push -u origin gh-pages
git checkout claude/design-agency-website-oYTO9
git push origin claude/design-agency-website-oYTO9
```

> **Every change must go to both branches.** Develop on `claude/design-agency-website-oYTO9`, deploy to `gh-pages`.

---

## What's Done

### Site
- [x] Full single-page site live at https://ghoshdesigns.ca
- [x] Custom domain purchased (ghoshdesigns.ca via Namecheap)
- [x] DNS configured (4 A records + CNAME → GitHub Pages)
- [x] Google Search Console verified + sitemap submitted + indexing requested
- [x] JSON-LD LocalBusiness schema markup
- [x] Open Graph / Twitter Card meta tags
- [x] og-image.svg (1200×630 social preview card)
- [x] sitemap.xml, robots.txt, manifest.json all pointing to ghoshdesigns.ca
- [x] Contact form wired to Formspree (endpoint: https://formspree.io/f/xqejygkd)
- [x] 30% founding discount shown on pricing card ($1,750 strikethrough $2,500)
- [x] Code audit: removed 184 lines of dead CSS/JS/HTML, fixed section numbering, removed fake US phone/location references, removed Figma references
- [x] Google verification meta tag in `<head>`

### Infrastructure
- [x] GitHub Pages hosting (free)
- [x] Namecheap domain (ghoshdesigns.ca)
- [x] Formspree contact form (free tier)

---

## Pending — Owner Must Do

### Urgent
- [ ] **HTTPS enforcement** — Go to GitHub repo Settings → Pages → check "Enforce HTTPS" once the checkbox is no longer greyed out. Should be available within 24–48 hours of DNS setup.
- [ ] **Formspree verification** — Send a test message through the contact form. Formspree will send a confirmation email to srijan.ghosh072011@gmail.com. Click confirm. After that, all submissions flow through.

### This Week
- [ ] **Google Business Profile** — go to google.com/business, create a profile for "Ghosh Designs" in Regina, SK. Add phone, website (ghoshdesigns.ca), hours. This puts you on Google Maps.
- [ ] **Email forwarding** — In Namecheap → Email Forwarding, set up hello@ghoshdesigns.ca → srijan.ghosh072011@gmail.com so clients can email your branded address.
- [ ] **Check Google Search Console** — In ~1 week, visit the Performance tab to see if the site is appearing in search results.

### When Ready
- [ ] **Calendly integration** — Create a Calendly account, share the booking URL, and it can be wired to the "Book a call" nav button.
- [ ] **Stripe** — Once set up, a payment link or button can be added to the site.
- [ ] **Social proof** — Add real testimonials and case study screenshots once first client is onboarded. No fake reviews.
- [ ] **Social links** — Dribbble, Instagram, LinkedIn links are removed (footer placeholders). Add real URLs when profiles exist.
- [ ] **Privacy / Terms pages** — Footer links go to `#`. Create real pages when ready.
- [ ] **Google Analytics** — Optional. Create account at analytics.google.com, link to ghoshdesigns.ca.
- [ ] **Local citations** — Submit to Yellow Pages Canada, Local.ca, BBB Canada with identical name/address/phone.

---

## Important Notes for Next Developer

- The hero iframe (`id="mockup-iframe"`) points to a **frozen snapshot** of an old site version that looks like a plumber site. Do NOT change this URL to the live gh-pages URL — it causes an infinite loop (site inside itself).
- All copy uses **"we/us"** voice, not "I/me." Intentional — founding studio positioning.
- Do NOT add fake testimonials, fake client logos, or fake case studies. The site is honest about being a new studio.
- Never apologise for pricing, never volunteer a discount.
- The `assets/styles.css` file is a local Tailwind build. Run the build command after any class changes, otherwise new classes won't render locally. The gh-pages branch uses CDN instead.

---

## Accounts Summary

| Service | Purpose | Notes |
|---|---|---|
| GitHub (srijanghosh072011-lgtm) | Hosting | Repo: idk |
| Namecheap | Domain registrar | ghoshdesigns.ca |
| Formspree | Contact form | Endpoint: xqejygkd, needs verification email clicked |
| Google Search Console | SEO monitoring | Verified, sitemap submitted |
| Google Business Profile | Local SEO | Not yet created |

---

## Site Sections (top to bottom)

1. Fixed nav — GD lockup, Services / Process / About / FAQ, "Book a call" CTA
2. Hero — dark (#0A0F1E), bold headline, tilted browser mockup, aurora glow, founding bar
3. Capabilities marquee — looping ticker of plumbing service types
4. Hero library — auto-scrolling gallery of 6 sample hero designs
5. Manifesto — "We don't do templates."
6. Services — $1,750 build card (30% off $2,500) + $450/mo plan + 2 secondary cards
7. Process — 4-step timeline: Discover → Design → Build → Launch
8. Specialties — 6-icon grid
9. Studio philosophy — custom design mockup UI
10. Concept work — scrollable grid of 5 mockup cards
11. Why us — comparison table (typical agency vs. Ghosh Designs)
12. FAQ — 5 collapsible questions
13. Contact / CTA — Formspree form with thank-you state
14. Footer — GD lockup, sitemap, Regina SK, copyright
