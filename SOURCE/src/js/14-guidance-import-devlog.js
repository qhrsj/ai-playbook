/* ================================================================
   v5.5 GUIDANCE LAYER · HELP / NEED MATCHER / PERSONAL IMPORT / HERO COPY
================================================================ */
const OverlayManager={
  entries(){return [
    {name:'help',root:()=>$('#helpPopover'),open:()=>!$('#helpPopover').hidden,close:()=>closeHelp()},
    {name:'comboTraining',root:()=>$('#comboTrainingOverlay'),open:()=>$('#comboTrainingOverlay')?.classList.contains('open'),close:()=>closeComboTraining()},
    {name:'scratch',root:()=>$('#scratchFlyout'),open:()=>$('#scratchFlyout')&&!$('#scratchFlyout').hidden,close:()=>closeScratchFlyout()},
    {name:'reading',root:()=>$('#readingFlyout'),open:()=>$('#readingFlyout')&&!$('#readingFlyout').hidden,close:()=>closeReadingFlyout()},
    {name:'need',root:()=>$('#needOverlay'),open:()=>$('#needOverlay').classList.contains('open'),close:()=>closeUtility('#needOverlay')},
    {name:'sourceCatalog',root:()=>$('#sourceCatalogOverlay'),open:()=>$('#sourceCatalogOverlay')?.classList.contains('open'),close:()=>closeSourceCatalog()},
    {name:'personalVersion',root:()=>$('#versionInspectorOverlay'),open:()=>$('#versionInspectorOverlay')?.classList.contains('open'),close:()=>closeVersionInspector()},
    {name:'personalEditor',root:()=>$('#promptLifecycleOverlay'),open:()=>$('#promptLifecycleOverlay')?.classList.contains('open'),close:()=>closeLifecycleEditor()},
    {name:'personalWorkspace',root:()=>$('#personalWorkspaceOverlay'),open:()=>$('#personalWorkspaceOverlay')?.classList.contains('open'),close:()=>closePersonalWorkspace()},
    {name:'import',root:()=>$('#importOverlay'),open:()=>$('#importOverlay').classList.contains('open'),close:()=>closeUtility('#importOverlay')},
    {name:'scene',root:()=>$('#sceneMenu'),open:()=>!$('#sceneMenu').hidden,close:()=>closeScenes()},
    {name:'devlog',root:()=>$('#devlogOverlay'),open:()=>$('#devlogOverlay').classList.contains('open'),close:()=>{$('#devlogOverlay').classList.remove('open');}},
    {name:'source',root:()=>$('#srcOverlay'),open:()=>$('#srcOverlay').classList.contains('open'),close:()=>closeSrc()},
    {name:'themeSheet',root:()=>$('#themeSheet'),open:()=>$('#themeSheet').classList.contains('open'),close:()=>{$('#themeSheet').classList.remove('open');$('#themeBtn').setAttribute('aria-expanded','false');}},
    {name:'themeMenu',root:()=>$('#themeMenu'),open:()=>$('#themeMenu').classList.contains('open'),close:()=>{$('#themeMenu').classList.remove('open');$('#themeBtn').setAttribute('aria-expanded','false');}},
    {name:'tour',root:()=>$('#tourTip'),open:()=>tourActive,close:()=>tourEnd()},
    {name:'workspace',root:()=>$('#panel'),open:()=>Boolean(activeCard),close:()=>closeModal()}
  ];},
  top(){return this.entries().find(x=>{try{return x.open();}catch(e){return false;}})||null;},
  closeTop(){const item=this.top();if(!item)return false;item.close();this.syncBodyLock();return true;},
  focusRoot(){return this.top()?.root?.()||null;},
  syncBodyLock(){document.body.style.overflow=modalLayersOpen()?'hidden':'';}
};
function modalLayersOpen(){return ['#promptLifecycleOverlay','#versionInspectorOverlay','#comboTrainingOverlay','#needOverlay','#sourceCatalogOverlay','#personalWorkspaceOverlay','#importOverlay','#devlogOverlay','#srcOverlay','#backdrop','#themeSheet'].some(sel=>{const el=$(sel);return el&&(el.classList.contains('open'));})||!$('#sceneMenu').hidden||$('#themeMenu').classList.contains('open');}
function syncBodyLock(){OverlayManager.syncBodyLock();}
function openUtility(id){const el=$(id);if(!el)return;el.classList.add('open');syncBodyLock();syncContextHelp();requestAnimationFrame(()=>{decorateHelp(el);el.querySelector('textarea,input,button,select')?.focus({preventScroll:true});});}
function closeUtility(id){const el=$(id);if(!el)return;el.classList.remove('open');syncBodyLock();syncContextHelp();}

