import json
from datetime import datetime
import time
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import boto3
from botocore.exceptions import ClientError
import logging
from concurrent.futures import ThreadPoolExecutor
import threading
from dbQueries import dbQueries

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Input file paths
INPUT_FILES = [
    "./JSON/wine_live_prices.json",
    "./JSON/beer_live_prices.json",
    "./JSON/soft_live_prices.json"
]
OUTPUT_FILE = "./JSON/live_prices.json"

# S3 configuration
S3_BUCKET = "investo-bar-data"
S3_KEY = "api/prices.json"
AWS_REGION = "us-east-1"
CLOUDFRONT_DISTRIBUTION_ID = "E2B7ZWL983I51A"

# Initialize S3 and CloudFront clients
s3_client = boto3.client("s3", region_name=AWS_REGION)
cloudfront_client = boto3.client("cloudfront", region_name=AWS_REGION)

# Resolve absolute paths for input and output files
INPUT_FILES_ABS = [os.path.abspath(f) for f in INPUT_FILES]
OUTPUT_FILE_ABS = os.path.abspath(OUTPUT_FILE)

# Key mapping for transformation
KEY_MAPPING = {
    "Aperol": "aperol_spritz",
    "Prosecco": "prosecco",
    "Vin_Alb": "vin_alb",
    "Vin_Rosu": "vin_rosu",
    "Heineken": "heineken",
    "Peroni": "peroni",
    "Corona": "corona",
    "Apa": "apa",
    "Cola": "cola"
}

# Default values for fields not in input JSONs
DEFAULT_VALUES = {
}

# Function to read a single JSON file
def read_json_file(file_path):
    # Retry reads to avoid decoding while producer is still writing
    for attempt in range(5):
        try:
            with open(file_path, 'r') as f:
                return file_path, json.load(f)
        except Exception as e:
            if attempt < 4:
                time.sleep(0.2)
                continue
            logger.error(f"Error reading {file_path} after retries: {e}")
            return file_path, []

# Function to read all JSON files in parallel
def read_all_json_files():
    with ThreadPoolExecutor(max_workers=len(INPUT_FILES)) as executor:
        results = list(executor.map(read_json_file, INPUT_FILES))
    return {file_path: data for file_path, data in results}

# Function to transform data
def transform_data(json_data_list):
    output = DEFAULT_VALUES.copy()
    output["time"] = datetime.now().strftime("%H:%M")

    excluded_keys = {"Index", "Interval", "Event", "Profit", "CumProfit"}

    def get_last_record(data):
        if isinstance(data, dict):
            return data
        if isinstance(data, list) and data:
            # Prefer the most recent item assuming input lists are chronological
            for candidate in reversed(data):
                if isinstance(candidate, dict):
                    return candidate
        return None

    # Merge the latest record from each input JSON
    for json_data in json_data_list:
        if not json_data:
            continue
        last_item = get_last_record(json_data)
        if not last_item:
            continue
        for key, value in last_item.items():
            if key in excluded_keys:
                continue
            new_key = KEY_MAPPING.get(key, key.lower())
            output[new_key] = value

    return output

# Function to invalidate CloudFront cache
def invalidate_cloudfront_cache():
    try:
        response = cloudfront_client.create_invalidation(
            DistributionId=CLOUDFRONT_DISTRIBUTION_ID,
            InvalidationBatch={
                'Paths': {
                    'Quantity': 1,
                    'Items': ['/api/prices.json']
                },
                'CallerReference': str(time.time())
            }
        )
        logger.info(f"Invalidated CloudFront cache for {S3_KEY}, Invalidation ID: {response['Invalidation']['Id']}")
    except ClientError as e:
        logger.error(f"Error invalidating CloudFront cache: {e}")

# Function to reset prices.json (delete or set to empty)
def reset_prices_json(delete=False):
    try:
        if delete:
            s3_client.delete_object(Bucket=S3_BUCKET, Key=S3_KEY)
            logger.info(f"Deleted {S3_KEY} from S3 bucket {S3_BUCKET}")
        else:
            # Reset to an empty array since consumers expect a list of snapshots
            empty_content = json.dumps([], indent=2)
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=S3_KEY,
                Body=empty_content,
                ContentType="application/json"
            )
            logger.info(f"Reset {S3_KEY} to empty array in S3 bucket {S3_BUCKET}")
        invalidate_cloudfront_cache()
    except ClientError as e:
        logger.error(f"Error resetting {S3_KEY}: {e}")

# Function to read existing prices.json from S3
def read_existing_prices():
    try:
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=S3_KEY)
        return json.loads(response['Body'].read().decode('utf-8'))
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            logger.info(f"{S3_KEY} not found in S3, starting with empty dict")
            return {}
        else:
            logger.error(f"Error reading {S3_KEY}: {e}")
            return {}

