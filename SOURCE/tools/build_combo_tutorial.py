from pathlib import Path
import json
r=Path(__file__).resolve().parents[1]
cat=json.loads((r/'src/data/combo-training.json').read_text(encoding='utf-8'));release=json.loads((r/'src/data/release.json').read_text(encoding='utf-8'))
v=release['version'];phase=release['phase'];courses=cat['courses'];steps=sum(len(c['steps']) for c in courses);flows=cat['map']['flows'];tours=cat['tours']
migrated=sum(1 for t in tours for s in t['steps'] if s.get('origin')=='migrated');tourStepsCount=sum(len(t['steps']) for t in tours)
assert cat['version']==v and cat['phase']==phase,'教程必须与当前版本同步'
assert len({c['id'] for c in courses})==len(courses),'模块ID重复'
assert not any(s['type']=='observe' for c in courses for s in c['steps']),'课程数据不得再含观察环节'
assert steps==130 and len(courses)==33,(len(courses),steps)
assert migrated==29 and len(tours)==5,(len(tours),migrated)
for c in courses:
 assert c['group'].strip() and c['goal'].strip() and c['steps'],'不允许空模块或空目标摘要'
 assert all(c['overview'].get(k) for k in ['purpose','when','result','prerequisites','mechanism','boundary']),'必须解释操作目的与原理'
 assert all(s.get(k) for s in c['steps'] for k in ['id','type','target','instruction','why','check','success']),'步骤须有真实入口、作用与结果'
text=f'''# AI Playbook v{v} / {phase} · 本地个人使用教程

这里帮你找模板、填材料、保存自己的提示词。填好后把完整指令复制出来，粘到你平时用的 AI 工具里，才会得到回答。只浏览、检查或收藏都不会自动运行 AI。

这一版的工作区有五个日常页面，外加两个需要时才用的辅助操作。升级不会自动清空你的个人资料；旧版本的教程形态（视频播放）已整体退役，操作以本版为准。

## 三层导引：看地图 → 跟导览 → 亲手练

1. **第 1 层 · 一页操作地图**：顶部点「使用教程」打开。{len(flows)} 条核心流程、每步标注真实按钮名，约 2 分钟读完；每条流程可以直接「跟导览看一遍」或「亲手练」。
2. **第 2 层 · 实景分步导览**：在真实界面上逐个高亮元素，你点「下一步」推进，{tourStepsCount} 个导览点按自己的节奏看。导览期间只拦写操作，滚动、悬停、阅读不受限；随时可跳过。
3. **第 3 层 · 沙箱亲手练**：进入隔离练习场，跟着高亮指引亲手操作，系统自动核对结果；做错给线索，卡住点「提示」。共 {len(courses)} 门课、{steps} 个操作环节。

第一次打开会看到一张欢迎卡：三句话讲清产品是什么，主按钮直达第一个真实任务（搜索 → 打开卡片 → 填材料 → 复制）；看完或跳过都不会再打扰。

## 当前界面怎样找入口

主页标题区按文字实际需要占宽，名称和版本下面留着简短副标题。右侧十二个按钮挨着标题；够宽时排一排，窄一些就分成六列、四列或三列，手机上继续显示名称。按按钮名称找功能就行。拖动时邻近按钮会平滑让位，松手回到原位；以前保存的顺序仍然有效，也能用 Alt 加方向键调整，↺ 只恢复顺序。

打开「我的工作区」，先看五个日常标签。标签旁标着「辅助」的两个小按钮是「检查提示词」和「备份与恢复」。点按钮只是切换内容，不会运行 AI，也不会动你的资料。

## 操作地图：{len(flows)} 条核心流程

'''
for f in flows:
 text+=f"### {f['title']}\n\n{f['intro']}\n\n"
 text+='| 步骤 | 真实按钮 | 它做什么 |\n|---|---|---|\n'
 for i,s in enumerate(f['steps'],1):text+=f"| {i} | {s['label']} | {s['detail']} |\n"
 text+=f"\n这一条可以：跟导览看一遍（剧本 {f['tour']}），或亲手练（课程 {f['course']}）。\n\n"
