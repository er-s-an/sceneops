import type { OpsBrief, TaskView } from './types'

export async function fetchHealth(): Promise<{ ok: boolean; hasKey: boolean; region: string }> {
  const res = await fetch('/api/health')
  return res.json()
}

export async function startGenerate(brief: OpsBrief): Promise<{ taskId: number; mode: string }> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: brief.prompt,
      version: brief.version,
      style: brief.style,
      faceCount: brief.faceCount,
      imageDataUrl: brief.imageDataUrl,
    }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || 'Lux3D create failed')
  return body
}

export async function fetchTask(taskId: number): Promise<TaskView> {
  const res = await fetch(`/api/tasks/${taskId}`)
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || 'Lux3D poll failed')
  return body
}

export async function fetchLatest(): Promise<TaskView | null> {
  const res = await fetch('/api/jobs/latest')
  if (res.status === 404) return null
  if (!res.ok) return null
  return res.json()
}

export function meshUrl(taskId: number): string {
  return `/api/mesh/${taskId}`
}
