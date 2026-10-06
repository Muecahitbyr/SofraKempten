import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import { useRef, useState } from 'react'
import { itemById } from '../data/menu'
import { useTable } from '../hooks/useTable'
import { formatPrice } from '../lib/format'
import { Plus } from './ui/Icons'
import { ease } from './ui/Reveal'

const steps = [
  {
    title: 'Eine Tradition aus Erzurum.',
    text: 'Cağ Kebab kommt aus dem Osten Anatoliens. „Cağ“ ist dort das Wort für den Spieß – und der dreht sich nicht senkrecht, sondern waagerecht.',
  },
  {
    title: 'Lage für Lage.',
    text: 'Fein marinierte Fleischscheiben werden sorgfältig übereinander auf den Spieß geschichtet. Geduld ist hier die wichtigste Zutat.',
  },
  {
    title: 'Langsam über der Glut.',
    text: 'Der Spieß dreht sich ruhig vor der Hitze. So wird das Fleisch außen kross und bleibt innen wunderbar saftig.',
  },
  {
    title: 'Frisch vom Spieß.',
    text: 'Hauchdünn abgeschnitten und direkt serviert – als Teller mit Reis oder Pommes, Salat, Meze und Brot. Oder ganz klassisch im Brot.',
  },
]

const meatPath = 'M128 104 C108 128 108 196 128 220 L492 194 C506 178 506 146 492 130 Z'

const flames = [
  { x: 170, h: 70, d: 0 },
  { x: 215, h: 105, d: 0.3 },
  { x: 262, h: 86, d: 0.15 },
  { x: 310, h: 120, d: 0.45 },
  { x: 356, h: 92, d: 0.05 },
  { x: 402, h: 112, d: 0.35 },
  { x: 448, h: 78, d: 0.2 },
]

const flamePath = (x: number, h: number) =>
  `M${x} 420 C${x - 26} 400 ${x - 18} ${420 - h * 0.55} ${x - 2} ${420 - h} C${x + 2} ${420 - h * 0.7} ${x + 22} ${420 - h * 0.5} ${x + 20} 404 C${x + 18} 414 ${x + 10} 420 ${x} 420 Z`

const servingMeat = Array.from({ length: 6 }, (_, i) => {
  const x = 236 + i * 40
  const y = 286 - i * 3.2
  return `M${x} ${y - 13} q20 -6 30 2 l0 22 q-12 8 -30 2 z`
}).join(' ')