const HERO_COPY={
 nebula:[
  {text:'路漫漫其修远兮，吾将上下而求索。',by:'屈原',source:'《离骚》'},
  {text:'你不是在寻找一句更聪明的话，而是在为问题寻找一条可抵达的航线。',by:'AI Playbook',source:'星云档案馆 · 主题原创'},
  {text:'星图从来不替人远行，它只是让下一步不再盲目。',by:'AI Playbook',source:'星云档案馆 · 主题原创'},
  {text:'海上生明月，天涯共此时。',by:'张九龄',source:'《望月怀远》'}],
 arcane:[
  {text:'纸上得来终觉浅，绝知此事要躬行。',by:'陆游',source:'《冬夜读书示子聿》'},
  {text:'配方的价值，不在材料稀有，而在每一步都能复现。',by:'AI Playbook',source:'炼金术士手稿 · 主题原创'},
  {text:'一次好提示，不是咒语，是被写清楚的意图、变量与边界。',by:'AI Playbook',source:'炼金术士手稿 · 主题原创'},
  {text:'操千曲而后晓声，观千剑而后识器。',by:'刘勰',source:'《文心雕龙·知音》'}],
 eastern:[
  {text:'问渠那得清如许？为有源头活水来。',by:'朱熹',source:'《观书有感》'},
  {text:'读书不是把答案装进心里，而是把问题洗得更清楚。',by:'AI Playbook',source:'东方藏书阁 · 主题原创'},
  {text:'旧书不厌百回读，熟读深思子自知。',by:'苏轼',source:'《送安惇秀才失解西归》'},
  {text:'学而不思则罔，思而不学则殆。',by:'孔子',source:'《论语·为政》'}],
 synlife:[
  {text:'苟日新，日日新，又日新。',by:'商汤盘铭',source:'《礼记·大学》'},
  {text:'能力不是一次生成的成品，而是可反复培养的结构。',by:'AI Playbook',source:'合成生命舱 · 主题原创'},
  {text:'每一次修改，都是让提示词更适应真实环境的一次进化。',by:'AI Playbook',source:'合成生命舱 · 主题原创'},
  {text:'沉舟侧畔千帆过，病树前头万木春。',by:'刘禹锡',source:'《酬乐天扬州初逢席上见赠》'}],
 museum:[
  {text:'博观而约取，厚积而薄发。',by:'苏轼',source:'《稼说送张琥》'},
  {text:'被收藏的不该只是答案，而是能再次使用的思考方式。',by:'AI Playbook',source:'智能博物馆 · 主题原创'},
  {text:'每一件好作品，都藏着一套可以迁移的选择。',by:'AI Playbook',source:'智能博物馆 · 主题原创'},
  {text:'文章千古事，得失寸心知。',by:'杜甫',source:'《偶题》'}],
 aurora:[
  {text:'危楼高百尺，手可摘星辰。',by:'李白',source:'《夜宿山寺》'},
  {text:'信号一直都在，真正稀缺的是安静地分辨它。',by:'AI Playbook',source:'极光观测站 · 主题原创'},
  {text:'清晰不是信息更多，而是噪声更少。',by:'AI Playbook',source:'极光观测站 · 主题原创'},
  {text:'星垂平野阔，月涌大江流。',by:'杜甫',source:'《旅夜书怀》'}]
};
const HERO_CURSOR={};Object.keys(HERO_COPY).forEach((k,i)=>HERO_CURSOR[k]=(Math.floor(Date.now()/60000)+i)%HERO_COPY[k].length);
function heroQuoteHTML(theme){const bank=HERO_COPY[theme]||HERO_COPY.nebula,q=bank[HERO_CURSOR[theme]%bank.length];return `<div class="hero-verse" data-hero-verse><div class="hq-text">“${esc(q.text)}”</div><div class="hq-meta">— ${esc(q.by)} · ${esc(q.source)}</div><button class="hq-next" data-home-action="rotate-hero" type="button">↻ 换一句</button></div>`;}
function mountHeroQuote(){const host=$('.unified-hero-main');if(host&&!host.querySelector('[data-hero-verse]'))host.insertAdjacentHTML('beforeend',heroQuoteHTML(APP_STATE.theme));}
function rotateHero(theme=APP_STATE.theme,step=1){const bank=HERO_COPY[theme];if(!bank?.length)return;HERO_CURSOR[theme]=(HERO_CURSOR[theme]+step+bank.length)%bank.length;const box=$('[data-hero-verse]');if(!box){mountHeroQuote();return;}box.classList.add('fade');setTimeout(()=>{const q=bank[HERO_CURSOR[theme]];box.querySelector('.hq-text').textContent='“'+q.text+'”';box.querySelector('.hq-meta').textContent='— '+q.by+' · '+q.source;box.classList.remove('fade');decorateHelp(box);},140);}
setInterval(()=>{if(!activeCard&&document.visibilityState==='visible'&&!tourActive&&!modalLayersOpen())rotateHero(APP_STATE.theme,1);},28000);
const NEED_GATEWAYS={
 nebula:{icon:'✦',name:'星图问路',k:'INTENT NAVIGATOR',desc:'说出你想完成什么，我会从能力星图里替你找到最合适的提示词航线。',ph:'例如：我想把一份行业报告整理成老板能快速看懂的汇报'},
 arcane:{icon:'◈',name:'愿望炼成阵',k:'INTENT ALCHEMY',desc:'把还没成形的愿望写下来，系统会从卷册中炼成一条可执行的提示词路径。',ph:"例如：我想把一个模糊的创意整理成可直接使用的 提示词"},
 eastern:{icon:'问',name:'问事寻卷',k:'以事寻卷',desc:'不必先懂门类。说出所求，系统会替你翻检书目，找到最契合的一卷。',ph:'例如：我有一篇本科论文，想按答辩标准做严格自查'},
 synlife:{icon:'⌬',name:'需求测序舱',k:'INTENT SEQUENCER',desc:'输入任务特征，系统会分析你的目标与材料，为需求匹配最接近的能力模板。',ph:'例如：我想练英语口语，同时希望每轮都纠正语法和表达'},
 museum:{icon:'◇',name:'策展问询台',k:'CURATORIAL DESK',desc:'先描述你的任务，系统会像策展人一样从馆藏能力中推荐最适合使用的工具。',ph:'例如：我想把一本书拆成结构化读书笔记和分享提纲'},
 aurora:{icon:'⌁',name:'航向校准台',k:'INTENT BEACON',desc:'把目标当作坐标输入，系统会沿着能力信号替你定位最合适的提示词。',ph:"例如：我想优化一个 提示词，让输出更稳定、更容易控制"}
};
/* P83: the big global search box retired — per-tab searches live in each home
   library section; the need-matcher form moved into the 系统模板 tab header. */

