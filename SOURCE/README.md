## 2026-10-15 · v6.61 / P83 · 分栏搜索与分类铺全
- 顶部全局大搜索框退役：系统模板 / Skill 广场 / 个人模板三栏各自带独立搜索框，提示词与 Skill 分开搜索互不混排；「匹配模板 →」随系统模板栏保留（课程与导览兼容）。
- 系统模板与 Skill 广场的分类选项卡上移到栏头并换行铺全（不再横向滚动）；去掉系统模板排序旋钮；Skill 广场新增分类选项卡（自动归类，含「其他」）。
- 「来源广场」全面更名「提示词广场」；我的工作区移除与主页重复的 Skill 页（Skill 只保留主页分栏）。

## 2026-10-15 · v6.60 / P82 · Skill 广场与来源库 1612 条
- 新增 Skill 类型：主页「Skill 广场」栏（3115 个，独立于提示词分栏）+ 我的工作区「Skill 广场」页（只读，截断 60 条防卡顿）+ 正文查看浮层（署名作者/来源/入口文件/文件数/大小）。
- 来源库 1350 → 1612 条：按广场条目 ID 去重合并（原位刷新 36 / 新增 262 / 正文指纹去重 5），署名作者、来源、作者主页逐条保留；超长正文分段自动拼接（文本 2 + Skill 76）。
- 新增数据文件 skill-catalog.json 并纳入基线指纹；合并管线 tools/merge_luzi_sources.py 可重复执行。

## 2026-10-15 · v6.59 / P81 · 亲手练每步可停：下一步按钮
- 做对一步后说明常驻，点「下一步 →」才进入下一环（最后一环「完成本课」）；拆招带练与独立挑战统一生效，删除 650 毫秒自动推进。
- 沙箱高亮滚动改居中策略，不再被顶部工具栏遮挡（修复"看起来指错按钮/需要手动滚动"）。
- 「更多」菜单改为卡片面板；「整理收藏与最近使用」拆为「删除来源收藏」「清理最近使用记录」两课（33 门 / 130 步）。
- 门禁断言全部改为按钮协议；33 门 guided 真实浏览器诊断通过。

## 2026-10-14 · v6.58 / P80 · 教程 v3：三层导引，视频退役
- 按用户反馈移除自动播放视频与完整示范模式（播放条、倍速旋钮、暂停/重试、观看进度键全链路下线），教程改为三层漏斗：一页操作地图 → 实景分步导览 → 沙箱亲手练，节奏完全交还用户。
- 新增第 1 层操作地图（4 条核心流程、真实按钮名，可跳导览或练习）与首启欢迎卡（主按钮直达第一个真实任务 daily-match，done/skipped 后不再复发并随完整备份携带）。
- 29 个纯观察环节迁入第 2 层实景导览（5 个剧本）；导览期间只拦写操作（click/input/change/submit/可打印键），滚动、悬停、阅读不受限。
- combo-training.json 升级 schema v3：8 条原链逐字节保留作重放事实源；课程 37→32 门、只含 130 个操作步，新增 chainMap（课内步 ↔ 链下标）；旧 :video 进度键启动时一次性清除。
- 门禁 16→13（video_tutorial_gate、camera_geometry_gate、verify_camera_geometry.py 退役）；真实浏览器 32 门 guided 逐课诊断 + 5 剧本导览冒烟 + 欢迎一次性冒烟通过。
## 2026-10-14 · v6.57 / P79 · 教程拆分：组合技长课变 37 门单招小课
- 按用户反馈把 9 门长课（最多 28 环节）按单一技能切成 37 门小课，一课一件事、最长 7 个环节；159 个环节的指令、why、成功语、目标与核对一条不改。
- 原链整体保存在 `chains`；进入中途的小课时播放器自动静默完成前置步骤，再从本课第一个动作开始；重试、单环节重练、solo、demo 全部支持中途进入。
- combo_sync_gate 新增切片完整性断言：37 门课必须无缝覆盖全部链条，切片指令/目标/核对与原链逐字节一致。
- 同步 release、手册 `TUTORIAL-v6.57.md`、Coverage、帮助、六日志视图、复盘 13 与交付件；真实浏览器 37 门课逐课播放诊断通过。

