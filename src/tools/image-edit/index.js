/**
 * 图片编辑工具
 * 裁剪/旋转/翻转/缩放/基础滤镜
 */
import './style.css'
import { createDropZone, formatFileSize } from '../../common/uploader.js'
import {
  loadImage,
  drawImageOnCanvas,
  rotateCanvas,
  flipCanvas,
  scaleCanvas,
  cropCanvas,
  applyFilters,
  canvasToBlob,
  canvasToDataUrl,
  formatSize,
} from './utils.js'

export function render(container) {
  container.innerHTML = `
    <div class="tool-header">
      <h2>✂️ 图片编辑</h2>
      <p>裁剪、旋转、翻转、缩放、滤镜，基础图片处理</p>
    </div>

    <div class="tool-body">
      <div id="ie-upload-area"></div>

      <div id="ie-workspace" style="display:none">
        <!-- 编辑器布局 -->
        <div class="ie-layout">
          <!-- 左侧预览 -->
          <div class="ie-canvas-area" id="ie-canvas-area">
            <canvas id="ie-canvas"></canvas>
          </div>

          <!-- 右侧控制面板 -->
          <div class="ie-controls">
            <!-- 变换操作 -->
            <div class="ie-section is-open">
              <div class="ie-section-header" data-toggle>变换 <span>▼</span></div>
              <div class="ie-section-body">
                <label>裁剪比例</label>
                <div class="ie-crop-ratios">
                  <button class="ie-btn is-active" data-crop="free">自由</button>
                  <button class="ie-btn" data-crop="1:1">1:1</button>
                  <button class="ie-btn" data-crop="4:3">4:3</button>
                  <button class="ie-btn" data-crop="16:9">16:9</button>
                </div>
                <button class="ie-btn" id="ie-crop-apply" style="width:100%;margin-bottom:var(--spacing-sm)">应用裁剪</button>

                <label>旋转</label>
                <div class="ie-btn-group">
                  <button class="ie-btn" data-rotate="90">↻ 90°</button>
                  <button class="ie-btn" data-rotate="180">↻ 180°</button>
                  <button class="ie-btn" data-rotate="270">↻ 270°</button>
                </div>

                <label>翻转</label>
                <div class="ie-btn-group">
                  <button class="ie-btn" data-flip="horizontal">↔ 水平</button>
                  <button class="ie-btn" data-flip="vertical">↕ 垂直</button>
                </div>

                <label>缩放</label>
                <div class="ie-slider-row">
                  <input type="range" id="ie-scale" min="10" max="200" value="100" />
                  <span class="ie-slider-value" id="ie-scale-value">100%</span>
                </div>
                <button class="ie-btn" id="ie-scale-apply" style="width:100%">应用缩放</button>
              </div>
            </div>

            <!-- 滤镜 -->
            <div class="ie-section">
              <div class="ie-section-header" data-toggle>滤镜 <span>▼</span></div>
              <div class="ie-section-body">
                <div class="ie-slider-row">
                  <label style="flex:1;margin:0">灰度</label>
                  <input type="range" id="ie-filter-grayscale" min="0" max="100" value="0" />
                  <span class="ie-slider-value" id="ie-filter-grayscale-value">0%</span>
                </div>
                <div class="ie-slider-row">
                  <label style="flex:1;margin:0">亮度</label>
                  <input type="range" id="ie-filter-brightness" min="0" max="200" value="100" />
                  <span class="ie-slider-value" id="ie-filter-brightness-value">100%</span>
                </div>
                <div class="ie-slider-row">
                  <label style="flex:1;margin:0">对比度</label>
                  <input type="range" id="ie-filter-contrast" min="0" max="200" value="100" />
                  <span class="ie-slider-value" id="ie-filter-contrast-value">100%</span>
                </div>
                <div class="ie-slider-row">
                  <label style="flex:1;margin:0">饱和度</label>
                  <input type="range" id="ie-filter-saturate" min="0" max="200" value="100" />
                  <span class="ie-slider-value" id="ie-filter-saturate-value">100%</span>
                </div>
                <div class="ie-slider-row">
                  <label style="flex:1;margin:0">模糊</label>
                  <input type="range" id="ie-filter-blur" min="0" max="10" value="0" step="0.5" />
                  <span class="ie-slider-value" id="ie-filter-blur-value">0px</span>
                </div>
                <button class="ie-btn" id="ie-filter-apply" style="width:100%">应用滤镜</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 信息栏 -->
        <div class="ie-info" id="ie-info"></div>

        <!-- 操作按钮 -->
        <div class="ie-actions">
          <button class="btn btn-primary" id="ie-download">下载图片</button>
          <button class="btn btn-secondary" id="ie-undo" disabled>↩ 撤销</button>
          <button class="btn btn-secondary" id="ie-redo" disabled>↪ 重做</button>
          <button class="btn btn-secondary" id="ie-reset">重置</button>
        </div>
      </div>
    </div>
  `

  // --- 状态 ---
  let currentFile = null
  let originalCanvas = null // 原始 canvas（不变）
  let currentCanvas = null  // 当前 canvas（可编辑）
  let historyStack = []    // 撤销栈（存储 dataUrl）
  let redoStack = []       // 重做栈
  const MAX_HISTORY = 20
  let cropRatio = null     // 'free' | '1:1' | '4:3' | '16:9'

  // --- DOM 引用 ---
  const uploadArea = document.getElementById('ie-upload-area')
  const workspace = document.getElementById('ie-workspace')
  const canvas = document.getElementById('ie-canvas')
  const canvasArea = document.getElementById('ie-canvas-area')
  const downloadBtn = document.getElementById('ie-download')
  const undoBtn = document.getElementById('ie-undo')
  const redoBtn = document.getElementById('ie-redo')
  const resetBtn = document.getElementById('ie-reset')
  const cropApply = document.getElementById('ie-crop-apply')
  const scaleSlider = document.getElementById('ie-scale')
  const scaleValue = document.getElementById('ie-scale-value')
  const scaleApply = document.getElementById('ie-scale-apply')
  const filterApply = document.getElementById('ie-filter-apply')
  const ieInfo = document.getElementById('ie-info')

  // 滤镜滑块
  const filterSliders = {
    grayscale: { slider: document.getElementById('ie-filter-grayscale'), value: document.getElementById('ie-filter-grayscale-value') },
    brightness: { slider: document.getElementById('ie-filter-brightness'), value: document.getElementById('ie-filter-brightness-value') },
    contrast: { slider: document.getElementById('ie-filter-contrast'), value: document.getElementById('ie-filter-contrast-value') },
    saturate: { slider: document.getElementById('ie-filter-saturate'), value: document.getElementById('ie-filter-saturate-value') },
    blur: { slider: document.getElementById('ie-filter-blur'), value: document.getElementById('ie-filter-blur-value') },
  }

  // --- 上传 ---
  const dropZone = createDropZone({
    accept: 'image/png,image/jpeg,image/webp',
    multiple: false,
    maxSize: 50 * 1024 * 1024,
    onFiles: (files) => handleFile(files[0])
  })
  uploadArea.appendChild(dropZone)

  // --- 处理文件 ---
  async function handleFile(file) {
    try {
      currentFile = file
      const img = await loadImage(file)

      // 原始 canvas
      originalCanvas = document.createElement('canvas')
      drawImageOnCanvas(originalCanvas, img)

      // 当前 canvas
      currentCanvas = document.createElement('canvas')
      drawImageOnCanvas(currentCanvas, img)

      // 清空历史
      historyStack = []
      redoStack = []
      updateHistoryButtons()

      // 渲染
      renderCanvas()
      updateInfo()

      uploadArea.style.display = 'none'
      workspace.style.display = 'block'
    } catch (err) {
      alert('加载图片失败：' + err.message)
    }
  }

  // --- 渲染当前 Canvas 到界面 ---
  function renderCanvas() {
    if (!currentCanvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = currentCanvas.width
    canvas.height = currentCanvas.height

    // 自动缩放显示
    const maxW = canvasArea.clientWidth - 4
    const maxH = 480
    const scale = Math.min(1, maxW / currentCanvas.width, maxH / currentCanvas.height)
    canvas.style.width = (currentCanvas.width * scale) + 'px'
    canvas.style.height = (currentCanvas.height * scale) + 'px'

    ctx.drawImage(currentCanvas, 0, 0)
  }

  // --- 保存快照 ---
  function saveSnapshot() {
    if (!currentCanvas) return
    const url = canvasToDataUrl(currentCanvas)
    historyStack.push(url)
    if (historyStack.length > MAX_HISTORY) historyStack.shift()
    redoStack = []
    updateHistoryButtons()
  }

  // --- 撤销 ---
  function undo() {
    if (historyStack.length === 0) return
    redoStack.push(canvasToDataUrl(currentCanvas))
    const prevUrl = historyStack.pop()
    loadCanvasFromDataUrl(prevUrl)
    updateHistoryButtons()
  }

  // --- 重做 ---
  function redo() {
    if (redoStack.length === 0) return
    historyStack.push(canvasToDataUrl(currentCanvas))
    const nextUrl = redoStack.pop()
    loadCanvasFromDataUrl(nextUrl)
    updateHistoryButtons()
  }

  function loadCanvasFromDataUrl(url) {
    const img = new Image()
    img.onload = () => {
      currentCanvas = document.createElement('canvas')
      currentCanvas.width = img.naturalWidth
      currentCanvas.height = img.naturalHeight
      const ctx = currentCanvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      renderCanvas()
      updateInfo()
    }
    img.src = url
  }

  function updateHistoryButtons() {
    undoBtn.disabled = historyStack.length === 0
    redoBtn.disabled = redoStack.length === 0
  }

  // --- 更新信息 ---
  function updateInfo() {
    if (!currentCanvas || !currentFile) return
    ieInfo.innerHTML = `
      <span><strong>尺寸：</strong>${currentCanvas.width} × ${currentCanvas.height}</span>
    `
  }

  // --- 应用操作 ---
  function applyOperation(operationFn) {
    if (!currentCanvas) return
    saveSnapshot()
    try {
      currentCanvas = operationFn(currentCanvas)
      renderCanvas()
      updateInfo()
    } catch (err) {
      alert('操作失败：' + err.message)
    }
  }

  // --- 事件: 旋转 ---
  document.querySelectorAll('[data-rotate]').forEach(btn => {
    btn.addEventListener('click', () => {
      const deg = parseInt(btn.dataset.rotate)
      applyOperation((c) => rotateCanvas(c, deg))
    })
  })

  // --- 事件: 翻转 ---
  document.querySelectorAll('[data-flip]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.flip
      applyOperation((c) => flipCanvas(c, dir))
    })
  })

  // --- 事件: 缩放 ---
  scaleSlider.addEventListener('input', () => {
    scaleValue.textContent = scaleSlider.value + '%'
  })

  scaleApply.addEventListener('click', () => {
    const pct = parseInt(scaleSlider.value)
    if (pct === 100) return
    applyOperation((c) => scaleCanvas(c, pct))
    scaleSlider.value = '100'
    scaleValue.textContent = '100%'
  })

  // --- 事件: 裁剪比例 ---
  document.querySelectorAll('[data-crop]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-crop]').forEach(b => b.classList.remove('is-active'))
      btn.classList.add('is-active')
      cropRatio = btn.dataset.crop
    })
  })

  // --- 事件: 应用裁剪 ---
  cropApply.addEventListener('click', () => {
    if (!currentCanvas) return
    if (!cropRatio || cropRatio === 'free') {
      // 自由裁剪：从左上角裁掉 10% 边距（简化版，实际应有交互选框）
      const marginX = Math.round(currentCanvas.width * 0.05)
      const marginY = Math.round(currentCanvas.height * 0.05)
      if (marginX <= 0 && marginY <= 0) return
      applyOperation((c) => cropCanvas(c, {
        x: marginX, y: marginY,
        width: c.width - marginX * 2,
        height: c.height - marginY * 2,
      }))
      return
    }

    // 固定比例裁剪
    const ratios = { '1:1': 1, '4:3': 4/3, '16:9': 16/9 }
    const targetRatio = ratios[cropRatio]
    if (!targetRatio) return

    const w = currentCanvas.width
    const h = currentCanvas.height
    const currentRatio = w / h

    let cropW, cropH, x, y
    if (currentRatio > targetRatio) {
      cropH = h
      cropW = h * targetRatio
      x = (w - cropW) / 2
      y = 0
    } else {
      cropW = w
      cropH = w / targetRatio
      x = 0
      y = (h - cropH) / 2
    }

    applyOperation((c) => cropCanvas(c, { x, y, width: cropW, height: cropH }))
  })

  // --- 事件: 应用滤镜 ---
  filterApply.addEventListener('click', () => {
    const filters = {
      grayscale: parseInt(filterSliders.grayscale.slider.value),
      brightness: parseInt(filterSliders.brightness.slider.value),
      contrast: parseInt(filterSliders.contrast.slider.value),
      saturate: parseInt(filterSliders.saturate.slider.value),
      blur: parseFloat(filterSliders.blur.slider.value),
    }
    applyOperation((c) => applyFilters(c, filters))
  })

  // 滤镜滑块值显示
  Object.entries(filterSliders).forEach(([key, { slider, value }]) => {
    slider.addEventListener('input', () => {
      const suffix = key === 'blur' ? 'px' : '%'
      value.textContent = slider.value + suffix
    })
  })

  // --- 事件: 撤销/重做 ---
  undoBtn.addEventListener('click', undo)
  redoBtn.addEventListener('click', redo)

  // --- 事件: 重置 ---
  resetBtn.addEventListener('click', () => {
    if (!originalCanvas) return
    currentCanvas = document.createElement('canvas')
    currentCanvas.width = originalCanvas.width
    currentCanvas.height = originalCanvas.height
    const ctx = currentCanvas.getContext('2d')
    ctx.drawImage(originalCanvas, 0, 0)
    historyStack = []
    redoStack = []
    updateHistoryButtons()
    renderCanvas()
    updateInfo()
  })

  // --- 事件: 下载 ---
  downloadBtn.addEventListener('click', async () => {
    if (!currentCanvas) return
    try {
      const blob = await canvasToBlob(currentCanvas, 'image/png')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const name = currentFile ? currentFile.name.replace(/\.[^.]+$/, '') + '_edited.png' : 'edited.png'
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('下载失败：' + err.message)
    }
  })

  // --- 折叠面板 ---
  document.querySelectorAll('[data-toggle]').forEach(header => {
    header.addEventListener('click', () => {
      const section = header.closest('.ie-section')
      section.classList.toggle('is-open')
      const arrow = header.querySelector('span')
      if (arrow) arrow.textContent = section.classList.contains('is-open') ? '▼' : '▶'
    })
  })

  return () => {
    // cleanup
  }
}
