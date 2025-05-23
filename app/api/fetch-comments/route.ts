import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import { Comment } from "@/lib/models/comment";

// Function to remove HTML tags
function stripHtml(html: string) {
  return typeof html === "string" ? html.replace(/<[^>]+>/g, "").trim() : "";
}

// Truncate text to prevent exceeding token limits
function truncateText(text: string, maxLength = 512) {
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

// Make sure text is never empty
function ensureText(text: string): string {
  const cleaned = stripHtml(text);
  return cleaned || "No text content"; // Ensure text is never empty
}

// Analyze sentiment using Llama 3.1B via OpenRouter
async function analyzeSentiment(text: string) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
  
  if (!text.trim()) {
    console.warn("⚠️ Empty text passed to sentiment analysis");
    return "neutral"; // Default for empty text
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://youtube-analyzer.com"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          {
            role: "system",
            content: "You are a sentiment analysis expert. Analyze the text and classify it as 'positive', 'negative', or 'neutral'. Respond with ONLY the sentiment label and nothing else."
          },
          {
            role: "user",
            content: `Analyze the sentiment of this text: "${text}"`
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API Error: ${response.status} - ${errorText}`);
      return "neutral"; // Fallback on error
    }

    const result = await response.json();
    let sentiment = result.choices[0].message.content.toLowerCase().trim();
    
    // Handle various response formats and normalize to our three categories
    if (sentiment.includes("positive")) {
      sentiment = "positive";
    } else if (sentiment.includes("negative")) {
      sentiment = "negative";
    } else {
      sentiment = "neutral";
    }

    console.log(`📊 Sentiment for "${text.slice(0, 30)}...": ${sentiment}`);
    return sentiment;
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return "neutral"; // Fallback on exception
  }
}

// Fetch comments from YouTube API
async function fetchYouTubeComments(videoId: string) {
  const API_KEY = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  
  if (!API_KEY) {
    console.error("YouTube API key is not configured");
    throw new Error("YouTube API key is missing");
  }
  
  let allComments = [];
  let nextPageToken = null;
  let commentCount = 0;
  const MAX_COMMENTS = 150; // Limit to top 150 comments
  
  console.log(`🔄 Starting to fetch up to ${MAX_COMMENTS} comments from YouTube API...`);
  
  do {
    // Build URL with pageToken if available
    let url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&key=${API_KEY}`;
    if (nextPageToken) {
      url += `&pageToken=${nextPageToken}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch comments: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log("⚠️ No more comments available");
      break;
    }

    // Map and add current page of comments
    const pageComments = data.items.map((item: any) => ({
      text: ensureText(item.snippet.topLevelComment.snippet.textDisplay),
      time: new Date(item.snippet.topLevelComment.snippet.publishedAt),
      votes: item.snippet.topLevelComment.snippet.likeCount || 0,
      hearted: item.snippet.topLevelComment.snippet.viewerRating === "like",
      replies: item.snippet.totalReplyCount || 0,
      videoId: videoId,
    }));

    allComments = [...allComments, ...pageComments];
    commentCount += pageComments.length;
    console.log(`📊 Fetched page of ${pageComments.length} comments, total: ${commentCount}`);
    
    // Stop if we've reached the MAX_COMMENTS limit
    if (allComments.length >= MAX_COMMENTS) {
      console.log(`✅ Reached limit of ${MAX_COMMENTS} comments`);
      allComments = allComments.slice(0, MAX_COMMENTS);
      break;
    }
    
    // Update nextPageToken for next iteration
    nextPageToken = data.nextPageToken || null;
    
  } while (nextPageToken); // Continue until no more pages or we hit the limit

  console.log(`✅ Completed fetching ${allComments.length} comments from YouTube API for video ${videoId}`);
  return allComments;
}

export async function GET(req: NextRequest) {
  try {
    const videoId = req.nextUrl.searchParams.get("videoId");
    
    if (!videoId) {
      return NextResponse.json({ error: "Missing videoId parameter" }, { status: 400 });
    }
    
    // Fetch comments from YouTube API
    const comments = await fetchYouTubeComments(videoId);
    
    if (comments.length === 0) {
      return NextResponse.json({ message: "No comments found for this video" });
    }
    
    // Batch sentiment analysis for better performance
    console.log(`🧠 Analyzing sentiment for ${comments.length} comments using Llama 3.1B...`);
    const batchSize = 5; // Process in smaller batches due to OpenRouter rate limits
    const processedComments = [];
    
    for (let i = 0; i < comments.length; i += batchSize) {
      const batch = comments.slice(i, i + batchSize);
      const promises = batch.map(async (comment) => {
        // Clean comment text and ensure it's never empty
        const cleanText = truncateText(comment.text || "No text content");
        // Analyze sentiment
        const sentiment = await analyzeSentiment(cleanText);
        return {
          ...comment,
          text: cleanText, // Ensure text is present and clean
          sentiment,
          timestamp: comment.time,
        };
      });
      
      const processedBatch = await Promise.all(promises);
      processedComments.push(...processedBatch);
      
      console.log(`✅ Processed batch ${i / batchSize + 1}/${Math.ceil(comments.length / batchSize)}`);
      
      // Add a short delay between batches to avoid OpenRouter rate limits
      if (i + batchSize < comments.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Store comments in MongoDB
    await connectDB();
    
    // Delete existing comments for this video
    await Comment.deleteMany({ videoId });
    console.log(`🗑️ Cleared existing comments for videoId: ${videoId}`);
    
    // Insert all comments
    if (processedComments.length > 0) {
      await Comment.insertMany(processedComments);
      console.log(`💾 Stored ${processedComments.length} analyzed comments in MongoDB`);
    }
    
    return NextResponse.json({ 
      message: "All comments fetched, analyzed and stored successfully",
      commentCount: processedComments.length,
      firstFewComments: processedComments.slice(0, 5)
    });
    
  } catch (error) {
    console.error("Error fetching and processing comments:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch and process comments" },
      { status: 500 }
    );
  }
} 