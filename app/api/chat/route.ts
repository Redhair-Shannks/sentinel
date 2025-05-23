// app/api/chat/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { question, analysis, sentiment, transcript } = await req.json();
    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY || "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";
    
    // Format sentiment data
    const sentimentText = sentiment
      ? `Sentiment analysis: ${sentiment.positive || 0}% positive, ${sentiment.neutral || 0}% neutral, ${sentiment.negative || 0}% negative.`
      : "No sentiment data available.";

    // Add detailed logging for debugging
    console.log("📜 Received for chat:", {
      question: question,
      transcript_length: transcript ? transcript.length : 0,
      sentiment_data: sentiment || "None",
      analysis_length: analysis?.length || 0,
    });

    // Check for missing data
    if (!transcript || transcript.trim() === "") {
      console.warn("⚠️ No transcript provided for AI analysis");
    }
    
    if (!sentiment) {
      console.warn("⚠️ No sentiment data provided for AI analysis");
    }
    
    if (!analysis || analysis.trim() === "") {
      console.warn("⚠️ No analysis provided for AI analysis");
    }

    // Use the system prompt with the YouTube creator focus
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

Be supportive, positive, and practical, treating the creator as someone seeking growth. If data is missing, acknowledge it directly, saying "I don't have [specific data] available" and then provide general best practices.

IMPORTANT: If you don't have enough context to answer about a specific video, DO NOT make up information. Instead, be honest and clear about what data you're missing.

Data provided:
- Transcript: ${transcript && transcript.trim() !== "" ? "Available (" + transcript.length + " characters)" : "No transcript available."}
- Sentiment: ${sentimentText}
- Analysis report: ${analysis && analysis.trim() !== "" ? "Available (" + analysis.length + " characters)" : "No analysis available."}`;

    console.log(`🤖 Generating response with meta-llama/llama-3.1-8b-instruct:free...`);
    
    // Make request to OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://youtube-analyzer.com",
        "X-Title": "YouTube Chat Assistant"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          { role: "user", content: question },
        ],
        temperature: 0.7,
        max_tokens: 800
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API Error with Llama: ${errorText}`);
      
      // Fallback to Claude if Llama fails
      console.log("⚠️ Llama failed, falling back to Claude-3-Sonnet");
      const fallbackResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://youtube-analyzer.com",
          "X-Title": "YouTube Chat Assistant"
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-sonnet-20240229",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            { role: "user", content: question },
          ],
          temperature: 0.7,
          max_tokens: 800
        }),
      });
      
      if (!fallbackResponse.ok) {
        return NextResponse.json(
          { error: `All AI models failed. Please try again later.` },
          { status: 500 }
        );
      }
      
      const fallbackData = await fallbackResponse.json();
      const fallbackAnswer = fallbackData.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
      console.log("📬 Chat response (from fallback):", fallbackAnswer.slice(0, 100) + "...");
      return NextResponse.json({ answer: fallbackAnswer, model: "claude-3-sonnet" });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
    console.log("📬 Chat response:", answer.slice(0, 100) + "...");
    return NextResponse.json({ answer, model: "llama-3.1" });
  } catch (error) {
    console.error("Error in POST /api/chat:", error);
    return NextResponse.json(
      { error: `Failed to process question: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}