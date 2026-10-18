import { rasterizeText } from './rasterText'

/*
 * Liquid text distortion driven by scroll speed — the effect of Codrops'
 * "Text Distortion Effects using Blotter.js", demo 1 (MIT), without Blotter.
 *
 * One shared WebGL context renders every registered heading: each frame the
 * frame's result is copied into that heading's own 2D canvas. At rest the real
 * DOM text is shown; while distorting, a canvas copy takes its place.
 */

export const DISTORT = {
  maxVolatility: 0.35, // strength at full speed (Codrops demo 1 uses 0.4)
  maxSpeed: 80, // px scrolled per frame that counts as "full speed"
  ease: 0.06, // how fast the strength follows the speed
  speed: 0.6, // how fast the noise itself moves
  seed: 0.4,
  jump: 400, // ignore scroll jumps larger than this (route changes, anchor jumps)
  overhang: 0.18, // em of room around the text for the wobble
}

const VERTEX = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`

// 3D simplex noise: Ashima Arts / Stefan Gustavson (MIT), as used by Blotter.
const FRAGMENT = `
precision highp float;
uniform sampler2D u_tex;
uniform float u_time, u_volatility, u_speed, u_seed;
varying vec2 v_uv;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
  float z = u_seed + u_time * u_speed;
  vec2 uv = v_uv + snoise(vec3(v_uv, z)) * u_volatility;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) gl_FragColor = vec4(0.0);
  else gl_FragColor = texture2D(u_tex, uv);
}`

const entries = new Set()
let gl = null
let program = null
let u = null
let glCanvas = null
let failed = false
let raf = 0
let lastScroll = 0
let volatility = 0

function initGL() {
  if (gl || failed) return !!gl
  glCanvas = document.createElement('canvas')
  gl = glCanvas.getContext('webgl', { premultipliedAlpha: true, alpha: true })
  if (!gl) return !(failed = true)
  const compile = (type, src) => {
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    return s
  }
  program = gl.createProgram()
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX))
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl = null
    return !(failed = true)
  }
  gl.useProgram(program)
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(program, 'a_pos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
  u = Object.fromEntries(['u_time', 'u_volatility', 'u_speed', 'u_seed'].map((n) => [n, gl.getUniformLocation(program, n)]))
  gl.uniform1f(u.u_speed, DISTORT.speed)
  gl.uniform1f(u.u_seed, DISTORT.seed)
  return true
}

/**
 * Size and place the canvas on whole device pixels around the heading: a
 * canvas at a fractional offset gets resampled, which makes the copy look
 * bolder and blurrier than the real text.
 */
function snapCanvas(entry, dpr) {
  const host = entry.host.getBoundingClientRect()
  const fontSize = parseFloat(getComputedStyle(entry.text).fontSize)
  const pad = Math.round(DISTORT.overhang * fontSize)
  const snap = (v) => Math.round(v * dpr) / dpr
  const left = snap(host.left - pad) - host.left
  const top = snap(host.top - pad) - host.top
  Object.assign(entry.canvas.style, {
    left: `${left}px`,
    top: `${top}px`,
    width: `${Math.ceil((host.width + 2 * pad) * dpr) / dpr}px`,
    height: `${Math.ceil((host.height + 2 * pad) * dpr) / dpr}px`,
  })
}

/** Draw the text copy of an entry into a GL texture (once per size). */
async function prepare(entry) {
  if (entry.preparing) return
  entry.preparing = true
  try {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    snapCanvas(entry, dpr)
    const copy = await rasterizeText({ textEl: entry.text, boxEl: entry.canvas, dpr })
    if (!entries.has(entry) || !gl) return
    entry.canvas.width = copy.width
    entry.canvas.height = copy.height
    entry.texture ||= gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, entry.texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, copy)
    entry.ready = true
  } catch {
    entry.broken = true
  } finally {
    entry.preparing = false
  }
}

function show(entry, distorted) {
  if (entry.distorted === distorted) return
  entry.distorted = distorted
  entry.canvas.style.opacity = distorted ? '1' : '0'
  entry.text.style.visibility = distorted ? 'hidden' : ''
}

function frame(time) {
  const scroll = window.scrollY
  let delta = Math.abs(scroll - lastScroll)
  lastScroll = scroll
  if (delta > DISTORT.jump) delta = 0
  const target = Math.min(delta / DISTORT.maxSpeed, 1) * DISTORT.maxVolatility
  volatility += (target - volatility) * DISTORT.ease

  const active = volatility > 0.002
  for (const entry of entries) {
    if (!active || !entry.visible || entry.broken) {
      show(entry, false)
      continue
    }
    if (!entry.ready) {
      prepare(entry)
      continue
    }
    const { width, height } = entry.canvas
    if (glCanvas.width !== width || glCanvas.height !== height) {
      glCanvas.width = width
      glCanvas.height = height
    }
    gl.viewport(0, 0, width, height)
    gl.bindTexture(gl.TEXTURE_2D, entry.texture)
    gl.uniform1f(u.u_time, time / 1000)
    gl.uniform1f(u.u_volatility, volatility)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    entry.ctx.clearRect(0, 0, width, height)
    entry.ctx.drawImage(glCanvas, 0, 0) // same task as the draw, so no preserveDrawingBuffer needed
    show(entry, true)
  }

  if (!active && target === 0) {
    volatility = 0
    raf = 0 // idle until the next scroll event
    return
  }
  raf = requestAnimationFrame(frame)
}

function wake() {
  if (raf || !entries.size) return
  lastScroll = window.scrollY // measure speed from now, not since the last idle
  raf = requestAnimationFrame(frame)
}

const visibility = typeof IntersectionObserver !== 'undefined'
  ? new IntersectionObserver((list) => {
      for (const { target, isIntersecting } of list) {
        const entry = [...entries].find((e) => e.canvas === target)
        if (entry) entry.visible = isIntersecting
      }
    }, { rootMargin: '100px 0px' })
  : null

const sizes = typeof ResizeObserver !== 'undefined'
  ? new ResizeObserver((list) => {
      for (const { target } of list) {
        const entry = [...entries].find((e) => e.host === target)
        if (entry) entry.ready = false // rasterise again at the new size
      }
    })
  : null

/** Register a heading: `text` holds the DOM text, `canvas` overlays it. */
export function registerDistort(text, canvas) {
  if (!initGL()) return () => {}
  const host = text.parentElement
  const entry = { text, host, canvas, ctx: canvas.getContext('2d'), visible: false, ready: false, distorted: false }
  entries.add(entry)
  if (entries.size === 1) {
    lastScroll = window.scrollY
    window.addEventListener('scroll', wake, { passive: true })
  }
  visibility?.observe(canvas)
  sizes?.observe(host)
  return () => {
    entries.delete(entry)
    visibility?.unobserve(canvas)
    sizes?.unobserve(host)
    if (entry.texture) gl.deleteTexture(entry.texture)
    text.style.visibility = ''
    if (!entries.size) window.removeEventListener('scroll', wake)
  }
}
