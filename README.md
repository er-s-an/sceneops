# SceneOps

Field and booth ops leads need a runnable 3D prop in minutes, not a DCC ticket. SceneOps takes a short ops brief, calls **Aholo Lux3D** (`G1` or `G1-Turbo`), polls the task, mounts the GLB on a browser scene board, and attaches a placement / collision / print-export checklist.

Lux3D is the product path. There is no placeholder mesh.

Built for the Manycore Aholo Global 3D AI Hackathon. Award tracks: Gaming / Spatial Design. Team: SceneOps. English UI.

## What you can do

1. Type a booth brief, or load a sample (stanchion, A2 stand, demo table).
2. Optionally attach a reference photo.
3. Generate with Lux3D. The server holds the Global API key.
4. Wait until the GLB lands on the scene board (world +Y up, mesh sat on the floor).
5. Tick the ops checklist and download the GLB.

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

## Honesty

- Generate, poll, and GLB bytes come from the Aholo Lux3D Global API.
- Face budget is the request sent to Lux3D, not a measured triangle count after load.
- Result URLs expire in about two hours; this server caches the GLB.
- This repository is a contest demo. It is not a DCC replacement.

## Stack

Vite + React + Three.js (`@react-three/fiber`) + Node (Express) + `@manycore/aholo-sdk-lux3d`.
