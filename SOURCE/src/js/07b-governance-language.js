/* P68: display-only Chinese labels. Stored keys, schemas and record IDs keep their original values. */
const GOVERNANCE_TEXT_GLOSSARY=@@GOVERNANCE_TEXT_GLOSSARY@@;
const GOVERNANCE_VALUE_LABELS={
 active:'使用中',draft:'草案',archived:'已归档',pending:'待审查','in-review':'审查中','changes-requested':'待补充修改',approved:'已批准',accepted:'已接受',held:'已暂缓',rejected:'已驳回',resolved:'已处理',open:'待解决',published:'已发布','rolled-back':'已登记回滚',ready:'可回滚',unassigned:'未分配通道',deprecated:'已停用',preview:'预览版',stable:'稳定版',auto:'允许继续',review:'需要审查',block:'暂不可发布',pass:'通过',fail:'未通过',warn:'需复核',high:'高',medium:'中',low:'低',info:'提示',simulated:'已预演',promoted:'已推进通道',
 'add-card':'新增模板','merge-card':'合并模板','same-card':'同一模板冲突',new:'新增',merge:'合并','dry-run':'预演',execute:'执行',evaluate:'评估','review-approved':'审查已批准','review-rejected':'审查已驳回','override-approved':'例外已批准','override-rejected':'例外已驳回','channel-gate-blocked':'通道检查未通过',activate:'启用',rollback:'回滚',created:'已创建','re-check':'复检',blocked:'未通过',
 evidence:'教程与日志版本一致性',provenance:'来源字段覆盖率',parameterization:'变量覆盖率',duplicateRate:'高重复率',duplicates:'重复检查',rollbackCoverage:'回滚准备覆盖率',health:'结构健康度',metadata:'用途与标签完整性',maxSimilarity:'最高文本相似度',tutorialCoverage:'教程版本一致性',devlogCoverage:'日志版本一致性',cards:'模板数',deprecatedVersions:'停用版本数',regression:'质量退步','governance-floor':'最低发布要求',
 'normal-v1':'常规策略第 1 版','strict-v1':'严格策略第 1 版','preview-v1':'预览策略第 1 版','simulation:normal-v1':'模拟常规策略','simulation:strict-v1':'模拟严格策略','simulation:preview-v1':'模拟预览策略',
 'local-reviewer':'本地审查人','local-editor':'本地维护者','system-baseline':'系统初始配置','baseline-migration':'初始配置迁移',
 'promoted-to':'提交为候选','reviewed-by':'对应评审','drafted-as':'形成草案','released-as':'形成发布记录','packaged-as':'生成内容包',targets:'对应模板','included-in':'加入版本批次','registered-as':'登记为版本','deployed-to':'设置为通道版本',
 'health-policy-gap':'健康度未达要求','quality-regression':'发现质量退步','provenance-gap':'来源字段不足','review-pressure':'存在待审事项','remediation-load':'存在待修复阻断','simulation-risk':'模拟风险提示','rollback-signal':'历史回滚提示','no-active-signal':'当前未发现异常',
 'policy-profile':'策略配置审查','policy-profile-activation':'策略启用审查','policy-profile-rollback':'策略还原审查','policy-override':'规则例外审查',candidate:'候选模板',release:'发布记录',quality:'质量观测',audit:'审计追溯',control:'控制中心',intelligence:'治理洞察',reviews:'人工审查',remediation:'修复计划',policy:'发布策略',simulation:'治理模拟',trains:'版本发布'
};
const GOVERNANCE_TEXT_PATTERN=new RegExp('(?<![A-Za-z0-9_-])(?:'+Object.keys(GOVERNANCE_TEXT_GLOSSARY).sort((a,b)=>b.length-a.length).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?![A-Za-z0-9_-])','g');
function governanceLabel(value){const text=String(value??'');return GOVERNANCE_VALUE_LABELS[text]||GOVERNANCE_VALUE_LABELS[text.toLowerCase()]||governanceText(text);}
function governanceText(value){const text=String(value??'');if(GOVERNANCE_VALUE_LABELS[text])return GOVERNANCE_VALUE_LABELS[text];return text.replace(GOVERNANCE_TEXT_PATTERN,term=>GOVERNANCE_TEXT_GLOSSARY[term]).replace(/\bpackages\b/g,'个内容包').replace(/\bcards\b/g,'张模板').replace(/\bactions\b/g,'项操作');}
function governanceEsc(value){return pwEsc(governanceText(value));}


function governanceMetricLabel(key){return ({evidence:"教程与日志一致性",provenance:"来源字段覆盖率",parameterization:"变量覆盖率",duplicateRate:"高重复率",rollback:"回滚准备覆盖率",health:"结构健康度"})[key]||governanceLabel(key);}
