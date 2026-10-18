import TiltCard from './TiltCard'

/**
 * Dark rounded panel (#111) used for "About me", "Overview", CTAs …
 * overflow-clip (not hidden) keeps sticky headings inside it working.
 */
export default function Panel({ children, className = '', tilt = true }) {
  const inner = (
    <div data-cursor="light" className={`relative overflow-clip rounded-card bg-ink p-6 text-line md:p-10 ${className}`}>{children}</div>
  )
  return tilt ? <TiltCard strength={10}>{inner}</TiltCard> : inner
}