## 2026-10-14 · v6.56 / P78 · 教程播放稳定性：固定全景、就近注释与真实时间预算
- 用户真实观看反馈三项问题一次修复：跟随镜头放大移动导致头晕、注释排在高亮框旁可能看不到、部分视频停在某一步不动。
- 视频画面固定为完整界面等比缩放（comboCameraGeometry 删除 follow 分支），移除镜头切换按钮；只有高亮框移动。
- 浮动注释在包括视频在内的所有模式显示；放不下时停靠画面底部完整可见，不再消失。
- 根治卡步：训练场 sandbox 增加 allow-forms（CSP form-action 仍为 none，禁止真实导航）；此前 requestSubmit 在沙箱内不触发 submit 事件，daily/sources 的表单类环节必然失败。
- 控件等待与结果核对改为真实时间预算（各 8 秒），不随倍速缩短、不受暂停影响；comboCheck 异常按未通过处理。
- 新增真实浏览器 CDP 逐课播放诊断（9 课 × 2 倍速）；修复后 9/9 通过。真实触屏与设备性能仍需实际设备验收。

## 2026-10-14 · v6.55 / P77 · 使用教程人性化重构：开场动机、暖反馈与完成庆祝

- 借鉴游戏教程方法论（低代价试错、即时反馈、按需提示、完成成就），在既有四种学习模式之上补足语言与引导层；不重排课程结构。
- 每门课新增开场动机 `hook` 与完成庆祝 `completionNote`；非视频模式做对一步时，右侧显示这一步的具体结果（`step.success`），不再复读通用串。
- 提示按钮由「仅独立挑战」放宽到「拆招带练 + 独立挑战」；失败与中途停止的提示改为不指责、给下一步。
- 课程数据全部 `overview` 与 159 条 `why`/`success` 按第二人称重写，去除跨课复读；9 门课 / 159 环节不变。
- 当前手册为 `TUTORIAL-v6.55.md`；课程修订、帮助、Coverage、版本、六日志视图和配套手册同步，生成器修复换行缺陷（产物统一 UTF-8 + LF），历史文档保留。
- 验证覆盖生产处理器与 DOM 整课播放、成功语去重复用统计、教程三方覆盖、原数据/引擎哈希、ZIP 完整性与独立重建。真实浏览器视觉、触屏和性能未验收。

## 2026-10-14 · v6.54 / P76 · 教程镜头、右侧控制与备份即时刷新

- 以本轮上传的 P75 完整包为基线，重建确认字节一致；修复模板闭合标签、后续步骤消息被忽略和已打开工作区不刷新。
- 左侧完整演示，右侧集中解说和全部播放控制；跟随镜头把框选目标居中，全景适配完整视口，窄屏仍保留右栏。
- 速度旋钮支持0.5–2倍、指针和键盘；视频等待按速度扣减且暂停不消耗时间，零等待也尊重暂停。失败可重试当前环节并重建前置条件。
- 备份/恢复分区；文件读取、失败、取消、换文件即时刷新，恢复文件信息、数量对照和确认紧邻选择入口；读取序号阻止过期结果覆盖新文件。
- 当前手册为 `TUTORIAL-v6.54.md`；课程修订、帮助、Coverage、版本、六日志视图和配套手册同步，教程生成脚本改为视频主路径，保留历史文档。
- 验证覆盖生产处理器与DOM整课播放、暂停/速度/停止/重试、备份竞态与保存失败、布局几何、构建/原数据/引擎哈希、ZIP完整性及独立重建。真实浏览器视觉、触屏和性能未验收。

# AI Playbook · 项目说明

## v6.53 / P75 历史说明 · 可暂停的视频式教程

教程主路径改为观看式视频教程。选择章节后，系统在隔离的演示界面中自动播放真实操作；左侧提供暂停/继续、重播和进度显示，右侧只做解说。暂停会保留当前画面、高亮和解说，继续后从当前环节恢复；播放结束明确显示“视频教程已完成”，点击完成并退出返回主页。

观看不会改动正式工作区，也不要求用户反复点击“看到变化”或填写练习。九个当前模块仍由同一份 `src/data/combo-training.json` 驱动，真实界面位置、用途、原理、边界与来源路径保持同步。手机上下排列并保留触控高度，桌面默认最大化。

该版手册：`TUTORIAL-v6.53.md`。必须随每版真实界面与功能同步，不保留空标题。门禁包括navigation_motion_gate、surface_training_gate、layout_tutorial_gate、local_personal_gate、combo_action_gate、tutorial_interaction_gate、combo_sync_gate、video_tutorial_gate和check。已完成源码/DOM/样式级验证，真实浏览器视觉与性能仍需实际设备验收；升级不清空资料。



## 历史版本 v6.52 / P74 · 紧凑顶栏与连贯练习

标题按内容占宽，宽屏十二入口同排，窄屏分行。拖动时按钮平滑让位，松手归位，减少动态效果设置可关闭动画；保留原顺序与键盘操作。

教程只在练习区操作：左侧复制材料、操作与练习工具；右侧只给解说。输入完整停止输入或结束编辑后自动核对，组字期间暂停；实际操作成功后显示结果并自动推进。十个重复观察合并，九模块159环节（130操作、29讲解）；纯讲解轻点高亮区域或左侧下一处，不执行业务功能。

