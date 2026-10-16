import Panel from '../ui/Panel'
import RichText from '../ui/RichText'
import { ArrowLink } from '../ui/Button'
import { arrowLinks, heading, restHtml, text } from '../../lib/wp'

/** Dark "About me" / "Overview" panel: label left, large text right. */
export default function Statement({ el, label = 'Overview' }) {
  const h2 = heading(el)
  const links = arrowLinks(el)
  return (
    <section className="container-x">
      <Panel className="grid gap-8 md:min-h-[420px] md:grid-cols-2 md:gap-10">
        <div className="flex flex-col justify-between gap-8">
          <h2 className="label">{text(h2) || label}</h2>
          {links.map((l) => (
            <ArrowLink key={l.href} to={l.href} internal={l.internal} dark className="hidden md:inline-block">
              {l.label}
            </ArrowLink>
          ))}
        </div>
        <RichText
          html={restHtml(el, [h2])}
          className="wp-highlight-dark text-xl leading-[1.35] tracking-[-0.02em] text-line md:text-[22px]"
        />
      </Panel>
    </section>
  )
}