function helpDescription(el){
 if(!el)return null;
 const id=el.id||'',txt=(el.getAttribute('aria-label')||el.textContent||el.getAttribute('title')||'').replace(/\?/g,'').replace(/\s+/g,' ').trim();
 if(HELP_CONTROL_IDS[id])return HELP_CONTROL_IDS[id];
 const key=el.getAttribute('data-pw-tab')||el.getAttribute('data-control-tab');
 if(key)return helpWorkspaceTab(key);
 if(el.hasAttribute('data-intelligence-route')){
  const route=el.dataset.intelligenceRoute,guide=helpWorkspaceTab(route);
  return helpInfo('核查洞察证据',`沿这条建议进入${guide?`「${guide[0]}」`:'来源审计'}，核对告警依据。`,'先看来源、指标和记录，再决定需要哪项正式处理。','只是导航与查看，不执行建议中的发布、删除、回滚或批准。');
 }
 if(el.hasAttribute('data-devtab')){const g=HELP_DEVLOG_TABS[el.dataset.devtab];if(g)return helpInfo(...g,'日志只读；验证记录中未执行的范围仍需实际复核。');}
 if(el.hasAttribute('data-scratch-tab'))return el.dataset.scratchTab==='trash'
  ?helpInfo('随手记回收站','找回已删除的随手记记录，或清理确定不再需要的内容。','核对内容后恢复到已保存列表；永久删除需要再次确认。','与工作区共用数据；当前草稿不在这里，恢复不会覆盖草稿。')
  :helpInfo('已保存随手记','回看创作过程中的灵感和草稿快照。','可复制、继续编辑或移入回收站；继续编辑前先保存需要保留的当前草稿。','这里的记录和上方当前草稿分开保存。');
 if(el.hasAttribute('data-pw-archive'))return /恢复/.test(txt)
  ?helpInfo('恢复为在用',"把暂时收起的个人提示词 恢复为可日常使用。",'恢复后从个人模板库或工作区打开并继续使用。','这是恢复归档状态，不是回收站恢复；正文和版本历史保留。')
  :helpInfo("归档个人提示词",'暂时收起不常用的个人提示词，保留内容与历史。','需要时可以恢复为在用；确实要移走时先归档再删除到回收站。','归档不会永久删除。');
 if(el.hasAttribute('data-favorite-card'))return helpInfo(el.getAttribute('aria-pressed')==='true'||el.classList.contains('on')?'取消收藏':'收藏模板','把常用模板集中在我的工作区，方便下次找到。','收藏后可打开或派生个人版；再次点击取消收藏。','只改变收藏关系，不修改模板内容。');
 if(el.hasAttribute('data-version-diff'))return /查看正文/.test(txt)
  ?helpInfo('查看历史正文','从差异对照切回选中版本的完整正文。','核对内容后再决定是否恢复。','切换视图不改变当前版本。')
  :helpInfo('与当前版本比较','按行看选中历史版本与当前正文的增删差异。','先核对改动，再决定保留当前稿还是恢复历史稿。',"内容差异 只是文本比较，不会自动合并或恢复。");
 if(el.hasAttribute('data-cur-decision')){
  const g={accepted:['接受候选','确认候选具备进入发布准备流程的价值。','核对评分、相似度、变量和来源，记录接受理由。','只保存策展与晋升记录；要成为母模板还需发布治理。'],held:['暂缓候选','保留有价值但还不完善的内容，回去继续优化。','写清需要补齐的条件，再暂缓；改善后可重新策展。',"不会删除个人提示词 或直接发布。"],rejected:['驳回候选','决定该内容暂不适合进入母模板库。','写清重复、来源或任务价值上的问题，再驳回。',"保留个人提示词 和策展记录，不执行删除。"]}[el.dataset.curDecision];if(g)return helpInfo(...g);
 }
 if(el.hasAttribute('data-review-transition')){const g=HELP_REVIEW_STATES[el.dataset.reviewTransition];if(g)return helpInfo(...g);}
 if(el.hasAttribute('data-channel-promote')){const stable=el.dataset.channelPromote==='stable';return helpInfo(stable?"晋升 稳定版":"进入 预览版",stable?'把经验证的版本设为稳定通道。':'把正式登记版本放入预览通道验证。',"先核对所选版本及通道 检查门槛；切换时保留历史指针。",'这会实际改变本地通道指向，不等于生成新的离线 HTML。');}
 if(el.hasAttribute('data-train-field'))return el.dataset.trainField==='notes'
  ?helpInfo('整版发布说明','解释这组发布包解决了哪些问题、有哪些使用变化。','填写发布目的、内容变化和已知边界，方便之后核对这个版本。','编辑草案说明不执行发布。')
  :el.dataset.trainField==='version'
  ?helpInfo('整版版本号','给这一组发布包一个可追查的版本标识。',"填写后检查版本冲突和整版 检查门槛，再登记正式版本。",'修改草案字段不会自动推进通道。')
  :helpInfo('整版名称','描述这一版主要解决的问题，方便在登记记录中识别。',"填写清楚名称，再核对包集合、版本号和发布 检查门槛。",'修改名称不执行整版发布。');
 if(el.hasAttribute('data-home-library-tab'))return el.dataset.homeLibraryTab==='personal'
  ?helpInfo('个人模板库','使用你导入、创建或派生的提示词。','先按自己的分类筛选，每页最多 15 张；到工作区可编辑和查看版本历史。','与系统模板分开管理，个人模板没有母模板策展评分。')
  :helpInfo('系统模板库','从经过整理的母模板出发，减少从零写提示词的工作。','按任务分类选择，填变量后复制成稿；要长期修改请派生个人版。','系统模板和个人模板各自记住分类与页码。');
 if(el.hasAttribute('data-home-cat-tab')){const [kind,cat]=el.dataset.homeCatTab.split(':');return helpInfo('模板分类筛选',`缩小${kind==='personal'?'个人':'系统'}模板的浏览范围。`,cat==='all'?'显示当前模板库的全部分类；仍可结合主搜索条检索。':`只显示「${catInfo(cat)[0]}」；仍可结合关键词搜索。`,'不改变另一模板库的分类条件，切换后从第一页查看。');}
 if(el.hasAttribute('data-home-page'))return helpInfo('模板分页','在当前类型和筛选条件下逐页浏览模板。','点上一页、下一页或页码切换；每页最多 15 张。','只换结果页，不丢失当前分类和关键词。');
 if(el.hasAttribute('data-square-page'))return helpInfo('来源翻页','继续浏览当前检索与分类得到的原始发布记录。','点上一页或下一页；要跨多页可编辑中间页码并按回车。','翻页会在详情区选中该页的首条来源。');
 if(el.hasAttribute('data-read-preset'))return helpInfo('阅读比例预设',`把主页和各窗口统一设为 ${el.dataset.readPreset}% 阅读比例。`,'选择适合的比例，也可拖动滑块微调。','显示设置会记住；提示词实际正文不变。');
 if(el.hasAttribute('data-global-scratch'))return helpInfo('当前随手记草稿','记录还在形成的思路、输入条件和待验证问题。','输入会同步到其他随手记区域；想留一份快照时点保存为记录。',"保存在当前浏览器；转为个人提示词 是另存一条可维护记录。");
 if(el.matches('input[name="releaseMode"]'))return el.value==='merge'
  ?helpInfo('合并母模板','用候选内容改进一张已有母模板。',"核对合并目标及完整正文，再检查 检查门槛。",'正式发布会修改该本地目标，并保留回滚点。')
  :helpInfo('新建母模板','让有独立任务价值的候选成为一张新母模板。',"核对重复程度、编号、参数和来源，再检查 检查门槛。",'选模式只是准备，点正式发布才改变本地库。');
 for(const attr of Object.keys(HELP_ATTRIBUTE_RULES)){if(el.hasAttribute(attr))return HELP_ATTRIBUTE_RULES[attr];}
 const exact={
  navLayoutReset:helpInfo('恢复顶部布局','把按个人习惯排序的顶部功能恢复默认位置。','也可拖动功能按钮，或聚焦后用 Alt 加方向键排序。','只改变布局，内容和已打开窗口保留。'),
  navReadingBtn:helpInfo('全局阅读','统一调节主页和各窗口的字号与行距。','打开设置，选 90% 至 140% 的比例；显示偏好会记住。',"不修改 提示词 正文。"),
  navCountToggle:helpInfo(/显示/.test(txt)?'显示主页数字':'隐藏主页数字','让随手记和工作区入口按你的整洁偏好显示或隐藏角标。','再次点击可切回；设置会记住并随工作区备份保存。','只影响这两个主页入口；窗口内的数量、分页和统计始终保留。'),
  navScratchBtn:HELP_ATTRIBUTE_RULES['data-scratch-open'],
  contextScratchBtn:HELP_ATTRIBUTE_RULES['data-scratch-open'],contextReadBtn:HELP_ATTRIBUTE_RULES['data-reading-open'],
  readingScale:helpInfo('阅读字号与行距','让主页和窗口文字更容易阅读，或更紧凑。','拖动到 90%–140% 的合适比例，或者选择预设。','设置同步所有窗口并记住，实际提示词正文不变。'),
  q:helpInfo('主页搜索与需求匹配','快速找模板，或从一个完整任务开始找适合的方法。','输入关键词立即筛选当前模板库；描述目标、材料与产出后点匹配模板或按回车。按 / 可聚焦。','需求匹配由本地规则完成，不调用在线模型生成任务答案。'),
  needBtn:helpInfo('需求导航','不确定选哪种模板时，用日常语言描述任务来比较候选。','写目标、材料、受众和产出；可继续补充条件，再进入合适模板填参数。','本地规则推荐需要你复核，不是模型回答。'),
  needInput:helpInfo('描述任务','告诉系统你要解决什么问题，好推荐更合适的模板。','例如“把行业报告整理成给管理层的三页汇报”；补充材料、受众与输出格式会更准确。','再次提交会加入本次累计需求；换任务请重新开始。'),
  importBtn:helpInfo("从文件导入个人提示词",'把手头已有的提示词文件放进个人模板库。',"上传 TXT、Markdown 或 提示词 JSON，核对只读预览后确认；之后在工作区编辑。",'文件只在本地读取；工作区备份 JSON 应通过工作区恢复入口处理。'),
  importFile:helpInfo('选择提示词文件','读取已有文件并生成待核对的导入预览。','支持 Excel、CSV、TSV、TXT、Markdown 和 JSON；单文件 20 MB、本批 40 MB，核对工作表、正文列和勾选后确认。','选择文件不等于保存记录；不上传到服务器，不支持工作区备份格式。'),
  devlogBtn:HELP_CONTROL_IDS.devlogFoot,
  tourBtn:helpInfo('操作教程','按当前主题学习从找模板到创建个人版本的完整路径。','跟着高亮步骤操作；不确定某个按钮时还可用帮助模式查看用途。','教程用于学习，实际保存和发布以对应操作的结果为准。'),
  themeBtn:HELP_CONTROL_IDS.fabTheme,
  modeBtn:helpInfo('主题场景','在当前主题内挑选更合适的材质、明暗和环境配色。','选场景后立即应用；需要不同视觉语言可另选主题。','内容与个人数据不变。'),
  mobileBtn:helpInfo('手机布局','在窄屏或偏好紧凑排版时切换移动布局。','手机浏览器默认适配；也可手动切换。','桌面自由拖动和缩放受视口与移动布局约束。'),
  sort:helpInfo('模板排序','按质量评分或编号调整当前模板结果顺序。','先筛选任务范围，再选择排序方式。','个人模板不按母模板评分评价。')
 };
 if(exact[id])return exact[id];
 if(el.hasAttribute('data-window-maximize'))return helpInfo('最大化与还原','专注阅读当前窗口，或回到多窗口对照。','一键占满浏览器可用区域，再点还原原位置和大小；桌面也可双击标题空白处。','只改变窗口尺寸，不关闭其他窗口。');
 if(el.hasAttribute('data-resize-dir'))return helpInfo('调整窗口大小','按阅读习惯扩大或缩小当前窗口。','从四边或四角拖动，标题空白处用于移动。','尺寸受最小可用范围和浏览器视口限制。');
 if(el.matches('.card')){const c=DATA.find(x=>x.id===el.dataset.id);return helpInfo(c?.name||'模板卡片',c?.task||c?.desc||'查看这一模板的任务、参数与完整提示词。','进入工作台先核对适用范围，填参数后复制；要长期改写可派生个人版。','查看卡片不会自动执行 AI 任务。');}
 if(el.hasAttribute('data-field'))return helpInfo('填写模板变量',`把「${el.dataset.field.replace(/^\[|\]$/g,'')}」替换为本次任务的具体内容。`,'填写后成稿预览实时更新；复制前检查未填写的占位符。',"临时参数草稿不是持久备份；重要输入请保留在随手记或个人提示词。");
 if(el.matches('[data-view],[data-go]')){
  const view=el.dataset.view||el.dataset.go;
  const kind=/overview|origin|recipe|intro|core-overview/.test(view)?'overview':/input|coord|param|core-inputs/.test(view)?'inputs':/source|provenance|archive|core-sources/.test(view)?'sources':/prompt|signal|spell|chapter|core-prompt/.test(view)?'prompt':null;
  const g={overview:['模板概览','判断模板是否适合本次任务。','先看用途、适用范围、产出和使用边界，再决定填参数或派生个人版。'],inputs:['模板参数','把通用方法变成你的具体任务。','填入目标、材料和约束，成稿预览会同步更新；复制前核对空白占位符。'],sources:['模板来源','核对母模板整合了哪些原始提示词和署名。','阅读整理说明与来源摘录，需要时回查提示词广场全文。'],prompt:['完整提示词','检查填参后的成稿，再交给你使用的 AI 工具。','先确认变量和输出要求；复制成稿带上参数，复制原模板保留通用占位符。']}[kind];
  return g?helpInfo(...g,'切换页签不丢失本次已填参数；本页不调用模型。'):helpInfo(txt||'模板页签','查看当前模板的一部分资料，帮助判断并完成任务。','核对用途和参数后再复制成稿；来源疑问可查看来源页。','切换视图不修改模板原文。');
 }
 if(el.hasAttribute('data-source'))return helpInfo('来源摘录','理解这张母模板融合前的原文与来源说明。','阅读摘录并核对署名；有广场回链时可继续查看完整发布记录。','署名发布者不等于唯一原创作者。');
 if(el.hasAttribute('data-profile'))return helpInfo('输出表达偏好','让本次成稿符合需要的表达方式。','选择中性、精炼或探索表达，再查看更新后的提示词预览。','只调整本次组装，不改写原模板。');
 if(el.matches('[data-world]'))return HELP_CONTROL_IDS.fabTheme;
 if(el.matches('.scene-choice'))return exact.modeBtn;
 if(el.hasAttribute('data-cat'))return helpInfo('分类筛选','按任务类别缩小模板范围。',el.dataset.cat==='all'?'显示全部分类。':`显示「${catInfo(el.dataset.cat)[0]}」中的模板。`,'仍可结合关键词查找。');
 if(el.matches('[data-k],[data-tag]'))return helpInfo('快捷检索',`用「${el.dataset.k||el.dataset.tag}」找相关模板。`,'需要更精确时可继续编辑搜索词。','只改变显示结果。');
 if(el.hasAttribute('data-chapter'))return helpInfo('提示词章节','分段阅读当前模板的指令，减少长文阅读负担。','按章节核对内容，再复制需要的提示词。','换章不修改原文或已填参数。');
 if(el.hasAttribute('data-neighbor'))return helpInfo('相邻模板','比较前后模板的方法和适用场景。','打开相邻模板，再判断哪张更适合任务。','切换模板不创建个人记录。');
 const action=el.dataset.action||'',home=el.dataset.homeAction||'';
 const actions={copy:helpInfo('复制成稿','复制已经填入参数的完整提示词。','先检查尚未填的变量，再到你的 AI 工具粘贴执行。','复制不会自动提交模型任务。'),'copy-raw':helpInfo('复制原模板','保留通用正文与变量占位符，便于在别处复用。','需要本次填参结果时请改用复制成稿。','不包含本次填写的参数。'),record:helpInfo('记录这次组装','为当前模板留下本次参数、成稿和随手记的观察快照。','适合比较不同输入和后续效果；来源页可查看与复制观测记录。','不是真正的模型效果测评；刷新前请复制重要记录留底。'),'copy-log':helpInfo('复制观测记录','导出当前模板的组装观察记录用于比较。','复制记录中的时间、参数完成度、备注和成稿，到外部文档留存。','没有观测记录时需先记录一次组装。'),download:helpInfo('导出成稿','把当前组装的提示词保存为本地文本文件。','核对参数后下载，供外部工具使用或备份。'),scene:exact.modeBtn,worlds:exact.themeBtn};
 if(actions[action])return actions[action];
 const homes={random:helpInfo('随机探索','在当前筛选中发现一个可能有用的模板。','打开后核对用途和边界，再决定使用。'),search:exact.q,need:exact.needBtn,import:exact.importBtn,reset:helpInfo('清除主页筛选','取消关键词与分类限制，重新浏览模板。','搜索没有结果时可清除，再缩小任务范围。','不删除模板或个人记录。'),'rotate-hero':helpInfo('换一句主题文案','切换主页展示的主题句子。','点击立即换句，也会按主题规则轮换。','不影响提示词和个人内容。')};
 if(homes[home])return homes[home];
 if(el.matches('.copybtn,.scopy'))return helpInfo('复制当前内容','把当前显示的提示词或来源全文复制到剪贴板。','在目标工具粘贴使用，复制前核对内容和参数。','不删除原记录。');
 if(el.matches('[type="submit"]')){
  if(el.closest('#needGatewayForm'))return exact.q;
  if(el.closest('#needForm'))return helpInfo('匹配并生成适配提示词','根据本次累计需求推荐模板，并组合一份可复制的提示词。','提交后比较候选；可继续补条件，再进入模板填写。','本地规则匹配，不是在线模型作答。');
 }
 if(el.matches('.close,[data-utility-close],[data-panel-close],[data-personal-close],[data-scratch-close],[data-reading-close],[data-lifecycle-close],[data-lifecycle-cancel],[data-version-close],[data-promotion-close],[data-promotion-cancel],[data-curation-close],[data-release-close],[data-audit-close]')||['close','close-scene','close-worlds'].includes(action)){
  const editing=el.closest('#promptLifecycleOverlay');
  return helpInfo(editing?'取消当前编辑':'关闭当前窗口',editing?'结束这次编辑，回到已有个人记录。':'收起当前窗口，继续操作旁边的其他窗口或主页。',editing?'需要保留改动请先保存版本。':'需要时从对应入口重新打开。',editing?'尚未保存的编辑不会形成新版本。':'已保存的数据保留；其他独立窗口继续存在。');
 }
 if(el.matches('summary'))return helpInfo(txt||'补充资料','按需展开当前内容的说明、证据或历史。','展开后核对明细，再收起腾出空间。','展开与收起不修改记录。');
 if(el.matches('a[href]'))return helpInfo(txt||'参考链接','查看这条记录关联的外部参考资料。','核对链接来源与内容，再用于判断。','离线环境可能无法访问外部页面。');
 if(el.matches('.tskip'))return helpInfo('跳过教程','结束本次引导，按自己的节奏使用系统。','需要重新学习时从主页教程入口开始。','不删除个人内容。');
 if(el.matches('.tprev'))return helpInfo('教程上一步','重新查看前一步的操作路径和说明。','适合刚才没看清或想复习时使用。','切换引导位置，不替你保存或发布。');
 if(el.matches('.tnext'))return helpInfo('教程下一步','继续学习下一项操作或完成本次教程。','阅读高亮区域的说明，必要时按提示操作，再继续。','引导会打开需要讲解的页面，保存和发布需你实际操作。');
 // Unknown controls get an honest context cue, never an invented action description.
 const context=el.closest('[role="dialog"],.utilityView,.srcview,.context-flyout,.ws');
 const label=context?.querySelector('.uv-title,h1,h2,.context-flyout-head strong')?.textContent?.trim();
 if(el.matches('button,[role="button"],input,textarea,select'))return helpInfo(txt.slice(0,60)||'当前控件',`这个控件位于${label?`「${label}」`:'当前页面'}，详细用途尚未配置。`,'可先查看本页介绍或操作教程；不确定它是否会更改数据时，先保留现有内容。','查看帮助不会执行此控件；这里不推测未配置的操作结果。');
 return null;
}

