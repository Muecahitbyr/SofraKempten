import { motion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'
import type { Art } from '../../data/menu'

/**
 * Feine Line-Art im Stil der gedruckten Sofra-Karte.
 * Jede Linie zeichnet sich beim Hineinscrollen selbst.
 */

const ease = [0.22, 1, 0.36, 1] as const

const draw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: { pathLength: { duration: 1.6, ease }, opacity: { duration: 0.25 } },
  },
}

const P = ({ d }: { d: string }) => <motion.path d={d} variants={draw} />
const E = ({ cx, cy, rx, ry, r = 0 }: { cx: number; cy: number; rx: number; ry: number; r?: number }) => (
  <motion.ellipse cx={cx} cy={cy} rx={rx} ry={ry} variants={draw} transform={r ? `rotate(${r} ${cx} ${cy})` : undefined} />
)
const C = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => <motion.circle cx={cx} cy={cy} r={r} variants={draw} />

/** Fleischstücke entlang eines Spießes als linsenförmige Segmente */
function skewerMeat(x1: number, y1: number, x2: number, y2: number, pieces: number, h: number, from = 0.22, to = 0.88) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  const ux = dx / len
  const uy = dy / len
  const nx = -uy
  const ny = ux
  const at = (t: number) => [x1 + dx * t, y1 + dy * t]
  const step = (to - from) / pieces
  const f = (n: number) => n.toFixed(1)
  let d = ''
  for (let i = 0; i < pieces; i++) {
    const [ax, ay] = at(from + step * i + step * 0.06)
    const [bx, by] = at(from + step * (i + 1) - step * 0.06)
    const [mx, my] = at(from + step * (i + 0.5))
    const k = h * (0.85 + ((i * 37) % 5) / 14)
    d += `M${f(ax + nx * k * 0.7)} ${f(ay + ny * k * 0.7)} Q${f(mx + nx * k * 1.5)} ${f(my + ny * k * 1.5)} ${f(bx + nx * k * 0.7)} ${f(by + ny * k * 0.7)} `
    d += `L${f(bx - nx * k * 0.7)} ${f(by - ny * k * 0.7)} Q${f(mx - nx * k * 1.5)} ${f(my - ny * k * 1.5)} ${f(ax - nx * k * 0.7)} ${f(ay - ny * k * 0.7)} Z `
  }
  return d
}

const steam = (x: number, y: number, s = 1) =>
  `M${x} ${y} c${-6 * s} ${-8 * s} ${6 * s} ${-14 * s} 0 ${-22 * s} c${-6 * s} ${-8 * s} ${6 * s} ${-14 * s} 0 ${-22 * s}`

