import RichText from '../ui/RichText'
import Reveal from '../ui/Reveal'
import { faqs, heading, text } from '../../lib/wp'
import { SectionShell } from './Prose'

/** Accordion on native <details> — accessible and works without JS. */
export default function Faq({ el }) {
  const h2 = heading(el)
  const items = faqs(el)

  // FAQPage structured data helps both Google and AI answer engines.
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.html.replace(/<[^>]*>/g, '').trim() },
    })),
  }

  return (
    <SectionShell label={text(h2)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="border-t border-line">
        {items.map((f, i) => (
          <Reveal key={f.question} delay={i * 0.04}>
            <details className="group border-b border-line [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-5 text-xl tracking-[-0.02em] md:text-[22px]">
                {f.question}
                <span aria-hidden className="relative size-3 shrink-0 self-center">
                  <span className="absolute left-0 top-1/2 h-px w-3 bg-ink" />
                  <span className="absolute left-1/2 top-0 h-3 w-px bg-ink transition-transform duration-300 group-open:rotate-90" />
                </span>
              </summary>
              <RichText html={f.html} className="max-w-[60ch] pb-6 text-lg leading-snug text-muted" />
            </details>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  )
}
