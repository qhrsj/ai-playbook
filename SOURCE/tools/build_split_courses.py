# -*- coding: utf-8 -*-
"""Rebuild combo-training.json (schema v3): 32 single-skill micro courses over shared chains.

Schema v3 (P80 / v6.58):
- `chains` keeps all 8 original chains VERBATIM, including the 29 observe steps
  (fact source + silent prerequisite-replay data source).
- `courses` only carry ACTION steps (click/input/key). The 5 all-observe home
  courses are removed (37 -> 32 courses, 130 action steps). Each sliced course
  gains `chainMap`: course step i <-> chain index chainMap[i]; `base` is now
  chainMap[0] (a chain index, not an action ordinal).
- `map` (4 flows) and `tours` (5 scripts, 29 migrated points + 3 authored) are
  authored here so the operation map, the tour engine and the gates share one
  selector source of truth.
"""
import json, io, sys
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
r = Path(__file__).resolve().parents[1]
old = json.loads((r / 'src/data/combo-training.json').read_text(encoding='utf-8'))

# v3 file carries the chains verbatim; search stays a standalone course.
chains = {k: v for k, v in (old.get('chains') or {}).items() if k != 'search'}
if not chains:
    chains = {c['id']: c['steps'] for c in old['courses'] if c['id'] != 'search'}
search_copy = next((json.loads(json.dumps(c)) for c in old['courses'] if c['id'] == 'search'), None)
if search_copy is None:
    search_copy = {'id': 'search', 'group': '日常操作', 'title': '关键词筛选 → 从主页打开卡片',
                   'fixture': 'empty', 'goal': '走完只输入关键词、不点击匹配按钮的主页筛选路径。',
                   'steps': [], 'principle': '', 'revision': 6,
                   'overview': {k: '占位' * 6 for k in ('purpose', 'when', 'mechanism', 'prerequisites', 'result', 'boundary')},
                   'hook': '', 'completionNote': ''}
fixture_of = {'daily': 'empty', 'collections': 'empty', 'personal': 'empty',
              'sources': 'empty', 'local-check': 'personal', 'local-backup': 'personal', 'local-organize': 'personal'}

PREP_BASE0 = '练习从隔离的虚构工作区开始，跟着做就能到位。'
PREP_REPLAY = '进入本课会自动先完成前面的准备步骤，再从第一个动作开始；练习全部使用隔离的虚构资料。'
PREP_PERSONAL = '练习使用隔离的虚构工作区，里面已备好一条练习素材。'
BOUND_BASE0 = '练习和正式工作区分开；先做真实动作，再看实际变化。不写系统剪贴板，不产生真实下载。'
BOUND_REPLAY = '练习和正式工作区分开；自动完成的准备步骤不计入你的操作记录，从第一个动作起才算。'

# (id, from, baseChainIndex, count, title, goal, purpose, when, mechanism, result, hook, completionNote, prereq, boundary)
# baseChainIndex is the chain index of the FIRST action step (observe steps skipped).
S = []
def add(cid, src, base, count, title, goal, purpose, when, mech, result, hook, note, prereq=None, boundary=None):
    S.append(dict(id=cid, src=src, base=base, count=count, title=title, goal=goal,
                  overview={'purpose': purpose, 'when': when, 'mechanism': mech,
                            'prerequisites': prereq or PREP_REPLAY, 'result': result,
                            'boundary': boundary or BOUND_REPLAY},
                  hook=hook, completionNote=note))

G_DAILY = '日常操作'
add('daily-match', 'daily', 0, 3, '输入需求并匹配模板',
    '用一句需求描述，让本地匹配给你推荐合适的模板。',
    '输入一句需求并获得匹配的模板推荐。',
    '不知道该用哪个模板，只有一句需求时。',
    '输入的文字会与模板的用途、标签做本地关键词比对，点「匹配模板」打开推荐列表，前三张最相关。',
    '你能从一句需求走到匹配推荐列表。',
    '这一课只到推荐列表，选卡和填写在后面几课。',
    '匹配路径走通了，不知道模板名也不怕。', prereq=PREP_BASE0, boundary=BOUND_BASE0)
add('daily-fill', 'daily', 3, 4, '把模板填成完整提示词',
    '从匹配结果进入模板，把材料填进变量区。',
    '从匹配结果进入模板，把材料填进变量区。',
    '已经选好模板，准备正式填写时。',
    '匹配后可先复制自动生成的提示词；进入模板后在练习区填材料，变量补齐后工作台给出完整指令。',
    '你能独立把一份模板填成可直接复制的完整提示词。',
    '进入后会自动先匹配好模板，你从复制与填写开始。',
    '从匹配到填好整条链你都走过了，这是最常用的一段。')
