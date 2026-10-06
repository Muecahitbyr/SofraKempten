import { motion, useScroll, useTransform } from 'motion/react'
import { useRef, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { site } from '../data/site'
import { useSectionNav } from '../hooks/useSectionNav'
import { EmberCanvas } from './EmberCanvas'
import { Instagram, TikTok } from './ui/Icons'
import { navLinks } from './Nav'

export function Footer() {
  const ref = useRef<HTMLElement>(null)
  const go = useSectionNav()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const y = useTransform(scrollYProgress, [0, 1], ['30%', '0%'])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [0, 1])
  const spacing = useTransform(scrollYProgress, [0, 1], ['0.2em', '-0.02em'])
  const socials = [
    { url: site.socials.instagram, label: 'Instagram', Icon: Instagram },
    { url: site.socials.tiktok, label: 'TikTok', Icon: TikTok },
  ].filter((s) => s.url)

  const handle = (href: string) => (e: MouseEvent) => {
    e.preventDefault()
    go(href)
  }

  return (
    <footer className="footer" ref={ref}>
      <EmberCanvas className="footer__embers" density={0.5} intensity={0.7} />
      <div className="container footer__inner">
        <motion.p className="footer__claim serif" style={{ y, opacity, letterSpacing: spacing }}>
          Good Food <span className="gold-text">–</span> <em className="gold-text">Good People.</em>
        </motion.p>

        <div className="footer__grid">
          <div className="footer__brand">
            <img src="/logo.jpg" alt="Sofra Logo" width={72} height={72} />
            <p>
              <strong>Sofra</strong>
              <br />
              {site.title}
            </p>
          </div>

          <div>
            <h4>Adresse</h4>
            <p>
              {site.address.street}
              <br />
              {site.address.zip} {site.address.city}
            </p>
          </div>

          <div>
            <h4>Öffnungszeiten</h4>
            <p>
              Dienstag – Sonntag
              <br />
              11:00 – 20:00 Uhr
              <br />
              <span className="muted">{site.closedDay}</span>
            </p>
          </div>

          <div>
            <h4>Entdecken</h4>
            <ul>
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a href={'/' + l.href} onClick={handle(l.href)}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} Sofra Kempten</span>
          <div className="footer__links">
            {socials.map(({ url, label, Icon }) => (
              <a key={label} href={url} target="_blank" rel="noreferrer" aria-label={label}>
                <Icon width={18} height={18} />
              </a>
            ))}
            <Link to="/impressum">Impressum</Link>
            <Link to="/datenschutz">Datenschutz</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
