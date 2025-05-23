import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import { Comment } from "@/lib/models/comment";
import mongoose from "mongoose";

// Use OpenRouter with the specific API key
const OPENROUTER_API_KEY = "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";

// Define a schema for caching analysis results
let AnalysisCache;
try {
  AnalysisCache = mongoose.model("AnalysisCache");
} catch {
  const analysisCacheSchema = new mongoose.Schema({
    videoId: { type: String, required: true, unique: true },
    analysis: { type: Object, required: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 } // Cache for 24 hours
  });
  
  AnalysisCache = mongoose.model("AnalysisCache", analysisCacheSchema);
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    // Get request data
    const { videoId, transcript, videoDetails } = await req.json();
    
    if (!videoId) {
      return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
    }
    
    // Check if we already have cached analysis for this video
    const cachedAnalysis = await AnalysisCache.findOne({ videoId }).lean();
    
    if (cachedAnalysis) {
      console.log(`🔍 Found cached analysis for video ${videoId}`);
      return NextResponse.json(cachedAnalysis.analysis);
    }
    
    console.log("🔍 No cached analysis found, fetching ALL comments for creator analysis...");
    // Fetch all comments for the video
    const comments = await Comment.find({ videoId }).lean();
    console.log(`📊 Found ${comments.length} comments for analysis`);
    
    if (!comments || comments.length === 0) {
      return NextResponse.json(
        { error: "No comments found for this video" },
        { status: 404 }
      );
    }
    
    // Prepare comment data
    const commentTexts = comments.map(comment => comment.text).join("\n");
    const sentimentStats = {
      positive: comments.filter(c => c.sentiment === "positive").length,
      neutral: comments.filter(c => c.sentiment === "neutral").length,
      negative: comments.filter(c => c.sentiment === "negative").length,
    };
    
    // Create prompt - using original full prompt
    const prompt = `
You are a specialized AI assistant that helps YouTube content creators improve their content and mental health.

Here's information about a YouTube video:
- Title: ${videoDetails?.title || "Unknown"}
- Channel: ${videoDetails?.channel || "Unknown"}
- Views: ${videoDetails?.views || "Unknown"}
- Likes: ${videoDetails?.likes || "Unknown"}
- Subscribers: ${videoDetails?.subscribers || "Unknown"}

TRANSCRIPT:
${transcript || "No transcript available"}

COMMENTS (${comments.length} total):
${commentTexts.slice(0, 100000)} // Limit size to avoid token issues

SENTIMENT ANALYSIS:
- Positive comments: ${sentimentStats.positive}
- Neutral comments: ${sentimentStats.neutral}
- Negative comments: ${sentimentStats.negative}

Based on this information, please provide:

1. CREATOR MENTAL HEALTH ASSESSMENT:
   - Analyze how the audience responds to the creator's content and persona
   - Identify potential stressors or negative patterns that might impact creator mental health
   - Suggest ways the creator can better handle audience feedback

2. CONTENT IMPROVEMENT SUGGESTIONS:
   - What topics or moments resonated most with viewers
   - What content could be improved or avoided
   - Opportunities to better engage the audience

3. AUDIENCE INSIGHTS:
   - Key demographics and interests based on comment analysis
   - What the audience values most about this content
   - How the audience connects with the creator

4. RECOMMENDED ACTIONS:
   - Provide 3-5 specific, actionable recommendations for the creator

Prioritize being constructive and empathetic in your analysis. Focus on how the creator can improve their content while maintaining good mental health.
`;

    console.log("🤖 Generating AI analysis using Gemini via OpenRouter...");
    
    // Make API request to OpenRouter using Gemini Pro
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://youtube-analyzer.com"
      },
      body: JSON.stringify({
        model: "google/gemini-pro",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API Error: ${response.status} - ${errorText}`);
      throw new Error(`Failed to generate analysis: ${response.statusText}`);
    }
    
    const result = await response.json();
    const text = result.choices[0].message.content;
    
    console.log("✅ AI analysis complete with Gemini Pro");
    
    // Create the analysis result object
    const analysisResult = { 
      analysis: text,
      metadata: {
        commentCount: comments.length,
        sentimentStats,
        hasTranscript: !!transcript,
        model: "gemini-pro"
      }
    };
    
    // Store the result in cache
    await AnalysisCache.findOneAndUpdate(
      { videoId },
      { videoId, analysis: analysisResult },
      { upsert: true, new: true }
    );
    console.log("💾 Cached analysis for future use");
    
    return NextResponse.json(analysisResult);
    
  } catch (error) {
    console.error("Error generating creator analysis:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to generate analysis" },
      { status: 500 }
    );
  }
} 