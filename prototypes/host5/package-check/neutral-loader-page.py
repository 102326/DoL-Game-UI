import json,zipfile,sys,hashlib

engine,bundle,out=sys.argv[1:]
assert hashlib.sha256(open(engine,"rb").read()).hexdigest()=="da00a8c15ec4e88a9e231a3ff6c516c57055f84231bb999f869ed34ade353dab"
assert hashlib.sha256(open(bundle,"rb").read()).hexdigest()=="e509dd57a78b393bf684e98e017bf970e0bdf13ec9440162ef82dc33c103d81e"
s=zipfile.ZipFile(engine).read('sugarcube-2/format.js').decode()
h=json.loads(s[len('window.storyFormat('):].rstrip(';\n)'))['source']
story='<tw-storydata name="Neutral" startnode="1" creator="Twine" creator-version="2.8.1" ifid="E0A58F0D-CB11-4484-A4E1-44533BCBE058" format="SugarCube" format-version="2.37.3" options="" hidden><style role="stylesheet" id="twine-user-stylesheet" type="text/twine-css"></style><script role="script" id="twine-user-script" type="text/twine-javascript"></script><tw-passagedata pid="1" name="Start" tags="" position="100,100" size="100,100">Neutral page.</tw-passagedata></tw-storydata>'
h=h.replace('{{STORY_NAME}}','Neutral').replace('{{STORY_DATA}}',story)
a='jQuery((function(){var lockId=LoadScreen.lock()';b='window.mainStart=((function(){var lockId=LoadScreen.lock()';assert h.count(a)==1;h=h.replace(a,b)
a='}))})(window,window.document,jQuery);';b='}));jQuery(()=>window.modSC2DataManager.startInit().then(()=>window.jsPreloader.startLoad()).then(()=>window.mainStart()).catch(e=>{window.__bootError=String(e);console.error(e)}))})(window,window.document,jQuery);';assert h.count(a)==1;h=h.replace(a,b)
content='<script>'+open(bundle).read()+'</script>'
i=h.index('<script id="script-sugarcube"');h=h[:i]+content+h[i:]
open(out,'w').write(h)
