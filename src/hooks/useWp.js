import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getPage, getPageIndex, getSiteInfo, normalizePath } from '../lib/wp'
import site from '../site.config'

const STALE = 5 * 60 * 1000

export const pageQuery = (id) => ({
  queryKey: ['page', id],
  queryFn: () => getPage(id),
  staleTime: STALE,
  enabled: Boolean(id),
})

export function useSiteInfo() {
  const { data } = useQuery({ queryKey: ['site'], queryFn: getSiteInfo, staleTime: Infinity })
  return { name: data?.name || site.name, description: data?.description || '' }
}

export function usePageIndex() {
  return useQuery({ queryKey: ['pages'], queryFn: getPageIndex, staleTime: STALE })
}

/** Look up the WordPress page summary for a public path. */
export function usePageSummary(path) {
  const { data: index } = usePageIndex()
  return index?.get(normalizePath(path)) || null
}

/** Children of a page, sorted by WordPress menu order. */
export function useChildPages(parentId) {
  const { data: index } = usePageIndex()
  if (!index || !parentId) return []
  return [...index.values()].filter((p) => p.parentId === parentId).sort((a, b) => a.order - b.order)
}

/** Warm the cache when a visitor hovers a link. */
export function usePrefetchPath() {
  const client = useQueryClient()
  return (path) => {
    const index = client.getQueryData(['pages'])
    const page = index?.get(normalizePath(path))
    if (page) client.prefetchQuery(pageQuery(page.id))
  }
}
