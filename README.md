# Upperlatives — headless React front end

React 19 + Vite + Tailwind CSS v4. All content comes from the WordPress REST API at
`https://wp.upperlatives.com` (a local copy runs at `https://upper.test`). The design follows [paul-michel.framer.website](https://paul-michel.framer.website/).

```bash
npm install
npm run dev      # https://localhost:5173 (uses ~/.local-ssl certs if present)
npm run build    # static files in dist/
npm run lint
```

## Configuration

| File | What it holds |
| --- | --- |
| `.env` | Defaults: `VITE_WP_URL=https://wp.upperlatives.com`. In dev, `/wp-json` and `/wp-content` are proxied there. |
| `.env.local` | Your machine's overrides (not committed), e.g. switch to the local copy `https://upper.test`. |
| `.env.production` | Used by `npm run build`: same URL plus `VITE_WP_DIRECT=true`, so the built site calls WordPress directly. |
| `src/site.config.js` | Navigation, footer links, contact details, slug aliases, hero variants, ribbon words. |
| `src/index.css` | Design tokens (colours, fonts, radius) in `@theme`. |

Fonts are self-hosted from npm (`@fontsource-variable/inter` with the optical-size axis for
"Inter Display", and `@fontsource/ibm-plex-mono`). The site makes no Google Fonts requests.

## How WordPress content becomes the design

Every URL is looked up in the WordPress page tree, so a newly published page works without code
changes. Each page's top-level `<section class="upl-…">` group gets a design:

| WordPress section | Rendered as |
| --- | --- |
| `upl-hero` (H1, paragraph, buttons) | Home: giant wordmark + two text columns. `/work/`: big title + 3D card stack. Pages under `/services/`: centred title. Others: big left title. A **featured image** shows large below the hero. |
| `upl-answer` | Dark panel: label left, large text right |
| any group containing `upl-card` groups | Two-column image cards that tilt in on scroll. A card that links to a page uses that page's featured image; an image inside the card wins. With no image, a gradient is used. |
| a group with an `<ol>` list (`upl-process`, `upl-phases`, …) | Dark panel with numbered rows. Write items as **Bold title** — description. |
| `upl-faq` or any `<details>` | Accordion + FAQPage schema (JSON-LD) |
| `upl-testimonials` / quotes | Large pull quote |
| `upl-related` | Large link rows |
| `upl-trust` | One centred mono line |
| `upl-cta` | Dark closing panel with the 3D word ribbon |
| anything else | Mono label (the H2) on the left, text on the right. Lists become two columns. |

Writing tips:
- **Bold** words in hero and panel text render as the dark "highlight" on grey text.
- A paragraph that holds only a link (e.g. `See our full process →`) becomes a mono arrow link.
- Buttons: the default style is solid, and the **Outline** style becomes the light pill.

## Before going live

See also the SEO/GEO/UX checklist in [docs/seo-geo-ux-audit.md](docs/seo-geo-ux-audit.md).

- Rename the `services-2`, `work-2`, `contact-2` and `home-2` slugs in WordPress, delete the old
  *Studio* / *Contact* pages, then remove the matching `slugAliases` in `src/site.config.js`.
- Fill in the footer contact and social links in `src/site.config.js`. A German site also needs an
  Impressum page: add it to `footer.legal`.
- The server must send every unknown path to `index.html` (SPA fallback).
- Search engines and AI crawlers get an empty HTML shell until JavaScript runs. For SEO/GEO,
  add build-time prerendering, for example by fetching all pages in a build script and writing
  static HTML per route.
