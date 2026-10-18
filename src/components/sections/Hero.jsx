import RichText from '../ui/RichText'
import Reveal from '../ui/Reveal'
import Wordmark from '../ui/Wordmark'
import CardStack from '../ui/CardStack'
import TiltCard from '../ui/TiltCard'
import Media from '../ui/Media'
import { ButtonRow } from '../ui/Button'
import { buttons, heading, restHtml, text } from '../../lib/wp'
import { usePageIndex, useSiteInfo } from '../../hooks/useWp'

function FeaturedMedia({ image, video }) {
  if (!image && !video) return null
  return (
    <TiltCard className="container-x mt-12 md:mt-16">
      <div data-cursor="light" className="relative aspect-[4/3] overflow-hidden rounded-card md:aspect-[16/9]">
        <Media video={video} image={image} sizes="100vw" />
      </div>
    </TiltCard>
  )
}

/** Home: giant site name, then the H1 and intro as two small text columns. */
function WordmarkHero({ title, intro, actions }) {
  const { name } = useSiteInfo()
  return (
    <section className="container-x">
      <Wordmark text={name} />
      <div className="mt-10 grid items-end gap-6 md:mt-16 md:grid-cols-2">
        <Reveal delay={0.4}>
          <h1 className="max-w-[24ch] text-xl leading-[1.3] tracking-[-0.02em] md:text-[22px]">{title}</h1>
        </Reveal>
        <Reveal delay={0.5} className="md:justify-self-end">
          <RichText html={intro} className="wp-highlight max-w-[46ch] text-xl leading-[1.3] tracking-[-0.02em] md:text-right md:text-[22px]" />
        </Reveal>
      </div>
      {actions.length > 0 && (
        <Reveal delay={0.6}>
          <ButtonRow items={actions} className="mt-8 md:mt-10" />
        </Reveal>
      )}
    </section>
  )
}

/** Big left-aligned title ("Selected Work"), optional 3D stack on the right. */
function TitleHero({ title, intro, actions, image, video, stack }) {
  const { data: index } = usePageIndex()
  const images = stack ? [...(index?.values() || [])].map((p) => p.image).filter(Boolean) : []

  return (
    <>
      <section className={`container-x grid items-center gap-10 pb-6 md:pb-10 ${stack ? 'lg:grid-cols-[1.3fr_1fr]' : ''}`}>
        <div>
          <Reveal>
            <h1 className="display max-w-[14ch] text-[clamp(2.75rem,7.5vw,8rem)]">{title}</h1>
          </Reveal>
          <Reveal delay={0.15}>
            <RichText html={intro} className="wp-highlight mt-8 max-w-[44ch] text-xl leading-[1.3] tracking-[-0.02em] md:text-[22px]" />
          </Reveal>
          <Reveal delay={0.25}>
            <ButtonRow items={actions} className="mt-8" />
          </Reveal>
        </div>
        {stack && (
          <Reveal delay={0.2} className="hidden lg:block">
            <CardStack images={images} />
          </Reveal>
        )}
      </section>
      <FeaturedMedia image={image} video={video} />
    </>
  )
}

/** Centred title like the reference project pages ("Syndicate"). */
function CenteredHero({ title, intro, actions, image, video }) {
  return (
    <>
      <section className="container-x flex flex-col items-center pb-6 text-center md:pb-10">
        <Reveal>
          <h1 className="display mx-auto max-w-[16ch] text-[clamp(2.5rem,6.5vw,7rem)]">{title}</h1>
        </Reveal>
        <Reveal delay={0.15}>
          <RichText html={intro} className="wp-highlight mx-auto mt-8 max-w-[44ch] text-xl leading-[1.3] tracking-[-0.02em] md:text-[22px]" />
        </Reveal>
        <Reveal delay={0.25}>
          <ButtonRow items={actions} className="mt-8 justify-center" />
        </Reveal>
      </section>
      <FeaturedMedia image={image} video={video} />
    </>
  )
}

export default function Hero({ el, page, variant }) {
  const h1 = heading(el, 'h1')
  const props = {
    title: text(h1) || page.title,
    intro: restHtml(el, [h1]),
    actions: buttons(el),
    image: page.image,
    video: page.video,
  }
  if (variant === 'wordmark') return <WordmarkHero {...props} />
  if (variant === 'centered') return <CenteredHero {...props} />
  return <TitleHero {...props} stack={variant === 'stack'} />
}
