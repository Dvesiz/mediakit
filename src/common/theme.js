/**
 * MediaKit - 主题切换
 */

import { ICONS } from './icons.js'

const THEME_KEY = 'mediakit-theme'

function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  const btn = document.getElementById('theme-toggle')
  if (btn) {
    btn.innerHTML = theme === 'dark' ? ICONS.sun : ICONS.moon
    btn.setAttribute('aria-label', theme === 'dark' ? '切换亮色主题' : '切换暗色主题')
  }
}

export function initTheme() {
  const theme = getPreferredTheme()
  applyTheme(theme)

  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (!localStorage.getItem(THEME_KEY)) {
      applyTheme(getPreferredTheme())
    }
  })
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark'
  const next = current === 'dark' ? 'light' : 'dark'
  localStorage.setItem(THEME_KEY, next)
  applyTheme(next)
}
