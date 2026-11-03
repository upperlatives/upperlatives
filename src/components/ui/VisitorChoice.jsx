import { useSyncExternalStore } from 'react'
import { ActionButton } from './Button'
import { isConsentOpen, setConsent, subscribeConsent } from '../../lib/visitorChoice'

/** Small cookie popup: tracking starts only after Accept. */
export default function VisitorChoice() {
  const open = useSyncExternalStore(subscribeConsent, isConsentOpen)
  if (!open) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      data-cursor="light"
      className="fixed inset-x-4 bottom-4 z-90 rounded-card bg-ink p-5 text-paper shadow-xl sm:left-auto sm:right-6 sm:bottom-6 sm:w-90"
    >
      <p className="text-lg leading-snug tracking-[-0.01em]">We use cookies to see how our site is used. Is that okay?</p>
      <div className="mt-4 flex gap-2.5">
        <ActionButton onClick={() => setConsent('granted')}>Accept</ActionButton>
        <ActionButton onClick={() => setConsent('denied')}>Deny</ActionButton>
      </div>
    </div>
  )
}
