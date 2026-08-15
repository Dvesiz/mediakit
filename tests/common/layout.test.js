import { describe, expect, it } from 'vitest'
import { getNavigationTools } from '../../src/common/layout.js'
import { getPreferredTheme } from '../../src/common/theme.js'

describe('工作台导航', () => {
  it('保留首页和全部七个工具入口', () => {
    expect(getNavigationTools().map(({ id }) => id)).toEqual([
      null,
      'image-compress',
      'format-convert',
      'image-edit',
      'video-tools',
      'audio-tools',
      'qr-workshop',
      'color-lab',
    ])
  })
})

describe('工作台主题', () => {
  it('首次访问默认使用深色工作台', () => {
    globalThis.localStorage = { getItem: () => null }
    globalThis.window = { matchMedia: () => ({ matches: true }) }
    expect(getPreferredTheme()).toBe('light')
  })
})
