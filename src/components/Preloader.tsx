import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect, useState } from 'react'
import { ease } from './ui/Reveal'

const SEEN_KEY = 'sofra.intro.seen'

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Intro: Ein goldener Ring schließt sich um das Logo, dann öffnet sich der Vorhang.
 * Wird pro Sitzung nur einmal gezeigt.
 */
export function Preloader({ onDone }: { onDone: () => void }) {
  const [skip] = useState(alreadySeen)
  const [leaving, setLeaving] = useState(false)
  const progress = useMotionValue(0)
  const percent = useTransform(progress, (v) => Math.round(v * 100).toString().padStart(2, '0'))

  useEffect(() => {
    if (skip) {
      onDone()
      return
    }
    let cancelled = false
    const fontsReady = document.fonts?.ready ?? Promise.resolve()
    const run = async () => {
      await animate(progress, 0.82, { duration: 1.3, ease: [0.65, 0, 0.35, 1] })
      await fontsReady
      if (cancelled) return
      await animate(progress, 1, { duration: 0.45, ease: 'easeOut' })
      if (cancelled) return
      try {
        sessionStorage.setItem(SEEN_KEY, '1')
      } catch {
        /* egal */
      }
      setLeaving(true)
      window.setTimeout(onDone, 350)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [skip, onDone, progress])

  if (skip) return null

  return (
    <motion.div
      className="preloader"
      initial={{ clipPath: 'inset(0 0 0% 0)' }}
      animate={leaving ? { clipPath: 'inset(0 0 100% 0)' } : undefined}
      transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
      aria-hidden="true"
    >
      <motion.div
        className="preloader__inner"
        animate={leaving ? { y: -60, opacity: 0, scale: 0.96 } : { y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease }}
      >
        <div className="preloader__badge">
          <svg viewBox="0 0 120 120" className="preloader__ring">
            <circle cx="60" cy="60" r="56" className="preloader__track" />
            <motion.circle cx="60" cy="60" r="56" className="preloader__progress" style={{ pathLength: progress }} />
          </svg>
          <motion.img
            src="/logo.jpg"
            alt=""
            initial={{ opacity: 0, scale: 0.85, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, ease }}
          />
        </div>
        <div className="preloader__meta">
          <span>Kempten</span>
          <motion.span className="preloader__count">{percent}</motion.span>
          <span>Allgäu</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
