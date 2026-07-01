/**
 * MediaKit - FFmpeg.wasm 共享加载器
 *
 * 单线程 core（无需 SharedArrayBuffer / COOP-COEP 响应头），
 * 可直接部署在 GitHub Pages 等不支持自定义响应头的静态托管上。
 * 核心文件从 CDN 按需拉取，仅在用户打开视频/音频工具时才下载。
 */
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

const CORE_VERSION = '0.12.6'
const BASE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm`

let ffmpeg = null
let loadPromise = null

/**
 * 加载（或复用已加载的）FFmpeg 实例
 * @param {(ratio: number) => void} [onCoreProgress] - 核心文件下载进度回调 0~1
 * @returns {Promise<FFmpeg>}
 */
export function loadFFmpeg(onCoreProgress) {
  if (!ffmpeg) ffmpeg = new FFmpeg()
  if (ffmpeg.loaded) return Promise.resolve(ffmpeg)
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    // js 文件很小，wasm（约 25MB）占绝大部分下载量，进度以 wasm 为准
    const [coreURL, wasmURL] = await Promise.all([
      toBlobURL(`${BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
      toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, 'application/wasm', true, (e) => {
        if (e.total) onCoreProgress?.(e.received / e.total)
      }),
    ])
    await ffmpeg.load({ coreURL, wasmURL })
    return ffmpeg
  })()

  return loadPromise.catch((err) => {
    loadPromise = null
    throw err
  })
}
