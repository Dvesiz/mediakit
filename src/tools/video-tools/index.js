/**
 * 视频工具 - 占位（第二阶段开发）
 */
export function render(container) {
  container.innerHTML = `
    <div class="tool-header">
      <h2>🎬 视频工具</h2>
      <p>功能开发中，敬请期待...</p>
    </div>
    <div class="tool-body" style="display:flex;align-items:center;justify-content:center;min-height:300px;color:var(--color-text-muted);font-size:var(--font-size-lg)">
      <p>⏳ 视频压缩、转 GIF、格式转换等功能将在第二阶段上线</p>
    </div>
  `
  return () => {}
}
