import Panel from '../ui/Panel'
import RichText from '../ui/RichText'
import Reveal from '../ui/Reveal'
import { ArrowLink } from '../ui/Button'
import { arrowLinks, heading, restHtml, steps, text } from '../../lib/wp'

/** Numbered list as rows with hairlines — the reference "Experience" table. */
export default function Steps({ el }) {
  const h2 = heading(el)
  const list = el.querySelector(':scope > ol, :scope > ul')
  const rows = steps(list)
  const links = arrowLinks(el)
  const extra = restHtml(el, [h2, list])
  const described = rows.some((r) => r.description)

  return (
    <section className="container-x">
      <Panel className="grid gap-8 md:grid-cols-12 md:gap-10">
        <div className="flex flex-col justify-between gap-8 md:col-span-4">
          <h2 className="label">{text(h2)}</h2>
          <div className="hidden md:block">
            {links.map((l) => (
              <ArrowLink key={l.href} to={l.href} internal={l.internal} dark>
                {l.label}
              </ArrowLink>
            ))}
          </div>
        </div>
        <div className="md:col-span-8">
          <RichText html={extra} className="mb-8 text-xl leading-snug text-line" />
          <ol className="border-t border-white/10">
            {rows.map((row, i) => (
              <Reveal
                as="li"
                key={row.title + i}
                delay={i * 0.05}
                className={`grid grid-cols-[3rem_1fr] gap-x-4 gap-y-1 border-b border-white/10 py-4 md:items-baseline md:py-5 ${described ? 'md:grid-cols-[4rem_minmax(0,14rem)_1fr]' : 'md:grid-cols-[4rem_1fr]'}`}
              >
                <span className="font-mono text-mono text-muted">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-xl tracking-[-0.02em] text-paper md:text-[22px]">{row.title}</span>
                {row.description && (
                <span className="col-start-2 text-base text-soft md:col-start-3 md:text-right md:font-mono md:text-mono md:uppercase md:tracking-[0.02em]">
                  {row.description}
                </span>
                )}
              </Reveal>
            ))}
          </ol>
          <div className="mt-8 md:hidden">
            {links.map((l) => (
              <ArrowLink key={l.href} to={l.href} internal={l.internal} dark>
                {l.label}
              </ArrowLink>
            ))}
          </div>
        </div>
      </Panel>
    </section>
  )
}
