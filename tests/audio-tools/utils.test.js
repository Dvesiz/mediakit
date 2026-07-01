import { describe, expect, it } from 'vitest'
import { buildAudioArgs, deriveOutputName, safeInputName, estimateTargetAudioBitrateKbps } from '../../src/tools/audio-tools/utils.js'

describe('buildAudioArgs', () => {
  it('mp3（有损）默认参数包含比特率，不含音量滤镜', () => {
    const args = buildAudioArgs({ inputName: 'input.wav', outputName: 'output.mp3', format: 'mp3' })
    expect(args).toEqual(['-i', 'input.wav', '-c:a', 'libmp3lame', '-b:a', '128k', 'output.mp3'])
  })

  it('wav（无损）不包含比特率参数', () => {
    const args = buildAudioArgs({ inputName: 'input.mp3', outputName: 'output.wav', format: 'wav', bitrate: 256 })
    expect(args).toEqual(['-i', 'input.mp3', '-c:a', 'pcm_s16le', 'output.wav'])
  })

  it('ogg 使用 libvorbis 编码', () => {
    const args = buildAudioArgs({ inputName: 'a.mp3', outputName: 'b.ogg', format: 'ogg', bitrate: 192 })
    expect(args).toContain('libvorbis')
    expect(args).toContain('192k')
  })

  it('aac 使用 aac 编码', () => {
    const args = buildAudioArgs({ inputName: 'a.mp3', outputName: 'b.m4a', format: 'aac' })
    expect(args).toContain('aac')
  })

  it('音量非100时附加 -af volume 滤镜', () => {
    const args = buildAudioArgs({ inputName: 'a.mp3', outputName: 'b.mp3', format: 'mp3', volume: 150 })
    const afIndex = args.indexOf('-af')
    expect(afIndex).toBeGreaterThan(-1)
    expect(args[afIndex + 1]).toBe('volume=1.50')
  })

  it('音量为100时不附加 -af 滤镜', () => {
    const args = buildAudioArgs({ inputName: 'a.mp3', outputName: 'b.mp3', format: 'mp3', volume: 100 })
    expect(args).not.toContain('-af')
  })

  it('音量为0时（静音）仍附加滤镜', () => {
    const args = buildAudioArgs({ inputName: 'a.mp3', outputName: 'b.mp3', format: 'mp3', volume: 0 })
    const afIndex = args.indexOf('-af')
    expect(args[afIndex + 1]).toBe('volume=0.00')
  })
})

describe('estimateTargetAudioBitrateKbps', () => {
  it('根据目标大小和时长换算码率', () => {
    expect(estimateTargetAudioBitrateKbps(5, 60)).toBe(682)
  })

  it('结果低于下限时返回最低值 32', () => {
    expect(estimateTargetAudioBitrateKbps(1, 1000)).toBe(32)
  })

  it('时长非正数时返回 32', () => {
    expect(estimateTargetAudioBitrateKbps(5, 0)).toBe(32)
    expect(estimateTargetAudioBitrateKbps(5, -1)).toBe(32)
  })
})

describe('deriveOutputName', () => {
  it('替换扩展名并附加后缀', () => {
    expect(deriveOutputName('song.wav', 'mp3')).toBe('song_converted.mp3')
  })

  it('无扩展名时也能正确处理', () => {
    expect(deriveOutputName('song', 'ogg')).toBe('song_converted.ogg')
  })
})

describe('safeInputName', () => {
  it('保留扩展名，替换主文件名', () => {
    expect(safeInputName('我的音频 (1).wav')).toBe('input.wav')
  })

  it('无扩展名时返回不带扩展名的安全名', () => {
    expect(safeInputName('song')).toBe('input')
  })
})
