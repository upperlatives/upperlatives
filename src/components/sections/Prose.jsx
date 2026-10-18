import RichText from '../ui/RichText'
import Reveal from '../ui/Reveal'
import DistortText from '../ui/DistortText'
import { ArrowLink } from '../ui/Button'
import { arrowLinks, heading, headingTag, introOf, restHtml, text } from '../../lib/wp'

/**
 * Light section: the title — with its short intro paragraph (`intro`, HTML)
 * and optional `aside` (links) — sits in the first of three columns and stays
 * pinned while the content scrolls past in the other two. Stacks below lg.
 */
export function SectionShell({ label, labelAs = 'h2', intro, aside, children }) {
  return (
    <section className="container-x pt-20 md:pt-28">
      <div className="grid gap-8 lg:grid-cols-3 lg:gap-2.5">
        <div className="lg:sticky lg:top-10 lg:self-start lg:pr-10">
          <Reveal>
            {label && (
              <DistortText as={labelAs} className="display text-[clamp(2.25rem,4vw,3.75rem)] font-medium leading-[0.95] tracking-[-0.045em]">
                {label}
              </DistortText>
            )}
            <RichText html={intro} className="mt-6 max-w-[34ch] text-lg leading-snug tracking-[-0.01em] text-muted" />
            {aside && <div className="mt-6 flex flex-col items-start gap-4">{aside}</div>}
          </Reveal>
        </div>
        <div className="lg:col-span-2">{children}</div>
      </div>
    </section>
  )
}

/**
 * Fallback for any section without a dedicated design. Lists become the
 * large "Services / Industries" style, columns become a grid.
 */
export default function Prose({ el }) {
  const h2 = heading(el)
  const links = arrowLinks(el)
  const intro = introOf(el, h2, { leading: false })
  return (
    <SectionShell
      label={text(h2)}
      labelAs={headingTag(h2)}
      intro={intro.html}
      aside={links.map((l) => (
        <ArrowLink key={l.href} to={l.href} internal={l.internal}>
          {l.label}
        </ArrowLink>
      ))}
    >
      <Reveal delay={0.1}>
        <RichText
          html={restHtml(el, [h2, ...intro.nodes])}
          className={[
            'text-xl leading-[1.35] tracking-[-0.02em] md:text-[22px]',
            '[&_h3]:mb-3 [&_h3]:mt-10 [&_h3]:text-2xl [&_h3]:font-medium [&_h3]:tracking-[-0.03em] [&_h3:first-child]:mt-0',
            '[&_ul]:grid [&_ul]:gap-x-10 [&_ul]:gap-y-1 sm:[&_ul]:grid-cols-2 [&_ul+p]:mt-8 [&_p+ul]:mt-8',
            '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:marker:font-mono [&_ol]:marker:text-mono [&_ol]:marker:text-muted',
            '[&_.wp-block-columns]:grid [&_.wp-block-columns]:gap-10 md:[&_.wp-block-columns]:grid-cols-2',
            '[&_h2]:label [&_h2]:mb-4',
            '[&_figure]:my-10 [&_img]:rounded-card',
            '[&_table]:w-full [&_td]:border-b [&_td]:border-line [&_td]:py-3 [&_th]:label [&_th]:pb-3 [&_th]:text-left',
          ].join(' ')}
        />
      </Reveal>
    </SectionShell>
  )
}
