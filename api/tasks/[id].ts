import { config } from 'dotenv'
import { getTask } from '../_lib/lux3d'

type VercelRequest = { query: Record<string, string | string[] | undefined> }
type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
}

config({ path: '.env.local' })
config()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = Number(req.query.id)
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
}
