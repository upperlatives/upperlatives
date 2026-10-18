import SmartLink from '../ui/SmartLink'
import Reveal from '../ui/Reveal'
import { heading, headingTag, introOf, text } from '../../lib/wp'
import { SectionShell } from './Prose'

/** "Related services" — inline links become large rows with arrows. */
export default function Related({ el }) {
  const h2 = heading(el)
  // the links paragraph is the content, so only a marked intro counts here
  const intro = introOf(el, h2, { leading: false })
  const links = [...el.querySelectorAll('a[href]')].filter((a) => !intro.nodes.some((n) => n.contains(a)))
  return (
    <SectionShell label={text(h2)} labelAs={headingTag(h2)} intro={intro.html}>
      <ul className="border-t border-line">
        {links.map((a, i) => (
          <Reveal as="li" key={a.getAttribute('href')} delay={i * 0.05} className="border-b border-line">
            <SmartLink
              to={a.getAttribute('href')}
              internal={a.hasAttribute('data-internal')}
              className="group flex items-baseline justify-between py-4 text-2xl tracking-[-0.03em] md:text-[28px]"
            >
              {text(a)}
              <span aria-hidden className="text-muted transition-transform duration-500 ease-out-expo group-hover:translate-x-1 group-hover:-translate-y-1">
                ↗
              </span>
            </SmartLink>
          </Reveal>
        ))}
      </ul>
    </SectionShell>
  )
}
