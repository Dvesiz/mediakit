/**
 * 图片压缩工具
 * 基于 Canvas API 的浏览器端图片压缩，支持实时对比预览
 */
import './style.css'
import { createDropZone, formatFileSize } from '../../common/uploader.js'
import { compressImage, loadImage, formatSize, calcRatio, downloadBlob, needsResize } from './utils.js'

export function render(container) {
  container.innerHTML = `
    <div class="tool-header">
      <h2>📦 图片压缩</h2>
      <p>浏览器本地压缩 PNG / JPG / WebP，实时对比预览</p>
    </div>

    <div class="tool-body">
      <div id="ic-upload-area"></div>

      <div id="ic-workspace" style="display:none">
        <!-- 文件信息 -->
        <div class="ic-file-info" id="ic-file-info"></div>

        <!-- 极小图片警告 -->
        <div class="ic-tiny-warning" id="ic-tiny-warning" style="display:none">
          ⚠️ 图片尺寸过小（< 100px），不进行压缩
        </div>

        <!-- 低压缩率警告 -->
        <div class="ic-low-ratio-warning" id="ic-low-ratio-warning" style="display:none">
          ℹ️ 该图片已高度压缩，继续压缩可能效果不明显
        </div>

        <!-- 质量调节 -->
        <div class="ic-quality-row">
          <label for="ic-quality">压缩质量</label>
          <input type="range" id="ic-quality" min="1" max="100" value="80" />
          <span class="ic-quality-value" id="ic-quality-value">80</span>
        </div>

        <!-- 输出格式 -->
        <div class="ic-format-row">
          <label for="ic-format">输出格式</label>
          <select class="ic-format-select" id="ic-format">
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
            <option value="image/webp">WebP</option>
          </select>
        </div>

        <!-- 对比预览 -->
        <div class="ic-compare">
          <div class="ic-compare-item">
            <h4>📷 原始图片</h4>
            <img class="ic-preview" id="ic-original-preview" alt="原始图片" />
            <p class="ic-info" id="ic-original-info"></p>
          </div>
          <div class="ic-compare-item">
            <h4>📦 压缩后</h4>
            <img class="ic-preview" id="ic-compressed-preview" alt="压缩后图片" />
            <p class="ic-info" id="ic-compressed-info"></p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="ic-actions" style="display:flex; gap:var(--spacing-md); flex-wrap:wrap; margin-top:var(--spacing-md)">
          <button class="btn btn-primary" id="ic-download">下载压缩图片</button>
          <button class="btn btn-secondary" id="ic-reset">重新选择</button>
        </div>
      </div>
    </div>
  `

  // --- 状态 ---
  let currentFile = null
  let originalImage = null
  let compressedBlob = null
  let compressedSize = null
  let compressedDims = null
  let compressedType = null
  let isProcessing = false

  // --- DOM 引用 ---
  const uploadArea = document.getElementById('ic-upload-area')
  const workspace = document.getElementById('ic-workspace')
  const qualitySlider = document.getElementById('ic-quality')
  const qualityValue = document.getElementById('ic-quality-value')
  const formatSelect = document.getElementById('ic-format')
  const originalPreview = document.getElementById('ic-original-preview')
  const compressedPreview = document.getElementById('ic-compressed-preview')
  const originalInfo = document.getElementById('ic-original-info')
  const compressedInfo = document.getElementById('ic-compressed-info')
  const fileInfo = document.getElementById('ic-file-info')
  const downloadBtn = document.getElementById('ic-download')
  const resetBtn = document.getElementById('ic-reset')
  const tinyWarning = document.getElementById('ic-tiny-warning')
  const lowRatioWarning = document.getElementById('ic-low-ratio-warning')

  // --- 上传组件 ---
  const dropZone = createDropZone({
    accept: 'image/png,image/jpeg,image/webp',
    multiple: false,
    maxSize: 50 * 1024 * 1024, // 50MB
    onFiles: (files) => handleFile(files[0])
  })
  uploadArea.appendChild(dropZone)

  // --- 处理文件 ---
  async function handleFile(file) {
    if (isProcessing) return
    isProcessing = true

    try {
      currentFile = file
      originalImage = await loadImage(file)

      // 检查极小图片
      const isTiny = (originalImage.naturalWidth < 100 && originalImage.naturalHeight < 100)
      tinyWarning.style.display = isTiny ? 'flex' : 'none'

      // 显示文件信息
      fileInfo.innerHTML = `
        <span><span class="ic-label">文件名</span> ${file.name}</span>
        <span><span class="ic-label">原始大小</span> ${formatFileSize(file.size)}</span>
        <span><span class="ic-label">分辨率</span> ${originalImage.naturalWidth} × ${originalImage.naturalHeight}</span>
      `

      // 显示原始预览
      originalPreview.src = originalImage.src
      originalPreview.style.display = 'block'
      originalInfo.innerHTML = `<strong>${formatFileSize(file.size)}</strong>`

      // 显示工作区
      uploadArea.style.display = 'none'
      workspace.style.display = 'block'

      // 执行压缩
      await doCompress()
    } catch (err) {
      alert('加载图片失败：' + err.message)
    } finally {
      isProcessing = false
    }
  }

  // --- 执行压缩 ---
  async function doCompress() {
    if (!originalImage) return

    const quality = Number(qualitySlider.value) / 100
    const type = formatSelect.value
    const maxDim = needsResize(originalImage.naturalWidth, originalImage.naturalHeight, 4000) ? 2000 : 0

    compressedPreview.style.opacity = '0.5'

    try {
      const result = await compressImage(originalImage, quality, type, maxDim)
      compressedBlob = result.blob
      compressedSize = result.blob.size
      compressedDims = { width: result.width, height: result.height }
      compressedType = result.type

      const url = URL.createObjectURL(result.blob)
      compressedPreview.src = url
      compressedPreview.style.opacity = '1'

      const ratio = calcRatio(currentFile.size, result.blob.size)

      // 低压缩率提示
      if (ratio < 5 && currentFile.size > 10000) {
        lowRatioWarning.style.display = 'flex'
      } else {
        lowRatioWarning.style.display = 'none'
      }

      const sizeColor = ratio > 0 ? 'ic-success' : 'ic-warning'
      const infoEl = document.getElementById('ic-compressed-info')
      if (infoEl) {
        infoEl.innerHTML = `
          <strong class="${sizeColor}">${formatFileSize(result.blob.size)}</strong>
          <span>（压缩率 <strong>${ratio}%</strong>）</span>
          ${result.width !== originalImage.naturalWidth ? `<span>（已缩放至 ${result.width}×${result.height}）</span>` : ''}
          ${result.type !== formatSelect.value ? `<span class="ic-warning">（透明图自动转 PNG）</span>` : ''}
        `
      }

      downloadBtn.disabled = false
    } catch (err) {
      const infoEl = document.getElementById('ic-compressed-info')
      if (infoEl) infoEl.innerHTML = `<span style="color:var(--color-error)">压缩失败：${err.message}</span>`
    }
  }

  // --- 事件绑定 ---
  qualitySlider.addEventListener('input', () => {
    qualityValue.textContent = qualitySlider.value
  })

  qualitySlider.addEventListener('change', doCompress)
  formatSelect.addEventListener('change', doCompress)

  downloadBtn.addEventListener('click', () => {
    if (!compressedBlob) return
    const ext = (compressedType || 'image/png').split('/')[1] || 'png'
    const name = currentFile.name.replace(/\.[^.]+$/, '') + '_compressed.' + ext
    downloadBlob(compressedBlob, name)
  })

  resetBtn.addEventListener('click', () => {
    // 清理状态
    currentFile = null
    originalImage = null
    compressedBlob = null
    compressedSize = null
    compressedDims = null
    compressedType = null
    workspace.style.display = 'none'
    uploadArea.style.display = 'block'
    lowRatioWarning.style.display = 'none'
    tinyWarning.style.display = 'none'
    downloadBtn.disabled = true
    // 清理预览 URL
    if (originalPreview.src) URL.revokeObjectURL(originalPreview.src)
    if (compressedPreview.src) URL.revokeObjectURL(compressedPreview.src)
    originalPreview.src = ''
    compressedPreview.src = ''
  })

  // 返回 cleanup
  return () => {
    if (originalPreview.src) URL.revokeObjectURL(originalPreview.src)
    if (compressedPreview.src) URL.revokeObjectURL(compressedPreview.src)
  }
}
