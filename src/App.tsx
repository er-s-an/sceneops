import { useEffect, useMemo, useState } from 'react'
import { BriefPanel } from './components/BriefPanel'
import { OpsChecklist } from './components/OpsChecklist'
import { SceneBoard } from './components/SceneBoard'
import { fetchHealth, fetchLatest, fetchTask, meshUrl, startGenerate } from './lib/api'
import { BAY, SLOTS, slotFromPrompt } from './lib/booth'
import { loadChecklist, saveChecklist } from './lib/checklist'
import { SAMPLES } from './lib/samples'
import type { ChecklistState, JobStatus, OpsBrief, TaskView } from './lib/types'
import './App.css'

const idleBrief = (): OpsBrief => ({
  prompt: SAMPLES[0].prompt,
  version: 'G1-Turbo',
  style: 'photorealistic',
  faceCount: 40000,
})

export default function App() {
  const [brief, setBrief] = useState<OpsBrief>(idleBrief)
  const [status, setStatus] = useState<JobStatus>('idle')
  const [taskId, setTaskId] = useState<number | null>(null)
  const [task, setTask] = useState<TaskView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<{ ok: boolean; hasKey: boolean } | null>(null)
  const [checklist, setChecklist] = useState<ChecklistState>(loadChecklist(null))

  const busy = status === 'submitting' || status === 'polling'
  const slot = SLOTS[slotFromPrompt(brief.prompt)]
  const skipLatest = new URLSearchParams(window.location.search).get('scene') === 'open'
  const meshSrc = useMemo(() => {
    if (status !== 'ready' || !taskId) return null
    return meshUrl(taskId)
  }, [status, taskId])

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => setHealth({ ok: false, hasKey: false }))
    if (skipLatest) return
    fetchLatest()
      .then((latest) => {
        if (!latest) return
        setTask(latest)
        setTaskId(latest.taskId)
        setStatus('ready')
        setBrief((prev) => ({
          ...prev,
          prompt: latest.prompt || prev.prompt,
          version: latest.version === 'G1' ? 'G1' : 'G1-Turbo',
          style: (latest.style as OpsBrief['style']) || prev.style,
          faceCount: latest.faceCount || prev.faceCount,
        }))
        setChecklist(loadChecklist(latest.taskId))
      })
      .catch(() => undefined)
  }, [skipLatest])

  useEffect(() => {
    if (status !== 'polling' || !taskId) return
    let stop = false
    const tick = async () => {
      try {
        const view = await fetchTask(taskId)
        if (stop) return
        setTask(view)
        if (view.status === 3) {
          setStatus('ready')
          setChecklist(loadChecklist(taskId))
          return
        }
        if (view.status === 4 || view.status === 6) {
          setStatus('failed')
          setError(view.error || 'Lux3D did not finish this task.')
        }
      } catch (err) {
        if (!stop) setError(err instanceof Error ? err.message : 'Poll failed')
      }
    }
    tick()
    const id = window.setInterval(tick, 4000)
    return () => {
      stop = true
      window.clearInterval(id)
    }
  }, [status, taskId])

  async function onGenerate() {
    setError(null)
    setStatus('submitting')
    try {
      const created = await startGenerate(brief)
      setTaskId(created.taskId)
      setStatus('polling')
    } catch (err) {
      setStatus('failed')
      setError(err instanceof Error ? err.message : 'Create failed')
    }
  }

  function onChecklist(next: ChecklistState) {
    setChecklist(next)
    if (taskId) saveChecklist(taskId, next)
  }

  return (
    <div className="shell">
      <SceneBoard
        meshSrc={meshSrc}
        taskId={taskId}
        faceCount={task?.faceCount || brief.faceCount}
        showCollision={checklist.collision}
        status={status}
        slot={slot}
      />

      <header className="callsheet">
        <div className="brand">
          <p className="wordmark">SceneOps</p>
          <h1>
            {BAY.name} · {BAY.show} · doors {BAY.doors}
          </h1>
        </div>
        <p className={health?.hasKey ? 'health' : 'health warn'} role="status">
          {health?.hasKey ? 'Lux3D connected' : 'API key missing'}
        </p>
      </header>

      <BriefPanel
        brief={brief}
        status={status}
        taskId={taskId}
        error={error}
        busy={busy}
        onChange={setBrief}
        onGenerate={onGenerate}
      />
      <OpsChecklist
        taskId={taskId}
        ready={status === 'ready'}
        checklist={checklist}
        onChange={onChecklist}
      />
    </div>
  )
}
