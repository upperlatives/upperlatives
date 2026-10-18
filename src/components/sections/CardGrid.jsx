import RichText from '../ui/RichText'
import SmartLink from '../ui/SmartLink'
import TiltCard from '../ui/TiltCard'
import Media from '../ui/Media'
import { ArrowLink } from '../ui/Button'
import { arrowLinks, cards, heading, normalizePath, restHtml, text } from '../../lib/wp'
import { usePageIndex } from '../../hooks/useWp'
import { SectionShell } from './Prose'
import { cursorLabel } from '../../lib/cursorLabel'

function Arrow() {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/20 backdrop-blur-md transition-transform duration-500 ease-out-expo group-hover:rotate-45">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path d="M3.5 10.5 10.5 3.5M5 3.5h5.5V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
      </svg>
    </span>
  )
}

function Card({ card, index, wide }) {
  const { data: pages } = usePageIndex()
  // A card linking to another page borrows that page's featured video/image;
  // media placed inside the card itself wins.
  const linked = card.link?.internal ? pages?.get(normalizePath(card.link.href)) : null
  const ownMedia = card.image || card.video
  const video = card.video || (ownMedia ? null : linked?.video)
  const image = card.image || linked?.image

  const body = (
    <div
      data-cursor="light"
      data-cursor-label={card.link ? cursorLabel(card.link.href, card.link.internal) : undefined}
      className={`group relative isolate flex h-full flex-col justify-between overflow-hidden rounded-card p-6 text-paper md:p-8 ${wide ? 'aspect-[4/3] md:aspect-[21/9]' : 'aspect-[4/5] sm:aspect-square'}`}
    >
      <Media video={video} image={image} index={index} className="-z-10 transition-transform duration-1000 ease-out-expo group-hover:scale-105" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-black/25 via-transparent to-black/45" />
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-2xl font-medium tracking-[-0.03em] md:text-[26px]">{card.title}</h3>
        {card.link && <Arrow />}
      </div>
      {/* no nested links inside a linked card */}
      <RichText html={card.link ? card.html.replace(/<\/?a\b[^>]*>/g, '') : card.html} className="max-w-[40ch] text-lg leading-snug tracking-[-0.01em] text-paper/90" />
    </div>
  )

  return (
    <TiltCard className={wide ? 'sm:col-span-2' : ''}>
      {card.link ? (
        <SmartLink to={card.link.href} internal={card.link.internal} aria-label={card.title} className="block h-full">
          {body}
        </SmartLink>
      ) : (
        body
      )}
    </TiltCard>
  )
}

function CardList({ items }) {
  const odd = items.length % 2 === 1
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {items.map((card, i) => (
        <Card key={card.title + i} card={card} index={i} wide={odd && i === items.length - 1} />
      ))}
    </div>
  )
}

/** Image cards with the scroll tilt (reference portfolio grid), title pinned on the left. */
export default function CardGrid({ el }) {
  const h2 = heading(el)
  const items = cards(el)
  const links = arrowLinks(el)
  const intro = restHtml(el, [h2, el.querySelector(':scope > .upl-cards')])

  return (
    <SectionShell
      label={text(h2)}
      aside={
        (intro || links.length > 0) && (
          <>
            <RichText html={intro} className="max-w-[34ch] text-lg leading-snug tracking-[-0.01em] text-muted" />
            {links.map((l) => (
              <ArrowLink key={l.href} to={l.href} internal={l.internal}>
                {l.label}
              </ArrowLink>
            ))}
          </>
        )
      }
    >
      <CardList items={items} />
    </SectionShell>
  )
}
