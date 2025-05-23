// app/api/fetchDeepSeek/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import mongoose from "mongoose";

// Debug - log env variables at load time
console.log("📄 fetchDeepSeek route loaded");
console.log("🔑 OPENROUTER_API_KEY present:", !!process.env.OPENROUTER_API_KEY);
console.log("🔑 API Key ends with:", process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.slice(-6) : "missing");

// Define a schema for caching analysis results
let AnalysisCache;
try {
  AnalysisCache = mongoose.model("AIAnalysisCache");
} catch {
  const analysisCacheSchema = new mongoose.Schema({
    videoId: { type: String, required: true, unique: true },
    analysis: { type: String, required: true },
    model: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 } // Cache for 24 hours
  });
  
  AnalysisCache = mongoose.model("AIAnalysisCache", analysisCacheSchema);
}

// Global variable for latest analysis (fallback if DB not available)
let aiAnalysis: string | null = null;

// Model constant
const LLAMA_MODEL = "meta-llama/llama-3.1-8b-instruct:free";

function extractFinalOutput(text: string): string {
  const marker = "Final Answer:";
  const index = text.indexOf(marker);
  if (index !== -1) {
    return text.slice(index + marker.length).trim();
  }
  return text.trim();
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const { likes, views, commentsDB, transcript, videoId } = await req.json();
    
    if (!likes || !views || !commentsDB || !transcript || !videoId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if we have a cached analysis for this video
    const cachedAnalysis = await AnalysisCache.findOne({ videoId }).lean();
    if (cachedAnalysis) {
      console.log(`🔍 Found cached AI analysis for video ${videoId}`);
      aiAnalysis = cachedAnalysis.analysis;
      return NextResponse.json({ 
        result: cachedAnalysis.analysis,
        model: cachedAnalysis.model,
        cached: true
      });
    }
    
    // Strictly require API key from environment variables
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("❌ OPENROUTER_API_KEY is missing from environment variables");
      return NextResponse.json({ 
        error: "OpenRouter API key is missing. Please add OPENROUTER_API_KEY to your .env.local file." 
      }, { status: 500 });
    }
    
    console.log("📜 Received transcript for AI analysis:", transcript.slice(0, 100) + "...");
    console.log(`🤖 Using ${LLAMA_MODEL} for AI report analysis`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://youtube-analyzer.com",
        "X-Title": "YouTube AI Analysis Report"
      },
      body: JSON.stringify({
        model: LLAMA_MODEL,
        messages: [
          {
            role: "user",
            content: `Analyze this YouTube video data:
- Likes: ${likes}
- Views: ${views}
- Transcript text: ${transcript}
- Comments: ${JSON.stringify(commentsDB, null, 2)}
I have given you some parameters of a YouTube video like:
Likes on the video, Views on the video, the comments data that we fetched with their intent, and the video's transcript text representing what the creator is speaking in the video.
Act as a professional YouTube Reviewer and Advisor and give advice and insights using sentiment and engagement.
Thoroughly analyze these parameters one by one and give an overall report in the structure:

Pros of the video:
Cons of the video:
A final Advice to creator what to Improve:
`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API Error: ${errorText}`);
      return NextResponse.json(
        { error: `OpenRouter API request failed: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawOutput = data.choices?.[0]?.message?.content || "No response from model.";
    const finalOutput = extractFinalOutput(rawOutput);
    aiAnalysis = finalOutput;
    
    // Cache the analysis in MongoDB
    await AnalysisCache.findOneAndUpdate(
      { videoId },
      { videoId, analysis: finalOutput, model: "llama-3.1" },
      { upsert: true, new: true }
    );
    console.log("💾 Cached AI analysis for future use");
    
    return NextResponse.json({ 
      result: finalOutput,
      model: "llama-3.1"
    });
  } catch (error) {
    console.error("Error in POST /api/fetchDeepSeek:", error);
    return NextResponse.json({ error: "Failed to process AI analysis" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // Get videoId from query params
  const url = new URL(req.url);
  const videoId = url.searchParams.get('videoId');
  
  try {
    await connectDB();
    
    // If we have a videoId, try to get the cached analysis
    if (videoId) {
      const cachedAnalysis = await AnalysisCache.findOne({ videoId }).lean();
      if (cachedAnalysis) {
        console.log(`🔍 Found cached AI analysis for video ${videoId}`);
        return NextResponse.json({ 
          result: cachedAnalysis.analysis,
          model: cachedAnalysis.model,
          cached: true
        });
      }
    }
    
    // Fallback to global variable if no cached result found
    if (!aiAnalysis) {
      return NextResponse.json(
        { error: "No AI analysis available. Submit data first." },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ result: aiAnalysis });
  } catch (error) {
    console.error("Error in GET /api/fetchDeepSeek:", error);
    
    // Even if DB connection fails, try to return the in-memory result
    if (aiAnalysis) {
      return NextResponse.json({ result: aiAnalysis });
    }
    
    return NextResponse.json(
      { error: "Failed to retrieve AI analysis" },
      { status: 500 }
    );
  }
}