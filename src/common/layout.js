import { toggleTheme } from './theme.js'
import { ICONS } from './icons.js'

const navTools = [
  { id: null, icon: ICONS.home, label: '首页' },
  { id: 'image-compress', icon: ICONS.compress, label: '图片压缩' },
  { id: 'format-convert', icon: ICONS.convert, label: '格式转换' },
  { id: 'image-edit', icon: ICONS.edit, label: '图片编辑' },
  { id: 'video-tools', icon: ICONS.video, label: '视频工具' },
  { id: 'audio-tools', icon: ICONS.audio, label: '音频工具' },
  { id: 'qr-workshop', icon: ICONS.qrcode, label: '二维码工坊' },
  { id: 'color-lab', icon: ICONS.color, label: '颜色实验室' },
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
        <span class="logo-accent" aria-hidden="true">M</span>
        <strong>MediaKit</strong>
      </button>
      <nav class="header-nav" aria-label="工具导航">
        ${navTools.map(t => `<button class="nav-btn" data-tool="${t.id || ''}" title="${t.label}" aria-label="${t.label}">${t.icon}<span>${t.label}</span></button>`).join('')}
      </nav>
      <div class="header-actions">
        <a class="nav-icon-link" href="https://github.com/Dvesiz/mediakit" target="_blank" rel="noopener noreferrer" aria-label="GitHub 仓库" title="GitHub 仓库">${ICONS.github}</a>
        <button id="theme-toggle" class="theme-toggle" aria-label="切换主题"></button>
      </div>
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
  if (footer) footer.innerHTML = '<span>MediaKit</span><span class="local-status">本地处理 · 不上传文件</span>'
}
