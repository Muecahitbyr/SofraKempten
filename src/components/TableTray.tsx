import { AnimatePresence, motion, useAnimationControls, useDragControls } from 'motion/react'
import { useEffect, useState } from 'react'
import { itemById } from '../data/menu'
import { MAX_LINE_NOTE } from '../data/order'
import { finalStatuses, statusLabel, type Order } from '../data/order'
import { site } from '../data/site'
import { useOpenStatus } from '../hooks/useOpenStatus'
import { useTable, type CartLine } from '../hooks/useTable'
import { placeOrder } from '../lib/api'
import { formatPrice } from '../lib/format'
import { lockScroll, scrollToTarget } from '../lib/smoothScroll'
import { ArrowRight, Bell, Close, Minus, Pencil, Plus, Receipt, Table } from './ui/Icons'
import { ease } from './ui/Reveal'

type Step = 'cart' | 'table' | 'done'

const progressSteps = ['neu', 'zubereitung', 'serviert'] as const

/** Notiz zu einer Warenkorb-Position: Schnellauswahl + freies Feld */
function LineNote({ line }: { line: CartLine }) {
  const { setLineNote } = useTable()
  const [open, setOpen] = useState(!!line.note)
  const wishes = itemById.get(line.id)?.category.wishes ?? []
  const tokens = (line.note ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  const toggle = (wish: string) => {
    const has = tokens.some((t) => t.toLowerCase() === wish.toLowerCase())
    const next = has ? tokens.filter((t) => t.toLowerCase() !== wish.toLowerCase()) : [...tokens, wish]
    setLineNote(line.key, next.join(', '))
  }

  if (!open) {
    return (
      <button className="line-note__add" onClick={() => setOpen(true)}>
        <Pencil width={13} height={13} /> Wunsch hinzufügen
      </button>
    )
  }

  return (
    <motion.div className="line-note" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3, ease }}>
      {wishes.length > 0 && (
        <div className="line-note__chips">
          {wishes.map((w) => {
            const active = tokens.some((t) => t.toLowerCase() === w.toLowerCase())
            return (
              <button key={w} className={`wish ${active ? 'is-active' : ''}`} onClick={() => toggle(w)} aria-pressed={active}>
                {w}
              </button>
            )
          })}
        </div>
      )}
      <input
        className="line-note__input"
        value={line.note ?? ''}
        maxLength={MAX_LINE_NOTE}
        placeholder={line.qty > 1 ? `Wunsch für alle ${line.qty} Stück …` : 'Eigener Wunsch, z. B. extra Soße …'}
        onChange={(e) => setLineNote(line.key, e.target.value)}
        aria-label="Wunsch zu diesem Gericht"
      />
    </motion.div>
  )
}

/** Live-Status einer abgeschickten Bestellung */
function OrderStatus({ order }: { order: Order }) {
  const cancelled = order.status === 'storniert'
  const reached = progressSteps.indexOf(order.status as (typeof progressSteps)[number])
  return (
    <div className="order-done">
      <motion.div
        className={`order-done__badge ${cancelled ? 'is-cancelled' : ''}`}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      >
        <svg viewBox="0 0 52 52" aria-hidden="true">
          <motion.path
            d={cancelled ? 'M17 17 L35 35 M35 17 L17 35' : 'M15 27 L23 35 L38 18'}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease, delay: 0.2 }}
          />
        </svg>
      </motion.div>
      <p className="order-done__eyebrow">Bestellung #{order.number}</p>
      <h4 className="order-done__title">
        {cancelled ? 'Bestellung storniert' : order.status === 'serviert' ? 'Guten Appetit!' : `Kommt an Tisch ${order.table}.`}
      </h4>
      <p className="muted order-done__text">
        {cancelled
          ? 'Bitte sprich uns bei Fragen direkt an.'
          : order.status === 'serviert'
            ? 'Afiyet olsun – lass es dir schmecken.'
            : 'Deine Bestellung ist bei uns angekommen. Bezahlt wird wie gewohnt vor Ort.'}
      </p>

      {!cancelled && (
        <ol className="order-progress">
          {progressSteps.map((s, i) => (
            <li key={s} className={i < reached ? 'is-done' : i === reached ? 'is-active' : ''}>
              <span className="order-progress__dot" />
              <span>{statusLabel[s]}</span>
            </li>
          ))}
        </ol>
      )}

      <ul className="order-done__lines">
        {order.lines.map((l) => (
          <li key={`${l.id}|${l.choice ?? ''}`}>
            <span>
              {l.qty}× {l.name}
              {l.choice && <small> · {l.choice}</small>}
              {l.note && <small className="order-done__note">„{l.note}“</small>}
            </span>
            <span>{formatPrice(l.price * l.qty)}</span>
          </li>
        ))}
        <li className="order-done__sum">
          <span>Tisch {order.table}</span>
          <span>{formatPrice(order.total)}</span>
        </li>
      </ul>
    </div>
  )
}

