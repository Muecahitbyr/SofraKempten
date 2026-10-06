import { animate, motion, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { itemById, itemCount } from '../data/menu'
import { openingHours, site } from '../data/site'
import { useOpenStatus } from '../hooks/useOpenStatus'
import { useTable } from '../hooks/useTable'
import { formatAmount, formatPrice } from '../lib/format'
import { FoodArt } from './art/FoodArt'
import { ArrowUpRight, Plus } from './ui/Icons'
import { MaskLines, Reveal } from './ui/Reveal'
import { SpotlightCard } from './ui/SpotlightCard'

function CountUp({ to, duration = 1.8 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px' })
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setValue(Math.round(v)) })
    return () => controls.stop()
  }, [inView, to, duration])
  return <span ref={ref}>{value}</span>
}

/** 24-Stunden-Ziffernblatt: goldener Bogen = Öffnungszeit, Zeiger = aktuelle Uhrzeit in Kempten */
function HoursDial() {
  const status = useOpenStatus()
  const hours = openingHours[status.today] ?? openingHours[2]!
  const toAngle = (min: number) => (min / 1440) * 360 - 90
  const [oh, om] = hours.open.split(':').map(Number)
  const [ch, cm] = hours.close.split(':').map(Number)
  const a0 = toAngle(oh * 60 + om)
  const a1 = toAngle(ch * 60 + cm)
  const r = 64
  const pt = (a: number, rr = r) => [80 + rr * Math.cos((a * Math.PI) / 180), 80 + rr * Math.sin((a * Math.PI) / 180)]
  const [x0, y0] = pt(a0)
  const [x1, y1] = pt(a1)
  const large = a1 - a0 > 180 ? 1 : 0
  const hand = toAngle(status.minutes)
  const [hx, hy] = pt(hand, 52)
  const closedToday = !openingHours[status.today]

  return (
    <svg viewBox="0 0 160 160" className="dial" aria-hidden="true">
      <circle cx="80" cy="80" r={r} className="dial__track" />
      {Array.from({ length: 24 }, (_, i) => {
        const [ax, ay] = pt(toAngle(i * 60), 74)
        const [bx, by] = pt(toAngle(i * 60), i % 6 === 0 ? 68 : 71)
        return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} className="dial__tick" />
      })}
      <motion.path
        d={`M${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1}`}
        className={`dial__arc ${closedToday ? 'is-muted' : ''}`}
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <line x1="80" y1="80" x2={hx} y2={hy} className="dial__hand" />
      <circle cx="80" cy="80" r="3.5" className="dial__pivot" />
      <text x="80" y="22" className="dial__label">0</text>
      <text x="142" y="83" className="dial__label">6</text>
      <text x="80" y="146" className="dial__label">12</text>
      <text x="18" y="83" className="dial__label">18</text>
    </svg>
  )
}

export function Bento() {
  const status = useOpenStatus()
  const { add } = useTable()
  const menuDeal = itemById.get('doener-menue')!
  const soup = itemById.get('mercimek')!
  const [euros, cents] = formatAmount(menuDeal.price).split(',')

  return (
    <section className="bento-section">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">
            <span className="eyebrow__line" /> Auf einen Blick
          </p>
          <MaskLines lines={['Alles, was du', <span className="serif gold-text">wissen musst.</span>]} className="section-title" />
        </div>

        <div className="bento">
          <Reveal className="bento__cell bento__cell--deal">
            <SpotlightCard className="bento-card bento-card--deal" tilt={3}>
              <div className="bento-card__art bento-card__art--deal">
                <FoodArt kind="doner" />
              </div>
              <div className="bento-card__content">
                <span className="tag">Menü-Angebot</span>
                <h3>Döner Menü</h3>
                <p className="muted">{menuDeal.description}</p>
                <div className="deal__price">
                  <span className="deal__euros gold-text">{euros}</span>
                  <span className="deal__cents">,{cents} €</span>
                </div>
                <button className="btn btn--gold btn--sm" onClick={() => add(menuDeal.id)}>
                  <Plus width={14} height={14} /> In den Warenkorb
                </button>
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal className="bento__cell bento__cell--hours" delay={0.08}>
            <SpotlightCard className="bento-card bento-card--hours" tilt={4}>
              <div className="bento-card__row">
                <div>
                  <span className={`status-pill status-pill--lg ${status.isOpen ? 'is-open' : ''}`}>
                    <i aria-hidden="true" />
                    {status.headline}
                  </span>
                  <p className="bento-card__big">{status.detail}</p>
                  <p className="muted">
                    {site.hoursSummary}
                    <br />
                    {site.closedDay}
                  </p>
                </div>
                <HoursDial />
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal className="bento__cell bento__cell--count" delay={0.12}>
            <SpotlightCard className="bento-card bento-card--count" tilt={4}>
              <span className="count gold-text">
                <CountUp to={itemCount} />
              </span>
              <p>
                Gerichte & Getränke
                <br />
                <span className="muted">auf unserer Karte</span>
              </p>
            </SpotlightCard>
          </Reveal>

          <Reveal className="bento__cell bento__cell--welcome" delay={0.16}>
            <SpotlightCard className="bento-card bento-card--welcome" tilt={4}>
              <span className="tag">Neueröffnung</span>
              <p className="welcome serif">
                Hoş geldiniz<span className="gold-text">.</span>
              </p>
              <p className="muted">Herzlich willkommen – wir freuen uns auf euren Besuch.</p>
            </SpotlightCard>
          </Reveal>

          <Reveal className="bento__cell bento__cell--soup" delay={0.2}>
            <SpotlightCard className="bento-card bento-card--soup" tilt={4}>
              <div className="bento-card__art bento-card__art--soup">
                <FoodArt kind="soup" />
              </div>
              <div>
                <span className="tag">Çorbalar</span>
                <h3>Suppe wie zu Hause.</h3>
                <p className="muted">Traditionell mit frischem Brot und Zitrone – ab {formatPrice(soup.price)}.</p>
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal className="bento__cell bento__cell--location" delay={0.24}>
            <SpotlightCard className="bento-card bento-card--location" tilt={4}>
              <svg className="mini-map" viewBox="0 0 300 200" aria-hidden="true">
                <path d="M-10 60 C60 70 120 40 310 70" />
                <path d="M-10 150 C80 130 160 160 310 120" />
                <path d="M90 -10 C100 60 80 140 110 210" />
                <path d="M210 -10 C190 80 220 140 200 210" />
                <path d="M-10 100 L310 96" className="mini-map__main" />
                <path d="M150 -10 L156 210" className="mini-map__main" />
              </svg>
              <span className="pin" aria-hidden="true">
                <i />
              </span>
              <div className="bento-card__content bento-card__content--bottom">
                <span className="tag">Mitten in Kempten</span>
                <h3>{site.address.street}</h3>
                <a className="link-arrow" href={site.maps.apple} target="_blank" rel="noreferrer">
                  In Karten öffnen <ArrowUpRight width={14} height={14} />
                </a>
              </div>
            </SpotlightCard>
          </Reveal>

        </div>
      </div>
    </section>
  )
}
