import { useEffect, useRef } from 'react'

interface Ember {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  life: number
  max: number
  hue: number
  phase: number
}

interface EmberCanvasProps {
  className?: string
  /** Partikel pro 10.000 px² */
  density?: number
  intensity?: number
}

/**
 * Aufsteigende Glut – wie Funken über dem Grill.
 * Reagiert auf den Cursor, pausiert außerhalb des Viewports und im Hintergrund-Tab.
 */
export function EmberCanvas({ className, density = 1.1, intensity = 1 }: EmberCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let dpr = 1
    let embers: Ember[] = []
    let raf = 0
    let visible = true
    const mouse = { x: -9999, y: -9999 }

    const spawn = (initial = false): Ember => {
      const max = 260 + Math.random() * 420
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : h + 10 + Math.random() * 40,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(0.35 + Math.random() * 1.1),
        r: 0.5 + Math.random() * Math.random() * 2.4,
        life: initial ? Math.random() * max : 0,
        max,
        hue: 22 + Math.random() * 24,
        phase: Math.random() * Math.PI * 2,
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const target = Math.min(220, Math.round(((w * h) / 10000) * density * (reduced ? 0.35 : 1)))
      embers = Array.from({ length: target }, () => spawn(true))
    }

    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i]
        e.life += reduced ? 0.4 : 1
        e.phase += 0.03
        // Seitliches Flackern + leichter Auftrieb
        e.x += e.vx + Math.sin(e.phase) * 0.35
        e.y += e.vy * (reduced ? 0.3 : 1)

        // Cursor drückt die Funken sanft zur Seite
        const dx = e.x - mouse.x
        const dy = e.y - mouse.y
        const dist2 = dx * dx + dy * dy
        if (dist2 < 16000) {
          const f = (1 - dist2 / 16000) * 1.6
          const d = Math.sqrt(dist2) || 1
          e.x += (dx / d) * f
          e.y += (dy / d) * f
        }

        const t = e.life / e.max
        if (t >= 1 || e.y < -20) {
          embers[i] = spawn()
          continue
        }
        const fade = t < 0.1 ? t / 0.1 : 1 - (t - 0.1) / 0.9
        const flicker = 0.75 + Math.sin(e.phase * 3) * 0.25
        const alpha = Math.max(0, fade * flicker * intensity)
        const r = e.r * (1 + (1 - t) * 0.4)

        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r * 6)
        g.addColorStop(0, `hsla(${e.hue + 12}, 100%, 78%, ${alpha})`)
        g.addColorStop(0.25, `hsla(${e.hue}, 95%, 58%, ${alpha * 0.55})`)
        g.addColorStop(1, `hsla(${e.hue - 8}, 90%, 40%, 0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(e.x, e.y, r * 6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(loop)
    }

    const loop = () => {
      if (!visible || document.hidden) {
        raf = 0
        return
      }
      tick()
    }

    const start = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop)
    }

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const onLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      start()
    })
    io.observe(canvas)
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    start()

    window.addEventListener('pointermove', onPointer, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    document.addEventListener('visibilitychange', start)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', start)
    }
  }, [density, intensity])

  return <canvas ref={ref} className={className} aria-hidden="true" />
}
