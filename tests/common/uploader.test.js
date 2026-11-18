import { describe, expect, it } from 'vitest'
import { selectFiles } from '../../src/common/uploader.js'

const file = (name, type, size = 1) => ({ name, type, size })

function select(files, options) {
  const errors = []
  const accepted = selectFiles(files, { ...options, onError: message => errors.push(message) })
  return { accepted, errors }
}

describe('file selection', () => {
  it('matches exact MIME types, wildcard MIME types, and case-insensitive extensions', () => {
    const files = [file('line.png', 'image/png'), file('clip.mp4', 'video/mp4'), file('cover.JPG', '')]
    expect(select(files, { accept: 'image/png, video/*, .jpg', multiple: true })).toEqual({ accepted: files, errors: [] })
  })

  it('filters unsupported and oversized files without discarding valid files', () => {
    const valid = file('ok.png', 'image/png', 10)
    const invalid = [file('notes.txt', 'text/plain'), file('big.png', 'image/png', 11)]
    const result = select([...invalid, valid], { accept: 'image/png', maxSize: 10, multiple: true })
    expect(result.accepted).toEqual([valid])
    expect(result.errors).toEqual(['不支持的文件格式', '文件超过大小限制（10 B）'])
  })

  it('rejects a batch for a single-file tool rather than silently choosing a file', () => {
    const files = [file('a.png', 'image/png'), file('b.png', 'image/png')]
    expect(select(files, { multiple: false })).toEqual({ accepted: [], errors: ['一次只能选择一个文件'] })
  })

  it('accepts any format by default', () => {
    const files = [file('untitled', '')]
    expect(select(files, {})).toEqual({ accepted: files, errors: [] })
  })
})
