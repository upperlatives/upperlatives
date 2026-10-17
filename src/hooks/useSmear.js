import { useEffect } from 'react'

/*
 * "Shadow smear": dark pixels stream toward the cursor in noisy threads with a
 * faint iridescent tint. Shader ported from "WIDE — Animated Fashion Magazine
 * Grid Layout" by BL/S® Studio on CodePen (public pens are MIT licensed).
 */

export const SMEAR_DEFAULTS = {
  samples: 20, // per pixel; the most expensive number here
  hoverRadius: 605, // px from the element centre where the effect fades out
  centerFade: 200, // fades right under the cursor
  pullStrength: 0.2, // smear length, fraction of the element
  threadScale: 10, // low = broad streams, high = fine threads
  warpAmount: 0.9, // 0 = straight smear, higher = chaos
  iridescent: 0.1,
  opacity: 1.3,
  lumaMin: 0.45, // the effect only grabs pixels darker than this band…
  lumaMax: 0.55,
  invert: false, // …or brighter, when true (light text on dark panels)
  background: '#ffffff', // colour behind transparent sources (text)
  dither: 1,
  fadeLag: 1.5, // seconds to ramp in / out
  dprCap: 1.5,
}

const VERTEX = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`

const fragment = (samples) => `
precision mediump float;
uniform sampler2D u_image;
uniform vec2 u_res, u_mouse;
uniform vec3 u_bg;
uniform float u_time, u_hoverRadius, u_centerFade, u_pullStrength, u_threadScale,
  u_warpAmount, u_iridescent, u_opacity, u_lumaMin, u_lumaMax, u_invert, u_dither, u_presence;
varying vec2 v_uv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
// five octaves, each rotated and doubled in scale
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 5; ++i) {
    v += a * noise(p);
    p = rot * p * 2.0 + vec2(100.0);
    a *= 0.5;
  }
  return v;
}

// transparent source pixels count as the background colour
vec3 over(vec4 c) { return mix(u_bg, c.rgb, c.a); }