add('daily-copy', 'daily', 7, 2, '复制完整提示词',
    '在工作台复制拼装好的完整提示词，拿去外部 AI 使用。',
    '从工作台复制完整提示词。',
    '材料已填好，要拿去用的时候。',
    '工作台「03 提示词」页实时拼装变量与材料，复制按钮把完整指令收进练习剪贴板。',
    '你能拿到一份可直接粘贴使用的完整提示词。',
    '进入后自动停在材料已填好的状态。',
    '复制这步你会了，模板的价值从这生效。')
add('daily-source-first', 'daily', 9, 3, '回查第一条来源摘录',
    '从工作台打开第一条来源，查看并复制它的摘录。',
    '从工作台进入来源页并查看第一条摘录。',
    '想知道模板里引用的内容出自哪里时。',
    '「04 来源」列出模板引用的来源；摘录窗口展示原句，可一键复制。',
    '你能打开来源摘录并复制原句。',
    '进入后自动停在模板已打开的状态。',
    '第一次来源回查走通了，用模板更有底。')
add('daily-source-origin', 'daily', 12, 3, '追到原文与母模板',
    '顺着来源追到广场记录，复制完整原文并查看母模板。',
    '从摘录追到广场记录与母模板。',
    '摘录不够，想看完整原文或模板出处时。',
    '摘录窗口提供「查看广场记录」与「复制完整原文」；关联母模板可查看策展版本。',
    '你能从摘录一路追到原文与母模板。',
    '进入后自动停在摘录已打开的状态。',
    '出处链走通了，任何一句话都能溯源。')
add('daily-source-more', 'daily', 15, 5, '逐条核对更多来源',
    '回到来源列表，逐条打开其余来源核对。',
    '逐条打开其余来源摘录并关闭。',
    '模板引用多条来源，想全部核对时。',
    '回到「04 来源」列表，逐条打开摘录窗口，看完关闭再下一条。',
    '你能独立核对模板引用的每一条来源。',
    '进入后自动停在来源列表页。',
    '所有来源你都过了一遍，核对变成习惯。')

add('collect-card', 'collections', 0, 2, '收藏一张模板',
    '在卡片上点一下收藏，把模板存进我的工作区。',
    '把一张好用的模板加入收藏。',
    '遇到想长期用的模板时。',
    '卡片上的 ☆ 是收藏开关；收藏只存关系，不动模板本身。',
    '你会收藏模板，并知道它出现在工作区的收藏页。',
    '这一课只有两个动作，先建立收藏的手感。',
    '第一颗星点亮了，好模板从此不丢。', prereq=PREP_BASE0, boundary=BOUND_BASE0)
add('collect-open', 'collections', 2, 5, '从收藏打开并取消收藏',
    '从工作区收藏页打开模板，再在详情里取消收藏。',
    '从收藏页打开模板，并练习取消收藏。',
    '想确认收藏的东西还在不在、好不好用时。',
    '收藏记录的「打开」直达原对象；详情顶部的 ★ 再点一次就取消收藏。',
    '你会从收藏进入模板，也会取消收藏。',
    '进入后自动停在已收藏的状态。',
    '打开与取消都会了，收藏是可进可退的。')
add('collect-remove', 'collections', 7, 5, '删除收藏关系',
    '在工作区里删除一条收藏关系，模板本身不受影响。',
    '从收藏列表删除一条收藏关系。',
    '收藏太多、想清理列表时。',
    '删除收藏只移除这条关系，模板仍在库里可用。',
    '你会清理收藏列表，且不误删模板。',
    '进入后自动停在已收藏的状态。',
    '收藏清理干净了，列表只留真正要用的。')
add('collect-source-add', 'collections', 12, 3, '收藏一条来源原文',
    '在提示词广场给一条原始记录点收藏。',
    '把一条来源原文加入收藏。',
    '来源比模板更值得留档时。',
    '提示词广场每条记录都有 ☆；来源收藏在列表里单独标注为来源原文。',
    '你会收藏来源原文，并知道它和模板收藏分开标注。',
    '进入后自动打开提示词广场。',
    '来源也能收藏了，出处一键找回。')
add('collect-source-manage', 'collections', 15, 5, '来源收藏的打开与取消',
    '从工作区打开来源收藏，练习取消与再收藏。',
    '打开来源收藏，练习取消与再次收藏。',
    '想核对收藏的来源内容时。',
    '来源收藏的「打开」直达来源详情；★ 再点一次取消，可再收藏回来。',
    '你会打开、取消、恢复来源收藏。',
    '进入后自动停在工作区收藏页。',
    '来源收藏的进退你都掌握了。')
