import { useEffect } from 'react'
import { stagger, useAnimate, useReducedMotion } from 'motion/react'

/**
 * Label that, when its link/button is hovered or focused, fades out and comes
 * back letter by letter from blurred to sharp (xzero.framer.website buttons).
 * The letter spans still read as one word in the page text (search engines,
 * copy & paste); the link also gets it as aria-label for screen readers.
 */
export default function BlurLetters({ text }) {
  const [scope, animate] = useAnimate()
  const reduce = useReducedMotion()

  useEffect(() => {
    const host = scope.current?.closest('a, button')
    if (host && !host.hasAttribute('aria-label')) host.setAttribute('aria-label', text)
  }, [scope, text])

  useEffect(() => {
    const host = scope.current?.closest('a, button')
    if (!host || reduce) return
    let running = []

    const play = () => {
      running.forEach((a) => a.stop())
      const letters = scope.current.querySelectorAll('[data-letter]')
      const out = animate(letters, { opacity: 0, filter: 'blur(10px)' }, { duration: 0.12, ease: 'easeOut' })
      running = [out]
      out.then(() => {
        running = [
          animate(
            letters,
            { opacity: [0, 1], filter: ['blur(10px)', 'blur(0px)'] },
            { duration: 0.45, delay: stagger(0.035), ease: [0.25, 1, 0.5, 1] },
          ),
        ]
      })
    }

    host.addEventListener('pointerenter', play)
    host.addEventListener('focusin', play)
    return () => {
      running.forEach((a) => a.stop())
      host.removeEventListener('pointerenter', play)
      host.removeEventListener('focusin', play)
    }
  }, [animate, scope, reduce])

  return (
    <span ref={scope} className="inline-flex">
      {[...text].map((ch, i) => (
        <span key={i} data-letter className="inline-block whitespace-pre">
          {ch}
        </span>
      ))}
    </span>
  )
}
