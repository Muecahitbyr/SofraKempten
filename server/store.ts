import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

interface Stored {
  id: string
  createdAt: string
  updatedAt: string
}

/** Tag im Format JJJJ-MM-TT in Kemptener Zeit */
export const dayKey = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date(iso))

/**
 * Einfache Ablage als JSON-Datei. Für ein einzelnes Restaurant völlig ausreichend;
 * geschrieben wird atomar (temporäre Datei + Umbenennen). Alte Einträge werden automatisch gelöscht.
 */
export class JsonStore<T extends Stored> {
  private items: T[] = []
  private file: string
  private keepMs: number

  constructor(file: string, keepDays: number) {
    this.file = file
    this.keepMs = keepDays * 86_400_000
    if (existsSync(file)) {
      try {
        this.items = JSON.parse(readFileSync(file, 'utf8')) as T[]
      } catch {
        console.warn(`[sofra] ${file} konnte nicht gelesen werden – starte mit leerer Liste`)
      }
    }
    this.prune()
  }

  private prune() {
    const cutoff = Date.now() - this.keepMs
    this.items = this.items.filter((o) => new Date(o.createdAt).getTime() >= cutoff)
  }

  private save() {
    mkdirSync(dirname(this.file), { recursive: true })
    const tmp = `${this.file}.tmp`
    writeFileSync(tmp, JSON.stringify(this.items, null, 2))
    renameSync(tmp, this.file)
  }

  add(item: T) {
    this.prune()
    this.items.push(item)
    this.save()
  }

  get(id: string) {
    return this.items.find((o) => o.id === id)
  }

  find(predicate: (item: T) => boolean) {
    return this.items.find(predicate)
  }

  countToday(createdAt: string) {
    const today = dayKey(createdAt)
    return this.items.filter((o) => dayKey(o.createdAt) === today).length
  }

  update(id: string, patch: Partial<T>) {
    const item = this.get(id)
    if (!item) return undefined
    Object.assign(item, patch, { updatedAt: new Date().toISOString() })
    this.save()
    return item
  }

  /** Einträge der letzten 24 Stunden, neueste zuerst */
  recent() {
    const cutoff = Date.now() - 86_400_000
    return this.items.filter((o) => new Date(o.createdAt).getTime() >= cutoff).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
}
