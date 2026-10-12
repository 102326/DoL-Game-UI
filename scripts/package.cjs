'use strict';
const path=require('node:path'),{spawnSync}=require('node:child_process');
const python=process.env.DOL_PYTHON||(process.platform==='win32'?'python':'python3');
if(require.main===module){
 const root=path.resolve(__dirname,'..');
 const check=spawnSync(python,['-c','import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)']);
 if(check.error||check.status!==0){console.error('Packaging needs Python 3.10+. Set DOL_PYTHON to an existing compatible interpreter.');process.exitCode=1}
 else{const result=spawnSync(python,[path.join(root,'scripts/package.py')],{cwd:root,stdio:'inherit'});if(result.error)throw result.error;process.exitCode=result.status??1}
}else module.exports={python};
