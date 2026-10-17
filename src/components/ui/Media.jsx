import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { gradientFor } from '../../lib/gradients'

/**
 * Video that plays only while the pointer is over its container (the card or
 * hero block it sits in). It loads on the first hover, fades in once frames are
 * playing, and rewinds after the pointer leaves. Not used on touch screens or
 * with reduced motion — those keep the image.
 */
function HoverVideo({ video, className }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    const host = el?.parentElement
    if (!host) return
    let rewind

    const enter = () => {
      clearTimeout(rewind)
      if (el.preload !== 'auto') el.preload = 'auto'
      el.play().catch(() => {}) // if refused, the image simply stays
    }
    const leave = () => {
      el.pause()
      setVisible(false)
      rewind = setTimeout(() => {
        el.currentTime = 0
      }, 500) // after the fade-out
    }
    const playing = () => setVisible(true)

    host.addEventListener('pointerenter', enter)
    host.addEventListener('pointerleave', leave)
    el.addEventListener('playing', playing)
    return () => {
      clearTimeout(rewind)
      host.removeEventListener('pointerenter', enter)
      host.removeEventListener('pointerleave', leave)
      el.removeEventListener('playing', playing)
    }
  }, [video.src])

  return (
    <video
      ref={ref}
      aria-hidden
      muted
      loop
      playsInline
      preload="none"
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'} ${className}`}
    >
      <source src={video.src} type={video.type} />
    </video>
  )
}

const canHover = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

/**
 * Image (or a gradient when there is none) that always fills its parent, with
 * an optional video on top that plays on hover.
 */
export default function Media({ video, image, index = 0, className = '', sizes = '(min-width: 768px) 50vw, 100vw' }) {
  const reduce = useReducedMotion()
  const [hover] = useState(canHover)

  const base = image?.src ? (
    <img
      src={image.src}
      srcSet={image.srcSet || undefined}
      sizes={image.srcSet ? sizes : undefined}
      alt={image.alt || ''}
      loading="lazy"
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
    />
  ) : (
    <div aria-hidden className={`absolute inset-0 ${className}`} style={{ backgroundImage: gradientFor(index) }} />
  )

  if (!video?.src || reduce || !hover) return base
  return (
    <>
      {base}
      <HoverVideo video={video} className={className} />
    </>
  )
}
