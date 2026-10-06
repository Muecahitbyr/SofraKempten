import { MotionConfig } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { ChoiceDialog } from './components/ChoiceDialog'
import { Footer } from './components/Footer'
import { Nav } from './components/Nav'
import { Preloader } from './components/Preloader'
import { ServiceSheet } from './components/ServiceSheet'
import { TableTray } from './components/TableTray'
import { TableProvider } from './hooks/useTable'
import { lockScroll, startSmoothScroll, stopSmoothScroll } from './lib/smoothScroll'
import { Home } from './pages/Home'
import { Kitchen } from './pages/Kitchen'
import { Datenschutz, Impressum } from './pages/Legal'

export default function App() {
  const { pathname } = useLocation()
  const isKitchen = pathname.startsWith('/kueche')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    startSmoothScroll()
    return stopSmoothScroll
  }, [])

  useEffect(() => {
    lockScroll('intro', !ready && !isKitchen)
  }, [ready, isKitchen])

  const done = useCallback(() => setReady(true), [])

  // Interne Küchenansicht ohne Website-Rahmen
  if (isKitchen) {
    return (
      <MotionConfig reducedMotion="user">
        <Kitchen />
      </MotionConfig>
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <TableProvider>
        <Preloader onDone={done} />
        <Nav />
        <Routes>
          <Route path="/" element={<Home ready={ready} />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          <Route path="*" element={<Home ready={ready} />} />
        </Routes>
        <Footer />
        <TableTray />
        <ChoiceDialog />
        <ServiceSheet />
      </TableProvider>
    </MotionConfig>
  )
}
