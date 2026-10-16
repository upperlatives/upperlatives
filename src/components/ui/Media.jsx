import { gradientFor } from '../../lib/gradients'

/** Image if there is one, otherwise a gradient — always fills its parent. */
export default function Media({ image, index = 0, className = '', sizes = '(min-width: 768px) 50vw, 100vw' }) {
  if (image?.src) {
    return (
      <img
        src={image.src}
        srcSet={image.srcSet || undefined}
        sizes={image.srcSet ? sizes : undefined}
        alt={image.alt || ''}
        loading="lazy"
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
      />
    )
  }
  return <div aria-hidden className={`absolute inset-0 ${className}`} style={{ backgroundImage: gradientFor(index) }} />
}
