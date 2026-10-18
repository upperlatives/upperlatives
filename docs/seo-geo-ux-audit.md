# SEO, GEO & UX audit — home page

Audited 2026-10-18 against `https://localhost:5173/` (content from `https://wp.upperlatives.com`).
Lighthouse, mobile, production build: **Performance 81 · Accessibility 90 · Best practices 100 · SEO 92**.
The SEO score is misleading: Lighthouse runs JavaScript, most crawlers don't (see 1).

Tick items off as they are done. Sections 3 and 5 are content work in WordPress; the rest are code changes.

## 1. Critical — crawlers and AI tools get an empty page

Fetching the site without JavaScript returns only `<title>Upperlatives</title>` and an empty
`<div id="root">`; all content arrives later from the WordPress API.

- Google renders JavaScript, but in a delayed second pass: slower, less reliable indexing.
- AI crawlers (GPTBot, ClaudeBot, PerplexityBot) mostly don't run JavaScript: the site is invisible to
  them, so it can't be cited in AI answers.
- Mobile LCP is 3.9 s (the main text waits for JavaScript, then for the API).

- [ ] Prerender every page to static HTML at build time (React Router 7 framework mode has this built
      in), and rebuild when content is published in WordPress (webhook).
- [ ] Unknown URLs return a real 404 status (comes with prerendering).

## 2. Technical SEO

- [ ] `robots.txt` (currently returns the app's HTML — Lighthouse: "robots.txt is not valid"); allow AI crawlers explicitly.
- [ ] `sitemap.xml` generated from the WordPress pages at build time.
- [ ] `<link rel="canonical">` on every page, using the final domain.
- [ ] Default `og:image` / share image (home has none).
- [ ] Better home title, e.g. "WordPress, WooCommerce & PHP Agency | Upperlatives" (now "Upperlatives — Home").
- [ ] Structured data: `Organization`/`ProfessionalService` (name, address, contact, `sameAs` social
      profiles), `Service` on service pages, `BreadcrumbList`, `WebSite`. (`FAQPage` already done.)
- [ ] Rename the `-2` slugs in WordPress (`home-2`, `services-2`, `work-2`, `contact-2`), delete the old
      Studio/Contact pages, then remove `slugAliases` in `src/site.config.js` — before launch, so URLs never change.
- [x] WordPress domain is `noindex` (Settings → Reading → discourage search engines) — keep it; prevents duplicate content.
- [ ] Decide on a German version (`de` + `hreflang` alternates) — likely the biggest local-search gain if clients are German-speaking.

## 3. Content (WordPress)

16 placeholders are visible on the home page: `[X]` projects, `[Y]` years, `[COUNTRIES]`,
`[CLIENT LOGOS]`, `[Client 1–3]`, `[Sector]`, `[Service]`, `[+X]`, `[N]`, `[measured result]`,
`[Client quote]`, `[FULL NAME]`, `[ROLE]`, `[COMPANY]`. Footer: `[EMAIL]`, `[PHONE]` and social links
pointing to `#` (set in `src/site.config.js`).

- [ ] Replace every placeholder with real facts (or remove the block until there is data).
- [ ] Alt text for all images (Media Library → Alt text). The 3 featured images in use have none.
- [ ] Real contact details and social links in `src/site.config.js`.
- [ ] Impressum page (legal requirement in Germany), linked in the footer (`footer.legal`).

## 4. GEO — being cited by AI answers

- [ ] Concrete numbers everywhere: projects delivered, years, price ranges ("a company website starts at €X"),
      timelines, before/after results in case studies.
- [ ] Consistent entity facts (name, city, founding year, team names) on the site, Google Business
      Profile, LinkedIn and directories.
- [ ] Answer-first opening on every service page ("What does Upperlatives do?" is the model); every FAQ
      answer understandable on its own.
- [ ] Third-party proof: reviews on Google / Clutch / ProvenExpert, linked from the site.
- [ ] Author/team bios with real names (expertise signals).

## 5. UX

- [ ] First screen: the giant wordmark dominates; the H1 message sits small below it, followed by the
      placeholder stats row. Make the H1 the visual headline and/or shrink the wordmark; show real numbers.
- [ ] Header disappears on a 7,500 px page: slim header that reappears on scroll-up, with a "Let's talk" button.
- [ ] Mobile nav: 4 stacked links, tap targets ~15 px (Lighthouse) — use a menu button.
- [ ] Contrast: muted grey `#888` on white is 3.5:1 (fails WCAG AA for small text: nav, labels, grey copy).
      Darken `--color-muted` in `src/index.css` to ~`#6b6b6b`.
- [ ] "Why clients choose" cards look clickable but have no links — make them a compact 4-column list.
- [ ] More calls to action: "Start a project" appears only twice on a long page.

## 6. Performance (after prerendering)

- [ ] Load Lenis / animation code after first paint (~77 KB unused JavaScript on load; main bundle ~520 KB).
- [ ] Preload the two main font files.

## Suggested order

1. Prerendering + robots/sitemap/canonical/structured data (biggest SEO + GEO gain).
2. Replace placeholders, alt texts, contact details, Impressum (content).
3. UX fixes: contrast, reappearing header, mobile menu, compact "Why" section.
4. Decide on a German version.
