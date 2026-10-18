import DOMPurify from 'dompurify'
import site from '../site.config'

export const WP_URL = (import.meta.env.VITE_WP_URL || 'https://wp.upperlatives.com').replace(/\/$/, '')
const DIRECT = import.meta.env.VITE_WP_DIRECT === 'true'
const API = `${DIRECT ? WP_URL : ''}/wp-json`
const WP_HOST = new URL(WP_URL).host

const PAGE_FIELDS = 'id,slug,link,parent,menu_order,title,excerpt,featured_media,featured_video,_links,_embedded'

async function wpFetch(path, params = {}) {
  const url = new URL(`${API}${path}`, window.location.origin)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url)
  if (!res.ok) throw new Error(`WordPress ${res.status}: ${url.pathname}`)
  return { data: await res.json(), totalPages: Number(res.headers.get('X-WP-TotalPages') || 1) }
}

/* ---------- URLs ---------- */

/** WordPress path ("/services-2/seo/") -> public app path ("/services/seo/"). */
export function toPublicPath(wpPath) {
  const segments = wpPath
    .split('/')
    .filter(Boolean)
    .map((s) => (s in site.slugAliases ? site.slugAliases[s] : s))
    .filter(Boolean)
  return segments.length ? `/${segments.join('/')}/` : '/'
}

/** Normalise a path so "/about", "/about/" and "/about/#x" all match. */
export function normalizePath(path) {
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, '')
  return clean ? `${clean}/` : '/'
}

/** Rewrite a link found in WordPress content. Returns { href, internal }. */
export function resolveHref(href = '') {
  if (!href || href.startsWith('#') || /^(mailto|tel):/.test(href)) return { href, internal: false }
  let url
  try {
    url = new URL(href, WP_URL)
  } catch {
    return { href, internal: false }
  }
  const sameSite = url.host === WP_HOST || href.startsWith('/')
  if (!sameSite || url.pathname.startsWith('/wp-')) return { href: mediaUrl(url.href), internal: false }
  return { href: toPublicPath(url.pathname) + url.hash, internal: true }
}

/** In development, load uploads through the Vite proxy (avoids the self-signed cert). */
export function mediaUrl(src = '') {
  if (DIRECT || !src) return src
  try {
    const url = new URL(src, WP_URL)
    return url.host === WP_HOST ? url.pathname + url.search : src
  } catch {
    return src
  }
}

/* ---------- Data ---------- */

/** Site name, tagline, logo (Site Editor / Customizer) and site icon (favicon). */
export async function getSiteInfo() {
  const { data } = await wpFetch('/', { _fields: 'name,description,site_logo,site_icon_url' })
  let logo = null
  if (data.site_logo) {
    const { data: m } = await wpFetch(`/wp/v2/media/${data.site_logo}`, { _fields: 'source_url,alt_text,media_details' })
    logo = {
      src: mediaUrl(m.source_url),
      alt: m.alt_text || '',
      width: m.media_details?.width || null,
      height: m.media_details?.height || null,
    }
  }
  return { name: data.name, description: data.description, logo, icon: data.site_icon_url ? mediaUrl(data.site_icon_url) : null }
}

function featuredImage(page) {
  const media = page._embedded?.['wp:featuredmedia']?.[0]
  if (!media?.source_url) return null
  const sizes = media.media_details?.sizes || {}
  return {
    src: mediaUrl(media.source_url),
    srcSet: Object.values(sizes)
      .filter((s) => s.width)
      .map((s) => `${mediaUrl(s.source_url)} ${s.width}w`)
      .join(', '),
    alt: media.alt_text || '',
    width: media.media_details?.width,
    height: media.media_details?.height,
  }
}

// From the "Featured video" panel (mu-plugin upl-featured-video).
function featuredVideo(page) {
  const v = page.featured_video
  return v?.src ? { src: mediaUrl(v.src), type: v.mime, width: v.width, height: v.height } : null
}

function decode(html = '') {
  const el = document.createElement('textarea')
  el.innerHTML = html.replace(/<[^>]*>/g, '')
  return el.value.trim()
}

function summarise(page) {
  const path = toPublicPath(new URL(page.link).pathname)
  return {
    id: page.id,
    slug: page.slug,
    path,
    parentId: page.parent,
    order: page.menu_order,
    title: decode(page.title?.rendered),
    excerpt: decode(page.excerpt?.rendered),
    image: featuredImage(page),
    video: featuredVideo(page),
    aliased: page.slug in site.slugAliases,
  }
}

/** All published pages, keyed by public path. */
export async function getPageIndex() {
  const pages = []
  for (let page = 1, total = 1; page <= total; page += 1) {
    const res = await wpFetch('/wp/v2/pages', {
      per_page: 100,
      page,
      _fields: PAGE_FIELDS,
      _embed: 'wp:featuredmedia',
    })
    pages.push(...res.data)
    total = res.totalPages
  }

  const byPath = new Map()
  pages
    .filter((p) => !site.hiddenSlugs.includes(p.slug))
    .map(summarise)
    // Aliased pages win a URL collision (e.g. "contact-2" over the old "contact").
    .sort((a, b) => Number(a.aliased) - Number(b.aliased))
    .forEach((p) => byPath.set(p.path, p))
  return byPath
}

export async function getPage(id) {
  const { data } = await wpFetch(`/wp/v2/pages/${id}`, {
    _fields: `${PAGE_FIELDS},content`,
    _embed: 'wp:featuredmedia',
  })
  return { ...summarise(data), html: data.content?.rendered || '' }
}

/* ---------- Content parsing ---------- */

/**
 * Split rendered block HTML into sections. Each top-level <section class="upl-…">
 * becomes one entry; loose blocks between sections are grouped together.
 */
