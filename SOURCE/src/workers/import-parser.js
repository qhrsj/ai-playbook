/* P67: file parsing in an offline Blob Worker. SheetJS CE is bundled locally. */
const IMPORT_LIMITS={fileBytes:20*1024*1024,expandedBytes:64*1024*1024,rows:10000,columns:128,textBytes:40*1024*1024};
function decodeImportText(buffer){
 const bytes=new Uint8Array(buffer);
 if(bytes[0]===255&&bytes[1]===254)return new TextDecoder('utf-16le').decode(bytes);
 if(bytes[0]===254&&bytes[1]===255)return new TextDecoder('utf-16be').decode(bytes);
 try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes).replace(/^\uFEFF/,'');}
 catch(e){return new TextDecoder('gb18030').decode(bytes);}
}
function splitPromptText(text,mode='whole',base='个人 Prompt'){
 const normalized=String(text).replace(/\r\n?/g,'\n');
 if(mode==='whole')return [{title:base,rawPrompt:normalized,sourceRow:1}];
 const lines=normalized.split('\n'),blocks=[];let current=[],start=1,title='',fence='';
 function finish(){const raw=current.join('\n').trim();if(raw)blocks.push({title:title||base+' · '+(blocks.length+1),rawPrompt:raw,sourceRow:start});current=[];title='';}
 for(let i=0;i<lines.length;i++){
  const line=lines[i],f=line.match(/^\s*(`{3,}|~{3,})/);
  if(f){if(!fence)fence=f[1][0];else if(fence===f[1][0])fence='';}
  const separator=!fence&&mode==='delimited'&&/^\s*===\s*PROMPT\s*===\s*$/i.test(line);
  const heading=!fence&&mode==='headings'&&/^#\s+(.+)$/.exec(line);
  if(separator){finish();start=i+2;continue;}
  if(heading){finish();start=i+1;title=heading[1].trim();}
  current.push(line);
 }
 finish();
 if(blocks.length>IMPORT_LIMITS.rows)throw Error('拆分后超过 10000 条，请分批上传。');
 return blocks;
}
function csvRows(text,preferredDelimiter=''){
 const sample=String(text).split(/\r?\n/).slice(0,6).join('\n');
 function score(sep){let n=0,quoted=false;for(let i=0;i<sample.length;i++){if(sample[i]==='"'){if(quoted&&sample[i+1]==='"')i++;else quoted=!quoted;}else if(!quoted&&sample[i]===sep)n++;}return n;}
 const delimiter=preferredDelimiter||[',','\t',';'].sort((a,b)=>score(b)-score(a))[0];
 const rows=[];let row=[],cell='',quoted=false,line=1,rowLine=1;
 function finishCell(){row.push(cell);cell='';if(row.length>IMPORT_LIMITS.columns)throw Error('表格超过 128 列，请保留提示词相关列后再上传。');}
 function finishRow(){finishCell();if(row.some(v=>String(v).trim()))rows.push({values:row,sourceRow:rowLine});row=[];if(rows.length>IMPORT_LIMITS.rows+1)throw Error('表格超过 10000 条，请分批上传。');rowLine=line+1;}
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(!quoted&&cell.length||quoted&&text[i+1]&&!['\r','\n',delimiter].includes(text[i+1]))throw Error('CSV 引号不完整，请重新导出标准 CSV 文件。');else quoted=!quoted;}
  else if(c===delimiter&&!quoted)finishCell();
  else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;if(quoted)cell+='\n';else finishRow();line++;if(!quoted)rowLine=line;}
  else cell+=c;
 }
 if(quoted)throw Error('CSV 引号未闭合。');
 if(cell.length||row.length)finishRow();
 return rows;
}
function guardXlsxArchive(buffer){
 const view=new DataView(buffer);if(view.byteLength<22||view.getUint32(0,true)!==0x04034b50)throw Error('不是有效的 XLSX 文件，请检查扩展名。');
 let end=-1;for(let i=view.byteLength-22;i>=Math.max(0,view.byteLength-65557);i--)if(view.getUint32(i,true)===0x06054b50&&i+22+view.getUint16(i+20,true)===view.byteLength){end=i;break;}
 if(end<0)throw Error('Excel 文件不完整，无法读取。');
 const count=view.getUint16(end+10,true),offset=view.getUint32(end+16,true);if(count===65535||offset===0xffffffff)throw Error('暂不支持 ZIP64 工作簿，请分小文件导出。');
 if(count>3000)throw Error('工作簿包含过多附加资源，请导出只含提示词的工作表。');
 let total=0,pos=offset;
 for(let i=0;i<count;i++){
  if(pos+46>view.byteLength||view.getUint32(pos,true)!==0x02014b50)throw Error('Excel 压缩结构不完整。');
  if(view.getUint16(pos+8,true)&1)throw Error('加密工作簿不能读取，请解除密码后上传。');
  total+=view.getUint32(pos+24,true);if(total>IMPORT_LIMITS.expandedBytes)throw Error('工作簿展开后超过 64 MB，请移除图片或分批导出。');
  pos+=46+view.getUint16(pos+28,true)+view.getUint16(pos+30,true)+view.getUint16(pos+32,true);
 }
}
function parseImportPayload(buffer,name,progress=()=>{}){
 if(buffer.byteLength>IMPORT_LIMITS.fileBytes)throw Error('单文件超过 20 MB，请分批上传。');
 const ext=String(name).toLowerCase().split('.').pop(),base=String(name).replace(/\.[^.]+$/,'')||'个人 Prompt';
 progress(20);
 if(ext==='xlsx'||ext==='xls'){
  if(ext==='xlsx')guardXlsxArchive(buffer);
  progress(35);const workbook=XLSX.read(new Uint8Array(buffer),{type:'array',dense:true,sheetRows:IMPORT_LIMITS.rows+2,cellFormula:false,cellHTML:false,cellStyles:false,cellText:false});
  if(workbook.SheetNames.length>50)throw Error('工作簿超过 50 个工作表，请分批上传。');
  let totalRows=0,textSize=0;const sheets=[];
  for(const sheetName of workbook.SheetNames){
   const sheet=workbook.Sheets[sheetName];if(!sheet['!ref']){sheets.push({name:sheetName,rows:[]});continue;}
   const range=XLSX.utils.decode_range(sheet['!ref']);
   if(range.e.c>=IMPORT_LIMITS.columns)throw Error('工作表「'+sheetName+'」超过 128 列，请保留提示词相关列。');
   if(sheet['!fullref']&&XLSX.utils.decode_range(sheet['!fullref']).e.r>IMPORT_LIMITS.rows)throw Error('工作表「'+sheetName+'」超过 10000 行，请分批导出。');
   const rows=[];
   for(let r=range.s.r;r<=range.e.r;r++){
    const values=[];let filled=false;
    for(let c=0;c<=range.e.c;c++){
     const cell=sheet['!data']?.[r]?.[c]||sheet[XLSX.utils.encode_cell({r,c})];
     const value=cell?.v==null?'':cell.t==='d'?new Date(cell.v).toISOString():String(cell.v);
     values.push(value);if(value.trim())filled=true;textSize+=value.length*2;
     if(textSize>IMPORT_LIMITS.textBytes)throw Error('表格文字过多，请分批导出。');
    }
    if(filled){rows.push({values,sourceRow:r+1});totalRows++;}
    if(totalRows>IMPORT_LIMITS.rows+workbook.SheetNames.length)throw Error('工作簿合计超过 10000 条，请分批导出。');
   }
   sheets.push({name:sheetName,rows});
  }
  progress(95);return {kind:'table',sheets};
 }
 if(!['txt','md','json','csv','tsv'].includes(ext))throw Error('支持 XLSX、XLS、CSV、TSV、TXT、Markdown 和 JSON 文件。');
 const text=decodeImportText(buffer);if(!text.trim())throw Error('文件内容为空。');
 if(ext==='csv'||ext==='tsv')return {kind:'table',sheets:[{name:'表格',rows:csvRows(text,ext==='tsv'?'\t':'')}]};
 if(ext==='json'){
  let data;try{data=JSON.parse(text);}catch(e){throw Error('JSON 格式不正确。');}
  if(data?.schema==='ai-playbook-workspace-backup-v1'||data?.workspace||data?.schemaVersion&&(data?.personal||data?.preferences))throw Error('这是工作区备份，请到「我的工作区 → 恢复备份」读取。');
  const items=Array.isArray(data)?data:Array.isArray(data?.items)?data.items:[data];
  if(items.length>IMPORT_LIMITS.rows)throw Error('JSON 超过 10000 条，请分批上传。');
  return {kind:'records',items};
 }
 const delimiters=(text.match(/^\s*===\s*PROMPT\s*===\s*$/gmi)||[]).length;
 return {kind:'text',text,mode:delimiters>=2?'delimited':'whole',items:splitPromptText(text,delimiters>=2?'delimited':'whole',base)};
}
self.onmessage=e=>{
 const {id,buffer,name,operation,text,mode,base}=e.data;
 try{
  const result=operation==='split'?{items:splitPromptText(text,mode,base)}:parseImportPayload(buffer,name,value=>self.postMessage({id,progress:value}));
  self.postMessage({id,result});
 }catch(error){self.postMessage({id,error:error?.message||'读取失败，请检查文件。'});}
};
