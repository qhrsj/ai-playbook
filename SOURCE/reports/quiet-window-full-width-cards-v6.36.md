# v6.36 / P58 · 简洁缩放边框与工作区卡片全宽正文

日期：2026-10-08。参考用户提供的工作区截图。

## 问题与修复

- P57 的八个缩放手柄有常驻背景与横条、竖条、四角符号。此次保留八方向拖动和键盘调整，但让四边的 6px、四角的 14px 命中区默认透明；悬停或键盘聚焦才显示细微高亮。标题仍略微分色并显示抓取光标，去掉点状抓取标识。
- 工作区卡片原先将标题、正文、标签放在左侧同一个网格子项，按钮列因此占据整张卡片的高度。日常卡片现在把标题与按钮放在第一行，正文和标签跨两列。手机宽度下按钮单独换行，正文仍占整卡宽度。
- 没有修改卡片数据、按钮事件、来源署名或八方向缩放计算。教程、结构化日志与版本清单同步 v6.36 / P58。

## 验证

| 检查 | 结果 |
|---|---|
| 八方向拖动、键盘、最小尺寸、视口边界、手机禁用、动态来源重建 | PASS（Node 模拟） |
| 手柄默认透明、无常驻伪元素标识，标题分色减弱 | PASS（样式规则检查） |
| 工作区日常卡片按钮在标题行、正文和标签横跨整卡、移动布局独立按钮行 | PASS（结构与样式规则检查） |
| 构建、JS 语法、79 张母模板、6 个主题 | PASS |
| 1,350 条来源署名、首页与工作区导航、教程与 P0–P58 日志 | PASS |

执行：`node tools/adjustable_window_gate.js && node tools/workspace_card_width_gate.js && python tools/build.py && python tools/check.py && node tools/context_toolbar_visibility_gate.js && node tools/home_source_navigation_gate.js && python tools/luzi_square_audit.py && python tools/curation_v628_gate.py && python tools/workspace_nav_gate.py && python tools/tutorial_sync_gate.py && python tools/devlog_traceability_gate.py`。

当前运行环境没有可运行的浏览器二进制；以上是构建、数据、结构和模拟交互验证，尚未执行真实浏览器的视觉与手动拖动回归。
