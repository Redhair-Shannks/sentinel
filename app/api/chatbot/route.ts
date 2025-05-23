import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import { Comment } from "@/lib/models/comment";

// Get API key from environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
// Updated model to use the working one from previous project
const MODEL = "meta-llama/llama-3.1-8b-instruct:free";

function analyzeSentiment(text: string) {
  // Enhanced sentiment analysis with more comprehensive word lists
  const words = text.toLowerCase().split(/\s+/);
  const positiveWords = new Set([
    'happy', 'great', 'awesome', 'excellent', 'love', 'amazing', 'good', 'best',
    'fantastic', 'perfect', 'wonderful', 'brilliant', 'helpful', 'positive', 'beautiful',
    'excited', 'enjoy', 'like', 'appreciate', 'grateful', 'thanks', 'impressive'
  ]);
  const negativeWords = new Set([
    'sad', 'bad', 'awful', 'terrible', 'hate', 'angry', 'worst', 'poor',
    'horrible', 'disappointed', 'useless', 'waste', 'boring', 'annoying', 'frustrating',
    'difficult', 'stupid', 'ugly', 'confusing', 'ridiculous', 'wrong', 'problem'
  ]);
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.has(word)) positiveCount++;
    if (negativeWords.has(word)) negativeCount++;
  });
  
  return {
    sentiment: positiveCount > negativeCount ? 'positive' : 
               negativeCount > positiveCount ? 'negative' : 'neutral',
    score: (positiveCount - negativeCount) / words.length,
    details: {
      positive: positiveCount,
      negative: negativeCount,
      total: words.length
    }
  };
}

export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await connectDB();
    
    const { videoId, transcript, question, videoDetails, chatHistory = [], analysis } = await req.json();
    
    if (!question) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }

    // Check if API key is available
    if (!OPENROUTER_API_KEY) {
      console.error("❌ OpenRouter API key is missing");
      return NextResponse.json({ error: "OpenRouter API key is missing" }, { status: 500 });
    }
    
    let contextData = "";
    let sentimentAnalysis = null;
    let isVideoRelatedQuestion = !!videoId;
    
    // Extract creator information
    let creatorName = "Unknown";
    let videoTitle = "Unknown";
    
    if (videoDetails) {
      if (videoDetails.channel) {
        creatorName = videoDetails.channel;
      }
      if (videoDetails.title) {
        videoTitle = videoDetails.title;
      }
    }
    
    if (videoId) {
      console.log(`🔍 Analyzing video context for videoId: ${videoId}`);
      
      // Fetch and process comments for sentiment analysis
      const comments = await Comment.find({ videoId }).lean();
      
      if (comments && comments.length > 0) {
        // Analyze sentiment of all comments
        const sentiments = comments.map(comment => analyzeSentiment(comment.text));
        const avgScore = sentiments.reduce((acc, curr) => acc + curr.score, 0) / sentiments.length;
        
        // Count sentiment distributions
        const positiveCounts = sentiments.filter(s => s.sentiment === 'positive').length;
        const negativeCounts = sentiments.filter(s => s.sentiment === 'negative').length;
        const neutralCounts = sentiments.filter(s => s.sentiment === 'neutral').length;
        
        sentimentAnalysis = {
          positive: Math.round((positiveCounts / comments.length) * 100),
          negative: Math.round((negativeCounts / comments.length) * 100),
          neutral: Math.round((neutralCounts / comments.length) * 100)
        };
      }
    }
    
    // Format sentiment data for the prompt
    const sentimentText = sentimentAnalysis
      ? `Sentiment analysis: ${sentimentAnalysis.positive || 0}% positive, ${sentimentAnalysis.neutral || 0}% neutral, ${sentimentAnalysis.negative || 0}% negative.`
      : "No sentiment data available.";
    
    // Log what we're sending to the model    
    console.log("📜 Processing for chatbot:", {
      question,
      transcript: transcript ? transcript.slice(0, 100) + "..." : "No transcript",
      sentiment: sentimentText,
      analysis: analysis ? analysis.slice(0, 100) + "..." : "No analysis"
    });
    
    // Use the system prompt from the provided example
    const systemPrompt = `You are an empathetic and insightful assistant for a YouTube creator, tasked with analyzing their video content and audience feedback to provide personalized advice. You have access to:

- A transcript of the video, reflecting what the creator said.
- Sentiment analysis of comments (positive, neutral, negative percentages).
- An AI-generated analysis report (may be limited or unavailable).

For questions about the creator's mental health, performance, or improvements (e.g., "How can I improve my mental health?" or "How am I performing?"):
1. Analyze the transcript to assess the creator's tone, energy, topics discussed, and delivery style (e.g., confident, stressed, engaging).
2. Use sentiment data to gauge how the audience perceives the creator (e.g., supportive, critical).
3. Provide specific, actionable advice to improve mental health (e.g., stress management, audience engagement strategies) and performance (e.g., content delivery, topic focus), tailored to the transcript and sentiment.
4. If the analysis report has relevant insights, incorporate them, but prioritize your own analysis of transcript and sentiment if the report is lacking.

For general questions (e.g., "How does YouTube work?"):
- Answer concisely and accurately, without relying on video data unless relevant.

For video-specific questions (e.g., "What's the sentiment?"):
- Use sentiment data for precise answers (e.g., exact percentages).
- Reference the analysis report for structured insights (e.g., pros, cons) if available.

Be supportive, positive, and practical, treating the creator as someone seeking growth. If data is missing (e.g., no transcript), acknowledge it and provide general best practices.

Data provided:
- Transcript: ${transcript || "No transcript available."}
- Sentiment: ${sentimentText}
- Analysis report: ${analysis || "No analysis available."}`;

    console.log(`🤖 Generating response with ${MODEL}...`);
    
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
            content: systemPrompt
          },
          { 
            role: "user", 
            content: question 
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenRouter API error: ${errorText}`);
      return NextResponse.json({ error: `Failed to get response: ${errorText}` }, { status: response.status });
    }

    const result = await response.json();
    const aiResponse = result.choices?.[0]?.message?.content || "I couldn't generate a response at this time.";
    
    console.log("✅ Response generated successfully");
    console.log("📬 Chat response:", aiResponse.slice(0, 100) + "...");
    
    return NextResponse.json({ 
      response: aiResponse,
      hasVideoContext: isVideoRelatedQuestion,
      sentimentAnalysis,
      model: "Meta Llama 3.1 8B Instruct",
      creatorName,
      videoTitle,
      videoId
    });
    
  } catch (error) {
    console.error("Error generating response:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to generate response" },
      { status: 500 }
    );
  }
} 