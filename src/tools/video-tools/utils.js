/**
 * 视频工具函数库
 * 纯函数：ffmpeg 命令参数构建 + 文件名处理，不依赖 ffmpeg 实例本身，便于单测
 */

export const VIDEO_FORMATS = {
  mp4: { label: 'MP4', ext: 'mp4' },
  webm: { label: 'WebM', ext: 'webm' },
  gif: { label: 'GIF 动图', ext: 'gif' },
}

export const RESOLUTIONS = [
  { value: 0, label: '保持原始分辨率' },
  { value: 1280, label: '1280px 宽' },
  { value: 854, label: '854px 宽' },
  { value: 640, label: '640px 宽' },
  { value: 480, label: '480px 宽' },
]

export const VIDEO_QUALITY_PRESETS = {
  high: { crf: 20, label: '高质量画面' },
  balanced: { crf: 26, label: '均衡（推荐）' },
  small: { crf: 32, label: '极限压缩' },
}

/**
 * 根据目标文件大小和时长估算所需视频码率
 * @param {number} targetSizeMB - 目标文件大小（MB）
 * @param {number} durationSec - 视频时长（秒）
 * @param {number} [audioReserveKbps=128] - 预留给音频轨道的码率
 * @returns {number} 目标视频码率（kbps），最低 150
 */
export function estimateTargetVideoBitrateKbps(targetSizeMB, durationSec, audioReserveKbps = 128) {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return 150
  const totalKbps = (targetSizeMB * 8192) / durationSec
  return Math.max(150, Math.floor(totalKbps - audioReserveKbps))
}

/**
 * 构建 ffmpeg 转换/压缩命令参数
 * @param {Object} opts
 * @param {string} opts.inputName - ffmpeg 虚拟文件系统内输入文件名
 * @param {string} opts.outputName - 输出文件名
 * @param {'mp4'|'webm'|'gif'} opts.format - 目标格式
 * @param {number} [opts.crf=28] - 画质（越小越清晰，越大文件越小），仅 mp4/webm 生效
 * @param {number} [opts.targetBitrateKbps] - 目标码率，提供时替代 crf 走码率控制模式，仅 mp4/webm 生效
 * @param {number} [opts.scaleWidth=0] - 缩放宽度，0 表示保持原始分辨率
 * @param {number} [opts.fps=12] - GIF 帧率，仅 format=gif 生效
 * @param {number} [opts.startSec=0] - 裁剪起始时间（秒），>0 时生效
 * @param {number} [opts.durationSec=0] - 裁剪时长（秒），>0 时生效
 * @returns {string[]}
 */
export function buildVideoArgs({ inputName, outputName, format, crf = 28, targetBitrateKbps, scaleWidth = 0, fps = 12, startSec = 0, durationSec = 0 }) {
  const args = []
  if (startSec > 0) args.push('-ss', String(startSec))
  args.push('-i', inputName)
  if (durationSec > 0) args.push('-t', String(durationSec))
  const filters = []
  if (scaleWidth > 0) filters.push(`scale=${scaleWidth}:-2`)

  if (format === 'gif') {
    filters.push(`fps=${fps}`)
    args.push('-vf', filters.join(','), '-loop', '0')
  } else {
    if (filters.length) args.push('-vf', filters.join(','))
    args.push('-c:v', format === 'webm' ? 'libvpx-vp9' : 'libx264')
    if (targetBitrateKbps) {
      args.push('-b:v', `${targetBitrateKbps}k`, '-maxrate', `${targetBitrateKbps}k`, '-bufsize', `${targetBitrateKbps * 2}k`)
    } else {
      args.push('-crf', String(crf))
    }
    args.push('-preset', 'fast')
    if (format === 'mp4') args.push('-pix_fmt', 'yuv420p', '-movflags', '+faststart')
    if (format === 'webm' && !targetBitrateKbps) args.push('-b:v', '0')
    args.push('-c:a', format === 'webm' ? 'libopus' : 'aac')
  }

  args.push(outputName)
  return args
}

/**
 * 生成输出文件名
 * @param {string} originalName
 * @param {string} ext
 * @returns {string}
 */
export function deriveOutputName(originalName, ext) {
  const base = originalName.replace(/\.[^.]+$/, '')
  return `${base}_converted.${ext}`
}

/**
 * 从原始文件名提取一个可用于 ffmpeg 虚拟文件系统的安全文件名（保留扩展名）
 * @param {string} originalName
 * @returns {string}
 */
export function safeInputName(originalName) {
  const ext = originalName.match(/\.[^.]+$/)?.[0] || ''
  return `input${ext}`
}
