import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { useRef, type PointerEvent, type ReactNode } from 'react'
import { useFinePointer } from '../../hooks/useMediaQuery'

interface SpotlightCardProps {
  children: ReactNode
  className?: string
  /** maximale Neigung in Grad */
  tilt?: number
  as?: 'div' | 'article'
}

/**
 * Karte mit 3D-Neigung und goldenem Lichtkegel, der dem Cursor folgt.
 * Auf Touch-Geräten bleibt sie ruhig.
 */
export function SpotlightCard({ children, className = '', tilt = 6, as = 'div' }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const fine = useFinePointer()
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const sx = useSpring(px, { stiffness: 160, damping: 20 })
  const sy = useSpring(py, { stiffness: 160, damping: 20 })
  const rotateY = useTransform(sx, [0, 1], [-tilt, tilt])
  const rotateX = useTransform(sy, [0, 1], [tilt, -tilt])

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el || !fine) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    px.set(x)
    py.set(y)
    el.style.setProperty('--mx', `${x * 100}%`)
    el.style.setProperty('--my', `${y * 100}%`)
  }

  const onLeave = () => {
    px.set(0.5)
    py.set(0.5)
  }

  const Tag = as === 'article' ? motion.article : motion.div

  return (
    <Tag
      ref={ref}
      className={`spotlight ${className}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={fine ? { rotateX, rotateY, transformPerspective: 1000 } : undefined}
    >
      {children}
    </Tag>
  )
}
