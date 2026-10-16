import RichText from '../ui/RichText'
import Reveal from '../ui/Reveal'
import { ArrowLink } from '../ui/Button'
import { arrowLinks, heading, restHtml, text } from '../../lib/wp'

/** Light section: mono label left (4/12), content right (8/12), top hairline. */
export function SectionShell({ label, aside, children }) {
  return (
    <section className="container-x pt-20 md:pt-28">
      <div className="grid gap-6 md:grid-cols-12 md:gap-10">
        <Reveal className="flex flex-col gap-6 md:col-span-4">
          {label && <h2 className="label">{label}</h2>}
          {aside}
        </Reveal>
        <div className="md:col-span-8">{children}</div>
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
  return (
    <SectionShell
      label={text(h2)}
      aside={links.map((l) => (
        <ArrowLink key={l.href} to={l.href} internal={l.internal}>
          {l.label}
        </ArrowLink>
      ))}
    >
      <Reveal delay={0.1}>
        <RichText
          html={restHtml(el, [h2])}
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
