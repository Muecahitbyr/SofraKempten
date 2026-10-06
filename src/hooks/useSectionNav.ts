import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { scrollToTarget } from '../lib/smoothScroll'

/** Springt zu einem Abschnitt der Startseite – auch von Unterseiten wie dem Impressum aus. */
export function useSectionNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return useCallback(
    (hash: string) => {
      if (location.pathname === '/') {
        scrollToTarget(hash)
        history.replaceState(null, '', hash)
      } else {
        navigate('/' + hash, { state: { scrollTo: hash } })
      }
    },
    [location.pathname, navigate],
  )
}
