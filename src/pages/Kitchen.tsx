import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { callLabel, paymentLabel, statusLabel, type Order, type OrderStatus, type ServiceCall, type StaffEvent } from '../data/order'
import { setCallStatus, setOrderStatus, staffCalls, staffOrders, staffStreamUrl } from '../lib/api'
import { formatPrice } from '../lib/format'
import { ease } from '../components/ui/Reveal'

const PIN_KEY = 'sofra.staff.pin'

const timeFmt = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' })

function since(iso: string, now: number) {
  const min = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000))
  if (min < 1) return 'gerade eben'
  if (min < 60) return `vor ${min} Min.`
  return `vor ${Math.floor(min / 60)} Std.`
}

/** Kurzer Gong: zwei Töne für Bestellungen, drei schnelle für Service-Rufe */
function chime(kind: 'order' | 'call' = 'order') {
  try {
    const ctx = new AudioContext()
    const tones = kind === 'order' ? [880, 1320] : [1320, 990, 1320]
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = freq
      osc.type = 'sine'
      const t = ctx.currentTime + i * (kind === 'order' ? 0.18 : 0.12)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.55)
    })
  } catch {
    /* Audio nicht verfügbar */
  }
}

const columns: { title: string; statuses: OrderStatus[] }[] = [
  { title: 'Neu', statuses: ['neu'] },
  { title: 'In Zubereitung', statuses: ['zubereitung'] },
  { title: 'Erledigt', statuses: ['serviert', 'storniert'] },
]

function Login({ onLogin }: { onLogin: (pin: string) => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await staffOrders(pin)
      onLogin(pin)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="kitchen-login">
      <motion.form className="kitchen-login__card" onSubmit={submit} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
        <img src="/logo.jpg" alt="Sofra" width={84} height={84} />
        <h1>Küche & Service</h1>
        <p className="muted">Bitte PIN eingeben, um die Tischbestellungen zu sehen.</p>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          autoFocus
          aria-label="PIN"
        />
        {error && <p className="kitchen-login__error">{error}</p>}
        <button className="btn btn--gold" disabled={busy || !pin}>
          {busy ? 'Prüfe …' : 'Anmelden'}
        </button>
      </motion.form>
    </div>
  )
}

function OrderCard({ order, now, onStatus }: { order: Order; now: number; onStatus: (status: OrderStatus) => void }) {
  const done = order.status === 'serviert' || order.status === 'storniert'
  const urgent = order.status === 'neu' && now - new Date(order.createdAt).getTime() > 5 * 60_000
  return (
    <motion.article
      layout
      className={`kcard kcard--${order.status} ${urgent ? 'is-urgent' : ''}`}
      initial={{ opacity: 0, scale: 0.94, y: -16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.45, ease }}
    >
      <header className="kcard__head">
        <div className="kcard__table">
          <span>Tisch</span>
          <strong>{order.table}</strong>
        </div>
        <div className="kcard__meta">
          <span>#{order.number}</span>
          <span>
            {timeFmt.format(new Date(order.createdAt))} · {since(order.createdAt, now)}
          </span>
          {done && <span className="kcard__state">{statusLabel[order.status]}</span>}
        </div>
      </header>

      <ul className="kcard__lines">
        {order.lines.map((l) => (
          <li key={`${l.id}|${l.choice ?? ''}`}>
            <b>{l.qty}×</b>
            <span>
              {l.name}
              {l.choice && <em>{l.choice}</em>}
              {l.note && <i className="kcard__line-note">{l.note}</i>}
            </span>
          </li>
        ))}
      </ul>

      {order.note && <p className="kcard__note">„{order.note}“</p>}

      <footer className="kcard__foot">
        <span className="kcard__total">{formatPrice(order.total)}</span>
        <div className="kcard__actions">
          {order.status === 'neu' && (
            <>
              <button className="kbtn kbtn--ghost" onClick={() => onStatus('storniert')}>
                Stornieren
              </button>
              <button className="kbtn" onClick={() => onStatus('zubereitung')}>
                Annehmen
              </button>
            </>
          )}
          {order.status === 'zubereitung' && (
            <button className="kbtn" onClick={() => onStatus('serviert')}>
              Serviert
            </button>
          )}
          {done && (
            <button className="kbtn kbtn--ghost" onClick={() => onStatus('zubereitung')}>
              Zurückholen
            </button>
          )}
        </div>
      </footer>
    </motion.article>
  )
}

