# Ops checklist

When a prop is on the board, the right panel is a field checklist: placement on the booth floor, collision envelope, and print/export notes. Checking items sticks for that Lux3D task id.

## Sub-features

- `check-placement` marks floor placement done.
- `check-collision` marks the bounding-box envelope reviewed.
- `check-print` marks print/export notes reviewed.
- `check-persist` reloads the page and keeps the ticks for that task id.

## How to get to it (user POV)

- Generate a prop until ready.
- Use the Ops checklist panel on the right.

## Driving it with verify-sceneops

Preconditions:

- Generate-prop is `ready` for the current task id.

- **Tick placement.** `getByTestId('checklist-placement').click()`. The checkbox is checked.
- **Tick collision.** `getByTestId('checklist-collision').click()`. The scene may show a wire bounding box.
- **Tick print/export.** `getByTestId('checklist-print-export').click()`.
- **Download handle.** `getByTestId('prop-download')` is enabled and points at `/api/mesh/<taskId>` or a `download` blob.
- **Persist.** Reload `/`. If the same task is still selected, the three boxes stay checked. If the app starts empty, load is not required to restore the mesh; the failure is only if checked boxes vanish while the same task id is still shown.
- **Proof.** Screenshot the checklist with all three ticked, task id visible.

## Gotchas

- Checklist state is local (`localStorage` key `sceneops.checklist.v1`). Clearing site data drops ticks. That is not a Lux3D failure.
- Do not treat a checked list as proof the GLB is real. Generate-prop mesh bytes remain required.