let HELP_MODE=false,HELP_HOT=null,HELP_PENDING_TARGET=null;
const HELP_CONTROL_SELECTOR='button:not([data-help-skip]),.card,[role="button"],input:not([type="hidden"]),textarea,select,summary,a[href]';
function decorateHelp(root=document){
 const els=[...(root.matches?.(HELP_CONTROL_SELECTOR)?[root]:[]),...root.querySelectorAll(HELP_CONTROL_SELECTOR)];
 els.forEach(el=>{if(el.closest('#helpPopover')||el.dataset.helpSkip!==undefined)return;const info=helpDescription(el);if(!info)return;el.classList.add('helpable');el.dataset.helpTitle=info[0];el.dataset.helpText=info[1];});
}
function helpTarget(start){
 const target=start?.closest?.(HELP_CONTROL_SELECTOR);
 return target&&!target.closest('#helpPopover')&&target.dataset.helpSkip===undefined?target:null;
}
function clearHelpHot(){if(HELP_HOT){HELP_HOT.classList.remove('help-hot');HELP_HOT=null;}}
function setHelpMode(on,announce=true){
 HELP_MODE=!!on;document.body.classList.toggle('help-mode',HELP_MODE);
 const btn=$('#helpModeBtn'),ctx=$('#contextHelpBtn'),hint=$('#helpModeHint'),ctxLabel=$('#contextHelpLabel');
 if(btn){btn.classList.toggle('on',HELP_MODE);btn.setAttribute('aria-pressed',String(HELP_MODE));btn.title=HELP_MODE?'帮助模式开启中：点击退出并恢复正常操作':'帮助模式：开启后点击任意高亮控件查看作用';}
 if(ctx){ctx.classList.toggle('on',HELP_MODE);ctx.setAttribute('aria-pressed',String(HELP_MODE));ctx.title=HELP_MODE?'帮助模式开启中：点击退出并恢复正常操作':'开启当前子界面帮助';}
 if(ctxLabel)ctxLabel.textContent=HELP_MODE?'帮助中':'帮助';
 if(hint)hint.hidden=!HELP_MODE;
 if(!HELP_MODE){HELP_PENDING_TARGET=null;closeHelp();clearHelpHot();}
 if(announce)notifyLocal(HELP_MODE?'帮助模式已开启：当前点击只看说明，不执行按钮；顶部状态条可随时退出。':'帮助模式已关闭，所有控件已恢复正常操作。');
}
function showHelp(target){
 const info=helpDescription(target);if(!info)return;
 const pop=$('#helpPopover');$('#helpTitle').textContent=info[0];$('#helpText').textContent=info[1];
 target.dataset.helpTitle=info[0];target.dataset.helpText=info[1];
 const note=target.disabled?(target.hasAttribute('data-file-import-commit')?'当前不可用：请先选择有效文件并通过预览校验。':"当前不可用：请先核对本页的必填项、状态或 检查门槛 阻断提示。"):'';
 if(note)$('#helpText').textContent+='\n\n'+note;
 const run=$('#helpPopover [data-help-exit-run]');if(run){run.disabled=!!target.disabled;run.textContent=target.matches('input,textarea,select')?'退出帮助并填写':'退出帮助并继续操作';}
 pop.hidden=false;if(typeof focusFloatingWindow==='function')focusFloatingWindow(pop);
 const r=target.getBoundingClientRect();requestAnimationFrame(()=>{if(typeof adjustableDesktop==='function'&&adjustableDesktop()&&pop.dataset.windowMoved==='true'){floatingKeepInView(pop);return;}const pr=pop.getBoundingClientRect();let left=r.right+10;if(left+pr.width>innerWidth-10)left=Math.max(10,r.left-pr.width-10);let top=Math.max(10,Math.min(innerHeight-pr.height-10,r.top));if(innerWidth<640){left=Math.max(10,(innerWidth-pr.width)/2);top=(r.bottom+10+pr.height<innerHeight)?r.bottom+9:Math.max(10,r.top-pr.height-9);}pop.style.left=left+'px';pop.style.top=top+'px';});
}
function closeHelp(){const p=$('#helpPopover');if(p)p.hidden=true;}
function nudgeHelpMode(){
 const hint=$('#helpModeHint');if(!hint||hint.hidden)return;
 hint.classList.remove('attn');void hint.offsetWidth;hint.classList.add('attn');
 setTimeout(()=>hint.classList.remove('attn'),500);
}
document.addEventListener('pointermove',e=>{if(!HELP_MODE)return clearHelpHot();if(e.target.closest('#helpPopover,#helpModeBtn,#contextHelpBtn'))return clearHelpHot();const target=helpTarget(e.target);if(target===HELP_HOT)return;clearHelpHot();if(target){HELP_HOT=target;HELP_HOT.classList.add('help-hot');}},{passive:true});
document.addEventListener('click',e=>{
 if(e.target.closest('#helpModeBtn,#contextHelpBtn'))return;
 const exit=e.target.closest('[data-help-exit]');if(exit){e.preventDefault();e.stopImmediatePropagation();setHelpMode(false);return;}
 const run=e.target.closest('[data-help-exit-run]');if(run){e.preventDefault();e.stopImmediatePropagation();const target=HELP_PENDING_TARGET;setHelpMode(false,false);notifyLocal('帮助模式已关闭，继续执行刚才的操作。');if(target&&target.isConnected&&!target.disabled)requestAnimationFrame(()=>{if(target.matches('input,textarea,select'))target.focus();else target.click();});return;}
 if(e.target.closest('#helpPopover .hp-close')){e.preventDefault();e.stopImmediatePropagation();closeHelp();return;}
 if(HELP_MODE){const target=helpTarget(e.target);if(target&&!target.closest('#helpPopover')){e.preventDefault();e.stopImmediatePropagation();HELP_PENDING_TARGET=target;showHelp(target);nudgeHelpMode();return;}}
 if(!(typeof adjustableDesktop==='function'&&adjustableDesktop())&&!e.target.closest('#helpPopover'))closeHelp();
},true);
$('#helpModeBtn').addEventListener('click',()=>setHelpMode(!HELP_MODE));
// Added controls are decorated locally; click-time resolution also covers the observer delay.
let helpDecorateTimer=0;const helpAddedRoots=new Set();
new MutationObserver(records=>{
 for(const record of records)for(const node of record.addedNodes){if(node.nodeType===1&&!node.closest('#helpPopover'))helpAddedRoots.add(node);}
 if(!helpAddedRoots.size)return;
 clearTimeout(helpDecorateTimer);helpDecorateTimer=setTimeout(()=>{for(const root of helpAddedRoots)if(root.isConnected)decorateHelp(root);helpAddedRoots.clear();},30);
}).observe(document.body,{childList:true,subtree:true});
document.addEventListener('pointerdown',e=>{
 if(!HELP_MODE)return;const target=helpTarget(e.target);
 if(target&&(target.disabled||target.matches('input,textarea,select'))){e.preventDefault();e.stopImmediatePropagation();HELP_PENDING_TARGET=target;showHelp(target);nudgeHelpMode();}
},true);
document.addEventListener('keydown',e=>{
 if(!HELP_MODE)return;
 if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();setHelpMode(false);return;}
 const target=helpTarget(e.target);
 const copyShortcut=(e.ctrlKey||e.metaKey)&&['c','a'].includes(e.key.toLowerCase());
 if(target?.matches('input,textarea,select')&&e.key!=='Tab'&&!copyShortcut){e.preventDefault();e.stopImmediatePropagation();HELP_PENDING_TARGET=target;showHelp(target);}
},true);
document.addEventListener('beforeinput',e=>{
 if(!HELP_MODE)return;const target=helpTarget(e.target);
 if(target){e.preventDefault();e.stopImmediatePropagation();HELP_PENDING_TARGET=target;showHelp(target);}
},true);
document.addEventListener('submit',e=>{
 if(!HELP_MODE)return;e.preventDefault();e.stopImmediatePropagation();
 const target=e.submitter||e.target.querySelector('[type="submit"]');
 if(target){HELP_PENDING_TARGET=target;showHelp(target);nudgeHelpMode();}
},true);
function syncContextHelp(){/* P62: controls are available on the home navigation. */}

