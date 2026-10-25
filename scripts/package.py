"""Current paired player packages; the historical monolith is package-legacy.py."""
from pathlib import Path
import runpy
import sys
producer = Path(__file__).with_name('package-framework.py')
sys.argv = [str(producer), '--players-only']
runpy.run_path(str(producer), run_name='__main__')
