import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { itemById } from '../data/menu'
import { finalStatuses, MAX_LINE_NOTE, type CallKind, type Order, type PaymentMethod, type ServiceCall } from '../data/order'
import { site } from '../data/site'
import { fetchCall, fetchOrder, requestCall } from '../lib/api'

/**
 * "Dein Tisch" – Warenkorb für die Bestellung direkt an den Tisch.
 * Positionen mit Auswahl (Beilage, Sorte …) werden getrennt geführt.
 */

export interface CartLine {
  key: string
  id: string
  choice?: string
  /** Wunsch zu dieser Position, z. B. "Scharf, Ohne Zwiebeln" */
  note?: string
  qty: number
}

interface TableContextValue {
  lines: CartLine[]
  count: number
  total: number
  /** Wird bei jeder Hinzufügung hochgezählt – für die kleine "Bump"-Animation */
  pulse: number
  /** Gericht, für das gerade eine Auswahl (z. B. Beilage) offen ist */
  pendingChoice: string | null
  add: (id: string, choice?: string) => void
  cancelChoice: () => void
  increment: (key: string) => void
  decrement: (key: string) => void
  /** Anzahl eines Gerichts über alle Varianten */
  countFor: (id: string) => number
  /** Entfernt ein Stück des Gerichts (zuletzt hinzugefügte Variante) */
  removeOne: (id: string) => void
  clear: () => void
  setLineNote: (key: string, note: string) => void
  table: number | null
  setTable: (table: number | null) => void
  activeOrder: Order | null
  setActiveOrder: (order: Order | null) => void
  /** Service-Sheet (Mitarbeiter rufen / Rechnung) */
  serviceOpen: boolean
  setServiceOpen: (open: boolean) => void
  calls: ServiceCall[]
  callStaff: (kind: CallKind, payment?: PaymentMethod) => Promise<ServiceCall>
}

const CART_KEY = 'sofra.cart.v2'
const TABLE_KEY = 'sofra.table'
const ORDER_KEY = 'sofra.order'
const CALLS_KEY = 'sofra.calls'
/** Erledigte Rufe bleiben noch kurz sichtbar */
const CALL_VISIBLE_MS = 3 * 60_000
const TableContext = createContext<TableContextValue | null>(null)

