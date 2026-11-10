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
    <section className="dock dock-ops" aria-label="Floor checklist">
      <header className="dock-head">
        <h2>On this floor</h2>
        <p>Check the prop in place, then take the GLB for the live build.</p>
      </header>
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
            <span>The prop sits on the marked pad, bottom on the booth floor.</span>
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
            <span>Review the bounding envelope before a guest can walk through it.</span>
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
            <span>Download the GLB. Face budget is the Lux3D request, not a measured count.</span>
          </div>
        </label>

        <a
          className="ghost"
          data-testid="prop-download"
          href={taskId && ready ? meshUrl(taskId) : undefined}
          download={taskId ? `sceneops-${taskId}.glb` : undefined}
          aria-disabled={!ready}
        >
          Download GLB
        </a>

        <p className="notes">
          Lux3D result URLs expire in about two hours. SceneOps caches the file so this bay stays
          usable after that window.
        </p>
      </div>
    </section>
  )
}
