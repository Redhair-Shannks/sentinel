// lib/models/comment.ts
import mongoose, { Schema } from "mongoose";

// Define interface for comment data
export interface CommentData {
  text: string;
  votes: number;
  hearted: boolean;
  replies: number;
  time: Date;
  videoId: string;
  sentiment: "positive" | "neutral" | "negative";
  sentimentScore?: number;
  timestamp?: Date;
}

const commentSchema = new Schema({
  text: { type: String, required: true },
  votes: { type: Number, default: 0 },
  hearted: { type: Boolean, default: false },
  replies: { type: Number, default: 0 },
  time: { type: Date, required: true },
  videoId: { type: String, required: true },
  sentiment: {
    type: String,
    enum: ["positive", "neutral", "negative"], // Must include "neutral" in lowercase
    default: "neutral",
  },
  sentimentScore: { type: Number },
  timestamp: { type: Date, default: Date.now },
});

export const Comment = mongoose.models.Comment || mongoose.model<CommentData>("Comment", commentSchema);