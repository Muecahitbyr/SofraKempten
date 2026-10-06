import { motion, useMotionValue, useSpring } from 'motion/react'
import { useRef, type PointerEvent, type ReactNode } from 'react'
import { useFinePointer } from '../../hooks/useMediaQuery'

/** Zieht sein Kind leicht in Richtung Cursor – dezent, nicht verspielt. */
export function Magnetic({ children, strength = 0.25 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const fine = useFinePointer()
  const x = useSpring(useMotionValue(0), { stiffness: 200, damping: 16, mass: 0.4 })
  const y = useSpring(useMotionValue(0), { stiffness: 200, damping: 16, mass: 0.4 })

  const onMove = (e: PointerEvent) => {
    if (!fine || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.span ref={ref} style={{ x, y, display: 'inline-flex' }} onPointerMove={onMove} onPointerLeave={reset}>
      {children}
    </motion.span>
  )
}
