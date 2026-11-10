import { config } from 'dotenv'
import { healthPayload } from './_lib/lux3d'

type VercelRequest = { method?: string; body?: unknown; query: Record<string, string | string[] | undefined> }
type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
  setHeader: (k: string, v: string) => void
}

config({ path: '.env.local' })
config()

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const body = await healthPayload()
  res.status(body.ok ? 200 : 503).json(body)
}
