import QRCode from 'qrcode';
import {
  canvasToPngDataUrl,
  drawLogoAtCenter,
  hasReadableQrContrast,
  normalizeHexColor
} from '../utils/canvas.js';

export function normalizeGeneratorOptions(options) {
  const text = String(options?.text ?? '').trim();
  const size = Number(options?.size || 300);
  const foregroundColor = normalizeHexColor(options?.foregroundColor || '#111111');
  const backgroundColor = normalizeHexColor(options?.backgroundColor || '#ffffff');

  if (!text) {
    throw new Error('请输入要生成二维码的内容');
  }

  if (!Number.isFinite(size) || size < 160 || size > 1000) {
    throw new Error('二维码尺寸需在 160 到 1000 像素之间');
  }

  if (!hasReadableQrContrast(foregroundColor, backgroundColor)) {
    throw new Error('二维码前景色和背景色对比度过低');
  }

  return {
    text,
    size,
    foregroundColor,
    backgroundColor,
    errorCorrectionLevel: 'H'
  };
}

export async function generateQrCanvas(options) {
  const normalizedOptions = normalizeGeneratorOptions(options);
  const canvas = document.createElement('canvas');

  await QRCode.toCanvas(canvas, normalizedOptions.text, {
    width: normalizedOptions.size,
    margin: 2,
    errorCorrectionLevel: normalizedOptions.errorCorrectionLevel,
    color: {
      dark: normalizedOptions.foregroundColor,
      light: normalizedOptions.backgroundColor
    }
  });

  if (options?.logoImage) {
    drawLogoAtCenter(canvas, options.logoImage);
  }

  return canvas;
}

export async function generateQrDataUrl(options) {
  const canvas = await generateQrCanvas(options);
  return canvasToPngDataUrl(canvas);
}

export function downloadCanvasPng(canvas, filename = 'qr-code.png') {
  const link = document.createElement('a');
  link.href = canvasToPngDataUrl(canvas);
  link.download = filename;
  link.click();
}
