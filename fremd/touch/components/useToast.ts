import { createContext, useContext } from 'react'
import type { GlyphName } from '../icons/Glyph'

export interface ToastOptions {
  title: string
  message?: string | undefined
  icon?: GlyphName | undefined
  tone?: 'neutral' | 'success' | 'danger' | undefined
  action?: { label: string; onSelect: () => void } | undefined
  /** Milliseconds before it leaves on its own; 0 keeps it until dismissed. Default 4000. */
  duration?: number | undefined
}

export interface ToastApi {
  show: (options: ToastOptions) => number
  dismiss: (id: number) => void
}

/** Provided by <ToastProvider> (components/Toast.tsx). Its own module, so hot-reloading the provider keeps the same context. */
export const ToastContext = createContext<ToastApi | null>(null)

/** Shows and dismisses toasts; needs a <ToastProvider> above. */
export function useToast(): ToastApi {
  const api = useContext(ToastContext)
  if (!api) throw new Error('useToast must be used inside <ToastProvider>')
  return api
}
