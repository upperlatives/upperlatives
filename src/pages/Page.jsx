import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import Sections from '../components/sections/Sections'
import NotFound from './NotFound'
import { normalizePath, parseSections } from '../lib/wp'
import { pageQuery, usePageIndex, useSiteInfo } from '../hooks/useWp'
import site from '../site.config'

function heroVariantFor(path) {
  if (site.heroVariants[path]) return site.heroVariants[path]
  if (site.centeredHeroUnder.some((p) => path.startsWith(p) && path !== p)) return 'centered'
  return 'title'
}

function Loading() {
  return (
    <div className="container-x animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-[clamp(3rem,9vw,8rem)] w-3/4 rounded-card bg-black/5" />
      <div className="mt-8 h-6 w-1/2 rounded bg-black/5" />
      <div className="mt-16 grid gap-2.5 sm:grid-cols-2">
        <div className="aspect-square rounded-card bg-black/5" />
        <div className="aspect-square rounded-card bg-black/5" />
      </div>
    </div>
  )
}

function ErrorState({ error }) {
  return (
    <div className="container-x py-24">
      <p className="label">Content unavailable</p>
      <p className="mt-4 max-w-[50ch] text-xl text-muted">
        WordPress could not be reached. {import.meta.env.DEV && <code className="text-ink">{error.message}</code>}
      </p>
    </div>
  )
}

export default function Page() {
  const { pathname } = useLocation()
  const path = normalizePath(pathname)
  const index = usePageIndex()
  const summary = index.data?.get(path)
  const { name } = useSiteInfo()
  const page = useQuery(pageQuery(summary?.id))
  const sections = useMemo(() => (page.data ? parseSections(page.data.html) : []), [page.data])

  if (index.isError || page.isError) return <ErrorState error={index.error || page.error} />
  if (index.isPending) return <Loading />
  if (!summary) return <NotFound />
  if (!page.data) return <Loading />

  const data = page.data
  const title = path === '/' ? `${name} — ${data.title}` : `${data.title} — ${name}`

  return (
    <>
      {/* React 19 hoists these into <head>. */}
      <title>{title}</title>
      {data.excerpt && <meta name="description" content={data.excerpt} />}
      <meta property="og:title" content={title} />
      {data.excerpt && <meta property="og:description" content={data.excerpt} />}
      {data.image && <meta property="og:image" content={data.image.src} />}

      {sections.length ? (
        <Sections sections={sections} page={data} heroVariant={heroVariantFor(path)} />
      ) : (
        <section className="container-x">
          <h1 className="display text-[clamp(2.75rem,7.5vw,8rem)]">{data.title}</h1>
        </section>
      )}
    </>
  )
}