add('collect-source-cleanup', 'collections', 20, 4, '删除来源收藏',
    '把不要的来源收藏从列表里删除，原来源不受影响。',
    '删除一条来源收藏关系。',
    '收藏太多、想清理列表时。',
    '删除收藏只移除这条关系，来源原文仍在广场可用。',
    '你会清理来源收藏，且不误删来源本身。',
    '进入后自动停在工作区收藏页。',
    '来源收藏清理干净了，列表只留真正要用的。')
add('collect-recent-clear', 'collections', 24, 2, '清理最近使用记录',
    '删除最近使用里的历史记录；删除收藏与此互不影响。',
    '删除一条最近使用记录。',
    '想清空「最近使用」的历史时。',
    '最近使用只记打开历史；删除记录不影响收藏，也不删除模板本身。',
    '你会清理最近使用，并知道它与收藏互不相干。',
    '进入后自动停在最近使用页。',
    '最近使用清清爽爽，收藏原样保留。')

add('personal-create', 'personal', 0, 7, '新建一条个人提示词',
    '在工作区新建个人 Prompt，填齐名称、用途、标签和正文并保存。',
    '从零新建并保存一条个人提示词。',
    '有自己写法想长期保存时。',
    '新建后填写名称、用途、标签与带变量正文，点保存才进入记录；保存前不会新增任何东西。',
    '你能独立新建一条结构完整的个人提示词。',
    '进入后自动停在工作区，正文用练习区提供的示例。',
    '第一条个人提示词保存成功，库里有了你的东西。', prereq=PREP_BASE0, boundary=BOUND_BASE0)
add('personal-edit', 'personal', 7, 3, '修改并自动保留旧版本',
    '修改已保存的提示词，确认旧版本被自动保留。',
    '修改个人提示词并确认旧版本保留。',
    '想改进已有写法又怕丢旧稿时。',
    '每次保存都会把修改前的内容存为旧版本，可随时回看。',
    '你敢放心改稿，因为旧版本一直在。',
    '进入后自动停在记录已就绪的状态。',
    '改稿不慌了，旧版本替你兜底。')
add('personal-versions', 'personal', 10, 3, '比较历史版本差异',
    '打开旧版本列表，查看历史版本与当前的差异。',
    '查看历史版本与当前内容的差异。',
    '想确认两个版本差在哪时。',
    '旧版本列表可选任一历史版本，与当前做差异对比，只看不改。',
    '你会用差异对比看清楚每次改动。',
    '进入后自动停在旧版本列表。',
    '版本差异一目了然，改动了然于心。')

add('source-open', 'sources', 0, 2, '打开提示词广场并复制原文',
    '打开提示词广场，直接复制一条记录的完整原文。',
    '打开提示词广场并复制一条原文。',
    '想直接取用某条来源的完整文字时。',
    '提示词广场收录原始发布记录，每条都可一键复制完整原文；复制进练习剪贴板。',
    '你会打开广场并取走一条完整原文。',
    '这一课两个动作，先认识广场的入口。',
    '原文到手了，提示词广场就是你的素材库。', prereq=PREP_BASE0, boundary=BOUND_BASE0)
add('source-search', 'sources', 2, 3, '检索并打开一条来源',
    '在提示词广场按标题检索并打开详情。',
    '按标题检索来源并查看详情与作者说明。',
    '记得关键词，想找某条来源时。',
    '检索框按标题匹配；详情页含正文与作者说明，逐条保留署名。',
    '你能用关键词找到指定来源并查看详情。',
    '进入后自动停在广场列表。',
    '检索学会了，两千多条记录随取随用。')
add('source-same', 'sources', 5, 7, '同文记录与母模板关联',
    '认识同一原文的多条发布记录，并回到原始记录查看母模板。',
    '在同文多条记录间切换，并查看关联母模板。',
    '看到编号不同的相同正文，想知道哪条是源头时。',
    '相同正文会有多条发布记录；#1 是与母模板关联的原始记录，可查看策展版本。',
    '你能辨认原始记录，并从它跳到母模板。',
    '进入后自动停在广场列表。',
    '同文关系看懂了，源头一眼可辨。')
add('source-filter', 'sources', 12, 7, '用分类、排序和检索缩小范围',
    '组合主题分类、排序和检索，把来源列表缩到目标范围。',
    '组合使用分类、排序与检索筛选来源。',
    '记录太多，要按主题找时。',
    '主题分类与排序是下拉选择，检索按标题匹配；四样组合能把范围缩到一页。',
    '你能组合筛选条件，快速定位目标主题的来源。',
    '进入后自动停在广场列表。',
    '筛选组合会用了，大库也能秒查。')
