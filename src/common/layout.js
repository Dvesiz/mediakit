/**
 * MediaKit - 布局组件（导航栏 & 页脚）
 */

import { toggleTheme } from './theme.js'
import { ICONS } from './icons.js'

// 工具导航配置
const navTools = [
  { id: null,        icon: ICONS.home,    label: '首页' },
  { id: 'image-compress', icon: ICONS.compress, label: '压缩' },
  { id: 'format-convert', icon: ICONS.convert,  label: '转换' },
  { id: 'image-edit',     icon: ICONS.edit,     label: '编辑' },
  { id: 'video-tools',    icon: ICONS.video,    label: '视频' },
  { id: 'audio-tools',    icon: ICONS.audio,    label: '音频' },
  { id: 'qr-workshop',    icon: ICONS.qrcode,   label: '二维码' },
  { id: 'color-lab',      icon: ICONS.color,    label: '取色' },
]

export function renderNavbar() {
  const header = document.getElementById('header')
  if (!header) return

  header.innerHTML = `
    <div class="header-inner">
      <div class="header-logo" onclick="window.location.hash='#/'">
        <span class="logo-accent">M</span>ediaKit
      </div>
      <nav class="header-nav">
        ${navTools.map(t => `
          <button class="nav-btn" data-tool="${t.id || ''}">${t.icon} ${t.label}</button>
        `).join('')}
        <button id="theme-toggle" class="theme-toggle" aria-label="切换主题">${ICONS.sun}</button>
      </nav>
    </div>
  `

  // 导航点击
  header.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const toolId = btn.dataset.tool
      window.location.hash = toolId ? `#/${toolId}` : '#/'
    })
  })

  // 主题切换
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme)
}

export function renderFooter() {
  const footer = document.getElementById('footer')
  if (!footer) return

  footer.innerHTML = `
    <p>MediaKit · 纯前端媒体工具箱 · 所有处理在浏览器本地完成</p>
    <p style="margin-top: var(--spacing-xs);">Made with ${ICONS.heart} · 隐私优先 · 无需上传</p>
  `
}
