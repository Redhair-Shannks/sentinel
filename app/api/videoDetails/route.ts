import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// Initialize the YouTube API client
const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get("videoId");

    if (!videoId) {
      return NextResponse.json(
        { error: "Missing videoId parameter" },
        { status: 400 }
      );
    }

    // Verify we have a YouTube API key
    if (!process.env.YOUTUBE_API_KEY && !process.env.NEXT_PUBLIC_YOUTUBE_API_KEY) {
      console.error("No YouTube API key found");
      return NextResponse.json(
        { error: "YouTube API key is not configured" },
        { status: 500 }
      );
    }

    console.log(`📺 Fetching video details for ID: ${videoId}`);

    // Fetch video details
    const videoResponse = await youtube.videos.list({
      part: ["snippet", "statistics"],
      id: [videoId],
    });

    if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    const videoData = videoResponse.data.items[0];
    const channelId = videoData.snippet?.channelId;

    if (!channelId) {
      return NextResponse.json(
        { error: "Channel information not available" },
        { status: 404 }
      );
    }

    // Fetch channel details to get subscriber count
    const channelResponse = await youtube.channels.list({
      part: ["statistics"],
      id: [channelId],
    });

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    // Format the response
    const response = {
      title: videoData.snippet?.title || "Unknown Title",
      thumbnail: videoData.snippet?.thumbnails?.high?.url || 
                videoData.snippet?.thumbnails?.medium?.url || 
                videoData.snippet?.thumbnails?.default?.url || 
                "",
      channel: videoData.snippet?.channelTitle || "Unknown Channel",
      views: videoData.statistics?.viewCount || "0",
      likes: videoData.statistics?.likeCount || "0",
      subscribers: channelResponse.data.items[0].statistics?.subscriberCount || "0",
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching video details:", error);
    return NextResponse.json(
      { error: "Failed to fetch video details" },
      { status: 500 }
    );
  }
} 