/** Schwebende Leiste + Sheet: Warenkorb → Tisch wählen → Bestätigung */
export function TableTray() {
  const { lines, count, total, pulse, increment, decrement, clear, table, setTable, activeOrder, setActiveOrder, serviceOpen, setServiceOpen, calls } =
    useTable()
  const status = useOpenStatus()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('cart')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const controls = useAnimationControls()
  const drag = useDragControls()

  // In der Entwicklung darf rund um die Uhr getestet werden
  const canOrder = status.isOpen || import.meta.env.DEV
  const orderRunning = !!activeOrder && !finalStatuses.includes(activeOrder.status)

  useEffect(() => {
    if (pulse > 0) controls.start({ scale: [1, 1.08, 1], transition: { duration: 0.45, ease } })
  }, [pulse, controls])

  useEffect(() => {
    if (open && step !== 'done' && count === 0) setOpen(false)
  }, [count, open, step])

  useEffect(() => {
    lockScroll('sheet', open)
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const openCart = () => {
    setStep('cart')
    setError('')
    setOpen(true)
  }

  const openOrder = () => {
    setStep('done')
    setOpen(true)
  }

  const submit = async () => {
    if (!table) {
      setError('Bitte wähle deine Tischnummer.')
      return
    }
    setSending(true)
    setError('')
    try {
      const order = await placeOrder({
        table,
        note,
        items: lines.map((l) => ({ id: l.id, choice: l.choice, note: l.note, qty: l.qty })),
      })
      setActiveOrder(order)
      setStep('done')
      clear()
      setNote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bestellung fehlgeschlagen.')
    } finally {
      setSending(false)
    }
  }

  const dismissOrder = () => {
    if (activeOrder && finalStatuses.includes(activeOrder.status)) setActiveOrder(null)
    setOpen(false)
  }

  const title = step === 'cart' ? 'Dein Tisch' : step === 'table' ? 'Wo sitzt du?' : 'Bestellt!'
  const openCalls = calls.filter((c) => c.status === 'offen').length

  const openService = () => {
    setOpen(false)
    setServiceOpen(true)
  }

  return (
    <>
      <AnimatePresence>
        {!open && !serviceOpen && (count > 0 || activeOrder || table) && (
          <motion.div
            className="tray-pill-wrap"
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ duration: 0.6, ease }}
          >
            {count > 0 ? (
              <motion.button className="tray-pill" animate={controls} onClick={openCart}>
                <span className="tray-pill__icon">
                  <Table width={18} height={18} />
                </span>
                <span className="tray-pill__label">
                  {table ? `Tisch ${table}` : 'Dein Tisch'}
                  <small>{count} Artikel · zur Bestellung</small>
                </span>
                <span className="tray-pill__total">{formatPrice(total)}</span>
              </motion.button>
            ) : (
              activeOrder && (
                <button className="tray-pill tray-pill--status" onClick={openOrder}>
                  <span className="tray-pill__icon tray-pill__icon--status">
                    <span className={`dot ${orderRunning ? 'is-open' : ''}`} />
                  </span>
                  <span className="tray-pill__label">
                    Bestellung #{activeOrder.number} · Tisch {activeOrder.table}
                    <small>{statusLabel[activeOrder.status]}</small>
                  </span>
                </button>
              )
            )}
            {table && (
              <motion.div className="service-fab-wrap" layout>
                <button
                  className={`service-fab ${count > 0 || activeOrder ? '' : 'service-fab--wide'}`}
                  onClick={() => setServiceOpen(true)}
                  aria-label={`Service für Tisch ${table}`}
                >
                  <Bell width={19} height={19} />
                  {!(count > 0 || activeOrder) && <span>Service · Tisch {table}</span>}
                  {openCalls > 0 && <i className="service-fab__badge">{openCalls}</i>}
                </button>
                {!(count > 0 || activeOrder) && (
                  <button className="service-fab__close" onClick={() => setTable(null)} aria-label={`Tisch ${table} abmelden`} title="Tisch abmelden">
                    <Close width={12} height={12} />
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              className="sheet"
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              drag="y"
              dragListener={false}
              dragControls={drag}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 600) setOpen(false)
              }}
            >
              <div className="sheet__grabber" onPointerDown={(e) => drag.start(e)} />
              <header className="sheet__head" onPointerDown={(e) => drag.start(e)}>
                <div>
                  {step !== 'done' && (
                    <ol className="sheet__steps" aria-label="Schritte">
                      <li className={step === 'cart' ? 'is-active' : 'is-done'}>1 · Warenkorb</li>
                      <li className={step === 'table' ? 'is-active' : ''}>2 · Tisch & Bestellen</li>
                    </ol>
                  )}
                  <h3>{title}</h3>
                </div>
                <button className="icon-btn icon-btn--ghost" onClick={() => setOpen(false)} aria-label="Schließen">
                  <Close width={18} height={18} />
                </button>
              </header>

              <div className="sheet__body" data-lenis-prevent>
                <AnimatePresence mode="wait" initial={false}>
                  {step === 'cart' && (
                    <motion.div key="cart" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35, ease }}>
                      {orderRunning && activeOrder && (
                        <button className="sheet__running" onClick={() => setStep('done')}>
                          <span className="dot is-open" /> Bestellung #{activeOrder.number} läuft · {statusLabel[activeOrder.status]}
                        </button>
                      )}
                      <ul className="sheet__list">
                        <AnimatePresence initial={false}>
                          {lines.map((line) => {
                            const item = itemById.get(line.id)
                            if (!item) return null
                            return (
                              <motion.li
                                key={line.key}
                                layout
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.35, ease }}
                              >
                                <div className="sheet__item">
                                  <div>
                                    <span className="sheet__cat">{item.category.title}</span>
                                    <span className="sheet__name">{item.name}</span>
                                    {line.choice && (
                                      <span className="sheet__choice">
                                        {item.choice?.label}: {line.choice}
                                      </span>
                                    )}
                                  </div>
                                  <div className="stepper">
                                    <button onClick={() => decrement(line.key)} aria-label="Weniger">
                                      <Minus width={14} height={14} />
                                    </button>
                                    <span>{line.qty}</span>
                                    <button onClick={() => increment(line.key)} aria-label="Mehr">
                                      <Plus width={14} height={14} />
                                    </button>
                                  </div>
                                  <span className="sheet__price">{formatPrice(item.price * line.qty)}</span>
                                </div>
                                <LineNote line={line} />
                              </motion.li>
                            )
                          })}
                        </AnimatePresence>
                      </ul>
                    </motion.div>
                  )}

                  {step === 'table' && (
                    <motion.div key="table" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.35, ease }}>
                      <p className="sheet__lead">Die Nummer steht auf deinem Tisch.</p>
                      <div className="tables" role="radiogroup" aria-label="Tischnummer">
                        {Array.from({ length: site.tables }, (_, i) => i + 1).map((n) => (
                          <motion.button
                            key={n}
                            role="radio"
                            aria-checked={table === n}
                            className={`tables__btn ${table === n ? 'is-active' : ''}`}
                            onClick={() => {
                              setTable(n)
                              setError('')
                            }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {n}
                          </motion.button>
                        ))}
                      </div>
                      <AnimatePresence>
                        {table && (
                          <motion.div
                            className="table-service"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.35, ease }}
                          >
                            <span>Am Tisch {table}:</span>
                            <button onClick={openService}>
                              <Bell width={15} height={15} /> Mitarbeiter rufen
                            </button>
                            <button onClick={openService}>
                              <Receipt width={15} height={15} /> Rechnung
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <label className="note">
                        <span>Anmerkung zur ganzen Bestellung (optional)</span>
                        <textarea
                          value={note}
                          maxLength={300}
                          rows={2}
                          placeholder="z. B. ohne Zwiebeln, extra scharf …"
                          onChange={(e) => setNote(e.target.value)}
                        />
                      </label>
                      <div className="sheet__summary">
                        <span>{count} Artikel</span>
                        <strong>{formatPrice(total)}</strong>
                      </div>
                    </motion.div>
                  )}

                  {step === 'done' && activeOrder && (
                    <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }}>
                      <OrderStatus order={activeOrder} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <footer className="sheet__foot">
                {step === 'cart' && (
                  <>
                    <div className="sheet__total">
                      <span>Summe</span>
                      <motion.strong key={total} initial={{ opacity: 0.4, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                        {formatPrice(total)}
                      </motion.strong>
                    </div>
                    <button className="btn btn--gold sheet__cta" onClick={() => setStep('table')} disabled={count === 0}>
                      Weiter zur Tischauswahl <ArrowRight width={16} height={16} />
                    </button>
                    <div className="sheet__row">
                      <button className="link-btn" onClick={clear}>
                        Warenkorb leeren
                      </button>
                      <span className="sheet__hint">Bezahlt wird vor Ort.</span>
                    </div>
                  </>
                )}

                {step === 'table' && (
                  <>
                    {!canOrder && <p className="sheet__error">Wir haben gerade geschlossen – bestellen kannst du {site.hoursSummary}.</p>}
                    <AnimatePresence>
                      {error && (
                        <motion.p className="sheet__error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    <button className="btn btn--gold sheet__cta" onClick={submit} disabled={sending || !canOrder || !table}>
                      {sending ? 'Wird gesendet …' : table ? `An Tisch ${table} bestellen · ${formatPrice(total)}` : 'Bitte Tisch wählen'}
                    </button>
                    <div className="sheet__row">
                      <button className="link-btn" onClick={() => setStep('cart')}>
                        Zurück zum Warenkorb
                      </button>
                      <span className="sheet__hint">Bezahlt wird vor Ort.</span>
                    </div>
                  </>
                )}

                {step === 'done' && (
                  <div className="sheet__row">
                    <button
                      className="btn btn--ghost btn--sm"
                      onClick={() => {
                        dismissOrder()
                        window.setTimeout(() => scrollToTarget('#speisekarte'), 350)
                      }}
                    >
                      Noch etwas bestellen
                    </button>
                    <button className="btn btn--gold btn--sm" onClick={dismissOrder}>
                      Fertig
                    </button>
                  </div>
                )}
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
