// app/components/VideoSelector.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
}

const VideoSelector: React.FC = () => {
  const [channelId, setChannelId] = useState("");
  const [sortOption, setSortOption] = useState("mostRecent");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate channel ID format (should be 24 characters)
    if (!channelId || channelId.trim().length < 24) {
      setError("Please enter a valid YouTube channel ID");
      return;
    }

    try {
      const response = await fetch(
        `/api/top-videos?channelId=${channelId}&sortOption=${sortOption}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch videos");
        return;
      }

      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error("Error fetching videos:", error);
      setError("Failed to fetch videos. Please try again.");
    }
  };

  const handleVideoClick = (videoId: string) => {
    router.push(`/analyze/${videoId}`);
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-xl shadow-lg border border-border">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                                          <input                type="text"                placeholder="Enter YouTube Channel ID"                value={channelId}                onChange={(e) => setChannelId(e.target.value)}                className="w-full p-3 border border-border bg-background text-foreground rounded-full focus:outline-none focus:ring-2 focus:ring-primary"              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full sm:w-48 px-4 py-2 rounded-full bg-background text-foreground border border-input focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="mostRecent">Most Recent</option>
              <option value="mostViewed">Most Viewed</option>
              <option value="topRated">Top Rated</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
              ) : (
                "Get Top 10 Videos"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Thumbnails */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : videos.length === 0 ? (
        <p className="text-center text-muted-foreground">No videos found. Enter a Channel ID to start.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              onClick={() => handleVideoClick(video.id)}
              className="group relative block overflow-hidden rounded-xl bg-card border border-border shadow-md cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="relative aspect-video">
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  fill
                  className="object-cover rounded-t-xl transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300" />
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold text-card-foreground line-clamp-2">
                  {video.title}
                </h2>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoSelector;