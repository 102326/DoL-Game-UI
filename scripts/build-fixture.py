from pathlib import Path
import os,subprocess
root=Path(__file__).resolve().parent.parent;source=Path(os.environ.get('DOL_UPSTREAM_SOURCE',str(root.parent.parent/'upstream/vanilla-0.5.11.9-source')))
commit=subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD'],text=True).strip()
assert commit=='41993d3f32476f0b1c8db730c159a50ffcdc2a65'
env=dict(os.environ,TWEEGO_PATH=str(source/'devTools/tweego/storyFormats'))
subprocess.run([os.environ.get('TWEEGO_BIN',os.environ.get('TWEEGO_BIN',str(source/'devTools/tweego/tweego_win64.exe'))),'-o',str(root/'tests/fixture.html'),str(root/'tests/story'),str(source/'game/base-combat/actionsGeneration.js')],env=env,check=True)
