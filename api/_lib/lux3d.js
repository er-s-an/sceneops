import { createWriteStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createAssetClient } from "@manycore/aholo-sdk-asset";
import { createLux3dClient } from "@manycore/aholo-sdk-lux3d";
const STYLES = [
  "photorealistic",
  "cartoon",
  "anime",
  "hand_painted",
  "cyberpunk",
  "fantasy",
  "glass"
];
const ROOT = process.cwd();
const CACHE_DIR = process.env.VERCEL ? path.join("/tmp", "sceneops-cache") : path.join(ROOT, ".cache");
const MESH_DIR = path.join(CACHE_DIR, "meshes");
const JOBS_PATH = path.join(CACHE_DIR, "jobs.json");
function statusLabel(status) {
  if (status === 0) return "init";
  if (status === 1) return "running";
  if (status === 3) return "ready";
  if (status === 4) return "failed";
  if (status === 6) return "canceled";
  return "unknown";
}
function requireKey() {
  const key = process.env.AHOLO_API_KEY || process.env.LUX3D_API_KEY;
  if (!key) {
    throw new Error("Missing AHOLO_API_KEY. Put the Global API key in .env.local.");
  }
  return key;
}
function client() {
  const apiKey = requireKey();
  return createLux3dClient({ apiKey, region: "com" });
}
function assetClient() {
  const apiKey = requireKey();
  return createAssetClient({ apiKey, region: "com" });
}
async function loadJobs() {
  try {
    const raw = await readFile(JOBS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
async function saveJobs(jobs) {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(JOBS_PATH, JSON.stringify(jobs, null, 2));
}
async function upsertJob(next) {
  const jobs = await loadJobs();
  const idx = jobs.findIndex((j) => j.taskId === next.taskId);
  if (idx >= 0) jobs[idx] = next;
  else jobs.unshift(next);
  await saveJobs(jobs.slice(0, 40));
}
function pickGlbUrl(outputs) {
  if (!outputs) return null;
  const urls = outputs.map((o) => o.content).filter((c) => typeof c === "string" && c !== "NOT_REQUESTED" && /^https?:\/\//.test(c));
  const glb = urls.find((u) => /\.glb(\?|$)/i.test(u) || u.toLowerCase().includes("glb"));
  return glb ?? urls.find((u) => !/\.zip(\?|$)/i.test(u)) ?? null;
}
async function dataUrlToUpload(imageDataUrl) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(imageDataUrl);
  if (!match) {
    if (/^https?:\/\//.test(imageDataUrl)) return imageDataUrl;
    throw new Error("Reference image must be a data URL or http(s) URL.");
  }
  const mime = match[1];
  const buf = Buffer.from(match[2], "base64");
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  await mkdir(MESH_DIR, { recursive: true });
  const tmp = path.join(MESH_DIR, `ref-${Date.now()}.${ext}`);
  await writeFile(tmp, buf);
  const uploaded = await assetClient().uploadFile(tmp);
  return uploaded.url;
}
async function healthPayload() {
  const hasKey = Boolean(process.env.AHOLO_API_KEY || process.env.LUX3D_API_KEY);
  return { ok: hasKey, hasKey, region: "com", service: "sceneops" };
}
async function createTask(input) {
  const prompt = input.prompt.trim();
  const version = input.version === "G1" ? "G1" : "G1-Turbo";
  const style = STYLES.includes(input.style) ? input.style : "photorealistic";
  const faceCount = Math.min(3e5, Math.max(1e4, Math.round(input.faceCount || 4e4)));
  if (!prompt && !input.imageDataUrl) {
    throw new Error("Enter a brief prompt, or attach a reference photo.");
  }
  const lux = client();
  let img;
  if (input.imageDataUrl) {
    img = await dataUrlToUpload(input.imageDataUrl);
  }
  let taskId;
  let mode;
  if (img && !prompt) {
    mode = "img-to-3d";
    taskId = await lux.imgTo3d.create({
      img,
      version,
      faceCount,
      outputFormat: ["glb"],
      enablePbr: version === "G1-Turbo" ? true : void 0,
      aiPredictSize: true
    });
  } else {
    mode = "text-to-3d";
    taskId = await lux.textTo3d.create({
      prompt,
      version,
      style,
      faceCount,
      outputFormat: ["glb"],
      enablePbr: version === "G1-Turbo" ? true : void 0,
      aiPredictSize: true,
      ...img ? { img } : {}
    });
  }
  await upsertJob({
    taskId,
    prompt,
    version,
    style,
    faceCount,
    mode,
    status: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  return { taskId, mode };
}
async function getTask(taskId) {
  const lux = client();
  const result = await lux.tasks.retrieve(taskId);
  const jobs = await loadJobs();
  const prev = jobs.find((j) => j.taskId === taskId);
  const glbUrl = pickGlbUrl(result.outputs);
  const outputs = (result.outputs ?? []).filter((o) => typeof o.content === "string" && o.content !== "NOT_REQUESTED").map((o) => ({ content: o.content }));
  const stored = {
    taskId,
    prompt: prev?.prompt ?? "",
    version: prev?.version ?? "G1-Turbo",
    style: prev?.style ?? "photorealistic",
    faceCount: prev?.faceCount ?? 4e4,
    mode: prev?.mode ?? "text-to-3d",
    status: result.status,
    glbUrl: glbUrl ?? prev?.glbUrl,
    glbPath: prev?.glbPath,
    outputs,
    createdAt: prev?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
    error: result.status === 4 ? "Lux3D marked this task failed." : prev?.error
  };
  if (glbUrl && result.status === 3) {
    stored.glbPath = await cacheMesh(taskId, glbUrl);
  }
  await upsertJob(stored);
  return {
    taskId: result.taskId,
    status: result.status,
    statusLabel: statusLabel(result.status),
    glbUrl: stored.glbUrl ?? null,
    glbProxyUrl: stored.glbUrl || stored.glbPath ? `/api/mesh/${taskId}` : null,
    outputs,
    prompt: stored.prompt,
    version: stored.version,
    style: stored.style,
    faceCount: stored.faceCount,
    error: stored.error,
    generatedBy: "Lux3D"
  };
}
async function latestReady() {
  const jobs = await loadJobs();
  const ready = jobs.find((j) => j.status === 3 && (j.glbPath || j.glbUrl));
  if (!ready) return null;
  return {
    taskId: ready.taskId,
    status: ready.status,
    statusLabel: "ready",
    glbUrl: ready.glbUrl ?? null,
    glbProxyUrl: `/api/mesh/${ready.taskId}`,
    outputs: ready.outputs ?? [],
    prompt: ready.prompt,
    version: ready.version,
    style: ready.style,
    faceCount: ready.faceCount,
    generatedBy: "Lux3D"
  };
}
async function cacheMesh(taskId, url) {
  await mkdir(MESH_DIR, { recursive: true });
  const dest = path.join(MESH_DIR, `${taskId}.glb`);
  try {
    const s = await stat(dest);
    if (s.size > 64) return dest;
  } catch {
  }
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download Lux3D GLB (${res.status})`);
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  return dest;
}
async function meshPath(taskId) {
  const dest = path.join(MESH_DIR, `${taskId}.glb`);
  try {
    const s = await stat(dest);
    if (s.size > 64) return dest;
  } catch {
  }
  const jobs = await loadJobs();
  const job = jobs.find((j) => j.taskId === taskId);
  if (job?.glbUrl) {
    return cacheMesh(taskId, job.glbUrl);
  }
  const view = await getTask(taskId);
  if (view.glbUrl) return cacheMesh(taskId, view.glbUrl);
  return null;
}
export {
  STYLES,
  createTask,
  getTask,
  healthPayload,
  latestReady,
  meshPath
};
