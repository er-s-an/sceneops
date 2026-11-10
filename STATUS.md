# SceneOps — status

**Updated:** 2026-11-11 · Presentation rewrite on a real booth floor. Build still uses **real Aholo Lux3D**. **No portal Submit.** **No tweet.** **Fee $0 / ¥0.**

Team **SceneOps**. Award tracks: Gaming / Spatial Design. English UI only.

## Links

| Item | URL / path |
| --- | --- |
| GitHub | https://github.com/er-s-an/sceneops |
| Public demo | https://sceneops.vercel.app |
| Local UI | http://127.0.0.1:5273 |
| Local API | http://127.0.0.1:8787 |
| Review-clips | https://review-clips.vercel.app/v/sceneops-explainer |
| Contest hub | https://www.aholo.ai/hackathon/my |
| Submit | **Not done** (do not submit until user 「交」) |

## What changed in this pass

The product now opens on Bay 14 (IndieForge game-jam booth, doors 16:00). The missing chrome stanchion is marked on the floor. The work order is written against that bay. When Lux3D returns a real GLB, the model lands on the marked pad. Placement, collision, and print/export stay in that scene.

Commit: `d1e10331b1a9168bda96190530f14b6d005745a1` on `origin/main`.

## Lux3D proof (not a mock)

Cached proven mesh remains task `6159981` (9,273,184 bytes, magic `glTF`, G1-Turbo, photorealistic, 40k face request). Open `/?scene=open` to see the empty mark. Default load uses the latest cached ready job when the server has one.

Public `GET https://sceneops.vercel.app/api/health` returns `{"ok":true,"hasKey":true,"region":"com","service":"sceneops"}`. The key is not in the response or in git.

Screenshots: `docs/proof/06-first-screen-open.png` (empty marked bay) · `07-model-landed.png` (task 6159981 on the pad) · `08-mobile-open.png`.

## Explainer

| Item | Value |
| --- | --- |
| Deep link | https://review-clips.vercel.app/v/sceneops-explainer |
| HTTP | 200 (page and mp4) |
| Duration | 180.0s · 1920×1080 · audio AAC 48 kHz stereo |
| Project | `/workspace/competitions/explainers/sceneops/` |
| Composition | `SceneOpsExplainer` |
| Motion | Continuous recording of the real staged booth UI (not stills, not `board-ready.png`, not ffmpeg-concat of slides) |
| Language | English voice-over (AndrewNeural) + English burned-in captions |

## Skills used

hackathon-storytelling (narrative + presentation + review), UI UX Pro Max (design system + UX/stack queries, actually run), remotion, remotion-best-practices, remotion-markup, remotion-captions, remotion-multimedia, remotion-render. Idea gate already passed. poteto-mode and Grok Build were not used for this pass. Onetake hook was skipped after the explainer was solid.

## Honesty

- Generate / poll / GLB bytes come from the Aholo Lux3D Global API.
- Face budget in the UI is the request sent to Lux3D, not a measured triangle count.
- Result URLs expire in about two hours; the local server caches the GLB. Vercel redirects the mesh to the live Lux3D URL (CORS `*`).
- The explainer shows the real cached result of task 6159981 landing on the mark; it does not invent a generate that did not run in the recording.
- Aholo portal Submit was not done.

## Local how-to

```bash
cp .env.example .env.local   # set AHOLO_API_KEY
npm install
npm run dev                  # UI :5273  API :8787
npm run verify
```
