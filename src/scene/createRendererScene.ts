import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export interface RendererScene {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  root: THREE.Group
  dispose: () => void
}

export function createRendererScene(canvas: HTMLCanvasElement): RendererScene {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
  renderer.shadowMap.enabled = false
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.info.autoReset = true

  const camera = new THREE.PerspectiveCamera(
    55,
    canvas.clientWidth / Math.max(canvas.clientHeight, 1),
    0.1,
    500,
  )
  camera.position.set(28, 34, 42)

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  controls.maxDistance = 180
  controls.minDistance = 8

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0b1220)
  scene.fog = new THREE.Fog(0x0b1220, 70, 180)

  const root = new THREE.Group()
  scene.add(root)

  const hemi = new THREE.HemisphereLight(0xb1c5ff, 0x243044, 1.05)
  const dir = new THREE.DirectionalLight(0xfff2d6, 1.45)
  dir.position.set(40, 60, 20)
  scene.add(hemi, dir)

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 220),
    new THREE.MeshStandardMaterial({ color: 0x152033, roughness: 0.95, metalness: 0.05 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.01
  scene.add(ground)

  return {
    renderer,
    scene,
    camera,
    controls,
    root,
    dispose: () => {
      controls.dispose()
      renderer.dispose()
    },
  }
}
