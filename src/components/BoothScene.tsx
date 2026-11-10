import { ContactShadows, OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  Box3,
  BoxHelper,
  CanvasTexture,
  Color,
  Group,
  RepeatWrapping,
  Vector3,
  type PerspectiveCamera,
} from 'three'
import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { BoothSlot } from '../lib/booth'
import { BAY, SLOTS } from '../lib/booth'

type BoothSceneProps = {
  meshSrc: string | null
  slot: BoothSlot
  status: 'idle' | 'submitting' | 'polling' | 'ready' | 'failed'
  showCollision: boolean
  reducedMotion: boolean
  hideStock: boolean
}

function makeCarpetTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#1a2744'
  ctx.fillRect(0, 0, 512, 512)
  ctx.fillStyle = '#162038'
  const tile = 32
  for (let y = 0; y < 512; y += tile) {
    for (let x = 0; x < 512; x += tile) {
      if ((x / tile + y / tile) % 2 === 0) ctx.fillRect(x, y, tile, tile)
    }
  }
  ctx.strokeStyle = 'rgba(80, 100, 140, 0.18)'
  ctx.lineWidth = 2
  for (let i = 0; i <= 512; i += tile) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, 512)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(512, i)
    ctx.stroke()
  }
  const tex = new CanvasTexture(canvas)
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping
  tex.repeat.set(6, 5)
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

function makeBackdropTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#10161f'
  ctx.fillRect(0, 0, 2048, 1024)
  const grad = ctx.createLinearGradient(0, 0, 0, 1024)
  grad.addColorStop(0, '#1a2330')
  grad.addColorStop(1, '#0c1118')
  ctx.fillStyle = grad
  ctx.fillRect(80, 60, 1888, 904)
  ctx.fillStyle = '#c81d2a'
  ctx.fillRect(80, 60, 1888, 18)
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.font = '600 96px Inter, system-ui, sans-serif'
  ctx.fillText(BAY.name.toUpperCase(), 160, 280)
  ctx.font = '600 168px Inter, system-ui, sans-serif'
  ctx.fillText(BAY.show.toUpperCase(), 160, 520)
  ctx.fillStyle = 'rgba(255,255,255,0.62)'
  ctx.font = '400 64px Inter, system-ui, sans-serif'
  ctx.fillText('Game-jam booth  ·  doors ' + BAY.doors, 160, 680)
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.font = '400 48px Inter, system-ui, sans-serif'
  ctx.fillText('Keep the play floor clear until the queue is marked.', 160, 800)
  const tex = new CanvasTexture(canvas)
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

function makeSignTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 768
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#0e1218'
  ctx.fillRect(0, 0, 512, 768)
  ctx.fillStyle = '#c81d2a'
  ctx.fillRect(0, 0, 512, 28)
  ctx.fillStyle = '#ffffff'
  ctx.font = '600 48px Inter, system-ui, sans-serif'
  ctx.fillText('PLAY SESSIONS', 40, 180)
  ctx.font = '500 120px Inter, system-ui, sans-serif'
  ctx.fillText(BAY.doors, 40, 360)
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '400 36px Inter, system-ui, sans-serif'
  ctx.fillText('Queue forms here.', 40, 480)
  ctx.fillText('One stanchion still', 40, 540)
  ctx.fillText('missing on the floor.', 40, 590)
  const tex = new CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

function HallFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 2]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#141821" roughness={0.92} metalness={0.04} />
      </mesh>
      {/* aisle concrete strip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 4.2]} receiveShadow>
        <planeGeometry args={[18, 6]} />
        <meshStandardMaterial color="#2a2f38" roughness={0.86} metalness={0.08} />
      </mesh>
    </group>
  )
}

function BoothCarpet({ texture }: { texture: CanvasTexture }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.35]} receiveShadow>
      <planeGeometry args={[5.6, 4.4]} />
      <meshStandardMaterial map={texture} roughness={0.95} metalness={0} color="#ffffff" />
    </mesh>
  )
}

function Backdrop({ texture }: { texture: CanvasTexture }) {
  return (
    <group position={[0, 1.25, -1.82]}>
      <mesh>
        <boxGeometry args={[5.7, 2.5, 0.08]} />
        <meshStandardMaterial color="#0c1016" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.02, 0.045]}>
        <planeGeometry args={[5.4, 2.3]} />
        <meshStandardMaterial map={texture} roughness={0.55} metalness={0} />
      </mesh>
      {/* side drape */}
      <mesh position={[-2.88, -0.1, 1.9]}>
        <boxGeometry args={[0.08, 2.3, 3.8]} />
        <meshStandardMaterial color="#151b24" roughness={0.9} />
      </mesh>
      <mesh position={[2.88, -0.1, 1.9]}>
        <boxGeometry args={[0.08, 2.3, 3.8]} />
        <meshStandardMaterial color="#151b24" roughness={0.9} />
      </mesh>
    </group>
  )
}