当前手册：`TUTORIAL-v6.52.md`。必须随每版真实界面与功能同步，不保留空标题。门禁包括navigation_motion_gate、surface_training_gate、layout_tutorial_gate、local_personal_gate、combo_action_gate、tutorial_interaction_gate、combo_sync_gate和check。未完成真实浏览器视觉验收，升级不清空资料。

## 历史版本 v6.51 / P73 · 界面整理与教程同步

工作区“辅助”一栏的检查、备份用紧凑按钮，窄屏保留触控尺寸。主页十二个入口用等宽网格，名称/版本分层；手机保留名称，拖动与键盘排序仍保存。日志ul/ol统一缩进，序号留在内容框内。

教程目录从当前课程生成：主界面入门、日常操作、检查整理与备份三个非空分组，九模块不再漏卡片。目标摘要与入口位置同步，手册为`TUTORIAL-v6.51.md`。五个日常页面与两个辅助操作保持；升级不清空数据。

当前验证：文档生成、build、`layout_tutorial_gate.cjs`、`local_personal_gate.cjs`、`combo_action_gate.cjs`、`tutorial_interaction_gate.cjs`、`combo_sync_gate.cjs`和`check.py`。真实浏览器视觉尚未验收。后续每次功能或布局改动必须同步真实课程、帮助、六日志视图及最终成品，不能只换版本号。

## 历史版本 v6.50 / P72 · 本地个人使用

工作区有我的提示词、收藏、最近使用、随手记、回收站五个日常页面，只保留检查提示词、备份与恢复两个辅助操作。原十项发布维护工具的入口/处理器/课程移除，旧记录仍随完整备份保留。升级不自动归零。

检查给出逐项修改线索，不给AI效果分；保存会留旧版。恢复先预览文件和数量，取消不写入，确认才覆盖。手册：`TUTORIAL-v6.50.md`。

当前验证：文档生成、build、`local_personal_gate.cjs`、`combo_action_gate.cjs`、`tutorial_interaction_gate.cjs`、`combo_sync_gate.cjs`和`check.py`。旧治理门禁放入历史资料，不再运行。

## 历史版本 v6.49 / P71 · 工作区归零与收藏管理

打开本版时，旧工作区会先保留归零前备份，再一次性清空个人与治理运行记录。主题、阅读、导航与教程进度保留；后续新记录不会再被清空。我的工作区提供「导出归零前备份」，用恢复备份可找回旧内容。实际清理发生在用户打开页面的浏览器中。

主页每张模板卡片、详情顶部、来源广场每条列表和详情、旧模板档案都显示收藏按钮。收藏栏按真实对象类型找回；删除收藏只取消关系，最近使用的删除只清除访问记录。新增逐步收藏管理课程，详细见 `TUTORIAL-v6.49.md`。

验证命令在原命令外增加 `node tools/workspace_collection_gate.cjs`。原始模板/来源及解析器、数据库引擎保持不变；没有真实浏览器视觉验收。

## 历史版本 v6.48 / P70 · 使用教程优化

顶栏六主题统一「使用教程」。每个模块先读作用与目的，再学真实按钮、输入/选择/回车和结果。输入时分别提示示例复制和检查；成功后确认实际变化再继续；结束清理提示，点完成并退出返回主页。

包含 16 模块、143 个实际操作与 34 个观察环节。新增主页按钮说明，分开真实关键词筛选/需求匹配，补齐全部来源控件类型；默认最大化，修复窗口右跳与中等宽度搜索框挤压。详细手册：`TUTORIAL-v6.48.md`。

```sh
python3 tools/build_combo_tutorial.py
python3 tools/build.py
node tools/governance_chinese_gate.cjs
node tools/combo_action_gate.cjs
node tools/tutorial_interaction_gate.cjs
node tools/combo_sync_gate.cjs
python3 tools/check.py
```

以本次上传的 v6.47 / P69 完整包为基线；独立 HTML 仅额外含页尾统计脚本，采用可重建包内应用。验证范围见 `reports/tutorial-v6.48.md`。本轮未运行真实浏览器视觉；历史记录保留，不代表所有旧工具重新执行。

## 历史版本 v6.47 / P69 · 逐动作操作训练营

在顶栏点「教程」，先选「选模板 → 填材料 → 复制指令」。每次只高亮一个真实按钮或输入框；输入后点「检查输入」，系统核对操作与结果才继续。再练个人版本，接着按需求学习十项高级工具。

