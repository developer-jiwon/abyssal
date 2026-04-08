import './style.css'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { EffectComposer, RenderPass, EffectPass, BloomEffect, ChromaticAberrationEffect, VignetteEffect } from 'postprocessing'

gsap.registerPlugin(ScrollTrigger)

// ============================================
// CONFIG
// ============================================
const MAX_DEPTH = 11034
const WORLD_DEPTH = 250
const MOUSE_INFLUENCE = 3

const ZONES = [
  { name: 'Sunlight Zone', depthStart: 0, depthEnd: 200, pStart: 0, pEnd: 0.12,
    bg: [0x1a9fd8, 0x0a7ec2], fog: [60, 200], ambient: 1.2, causticStr: 1.0 },
  { name: 'Twilight Zone', depthStart: 200, depthEnd: 1000, pStart: 0.12, pEnd: 0.32,
    bg: [0x0a7ec2, 0x032c4a], fog: [40, 140], ambient: 0.5, causticStr: 0.3 },
  { name: 'Midnight Zone', depthStart: 1000, depthEnd: 4000, pStart: 0.32, pEnd: 0.58,
    bg: [0x032c4a, 0x010d1a], fog: [30, 120], ambient: 0.12, causticStr: 0 },
  { name: 'Abyssal Zone', depthStart: 4000, depthEnd: 6000, pStart: 0.58, pEnd: 0.78,
    bg: [0x010d1a, 0x000508], fog: [20, 90], ambient: 0.06, causticStr: 0 },
  { name: 'Hadal Zone', depthStart: 6000, depthEnd: 11034, pStart: 0.78, pEnd: 1.0,
    bg: [0x000508, 0x000000], fog: [15, 70], ambient: 0.04, causticStr: 0 },
]

