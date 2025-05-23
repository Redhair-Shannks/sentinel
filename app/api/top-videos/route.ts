// app/api/top-videos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY, // Set in .env.local
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get('channelId');
  const sortOption = searchParams.get('sortOption');

  if (!channelId || !sortOption) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    // Fetch uploads playlist ID
    const channelResponse = await youtube.channels.list({
      part: ['contentDetails'],
      id: [channelId],
    });
    const uploadsPlaylistId = channelResponse.data.items?.[0]?.contentDetails.relatedPlaylists.uploads;

    if (!uploadsPlaylistId) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Fetch video IDs from playlist
    const playlistResponse = await youtube.playlistItems.list({
      playlistId: uploadsPlaylistId,
      part: ['snippet'],
      maxResults: 50,
    });
    const videoIds = playlistResponse.data.items?.map((item) => item.snippet?.resourceId.videoId) || [];

    // Fetch video details
    const videosResponse = await youtube.videos.list({
      id: videoIds,
      part: ['snippet', 'statistics'],
    });
    let videos = videosResponse.data.items || [];

    // Sort videos
    if (sortOption === 'mostRecent') {
      videos.sort((a, b) => new Date(b.snippet?.publishedAt || 0).getTime() - new Date(a.snippet?.publishedAt || 0).getTime());
    } else if (sortOption === 'mostViewed') {
      videos.sort((a, b) => parseInt(b.statistics?.viewCount || '0') - parseInt(a.statistics?.viewCount || '0'));
    } else if (sortOption === 'topRated') {
      videos.sort((a, b) => parseInt(b.statistics?.likeCount || '0') - parseInt(a.statistics?.likeCount || '0'));
    }

    // Select top 10
    const topVideos = videos.slice(0, 10).map((video) => ({
      id: video.id,
      title: video.snippet?.title,
      thumbnail: video.snippet?.thumbnails.default?.url,
    }));

    return NextResponse.json(topVideos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}