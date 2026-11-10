import { config } from 'dotenv'
import { latestReady } from '../../server/lux3d.ts'

type VercelRequest = unknown
type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
}

config({ path: '.env.local' })
config()

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const view = await latestReady()
  if (!view) {
    res.status(404).json({ error: 'no ready job' })
    return
  }
  res.json(view)
}
