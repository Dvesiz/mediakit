/**
 * 二维码工坊 - MediaKit 集成
 * 从独立项目迁移，适配 render(container) 模式
 */
import './style.css'
import { downloadCanvasPng, generateQrCanvas } from './modules/generator.js'
import { decodeQrFromFile } from './modules/parser.js'
import { buildWifiQrText } from './modules/wifi.js'
import { loadImageFromFile } from './utils/canvas.js'
import { ICONS } from '../../common/icons.js'

export function render(container) {
  container.innerHTML = `
    <div class="tool-header">
        <h2>${ICONS.qrcode} 二维码工坊</h2>
      <p>生成/解码二维码，支持 Logo 合成、WiFi 配置</p>
    </div>

    <div class="qr-workshop">
      <div class="qw-tabs" role="tablist" aria-label="二维码工具切换">
        <button class="qw-tab is-active" type="button" role="tab" data-tab="generator" aria-controls="qw-panel-generator" aria-selected="true">生成二维码</button>
        <button class="qw-tab" type="button" role="tab" data-tab="parser" aria-controls="qw-panel-parser" aria-selected="false">解析二维码</button>
        <button class="qw-tab" type="button" role="tab" data-tab="wifi" aria-controls="qw-panel-wifi" aria-selected="false">WiFi 配置</button>
      </div>

      <!-- 生成面板 -->
      <section class="qw-panel is-active" id="qw-panel-generator" role="tabpanel" data-panel="generator">
        <div class="qw-panel-layout">
          <div class="qw-panel-desc">
            <h3>文本 / 链接二维码</h3>
            <p>输入任意文本，选择尺寸和颜色，也可上传 Logo 自动合成到二维码中心。</p>
          </div>
          <form class="qw-card" data-generator-form>
            <label>
              内容
              <textarea name="text" rows="4" placeholder="https://example.com" required></textarea>
            </label>
            <div class="qw-form-grid">
              <label>
                尺寸
                <select name="size">
                  <option value="200">200px</option>
                  <option value="300" selected>300px</option>
                  <option value="400">400px</option>
                  <option value="500">500px</option>
                  <option value="custom">自定义</option>
                </select>
              </label>
              <label>
                自定义尺寸
                <input name="customSize" type="number" min="160" max="1000" step="10" placeholder="160-1000" disabled />
              </label>
              <label>
                前景色
                <input name="foregroundColor" type="color" value="#111111" />
              </label>
              <label>
                背景色
                <input name="backgroundColor" type="color" value="#ffffff" />
              </label>
            </div>
            <label>
              Logo（可选）
              <input name="logo" type="file" accept="image/*" />
            </label>
            <div class="qw-actions">
              <button class="btn btn-primary" type="submit">生成二维码</button>
              <button class="btn btn-secondary" type="button" data-download-generator disabled>下载 PNG</button>
            </div>
          </form>
          <aside class="qw-result-card">
            <div class="qw-stage" data-generator-result>
              <span>二维码会显示在这里</span>
            </div>
            <p class="qw-status" data-generator-status>等待输入内容。</p>
          </aside>
        </div>
      </section>

      <!-- 解析面板 -->
      <section class="qw-panel" id="qw-panel-parser" role="tabpanel" data-panel="parser" hidden>
        <div class="qw-panel-layout">
          <div class="qw-panel-desc">
            <h3>上传图片解析二维码</h3>
            <p>选择或拖拽包含二维码的图片，本地读取像素并解析文本内容。</p>
          </div>
          <div class="qw-card qw-dropzone" data-dropzone>
            <input id="qw-parser-file" name="parserFile" type="file" accept="image/*" data-parser-file />
            <label for="qw-parser-file">
              <strong>点击选择图片</strong>
              <span>或将 PNG、JPG、WebP 拖到这里</span>
            </label>
          </div>
          <aside class="qw-result-card qw-parser-result">
            <p class="qw-status" data-parser-status>尚未上传图片。</p>
            <textarea data-parser-output rows="6" readonly placeholder="解析结果会显示在这里"></textarea>
            <div class="qw-actions">
              <button class="btn btn-secondary" type="button" data-copy-parser disabled>复制结果</button>
            </div>
            <div class="qw-wifi-hint" data-parser-wifi hidden></div>
          </aside>
        </div>
      </section>

      <!-- WiFi 面板 -->
      <section class="qw-panel" id="qw-panel-wifi" role="tabpanel" data-panel="wifi" hidden>
        <div class="qw-panel-layout">
          <div class="qw-panel-desc">
            <h3>WiFi 连接二维码</h3>
            <p>按标准格式生成 WiFi 配置字符串，手机扫码即可识别网络名称、密码与加密方式。</p>
          </div>
          <form class="qw-card" data-wifi-form>
            <label>
              WiFi 名称（SSID）
              <input name="ssid" type="text" placeholder="MyHome" required />
            </label>
            <div class="qw-form-grid">
              <label>
                加密方式
                <select name="encryption">
                  <option value="WPA2" selected>WPA2</option>
                  <option value="WPA">WPA</option>
                  <option value="WPA3">WPA3</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">无密码</option>
                </select>
              </label>
              <label>
                密码
                <input name="password" type="password" autocomplete="new-password" />
              </label>
              <label class="qw-checkbox-label">
                <input name="hidden" type="checkbox" />
                隐藏网络
              </label>
            </div>
            <details class="qw-details">
              <summary>生成的标准字符串</summary>
              <code data-wifi-text>填写表单后自动生成</code>
            </details>
            <div class="qw-actions">
              <button class="btn btn-primary" type="submit">生成 WiFi 二维码</button>
              <button class="btn btn-secondary" type="button" data-download-wifi disabled>下载 PNG</button>
            </div>
          </form>
          <aside class="qw-result-card">
            <div class="qw-stage" data-wifi-result>
              <span>WiFi 二维码会显示在这里</span>
            </div>
            <p class="qw-status" data-wifi-status>等待填写 WiFi 信息。</p>
          </aside>
        </div>
      </section>
    </div>

    <!-- 预览弹窗 -->
    <dialog class="qw-preview-dialog" data-preview-dialog aria-label="二维码放大预览">
      <button class="qw-preview-close" type="button" data-preview-close aria-label="关闭预览">×</button>
      <div data-preview-body></div>
    </dialog>

    <!-- Toast -->
    <div class="qw-toast" data-toast role="status" aria-live="polite" hidden></div>
  `

  // --- 状态变量 ---
  let generatorCanvas = null
  let wifiCanvas = null
  let lastPreviewTrigger = null

  // --- DOM 引用 ---
  const tabs = [...container.querySelectorAll('[data-tab]')]
  const panels = [...container.querySelectorAll('[data-panel]')]
  const toast = container.querySelector('[data-toast]')
  const previewDialog = container.querySelector('[data-preview-dialog]')
  const previewBody = container.querySelector('[data-preview-body]')
  const previewClose = container.querySelector('[data-preview-close]')

  // --- 工具函数 ---
  function showToast(message) {
    toast.textContent = message
    toast.hidden = false
    window.clearTimeout(showToast._showId)
    window.clearTimeout(showToast._hideId)

    showToast._showId = window.setTimeout(() => {
      toast.classList.add('is-visible')
    }, 0)

    showToast._hideId = window.setTimeout(() => {
      toast.classList.remove('is-visible')
      showToast._hideId = window.setTimeout(() => {
        toast.hidden = true
      }, 260)
    }, 2600)
  }
  showToast._showId = 0
  showToast._hideId = 0

  function setStatus(element, message, type = 'neutral') {
    element.textContent = message
    element.dataset.type = type
  }

  function renderCanvas(resultEl, canvas) {
    resultEl.replaceChildren(canvas)
    canvas.setAttribute('aria-label', '生成的二维码')
    canvas.setAttribute('role', 'button')
    canvas.setAttribute('tabindex', '0')
    canvas.title = '点击放大预览'

    canvas.addEventListener('click', () => openPreview(canvas, canvas))
    canvas.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        openPreview(canvas, canvas)
      }
    })
  }

  function openPreview(canvas, triggerElement = null) {
    lastPreviewTrigger = triggerElement
    const image = document.createElement('img')
    image.src = canvas.toDataURL('image/png')
    image.alt = '二维码放大预览'
    previewBody.replaceChildren(image)
    previewDialog.showModal()
    previewClose.focus()
  }

  // --- 标签切换 ---
  function setActiveTab(tabName) {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.tab === tabName
      tab.classList.toggle('is-active', isActive)
      tab.setAttribute('aria-selected', String(isActive))
      tab.tabIndex = isActive ? 0 : -1
    })

    panels.forEach((panel) => {
      const isActive = panel.dataset.panel === tabName
      panel.classList.toggle('is-active', isActive)
      panel.hidden = !isActive
    })
  }

  function initTabs() {
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        setActiveTab(tab.dataset.tab)
      })

      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const lastIndex = tabs.length - 1
        const nextIndex = {
          ArrowLeft: index === 0 ? lastIndex : index - 1,
          ArrowRight: index === lastIndex ? 0 : index + 1,
          Home: 0,
          End: lastIndex
        }[event.key]
        tabs[nextIndex].focus()
        setActiveTab(tabs[nextIndex].dataset.tab)
      })
    })
  }

  // --- 生成器 ---
  async function getOptionalLogo(fileInput) {
    const file = fileInput.files?.[0]
    return file ? loadImageFromFile(file) : null
  }

  function initGenerator() {
    const form = container.querySelector('[data-generator-form]')
    const result = container.querySelector('[data-generator-result]')
    const status = container.querySelector('[data-generator-status]')
    const downloadButton = container.querySelector('[data-download-generator]')
    const sizeSelect = form.elements.size
    const customSizeInput = form.elements.customSize

    sizeSelect.addEventListener('change', () => {
      const isCustom = sizeSelect.value === 'custom'
      customSizeInput.disabled = !isCustom
      customSizeInput.required = isCustom
      if (!isCustom) customSizeInput.value = ''
    })

    form.addEventListener('submit', async (event) => {
      event.preventDefault()
      setStatus(status, '正在生成二维码...', 'loading')
      downloadButton.disabled = true

      try {
        const formData = new FormData(form)
        const logoImage = await getOptionalLogo(form.elements.logo)
        const size = formData.get('size') === 'custom'
          ? formData.get('customSize')
          : formData.get('size')
        generatorCanvas = await generateQrCanvas({
          text: formData.get('text'),
          size,
          foregroundColor: formData.get('foregroundColor'),
          backgroundColor: formData.get('backgroundColor'),
          logoImage
        })

        renderCanvas(result, generatorCanvas)
        downloadButton.disabled = false
        setStatus(status, '二维码已生成，可下载 PNG。', 'success')
      } catch (error) {
        generatorCanvas = null
        setStatus(status, error.message, 'error')
        showToast(error.message)
      }
    })

    downloadButton.addEventListener('click', () => {
      if (generatorCanvas) {
        downloadCanvasPng(generatorCanvas, 'qr-code-workshop.png')
      }
    })
  }

  // --- 预览 ---
  function initPreview() {
    previewClose.addEventListener('click', () => previewDialog.close())
    previewDialog.addEventListener('click', (event) => {
      if (event.target === previewDialog) previewDialog.close()
    })
    previewDialog.addEventListener('close', () => {
      previewBody.replaceChildren()
      lastPreviewTrigger?.focus()
      lastPreviewTrigger = null
    })
  }

  // --- 解析器 ---
  function renderWifiHint(containerEl, wifi) {
    if (!wifi) {
      containerEl.hidden = true
      containerEl.replaceChildren()
      return
    }

    containerEl.hidden = false
    containerEl.replaceChildren()

    const title = document.createElement('strong')
    title.textContent = '检测到 WiFi 配置'

    const ssid = document.createElement('span')
    ssid.textContent = `SSID：${wifi.ssid || '未提供'}`

    const encryption = document.createElement('span')
    encryption.textContent = `加密：${wifi.encryption}`

    const hidden = document.createElement('span')
    hidden.textContent = `隐藏网络：${wifi.hidden ? '是' : '否'}`

    containerEl.append(title, ssid, encryption, hidden)
  }

  async function handleParserFile(file) {
    const status = container.querySelector('[data-parser-status]')
    const output = container.querySelector('[data-parser-output]')
    const copyButton = container.querySelector('[data-copy-parser]')
    const wifiHint = container.querySelector('[data-parser-wifi]')

    setStatus(status, '正在解析图片...', 'loading')
    output.value = ''
    copyButton.disabled = true
    renderWifiHint(wifiHint, null)

    try {
      const decoded = await decodeQrFromFile(file)

      if (!decoded) {
        setStatus(status, '未识别到二维码，请换一张更清晰的图片。', 'error')
        return
      }

      output.value = decoded.text
      copyButton.disabled = false
      renderWifiHint(wifiHint, decoded.wifi)
      setStatus(status, '解析成功，结果已在下方显示。', 'success')
    } catch (error) {
      setStatus(status, error.message, 'error')
      showToast(error.message)
    }
  }

  function initParser() {
    const fileInput = container.querySelector('[data-parser-file]')
    const dropzone = container.querySelector('[data-dropzone]')
    const output = container.querySelector('[data-parser-output]')
    const copyButton = container.querySelector('[data-copy-parser]')
    let dragDepth = 0

    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0]
      if (file) handleParserFile(file)
    })

    dropzone.addEventListener('dragenter', (event) => {
      event.preventDefault()
      dragDepth += 1
      dropzone.classList.add('is-dragging')
    })

    dropzone.addEventListener('dragover', (event) => event.preventDefault())

    dropzone.addEventListener('dragleave', (event) => {
      event.preventDefault()
      dragDepth = Math.max(0, dragDepth - 1)
      if (dragDepth === 0) dropzone.classList.remove('is-dragging')
    })

    dropzone.addEventListener('drop', (event) => {
      event.preventDefault()
      dragDepth = 0
      dropzone.classList.remove('is-dragging')

      const file = event.dataTransfer.files?.[0]
      if (file) handleParserFile(file)
    })

    copyButton.addEventListener('click', async () => {
      await navigator.clipboard.writeText(output.value)
      showToast('解析结果已复制')
    })
  }

  // --- WiFi ---
  function getWifiFormValues(form) {
    const formData = new FormData(form)
    return {
      ssid: formData.get('ssid'),
      encryption: formData.get('encryption'),
      password: formData.get('password'),
      hidden: formData.get('hidden') === 'on'
    }
  }

  function initWifi() {
    const form = container.querySelector('[data-wifi-form]')
    const result = container.querySelector('[data-wifi-result]')
    const status = container.querySelector('[data-wifi-status]')
    const wifiText = container.querySelector('[data-wifi-text]')
    const downloadButton = container.querySelector('[data-download-wifi]')

    form.addEventListener('input', () => {
      try {
        wifiText.textContent = buildWifiQrText(getWifiFormValues(form))
      } catch {
        wifiText.textContent = '填写表单后自动生成'
      }
    })

    form.addEventListener('submit', async (event) => {
      event.preventDefault()
      setStatus(status, '正在生成 WiFi 二维码...', 'loading')
      downloadButton.disabled = true

      try {
        const text = buildWifiQrText(getWifiFormValues(form))
        wifiText.textContent = text
        wifiCanvas = await generateQrCanvas({ text, size: 300 })
        renderCanvas(result, wifiCanvas)
        downloadButton.disabled = false
        setStatus(status, 'WiFi 二维码已生成。', 'success')
      } catch (error) {
        wifiCanvas = null
        setStatus(status, error.message, 'error')
        showToast(error.message)
      }
    })

    downloadButton.addEventListener('click', () => {
      if (wifiCanvas) {
        downloadCanvasPng(wifiCanvas, 'wifi-qr-code.png')
      }
    })
  }

  // --- 初始化 ---
  initTabs()
  initPreview()
  initGenerator()
  initParser()
  initWifi()

  // 返回 cleanup 函数
  return () => {
    // 清理事件（解绑不需要，容器会被移除）
    generatorCanvas = null
    wifiCanvas = null
    lastPreviewTrigger = null
  }
}
