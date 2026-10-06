import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'
import { itemById, type Art } from '../data/menu'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useTable } from '../hooks/useTable'
import { formatAmount } from '../lib/format'
import { FoodArt } from './art/FoodArt'
import { Plus } from './ui/Icons'
import { MaskLines } from './ui/Reveal'
import { SpotlightCard } from './ui/SpotlightCard'

const picks: { id: string; art: Art; kicker: string; line: string }[] = [
  { id: 'cag-teller', art: 'cag', kicker: 'Signature', line: 'Unser Herzstück – waagerecht am Spieß gegart.' },
  { id: 'doener-teller', art: 'doner', kicker: 'Drehspieß', line: 'Der Klassiker, frisch vom Spieß geschnitten.' },
  { id: 'koefte-teller', art: 'kofte', kicker: 'Vom Grill', line: 'Saftige Köfte mit Reis oder Pommes, Salat und Brot.' },
  { id: 'pide-kusbasi', art: 'pide', kicker: 'Aus dem Ofen', line: 'Schiffchen aus Teig mit feinem Rindfleisch.' },
  { id: 'mezze-teller', art: 'mezze', kicker: 'Zum Teilen', line: 'Orientalische Antipasti mit frischem Brot.' },
  { id: 'mercimek', art: 'soup', kicker: 'Çorba', line: 'Mit frischem Brot und Zitrone serviert.' },
  { id: 'kuenefe', art: 'kunefe', kicker: 'Tatlı', line: 'Warm, knusprig, unwiderstehlich.' },
  { id: 'baklava', art: 'baklava', kicker: 'Tatlı', line: 'Pistazie oder Walnuss – drei Stück.' },
]

function Card({ pick, index }: { pick: (typeof picks)[number]; index: number }) {
  const item = itemById.get(pick.id)!
  const { add } = useTable()
  const [euros, cents] = formatAmount(item.price).split(',')
  return (
    <SpotlightCard as="article" className="sig-card">
      <div className="sig-card__top">
        <span className="sig-card__index">{String(index + 1).padStart(2, '0')}</span>
        <span className="sig-card__kicker">{pick.kicker}</span>
      </div>
      <div className="sig-card__art">
        <FoodArt kind={pick.art} />
      </div>
      <div className="sig-card__body">
        <h3>{item.name}</h3>
        <p>{pick.line}</p>
        <div className="sig-card__foot">
          <span className="sig-card__price">
            {euros}
            <sup>,{cents} €</sup>
          </span>
          <button className="icon-btn" onClick={() => add(item.id)} aria-label={`${item.name} in den Warenkorb`}>
            <Plus width={18} height={18} />
          </button>
        </div>
      </div>
    </SpotlightCard>
  )
}

/** Gepinnte Sektion: vertikales Scrollen bewegt die Karten horizontal. */
export function Signatures() {
  const wide = useMediaQuery('(min-width: 900px)')
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [distance, setDistance] = useState(0)

  useLayoutEffect(() => {
    if (!wide || !track.current) return
    const measure = () => {
      const el = track.current!
      setDistance(Math.max(0, el.scrollWidth - window.innerWidth))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(track.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [wide])

  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.0005 })
  const x = useTransform(smooth, [0, 1], [0, -distance])
  const bar = useTransform(smooth, [0, 1], [0.05, 1])

  return (
    <section
      className={`signatures ${wide ? 'signatures--pinned' : ''}`}
      id="spezialitaeten"
      ref={section}
      style={wide ? { height: `calc(100vh + ${distance}px)` } : undefined}
    >
      <div className="signatures__sticky">
        <div className="signatures__head container">
          <div>
            <p className="eyebrow">
              <span className="eyebrow__line" /> Spezialitäten
            </p>
            <MaskLines lines={['Gemacht, um', <span className="serif gold-text">geteilt zu werden.</span>]} className="section-title" />
          </div>
          <p className="signatures__intro">
            Eine Auswahl unserer Lieblinge. Tippe auf <span className="kbd">+</span>, um sie in den Warenkorb zu legen – und bestell
            direkt an deinen Tisch.
          </p>
        </div>

        <motion.div className="signatures__track" ref={track} style={wide ? { x } : undefined}>
          {picks.map((pick, i) => (
            <Card key={pick.id} pick={pick} index={i} />
          ))}
          <div className="signatures__end" aria-hidden="true" />
        </motion.div>

        {wide && (
          <div className="signatures__bar container" aria-hidden="true">
            <motion.span style={{ scaleX: bar }} />
          </div>
        )}
      </div>
    </section>
  )
}
