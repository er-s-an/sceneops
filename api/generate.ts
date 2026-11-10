import { config } from 'dotenv'
import { createTask } from './_lib/lux3d.js'

type LuxVersion = 'G1' | 'G1-Turbo'
type LuxStyle =
  | 'photorealistic'
  | 'cartoon'
  | 'anime'
  | 'hand_painted'
  | 'cyberpunk'
  | 'fantasy'
  | 'glass'

type VercelRequest = { method?: string; body?: Record<string, unknown> }
type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
}

config({ path: '.env.local' })
config()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' })
    return
  }
  try {
    const body = req.body || {}
    const result = await createTask({
      prompt: String(body.prompt || ''),
      version: (body.version === 'G1' ? 'G1' : 'G1-Turbo') as LuxVersion,
      style: (body.style || 'photorealistic') as LuxStyle,
      faceCount: Number(body.faceCount || 40000),
      imageDataUrl: typeof body.imageDataUrl === 'string' ? body.imageDataUrl : undefined,
    })
    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generate failed'
    res.status(502).json({ error: message })
  }
}
