from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from youtube_comment_downloader import YoutubeCommentDownloader, SORT_BY_RECENT
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import pandas as pd
import re

# Initialize FastAPI app
app = FastAPI()

# Load RoBERTa model for sentiment analysis
MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

# Sentiment labels
LABELS = ["Negative", "Neutral", "Positive"]

# Function to analyze sentiment using RoBERTa
def analyze_sentiment(text):
    """Analyzes sentiment of a given text using RoBERTa."""
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
    probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
    sentiment = LABELS[probs.argmax().item()]
    return sentiment

# Function to clean text and prevent JavaScript code in the CSV
def clean_text(text):
    """Removes JavaScript, HTML tags, and ensures safe text."""
    text = re.sub(r'<.*?>', '', text)  # Remove HTML tags
    text = re.sub(r'<script.*?</script>', '', text, flags=re.DOTALL)  # Remove JS
    text = text.replace("\n", " ").strip()  # Remove newlines
    return text

# Pydantic model for request
class VideoURL(BaseModel):
    url: str

# Endpoint to fetch and analyze YouTube comments
@app.post("/analyze/")
def analyze_youtube_comments(video: VideoURL):
    try:
        # ✅ Initialize downloader
        downloader = YoutubeCommentDownloader()
        comments = downloader.get_comments_from_url(video.url, sort_by=SORT_BY_RECENT)

        # ✅ Store data in a list
        data = []

        for comment in comments:
            text = clean_text(comment['text'])  # Ensure clean comment text
            if not text.strip():  # Ignore empty comments
                continue
            
            likes = comment.get('votes', 0)
            sentiment = analyze_sentiment(text)
            hearted = comment.get('heart', False)
            replies = comment.get('reply_count', 0) or (1 if comment.get('reply', False) else 0)
            date_time = comment.get('time', "Unknown")

            data.append({
                "comment": text,
                "sentiment": sentiment,
                "votes": likes,
                "hearted": hearted,
                "replies": replies,
                "date_time": date_time
            })

        # ✅ Convert to DataFrame and save as CSV (Overwrites previous file)
        df = pd.DataFrame(data)
        df.to_csv("youtube_comments_sentiment.csv", index=False, mode='w')

        return {
            "message": "Sentiment analysis completed",
            "total_comments": len(data),
            "data": data[:100]  # Return first 100 comments
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ✅ To run FastAPI server: 
# Run `uvicorn main:app --reload`
