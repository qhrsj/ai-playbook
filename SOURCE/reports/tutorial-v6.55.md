# v6.55 / P77 验证记录 · 使用教程人性化重构

交付日：2026-10-14　｜　版本：v6.55 / P77（基线 v6.54 / P76）
范围：应用内交互课程 + 教程手册 `TUTORIAL-v6.55.md`；帮助按需联动。**不重排课程结构：9 门课 / 159 环节（130 操作 + 29 观察）。**

## 产物

| 产物 | 字节数 | 说明 |
|---|---|---|
| `SOURCE/dist/index.html` | 8,432,147 | 构建产物，无 CRLF，sha256 `be33acd24bb12a2604ac3b25fddbf5f2616e504482ceeaa9ca77f8a00e89d12b` |
| `OPEN-v6.55-P77.html` | 8,432,147 | 与 dist **严格字节一致** |
| `AI-Playbook-v6.55-P77.html` | 8,432,514 | = dist + 367 字节 Cloudflare beacon（剔除 beacon 后 ≡ dist） |
| `SOURCE/TUTORIAL-v6.55.md` | 36,432 | CRLF = 0（497 lone LF） |

## 数据与结构

- `combo-training.json`：`version 6.55 / phase P77`；9×`overview` 六键全部重写为第二人称；159×`why`/`success` 重写；新增课程顶层 `hook`/`completionNote`；顶层 `sourceNote` 改写措辞。
- 结构不变：`id/type/target/check/instruction` 与 `sample/prompt` 未改；**159 条 `instruction` 与 v6.54 手册逐字一致（脚本比对通过）**。
- 质量约束（脚本自检通过）：`why` 全部 ≤50 字 / ≤2 句 / 否定词 ≤1；`success` 同课内唯一、全局同一字符串复用 ≤2；`hook` ≤30 字、`completionNote` ≤40 字。

## 引导机制落点

- 开场动机 `hook`：简报页新增 `#comboBriefHook`，六键细节折叠进 `<details class="combo-brief-details">`（默认折叠，元素 id 与 textContent 不变）。
- 即时暖反馈：`24-combo-training.js` 通过一步时右侧显示 `step.success`（替换硬编码通用串）。
- 完成庆祝：`comboComplete` 使用 `completionNote`（视频模式仍保留子串 `视频教程已完成`）。
- 按需提示：`#comboHint` 由「仅独立挑战」放宽到「拆招带练 + 独立挑战」；练习工具去掉常驻 `hidden`，改由 JS 在视频模式隐藏。
- 去指责化：失败与中途停止提示改为不指责、给下一步（guided 错输入仍保留子串 `输入未达到`）。
- 手册：`build_combo_tutorial.py` 修复 `write_text` 未指定编码/换行（CRLF→LF）并重写散文段。

## 门禁结果（全部退出码 0）

`build_combo_tutorial.py` · `build.py` · `check.py` · `combo_sync_gate.cjs`(DEVLOG_TIMELINE=78) · `devlog_sync_gate.cjs`(6.55/P77) · `tutorial_coverage_gate.cjs`(9课/159环节/53 coverage keys) · `local_personal_gate.cjs` · `video_tutorial_gate.cjs` · `player_backup_gate.cjs` · `player_layout_gate.cjs` · `camera_geometry_gate.cjs` · `verify_camera_geometry.py` · `combo_action_gate.cjs` · `surface_training_gate.cjs` · `layout_tutorial_gate.cjs` · `tutorial_interaction_gate.cjs` · `navigation_motion_gate.cjs` · `checksum_verify.py`。

## 验证边界

使用 DOM 适配器、受控存储与帧时钟执行生产处理器；**未进行真实浏览器视觉、触屏与设备性能验收**。`deliverables/` 下文件未改动；未引入 npm/pip 依赖；未改动 `02-state-themes.js`（`tour:'使用教程'` 仍为 6 处）。
