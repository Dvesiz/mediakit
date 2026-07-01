<div align="center">
  <br>
  <h1>MediaKit</h1>
  <p><strong>纯前端媒体工具箱 · 本地处理 · 隐私安全</strong></p>
  <p>
    <a href="https://dvesiz.github.io/mediakit/" target="_blank">
      <img src="https://img.shields.io/badge/%F0%9F%9A%80-%E5%9C%A8%E7%BA%BF%E4%BD%93%E9%AA%8C-8B5CF6?style=for-the-badge&labelColor=1a1a2e" alt="在线体验">
    </a>
    <a href="#-功能一览">
      <img src="https://img.shields.io/badge/%E5%8A%9F%E8%83%BD-%E4%B8%80%E8%A7%88-06D6A0?style=for-the-badge&labelColor=1a1a2e" alt="功能">
    </a>
    <a href="#-技术栈">
      <img src="https://img.shields.io/badge/%E6%8A%80%E6%9C%AF-%E6%A0%88-EF476F?style=for-the-badge&labelColor=1a1a2e" alt="技术栈">
    </a>
  </p>
  <p>
    <img src="https://img.shields.io/github/package-json/v/Dvesiz/mediakit?color=8B5CF6&label=%E7%89%88%E6%9C%AC" alt="版本">
    <img src="https://img.shields.io/github/actions/workflow/status/Dvesiz/mediakit/deploy.yml?label=%E6%9E%84%E5%BB%BA&color=06D6A0" alt="构建">
    <img src="https://img.shields.io/badge/%E6%B5%8B%E8%AF%95-68%2F68%20%E9%80%9A%E8%BF%87-06D6A0" alt="测试">
    <img src="https://img.shields.io/badge/%E9%9A%90%E7%A7%81-100%25%20%E6%9C%AC%E5%9C%B0-EF476F" alt="隐私">
  </p>
  <br>
</div>

MediaKit 是一款**纯前端、零后端**的媒体工具箱，所有处理均在浏览器本地完成，无需上传文件到服务器，保护你的隐私安全。

---

## ✨ 功能一览

| 工具 | 描述 | 状态 |
|------|------|------|
| 🖼️ **图片压缩** | 拖拽上传，实时预览压缩效果，质量滑块自由调节 | ✅ |
| 🔄 **格式转换** | PNG / JPG / WebP / BMP 互转，保持原图尺寸 | ✅ |
| ✂️ **图片编辑** | 裁剪 / 旋转 / 翻转 / 缩放 / 滤镜，支持撤销重做 | ✅ |
| 🎬 **视频工具** | CRF 压缩 / 缩放 / MP4↔WebM↔GIF 互转 / GIF 裁剪片段 | ✅ |
| 🎵 **音频工具** | MP3 / WAV / OGG / AAC 互转 / 比特率压缩 / 音量调整 | ✅ |
| 📱 **二维码工坊** | 文本 / URL / WiFi / 名片等二维码生成与解码 | ✅ |
| 🎨 **颜色实验室** | 图片取色 / 8 色调色板 / HEX·RGB·HSL 互转 / WCAG 对比度 | ✅ |

> 所有处理**纯浏览器端执行**，文件不上传服务器，隐私零泄露。

## 🚀 在线体验

<p align="center">
  <a href="https://dvesiz.github.io/mediakit/" target="_blank">
    <b>👉 https://dvesiz.github.io/mediakit/</b>
  </a>
</p>

点击即用，无需安装，无需注册。

## 🧰 技术栈

| 技术 | 用途 |
|------|------|
| **Vite** | 构建工具，极速 HMR |
| **Vanilla JS (ESM)** | 核心逻辑，零框架依赖 |
| **FFmpeg.wasm** | 音视频编解码，浏览器内运行 |
| **QRCode.js / jsQR** | 二维码生成与解析 |
| **Canvas API** | 图片压缩 / 编辑 / 滤镜 |
| **CSS 玻璃拟态 + 极光** | 全站 UI 风格 |
| **GitHub Pages** | 静态部署与 CI/CD |
| **Vitest** | 单元测试 |

## 📦 本地开发

```bash
# 克隆仓库
git clone https://github.com/Dvesiz/mediakit.git
cd mediakit

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test

# 构建生产版本
npm run build
```

## 🏗️ 项目结构

```
mediakit/
├── src/
│   ├── common/          # 公共模块（路由/主题/上传/图标/FFmpeg加载等）
│   ├── styles/          # 全局样式（变量/主样式）
│   ├── tools/           # 7 个工具（独立子目录）
│   │   ├── image-compress/
│   │   ├── format-convert/
│   │   ├── image-edit/
│   │   ├── video-tools/
│   │   ├── audio-tools/
│   │   ├── qr-workshop/
│   │   └── color-lab/
│   └── main.js          # 入口文件
├── tests/               # 单元测试
├── public/              # 静态资源
├── index.html           # 入口 HTML
├── vite.config.js       # Vite 配置
└── package.json         # 依赖管理
```

## 🔒 隐私声明

- ✅ **零数据上传** — 所有文件处理完全在浏览器本地完成
- ✅ **无后端服务** — 纯静态网站，无需服务器
- ✅ **无第三方追踪** — 没有分析脚本、Cookie
- ✅ **开源透明** — 代码完全公开，可审计

## 📊 项目状态

| 阶段 | 版本 | 状态 |
|------|------|------|
| 第一阶段：图片工具 + 二维码 | v0.1 | ✅ 已完成 |
| 第二阶段：音视频工具 + 颜色实验室 | v0.2 | 🟡 开发中 |
| 第三阶段：打磨与增强 | v0.3 | 🔲 待办 |

---

<div align="center">
  <sub>Made with ❤️ · 纯前端 · 全本地 · 重隐私</sub>
  <br>
  <a href="https://dvesiz.github.io/mediakit/" target="_blank">🚀 在线体验</a>
</div>