function DemoTable() {
  const top: [number, number, number] = [1.2, 0.06, 0.7]
  const y = 0.73
  return (
    <group position={[0, 0, -0.55]}>
      <mesh position={[0, y, 0]} castShadow receiveShadow>
        <boxGeometry args={top} />
        <meshStandardMaterial color="#c4a574" roughness={0.45} metalness={0.05} />
      </mesh>
      {([[-0.52, 0.36, -0.28], [0.52, 0.36, -0.28], [-0.52, 0.36, 0.28], [0.52, 0.36, 0.28]] as const).map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <boxGeometry args={[0.06, 0.72, 0.06]} />
          <meshStandardMaterial color="#1a1c20" roughness={0.4} metalness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

function SignStand({ texture }: { texture: CanvasTexture }) {
  return (
    <group position={[-1.7, 0, 2.35]}>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.06, 24]} />
        <meshStandardMaterial color="#1a1c20" roughness={0.45} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 1.35, 16]} />
        <meshStandardMaterial color="#2a2d33" roughness={0.35} metalness={0.6} />
      </mesh>
      <mesh position={[0, 1.22, 0.02]}>
        <boxGeometry args={[0.62, 0.88, 0.04]} />
        <meshStandardMaterial color="#14161b" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.22, 0.042]}>
        <planeGeometry args={[0.54, 0.8]} />
        <meshStandardMaterial map={texture} roughness={0.6} />
      </mesh>
    </group>
  )
}

function Truss() {
  const bar = (pos: [number, number, number], size: [number, number, number]) => (
    <mesh position={pos}>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#3a414c" roughness={0.35} metalness={0.7} />
    </mesh>
  )
  return (
    <group position={[0, 3.15, 0.2]}>
      {bar([-2.6, 0, -1.6], [0.08, 0.08, 4.4])}
      {bar([2.6, 0, -1.6], [0.08, 0.08, 4.4])}
      {bar([0, 0, -1.6], [5.3, 0.08, 0.08])}
      {bar([0, 0, 0.4], [5.3, 0.08, 0.08])}
      {bar([0, 0, 2.2], [5.3, 0.08, 0.08])}
    </group>
  )
}

function Tape() {
  const pieces: { pos: [number, number, number]; size: [number, number] }[] = [
    { pos: [-0.05, 0.012, 2.55], size: [2.9, 0.055] },
    { pos: [-1.45, 0.012, 2.0], size: [0.055, 1.15] },
    { pos: [1.45, 0.012, 2.15], size: [0.055, 0.85] },
    { pos: [1.45, 0.012, 1.35], size: [0.9, 0.055] },
  ]
  return (
    <group>
      {pieces.map((p, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={p.pos}>
          <planeGeometry args={p.size} />
          <meshBasicMaterial color="#e8c14a" />
        </mesh>
      ))}
    </group>
  )
}

function NeighborBooths() {
  return (
    <group>
      <mesh position={[-7.2, 1.1, -1.4]}>
        <boxGeometry args={[5.2, 2.2, 0.08]} />
        <meshStandardMaterial color="#171c24" roughness={0.9} />
      </mesh>
      <mesh position={[7.2, 1.1, -1.4]}>
        <boxGeometry args={[5.2, 2.2, 0.08]} />
        <meshStandardMaterial color="#171c24" roughness={0.9} />
      </mesh>
      <mesh position={[-7.2, 0.38, 0.2]}>
        <boxGeometry args={[1.4, 0.76, 0.8]} />
        <meshStandardMaterial color="#2a241c" roughness={0.7} />
      </mesh>
    </group>
  )
}