const newKey = (id: string) => `${id}|${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

const storage = {
  get<T>(store: Storage, key: string, fallback: T): T {
    try {
      const raw = store.getItem(key)
      return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
      return fallback
    }
  },
  set(store: Storage, key: string, value: unknown) {
    try {
      if (value === null) store.removeItem(key)
      else store.setItem(key, JSON.stringify(value))
    } catch {
      /* Speicher nicht verfügbar – gilt dann nur für diese Sitzung */
    }
  },
}

function readCart(): CartLine[] {
  const stored = storage.get<CartLine[]>(localStorage, CART_KEY, [])
  return stored.filter((l) => {
    const item = itemById.get(l.id)
    if (!item || !(l.qty > 0)) return false
    return item.choice ? !!l.choice && item.choice.values.includes(l.choice) : !l.choice
  })
}

const visibleCalls = (calls: ServiceCall[]) =>
  calls.filter((c) => c.status === 'offen' || Date.now() - new Date(c.updatedAt).getTime() < CALL_VISIBLE_MS)

/** Tischnummer aus dem QR-Code-Link (?tisch=7) oder aus der laufenden Sitzung */
function readTable(): number | null {
  try {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = Number(params.get('tisch'))
    if (Number.isInteger(fromUrl) && fromUrl >= 1 && fromUrl <= site.tables) {
      params.delete('tisch')
      const rest = params.toString()
      history.replaceState(history.state, '', window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash)
      sessionStorage.setItem(TABLE_KEY, String(fromUrl))
      return fromUrl
    }
  } catch {
    /* ignorieren */
  }
  const stored = storage.get<number | null>(sessionStorage, TABLE_KEY, null)
  return stored && stored >= 1 && stored <= site.tables ? stored : null
}

export function TableProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readCart)
  const [pulse, setPulse] = useState(0)
  const [pendingChoice, setPendingChoice] = useState<string | null>(null)
  const [table, setTableState] = useState<number | null>(readTable)
  const [activeOrder, setActiveOrderState] = useState<Order | null>(() => storage.get<Order | null>(localStorage, ORDER_KEY, null))
  const [serviceOpen, setServiceOpen] = useState(false)
  const [calls, setCalls] = useState<ServiceCall[]>(() => visibleCalls(storage.get<ServiceCall[]>(sessionStorage, CALLS_KEY, [])))

  useEffect(() => storage.set(sessionStorage, CALLS_KEY, calls), [calls])

  const upsertCall = useCallback((call: ServiceCall) => {
    setCalls((prev) => visibleCalls([call, ...prev.filter((c) => c.id !== call.id)]))
  }, [])

  const callStaff = useCallback(
    async (kind: CallKind, payment?: PaymentMethod) => {
      if (!table) throw new Error('Bitte wähle zuerst deine Tischnummer.')
      const call = await requestCall({ table, kind, payment })
      upsertCall(call)
      return call
    },
    [table, upsertCall],
  )

  // Offene Rufe verfolgen: Sobald das Personal "erledigt" drückt, sieht es der Gast
  const openCallIds = calls
    .filter((c) => c.status === 'offen')
    .map((c) => c.id)
    .join(',')
  useEffect(() => {
    if (!openCallIds) return
    const ids = openCallIds.split(',')
    const poll = () =>
      ids.forEach((id) =>
        fetchCall(id)
          .then(upsertCall)
          .catch(() => setCalls((prev) => prev.filter((c) => c.id !== id))),
      )
    const timer = window.setInterval(poll, 5000)
    return () => window.clearInterval(timer)
  }, [openCallIds, upsertCall])

  useEffect(() => storage.set(localStorage, CART_KEY, lines), [lines])

  const setTable = useCallback((t: number | null) => {
    setTableState(t)
    storage.set(sessionStorage, TABLE_KEY, t)
  }, [])

  const setActiveOrder = useCallback((order: Order | null) => {
    setActiveOrderState(order)
    storage.set(localStorage, ORDER_KEY, order)
  }, [])

  // Status der laufenden Bestellung live verfolgen
  useEffect(() => {
    if (!activeOrder || finalStatuses.includes(activeOrder.status)) return
    let alive = true
    const poll = async () => {
      try {
        const fresh = await fetchOrder(activeOrder.id)
        if (alive && (fresh.status !== activeOrder.status || fresh.updatedAt !== activeOrder.updatedAt)) setActiveOrder(fresh)
      } catch (err) {
        // Bestellung existiert nicht mehr (z. B. Server zurückgesetzt)
        if (alive && err instanceof Error && err.message.includes('nicht gefunden')) setActiveOrder(null)
      }
    }
    const id = window.setInterval(poll, 5000)
    poll()
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [activeOrder, setActiveOrder])

  const add = useCallback((id: string, choice?: string) => {
    const item = itemById.get(id)
    if (!item) return
    if (item.choice && !choice) {
      setPendingChoice(id)
      return
    }
    setLines((prev) => {
      // Gleiche Position ohne Notiz wird hochgezählt, sonst entsteht eine neue Zeile
      const existing = prev.find((l) => l.id === id && l.choice === choice && !l.note)
      if (existing) return prev.map((l) => (l === existing ? { ...l, qty: l.qty + 1 } : l))
      return [...prev, { key: newKey(id), id, choice, qty: 1 }]
    })
    setPendingChoice(null)
    setPulse((p) => p + 1)
  }, [])

  const increment = useCallback((key: string) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l)))
  }, [])

  const decrement = useCallback((key: string) => {
    setLines((prev) => prev.flatMap((l) => (l.key !== key ? [l] : l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : [])))
  }, [])

  const removeOne = useCallback(
    (id: string) => {
      const last = [...lines].reverse().find((l) => l.id === id)
      if (last) decrement(last.key)
    },
    [lines, decrement],
  )

  const countFor = useCallback((id: string) => lines.reduce((n, l) => (l.id === id ? n + l.qty : n), 0), [lines])

  const clear = useCallback(() => setLines([]), [])
  const setLineNote = useCallback((key: string, note: string) => {
    const value = note.slice(0, MAX_LINE_NOTE)
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, note: value || undefined } : l)))
  }, [])
  const cancelChoice = useCallback(() => setPendingChoice(null), [])

  const value = useMemo(() => {
    let count = 0
    let total = 0
    for (const l of lines) {
      const item = itemById.get(l.id)
      if (!item) continue
      count += l.qty
      total += item.price * l.qty
    }
    return {
      lines,
      count,
      total,
      pulse,
      pendingChoice,
      add,
      cancelChoice,
      increment,
      decrement,
      countFor,
      removeOne,
      clear,
      setLineNote,
      table,
      setTable,
      activeOrder,
      setActiveOrder,
      serviceOpen,
      setServiceOpen,
      calls,
      callStaff,
    }
  }, [
    lines,
    pulse,
    pendingChoice,
    add,
    cancelChoice,
    increment,
    decrement,
    countFor,
    removeOne,
    clear,
    setLineNote,
    table,
    setTable,
    activeOrder,
    setActiveOrder,
    serviceOpen,
    calls,
    callStaff,
  ])

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>
}

export function useTable() {
  const ctx = useContext(TableContext)
  if (!ctx) throw new Error('useTable muss innerhalb von <TableProvider> verwendet werden')
  return ctx
}
