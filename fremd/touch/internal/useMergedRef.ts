import { useCallback, type Ref, type RefCallback } from 'react'

type Cleanup = () => void

/** Gives `value` to one ref and returns how to take it back again (React 19 ref semantics). */
function attach<T>(ref: Ref<T> | undefined, value: T | null): Cleanup | undefined {
  if (typeof ref === 'function') {
    const cleanup = ref(value)
    // A callback ref that returned a cleanup gets the cleanup on detach, not a second call with null.
    return typeof cleanup === 'function' ? cleanup : () => void ref(null)
  }
  if (!ref) return undefined
  ref.current = value
  return () => {
    ref.current = null
  }
}

/**
 * One stable callback ref that feeds two refs, e.g. a component's own
 * `useRef` and the caller's `ref` prop (either may be a ref object, a
 * callback ref or nothing).
 *
 * React 19 ref cleanups are kept: a callback ref that returns a cleanup gets
 * that cleanup called on detach; any other callback ref is called with null,
 * and a ref object is set back to null. When the caller passes a different
 * ref, the old one is detached and the new one attached.
 */
export function useMergedRef<T>(own: Ref<T> | undefined, outer: Ref<T> | undefined): RefCallback<T> {
  return useCallback(
    (value: T | null) => {
      const detach = [attach(own, value), attach(outer, value)]
      return () => {
        for (const cleanup of detach) cleanup?.()
      }
    },
    [own, outer],
  )
}
