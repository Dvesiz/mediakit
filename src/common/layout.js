import { toggleTheme } from './theme.js'
import { ICONS } from './icons.js'

const navTools = [
  { id: null, icon: ICONS.home, label: '首页' },
  { id: 'image-compress', icon: ICONS.compress, label: '压缩' },
  { id: 'format-convert', icon: ICONS.convert, label: '转换' },
  { id: 'image-edit', icon: ICONS.edit, label: '编辑' },
  { id: 'video-tools', icon: ICONS.video, label: '视频' },
  { id: 'audio-tools', icon: ICONS.audio, label: '音频' },
  { id: 'qr-workshop', icon: ICONS.qrcode, label: '二维码' },
  { id: 'color-lab', icon: ICONS.color, label: '取色' },
]

export function getNavigationTools() {
  return navTools
}

export function renderNavbar() {
  const header = document.getElementById('header')
  if (!header) return

  header.innerHTML = `
    <div class="header-inner">
      <button class="header-logo" type="button" aria-label="返回 MediaKit 首页">
        <span class="logo-accent">MK</span>
        <span><strong>MEDIAKIT</strong><small>LOCAL STUDIO</small></span>
      </button>
      <div class="header-status"><span></span>所有处理仅在本地完成</div>
      <nav class="header-nav" aria-label="工具导航">
        ${navTools.map(t => `<button class="nav-btn" data-tool="${t.id || ''}" title="${t.label}" aria-label="${t.label}">${t.icon}<span>${t.label}</span></button>`).join('')}
        <a class="nav-icon-link" href="https://github.com/Dvesiz/mediakit" target="_blank" rel="noopener noreferrer" aria-label="GitHub 仓库" title="GitHub 仓库">${ICONS.github}</a>
        <button id="theme-toggle" class="theme-toggle" aria-label="切换主题"></button>
      </nav>
    </div>`

  header.querySelector('.header-logo').addEventListener('click', () => { window.location.hash = '#/' })
  header.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.hash = btn.dataset.tool ? `#/${btn.dataset.tool}` : '#/'
    })
  })
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme)
}

export function renderFooter() {
  const footer = document.getElementById('footer')
  if (footer) footer.innerHTML = '<span>MEDIAKIT / 01</span><span>浏览器本地处理 · 隐私优先</span><span>© 2026</span>'
}
