import Reveal from '../ui/Reveal'
import { text } from '../../lib/wp'

/** Single mono line of facts / logos. */
export default function Trust({ el }) {
  const lines = [...el.querySelectorAll('p')].map(text).filter(Boolean)
  return (
    <Reveal as="section" className="container-x flex flex-col items-center gap-3 py-14 text-center md:py-20">
      {lines.map((l) => (
        <p key={l} className="label">
          {l}
        </p>
      ))}
    </Reveal>
  )
}
