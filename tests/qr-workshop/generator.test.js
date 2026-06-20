import { describe, expect, it } from 'vitest';
import { normalizeGeneratorOptions } from '../../src/tools/qr-workshop/modules/generator.js';

describe('二维码生成参数', () => {
  it('补齐默认参数并固定 H 级纠错', () => {
    expect(normalizeGeneratorOptions({ text: 'https://example.com' })).toEqual({
      text: 'https://example.com',
      size: 300,
      foregroundColor: '#111111',
      backgroundColor: '#ffffff',
      errorCorrectionLevel: 'H'
    });
  });

  it('拒绝空文本与低对比度颜色', () => {
    expect(() => normalizeGeneratorOptions({ text: '   ' })).toThrow('请输入要生成二维码的内容');
    expect(() =>
      normalizeGeneratorOptions({
        text: 'demo',
        foregroundColor: '#777777',
        backgroundColor: '#777777'
      })
    ).toThrow('二维码前景色和背景色对比度过低');
  });
});
