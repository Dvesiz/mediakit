/**
 * 图片压缩工具 - 核心压缩逻辑
 */

/**
 * 通过 Canvas API 压缩图片
 * @param {HTMLImageElement} img
 * @param {number} quality 0-1
 * @param {string} type 输出格式 'image/jpeg' | 'image/png' | 'image/webp'
 * @param {number} maxDimension 最大宽高（超过则等比缩放）
 * @returns {Promise<Blob>}
 */
export function compressImage(img, quality = 0.8, type = 'image/jpeg', maxDimension = 0) {
  return new Promise((resolve, reject) => {
    try {
      let { width, height } = img

      // 超大图片自动缩放
      if (maxDimension > 0 && (width > maxDimension || height > maxDimension)) {
        const ratio = Math.min(maxDimension / width, maxDimension / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('浏览器不支持 Canvas 2D'))
        return
      }

      // 如果是透明 PNG，强制输出 PNG 格式
      const outputType = (type === 'image/jpeg' && hasTransparency(img)) ? 'image/png' : type

      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('压缩失败'))
            return
          }
          resolve({ blob, width, height, type: outputType })
        },
        outputType,
        quality
      )
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * 检查图片是否有透明度通道
 */
function hasTransparency(img) {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth || img.width
  canvas.height = img.naturalHeight || img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return false

  ctx.drawImage(img, 0, 0)
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
  for (let i = 3; i < pixels.data.length; i += 4) {
    if (pixels.data[i] < 255) return true
  }
  return false
}

/**
 * 加载图片文件到 HTMLImageElement
 * @param {File} file
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('请上传图片文件（PNG/JPG/WebP）'))
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
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

/**
 * 计算压缩率
 */
export function calcRatio(originalBytes, compressedBytes) {
  if (originalBytes === 0) return 0
  return ((1 - compressedBytes / originalBytes) * 100).toFixed(1)
}

/**
 * 从 Blob 创建可下载链接
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 确定是否需要缩放超大图片
 */
export function needsResize(width, height, maxDim = 4000) {
  return width > maxDim || height > maxDim
}