const drawings: Record<Art, () => ReactNode> = {
  cag: () => (
    <>
      <E cx={100} cy={138} rx={84} ry={26} />
      <E cx={100} cy={136} rx={66} ry={18} />
      <P d="M28 120 L176 92" />
      <P d={skewerMeat(28, 120, 176, 92, 7, 5.5)} />
      <P d="M34 138 L178 116" />
      <P d={skewerMeat(34, 138, 178, 116, 7, 5)} />
      <C cx={24} cy={121} r={3} />
      <C cx={30} cy={139} r={3} />
      <P d="M140 146 a14 14 0 0 0 28 -4 z" />
      <P d="M154 144 l0 -3 M147 145 l4 -4 M161 143 l-3 -3" />
      <P d="M52 150 q6 -6 12 0 q6 6 12 0" />
      <P d={steam(78, 78)} />
      <P d={steam(100, 72, 1.15)} />
      <P d={steam(122, 78)} />
    </>
  ),
  doner: () => (
    <>
      <P d="M100 14 L100 186" />
      <E cx={100} cy={40} rx={32} ry={6} />
      <P d="M68 40 C66 80 76 130 84 160 L116 160 C124 130 134 80 132 40" />
      {Array.from({ length: 9 }, (_, i) => {
        const y = 52 + i * 12
        const hw = 31 - (i / 9) * 14
        return <P key={i} d={`M${100 - hw} ${y} q${hw * 0.5} 5 ${hw} 1 q${hw * 0.5} -4 ${hw} 2`} />
      })}
      <E cx={100} cy={162} rx={20} ry={4} />
      <E cx={100} cy={186} rx={44} ry={7} />
      <P d="M150 60 L176 150 L168 152 Z" />
      <P d="M170 152 L174 170" />
    </>
  ),
  kofte: () => (
    <>
      <E cx={100} cy={128} rx={84} ry={30} />
      <E cx={100} cy={126} rx={68} ry={22} />
      <E cx={70} cy={120} rx={20} ry={9} r={-12} />
      <E cx={104} cy={114} rx={20} ry={9} r={-6} />
      <E cx={92} cy={136} rx={20} ry={9} r={4} />
      <E cx={128} cy={130} rx={20} ry={9} r={-10} />
      <P d="M62 116 l6 8 M72 114 l6 8 M96 110 l6 8 M106 108 l6 8 M84 132 l6 8 M94 130 l6 8 M120 126 l6 8 M130 124 l6 8" />
      <P d="M138 104 c18 -6 32 -2 36 12 c-10 -6 -22 -6 -36 -2 z" />
      <P d="M174 116 c4 -6 2 -12 -2 -14" />
      <P d={steam(84, 90)} />
      <P d={steam(112, 86)} />
    </>
  ),
  falafel: () => (
    <>
      <E cx={100} cy={132} rx={80} ry={26} />
      <C cx={72} cy={118} r={16} />
      <C cx={104} cy={112} r={16} />
      <C cx={134} cy={122} r={16} />
      <C cx={90} cy={138} r={14} />
      <P d="M66 112 l3 3 M76 120 l3 3 M100 106 l3 3 M110 116 l3 3 M130 116 l3 3 M140 126 l3 3" />
    </>
  ),
  pizza: () => (
    <>
      <C cx={100} cy={104} r={78} />
      <C cx={100} cy={104} r={64} />
      <P d="M100 40 L100 168 M36 104 L164 104 M55 59 L145 149 M145 59 L55 149" />
      <C cx={78} cy={78} r={8} />
      <C cx={126} cy={84} r={8} />
      <C cx={84} cy={128} r={8} />
      <C cx={124} cy={128} r={8} />
      <P d="M104 84 c6 -6 12 -4 10 2 c-4 4 -8 2 -10 -2 z" />
      <P d="M64 102 c6 -6 12 -4 10 2 c-4 4 -8 2 -10 -2 z" />
    </>
  ),
  pide: () => (
    <>
      <P d="M14 108 C50 64 150 64 186 108 C150 150 50 150 14 108 Z" />
      <P d="M40 108 C66 84 134 84 160 108 C134 130 66 130 40 108 Z" />
      <P d="M14 108 c-6 -4 -8 -10 -4 -14 M186 108 c6 -4 8 -10 4 -14" />
      {[
        [62, 104], [76, 112], [92, 100], [106, 114], [120, 102], [136, 110], [84, 118], [114, 96], [148, 106], [54, 110],
      ].map(([x, y], i) => (
        <P key={i} d={`M${x} ${y} l4 -2 l2 4 z`} />
      ))}
      <P d={steam(80, 70, 0.8)} />
      <P d={steam(120, 70, 0.8)} />
    </>
  ),
  soup: () => (
    <>
      <E cx={100} cy={104} rx={70} ry={16} />
      <E cx={100} cy={104} rx={58} ry={11} />
      <P d="M30 104 C34 156 70 176 100 176 C130 176 166 156 170 104" />
      <P d="M76 176 L124 176 L118 184 L82 184 Z" />
      <P d="M138 98 L184 56" />
      <E cx={136} cy={104} rx={12} ry={5} r={-40} />
      <P d="M54 102 q10 -4 20 0 M88 106 q8 -4 16 0" />
      <P d={steam(84, 80)} />
      <P d={steam(106, 76, 1.1)} />
      <P d="M22 140 a16 16 0 0 1 22 -16 z" />
    </>
  ),
  salad: () => (
    <>
      <E cx={100} cy={110} rx={74} ry={18} />
      <P d="M26 110 C30 156 66 176 100 176 C134 176 170 156 174 110" />
      <P d="M50 106 c4 -20 22 -26 32 -10 c6 -16 28 -18 34 0 c10 -14 30 -8 32 10" />
      <C cx={74} cy={104} r={7} />
      <C cx={118} cy={102} r={7} />
      <P d="M92 96 c4 -6 10 -6 12 0" />
    </>
  ),
  mezze: () => (
    <>
      <E cx={100} cy={136} rx={88} ry={28} />
      <E cx={62} cy={118} rx={28} ry={9} />
      <P d="M34 118 C36 138 88 138 90 118" />
      <E cx={138} cy={118} rx={28} ry={9} />
      <P d="M110 118 C112 138 164 138 166 118" />
      <E cx={100} cy={146} rx={28} ry={9} />
      <P d="M72 146 C74 166 126 166 128 146" />
      <P d="M50 116 q12 -6 24 0 M126 116 q12 -6 24 0 M88 144 q12 -6 24 0" />
      <P d="M120 70 c20 -18 50 -12 56 6 c-16 -8 -38 -6 -56 -6 z" />
      <C cx={150} cy={66} r={2} />
      <C cx={160} cy={70} r={2} />
    </>
  ),
  fries: () => (
    <>
      <P d="M58 92 L142 92 L130 182 L70 182 Z" />
      <P d="M58 92 C80 112 120 112 142 92" />
      {[66, 78, 90, 102, 114, 126, 134].map((x, i) => (
        <P key={x} d={`M${x} ${100 - (i % 2) * 2} L${x + (i % 3) * 3 - 3} ${30 + ((i * 17) % 28)} l7 0 L${x + 7} ${100 - (i % 2) * 2}`} />
      ))}
    </>
  ),
  baklava: () => (
    <>
      <E cx={100} cy={146} rx={86} ry={22} />
      {[
        [60, 118], [100, 110], [140, 118], [80, 140], [120, 140],
      ].map(([x, y], i) => (
        <g key={i}>
          <P d={`M${x} ${y - 24} L${x + 22} ${y} L${x} ${y + 12} L${x - 22} ${y} Z`} />
          <P d={`M${x - 16} ${y + 2} L${x} ${y + 8} L${x + 16} ${y + 2} M${x - 10} ${y - 6} L${x} ${y} L${x + 10} ${y - 6}`} />
          <C cx={x} cy={y - 10} r={2.5} />
        </g>
      ))}
    </>
  ),
  kunefe: () => (
    <>
      <E cx={100} cy={130} rx={84} ry={28} />
      <E cx={100} cy={118} rx={64} ry={20} />
      <P d="M36 118 L36 130 C36 146 164 146 164 130 L164 118" />
      {Array.from({ length: 12 }, (_, i) => {
        const x = 52 + i * 8
        return <P key={i} d={`M${x} ${110 + (i % 3) * 4} q4 -4 8 0`} />
      })}
      <P d="M100 118 C100 90 112 70 128 62" />
      <P d="M88 112 c2 -2 4 -2 6 0 M110 110 c2 -2 4 -2 6 0 M76 120 c2 -2 4 -2 6 0 M122 120 c2 -2 4 -2 6 0" />
    </>
  ),
  drink: () => (
    <>
      <P d="M56 186 L56 92 C56 78 66 70 66 56 L66 30 L82 30 L82 56 C82 70 92 78 92 92 L92 186 Z" />
      <P d="M64 30 L84 30 L84 22 L64 22 Z" />
      <P d="M56 120 L92 120 M56 150 L92 150" />
      <P d="M110 96 L118 186 L158 186 L166 96 Z" />
      <P d="M114 130 L162 130" />
      <P d="M146 186 L134 64 L150 40" />
      <P d="M122 150 l8 8 M140 160 l8 -8 M126 172 l10 0" />
    </>
  ),
  coffee: () => (
    <>
      <E cx={100} cy={160} rx={70} ry={14} />
      <E cx={100} cy={158} rx={40} ry={7} />
      <P d="M56 96 L144 96 C144 132 128 154 100 154 C72 154 56 132 56 96 Z" />
      <E cx={100} cy={96} rx={44} ry={8} />
      <P d="M144 108 c22 -4 26 26 -4 26" />
      <P d={steam(86, 80)} />
      <P d={steam(108, 76, 1.1)} />
    </>
  ),
}

interface FoodArtProps {
  kind: Art
  className?: string
  /** false = sofort vollständig zeichnen (z. B. für kleine Icons) */
  animate?: boolean
  strokeWidth?: number
}

export function FoodArt({ kind, className, animate = true, strokeWidth = 1.4 }: FoodArtProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      initial={animate ? 'hidden' : 'show'}
      whileInView="show"
      viewport={{ once: true, margin: '-10% 0px' }}
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
    >
      {drawings[kind]()}
    </motion.svg>
  )
}
