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
    <section className="panel">
      <h2>Ops brief</h2>
      <div className="panel-body">
        <div className="samples">
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

        <label className="field">
          Prompt
          <textarea
            data-testid="brief-prompt"
            value={brief.prompt}
            onChange={(e) => onChange({ ...brief, prompt: e.target.value })}
            placeholder="Chrome stanchion, red rope, game-jam booth…"
          />
        </label>

        <div className="row">
          <label className="field">
            Lux3D version
            <select
              data-testid="brief-version"
              value={brief.version}
              onChange={(e) => onChange({ ...brief, version: e.target.value as OpsBrief['version'] })}
            >
              <option value="G1-Turbo">G1-Turbo</option>
              <option value="G1">G1</option>
            </select>
          </label>
          <label className="field">
            Style
            <select
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

        <label className="field">
          Face budget
          <select
            value={brief.faceCount}
            onChange={(e) => onChange({ ...brief, faceCount: Number(e.target.value) })}
          >
            <option value={20000}>20k · fast booth check</option>
            <option value={40000}>40k · default</option>
            <option value={80000}>80k · closer look</option>
            <option value={200000}>200k · print-ish</option>
          </select>
        </label>

        <label className="field">
          Optional photo
          <span className="file">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              data-testid="brief-photo"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            {brief.imageName || 'No reference'}
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
          <span data-testid="job-task-id">{taskId ? `task ${taskId}` : 'no task yet'}</span>
          {error ? <span className="err">{error}</span> : null}
        </div>
      </div>
    </section>
  )
}
