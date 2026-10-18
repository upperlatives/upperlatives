import Reveal from '../ui/Reveal'
import { heading, headingTag, introOf, text } from '../../lib/wp'
import { SectionShell } from './Prose'

export default function Quote({ el }) {
  const h2 = heading(el)
  const quotes = [...el.querySelectorAll('blockquote')]
  return (
    <SectionShell label={text(h2)} labelAs={headingTag(h2)} intro={introOf(el, h2).html}>
      <div className="space-y-14">
        {quotes.map((q, i) => {
          const cite = q.querySelector('cite')
          const body = [...q.querySelectorAll('p')].map(text).join(' ')
          return (
            <Reveal as="figure" key={i}>
              <blockquote className="display text-[clamp(1.75rem,3.6vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.04em]">
                “{body}”
              </blockquote>
              {cite && <figcaption className="label mt-6">{text(cite)}</figcaption>}
            </Reveal>
          )
        })}
      </div>
    </SectionShell>
  )
}
