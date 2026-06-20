/**
 * 颜色实验室 - 占位（第二阶段开发）
 */
import { ICONS } from '../../common/icons.js'

export function render(container) {
  container.innerHTML = `
    <div class="tool-header">
      <h2>${ICONS.color} 颜色实验室</h2>
      <p>取色器、调色板、颜色转换（开发中）</p>
    </div>
    <div class="tool-body tool-placeholder">
      <p>即将上线，敬请期待</p>
    </div>
  `
  return () => {}
}
