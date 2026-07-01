/**
 * MediaKit - 音视频通用工具函数
 * 纯函数：时长格式化、码率估算、压缩率计算，供 video-tools / audio-tools 共用
 */

/**
 * 将秒数格式化为 mm:ss
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'
  const total = Math.round(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * 根据文件大小和时长估算码率（kbps）
 * @param {number} bytes
 * @param {number} durationSec
 * @returns {number}
 */
export function estimateBitrateKbps(bytes, durationSec) {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return 0
  return Math.round((bytes * 8) / 1000 / durationSec)
}

/**
 * 计算压缩百分比（正数为变小，负数为变大）
 * @param {number} originalBytes
 * @param {number} resultBytes
 * @returns {number}
 */
export function compressionRatio(originalBytes, resultBytes) {
  if (!Number.isFinite(originalBytes) || originalBytes <= 0) return 0
  return Math.round((1 - resultBytes / originalBytes) * 100)
}
