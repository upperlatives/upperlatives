import { Link } from 'react-router-dom'
import { usePrefetchPath } from '../../hooks/useWp'

/** Router link for internal paths (with prefetch on hover), plain <a> otherwise. */
export default function SmartLink({ to, internal, children, ...props }) {
  const prefetch = usePrefetchPath()
  const isInternal = internal ?? (to?.startsWith('/') && !to.startsWith('//'))

  if (!isInternal) {
    const external = /^https?:/.test(to || '')
    return (
      <a href={to} {...(external && { target: '_blank', rel: 'noopener noreferrer' })} {...props}>
        {children}
      </a>
    )
  }
  return (
    <Link to={to} onMouseEnter={() => prefetch(to)} onFocus={() => prefetch(to)} {...props}>
      {children}
    </Link>
  )
}
