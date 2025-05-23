import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import { Comment } from "@/lib/models/comment";

export async function GET() {
    try {
        await connectDB();

        // Fetch all comments, selecting only the `text` field
        const comments = await Comment.find({}, { text: 1, _id: 0 });

        return NextResponse.json({ comments });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
