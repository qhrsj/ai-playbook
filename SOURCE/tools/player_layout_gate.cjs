/* Resolve authored CSS rules through the established adapter. */
const vm=require('vm'),assert=require('assert'),{make,catalog,read}=require('./combo_action_gate.cjs'),fs=require('fs'),path=require('path');
const h=make(catalog.courses[0]),src=read('tools/layout_tutorial_gate.cjs');h.ctx.assert=assert;
vm.runInContext(src.slice(src.indexOf('function split(s,delim'),src.indexOf("const css=read('src/styles/app.css')")),h.ctx);
let checks=0;h.ctx.authoredCSS=read('src/styles/app.css');
for(const width of [320,430,620,760,900,1280,1920])for(const mobile of [false,true])for(const compact of [false,true]){
 h.doc.body.classList.toggle('m-mode',mobile);h.doc.querySelector('.combo-training-view').dataset.comboCompact=String(compact);h.ctx.testWidth=width;
 for(const [selector,prop,expected] of [['.combo-stage','display','grid'],['.combo-coach','max-height','none'],['.combo-coach','height','100%'],['.combo-coach','border-left','1px solid var(--line)'],['.combo-practice-column','overflow','hidden'],['.combo-playbar','max-height','none']]){h.ctx.node=h.doc.querySelector(selector);h.ctx.prop=prop;assert.equal(h.run('computed(authoredCSS,testWidth,node,prop)'),expected,`${width}/${mobile}/${compact}:${selector}/${prop}`);checks++;}
 h.doc.querySelector('#comboSessionSection').classList.add('combo-completed');h.ctx.node=h.doc.querySelector('.combo-stage');assert.equal(h.run('computed(authoredCSS,testWidth,node,"display")'),'grid');h.doc.querySelector('#comboSessionSection').classList.remove('combo-completed');checks++;
}
fs.writeFileSync(path.resolve(__dirname,'../reports/player-css-gate-results.json'),JSON.stringify({status:'passed',version:catalog.version,phase:catalog.phase,checks,browserRun:false,limitation:'Authored CSS specificity/media resolution; no browser layout or glyph measurements'},null,2));console.log('Player CSS cascade checks passed:',checks);