add('source-pages', 'sources', 19, 5, '翻页与跳页',
    '练习上一页、下一页和页码直跳。',
    '练习翻页与输入页码直接跳页。',
    '想在多页结果间移动时。',
    '上一页/下一页逐页移动；页码框输入后回车提交才跳页，输入不提交不切页。',
    '你会用三种方式在结果页间移动。',
    '进入后自动停在筛选后的列表。',
    '翻页跳页都会了，长列表任你走。')
add('source-archive', 'sources', 24, 4, '旧档案与存成我的提示词',
    '从旧母模板档案复制旧模板，并把来源存成个人提示词。',
    '从旧档案复制模板，并把来源存成个人提示词。',
    '想取用旧版写法或把来源转成自己的提示词时。',
    '旧母模板档案保留旧写法可复制；「存成我的提示词」把当前来源生成一条个人记录，进编辑器确认后才保存。',
    '你会从旧档案取模板，也会把来源转成个人提示词。',
    '进入后自动停在第 2 页列表。',
    '旧档案和来源都能变成你自己的了。')

G_LOCAL = '检查、整理与备份'
add('check-run', 'local-check', 0, 4, '给提示词跑一次检查',
    '对一条提示词执行本地检查，拿到逐项清单。',
    '选择素材并执行一次本地检查。',
    '复制提示词前想做最后核对时。',
    '检查按正文、任务要求、可替换材料、输出形式、缺失信息处理逐项找文字线索，不联网不评分。',
    '你会对任意一条提示词发起检查并读懂清单。',
    '练习素材已备好，进入即选即查。',
    '第一次检查跑完了，复制前多了一道保险。', prereq=PREP_PERSONAL, boundary=BOUND_BASE0)
add('check-fix', 'local-check', 4, 3, '按清单补齐并复查',
    '按检查清单补上缺项，再次检查确认清零。',
    '按清单补充内容并再次检查。',
    '检查清单发现了缺项、要补齐时。',
    '补齐后旧清单立即失效，需要重新检查确认；每次都以最新结果为准。',
    '你会按清单修改并用复查确认补齐。',
    '进入后自动停在首次检查结果页。',
    '缺项补齐复查通过，可以放心复制了。')
add('check-save', 'local-check', 7, 6, '保存修改并对比旧版本',
    '把检查后的修改保存进编辑器，并对比旧版本。',
    '保存修改并对比保存前的旧版本。',
    '修改完成、要正式落盘时。',
    '「保存修改」进入编辑器，点「保存提示词」才更新记录并自动保留旧版本。',
    '你会保存修改，并用旧版本确认改了什么。',
    '进入后自动停在检查清单页。',
    '修改已保存，旧版本可查，闭环了。')

add('backup-export', 'local-backup', 0, 6, '下载完整备份与导出',
    '下载完整工作区备份，并单独导出我的提示词。',
    '下载完整备份并单独导出个人提示词。',
    '换设备、大改动前，或想单独留存写法时。',
    '完整备份包含个人资料与设置；导出只含我的提示词，用于追加导入。备份入口的选择文件按钮在导览里认识。',
    '你会拿到两种备份文件，并分清用途。',
    '进入后自动停在工作区备份页。',
    '备份到手，数据有了副本。', prereq=PREP_PERSONAL, boundary=BOUND_BASE0)
add('backup-trash', 'local-backup', 6, 3, '制造一次可恢复的误删',
    '把练习记录移入回收站，为恢复练习做准备。',
    '把练习记录移入回收站。',
    '练习恢复流程前的准备。',
    '删除先进回收站，可完整恢复；正式页面的永久删除才不可逆。',
    '你会移入回收站，并理解它与永久删除的区别。',
    '进入后自动停在备份页。',
    '误删进回收站，随时能反悔。')
add('backup-restore', 'local-backup', 9, 5, '载入备份并恢复',
    '载入虚拟备份，练习取消与确认恢复的完整核对流程。',
    '载入虚拟备份，走完取消与确认恢复。',
    '需要从备份还原工作区时。',
    '载入先预览数量对照；取消不改变现有内容，确认才替换并重新载入。',
    '你会按「选择→核对→确认」完成恢复，也会安全取消。',
    '练习用虚拟文件代替真实文件选择；正式恢复必须选真实 JSON。',
    '恢复流程走通了，误操作也不怕。')

add('organize-archive', 'local-organize', 0, 7, '收起与重新启用',
    '把暂不用的提示词收起，再从已收起筛选里找回。',
    '收起一条提示词，再重新启用它。',
    '列表里有暂不用的写法时。',
    '收起后从状态筛选「已收起」找回，「重新启用」恢复为可用；状态随时可切。',
    '你会收起与找回，列表只留常用。',
    '练习素材已备好，进入即操作。',
    '收起与启用都学会了，列表由你编排。', prereq=PREP_PERSONAL, boundary=BOUND_BASE0)
