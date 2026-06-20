import { describe, expect, it } from 'vitest';
import { buildWifiQrText, isWifiQrText, parseWifiQrText } from '../../src/tools/qr-workshop/modules/wifi.js';

describe('WiFi 二维码文本', () => {
  it('按标准格式生成 WPA2 WiFi 字符串，并以双分号结束', () => {
    expect(
      buildWifiQrText({
        ssid: 'MyHome',
        encryption: 'WPA2',
        password: '12345678',
        hidden: false
      })
    ).toBe('WIFI:S:MyHome;T:WPA2;P:12345678;H:false;;');
  });

  it('特殊字符会被反斜杠转义，避免破坏 WiFi 字段边界', () => {
    expect(
      buildWifiQrText({
        ssid: 'Cafe;QR:Room',
        encryption: 'WPA',
        password: 'pa;ss:word\\x',
        hidden: true
      })
    ).toBe('WIFI:S:Cafe\\;QR\\:Room;T:WPA;P:pa\\;ss\\:word\\\\x;H:true;;');
  });

  it('无密码网络使用 nopass 且不输出密码字段', () => {
    expect(
      buildWifiQrText({
        ssid: 'OpenNet',
        encryption: 'nopass',
        password: '',
        hidden: false
      })
    ).toBe('WIFI:S:OpenNet;T:nopass;H:false;;');
  });

  it('可识别并解析 WiFi 二维码字符串', () => {
    const text = 'WIFI:S:MyHome;T:WPA2;P:12345678;H:false;;';

    expect(isWifiQrText(text)).toBe(true);
    expect(parseWifiQrText(text)).toEqual({
      ssid: 'MyHome',
      encryption: 'WPA2',
      password: '12345678',
      hidden: false
    });
  });
});
