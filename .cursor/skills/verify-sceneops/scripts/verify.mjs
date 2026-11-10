#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../../../..')
const CACHE = join(ROOT, '.cache/verify')
const PIDS = join(CACHE, 'pids.json')
const ARTIFACTS_ROOT = join(ROOT, 'artifacts/verify')
const PROOF = join(ROOT, 'docs/proof')
const UI = 'http://127.0.0.1:5273'
const API = 'http://127.0.0.1:8787'
const CMD = process.argv[2] || 'happy-path'

function log(msg) {
  console.log(msg)
}

async function jsonGet(url) {
  const res = await fetch(url)
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = { raw: text.slice(0, 200) }
  }
  return { ok: res.ok, status: res.status, body }
}

function redact(value) {
  return JSON.stringify(value).replace(/[A-Za-z0-9+/]{20,}/g, '[redacted]')
}

async function doctor() {
  const health = await jsonGet(`${API}/api/health`).catch((err) => ({
    ok: false,
    status: 0,
    body: { error: String(err) },
  }))
  const ui = await fetch(UI)
    .then(async (res) => ({ status: res.status, html: await res.text() }))
    .catch((err) => ({ status: 0, html: String(err) }))

  const checks = []
  checks.push({ name: 'api-health', pass: health.ok && health.body?.ok === true, detail: redact(health.body) })
  checks.push({ name: 'has-key', pass: health.body?.hasKey === true, detail: 'hasKey flag only' })
  checks.push({ name: 'region', pass: health.body?.region === 'com', detail: health.body?.region })
  checks.push({ name: 'ui-200', pass: ui.status === 200, detail: `http ${ui.status}` })
  checks.push({
    name: 'title',
    pass: typeof ui.html === 'string' && ui.html.includes('SceneOps'),
    detail: 'index title',
  })
  checks.push({
    name: 'root',
    pass: typeof ui.html === 'string' && ui.html.includes('id="root"'),
    detail: 'react mount',
  })

  const failed = checks.filter((c) => !c.pass)
  for (const c of checks) {
    log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name} ${c.detail || ''}`)
  }
  if (failed.length) {
    const err = new Error(`doctor failed: ${failed.map((f) => f.name).join(', ')}`)
    err.checks = checks
    throw err
  }
  return { health: health.body, checks }
}

function spawnLogged(command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd: ROOT,
    env: { ...process.env, ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stdout.on('data', (buf) => process.stdout.write(`[${command}] ${buf}`))
  child.stderr.on('data', (buf) => process.stderr.write(`[${command}] ${buf}`))
  return child
}

async function waitFor(fn, timeoutMs, label) {
  const start = Date.now()
  let last
  while (Date.now() - start < timeoutMs) {
    try {
      const value = await fn()
      if (value) return value
    } catch (err) {
      last = err
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error(`${label} timed out after ${timeoutMs}ms ${last ? String(last) : ''}`)
}

async function launch() {
  await mkdir(CACHE, { recursive: true })
  try {
    await doctor()
    log('already ready, reusing servers')
    return JSON.parse(await readFile(PIDS, 'utf8').catch(() => '{"reused":true}'))
  } catch {
    // start
  }

  const api = spawnLogged('npx', ['tsx', 'server/index.ts'])
  const web = spawnLogged('npx', ['vite', '--host', '127.0.0.1', '--port', '5273', '--strictPort'])
  const pids = { api: api.pid, web: web.pid, startedAt: Date.now() }
  await writeFile(PIDS, JSON.stringify(pids, null, 2))
  await waitFor(async () => {
    await doctor()
    return true
  }, 60_000, 'launch')
  log(`launched api=${api.pid} web=${web.pid}`)
  return pids
}

async function cleanup() {
  let pids
  try {
    pids = JSON.parse(await readFile(PIDS, 'utf8'))
  } catch {
    log('no pids file, nothing to kill')
    return
  }
  for (const key of ['api', 'web']) {
    const pid = pids[key]
    if (!pid) continue
    try {
      process.kill(pid, 'SIGTERM')
      log(`sent SIGTERM to ${key} pid ${pid}`)
    } catch (err) {
      log(`pid ${pid} already gone (${err.code || err.message})`)
    }
  }
}

async function copyProof(from, name) {
  await mkdir(PROOF, { recursive: true })
  const dest = join(PROOF, name)
  const bytes = await readFile(from)
  await writeFile(dest, bytes)
  return dest
}

async function happyPath() {
  await mkdir(CACHE, { recursive: true })
  try {
    await doctor()
  } catch {
    await launch()
  }

  const runId = new Date().toISOString().replace(/[:.]/g, '-')
  const outDir = join(ARTIFACTS_ROOT, runId)
  await mkdir(outDir, { recursive: true })
  await mkdir(PROOF, { recursive: true })

  const health = await jsonGet(`${API}/api/health`)
  await writeFile(join(outDir, 'health.json'), JSON.stringify(health.body, null, 2))

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--use-gl=angle', '--ignore-gpu-blocklist', '--window-size=1440,900'],
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.setDefaultTimeout(20_000)

  try {
    await page.goto(UI, { waitUntil: 'domcontentloaded' })
    await page.getByTestId('brief-sample-stanchion').click()
    await page.getByTestId('brief-version').selectOption('G1-Turbo')
    const prompt = await page.getByTestId('brief-prompt').inputValue()
    if (!prompt.includes('stanchion')) {
      throw new Error(`sample prompt missing stanchion: ${prompt.slice(0, 80)}`)
    }
    await page.screenshot({ path: join(outDir, '01-brief.png') })
    await copyProof(join(outDir, '01-brief.png'), '01-brief.png')

    await page.getByTestId('brief-generate').click()
    await page.getByTestId('job-status').locator('b').filter({ hasText: /submitting|polling/ }).waitFor({
      timeout: 30_000,
    })

    const taskLabel = await waitFor(async () => {
      const text = (await page.getByTestId('job-task-id').textContent()) || ''
      const m = text.match(/(\d{4,})/)
      return m ? m[1] : null
    }, 60_000, 'task id')
    const taskId = Number(taskLabel)
    log(`taskId ${taskId}`)
    await page.screenshot({ path: join(outDir, '02-polling.png') })
    await copyProof(join(outDir, '02-polling.png'), '02-polling.png')

    const task = await waitFor(async () => {
      const res = await jsonGet(`${API}/api/tasks/${taskId}`)
      await writeFile(join(outDir, 'task.json'), JSON.stringify(res.body, null, 2))
      if (!res.ok) throw new Error(`task http ${res.status} ${redact(res.body)}`)
      if (res.body.status === 4 || res.body.status === 6) {
        throw new Error(`Lux3D terminal failure status=${res.body.status}`)
      }
      if (res.body.status === 3 && res.body.glbUrl) return res.body
      log(`poll status=${res.body.status} label=${res.body.statusLabel}`)
      return null
    }, 12 * 60 * 1000, 'lux3d ready')

    await page.getByTestId('job-status').locator('b').filter({ hasText: 'ready' }).waitFor({
      timeout: 30_000,
    })
    await page.getByTestId('lux3d-badge').waitFor()
    await page.waitForTimeout(2500)
    await page.screenshot({ path: join(outDir, '03-scene-board.png') })
    await copyProof(join(outDir, '03-scene-board.png'), '03-scene-board.png')

    const mesh = await fetch(`${API}/api/mesh/${taskId}`)
    if (!mesh.ok) throw new Error(`mesh http ${mesh.status}`)
    const buf = Buffer.from(await mesh.arrayBuffer())
    const magic = buf.subarray(0, 4).toString('utf8')
    const hex = buf.subarray(0, 16).toString('hex')
    await writeFile(join(outDir, 'mesh.head'), `${magic}\n${hex}\nbytes=${buf.length}\n`)
    if (magic !== 'glTF') {
      throw new Error(`mesh magic was ${JSON.stringify(magic)} not glTF`)
    }

    await page.getByTestId('checklist-placement').check()
    await page.getByTestId('checklist-collision').check()
    await page.getByTestId('checklist-print-export').check()
    await page.screenshot({ path: join(outDir, '04-checklist.png') })

    const summary = {
      runId,
      taskId,
      status: task.status,
      glbUrlHost: new URL(task.glbUrl).host,
      meshBytes: buf.length,
      magic,
      proof: [
        'docs/proof/01-brief.png',
        'docs/proof/02-polling.png',
        'docs/proof/03-scene-board.png',
      ],
    }
    await writeFile(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2))
    log(`PASS happy-path task=${taskId} bytes=${buf.length} magic=${magic}`)
    log(`artifacts ${outDir}`)
    return summary
  } finally {
    await browser.close()
  }
}

const logFile = join(CACHE, 'cli.log')
await mkdir(CACHE, { recursive: true })
const tee = createWriteStream(logFile, { flags: 'a' })
const origWrite = process.stdout.write.bind(process.stdout)
process.stdout.write = (chunk, ...rest) => {
  tee.write(chunk)
  return origWrite(chunk, ...rest)
}

try {
  if (CMD === 'doctor') await doctor()
  else if (CMD === 'launch') await launch()
  else if (CMD === 'cleanup') await cleanup()
  else if (CMD === 'happy-path') await happyPath()
  else throw new Error(`unknown command ${CMD}`)
} catch (err) {
  console.error(`FAIL ${CMD}: ${err.message}`)
  process.exitCode = 1
}
