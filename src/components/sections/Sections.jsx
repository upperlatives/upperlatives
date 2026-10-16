import Hero from './Hero'
import Statement from './Statement'
import CardGrid from './CardGrid'
import Steps from './Steps'
import Faq from './Faq'
import Quote from './Quote'
import Cta from './Cta'
import Trust from './Trust'
import Related from './Related'
import Prose from './Prose'

/**
 * Picks a design for each WordPress section: first by its upl-* class, then by
 * what it contains. Anything unknown falls back to <Prose>, so new sections
 * added in WordPress always render.
 */
function pick({ kind, el }) {
  const byKind = {
    hero: Hero,
    answer: Statement,
    trust: Trust,
    cta: Cta,
    faq: Faq,
    testimonials: Quote,
    related: Related,
  }
  if (byKind[kind]) return byKind[kind]
  if (el.querySelector('.upl-card')) return CardGrid
  if (el.querySelector('details')) return Faq
  if (el.querySelector(':scope > blockquote')) return Quote
  if (el.querySelector(':scope > ol') && !el.querySelector(':scope > p:not(:last-child)')) return Steps
  if (el.querySelector(':scope > h1')) return Hero
  return Prose
}

// Dark panels sit 10px below another panel or card grid (as in the reference)
// and get full section spacing after light text.
const PANELS = [Statement, Steps, Cta]
const BLOCKS = [...PANELS, CardGrid]

export default function Sections({ sections, page, heroVariant }) {
  const components = sections.map(pick)
  return sections.map((section, i) => {
    const Component = components[i]
    const prev = components[i - 1]
    const tight = BLOCKS.includes(prev) || (prev === Hero && page.image)
    const spacing = PANELS.includes(Component) ? (tight ? 'mt-2.5' : 'mt-20 md:mt-28') : ''
    return (
      <div key={section.key} className={spacing || 'contents'}>
        <Component el={section.el} page={page} variant={heroVariant} />
      </div>
    )
  })
}
