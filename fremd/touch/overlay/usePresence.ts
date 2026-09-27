import { useEffect, useRef, useState } from 'react'

export type PresenceState = 'open' | 'closing' | 'closed'

/**
 * Keeps an overlay mounted while its exit animation plays.
 * Call `onExitEnd` from the panel's onAnimationEnd; a timer is the safety
 * net because animationend is not guaranteed (e.g. display changes,
 * reduced motion with near-zero durations, background tabs).
 */
export function usePresence(open: boolean, exitMs: number) {
  const [state, setState] = useState<PresenceState>(open ? 'open' : 'closed')
  if (open && state !== 'open') setState('open')
  if (!open && state === 'open') setState('closing')

  const timer = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (state !== 'closing') return
    timer.current = window.setTimeout(() => setState('closed'), exitMs + 80)
    return () => window.clearTimeout(timer.current)
  }, [state, exitMs])

  return {
    state,
    mounted: state !== 'closed',
    onExitEnd: (event: { target: EventTarget; currentTarget: EventTarget }) => {
      if (state === 'closing' && event.target === event.currentTarget) setState('closed')
    },
  }
}