add('organize-trash', 'local-organize', 7, 4, '移入回收站',
    '把记录移入回收站，并认识永久删除的位置。',
    '移入回收站并认识永久删除按钮。',
    '确定不再要一条记录时。',
    '删除先进回收站；「永久删除」需要单独确认且不可恢复，它的位置在导览里专门指出，本课只看不点。',
    '你会移入回收站，并知道危险按钮在哪、怎么避开。',
    '进入后自动停在列表页。',
    '回收站会用了，误删有退路。')
add('organize-restore', 'local-organize', 11, 2, '从回收站恢复记录',
    '把回收站里的记录恢复回列表。',
    '从回收站恢复一条记录。',
    '发现误删、想要反悔时。',
    '回收站内每条记录都有「恢复」，恢复后回到原列表。',
    '你会把误删的记录完整找回。',
    '进入后自动停在回收站。',
    '恢复一步到位，东西回来了。')
add('organize-versions', 'local-organize', 13, 3, '恢复到旧版本',
    '选一个旧版本恢复，确认恢复前的当前版本也被保留。',
    '恢复到旧版本并确认当前版本被保留。',
    '改坏了、想退回旧版本时。',
    '恢复旧版本只替换内容；恢复前的版本会作为新条目留在历史里，不会丢失。',
    '你会安全地退回任意旧版本。',
    '进入后自动停在旧版本列表。',
    '时间倒流学会了，怎么改都有退路。')

# --- assemble: courses only carry non-observe chain steps, mapped via chainMap ---
courses = []
order = [('daily', G_DAILY), ('collections', G_DAILY), ('personal', G_DAILY),
         ('sources', G_DAILY), ('local-check', G_LOCAL), ('local-backup', G_LOCAL), ('local-organize', G_LOCAL)]
# step-list changes vs v2 (observe removal) force a revision bump so stale
# completion records for the reshaped lessons are not reused.
REVISION_BUMP = {'backup-export': 2, 'organize-trash': 2}
used = set()
chainMapOf = {}
for src, group in order:
    specs = [s for s in S if s['src'] == src]
    chain = chains[src]
    covered = []  # chain indices referenced by this chain's courses (actions only)
    if src == 'daily':
        courses.append(search_copy)  # standalone course inside 日常操作
    for sp in specs:
        chainMap = []
        steps = []
        for i in range(sp['base'], sp['base'] + sp['count']):
            st = chain[i]
            if st['type'] == 'observe':
                continue  # observe stays in the chain only; tours carry it now
            clone = json.loads(json.dumps(st))
            clone['id'] = clone['id'] + '@' + sp['id']
            steps.append(clone)
            chainMap.append(i)
            covered.append(i)
        assert chainMap[0] == sp['base'], (sp['id'], sp['base'], chainMap[0])
        used.add(sp['id'])
        chainMapOf[sp['id']] = chainMap
        courses.append({
            'id': sp['id'], 'group': group, 'title': sp['title'], 'fixture': fixture_of[src],
            'goal': sp['goal'], 'steps': steps, 'principle': sp['overview']['mechanism'],
            'revision': REVISION_BUMP.get(sp['id'], 1), 'overview': sp['overview'],
            'hook': sp['hook'], 'completionNote': sp['completionNote'],
            'from': src, 'base': chainMap[0], 'chainMap': chainMap,
        })
    # Slice integrity v3: every non-observe chain index covered exactly once, in order.
    expected = [i for i, st in enumerate(chain) if st['type'] != 'observe']
    assert covered == expected, ('chain not seamlessly covered by action slices', src, covered, expected)
assert len(used) == len(S) == 32
total = sum(len(c['steps']) for c in courses)
assert total == 130, total
for c in courses:
    assert not any(s['type'] == 'observe' for s in c['steps']), c['id']
    if c.get('from'):
        chain = chains[c['from']]
        for i, ci in enumerate(c['chainMap']):
            st = chain[ci]
            assert c['steps'][i]['instruction'] == st['instruction'] and c['steps'][i]['check'] == st['check'] and c['steps'][i]['target'] == st['target'], (c['id'], i)

