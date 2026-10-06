import { randomUUID, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import { itemById } from '../src/data/menu.ts'
import {
  MAX_LINE_NOTE,
  type CallKind,
  type CallRequest,
  type CallStatus,
  type Order,
  type OrderLine,
  type OrderRequest,
  type OrderStatus,
  type PaymentMethod,
  type ServiceCall,
  type StaffEvent,
} from '../src/data/order.ts'
import { site } from '../src/data/site.ts'
import { getOpenStatus } from '../src/lib/hours.ts'
import { JsonStore } from './store.ts'

interface ApiOptions {
  /** Im Entwicklungsmodus sind Bestellungen auch außerhalb der Öffnungszeiten möglich */
  dev: boolean
  dataDir: string
  staffPin: string
}

const MAX_BODY = 20_000
const MAX_LINES = 30
const MAX_QTY = 20
const MAX_NOTE = 300
const orderStatuses: OrderStatus[] = ['neu', 'zubereitung', 'serviert', 'storniert']
const callStatuses: CallStatus[] = ['offen', 'erledigt']
const callKinds: CallKind[] = ['service', 'rechnung']
const payments: PaymentMethod[] = ['bar', 'karte']
const UUID = '([0-9a-f-]{36})'

class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** Sehr einfaches Rate-Limit pro IP: max. `limit` Treffer je Zeitfenster */
function limiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>()
  return (key: string) => {
    const now = Date.now()
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
    recent.push(now)
    hits.set(key, recent)
    return recent.length <= limit
  }
}

const ipOf = (req: IncomingMessage) =>
  (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown'

const cleanText = (value: unknown, max: number) =>
  String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  let size = 0
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    size += (chunk as Buffer).length
    if (size > MAX_BODY) throw new HttpError(413, 'Anfrage zu groß')
    chunks.push(chunk as Buffer)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new HttpError(400, 'Ungültige Daten')
  }
}

function parseTable(value: unknown) {
  const table = Number(value)
  if (!Number.isInteger(table) || table < 1 || table > site.tables) throw new HttpError(400, 'Bitte wähle eine gültige Tischnummer.')
  return table
}

/** Prüft die Bestellung und berechnet Preise ausschließlich auf dem Server. */
function buildOrder(input: unknown, number: number): Order {
  const body = (input ?? {}) as Partial<OrderRequest>
  const table = parseTable(body.table)
  if (!Array.isArray(body.items) || body.items.length === 0) throw new HttpError(400, 'Der Warenkorb ist leer.')
  if (body.items.length > MAX_LINES) throw new HttpError(400, 'Zu viele Positionen.')

  const merged = new Map<string, OrderLine>()
  for (const raw of body.items) {
    const item = itemById.get(String(raw?.id))
    const qty = Number(raw?.qty)
    if (!item) throw new HttpError(400, 'Unbekanntes Gericht im Warenkorb.')
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) throw new HttpError(400, `Ungültige Menge bei ${item.name}.`)
    let choice: string | undefined
    if (item.choice) {
      choice = String(raw?.choice ?? '')
      if (!item.choice.values.includes(choice)) throw new HttpError(400, `Bitte ${item.choice.label} für ${item.name} wählen.`)
    }
    const note = cleanText(raw?.note, MAX_LINE_NOTE) || undefined
    const key = `${item.id}|${choice ?? ''}|${note ?? ''}`
    const existing = merged.get(key)
    if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + qty)
    else merged.set(key, { id: item.id, name: item.name, choice, note, qty, price: item.price })
  }

  const lines = [...merged.values()]
  const total = Math.round(lines.reduce((sum, l) => sum + l.price * l.qty, 0) * 100) / 100
  const now = new Date().toISOString()

  return { id: randomUUID(), number, table, lines, note: cleanText(body.note, MAX_NOTE), total, status: 'neu', createdAt: now, updatedAt: now }
}

/**
 * REST-API für Tischbestellungen und Service-Rufe.
 *
 * Gast:      POST /api/orders · GET /api/orders/:id · POST /api/calls · GET /api/calls/:id
 * Personal:  GET /api/staff/orders · PATCH /api/staff/orders/:id
 *            GET /api/staff/calls  · PATCH /api/staff/calls/:id
 *            GET /api/staff/stream (Server-Sent Events)
 *
 * Gibt `true` zurück, wenn die Anfrage beantwortet wurde.
 */
