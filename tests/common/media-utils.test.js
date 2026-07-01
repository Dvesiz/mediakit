import { describe, expect, it } from 'vitest'
import { formatDuration, estimateBitrateKbps, compressionRatio } from '../../src/common/media-utils.js'

describe('formatDuration', () => {
  it('格式化为 mm:ss', () => {
    expect(formatDuration(0)).toBe('00:00')
    expect(formatDuration(65)).toBe('01:05')
    expect(formatDuration(3661)).toBe('61:01')
  })

  it('非法输入返回 00:00', () => {
    expect(formatDuration(NaN)).toBe('00:00')
    expect(formatDuration(-5)).toBe('00:00')
  })
})

describe('estimateBitrateKbps', () => {
  it('根据文件大小和时长估算码率', () => {
    // 1,000,000 bytes = 8,000,000 bits，10 秒 → 800 kbps
    expect(estimateBitrateKbps(1_000_000, 10)).toBe(800)
  })

  it('时长非正数时返回 0', () => {
    expect(estimateBitrateKbps(1_000_000, 0)).toBe(0)
    expect(estimateBitrateKbps(1_000_000, -1)).toBe(0)
  })
})

describe('compressionRatio', () => {
  it('结果变小时返回正的压缩百分比', () => {
    expect(compressionRatio(1000, 500)).toBe(50)
  })

  it('结果变大时返回负数', () => {
    expect(compressionRatio(1000, 1200)).toBe(-20)
  })

  it('原始大小非正数时返回 0', () => {
    expect(compressionRatio(0, 500)).toBe(0)
  })
})