# --- layer 1: operation map (4 flows; selectors are the single source of truth) ---
MAP_DATA = {
 'title': '操作地图 · 一页看懂四条流程',
 'tagline': '系统不复杂：先看地图，再跟导览，最后亲手练，约 5 分钟建立操作能力。',
 'helpNote': 'v6.61：先看这张地图认识四条核心流程；每条都能「跟导览看一遍」或直接「亲手练」。卡住时点页面上的「帮助」看当前控件的说明。',
 'headerTour': 'S0',
 'headerTourLabel': '先跟导览认识界面（S0 · 界面总览）',
 'flows': [
  {'id': 'F1', 'title': '找模板 → 填材料 → 复制',
   'intro': '最常用的一条：从一句需求到拿到完整提示词。',
   'steps': [
    {'sel': '#q', 'label': '搜索框', 'detail': '输入任务关键词，卡片实时筛选'},
    {'sel': '#needGatewayForm button[type="submit"]', 'label': '匹配模板', 'detail': '把需求交给本地匹配，先看前三推荐'},
    {'sel': '#home .card', 'label': '模板卡片', 'detail': '点开进入工作台', 'runtime': True},
    {'sel': '[data-view="core-inputs"] textarea', 'label': '填材料', 'detail': '把金色 [变量] 替换成实际内容', 'runtime': True},
    {'sel': '[data-action="copy"]', 'label': '复制模板', 'detail': '复制完整提示词，粘到你的 AI 工具使用', 'runtime': True}],
   'tour': 'S1', 'course': 'daily-match',
   'courses': ['daily-match', 'daily-fill', 'daily-copy', 'search']},
  {'id': 'F2', 'title': '收藏',
   'intro': '遇到好用的模板，点一颗星把它留住。',
   'steps': [
    {'sel': '#home .card', 'label': '模板卡片', 'detail': '找到想留的模板', 'runtime': True},
    {'sel': '#home [data-favorite-card]', 'label': '☆ 收藏', 'detail': '卡片上直接点亮，不用进详情'},
    {'sel': '#personalWorkspaceBtn', 'label': '我的工作区', 'detail': '收藏都存在这里'},
    {'sel': '[data-pw-tab="favorites"]', 'label': '收藏页', 'detail': '打开原对象或删除收藏关系'}],
   'tour': 'S2', 'course': 'collect-card',
   'courses': ['collect-card', 'collect-open', 'collect-remove', 'collect-source-add', 'collect-source-manage', 'collect-source-cleanup', 'collect-recent-clear']},
  {'id': 'F3', 'title': '个人提示词',
   'intro': '自己的写法长期保存：新建、修改、比较版本。',
   'steps': [
    {'sel': '#personalWorkspaceBtn', 'label': '我的工作区', 'detail': '个人提示词住在这里'},
    {'sel': '[data-pw-tab="prompts"]', 'label': '我的提示词', 'detail': '新建、修改或存成自己的版本'},
    {'sel': '[data-pw-create]', 'label': '新建', 'detail': '填名称、用途、标签和正文后保存'},
    {'sel': '[data-pw-versions]', 'label': '旧版本', 'detail': '每次保存自动保留旧稿，可比较差异'}],
   'tour': 'S3', 'course': 'personal-create',
   'courses': ['personal-create', 'personal-edit', 'personal-versions']},
  {'id': 'F4', 'title': '检查 / 备份 / 回收站',
   'intro': '复制前查遗漏，重要改动前留备份，误删可反悔。',
   'steps': [
    {'sel': '[data-pw-tab="check"]', 'label': '检查提示词', 'detail': '逐项找缺漏，不给评分不联网'},
    {'sel': '[data-pw-tab="backup"]', 'label': '备份与恢复', 'detail': '下载完整 JSON；恢复先核对再确认'},
    {'sel': '[data-workspace-export]', 'label': '下载完整备份', 'detail': '生成当前工作区的完整副本', 'runtime': True},
    {'sel': '[data-pw-tab="trash"]', 'label': '回收站', 'detail': '误删的记录在这里恢复'}],
   'tour': 'S4', 'course': 'check-run',
   'courses': ['check-run', 'check-fix', 'check-save', 'backup-export', 'backup-trash', 'backup-restore', 'organize-archive', 'organize-trash', 'organize-restore', 'organize-versions']}]}

# --- layer 2: scene tour scripts (29 migrated observe points + 3 authored) ---
# S0 gets home chain indices [0..11,13,14,23,24,25,26]; S1 gets [15..22];
# S2 gets [12]; S4 gets local-backup[4] and local-organize[10]. Each migrated
# step cites its origin chain step id via `src`.
def m(sel, title, desc, src, entry=None):
    step = {'sel': sel, 'title': title, 'desc': desc, 'origin': 'migrated', 'src': src}
    if entry:
        step['entrySel'] = entry[0]
        step['entryLabel'] = entry[1]
    return step

