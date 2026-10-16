import SmartLink from './SmartLink'

const styles = {
  solid: 'bg-ink text-paper hover:bg-ink-3',
  outline: 'bg-black/5 text-ink hover:bg-black/10',
  dark: 'bg-ink-2 text-line hover:bg-ink-3',
  light: 'bg-paper text-ink hover:bg-line',
}

/** Pill button in the reference style ("DOWNLOAD MY CV", "VIEW ONLINE"). */
export default function Button({ to, internal, variant = 'solid', children, className = '' }) {
  return (
    <SmartLink
      to={to}
      internal={internal}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-3 font-mono text-mono uppercase tracking-[0.02em] transition-colors duration-300 ${styles[variant]} ${className}`}
    >
      {children}
    </SmartLink>
  )
}

export function ButtonRow({ items, dark = false, className = '' }) {
  if (!items?.length) return null
  return (
    <div className={`flex flex-wrap gap-2.5 ${className}`}>
      {items.map((b) => (
        <Button
          key={b.href + b.label}
          to={b.href}
          internal={b.internal}
          variant={dark ? (b.outline ? 'dark' : 'light') : b.outline ? 'outline' : 'solid'}
        >
          {b.label}
        </Button>
      ))}
    </div>
  )
}

/** Mono arrow link: "READ BIO →". */
export function ArrowLink({ to, internal, children, dark = false, className = '' }) {
  return (
    <SmartLink
      to={to}
      internal={internal}
      className={`label inline-block transition-colors duration-300 ${dark ? 'hover:text-paper' : 'hover:text-ink'} ${className}`}
    >
      {children}
    </SmartLink>
  )
}