共有 13 套课程、100 个动作，支持拆招带练、单个动作、独立挑战和完整示范。独立挑战撤掉提示；看示范、自动准备前置条件和误点不算亲手完成。练习数据与正式工作区隔离。详细操作见 `TUTORIAL-v6.47-COMBO.md`。

构建与本轮验证入口：

```sh
python3 tools/build.py
node tools/governance_chinese_gate.cjs
node tools/combo_action_gate.cjs
node tools/combo_sync_gate.cjs
python3 tools/check.py
```

本轮只修改上传的完整 v6.46 包；原附件不变。补修预演路由中文误译及通道晋升未保存登记状态。测试范围与限制见 `reports/combo-training-v6.47.md`；没有完成真实浏览器视觉验收。以下旧命令和历史资料保留作追溯，不代表本轮重新执行。

## 历史版本 v6.46 / P68 · 高级工具中文化

高级工具、关联弹窗、帮助及教程统一使用中文。历史治理记录采用显示转换，内部标识和工作区备份格式兼容。

当前工程从本次完整 HTML 及截断 ZIP 中的可校验文件恢复；旧测试工具未能完整找回。构建和本轮检查入口：

```sh
python3 tools/build.py
node tools/governance_chinese_gate.cjs
python3 tools/check.py
```

本轮验证见 `reports/chinese-governance-v6.46.md`。以下 v6.45 和更早说明为历史记录，原工具清单不能当作本包中全部可用的工具。

## 历史：v6.45 / P67 · 批量文件导入（源码恢复版）

本工程于 2026-10-10 用用户上传的 v6.45 HTML 和 v6.44 完整工程恢复。应用代码、帮助、教程、网页开发日志和数据从 HTML 原样提取；构建后的单文件 HTML 必须与上传文件字节一致。它是可维护、可构建的恢复工程，不能称为原先丢失的 v6.45 ZIP 原件。

- Excel（XLSX/XLS）、CSV/TSV、TXT、Markdown 和 JSON 批量导入；单文件 20 MB、本批 40 MB、最多 10000 条。
- 选择工作表、核对正文列和其他字段映射；文本按明确分隔符或一级标题拆分；每页 15 条预览，正文重复和同名条目默认跳过。
- 保留署名、出处、文件名、工作表和原始行号；勾选条目在整批保存成功后进入个人模板库。
- 个人提示词由 IndexedDB 保存，偏好与个人正文分开写入；保留旧数据迁移、JSON 工作区备份及失败保护。
- 本次新增的是源码恢复文档和验证工具。原先 P67 的外部文档、27 项测试脚本及运行记录没有随 HTML 保存，无法恢复为原件；此前轮次的通过声明不作为本次验证结果。

### 构建与恢复校验

在工程根目录执行（需要 Python 3 和 Node.js；构建不需要联网或 npm 安装）：

```sh
python3 tools/build.py
python3 tools/check.py
python3 tools/verify_recovered_source.py
node tools/batch_parser_recovery_gate.js
```

输出为 `dist/index.html`。`verify_recovered_source.py` 会核对原 HTML 的 SHA-256；修改功能后应更新发布身份及校验基线，不要为通过校验直接覆盖原始证据。

- `src/storage/playbook-database.js`：数据库读写与事务。
- `src/boot/start.js`、`src/boot/error.js`：异步启动和失败提示；应用在持久数据加载后初始化。
- `src/vendor/xlsx.full.min.js`：从 HTML 恢复的离线 SheetJS 解析器，原版权头保留。
- `src/workers/import-parser.js`：离线 Worker 内的 Excel、CSV、JSON 和文本解析。
- `src/js/20-file-import.js`：字段映射、分批预览、重复检查和确认保存。
- `docs/BATCH_IMPORT_v6.45.md`：本版操作说明。
- `reports/source-recovery-v6.45.md`：恢复方法、验证与未验证范围。

工程内其他工具和报告继承自 v6.44，其中 `tools/file_import_gate.js` 仍是旧版 1 MB 导入测试，不适用于 P67；当前导入解析回归使用 `batch_parser_recovery_gate.js`。

## 历史：v6.44 / P66 · 模板窗口缩放与滚动修复

- 从首页打开系统或个人模板后，桌面可从四边和四角调整尺寸；拖动标题只移动位置，保留已调整的大小。
- 窗口内滚动查看参数、提示词与来源，标题和关闭按钮留在外框；不再因内容或旧全屏最小高度被撑回满屏。
- 双击标题空白处可最大化和还原；短视口首次打开会限制窗口位置，手机保持原有整页布局。
- 教程和开发日志同步；验证范围见 `reports/template-window-v6.44.md`，真实浏览器视觉与拖动尚未实测。


## 历史：v6.43 / P65 · 可移动选择窗与紧凑日志

