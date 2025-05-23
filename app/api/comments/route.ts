import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import { Comment } from "@/lib/models/comment";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const videoId = req.nextUrl.searchParams.get("videoId");

    if (!videoId) {
      return NextResponse.json({ error: "Missing videoId parameter" }, { status: 400 });
    }

    // Fetch all comments for the given videoId, sorted by time (newest first)
    const comments = await Comment.find({ videoId })
      .sort({ time: -1 })  // Newest first
      .lean();
    
    if (!comments || comments.length === 0) {
      console.log(`No comments found for video ${videoId}`);
      return NextResponse.json([]);
    }
    
    console.log(`Fetched ALL ${comments.length} comments for video ${videoId} from MongoDB`);
    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
} 