import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { site } from '../data/site'
import { useOpenStatus } from '../hooks/useOpenStatus'
import { weekOrder } from '../lib/hours'
import { ArrowUpRight, Pin } from './ui/Icons'
import { Magnetic } from './ui/Magnetic'
import { MaskLines, Reveal, ease } from './ui/Reveal'

/**
 * Karte erst nach Klick laden (Zwei-Klick-Lösung) –
 * so werden ohne Einwilligung keine Daten an Google übertragen.
 */
function MapCard() {
  const [consent, setConsent] = useState(false)

  return (
    <div className="map-card">
      <AnimatePresence mode="wait">
        {consent ? (
          <motion.iframe
            key="map"
            title="Sofra auf Google Maps"
            src={site.maps.embed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />
        ) : (
          <motion.div key="placeholder" className="map-card__placeholder" exit={{ opacity: 0 }}>
            <svg viewBox="0 0 600 420" className="map-card__art" aria-hidden="true">
              {Array.from({ length: 9 }, (_, i) => (
                <path key={`h${i}`} d={`M-20 ${30 + i * 48} C150 ${20 + i * 50} 400 ${50 + i * 44} 620 ${30 + i * 47}`} />
              ))}
              {Array.from({ length: 11 }, (_, i) => (
                <path key={`v${i}`} d={`M${20 + i * 58} -20 C${40 + i * 55} 140 ${i * 60} 300 ${30 + i * 56} 440`} />
              ))}
              <path d="M-20 260 C140 220 300 250 620 170" className="map-card__river" />
              <path d="M-20 190 L620 214" className="map-card__road" />
              <path d="M300 -20 L290 440" className="map-card__road" />
            </svg>
            <div className="map-card__pin">
              <span className="pin pin--lg">
                <i />
              </span>
              <span className="map-card__label">Sofra</span>
            </div>
            <div className="map-card__consent">
              <button className="btn btn--gold btn--sm" onClick={() => setConsent(true)}>
                Karte laden
              </button>
              <p>Beim Laden werden Daten an Google übertragen.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Visit() {
  const status = useOpenStatus()

  return (
    <section className="visit" id="besuch">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">
            <span className="eyebrow__line" /> Besuch
          </p>
          <MaskLines lines={['Komm vorbei.', <span className="serif gold-text">Wir decken den Tisch.</span>]} className="section-title" />
        </div>

        <div className="visit__grid">
          <Reveal className="visit__info">
            <div className="visit__block">
              <span className="visit__label">
                <Pin width={16} height={16} /> Adresse
              </span>
              <p className="visit__address">
                {site.address.street}
                <br />
                {site.address.zip} {site.address.city}
              </p>
              <p className="muted">Zentral in der Kemptener Innenstadt.</p>
              <div className="visit__buttons">
                <Magnetic>
                  <a className="btn btn--gold btn--sm" href={site.maps.apple} target="_blank" rel="noreferrer">
                    Apple Karten <ArrowUpRight width={14} height={14} />
                  </a>
                </Magnetic>
                <Magnetic>
                  <a className="btn btn--ghost btn--sm" href={site.maps.google} target="_blank" rel="noreferrer">
                    Google Maps <ArrowUpRight width={14} height={14} />
                  </a>
                </Magnetic>
              </div>
            </div>

            <div className="visit__block">
              <span className="visit__label">
                <span className={`dot ${status.isOpen ? 'is-open' : ''}`} /> {status.headline} · {status.detail}
              </span>
              <ul className="hours">
                {weekOrder.map(({ day, name, hours }, i) => (
                  <motion.li
                    key={day}
                    className={`${day === status.today ? 'is-today' : ''} ${hours ? '' : 'is-closed'}`}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease, delay: i * 0.05 }}
                  >
                    <span>
                      {name}
                      {day === status.today && <em>Heute</em>}
                    </span>
                    <span>{hours ? `${hours.open} – ${hours.close} Uhr` : 'Ruhetag'}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal className="visit__map" delay={0.1}>
            <MapCard />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
