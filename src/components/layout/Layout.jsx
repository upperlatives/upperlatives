import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ReactLenis, useLenis } from 'lenis/react'
import { useReducedMotion } from 'motion/react'
import Header from './Header'
import Footer from './Footer'
import CustomCursor from '../ui/CustomCursor'

// Inertia scrolling like the Framer reference. Lenis drives the native scroll
// position, so scroll-linked animations (useScroll, whileInView) keep working.
const LENIS_OPTIONS = { lerp: 0.1, wheelMultiplier: 1, anchors: true }

function ScrollManager() {
  const { pathname, hash } = useLocation()
  const lenis = useLenis()

  useEffect(() => {
    const target = hash && document.getElementById(hash.slice(1))
    if (lenis) lenis.scrollTo(target || 0, { immediate: true, force: true })
    else if (target) target.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash, lenis])
  return null
}

export default function Layout() {
  const reduce = useReducedMotion()

  return (
    <>
      {!reduce && <ReactLenis root options={LENIS_OPTIONS} />}
      <ScrollManager />
      <a href="#main" className="label sr-only z-50 bg-paper p-3 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <CustomCursor />
    </>
  )
}
