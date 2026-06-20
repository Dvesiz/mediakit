/**
 * 音频工具 - 占位（第二阶段开发）
 */
import { ICONS } from '../../common/icons.js'

export function render(container) {
  container.innerHTML = `
    <div class="tool-header">
      <h2>${ICONS.audio} 音频工具</h2>
      <p>音频编辑、裁剪、格式转换（开发中）</p>
    </div>
    <div class="tool-body tool-placeholder">
      <p>即将上线，敬请期待</p>
    </div>
  `
  return () => {}
}
