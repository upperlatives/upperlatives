import { useCallback, useRef, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import Wordmark from '../components/ui/Wordmark'
import useSmear from '../hooks/useSmear'
import { useSiteInfo } from '../hooks/useWp'

// Hidden test page (/lab/) for comparing pointer effects before choosing one.
// Sample photos from picsum.photos (Unsplash licence) — replace with your own.
const PHOTOS = [91, 1005, 823, 1027].map((id) => `https://picsum.photos/id/${id}/1000/1250`)
// On wide text the smear length (a fraction of the element) needs to be shorter.
const TEXT_SMEAR = { pullStrength: 0.07 }
const PANEL_SMEAR = { ...TEXT_SMEAR, invert: true, lumaMin: 0.35, lumaMax: 0.65 }

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous' // required to use it as a WebGL texture
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Draw an image "object-fit: cover" into a canvas the size of `box`. */
function coverCanvas(img, box, dpr) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(box.width * dpr)
  canvas.height = Math.round(box.height * dpr)
  const scale = Math.max(canvas.width / img.width, canvas.height / img.height)
  const w = img.width * scale
  const h = img.height * scale
  canvas.getContext('2d').drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
  return canvas
}

function Label({ children, className = '' }) {
  return <p className={`label mb-4 ${className}`}>{children}</p>
}

function Section({ title, description, children }) {
  return (
    <section className="container-x border-t border-line pb-24 pt-10">
      <div className="mb-10 grid gap-4 md:grid-cols-12">
        <h2 className="display text-4xl font-medium tracking-[-0.04em] md:col-span-5 md:text-5xl">{title}</h2>
        <p className="max-w-[56ch] text-lg leading-snug text-muted md:col-span-7">{description}</p>
      </div>
      {children}
    </section>
  )
}

/* ---------- 1. Shadow smear ---------- */

function SmearImage({ src }) {
  const area = useRef(null)
  const canvas = useRef(null)
  const [ready, setReady] = useState(false)
  const source = useCallback(
    async (dpr) => coverCanvas(await loadImage(src), canvas.current.getBoundingClientRect(), dpr),
    [src],
  )
  const onReady = useCallback(() => setReady(true), [])
  useSmear({ area, canvas, source, onReady })

  return (
    <div ref={area} className="relative aspect-[4/5] overflow-hidden rounded-card bg-black/5">
      <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <canvas ref={canvas} className={`absolute inset-0 h-full w-full transition-opacity ${ready ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  )
}

/* ---------- 2. Cursor parallax ---------- */

function ParallaxImage({ src }) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1.15)
  const spring = { stiffness: 60, damping: 20, mass: 0.6 }
  const sx = useSpring(x, spring)
  const sy = useSpring(y, spring)
  const sScale = useSpring(scale, { stiffness: 40, damping: 18 })

  const onMove = (e) => {
    if (reduce) return
    const r = e.currentTarget.getBoundingClientRect()
    // image drifts against the pointer, 4% of the card size at the edges
    x.set(-((e.clientX - r.left) / r.width - 0.5) * r.width * 0.08)
    y.set(-((e.clientY - r.top) / r.height - 0.5) * r.height * 0.08)
    scale.set(1.08)
  }
  const onLeave = () => {
    x.set(0)
    y.set(0)
    scale.set(1.15)
  }

  return (
    <div onPointerMove={onMove} onPointerLeave={onLeave} className="relative aspect-[4/5] overflow-hidden rounded-card bg-black/5">
      <motion.img src={src} alt="" style={{ x: sx, y: sy, scale: sScale }} className="absolute inset-0 h-full w-full object-cover" />
    </div>
  )
}

/* ---------- 3. Mask reveal ---------- */

function MaskImage({ src, index, run }) {
  const ease = [0.77, 0, 0.18, 1]
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-card">
      <motion.div
        key={run}
        className="absolute inset-0"
        initial={{ clipPath: 'inset(0 0 100% 0)' }}
        whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 1.2, delay: index * 0.1, ease }}
      >
        <motion.img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          initial={{ scale: 1.3 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, margin: '-15% 0px' }}
          transition={{ duration: 1.5, delay: index * 0.1, ease }}
        />
      </motion.div>
    </div>
  )
}

export default function Lab() {
  const { name } = useSiteInfo()
  const [run, setRun] = useState(0)

  return (
    <>
      <title>Effects lab</title>
      <meta name="robots" content="noindex" />

      <section className="container-x pb-16">
        <p className="label">Lab · not linked from the site</p>
        <h1 className="display mt-4 text-[clamp(2.75rem,7.5vw,8rem)]">Pointer effects</h1>
        <p className="mt-6 max-w-[52ch] text-xl text-muted">
          Effects from the “WIDE” CodePen, on the places you picked. Move the mouse over each one.
        </p>
      </section>

      <Section
        title="1 · Shadow smear"
        description="The pen’s shader mode (key B). Dark pixels stream toward the cursor in noisy threads with a faint rainbow tint; it builds up over ~1.5 s and fades out when you leave. Strongest when the cursor is a little away from the centre."
      >
        <Label>On photos</Label>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {PHOTOS.map((src) => (
            <SmearImage key={src} src={src} />
          ))}
        </div>

        <Label className="mt-16">On the wordmark</Label>
        <Wordmark text={name} effect="smear" smear={TEXT_SMEAR} animate={false} />

        <Label className="mt-16">On a dark panel (grabs the light text instead)</Label>
        <div className="overflow-hidden rounded-card bg-ink p-6 md:p-10">
          <Wordmark text="Let’s talk" effect="smear" animate={false} smear={PANEL_SMEAR} background="#111111" textClass="text-paper" />
        </div>
      </Section>

      <Section
        title="2 · Cursor parallax"
        description="The pen’s default hover. The photo is slightly zoomed and drifts against the cursor, settling back when you leave. Cheap, no WebGL."
      >
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {PHOTOS.map((src) => (
            <ParallaxImage key={src} src={src} />
          ))}
        </div>
      </Section>

      <Section
        title="3 · Mask reveal"
        description="How the pen opens images: a clip-path wipes from the top while the photo settles from a zoom. Runs on scroll; replay with the button."
      >
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="label mb-6 cursor-pointer rounded-full bg-black/5 px-5 py-3 text-ink transition-colors hover:bg-black/10"
        >
          Replay ↻
        </button>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {PHOTOS.map((src, i) => (
            <MaskImage key={src} src={src} index={i} run={run} />
          ))}
        </div>
      </Section>
    </>
  )
}
