import { useNavigate } from 'react-router-dom'

/**
 * Renders sanitised WordPress HTML. Internal links (marked data-internal by the
 * parser) are routed client-side instead of reloading the page.
 */
export default function RichText({ html, as: Tag = 'div', className = '', ...props }) {
  const navigate = useNavigate()
  if (!html) return null

  const onClick = (e) => {
    const a = e.target.closest('a[data-internal]')
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return
    e.preventDefault()
    navigate(a.getAttribute('href'))
  }

  return <Tag className={`wp-text ${className}`} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} {...props} />
}
