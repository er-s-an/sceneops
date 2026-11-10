export type JobStatus = 'idle' | 'submitting' | 'polling' | 'ready' | 'failed'

export type LuxVersion = 'G1' | 'G1-Turbo'
export type LuxStyle =
  | 'photorealistic'
  | 'cartoon'
  | 'anime'
  | 'hand_painted'
  | 'cyberpunk'
  | 'fantasy'
  | 'glass'

export type OpsBrief = {
  prompt: string
  version: LuxVersion
  style: LuxStyle
  faceCount: number
  imageName?: string
  imageDataUrl?: string
}

export type TaskView = {
  taskId: number
  status: number
  statusLabel: 'init' | 'running' | 'ready' | 'failed' | 'canceled' | 'unknown'
  glbUrl: string | null
  glbProxyUrl: string | null
  outputs: { content: string }[]
  prompt?: string
  version?: string
  style?: string
  faceCount?: number
  error?: string
  generatedBy: 'Lux3D'
}

export type ChecklistState = {
  placement: boolean
  collision: boolean
  printExport: boolean
}

export type SampleBrief = {
  id: string
  label: string
  prompt: string
  testId: string
}
