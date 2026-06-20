/**
 * MediaKit - 简易 Hash 路由
 *
 * 路由规则：
 *   #/image-compress   图片压缩
 *   #/format-convert   格式转换
 *   #/image-edit       图片编辑
 *   #/video-tools      视频工具
 *   #/audio-tools      音频工具
 *   #/qr-workshop      二维码工坊
 *   #/color-lab        颜色实验室
 *   (空)               首页工具网格
 */

// 工具模块注册表：lazy load 入口
const toolRegistry = {
  'image-compress': () => import('./tools/image-compress/index.js'),
  'format-convert': () => import('./tools/format-convert/index.js'),
  'image-edit':     () => import('./tools/image-edit/index.js'),
  'video-tools':    () => import('./tools/video-tools/index.js'),
  'audio-tools':    () => import('./tools/audio-tools/index.js'),
  'qr-workshop':    () => import('./tools/qr-workshop/index.js'),
  'color-lab':      () => import('./tools/color-lab/index.js'),
}

let currentTool = null
let currentCleanup = null

/**
 * 解析当前 hash 得到工具 ID
 */
function getToolIdFromHash() {
  const hash = window.location.hash.slice(1) || '/'
  // 移除首尾斜杠，取第一段
  const path = hash.replace(/^\/+|\/+$/g, '')
  return path || null
}

/**
 * 切换当前工具
 */
async function navigate(toolId) {
  // 清理上一个工具
  if (currentCleanup && typeof currentCleanup === 'function') {
    currentCleanup()
    currentCleanup = null
  }

  const content = document.getElementById('content')

  // 首页
  if (!toolId) {
    content.innerHTML = `
      <section id="tool-home" class="tool-page active">
        <div class="hero">
          <h1>MediaKit</h1>
          <p class="subtitle">纯前端媒体工具箱 · 本地处理 · 隐私安全</p>
          <div class="tool-grid" id="tool-grid"></div>
        </div>
      </section>`
    renderHomeGrid()
    updateNavActive(null)
    currentTool = null
    return
  }

  // 加载工具
  const loader = toolRegistry[toolId]
  if (!loader) {
    // 未知路由，回首页
    window.location.hash = '#/'
    return
  }

  try {
    const module = await loader()
    content.innerHTML = `<div id="tool-container"></div>`
    const container = document.getElementById('tool-container')

    if (module.render && typeof module.render === 'function') {
      currentCleanup = module.render(container)
    }

    currentTool = toolId
    updateNavActive(toolId)
  } catch (err) {
    console.error(`Failed to load tool: ${toolId}`, err)
    content.innerHTML = `<div class="tool-error">
      <h2>加载失败</h2>
      <p>工具 "${toolId}" 加载出错，请刷新重试。</p>
    </div>`
  }
}

/**
 * 首页工具网格
 */
function renderHomeGrid() {
  const tools = [
    { id: 'image-compress', icon: '📦', name: '图片压缩', desc: '压缩 PNG/JPG/WebP，实时预览对比，支持批量处理', tag: '图片' },
    { id: 'format-convert', icon: '🔄', name: '格式转换', desc: '图片/视频/音频格式互转，一键批量转换', tag: '媒体' },
    { id: 'image-edit', icon: '✂️', name: '图片编辑', desc: '裁剪、旋转、翻转、滤镜，基础图片处理', tag: '图片' },
    { id: 'video-tools', icon: '🎬', name: '视频工具', desc: '视频压缩、转 GIF、格式转换', tag: '视频' },
    { id: 'audio-tools', icon: '🎵', name: '音频工具', desc: '音频压缩、格式转换、音量调整', tag: '音频' },
    { id: 'qr-workshop', icon: '📱', name: '二维码工坊', desc: '生成/解码二维码，支持 Logo 合成、WiFi 配置', tag: '二维码' },
    { id: 'color-lab', icon: '🎨', name: '颜色实验室', desc: '图片取色、调色板生成、颜色格式互转', tag: '色彩' },
  ]

  const grid = document.getElementById('tool-grid')
  if (!grid) return

  grid.innerHTML = tools.map(t => `
    <div class="tool-card" data-tool="${t.id}">
      <div class="tool-icon">${t.icon}</div>
      <div class="tool-name">${t.name}</div>
      <div class="tool-desc">${t.desc}</div>
      <span class="tool-tag">${t.tag}</span>
    </div>
  `).join('')

  // 点击卡片跳转
  grid.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('click', () => {
      window.location.hash = `#/${card.dataset.tool}`
    })
  })
}

/**
 * 更新导航栏激活状态
 */
function updateNavActive(toolId) {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === toolId)
  })
}

/**
 * 初始化路由
 */
export function initRouter() {
  // 监听 hash 变化
  window.addEventListener('hashchange', () => {
    navigate(getToolIdFromHash())
  })

  // 初始导航
  navigate(getToolIdFromHash())
}
