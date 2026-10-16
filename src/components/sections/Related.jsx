import SmartLink from '../ui/SmartLink'
import Reveal from '../ui/Reveal'
import { heading, text } from '../../lib/wp'
import { SectionShell } from './Prose'

/** "Related services" — inline links become large rows with arrows. */
export default function Related({ el }) {
  const h2 = heading(el)
  const links = [...el.querySelectorAll('a[href]')]
  return (
    <SectionShell label={text(h2)}>
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
