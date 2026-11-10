# Generate a prop

An ops lead types a short booth brief (or loads a sample), chooses G1-Turbo, and SceneOps creates a Lux3D text-to-3D task, then polls until a GLB exists.

## Sub-features

- `generate-sample` loads the stanchion sample into the prompt.
- `generate-submit` POSTs `/api/generate` and shows a numeric Lux3D task id.
- `generate-poll` waits until job status is `ready` (Lux3D status 3).
- `generate-fail` surfaces a visible error when Lux3D returns status 4.

## How to get to it (user POV)

- Open the app. The ops brief panel is on the left.
- Click `Booth stanchion` to load the sample, or type a prompt.
- Click `Generate with Lux3D`.

## Driving it with verify-sceneops

Preconditions:

- Doctor is green.
- Credits are not zero (`GET /api/credits` reports `availableCredits` > 0).
- No other generate is in flight (`brief-generate` is enabled).

- **Load sample.** Click `Booth stanchion`. Run `verify.mjs` or Playwright `getByTestId('brief-sample-stanchion').click()`. The prompt textarea contains `chrome stanchion`.
- **Choose model.** Set version to `G1-Turbo`. Run `getByTestId('brief-version').selectOption('G1-Turbo')`.
- **Submit.** Click `Generate with Lux3D`. Run `getByTestId('brief-generate').click()`. `job-status` becomes `submitting` then `polling`. `job-task-id` is an integer.
- **Confirm create via API.** `GET /api/tasks/<id>` returns JSON with that `taskId` and `status` 0 or 1 (or 3 if it finished immediately).
- **Wait for GLB.** Poll until `job-status` is `ready`, max 12 minutes. `GET /api/tasks/<id>` has `status: 3` and a `glbUrl`.
- **Proof.** Save `task.json`, `01-brief.png`, `02-polling.png`. Hex-dump the first 4 bytes of `/api/mesh/<id>` and require `676c5446` (`glTF`).

## Gotchas

- G1-Turbo still takes minutes. A 30s timeout is a bad test, not a product failure.
- `job-status` `failed` with a Lux3D message is a real failure. Record `task.json` and stop.
- A ready UI with a gray cube and no task id is a mocked mesh. Fail the run.
- Do not send the API key to the browser. `GET /api/health` must not contain it.
