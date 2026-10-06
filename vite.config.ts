import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { createApi } from './server/api.ts'

/** Hängt die Bestell-API direkt an den Vite-Dev-Server – ein Befehl, ein Port. */
function sofraApi(): Plugin {
  return {
    name: 'sofra-api',
    configureServer(server) {
      const api = createApi({ dev: true, dataDir: 'server/data', staffPin: process.env.STAFF_PIN ?? '1234' })
      server.middlewares.use((req, res, next) => {
        api(req, res)
          .then((handled) => !handled && next())
          .catch(next)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), sofraApi()],
  server: {
    port: 5173,
    open: true,
    watch: { ignored: ['**/server/data/**'] },
  },
})
