# v6.43 / P65 验证记录

- 基线为当前上传 v6.42 / P64 ZIP 源码；包内打开文件与源码 dist 字节一致，单独上传的 HTML 仅多页尾 Cloudflare 统计脚本，应用主体相同。
- 帮助、主题、场景配色标题支持桌面拖动，复用按帧合并的共享控制器；正文和按钮不触发拖动，自然高度不锁死。模拟连续移动、最终坐标、边界、取消、丢失捕获、Alt 方向键、手动位置保留、窗口层级和移动端守卫。
- CSS 级联检查验证日志的 white-space 为 normal，来源原文仍为 pre-wrap。实际日志渲染检查标题内日期、空日期、长标题和字符转义、当前阶段六视图、头部日期与发布清单同步。此检查不等同真实浏览器测量。
- 构建、数据署名、教程日志门禁，以及现有帮助、导航、导入、数量开关、回收站、窗口尺寸与最大化回归通过。
- 独立 HTML、ZIP 内打开文件、dist 和另行解压源码重新构建结果字节一致；模板与来源数据字节保持原样。
- 本环境缺少可运行的 Chromium；真实浏览器视觉、拖动帧率、阅读比例和窄屏操作尚未实测。

## 本批执行结果

- `python tools/build.py`：通过。
- `python tools/check.py`：通过。
- `python tools/tutorial_sync_gate.py`：通过。
- `python tools/devlog_traceability_gate.py`：通过。
- `python tools/workspace_nav_gate.py`：通过。
- `python tools/luzi_square_audit.py`：通过。
- `python tools/devlog_density_gate.py`：通过。
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
