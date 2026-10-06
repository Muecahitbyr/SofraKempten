import { motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react'
import { useEffect, useRef, type MouseEvent } from 'react'
import { site } from '../data/site'
import { useFinePointer } from '../hooks/useMediaQuery'
import { useOpenStatus } from '../hooks/useOpenStatus'
import { useSectionNav } from '../hooks/useSectionNav'
import { EmberCanvas } from './EmberCanvas'
import { ArrowRight, ArrowUpRight } from './ui/Icons'
import { Magnetic } from './ui/Magnetic'
import { MaskLines, ease } from './ui/Reveal'

export function Hero({ ready }: { ready: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const fine = useFinePointer()
  const status = useOpenStatus()
  const go = useSectionNav()

  // Scroll-Choreografie über 220vh: Headline weicht, Emblem tritt hervor
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.0005 })

  const titleScale = useTransform(p, [0, 0.45], [1, 0.82])
  const titleOpacity = useTransform(p, [0, 0.32], [1, 0])
  const titleY = useTransform(p, [0, 0.45], [0, -120])
  const titleBlur = useTransform(p, [0, 0.38], [0, 14])
  const titleFilter = useMotionTemplate`blur(${titleBlur}px)`

  const emblemScale = useTransform(p, [0.12, 0.62, 1], [0.45, 1, 1.08])
  const emblemOpacity = useTransform(p, [0.14, 0.42], [0, 1])
  const emblemRotate = useTransform(p, [0, 1], [-14, 0])
  const claimOpacity = useTransform(p, [0.5, 0.72], [0, 1])
  const claimY = useTransform(p, [0.5, 0.75], [40, 0])
  const glowScale = useTransform(p, [0, 0.7], [1, 1.6])
  const glowOpacity = useTransform(p, [0, 0.6, 1], [0.75, 1, 0.6])
  const cueOpacity = useTransform(p, [0, 0.08], [1, 0])

  // Pointer-Parallax: Ebenen bewegen sich unterschiedlich stark
  const mx = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 })
  const my = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 })
  const farX = useTransform(mx, (v) => v * -18)
  const farY = useTransform(my, (v) => v * -12)
  const nearX = useTransform(mx, (v) => v * 22)
  const nearY = useTransform(my, (v) => v * 16)
  const tiltX = useTransform(my, (v) => v * -10)
  const tiltY = useTransform(mx, (v) => v * 12)

  useEffect(() => {
    if (!fine) return
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5)
      my.set(e.clientY / window.innerHeight - 0.5)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [fine, mx, my])

  const toMenu = (e: MouseEvent) => {
    e.preventDefault()
    go('#speisekarte')
  }

  return (
    <section className="hero" ref={ref} aria-label="Willkommen bei Sofra">
      <div className="hero__sticky">
        <motion.div className="hero__glow" style={{ scale: glowScale, opacity: glowOpacity, x: farX, y: farY }} />
        <div className="hero__grain" />
        <EmberCanvas className="hero__embers" density={1.2} />
        <div className="hero__vignette" />

        <motion.div className="hero__emblem-wrap" style={{ x: nearX, y: nearY }}>
          <motion.div
            className="hero__emblem"
            style={{ scale: emblemScale, opacity: emblemOpacity, rotate: emblemRotate, rotateX: tiltX, rotateY: tiltY }}
          >
            <div className="hero__halo" />
            <img src="/logo.jpg" alt="Sofra Logo" width={150} height={150} />
          </motion.div>
          <motion.p className="hero__claim serif" style={{ opacity: claimOpacity, y: claimY }}>
            Good Food – <em>Good People.</em>
          </motion.p>
        </motion.div>

        <motion.div
          className="hero__content container"
          style={{ scale: titleScale, opacity: titleOpacity, y: titleY, filter: titleFilter }}
        >
          <motion.div
            className="hero__eyebrow"
            initial={{ opacity: 0, y: 16 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 1, ease, delay: 0.1 }}
          >
            <span className="hero__badge">Neueröffnung</span>
            <span>
              {site.address.street} · Kempten
            </span>
          </motion.div>

          {ready && (
            <MaskLines
              as="h1"
              immediate
              delay={0.2}
              className="hero__title"
              lines={[
                <span className="gold-text">Cağ Kebab.</span>,
                <span className="hero__title-sub serif">
                  Vom Spieß, <em>mit Herz.</em>
                </span>,
              ]}
            />
          )}

          <motion.p
            className="hero__lead"
            initial={{ opacity: 0, y: 20 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 1.1, ease, delay: 0.7 }}
          >
            Frische Grill- und türkische Spezialitäten – mitten in der Kemptener Innenstadt.
          </motion.p>

          <motion.div
            className="hero__ctas"
            initial={{ opacity: 0, y: 20 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 1.1, ease, delay: 0.85 }}
          >
            <Magnetic>
              <a href="/#speisekarte" className="btn btn--gold" onClick={toMenu}>
                Speisekarte ansehen <ArrowRight width={16} height={16} />
              </a>
            </Magnetic>
            <Magnetic>
              <a href={site.maps.google} className="btn btn--ghost" target="_blank" rel="noreferrer">
                Route planen <ArrowUpRight width={16} height={16} />
              </a>
            </Magnetic>
          </motion.div>
        </motion.div>

        <motion.div className="hero__footer-wrap" style={{ opacity: cueOpacity }}>
        <motion.div
          className="hero__footer container"
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : undefined}
          transition={{ duration: 1, delay: 1.1 }}
        >
          <div className="hero__meta">
            <span className={`dot ${status.isOpen ? 'is-open' : ''}`} />
            <span>
              {status.headline} · {status.detail}
            </span>
          </div>
          <div className="hero__meta hero__meta--right">{site.hoursSummary}</div>
        </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