void main() {
  vec4 original = texture2D(u_image, v_uv);
  vec3 base = over(original);

  vec2 center = u_res * 0.5;
  vec2 delta = u_mouse - center;
  float dist = length(delta);
  vec2 dir = dist > 0.1 ? normalize(delta) : vec2(0.0, 1.0);

  // the effect lives in a ring: it fades far away and right under the cursor
  float activation = smoothstep(u_hoverRadius, u_res.x * 0.2, dist);
  activation *= smoothstep(0.0, u_centerFade, dist);
  activation *= u_presence;

  vec3 acc = vec3(0.0);
  float total = 0.0;

  if (activation > 0.0) {
    float jitter = hash(gl_FragCoord.xy) * u_dither;
    for (int i = 0; i < ${samples}; i++) {
      float f = (float(i) + jitter) / ${samples}.0;
      float n = fbm(v_uv * u_threadScale + u_time * 0.4);
      vec2 warped = normalize(dir + vec2(n - 0.5) * u_warpAmount);
      vec2 suv = clamp(v_uv - warped * (f * u_pullStrength * activation), 0.0, 1.0);
      vec3 s = over(texture2D(u_image, suv));

      float luma = dot(s, vec3(0.299, 0.587, 0.114));
      float mask = 1.0 - smoothstep(u_lumaMin, u_lumaMax, luma);
      if (u_invert > 0.5) mask = 1.0 - mask;
      float thread = smoothstep(0.3, 0.7, fbm(suv * u_threadScale * 1.5));
      float weight = (1.0 - f) * mask * thread;

      vec3 irid = vec3(0.5) + vec3(0.5) * cos(6.28318 * (f * 1.5 - u_time * 0.8 + vec3(0.0, 0.33, 0.67)));
      acc += mix(s, irid, u_iridescent * f) * weight;
      total += weight;
    }
  }

  vec3 color = base;
  float alpha = original.a;
  if (total > 0.0) {
    float k = clamp(total * u_opacity, 0.0, 1.0);
    color = mix(base, acc / total, k);
    alpha = max(alpha, k); // streams show outside the letters, nothing else does
  }
  gl_FragColor = vec4(color, alpha);
}`

/** Any CSS colour -> [r, g, b] in 0..1 */
function cssColor(color) {
  const ctx = document.createElement('canvas').getContext('2d')
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return [r / 255, g / 255, b / 255]
}

function createProgram(gl, samples) {
  const compile = (type, src) => {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    return shader
  }
  const program = gl.createProgram()
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX))
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment(samples)))
  gl.linkProgram(program)
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null
}

/**
 * Renders `source` (an async function returning a canvas/image the size of
 * `canvas` at the given dpr) into `canvas`, smeared toward the pointer while it
 * is over `area`. Draws one still frame at rest and animates only while active.
 * `onReady` is called once the first frame is on screen.
 */
export default function useSmear({ area, canvas, source, options, enabled = true, onReady }) {
  useEffect(() => {
    const areaEl = area.current
    const canvasEl = canvas.current
    if (!enabled || !areaEl || !canvasEl) return

    const o = { ...SMEAR_DEFAULTS, ...options }
    const gl = canvasEl.getContext('webgl', { premultipliedAlpha: false, alpha: true })
    const program = gl && createProgram(gl, o.samples)
    if (!program) return

    gl.useProgram(program)
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    ;['TEXTURE_MIN_FILTER', 'TEXTURE_MAG_FILTER'].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, gl[k], gl.LINEAR))
    ;['TEXTURE_WRAP_S', 'TEXTURE_WRAP_T'].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, gl[k], gl.CLAMP_TO_EDGE))

    const u = {}
    for (const name of ['res', 'mouse', 'bg', 'time', 'hoverRadius', 'centerFade', 'pullStrength', 'threadScale',
      'warpAmount', 'iridescent', 'opacity', 'lumaMin', 'lumaMax', 'invert', 'dither', 'presence']) {
      u[name] = gl.getUniformLocation(program, `u_${name}`)
    }

    const state = { dpr: 1, ready: false, over: false, presence: 0, mouse: [-99999, -99999], raf: 0, last: 0 }
    let disposed = false

    function draw(time) {
      gl.uniform2f(u.mouse, state.mouse[0], state.mouse[1])
      gl.uniform1f(u.time, time / 1000)
      gl.uniform1f(u.presence, state.presence)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    function loop(time) {
      const dt = state.last ? Math.min((time - state.last) / 1000, 0.1) : 0.016
      state.last = time
      const k = 1 - Math.exp(-dt / o.fadeLag)
      state.presence += ((state.over ? 1 : 0) - state.presence) * k
      draw(time)
      if (!state.over && state.presence < 0.002) {
        state.presence = 0
        draw(time)
        state.raf = 0
        return
      }
      state.raf = requestAnimationFrame(loop)
    }
    const wake = () => {
      if (!state.raf && state.ready) {
        state.last = 0
        state.raf = requestAnimationFrame(loop)
      }
    }

    async function prepare() {
      const dpr = Math.min(window.devicePixelRatio || 1, o.dprCap)
      const img = await source(dpr)
      if (disposed || !img) return
      canvasEl.width = img.width
      canvasEl.height = img.height
      gl.viewport(0, 0, canvasEl.width, canvasEl.height)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      gl.uniform2f(u.res, canvasEl.width, canvasEl.height)
      gl.uniform1f(u.hoverRadius, o.hoverRadius * dpr)
      gl.uniform1f(u.centerFade, o.centerFade * dpr)
      gl.uniform1f(u.pullStrength, o.pullStrength)
      gl.uniform1f(u.threadScale, o.threadScale)
      gl.uniform1f(u.warpAmount, o.warpAmount)
      gl.uniform1f(u.iridescent, o.iridescent)
      gl.uniform1f(u.opacity, o.opacity)
      gl.uniform1f(u.lumaMin, o.lumaMin)
      gl.uniform1f(u.lumaMax, o.lumaMax)
      gl.uniform1f(u.invert, o.invert ? 1 : 0)
      gl.uniform1f(u.dither, o.dither)
      gl.uniform3fv(u.bg, cssColor(o.background))
      state.dpr = dpr
      state.ready = true
      draw(performance.now())
      onReady?.()
      if (state.over) wake()
    }

    const onMove = (e) => {
      const box = canvasEl.getBoundingClientRect()
      state.mouse = [(e.clientX - box.left) * state.dpr, (e.clientY - box.top) * state.dpr]
      state.over = true
      wake()
    }
    const onLeave = () => {
      state.over = false
    }

    let resizeTimer
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => prepare().catch(() => {}), 150)
    })
    observer.observe(canvasEl)
    areaEl.addEventListener('pointermove', onMove)
    areaEl.addEventListener('pointerleave', onLeave)

    return () => {
      disposed = true
      cancelAnimationFrame(state.raf)
      clearTimeout(resizeTimer)
      observer.disconnect()
      areaEl.removeEventListener('pointermove', onMove)
      areaEl.removeEventListener('pointerleave', onLeave)
      gl.deleteTexture(texture)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    }
  }, [area, canvas, source, options, enabled, onReady])
}