text+=f'''## 实景导览：{len(tours)} 个剧本 · {migrated} 个导览点

| 剧本 | 讲什么 | 导览点 |
|---|---|---|
'''
for t in tours:text+=f"| {t['id']} · {t['title']} | {t['entryNote']} | {len(t['steps'])} |\n"
text+='''
导览在真实界面上运行：目标元素高亮 + 邻近气泡说明，你点「下一步」推进，最后一步为「完成」。导览期间系统拦截真实写操作（点按钮、输入、提交都会被挡下），但滚动、悬停、展开阅读不受限；右上气泡里随时可「跳过」。其中 29 个导览点正是旧版课程里的观察环节，逐字迁移而来；完成后按剧本提示去对应的亲手练课程。

## 沙箱亲手练

在任意主题顶部点「使用教程」打开地图，或直接在教程目录挑一门课。先读作用、目的、原理和准备条件，再点「开始带练」。

共 '''+str(len(courses))+f''' 门课、{steps} 个操作环节；每门课只教一个动作，最长 7 个环节。建议按「日常操作 → 检查、整理与备份」的顺序挑着学，一次一课，随时可停。三种模式：拆招带练（默认，逐步指引）、独立挑战（不给指引，自己走）、单环节重练（只练指定环节）。进入中途的小课时，系统会自动静默完成链上前置步骤（含旧观察环节）再从第一个动作开始；前置不计完成。

练习使用隔离的虚构资料，不读正式 IndexedDB/localStorage，也不写系统剪贴板或真实下载；完成记录表示你亲手做对了，可随时重练。旧版本残留的观看进度键会在启动时自动清理。正式页面必须选真实的 JSON 文件；练习里的虚拟文件只代替文件选择。

## 各模块逐步清单

'''
labels={'purpose':'作用与目的','when':'适用时机','mechanism':'操作原理','prerequisites':'准备条件','result':'学完会做什么','boundary':'操作边界'}
for c in courses:
 text+=f"### {c['title']}\n\n"
 for key,label in labels.items():text+=f"**{label}：** {c['overview'][key]}\n\n"
 text+='| 步骤 | 练习操作 | 为什么做 |\n|---|---|---|\n'
 for i,s in enumerate(c['steps'],1):text+=f"| {i} | {s['instruction'].replace('|','／')} | {s['why'].replace('|','／')} |\n"
 for i,s in enumerate(c['steps'],1):
  if s['type']=='input' and s.get('inputKind')!='select':text+=f"\n步骤 {i} 的练习输入：\n\n```text\n{s.get('value','')}\n```\n"
 text+='\n'
text+=f'''## 常见卡点

| 现象 | 处理 |
|---|---|
| 想认识界面按钮 | 顶部「使用教程」打开操作地图，或跟一个导览剧本 |
| 导览中点按钮没反应 | 导览只看不改，写操作被拦；点气泡里的「下一步」继续 |
| 收起后找不到 | 状态筛选选「已收起」，再进「更多 → 重新启用」 |
| 检查后原记录没变 | 检查只给线索；点「保存修改」后，还要在编辑器里保存 |
| 文件选完没有恢复 | 先在恢复区核对文件、时间和数量，再点明确的确认恢复 |
| 训练没有真实下载 | 练习用的是虚拟文件区；退出教程后再进行正式下载 |
| 想重看欢迎卡 | 欢迎只出现一次；学习入口在顶部「使用教程」 |

## 后续开发要求

新增、删减功能或调整界面，必须同步真实课程目标、作用、目的、入口位置、输入、检查和结果观察，以及操作地图（map.flows）、导览剧本（tours）、帮助、教程版本/Coverage、release.json、六个开发日志视图、README、DEVELOPMENT、CHANGELOG 和最终构建。课程目录为 `src/data/combo-training.json`，地图、导览、卡片、下拉与本手册都以它为准；空模块和失效步骤必须删除或改写，不能只改版本号。

发布前运行目录与布局门禁 `node tools/layout_tutorial_gate.cjs`，确认模块卡片与下拉一致、无空分组，真实入口存在，界面样式和对应课程说明同步；再运行全部操作与版本日志同步门禁（v6.58 起 13 条，video/camera 两条随播放模式退役）。

本地个人版不重建发布/审批流水线，不在启动时清空用户资料；删除保留可恢复边界，恢复备份先预览后确认。原 79 张母模板、18 类、6 主题和 2550 条来源原文保留。旧日志和旧报告是历史资料，不代表当前功能入口。
'''
(r/f'TUTORIAL-v{v}.md').write_text(text,encoding='utf-8',newline='\n')
print('Generated local tutorial:',len(courses),steps,'operations; maps:',len(flows),'tours:',len(tours),'migrated:',migrated)
