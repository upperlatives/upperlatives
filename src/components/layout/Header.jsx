import { NavLink } from 'react-router-dom'
import SmartLink from '../ui/SmartLink'
import { usePrefetchPath, useSiteInfo } from '../../hooks/useWp'
import site from '../../site.config'

const link = 'label transition-colors duration-300 hover:text-ink'

export default function Header() {
  const { name, logo } = useSiteInfo()
  const prefetch = usePrefetchPath()

  return (
    <header className="container-x relative z-20 grid grid-cols-[1fr_auto_1fr] items-start gap-4 pb-8 pt-5 md:pb-14 md:pt-9">
      <SmartLink to="/" aria-label={`${name} — home`} className={`${link} justify-self-start`}>
        {/* logo from WordPress (Site logo); the name as text until it has loaded */}
        {logo ? (
          <img
            src={logo.src}
            alt={logo.alt || name}
            width={logo.width || undefined}
            height={logo.height || undefined}
            // 16px high everywhere (the SVG has no intrinsic size, so height must be set)
            className="block h-4 w-auto"
          />
        ) : (
          name
        )}
      </SmartLink>

      <nav aria-label="Main" className="flex flex-col items-center gap-1 md:flex-row md:gap-14 lg:gap-20">
        {site.nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onMouseEnter={() => prefetch(item.to)}
            className={({ isActive }) => `${link} ${isActive ? 'text-ink' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <SmartLink to={site.cta.to} className={`${link} justify-self-end`}>
        {site.cta.label}
      </SmartLink>
    </header>
  )
}
