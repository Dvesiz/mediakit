/**
 * 音频工具函数库
 * 纯函数：ffmpeg 命令参数构建 + 文件名处理，不依赖 ffmpeg 实例本身，便于单测
 */

export const AUDIO_FORMATS = {
  mp3: { label: 'MP3', ext: 'mp3', codec: 'libmp3lame', lossy: true },
  wav: { label: 'WAV', ext: 'wav', codec: 'pcm_s16le', lossy: false },
  ogg: { label: 'OGG', ext: 'ogg', codec: 'libvorbis', lossy: true },
  aac: { label: 'AAC (M4A)', ext: 'm4a', codec: 'aac', lossy: true },
}

export const BITRATES = [64, 96, 128, 192, 256]

export const AUDIO_QUALITY_PRESETS = {
  high: { bitrate: 256, label: '高保真' },
  standard: { bitrate: 128, label: '标准（推荐）' },
  small: { bitrate: 64, label: '省流量' },
}

/**
 * 根据目标文件大小和时长估算所需音频码率
 * @param {number} targetSizeMB - 目标文件大小（MB）
 * @param {number} durationSec - 音频时长（秒）
 * @returns {number} 目标码率（kbps），最低 32
 */
export function estimateTargetAudioBitrateKbps(targetSizeMB, durationSec) {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return 32
  return Math.max(32, Math.floor((targetSizeMB * 8192) / durationSec))
}

/**
 * 构建 ffmpeg 音频转换/压缩命令参数
 * @param {Object} opts
 * @param {string} opts.inputName
 * @param {string} opts.outputName
 * @param {'mp3'|'wav'|'ogg'|'aac'} opts.format
 * @param {number} [opts.bitrate=128] - 比特率 kbps，仅有损格式生效
 * @param {number} [opts.volume=100] - 音量百分比，100 为原始音量
 * @returns {string[]}
 */
export function buildAudioArgs({ inputName, outputName, format, bitrate = 128, volume = 100 }) {
  const fmt = AUDIO_FORMATS[format] || AUDIO_FORMATS.mp3
  const args = ['-i', inputName, '-c:a', fmt.codec]

  if (fmt.lossy) {
    args.push('-b:a', `${bitrate}k`)
  }
  if (volume !== 100) {
    args.push('-af', `volume=${(volume / 100).toFixed(2)}`)
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
