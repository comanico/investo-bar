import json
from datetime import datetime
import time
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import boto3
from botocore.exceptions import ClientError
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Input file path
INPUT_FILE = "./live_prices.json"
# S3 configuration
S3_BUCKET = "investo-bar-data"
S3_KEY = "api/prices.json"
AWS_REGION = "us-east-1"
CLOUDFRONT_DISTRIBUTION_ID = "E2B7ZWL983I51A"

# Initialize S3 and CloudFront clients
s3_client = boto3.client("s3", region_name=AWS_REGION)
cloudfront_client = boto3.client("cloudfront", region_name=AWS_REGION)

# Resolve absolute path for INPUT_FILE
INPUT_FILE_ABS = os.path.abspath(INPUT_FILE)

# Function to process keys
def process_key(key):
    key = key.lower()
    parts = key.split('.')
    base = parts[0]
    if len(parts) > 1:
        return parts[0] + "_" + parts[1] if parts[1] else base
    return base

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
            logger.info(f"{S3_KEY} not found in S3, starting with empty list")
            return []
        else:
            logger.error(f"Error reading {S3_KEY}: {e}")
            return []

# Function to compare items (excluding time/Interval)
def is_new_item(new_item, existing_items):
    new_item_no_time = {k: v for k, v in new_item.items() if k != 'time'}
    for existing_item in existing_items:
        existing_no_time = {k: v for k, v in existing_item.items() if k != 'time'}
        if new_item_no_time == existing_no_time:
            return False, existing_item.get('time')
    return True, None

# Helper function to check if current time is at a quarter-hour (first second)
def is_quarter_hour():
    now = datetime.now()
    quarter_minutes = [0, 15, 30, 45]
    return any((now.minute % 60) in {(q - 1) % 60, q, (q + 1) % 60} for q in quarter_minutes)

# Function to process JSON and upload to S3
def process_json():
    try:
        # Read input JSON
        with open(INPUT_FILE, 'r') as j:
            contents = json.load(j)
        
        # Read existing prices.json from S3
        existing_data = read_existing_prices()
        
        # Process new data
        output_data = existing_data.copy()
        for item in contents:
            new_item = {}
            for key, value in item.items():
                if key == "Interval":
                    new_key = "time"
                else:
                    new_key = process_key(key)
                    new_item[new_key] = value
            
            # Check if item is new
            is_new, existing_time = is_new_item(new_item, output_data)
            if is_new:
                new_item['time'] = datetime.now().strftime("%H:%M")  # Added seconds for precision
                output_data.append(new_item)
                logger.info(f"Added new item with time: {new_item['time']}")
            else:
                for i, existing_item in enumerate(output_data):
                    if {k: v for k, v in existing_item.items() if k != 'time'} == {k: v for k, v in new_item.items() if k != 'time'}:
                        output_data[i]['time'] = existing_time
                        logger.info(f"Preserved time {existing_time} for existing item")
        
        # Only upload to S3 and invalidate CloudFront at quarter-hour marks
        if is_quarter_hour():
            try:
                json_content = json.dumps(output_data, indent=2)
                s3_client.put_object(
                    Bucket=S3_BUCKET,
                    Key=S3_KEY,
                    Body=json_content,
                    ContentType="application/json"
                )
                logger.info(f"Uploaded {S3_KEY} to S3 bucket {S3_BUCKET}")
                invalidate_cloudfront_cache()
            except ClientError as e:
                logger.error(f"Error uploading to S3: {e}")
        else:
            logger.info("Not a quarter-hour mark (minute in [0, 15, 30, 45] and second == 0). Skipping S3 upload and CloudFront invalidation.")
    except Exception as e:
        logger.error(f"Error processing JSON: {e}")

# File system event handler
class FileChangeHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if not event.is_directory and os.path.abspath(event.src_path) == INPUT_FILE_ABS:
            logger.info(f"Detected change in {INPUT_FILE}")
            time.sleep(0.1)
            process_json()

# Main function to start the file watcher
def start_watching():
    process_json()
    event_handler = FileChangeHandler()
    observer = Observer()
    observer.schedule(event_handler, path=os.path.dirname(INPUT_FILE_ABS) or '.', recursive=False)
    observer.start()
    logger.info(f"Watching for changes in {INPUT_FILE}...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        logger.info("Stopped watching")
    observer.join()

if __name__ == "__main__":
    # Uncomment to reset prices.json (delete or empty)
    if not os.path.exists(INPUT_FILE):
        reset_prices_json(delete=True)  # Deletes prices.json
        reset_prices_json(delete=False)  # Sets prices.json to []
    start_watching()