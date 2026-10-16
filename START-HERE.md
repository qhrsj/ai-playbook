# AI Playbook v6.61 / P83

关闭旧版页面，打开 `OPEN-v6.61-P83.html`。升级不会自动清空个人资料，显示偏好与按钮顺序沿用原工作区。教程改为三层导引：先点顶部「使用教程」打开**操作地图**，一页看懂 4 条核心流程和每个按钮的名字；每条流程都可以「跟导览看一遍」（在真实界面上逐个认识控件，点「下一步」推进，导览期间写操作被拦、滚动阅读不受限），或直接「亲手练」（进入隔离沙箱跟着高亮指引亲手操作，系统自动核对，做错给线索，卡住点「提示」）。共 32 门练习课、130 个操作环节；进入中途的小课时会自动先完成前置准备，你只练本课的动作。自动播放视频已整体退役：没有播放条、倍速和观看进度，节奏完全由你掌握。首次打开会出现欢迎卡：三句话讲清产品是什么，主按钮直达第一个真实任务（搜索 → 打开卡片 → 填材料 → 复制）；看完或跳过都不会再打扰，并且随完整备份携带。备份与恢复：在工作区点辅助入口。备份区下载当前完整副本；恢复区选择文件后立即显示读取状态、文件名、时间和当前／备份数量对照，核对后确认才替换。正式备份恢复仍通过真实文件选择器和明确确认执行。当前手册：`SOURCE/TUTORIAL-v6.61.md`。新增、删减功能或调整界面必须同步课程、操作地图、导览剧本、帮助、Coverage、版本和六个日志视图。

## 交付件与部署件

三处 HTML 有两种形态，只有一种允许的差异：

- 交付件（构建产物 / 包内）：`SOURCE/dist/index.html` 与 `OPEN-v6.61-P83.html`，两者必须**严格字节一致**，均**不含**任何外部统计脚本。
- 部署件（根目录）：`AI-Playbook-v6.61-P83.html` = 交付件 **+ 页尾一段 Cloudflare 统计脚本**（`static.cloudflareinsights.com/beacon.min.js`）。**这是有意差异，不是缺陷**；剔除该脚本后必须与交付件逐字节一致。

**禁止**用 `dist/index.html` 直接覆盖根目录部署件（会静默删掉统计脚本，破坏部署）。重建后：`dist` → `OPEN` 严格复制；根目录**只核对、不覆盖**。核对命令见下方 `python3 tools/checksum_verify.py`。

进入 SOURCE 运行（v6.61 起 13 条门禁；video/camera 三份随播放模式退役）：

```sh
python3 tools/build_combo_tutorial.py
python3 tools/build.py
python3 tools/check.py
node tools/combo_sync_gate.cjs
node tools/devlog_sync_gate.cjs
node tools/tutorial_coverage_gate.cjs
node tools/local_personal_gate.cjs
node tools/player_backup_gate.cjs
node tools/player_layout_gate.cjs
node tools/combo_action_gate.cjs
node tools/surface_training_gate.cjs
node tools/layout_tutorial_gate.cjs
node tools/tutorial_interaction_gate.cjs
node tools/navigation_motion_gate.cjs
python3 tools/checksum_verify.py
BROWSER_EXE="<chrome 路径>" node tools/browser_playback_diag.cjs
```

说明：`node tools/devlog_sync_gate.cjs` 校验六个开发日志视图与当前 phase 同步；`node tools/tutorial_coverage_gate.cjs` 校验课程目录 ↔ 教程手册 ↔ Coverage 表三方一致；`node tools/combo_sync_gate.cjs` 同时断言 chainMap 动作子序列无缝覆盖、map.flows/tours 数据与 29 个迁移导览点；`BROWSER_EXE=... node tools/browser_playback_diag.cjs` 在真实 Chrome 中逐课完成 32 门 guided 课程并冒烟 5 个导览剧本与欢迎一次性；`python3 tools/checksum_verify.py` 校验「`dist` ≡ `OPEN`」且「根目录部署件剔 Cloudflare 统计脚本后 ≡ `dist`」。

验证记录见 `SOURCE/reports/browser-playback-diag-results.json` 及本版 JSON 报告。检查覆盖生产处理器、DOM 协议、样式和几何、存储兼容／故障、ZIP 完整性和独立重建；真实触屏和设备性能未实测。
