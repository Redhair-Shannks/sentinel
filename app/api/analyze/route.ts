import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import { google } from "googleapis";

// Initialize YouTube API client
const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
});

// Get API key from environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "anthropic/claude-3-haiku";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get("videoId");
    
    if (!videoId) {
      return NextResponse.json({ error: "Missing videoId parameter" }, { status: 400 });
    }
    
    await connectDB();
    
    // Check if we have a cached analysis for this video
    const cacheResponse = await fetch(`/api/cache?key=analysis_${videoId}`);
    
    if (cacheResponse.ok) {
      const cache = await cacheResponse.json();
      if (cache.data) {
        console.log("✅ Returning cached analysis");
        return NextResponse.json({ analysis: cache.data });
      }
    }
    
    // Fetch transcript
    const transcriptResponse = await fetch("/api/getTranscript", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    });
    
    let transcript = null;
    if (transcriptResponse.ok) {
      const data = await transcriptResponse.json();
      transcript = data.fullText;
    } else {
      return NextResponse.json({ error: "Failed to fetch transcript" }, { status: 500 });
    }
    
    // Fetch video details
    const videoResponse = await youtube.videos.list({
      part: ["snippet", "statistics"],
      id: [videoId],
    });
    
    if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }
    
    const videoData = videoResponse.data.items[0];
    const videoDetails = {
      title: videoData.snippet?.title || "Unknown",
      channel: videoData.snippet?.channelTitle || "Unknown",
      views: videoData.statistics?.viewCount || "0",
      likes: videoData.statistics?.likeCount || "0",
      description: videoData.snippet?.description || ""
    };
    
    // Generate analysis using model
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://youtube-analyzer.com',
        'X-Title': 'YouTube Analytics Assistant'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "You are an expert video content analyzer specialized in detecting creator mental health indicators, audience reception, and content quality. Provide a comprehensive, detailed analysis."
          },
          {
            role: "user",
            content: `Analyze this YouTube video transcript and provide detailed insights about:
1. Content summary
2. Creator's emotional state and potential mental health indicators
3. Key themes and talking points
4. Tone and sentiment analysis
5. Audience engagement potential

VIDEO DETAILS:
Title: ${videoDetails.title}
Channel: ${videoDetails.channel}
Views: ${videoDetails.views}
Likes: ${videoDetails.likes}

TRANSCRIPT:
${transcript?.slice(0, 6000)}
            `
          }
        ],
        temperature: 0.5,
        max_tokens: 1500
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Analysis generation error: ${errorText}`);
      return NextResponse.json({ error: "Failed to generate analysis" }, { status: response.status });
    }
    
    const result = await response.json();
    const analysis = result.choices?.[0]?.message?.content || "Could not generate analysis.";
    
    // Cache the analysis
    try {
      await fetch('/api/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: `analysis_${videoId}`,
          data: analysis,
          expiryHours: 24 * 7 // Cache for 1 week
        })
      });
    } catch (cacheError) {
      console.error("Failed to cache analysis:", cacheError);
    }
    
    return NextResponse.json({ analysis });
    
  } catch (error) {
    console.error("Error in analyze API:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to analyze video" },
      { status: 500 }
    );
  }
} 