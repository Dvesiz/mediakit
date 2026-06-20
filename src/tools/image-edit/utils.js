/**
 * 图片编辑工具 - 核心编辑操作
 */
import { loadImage, formatSize, canvasToBlob } from '../../common/image-utils.js'

export { loadImage, formatSize, canvasToBlob }

/**
 * 在 Canvas 上绘制图片
 */
export function drawImageOnCanvas(canvas, img) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('浏览器不支持 Canvas 2D')
  canvas.width = img.naturalWidth || img.width
  canvas.height = img.naturalHeight || img.height
  ctx.drawImage(img, 0, 0)
}

/**
 * 旋转图片
 * @param {HTMLCanvasElement} sourceCanvas
 * @param {number} degrees - 90 | 180 | 270
 * @returns {HTMLCanvasElement}
 */
export function rotateCanvas(sourceCanvas, degrees) {
  const result = document.createElement('canvas')
  const ctx = result.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D 不可用')

  const isSideways = degrees === 90 || degrees === 270
  result.width = isSideways ? sourceCanvas.height : sourceCanvas.width
  result.height = isSideways ? sourceCanvas.width : sourceCanvas.height

  ctx.translate(result.width / 2, result.height / 2)
  ctx.rotate((degrees * Math.PI) / 180)
  ctx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2)

  return result
}

/**
 * 翻转图片
 * @param {HTMLCanvasElement} sourceCanvas
 * @param {'horizontal' | 'vertical'} direction
 * @returns {HTMLCanvasElement}
 */
export function flipCanvas(sourceCanvas, direction) {
  const result = document.createElement('canvas')
  result.width = sourceCanvas.width
  result.height = sourceCanvas.height
  const ctx = result.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D 不可用')

  if (direction === 'horizontal') {
    ctx.translate(result.width, 0)
    ctx.scale(-1, 1)
  } else {
    ctx.translate(0, result.height)
    ctx.scale(1, -1)
  }

  ctx.drawImage(sourceCanvas, 0, 0)
  return result
}

/**
 * 缩放图片
 * @param {HTMLCanvasElement} sourceCanvas
 * @param {number} scalePercent - 1-200
 * @returns {HTMLCanvasElement}
 */
export function scaleCanvas(sourceCanvas, scalePercent) {
  const ratio = scalePercent / 100
  const result = document.createElement('canvas')
  result.width = Math.round(sourceCanvas.width * ratio)
  result.height = Math.round(sourceCanvas.height * ratio)
  const ctx = result.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D 不可用')

  ctx.drawImage(sourceCanvas, 0, 0, result.width, result.height)
  return result
}

/**
 * 裁剪图片
 * @param {HTMLCanvasElement} sourceCanvas
 * @param {Object} region - { x, y, width, height }
 * @returns {HTMLCanvasElement}
 */
export function cropCanvas(sourceCanvas, region) {
  const result = document.createElement('canvas')
  result.width = Math.round(region.width)
  result.height = Math.round(region.height)
  const ctx = result.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D 不可用')

  ctx.drawImage(
    sourceCanvas,
    region.x, region.y, region.width, region.height,
    0, 0, region.width, region.height
  )

  return result
}

/**
 * 应用 CSS 滤镜
 * @param {HTMLCanvasElement} sourceCanvas
 * @param {Object} filters - { brightness, contrast, saturate, grayscale, blur }
 * @returns {HTMLCanvasElement}
 */
export function applyFilters(sourceCanvas, filters = {}) {
  const result = document.createElement('canvas')
  result.width = sourceCanvas.width
  result.height = sourceCanvas.height
  const ctx = result.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D 不可用')

  const f = {
    brightness: filters.brightness ?? 100,
    contrast: filters.contrast ?? 100,
    saturate: filters.saturate ?? 100,
    grayscale: filters.grayscale ?? 0,
    blur: filters.blur ?? 0,
  }

  ctx.filter = [
    `brightness(${f.brightness}%)`,
    `contrast(${f.contrast}%)`,
    `saturate(${f.saturate}%)`,
    `grayscale(${f.grayscale}%)`,
    f.blur > 0 ? `blur(${f.blur}px)` : '',
  ].filter(Boolean).join(' ')

  ctx.drawImage(sourceCanvas, 0, 0)
  return result
}

/**
 * Canvas 转 Data URL（快照用）
 */
export function canvasToDataUrl(canvas) {
  return canvas.toDataURL('image/png')
}

/**
 * Data URL 加载为 Image
 */
export function dataUrlToImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = dataUrl
  })
}