- 帮助说明、主题选择和场景配色在桌面从分色标题空白处拖动；Alt 加方向键微调。点击旁边的工作窗口可继续操作，选择窗用自身关闭按钮收起。
- 帮助窗手动移动后，下一条说明在原位置更新；内容高度自然适配，视口缩小时保持标题可见。手机保持原有自适应布局。
- 日志空白恢复普通排版，日期紧跟小标题；六个视图和所有历史记录保留。教程、开发日志和版本同步。
- 验证范围见 `reports/floating-log-v6.43.md`，未运行真实浏览器视觉测试。


## 历史：v6.42 / P64 · 用途与操作帮助

- 主页面开启帮助，点具体控件即可查看用途、怎么用和留意事项；退出后才继续原操作。工作区 15 项都有独立说明，窗口内使用帮助同步解释当前页。
- 随手记、来源广场、文件导入、需求匹配、版本恢复、策展、发布和审查的动态操作有专用说明，归档/恢复等按钮按当前状态解析。
- 说明明确本地匹配与模型回答、预演与真实变更、个人层与源码发布的边界；尤其提示审批可能继续编排，以及永久删除无法恢复。
- 新增帮助覆盖与副作用门禁；验证范围见 `reports/context-help-v6.42.md`。教程和开发日志同步。


## 历史：v6.41 / P63 · 顶部自定义、单一搜索与窗口拖动

- 拖动任意顶部功能按钮到目标位置，可跨行排序，单击仍打开原功能。Alt + 方向键排序，↺ 恢复默认顺序；偏好随工作区备份保存。
- 删除置顶小搜索框。主页长搜索条输入关键词检索模板，描述完整任务后点击匹配模板或回车进入需求匹配。输入时只更新模板结果，不丢失焦点；中文输入完成后检索。
- 桌面窗口统一按动画帧更新移动，结束后提交最终位置。聚焦不再触发全页字号重算，拖动时延后阅读更新并暂停背景绘制；各窗口的数据同步保留。
- 教程和开发日志同步。验证范围与实际浏览器未测边界见 `reports/navigation-motion-v6.41.md`。


## 历史：v6.40 / P62 · 文件导入、主页设置和最大化

- 导入只负责上传文件、预览并确认；支持 TXT、Markdown 和 Prompt JSON，个人资产的创建、编辑、导出与备份恢复集中在我的工作区。
- 主页面「Aa 阅读」统一调整主页和各窗口的字号与行距；「隐藏主页数字」只隐藏随手记和我的工作区两个入口角标。窗口内的数量始终显示。
- 取消右侧随手记／阅读／帮助浮动工具条。各操作窗口显示在主页导航之上；桌面标题的「□」可最大化，再点击可还原，双击标题空白处也可切换。手机本身保持全屏布局。
- 修正日志初始化顺序，当前版本的记录真实进入渲染。教程与开发日志已同步，验证见 `reports/home-settings-maximize-v6.40.md`。


## 历史：v6.39 / P61 · 多窗口与主页角标

- 「隐藏主页角标」只控制首页随手记和我的工作区右上角数字；各面板内的选项卡和统计数字保持显示。偏好继续随工作区备份保存。
- 桌面上可同时打开工作区、随手记、日志、模板等窗口，拖动标题、缩放边缘并点击聚焦。只有点各自关闭按钮才关闭。有关联的记录在保存、删除、恢复后同步更新。手机保持原有全屏体验。教程与开发日志已同步。

## 历史：v6.38 / P60 · 数量显示与随手记选项卡

- 顶部随手记和我的工作区使用一致的数量角标；在随手记面板或工作区点击「隐藏数量／显示数量」原计划同时控制两处角标和列表选项卡数量，已在 v6.39 修正为仅控制主页角标。偏好随工作区备份保存，旧数据默认显示。
- 随手记面板中的「已保存」「回收站」在同一列表位置切换。删除后可在回收站恢复，恢复后返回已保存列表；草稿不受影响。教程、开发日志和验证记录见 `reports/scratch-tabs-counts-v6.38.md`。

## 历史：v6.37 / P59 · 随手记回收站

- 随手记面板下方可展开「回收站」，查看已删除随手记、恢复至已保存记录或确认永久删除。面板和工作区共用回收站；当前草稿不会随记录删除而清空。
- 面板和工作区删除已保存随手记现在走同一条可恢复路径。教程和开发日志已同步；验证见 `reports/scratch-panel-trash-v6.37.md`。

## 历史：v6.36 / P58 · 简洁边框与工作区卡片

