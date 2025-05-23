// app/api/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import { Comment } from "@/lib/models/comment";

// Stop words to filter out from word frequency analysis
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "by", 
  "is", "are", "am", "was", "were", "be", "been", "being", "in", "of", "that", "this", 
  "these", "those", "it", "its", "i", "me", "my", "mine", "we", "us", "our", "ours", 
  "you", "your", "yours", "he", "him", "his", "she", "her", "hers", "they", "them", 
  "their", "theirs", "what", "which", "who", "whom", "whose", "when", "where", "why", 
  "how", "all", "any", "both", "each", "few", "more", "most", "some", "such", "no", 
  "not", "only", "own", "same", "so", "than", "too", "very", "can", "will", "just", 
  "should", "now", "with", "as", "from", "have", "has", "had"
]);

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { likes, views, transcript, videoId } = await req.json();
    console.log("📥 Summary POST Data:", { likes, views, transcript, videoId });

    if (!videoId) {
      console.error("❌ Missing videoId");
      return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
    }

    const comments = await Comment.find({ videoId }).lean();
    console.log("📚 Fetched comments for summary:", comments.length);

    const summary = generateSummary(comments, likes, views, transcript, videoId);
    return NextResponse.json({ summary }, { status: 201 });
  } catch (error) {
    console.error("🚨 Summary POST Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to generate summary" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const videoId = req.nextUrl.searchParams.get("videoId");
    console.log("🔍 Summary GET videoId:", videoId);

    if (!videoId) {
      console.error("❌ Missing videoId");
      return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
    }

    const comments = await Comment.find({ videoId }).lean();
    console.log("📚 Fetched comments for GET:", comments.length);

    // Generate the full summary
    const summary = generateSummary(comments, 0, 0, "", videoId);
    
    // Extract sentiment data for easier access in the frontend
    let sentimentData = null;
    if (summary.sentimentDistribution) {
      const total = comments.length || 1; // Avoid division by zero
      sentimentData = {
        positive: Math.round((summary.sentimentDistribution.positive / total) * 100),
        neutral: Math.round((summary.sentimentDistribution.neutral / total) * 100),
        negative: Math.round((summary.sentimentDistribution.negative / total) * 100)
      };
    }
    
    // Return both the full summary and the comments array
    return NextResponse.json({
      summary,
      sentiment: sentimentData,
      comments
    }, { status: 200 });
  } catch (error) {
    console.error("🚨 Summary GET Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to fetch summary" },
      { status: 500 }
    );
  }
}

function generateSummary(comments: any[], likes: number, views: number, transcript: string, videoId: string) {
  const sentimentDistribution = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };

  const engagementMetrics = {
    positive: { votes: 0, hearted: 0, replies: 0 },
    neutral: { votes: 0, hearted: 0, replies: 0 },
    negative: { votes: 0, hearted: 0, replies: 0 },
  };

  const sentimentOverTime: { [hour: string]: { positive: number; neutral: number; negative: number } } = {};
  let peakCommentingHour = "0";

  const wordFrequency: { [key: string]: number } = {};
  const hashtagFrequency: { [key: string]: number } = {};
  const emojiFrequency: { [key: string]: number } = {};
  const topWords: { word: string, count: number }[] = [];

  comments.forEach((comment: any) => {
    const sentiment = comment.sentiment || "neutral";
    sentimentDistribution[sentiment]++;
    engagementMetrics[sentiment].votes += comment.votes || 0;
    engagementMetrics[sentiment].hearted += comment.hearted ? 1 : 0;
    engagementMetrics[sentiment].replies += comment.replies || 0;

    const hour = new Date(comment.timestamp || comment.time).getHours().toString();
    sentimentOverTime[hour] = sentimentOverTime[hour] || { positive: 0, neutral: 0, negative: 0 };
    sentimentOverTime[hour][sentiment]++;

    const words = comment.text.toLowerCase().match(/\b\w+\b/g) || [];
    words.forEach((word) => {
      // Filter out stop words
      if (!STOP_WORDS.has(word)) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }
    });

    const hashtags = comment.text.match(/#[^\s#]+/g) || [];
    hashtags.forEach((hashtag) => {
      hashtagFrequency[hashtag] = (hashtagFrequency[hashtag] || 0) + 1;
    });

    // Improved emoji regex to catch more emoji characters
    const emojis = comment.text.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu) || [];
    emojis.forEach((emoji) => {
      emojiFrequency[emoji] = (emojiFrequency[emoji] || 0) + 1;
    });
  });

  let maxComments = 0;
  Object.entries(sentimentOverTime).forEach(([hour, counts]) => {
    const total = counts.positive + counts.neutral + counts.negative;
    if (total > maxComments) {
      maxComments = total;
      peakCommentingHour = hour;
    }
  });

  // Prepare the top words array from filtered wordFrequency
  for (const [word, count] of Object.entries(wordFrequency)) {
    topWords.push({ word, count });
  }
  // Sort by count in descending order
  topWords.sort((a, b) => b.count - a.count);

  return {
    sentimentDistribution,
    engagementMetrics,
    timeAnalysis: {
      sentimentOverTime: Object.entries(sentimentOverTime).map(([hour, counts]) => ({
        hour: Number(hour),
        ...counts,
      })),
      peakCommentingHour,
    },
    wordAndEmojiTrends: {
      wordFrequency: Object.entries(wordFrequency).map(([word, count]) => ({ word, count })),
      topWords: topWords.slice(0, 50), // Add top 50 words explicitly
      hashtagFrequency: Object.entries(hashtagFrequency).map(([hashtag, count]) => ({
        hashtag,
        count,
      })),
      emojiFrequency: Object.entries(emojiFrequency).map(([emoji, count]) => ({ emoji, count })),
    },
  };
}