import { config } from 'dotenv'
import express from 'express'
import { createReadStream } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createTask,
  getTask,
  healthPayload,
  latestReady,
  meshPath,
  type GenerateInput,
  type LuxStyle,
  type LuxVersion,
} from './lux3d.ts'

config({ path: '.env.local' })
config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PORT = Number(process.env.PORT || 8787)

function asVersion(v: unknown): LuxVersion {
  return v === 'G1' ? 'G1' : 'G1-Turbo'
}

function asStyle(v: unknown): LuxStyle {
  const s = String(v || 'photorealistic')
  const allowed: LuxStyle[] = [
    'photorealistic',
    'cartoon',
    'anime',
    'hand_painted',
    'cyberpunk',
    'fantasy',
    'glass',
  ]
  return (allowed as string[]).includes(s) ? (s as LuxStyle) : 'photorealistic'
}

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '12mb' }))

  app.get('/api/health', async (_req, res) => {
    const body = await healthPayload()
    res.status(body.ok ? 200 : 503).json(body)
  })

  app.post('/api/generate', async (req, res) => {
    try {
      const body = req.body as Partial<GenerateInput>
      const result = await createTask({
        prompt: String(body.prompt || ''),
        version: asVersion(body.version),
        style: asStyle(body.style),
        faceCount: Number(body.faceCount || 40000),
        imageDataUrl: body.imageDataUrl,
      })
      res.json(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generate failed'
      res.status(502).json({ error: message })
    }
  })

  app.get('/api/tasks/:id', async (req, res) => {
    try {
      const id = Number(req.params.id)
      if (!Number.isFinite(id)) {
        res.status(400).json({ error: 'task id must be a number' })
        return
      }
      const view = await getTask(id)
      res.json(view)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Task lookup failed'
      res.status(502).json({ error: message })
    }
  })

  app.get('/api/jobs/latest', async (_req, res) => {
    const view = await latestReady()
    if (!view) {
      res.status(404).json({ error: 'no ready job' })
      return
    }
    res.json(view)
  })

  app.get('/api/mesh/:id', async (req, res) => {
    try {
      const id = Number(req.params.id)
      if (process.env.VERCEL) {
        const view = await getTask(id)
        if (view.glbUrl) {
          res.redirect(302, view.glbUrl)
          return
        }
      }
      const file = await meshPath(id)
      if (!file) {
        res.status(404).json({ error: 'GLB not ready' })
        return
      }
      res.setHeader('Content-Type', 'model/gltf-binary')
      res.setHeader('Cache-Control', 'public, max-age=3600')
      createReadStream(file).pipe(res)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Mesh proxy failed'
      res.status(502).json({ error: message })
    }
  })

  if (process.env.NODE_ENV === 'production') {
    const dist = path.join(ROOT, 'dist')
    app.use(express.static(dist))
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        next()
        return
      }
      res.sendFile(path.join(dist, 'index.html'))
    })
  }

  return app
}

const app = createApp()
const host = process.env.HOST || '127.0.0.1'
app.listen(PORT, host, () => {
  console.log(`SceneOps API http://${host}:${PORT}`)
})

