import { meshUrl } from '../lib/api'
import type { ChecklistState } from '../lib/types'

type Props = {
  taskId: number | null
  ready: boolean
  checklist: ChecklistState
  onChange: (next: ChecklistState) => void
}

export function OpsChecklist({ taskId, ready, checklist, onChange }: Props) {
  return (
    <section className="panel">
      <h2>Ops checklist</h2>
      <div className="panel-body">
        <label className="check">
          <input
            data-testid="checklist-placement"
            type="checkbox"
            checked={checklist.placement}
            disabled={!ready}
            onChange={(e) => onChange({ ...checklist, placement: e.target.checked })}
          />
          <div>
            <b>Placement</b>
            <span>Sit the prop on the booth floor. Origin is world +Y up, mesh bottom on y = 0.</span>
          </div>
        </label>
        <label className="check">
          <input
            data-testid="checklist-collision"
            type="checkbox"
            checked={checklist.collision}
            disabled={!ready}
            onChange={(e) => onChange({ ...checklist, collision: e.target.checked })}
          />
          <div>
            <b>Collision</b>
            <span>Review the bounding envelope before a player or guest can walk through it.</span>
          </div>
        </label>
        <label className="check">
          <input
            data-testid="checklist-print-export"
            type="checkbox"
            checked={checklist.printExport}
            disabled={!ready}
            onChange={(e) => onChange({ ...checklist, printExport: e.target.checked })}
          />
          <div>
            <b>Print / export</b>
            <span>GLB for the scene. Face budget is the Lux3D request, not a measured triangle count.</span>
          </div>
        </label>

        <a
          className="ghost"
          data-testid="prop-download"
          href={taskId && ready ? meshUrl(taskId) : undefined}
          download={taskId ? `sceneops-${taskId}.glb` : undefined}
          aria-disabled={!ready}
          style={{ textAlign: 'center', textDecoration: 'none' }}
        >
          Download GLB
        </a>

        <p className="notes">
          Lux3D result URLs expire in about two hours. SceneOps caches the GLB on this server so the
          board keeps working after that window.
        </p>
      </div>
    </section>
  )
}
