/* P72: explicit backup/restore compatibility only. Startup never clears user data. */
const WORKSPACE_GOVERNANCE_KEYS=['pb_prompt_candidates_v63','pb_curation_runs_v64','pb_prompt_trash_v65','pb_scratch_trash_v66','pb_release_drafts_v65','pb_release_runs_v65','pb_release_trains_v69','pb_version_registry_v69','pb_release_channels_v616','pb_core_overrides_v65','pb_quality_snapshots_v618','pb_policy_audit_v619','pb_policy_overrides_v619','pb_orchestrator_audit_v620','pb_orchestrator_reviews_v620','pb_review_queue_v621','pb_remediation_v622','pb_policy_profiles_v624','pb_policy_profile_state_v624','pb_policy_profile_audit_v624','pb_governance_simulations_v625'];
const WORKSPACE_OLD_PERSONAL_KEYS=['pb_user_prompts_v55','pb_global_scratch_v1','pb_scratch_archive_v1','pb_favorites_v61','pb_recent_v61'];
function workspaceGovernanceSnapshot(){const storage=window.__PB_TRAINING_STORAGE__||window.localStorage,out={};for(const key of WORKSPACE_GOVERNANCE_KEYS){const v=storage.getItem(key);if(v!==null)out[key]=v;}return out;}
async function commitWorkspaceReplacement(boot,next,governance={}){
 const storage=window.__PB_TRAINING_STORAGE__||window.localStorage,keys=['ai_playbook_workspace_v1',...WORKSPACE_OLD_PERSONAL_KEYS,...WORKSPACE_GOVERNANCE_KEYS];
 const before=Object.fromEntries(keys.map(k=>[k,storage.getItem(k)])),old=boot.workspace;
 let written=false;
 try{
  if(boot.available){await PlaybookDatabase.write(next,true);written=true;}
  else storage.setItem('ai_playbook_workspace_v1',JSON.stringify(next));
  for(const k of [...WORKSPACE_OLD_PERSONAL_KEYS,...WORKSPACE_GOVERNANCE_KEYS]){
   if(WORKSPACE_GOVERNANCE_KEYS.includes(k)&&Object.hasOwn(governance,k))storage.setItem(k,String(governance[k]));else storage.removeItem(k);
  }
  if(boot.available)storage.removeItem('ai_playbook_workspace_v1');
  boot.workspace=next;
 }catch(error){
  let rollbackError;try{for(const [k,v] of Object.entries(before)){if(v===null)storage.removeItem(k);else storage.setItem(k,v);}if(written)await PlaybookDatabase.write(old||{...next,personal:{...next.personal,prompts:[]}},true);}catch(e){rollbackError=e;}
  throw Error('工作区变更未完成。'+(rollbackError?'无法确认写回是否全部完成，请保留当前浏览器与备份文件并重试。':'旧工作区已保留，请检查本地存储后重试。')+' '+error.message);
 }
 return true;
}
