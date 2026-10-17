import { useLenis } from 'lenis/react'
import SmartLink from '../ui/SmartLink'
import Wordmark from '../ui/Wordmark'
import { useSiteInfo } from '../../hooks/useWp'
import site from '../../site.config'

function Column({ title, items, className = '' }) {
  return (
    <div className={className}>
      <p className="label mb-5">{title}</p>
      <ul className="space-y-0.5 text-xl tracking-[-0.02em]">
        {items.map((item) => (
          <li key={item.label}>
            <SmartLink to={item.to || item.href} className="transition-colors duration-300 hover:text-muted">
              {item.label}
            </SmartLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Footer() {
  const { name } = useSiteInfo()
  const lenis = useLenis()
  const { socials, contact, legal } = site.footer
  const menu = [{ label: 'Home', to: '/' }, ...site.nav]

  return (
    <footer className="container-x mt-24 pb-6 md:mt-36">
      <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-[190px_190px_1fr_auto]">
        <Column title="Socials" items={socials} />
        <Column title="Menu" items={menu} />
        <Column title="Contact" items={contact} className="col-span-2 md:col-span-1 md:col-start-4" />
      </div>

      <Wordmark text={name} className="mt-14 md:mt-16" />

      <div className="mt-6 grid grid-cols-2 items-center gap-4 md:grid-cols-3">
        <div className="flex gap-6">
          {legal.map((l) => (
            <SmartLink key={l.to} to={l.to} className="label transition-colors hover:text-ink">
              {l.label} ↗
            </SmartLink>
          ))}
        </div>
        <button
          type="button"
          onClick={() => (lenis ? lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo({ top: 0, behavior: 'smooth' }))}
          className="label hidden cursor-pointer justify-self-center transition-colors hover:text-ink md:block"
        >
          Back to top ↑
        </button>
        <p className="label justify-self-end">©{new Date().getFullYear()}</p>
      </div>
    </footer>
  )
}
