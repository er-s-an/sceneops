export type SlotId = 'stanchion' | 'sign' | 'table'

export type BoothSlot = {
  id: SlotId
  name: string
  missingLabel: string
  placedLabel: string
  detail: string
  position: [number, number, number]
  targetHeight: number
  cameraPosition: [number, number, number]
  cameraTarget: [number, number, number]
}

export const SLOTS: Record<SlotId, BoothSlot> = {
  stanchion: {
    id: 'stanchion',
    name: 'Queue stanchion',
    missingLabel: 'Missing prop',
    placedLabel: 'Placed on the mark',
    detail: 'Chrome stanchion · red velvet rope · needed before 16:00',
    position: [1.45, 0, 1.9],
    targetHeight: 0.95,
    cameraPosition: [4.35, 2.35, 4.85],
    cameraTarget: [0.85, 0.45, 1.05],
  },
  sign: {
    id: 'sign',
    name: 'A2 sign stand',
    missingLabel: 'Missing prop',
    placedLabel: 'Placed on the mark',
    detail: 'Black metal A2 stand for aisle wayfinding · needed at the booth edge',
    position: [-1.7, 0, 2.35],
    targetHeight: 1.35,
    cameraPosition: [3.6, 2.7, 5.6],
    cameraTarget: [-0.5, 0.7, 0.4],
  },
  table: {
    id: 'table',
    name: 'Demo table',
    missingLabel: 'Missing prop',
    placedLabel: 'Placed on the mark',
    detail: 'Oak demo table, 120 cm wide · the play surface for this bay',
    position: [0, 0, -0.55],
    targetHeight: 0.76,
    cameraPosition: [3.8, 2.6, 4.6],
    cameraTarget: [0, 0.5, -0.2],
  },
}

export const DEFAULT_SLOT: SlotId = 'stanchion'

export const BAY = {
  name: 'Bay 14',
  show: 'IndieForge',
  event: 'game-jam booth',
  doors: '16:00',
}

export function slotFromPrompt(prompt: string): SlotId {
  const text = prompt.toLowerCase()
  if (text.includes('table')) return 'table'
  if (text.includes('poster') || text.includes('sign') || text.includes('stand')) return 'sign'
  if (text.includes('stanchion') || text.includes('rope') || text.includes('queue')) return 'stanchion'
  return DEFAULT_SLOT
}
