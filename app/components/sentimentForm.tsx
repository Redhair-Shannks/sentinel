"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { HfInference } from "@huggingface/inference"
import AnalysisLoader from "./AnalysisLoader"
import { useSession } from "@clerk/nextjs"

interface VideoDetails {
  title: string
  thumbnail: string
  channel: string
  views: string
  likes: string
  subscribers: string
}



const SentimentForm = () => {
  const {data:session}=useSession();
  const [youtubeLink, setYoutubeLink] = useState("")
  const [loading, setLoading] = useState(false)
  const [deepLoading, setDeepLoading] = useState(false)
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const router = useRouter()
  const [sentiments, setSentiments] = useState<any[]>([])

  const handleAnalyze = async () => {
    
    setLoading(true)
    setVideoDetails(null)
    setConfirmed(false)

    const videoId = extractYouTubeVideoId(youtubeLink)
    if (!videoId) {
      alert("Invalid YouTube link.")
      setLoading(false)
      return
    }

    const details = await fetchYouTubeData(videoId)
    if (details) {
      setVideoDetails(details)
    } else {
      alert("Failed to fetch video details.")
    }

    setLoading(false)
  }

  const handleConfirm = async () => {
    setLoading(true)
    setDeepLoading(true)

    try {
      console.log("Fetching comments from YouTube API...")

      const videoId = extractYouTubeVideoId(youtubeLink)
      const comments = await fetchYouTubeComments(videoId)

      console.log("Fetched YouTube comments:", comments); 


      // Send comments to MongoDB
      console.log("Storing comments in MongoDB...")
      const storeResponse = await fetch("/api/storeComments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments }),
      })

      // ✅ Fetch video transcript using our API
      console.log("🎬 Fetching transcript...")
      const transcriptResponse = await fetch("/api/getTranscript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      })

      let transcriptText = "No transcript available";
      if (!transcriptResponse.ok) {
        const errorText = await transcriptResponse.text()
        console.error("❌ Transcript API Response:", errorText)
        console.warn("Proceeding with no transcript available");
      } else {
        const transcriptData = await transcriptResponse.json()
        transcriptText = transcriptData.fullText || "No transcript available";
        console.log("✅ Transcript Fetched (first 100 chars):", transcriptText.substring(0, 100) + "...")
      }

      console.log("Fetching stored comments...")
      const fetchResponse = await fetch("/api/getComments")
      if (!fetchResponse.ok) throw new Error("Failed to retrieve comments")
      const storedComments = await fetchResponse.json()

      const commentTexts = storedComments.comments.map((comment: any) => comment.text)

      console.log("Running sentiment analysis...")
      const sentiment = await fetch("/api/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments: commentTexts }),
      })

      console.log("hello")

      const responseText = await sentiment.text() // Capture raw response text

      if (!sentiment.ok) {
        console.error("API Error Response:", responseText)
        throw new Error(`Sentiment analysis failed: ${sentiment.status} - ${responseText}`)
      }

      const sentimentResults = JSON.parse(responseText)
      console.log("Sentiment analysis result:", sentimentResults)

      console.log("Updating comments with sentiment...")
      await fetch("/api/addSentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments, sentimentResults: sentimentResults.results }),
      })

      console.log("Sentiments added to database successfully.")

      console.log("Fetching updated comments from MongoDB...")
      const newResponse = await fetch("/api/textComments")
      if (!newResponse.ok) throw new Error("Failed to retrieve updated comments")
      const updatedComments = await newResponse.json()
      console.log(updatedComments)

      console.log("Computing summary...")
      const summaryResponse = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          likes: videoDetails?.likes,
          views: videoDetails?.views,
          transcript: transcriptText,
          videoId,
        }),
      })
      if (!summaryResponse.ok) {
        const summaryErrorText = await summaryResponse.text()
        console.error("Summary API Error Response:", summaryErrorText)
        throw new Error(`Summary API failed: ${summaryResponse.status} - ${summaryErrorText}`)
      }
      const summaryData = await summaryResponse.json()
      console.log("Summary Data:", summaryData.summary)

      console.log("🔍 Fetching AI-based video analysis...")
      const aiResponse = await fetch("/api/fetchDeepSeek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          likes: videoDetails?.likes,
          views: videoDetails?.views,
          commentsDB: storedComments.comments,
          transcript: transcriptText,
        }),
      })

      const aiData = await aiResponse.json()
      console.log("🤖 DeepSeek AI Analysis:", aiData.result)

      router.push("/SummaryDashboard")
    } catch (error) {
      console.error("Error processing comments:", error)
    } finally {
      setLoading(false)
      setDeepLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black bg-opacity-30 text-purple-200 p-6">
      {deepLoading && <AnalysisLoader />}

      <div className="w-full max-w-md space-y-8">
        <h2 className="text-7xl font-extrabold text-center text-purple-400 glow">Sentinal</h2>

        <div className="backdrop-blur-lg bg-purple-900/10 p-8 rounded-2xl shadow-lg border border-purple-500/20">
                    <input            type="text"            value={youtubeLink}            onChange={(e) => setYoutubeLink(e.target.value)}            placeholder="Enter YouTube link"            className="w-full p-3 border border-border bg-background text-foreground rounded-full focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"            required          />
          <button
            onClick={handleAnalyze}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-glow"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Analyze"}
          </button>
        </div>

        {videoDetails && (
          <div className="mt-8 p-6 bg-purple-900/20 rounded-2xl shadow-lg text-purple-200 text-center border border-purple-500/20">
            <img
              src={videoDetails.thumbnail || "/placeholder.svg"}
              alt="Video Thumbnail"
              className="rounded-lg shadow-md mb-4 mx-auto"
            />
            <h3 className="text-xl font-bold text-purple-300">{videoDetails.title}</h3>
            <p className="text-purple-400">Channel: {videoDetails.channel}</p>
            <p className="text-purple-400">Subscribers: {videoDetails.subscribers}</p>
            <p className="text-purple-400">Views: {videoDetails.views}</p>
            <p className="text-purple-400">Likes: {videoDetails.likes}</p>

            <div className="flex items-center justify-center gap-2 mt-6">
              <input
                type="checkbox"
                id="confirmVideo"
                checked={confirmed}
                onChange={() => setConfirmed(!confirmed)}
                className="w-5 h-5 accent-purple-600"
              />
              <label htmlFor="confirmVideo" className="text-purple-300">
                This is the correct video
              </label>
            </div>

            {confirmed && (
              <button
                onClick={handleConfirm}
                className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-glow flex items-center justify-center"
                disabled={deepLoading}
              >
                {deepLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Proceed to Analysis"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const extractYouTubeVideoId = (url: string): string | null => {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

const fetchYouTubeData = async (videoId: string): Promise<VideoDetails | null> => {
  try {
    const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY

    // Fetch video details
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,statistics&key=${API_KEY}`,
    )
    const videoData = await videoResponse.json()

    if (videoData.items.length === 0) return null

    const video = videoData.items[0].snippet
    const stats = videoData.items[0].statistics
    const channelId = video.channelId

    // Fetch channel details to get subscriber count
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?id=${channelId}&part=statistics&key=${API_KEY}`,
    )
    const channelData = await channelResponse.json()

    let subscribers = "N/A"
    if (channelData.items.length > 0) {
      subscribers = channelData.items[0].statistics.subscriberCount
        ? Number.parseInt(channelData.items[0].statistics.subscriberCount).toLocaleString()
        : "N/A"
    }

    return {
      title: video.title,
      thumbnail: video.thumbnails.high.url,
      channel: video.channelTitle,
      views: stats.viewCount ? Number.parseInt(stats.viewCount).toLocaleString() : "N/A",
      likes: stats.likeCount ? Number.parseInt(stats.likeCount).toLocaleString() : "N/A",
      subscribers,
    }
  } catch (error) {
    console.error("Error fetching YouTube data:", error)
  }
  return null
}

const fetchYouTubeComments = async (videoId: string) => {
  try {
    const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    let allComments = [];
    let nextPageToken = null;
    let commentCount = 0;
    
    console.log("🔄 Starting to fetch ALL available comments...");
    
    do {
      // Build URL with pageToken if available
      let url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&key=${API_KEY}`;
      if (nextPageToken) {
        url += `&pageToken=${nextPageToken}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }
      
      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        console.log("⚠️ No more comments available");
        break;
      }

      // Map and add current page of comments
      const pageComments = data.items.map((item: any) => ({
        text: item.snippet.topLevelComment.snippet.textDisplay,
        time: new Date(item.snippet.topLevelComment.snippet.publishedAt),
        votes: item.snippet.topLevelComment.snippet.likeCount || 0,
        hearted: item.snippet.topLevelComment.snippet.viewerRating === "like",
        replies: item.snippet.totalReplyCount || 0,
        videoId: videoId, // Add videoId to each comment
      }));

      allComments = [...allComments, ...pageComments];
      commentCount += pageComments.length;
      console.log(`📊 Fetched page of ${pageComments.length} comments, total: ${commentCount}`);
      
      // Update nextPageToken for next iteration
      nextPageToken = data.nextPageToken || null;
      
    } while (nextPageToken); // Continue until no more pages

    console.log(`✅ Completed fetching ALL ${allComments.length} comments for video ${videoId}`);
    return allComments;
  } catch (error) {
    console.error("Error fetching YouTube comments:", error);
    return [];
  }
};



export default SentimentForm