// Max 6 glow lights to avoid performance issues — only for key creatures
const CREATURES = [
  // Sunlight
  { file: 'sea-turtle.png', zone: 0, count: 2, size: 6, y: [-5, -8], x: [-12, 12], speed: 0.2, swim: 4 },
  { file: 'sunlight-fish-school.png', zone: 0, count: 3, size: 4, y: [-3, -9], x: [-14, 14], speed: 0.4, swim: 5 },
  { file: 'whale.png', zone: 0, count: 1, size: 12, y: [-2, -6], x: [-8, 8], speed: 0.08, swim: 3 },
  // Twilight
  { file: 'giant-jellyfish.png', zone: 1, count: 3, size: 7, y: [-6, 6], x: [-12, 12], speed: 0.06, swim: 2, glow: 0x00f5d4, glowI: 1.5 },
  { file: 'nautilus.png', zone: 1, count: 2, size: 4, y: [-4, 4], x: [-10, 10], speed: 0.1, swim: 3 },
  { file: 'comb-jelly.png', zone: 1, count: 5, size: 3, y: [-5, 5], x: [-13, 13], speed: 0.04, swim: 1.5 },
  // Midnight — only 2 glow lights here
  { file: 'anglerfish.png', zone: 2, count: 2, size: 8, y: [-4, 4], x: [-10, 10], speed: 0.04, swim: 3, glow: 0x00f5d4, glowI: 2.5 },
  { file: 'viperfish.png', zone: 2, count: 2, size: 5, y: [-5, 5], x: [-12, 12], speed: 0.08, swim: 3 },
  { file: 'black-dragonfish.png', zone: 2, count: 1, size: 7, y: [-3, 3], x: [-8, 8], speed: 0.05, swim: 2 },
  { file: 'siphonophore.png', zone: 2, count: 2, size: 9, y: [-6, 6], x: [-10, 10], speed: 0.02, swim: 1.5 },
  { file: 'lanternfish.png', zone: 2, count: 4, size: 3, y: [-6, 6], x: [-14, 14], speed: 0.2, swim: 4 },
  { file: 'sea-angel.png', zone: 2, count: 3, size: 3, y: [-5, 5], x: [-12, 12], speed: 0.03, swim: 1 },
  { file: 'hatchetfish.png', zone: 2, count: 3, size: 3, y: [-5, 5], x: [-13, 13], speed: 0.15, swim: 3 },
  // Abyssal — 1 glow
  { file: 'vampire-squid.png', zone: 3, count: 2, size: 9, y: [-4, 4], x: [-8, 8], speed: 0.04, swim: 3, glow: 0x5555ff, glowI: 3.0 },
  { file: 'dumbo-octopus.png', zone: 3, count: 2, size: 7, y: [-5, 5], x: [-10, 10], speed: 0.03, swim: 2 },
  { file: 'gulper-eel.png', zone: 3, count: 2, size: 9, y: [-3, 3], x: [-8, 8], speed: 0.05, swim: 4 },
  { file: 'giant-isopod.png', zone: 3, count: 3, size: 6, y: [-6, -2], x: [-10, 10], speed: 0.015, swim: 1 },
  { file: 'tube-worm.png', zone: 3, count: 3, size: 7, y: [-7, -4], x: [-8, 8], speed: 0, swim: 0 },
  { file: 'yeti-crab.png', zone: 3, count: 2, size: 5, y: [-6, -3], x: [-8, 8], speed: 0.01, swim: 0.5 },
  // Hadal — 1 glow
  { file: 'fangtooth.png', zone: 4, count: 3, size: 7, y: [-4, 4], x: [-7, 7], speed: 0.04, swim: 3 },
  { file: 'barreleye.png', zone: 4, count: 2, size: 6, y: [-3, 3], x: [-6, 6], speed: 0.05, swim: 2 },
  { file: 'colossal-squid.png', zone: 4, count: 2, size: 14, y: [-5, 5], x: [-6, 6], speed: 0.02, swim: 2, glow: 0xff4444, glowI: 4.0 },
  { file: 'frilled-shark.png', zone: 4, count: 2, size: 11, y: [-4, 4], x: [-8, 8], speed: 0.04, swim: 4 },
  { file: 'sea-cucumber.png', zone: 4, count: 3, size: 5, y: [-5, 5], x: [-8, 8], speed: 0.02, swim: 1.5 },
  { file: 'anglerfish.png', zone: 4, count: 2, size: 10, y: [-3, 3], x: [-7, 7], speed: 0.03, swim: 3 },
  { file: 'black-dragonfish.png', zone: 4, count: 2, size: 8, y: [-4, 4], x: [-8, 8], speed: 0.04, swim: 3 },
]

// ============================================
// LENIS
// ============================================
const lenis = new Lenis({
  duration: 1.8,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
})
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)

// ============================================
// THREE.JS
// ============================================
const canvas = document.getElementById('ocean-canvas')
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x1a9fd8)
scene.fog = new THREE.Fog(0x1a9fd8, 60, 200)

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500)
camera.position.set(0, 0, 5)

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// ============================================
// POST-PROCESSING (bloom + chromatic aberration + vignette)
// ============================================
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))

const bloomEffect = new BloomEffect({
  intensity: 0.8,
  luminanceThreshold: 0.3,
  luminanceSmoothing: 0.7,
  mipmapBlur: true,
})

const chromaticEffect = new ChromaticAberrationEffect({
  offset: new THREE.Vector2(0.0005, 0.0005),
  radialModulation: true,
  modulationOffset: 0.2,
})

const vignetteEffect = new VignetteEffect({
  darkness: 0.5,
  offset: 0.3,
})

composer.addPass(new EffectPass(camera, bloomEffect, chromaticEffect, vignetteEffect))

// ============================================
// LIGHTING
// ============================================
const ambientLight = new THREE.AmbientLight(0x88ccee, 1.2)
scene.add(ambientLight)

const sunLight = new THREE.DirectionalLight(0xffeedd, 1.0)
sunLight.position.set(3, 20, 10)
scene.add(sunLight)

const flashLight = new THREE.PointLight(0xaaddff, 0, 25)
scene.add(flashLight)

