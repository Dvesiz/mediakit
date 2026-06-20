const HEX_COLOR_PATTERN = /^#?([a-f\d]{3}|[a-f\d]{6})$/i;

export function normalizeHexColor(color) {
  const value = String(color || '').trim();
  const match = value.match(HEX_COLOR_PATTERN);

  if (!match) {
    throw new Error('颜色必须是 #RGB 或 #RRGGBB 格式');
  }

  const hex = match[1].toLowerCase();
  const normalized = hex.length === 3
    ? hex.split('').map((character) => character + character).join('')
    : hex;

  return `#${normalized}`;
}

function hexToRgb(color) {
  const normalized = normalizeHexColor(color).slice(1);

  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16)
  };
}

function channelToLinear(value) {
  const normalized = value / 255;

  if (normalized <= 0.03928) {
    return normalized / 12.92;
  }

  return ((normalized + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminance(color) {
  const { red, green, blue } = hexToRgb(color);

  return 0.2126 * channelToLinear(red)
    + 0.7152 * channelToLinear(green)
    + 0.0722 * channelToLinear(blue);
}

export function getContrastRatio(firstColor, secondColor) {
  const first = getRelativeLuminance(firstColor);
  const second = getRelativeLuminance(secondColor);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);

  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function hasReadableQrContrast(foregroundColor, backgroundColor) {
  return getContrastRatio(foregroundColor, backgroundColor) >= 4.5;
}

export function calculateLogoPlacement(canvasSize, ratio = 0.18) {
  const size = Math.round(canvasSize * ratio);
  const coordinate = Math.round((canvasSize - size) / 2);
  const padding = Math.max(8, Math.round(size * 0.13));

  return {
    size,
    x: coordinate,
    y: coordinate,
    padding
  };
}

export function drawLogoAtCenter(canvas, logoImage, ratio = 0.18) {
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('当前浏览器不支持 Canvas 2D 绘制');
  }

  const placement = calculateLogoPlacement(canvas.width, ratio);
  const center = canvas.width / 2;
  const backgroundRadius = placement.size / 2 + placement.padding;

  context.save();
  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(center, center, backgroundRadius, 0, Math.PI * 2);
  context.fill();
  context.clip();
  context.drawImage(logoImage, placement.x, placement.y, placement.size, placement.size);
  context.restore();

  return placement;
}

export function canvasToPngDataUrl(canvas) {
  return canvas.toDataURL('image/png');
}

export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('请上传 PNG、JPG、WebP 等图片文件'));
      return;
    }

    const reader = new FileReader();

    reader.addEventListener('error', () => reject(new Error('图片读取失败')));
    reader.addEventListener('load', () => {
      const image = new Image();
      image.addEventListener('error', () => reject(new Error('图片加载失败')));
      image.addEventListener('load', () => resolve(image));
      image.src = String(reader.result);
    });

    reader.readAsDataURL(file);
  });
}
