import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '../../lib/consent'

/**
 * Reports the page once its content and title are ready. The browser only loads
 * once in this single-page app, so GTM's own page-load trigger misses later pages.
 * Nothing is sent unless the visitor accepted tracking (lib/consent).
 */
export default function PageView({ title }) {
  const { pathname, search } = useLocation()

  useEffect(() => {
    trackPageView(pathname + search, title)
  }, [pathname, search, title])

  return null
}
