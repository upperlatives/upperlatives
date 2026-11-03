/*
 * Cookie consent and Google Tag Manager. GTM is loaded only after a visitor
 * accepts: before that, or after denying, nothing is sent to Google. The choice
 * itself stays in this browser's localStorage.
 */

const GTM_ID = import.meta.env.VITE_GTM_ID || ''
const STORAGE_KEY = 'upl-cookie-consent'
const GOOGLE_COOKIES = /^(_ga|_gid|_gat|_gcl)/

// In development the banner also shows without an ID, so it can be reviewed.
export const consentEnabled = Boolean(GTM_ID) || import.meta.env.DEV

function readChoice() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null // storage blocked: ask again next time
  }
}

let choice = readChoice()
let bannerOpen = consentEnabled && !choice
const listeners = new Set()

let gtmLoaded = false
let currentPage = null
let lastSentPage = ''

function emit() {
  listeners.forEach((listener) => listener())
}

function sendPageView() {
  if (!gtmLoaded || !currentPage) return
  const { path, title } = currentPage
  const key = `${path}|${title}`
  if (key === lastSentPage) return // re-renders must not count twice
  lastSentPage = key
  window.dataLayer.push({
    event: 'spa_page_view',
    page_path: path,
    page_location: window.location.href,
    page_title: title,
  })
}

function loadGtm() {
  if (gtmLoaded || !GTM_ID) return
  gtmLoaded = true
  window.dataLayer = window.dataLayer || []
  // Tell Google's tags the visitor agreed (Consent Mode), before GTM starts.
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag('consent', 'default', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
  })
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`
  document.head.appendChild(script)
  sendPageView()
}

function deleteGoogleCookies() {
  const parts = window.location.hostname.split('.')
  const domains = parts.map((_, i) => parts.slice(i).join('.'))
  for (const cookie of document.cookie.split('; ')) {
    const name = cookie.split('=')[0]
    if (!GOOGLE_COOKIES.test(name)) continue
    const expired = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    document.cookie = expired
    domains.forEach((domain) => (document.cookie = `${expired}; domain=.${domain}`))
  }
}

export function setConsent(value) {
  const withdrawn = choice === 'granted' && value === 'denied'
  choice = value
  bannerOpen = false
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // storage blocked: the choice holds until the page is reloaded
  }
  emit()
  if (value === 'granted') loadGtm()
  if (withdrawn) {
    // GTM is already running in this page: remove its cookies and start clean.
    deleteGoogleCookies()
    window.location.reload()
  }
}

export function openConsent() {
  bannerOpen = true
  emit()
}

export function trackPageView(path, title) {
  currentPage = { path, title }
  sendPageView()
}

export const isConsentOpen = () => bannerOpen

export function subscribeConsent(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

if (choice === 'granted') loadGtm()