TOURS_DATA = [
 {'id': 'S0', 'title': '界面总览', 'entryNote': '认识主页上的全局入口与显示控制，全程只看不改。',
  'doneToast': '✓ 界面总览完成。想学找模板，跟 S1 导览或亲手练 daily-match。',
  'steps': [
   m('.nav .brand-copy', '系统身份与版本', '顶上这块是名称、版本和副标题，功能按钮挨着它。', 'home:0'),
   m('#navScratchBtn', '随手记', '随手记在这儿，想法没成形时先写在这。', 'home:1'),
   m('#importBtn', '导入', '导入从本地文件批量加你的提示词。', 'home:2'),
   m('#sourceCatalogBtn', '提示词广场', '提示词广场是原文的住处，署名和全文都在里面。', 'home:3'),
   m('#personalWorkspaceBtn', '我的工作区', '我的工作区放你的提示词、收藏和随手记。', 'home:4'),
   m('#devlogBtn', '日志', '日志记下每次改动，用来核对版本。', 'home:5'),
   m('#tourBtn', '使用教程', '使用教程就是你正在用的入口；它现在打开操作地图。', 'home:6'),
   m('#helpModeBtn', '帮助', '帮助点一下看用途，看完退出再操作。', 'home:7'),
   m('#navReadingBtn', '阅读', '阅读整体调字号和行距，正文保持原样。', 'home:8'),
   m('#navCountToggle', '主页数字开关', '这个开关只管主页两个数字角标。', 'home:9'),
   m('#themeBtn', '主题', '主题换外观，核心流程还是一样。', 'home:10'),
   m('#modeBtn', '场景配色', '场景配色挑当前主题的场景，跟模板分类无关。', 'home:11'),
   m('#mobileBtn', '手机模式', '手机模式切布局，名称和功能都还在。', 'home:12'),
   m('#navLayoutReset', '恢复按钮顺序', '↺ 把按钮顺序恢复成默认，偏好会保存。', 'home:13'),
   m('#home [data-home-action="rotate-hero"]', '换一句', '换一句只轮换主题引言，不动你的记录。', 'home:22'),
   m('#home .home-primary-actions [data-scratch-open]', '主页随手记入口', '这里和顶部随手记打开同一份草稿。', 'home:23'),
   m('#home .home-primary-actions [data-workspace-open]', '主页工作区入口', '这里和顶部工作区进同一份个人资产。', 'home:24'),
   m('#devlogFoot', '页脚日志入口', '页脚的日志和顶部点开的是同一套记录。', 'home:25')]},
 {'id': 'S1', 'title': '找模板 → 填材料 → 复制', 'entryNote': '跟一遍「一句需求到完整提示词」要经过的每个控件。',
  'doneToast': '✓ 找模板路线看完。去亲手练 daily-match，把这条路走一遍。',
  'steps': [
   m('#q', '主页长搜索框', '长搜索框筛选模板，点匹配才进推荐。', 'home:14'),
   m('#needGatewayForm button[type="submit"]', '匹配模板', '匹配模板把当前输入交给本地推荐。', 'home:15'),
   m('[data-home-library-tab="official"]', '系统模板', '系统模板是整理过的母模板，能按分类排序。', 'home:16'),
   m('[data-home-library-tab="personal"]', '个人模板', '个人模板是你自己建、导入或保存的版本。', 'home:17'),
   m('#home .home-category-tabs', '分类按钮', '分类按钮只筛当前类型，切回全部就能全看。', 'home:18'),
   m('#sort', '排序', '排序只改展示次序，分数代表修改判断。', 'home:19'),
   m('#home .home-pager', '页码', '页码翻页看更多结果，改动后回到第一页。', 'home:20'),
   m('#home .card', '模板卡片', '卡片先读任务和适用性，点开才进工作台。', 'home:21'),
   {'sel': '[data-action="copy"]', 'open': True, 'beforeView': 'core-prompt', 'title': '复制完整提示词', 'desc': '在工作台「03 提示词」点「复制完整提示词」，粘到你常用的 AI 工具里就能用。', 'origin': 'authored', 'src': None}]},
 {'id': 'S2', 'title': '收藏', 'entryNote': '认识卡片上的收藏开关，只看不改。',
  'doneToast': '✓ 收藏入口认识了。去亲手练 collect-card，点亮第一颗星。',
  'steps': [
   m('#home [data-favorite-card]', '☆ 收藏', '☆ 在卡片上直接收藏，不用先进详情。', 'home:favorite-entry'),
   {'sel': '#personalWorkspaceBtn', 'title': '我的工作区', 'desc': '收藏都住在这里，从顶部进入。', 'origin': 'authored', 'src': None},
   {'sel': '[data-pw-tab="favorites"]', 'entrySel': '#personalWorkspaceBtn', 'entryLabel': '点击「我的工作区」进入', 'title': '收藏页', 'desc': '收藏记录可打开原对象，或删除收藏关系。', 'origin': 'authored', 'src': None}]},
 {'id': 'S3', 'title': '个人提示词', 'entryNote': '新建、修改和版本比较的三个入口，全程只看不改。',
  'doneToast': '✓ 个人提示词入口认识了。去亲手练 personal-create，保存第一条。',
  'steps': [
   # Step 0 auto-enters the workspace (entrySel); steps 1-2 rely on the
   # tutorialResetScene keep-open rule (target contains data-pw-).
   {'sel': '[data-pw-tab="prompts"]', 'entrySel': '#personalWorkspaceBtn', 'entryLabel': '点击「我的工作区」进入', 'title': '我的提示词页', 'desc': '个人提示词住在这里；新建、修改或存成自己的版本，列表直接显示打开、修改、检查和旧版本。', 'origin': 'authored', 'src': None},
   {'sel': '[data-pw-create]', 'title': '新建入口', 'desc': '点「新建」进编辑器；填齐名称、用途、标签和正文，点保存才进入记录。', 'origin': 'authored', 'src': None},
   {'sel': '[data-pw-versions]', 'title': '旧版本', 'desc': '每次保存自动保留旧稿，在这里比较差异或恢复；还没有保存记录时，这一步会自动跳过。', 'origin': 'authored', 'src': None},
   {'sel': '[data-pw-tab="check"]', 'title': '顺手认识：检查提示词', 'desc': '复制前想查遗漏，切到「检查提示词」逐项找文字线索，不评分不联网。', 'origin': 'authored', 'src': None}]},
 {'id': 'S4', 'title': '检查 / 备份 / 回收站', 'entryNote': '认识两个需要「只看不点」的安全位置。',
  'doneToast': '✓ 安全位置认识了。去亲手练 check-run 或 backup-export。',
  'steps': [
   # S4 walks the workspace in the card's order: 检查 → 备份 → 下载 → 回收站.
   # entrySel chains open the workspace and render each pane; the tour engine
   # keeps the workspace open between steps (data-pw- / data-workspace- targets).
   {'sel': '[data-pw-tab="check"]', 'entrySel': '#personalWorkspaceBtn', 'entryLabel': '打开我的工作区', 'title': '检查提示词', 'desc': '逐项找缺漏，不给评分不联网；进入工作区后切到这里。', 'origin': 'authored', 'src': None},
   m('[data-pw-tab="backup"]', '备份与恢复', '重要改动前先留备份；恢复先核对再确认。', 'local-backup:4'),
   {'sel': '[data-workspace-export]', 'entrySel': '[data-pw-tab="backup"]', 'entryLabel': '切到备份页', 'title': '下载完整备份', 'desc': '点「下载完整备份」生成当前工作区的完整副本，JSON 自己保留。', 'origin': 'authored', 'src': None},
   m('[data-pw-tab="trash"]', '回收站 · 永久删除按钮', '回收站内的「永久删除」需要单独确认且不可恢复，本导览只看不点。', 'local-organize:10', ['[data-pw-tab="trash"]', '打开回收站'])]}]