- 桌面弹窗保留四边与四角八方向缩放，但边缘手柄平时透明；鼠标移到边框或键盘聚焦时才出现方向提示。标题保持轻微分色，移除常驻抓取符号。
- 我的工作区卡片将按钮限制在标题行，正文和状态标签可用满按钮下方的整卡宽度；窄屏按钮自动换行。教程、开发日志与版本清单已同步；验证见 `reports/quiet-window-full-width-cards-v6.36.md`。

## 历史：v6.35 / P57 · 八方向窗口缩放

- 桌面上的工作区、随手记、日志、来源等弹窗，四边中点与四角都可抓住调整大小；各方向有可见标识和对应鼠标指针。
- 标题区以主题色分色并标出抓取符号，拖标题空白处可移动窗口；正文和标题里的按钮仍正常操作。随手记与阅读浮窗的内容在内部滚动。
- 手机继续使用全屏或贴边布局。教程、开发日志与版本清单已同步；验证见 `reports/eight-way-windows-v6.35.md`。

## 历史：v6.34 / P56 · 主题与场景菜单

- 打开主题或场景选择时，不再显示随手记、阅读字号和帮助的上下文工具条；手机主题选择页同样适用。
- 关闭选择菜单后，工作台、日志等子界面中的工具条仍可正常使用。教程、开发日志与版本清单已同步；验证见 `reports/theme-scene-toolbar-v6.34.md`。

## 历史：v6.33 / P55 · 搜索与窗口布局

- 首页需求匹配现在是一条与模板浏览区对齐的搜索框。输入任务并点「匹配模板」进入完整需求对话；顶部小搜索框继续筛选模板。
- 桌面上拖动工作区、随手记、日志、来源等弹窗的标题空白处可移动；拖右下角斜线可调整大小，聚焦斜线后也可按方向键微调。手机继续使用全屏或贴边布局。
- 教程、开发日志与版本清单同步；验证见 `reports/compact-search-adjustable-windows-v6.33.md`。

## 历史：v6.32 / P54 · 模板浏览区

- 首页是一个模板浏览区：上方「系统模板／个人模板」切换，下方选择该类型的分类。两种模板分别记住分类和页码，当前页面最多显示 15 张。
- 来源广场用上一页和下一页之间的数字框输入页码，按回车跳转。
- 我的工作区「最近使用」中的「打开」现在会进入对应模板；收藏和个人 Prompt 共用的打开入口也已修复。
- 教程、开发日志和版本清单同步更新；验证见 `reports/tabbed-library-v6.32.md`。

## 历史：v6.31 / P53 · 从草稿到个人 Prompt

- 首页醒目提供「随手记 · 创作草稿」与「我的工作区 · 个人 Prompt」。打开任何母模板后，也可以直接写随手记、派生个人版；打开自己的模板可直接编辑。
- 首页分为「原模板」与「个人导入模板」两栏，各自选择分类和页码，每栏每页最多 15 张。顶部搜索同时作用于两栏。个人导入不显示母模板策展分数；归档内容在工作区管理。
- 工作区标题有独立「写随手记」按钮。草稿可复制或保存为随手记记录；点「转为个人 Prompt」会预填新建页面，原草稿保留，之后可编辑、版本化。
- 来源广场可组合全文搜索、主题分类与排序，输入页码跳转。分类是根据标题和原发布标签推断的浏览索引；原文、标签及发布者署名保留不变。
- 发布验证：`python tools/build.py && python tools/check.py && node tools/home_source_navigation_gate.js && python tools/luzi_square_audit.py && python tools/curation_v628_gate.py && python tools/workspace_nav_gate.py && python tools/tutorial_sync_gate.py && python tools/devlog_traceability_gate.py`。证据与限制见 `reports/home-and-source-navigation-v6.31.md`。

## 历史：v6.13 / P35 · Devlog Render Backfill

本版修复“09-22 之后日志源码存在但 UI 看不到”的真正根因。

根因：`initDevlogTabs()` 在 P23–P34 的 `DEVLOG_*.push()` 之前执行，首次渲染拿到旧数组；后续日志虽然进入内存，却没有再次 render。

修复：
- 初始化移动到全部历史日志追加之后
- P23–P35 / 09-24 日志真实显示在开发日志 UI
- 保持最新优先排序
- 新增 UI 级 `devlog_post_0922_visibility_flow.py`
- Tutorial / Devlog / Release Manifest 三联证据链继续硬 Gate


## v6.15 / P37 · 2026-09-25
开发日志全表面同步修复：Header、全部、功能、Bug、内部验证、时间线、复盘、Release/Tutorial/Devlog 统一推进；补齐 09-22→09-25 可证实记录并建立最终成品逐 Tab Gate。


