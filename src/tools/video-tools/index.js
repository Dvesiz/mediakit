/**
 * 视频工具
 * 基于 FFmpeg.wasm 的浏览器端视频压缩 / 格式转换 / 转 GIF
 */
import './style.css'
import { createDropZone, formatFileSize } from '../../common/uploader.js'
import { downloadBlob } from '../../common/image-utils.js'
import { showToast } from '../../common/toast.js'
import { ICONS } from '../../common/icons.js'
import { loadFFmpeg } from '../../common/ffmpeg-loader.js'
import { formatDuration, estimateBitrateKbps, compressionRatio } from '../../common/media-utils.js'
import { fetchFile } from '@ffmpeg/util'
import {
  VIDEO_FORMATS,
  RESOLUTIONS,
  VIDEO_QUALITY_PRESETS,
  buildVideoArgs,
  estimateTargetVideoBitrateKbps,
  deriveOutputName,
  safeInputName,
} from './utils.js'

const MAX_SIZE = 300 * 1024 * 1024 // 300MB，ffmpeg.wasm 内存限制保护

const MIME = { mp4: 'video/mp4', webm: 'video/webm', gif: 'image/gif' }

export function render(container) {
  container.innerHTML = `
    <div class="tool-header">
      <h2>${ICONS.video} 视频工具</h2>
      <p>浏览器本地转码，视频不会上传到任何服务器；压缩 / 格式转换 / 转 GIF</p>
    </div>

    <div class="tool-body">
      <div id="vt-upload-area"></div>

      <div id="vt-workspace" style="display:none">
        <div class="vt-file-info" id="vt-file-info"></div>

        <div class="vt-controls">
          <label class="vt-field">
            <span>目标格式</span>
            <select id="vt-format">
              ${Object.entries(VIDEO_FORMATS).map(([k, f]) => `<option value="${k}">${f.label}</option>`).join('')}
            </select>
          </label>

          <label class="vt-field">
            <span>分辨率</span>
            <select id="vt-resolution">
              ${RESOLUTIONS.map(r => `<option value="${r.value}">${r.label}</option>`).join('')}
            </select>
          </label>

          <div class="vt-field vt-quality-field" id="vt-quality-field">
            <span>压缩质量</span>
            <div class="vt-tabs" id="vt-mode-tabs">
              <button type="button" class="vt-tab active" data-mode="preset">预设档位</button>
              <button type="button" class="vt-tab" data-mode="size">目标大小</button>
            </div>
            <select id="vt-preset" class="vt-mode-panel">
              ${Object.entries(VIDEO_QUALITY_PRESETS).map(([k, p]) => `<option value="${k}" ${k === 'balanced' ? 'selected' : ''}>${p.label}</option>`).join('')}
            </select>
            <div class="vt-size-row vt-mode-panel" id="vt-size-panel" style="display:none">
              <input type="number" id="vt-target-size" min="1" step="0.5" placeholder="正在读取时长..." disabled />
              <span>MB</span>
            </div>
          </div>

          <label class="vt-field" id="vt-fps-field" style="display:none">
            <span>GIF 帧率</span>
            <select id="vt-fps">
              <option value="8">8 fps</option>
              <option value="12" selected>12 fps</option>
              <option value="15">15 fps</option>
            </select>
          </label>

          <div class="vt-field" id="vt-trim-field" style="display:none">
            <span>裁剪片段（秒）</span>
            <div class="vt-size-row">
              <input type="number" id="vt-trim-start" min="0" step="0.5" placeholder="起始" disabled />
              <span>~</span>
              <input type="number" id="vt-trim-end" min="0" step="0.5" placeholder="结束" disabled />
            </div>
          </div>

          <button class="btn btn-primary vt-btn-full" id="vt-process">${ICONS.convert}<span>开始处理</span></button>
        </div>

        <div class="vt-progress" id="vt-progress" style="display:none">
          <div class="vt-progress-bar"><div class="vt-progress-fill" id="vt-progress-fill"></div></div>
          <span class="vt-progress-label" id="vt-progress-label">加载引擎中...</span>
        </div>

        <div class="vt-compare" id="vt-compare" style="display:none"></div>

        <div class="vt-preview-grid">
          <div class="vt-preview-box">
            <h4>${ICONS.camera} 原始视频</h4>
            <video id="vt-original-video" controls></video>
            <p class="vt-info" id="vt-original-info"></p>
          </div>
          <div class="vt-preview-box">
            <h4>${ICONS.video} 处理结果</h4>
            <video id="vt-result-video" controls style="display:none"></video>
            <img id="vt-result-image" alt="转换结果" style="display:none" />
            <p class="vt-info" id="vt-result-info">尚未处理</p>
          </div>
        </div>

        <div class="vt-actions">
          <button class="btn btn-secondary" id="vt-download" disabled>下载结果</button>
          <button class="btn btn-secondary" id="vt-reset">重新选择</button>
        </div>
      </div>
    </div>
  `

  // --- 状态 ---
  let currentFile = null
  let resultBlob = null
  let resultExt = null
  let isProcessing = false
  let mediaDuration = 0
  let qualityMode = 'preset'

  // --- DOM ---
  const uploadArea = container.querySelector('#vt-upload-area')
  const workspace = container.querySelector('#vt-workspace')
  const fileInfo = container.querySelector('#vt-file-info')
  const formatSelect = container.querySelector('#vt-format')
  const resolutionSelect = container.querySelector('#vt-resolution')
  const qualityField = container.querySelector('#vt-quality-field')
  const modeTabs = Array.from(container.querySelectorAll('#vt-mode-tabs .vt-tab'))
  const presetSelect = container.querySelector('#vt-preset')
  const sizePanel = container.querySelector('#vt-size-panel')
  const targetSizeInput = container.querySelector('#vt-target-size')
  const fpsField = container.querySelector('#vt-fps-field')
  const fpsSelect = container.querySelector('#vt-fps')
  const trimField = container.querySelector('#vt-trim-field')
  const trimStartInput = container.querySelector('#vt-trim-start')
  const trimEndInput = container.querySelector('#vt-trim-end')
  const processBtn = container.querySelector('#vt-process')
  const progressEl = container.querySelector('#vt-progress')
  const progressFill = container.querySelector('#vt-progress-fill')
  const progressLabel = container.querySelector('#vt-progress-label')
  const compareEl = container.querySelector('#vt-compare')
  const originalVideo = container.querySelector('#vt-original-video')
  const originalInfo = container.querySelector('#vt-original-info')
  const resultVideo = container.querySelector('#vt-result-video')
  const resultImage = container.querySelector('#vt-result-image')
  const resultInfo = container.querySelector('#vt-result-info')
  const downloadBtn = container.querySelector('#vt-download')
  const resetBtn = container.querySelector('#vt-reset')

  // --- 上传组件 ---
  const dropZone = createDropZone({
    accept: 'video/mp4,video/webm,video/quicktime,video/x-msvideo,video/*',
    multiple: false,
    maxSize: MAX_SIZE,
    onFiles: (files) => handleFile(files[0]),
    onError: (msg) => showToast(msg, 'error'),
  })
  uploadArea.appendChild(dropZone)

  function handleFile(file) {
    if (!file || !file.type.startsWith('video/')) {
      showToast('请上传视频文件', 'error')
      return
    }
    currentFile = file
    resultBlob = null
    resultExt = null
    mediaDuration = 0
    downloadBtn.disabled = true
    resultVideo.style.display = 'none'
    resultImage.style.display = 'none'
    resultInfo.textContent = '尚未处理'
    compareEl.style.display = 'none'
    targetSizeInput.value = ''
    targetSizeInput.disabled = true
    targetSizeInput.placeholder = '正在读取时长...'
    trimStartInput.value = ''
    trimEndInput.value = ''
    trimStartInput.disabled = true
    trimEndInput.disabled = true

    renderFileInfo()

    const url = URL.createObjectURL(file)
    originalVideo.src = url
    originalInfo.innerHTML = `<strong>${formatFileSize(file.size)}</strong>`
    originalVideo.onloadedmetadata = () => {
      mediaDuration = originalVideo.duration || 0
      renderFileInfo()
      if (mediaDuration > 0) {
        targetSizeInput.disabled = false
        targetSizeInput.placeholder = '例如 10'
        targetSizeInput.value = Math.max(1, Math.round((file.size / 1024 / 1024) * 0.5))

        trimStartInput.disabled = false
        trimEndInput.disabled = false
        trimStartInput.max = String(mediaDuration)
        trimEndInput.max = String(mediaDuration)
        trimStartInput.value = 0
        trimEndInput.value = Math.round(Math.min(mediaDuration, 5) * 10) / 10
      }
    }

    uploadArea.style.display = 'none'
    workspace.style.display = 'block'
  }

  function renderFileInfo() {
    if (!currentFile) return
    const parts = [
      `<span><span class="vt-label">文件名</span> ${currentFile.name}</span>`,
      `<span><span class="vt-label">大小</span> ${formatFileSize(currentFile.size)}</span>`,
    ]
    if (mediaDuration > 0) {
      parts.push(`<span><span class="vt-label">时长</span> ${formatDuration(mediaDuration)}</span>`)
      if (originalVideo.videoWidth) {
        parts.push(`<span><span class="vt-label">分辨率</span> ${originalVideo.videoWidth}×${originalVideo.videoHeight}</span>`)
      }
      parts.push(`<span><span class="vt-label">原始码率</span> ${estimateBitrateKbps(currentFile.size, mediaDuration)} kbps</span>`)
    }
    fileInfo.innerHTML = parts.join('')
  }

  // --- 表单联动 ---
  formatSelect.addEventListener('change', () => {
    const isGif = formatSelect.value === 'gif'
    qualityField.style.display = isGif ? 'none' : 'flex'
    fpsField.style.display = isGif ? 'block' : 'none'
    trimField.style.display = isGif ? 'block' : 'none'
  })

  modeTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      qualityMode = tab.dataset.mode
      modeTabs.forEach((t) => t.classList.toggle('active', t === tab))
      presetSelect.style.display = qualityMode === 'preset' ? 'block' : 'none'
      sizePanel.style.display = qualityMode === 'size' ? 'flex' : 'none'
    })
  })

  // --- 处理 ---
  processBtn.addEventListener('click', async () => {
    if (!currentFile || isProcessing) return
    isProcessing = true
    processBtn.disabled = true
    progressEl.style.display = 'flex'
    compareEl.style.display = 'none'
    setProgress(0, '加载引擎中...')

    const ffmpeg = await loadFFmpegWithHandling()
    if (!ffmpeg) {
      isProcessing = false
      processBtn.disabled = false
      progressEl.style.display = 'none'
      return
    }

    const format = formatSelect.value
    const inputName = safeInputName(currentFile.name)
    const outputName = `output.${VIDEO_FORMATS[format].ext}`

    let crf
    let targetBitrateKbps
    let startSec = 0
    let durationSec = 0
    if (format !== 'gif') {
      if (qualityMode === 'size' && mediaDuration > 0) {
        targetBitrateKbps = estimateTargetVideoBitrateKbps(Number(targetSizeInput.value) || 1, mediaDuration)
      } else {
        crf = VIDEO_QUALITY_PRESETS[presetSelect.value]?.crf ?? 26
      }
    } else if (mediaDuration > 0) {
      const start = Math.max(0, Math.min(Number(trimStartInput.value) || 0, mediaDuration))
      const rawEnd = trimEndInput.value === '' ? mediaDuration : Number(trimEndInput.value)
      const end = Math.max(start, Math.min(rawEnd, mediaDuration))
      startSec = start
      durationSec = end - start
    }

    const args = buildVideoArgs({
      inputName,
      outputName,
      format,
      crf,
      targetBitrateKbps,
      scaleWidth: Number(resolutionSelect.value),
      fps: Number(fpsSelect.value),
      startSec,
      durationSec,
    })

    const onProgress = ({ progress }) => {
      setProgress(Math.min(1, Math.max(0, progress)), '处理中...')
    }
    ffmpeg.on('progress', onProgress)

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(currentFile))
      setProgress(0, '处理中...')
      const code = await ffmpeg.exec(args)
      if (code !== 0) throw new Error('ffmpeg 处理失败')

      const data = await ffmpeg.readFile(outputName)
      const blob = new Blob([data.buffer], { type: MIME[format] })
      resultBlob = blob
      resultExt = VIDEO_FORMATS[format].ext

      const url = URL.createObjectURL(blob)
      if (format === 'gif') {
        resultImage.src = url
        resultImage.style.display = 'block'
        resultVideo.style.display = 'none'
      } else {
        resultVideo.src = url
        resultVideo.style.display = 'block'
        resultImage.style.display = 'none'
      }
      resultInfo.innerHTML = `<strong>${formatFileSize(blob.size)}</strong>`
      showCompare(currentFile.size, blob.size)
      downloadBtn.disabled = false
      showToast('处理完成', 'success')

      await ffmpeg.deleteFile(inputName)
      await ffmpeg.deleteFile(outputName)
    } catch (err) {
      showToast('处理失败：' + err.message, 'error')
    } finally {
      ffmpeg.off('progress', onProgress)
      isProcessing = false
      processBtn.disabled = false
      progressEl.style.display = 'none'
    }
  })

  async function loadFFmpegWithHandling() {
    try {
      return await loadFFmpeg((ratio) => setProgress(ratio, '加载引擎中...'))
    } catch (err) {
      showToast('引擎加载失败，请检查网络后重试：' + err.message, 'error')
      return null
    }
  }

  function setProgress(ratio, label) {
    progressFill.style.width = `${Math.round(ratio * 100)}%`
    progressLabel.textContent = `${label} ${Math.round(ratio * 100)}%`
  }

  function showCompare(originalBytes, resultBytes) {
    const ratio = compressionRatio(originalBytes, resultBytes)
    const grew = ratio < 0
    compareEl.style.display = 'flex'
    compareEl.innerHTML = `
      <span class="vt-compare-stat"><span class="vt-label">原始</span> ${formatFileSize(originalBytes)}</span>
      <span class="vt-compare-arrow">→</span>
      <span class="vt-compare-stat"><span class="vt-label">结果</span> ${formatFileSize(resultBytes)}</span>
      <span class="vt-compare-ratio ${grew ? 'grew' : ''}">${grew ? '增大' : '压缩'} ${Math.abs(ratio)}%</span>
    `
  }

  // --- 操作按钮 ---
  downloadBtn.addEventListener('click', () => {
    if (!resultBlob) return
    downloadBlob(resultBlob, deriveOutputName(currentFile.name, resultExt))
  })

  resetBtn.addEventListener('click', () => {
    currentFile = null
    resultBlob = null
    resultExt = null
    mediaDuration = 0
    if (originalVideo.src) URL.revokeObjectURL(originalVideo.src)
    if (resultVideo.src) URL.revokeObjectURL(resultVideo.src)
    if (resultImage.src) URL.revokeObjectURL(resultImage.src)
    originalVideo.src = ''
    resultVideo.src = ''
    resultImage.src = ''
    downloadBtn.disabled = true
    compareEl.style.display = 'none'
    workspace.style.display = 'none'
    uploadArea.style.display = 'block'
  })

  return () => {
    if (originalVideo.src) URL.revokeObjectURL(originalVideo.src)
    if (resultVideo.src) URL.revokeObjectURL(resultVideo.src)
    if (resultImage.src) URL.revokeObjectURL(resultImage.src)
  }
}
