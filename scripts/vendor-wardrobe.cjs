// Regenerate the isolated rendering capsule from the pinned, local upstream.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const base=path.resolve(process.env.DOL_UPSTREAM_SOURCE||path.resolve(__dirname,'../../../upstream/vanilla-0.5.11.9-source'));
const game=path.join(base,'game');
const commit=require('node:child_process').execFileSync('git',['-C',base,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(commit!=='41993d3f32476f0b1c8db730c159a50ffcdc2a65')throw Error('Unexpected upstream revision');
function read(p){return fs.readFileSync(path.join(game,p),'utf8').replaceAll('\r\n','\n')}
function functions(p,names){const source=read(p),ast=ts.createSourceFile(p,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);return names.map(name=>{const n=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name.text===name);if(!n)throw Error(name);return n.getText(ast)}).join('\n')}
function assignedFunctions(p,names){const source=read(p),ast=ts.createSourceFile(p,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);return names.map(name=>{const n=ast.statements.find(n=>ts.isExpressionStatement(n)&&ts.isBinaryExpression(n.expression)&&n.expression.left.getText(ast)==='window.'+name);if(!n)throw Error(name);return 'const '+name+' = '+n.expression.right.getText(ast)+';'}).join('\n')}
const parts=[
 functions('03-JavaScript/base-clothing.js',['playerChastity','getClothingOptionsItem','getClothingOptions']),
 functions('03-JavaScript/base.js',['integrityKeyword']),
 functions('03-JavaScript/04-Pregnancy/story-functions.js',['playerBellySize']),
 functions('03-JavaScript/sextoys.js',['playerHasStrapon','playerHasButtPlug']),
 functions('base-system/widgets.js',['calculatePenisBulge','apparentbreastsizecheck']),
 functions('04-Variables/hair-defs.js',['hairLengthStringToNumber']),
 functions('03-JavaScript/text-helpers.js',['removeDiacritics','normaliseFileName']),
 read('03-JavaScript/05-renderer/00-canvasmodel.js'),read('04-Variables/canvasmodel-main.js'),read('base-clothing/canvasmodel-img.js')
];
parts.push(functions('03-JavaScript/colour-namer.js',['clamp255','applySepiaFilter','applySaturateFilter','applyHueRotateFilter','applyBrightnessFilter','contrast','applyContrastFilter']),assignedFunctions('03-JavaScript/colour-namer.js',['getCustomColourRGB','parseCSSFilter','getCustomClothesColourCanvasFilter']));
// Upstream silently swallows layer failures. A preview must fail visibly instead.
const guard='if (layer.show) {\n\t\t\t\t\t\tconsole.error';
if(!parts[7].includes(guard))throw Error('Upstream layer guard changed');
parts[7]=parts[7].replace(guard, 'if (layer.show) {\n\t\t\t\t\t\tthrow e;\n\t\t\t\t\t\tconsole.error');
const header=`/* Derived from Degrees of Lewdity, commit 41993d3f32476f0b1c8db730c159a50ffcdc2a65.
 * CC BY-NC-SA 4.0; see UPSTREAM-RENDERER-LICENSE. Generated; do not edit.
 * All stateful free variables below belong to the caller's private snapshot.
 */
export function createIsolatedModel(context) {
const {V,T,setup,Skin,Weather,Time,Transformations,ZIndices,ColourUtils,C,clone}=context;
const window={},Browser={isGecko:false},Errors={report(message){throw Error(message)}};
const Renderer={...context.renderer,CanvasModels:{},CanvasModelCaches:{},ImageCaches:{}};
const macros={};const DefineMacro=(name,fn)=>macros[name]=fn;
const jQuery={extend:Object.assign};
const between=(n,min,max)=>n>=min&&n<=max;
const toTitleCase=s=>s.replace(/\\b\\w/g,c=>c.toUpperCase());
const random=(min,max)=>max===undefined?0:min;
const painToTearsLvl=pain=>Math.floor(Math.min(99,Math.max(0,pain||V.pain))/20);
function clothesIndex(slot,item){const items=setup.clothes[slot];const index=context.clothesIndex?context.clothesIndex(slot,item):items.findIndex(c=>c.variable===item.variable&&c.modder===item.modder);if(index<0)throw Error('Unknown clothing descriptor: '+slot);return index}
function clothingData(slot,item,key){return setup.clothes[slot][clothesIndex(slot,item)][key]}
const tinycolor=rgb=>({toHexString:()=>'#'+[rgb.r,rgb.g,rgb.b].map(n=>Math.round(Math.min(255,Math.max(0,n))).toString(16).padStart(2,'0')).join('')});
`;
const footer=`
const model=Renderer.locateModel('main');
T.modeloptions=model.defaultOptions();
macros['modelprepare-player-body']();macros['modelprepare-player-clothes']();
T.modeloptions.wraithFlash=false;
return {model,options:T.modeloptions,renderer:Renderer};
}
`;
const target=path.resolve(__dirname,'../src/wardrobe/vendor');fs.mkdirSync(target,{recursive:true});
fs.writeFileSync(path.join(target,'isolated-model.js'),header+parts.join('\n')+footer);
fs.copyFileSync(path.join(base,'LICENSE'),path.resolve(__dirname,'../UPSTREAM-RENDERER-LICENSE'));
console.log('Generated isolated wardrobe renderer from pinned local upstream.');
