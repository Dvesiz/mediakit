/**
 * 颜色实验室
 * 图片取色 + 调色板提取 + 颜色格式互转 + 对比度检测（纯前端）
 */
import './style.css'
import { createDropZone } from '../../common/uploader.js'
import { showToast } from '../../common/toast.js'
import { ICONS } from '../../common/icons.js'
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  parseColor,
  formatRgb,
  formatHsl,
  contrastRatio,
  extractPalette,
} from './utils.js'

const SAMPLE_MAX = 700 // 取色画布最大边长

export function render(container) {
  container.innerHTML = `
    <div class="tool-header">
      <h2>${ICONS.color} 颜色实验室</h2>
      <p>从图片取色、提取主色调色板，HEX / RGB / HSL 一键互转</p>
    </div>

    <div class="tool-body">
      <!-- 选项卡 -->
      <div class="cl-tabs" role="tablist">
        <button class="cl-tab active" data-tab="picker" role="tab">图片取色</button>
        <button class="cl-tab" data-tab="convert" role="tab">颜色转换</button>
      </div>

      <!-- 取色面板 -->
      <div class="cl-panel" id="cl-panel-picker">
        <div id="cl-upload-area"></div>

        <div id="cl-picker-workspace" style="display:none">
          <div class="cl-picker-layout">
            <div class="cl-canvas-wrap">
              <canvas id="cl-canvas"></canvas>
              <p class="cl-hint">点击图片任意位置取色</p>
            </div>

            <div class="cl-picked">
              <div class="cl-swatch-lg" id="cl-picked-swatch"></div>
              <div class="cl-picked-codes" id="cl-picked-codes">
                <p class="cl-muted">在图片上点击取色</p>
              </div>
              <button class="btn btn-secondary" id="cl-picker-reset">${ICONS.refresh}<span>重新选择</span></button>
            </div>
          </div>

          <div class="cl-palette-block">
            <h4>主色调色板</h4>
            <div class="cl-palette" id="cl-palette"></div>
          </div>
        </div>
      </div>

      <!-- 转换面板 -->
      <div class="cl-panel" id="cl-panel-convert" style="display:none">
        <div class="cl-convert-layout">
          <div class="cl-convert-left">
            <div class="cl-swatch-lg" id="cl-conv-swatch"></div>
            <label class="cl-native-pick">
              <input type="color" id="cl-native" value="#e94560" />
              <span>原生拾色器</span>
            </label>
          </div>

          <div class="cl-convert-right">
            <label class="cl-field">
              <span>输入颜色（HEX / rgb() / hsl()）</span>
              <input type="text" id="cl-input" placeholder="#e94560 或 rgb(233,69,96)" value="#e94560" />
            </label>

            <div class="cl-code-row" data-fmt="hex">
              <span class="cl-code-label">HEX</span>
              <code id="cl-out-hex">#e94560</code>
              <button class="cl-copy" data-target="cl-out-hex" aria-label="复制 HEX">复制</button>
            </div>
            <div class="cl-code-row" data-fmt="rgb">
              <span class="cl-code-label">RGB</span>
              <code id="cl-out-rgb">rgb(233, 69, 96)</code>
              <button class="cl-copy" data-target="cl-out-rgb" aria-label="复制 RGB">复制</button>
            </div>
            <div class="cl-code-row" data-fmt="hsl">
              <span class="cl-code-label">HSL</span>
              <code id="cl-out-hsl">hsl(347, 80%, 59%)</code>
              <button class="cl-copy" data-target="cl-out-hsl" aria-label="复制 HSL">复制</button>
            </div>

            <div class="cl-contrast" id="cl-contrast"></div>
          </div>
        </div>
      </div>
    </div>
  `

  // ---------- DOM ----------
  const tabs = container.querySelectorAll('.cl-tab')
  const panelPicker = container.querySelector('#cl-panel-picker')
  const panelConvert = container.querySelector('#cl-panel-convert')

  const uploadArea = container.querySelector('#cl-upload-area')
  const pickerWorkspace = container.querySelector('#cl-picker-workspace')
  const canvas = container.querySelector('#cl-canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const pickedSwatch = container.querySelector('#cl-picked-swatch')
  const pickedCodes = container.querySelector('#cl-picked-codes')
  const paletteEl = container.querySelector('#cl-palette')
  const pickerReset = container.querySelector('#cl-picker-reset')

  const convSwatch = container.querySelector('#cl-conv-swatch')
  const nativePick = container.querySelector('#cl-native')
  const inputEl = container.querySelector('#cl-input')
  const outHex = container.querySelector('#cl-out-hex')
  const outRgb = container.querySelector('#cl-out-rgb')
  const outHsl = container.querySelector('#cl-out-hsl')
  const contrastEl = container.querySelector('#cl-contrast')

  // ---------- 选项卡切换 ----------
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.toggle('active', t === tab))
      const isPicker = tab.dataset.tab === 'picker'
      panelPicker.style.display = isPicker ? 'block' : 'none'
      panelConvert.style.display = isPicker ? 'none' : 'block'
    })
  })

  // ---------- 图片取色 ----------
  const dropZone = createDropZone({
    accept: 'image/png,image/jpeg,image/webp,image/bmp',
    multiple: false,
    maxSize: 50 * 1024 * 1024,
    onFiles: (files) => loadImageFile(files[0]),
    onError: (msg) => showToast(msg, 'error'),
  })
  uploadArea.appendChild(dropZone)

  function loadImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('请上传图片文件', 'error')
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      // 等比缩放绘制到画布
      const scale = Math.min(1, SAMPLE_MAX / Math.max(img.naturalWidth, img.naturalHeight))
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)

      uploadArea.style.display = 'none'
      pickerWorkspace.style.display = 'block'
      buildPalette()
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      showToast('图片加载失败', 'error')
    }
    img.src = url
  }

  function buildPalette() {
    try {
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const palette = extractPalette(data, 8)
      paletteEl.innerHTML = palette
        .map((c) => {
          const hex = rgbToHex(c.r, c.g, c.b)
          return `<button class="cl-swatch" data-hex="${hex}" style="background:${hex}" title="${hex}">
            <span>${hex}</span>
          </button>`
        })
        .join('')
    } catch (err) {
      showToast('调色板提取失败：' + err.message, 'error')
    }
  }

  // 画布点击取色
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width))
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height))
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data
    showPicked({ r, g, b })
  })

  function showPicked(rgb) {
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
    pickedSwatch.style.background = hex
    pickedCodes.innerHTML = `
      ${codeLine('HEX', hex)}
      ${codeLine('RGB', formatRgb(rgb))}
      ${codeLine('HSL', formatHsl(rgbToHsl(rgb.r, rgb.g, rgb.b)))}
    `
    bindCopy(pickedCodes)
  }

  // 点击调色板色块 → 复制 + 同步到转换面板
  paletteEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.cl-swatch')
    if (!btn) return
    const hex = btn.dataset.hex
    copyText(hex)
    showPicked(hexToRgb(hex))
  })

  pickerReset.addEventListener('click', () => {
    pickerWorkspace.style.display = 'none'
    uploadArea.style.display = 'block'
    paletteEl.innerHTML = ''
    pickedCodes.innerHTML = '<p class="cl-muted">在图片上点击取色</p>'
    pickedSwatch.style.background = 'transparent'
  })

  // ---------- 颜色转换 ----------
  function updateConvert(rgb) {
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
    convSwatch.style.background = hex
    outHex.textContent = hex
    outRgb.textContent = formatRgb(rgb)
    outHsl.textContent = formatHsl(rgbToHsl(rgb.r, rgb.g, rgb.b))
    nativePick.value = hex
    // 对比度
    const onWhite = contrastRatio(rgb, { r: 255, g: 255, b: 255 })
    const onBlack = contrastRatio(rgb, { r: 0, g: 0, b: 0 })
    contrastEl.innerHTML = `
      <span class="cl-contrast-label">对比度</span>
      <span class="cl-chip" style="background:${hex};color:#fff">白字 ${onWhite}:1 ${grade(onWhite)}</span>
      <span class="cl-chip" style="background:${hex};color:#000">黑字 ${onBlack}:1 ${grade(onBlack)}</span>
    `
  }

  function applyInput(raw) {
    const rgb = parseColor(raw)
    if (!rgb) {
      inputEl.classList.add('cl-invalid')
      return
    }
    inputEl.classList.remove('cl-invalid')
    updateConvert(rgb)
  }

  inputEl.addEventListener('input', () => applyInput(inputEl.value))
  nativePick.addEventListener('input', () => {
    inputEl.value = nativePick.value
    applyInput(nativePick.value)
  })

  // 复制按钮（转换面板）
  bindCopy(panelConvert)

  // 初始渲染
  updateConvert(hexToRgb('#e94560'))

  // ---------- 工具函数 ----------
  function codeLine(label, value) {
    return `<div class="cl-code-row">
      <span class="cl-code-label">${label}</span>
      <code>${value}</code>
      <button class="cl-copy" data-text="${value}">复制</button>
    </div>`
  }

  function bindCopy(scope) {
    scope.querySelectorAll('.cl-copy').forEach((btn) => {
      btn.onclick = () => {
        const text = btn.dataset.text || document.getElementById(btn.dataset.target)?.textContent
        if (text) copyText(text)
      }
    })
  }

  function copyText(text) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => showToast(`已复制 ${text}`, 'success'),
        () => showToast('复制失败', 'error')
      )
    } else {
      showToast('当前环境不支持复制', 'error')
    }
  }

  function grade(ratio) {
    if (ratio >= 7) return 'AAA'
    if (ratio >= 4.5) return 'AA'
    if (ratio >= 3) return 'AA大字'
    return '✕'
  }

  // cleanup
  return () => {}
}