// ============================================
// WATER SURFACE (at z=5, top of scene)
// ============================================
const waterSurfaceGeo = new THREE.PlaneGeometry(80, 80, 64, 64)
const waterSurfaceMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
  uniforms: {
    uTime: { value: 0 },
  },
  vertexShader: `
    uniform float uTime;
    varying vec2 vUv;
    varying float vWave;
    void main() {
      vUv = uv;
      vec3 pos = position;
      float wave = sin(pos.x * 0.8 + uTime * 0.6) * 0.3
                 + sin(pos.y * 0.6 + uTime * 0.4) * 0.2
                 + sin((pos.x + pos.y) * 1.2 + uTime * 0.8) * 0.15;
      pos.z += wave;
      vWave = wave;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying float vWave;
    void main() {
      float brightness = 0.3 + vWave * 0.5;
      vec3 color = mix(
        vec3(0.1, 0.5, 0.8),
        vec3(0.6, 0.9, 1.0),
        brightness
      );
      float alpha = 0.15 + abs(vWave) * 0.2;
      // Fade edges
      float edgeFade = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x)
                     * smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
      gl_FragColor = vec4(color, alpha * edgeFade);
    }
  `,
})

const waterSurface = new THREE.Mesh(waterSurfaceGeo, waterSurfaceMat)
waterSurface.rotation.x = -Math.PI / 2
waterSurface.position.set(0, 8, 0)
scene.add(waterSurface)

// ============================================
// CAUSTIC OVERLAY
// ============================================
const causticMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, depthTest: false,
  uniforms: { uTime: { value: 0 }, uStrength: { value: 1.0 } },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uStrength;
    varying vec2 vUv;
    vec2 hash(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
    }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(dot(hash(i),f), dot(hash(i+vec2(1,0)),f-vec2(1,0)), u.x),
                 mix(dot(hash(i+vec2(0,1)),f-vec2(0,1)), dot(hash(i+vec2(1,1)),f-vec2(1,1)), u.x), u.y);
    }
    void main() {
      float c = noise(vUv*3.0+vec2(uTime*0.15, uTime*0.1))*0.5
              + noise(vUv*5.0-vec2(uTime*0.1, uTime*0.15))*0.3
              + noise(vUv*8.0+vec2(uTime*0.08, -uTime*0.12))*0.2;
      float b = smoothstep(0.1, 0.6, c) * uStrength;
      gl_FragColor = vec4(b*0.35, b*0.5, b*0.6, b*0.25);
    }
  `,
})
const causticQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), causticMat)
causticQuad.frustumCulled = false
const overlayScene = new THREE.Scene()
const overlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
overlayScene.add(causticQuad)

// ============================================
// BUBBLES (rise up, more near surface)
// ============================================
const BUBBLE_COUNT = 250
const bubbleGeo = new THREE.BufferGeometry()
const bubblePos = new Float32Array(BUBBLE_COUNT * 3)
const bubbleSpeeds = new Float32Array(BUBBLE_COUNT)
for (let i = 0; i < BUBBLE_COUNT; i++) {
  bubblePos[i*3] = (Math.random()-0.5)*35
  bubblePos[i*3+1] = (Math.random()-0.5)*25
  bubblePos[i*3+2] = -Math.random()*WORLD_DEPTH*0.5
  bubbleSpeeds[i] = Math.random()*0.02 + 0.005
}
bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePos, 3))
const bubbleMat = new THREE.PointsMaterial({
  color: 0xffffff, size: 0.15, transparent: true, opacity: 0.4,
  sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
})
scene.add(new THREE.Points(bubbleGeo, bubbleMat))

// ============================================
// MARINE SNOW
// ============================================
const SNOW_COUNT = 1000
const snowGeo = new THREE.BufferGeometry()
const snowArr = new Float32Array(SNOW_COUNT*3)
for (let i = 0; i < SNOW_COUNT; i++) {
  snowArr[i*3] = (Math.random()-0.5)*35
  snowArr[i*3+1] = (Math.random()-0.5)*25
  snowArr[i*3+2] = -Math.random()*WORLD_DEPTH
}
snowGeo.setAttribute('position', new THREE.BufferAttribute(snowArr, 3))
const snowMat = new THREE.PointsMaterial({
  color: 0xffffff, size: 0.04, transparent: true, opacity: 0.2,
  sizeAttenuation: true, depthWrite: false,
})
scene.add(new THREE.Points(snowGeo, snowMat))

// ============================================
// BIOLUMINESCENCE
// ============================================
const BIO_COUNT = 400
const bioGeo = new THREE.BufferGeometry()
const bioPosArr = new Float32Array(BIO_COUNT*3)
const bioColArr = new Float32Array(BIO_COUNT*3)
const bioCols = [new THREE.Color(0x00f5d4), new THREE.Color(0x00bbf9), new THREE.Color(0x9b5de5), new THREE.Color(0x00f5a0)]
for (let i = 0; i < BIO_COUNT; i++) {
  bioPosArr[i*3] = (Math.random()-0.5)*30
  bioPosArr[i*3+1] = (Math.random()-0.5)*20
  bioPosArr[i*3+2] = -(WORLD_DEPTH*0.25 + Math.random()*WORLD_DEPTH*0.75)
  const c = bioCols[Math.floor(Math.random()*bioCols.length)]
  bioColArr[i*3]=c.r; bioColArr[i*3+1]=c.g; bioColArr[i*3+2]=c.b
}
bioGeo.setAttribute('position', new THREE.BufferAttribute(bioPosArr, 3))
bioGeo.setAttribute('color', new THREE.BufferAttribute(bioColArr, 3))
const bioMat = new THREE.PointsMaterial({
  size: 0.12, transparent: true, opacity: 0.6, sizeAttenuation: true,
  depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending,
})
scene.add(new THREE.Points(bioGeo, bioMat))

// ============================================
// CREATURE SHADER (wiggle/undulate effect)
// ============================================
const creatureVertShader = `
  uniform float uTime;
  uniform float uWiggle;    // wiggle intensity
  uniform float uWiggleFreq; // wiggle frequency
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 pos = position;
    // Wiggle: bottom of creature moves more than top (tentacles/tail)
    float bottomFactor = 1.0 - uv.y; // 0 at top, 1 at bottom
    pos.x += sin(uTime * uWiggleFreq + pos.y * 3.0) * uWiggle * bottomFactor;
    // Gentle sway for the whole body
    pos.x += sin(uTime * uWiggleFreq * 0.5) * uWiggle * 0.2;
    pos.y += cos(uTime * uWiggleFreq * 0.3 + 1.0) * uWiggle * 0.15;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const creatureFragShader = `
  uniform sampler2D uTexture;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec4 tex = texture2D(uTexture, vUv);
    if (tex.a < 0.05) discard;
    gl_FragColor = vec4(tex.rgb, tex.a * uOpacity);
  }
`

