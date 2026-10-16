import Media from './Media'

/** Pages fanned around a vertical axis, slowly turning (Work page hero). */
export default function CardStack({ images = [], count = 8 }) {
  const tiles = Array.from({ length: count }, (_, i) => images[i % (images.length || 1)] || null)

  return (
    <div aria-hidden className="relative mx-auto aspect-square w-full max-w-[420px] [perspective:1400px]">
      <div className="absolute inset-0 animate-stack [transform-style:preserve-3d] motion-reduce:animate-none">
        {tiles.map((img, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-[12%] h-[76%] w-[42%] overflow-hidden rounded-lg shadow-xl"
            style={{
              transformOrigin: '0% 50%',
              transform: `rotateY(${(360 / count) * i}deg) rotateZ(${i % 2 ? 6 : -4}deg)`,
              backfaceVisibility: 'visible',
            }}
          >
            <Media image={img} index={i} />
          </div>
        ))}
      </div>
    </div>
  )
}
