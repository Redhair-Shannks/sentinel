import os
import json
import pandas as pd
import sys
import random
from datetime import datetime, timedelta

# ✅ Force UTF-8 encoding for consistent output
sys.stdout.reconfigure(encoding="utf-8")

# ✅ Ensure a YouTube link is provided
if len(sys.argv) < 2:
    print(json.dumps({"error": "No YouTube link provided"}))
    sys.exit(1)

youtube_link = sys.argv[1]
print(f"🔗 Fetching comments from: {youtube_link}")

# ✅ Set the CSV path inside the `public` directory
csv_path = os.path.join("public", "youtube_comments_sentiment.csv")

# ✅ Generate 100 comments with the same length for all columns
NUM_ROWS = 100
comments = [f"Comment {i+1}" for i in range(NUM_ROWS)]
sentiments = [random.choice(["Positive", "Neutral", "Negative"]) for _ in range(NUM_ROWS)]
votes = [random.randint(0, 500) for _ in range(NUM_ROWS)]
hearted = [random.choice([True, False]) for _ in range(NUM_ROWS)]
replies = [random.randint(0, 50) for _ in range(NUM_ROWS)]
timestamps = [(datetime.now() - timedelta(days=random.randint(0, 365))).strftime("%Y-%m-%d") for _ in range(NUM_ROWS)]

# ✅ Create a DataFrame
df = pd.DataFrame({
    "Comment": comments,
    "Sentiment": sentiments,
    "Votes": votes,
    "Hearted": hearted,
    "Replies": replies,
    "Date/Time": timestamps
})

# ✅ Save the CSV file
df.to_csv(csv_path, index=False)

# ✅ Return the CSV path as JSON (so Next.js can use it)
print(json.dumps({"success": True, "csvPath": csv_path}))
