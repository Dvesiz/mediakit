/**
 * MediaKit - 图片工具函数库
 * 从各工具中提取的共享函数，消除重复代码
 */

/**
 * 加载图片文件到 HTMLImageElement
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
 * 格式化文件大小为人类可读字符串
 * @param {number} bytes
 * @returns {string}
 */
export function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

/**
 * 从 Blob 创建可下载链接并自动触发下载
 * @param {Blob} blob
 * @param {string} filename
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
 * Canvas 转 Blob Promise 封装
 * @param {HTMLCanvasElement} canvas
 * @param {string} [type='image/png']
 * @param {number} [quality=0.92]
 * @returns {Promise<Blob>}
 */
export function canvasToBlob(canvas, type = 'image/png', quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('导出失败'))
        resolve(blob)
      },
      type,
      quality
    )
  })
}