function CallStrip({ calls, now, onDone }: { calls: ServiceCall[]; now: number; onDone: (call: ServiceCall) => void }) {
  return (
    <AnimatePresence initial={false}>
      {calls.length > 0 && (
        <motion.section
          className="calls"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4, ease }}
          aria-label="Service-Rufe"
        >
          <div className="calls__list">
            <AnimatePresence mode="popLayout" initial={false}>
              {calls.map((c) => (
                <motion.article
                  key={c.id}
                  layout
                  className={`call call--${c.kind}`}
                  initial={{ opacity: 0, scale: 0.9, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, ease }}
                >
                  <div className="call__table">
                    <span>Tisch</span>
                    <strong>{c.table}</strong>
                  </div>
                  <div className="call__text">
                    <strong>
                      {c.kind === 'rechnung' ? 'Rechnung' : 'Service'}
                      {c.payment && ` · ${paymentLabel[c.payment]}`}
                    </strong>
                    <span>
                      {callLabel[c.kind]} · {since(c.createdAt, now)}
                    </span>
                  </div>
                  <button className="kbtn" onClick={() => onDone(c)}>
                    Erledigt
                  </button>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}

function Board({ pin, onLogout }: { pin: string; onLogout: () => void }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [calls, setCalls] = useState<ServiceCall[]>([])
  const knownCalls = useRef<Set<string> | null>(null)
  const [live, setLive] = useState(false)
  const [sound, setSound] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())
  const known = useRef<Set<string> | null>(null)
  const soundRef = useRef(sound)
  useEffect(() => {
    soundRef.current = sound
  }, [sound])

  const upsert = useCallback((order: Order) => {
    setOrders((prev) => {
      const exists = prev.some((o) => o.id === order.id)
      return exists ? prev.map((o) => (o.id === order.id ? order : o)) : [order, ...prev]
    })
    if (known.current && !known.current.has(order.id)) {
      known.current.add(order.id)
      if (soundRef.current) chime('order')
    }
  }, [])

  const upsertCall = useCallback((call: ServiceCall) => {
    setCalls((prev) => (prev.some((c) => c.id === call.id) ? prev.map((c) => (c.id === call.id ? call : c)) : [call, ...prev]))
    if (knownCalls.current && !knownCalls.current.has(call.id)) {
      knownCalls.current.add(call.id)
      if (soundRef.current) chime('call')
    }
  }, [])

  useEffect(() => {
    staffOrders(pin)
      .then((list) => {
        setOrders(list)
        known.current = new Set(list.map((o) => o.id))
      })
      .catch((err: Error) => {
        if (err.message.includes('PIN')) onLogout()
        else setError(err.message)
      })
    staffCalls(pin)
      .then((list) => {
        setCalls(list)
        knownCalls.current = new Set(list.map((c) => c.id))
      })
      .catch(() => {})

    const es = new EventSource(staffStreamUrl(pin))
    es.onopen = () => setLive(true)
    es.onerror = () => setLive(false)
    es.onmessage = (e) => {
      const event = JSON.parse(e.data) as StaffEvent
      if (event.type === 'order') upsert(event.order)
      else upsertCall(event.call)
    }
    return () => es.close()
  }, [pin, upsert, upsertCall, onLogout])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 20_000)
    return () => window.clearInterval(id)
  }, [])

  const openCalls = useMemo(() => calls.filter((c) => c.status === 'offen').sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [calls])
  const newCount = orders.filter((o) => o.status === 'neu').length + openCalls.length
  useEffect(() => {
    document.title = newCount ? `(${newCount}) Neu – Sofra Küche` : 'Küche – Sofra'
  }, [newCount])

  const finishCall = async (call: ServiceCall) => {
    setCalls((prev) => prev.map((c) => (c.id === call.id ? { ...c, status: 'erledigt' } : c)))
    try {
      upsertCall(await setCallStatus(pin, call.id, 'erledigt'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Konnte nicht als erledigt markiert werden')
      upsertCall(call)
    }
  }

  const grouped = useMemo(
    () =>
      columns.map((col) => ({
        ...col,
        orders: orders
          .filter((o) => col.statuses.includes(o.status))
          .sort((a, b) => (col.title === 'Erledigt' ? b.updatedAt.localeCompare(a.updatedAt) : a.createdAt.localeCompare(b.createdAt)))
          .slice(0, col.title === 'Erledigt' ? 12 : undefined),
      })),
    [orders],
  )

  const change = async (order: Order, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)))
    try {
      upsert(await setOrderStatus(pin, order.id, status))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status konnte nicht geändert werden')
      upsert(order)
    }
  }

  return (
    <div className="kitchen">
      <header className="kitchen__bar">
        <div className="kitchen__brand">
          <img src="/logo.jpg" alt="" width={36} height={36} />
          <div>
            <strong>Bestellungen</strong>
            <span className={`kitchen__live ${live ? 'is-live' : ''}`}>
              <i /> {live ? 'Live verbunden' : 'Verbinde …'}
            </span>
          </div>
        </div>
        <div className="kitchen__tools">
          <button className={`kbtn kbtn--ghost ${sound ? 'is-on' : ''}`} onClick={() => setSound((s) => !s)}>
            {sound ? 'Ton an' : 'Ton aus'}
          </button>
          <button className="kbtn kbtn--ghost" onClick={onLogout}>
            Abmelden
          </button>
        </div>
      </header>

      {error && (
        <p className="kitchen__error" onClick={() => setError('')}>
          {error}
        </p>
      )}

      <CallStrip calls={openCalls} now={now} onDone={finishCall} />

      <div className="kitchen__cols">
        {grouped.map((col) => (
          <section key={col.title} className="kitchen__col">
            <h2>
              {col.title} <span>{col.orders.length}</span>
            </h2>
            <div className="kitchen__list">
              <AnimatePresence mode="popLayout" initial={false}>
                {col.orders.map((o) => (
                  <OrderCard key={o.id} order={o} now={now} onStatus={(s) => change(o, s)} />
                ))}
              </AnimatePresence>
              {col.orders.length === 0 && <p className="kitchen__empty">Keine Bestellungen</p>}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

/** Interne Ansicht für Küche & Service unter /kueche */
export function Kitchen() {
  const [pin, setPin] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(PIN_KEY)
    } catch {
      return null
    }
  })

  const login = (value: string) => {
    try {
      sessionStorage.setItem(PIN_KEY, value)
    } catch {
      /* egal */
    }
    setPin(value)
  }

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(PIN_KEY)
    } catch {
      /* egal */
    }
    setPin(null)
  }, [])

  return pin ? <Board pin={pin} onLogout={logout} /> : <Login onLogin={login} />
}
