/**
 * 颜色实验室 - 核心颜色处理逻辑（纯函数，可单元测试）
 */

/**
 * 解析 HEX 字符串为 RGB
 * 支持 #rgb / #rrggbb（带或不带 #）
 * @param {string} hex
 * @returns {{r:number,g:number,b:number}|null}
 */
export function hexToRgb(hex) {
  if (typeof hex !== 'string') return null
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

/**
 * RGB 转 HEX
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {string} 如 "#3a7bd5"
 */
export function rgbToHex(r, g, b) {
  const to2 = (n) => clampByte(n).toString(16).padStart(2, '0')
  return '#' + to2(r) + to2(g) + to2(b)
}

/**
 * RGB 转 HSL
 * @returns {{h:number,s:number,l:number}} h:0-360, s/l:0-100
 */
export function rgbToHsl(r, g, b) {
  r = clampByte(r) / 255
  g = clampByte(g) / 255
  b = clampByte(b) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const l = (max + min) / 2
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/**
 * HSL 转 RGB
 * @param {number} h 0-360
 * @param {number} s 0-100
 * @param {number} l 0-100
 * @returns {{r:number,g:number,b:number}}
 */
export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360
  s = Math.min(100, Math.max(0, s)) / 100
  l = Math.min(100, Math.max(0, l)) / 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

/**
 * 通用颜色解析：接受 HEX / rgb() / hsl() 文本
 * @param {string} input
 * @returns {{r:number,g:number,b:number}|null}
 */
export function parseColor(input) {
  if (typeof input !== 'string') return null
  const str = input.trim()

  const hex = hexToRgb(str)
  if (hex) return hex

  const rgbM = str.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)$/i)
  if (rgbM) {
    return {
      r: clampByte(+rgbM[1]),
      g: clampByte(+rgbM[2]),
      b: clampByte(+rgbM[3]),
    }
  }

  const hslM = str.match(/^hsla?\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*(?:,\s*[\d.]+\s*)?\)$/i)
  if (hslM) {
    return hslToRgb(+hslM[1], +hslM[2], +hslM[3])
  }

  return null
}

/** 格式化 rgb 字符串 */
export function formatRgb({ r, g, b }) {
  return `rgb(${clampByte(r)}, ${clampByte(g)}, ${clampByte(b)})`
}

/** 格式化 hsl 字符串 */
export function formatHsl({ h, s, l }) {
  return `hsl(${h}, ${s}%, ${l}%)`
}

/**
 * 相对亮度（WCAG 定义），用于对比度计算
 * @param {{r:number,g:number,b:number}} rgb
 * @returns {number} 0-1
 */
export function relativeLuminance({ r, g, b }) {
  const lin = (c) => {
    c = clampByte(c) / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/**
 * WCAG 对比度（1-21），用于判断文字可读性
 * @returns {number} 保留两位小数
 */
export function contrastRatio(c1, c2) {
  const l1 = relativeLuminance(c1)
  const l2 = relativeLuminance(c2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100
}

/**
 * 从 RGBA 像素数据提取主色调色板
 * 采用按位量化分桶 + 频率排序，确定性、无随机
 * @param {Uint8ClampedArray|number[]} rgbaData - 连续的 RGBA 字节
 * @param {number} [count=6] - 返回颜色数量
 * @param {object} [options]
 * @param {number} [options.quantBits=4] - 每通道保留位数（越小越聚合）
 * @param {number} [options.minAlpha=128] - 低于此 alpha 的像素忽略
 * @returns {Array<{r:number,g:number,b:number}>}
 */
export function extractPalette(rgbaData, count = 6, options = {}) {
  const { quantBits = 4, minAlpha = 128 } = options
  const shift = 8 - quantBits
  const buckets = new Map()

  for (let i = 0; i + 3 < rgbaData.length; i += 4) {
    if (rgbaData[i + 3] < minAlpha) continue
    const r = rgbaData[i]
    const g = rgbaData[i + 1]
    const b = rgbaData[i + 2]
    const key = ((r >> shift) << (quantBits * 2)) | ((g >> shift) << quantBits) | (b >> shift)
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { r: 0, g: 0, b: 0, n: 0 }
      buckets.set(key, bucket)
    }
    bucket.r += r
    bucket.g += g
    bucket.b += b
    bucket.n++
  }

  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, count)
    .map((bk) => ({
      r: Math.round(bk.r / bk.n),
      g: Math.round(bk.g / bk.n),
      b: Math.round(bk.b / bk.n),
    }))
}

/** 将数值钳制到 0-255 整数字节 */
export function clampByte(n) {
  n = Math.round(Number(n))
  if (Number.isNaN(n)) return 0
  return Math.min(255, Math.max(0, n))
}
