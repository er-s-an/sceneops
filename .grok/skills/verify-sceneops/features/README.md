# SceneOps verification map

This directory is the maintained source for verifying SceneOps user-facing behavior. Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch SceneOps so the UI is at `http://127.0.0.1:5173` and the API at `http://127.0.0.1:8787`.
- `.env.local` holds `AHOLO_API_KEY` for the Global region (`com`). Never print it.
- `GET /api/health` reports `ok` and `hasKey`.
- Run `node .cursor/skills/verify-sceneops/scripts/verify.mjs doctor`.
- Never drive an instance this run did not start, unless doctor confirms it is SceneOps on those ports.

## Driving conventions

- Start every recipe from a fresh `/` load unless the feature file says otherwise.
- Prefer `data-testid` handles listed in the skill body.
- Treat helper commands as literal.
- Restore nothing on the Lux3D side (tasks stay in the Aholo account). Do not delete proof artifacts.

## Proof and skip reporting

- Capture the user action and the resulting state.
- UI proof includes a screenshot with the SceneOps wordmark visible.
- API proof includes status code, task id, Lux3D status `3`, and GLB magic bytes.
- A generate that returns a local fixture mesh is a failure, not a skip.
- Report an unreachable path with the command and the unmet precondition.

## Features

- [Generate a prop](./generate-prop.md) is the contest-critical path: brief → Lux3D create → poll → GLB.
- [Scene board](./scene-board.md) mounts that GLB and shows the Lux3D badge.
- [Ops checklist](./ops-checklist.md) records placement, collision, and print/export for the ready asset.
