import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const outDir = '/workspace/competitions/explainers/sceneops/public/footage'
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: [
    '--use-gl=angle',
    '--ignore-gpu-blocklist',
    '--window-size=1920,1080',
    '--autoplay-policy=no-user-gesture-required',
  ],
})
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: { dir: outDir, size: { width: 1920, height: 1080 } },
  deviceScaleFactor: 1,
})
const page = await context.newPage()
page.setDefaultTimeout(30000)

async function orbit(dx, dy, durationMs) {
  const box = await page.getByTestId('scene-canvas').boundingBox()
  const x = box.x + box.width * 0.52
  const y = box.y + box.height * 0.58
  await page.mouse.move(x, y)
  await page.mouse.down()
  const steps = Math.max(16, Math.floor(durationMs / 40))
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(x + (dx * i) / steps, y + (dy * i) / steps)
    await page.waitForTimeout(durationMs / steps)
  }
  await page.mouse.up()
}

const t0 = Date.now()
const at = async (sec, label) => {
  const wait = sec * 1000 - (Date.now() - t0)
  if (wait > 0) await page.waitForTimeout(wait)
  console.log(`t=${((Date.now()-t0)/1000).toFixed(1)} ${label}`)
}

await page.goto('http://127.0.0.1:5273/?scene=open', { waitUntil: 'networkidle' })
await page.waitForTimeout(2200)
// reset t0 after load so the film starts on a ready scene
// We'll keep a little pre-roll; remotion can trim. Restart clock now.
const start = Date.now()
const hit = async (sec, label) => {
  const wait = sec * 1000 - (Date.now() - start)
  if (wait > 0) await page.waitForTimeout(wait)
  console.log(`t=${((Date.now()-start)/1000).toFixed(1)} ${label}`)
}

// 0-8 open orbit
await orbit(220, 40, 7000)
await hit(8, 'part0 mark')
await orbit(-80, 80, 6000)
await hit(16, 'keep orbit mark')
await orbit(160, -30, 8000)
await hit(25.5, 'part1 pull back')
await orbit(-240, -60, 12000)
await hit(44, 'hold problem')
await orbit(90, 40, 4000)
await hit(48.1, 'part2 bay itself')
await orbit(140, -50, 10000)
await hit(62, 'show work order side')
await orbit(-100, 30, 8000)
await hit(72, 'part3 brief')
// hover generate
const gen = page.getByTestId('brief-generate')
const gbox = await gen.boundingBox()
if (gbox) {
  await page.mouse.move(gbox.x + gbox.width / 2, gbox.y + gbox.height / 2)
}
await orbit(80, 20, 8000)
await hit(91, 'hold before land setup')
await orbit(-60, 40, 3000)
await hit(99.5, 'navigate to landed mesh')
await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded' })
await page.getByTestId('lux3d-badge').waitFor({ timeout: 20000 }).catch(() => {})
await page.waitForTimeout(1800)
await hit(110.8, 'part5 orbit stanchion')
await orbit(260, -40, 8000)
await hit(122, 'orbit other way')
await orbit(-200, 70, 7000)
await hit(129.2, 'part6 checklist')
await page.getByTestId('checklist-placement').check()
await page.waitForTimeout(1400)
await page.getByTestId('checklist-collision').check()
await page.waitForTimeout(1600)
await orbit(120, -30, 5000)
await page.getByTestId('checklist-print-export').check()
await hit(148, 'hold after checklist')
await orbit(-140, 50, 5000)
await hit(152.9, 'part7 closer')
await orbit(180, -20, 10000)
await hit(165, 'final hold orbit')
await orbit(-160, 40, 12000)
await hit(180.5, 'done')

const video = page.video()
await page.close()
const vidPath = await video.path()
await context.close()
await browser.close()
console.log('raw video', vidPath)