// ============================================
// CREATURES
// ============================================
const textureLoader = new THREE.TextureLoader()
const allCreatures = []
let glowLightCount = 0
const MAX_GLOW_LIGHTS = 6

CREATURES.forEach((def) => {
  const zone = ZONES[def.zone]
  const texture = textureLoader.load(`/creatures/${def.file}`)
  texture.colorSpace = THREE.SRGBColorSpace

  for (let i = 0; i < def.count; i++) {
    const s = def.size * (0.85 + Math.random()*0.3)

    // Billboard plane with wiggle shader
    const geo = new THREE.PlaneGeometry(s, s, 8, 8) // subdivided for vertex wiggle
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uTime: { value: 0 },
        uWiggle: { value: def.speed > 0.1 ? 0.15 : (def.speed > 0 ? 0.25 : 0.05) },
        uWiggleFreq: { value: 1.5 + Math.random() * 1.5 },
        uOpacity: { value: 0.95 },
      },
      vertexShader: creatureVertShader,
      fragmentShader: creatureFragShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })

    const mesh = new THREE.Mesh(geo, mat)

    const zS = zone.pStart*WORLD_DEPTH, zE = zone.pEnd*WORLD_DEPTH
    const z = -(zS + Math.random()*(zE-zS))
    const x = THREE.MathUtils.lerp(def.x[0], def.x[1], Math.random())
    const y = THREE.MathUtils.lerp(def.y[0], def.y[1], Math.random())

    mesh.position.set(x, y, z)
    mesh.userData = {
      speed: def.speed, swim: def.swim,
      ox: x, oy: y,
      px: Math.random()*Math.PI*2, py: Math.random()*Math.PI*2,
      isBillboard: true,
    }

    scene.add(mesh)
    allCreatures.push(mesh)

    // Limited glow lights
    if (def.glow && glowLightCount < MAX_GLOW_LIGHTS && i === 0) {
      const gl = new THREE.PointLight(def.glow, def.glowI, 20)
      gl.position.copy(mesh.position)
      scene.add(gl)
      mesh.userData.gl = gl
      mesh.userData.glBase = def.glowI
      glowLightCount++
    }
  }
})

