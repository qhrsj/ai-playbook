# v6.42 / P64 验证记录

- 基线：当前上传的独立 HTML、ZIP 内打开文件和源码 dist 字节一致；本版从上传 P63 源码构建。
- 工作区全部 15 个页签说明用途、适用情况、步骤与边界，窗口内当前页帮助使用相同目录。
- 按实际处理器补齐来源、随手记、导入、需求匹配、模板、个人生命周期与高级治理操作；专用门禁枚举源模板中的控件并检查没有退回未配置帮助。
- 按当前状态解释归档/恢复、正文/Diff、收藏和审查阶段；帮助解析没有调用业务计算或存储。
- 模拟帮助点击、未装饰的动态按钮、键盘提交、禁用按钮、滑块与输入拦截、退出并继续和输入聚焦；Esc 退出帮助且不关闭工作窗口。原操作只在明确退出帮助后执行。模拟观察器确认只装饰新增子树，不扫描整页。
- 现有分页、来源署名、删除恢复、导入、窗口移动与最大化、阅读、顶部排序、教程和开发日志门禁通过。
- 独立 HTML 与交付 ZIP 内打开文件、dist 和另行解压源码重建结果字节一致。
- 本环境没有可运行的 Chromium；没有完成真实浏览器的视觉、点击、窄屏滚动与阅读比例回归。模拟及静态检查不能替代这些交互实测。

## 本批执行结果

- `python tools/build.py`：通过。
- `python tools/check.py`：通过。
- `python tools/tutorial_sync_gate.py`：通过。
- `python tools/devlog_traceability_gate.py`：通过。
- `python tools/workspace_nav_gate.py`：通过。
- `python tools/luzi_square_audit.py`：通过。
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
