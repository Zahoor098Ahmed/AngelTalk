const fs=require('fs'),path=require('path'),ts=require('../node_modules/typescript');
const root=path.resolve(__dirname,'..');
const excluded=new Set(['AppText.tsx','AppTextInput.tsx']);
const printer=ts.createPrinter({newLine:ts.NewLineKind.LineFeed});
function visit(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
  const file=path.join(directory,entry.name);
  if(entry.isDirectory())visit(file);
  else if(entry.name.endsWith('.tsx')&&!excluded.has(entry.name))rewrite(file);
}}
let changed=0;
function rewrite(file){
  const source=fs.readFileSync(file,'utf8'),tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];
  for(const statement of tree.statements){
    if(!ts.isImportDeclaration(statement)||statement.moduleSpecifier.text!=='react-native')continue;
    const bindings=statement.importClause?.namedBindings;
    if(!bindings||!ts.isNamedImports(bindings))continue;
    const chosen=bindings.elements.filter(item=>['Text','TextInput'].includes((item.propertyName||item.name).text));
    if(!chosen.length)continue;
    const kept=bindings.elements.filter(item=>!chosen.includes(item));
    const updated=ts.factory.updateImportDeclaration(statement,statement.modifiers,
      ts.factory.updateImportClause(statement.importClause,statement.importClause.isTypeOnly,statement.importClause.name,ts.factory.updateNamedImports(bindings,kept)),statement.moduleSpecifier,statement.attributes);
    const additions=chosen.map(item=>{
      const component=(item.propertyName||item.name).text==='Text'?'AppText':'AppTextInput';
      let relative=path.relative(path.dirname(file),path.join(root,'src/components',component)).replaceAll('\\','/');if(!relative.startsWith('.'))relative='./'+relative;
      return `import ${item.name.text} from ${JSON.stringify(relative)};`;
    });
    const text=(kept.length||statement.importClause.name?printer.printNode(ts.EmitHint.Unspecified,updated,tree)+'\n':'')+additions.join('\n');
    edits.push({start:statement.getStart(tree),end:statement.end,text});
  }
  if(!edits.length)return;
  let result=source;for(const edit of edits.reverse())result=result.slice(0,edit.start)+edit.text+result.slice(edit.end);
  fs.writeFileSync(file,result);changed++;
}
visit(path.join(root,'src'));rewrite(path.join(root,'App.tsx'));console.log('Enabled saved text size in',changed,'app components.');