export function createApi({ dev, dataDir, staffPin }: ApiOptions) {
  const orders = new JsonStore<Order>(join(dataDir, 'orders.json'), 14)
  const calls = new JsonStore<ServiceCall>(join(dataDir, 'calls.json'), 2)
  const streams = new Set<ServerResponse>()
  const orderLimit = limiter(6, 10 * 60_000)
  const callLimit = limiter(10, 10 * 60_000)
  const pinLimit = limiter(12, 10 * 60_000)
  const pinBuffer = Buffer.from(staffPin)

  const broadcast = (event: StaffEvent) => {
    const message = `data: ${JSON.stringify(event)}\n\n`
    for (const res of streams) res.write(message)
  }

  const ensureOpen = () => {
    if (!dev && !getOpenStatus().isOpen) {
      throw new HttpError(409, 'Wir haben gerade geschlossen – das geht nur während der Öffnungszeiten.')
    }
  }

  const authorize = (req: IncomingMessage, url: URL) => {
    const given = Buffer.from(String(req.headers['x-staff-pin'] ?? url.searchParams.get('pin') ?? ''))
    const ok = given.length === pinBuffer.length && timingSafeEqual(given, pinBuffer)
    if (!ok) {
      if (!pinLimit(ipOf(req))) throw new HttpError(429, 'Zu viele Versuche. Bitte später erneut probieren.')
      throw new HttpError(401, 'Falsche PIN')
    }
  }

  return async function handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const path = url.pathname
    if (!path.startsWith('/api/')) return false
    let match: RegExpMatchArray | null

    try {
      // --- Gast: Bestellungen ------------------------------------------
      if (path === '/api/orders' && req.method === 'POST') {
        if (!orderLimit(ipOf(req))) throw new HttpError(429, 'Zu viele Bestellungen in kurzer Zeit. Bitte sprich uns direkt an.')
        ensureOpen()
        const now = new Date().toISOString()
        const order = buildOrder(await readJson(req), orders.countToday(now) + 1)
        orders.add(order)
        broadcast({ type: 'order', order })
        send(res, 201, order)
        return true
      }

      if ((match = path.match(new RegExp(`^/api/orders/${UUID}$`))) && req.method === 'GET') {
        const order = orders.get(match[1])
        if (!order) throw new HttpError(404, 'Bestellung nicht gefunden')
        send(res, 200, order)
        return true
      }

      // --- Gast: Service & Rechnung -------------------------------------
      if (path === '/api/calls' && req.method === 'POST') {
        if (!callLimit(ipOf(req))) throw new HttpError(429, 'Zu viele Anfragen. Bitte sprich uns direkt an.')
        ensureOpen()
        const body = ((await readJson(req)) ?? {}) as Partial<CallRequest>
        const table = parseTable(body.table)
        if (!body.kind || !callKinds.includes(body.kind)) throw new HttpError(400, 'Ungültige Anfrage')
        const payment = body.kind === 'rechnung' && body.payment && payments.includes(body.payment) ? body.payment : undefined

        // Gleicher offener Ruf vom selben Tisch wird nicht doppelt angelegt
        const open = calls.find((c) => c.table === table && c.kind === body.kind && c.status === 'offen')
        if (open) {
          const updated = payment && payment !== open.payment ? calls.update(open.id, { payment })! : open
          if (updated !== open) broadcast({ type: 'call', call: updated })
          send(res, 200, updated)
          return true
        }

        const now = new Date().toISOString()
        const call: ServiceCall = { id: randomUUID(), table, kind: body.kind, payment, status: 'offen', createdAt: now, updatedAt: now }
        calls.add(call)
        broadcast({ type: 'call', call })
        send(res, 201, call)
        return true
      }

      if ((match = path.match(new RegExp(`^/api/calls/${UUID}$`))) && req.method === 'GET') {
        const call = calls.get(match[1])
        if (!call) throw new HttpError(404, 'Anfrage nicht gefunden')
        send(res, 200, call)
        return true
      }

      // --- Personal -----------------------------------------------------
      if (path === '/api/staff/orders' && req.method === 'GET') {
        authorize(req, url)
        send(res, 200, orders.recent())
        return true
      }

      if ((match = path.match(new RegExp(`^/api/staff/orders/${UUID}$`))) && req.method === 'PATCH') {
        authorize(req, url)
        const body = (await readJson(req)) as { status?: OrderStatus }
        if (!body.status || !orderStatuses.includes(body.status)) throw new HttpError(400, 'Ungültiger Status')
        const order = orders.update(match[1], { status: body.status })
        if (!order) throw new HttpError(404, 'Bestellung nicht gefunden')
        broadcast({ type: 'order', order })
        send(res, 200, order)
        return true
      }

      if (path === '/api/staff/calls' && req.method === 'GET') {
        authorize(req, url)
        send(res, 200, calls.recent())
        return true
      }

      if ((match = path.match(new RegExp(`^/api/staff/calls/${UUID}$`))) && req.method === 'PATCH') {
        authorize(req, url)
        const body = (await readJson(req)) as { status?: CallStatus }
        if (!body.status || !callStatuses.includes(body.status)) throw new HttpError(400, 'Ungültiger Status')
        const call = calls.update(match[1], { status: body.status })
        if (!call) throw new HttpError(404, 'Anfrage nicht gefunden')
        broadcast({ type: 'call', call })
        send(res, 200, call)
        return true
      }

      if (path === '/api/staff/stream' && req.method === 'GET') {
        authorize(req, url)
        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        })
        res.write(': verbunden\n\n')
        streams.add(res)
        const heartbeat = setInterval(() => res.write(': ping\n\n'), 25_000)
        req.on('close', () => {
          clearInterval(heartbeat)
          streams.delete(res)
        })
        return true
      }

      throw new HttpError(404, 'Nicht gefunden')
    } catch (err) {
      if (err instanceof HttpError) send(res, err.status, { error: err.message })
      else {
        console.error('[sofra] API-Fehler', err)
        send(res, 500, { error: 'Interner Fehler' })
      }
      return true
    }
  }
}