// ============================================
// SOUND — Underwater Ambience (Web Audio API)
// ============================================
let audioCtx, audioStarted = false

function initAudio() {
  if (audioStarted) return
  audioStarted = true

  audioCtx = new (window.AudioContext || window.webkitAudioContext)()

  // Deep rumble (low freq oscillator)
  const rumbleOsc = audioCtx.createOscillator()
  rumbleOsc.type = 'sine'
  rumbleOsc.frequency.value = 40
  const rumbleGain = audioCtx.createGain()
  rumbleGain.gain.value = 0.06
  rumbleOsc.connect(rumbleGain).connect(audioCtx.destination)
  rumbleOsc.start()

  // Bubble noise
  const bufferSize = 2 * audioCtx.sampleRate
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate)
  const output = noiseBuffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1
  const noise = audioCtx.createBufferSource()
  noise.buffer = noiseBuffer
  noise.loop = true

  const bandpass = audioCtx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 800
  bandpass.Q.value = 2

  const noiseGain = audioCtx.createGain()
  noiseGain.gain.value = 0.015
  noise.connect(bandpass).connect(noiseGain).connect(audioCtx.destination)
  noise.start()

  // Store for depth-based control
  window._audioGains = { rumble: rumbleGain, noise: noiseGain, rumbleOsc }
}

// Start audio on first interaction
document.addEventListener('click', initAudio, { once: true })
document.addEventListener('scroll', initAudio, { once: true })

function updateAudio() {
  if (!window._audioGains) return
  const { rumble, noise, rumbleOsc } = window._audioGains
  // Deeper = louder rumble, lower freq, less bubble noise
  rumble.gain.value = 0.04 + scrollProgress * 0.12
  rumbleOsc.frequency.value = 40 - scrollProgress * 20
  noise.gain.value = Math.max(0.002, 0.015 - scrollProgress * 0.015)
}

// ============================================
// STATE
// ============================================
let mouseX = 0, mouseY = 0, targetMX = 0, targetMY = 0
let scrollProgress = 0
let clientX = window.innerWidth/2, clientY = window.innerHeight/2

document.addEventListener('mousemove', (e) => {
  targetMX = (e.clientX/window.innerWidth-0.5)*2
  targetMY = (e.clientY/window.innerHeight-0.5)*2
  clientX = e.clientX; clientY = e.clientY
})
document.addEventListener('touchmove', (e) => {
  const t = e.touches[0]
  targetMX = (t.clientX/window.innerWidth-0.5)*2
  targetMY = (t.clientY/window.innerHeight-0.5)*2
  clientX = t.clientX; clientY = t.clientY
}, { passive: true })

// Scroll
const depthEl = document.getElementById('depth-number')
const zoneEl = document.getElementById('zone-name')

function updateScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight
  if (max <= 0) return
  scrollProgress = Math.min(Math.max(window.scrollY/max, 0), 1)
  depthEl.textContent = Math.round(scrollProgress*MAX_DEPTH).toLocaleString()
  const z = ZONES.find((z) => {
    const d = scrollProgress*MAX_DEPTH
    return d >= z.depthStart && d <= z.depthEnd
  })
  if (z) zoneEl.textContent = z.name
}
window.addEventListener('scroll', updateScroll, { passive: true })
lenis.on('scroll', updateScroll)

