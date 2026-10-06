/**
 * Produktionsserver: liefert den Vite-Build aus /dist aus und stellt die Bestell-API bereit.
 *
 *   npm run build
 *   STAFF_PIN=4711 PORT=3000 npm start
 */
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApi } from './api.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = join(root, 'dist')
const port = Number(process.env.PORT ?? 3000)
const staffPin = process.env.STAFF_PIN ?? '1234'

if (!existsSync(join(dist, 'index.html'))) {
  console.error('[sofra] Kein Build gefunden – bitte zuerst "npm run build" ausführen.')
  process.exit(1)
}
if (!process.env.STAFF_PIN) {
  console.warn('[sofra] Achtung: STAFF_PIN ist nicht gesetzt – Standard-PIN 1234 aktiv. Bitte für den Betrieb ändern!')
}

const api = createApi({ dev: false, dataDir: join(root, 'server', 'data'), staffPin })

const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

createServer(async (req, res) => {
  if (await api(req, res)) return

  const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)
  let file = normalize(join(dist, pathname))
  if (!file.startsWith(dist + sep) && file !== dist) {
    res.statusCode = 403
    res.end()
    return
  }
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(dist, 'index.html') // SPA-Routing

  res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream')
  if (file.includes(`${sep}assets${sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  createReadStream(file).pipe(res)
}).listen(port, () => {
  console.log(`[sofra] läuft auf http://localhost:${port}  ·  Küche: http://localhost:${port}/kueche`)
})
