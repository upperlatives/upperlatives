import { useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import site from '../../site.config'

/*
 * Crosshair cursor after xzero.framer.website: a thin "+" inside four corner
 * brackets that trails the pointer (offset below-right; the system pointer
 * stays visible).
 *
 * - Colour by section: data-cursor="<variant>" on any element (colours in
 *   site.config.js → cursor); the closest one under the pointer wins.
 * - Over a block with data-cursor-label="See Service" the cursor morphs into a
 *   frosted pill centred on the pointer, the label blurring in letter by letter
 *   over drifting chevrons (the reference's "View Project" cursor).
 */

const CURSOR_VARIANTS = site.cursor

const LAG = 0.3 // seconds; time constant of the trailing motion, measured on the reference
// Crosshair frame (21px, so the 1px lines have an exact centre pixel), offset
// below-right of the pointer like the reference.
const DOT = { left: 12, top: 17, width: 21, height: 21 }
// Label pill, centred on the pointer: the reference's 353 × 106, wider when a
// label needs it, always leaving room for chevrons on both sides.
const PILL = { minWidth: 353, height: 106, side: 82 }
const LABEL_FONT = '500 36px "Inter Variable", Inter, sans-serif'

let measureCtx
function textWidth(text) {
  measureCtx ||= document.createElement('canvas').getContext('2d')
  measureCtx.font = LABEL_FONT
  measureCtx.letterSpacing = '-0.72px'
  return measureCtx.measureText(text).width
}

const canUse = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

const line = 'absolute bg-[var(--cursor)] transition-colors duration-200'
// Size changes overshoot slightly and settle, like the reference's spring.
const morph = 'transition-[left,top,width,height] duration-[450ms] ease-[cubic-bezier(0.34,1.45,0.64,1)]'
const fade = 'transition-opacity duration-300'

/** One 6×6 corner bracket: a vertical and a horizontal 1px line. */
function Corner({ x, y }) {
  const h = x === 'left' ? 'left-0' : 'right-0'
  const v = y === 'top' ? 'top-0' : 'bottom-0'
  return (
    <span className={`absolute size-1.5 ${h} ${v}`}>
      <span className={`${line} inset-y-0 w-px ${h}`} />
      <span className={`${line} inset-x-0 h-px ${v}`} />
    </span>
  )
}

/**
 * Row of "›" drifting right on both sides of the label. The mask shows them
 * only in the gaps beside the text, fading at the pill's ends and before the
 * label, so none ever crosses a letter.
 */
function Chevrons({ width, text }) {
  const gap = (width - text) / 2 // free space on each side of the label
  const mask = `linear-gradient(to right, transparent 0, #000 ${gap * 0.45}px, #000 ${gap - 22}px, transparent ${gap - 6}px,
    transparent ${width - gap + 6}px, #000 ${width - gap + 22}px, #000 ${width - gap * 0.45}px, transparent ${width}px)`
  return (
    <span className="absolute inset-0 flex items-center overflow-hidden" style={{ maskImage: mask }}>
      <span className="-ml-7.5 flex animate-[cursor-chevrons_0.62s_linear_infinite] gap-1.5 text-white/45 motion-reduce:animate-none">
        {Array.from({ length: Math.ceil(width / 30) + 2 }, (_, i) => (
          <svg key={i} width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ))}
      </span>
    </span>
  )
}

export default function CustomCursor() {
  const ref = useRef(null)
  const [enabled] = useState(canUse)
  const [label, setLabel] = useState(null)
  const [run, setRun] = useState(0) // re-plays the letter reveal
  const reduce = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!enabled || !el) return
    document.documentElement.classList.add('has-custom-cursor')

    const pointer = { x: 0, y: 0 }
    const pos = { x: 0, y: 0 }
    let seen = false
    let raf = 0
    let last = 0
    let variant = ''
    let currentLabel = null
    let checkQueued = false

    const update = (target) => {
      const v = target?.closest?.('[data-cursor]')?.dataset.cursor || 'default'
      if (v !== variant) {
        variant = v
        el.style.setProperty('--cursor', CURSOR_VARIANTS[v] || CURSOR_VARIANTS.default)
      }
      const l = target?.closest?.('[data-cursor-label]')?.dataset.cursorLabel || null
      if (l !== currentLabel) {
        currentLabel = l
        setLabel(l)
        if (l) setRun((n) => n + 1)
      }
    }

    const render = (time) => {
      const dt = last ? Math.min((time - last) / 1000, 0.1) : 0.016
      last = time
      const k = reduce ? 1 : 1 - Math.exp(-dt / LAG)
      pos.x += (pointer.x - pos.x) * k
      pos.y += (pointer.y - pos.y) * k
      // whole device pixels, so the 1px lines never straddle two pixels
      const dpr = window.devicePixelRatio || 1
      const snap = (v) => Math.round(v * dpr) / dpr
      el.style.transform = `translate3d(${snap(pos.x)}px, ${snap(pos.y)}px, 0)`
      if (Math.abs(pointer.x - pos.x) < 0.1 && Math.abs(pointer.y - pos.y) < 0.1) {
        raf = 0 // settled: sleep until the pointer moves again
        last = 0
        return
      }
      raf = requestAnimationFrame(render)
    }
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(render)
    }

    const onMove = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return
      pointer.x = e.clientX
      pointer.y = e.clientY
      if (!seen) {
        seen = true
        pos.x = pointer.x // first appearance: start at the pointer, no fly-in
        pos.y = pointer.y
      }
      el.style.opacity = '1'
      update(e.target)
      wake()
    }
    // Content scrolls under a still pointer: re-check which block it is over.
    const onScroll = () => {
      if (!seen || checkQueued) return
      checkQueued = true
      requestAnimationFrame(() => {
        checkQueued = false
        update(document.elementFromPoint(pointer.x, pointer.y))
      })
    }
    const onLeave = () => {
      el.style.opacity = '0'
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('has-custom-cursor')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
      document.documentElement.removeEventListener('mouseleave', onLeave)
    }
  }, [enabled, reduce])

  const pillSize = useMemo(() => {
    if (!label) return null
    const text = textWidth(label)
    return { text, width: Math.max(PILL.minWidth, Math.ceil(text + 2 * PILL.side)), height: PILL.height }
  }, [label])

  if (!enabled) return null
  const pill = Boolean(pillSize)
  const geometry = pill
    ? { left: -pillSize.width / 2, top: -pillSize.height / 2, width: pillSize.width, height: pillSize.height }
    : DOT

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[100] opacity-0 transition-opacity duration-300"
      style={{ '--cursor': CURSOR_VARIANTS.default }}
    >
      <div className={`absolute ${morph}`} style={geometry}>
        {/* frosted pill with drifting chevrons (label mode) */}
        <span
          className={`absolute inset-0 overflow-hidden rounded-full bg-white/10 backdrop-blur-[10px] ${fade} ${pill ? 'opacity-100' : 'opacity-0'}`}
        >
          {pill && <Chevrons width={pillSize.width} text={pillSize.text} />}
        </span>
        {pill && (
          <span key={run} className="absolute inset-0 flex items-center justify-center">
            <span className="whitespace-nowrap text-[36px] font-medium leading-none tracking-[-0.02em] text-white">
              {[...label].map((ch, i) => (
                <span
                  key={i}
                  className="inline-block animate-[cursor-letter_0.45s_cubic-bezier(0.25,1,0.5,1)_both] whitespace-pre motion-reduce:animate-none"
                  style={{ animationDelay: `${120 + i * 35}ms` }}
                >
                  {ch}
                </span>
              ))}
            </span>
          </span>
        )}
        <Corner x="left" y="top" />
        <Corner x="right" y="top" />
        <Corner x="left" y="bottom" />
        <Corner x="right" y="bottom" />
        {/* crosshair (hidden in label mode) */}
        <span className={`${fade} ${pill ? 'opacity-0' : 'opacity-100'}`}>
          <span className={`${line} bottom-1 left-2.5 top-1 w-px`} />
          <span className={`${line} left-1 right-1 top-2.5 h-px`} />
        </span>
      </div>
    </div>
  )
}
