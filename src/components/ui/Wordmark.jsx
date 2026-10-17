import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import useLiquid from '../../hooks/useLiquid'
import useSmear from '../../hooks/useSmear'
import { rasterizeLine } from '../../lib/rasterText'

/**
 * Text that always spans the full container width ("Paul Michel" in the
 * reference). Width scales linearly with font-size, so the width/size ratio is
 * measured once and the size is set in container-query units — it then stays
 * fitted at every viewport width without resize listeners.
 *
 * Pointer effects (`effect`):
 * - "liquid": letters bend like liquid under a moving pointer (useLiquid)
 * - "smear": dark (or, with smear.invert, light) pixels stream toward the pointer (useSmear)
 * - "none"
 * `background` is the colour behind the text; the smear needs it to paint
 * streams outside the letters.
 */
export default function Wordmark({
  text,
  as: Tag = 'div',
  animate = true,
  effect = 'liquid',
  smear,
  background = '#ffffff',
  textClass = 'text-ink',
  className = '',
  ...props
}) {
  const area = useRef(null)
  const line = useRef(null)
  const canvas = useRef(null)
  const ready = useRef(false)
  const smearReady = useRef(false)
  const [ratio, setRatio] = useState(text.length * 0.5)
  const reduce = useReducedMotion()
  const intro = animate && !reduce

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

  // The smear canvas permanently replaces the DOM letters, but only once the
  // intro has finished and its first frame is drawn.
  const swapToCanvas = useCallback(() => {
    if (!ready.current || !smearReady.current) return
    canvas.current.style.opacity = '1'
    line.current.style.visibility = 'hidden'
  }, [])
  const onSmearReady = useCallback(() => {
    smearReady.current = true
    swapToCanvas()
  }, [swapToCanvas])
  // The letters are drawn on a transparent canvas; the shader is told the
  // background colour so the overhang never covers neighbouring content.
  const smearSource = useCallback(
    async (dpr) => (await rasterizeLine({ lineEl: line.current, boxEl: canvas.current, dpr })).canvas,
    [],
  )
  const smearOptions = useMemo(() => ({ ...smear, background }), [smear, background])

  useLayoutEffect(() => {
    if (!intro) ready.current = true
  }, [intro])
  useLiquid({ area, line, canvas, ready, enabled: effect === 'liquid' && !reduce })
  useSmear({
    area,
    canvas,
    source: smearSource,
    options: smearOptions,
    enabled: effect === 'smear' && !reduce,
    onReady: onSmearReady,
  })

  return (
    <div ref={area} className={`@container ${className}`}>
      <Tag
        // The descender room below overhangs the wrapper; only the wrapper (exact
        // text height) takes the pointer, so links underneath stay clickable.
        className={`display pointer-events-none relative block whitespace-nowrap ${textClass}`}
        style={{ fontSize: `${100 / ratio}cqw`, lineHeight: 0.8 }}
        {...props}
      >
        <span className="sr-only">{text}</span>
        {/* Clip box for the intro; the extra bottom padding (cancelled by the
            negative margin) keeps descenders like "p" from being cut off. */}
        <span aria-hidden className="-mb-[0.2em] block overflow-hidden pb-[0.24em] pt-[0.02em]">
          {/* The always-visible line triggers the letters; letters that start
              below the clip edge would never report as "in view" themselves. */}
          <motion.span
            ref={line}
            className="inline-block"
            initial={intro ? 'hidden' : false}
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
                onAnimationComplete={
                  i === all.length - 1
                    ? () => {
                        ready.current = true
                        swapToCanvas()
                      }
                    : undefined
                }
              >
                {ch}
              </motion.span>
            ))}
          </motion.span>
        </span>
        {/* Canvas copy used by the pointer effects; it overhangs the text so
            bent or smeared strokes near the edges aren't cut off. */}
        <canvas
          ref={canvas}
          aria-hidden
          className="pointer-events-none absolute left-[-0.05em] top-[-0.12em] h-[calc(100%+0.44em)] w-[calc(100%+0.1em)] opacity-0"
        />
      </Tag>
    </div>
  )
}
