import { dayNames, dayShort, openingHours, site } from '../data/site.ts'

export interface OpenStatus {
  isOpen: boolean
  /** Kurzer Status, z. B. "Geöffnet" */
  headline: string
  /** Detail, z. B. "bis 20:00 Uhr" oder "öffnet Di. 11:00 Uhr" */
  detail: string
  /** Heutiger Wochentag in Kempten (0 = Sonntag) */
  today: number
  /** Minuten seit Mitternacht in Kempten */
  minutes: number
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Liefert Wochentag und Uhrzeit in der Zeitzone des Restaurants – unabhängig vom Gerät des Besuchers. */
export function nowInKempten(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: site.timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
  return { day: weekday, minutes: Number(get('hour')) * 60 + Number(get('minute')) }
}

export function getOpenStatus(date = new Date()): OpenStatus {
  const { day, minutes } = nowInKempten(date)
  const todayHours = openingHours[day]

  if (todayHours) {
    const open = toMinutes(todayHours.open)
    const close = toMinutes(todayHours.close)
    if (minutes >= open && minutes < close) {
      const left = close - minutes
      return {
        isOpen: true,
        headline: 'Jetzt geöffnet',
        detail: left <= 60 ? `schließt in ${left} Min.` : `bis ${todayHours.close} Uhr`,
        today: day,
        minutes,
      }
    }
    if (minutes < open) {
      return { isOpen: false, headline: 'Geschlossen', detail: `öffnet heute ${todayHours.open} Uhr`, today: day, minutes }
    }
  }

  for (let offset = 1; offset <= 7; offset++) {
    const next = (day + offset) % 7
    const hours = openingHours[next]
    if (hours) {
      const label = offset === 1 ? 'morgen' : `${dayShort[next]}.`
      return { isOpen: false, headline: 'Geschlossen', detail: `öffnet ${label} ${hours.open} Uhr`, today: day, minutes }
    }
  }

  return { isOpen: false, headline: 'Geschlossen', detail: '', today: day, minutes }
}

/** Wochentage in Anzeige-Reihenfolge Mo – So */
export const weekOrder = [1, 2, 3, 4, 5, 6, 0].map((d) => ({ day: d, name: dayNames[d], hours: openingHours[d] }))
