/**
 * MediaKit - 主入口
 * 纯前端媒体工具箱
 */

import { initRouter } from './router.js'
import { initTheme } from './common/theme.js'
import { renderNavbar, renderFooter } from './common/layout.js'
import { initToast } from './common/toast.js'

function init() {
  // 渲染导航栏和页脚
  renderNavbar()
  renderFooter()

  // 初始化主题
  initTheme()

  // 初始化 Toast 系统
  initToast()

  // 初始化路由
  initRouter()
}

// DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
