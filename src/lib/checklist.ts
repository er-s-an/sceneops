import type { ChecklistState } from './types'

const KEY = 'sceneops.checklist.v1'

function readAll(): Record<string, ChecklistState> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, ChecklistState>
  } catch {
    return {}
  }
}

export function loadChecklist(taskId: number | null): ChecklistState {
  if (!taskId) return { placement: false, collision: false, printExport: false }
  return (
    readAll()[String(taskId)] || {
      placement: false,
      collision: false,
      printExport: false,
    }
  )
}

export function saveChecklist(taskId: number, state: ChecklistState): void {
  const all = readAll()
  all[String(taskId)] = state
  localStorage.setItem(KEY, JSON.stringify(all))
}
