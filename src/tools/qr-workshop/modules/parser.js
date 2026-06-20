import jsQR from 'jsqr';
import { loadImageFromFile } from '../utils/canvas.js';
import { isWifiQrText, parseWifiQrText } from './wifi.js';

export function decodeQrFromImage(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('当前浏览器不支持 Canvas 2D 绘制');
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth'
  });

  if (!result) {
    return null;
  }

  return {
    text: result.data,
    wifi: isWifiQrText(result.data) ? parseWifiQrText(result.data) : null
  };
}

export async function decodeQrFromFile(file) {
  const image = await loadImageFromFile(file);
  return decodeQrFromImage(image);
}
