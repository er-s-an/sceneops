import { config } from 'dotenv'
import { readFile } from 'node:fs/promises'
import { getTask, meshPath } from './_lib/lux3d'

type VercelRequest = { query: Record<string, string | string[] | undefined> }
type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
  setHeader: (k: string, v: string) => void
  send: (body: Buffer | string) => void
  end: () => void
}

config({ path: '.env.local' })
config()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = Number(req.query.id || req.query.taskId)
    if (process.env.VERCEL) {
      const view = await getTask(id)
      if (view.glbUrl) {
        res.setHeader('Location', view.glbUrl)
        res.status(302).end()
        return
      }
    }
    const file = await meshPath(id)
    if (!file) {
      res.status(404).json({ error: 'GLB not ready' })
      return
    }
    res.setHeader('Content-Type', 'model/gltf-binary')
    const buf = await readFile(file)
    res.status(200).send(buf)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Mesh proxy failed'
    res.status(502).json({ error: message })
  }
}
