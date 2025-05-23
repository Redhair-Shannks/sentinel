import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import { Comment } from "@/lib/models/comment";

export async function GET() {
  try {
    await connectDB();

    // Fetch all comments with all properties
    const comments = await Comment.find({});

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
