import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from 'motion/react'
import { useEffect, useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { site } from '../data/site'
import { useOpenStatus } from '../hooks/useOpenStatus'
import { useSectionNav } from '../hooks/useSectionNav'
import { lockScroll } from '../lib/smoothScroll'
import { ArrowUpRight } from './ui/Icons'
import { ease } from './ui/Reveal'

export const navLinks = [
  { href: '#erlebnis', label: 'Erlebnis' },
  { href: '#cag-kebab', label: 'Cağ Kebab' },
  { href: '#spezialitaeten', label: 'Spezialitäten' },
  { href: '#speisekarte', label: 'Speisekarte' },
  { href: '#besuch', label: 'Besuch' },
  { href: '#reservieren', label: 'Reservieren' },
]

export function Nav() {
  const { scrollY, scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 })
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const [onLight, setOnLight] = useState(false)
  const status = useOpenStatus()
  const go = useSectionNav()

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setScrolled(y > 24)
    setHidden(y > 480 && y > prev + 2)
    if (y < prev - 2) setHidden(false)
    // Über der hellen Speisekarte wird die Navigation ebenfalls hell – wie bei Apple
    const menu = document.getElementById('speisekarte')
    if (menu) {
      const r = menu.getBoundingClientRect()
      setOnLight(r.top <= 30 && r.bottom > 30)
    } else setOnLight(false)
  })

  // Sticky-Elemente (z. B. die Menüleiste) rücken nach oben, wenn die Navigation ausblendet
  useEffect(() => {
    document.documentElement.dataset.nav = hidden && !open ? 'hidden' : 'shown'
  }, [hidden, open])

  useEffect(() => {
    lockScroll('nav', open)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const handle = (href: string) => (e: MouseEvent) => {
    e.preventDefault()
    setOpen(false)
    window.setTimeout(() => go(href), open ? 380 : 0)
  }

  return (
    <>
      <motion.header
        className={`nav ${scrolled ? 'nav--solid' : ''} ${onLight && !open ? 'nav--light' : ''} ${open ? 'nav--open' : ''}`}
        animate={{ y: hidden && !open ? '-110%' : '0%' }}
        transition={{ duration: 0.45, ease }}
      >
        <div className="nav__inner container">
          <Link to="/" className="nav__brand" aria-label="Sofra – Startseite" onClick={() => setOpen(false)}>
            <img src="/logo.jpg" alt="" width={30} height={30} />
            <span>Sofra</span>
          </Link>

          <nav className="nav__links" aria-label="Hauptnavigation">
            {navLinks.map((l) => (
              <a key={l.href} href={'/' + l.href} onClick={handle(l.href)}>
                {l.label}
              </a>
            ))}
          </nav>

          <div className="nav__actions">
            <span className={`status-pill ${status.isOpen ? 'is-open' : ''}`} title={status.detail}>
              <i aria-hidden="true" />
              {status.isOpen ? 'Geöffnet' : 'Geschlossen'}
            </span>
            <a className="nav__cta" href={site.maps.google} target="_blank" rel="noreferrer">
              Route <ArrowUpRight width={14} height={14} />
            </a>
            <button
              className="nav__burger"
              aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
        <motion.div className="nav__progress" style={{ scaleX: progress }} />
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-menu"
            initial={{ clipPath: 'circle(0% at calc(100% - 36px) 26px)' }}
            animate={{ clipPath: 'circle(150% at calc(100% - 36px) 26px)' }}
            exit={{ clipPath: 'circle(0% at calc(100% - 36px) 26px)' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <nav className="mobile-menu__links" aria-label="Mobile Navigation">
              {navLinks.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={'/' + l.href}
                  onClick={handle(l.href)}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ duration: 0.7, ease, delay: 0.15 + i * 0.06 }}
                >
                  <span className="mobile-menu__index">0{i + 1}</span>
                  {l.label}
                </motion.a>
              ))}
            </nav>
            <motion.div
              className="mobile-menu__footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.5 } }}
              exit={{ opacity: 0 }}
            >
              <p>
                {site.address.street}
                <br />
                {site.address.zip} {site.address.city}
              </p>
              <p>
                {site.hoursSummary}
                <br />
                {site.closedDay}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
