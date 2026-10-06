import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Bento } from '../components/Bento'
import { CagStory } from '../components/CagStory'
import { Hero } from '../components/Hero'
import { Manifesto } from '../components/Manifesto'
import { Marquee } from '../components/Marquee'
import { MenuSection } from '../components/MenuSection'
import { Reservation } from '../components/Reservation'
import { Signatures } from '../components/Signatures'
import { Visit } from '../components/Visit'
import { scrollToTarget } from '../lib/smoothScroll'

export function Home({ ready }: { ready: boolean }) {
  const location = useLocation()

  // Von Unterseiten kommend oder per Deeplink (/#speisekarte) zum Abschnitt springen
  useEffect(() => {
    if (!ready) return
    const target = (location.state as { scrollTo?: string } | null)?.scrollTo ?? location.hash
    if (!target) return
    const id = window.setTimeout(() => scrollToTarget(target), 300)
    return () => window.clearTimeout(id)
  }, [ready, location])

  return (
    <main>
      <Hero ready={ready} />
      <Marquee />
      <Manifesto />
      <CagStory />
      <Signatures />
      <Bento />
      <MenuSection />
      <Visit />
      <Reservation />
    </main>
  )
}
