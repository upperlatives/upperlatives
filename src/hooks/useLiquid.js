import { useEffect } from 'react'
import { rasterizeLine } from '../lib/rasterText'

const VERTEX = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`

// Pixels near the pointer are pulled along with its velocity, plus a sideways
// wave that bends vertical strokes — the liquid look of the reference logo.
const FRAGMENT = `
precision highp float;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform vec2 u_mouse;
uniform vec2 u_vel;
uniform float u_radius;
uniform float u_time;
varying vec2 v_uv;
void main() {
  vec2 p = v_uv * u_res;
  vec2 d = (p - u_mouse) / u_radius;
  float falloff = exp(-dot(d, d));
  float speed = length(u_vel);
  float wave = sin(p.y / u_radius * 2.0 + u_time * 3.0);
  vec2 offset = falloff * (u_vel * 4.0 + vec2(wave * speed * 1.8, 0.0));
  vec2 uv = (p - offset) / u_res;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0);
  } else {
    gl_FragColor = texture2D(u_tex, uv);
  }
}`

function createProgram(gl) {
  const compile = (type, src) => {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    return shader
  }
  const program = gl.createProgram()
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX))
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT))
  gl.linkProgram(program)
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null
}

/**
 * Liquid distortion of a line of text under the pointer.
 *
 * `area` receives the pointer events, `line` holds one inline-block span per
 * letter, `canvas` sits over the text. The DOM text stays visible at rest; while
 * the effect runs it is hidden and a rasterised copy is distorted on the canvas.
 * `ready` is a ref that turns true once the intro animation has finished.
 */
export default function useLiquid({ area, line, canvas, ready, enabled }) {
  useEffect(() => {
    const areaEl = area.current
    const lineEl = line.current
    const canvasEl = canvas.current
    if (!enabled || !areaEl || !lineEl || !canvasEl) return

    const gl = canvasEl.getContext('webgl', { premultipliedAlpha: true, alpha: true })
    const program = gl && createProgram(gl)
    if (!program) return // no WebGL: plain text, no effect

    gl.useProgram(program)
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    const u = Object.fromEntries(
      ['u_res', 'u_mouse', 'u_vel', 'u_radius', 'u_time'].map((n) => [n, gl.getUniformLocation(program, n)]),
    )

    const state = { dpr: 1, mouse: null, target: null, vel: [0, 0], inside: false, active: false, rastered: false, broken: false, raf: 0 }

    // The canvas copy only depends on size, so this only reruns on resize.
    async function rasterise() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const { canvas: copy, fontSize } = await rasterizeLine({ lineEl, boxEl: canvasEl, dpr })
      canvasEl.width = copy.width
      canvasEl.height = copy.height
      gl.viewport(0, 0, canvasEl.width, canvasEl.height)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, copy)
      gl.uniform2f(u.u_res, canvasEl.width, canvasEl.height)
      gl.uniform1f(u.u_radius, fontSize * 0.38 * dpr)
      state.dpr = dpr
      state.rastered = true
    }

    let disposed = false
    const prepare = () => {
      state.rastered = false
      ;(document.fonts?.ready || Promise.resolve())
        .then(() => !disposed && rasterise())
        .catch(() => {
          state.broken = true // e.g. canvas tainted in an old browser: no effect
        })
    }

    function frame(time) {
      const { mouse, target, vel } = state
      const prev = [mouse[0], mouse[1]]
      mouse[0] += (target[0] - mouse[0]) * 0.25
      mouse[1] += (target[1] - mouse[1]) * 0.25
      // smoothed velocity: rises while moving, eases back to zero when still
      vel[0] += (mouse[0] - prev[0] - vel[0]) * 0.12
      vel[1] += (mouse[1] - prev[1] - vel[1]) * 0.12

      gl.uniform2f(u.u_mouse, mouse[0], mouse[1])
      gl.uniform2f(u.u_vel, vel[0], vel[1])
      gl.uniform1f(u.u_time, time / 1000)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      if (!state.inside && Math.hypot(vel[0], vel[1]) < 0.05 && Math.hypot(target[0] - mouse[0], target[1] - mouse[1]) < 1) {
        stop()
        return
      }
      state.raf = requestAnimationFrame(frame)
    }

    function start(point) {
      state.mouse = [...point]
      state.target = [...point]
      state.vel = [0, 0]
      state.active = true
      canvasEl.style.opacity = '1'
      lineEl.style.visibility = 'hidden'
      state.raf = requestAnimationFrame(frame)
    }

    function stop() {
      state.active = false
      canvasEl.style.opacity = '0'
      lineEl.style.visibility = ''
    }

    const toCanvas = (e) => {
      const box = canvasEl.getBoundingClientRect()
      return [(e.clientX - box.left) * state.dpr, (e.clientY - box.top) * state.dpr]
    }

    const onMove = (e) => {
      if (!ready.current || !state.rastered || state.broken) return
      state.inside = true
      if (!state.active) start(toCanvas(e))
      else state.target = toCanvas(e)
    }
    const onLeave = () => {
      state.inside = false
    }
    // Size changed (also fires once on mount): drop back to the DOM text and
    // draw the copy again.
    let resizeTimer
    const observer = new ResizeObserver(() => {
      if (state.active) {
        cancelAnimationFrame(state.raf)
        stop()
      }
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(prepare, 150)
    })
    observer.observe(canvasEl)

    areaEl.addEventListener('pointermove', onMove)
    areaEl.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(state.raf)
      areaEl.removeEventListener('pointermove', onMove)
      areaEl.removeEventListener('pointerleave', onLeave)
      disposed = true
      clearTimeout(resizeTimer)
      observer.disconnect()
      lineEl.style.visibility = ''
      // free GPU resources but keep the context: the effect may run again on the
      // same canvas (StrictMode, prop changes) and a lost context can't be reused
      gl.deleteTexture(texture)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    }
  }, [area, line, canvas, ready, enabled])
}
