/**
 * MediaKit - 全局 Toast 通知系统
 * 从 qr-workshop 提取，统一全站错误/成功/信息提示
 */

let toastEl = null
let showId = 0
let hideId = 0

/**
 * 初始化 Toast — 在页面中注入 toast 元素
 */
export function initToast() {
  if (document.querySelector('[data-global-toast]')) return

  toastEl = document.createElement('div')
  toastEl.className = 'global-toast'
  toastEl.dataset.globalToast = ''
  toastEl.setAttribute('role', 'status')
  toastEl.setAttribute('aria-live', 'polite')
  toastEl.hidden = true
  document.body.appendChild(toastEl)
}

/**
 * 显示 Toast 消息
 * @param {string} message - 显示内容
 * @param {'info'|'success'|'error'} [type='info']
 */
export function showToast(message, type) {
  if (!toastEl) {
    initToast()
  }

  toastEl.textContent = message
  toastEl.hidden = false
  toastEl.dataset.type = type || 'info'

  window.clearTimeout(showId)
  window.clearTimeout(hideId)

  showId = window.setTimeout(() => {
    toastEl.classList.add('is-visible')
  }, 0)

  hideId = window.setTimeout(() => {
    toastEl.classList.remove('is-visible')
    hideId = window.setTimeout(() => {
      toastEl.hidden = true
    }, 260)
  }, 2600)
}
