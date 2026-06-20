import { describe, expect, it } from 'vitest';
import {
  calculateLogoPlacement,
  getContrastRatio,
  hasReadableQrContrast,
  normalizeHexColor
} from '../../src/tools/qr-workshop/utils/canvas.js';

describe('Canvas 与颜色工具', () => {
  it('规范化三位与六位十六进制颜色', () => {
    expect(normalizeHexColor('#000')).toBe('#000000');
    expect(normalizeHexColor('fff')).toBe('#ffffff');
  });

  it('计算黑白颜色的最高对比度', () => {
    expect(getContrastRatio('#000000', '#ffffff')).toBe(21);
  });

  it('拒绝过低对比度的二维码配色', () => {
    expect(hasReadableQrContrast('#777777', '#777777')).toBe(false);
    expect(hasReadableQrContrast('#000000', '#ffffff')).toBe(true);
  });

  it('Logo 默认居中，占二维码宽度 18%', () => {
    expect(calculateLogoPlacement(500)).toEqual({
      size: 90,
      x: 205,
      y: 205,
      padding: 12
    });
  });
});
