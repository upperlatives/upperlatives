import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'

/**
 * Cards lean back while they enter the viewport and settle flat — the
 * "flared bottom" effect on the reference cards and panels.
 */
export default function TiltCard({ children, className = '', strength = 18 }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 35%'] })
  // No spring here: Lenis already smooths the scroll position.
  const rotateX = useTransform(scrollYProgress, [0, 1], [strength, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1])

  if (reduce) return <div className={className}>{children}</div>

  return (
    <div ref={ref} className={`[perspective:1600px] ${className}`}>
      <motion.div style={{ rotateX, scale, transformOrigin: '50% 0%' }} className="h-full will-change-transform">
        {children}
      </motion.div>
    </div>
  )
}
