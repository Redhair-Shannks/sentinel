import sys
import pandas as pd
import os
import re
from datetime import datetime, timedelta
from collections import Counter
import emoji

# ✅ Fix Unicode encoding issues on Windows
sys.stdout.reconfigure(encoding='utf-8')

# ✅ Define Paths
input_csv_path = os.path.join(".", "public", "youtube_comments_sentiment.csv")
output_csv_path = os.path.join(".", "public", "youtube_sentiment_analysis.csv")

# ✅ Check if File Exists
if not os.path.exists(input_csv_path):
    print(f"❌ File not found at {input_csv_path}")
    exit()

# ✅ Load the CSV File
df = pd.read_csv(input_csv_path)

# ✅ Rename Columns for Consistency
df.rename(columns={"Comment": "comment", "Sentiment": "sentiment", "Votes": "likes", "Hearted": "hearted", "Replies": "replies", "Date/Time": "date_time"}, inplace=True)

# ✅ Convert "Hearted" Column to Binary (1 = Hearted, 0 = Not Hearted)
df["hearted"] = df["hearted"].astype(int)

# ✅ Convert "Date/Time" Column to Absolute Timestamp
def convert_to_datetime(text):
    text = str(text).strip().lower()
    now = datetime.now()

    if "hours ago" in text:
        hours = int(re.search(r'(\d+)', text).group(1))
        return now - timedelta(hours=hours)
    elif "days ago" in text:
        days = int(re.search(r'(\d+)', text).group(1))
        return now - timedelta(days=days)
    elif "edited" in text:
        text = text.replace("(edited)", "").strip()
    
    return pd.to_datetime(text, errors="coerce")

df["date_time"] = df["date_time"].apply(convert_to_datetime)

# ✅ Sentiment Distribution
sentiment_counts = df["sentiment"].value_counts().to_dict()

# ✅ Top Liked Comments
top_liked_comments = df.sort_values(by="likes", ascending=False).head(5)[["comment", "likes", "hearted", "replies"]]

# ✅ Most Replied Comments
top_replied_comments = df.sort_values(by="replies", ascending=False).head(5)[["comment", "replies", "hearted"]]

# ✅ Extract Words (Excluding Stopwords & Special Characters)
def extract_words(text):
    words = re.findall(r'\b\w+\b', str(text).lower())  # Extract words
    return words

all_words = [word for comment in df["comment"] for word in extract_words(comment)]
top_words = Counter(all_words).most_common(10)

# ✅ Extract Emojis
def extract_emojis(text):
    return [char for char in str(text) if char in emoji.EMOJI_DATA]

all_emojis = [emo for comment in df["comment"] for emo in extract_emojis(comment)]
top_emojis = Counter(all_emojis).most_common(5)

# ✅ Save to a New CSV File
output_data = {
    "Category": ["Sentiment", "Sentiment", "Sentiment"] + 
                ["Top Liked Comment"] * len(top_liked_comments) +
                ["Top Replied Comment"] * len(top_replied_comments) +
                ["Word"] * len(top_words) + 
                ["Emoji"] * len(top_emojis),
    
    "Type": ["Positive", "Neutral", "Negative"] + 
             ["Comment"] * len(top_liked_comments) +
             ["Comment"] * len(top_replied_comments) +
             ["Word"] * len(top_words) + 
             ["Emoji"] * len(top_emojis),
    
  "Value": [""] * 3 +  # ✅ Fix: Empty Value for Sentiment
              list(top_liked_comments["comment"]) +
              list(top_replied_comments["comment"]) +
              [word[0] for word in top_words] +
              [emoji[0] for emoji in top_emojis],
    
    "Frequency": list(sentiment_counts.values()) +
                  list(top_liked_comments["likes"]) +
                  list(top_replied_comments["replies"]) +
                  [word[1] for word in top_words] +
                  [emoji[1] for emoji in top_emojis],
    
    "Hearted": ["N/A"] * len(sentiment_counts) +  # N/A for sentiment rows
                list(top_liked_comments["hearted"]) +
                list(top_replied_comments["hearted"]) +
                ["N/A"] * (len(top_words) + len(top_emojis))
}

output_df = pd.DataFrame(output_data)
output_df.to_csv(output_csv_path, index=False)

print(f"✅ Analysis saved to {output_csv_path}")
