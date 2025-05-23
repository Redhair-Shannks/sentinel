import { NextResponse } from "next/server";

// Function to remove HTML tags
function stripHtml(html: string) {
  return typeof html === "string" ? html.replace(/<[^>]+>/g, "").trim() : "";
}

// Truncate text to prevent exceeding token limits
const MAX_LENGTH = 512;
function truncateText(text: string, maxLength = MAX_LENGTH) {
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

// Hugging Face Sentiment API Function
async function analyzeSentiment(text: string, apiKey: string) {
  const response = await fetch("https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// API Handler
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📥 Received comments:", body);

    const { comments } = body;

    if (!comments || !Array.isArray(comments)) {
      console.error("❌ Invalid input format:", comments);
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    // Clean and truncate comments
    const cleanedComments = comments
      .map(comment => truncateText(stripHtml(comment)))
      .filter(text => text.length > 0); // Remove empty texts

    if (cleanedComments.length === 0) {
      console.error("❌ No valid text found in comments:", cleanedComments);
      return NextResponse.json({ error: "No valid text in comments" }, { status: 400 });
    }

    // Check API Key
    const HF_API_KEY = process.env.HF_API_KEY;
    if (!HF_API_KEY) {
      return NextResponse.json({ error: "Hugging Face API Key is missing" }, { status: 500 });
    }

    // Process comments one by one to avoid exceeding model limits
    const sentimentResults = await Promise.all(cleanedComments.map(comment => analyzeSentiment(comment, HF_API_KEY)));

    return NextResponse.json({ results: sentimentResults }, { status: 200 });

  } catch (error: any) {
    console.error("Error processing sentiment analysis:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
