import { connectDB } from "../../../lib/mongo"; // Ensure correct path
import { Comment } from "../../../lib/models/comment"; // Ensure correct path
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        await connectDB(); // ✅ Ensure MongoDB connection

        const { comments, sentimentResults } = await req.json();

        if (!comments || !sentimentResults) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 });
        }

        // **Process Sentiments**
        const updatedComments = comments.map((comment: any, index: number) => {
            const bestPrediction = sentimentResults[index].reduce((max: any, current: any) =>
                current.score > max.score ? current : max
            );

            let sentimentLabel = "Negative";
            if (bestPrediction.label === "LABEL_1") sentimentLabel = "Neutral";
            if (bestPrediction.label === "LABEL_2") sentimentLabel = "Positive";

            return { ...comment, sentiment: sentimentLabel }; // ✅ Append sentiment
        });

        // **Batch Update MongoDB (Efficient)**
        const bulkOps = updatedComments.map((comment: any) => ({
            updateOne: {
                filter: { text: comment.text }, // Matching text instead of _id for flexibility
                update: { $set: { sentiment: comment.sentiment } },
            },
        }));

        if (bulkOps.length > 0) {
            await Comment.bulkWrite(bulkOps);
        }

        return NextResponse.json({ message: "Sentiments added successfully!" }, { status: 200 });

    } catch (error) {
        console.error("Error updating sentiments:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
