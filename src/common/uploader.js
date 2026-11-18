/**
 * MediaKit - 通用拖拽上传组件
 *
 * 提供一个标准的拖拽上传区域，支持文件类型和数量限制。
 */

import { ICONS } from './icons.js'

export function selectFiles(files, { accept = '*', multiple = false, maxSize = 0, onError = () => {} } = {}) {
  if (!multiple && files.length > 1) {
    onError('一次只能选择一个文件')
    return []
  }

  const rules = accept.toLowerCase().split(',').map(rule => rule.trim()).filter(Boolean)
  const supported = rules.length === 0 || rules.includes('*') ? files : files.filter(file => {
    const type = file.type.toLowerCase()
    const name = file.name.toLowerCase()
    return rules.some(rule => {
      if (rule.startsWith('.')) return name.endsWith(rule)
      if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1))
      return type === rule
    })
  })
  if (supported.length < files.length) onError('不支持的文件格式')

  const eligible = maxSize > 0 ? supported.filter(file => file.size <= maxSize) : supported
  if (eligible.length < supported.length) onError(`文件超过大小限制（${formatFileSize(maxSize)}）`)
  return eligible
}

/**
 * 创建拖拽上传区域
 * @param {Object} options
 * @param {string} options.accept - 接受的 MIME 类型或扩展名
 * @param {boolean} options.multiple - 是否允许多文件
 * @param {number} options.maxSize - 单个文件最大字节数
 * @param {function(File[]): void} options.onFiles - 文件选择回调
 * @param {function(string): void} options.onError - 错误提示回调（如文件超限）
 * @returns {HTMLElement} dropZone 元素
 */
export function createDropZone(options = {}) {
  const {
    accept = '*',
    multiple = false,
    maxSize = 0,
    onFiles = () => {},
    onError = () => {},
  } = options

  const zone = document.createElement('div')
  zone.className = 'drop-zone'
  zone.innerHTML = `
    <div class="drop-icon">${ICONS.upload}</div>
    <div class="drop-text">拖拽文件到此处</div>
    <div class="drop-hint">或点击选择文件</div>
    <button class="drop-trigger" type="button" aria-label="选择文件"></button>
  `

  // 隐藏的 file input
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = accept === '*' ? '' : accept
  input.multiple = multiple
  input.style.display = 'none'
  zone.appendChild(input)

  zone.querySelector('.drop-trigger').addEventListener('click', () => input.click())

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
    const selected = selectFiles(files, { accept, multiple, maxSize, onError })
    if (selected.length > 0) onFiles(selected)
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
