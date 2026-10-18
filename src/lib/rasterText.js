import interUrl from '@fontsource-variable/inter/files/inter-latin-opsz-normal.woff2?url'

// Canvas 2D cannot set font-variation-settings, so letters are drawn via an SVG
// image with the font embedded — that keeps the "opsz" (Display) axis and makes
// the canvas copy identical to the DOM text. The SVG also gets the page's
// font smoothing; without it macOS draws the copy visibly bolder.
let fontData
function embeddedFont() {
  fontData ||= fetch(interUrl)
    .then((r) => r.blob())
    .then(
      (blob) =>
        new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.readAsDataURL(blob)
        }),
    )
  return fontData
}

const escapeXml = (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch] || ch

/**
 * Draw a line of per-letter spans (`lineEl`) into a canvas the size of `boxEl`,
 * each glyph exactly where the browser laid it out (layout position, so intro
 * transforms are ignored). Optionally fills a background colour first.
 */
export async function rasterizeLine({ lineEl, boxEl, dpr, background, color }) {
  const box = boxEl.getBoundingClientRect()
  const lineBox = lineEl.getBoundingClientRect()
  const style = getComputedStyle(lineEl)
  const fontSize = parseFloat(style.fontSize)

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(box.width * dpr)
  canvas.height = Math.round(box.height * dpr)
  const ctx = canvas.getContext('2d')

  ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  const glyphs = [...lineEl.children].map((letter) => {
    const r = letter.getBoundingClientRect()
    const m = ctx.measureText(letter.textContent)
    const content = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent
    return {
      ch: letter.textContent,
      x: r.left - box.left,
      y: lineBox.top - box.top + (r.height - content) / 2 + m.fontBoundingBoxAscent,
    }
  })

  const font = await embeddedFont()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${box.width} ${box.height}">
    <style>@font-face{font-family:W;src:url(${font}) format('woff2');font-weight:100 900}</style>
    <text font-family="W" font-size="${fontSize}" font-weight="${style.fontWeight}" fill="${color || style.color}" style="font-variation-settings:'opsz' 32;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale">
      ${glyphs.map((g) => `<tspan x="${g.x}" y="${g.y}">${escapeXml(g.ch)}</tspan>`).join('')}
    </text></svg>`
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await img.decode()

  if (background) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return { canvas, fontSize }
}

/**
 * Draw the text inside `textEl` (any wrapping, any number of lines) into a
 * canvas the size of `boxEl`. Every character is placed where the browser laid
 * it out (measured with a Range, so the DOM and its kerning stay untouched).
 */
export async function rasterizeText({ textEl, boxEl, dpr }) {
  const box = boxEl.getBoundingClientRect()
  const style = getComputedStyle(textEl)
  const fontSize = parseFloat(style.fontSize)

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(box.width * dpr)
  canvas.height = Math.round(box.height * dpr)
  const ctx = canvas.getContext('2d')
  ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  const ascent = ctx.measureText('H').fontBoundingBoxAscent

  const glyphs = []
  const range = document.createRange()
  const walker = document.createTreeWalker(textEl, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const chars = [...node.data] // code points, so emoji/umlauts stay whole
    let offset = 0
    for (const ch of chars) {
      range.setStart(node, offset)
      range.setEnd(node, offset + ch.length)
      offset += ch.length
      if (!ch.trim()) continue
      const r = range.getClientRects()[0]
      if (r) glyphs.push({ ch, x: r.left - box.left, y: r.top - box.top + ascent })
    }
  }

  const font = await embeddedFont()
  const variation = style.fontVariationSettings !== 'normal' ? style.fontVariationSettings : "'opsz' 32"
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${box.width} ${box.height}">
    <style>@font-face{font-family:W;src:url(${font}) format('woff2');font-weight:100 900}</style>
    <text font-family="W" font-size="${fontSize}" font-weight="${style.fontWeight}" fill="${style.color}" style="font-variation-settings:${variation.replace(/"/g, "'")};-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale">
      ${glyphs.map((g) => `<tspan x="${g.x}" y="${g.y}">${escapeXml(g.ch)}</tspan>`).join('')}
    </text></svg>`
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await img.decode()
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas
}
