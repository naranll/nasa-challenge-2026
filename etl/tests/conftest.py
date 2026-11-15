# etl/ нь package биш тул тестүүд скриптүүдийг шууд import хийх боломжтой болгоно.
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
