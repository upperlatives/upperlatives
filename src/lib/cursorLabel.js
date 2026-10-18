import site from '../site.config'
import { normalizePath } from './wp'

/** Cursor label for a link, from site.config.js → cursorLabels. */
export function cursorLabel(href, internal) {
  const { exact, under, external, fallback } = site.cursorLabels
  if (!internal) return /^https?:/.test(href || '') ? external : fallback
  const path = normalizePath(href)
  if (exact[path]) return exact[path]
  const prefix = Object.keys(under).find((p) => path.startsWith(p))
  return prefix ? under[prefix] : fallback
}
