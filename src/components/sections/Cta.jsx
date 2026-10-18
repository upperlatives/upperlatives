import Heading from '../ui/Heading'
import Panel from '../ui/Panel'
import Ribbon from '../ui/Ribbon'
import RichText from '../ui/RichText'
import { ButtonRow } from '../ui/Button'
import { buttons, heading, headingTag, restHtml, text } from '../../lib/wp'
import site from '../../site.config'

/** Dark closing panel with the 3D word ribbon. */
export default function Cta({ el }) {
  const h2 = heading(el)
  return (
    <section className="container-x">
      <Panel className="flex min-h-[560px] flex-col justify-between gap-10 md:min-h-[640px]">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="label md:sticky md:top-10">Next step</p>
          </div>
          <div>
            <Heading as={headingTag(h2)} className="display text-[clamp(2.25rem,4.5vw,4rem)] font-medium leading-[0.95] tracking-[-0.045em] text-paper">
              {text(h2)}
            </Heading>
            <RichText html={restHtml(el, [h2])} className="mt-6 max-w-[46ch] text-xl leading-snug tracking-[-0.02em] text-soft" />
          </div>
        </div>
        <Ribbon words={site.ribbon} className="-mx-6 md:-mx-10" />
        <ButtonRow items={buttons(el)} dark />
      </Panel>
    </section>
  )
}
