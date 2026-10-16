# v6.38 / P60 · 数量显示与随手记列表

2026-10-08

## 基线

- 本轮单独上传的 v6.37 HTML、ZIP 内的打开文件和 `dist/index.html` SHA-256 相同，均为 `a20270470b867d30a3b4664c92c33702fc30c5d2e34e0ea20c6bbef9958d9a96`。新版以 ZIP 内源码构建。

## 改动

- 顶部随手记和我的工作区统一为同尺寸、同配色的右上角数字角标；无记录时隐藏，超过 99 显示 `99+`。两处窗口各设「隐藏数量／显示数量」，共用一份 `WorkspaceStore.preferences.countsVisible` 偏好；工作区备份包含该设置，旧备份默认显示。
- 随手记的「已保存／回收站」共用一个列表位置，一次只显示一个面板。支持点击以及左右方向键、Home/End 切换；删除成功后切到回收站，恢复后切回已保存。删除、恢复、永久删除的数据保护沿用 v6.37。
- 教程步骤、Coverage、结构化开发日志、README、CHANGELOG、DEVELOPMENT 和 Release Manifest 同步 v6.38 / P60。

## 验证

- `python tools/build.py`、`python tools/check.py`：通过，79 张母模板、六主题及 JavaScript 语法。
- `node tools/scratch_tabs_counts_gate.js`：通过，零条、1 条、99 条、100 条、隐藏／恢复显示、同步偏好、选项卡互斥与焦点状态。
- `node tools/scratch_panel_trash_gate.js`：通过，共用删除、恢复、永久删除确认、写入失败保护与启动顺序。
- 教程、日志、导航、弹窗缩放、工作区卡片宽度门禁均通过。
- 广场 1,350 条来源与署名、24 条旧来源关联和 79 张首页策展校验通过。
- 当前环境缺少可启动的浏览器，未执行实际浏览器的拖动、窄屏视觉及点击回归。
