import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { allergens, menu, type AllergenCode, type MenuCategory, type MenuItem } from '../data/menu'
import { useTable } from '../hooks/useTable'
import { formatPrice } from '../lib/format'
import { scrollToTarget } from '../lib/smoothScroll'
import { FoodArt } from './art/FoodArt'
import { ArrowRight, Bell, Close, Filter, Plus, Search } from './ui/Icons'
import { MaskLines, Reveal, ease } from './ui/Reveal'

const codes = Object.keys(allergens) as AllergenCode[]

/** Suche tolerant gegenüber türkischen Sonderzeichen: "corba" findet "Çorbası". */
const normalize = (s: string) =>
  s
    .toLocaleLowerCase('de-DE')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

const TOOLBAR_OFFSET = -132

function ItemRow({ item }: { item: MenuItem }) {
  const { countFor, add, removeOne } = useTable()
  const qty = countFor(item.id)
  return (
    <motion.li
      layout="position"
      className={`menu-item ${qty ? 'is-picked' : ''}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease }}
    >
      <div className="menu-item__main">
        <div className="menu-item__line">
          <h4>
            {item.name}
            {item.signature && <span className="menu-item__star" title="Empfehlung des Hauses">✦</span>}
          </h4>
          <span className="menu-item__leader" aria-hidden="true" />
          <span className="menu-item__price">{formatPrice(item.price)}</span>
        </div>
        {item.description && <p className="menu-item__desc">{item.description}</p>}
        {item.choice && !item.description && <p className="menu-item__desc">{item.choice.values.join(' · ')}</p>}
        {item.allergens.length > 0 && (
          <ul className="menu-item__allergens" aria-label="Allergene">
            {item.allergens.map((a) => (
              <li key={a} title={allergens[a]} data-tip={allergens[a]}>
                {a}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="menu-item__actions">
        <AnimatePresence initial={false}>
          {qty > 0 && (
            <motion.div
              className="qty"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease }}
            >
              <button onClick={() => removeOne(item.id)} aria-label={`${item.name} entfernen`}>
                –
              </button>
              <motion.span key={qty} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                {qty}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileTap={{ scale: 0.85 }}
          className="add-btn"
          onClick={() => add(item.id)}
          aria-label={`${item.name} in den Warenkorb`}
        >
          <Plus width={16} height={16} />
        </motion.button>
      </div>
    </motion.li>
  )
}

function CategoryBlock({ cat, items }: { cat: MenuCategory; items: MenuItem[] }) {
  return (
    <motion.section
      layout="position"
      className="menu-cat"
      id={`cat-${cat.id}`}
      data-cat={cat.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <header className="menu-cat__head">
        <div className="menu-cat__art">
          <FoodArt kind={cat.art} strokeWidth={2} />
        </div>
        <div>
          {cat.turkish && <span className="menu-cat__tr">{cat.turkish}</span>}
          <h3>{cat.title}</h3>
          {cat.note && <p className="menu-cat__note">{cat.note}</p>}
        </div>
      </header>
      <ul className="menu-cat__items">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </AnimatePresence>
      </ul>
    </motion.section>
  )
}

/** Einstieg für Gäste im Restaurant: Tisch wählen, Service rufen, Rechnung */
function ServiceHint() {
  const { table, setServiceOpen } = useTable()
  return (
    <button className="service-hint" onClick={() => setServiceOpen(true)}>
      <span className="service-hint__icon">
        <Bell width={16} height={16} />
      </span>
      <span>
        <strong>{table ? `Du sitzt an Tisch ${table}` : 'Schon bei uns im Restaurant?'}</strong>
        <small>Mitarbeiter rufen oder Rechnung anfordern</small>
      </span>
      <ArrowRight width={16} height={16} />
    </button>
  )
}

export function MenuSection() {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [excluded, setExcluded] = useState<Set<AllergenCode>>(new Set())
  const [filterOpen, setFilterOpen] = useState(false)
  const [active, setActive] = useState(menu[0].id)
  const chipsRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const q = normalize(deferredQuery.trim())
    return menu
      .map((cat) => ({
        cat,
        items: cat.items.filter((item) => {
          if (item.allergens.some((a) => excluded.has(a))) return false
          if (!q) return true
          const hay = normalize([item.name, item.description, item.choice?.values.join(' '), cat.title, cat.turkish].join(' '))
          return q.split(/\s+/).every((part) => hay.includes(part))
        }),
      }))
      .filter((c) => c.items.length > 0)
  }, [deferredQuery, excluded])

  const shown = filtered.reduce((n, c) => n + c.items.length, 0)
  const total = menu.reduce((n, c) => n + c.items.length, 0)

  // Scroll-Spy: markiert die Kategorie, die gerade im Blick ist
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.menu-cat')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.getAttribute('data-cat') ?? '')
      },
      { rootMargin: '-35% 0px -60% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [filtered])

  // Aktiven Chip in der horizontal scrollbaren Leiste sichtbar halten
  useEffect(() => {
    const chip = chipsRef.current?.querySelector<HTMLElement>(`[data-chip="${active}"]`)
    const bar = chipsRef.current
    if (!chip || !bar) return
    bar.scrollTo({ left: chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2, behavior: 'smooth' })
  }, [active])

  const toggle = (code: AllergenCode) =>
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })

  const jump = (id: string) => {
    setActive(id)
    scrollToTarget(`#cat-${id}`, TOOLBAR_OFFSET)
  }

  return (
    <section className="menu-section" id="speisekarte">
      <div className="container">
        <div className="menu-section__head">
          <div>
            <p className="eyebrow eyebrow--dark">
              <span className="eyebrow__line" /> Speisekarte
            </p>
            <MaskLines lines={['Unsere Karte.', <span className="serif menu-section__accent">Frisch. Ehrlich. Lecker.</span>]} className="section-title" />
          </div>
          <Reveal className="menu-section__intro">
            <ServiceHint />
            <p>
              Von Cağ Kebab bis Künefe – alle Gerichte und Preise auf einen Blick. Leg mit <span className="kbd kbd--dark">+</span> in den
              Warenkorb, wähle deine Tischnummer und wir bringen es dir direkt an den Tisch.
            </p>
          </Reveal>
        </div>
      </div>

      <div className="menu-toolbar">
        <div className="container menu-toolbar__inner">
          <LayoutGroup id="chips">
            <div className="chips" ref={chipsRef} role="tablist" aria-label="Kategorien">
              {filtered.map(({ cat }) => (
                <button
                  key={cat.id}
                  data-chip={cat.id}
                  role="tab"
                  aria-selected={active === cat.id}
                  className={`chip ${active === cat.id ? 'is-active' : ''}`}
                  onClick={() => jump(cat.id)}
                >
                  {active === cat.id && <motion.span layoutId="chip-pill" className="chip__pill" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                  <span className="chip__label">{cat.title}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>

          <div className="menu-tools">
            <label className="search">
              <Search width={16} height={16} />
              <input
                type="search"
                placeholder="Suchen …"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Speisekarte durchsuchen"
              />
              {query && (
                <button onClick={() => setQuery('')} aria-label="Suche leeren">
                  <Close width={14} height={14} />
                </button>
              )}
            </label>
            <button
              className={`filter-btn ${excluded.size ? 'is-active' : ''}`}
              onClick={() => setFilterOpen((o) => !o)}
              aria-expanded={filterOpen}
            >
              <Filter width={16} height={16} />
              <span>Allergene</span>
              {excluded.size > 0 && <span className="filter-btn__count">{excluded.size}</span>}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {filterOpen && (
            <motion.div
              className="allergen-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease }}
            >
              <div className="container allergen-panel__inner">
                <p>Gerichte mit diesen Allergenen ausblenden:</p>
                <div className="allergen-panel__grid">
                  {codes.map((code) => (
                    <button key={code} className={`allergen-toggle ${excluded.has(code) ? 'is-on' : ''}`} onClick={() => toggle(code)} aria-pressed={excluded.has(code)}>
                      <b>{code}</b>
                      {allergens[code]}
                    </button>
                  ))}
                </div>
                {excluded.size > 0 && (
                  <button className="link-btn" onClick={() => setExcluded(new Set())}>
                    Filter zurücksetzen
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="container">
        <AnimatePresence>
          {(deferredQuery || excluded.size > 0) && (
            <motion.p className="menu-result" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {shown} von {total} Einträgen
            </motion.p>
          )}
        </AnimatePresence>

        <div className="menu-cats">
          <AnimatePresence mode="popLayout">
            {filtered.map(({ cat, items }) => (
              <CategoryBlock key={cat.id} cat={cat} items={items} />
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <motion.div className="menu-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="serif">Hier ist leider nichts dabei.</p>
              <button
                className="btn btn--dark btn--sm"
                onClick={() => {
                  setQuery('')
                  setExcluded(new Set())
                }}
              >
                Alles anzeigen
              </button>
            </motion.div>
          )}
        </div>

        <aside className="legend">
          <h4>Allergenkennzeichnung</h4>
          <p>
            {codes.map((c, i) => (
              <span key={c}>
                <b>{c}</b> {allergens[c]}
                {i < codes.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </p>
          <p className="legend__note">Alle Preise in Euro inkl. MwSt. Bei Fragen zu Allergenen und Zusatzstoffen sprecht uns gerne an.</p>
        </aside>
      </div>
    </section>
  )
}
