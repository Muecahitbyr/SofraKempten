/**
 * Gemeinsame Typen für Tischbestellungen und Service-Rufe – genutzt von Website und Server.
 */

export type OrderStatus = 'neu' | 'zubereitung' | 'serviert' | 'storniert'

export const statusLabel: Record<OrderStatus, string> = {
  neu: 'Eingegangen',
  zubereitung: 'In Zubereitung',
  serviert: 'Serviert',
  storniert: 'Storniert',
}

export const finalStatuses: OrderStatus[] = ['serviert', 'storniert']

export const MAX_LINE_NOTE = 120

export interface OrderLine {
  id: string
  name: string
  choice?: string
  /** Wunsch zu diesem Gericht, z. B. "scharf, ohne Zwiebeln" */
  note?: string
  qty: number
  /** Einzelpreis zum Zeitpunkt der Bestellung */
  price: number
}

export interface Order {
  id: string
  /** Fortlaufende Bestellnummer des Tages – für Gast und Küche */
  number: number
  table: number
  lines: OrderLine[]
  note: string
  total: number
  status: OrderStatus
  createdAt: string
  updatedAt: string
}

export interface OrderRequest {
  table: number
  note?: string
  items: { id: string; choice?: string; note?: string; qty: number }[]
}

/* --- Service-Rufe -------------------------------------------------------- */

export type CallKind = 'service' | 'rechnung'
export type PaymentMethod = 'bar' | 'karte'
export type CallStatus = 'offen' | 'erledigt'

export const callLabel: Record<CallKind, string> = {
  service: 'Mitarbeiter gerufen',
  rechnung: 'Rechnung gewünscht',
}

export const paymentLabel: Record<PaymentMethod, string> = {
  bar: 'Bar',
  karte: 'Karte',
}

export interface ServiceCall {
  id: string
  table: number
  kind: CallKind
  payment?: PaymentMethod
  status: CallStatus
  createdAt: string
  updatedAt: string
}

export interface CallRequest {
  table: number
  kind: CallKind
  payment?: PaymentMethod
}

/** Nachrichten im Live-Stream der Küchenansicht */
export type StaffEvent = { type: 'order'; order: Order } | { type: 'call'; call: ServiceCall }
