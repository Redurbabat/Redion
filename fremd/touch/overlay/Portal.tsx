import './Portal.css'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { pageTheme } from './pageTheme'

export interface PortalProps {
  children: ReactNode
  /** Where to mount; default document.body. Pass an element for contained demos (e.g. a phone frame). */
  container?: HTMLElement | null | undefined
}

/**
 * Renders children into their own layer element (`.ui-touch-portal`), which
 * is what the overlay logic keeps interactive while the rest turns inert.
 *
 * The host element exists from the first render and is attached in a
 * layout effect, so children (and their refs) are ready in the parent's
 * layout effects — overlays can position themselves before the first paint.
 *
 * Theme: a layer in a `container` inherits it from there; a layer in <body>
 * carries `data-ui-theme` itself (see `pageTheme`), so a sheet over a dark
 * page is dark too.
 */
export function Portal({ children, container }: PortalProps) {
  const [host] = useState(() => {
    if (typeof document === 'undefined') return null
    const element = document.createElement('div')
    element.className = 'ui-touch-portal'
    return element
  })

  // Removal waits a microtask and is skipped when the effect runs again at once:
  // React StrictMode re-runs effects right after mounting, and a layer taken out
  // of the document even for a moment drops the focus of the dialog inside it.
  const attached = useRef(false)
  useLayoutEffect(() => {
    if (!host) return
    const parent = container ?? document.body
    if (container) host.removeAttribute('data-ui-theme')
    else host.setAttribute('data-ui-theme', pageTheme())
    if (host.parentNode !== parent) parent.appendChild(host)
    attached.current = true
    return () => {
      attached.current = false
      queueMicrotask(() => {
        if (!attached.current) host.remove()
      })
    }
  }, [host, container])

  return host ? createPortal(children, host) : null
}
