import { useLayoutEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'

/**
 * Text that always spans the full container width ("Paul Michel" in the
 * reference). Width scales linearly with font-size, so the width/size ratio is
 * measured once and the size is set in container-query units — it then stays
 * fitted at every viewport width without resize listeners.
 */
export default function Wordmark({ text, as: Tag = 'div', animate = true, className = '', ...props }) {
  const line = useRef(null)
  const [ratio, setRatio] = useState(text.length * 0.5)
  const reduce = useReducedMotion()

  useLayoutEffect(() => {
    const update = () => {
      const el = line.current
      if (!el) return
      const size = parseFloat(getComputedStyle(el).fontSize)
      if (size) setRatio(el.getBoundingClientRect().width / size)
    }
    update()
    document.fonts?.ready.then(update)
  }, [text])

  return (
    <div className={`@container ${className}`}>
      <Tag className="display block whitespace-nowrap text-ink" style={{ fontSize: `${100 / ratio}cqw`, lineHeight: 0.8 }} {...props}>
        <span className="sr-only">{text}</span>
        <span aria-hidden className="block overflow-hidden pb-[0.04em] pt-[0.02em]">
          {/* The always-visible line triggers the letters; letters that start
              below the clip edge would never report as "in view" themselves. */}
          <motion.span
            ref={line}
            className="inline-block"
            initial={animate && !reduce ? 'hidden' : false}
            whileInView="shown"
            viewport={{ once: true }}
            transition={{ staggerChildren: 0.035, delayChildren: 0.1 }}
          >
            {[...text].map((ch, i, all) => (
              <motion.span
                key={i}
                // negative tracking on the last glyph would push it past the clip edge
                className={`inline-block whitespace-pre ${i === all.length - 1 ? 'tracking-normal' : ''}`}
                variants={{ hidden: { y: '105%' }, shown: { y: 0 } }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              >
                {ch}
              </motion.span>
            ))}
          </motion.span>
        </span>
      </Tag>
    </div>
  )
}
