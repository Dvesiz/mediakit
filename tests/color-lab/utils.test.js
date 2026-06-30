import { describe, expect, it } from 'vitest'
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  parseColor,
  formatRgb,
  formatHsl,
  contrastRatio,
  extractPalette,
  clampByte,
} from '../../src/tools/color-lab/utils.js'

describe('HEX ↔ RGB', () => {
  it('解析 6 位 HEX', () => {
    expect(hexToRgb('#3a7bd5')).toEqual({ r: 58, g: 123, b: 213 })
  })

  it('解析 3 位短 HEX 并展开', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(hexToRgb('0f0')).toEqual({ r: 0, g: 255, b: 0 })
  })

  it('非法 HEX 返回 null', () => {
    expect(hexToRgb('#xyz')).toBeNull()
    expect(hexToRgb('#12345')).toBeNull()
    expect(hexToRgb(123)).toBeNull()
  })

  it('RGB 转 HEX 补零', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000')
    expect(rgbToHex(58, 123, 213)).toBe('#3a7bd5')
  })

  it('越界值被钳制', () => {
    expect(rgbToHex(300, -5, 128)).toBe('#ff0080')
  })
})

describe('RGB ↔ HSL', () => {
  it('纯红转 HSL', () => {
    expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 })
  })

  it('灰色饱和度为 0', () => {
    expect(rgbToHsl(128, 128, 128)).toEqual({ h: 0, s: 0, l: 50 })
  })

  it('HSL 转回 RGB 往返一致', () => {
    expect(hslToRgb(0, 100, 50)).toEqual({ r: 255, g: 0, b: 0 })
    expect(hslToRgb(120, 100, 50)).toEqual({ r: 0, g: 255, b: 0 })
    expect(hslToRgb(240, 100, 50)).toEqual({ r: 0, g: 0, b: 255 })
  })

  it('HSL 色相环绕与越界处理', () => {
    expect(hslToRgb(360, 100, 50)).toEqual({ r: 255, g: 0, b: 0 })
    expect(hslToRgb(-120, 150, 50)).toEqual({ r: 0, g: 0, b: 255 })
  })
})

describe('通用颜色解析', () => {
  it('解析 rgb() 文本', () => {
    expect(parseColor('rgb(58, 123, 213)')).toEqual({ r: 58, g: 123, b: 213 })
    expect(parseColor('rgba(58,123,213,0.5)')).toEqual({ r: 58, g: 123, b: 213 })
  })

  it('解析 hsl() 文本', () => {
    expect(parseColor('hsl(0, 100%, 50%)')).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('解析 HEX 文本', () => {
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('非法输入返回 null', () => {
    expect(parseColor('not a color')).toBeNull()
    expect(parseColor('')).toBeNull()
  })
})

describe('格式化输出', () => {
  it('formatRgb', () => {
    expect(formatRgb({ r: 1, g: 2, b: 3 })).toBe('rgb(1, 2, 3)')
  })
  it('formatHsl', () => {
    expect(formatHsl({ h: 210, s: 64, l: 53 })).toBe('hsl(210, 64%, 53%)')
  })
})

describe('对比度（WCAG）', () => {
  it('黑白对比度为 21', () => {
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBe(21)
  })
  it('同色对比度为 1', () => {
    expect(contrastRatio({ r: 100, g: 100, b: 100 }, { r: 100, g: 100, b: 100 })).toBe(1)
  })
})

describe('调色板提取', () => {
  it('从纯色块提取主色', () => {
    // 4 个红像素 + 1 个蓝像素 → 红应排第一
    const data = new Uint8ClampedArray([
      255, 0, 0, 255,
      255, 0, 0, 255,
      255, 0, 0, 255,
      255, 0, 0, 255,
      0, 0, 255, 255,
    ])
    const palette = extractPalette(data, 2)
    expect(palette.length).toBe(2)
    expect(palette[0]).toEqual({ r: 255, g: 0, b: 0 })
    expect(palette[1]).toEqual({ r: 0, g: 0, b: 255 })
  })

  it('忽略透明像素', () => {
    const data = new Uint8ClampedArray([
      255, 0, 0, 0, // 全透明，忽略
      0, 255, 0, 255,
    ])
    const palette = extractPalette(data, 4)
    expect(palette).toEqual([{ r: 0, g: 255, b: 0 }])
  })
})

describe('clampByte', () => {
  it('钳制与取整', () => {
    expect(clampByte(-10)).toBe(0)
    expect(clampByte(300)).toBe(255)
    expect(clampByte(127.6)).toBe(128)
    expect(clampByte('abc')).toBe(0)
  })
})
