import { SAMPLES } from '../lib/samples'
import type { JobStatus, OpsBrief } from '../lib/types'

const STYLES: OpsBrief['style'][] = [
  'photorealistic',
  'cartoon',
  'anime',
  'hand_painted',
  'cyberpunk',
  'fantasy',
  'glass',
]

type Props = {
  brief: OpsBrief
  status: JobStatus
  taskId: number | null
  error: string | null
  busy: boolean
  onChange: (next: OpsBrief) => void
  onGenerate: () => void
}

const STATUS_COPY: Record<JobStatus, string> = {
  idle: 'The mark on the floor is empty.',
  submitting: 'Sending the brief to Lux3D.',
  polling: 'Lux3D is building the prop.',
  ready: 'The generated GLB is on the mark.',
  failed: 'Lux3D could not finish this task.',
}

export function BriefPanel({ brief, status, taskId, error, busy, onChange, onGenerate }: Props) {
  function onFile(file: File | undefined) {
    if (!file) {
      onChange({ ...brief, imageDataUrl: undefined, imageName: undefined })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      onChange({
        ...brief,
        imageName: file.name,
        imageDataUrl: String(reader.result || ''),
      })
    }
    reader.readAsDataURL(file)
  }

  return (
    <section className="dock dock-brief" aria-label="Work order">
      <header className="dock-head">
        <h2>Work order</h2>
        <p>Write the missing prop against this bay. Lux3D will place the real model on the marked pad.</p>
      </header>
      <div className="panel-body">
        <div className="samples" role="group" aria-label="Sample props">
          {SAMPLES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              data-testid={sample.testId}
              aria-pressed={brief.prompt === sample.prompt}
              onClick={() => onChange({ ...brief, prompt: sample.prompt })}
            >
              {sample.label}
            </button>
          ))}
        </div>

        <label className="field" htmlFor="brief-prompt">
          Missing prop
          <textarea
            id="brief-prompt"
            data-testid="brief-prompt"
            value={brief.prompt}
            onChange={(e) => onChange({ ...brief, prompt: e.target.value })}
            placeholder="Chrome stanchion, red velvet rope, game-jam booth…"
          />
        </label>

        <div className="row">
          <label className="field" htmlFor="brief-version">
            Lux3D version
            <select
              id="brief-version"
              data-testid="brief-version"
              value={brief.version}
              onChange={(e) => onChange({ ...brief, version: e.target.value as OpsBrief['version'] })}
            >
              <option value="G1-Turbo">G1-Turbo</option>
              <option value="G1">G1</option>
            </select>
          </label>
          <label className="field" htmlFor="brief-style">
            Style
            <select
              id="brief-style"
              data-testid="brief-style"
              value={brief.style}
              onChange={(e) => onChange({ ...brief, style: e.target.value as OpsBrief['style'] })}
            >
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field" htmlFor="brief-faces">
          Face budget
          <select
            id="brief-faces"
            value={brief.faceCount}
            onChange={(e) => onChange({ ...brief, faceCount: Number(e.target.value) })}
          >
            <option value={20000}>20,000 · fast booth check</option>
            <option value={40000}>40,000 · default</option>
            <option value={80000}>80,000 · closer look</option>
            <option value={200000}>200,000 · print-ish</option>
          </select>
        </label>

        <label className="field" htmlFor="brief-photo">
          Optional reference photo
          <span className="file">
            <input
              id="brief-photo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              data-testid="brief-photo"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            {brief.imageName || 'No reference attached'}
          </span>
        </label>

        <button
          className="primary"
          type="button"
          data-testid="brief-generate"
          disabled={busy || (!brief.prompt.trim() && !brief.imageDataUrl)}
          onClick={onGenerate}
        >
          {busy ? 'Calling Lux3D…' : 'Generate with Lux3D'}
        </button>

        <div className={`status ${status}`} data-testid="job-status" aria-live="polite">
          <b>{status}</b>
          <span>{STATUS_COPY[status]}</span>
          <span data-testid="job-task-id">{taskId ? `task ${taskId}` : 'no task yet'}</span>
          {error ? <span className="err">{error}</span> : null}
        </div>
      </div>
    </section>
  )
}
