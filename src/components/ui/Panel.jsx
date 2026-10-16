import TiltCard from './TiltCard'

/** Dark rounded panel (#111) used for "About me", "Overview", CTAs … */
export default function Panel({ children, className = '', tilt = true }) {
  const inner = (
    <div className={`relative overflow-hidden rounded-card bg-ink p-6 text-line md:p-10 ${className}`}>{children}</div>
  )
  return tilt ? <TiltCard strength={10}>{inner}</TiltCard> : inner
}
