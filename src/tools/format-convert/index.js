/**
 * 格式转换工具（图片部分）
 * PNG / JPG / WebP / BMP 互转，保持原尺寸
 */
import './style.css'
import { createDropZone, formatFileSize } from '../../common/uploader.js'
import { convertImage, loadImage, formatSize, getOutputFilename, downloadBlob, FORMATS } from './utils.js'

export function render(container) {
  container.innerHTML = `
    <div class="tool-header">
      <h2>🔄 格式转换</h2>
      <p>图片格式互转，PNG ↔ JPG ↔ WebP ↔ BMP，保持原尺寸</p>
    </div>

    <div class="tool-body">
      <div id="fc-upload-area"></div>

      <div id="fc-workspace" style="display:none">
        <!-- 文件信息 -->
        <div class="fc-file-info" style="display:flex;gap:var(--spacing-lg);flex-wrap:wrap;margin-bottom:var(--spacing-md);font-size:var(--font-size-sm);color:var(--color-text-secondary)">
          <span id="fc-file-name"></span>
          <span id="fc-file-size"></span>
          <span id="fc-file-dims"></span>
        </div>

        <!-- 转换控制 -->
        <div class="fc-controls">
          <label>
            转换目标格式
            <select id="fc-target-format">
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
              <option value="image/bmp">BMP</option>
            </select>
          </label>
          <button class="btn btn-primary" id="fc-convert-btn">🔄 转换</button>
          <button class="btn btn-secondary" id="fc-download-btn" disabled>下载</button>
          <button class="btn btn-secondary" id="fc-reset-btn">重新选择</button>
        </div>

        <!-- 对比预览 -->
        <div class="fc-layout">
          <div class="fc-preview-box">
            <h4>📷 原始图片</h4>
            <img id="fc-original-preview" alt="原始图片" />
            <p class="fc-info" id="fc-original-info"></p>
          </div>
          <div class="fc-preview-box">
            <h4>📦 转换结果</h4>
            <img id="fc-result-preview" alt="转换结果" />
            <p class="fc-info" id="fc-result-info"></p>
          </div>
        </div>
      </div>
    </div>
  `

  // --- 状态 ---
  let currentFile = null
  let originalImage = null
  let resultBlob = null
  let resultFormat = null

  // --- DOM 引用 ---
  const uploadArea = document.getElementById('fc-upload-area')
  const workspace = document.getElementById('fc-workspace')
  const targetFormat = document.getElementById('fc-target-format')
  const convertBtn = document.getElementById('fc-convert-btn')
  const downloadBtn = document.getElementById('fc-download-btn')
  const resetBtn = document.getElementById('fc-reset-btn')
  const originalPreview = document.getElementById('fc-original-preview')
  const resultPreview = document.getElementById('fc-result-preview')
  const originalInfo = document.getElementById('fc-original-info')
  const resultInfo = document.getElementById('fc-result-info')
  const fileName = document.getElementById('fc-file-name')
  const fileSize = document.getElementById('fc-file-size')
  const fileDims = document.getElementById('fc-file-dims')

  // --- 上传组件 ---
  const dropZone = createDropZone({
    accept: 'image/png,image/jpeg,image/webp,image/bmp',
    multiple: false,
    maxSize: 50 * 1024 * 1024,
    onFiles: (files) => handleFile(files[0])
  })
  uploadArea.appendChild(dropZone)

  // --- 处理文件 ---
  async function handleFile(file) {
    try {
      currentFile = file
      originalImage = await loadImage(file)

      // 信息展示
      fileName.innerHTML = `<strong>文件：</strong>${file.name}`
      fileSize.innerHTML = `<strong>大小：</strong>${formatFileSize(file.size)}`
      fileDims.innerHTML = `<strong>尺寸：</strong>${originalImage.naturalWidth} × ${originalImage.naturalHeight}`

      // 显示原始预览
      originalPreview.src = originalImage.src
      originalInfo.innerHTML = `<strong>${formatFileSize(file.size)}</strong> (${file.name.match(/\.(\w+)$/)?.[1]?.toUpperCase() || '未知'})`

      // 清理结果
      resultPreview.src = ''
      resultInfo.textContent = ''
      downloadBtn.disabled = true
      resultBlob = null

      // 切换视图
      uploadArea.style.display = 'none'
      workspace.style.display = 'block'

      // 自动排除相同格式
      const ext = file.type
      const options = targetFormat.querySelectorAll('option')
      options.forEach(opt => opt.disabled = (opt.value === ext))
      // 选中第一个启用的
      const firstEnabled = targetFormat.querySelector('option:not(:disabled)')
      if (firstEnabled) targetFormat.value = firstEnabled.value
    } catch (err) {
      alert('加载图片失败：' + err.message)
    }
  }

  // --- 执行转换 ---
  async function doConvert() {
    if (!originalImage) return

    const target = targetFormat.value
    convertBtn.disabled = true
    convertBtn.textContent = '⏳ 转换中...'
    resultPreview.style.opacity = '0.5'

    try {
      const blob = await convertImage(originalImage, target, 0.92)
      resultBlob = blob
      resultFormat = target

      const url = URL.createObjectURL(blob)
      resultPreview.src = url
      resultPreview.style.opacity = '1'

      const fmt = FORMATS[target]
      resultInfo.innerHTML = `
        <strong>${formatFileSize(blob.size)}</strong>
         (${fmt.label})
      `

      downloadBtn.disabled = false
    } catch (err) {
      resultInfo.innerHTML = `<span style="color:var(--color-error)">转换失败：${err.message}</span>`
    } finally {
      convertBtn.disabled = false
      convertBtn.textContent = '🔄 转换'
    }
  }

  // --- 事件绑定 ---
  convertBtn.addEventListener('click', doConvert)

  downloadBtn.addEventListener('click', () => {
    if (!resultBlob || !resultFormat) return
    const fmt = FORMATS[resultFormat]
    const filename = getOutputFilename(currentFile.name, fmt.ext)
    downloadBlob(resultBlob, filename)
  })

  resetBtn.addEventListener('click', () => {
    currentFile = null
    originalImage = null
    resultBlob = null
    resultFormat = null
    workspace.style.display = 'none'
    uploadArea.style.display = 'block'
    downloadBtn.disabled = true
    resultPreview.src = ''
    originalPreview.src = ''
    // 重置格式选项
    targetFormat.querySelectorAll('option').forEach(opt => opt.disabled = false)
  })

  return () => {
    // 清理
    if (originalPreview.src) URL.revokeObjectURL(originalPreview.src)
    if (resultPreview.src) URL.revokeObjectURL(resultPreview.src)
  }
}
