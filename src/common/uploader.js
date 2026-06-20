/**
 * MediaKit - 通用拖拽上传组件
 *
 * 提供一个标准的拖拽上传区域，支持文件类型和数量限制。
 */

/**
 * 创建拖拽上传区域
 * @param {Object} options
 * @param {string} options.accept - 接受的 MIME 类型或扩展名
 * @param {boolean} options.multiple - 是否允许多文件
 * @param {number} options.maxSize - 单个文件最大字节数
 * @param {function(File[]): void} options.onFiles - 文件选择回调
 * @returns {HTMLElement} dropZone 元素
 */
export function createDropZone(options = {}) {
  const {
    accept = '*',
    multiple = false,
    maxSize = 0, // 0 表示不限制
    onFiles = () => {},
  } = options

  const zone = document.createElement('div')
  zone.className = 'drop-zone'
  zone.innerHTML = `
    <div class="drop-icon">📂</div>
    <div class="drop-text">拖拽文件到此处</div>
    <div class="drop-hint">或点击选择文件</div>
  `

  // 隐藏的 file input
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = accept
  input.multiple = multiple
  input.style.display = 'none'
  zone.appendChild(input)

  // 点击触发文件选择
  zone.addEventListener('click', () => input.click())

  input.addEventListener('change', () => {
    if (input.files.length > 0) {
      handleFiles(Array.from(input.files))
      input.value = '' // 允许重新选择同一文件
    }
  })

  // 拖拽事件
  zone.addEventListener('dragover', (e) => {
    e.preventDefault()
    zone.classList.add('dragover')
  })

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('dragover')
  })

  zone.addEventListener('drop', (e) => {
    e.preventDefault()
    zone.classList.remove('dragover')
    if (e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  })

  function handleFiles(files) {
    if (maxSize > 0) {
      files = files.filter(f => f.size <= maxSize)
    }
    if (files.length > 0) {
      onFiles(files)
    }
  }

  return zone
}

/**
 * 格式化文件大小
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}
