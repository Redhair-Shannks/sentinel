// app/api/storeComments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import { Comment } from '@/lib/models/comment';

function stripHtml(html?: string) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').trim();
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { comments, videoId } = await req.json();
    console.log('📥 Received Data:', { comments, videoId });

    if (!videoId) {
      console.error('❌ Missing videoId');
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
    }

    if (!Array.isArray(comments)) {
      console.error('❌ Invalid comments format: Expected an array');
      return NextResponse.json({ error: 'Invalid comments array' }, { status: 400 });
    }

    if (comments.length === 0) {
      console.warn('⚠️ No comments to store');
      return NextResponse.json({ message: 'No comments provided' }, { status: 200 });
    }

    await Comment.deleteMany({ videoId });
    console.log('🗑️ Cleared existing comments for videoId:', videoId);

    const formattedComments = comments.map((comment, index) => {
      if (!comment.text || !comment.time) {
        console.error(`❌ Invalid comment at index ${index}:`, comment);
        throw new Error(`Comment at index ${index} must have a 'text' and 'time' field.`);
      }

      return {
        text: stripHtml(comment.text),
        votes: Number(comment.votes) || 0,
        hearted: Boolean(comment.hearted),
        replies: Number(comment.replies) || 0,
        time: new Date(comment.time),
        videoId: videoId,
        sentiment: comment.sentiment || 'neutral',
        timestamp: comment.timestamp ? new Date(comment.timestamp) : new Date(comment.time),
      };
    });

    console.log('📝 Formatted comments:', formattedComments);

    const insertedComments = await Comment.insertMany(formattedComments);
    console.log('✅ Stored comments:', insertedComments.length);

    return NextResponse.json(
      { message: 'Comments stored successfully!', count: insertedComments.length },
      { status: 201 }
    );
  } catch (error) {
    console.error('🚨 Error storing comments:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}