/**
 * Zentrale Stammdaten des Restaurants.
 * Alles, was sich ändern kann (Zeiten, Adresse, Social Links), wird nur hier gepflegt.
 */

export type DayHours = { open: string; close: string } | null

/** Index entspricht Date#getDay(): 0 = Sonntag … 6 = Samstag */
export const openingHours: DayHours[] = [
  { open: '11:00', close: '20:00' }, // Sonntag
  null, // Montag – Ruhetag
  { open: '11:00', close: '20:00' }, // Dienstag
  { open: '11:00', close: '20:00' }, // Mittwoch
  { open: '11:00', close: '20:00' }, // Donnerstag
  { open: '11:00', close: '20:00' }, // Freitag
  { open: '11:00', close: '20:00' }, // Samstag
]

export const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
export const dayShort = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

const street = 'Kronenstraße 2'
const zip = '87435'
const city = 'Kempten (Allgäu)'
const query = encodeURIComponent(`Sofra, ${street}, ${zip} Kempten`)

export const site = {
  name: 'Sofra',
  title: 'Cağ Kebab & Drehspieß',
  claim: 'Good Food – Good People',
  timezone: 'Europe/Berlin',
  address: { street, zip, city },
  /** Anzahl der Tische im Restaurant – bestimmt die Auswahl bei der Tischbestellung */
  tables: 20,
  hoursSummary: 'Di – So · 11 – 20 Uhr',
  closedDay: 'Montag Ruhetag',
  maps: {
    apple: `https://maps.apple.com/?q=${query}`,
    google: `https://www.google.com/maps/dir/?api=1&destination=${query}`,
    embed: `https://www.google.com/maps?q=${query}&output=embed`,
  },
  /**
   * Social-Media-Profile. Sobald eine URL eingetragen ist,
   * erscheint der Link automatisch in Navigation und Footer.
   */
  /**
   * Empfänger für Reservierungsanfragen (mailto).
   * ⚠️ Hier die echte E-Mail-Adresse des Restaurants eintragen.
   */
  reservationEmail: 'reservierung@example.com',
  /** Ab dieser Personenzahl bitten wir um einen Anruf */
  maxGuestsOnline: 12,
  socials: {
    instagram: '',
    tiktok: '',
  },
}
