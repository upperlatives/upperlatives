import { motion, useReducedMotion } from 'motion/react'

/** Fade / lift / un-blur into view once, like Framer's "appear" effect. */
export default function Reveal({ as = 'div', delay = 0, y = 24, children, className, ...props }) {
  const reduce = useReducedMotion()
  const Tag = motion[as]
  if (reduce) return <Tag className={className} {...props}>{children}</Tag>
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      {...props}
    >
      {children}
    </Tag>
  )
}
