import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react'
import { useRef } from 'react'

const wrap = (min: number, max: number, v: number) => {
  const range = max - min
  return ((((v - min) % range) + range) % range) + min
}

/** Endlos-Laufband, dessen Tempo und Neigung auf die Scroll-Geschwindigkeit reagieren. */
function Row({ words, baseVelocity, outline = false }: { words: string[]; baseVelocity: number; outline?: boolean }) {
  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 })
  const factor = useTransform(velocity, [-2000, 0, 2000], [-4, 0, 4], { clamp: false })
  const skew = useTransform(velocity, [-2500, 2500], [-6, 6])
  const x = useTransform(baseX, (v) => `${wrap(-25, -50, v)}%`)
  const dir = useRef(1)

  useAnimationFrame((_, delta) => {
    let move = dir.current * baseVelocity * (delta / 1000)
    const f = factor.get()
    if (f < 0) dir.current = -1
    else if (f > 0) dir.current = 1
    move += dir.current * move * Math.abs(f)
    baseX.set(baseX.get() + move)
  })

  const content = words.map((w, i) => (
    <span key={i} className="marquee__item">
      {w}
      <svg className="marquee__star" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
      </svg>
    </span>
  ))

  return (
    <div className={`marquee__row ${outline ? 'marquee__row--outline' : ''}`}>
      <motion.div className="marquee__track" style={{ x, skewX: skew }}>
        {content}
        {content}
        {content}
        {content}
      </motion.div>
    </div>
  )
}

export function Marquee() {
  return (
    <section className="marquee" aria-label="Unser Angebot">
      <Row words={['Cağ Kebab', 'Döner', 'Pide', 'Pizza', 'Grill', 'Salate']} baseVelocity={-2.2} />
      <Row words={['Mercimek', 'Köfte', 'Baklava', 'Künefe', 'Ayran', 'Mezze']} baseVelocity={2.2} outline />
    </section>
  )
}