# Function to check if current time is at a quarter-hour
def is_quarter_hour():
    now = datetime.now()
    quarter_minutes = [0, 15, 30, 45]
    return any((now.minute % 60) in {(q - 1) % 60, q, (q + 1) % 60} for q in quarter_minutes)

# Function to process JSON and upload to S3
def process_json():
    try:
        # Read all JSON files in parallel
        json_data_dict = read_all_json_files()
        json_data_list = list(json_data_dict.values())
        
        # Transform data
        output_data = transform_data(json_data_list)
        
        # Skip writing if we have no product keys (only time)
        product_keys = [k for k in output_data.keys() if k != "time"]
        if len(product_keys) == 0:
            logger.info("No product data found in inputs; skipping snapshot write.")
            return

        # Append/merge to local live_prices.json (maintain an array of snapshots)
        existing_local: list
        try:
            if os.path.exists(OUTPUT_FILE):
                with open(OUTPUT_FILE, 'r') as f_in:
                    parsed = json.load(f_in)
                    existing_local = parsed if isinstance(parsed, list) else []
            else:
                existing_local = []
        except Exception:
            existing_local = []

        # Merge with last snapshot if same minute (same time string)
        if existing_local and isinstance(existing_local[-1], dict) and existing_local[-1].get("time") == output_data["time"]:
            merged = existing_local[-1].copy()
            merged.update(output_data)
            existing_local[-1] = merged
            new_local_data = existing_local
            logger.info("Merged snapshot into existing entry for current minute.")
        else:
            # Avoid appending exact duplicate of the last snapshot
            if existing_local and existing_local[-1] == output_data:
                logger.info("Snapshot is identical to the last one; skipping append.")
                new_local_data = existing_local
            else:
                new_local_data = existing_local + [output_data]

        with open(OUTPUT_FILE, 'w') as f_out:
            json.dump(new_local_data, f_out, indent=2)
        logger.info(f"Appended new snapshot and saved to {OUTPUT_FILE}")
        
        # Only upload to S3 and invalidate CloudFront at quarter-hour marks
        if is_quarter_hour():
            try:
                # Upload the full array to S3 so consumers receive history
                json_content = json.dumps(new_local_data, indent=2)
                s3_client.put_object(
                    Bucket=S3_BUCKET,
                    Key=S3_KEY,
                    Body=json_content,
                    ContentType="application/json"
                )
                logger.info(f"Uploaded {S3_KEY} to S3 bucket {S3_BUCKET}")
                invalidate_cloudfront_cache()
                # Give some time to chill
                time.sleep(1000)
                dbQueries().insertLine() # After every invalidation, need a new line for new timeframe
            except ClientError as e:
                logger.error(f"Error uploading to S3: {e}")
        else:
            logger.info("Not a quarter-hour mark (minute in [0, 15, 30, 45] and second == 0). Skipping S3 upload and CloudFront invalidation.")
    except Exception as e:
        logger.error(f"Error processing JSON: {e}")

# File system event handler
class FileChangeHandler(FileSystemEventHandler):
    def __init__(self):
        super().__init__()
        self._timer = None
        self._lock = threading.Lock()


    def on_modified(self, event):
        if not event.is_directory and os.path.abspath(event.src_path) in INPUT_FILES_ABS:
            logger.info(f"Detected change in {event.src_path}")
            # Debounce multiple rapid changes into a single processing run
            def _run():
                try:
                    time.sleep(0.3)
                    process_json()
                finally:
                    with self._lock:
                        self._timer = None

            with self._lock:
                if self._timer is not None:
                    self._timer.cancel()
                self._timer = threading.Timer(0.4, _run)
                self._timer.start()

# Main function to start the file watcher
def start_watching():
    process_json()  # Initial run
    event_handler = FileChangeHandler()
    observer = Observer()
    observer.schedule(event_handler, path=os.path.dirname(INPUT_FILES_ABS[0]), recursive=False)
    observer.start()
    logger.info(f"Watching for changes in {', '.join(INPUT_FILES)}...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        logger.info("Stopped watching")
    observer.join()

if __name__ == "__main__":
    # Reset prices.json if any input file is missing or empty
    def file_is_empty_or_missing(path: str) -> bool:
        if not os.path.exists(path):
            return True
        try:
            if os.path.getsize(path) == 0:
                return True
            with open(path, 'r') as f:
                data = json.load(f)
                if isinstance(data, (list, dict)):
                    return len(data) == 0
                return True
        except Exception:
            return True

    needs_reset = any(file_is_empty_or_missing(input_file) for input_file in INPUT_FILES)
    if needs_reset:
        logger.warning("One or more input files are missing or empty. Resetting output.")
        reset_prices_json(delete=True)   # Deletes prices.json on S3
        reset_prices_json(delete=False)  # Sets prices.json to [] on S3
        dbQueries().clearTables() # Clears tables from DB
        dbQueries().insertLine()  # Inserts line in DB, in order to not be empty
    start_watching()