/**
 * 格式转换工具 - 核心转换逻辑
 */
import { loadImage, formatSize, downloadBlob } from '../../common/image-utils.js'

export { loadImage, formatSize, downloadBlob }

// 支持的格式元信息
export const FORMATS = {
  'image/png': { label: 'PNG', ext: 'png', mime: 'image/png' },
  'image/jpeg': { label: 'JPEG', ext: 'jpg', mime: 'image/jpeg' },
  'image/webp': { label: 'WebP', ext: 'webp', mime: 'image/webp' },
  'image/bmp': { label: 'BMP', ext: 'bmp', mime: 'image/bmp' },
}

/**
 * 转换图片格式
 * @param {HTMLImageElement} img
 * @param {string} targetType - 目标 MIME 类型
 * @param {number} quality - 对于有损格式的质量 (0-1)
 * @returns {Promise<Blob>}
 */
export function convertImage(img, targetType, quality = 0.92) {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('浏览器不支持 Canvas 2D'))
        return
      }

      // 转换 JPEG 时用白色背景填充（避免透明变黑）
      if (targetType === 'image/jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      ctx.drawImage(img, 0, 0)

      // BMP 格式质量参数无效
      const qualityParam = targetType === 'image/bmp' ? undefined : quality

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('转换失败'))
            return
          }
          resolve(blob)
        },
        targetType,
        qualityParam
      )
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * 从原始文件名和目标格式生成新文件名
 */
export function getOutputFilename(originalName, targetExt) {
  return originalName.replace(/\.[^.]+$/, '') + '.' + targetExt
}
