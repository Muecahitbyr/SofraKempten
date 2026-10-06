import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef } from 'react'

const text = 'Sofra – so heißt in der Türkei der gedeckte Tisch. Der Ort, an dem man zusammenkommt, teilt und bleibt.'

const highlight = new Set(['Sofra', 'Tisch.', 'bleibt.'])

/**
 * Wörter bleiben normale Inline-Elemente – so bleiben die Leerzeichen
 * zwischen ihnen in jedem Browser sichtbar.
 */
function Word({ word, range, progress }: { word: string; range: [number, number]; progress: MotionValue<number> }) {
  const opacity = useTransform(progress, range, [0.12, 1])
  return (
    <motion.span style={{ opacity }} className={highlight.has(word) ? 'gold-text serif manifesto__accent' : undefined}>
      {word}
    </motion.span>
  )
}

/** Text, der Wort für Wort aufleuchtet, während man scrollt. */
export function Manifesto() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const words = text.split(' ')
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section className="manifesto" id="erlebnis" ref={ref}>
      <div className="manifesto__sticky container">
        <p className="eyebrow">
          <span className="eyebrow__line" /> Die Idee
        </p>
        <p className="manifesto__text">
          {words.map((w, i) => {
            const start = (i / words.length) * 0.8
            return (
              <span key={i}>
                <Word word={w} progress={scrollYProgress} range={[start, start + 0.14]} />
                {i < words.length - 1 ? ' ' : ''}
              </span>
            )
          })}
        </p>
        <div className="manifesto__progress">
          <motion.span style={{ scaleX: lineScale }} />
        </div>
      </div>
    </section>
  )
}
