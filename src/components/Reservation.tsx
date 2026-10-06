import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState, type FormEvent } from 'react'
import { dayNames, dayShort, openingHours, site } from '../data/site'
import { nowInKempten } from '../lib/hours'
import { Calendar, Check, Clock, Minus, Plus, Users } from './ui/Icons'
import { MaskLines, Reveal, ease } from './ui/Reveal'

/** Letzte Reservierung eine Stunde vor Schluss, Takt 30 Minuten */
const LAST_SLOT_BEFORE_CLOSE = 60
const SLOT_STEP = 30
const DAYS_AHEAD = 90

const pad = (n: number) => String(n).padStart(2, '0')
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Heutiges Datum in Kempten als JJJJ-MM-TT */
const todayInKempten = () => new Intl.DateTimeFormat('en-CA', { timeZone: site.timezone }).format(new Date())

function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

const weekday = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

const months = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.']

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

function slotsFor(iso: string) {
  const hours = openingHours[weekday(iso)]
  if (!hours) return []
  const start = toMinutes(hours.open)
  const end = toMinutes(hours.close) - LAST_SLOT_BEFORE_CLOSE
  const isToday = iso === todayInKempten()
  const earliest = isToday ? nowInKempten().minutes + 30 : 0
  const slots: string[] = []
  for (let t = start; t <= end; t += SLOT_STEP) if (t >= earliest) slots.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`)
  return slots
}

interface Form {
  name: string
  phone: string
  email: string
  date: string
  time: string
  guests: number
  message: string
}

type Errors = Partial<Record<keyof Form, string>>

function validate(f: Form): Errors {
  const e: Errors = {}
  if (f.name.trim().length < 2) e.name = 'Bitte gib deinen Namen an.'
  if (f.phone.replace(/[^\d]/g, '').length < 6) e.phone = 'Bitte gib eine Telefonnummer an, damit wir dich erreichen.'
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Diese E-Mail-Adresse sieht nicht richtig aus.'
  if (!f.date) e.date = 'Bitte wähle einen Tag.'
  else if (!openingHours[weekday(f.date)]) e.date = `${dayNames[weekday(f.date)]} ist Ruhetag.`
  if (!f.time) e.time = 'Bitte wähle eine Uhrzeit.'
  return e
}

function buildMail(f: Form) {
  const day = `${dayNames[weekday(f.date)]}, ${formatDate(f.date)}`
  const subject = `Reservierung: ${f.guests} ${f.guests === 1 ? 'Person' : 'Personen'} am ${formatDate(f.date)} um ${f.time} Uhr`
  const body = [
    'Hallo Sofra-Team,',
    '',
    'ich möchte gerne einen Tisch reservieren:',
    '',
    `Name: ${f.name.trim()}`,
    `Telefon: ${f.phone.trim()}`,
    f.email ? `E-Mail: ${f.email.trim()}` : null,
    `Datum: ${day}`,
    `Uhrzeit: ${f.time} Uhr`,
    `Personen: ${f.guests}`,
    f.message.trim() ? `\nNachricht:\n${f.message.trim()}` : null,
    '',
    'Vielen Dank und bis bald!',
  ]
    .filter((l) => l !== null)
    .join('\n')
  return { subject, body, href: `mailto:${site.reservationEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` }
}

export function Reservation() {
  const today = todayInKempten()
  const [form, setForm] = useState<Form>({ name: '', phone: '', email: '', date: '', time: '', guests: 2, message: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState<ReturnType<typeof buildMail> | null>(null)
  const [copied, setCopied] = useState(false)

  const quickDays = useMemo(() => Array.from({ length: 10 }, (_, i) => addDays(today, i)), [today])
  const slots = useMemo(() => (form.date ? slotsFor(form.date) : []), [form.date])
  const tooMany = form.guests >= site.maxGuestsOnline

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value, ...(key === 'date' ? { time: '' } : {}) }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) {
      document.querySelector<HTMLElement>(`[data-field="${Object.keys(found)[0]}"]`)?.focus()
      return
    }
    const mail = buildMail(form)
    setSent(mail)
    window.location.href = mail.href
  }

  const copy = async () => {
    if (!sent) return
    try {
      await navigator.clipboard.writeText(`An: ${site.reservationEmail}\nBetreff: ${sent.subject}\n\n${sent.body}`)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="reserve" id="reservieren">
      <div className="container reserve__grid">
        <div className="reserve__intro">
          <p className="eyebrow">
            <span className="eyebrow__line" /> Reservieren
          </p>
          <MaskLines lines={['Ein Tisch für euch.', <span className="serif gold-text">Wir halten ihn frei.</span>]} className="section-title" />
          <Reveal>
            <p className="reserve__lead">
              Wähle Tag, Uhrzeit und wie viele ihr seid. Wir melden uns schnellstmöglich mit einer Bestätigung – die Reservierung gilt erst
              danach.
            </p>
            <ul className="reserve__facts">
              <li>
                <Clock width={18} height={18} /> {site.hoursSummary} · {site.closedDay}
              </li>
              <li>
                <Users width={18} height={18} /> Größere Gruppen ab {site.maxGuestsOnline} Personen? Sprecht uns gerne direkt an.
              </li>
            </ul>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="reserve__card">
            <AnimatePresence mode="wait" initial={false}>
              {sent ? (
                <motion.div key="sent" className="reserve__sent" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease }}>
                  <span className="reserve__check">
                    <Check width={30} height={30} />
                  </span>
                  <h3>Fast geschafft!</h3>
                  <p className="muted">
                    Dein E-Mail-Programm sollte sich jetzt mit der fertigen Anfrage geöffnet haben – bitte dort noch auf <b>Senden</b> tippen.
                  </p>
                  <div className="reserve__summary">
                    <span>{sent.subject.replace('Reservierung: ', '')}</span>
                  </div>
                  <p className="reserve__fallback">
                    Nichts passiert? Schreib uns an <a href={sent.href}>{site.reservationEmail}</a> oder kopiere den Text.
                  </p>
                  <div className="reserve__actions">
                    <button type="button" className="btn btn--ghost btn--sm" onClick={copy}>
                      {copied ? 'Kopiert ✓' : 'Text kopieren'}
                    </button>
                    <button
                      type="button"
                      className="btn btn--gold btn--sm"
                      onClick={() => {
                        setSent(null)
                        setCopied(false)
                      }}
                    >
                      Neue Anfrage
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={submit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* Tag */}
                  <fieldset className="field">
                    <legend>
                      <Calendar width={16} height={16} /> Tag
                    </legend>
                    <div className="days" data-lenis-prevent>
                      {quickDays.map((iso, i) => {
                        const wd = weekday(iso)
                        const restDay = !openingHours[wd]
                        const closed = restDay || slotsFor(iso).length === 0
                        return (
                          <button
                            type="button"
                            key={iso}
                            data-field={i === 0 ? 'date' : undefined}
                            className={`day ${form.date === iso ? 'is-active' : ''}`}
                            disabled={closed}
                            onClick={() => set('date', iso)}
                          >
                            <small>{i === 0 ? 'Heute' : i === 1 ? 'Morgen' : dayShort[wd]}</small>
                            <strong>{iso.slice(8)}</strong>
                            <small>{restDay ? 'Ruhetag' : closed ? 'vorbei' : months[Number(iso.slice(5, 7)) - 1]}</small>
                          </button>
                        )
                      })}
                    </div>
                    <label className="field__other">
                      <span>Anderes Datum:</span>
                      <input
                        type="date"
                        min={today}
                        max={addDays(today, DAYS_AHEAD)}
                        value={form.date}
                        onChange={(e) => set('date', e.target.value)}
                      />
                    </label>
                    {errors.date && <p className="field__error">{errors.date}</p>}
                  </fieldset>

                  {/* Uhrzeit */}
                  <fieldset className="field">
                    <legend>
                      <Clock width={16} height={16} /> Uhrzeit
                    </legend>
                    {!form.date ? (
                      <p className="field__hint">Bitte zuerst einen Tag wählen.</p>
                    ) : slots.length === 0 ? (
                      <p className="field__hint">An diesem Tag sind keine Zeiten mehr frei.</p>
                    ) : (
                      <div className="slots">
                        {slots.map((t) => (
                          <motion.button
                            type="button"
                            key={t}
                            data-field="time"
                            className={`slot ${form.time === t ? 'is-active' : ''}`}
                            onClick={() => set('time', t)}
                            whileTap={{ scale: 0.92 }}
                          >
                            {t}
                          </motion.button>
                        ))}
                      </div>
                    )}
                    {errors.time && <p className="field__error">{errors.time}</p>}
                  </fieldset>

                  {/* Personen */}
                  <fieldset className="field field--guests">
                    <legend>
                      <Users width={16} height={16} /> Personen
                    </legend>
                    <div className="guests">
                      <button type="button" onClick={() => set('guests', Math.max(1, form.guests - 1))} aria-label="Weniger Personen" disabled={form.guests <= 1}>
                        <Minus width={18} height={18} />
                      </button>
                      <motion.span key={form.guests} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                        {form.guests}
                      </motion.span>
                      <button
                        type="button"
                        onClick={() => set('guests', Math.min(site.maxGuestsOnline, form.guests + 1))}
                        aria-label="Mehr Personen"
                        disabled={tooMany}
                      >
                        <Plus width={18} height={18} />
                      </button>
                    </div>
                    {tooMany && <p className="field__hint">Für noch größere Gruppen sprecht uns bitte direkt an.</p>}
                  </fieldset>

                  {/* Kontakt */}
                  <div className="inputs">
                    <label className={`input ${errors.name ? 'has-error' : ''}`}>
                      <span>Name *</span>
                      <input data-field="name" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} />
                      {errors.name && <em>{errors.name}</em>}
                    </label>
                    <label className={`input ${errors.phone ? 'has-error' : ''}`}>
                      <span>Telefon *</span>
                      <input data-field="phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                      {errors.phone && <em>{errors.phone}</em>}
                    </label>
                    <label className={`input input--wide ${errors.email ? 'has-error' : ''}`}>
                      <span>E-Mail (optional)</span>
                      <input data-field="email" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
                      {errors.email && <em>{errors.email}</em>}
                    </label>
                    <label className="input input--wide">
                      <span>Nachricht (optional)</span>
                      <textarea
                        rows={3}
                        maxLength={500}
                        placeholder="z. B. Geburtstag, Kinderstuhl, Platz am Fenster …"
                        value={form.message}
                        onChange={(e) => set('message', e.target.value)}
                      />
                    </label>
                  </div>

                  <div className="reserve__submit">
                    <p className="reserve__recap">
                      {form.date && form.time
                        ? `${dayNames[weekday(form.date)]}, ${formatDate(form.date)} · ${form.time} Uhr · ${form.guests} ${form.guests === 1 ? 'Person' : 'Personen'}`
                        : 'Tag & Uhrzeit wählen'}
                    </p>
                    <button type="submit" className="btn btn--gold">
                      Reservierung anfragen
                    </button>
                  </div>
                  <p className="reserve__privacy">Mit dem Absenden öffnet sich dein E-Mail-Programm mit einer fertigen Nachricht an uns.</p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
