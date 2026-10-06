import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Feiner Zeiger (Maus/Trackpad) – Hover- und Tilt-Effekte nur dort aktivieren */
export const useFinePointer = () => useMediaQuery('(hover: hover) and (pointer: fine)')

export const useReducedMotionPref = () => useMediaQuery('(prefers-reduced-motion: reduce)')
