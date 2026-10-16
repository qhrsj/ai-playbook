/* ================================================================
   APP_STATE — 状态与表现分离
================================================================ */
const APP_STATE = { q:'', cat:'all', sort:'score', theme:'nebula', mode:'dark', mobile:'auto' };
try{
  APP_STATE.theme = WorkspaceStore.getItem('pb_theme') || 'nebula';
  APP_STATE.mode  = WorkspaceStore.getItem('pb_mode') || 'dark';
  APP_STATE.mobile = WorkspaceStore.getItem('pb_mobile') || 'auto';
  if(['on','off','auto'].indexOf(APP_STATE.mobile)<0) APP_STATE.mobile='auto';
}catch(e){}
const ENV = { RM: matchMedia('(prefers-reduced-motion: reduce)').matches, MOBILE: matchMedia('(max-width: 768px), (pointer: coarse)').matches };

/* P80: TOUR_CORE and the per-theme tourT title arrays were removed with the
   video tutorial; scene-tour scripts now live in combo-training.json.tours
   and are rendered by 12-tour.js. */
const THEMES = {
 nebula:{em:'✦',name:'星云档案馆',en:'Nebula Archive',desc:'AI Prompt 是漂浮在数字宇宙中的能力星体，本站是它们的星图档案',layout:'BENTO SPATIAL',dots:['#0a0e17','#eef1fb'],
  meta:{layout:'SPATIAL DASHBOARD',typo:'GEOMETRIC SANS',motion:'GRAVITY WAVE',card:'HOLOGRAM CUBES'},
  glyphs:['✦','✧','✶','✷','✸','✹','✺','❋','✴','✵','❂','✷','✦','✧','✶','❃','✧','✳'],
  L:{logo:'母模板库',sub:'AI PLAYBOOK',copy:'📋 复制模板',toast:'✓ 模板已复制到剪贴板',searchPh:'搜索星域：面试 / 小红书 / 去AI味 / JSON …',empty:'该星域暂无匹配信号 —— 试试「面试」「文案」「复盘」',emptyArt:'🛰️',tour:'使用教程',tpl:'Prompt 星体数据库',vars:'参数星环 · 输入变量',score:'星图扫描 · 五维评分',srcs:'星源记录 · 原文对照',ex:'信号样本 · 产出与示例',arch:'策展航行日志',center:'OVERALL',next:'跃迁 →',done:'完成巡航 ✓',doneToast:'🎉 星图巡航完成，随时点「导航」重温',result:'坐标锁定 {n} 颗能力星体',sortLabel:'SORT',sortA:'信号强度 ↓',sortB:'档案编号 ↑'},
  hero:{k:'ARCHIVE THE INTELLIGENCE · NAVIGATE THE POSSIBILITIES',h1:`${LIB_STATS.cards} 颗能力星体，<span>点亮你的 AI 星图</span>`,d:`从 <b>${LIB_STATS.rawSources}</b> 个 Prompt 信号中提炼，当前母模板压缩率 <b>${LIB_STATS.compression}%</b>，沉淀为 ${LIB_STATS.cards} 个稳定能力星体。`,hint:'⌨ 按 / 呼叫搜索 · 或点击下方快捷航线'},
  veil:'v-radial'},
 arcane:{em:'📜',name:'炼金术士手稿',en:'Arcane Codex',desc:'Prompt 是可抄录的古代咒文，变量是符文，本页是一本打开的秘术古卷',layout:'MANUSCRIPT',dots:['#16110b','#f3e9d2'],
  meta:{layout:'MANUSCRIPT DESK',typo:'SERIF / OLDSTYLE',motion:'INK & RUNES',card:'CODEX ENTRIES'},
  glyphs:['☿','☽','☉','♀','♃','♄','♂','♆','☊','△','◇','▽','✧','✶','❈','✤','⚖','✥'],
  L:{logo:'咒文库',sub:'ARCANUM',copy:'📜 抄录咒文',toast:'✓ 咒文已抄录至剪贴板',searchPh:'搜寻咒文：面试 / 小红书 / 去AI味 / JSON …',empty:'藏卷中没有找到这道咒文 —— 试试别的咒语关键词',emptyArt:'🕯️',tour:'使用教程',tpl:'咒文正文 · Prompt',vars:'符文变量 · 需替换处',score:'咒文稳定性 · 五维评鉴',srcs:'古卷出处 · 原文对照',ex:'施法示例 · 产出与示例',arch:'抄录员手记',center:'PURITY',next:'翻至下一页 →',done:'完成入门 ✓',doneToast:'🎉 学徒入门完成，随时点「入门」重温',result:'检得 {n} 道咒文',sortLabel:'排序',sortA:'〔按稳定性〕',sortB:'〔按卷号〕'},
  hero:null,
  veil:'v-ink'},
 eastern:{em:'📚',name:'东方藏书阁',en:'Eastern Archive',desc:'宋式书阁：安静的古籍目录，少即是多',layout:'CATALOG',dots:['#101314','#f6f4ec'],
  meta:{layout:'BOOK CATALOG',typo:'SONGTI SERIF',motion:'INK WASH',card:'CATALOG ROWS'},
  glyphs:['写','读','研','析','学','创','营','商','职','数','码','品','智','艺','效','生','律','财'],
  L:{logo:'藏书阁',sub:'東方書藏',copy:'🖋️ 摘录',toast:'✓ 已摘录至剪贴板',searchPh:'寻卷：面试 / 小红书 / 去AI味 / JSON …',empty:'阁中暂无此卷 —— 换个书名关键词寻访',emptyArt:'📖',tour:'使用教程',tpl:'卷中正文 · Prompt',vars:'朱砂批注 · 变量',score:'藏书评鉴 · 五维',srcs:'版本源流 · 原文对照',ex:'用卷示例 · 产出与示例',arch:'阁主跋记',center:'品第',next:'翻页 →',done:'阅卷功成 ✓',doneToast:'🎉 入阁阅卷毕，随时可重温',result:'检得 {n} 卷',sortLabel:'排序',sortA:'〔评分〕',sortB:'〔编号〕'},
  hero:null,
  veil:'v-ink'},
 synlife:{em:'🧬',name:'AI 生物舱',en:'Synthetic Life',desc:'每条 Prompt 是一组 AI 能力 DNA，这里是未来基因研究所',layout:'BIO TRAY',dots:['#03080c','#ecf7f8'],
  meta:{layout:'GENOME DASHBOARD',typo:'ROUNDED SANS',motion:'CELL DIVISION',card:'CULTURE TRAYS'},
  glyphs:['◍','◉','⊙','◎','●','◐','○','⬤','◍','◉','⊙','◎','●','◐','○','◉','◍','◐'],
  L:{logo:'能力基因库',sub:'GENOME-AI',copy:'🧬 提取序列',toast:'✓ 基因序列已提取至剪贴板',searchPh:'扫描基因库：面试 / 小红书 / 去AI味 / JSON …',empty:'基因库中未检出匹配序列 —— 换个碱基对关键词',emptyArt:'🧬',tour:'使用教程',tpl:'PROMPT GENOME · 能力基因',vars:'GENE VARIABLE · 基因变量',score:'GENOME FITNESS · 适配度',srcs:'GENETIC ORIGIN · 基因来源',ex:'表达产物 · 产出与示例',arch:'培养记录',center:'FITNESS',next:'下一培养皿 →',done:'流程完成 ✓',doneToast:'🎉 培养流程完成，随时点「培养流程」重温',result:'检出 {n} 组稳定基因组',sortLabel:'SORT',sortA:'FITNESS ↓',sortB:'SAMPLE ID ↑'},
  hero:{k:'SYNTHETIC LIFE DATABASE · ONLINE',h1:`${LIB_STATS.cards} 组能力基因，<span>构成智能生命图谱</span>`,d:`从 ${LIB_STATS.rawSources} 条 SOURCE STRANDS 中提纯，当前母模板压缩率 ${LIB_STATS.compression}%，得到 ${LIB_STATS.cards} 组稳定 GENOME。`,hint:'⌨ 扫描基因库 · 或从下方培养皿直接取样'},
  veil:'v-radial'},
 museum:{em:'🏛️',name:'AI 文明博物馆',en:'Museum of Intelligence',desc:'高端现代艺术馆：母模板是一件件馆藏展品',layout:'EXHIBITION',dots:['#14161a','#f5f1e8'],
  meta:{layout:'EDITORIAL GRID',typo:'EDITORIAL SERIF',motion:'GALLERY LIGHT',card:'MUSEUM LABELS'},
  glyphs:ROMAN,
  L:{logo:'文明博物馆',sub:'MUSEUM OF INTELLIGENCE',copy:'🏛️ 馆藏复制',toast:'✓ 展品已复制至剪贴板',searchPh:'检索馆藏：面试 / 小红书 / 去AI味 / JSON …',empty:'当前展厅暂无相关馆藏 —— 换个展品关键词',emptyArt:'🏛️',tour:'使用教程',tpl:'EXHIBIT TEXT · 展品文本',vars:'展品参数 · VARIABLES',score:'CURATOR REVIEW · 策展人评鉴',srcs:'PROVENANCE · 收藏源流',ex:'展品说明 · 产出与示例',arch:'馆藏档案',center:'CURATED',next:'下一展厅 →',done:'导览结束 ✓',doneToast:'🎉 参观导览结束，随时可重温',result:'{n} WORKS IN THIS INDEX',sortLabel:'INDEX',sortA:'CURATOR SCORE',sortB:'CATALOG NO.'},
  hero:null,
  veil:'v-light'},
 aurora:{em:'🔭',name:'极光观测站',en:'Aurora Observatory',desc:`极夜冰川上的科研观测站，观测 ${LIB_STATS.cards} 道稳定的智能信号`,layout:'DASHBOARD',dots:['#071018','#eef6f4'],
  meta:{layout:'OBSERVATORY DASHBOARD',typo:'CLEAN SANS + MONO',motion:'AURORA FLOW',card:'GLASS PANELS'},
  glyphs:['◌','○','◍','◎','⌁','⌇','≋','∿','◐','◌','○','◍','◎','⌁','⌇','✳','⚖','◈'],
  L:{logo:'极光观测站',sub:'AURORA OBSERVATORY',copy:'📋 复制模板',toast:'✓ 模板已复制到剪贴板',searchPh:'扫描信号：面试 / 小红书 / 去AI味 / JSON …',empty:'当前频段未检测到智能信号 —— 调整关键词再扫描',emptyArt:'🌌',tour:'使用教程',tpl:'OBSERVATION DATA · 观测数据',vars:'OBSERVATION PARAMETERS · 观测参数',score:'SIGNAL QUALITY · 信号质量',srcs:'信号溯源 · 原文对照',ex:'观测记录 · 产出与示例',arch:'观测日志',center:'SIGNAL',next:'继续观测 →',done:'校准完成 ✓',doneToast:'🎉 观测培训完成，随时点「观测指南」重温',result:'{n} 道信号在当前频段',sortLabel:'SORT',sortA:'SIGNAL ↓',sortB:'FREQ ↑'},
  hero:{k:'OBSERVATORY STATUS · ALL SYSTEMS NOMINAL',h1:`在极夜之上，<span>观测 ${LIB_STATS.cards} 道智能信号</span>`,d:`AI SIGNAL ARCHIVE：${LIB_STATS.rawSources} 条原始信号经整理压缩（${LIB_STATS.compression}%），${LIB_STATS.cards} 道稳定信号已锁定频段。`,hint:'⌨ 扫描信号 · 或从下方频段面板进入'},
  veil:'v-radial'}
};
const L = k => (THEMES[APP_STATE.theme].L[k] ?? THEMES.nebula.L[k] ?? '');
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const catInfo = id => CATS[id] || ['未知','✨','#818cf8'];
const glyph = id => { const t=THEMES[APP_STATE.theme]; if(t.glyphs) return t.glyphs[+id-1] || '◆';
  if(APP_STATE.theme==='eastern') return (catInfo(id)[0]||'卷').charAt(0); return '◆'; };