const CAT_HINTS={
 '01':['写作','文章','润色','改写','校对','论文','小说','故事','文稿'], '02':['总结','摘要','读书','书籍','长文','拆解','报告速读'], '03':['研究','调研','github','开源','资料','信息搜集'], '04':['分析','决策','原因','根因','为什么','选择','比较'], '05':['学习','教学','教师','备课','英语','课程','费曼'], '06':['创意','点子','头脑风暴','命名','冒险','世界观'], '07':['营销','增长','社媒','小红书','seo','电商','品牌','销售','用户画像','短视频'], '08':['商业','战略','商业模式','创业','市场','竞品'], '09':['办公','公文','面试','简历','求职','ppt','汇报','公司'], '10':['数据','统计','分析数据','图表'], '11':['代码','编程','bug','项目接管','代码库','技术'], '12':['产品','prd','需求','功能','设计','迭代'], '13':['prompt','提示词','agent','skill','ai','json','格式'], '14':['图片','绘图','midjourney','视频','分镜','seedance','镜头'], '15':['时间管理','拖延','效率','复盘','生产力','目标']};
const CARD_HINTS={
 'PC-01-004':['毕业论文','本科论文','论文自查','答辩'], 'PC-01-005':['写小说','小说创作','长篇小说','故事大纲'], 'PC-02-001':['总结一本书','读书笔记','拆书','讲书'], 'PC-03-001':['github项目','开源项目','仓库','技术选型'], 'PC-04-001':['第一性原理','苏格拉底','六角度','决策矩阵','根因'], 'PC-05-003':['英语口语','英语对话','英文纠错'], 'PC-07-002':['公众号','小红书','社交媒体','爆款标题','社媒'], 'PC-09-002':['模拟面试','面试官','面试练习'], 'PC-09-003':['改简历','写简历','求职信'], 'PC-09-004':['做ppt','ppt大纲','演讲稿','汇报'], 'PC-09-005':['选公司','公司尽调','offer','岗位分析'], 'PC-11-001':['接手代码','已有代码','遗留项目','修bug'], 'PC-13-001':['不知道怎么写prompt','帮我写提示词','模糊需求'], 'PC-13-002':['优化prompt','提示词优化','提示词工程'], 'PC-13-006':['agents.md','agent规范','项目记忆'], 'PC-13-007':['做skill','skill.md','经验资产化'], 'PC-14-001':['ai绘图','文生图','mj','midjourney'], 'PC-14-002':['视频分镜','视频提示词','seedance','复刻视频']};