// Text overlays
const textOverlays = document.querySelectorAll('.text-overlay')
function updateTexts() {
  textOverlays.forEach((el) => {
    const at = parseFloat(el.dataset.at)
    const diff = Math.abs(scrollProgress - at)
    const th = 0.05
    el.style.opacity = diff < th ? String(1 - (diff/th)*0.7) : '0'
    el.style.visibility = diff < th ? 'visible' : 'hidden'
  })
}

// ============================================
// FLASHLIGHT CSS
// ============================================
const flashDiv = document.createElement('div')
Object.assign(flashDiv.style, {
  position: 'fixed', top: '0', left: '0',
  width: '100vw', height: '100vh',
  zIndex: '5', pointerEvents: 'none', opacity: '0',
})
document.body.appendChild(flashDiv)

function updateFlashCSS() {
  const startAt = 0.25
  if (scrollProgress < startAt) { flashDiv.style.opacity = '0'; return }
  const intensity = Math.min((scrollProgress-startAt)/0.2, 1)
  flashDiv.style.opacity = String(intensity)
  const radius = Math.round(350 - intensity*150)
  const dark = 0.75 + intensity*0.2
  const px = (clientX/window.innerWidth)*100
  const py = (clientY/window.innerHeight)*100
  flashDiv.style.background = `radial-gradient(
    circle ${radius}px at ${px}% ${py}%,
    rgba(80,140,200,${0.06*intensity}) 0%, transparent 20%,
    rgba(0,5,15,${dark*0.4}) 40%, rgba(0,3,10,${dark*0.75}) 65%, rgba(0,0,3,${dark}) 100%
  )`
}

// ============================================
// ZONE LERP
// ============================================
function getZoneLerp(p) {
  for (let i = 0; i < ZONES.length; i++) {
    const z = ZONES[i]
    if (p >= z.pStart && p <= z.pEnd) {
      return { z, next: ZONES[Math.min(i+1, ZONES.length-1)], t: (p-z.pStart)/(z.pEnd-z.pStart) }
    }
  }
  return { z: ZONES[4], next: ZONES[4], t: 1 }
}

// ============================================
// LOADING SCREEN
// ============================================
const loadingEl = document.getElementById('loading')
let loaded = false
textureLoader.manager.onLoad = () => {
  loaded = true
  if (loadingEl) {
    gsap.to(loadingEl, { opacity: 0, duration: 1, delay: 0.5, onComplete: () => loadingEl.remove() })
  }
}

// ============================================
// RENDER LOOP
// ============================================
const clock = new THREE.Clock()
const c1 = new THREE.Color(), c2 = new THREE.Color()

