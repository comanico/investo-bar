import json
import logging
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class procesVerbal():

    def __init__(self):
        self.file_path = "./JSON/live_prices.json"

    def readLivePrices(self, file_path):
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading {file_path} because of: {e}")
            return []
        return
    
    def writeProcesVerbal(self):
        pv_path = f"./PV/{datetime.now().strftime('proces_verbal_%Y-%m-%d-%H-%M')}.txt"
        live_prices = self.readLivePrices(self.file_path)
        if len(live_prices) > 0:
            previous_price = live_prices[-2]
            current_price = live_prices[-1]
            with open(pv_path, 'w') as file:
                file.write(f"Preturile au evoluat de la:\n{json.dumps(previous_price, indent=2)}\n la noile preturi:\n{json.dumps(current_price, indent=2)} ")
            return
        return
    
if __name__ == "__main__":
    pv = procesVerbal()
    pv.writeProcesVerbal()