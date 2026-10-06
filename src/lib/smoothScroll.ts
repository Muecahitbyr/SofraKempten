import Lenis from 'lenis'

let lenis: Lenis | null = null
let rafId = 0

export function startSmoothScroll() {
  if (lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.95 })
  const raf = (time: number) => {
    lenis?.raf(time)
    rafId = requestAnimationFrame(raf)
  }
  rafId = requestAnimationFrame(raf)
}

export function stopSmoothScroll() {
  cancelAnimationFrame(rafId)
  lenis?.destroy()
  lenis = null
}

const locks = new Set<string>()

/** Sperrt das Scrollen, solange mindestens ein Grund (Intro, Menü, Sheet …) aktiv ist. */
export function lockScroll(reason: string, locked: boolean) {
  if (locked) locks.add(reason)
  else locks.delete(reason)
  const any = locks.size > 0
  if (any) lenis?.stop()
  else lenis?.start()
  document.documentElement.classList.toggle('is-locked', any)
}

const NAV_OFFSET = -64

/** Sanftes Scrollen zu einem Anker (#id) oder Element – fällt ohne Lenis auf native Scrolls zurück. */
export function scrollToTarget(target: string | HTMLElement, offset = NAV_OFFSET) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (!el) return
  if (lenis) {
    // Seitenhöhe kann sich gerade geändert haben (z. B. nach Seitenwechsel)
    lenis.resize()
    lenis.scrollTo(el, { offset, duration: 1.4 })
  } else {
    const top = el.getBoundingClientRect().top + window.scrollY + offset
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

export function scrollToTop(immediate = false) {
  if (lenis) lenis.scrollTo(0, { immediate })
  else window.scrollTo({ top: 0, behavior: immediate ? 'auto' : 'smooth' })
}