## v6.15.1 Devlog Completeness Backfill
不新增虚假 Phase；在 P37/v6.15 下补记 2026-09-25 的 10 个独立开发事件，并建立事件完整性 Gate。Release Phase 与 Devlog Event 从此分层。

## v6.16 / P38 · Release Channels

Release Train / Version Registry 之上新增部署通道治理：
- Preview → Stable 两阶段晋升
- Channel Promotion Gate
- Stable 必须先经过 Preview
- Preview / Stable 独立通道指针与历史回滚
- Registry Deprecated
- Tutorial / Devlog / Release Manifest 三联证据链继续作为 Gate

## v6.17 / P39 · Provenance Graph / Audit Explorer

新增工作区“审计追溯”：
- Prompt → Candidate → Curation → Promotion Draft → Release Run → Release Package
- Release Package → Release Train → Version Registry → Preview / Stable
- Release Package → Official Card
- 任意节点双向聚焦
- 链路覆盖与悬空引用检查
- 图谱由既有治理数据动态投影，不创建第二套业务真相源

## v6.18 / P40 · Quality Observatory / Regression Governance
- Prompt Quality: 参数化、来源完整度、元数据完整度
- Duplicate Quality: 高重复率与最高相似度
- Evidence Quality: Tutorial / Devlog / Release Manifest
- Release Quality: Rollback readiness / Deprecated history
- Quality Snapshot + Health Score
- Version Delta + Directional Regression
- Version Health History

## v6.19 / P41 · Release Automation / Policy Engine
- Machine policy decisions: AUTO / REVIEW / BLOCK
- Hard blocks: evidence chain, provenance, rollback
- Review rules: parameterization, duplication, quality health, regression
- Controlled Policy Override: pending → approved/rejected
- Policy Audit Trail; overrides never rewrite underlying quality facts


## v6.21 / P43 · Policy-driven Release Orchestrator / Dry Run
- Policy AUTO/REVIEW/BLOCK 接入 Preview / Stable Promotion
- Dry Run + Execution Plan（依赖、Package/Card、Migration、Rollback Point）
- REVIEW Queue + scoped approval
- BLOCK Remediation（不自动修改业务事实）
- Execution Audit：Decision → Plan → Result → Rollback Point
- Tutorial / Devlog / Release Manifest 同步，最终 dist/index.html 为验收对象


## v6.21 · Review Queue / Human-in-the-loop Governance

统一人工审查事件与状态机；Orchestrator REVIEW 可暂停/恢复，Policy Override 进入同一队列；所有人工决定保留 Reviewer / Reason / Evidence / Timestamp / Before-After / Related Policy / Related Release。Tutorial、Devlog、Release Manifest 同步到 v6.21 / P43。

## v6.22 / P44 · Remediation Engine / Fix Plan
- Policy BLOCK → Root Cause → Fix Plan → Re-check → Resolved
- Fix Plan 明确受影响资产、返回治理阶段、修复步骤与复检 Gate
- Re-check 只读取正式 Policy / Quality / Provenance / Release 事实；失败保持 Open，通过后才 Resolved
- Remediation 不执行 Auto Fix，不直接改母模板、来源事实、质量快照、Registry 或 Channel Pointer
- Tutorial / Devlog / Release Manifest 同步到 v6.22 / P44，最终 dist/index.html 继续作为 Artifact Gate


## v6.23 / P45 · Governance Dashboard / Release Control Center

- 新增统一“控制中心”，只读汇总 Candidate / Release / Channel / Audit / Quality / Regression / Policy / Execution / Review / Remediation。
- Release Health、Open Reviews、Active Blocks、Pending Promotions、Preview / Stable、Governance Alerts、Recent Regression / Rollback 直接读取既有治理事实，不创建第二套状态。
- Stable 与关键 KPI 支持 Drill-down 回原工作区或 v6.17 Provenance Audit Explorer，避免 Dashboard 成为信息孤岛。
- Tutorial / Devlog / Release Manifest 同步到 v6.23 / P45；最终 `dist/index.html` 继续作为 Artifact Gate。

## v6.24 / P46 · Governance Policy Profiles
- v6.19 固定阈值升级为 Normal / Strict / Experimental Preview Policy Profile。
- Profile 保存 Version / Effective From / Changed By / Change Reason / Diff / Approval，并通过 Review Queue 审批启用。
- Governance Floor 固化 v6.19 基线；Profile 只能保持或收紧阈值，不能降低 Gate 作为治理旁路。
- Policy Evaluation / Audit 固化 profileId / profileVersion / thresholdSnapshot，历史评估可复现。
- Profile Rollback 只恢复历史已批准版本，不改写历史 Evaluation；Tutorial / Devlog / Release Manifest 同步到 v6.24 / P46。

