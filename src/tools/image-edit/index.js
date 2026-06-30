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
import { showToast } from '../../common/toast.js'
import { ICONS } from '../../common/icons.js'

export function render(container) {
  container.innerHTML = `
    <div class="tool-header">
        <h2>${ICONS.edit} 图片编辑</h2>
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
            <div class="ie-crop-overlay" id="ie-crop-overlay" style="display:none">
              <div class="ie-crop-box" id="ie-crop-box">
                <div class="ie-crop-handle nw" data-handle="nw"></div>
                <div class="ie-crop-handle ne" data-handle="ne"></div>
                <div class="ie-crop-handle sw" data-handle="sw"></div>
                <div class="ie-crop-handle se" data-handle="se"></div>
                <div class="ie-crop-size" id="ie-crop-size"></div>
              </div>
            </div>
          </div>

          <!-- 右侧控制面板 -->
          <div class="ie-controls">
            <!-- 变换操作 -->
            <div class="ie-section is-open">
              <div class="ie-section-header" data-toggle>变换 <span>▼</span></div>
              <div class="ie-section-body">
                <label>裁剪比例</label>
                <div class="ie-crop-ratios">
                  <button class="ie-btn" data-crop="free">自由</button>
                  <button class="ie-btn" data-crop="1:1">1:1</button>
                  <button class="ie-btn" data-crop="4:3">4:3</button>
                  <button class="ie-btn" data-crop="16:9">16:9</button>
                </div>
                <p class="ie-tip">选择比例后拖动选框 / 拖角调整，点"应用裁剪"生效</p>
                <button class="ie-btn ie-btn-full" id="ie-crop-apply">应用裁剪</button>

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
                <button class="ie-btn ie-btn-full" id="ie-scale-apply">应用缩放</button>
              </div>
            </div>

            <!-- 滤镜 -->
            <div class="ie-section">
              <div class="ie-section-header" data-toggle>滤镜 <span>▼</span></div>
              <div class="ie-section-body">
                <div class="ie-slider-row">
                  <label class="ie-slider-label">灰度</label>
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
                <button class="ie-btn ie-btn-full" id="ie-filter-apply">应用滤镜</button>
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
  let baseScale = 1        // 显示基准：图像像素 → CSS px（首帧适应预览区后固定）

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
    onFiles: (files) => handleFile(files[0]),
    onError: (msg) => showToast(msg, 'error')
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

      // 先显示工作区，才能取到预览区真实宽度
      uploadArea.style.display = 'none'
      workspace.style.display = 'block'

      // 计算显示基准：原图适应预览区时的比例，后续缩放/裁剪以此为准 → 变化可见
      const maxW = canvasArea.clientWidth - 4
      const fitW = maxW > 0 ? maxW / originalCanvas.width : 1
      baseScale = Math.min(1, fitW, 480 / originalCanvas.height)

      renderCanvas()
      updateInfo()
    } catch (err) {
      showToast('加载图片失败：' + err.message, 'error')
    }
  }

  // --- 渲染当前 Canvas 到界面 ---
  function renderCanvas() {
    if (!currentCanvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = currentCanvas.width
    canvas.height = currentCanvas.height

    // 显示尺寸 = 像素尺寸 × 基准比例，再受预览区上限约束 → 缩放/裁剪变化按比例可见
    const maxW = canvasArea.clientWidth - 4
    const maxH = 480
    let displayW = currentCanvas.width * baseScale
    let displayH = currentCanvas.height * baseScale
    const fit = Math.min(1, maxW > 0 ? maxW / displayW : 1, maxH / displayH)
    displayW *= fit
    displayH *= fit
    canvas.style.width = displayW + 'px'
    canvas.style.height = displayH + 'px'

    ctx.drawImage(currentCanvas, 0, 0)

    // 若裁剪选框可见，同步其位置
    if (cropOverlay && cropOverlay.style.display !== 'none' && cropBox) {
      syncOverlay()
      renderCropBox()
    }
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
    hideCrop()
  }

  // --- 重做 ---
  function redo() {
    if (redoStack.length === 0) return
    historyStack.push(canvasToDataUrl(currentCanvas))
    const nextUrl = redoStack.pop()
    loadCanvasFromDataUrl(nextUrl)
    updateHistoryButtons()
    hideCrop()
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
      hideCrop()
    } catch (err) {
      showToast('操作失败：' + err.message, 'error')
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
    if (pct === 100) {
      showToast('当前为 100%，请先调整缩放比例', 'info')
      return
    }
    applyOperation((c) => scaleCanvas(c, pct))
    showToast(`已缩放至 ${currentCanvas.width} × ${currentCanvas.height}`, 'success')
    scaleSlider.value = '100'
    scaleValue.textContent = '100%'
  })

  // ===== 裁剪选框预览 =====
  const cropOverlay = document.getElementById('ie-crop-overlay')
  const cropBoxEl = document.getElementById('ie-crop-box')
  const cropSizeEl = document.getElementById('ie-crop-size')
  const CROP_RATIOS = { '1:1': 1, '4:3': 4 / 3, '16:9': 16 / 9 }
  let cropBox = null          // {x,y,w,h} 选框在显示区的坐标(px)
  let cropActiveRatio = null  // null=未激活 | 'free' | '1:1' | '4:3' | '16:9'
  let dragState = null

  const ratioValue = (key) => (key === 'free' ? null : CROP_RATIOS[key])

  // 将 overlay 精确对齐到 canvas 实际显示区域
  function syncOverlay() {
    cropOverlay.style.left = canvas.offsetLeft + 'px'
    cropOverlay.style.top = canvas.offsetTop + 'px'
    cropOverlay.style.width = canvas.offsetWidth + 'px'
    cropOverlay.style.height = canvas.offsetHeight + 'px'
  }

  // 按比例在显示区内居中初始化选框
  function initCropBox(ratioKey) {
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    const r = ratioValue(ratioKey)
    let bw = W * 0.8
    let bh = r ? bw / r : H * 0.8
    if (bh > H * 0.9) {
      bh = H * 0.8
      bw = r ? bh * r : W * 0.8
    }
    if (bw > W) bw = W
    cropBox = { x: (W - bw) / 2, y: (H - bh) / 2, w: bw, h: bh }
  }

  function renderCropBox() {
    if (!cropBox) return
    cropBoxEl.style.left = cropBox.x + 'px'
    cropBoxEl.style.top = cropBox.y + 'px'
    cropBoxEl.style.width = cropBox.w + 'px'
    cropBoxEl.style.height = cropBox.h + 'px'
    const sx = currentCanvas.width / canvas.offsetWidth
    cropSizeEl.textContent = `${Math.round(cropBox.w * sx)} × ${Math.round(cropBox.h * sx)}`
  }

  function showCrop(ratioKey) {
    if (!currentCanvas) return
    cropActiveRatio = ratioKey
    syncOverlay()
    initCropBox(ratioKey)
    renderCropBox()
    cropOverlay.style.display = 'block'
  }

  function hideCrop() {
    cropOverlay.style.display = 'none'
    cropBox = null
    cropActiveRatio = null
    document.querySelectorAll('[data-crop]').forEach(b => b.classList.remove('is-active'))
  }

  function clampBox() {
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    cropBox.w = Math.min(cropBox.w, W)
    cropBox.h = Math.min(cropBox.h, H)
    cropBox.x = Math.max(0, Math.min(cropBox.x, W - cropBox.w))
    cropBox.y = Math.max(0, Math.min(cropBox.y, H - cropBox.h))
  }

  // 选框拖动 / 角缩放
  cropBoxEl.addEventListener('mousedown', (e) => {
    if (!cropBox) return
    e.preventDefault()
    const rect = cropOverlay.getBoundingClientRect()
    dragState = {
      handle: e.target.dataset.handle || null,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      box0: { ...cropBox },
    }
  })

  function onCropDrag(e) {
    if (!dragState) return
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    const rect = cropOverlay.getBoundingClientRect()
    const b0 = dragState.box0
    const r = ratioValue(cropActiveRatio)

    if (!dragState.handle) {
      // 整体移动
      const dx = (e.clientX - rect.left) - dragState.startX
      const dy = (e.clientY - rect.top) - dragState.startY
      cropBox.x = b0.x + dx
      cropBox.y = b0.y + dy
      clampBox()
    } else {
      // 角缩放：固定对角为锚点
      const mx = Math.max(0, Math.min(e.clientX - rect.left, W))
      const my = Math.max(0, Math.min(e.clientY - rect.top, H))
      const anchors = {
        se: { ax: b0.x, ay: b0.y },
        ne: { ax: b0.x, ay: b0.y + b0.h },
        sw: { ax: b0.x + b0.w, ay: b0.y },
        nw: { ax: b0.x + b0.w, ay: b0.y + b0.h },
      }
      const { ax, ay } = anchors[dragState.handle]
      const dirX = mx >= ax ? 1 : -1
      const dirY = my >= ay ? 1 : -1
      let nw = Math.abs(mx - ax)
      let nh = r ? nw / r : Math.abs(my - ay)
      const maxW = dirX > 0 ? W - ax : ax
      const maxH = dirY > 0 ? H - ay : ay
      if (nw > maxW) { nw = maxW; if (r) nh = nw / r }
      if (nh > maxH) { nh = maxH; if (r) nw = nh * r }
      nw = Math.max(nw, 24)
      nh = Math.max(nh, 24)
      cropBox = {
        x: dirX > 0 ? ax : ax - nw,
        y: dirY > 0 ? ay : ay - nh,
        w: nw,
        h: nh,
      }
    }
    renderCropBox()
  }

  function onCropUp() { dragState = null }

  function onWindowResize() {
    if (cropOverlay.style.display !== 'none' && cropBox) {
      syncOverlay()
      clampBox()
      renderCropBox()
    }
  }

  window.addEventListener('mousemove', onCropDrag)
  window.addEventListener('mouseup', onCropUp)
  window.addEventListener('resize', onWindowResize)

  // --- 事件: 选择裁剪比例 → 显示选框预览 ---
  document.querySelectorAll('[data-crop]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-crop]').forEach(b => b.classList.remove('is-active'))
      btn.classList.add('is-active')
      showCrop(btn.dataset.crop)
    })
  })

  // --- 事件: 应用裁剪（按选框真正裁剪） ---
  cropApply.addEventListener('click', () => {
    if (!currentCanvas) return
    if (!cropBox || cropOverlay.style.display === 'none') {
      showToast('请先选择裁剪比例并调整选框', 'info')
      return
    }
    const sx = currentCanvas.width / canvas.offsetWidth
    const sy = currentCanvas.height / canvas.offsetHeight
    const region = {
      x: Math.round(cropBox.x * sx),
      y: Math.round(cropBox.y * sy),
      width: Math.round(cropBox.w * sx),
      height: Math.round(cropBox.h * sy),
    }
    // 约束到画布范围内
    region.x = Math.max(0, Math.min(region.x, currentCanvas.width - 1))
    region.y = Math.max(0, Math.min(region.y, currentCanvas.height - 1))
    region.width = Math.min(region.width, currentCanvas.width - region.x)
    region.height = Math.min(region.height, currentCanvas.height - region.y)
    if (region.width < 1 || region.height < 1) return

    applyOperation((c) => cropCanvas(c, region))
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
    hideCrop()
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
      showToast('下载失败：' + err.message, 'error')
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
    window.removeEventListener('mousemove', onCropDrag)
    window.removeEventListener('mouseup', onCropUp)
    window.removeEventListener('resize', onWindowResize)
  }
}
