import { motion, type HTMLMotionProps } from 'motion/react'
import type { ElementType, ReactNode } from 'react'

export const ease = [0.22, 1, 0.36, 1] as const

interface RevealProps extends HTMLMotionProps<'div'> {
  delay?: number
  y?: number
  blur?: boolean
}

/** Sanftes Einblenden beim Hineinscrollen (einmalig). */
export function Reveal({ delay = 0, y = 36, blur = true, children, ...rest }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: blur ? 'blur(10px)' : 'blur(0px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 1.1, ease, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

interface MaskLinesProps {
  lines: ReactNode[]
  as?: ElementType
  className?: string
  delay?: number
  /** sofort statt beim Hineinscrollen animieren */
  immediate?: boolean
}

/** Überschrift, deren Zeilen einzeln aus einer Maske nach oben gleiten – wie bei Apple-Keynotes. */
export function MaskLines({ lines, as: Tag = 'h2', className, delay = 0, immediate = false }: MaskLinesProps) {
  const trigger = immediate ? { animate: 'show' } : { whileInView: 'show', viewport: { once: true, margin: '-10% 0px' } }
  return (
    <Tag className={className}>
      <motion.span
        style={{ display: 'block' }}
        initial="hidden"
        {...trigger}
        variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: delay } } }}
      >
        {lines.map((line, i) => (
          <span key={i} className="mask-line">
            <motion.span
              style={{ display: 'inline-block' }}
              variants={{
                hidden: { y: '110%', rotate: 2 },
                show: { y: '0%', rotate: 0, transition: { duration: 1.2, ease } },
              }}
            >
              {line}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  )
}
