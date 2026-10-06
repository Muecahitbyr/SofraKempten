import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { callLabel, paymentLabel, type CallKind, type PaymentMethod } from '../data/order'
import { site } from '../data/site'
import { useOpenStatus } from '../hooks/useOpenStatus'
import { useTable } from '../hooks/useTable'
import { lockScroll } from '../lib/smoothScroll'
import { Bell, Check, Close, Receipt } from './ui/Icons'
import { ease } from './ui/Reveal'

const timeFmt = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' })

/** Mitarbeiter rufen oder Rechnung anfordern – direkt vom Tisch aus. */
export function ServiceSheet() {
  const { serviceOpen, setServiceOpen, table, setTable, calls, callStaff } = useTable()
  const status = useOpenStatus()
  const [pickTable, setPickTable] = useState(false)
  const [billOpen, setBillOpen] = useState(false)
  const [busy, setBusy] = useState<CallKind | null>(null)
  const [error, setError] = useState('')

  const canCall = status.isOpen || import.meta.env.DEV
  const showPicker = !table || pickTable
  const tableCalls = calls.filter((c) => c.table === table)

  useEffect(() => {
    lockScroll('service', serviceOpen)
    if (!serviceOpen) {
      setBillOpen(false)
      setPickTable(false)
      setError('')
      return
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setServiceOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [serviceOpen, setServiceOpen])

  const send = async (kind: CallKind, payment?: PaymentMethod) => {
    setBusy(kind)
    setError('')
    try {
      await callStaff(kind, payment)
      setBillOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Das hat leider nicht geklappt.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <AnimatePresence>
      {serviceOpen && (
        <>
          <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setServiceOpen(false)} />
          <motion.aside
            className="sheet sheet--service"
            role="dialog"
            aria-modal="true"
            aria-label="Service"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="sheet__grabber" />
            <header className="sheet__head">
              <div>
                <span className="choice__label">Service am Tisch</span>
                <h3>{showPicker ? 'Wo sitzt du?' : `Tisch ${table}`}</h3>
              </div>
              <button className="icon-btn icon-btn--ghost" onClick={() => setServiceOpen(false)} aria-label="Schließen">
                <Close width={18} height={18} />
              </button>
            </header>

            <div className="sheet__body" data-lenis-prevent>
              <AnimatePresence mode="wait" initial={false}>
                {showPicker ? (
                  <motion.div key="pick" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3, ease }}>
                    <p className="sheet__lead">Wähle deine Tischnummer – sie steht auf deinem Tisch.</p>
                    <div className="tables" role="radiogroup" aria-label="Tischnummer">
                      {Array.from({ length: site.tables }, (_, i) => i + 1).map((n) => (
                        <motion.button
                          key={n}
                          role="radio"
                          aria-checked={table === n}
                          className={`tables__btn ${table === n ? 'is-active' : ''}`}
                          onClick={() => {
                            setTable(n)
                            setPickTable(false)
                          }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {n}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="actions" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3, ease }}>
                    <div className="service-actions">
                      <motion.button className="service-card" onClick={() => send('service')} disabled={!canCall || busy !== null} whileTap={{ scale: 0.97 }}>
                        <span className="service-card__icon">
                          <Bell width={22} height={22} />
                        </span>
                        <span className="service-card__text">
                          <strong>{busy === 'service' ? 'Wird gerufen …' : 'Mitarbeiter rufen'}</strong>
                          <small>Fragen, Nachbestellung, Wünsche</small>
                        </span>
                      </motion.button>

                      <div className={`service-card service-card--bill ${billOpen ? 'is-open' : ''}`}>
                        <button className="service-card__row" onClick={() => setBillOpen((o) => !o)} disabled={!canCall || busy !== null}>
                          <span className="service-card__icon">
                            <Receipt width={22} height={22} />
                          </span>
                          <span className="service-card__text">
                            <strong>{busy === 'rechnung' ? 'Wird angefordert …' : 'Rechnung bitte'}</strong>
                            <small>Wie möchtest du bezahlen?</small>
                          </span>
                        </button>
                        <AnimatePresence>
                          {billOpen && (
                            <motion.div
                              className="service-card__pay"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, ease }}
                            >
                              {(Object.keys(paymentLabel) as PaymentMethod[]).map((p) => (
                                <button key={p} className="btn btn--gold btn--sm" onClick={() => send('rechnung', p)}>
                                  {paymentLabel[p]}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {!canCall && <p className="sheet__error">Wir haben gerade geschlossen – der Service-Ruf ist {site.hoursSummary} verfügbar.</p>}
                    {error && <p className="sheet__error">{error}</p>}

                    <AnimatePresence initial={false}>
                      {tableCalls.length > 0 && (
                        <motion.ul className="call-status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                          {tableCalls.map((c) => (
                            <motion.li key={c.id} layout className={c.status === 'erledigt' ? 'is-done' : ''}>
                              <span className="call-status__icon">{c.status === 'erledigt' ? <Check width={16} height={16} /> : <span className="dot is-open" />}</span>
                              <span>
                                <strong>
                                  {callLabel[c.kind]}
                                  {c.payment && ` · ${paymentLabel[c.payment]}`}
                                </strong>
                                <small>
                                  {c.status === 'erledigt'
                                    ? 'Erledigt – danke für deine Geduld!'
                                    : c.kind === 'rechnung'
                                      ? `Wir kommen gleich mit der Rechnung · ${timeFmt.format(new Date(c.createdAt))} Uhr`
                                      : `Wir kommen gleich zu dir · ${timeFmt.format(new Date(c.createdAt))} Uhr`}
                                </small>
                              </span>
                            </motion.li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <footer className="sheet__foot">
              <div className="sheet__row">
                {table && !showPicker ? (
                  <span className="sheet__links">
                    <button className="link-btn" onClick={() => setPickTable(true)}>
                      Tisch ändern
                    </button>
                    <button
                      className="link-btn"
                      onClick={() => {
                        setTable(null)
                        setServiceOpen(false)
                      }}
                    >
                      Tisch abmelden
                    </button>
                  </span>
                ) : (
                  <span />
                )}
                <span className="sheet__hint">Das Personal sieht deine Anfrage sofort.</span>
              </div>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
