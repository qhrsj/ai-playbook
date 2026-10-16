# v6.44 / P66 验证记录

- 基线：本次上传 v6.43 / P65 ZIP 内打开文件与 dist 字节一致；单独上传 HTML 仅增加页尾 Cloudflare 统计脚本，应用主体没有冲突。本版从 ZIP 源码重新构建。
- 根因：旧全屏 `.panel` 的 `min-height:100dvh` 抵消较小窗口高度，拖动读回实际高度后又触发贴顶边界限制。
- 修复：桌面模板外框使用有限最小高度，正文可收缩并内部滚动，去除正文全屏最小高度；标题与关闭按钮独立。模板首次打开纳入共享视口边界校正。手机全屏样式保留。
- 新回归门禁解析生产 CSS 优先级，确认六套主题的桌面高度约束、内部滚动和移动端布局；几何模型使用 CSS 约束先复现旧版缩小无效和贴顶，再检查缩小后移动不改变尺寸、上边缩放固定下沿、滚动位置、最大化还原、短视口初次打开、内容重建及移动端守卫。
- 构建、数据署名、教程开发日志，以及既有帮助浮窗、导航、数量、回收站、导入、拖动、缩放与阅读门禁回归通过。
- 独立 HTML、ZIP 内打开文件与 dist、单独解压交付源码重建结果字节一致。模板与来源数据字节不变。
- 未完成真实浏览器视觉、缩放拖动、滚动和帧率实测：当前环境缺少可运行的 Chromium。CSS 与事件模拟不能替代浏览器测试。

## 本批执行结果

- `python tools/build.py`：通过。
- `python tools/check.py`：通过。
- `python tools/tutorial_sync_gate.py`：通过。
- `python tools/devlog_traceability_gate.py`：通过。
- `python tools/workspace_nav_gate.py`：通过。
- `python tools/luzi_square_audit.py`：通过。
- `python tools/devlog_density_gate.py`：通过。
- `python tools/template_window_layout_gate.py`：通过。
- `node tools/template_window_geometry_gate.js`：通过。
- `node tools/floating_choices_gate.js`：通过。
- `node tools/devlog_layout_gate.js`：通过。
- `node tools/context_help_gate.js`：通过。
- `node tools/home_source_navigation_gate.js`：通过。
- `node tools/scratch_tabs_counts_gate.js`：通过。
- `node tools/scratch_panel_trash_gate.js`：通过。
- `node tools/adjustable_window_gate.js`：通过。
- `node tools/desktop_windows_gate.js`：通过。
- `node tools/context_toolbar_visibility_gate.js`：通过。
- `node tools/maximize_reading_gate.js`：通过。
- `node tools/devlog_runtime_gate.js`：通过。
- `node tools/file_import_gate.js`：通过。
- `node tools/single_search_reading_gate.js`：通过。
- `node tools/navigation_preferences_gate.js`：通过。
- `node tools/window_motion_gate.js`：通过。
- `node tools/top_actions_gate.js`：通过。
