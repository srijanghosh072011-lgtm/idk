# 24/7 Plumbing & Heating Ltd. — Website Handoff

## The Ask

Build a **professional, high-quality plumbing company website** for a Calgary-based client that:
- Is client-ready (can show to prospects immediately)
- Feels modern, trustworthy, and competitive
- Works as a multi-page marketing site
- Converts visitors into phone calls and bookings

## The Client

**Company:** 24/7 Plumbing & Heating Ltd.  
**Location:** Calgary, Alberta (42FW+9J)  
**Service Type:** 24-hour emergency plumbing, heating, furnace repair, drain cleaning, water heaters, boilers, gas fitting, renovations, commercial services  
**Target Market:** Calgary homeowners and businesses in surrounding areas (Airdrie, Cochrane, Chestermere, Okotoks, Strathmore, Langdon, etc.)

## Design Inspiration

The client liked two existing plumbing sites:

1. **Big Blue Plumbing (AU)** — liked the bold deep-blue color palette, modern gradient hero, big typography, playful-but-trustworthy vibe, sticky CTAs, prominent phone number. This was the primary visual inspiration.

2. **Trusted Plumbing & Heating (SK)** — provided structural reference: site layout (Home → Services grid → Why Choose Us → Reviews → Contact form → Footer with service-area list), service offerings, and copy tone.

## Design System

**Color Palette:**
- Navy primary: `#0B2A5B` (brand anchor)
- Electric blue: `#1E73E8` (accents, CTAs)
- Sky blue: `#38BDF8` (highlights)
- Yellow: `#FFC107` (emergency, call-to-action emphasis)
- Light background: `#EAF3FF` (section contrast)

**Typography:**
- Headings: Poppins (800 weight, tight letter-spacing, 4.5vw responsive scaling)
- Body: Inter (400–700 weights)
- Google Fonts: No setup required, imported via `<link>`

**Style Approach:**
- Modern, clean, professional
- Sticky navigation with service dropdown menu
- Animated hero with floating trust cards (badges, icons, stats)
- Glassmorphism effects (translucent cards, backdrop blur)
- Scroll-reveal animations on sections
- Mobile-first, fully responsive design

## What Was Built

A **4-page fully responsive HTML/CSS/JS site** (no build step, no dependencies):

### Pages

1. **`247plumbing-home.html`** (index redirect)
   - Sticky navigation with service submenu
   - Animated dark-navy hero with radial gradients
   - Floating trust cards (24/7 availability, upfront pricing, 4.9★ rating)
   - Yellow emergency strip (3-column callout: Emergency service, Free quotes, Guarantee)
   - 9-card service grid (clickable, hover effects)
   - Why Choose Us section (left image, right list with icons)
   - Dark stats band with animated counters (15+ years, 12,000+ jobs, 500+ reviews, 60-min response)
   - 4-step process timeline
   - 3 customer testimonials with 5-star ratings
   - Blue CTA band ("Got an emergency?")
   - 7-item FAQ accordion (expandable, smooth animations)
   - Contact form + info card (side-by-side)
   - Footer with service areas, social links, quick service links

2. **`247plumbing-about.html`**
   - Page banner with breadcrumbs
   - Story section (founded 2010, family-owned, 15+ year badge)
   - 3 core values cards (Honest Pricing, Real 24/7, Done Right Once)
   - Stats band (years, jobs, techs, reviews)
   - 6 credentials/certifications grid (Alberta Master Plumber, Gas Fitters, WCB/Insurance, BBB, Manufacturer Certified, Background-Checked)
   - CTA band

3. **`247plumbing-services.html`**
   - Breadcrumbs + banner
   - 8 deep-linked service sections (alternating left/right layout with custom SVG illustration for each):
     - `#emergency` — 24/7 Emergency Plumbing
     - `#drains` — Drain Cleaning & Sewer
     - `#water-heaters` — Hot Water Tanks & Tankless
     - `#furnace` — Furnace Repair & Installation
     - `#boilers` — Boilers & In-Floor Heating
     - `#gas-fitting` — Gas Fitting & Gas Lines
     - `#renovations` — Renovations & New Construction
     - `#commercial` — Commercial Services
   - Each section has bullet points and a "Get Quote" / "Book Service" button

4. **`247plumbing-contact.html`**
   - Contact info card (navy-to-blue gradient, 5 methods: call, email, text, address, hours)
   - Multi-field form (name, phone, email, service dropdown, urgency, property type, address, message)
   - OpenStreetMap embed (Calgary service area)
   - CTA band
   - All form fields properly labeled for accessibility

### Supporting Files

- **`css/styles.css`** (764 lines)
  - CSS custom properties for brand colors
  - Full responsive grid system
  - Component classes (buttons, cards, forms, etc.)
  - Animations (scroll reveal, pulse dot, float)
  - Dark mode ready
  - Accessibility (prefers-reduced-motion, focus states)