function normText(v){return String(v||'').toLowerCase().replace(/\s+/g,'').replace(/[，。！？、；：,.!?;:'"“”‘’（）()【】\[\]{}<>《》]/g,'');}
function grams(v){const s=normText(v),set=new Set();for(let i=0;i<s.length-1;i++){const g=s.slice(i,i+2);if(!/[的了和是在有我你想要帮给把与及]/.test(g))set.add(g);}return set;}
function needScore(card,need){const q=normText(need),corpus=normText([card.name,card.sub,card.task,card.fit,(card.tags||[]).join(','),card.cat].join('|'));let score=0;const reasons=[];
 if(q.includes(normText(card.name))&&card.name.length>2){score+=28;reasons.push('名称直接命中');}
 for(const tag of card.tags||[]){const t=normText(tag);if(t.length>=2&&q.includes(t)){score+=9;reasons.push(tag);}}
 for(const h of CAT_HINTS[card.catId]||[]){if(q.includes(normText(h))){score+=5;reasons.push(h);}}
 for(const h of CARD_HINTS[card.id]||[]){if(q.includes(normText(h))){score+=16;reasons.push(h);}}
 const qg=grams(q),cg=grams(corpus);let hit=0;qg.forEach(g=>{if(cg.has(g))hit++;});if(qg.size)score+=Math.min(24,hit/qg.size*30);
 if(card.userImported)score+=2;return {card,score,reasons:[...new Set(reasons)].slice(0,4)};}
function matchNeed(need){return DATA.map(c=>needScore(c,need)).sort((a,b)=>b.score-a.score||b.card.overall-a.card.overall).slice(0,3);}
function needStrength(score){return score>=38?'高度匹配':score>=23?'较匹配':score>=12?'可能相关':'需要更多信息';}
function preferredNeedField(card){const fields=fieldsFor(card),rx=/(需求|任务|内容|文本|原文|问题|情况|主题|材料|项目|公司|岗位|故事|论文|视频|文案|目标|对象|代码)/;return fields.find(f=>rx.test(f.name+f.help))||fields[0]||null;}
function generatedForNeed(card,need){const f=preferredNeedField(card);let body=TPL[card.id]||card.tpl;if(f)body=body.split(f.key).join(need);return `## 用户原始需求\n${need}\n\n${body}`;}
let NEED_CONTEXT=[];
function resetNeedThread(){NEED_CONTEXT=[];const th=$('#needThread');if(th)th.innerHTML='<div class="need-bubble ai">告诉我你现在想完成什么。不需要先想“这属于哪一类”，只要说目标、材料和想要的结果即可。</div>';if($('#needInput'))$('#needInput').value='';decorateHelp($('#needOverlay'));}
function openNeedNavigator(seed='',autoRun=false){resetNeedThread();openUtility('#needOverlay');setTimeout(()=>{const input=$('#needInput');if(seed&&input)input.value=seed;if(autoRun&&seed){input.value='';appendNeedExchange(seed);}else input?.focus();},40);}
function appendNeedExchange(text){NEED_CONTEXT.push(text);const all=NEED_CONTEXT.join('\n补充：');const matches=matchNeed(all),best=matches[0];const thread=$('#needThread');thread.insertAdjacentHTML('beforeend',`<div class="need-bubble user">${esc(text)}</div>`);let html='<div class="need-bubble ai">';if(!best||best.score<8){html+='我还不够确定。可以再补充一句：你最后想产出什么、手头已经有什么材料、给谁使用。';}else{html+=`我先按你目前的描述匹配到以下方向。第一候选是 <b>${esc(best.card.name)}</b> <span class="match-badge">${needStrength(best.score)}</span>。`+matches.map((m,i)=>`<div class="need-result"><h4>${i+1}. ${esc(m.card.name)} <span class="match-badge">${needStrength(m.score)}</span></h4><p>${esc(m.card.task)}${m.reasons.length?' · 命中：'+esc(m.reasons.join(' / ')):''}</p><div class="w-actions" style="margin-top:7px"><button class="w-btn small" data-need-use="${m.card.id}">进入模板继续填写</button>${i===0?'<button class="w-btn small" data-need-copy="'+m.card.id+'">复制自动生成提示词</button>':''}</div>${i===0?`<details class="need-prompt"><summary>查看已适配的提示词</summary><pre>${esc(generatedForNeed(m.card,all))}</pre></details>`:''}</div>`).join('');}html+='</div>';thread.insertAdjacentHTML('beforeend',html);thread.scrollTop=thread.scrollHeight;decorateHelp(thread);}
$('#needForm').addEventListener('submit',e=>{e.preventDefault();const v=$('#needInput').value.trim();if(!v){notifyLocal('请先描述你想完成的事。');return;}$('#needInput').value='';appendNeedExchange(v);});
document.addEventListener('submit',e=>{if(e.target.id!=='needGatewayForm')return;e.preventDefault();const input=e.target.querySelector('#q'),v=input?.value.trim();if(!v){notifyLocal('先用一句话告诉我你想完成什么。');input?.focus();return;}openNeedNavigator(v,true);},false);
document.addEventListener('click',e=>{const ex=e.target.closest('[data-need-example]');if(ex){$('#needInput').value=ex.dataset.needExample;$('#needInput').focus();return;}if(e.target.closest('[data-need-reset]')){resetNeedThread();$('#needInput').focus();return;}const use=e.target.closest('[data-need-use]');if(use){const c=DATA.find(x=>x.id===use.dataset.needUse);if(!c)return;const need=NEED_CONTEXT.join('\n补充：'),f=preferredNeedField(c);if(f)draftFor(c).values[f.key]=need;closeUtility('#needOverlay');openCard(c.id);return;}const cp=e.target.closest('[data-need-copy]');if(cp){const c=DATA.find(x=>x.id===cp.dataset.needCopy);if(c)copyText(generatedForNeed(c,NEED_CONTEXT.join('\n补充：')),cp);return;}const close=e.target.closest('[data-utility-close]');if(close){closeUtility(close.dataset.utilityClose==='need'?'#needOverlay':'#importOverlay');return;}},false);
$('#needOverlay').addEventListener('click',e=>{if(e.target.id==='needOverlay')closeUtility('#needOverlay');});

function inferImportCat(text){let best='13',score=-1;const q=normText(text);for(const [id,arr] of Object.entries(CAT_HINTS)){let s=0;arr.forEach(k=>{if(q.includes(normText(k)))s+=1;});if(s>score){score=s;best=id;}}return best;}
function saveUserRecords(){try{if(WorkspaceStore.setPersonalRecords)WorkspaceStore.setPersonalRecords(USER_IMPORT_RECORDS);else WorkspaceStore.setItem(USER_IMPORT_KEY,JSON.stringify(USER_IMPORT_RECORDS));return true;}catch(e){return false;}}
function renderImportCats(){const sel=$('#importCat');if(!sel||sel.options.length>1)return;for(const id of Object.keys(CATS)){const o=document.createElement('option');o.value=id;o.textContent=`${id} · ${CATS[id][0]}`;sel.appendChild(o);}}
function renderImportList(){/* Personal assets are managed in My Workspace. */}
function openImportManager(){openUtility('#importOverlay');setTimeout(()=>$('#importFile')?.focus(),30);}
function clearImportForm(){['#importTitle','#importTags','#importDesc','#importPrompt'].forEach(sel=>{if($(sel))$(sel).value='';});if($('#importCat'))$('#importCat').value='auto';if($('#importFile'))$('#importFile').value='';}
function addImportedRecord(record,{render=true}={}){if(!guardPersonalWrite())return false;USER_IMPORT_RECORDS.push(record);const card=importedRecordToCard(record);DATA.push(card);TPL[card.id]=card.tpl;refreshLibraryStats();const persisted=saveUserRecords();if(render){renderImportList();renderHome();}return {card,persisted};}
function removeImportedRecord(id){if(!guardPersonalWrite())return false;const ix=USER_IMPORT_RECORDS.findIndex(r=>r.id===id);if(ix<0)return;USER_IMPORT_RECORDS.splice(ix,1);const di=DATA.findIndex(c=>c.id===id);if(di>=0)DATA.splice(di,1);delete TPL[id];drafts.delete(id);refreshLibraryStats();const persisted=saveUserRecords();if(activeCard?.id===id)closeModal();renderImportList();renderHome();if(!persisted)notifyLocal('已从当前页面移除，但浏览器未允许写入持久化存储。');}
function uniqueImportId(catId,seed=''){let base=seed&&/^USR-/.test(seed)?seed:'USR-'+catId+'-'+Date.now().toString(36).toUpperCase();let id=base,n=2;while(DATA.some(c=>c.id===id)||USER_IMPORT_RECORDS.some(r=>r.id===id))id=base+'-'+n++;return id;}
function cleanImportRecord(src,fileName='JSON 导入'){const title=String(src.title||src.name||"未命名个人提示词").trim(),raw=String(src.rawPrompt||src.prompt||src.tpl||src.content||src.text||'').trim();if(!raw)return null;const tags=Array.isArray(src.tags)?src.tags.map(x=>String(x).trim()).filter(Boolean):[],desc=String(src.desc||src.description||'').trim(),catId=(src.catId&&CATS[src.catId])?src.catId:inferImportCat(title+' '+tags.join(' ')+' '+desc+' '+raw);return {...src,id:uniqueImportId(catId,src.id),title,catId,tags:[...new Set(['个人导入',...tags])],desc,prompt:normalizeImportedTemplate(raw),rawPrompt:raw,file:src.file||fileName,importedAt:new Date().toLocaleString('zh-CN',{hour12:false})};}
function restoreImportBackup(items,fileName='JSON 备份'){if(!guardPersonalWrite())return false;const reserved=new Set([...DATA.map(c=>c.id),...USER_IMPORT_RECORDS.map(r=>r.id)]),clean=[];for(const item of items){const r=cleanImportRecord(item,fileName);if(!r)continue;let base=r.id,n=2;while(reserved.has(r.id))r.id=base+'-'+n++;reserved.add(r.id);clean.push(r);}if(!clean.length){notifyLocal("JSON 中没有找到可导入的 提示词 正文。");return 0;}clean.forEach(r=>addImportedRecord(r,{render:false}));refreshLibraryStats();const persisted=saveUserRecords();renderImportList();renderHome();notifyLocal(`已恢复 ${clean.length} 条个人提示词${persisted?'。':'；当前可用，但浏览器未允许持久化存储。'}`);return clean.length;}
async function exportWorkspaceBackup(){
 try{await WorkspaceStore.flush();downloadLocalJSON(WorkspaceStore.snapshot(),`AI_Playbook_工作区备份_v${RELEASE_MANIFEST.version}_${new Date().toISOString().slice(0,10)}.json`);notifyLocal('完整备份已生成，请保留下载的JSON文件。');if($('#localBackupStatus'))$('#localBackupStatus').textContent='完整备份已生成；请保留下载的JSON文件。';}
 catch(e){notifyLocal('备份没有生成：最近保存未完成，请重试。');}
}

function exportUserPrompts(){if(!USER_IMPORT_RECORDS.length){notifyLocal("还没有可导出的个人提示词。");return;}const blob=new Blob([JSON.stringify({schema:'ai-playbook-personal-prompts-v1',exportedAt:new Date().toISOString(),items:USER_IMPORT_RECORDS},null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='AI_Playbook_个人提示词备份.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notifyLocal("个人提示词 JSON 备份已导出，可在“导入”中整批恢复。");}
document.addEventListener('click',e=>{if(e.target.closest('[data-import-export]'))exportUserPrompts();if(e.target.closest('[data-workspace-export]'))exportWorkspaceBackup();if(e.target.closest('[data-workspace-import]'))$('#workspaceBackupFile')?.click();});
$('#workspaceBackupFile')?.addEventListener('change',e=>{const file=e.target.files?.[0];if(file)restoreWorkspaceBackupFile(file);e.target.value='';});
$('#importOverlay').addEventListener('click',e=>{if(e.target.id==='importOverlay')closeUtility('#importOverlay');});
$('#importBtn').addEventListener('click',openImportManager);