function animate() {
  requestAnimationFrame(animate)
  const t = clock.getElapsedTime()

  mouseX += (targetMX-mouseX)*0.04
  mouseY += (targetMY-mouseY)*0.04

  // Camera
  const tz = 5 - scrollProgress*WORLD_DEPTH
  camera.position.z += (tz-camera.position.z)*0.08
  camera.position.x = mouseX*MOUSE_INFLUENCE
  camera.position.y = -mouseY*(MOUSE_INFLUENCE*0.5)
  camera.lookAt(camera.position.x*0.15, camera.position.y*0.15, camera.position.z-30)

  // Zone
  const { z: zone, next, t: zt } = getZoneLerp(scrollProgress)

  // Background
  c1.set(zone.bg[0]).lerp(c2.set(zone.bg[1]), zt)
  const bg = c1.clone()
  if (zone !== next) { c2.set(next.bg[0]); bg.lerp(c2, zt*0.3) }
  scene.background.copy(bg)
  scene.fog.color.copy(bg)
  scene.fog.near = THREE.MathUtils.lerp(zone.fog[0], next.fog[0], zt)
  scene.fog.far = THREE.MathUtils.lerp(zone.fog[1], next.fog[1], zt)

  // Lighting
  ambientLight.intensity = THREE.MathUtils.lerp(zone.ambient, next.ambient, zt)
  sunLight.intensity = Math.max(0, 1.0 - scrollProgress*2.5)

  // Flashlight 3D
  flashLight.position.set(camera.position.x, camera.position.y, camera.position.z+2)
  if (scrollProgress > 0.25) {
    const fi = Math.min((scrollProgress-0.25)/0.15, 1)
    flashLight.intensity = fi*5
    flashLight.distance = 30 + fi*20
  } else { flashLight.intensity = 0 }

  // Water surface
  waterSurfaceMat.uniforms.uTime.value = t
  waterSurface.material.opacity = Math.max(0, 1 - scrollProgress*5)

  // Caustic
  causticMat.uniforms.uTime.value = t
  causticMat.uniforms.uStrength.value = THREE.MathUtils.lerp(zone.causticStr, next.causticStr, zt)

  // Post-processing: increase effects with depth
  bloomEffect.intensity = 0.8 + scrollProgress * 2.0 // more bloom in deep (biolum glow)
  chromaticEffect.offset.set(0.0005 + scrollProgress*0.002, 0.0005 + scrollProgress*0.002)
  vignetteEffect.darkness = 0.4 + scrollProgress * 0.6

  // Creatures swim + billboard + wiggle shader
  allCreatures.forEach((mesh) => {
    const u = mesh.userData

    // Billboard: always face camera
    if (u.isBillboard) {
      mesh.quaternion.copy(camera.quaternion)
    }

    // Update wiggle shader time
    if (mesh.material.uniforms) {
      mesh.material.uniforms.uTime.value = t
    }

    if (u.swim === 0) return

    // Swim across screen
    const drift = u.speed * 0.8
    u.ox += drift * 0.016 * (u.px > Math.PI ? 1 : -1)
    if (u.ox > 18) u.ox = -18
    if (u.ox < -18) u.ox = 18
    mesh.position.x = u.ox + Math.sin(t*u.speed*1.5+u.px)*u.swim*0.3
    mesh.position.y = u.oy + Math.sin(t*u.speed*0.8+u.py)*(u.swim*0.4)

    if (u.gl) {
      u.gl.position.copy(mesh.position)
      u.gl.intensity = u.glBase*(0.6+Math.sin(t+u.px)*0.4)
    }
  })

  // Bubbles
  const bp = bubbleGeo.attributes.position
  for (let i = 0; i < BUBBLE_COUNT; i++) {
    bp.array[i*3+1] += bubbleSpeeds[i]
    bp.array[i*3] += Math.sin(t*0.5+i*0.3)*0.003
    if (bp.array[i*3+1] > camera.position.y+15) {
      bp.array[i*3+1] = camera.position.y-15
      bp.array[i*3] = (Math.random()-0.5)*35
    }
  }
  bp.needsUpdate = true
  bubbleMat.opacity = Math.max(0.05, 0.4-scrollProgress*0.5)

  // Snow
  const sp = snowGeo.attributes.position
  for (let i = 0; i < SNOW_COUNT; i++) {
    sp.array[i*3+1] -= 0.003
    sp.array[i*3] += Math.sin(t*0.2+i*0.4)*0.0006
    if (sp.array[i*3+1] < camera.position.y-15) sp.array[i*3+1] = camera.position.y+15
  }
  sp.needsUpdate = true

  // Bio
  const biop = bioGeo.attributes.position
  for (let i = 0; i < BIO_COUNT; i++) {
    biop.array[i*3] += Math.sin(t*0.2+i*0.5)*0.002
    biop.array[i*3+1] += Math.cos(t*0.15+i*0.3)*0.0015
  }
  biop.needsUpdate = true
  bioMat.opacity = 0.3+Math.sin(t*0.5)*0.3

  updateTexts()
  updateFlashCSS()
  updateAudio()

  // Render with postprocessing
  composer.render()
  // Caustic overlay
  renderer.autoClear = false
  renderer.render(overlayScene, overlayCamera)
  renderer.autoClear = true
}

// ============================================
// RESIZE
// ============================================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
})

// ============================================
// START
// ============================================
animate()
setTimeout(() => {
  const h = document.querySelector('[data-at="0"]')
  if (h) { h.style.opacity = '1'; h.style.visibility = 'visible' }
}, 300)
