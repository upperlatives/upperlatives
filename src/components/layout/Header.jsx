import { NavLink } from 'react-router-dom'
import SmartLink from '../ui/SmartLink'
import { usePrefetchPath, useSiteInfo } from '../../hooks/useWp'
import site from '../../site.config'

const link = 'label transition-colors duration-300 hover:text-ink'

export default function Header() {
  const { name } = useSiteInfo()
  const prefetch = usePrefetchPath()

  return (
    <header className="container-x relative z-20 grid grid-cols-[1fr_auto_1fr] items-start gap-4 pb-8 pt-5 md:pb-14 md:pt-9">
      <SmartLink to="/" className={`${link} justify-self-start`}>
        {name}
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