export function parseSections(html) {
  const clean = DOMPurify.sanitize(html, { ADD_TAGS: ['iframe'], ADD_ATTR: ['target', 'allow', 'allowfullscreen'] })
  const doc = new DOMParser().parseFromString(`<body>${clean}</body>`, 'text/html')

  doc.querySelectorAll('a[href]').forEach((a) => {
    const { href, internal } = resolveHref(a.getAttribute('href'))
    a.setAttribute('href', href)
    if (internal) a.setAttribute('data-internal', '')
  })
  doc.querySelectorAll('img').forEach((img) => {
    img.setAttribute('src', mediaUrl(img.getAttribute('src')))
    img.removeAttribute('srcset')
    img.setAttribute('loading', 'lazy')
  })

  const sections = []
  let loose = null
  ;[...doc.body.children].forEach((el, i) => {
    const kind = [...el.classList].find((c) => c.startsWith('upl-'))?.slice(4)
    if (el.tagName === 'SECTION' || kind) {
      loose = null
      sections.push({ key: `${kind || 'section'}-${i}`, kind: kind || 'section', el })
    } else {
      if (!loose) {
        loose = { key: `loose-${i}`, kind: 'loose', el: doc.createElement('section') }
        sections.push(loose)
      }
      loose.el.appendChild(el)
    }
  })
  return sections
}

/* Helpers used by the section components to read a section element. */

export const text = (el) => el?.textContent.trim() || ''

/** Direct-child heading of a section (h1/h2). */
/**
 * A section's title. Normally its h2; when editors use a paragraph instead
 * (so the page keeps fewer h2s), a paragraph with the class "upl-title", or the
 * section's first paragraph when it reads like a title: short, no link, no
 * closing full stop, and followed by more content.
 */
export function heading(el, tag = 'h2') {
  const found = el.querySelector(`:scope > ${tag}, :scope > * > ${tag}`)
  if (found || tag !== 'h2') return found
  const marked = el.querySelector(':scope > p.upl-title')
  if (marked) return marked
  const first = el.firstElementChild
  const t = first?.tagName === 'P' ? text(first) : ''
  const looksLikeTitle =
    t && t.length <= 80 && !/[.:;,]$/.test(t) && !first.querySelector('a, img') && first.nextElementSibling
  return looksLikeTitle ? first : null
}

/**
 * The element a section title should render as: keep editors' choice of h2,
 * otherwise a paragraph (also for built-in labels like "Overview").
 */
export const headingTag = (h) => (h?.tagName === 'H2' ? 'h2' : 'p')

/** A paragraph that only holds one "… →" link renders as a mono arrow link. */
export function arrowLink(p) {
  const a = p?.tagName === 'P' && p.children.length === 1 && p.querySelector(':scope > a')
  if (!a || text(a) !== text(p)) return null
  return { href: a.getAttribute('href'), label: text(a), internal: a.hasAttribute('data-internal') }
}

export function buttons(el) {
  return [...el.querySelectorAll('.wp-block-button a')].map((a) => ({
    href: a.getAttribute('href'),
    label: text(a),
    internal: a.hasAttribute('data-internal'),
    outline: a.closest('.wp-block-button').className.includes('is-style-outline'),
  }))
}

/** Remaining children after removing the given elements, as an HTML string. */
export function restHtml(el, skip = []) {
  return [...el.children]
    .filter((c) => !skip.includes(c) && !c.classList.contains('wp-block-buttons') && !arrowLink(c))
    .map((c) => c.outerHTML)
    .join('')
}

export const arrowLinks = (el) => [...el.children].map(arrowLink).filter(Boolean)

/**
 * The paragraph(s) that introduce a section: those directly below its heading
 * (`leading`, for sections whose content is cards, FAQs, quotes …) and any
 * paragraph given the CSS class "upl-intro" in WordPress (works everywhere).
 */
export function introOf(el, h2, { leading = true } = {}) {
  const nodes = [...el.querySelectorAll(':scope > .upl-intro')]
  if (leading && h2) {
    for (let n = h2.nextElementSibling; n?.tagName === 'P' && !arrowLink(n); n = n.nextElementSibling) {
      if (!nodes.includes(n)) nodes.push(n)
    }
  }
  return { html: nodes.map((n) => n.outerHTML).join(''), nodes }
}

export function cards(el) {
  return [...el.querySelectorAll('.upl-card')].map((card) => {
    const title = card.querySelector('h3, h4, h2')
    const link = [...card.children].map(arrowLink).find(Boolean)
      || (() => {
        const a = card.querySelector('a[href]')
        return a && { href: a.getAttribute('href'), label: text(a), internal: a.hasAttribute('data-internal') }
      })()
    const img = card.querySelector('img')
    const video = card.querySelector('video')
    return {
      title: text(title),
      html: restHtml(card, [title, img?.closest('figure') || img, video?.closest('figure') || video]),
      link,
      image: img ? { src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' } : null,
      video: video?.getAttribute('src') ? { src: mediaUrl(video.getAttribute('src')) } : null,
    }
  })
}

export function faqs(el) {
  return [...el.querySelectorAll('details')].map((d) => {
    const summary = d.querySelector('summary')
    return { question: text(summary), html: restHtml(d, [summary]) }
  })
}

/** <li><strong>Title</strong> — description</li> -> { title, description } */
export function steps(list) {
  return [...list.querySelectorAll(':scope > li')].map((li) => {
    const strong = li.querySelector(':scope > strong, :scope > b')
    if (!strong) return { title: text(li), description: '' }
    const description = text(li).slice(text(strong).length).replace(/^\s*[—–:-]\s*/, '')
    return { title: text(strong), description }
  })
}