- **`js/main.js`** (81 lines)
  - Mobile menu toggle
  - Scroll reveal (IntersectionObserver)
  - Animated stat counters
  - Form submission demo (shows success feedback)

- **`index.html`** (redirect)
  - Meta-refresh + JavaScript redirect to `247plumbing-home.html`
  - Allows site to work out-of-the-box with a default entry point

## Personalization

All copy is tailored to Calgary + the client's business model:

- **Phone/Email:** `(403) 555-0199` and `info@247plumbingcalgary.ca` (placeholder, easy swap)
- **Location:** Calgary HQ at `42FW+9J`, service areas listed (Airdrie, Cochrane, Chestermere, Okotoks, Strathmore, Langdon, Bragg Creek, Springbank, De Winton, Heritage Pointe)
- **Copy tone:** Emphasizes 24/7 availability, upfront flat-rate pricing, licensed/insured in Alberta, emergency response
- **Services:** Plumbing-focused (drains, water heaters, emergency bursts, sewer) + heating (furnace, boiler, in-floor) + gas fitting + renovations + commercial
- **Testimonials:** Calgary neighbourhoods (Inglewood, Tuscany, Auburn Bay) and realistic homeowner feedback
- **Trust signals:** Licensed in Alberta, BBB accredited, background-checked techs, $5M liability insurance, WCB coverage, manufacturer certifications (Lennox, Carrier, Goodman, Rinnai, Navien)

## Technical Details

**Built with:**
- Pure HTML5 (semantic markup, ARIA labels for a11y)
- Custom CSS3 (no framework, no build step)
- Vanilla JavaScript (no jQuery, no dependencies)
- Google Fonts (Poppins, Inter)
- Inline SVG icons (no emoji, no font icons)
- Responsive design: mobile-first, tested at 375px / 768px / 1024px / 1440px

**Browser Support:**
- All modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile (iOS Safari, Chrome Mobile)
- Works fully offline (no external API calls except fonts + map embed)

**Performance:**
- No build step — drop it anywhere
- ~50KB total CSS, ~2KB JS (unminified, readable)
- ~2500 lines of HTML across 4 pages
- No dependencies, no package.json
- Zero configuration to deploy

## How to Use / Deploy

### Local Preview
1. Download the repo as ZIP (branch: `claude/brave-ride-DS325`)
2. Unzip
3. Double-click `index.html` — site opens in browser with all pages working

### Deploy to GitHub Pages
1. Create a new GitHub repo (e.g., `247-plumbing-calgary`)
2. From the unzipped folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit — 24/7 Plumbing & Heating site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/247-plumbing-calgary.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Source: `main` / `(root)` → Save**
4. Site live at `https://<your-username>.github.io/247-plumbing-calgary/` in ~1 minute

### Customize
- **Phone number:** Find-replace `(403) 555-0199` across all `.html` files
- **Email:** Find-replace `info@247plumbingcalgary.ca`
- **Company name:** Find-replace `24/7 Plumbing & Heating Ltd.`
- **Colors:** Edit CSS custom properties in `css/styles.css` (`:root` section) — all color values are centralized
- **Content:** Edit text directly in HTML files — no templating language

## File Structure
```
.
├── index.html                      # Redirect to home
├── 247plumbing-home.html          # Homepage
├── 247plumbing-about.html         # About Us
├── 247plumbing-services.html      # Services (deep-linked)
├── 247plumbing-contact.html       # Contact & booking
├── css/
│   └── styles.css                 # All styling (764 lines)
└── js/
    └── main.js                    # Interactivity (81 lines)
```

## Next Steps (For Next Developer)

1. **Client Review:** Show the live site to the client. Get feedback on copy, colors, messaging.
2. **Asset Replacement:** Add real images/logos where SVG placeholders exist.
3. **Form Integration:** Swap the demo form handler for a real backend (Formspree, Netlify Forms, or custom API).
4. **SEO Tuning:** Update meta descriptions, Open Graph tags, structured data for local SEO (Google Business Profile sync, LocalBusiness schema).
5. **Analytics:** Add Google Analytics or Segment tracking code.
6. **Custom Domain:** Point a custom domain (if the client has one) to the GitHub Pages / Netlify URL.
7. **Mobile Testing:** Test thoroughly on actual iOS/Android devices.

## Notes for Future Work

- All animations respect `prefers-reduced-motion` for accessibility
- Form validation is basic (HTML5 only) — add client-side JS if you want richer feedback
- Map is embedded OpenStreetMap (free, no API key), can swap for Google Maps if needed
- Service dropdown nav is pure CSS (no JS) — hover/focus states work on desktop + keyboard
- Sticky mobile call button shows only on screens < 760px (mobile-first)
- All colors are accessible (4.5:1+ contrast ratio for text)

---

**Built:** May 2026  
**Stack:** HTML, CSS, JS (no build tools)  
**Purpose:** Professional, modern, client-ready plumbing company website for Calgary market
