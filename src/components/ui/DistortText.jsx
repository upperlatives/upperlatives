import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { registerDistort } from '../../lib/scrollDistort'

/**
 * Heading that wobbles like liquid while the page scrolls — stronger the faster
 * you scroll — and settles when scrolling stops (see lib/scrollDistort).
 */
export default function DistortText({ as: Tag = 'h2', className = '', children }) {
  const text = useRef(null)
  const canvas = useRef(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce || !text.current || !canvas.current) return
    return registerDistort(text.current, canvas.current)
  }, [reduce])

  return (
    <Tag className={`relative ${className}`}>
      <span ref={text}>{children}</span>
      {/* sized and placed on whole pixels by scrollDistort */}
      <canvas ref={canvas} aria-hidden className="pointer-events-none absolute left-0 top-0 opacity-0" />
    </Tag>
  )
}
