# SceneOps — status

**Updated:** 2026-11-11 · Build **DONE** against **real Aholo Lux3D**. **No portal Submit.** **No tweet.** **No card.** **Fee $0 / ¥0.**

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

## Lux3D proof (not a mock)

Verification CLI:

```
node .cursor/skills/verify-sceneops/scripts/verify.mjs happy-path
PASS happy-path task=6159981 bytes=9273184 magic=glTF
```

| Field | Value |
| --- | --- |
| Task id | `6159981` |
| Status | `3` (Lux3D success) |
| Bytes | `9,273,184` |
| Magic | `glTF` (`676c5446`) |
| Version | G1-Turbo · photorealistic · 40k face request |
| Host | `qhsmodel.kujiale.com` |
| Artifacts | `artifacts/verify/2026-11-10T18-16-40-518Z/` |
| Screenshots | `docs/proof/01-brief.png` · `02-polling.png` · `03-scene-board.png` · `04-board-crop.png` · `05-checklist.png` |

Public `GET https://sceneops.vercel.app/api/health` returns `{"ok":true,"hasKey":true,"region":"com","service":"sceneops"}`. The key is not in the response or in git.

## Explainer

| Item | Value |
| --- | --- |
| Deep link | https://review-clips.vercel.app/v/sceneops-explainer |
| Duration | 180.0s · 1920×1080 · ~22 MB |
| Project | `/workspace/competitions/explainers/sceneops/` |
| Composition | `SceneOpsExplainer` |
| Motion | Continuous ops-board (not onetake, not PNG concat, not PopCard) |
| Language | English burn-in |

## Skills used

poteto-mode, create-verification-skill, skill-design-principles, principle-prove-it-works, principle-build-the-lever, principle-model-the-domain, principle-experience-first, principle-sequence-verifiable-units, principle-never-block-on-the-human, principle-laziness-protocol, principle-boundary-discipline, principle-foundational-thinking, unslop, threejs-frame-conventions, remotion, remotion-best-practices, remotion-markup, remotion-create, remotion-render, hackathon-concept-forge, agent-browser, long-running-background-tasks.

## Honesty

- Generate / poll / GLB bytes come from the Aholo Lux3D Global API.
- Face budget in the UI is the request sent to Lux3D, not a measured triangle count.
- Result URLs expire in about two hours; the local server caches the GLB. Vercel redirects the mesh to the live Lux3D URL (CORS `*`).
- Aholo portal Submit was not done.

## Local how-to

```bash
cp .env.example .env.local   # set AHOLO_API_KEY
npm install
npm run dev                  # UI :5273  API :8787
npm run verify
```
