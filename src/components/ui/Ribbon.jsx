/**
 * A band of words twisting through 3D space and scrolling endlessly — the
 * "GOOGLE CHANEL NETFLIX" ribbon from the reference, done in CSS.
 */
export default function Ribbon({ words, className = '' }) {
  if (!words?.length) return null
  const run = [...words, ...words]

  return (
    <div
      aria-hidden
      className={`pointer-events-none -my-16 select-none overflow-hidden [perspective:700px] ${className}`}
      style={{ maskImage: 'linear-gradient(90deg, transparent, #000 25%, #000 75%, transparent)' }}
    >
      <div className="[transform:rotateZ(9deg)_rotateY(-28deg)_rotateX(12deg)] [transform-style:preserve-3d]">
        <div className="flex w-max animate-ribbon items-center gap-[0.6em] whitespace-nowrap py-24 motion-reduce:animate-none">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-[0.6em]">
              {run.map((w, i) => (
                <span
                  key={i}
                  className={
                    i % 2
                      ? 'inline-block -scale-x-100 text-[clamp(1rem,2vw,1.75rem)] font-medium uppercase tracking-tight text-paper/70'
                      : 'inline-block text-[clamp(2rem,4.5vw,4rem)] font-medium uppercase tracking-[-0.03em] text-paper'
                  }
                >
                  {w}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