function PlacementMarker({
  slot,
  status,
  filled,
  reducedMotion,
}: {
  slot: BoothSlot
  status: BoothSceneProps['status']
  filled: boolean
  reducedMotion: boolean
}) {
  const ring = useRef<Group>(null)
  const busy = status === 'submitting' || status === 'polling'
  useFrame((state) => {
    if (!ring.current || reducedMotion) return
    const pulse = busy ? 1 + Math.sin(state.clock.elapsedTime * 4) * 0.08 : 1
    ring.current.scale.setScalar(pulse)
  })
  const color = filled ? '#8fbf6a' : busy ? '#f0c14b' : '#e11d2e'
  return (
    <group position={slot.position}>
      <group ref={ring}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.28, 0.36, 48]} />
          <meshBasicMaterial color={color} transparent opacity={filled ? 0.55 : 0.95} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}>
          <circleGeometry args={[0.27, 48]} />
          <meshBasicMaterial color={color} transparent opacity={filled ? 0.08 : 0.16} />
        </mesh>
      </group>
      {!filled ? (
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.08, 0.11, 24]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ) : null}
      <FloorPlaque
        title={filled ? slot.placedLabel : slot.missingLabel}
        detail={busy && !filled ? 'Lux3D is building this prop…' : slot.detail}
        accent={color}
      />
    </group>
  )
}

function FloorPlaque({ title, detail, accent }: { title: string; detail: string; accent: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1536
    canvas.height = 640
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#10141c'
    ctx.fillRect(0, 0, 1536, 640)
    ctx.fillStyle = accent
    ctx.fillRect(0, 0, 28, 640)
    ctx.fillStyle = '#ffffff'
    ctx.font = '600 92px Inter, system-ui, sans-serif'
    ctx.fillText(title, 80, 180)
    ctx.fillStyle = '#d5dae2'
    ctx.font = '500 56px Inter, system-ui, sans-serif'
    const words = detail.split(' ')
    let line = ''
    let y = 300
    for (const word of words) {
      const next = line ? line + ' ' + word : word
      if (ctx.measureText(next).width > 1360) {
        ctx.fillText(line, 80, y)
        line = word
        y += 76
      } else {
        line = next
      }
    }
    if (line) ctx.fillText(line, 80, y)
    const tex = new CanvasTexture(canvas)
    tex.anisotropy = 8
    tex.needsUpdate = true
    return tex
  }, [title, detail, accent])

  return (
    <group position={[1.45, 0.7, 0.15]} rotation={[-0.1, 0.52, 0]}>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[1.15, 0.48]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.01]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.15, 0.48]} />
        <meshBasicMaterial color="#12151c" />
      </mesh>
      <mesh position={[0, -0.34, 0]}>
        <boxGeometry args={[0.03, 0.24, 0.03]} />
        <meshStandardMaterial color="#2a2d33" metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  )
}