## v6.26 / P48 · Governance Simulation / What-if

- Adds a read-only Governance Simulation workspace for Current State → Proposed Change → Simulated State → Quality Delta → Policy Decision → Affected Assets → Risk.
- Initial scenarios cover Candidate promotion, Card merge, stricter Provenance policy, and Stable rollback.
- Simulation uses copied Quality / Policy / Channel state and declares `sideEffects=false`; it never invokes Candidate Accept, Official Merge, Policy Activation, Channel Promotion, or Rollback.
- Proposed policy changes continue to obey the v6.24 Governance Floor.
- Simulation History is prediction evidence only and does not enter formal Quality Snapshot, Policy Audit, or Channel History stores.
- Tutorial / Devlog / Release Manifest are synchronized at v6.26 / P48.
- Final acceptance target remains rebuilt `dist/index.html`.


## v6.26 / P48 · Release Intelligence / Governance Insights
- Evidence → Insight → Recommendation across Version Health, Regression, Provenance, Review, Remediation, Policy, Simulation and Rollback.
- Recommendations are non-binding and never directly mutate Reject/Delete/Merge/Promote/Rollback/Release facts.
- Every insight drills down to the existing governance source; no second business fact store is introduced.

## v6.27 / P49 · 炉子广场来源库与署名

- 顶部「来源广场」可离线检索、阅读、复制 1,350 条原始发布记录；每条展示署名发布者、广场条目 ID、来源表行号、原始出处作者（若有）和同文其他发布记录。
- 旧《炉子提示词.xlsx》的 24 条逐字对照新表，官方母模板来源页补齐匹配发布者及广场回链。署名发布者不自动认定为唯一原创作者。
- 两条 Excel 单元格长度上限之外的正文由「超长正文」表重组。原始 XLSX、构建用 JSON、哈希和处理统计保存在 `sources/`、`src/data/` 与 `reports/`。
- 1,350 条来源素材可直接复制使用，但不自动获得 38 张官方母模板的评分、融合或发布身份。若要升级某条来源为母模板，仍走个人 Prompt → 候选策展 → 发布治理流程。
- 每次功能改动同步 `src/js/15-scratchpad-reading-boot.js` 的教程和 Coverage、`src/js/08-detail-presentation.js` 的功能/验证/时间线、`src/data/release.json` 的三联版本；发布前运行 `tools/build.py`、`tools/check.py`、教程和日志 Gate。

## v6.28 / P50 · 首页母模板策展

- 首页 79 张母模板，18 个分类都有内容。新增 42 张涵盖研究、办公、数据、工程、产品、教学、视频、生活健康、法律和投资等常见任务。
- 卡片详情的「来源」保留广场原始正文和署名发布者；点击「查看广场记录」可核对原始条目。五维评分属于编辑判断，不代表模型效果实测。
- 「来源广场」的旧母模板档案保留退役的 `PC-13-005` 全文与退役原因，首页不再显示此卡。
- 教程增加分类导航、来源回查和旧卡档案的操作说明。开发日志与 Release Manifest 同步 v6.28 / P50；审核清单见 `reports/curation-v6.28.json`，复核结果见 `reports/home-curation-v6.28.md`。
- 开发复核：`python tools/build.py && python tools/check.py && python tools/curation_v628_gate.py && python tools/luzi_square_audit.py && python tools/tutorial_sync_gate.py && python tools/devlog_traceability_gate.py`。

## v6.29 / P51 · 我的工作区选项栏

- 工作区顶部的 15 个选项不随内容滚动；桌面会换行显示，手机提供「切换页面」下拉框和可滑动选项条。
- 切换页面后内容回到顶部，选中状态和移动端下拉值同步。使用教程中的「v6.29：工作区选项始终可见」可查看操作说明。
- 发布检查增加 `python tools/workspace_nav_gate.py`；具体变更和验证边界见 `reports/workspace-nav-v6.29.md`。

## v6.30 / P52 · 工作区更易用、打开更快

- 标题中的「? 使用帮助」介绍收藏、派生个人版、创建和整理；每个页面有一句用途提示。
- 默认展示个人 Prompt、收藏、最近使用、随手记、回收站。候选策展、审计、质量、策略和发布等 10 项在「高级工具」中按需展开，手机下拉菜单仍可直接跳转全部 15 项。
- 日常页面不再执行质量快照、审计图和治理洞察。相似度比较对每卡只分词一次，语义不变；用户数据和高级工具均保留。
- 验证与限制见 `reports/workspace-simplify-v6.30.md`；发布运行 `python tools/build.py && python tools/check.py && python tools/workspace_nav_gate.py && python tools/tutorial_sync_gate.py && python tools/devlog_traceability_gate.py`。
