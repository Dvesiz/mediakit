/**
 * 音频工具
 * 基于 FFmpeg.wasm 的浏览器端音频格式转换 / 压缩 / 音量调整
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
  AUDIO_FORMATS,
  AUDIO_QUALITY_PRESETS,
  buildAudioArgs,
  estimateTargetAudioBitrateKbps,
  deriveOutputName,
  safeInputName,
} from './utils.js'

const MAX_SIZE = 100 * 1024 * 1024 // 100MB

const MIME = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', aac: 'audio/mp4' }

export function render(container) {
  container.innerHTML = `
    <div class="tool-header">
      <h2>${ICONS.audio} 音频工具</h2>
      <p>浏览器本地转码，音频不会上传到任何服务器；格式转换 / 压缩 / 音量调整</p>
    </div>

    <div class="tool-body">
      <div id="at-upload-area"></div>

      <div id="at-workspace" style="display:none">
        <div class="at-file-info" id="at-file-info"></div>

        <div class="at-controls">
          <label class="at-field">
            <span>目标格式</span>
            <select id="at-format">
              ${Object.entries(AUDIO_FORMATS).map(([k, f]) => `<option value="${k}">${f.label}</option>`).join('')}
            </select>
          </label>

          <div class="at-field at-quality-field" id="at-quality-field">
            <span>压缩质量</span>
            <div class="at-tabs" id="at-mode-tabs">
              <button type="button" class="at-tab active" data-mode="preset">预设档位</button>
              <button type="button" class="at-tab" data-mode="size">目标大小</button>
            </div>
            <select id="at-preset" class="at-mode-panel">
              ${Object.entries(AUDIO_QUALITY_PRESETS).map(([k, p]) => `<option value="${k}" ${k === 'standard' ? 'selected' : ''}>${p.label}</option>`).join('')}
            </select>
            <div class="at-size-row at-mode-panel" id="at-size-panel" style="display:none">
              <input type="number" id="at-target-size" min="1" step="0.5" placeholder="正在读取时长..." disabled />
              <span>MB</span>
            </div>
          </div>

          <label class="at-field">
            <span>音量</span>
            <div class="at-slider-row">
              <input type="range" id="at-volume" min="0" max="200" value="100" />
              <span class="at-slider-value" id="at-volume-value">100%</span>
            </div>
          </label>

          <button class="btn btn-primary at-btn-full" id="at-process">${ICONS.convert}<span>开始处理</span></button>
        </div>

        <div class="at-progress" id="at-progress" style="display:none">
          <div class="at-progress-bar"><div class="at-progress-fill" id="at-progress-fill"></div></div>
          <span class="at-progress-label" id="at-progress-label">加载引擎中...</span>
        </div>

        <div class="at-compare" id="at-compare" style="display:none"></div>

        <div class="at-preview-grid">
          <div class="at-preview-box">
            <h4>${ICONS.audio} 原始音频</h4>
            <audio id="at-original-audio" controls></audio>
            <p class="at-info" id="at-original-info"></p>
          </div>
          <div class="at-preview-box">
            <h4>${ICONS.convert} 处理结果</h4>
            <audio id="at-result-audio" controls style="display:none"></audio>
            <p class="at-info" id="at-result-info">尚未处理</p>
          </div>
        </div>

        <div class="at-actions">
          <button class="btn btn-secondary" id="at-download" disabled>下载结果</button>
          <button class="btn btn-secondary" id="at-reset">重新选择</button>
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
  const uploadArea = container.querySelector('#at-upload-area')
  const workspace = container.querySelector('#at-workspace')
  const fileInfo = container.querySelector('#at-file-info')
  const formatSelect = container.querySelector('#at-format')
  const qualityField = container.querySelector('#at-quality-field')
  const modeTabs = Array.from(container.querySelectorAll('#at-mode-tabs .at-tab'))
  const presetSelect = container.querySelector('#at-preset')
  const sizePanel = container.querySelector('#at-size-panel')
  const targetSizeInput = container.querySelector('#at-target-size')
  const volumeInput = container.querySelector('#at-volume')
  const volumeValue = container.querySelector('#at-volume-value')
  const processBtn = container.querySelector('#at-process')
  const progressEl = container.querySelector('#at-progress')
  const progressFill = container.querySelector('#at-progress-fill')
  const progressLabel = container.querySelector('#at-progress-label')
  const compareEl = container.querySelector('#at-compare')
  const originalAudio = container.querySelector('#at-original-audio')
  const originalInfo = container.querySelector('#at-original-info')
  const resultAudio = container.querySelector('#at-result-audio')
  const resultInfo = container.querySelector('#at-result-info')
  const downloadBtn = container.querySelector('#at-download')
  const resetBtn = container.querySelector('#at-reset')

  // --- 上传组件 ---
  const dropZone = createDropZone({
    accept: 'audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/*',
    multiple: false,
    maxSize: MAX_SIZE,
    onFiles: (files) => handleFile(files[0]),
    onError: (msg) => showToast(msg, 'error'),
  })
  uploadArea.appendChild(dropZone)

  function handleFile(file) {
    if (!file || !file.type.startsWith('audio/')) {
      showToast('请上传音频文件', 'error')
      return
    }
    currentFile = file
    resultBlob = null
    resultExt = null
    mediaDuration = 0
    downloadBtn.disabled = true
    resultAudio.style.display = 'none'
    resultInfo.textContent = '尚未处理'
    compareEl.style.display = 'none'
    targetSizeInput.value = ''
    targetSizeInput.disabled = true
    targetSizeInput.placeholder = '正在读取时长...'

    renderFileInfo()

    const url = URL.createObjectURL(file)
    originalAudio.src = url
    originalInfo.innerHTML = `<strong>${formatFileSize(file.size)}</strong>`
    originalAudio.onloadedmetadata = () => {
      mediaDuration = originalAudio.duration || 0
      renderFileInfo()
      if (mediaDuration > 0) {
        targetSizeInput.disabled = false
        targetSizeInput.placeholder = '例如 5'
        targetSizeInput.value = Math.max(1, Math.round((file.size / 1024 / 1024) * 0.5))
      }
    }

    uploadArea.style.display = 'none'
    workspace.style.display = 'block'
  }

  function renderFileInfo() {
    if (!currentFile) return
    const parts = [
      `<span><span class="at-label">文件名</span> ${currentFile.name}</span>`,
      `<span><span class="at-label">大小</span> ${formatFileSize(currentFile.size)}</span>`,
    ]
    if (mediaDuration > 0) {
      parts.push(`<span><span class="at-label">时长</span> ${formatDuration(mediaDuration)}</span>`)
      parts.push(`<span><span class="at-label">原始码率</span> ${estimateBitrateKbps(currentFile.size, mediaDuration)} kbps</span>`)
    }
    fileInfo.innerHTML = parts.join('')
  }

  // --- 表单联动 ---
  volumeInput.addEventListener('input', () => { volumeValue.textContent = `${volumeInput.value}%` })
  formatSelect.addEventListener('change', () => {
    const lossy = AUDIO_FORMATS[formatSelect.value].lossy
    qualityField.style.display = lossy ? 'flex' : 'none'
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
    const outputName = `output.${AUDIO_FORMATS[format].ext}`

    let bitrate = AUDIO_QUALITY_PRESETS.standard.bitrate
    if (AUDIO_FORMATS[format].lossy) {
      bitrate = qualityMode === 'size' && mediaDuration > 0
        ? estimateTargetAudioBitrateKbps(Number(targetSizeInput.value) || 1, mediaDuration)
        : AUDIO_QUALITY_PRESETS[presetSelect.value]?.bitrate ?? 128
    }

    const args = buildAudioArgs({
      inputName,
      outputName,
      format,
      bitrate,
      volume: Number(volumeInput.value),
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
      resultExt = AUDIO_FORMATS[format].ext

      const url = URL.createObjectURL(blob)
      resultAudio.src = url
      resultAudio.style.display = 'block'
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
      <span class="at-compare-stat"><span class="at-label">原始</span> ${formatFileSize(originalBytes)}</span>
      <span class="at-compare-arrow">→</span>
      <span class="at-compare-stat"><span class="at-label">结果</span> ${formatFileSize(resultBytes)}</span>
      <span class="at-compare-ratio ${grew ? 'grew' : ''}">${grew ? '增大' : '压缩'} ${Math.abs(ratio)}%</span>
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
    if (originalAudio.src) URL.revokeObjectURL(originalAudio.src)
    if (resultAudio.src) URL.revokeObjectURL(resultAudio.src)
    originalAudio.src = ''
    resultAudio.src = ''
    downloadBtn.disabled = true
    compareEl.style.display = 'none'
    workspace.style.display = 'none'
    uploadArea.style.display = 'block'
  })

  return () => {
    if (originalAudio.src) URL.revokeObjectURL(originalAudio.src)
    if (resultAudio.src) URL.revokeObjectURL(resultAudio.src)
  }
}