function FittedProp({
  url,
  slot,
  showCollision,
  reducedMotion,
}: {
  url: string
  slot: BoothSlot
  showCollision: boolean
  reducedMotion: boolean
}) {
  const gltf = useLoader(GLTFLoader, url)
  const scene = useMemo(() => gltf.scene.clone(true), [gltf])
  const group = useRef<Group>(null)
  const land = useRef(reducedMotion ? 1 : 0)
  const rest = useRef(new Vector3())

  useLayoutEffect(() => {
    const g = group.current
    if (!g) return
    land.current = reducedMotion ? 1 : 0
    g.position.set(0, 0, 0)
    g.scale.set(1, 1, 1)
    g.rotation.set(0, 0, 0)
    g.updateWorldMatrix(true, true)

    // Measure in local space so a parent slot offset cannot cancel the pad.
    const box = new Box3().setFromObject(g)
    const parentWorld = new Vector3()
    g.parent?.getWorldPosition(parentWorld)
    const size = box.getSize(new Vector3())
    const scale = slot.targetHeight / Math.max(size.y, 0.001)
    g.scale.setScalar(scale)
    g.updateWorldMatrix(true, true)
    const fitted = new Box3().setFromObject(g)
    const center = fitted.getCenter(new Vector3())
    g.position.x -= center.x - parentWorld.x
    g.position.z -= center.z - parentWorld.z
    g.position.y -= fitted.min.y - parentWorld.y
    rest.current.copy(g.position)
    g.updateWorldMatrix(true, true)

    const prev = g.getObjectByName('collision-helper')
    if (prev) g.remove(prev)
    if (showCollision) {
      const helper = new BoxHelper(g, new Color('#f2f5f8'))
      helper.name = 'collision-helper'
      g.add(helper)
    }
  }, [scene, showCollision, slot.targetHeight, reducedMotion])

  useFrame((_, dt) => {
    if (!group.current) return
    if (reducedMotion) {
      land.current = 1
    } else {
      land.current = Math.min(1, land.current + dt * 1.8)
    }
    const u = land.current
    const eased = 1 - Math.pow(1 - u, 3)
    group.current.position.copy(rest.current)
    group.current.position.y += (1 - eased) * 0.35
    group.current.rotation.y = (1 - eased) * 0.12
  })

  return (
    <group position={slot.position}>
      <group ref={group}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

function CameraRig({ slot, reducedMotion }: { slot: BoothSlot; reducedMotion: boolean }) {
  const { camera, controls } = useThree()
  const progress = useRef(1)
  const lastId = useRef(slot.id)

  useEffect(() => {
    if (lastId.current === slot.id) return
    lastId.current = slot.id
    progress.current = reducedMotion ? 1 : 0
    if (reducedMotion) {
      const cam = camera as PerspectiveCamera
      cam.position.set(...slot.cameraPosition)
      const orb = controls as unknown as { target: Vector3; update: () => void } | null
      if (orb?.target) {
        orb.target.set(...slot.cameraTarget)
        orb.update()
      } else {
        cam.lookAt(new Vector3(...slot.cameraTarget))
      }
    }
  }, [slot, reducedMotion, camera, controls])

  useFrame((_, dt) => {
    if (progress.current >= 1) return
    progress.current = Math.min(1, progress.current + dt * 1.5)
    const k = 1 - Math.pow(0.1, dt * 60)
    const cam = camera as PerspectiveCamera
    cam.position.lerp(new Vector3(...slot.cameraPosition), k)
    const orb = controls as unknown as { target: Vector3; update: () => void } | null
    if (orb?.target) {
      orb.target.lerp(new Vector3(...slot.cameraTarget), k)
      orb.update()
    }
    const close = cam.position.distanceTo(new Vector3(...slot.cameraPosition)) < 0.04
    if (close || progress.current >= 1) progress.current = 1
  })
  return null
}

export function BoothScene({
  meshSrc,
  slot,
  status,
  showCollision,
  reducedMotion,
  hideStock,
}: BoothSceneProps) {
  const carpet = useMemo(() => makeCarpetTexture(), [])
  const backdrop = useMemo(() => makeBackdropTexture(), [])
  const sign = useMemo(() => makeSignTexture(), [])
  const filled = Boolean(meshSrc)
  const hideTable = hideStock && slot.id === 'table' && filled
  const hideSign = hideStock && slot.id === 'sign' && filled

  return (
    <>
      <color attach="background" args={['#0b0d12']} />
      <fog attach="fog" args={['#0b0d12', 10, 28]} />
      <ambientLight intensity={0.45} color="#f0e6d6" />
      <hemisphereLight args={['#c9d4e6', '#2a2418', 0.55]} />
      <directionalLight position={[6, 8, 4]} intensity={1.7} color="#fff4e6" />
      <directionalLight position={[-5, 3, -2]} intensity={0.5} color="#8ea0c0" />
      <spotLight
        position={[1.4, 3.05, 1.9]}
        angle={0.48}
        penumbra={0.7}
        intensity={16}
        color="#ffe8c8"
        distance={10}
      />
      <spotLight
        position={[0, 3.05, -0.4]}
        angle={0.5}
        penumbra={0.7}
        intensity={10}
        color="#fff3df"
        distance={9}
      />
      <HallFloor />
      <BoothCarpet texture={carpet} />
      <Backdrop texture={backdrop} />
      <Truss />
      <Tape />
      <NeighborBooths />
      {hideTable ? null : <DemoTable />}
      {hideSign ? null : <SignStand texture={sign} />}
      <PlacementMarker slot={slot} status={status} filled={filled} reducedMotion={reducedMotion} />
      {meshSrc ? (
        <FittedProp
          key={`${meshSrc}:${slot.id}`}
          url={meshSrc}
          slot={slot}
          showCollision={showCollision}
          reducedMotion={reducedMotion}
        />
      ) : null}
      <ContactShadows position={[0, 0.001, 0.3]} opacity={0.45} scale={8} blur={2.2} far={3} />
      <OrbitControls
        makeDefault
        enableDamping={!reducedMotion}
        dampingFactor={0.08}
        minDistance={2.6}
        maxDistance={14}
        minPolarAngle={0.28}
        maxPolarAngle={Math.PI / 2 - 0.08}
        target={[...SLOTS.stanchion.cameraTarget]}
      />
      <CameraRig slot={slot} reducedMotion={reducedMotion} />
    </>
  )
}
