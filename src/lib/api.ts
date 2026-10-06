import type { CallRequest, CallStatus, Order, OrderRequest, OrderStatus, ServiceCall } from '../data/order'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
  } catch {
    throw new Error('Keine Verbindung. Bitte prüfe dein Internet und versuche es erneut.')
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error(data.error ?? 'Etwas ist schiefgelaufen. Bitte versuche es erneut.')
  return data
}

export const placeOrder = (body: OrderRequest) => request<Order>('/api/orders', { method: 'POST', body: JSON.stringify(body) })

export const fetchOrder = (id: string) => request<Order>(`/api/orders/${id}`)

export const staffOrders = (pin: string) => request<Order[]>('/api/staff/orders', { headers: { 'x-staff-pin': pin } })

export const setOrderStatus = (pin: string, id: string, status: OrderStatus) =>
  request<Order>(`/api/staff/orders/${id}`, { method: 'PATCH', headers: { 'x-staff-pin': pin }, body: JSON.stringify({ status }) })

export const staffStreamUrl = (pin: string) => `/api/staff/stream?pin=${encodeURIComponent(pin)}`

export const requestCall = (body: CallRequest) => request<ServiceCall>('/api/calls', { method: 'POST', body: JSON.stringify(body) })

export const fetchCall = (id: string) => request<ServiceCall>(`/api/calls/${id}`)

export const staffCalls = (pin: string) => request<ServiceCall[]>('/api/staff/calls', { headers: { 'x-staff-pin': pin } })

export const setCallStatus = (pin: string, id: string, status: CallStatus) =>
  request<ServiceCall>(`/api/staff/calls/${id}`, { method: 'PATCH', headers: { 'x-staff-pin': pin }, body: JSON.stringify({ status }) })
