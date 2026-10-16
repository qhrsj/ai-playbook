# v6.37 / P59 · 随手记面板回收站与源码核对

2026-10-08

## 变更

- 随手记面板中，已保存记录下方新增可展开回收站，显示条数、正文和删除时间；可在面板内恢复或经确认永久删除。
- 面板和工作区删除随手记统一使用现有 `pb_scratch_trash_v66` 数据。先保存回收站再移出原列表；写入失败则保留原记录。恢复先保存回原列表再移出回收站；当前草稿不受影响。
- 首次随手记列表渲染延至脚本初始化完成后，避免在工作区回收站常量初始化前读取它。
- 页面教程、教程覆盖清单、结构化开发日志、README、CHANGELOG、DEVELOPMENT 与 Release Manifest 同步 v6.37 / P59。

## 上传文件一致性

- 原 ZIP 内 `打开这个-v6.36-P58.html` 与其源码工程的 `dist/index.html` SHA-256 相同：`2ca9e41e2515ef388545e9a6f80250be8935574c1cec2090c0c7903f788f4bda`。
- 单独上传的 `AI-Playbook-v6.36-P58-NEW.html` SHA-256 为 `edc25e81d5ea283670c31a789bcfbcd64f1751282e4d835a8ff239b6ecc5c321`。逐行比较只有文件末尾多一段 Cloudflare beacon 外部统计脚本；删除该行后与 ZIP 版逐字节相同。应用源码和功能没有冲突。新版以 ZIP 内源码为唯一构建来源，不带该外部脚本。

## 验证

- `python tools/build.py`、`python tools/check.py`：通过，79 张卡、六主题、24/24 旧表来源、Node 语法检查。
- `node tools/scratch_panel_trash_gate.js`：通过，共用回收站删除→恢复、永久删除确认、存储失败保护与启动时机。
- `python tools/tutorial_sync_gate.py`、`python tools/devlog_traceability_gate.py`：通过，P0–P59 与 v6.37 一致。
- `python tools/workspace_nav_gate.py`、`node tools/adjustable_window_gate.js`、`node tools/workspace_card_width_gate.js`：通过。
- `python tools/luzi_square_audit.py`、`python tools/curation_v628_gate.py`：通过，1,350 条正文署名核对，79 张首页卡与来源回链。
- 当前环境没有可启动的 Playwright Chromium，无法做真实浏览器的点击与视觉回归；`tools/scratch_trash_flow.py` 的浏览器测试已同步永久删除确认步骤，待浏览器环境运行。
