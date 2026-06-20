/**
 * 格式转换工具 - 核心转换逻辑
 */

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
 * 加载图片文件
 * @param {File} file
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('请上传图片文件'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('图片加载失败'))
      img.onload = () => resolve(img)
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

/**
 * 格式化文件大小
 */
export function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

/**
 * 从原始文件名和目标格式生成新文件名
 */
export function getOutputFilename(originalName, targetExt) {
  return originalName.replace(/\.[^.]+$/, '') + '.' + targetExt
}

/**
 * 下载 Blob
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
