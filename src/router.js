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
        <div class="hero">
          <div class="hero-index">工作台 / 概览</div>
          <div class="hero-copy">
            <p class="eyebrow">MEDIAKIT LOCAL STUDIO</p>
            <h1>媒体工具工作台</h1>
          </div>
          <div class="hero-meta"><span>7 个模块</span><span>本地处理</span><span>零上传</span></div>
          <p class="subtitle">选择工具开始处理。文件始终仅在当前浏览器会话中使用。</p>
          <div class="tool-grid" id="tool-grid"></div>
        </div>
      </section>`
    renderHomeGrid()
    updateNavActive(null)
    return
  }

  const loader = toolRegistry[toolId]
  if (!loader) { window.location.hash = '#/'; return }

  try {
    const module = await loader()
    content.innerHTML = '<div id="tool-container"></div>'
    currentCleanup = typeof module.render === 'function' ? module.render(document.getElementById('tool-container')) : null
    updateNavActive(toolId)
  } catch (error) {
    console.error(`Failed to load tool: ${toolId}`, error)
    content.innerHTML = '<div class="tool-error"><h2>加载失败</h2><p>工具加载出错，请刷新后重试。</p></div>'
  }
}

function renderHomeGrid() {
  const tools = [
    { id: 'image-compress', icon: ICONS.compress, name: '图片压缩', desc: '压缩 PNG/JPG/WebP，实时预览对比，支持批量处理', tag: 'IMAGE' },
    { id: 'format-convert', icon: ICONS.convert, name: '格式转换', desc: '图片、视频、音频格式互转', tag: 'CONVERT' },
    { id: 'image-edit', icon: ICONS.edit, name: '图片编辑', desc: '裁剪、旋转、翻转与滤镜处理', tag: 'EDIT' },
    { id: 'video-tools', icon: ICONS.video, name: '视频工具', desc: '视频压缩、转 GIF 与格式转换', tag: 'VIDEO' },
    { id: 'audio-tools', icon: ICONS.audio, name: '音频工具', desc: '音频压缩、格式转换与音量调整', tag: 'AUDIO' },
    { id: 'qr-workshop', icon: ICONS.qrcode, name: '二维码工坊', desc: '生成、解析二维码与 WiFi 配置', tag: 'QR CODE' },
    { id: 'color-lab', icon: ICONS.color, name: '颜色实验室', desc: '图片取色、调色板与颜色转换', tag: 'COLOR' },
  ]
  const grid = document.getElementById('tool-grid')
  if (!grid) return
  grid.innerHTML = tools.map(t => `<button class="tool-card" data-tool="${t.id}" type="button"><span class="tool-icon">${t.icon}</span><span class="tool-name">${t.name}</span><span class="tool-desc">${t.desc}</span><span class="tool-tag">${t.tag}</span></button>`).join('')
  grid.querySelectorAll('.tool-card').forEach(card => card.addEventListener('click', () => { window.location.hash = `#/${card.dataset.tool}` }))
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
