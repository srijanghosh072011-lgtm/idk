# {Client Name} — Plumbing &amp; HVAC Website

A polished, client-ready 4-page brochure website for a home-service business
(plumbing + HVAC). Inspired by [Big Blue Plumbing](https://bigblueplumbing.au/)
— bold navy-and-blue identity, friendly-bold typography, strong calls to
action, and trust-forward messaging throughout.

Built as **plain HTML + Tailwind CSS (from CDN)**. No build step, no npm, no
framework. Double-click `index.html` to preview.

---

## Pages

| File             | Purpose                                                         |
| ---------------- | --------------------------------------------------------------- |
| `index.html`     | Home — hero, services, trust, reviews, guarantee, FAQ           |
| `services.html`  | Services detail — Plumbing, Heating, Cooling, Water Quality     |
| `about.html`     | Our story, stats, values, certifications                        |
| `contact.html`   | Booking form, phone/email/hours, emergency strip, mini FAQ      |

---

## Personalizing for a client (the only thing you need to know)

The entire site is controlled by **placeholder tokens**. Find-and-replace
these strings across all four HTML files to rebrand for any client.

| Token            | What it is                      | Example                              |
| ---------------- | ------------------------------- | ------------------------------------ |
| `{Client Name}`  | Business / brand name           | `Blue Prairie Plumbing`              |
| `{City}`         | Primary service city            | `Regina`                             |
| `{Region}`       | Province / state                | `Saskatchewan`                       |
| `{Phone}`        | Display phone number            | `(306) 555-0123`                     |
| `{PhoneRaw}`     | Raw phone for `tel:` links      | `3065550123`                         |
| `{Email}`        | Contact email                   | `hello@blueprairieplumbing.com`      |
| `{Address}`      | Street address                  | `123 Main St, Regina, SK`            |
| `{Hours}`        | Business hours                  | `Mon–Fri 7am–7pm · 24/7 Emergency`   |
| `{Years}`        | Years in business               | `15`                                 |
| `{Jobs}`         | Total jobs completed            | `10,000`                             |
| `{License}`      | License / permit number         | `12345-ABC`                          |

### One-shot replacement (Mac / Linux terminal)

From the project folder:

```bash
sed -i '' \
  -e 's/{Client Name}/Blue Prairie Plumbing/g' \
  -e 's/{City}/Regina/g' \
  -e 's/{Region}/Saskatchewan/g' \
  -e 's/{Phone}/(306) 555-0123/g' \
  -e 's/{PhoneRaw}/3065550123/g' \
  -e 's/{Email}/hello@example.com/g' \
  -e 's/{Address}/123 Main St, Regina, SK/g' \
  -e 's/{Hours}/Mon–Fri 7am–7pm · 24\/7 Emergency/g' \
  -e 's/{Years}/15/g' \
  -e 's/{Jobs}/10,000/g' \
  -e 's/{License}/12345-ABC/g' \
  *.html
```

*(Drop the `''` after `-i` on Linux.)*

### From your editor

Use VS Code's project-wide Find &amp; Replace (`⇧⌘H` on Mac, `Ctrl+Shift+H`
on Windows) on `*.html`.

---

## Previewing

Just open `index.html` in a browser. That's it.

For a nicer preview experience with live reload:

```bash
# from the project root
python3 -m http.server 8080
# then visit http://localhost:8080
```

---

## Design system

- **Colors:** deep navy `#0A2A6E`, brand blue `#0B3B8C`/`#1E73E8`, amber CTA
  `#F59E0B`. All colors are defined in a `tailwind.config` block at the top
  of each HTML file — edit once and it propagates.
- **Type:** Plus Jakarta Sans (headings) + Inter (body), loaded from Google
  Fonts.
- **Icons:** inline SVG (Heroicons / Lucide style). No icon fonts, no
  emojis — swap colors with Tailwind `text-*` classes.
- **Responsive:** mobile-first, tested at 375 / 768 / 1024 / 1440 px.
- **Accessibility:** semantic landmarks, visible focus rings, `aria-label`s
  on icon-only buttons, `prefers-reduced-motion` respected.

---

## Swapping images

The hero and Our Story photos use [Unsplash](https://unsplash.com) URLs so
the site works immediately with zero assets. To swap in your own:

1. Drop your image into an `images/` folder.
2. Replace the `src="https://images.unsplash.com/..."` URL with
   `src="images/your-photo.jpg"`.
3. Update the `alt="..."` text to describe the new image accurately.

---

## Adding a real Google Map

On `contact.html`, the map area is a placeholder block. To add a real map:

1. Go to [google.com/maps](https://www.google.com/maps), search your
   business address, click **Share → Embed a map**.
2. Copy the `<iframe>` HTML.
3. Replace the entire placeholder `<div class="aspect-[4/3] ...">...</div>`
   with your `<iframe>`, and give the iframe a `title="Map to {Client Name}"`
   for accessibility.

---

## Contact form backend

The form currently uses `action="mailto:{Email}"` — submissions open the
user's email client pre-filled. Good for a demo, imperfect for production.

To wire up a real backend, pick one:

- **[Formspree](https://formspree.io)** — paste their action URL, done.
- **[Netlify Forms](https://docs.netlify.com/forms/setup/)** — add
  `netlify` attribute to the `<form>` tag when hosting on Netlify.
- **[Basin](https://usebasin.com)** — same idea, different host.
- Your own endpoint — change `action` and `method` to match your API.

---

## Hosting

Drop the four `.html` files on any static host:

- **[Netlify Drop](https://app.netlify.com/drop)** — drag the folder in,
  free, instant URL.
- **[GitHub Pages](https://pages.github.com)** — push to a repo, enable
  Pages.
- **[Vercel](https://vercel.com)** — connect repo, done.
- **Traditional cPanel / FTP** — upload via any FTP client.

---

## Credits

- Hero &amp; story photos: [Unsplash](https://unsplash.com/) (free commercial
  license).
- Fonts: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans),
  [Inter](https://fonts.google.com/specimen/Inter) — Google Fonts.
- Icons: hand-coded inline SVG in the style of Heroicons and Lucide.
- Tailwind CSS: [tailwindcss.com](https://tailwindcss.com) via CDN.
