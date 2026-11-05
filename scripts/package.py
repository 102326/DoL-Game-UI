"""Current 4.x paired player packages; historical monolith is sealed in DoL-Game-UI-old."""
from pathlib import Path
import runpy
import sys
producer = Path(__file__).with_name('package-framework.py')
sys.argv = [str(producer), '--players-only']
runpy.run_path(str(producer), run_name='__main__')
