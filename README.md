# SceneOps

A booth floor with a missing prop. Field and booth ops leads write a short brief against that space; **Aholo Lux3D** generates a real GLB and SceneOps places it on the marked pad. Placement, collision, and print/export happen in the bay, not in an empty viewer.

Lux3D is the product path. There is no placeholder mesh.

Built for the Manycore Aholo Global 3D AI Hackathon. Award tracks: Gaming / Spatial Design. Team: SceneOps. English UI.

Live demo: https://sceneops.vercel.app · source: https://github.com/er-s-an/sceneops

## What you can do

1. Open the bay. The missing-prop mark is already on the floor (default work order: chrome stanchion with red velvet rope).
2. Adjust the brief, or load a sample (stanchion, A2 stand, demo table). Optionally attach a reference photo.
3. Generate with Lux3D. The server holds the Global API key.
4. When the GLB is ready, it lands on the marked pad (world +Y up, mesh sat on the floor).
5. Tick placement, collision, and print/export, then download the GLB.

## Run locally

```bash
cp .env.example .env.local   # then set AHOLO_API_KEY
npm install
npm run dev                  # UI http://127.0.0.1:5273  API http://127.0.0.1:8787
```

Need a Global API key from [labs.aholo.ai/api-keys](https://labs.aholo.ai/api-keys). Do not put the key in frontend code.

```bash
npm run verify               # doctor + happy path against live Lux3D
```

Open `/?scene=open` to keep the bay empty (skip the last cached job) and see the missing mark clearly.

## Honesty

- Generate, poll, and GLB bytes come from the Aholo Lux3D Global API.
- Face budget is the request sent to Lux3D, not a measured triangle count after load.
- Result URLs expire in about two hours; this server caches the GLB.
- This repository is a contest demo. It is not a DCC replacement.

## Stack

Vite + React + Three.js (`@react-three/fiber`) + Node (Express) + `@manycore/aholo-sdk-lux3d`.
