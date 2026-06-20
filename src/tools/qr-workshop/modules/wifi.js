const VALID_ENCRYPTION_TYPES = new Set(['WPA', 'WPA2', 'WPA3', 'WEP', 'nopass']);
const ESCAPED_CHARACTERS = /([\\;,:"'])/g;

export function escapeWifiValue(value) {
  return String(value ?? '').replace(ESCAPED_CHARACTERS, '\\$1');
}

function unescapeWifiValue(value) {
  let result = '';
  let escaping = false;

  for (const character of value) {
    if (escaping) {
      result += character;
      escaping = false;
      continue;
    }

    if (character === '\\') {
      escaping = true;
      continue;
    }

    result += character;
  }

  return result;
}

function splitWifiFields(payload) {
  const fields = [];
  let current = '';
  let escaping = false;

  for (const character of payload) {
    if (escaping) {
      current += `\\${character}`;
      escaping = false;
      continue;
    }

    if (character === '\\') {
      escaping = true;
      continue;
    }

    if (character === ';') {
      fields.push(current);
      current = '';
      continue;
    }

    current += character;
  }

  if (current) {
    fields.push(current);
  }

  return fields.filter(Boolean);
}

export function buildWifiQrText({ ssid, encryption, password, hidden = false }) {
  const normalizedSsid = String(ssid ?? '').trim();
  const normalizedEncryption = encryption || 'WPA2';

  if (!normalizedSsid) {
    throw new Error('请输入 WiFi 名称');
  }

  if (!VALID_ENCRYPTION_TYPES.has(normalizedEncryption)) {
    throw new Error('不支持的 WiFi 加密类型');
  }

  if (normalizedEncryption !== 'nopass' && !String(password ?? '')) {
    throw new Error('加密 WiFi 需要填写密码');
  }

  const fields = [
    `S:${escapeWifiValue(normalizedSsid)}`,
    `T:${normalizedEncryption}`
  ];

  if (normalizedEncryption !== 'nopass') {
    fields.push(`P:${escapeWifiValue(password)}`);
  }

  fields.push(`H:${hidden ? 'true' : 'false'}`);

  return `WIFI:${fields.join(';')};;`;
}

export function isWifiQrText(text) {
  return /^WIFI:.+;;$/i.test(String(text ?? '').trim());
}

export function parseWifiQrText(text) {
  const value = String(text ?? '').trim();

  if (!isWifiQrText(value)) {
    return null;
  }

  const payload = value.slice(5, -2);
  const entries = splitWifiFields(payload);
  const fields = new Map();

  for (const entry of entries) {
    const separatorIndex = entry.indexOf(':');
    if (separatorIndex > -1) {
      fields.set(entry.slice(0, separatorIndex), unescapeWifiValue(entry.slice(separatorIndex + 1)));
    }
  }

  return {
    ssid: fields.get('S') || '',
    encryption: fields.get('T') || 'nopass',
    password: fields.get('P') || '',
    hidden: fields.get('H') === 'true'
  };
}
