import { ICONS } from './common/icons.js'

const toolRegistry = {
  'image-compress': () => import('./tools/image-compress/index.js'),
  'format-convert': () => import('./tools/format-convert/index.js'),
  'image-edit': () => import('./tools/image-edit/index.js'),
  'video-tools': () => import('./tools/video-tools/index.js'),
  'audio-tools': () => import('./tools/audio-tools/index.js'),
  'qr-workshop': () => import('./tools/qr-workshop/index.js'),
  'color-lab': () => import('./tools/color-lab/index.js'),
}

let currentCleanup = null

function getToolIdFromHash() {
  const path = (window.location.hash.slice(1) || '/').replace(/^\/+|\/+$/g, '')
  return path || null
}

async function navigate(toolId) {
  if (typeof currentCleanup === 'function') currentCleanup()
  currentCleanup = null

  const content = document.getElementById('content')
  if (!toolId) {
    content.innerHTML = `
      <section id="tool-home" class="tool-page active">
        <div class="page-heading">
          <h1>工作台</h1>
          <span class="tool-count">7 个工具</span>
        </div>
        <div class="tool-grid" id="tool-grid"></div>
      </section>`
    renderHomeGrid()
    updateNavActive(null)
    return
  }

  const loader = toolRegistry[toolId]
  if (!loader) { window.location.hash = '#/'; return }

  try {
    const module = await loader()
    content.innerHTML = '<a class="back-link" href="#/">← 工作台</a><div id="tool-container"></div>'
    currentCleanup = typeof module.render === 'function' ? module.render(document.getElementById('tool-container')) : null
    updateNavActive(toolId)
  } catch (error) {
    console.error(`Failed to load tool: ${toolId}`, error)
    content.innerHTML = '<div class="tool-error"><h2>加载失败</h2><p>工具加载出错，请刷新后重试。</p></div>'
  }
}

function renderHomeGrid() {
  const tools = [
    { name: '图片', tools: [
      ['image-compress', ICONS.compress, '图片压缩', 'PNG · JPEG · WebP'],
      ['format-convert', ICONS.convert, '格式转换', 'PNG · JPEG · WebP · BMP'],
      ['image-edit', ICONS.edit, '图片编辑', '裁剪 · 旋转 · 滤镜'],
    ] },
    { name: '音视频', tools: [
      ['video-tools', ICONS.video, '视频工具', 'MP4 · WebM · GIF'],
      ['audio-tools', ICONS.audio, '音频工具', 'MP3 · WAV · OGG · AAC'],
    ] },
    { name: '创作辅助', tools: [
      ['qr-workshop', ICONS.qrcode, '二维码工坊', '生成 · 解析 · Wi-Fi'],
      ['color-lab', ICONS.color, '颜色实验室', '取色 · 调色板 · 对比度'],
    ] },
  ]
  const grid = document.getElementById('tool-grid')
  if (!grid) return
  grid.innerHTML = tools.map(group => `
    <section class="tool-group">
      <h2>${group.name}</h2>
      <ul>${group.tools.map(([id, icon, name, details]) => `
        <li><a class="tool-card" href="#/${id}">
          <span class="tool-icon">${icon}</span>
          <span><strong class="tool-name">${name}</strong><small class="tool-desc">${details}</small></span>
          <span class="tool-arrow" aria-hidden="true">↗</span>
        </a></li>`).join('')}
      </ul>
    </section>`).join('')
}

function updateNavActive(toolId) {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const isActive = (btn.dataset.tool || null) === toolId
    btn.classList.toggle('active', isActive)
    btn.setAttribute('aria-current', isActive ? 'page' : 'false')
  })
}

export function initRouter() {
  window.addEventListener('hashchange', () => navigate(getToolIdFromHash()))
  navigate(getToolIdFromHash())
}
