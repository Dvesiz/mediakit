import { describe, expect, it } from 'vitest'
import { buildVideoArgs, deriveOutputName, safeInputName, estimateTargetVideoBitrateKbps } from '../../src/tools/video-tools/utils.js'

describe('buildVideoArgs', () => {
  it('mp4 输出使用 h264 + crf + faststart', () => {
    const args = buildVideoArgs({ inputName: 'input.mov', outputName: 'output.mp4', format: 'mp4', crf: 24 })
    expect(args).toEqual([
      '-i', 'input.mov',
      '-c:v', 'libx264', '-crf', '24', '-preset', 'fast',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      '-c:a', 'aac',
      'output.mp4',
    ])
  })

  it('webm 输出使用 vp9 + opus', () => {
    const args = buildVideoArgs({ inputName: 'input.mp4', outputName: 'output.webm', format: 'webm', crf: 30 })
    expect(args).toContain('libvpx-vp9')
    expect(args).toContain('libopus')
    expect(args).toContain('-b:v')
  })

  it('缩放宽度 > 0 时插入 scale 滤镜', () => {
    const args = buildVideoArgs({ inputName: 'a.mp4', outputName: 'b.mp4', format: 'mp4', scaleWidth: 640 })
    const vfIndex = args.indexOf('-vf')
    expect(vfIndex).toBeGreaterThan(-1)
    expect(args[vfIndex + 1]).toBe('scale=640:-2')
  })

  it('gif 输出附带 fps 滤镜与循环参数', () => {
    const args = buildVideoArgs({ inputName: 'a.mp4', outputName: 'b.gif', format: 'gif', fps: 15, scaleWidth: 480 })
    expect(args).toEqual([
      '-i', 'a.mp4',
      '-vf', 'scale=480:-2,fps=15',
      '-loop', '0',
      'b.gif',
    ])
  })

  it('gif 未指定缩放时仅包含 fps 滤镜', () => {
    const args = buildVideoArgs({ inputName: 'a.mp4', outputName: 'b.gif', format: 'gif', fps: 12 })
    const vfIndex = args.indexOf('-vf')
    expect(args[vfIndex + 1]).toBe('fps=12')
  })

  it('指定 startSec 时在 -i 之前插入 -ss', () => {
    const args = buildVideoArgs({ inputName: 'a.mp4', outputName: 'b.gif', format: 'gif', fps: 12, startSec: 5 })
    expect(args.slice(0, 4)).toEqual(['-ss', '5', '-i', 'a.mp4'])
  })

  it('指定 durationSec 时在 -i 之后插入 -t', () => {
    const args = buildVideoArgs({ inputName: 'a.mp4', outputName: 'b.gif', format: 'gif', fps: 12, startSec: 5, durationSec: 3 })
    expect(args).toEqual([
      '-ss', '5', '-i', 'a.mp4', '-t', '3',
      '-vf', 'fps=12',
      '-loop', '0',
      'b.gif',
    ])
  })

  it('未指定 startSec/durationSec 时不受影响', () => {
    const args = buildVideoArgs({ inputName: 'a.mp4', outputName: 'b.gif', format: 'gif', fps: 12 })
    expect(args[0]).toBe('-i')
    expect(args).not.toContain('-ss')
    expect(args).not.toContain('-t')
  })
})

describe('estimateTargetVideoBitrateKbps', () => {
  it('根据目标大小和时长换算码率，并预留音频码率', () => {
    expect(estimateTargetVideoBitrateKbps(10, 60)).toBe(1237)
  })

  it('结果低于下限时返回最低值 150', () => {
    expect(estimateTargetVideoBitrateKbps(1, 1000)).toBe(150)
  })

  it('时长非正数时返回 150', () => {
    expect(estimateTargetVideoBitrateKbps(10, 0)).toBe(150)
    expect(estimateTargetVideoBitrateKbps(10, -5)).toBe(150)
  })
})

describe('buildVideoArgs 目标码率分支', () => {
  it('提供 targetBitrateKbps 时使用码率控制，不含 -crf', () => {
    const args = buildVideoArgs({ inputName: 'a.mp4', outputName: 'b.mp4', format: 'mp4', targetBitrateKbps: 1500 })
    expect(args).toEqual([
      '-i', 'a.mp4',
      '-c:v', 'libx264', '-b:v', '1500k', '-maxrate', '1500k', '-bufsize', '3000k', '-preset', 'fast',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      '-c:a', 'aac',
      'b.mp4',
    ])
    expect(args).not.toContain('-crf')
  })

  it('webm 格式提供 targetBitrateKbps 时不重复追加 -b:v 0', () => {
    const args = buildVideoArgs({ inputName: 'a.mp4', outputName: 'b.webm', format: 'webm', targetBitrateKbps: 800 })
    expect(args).toContain('-maxrate')
    expect(args.filter((a) => a === '-b:v')).toHaveLength(1)
    expect(args).not.toContain('-crf')
  })
})

describe('deriveOutputName', () => {
  it('替换扩展名并附加后缀', () => {
    expect(deriveOutputName('movie.mov', 'mp4')).toBe('movie_converted.mp4')
  })

  it('无扩展名时也能正确处理', () => {
    expect(deriveOutputName('movie', 'gif')).toBe('movie_converted.gif')
  })
})

describe('safeInputName', () => {
  it('保留扩展名，替换主文件名', () => {
    expect(safeInputName('我的视频 (1).mov')).toBe('input.mov')
  })

  it('无扩展名时返回不带扩展名的安全名', () => {
    expect(safeInputName('movie')).toBe('input')
  })
})