export function CagStory() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [step, setStep] = useState(0)
  const { add } = useTable()
  const teller = itemById.get('cag-teller')!

  useMotionValueEvent(p, 'change', (v) => setStep(Math.min(3, Math.max(0, Math.floor(v * 4)))))

  const outline = useTransform(p, [0.02, 0.2], [0, 1])
  const fill = useTransform(p, [0.18, 0.34], [0, 1])
  const layers = useTransform(p, [0.24, 0.46], [0, 1])
  const fire = useTransform(p, [0.46, 0.6, 0.78, 0.9], [0, 1, 1, 0.55])
  const fireScale = useTransform(p, [0.46, 0.62], [0.2, 1])
  const crust = useTransform(p, [0.52, 0.76], [0, 0.85])
  const glow = useTransform(p, [0.46, 0.66], [0, 1])
  const wheel = useTransform(p, [0, 1], [0, 900])
  const serveX = useTransform(p, [0.76, 0.9], [160, 0])
  const serve = useTransform(p, [0.76, 0.88], [0, 1])
  const knifeY = useTransform(p, [0.76, 0.82, 0.86, 0.92], [-30, 0, -10, 0])
  const bar = useTransform(p, [0, 1], [0, 1])

  return (
    <section className="cag" id="cag-kebab" ref={ref}>
      <div className="cag__sticky">
        <div className="cag__grid container">
          <div className="cag__copy">
            <p className="eyebrow">
              <span className="eyebrow__line" /> Das Herzstück
            </p>
            <h2 className="cag__heading">
              Cağ Kebab<span className="serif"> – waagerecht gedreht.</span>
            </h2>

            <div className="cag__step-wrap" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  className="cag__step"
                  initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
                  transition={{ duration: 0.55, ease }}
                >
                  <span className="cag__num">0{step + 1}</span>
                  <h3>{steps[step].title}</h3>
                  <p>{steps[step].text}</p>
                  {step === 3 && (
                    <div className="cag__order">
                      <div>
                        <span className="cag__order-name">{teller.name}</span>
                        <span className="cag__order-price">{formatPrice(teller.price)}</span>
                      </div>
                      <button className="btn btn--gold btn--sm" onClick={() => add(teller.id)}>
                        <Plus width={14} height={14} /> In den Warenkorb
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <ol className="cag__dots" aria-hidden="true">
              {steps.map((s, i) => (
                <li key={s.title} className={i === step ? 'is-active' : i < step ? 'is-done' : ''}>
                  <span />
                </li>
              ))}
            </ol>
          </div>

          <div className="cag__visual">
            <svg viewBox="0 0 640 480" className={`cag-svg ${step >= 2 ? 'is-cooking' : ''}`} aria-hidden="true">
              <defs>
                <radialGradient id="cagGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ff8a3d" stopOpacity="0.55" />
                  <stop offset="45%" stopColor="#c4581c" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#000" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="cagMeat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8a4a1c" />
                  <stop offset="35%" stopColor="#c27a3a" />
                  <stop offset="70%" stopColor="#7a3a12" />
                  <stop offset="100%" stopColor="#3d1a06" />
                </linearGradient>
                <linearGradient id="cagCrust" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1c0b02" stopOpacity="0" />
                  <stop offset="60%" stopColor="#2a1004" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#120600" stopOpacity="0.95" />
                </linearGradient>
                <linearGradient id="cagFlame" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#b8310c" />
                  <stop offset="45%" stopColor="#f07a22" />
                  <stop offset="85%" stopColor="#ffd27a" />
                  <stop offset="100%" stopColor="#fff2c9" />
                </linearGradient>
                <clipPath id="cagClip">
                  <path d={meatPath} />
                </clipPath>
              </defs>

              <motion.ellipse cx="320" cy="330" rx="320" ry="220" fill="url(#cagGlow)" style={{ opacity: glow }} />

              {/* Gestell */}
              <g className="cag-svg__stand">
                <path d="M78 150 L78 440 M562 150 L562 440 M64 138 L78 160 L92 138 M548 138 L562 160 L576 138" />
                <path d="M40 440 L600 440" />
              </g>

              {/* Feuer */}
              <motion.g style={{ opacity: fire, scaleY: fireScale, transformOrigin: '320px 430px' }}>
                {flames.map((f, i) => (
                  <path
                    key={i}
                    d={flamePath(f.x, f.h)}
                    fill="url(#cagFlame)"
                    className="cag-svg__flame"
                    style={{ animationDelay: `${f.d}s`, animationDuration: `${0.9 + (i % 3) * 0.25}s` }}
                  />
                ))}
                {flames.map((f, i) => (
                  <circle key={`s${i}`} cx={f.x + 6} cy={380} r={1.6 + (i % 2)} className="cag-svg__spark" style={{ animationDelay: `${f.d * 3}s` }} />
                ))}
                <path d="M150 428 L300 418 M200 432 L360 424 M330 426 L490 430" className="cag-svg__logs" />
              </motion.g>

              {/* Spieß */}
              <path d="M30 162 L610 162" className="cag-svg__rod" />

              {/* Fleisch */}
              <motion.path d={meatPath} fill="url(#cagMeat)" style={{ opacity: fill }} />
              <g clipPath="url(#cagClip)">
                <motion.g style={{ opacity: fill }} className="cag-svg__texture">
                  {Array.from({ length: 24 }, (_, i) => (
                    <path key={i} d={`M100 ${60 + i * 14} q100 6 200 0 t200 0 t200 0`} />
                  ))}
                </motion.g>
                {Array.from({ length: 26 }, (_, i) => {
                  const x = 134 + i * 14
                  const t = (x - 128) / (492 - 128)
                  const top = 104 + t * 26 - 6
                  const bottom = 220 - t * 26 + 6
                  return (
                    <motion.path
                      key={i}
                      d={`M${x} ${top} Q${x + 5} ${(top + bottom) / 2} ${x} ${bottom}`}
                      className="cag-svg__layer"
                      style={{ pathLength: layers }}
                    />
                  )
                })}
                <motion.path d={meatPath} fill="url(#cagCrust)" style={{ opacity: crust }} />
              </g>
              <motion.path d={meatPath} className="cag-svg__outline" style={{ pathLength: outline }} />

              {/* Kurbelrad */}
              <motion.g style={{ rotate: wheel, transformOrigin: '30px 162px' }} className="cag-svg__wheel">
                <circle cx="30" cy="162" r="18" />
                <path d="M30 144 L30 180 M12 162 L48 162 M17 149 L43 175 M43 149 L17 175" />
              </motion.g>

              {/* Messer & Servier-Spieß */}
              <motion.g style={{ opacity: serve, y: knifeY }} className="cag-svg__knife">
                <path d="M516 70 L524 150 L512 152 Z" />
                <path d="M520 40 L518 70" />
              </motion.g>
              <motion.g style={{ opacity: serve, x: serveX }} className="cag-svg__serving">
                <path d="M200 296 L500 274" className="cag-svg__rod" />
                <path d={servingMeat} fill="url(#cagMeat)" />
                <circle cx="196" cy="296" r="5" />
              </motion.g>
            </svg>
          </div>
        </div>
        <div className="cag__bar container" aria-hidden="true">
          <motion.span style={{ scaleX: bar }} />
        </div>
      </div>
    </section>
  )
}