out = {'schema': 'ai-playbook-combo-training-v3', 'version': '6.61', 'phase': 'P83',
       'sample': old['sample'], 'prompt': old['prompt'], 'chains': chains,
       'courses': courses, 'map': MAP_DATA, 'tours': TOURS_DATA,
       'sourceNote': old['sourceNote'], 'reference': old['reference']}
dst = r / 'src/data/combo-training.json'
dst.write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')

# tour integrity: migrated steps must reference every original observe id exactly.
observe_ids = [st['id'] for ch in chains.values() for st in ch if st['type'] == 'observe']
migrated = [s['src'] for t in TOURS_DATA for s in t['steps'] if s.get('origin') == 'migrated']
assert len(observe_ids) == 29 and sorted(observe_ids) == sorted(migrated), (len(observe_ids), len(migrated))
flows = MAP_DATA['flows']
assert len(flows) == 4 and all(f['tour'] and f['course'] for f in flows)
assert {f['tour'] for f in flows} <= {t['id'] for t in TOURS_DATA}
course_ids = {c['id'] for c in courses}
assert {f['course'] for f in flows} <= course_ids
print('courses:', len(courses), 'action steps:', total,
      'observe kept in chains:', sum(1 for ch in chains.values() for st in ch if st['type'] == 'observe'),
      'tour scripts:', len(TOURS_DATA), 'migrated tour points:', len(migrated))
for c in courses:
    print(f"  {c['id']:22s} {c['group']}  {len(c['steps'])} steps  from={c.get('from','-')}@{c.get('base','-')}")
