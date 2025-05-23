// app/analyze/[videoId]/page.tsx
"use client";

import { useEffect, useState } from "react";import { Pie, Bar } from "react-chartjs-2";import { Chart as ChartJS, registerables } from "chart.js";import { Loader2, Heart, MessageCircle } from "lucide-react";import { useRouter } from "next/navigation";import Link from "next/link";import * as React from "react";

ChartJS.register(...registerables);

interface VideoDetails {
  title: string;
  thumbnail: string;
  channel: string;
  views: string;
  likes: string;
  subscribers: string;
}

interface ProcessingStatus {
  comments: { completed: boolean; total: number; processed: number };
  transcript: { completed: boolean };
  summary: { completed: boolean };
}

// Add a cache for already analyzed videos
const analyzedVideosCache = new Set<string>();

const AnalysisDashboard = ({ params }: { params: Promise<{ videoId: string }> }) => {
  const [loading, setLoading] = useState(true);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    comments: { completed: false, total: 0, processed: 0 },
    transcript: { completed: false },
    summary: { completed: false },
  });
  const [deepLoading, setDeepLoading] = useState(false);
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [transcript, setTranscript] = useState<string>("No transcript available");
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const router = useRouter();
  const { videoId } = React.use(params);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // First, check if we've already analyzed this video in the current session
        if (analyzedVideosCache.has(videoId)) {
          console.log("📋 Video already analyzed in this session, loading cached data");
          
          // Fetch video details
          const details = await fetchYouTubeData(videoId);
          if (details) {
            setVideoDetails(details);
          }
          
          // Try to fetch already analyzed comments
          const analyzedComments = await fetchYouTubeComments(videoId);
          if (analyzedComments.length > 0) {
            setComments(analyzedComments);
          }
          
          // Try to fetch existing transcript
          try {
            const transcriptResponse = await fetch(`/api/getTranscript?videoId=${videoId}`, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            });
            
            if (transcriptResponse.ok) {
              const transcriptData = await transcriptResponse.json();
              if (transcriptData.fullText) {
                setTranscript(transcriptData.fullText);
              }
            }
          } catch (err) {
            console.error("Transcript fetch error:", err);
          }
          
          // Try to fetch existing summary from cache
          try {
            const summaryResponse = await fetch(`/api/summary?videoId=${videoId}`, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            });
            
            if (summaryResponse.ok) {
              const summaryData = await summaryResponse.json();
              if (summaryData.summary) {
                setSummary(summaryData.summary);
                setProcessingStatus({
                  comments: { completed: true, total: analyzedComments.length, processed: analyzedComments.length },
                  transcript: { completed: true },
                  summary: { completed: true },
                });
                setLoading(false);
                return; // Exit early, all data loaded from cache
              }
            }
          } catch (err) {
            console.error("Summary fetch error:", err);
          }
        }

        // If we get here, we need to do a fresh analysis or continue with partially cached data
        
        // Fetch video details
        const details = await fetchYouTubeData(videoId);
        if (details) {
          setVideoDetails(details);
        } else {
          throw new Error("Failed to fetch video details");
        }

        // Step 1: Start comment fetching, analysis and storage process
        console.log("🚀 Starting comment fetching, analysis and storage...");
        setProcessingStatus(prev => ({
          ...prev,
          comments: { ...prev.comments, completed: false }
        }));
        
        const commentResponse = await fetch(`/api/fetch-comments?videoId=${videoId}`);
        const commentData = await commentResponse.json();
        
        if (!commentResponse.ok) {
          console.warn("⚠️ Comment processing started but may take time in the background");
        } else {
          console.log("✅ Comment processing successful:", commentData.commentCount, "comments processed");
          setProcessingStatus(prev => ({
            ...prev,
            comments: { completed: true, total: commentData.commentCount, processed: commentData.commentCount }
          }));
        }

        // Step 2: Fetch transcript
        console.log("📜 Fetching transcript...");
        setProcessingStatus(prev => ({
          ...prev,
          transcript: { completed: false }
        }));
        
        const transcriptResponse = await fetch("/api/getTranscript", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId }),
        });
        
        let transcriptText = "No transcript available";
        if (!transcriptResponse.ok) {
          console.error("❌ Transcript fetch failed:", await transcriptResponse.text());
        } else {
          const transcriptData = await transcriptResponse.json();
          transcriptText = transcriptData.fullText || "No transcript available";
          console.log("✅ Transcript fetched:", transcriptText.slice(0, 100) + "...");
          setProcessingStatus(prev => ({
            ...prev,
            transcript: { completed: true }
          }));
        }
        
        // Update state with transcript
        setTranscript(transcriptText);

        // Step 3: Wait to fetch analyzed comments to use in summary
        console.log("⏳ Fetching analyzed comments...");
        const analyzedComments = await fetchYouTubeComments(videoId);
        setComments(analyzedComments);
        console.log("✅ Fetched", analyzedComments.length, "analyzed comments");

        // Step 4: Generate/fetch summary
        console.log("📊 Generating summary...");
        setProcessingStatus(prev => ({
          ...prev,
          summary: { completed: false }
        }));
        
        // POST to /api/summary
        console.log("📤 Sending to /api/summary:", {
          likes: Number.parseInt(details.likes.replace(/,/g, "")) || 0,
          views: Number.parseInt(details.views.replace(/,/g, "")) || 0,
          transcript: transcriptText,
          videoId,
        });
        
        const summaryPostResponse = await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            likes: Number.parseInt(details.likes.replace(/,/g, "")) || 0,
            views: Number.parseInt(details.views.replace(/,/g, "")) || 0,
            transcript: transcriptText,
            videoId,
          }),
        });
        
        if (!summaryPostResponse.ok) {
          const summaryError = await summaryPostResponse.text();
          console.error("❌ Summary generation failed:", summaryError);
          throw new Error(`Failed to generate summary: ${summaryError}`);
        }
        
        // GET /api/summary
        console.log("🔍 Fetching /api/summary?videoId=", videoId);
        const summaryGetResponse = await fetch(`/api/summary?videoId=${videoId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        
        if (!summaryGetResponse.ok) {
          const summaryError = await summaryGetResponse.text();
          console.error("❌ Summary fetch failed:", summaryError);
          throw new Error(`Failed to fetch summary: ${summaryError}`);
        }
        
        const summaryGetData = await summaryGetResponse.json();
        console.log("📊 Summary Data:", summaryGetData);
        setSummary(summaryGetData.summary);
        
        setProcessingStatus(prev => ({
          ...prev,
          summary: { completed: true }
        }));
        
        // All processing completed
        setLoading(false);
        
        // Add to analyzed videos cache
        analyzedVideosCache.add(videoId);
        
      } catch (err) {
        console.error("🚨 Error in fetchData:", err);
        setError((err as Error).message);
        setLoading(false);
      }
    };

    // Fetch all data
    if (videoId) {
      fetchData();
    }
  }, [videoId]);

  const handleDeepAnalysis = async () => {
    setDeepLoading(true);
    try {
      const postData = {
        likes: videoDetails ? Number.parseInt(videoDetails.likes.replace(/,/g, "")) || 0 : 0,
        views: videoDetails ? Number.parseInt(videoDetails.views.replace(/,/g, "")) || 0 : 0,
        commentsDB: comments.map((c) => ({
          text: c.text,
          sentiment: c.sentiment,
          votes: c.votes,
          timestamp: c.timestamp,
        })),
        transcript,
        videoId,
      };

      console.log("📤 Sending to /api/fetchDeepSeek:", postData);

      const response = await fetch("/api/fetchDeepSeek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start AI analysis");
      }

      router.push(`/ans?videoId=${videoId}`);
    } catch (err) {
      console.error("Error in handleDeepAnalysis:", err);
      setError(`Failed to start AI analysis: ${(err as Error).message}`);
      setDeepLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
        <h2 className="text-xl font-semibold mb-4">Analyzing your video...</h2>
        <div className="w-72 md:w-96 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Fetching & analyzing comments</span>
              <span>{processingStatus.comments.completed ? "✓ Complete" : "Processing..."}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all" 
                style={{ width: processingStatus.comments.completed ? "100%" : "60%" }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing transcript</span>
              <span>{processingStatus.transcript.completed ? "✓ Complete" : "Processing..."}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all" 
                style={{ width: processingStatus.transcript.completed ? "100%" : "70%" }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Generating insights</span>
              <span>{processingStatus.summary.completed ? "✓ Complete" : "Processing..."}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all" 
                style={{ width: processingStatus.summary.completed ? "100%" : "40%" }}
              ></div>
            </div>
          </div>
          
          <p className="text-sm text-center text-muted-foreground mt-4">
            This may take a few minutes as we analyze all comments and content
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="p-6 bg-card border border-destructive/20 rounded-lg shadow-lg text-center">
          <p className="text-destructive text-xl font-medium mb-4">Error</p>
          <p className="text-card-foreground">{error}</p>
          <Link href="/" className="mt-6 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (!summary || !videoDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="p-6 bg-card border border-border rounded-lg shadow-lg text-center">
          <p className="text-muted-foreground text-xl">No data available</p>
          <Link href="/" className="mt-6 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const { sentimentDistribution, engagementMetrics, timeAnalysis, wordAndEmojiTrends } = summary || {};

  const sentimentPieData = {
    labels: ["Positive", "Neutral", "Negative"],
    datasets: [
      {
        data: [
          sentimentDistribution?.positive || 0,
          sentimentDistribution?.neutral || 0,
          sentimentDistribution?.negative || 0,
        ],
        backgroundColor: ["#4caf50", "#ffeb3b", "#f44336"],
      },
    ],
  };

  const engagementBarData = {
    labels: ["Votes", "Hearted", "Replies"],
    datasets: [
      {
        label: "Positive",
        data: [
          engagementMetrics?.positive?.votes || 0,
          engagementMetrics?.positive?.hearted || 0,
          engagementMetrics?.positive?.replies || 0,
        ],
        backgroundColor: "#4caf50",
      },
      {
        label: "Neutral",
        data: [
          engagementMetrics?.neutral?.votes || 0,
          engagementMetrics?.neutral?.hearted || 0,
          engagementMetrics?.neutral?.replies || 0,
        ],
        backgroundColor: "#ffeb3b",
      },
      {
        label: "Negative",
        data: [
          engagementMetrics?.negative?.votes || 0,
          engagementMetrics?.negative?.hearted || 0,
          engagementMetrics?.negative?.replies || 0,
        ],
        backgroundColor: "#f44336",
      },
    ],
  };

  const timeBarData = {
    labels: (timeAnalysis?.sentimentOverTime || []).map((entry: any) => `${entry.hour}:00`),
    datasets: [
      {
        label: "Positive",
        data: (timeAnalysis?.sentimentOverTime || []).map((entry: any) => entry.positive || 0),
        backgroundColor: "#4caf50",
      },
      {
        label: "Neutral",
        data: (timeAnalysis?.sentimentOverTime || []).map((entry: any) => entry.neutral || 0),
        backgroundColor: "#ffeb3b",
      },
      {
        label: "Negative",
        data: (timeAnalysis?.sentimentOverTime || []).map((entry: any) => entry.negative || 0),
        backgroundColor: "#f44336",
      },
    ],
  };

  const topWords = (wordAndEmojiTrends?.wordFrequency || [])
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10);

  const wordBarData = {
    labels: topWords.map((item: any) => item.word || ""),
    datasets: [
      {
        label: "Word Frequency",
        data: topWords.map((item: any) => item.count || 0),
        backgroundColor: "#4caf50",
      },
    ],
  };

  const hashtagBarData = {
    labels: (wordAndEmojiTrends?.hashtagFrequency || []).map((item: any) => item.hashtag || ""),
    datasets: [
      {
        label: "Hashtag Frequency",
        data: (wordAndEmojiTrends?.hashtagFrequency || []).map((item: any) => item.count || 0),
        backgroundColor: "#2196f3",
      },
    ],
  };

  const emojiBarData = {
    labels: (wordAndEmojiTrends?.emojiFrequency || []).map((item: any) => item.emoji || ""),
    datasets: [
      {
        label: "Emoji Frequency",
        data: (wordAndEmojiTrends?.emojiFrequency || []).map((item: any) => item.count || 0),
        backgroundColor: "#ff5722",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <div className="relative max-w-7xl mx-auto px-4 py-8">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background/0 rounded-3xl -z-10"></div>
        
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="m12 19-7-7 7-7"/>
              <path d="M19 12H5"/>
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Video header card */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 shadow-md">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <img
                  src={videoDetails.thumbnail}
                  alt={videoDetails.title}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
            <div className="md:w-2/3">
              <h1 className="text-2xl font-bold text-card-foreground mb-2">{videoDetails.title}</h1>
              <p className="text-muted-foreground mb-4">{videoDetails.channel}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-background p-4 rounded-lg">
                  <p className="text-muted-foreground text-sm">Views</p>
                  <p className="text-card-foreground text-lg font-semibold">{videoDetails.views}</p>
                </div>
                <div className="bg-background p-4 rounded-lg">
                  <p className="text-muted-foreground text-sm">Likes</p>
                  <p className="text-card-foreground text-lg font-semibold">{videoDetails.likes}</p>
                </div>
                <div className="bg-background p-4 rounded-lg">
                  <p className="text-muted-foreground text-sm">Subscribers</p>
                  <p className="text-card-foreground text-lg font-semibold">{videoDetails.subscribers}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

                {/* Analysis dashboard content - First row */}        <div className="grid grid-cols-1 gap-8 mb-8">          {/* Sentiment Distribution */}          <div className="bg-card border border-border rounded-xl p-6 shadow-md">            <h2 className="text-xl font-semibold text-card-foreground mb-4">Sentiment Distribution</h2>            <div className="aspect-square w-full max-w-xs mx-auto">              <Pie                 data={sentimentPieData}                 options={{                  plugins: {                    legend: {                      position: 'bottom',                      labels: {                        color: 'var(--foreground)',                        font: {                          size: 12                        }                      }                    }                  }                }}              />            </div>          </div>        </div>

        {/* Analysis dashboard content - Second row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Engagement Metrics */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">Engagement by Sentiment</h2>
            <div className="h-64">
              <Bar 
                data={engagementBarData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: 'var(--foreground)',
                        font: { size: 12 }
                      }
                    }
                  },
                  scales: {
                    x: {
                      ticks: { color: 'var(--foreground)' },
                      grid: { color: 'var(--border)' }
                    },
                    y: {
                      ticks: { color: 'var(--foreground)' },
                      grid: { color: 'var(--border)' }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Time Analysis */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">Sentiment Over Time</h2>
            <div className="h-64">
              <Bar 
                data={timeBarData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: 'var(--foreground)',
                        font: { size: 12 }
                      }
                    }
                  },
                  scales: {
                    x: {
                      ticks: { color: 'var(--foreground)' },
                      grid: { color: 'var(--border)' }
                    },
                    y: {
                      ticks: { color: 'var(--foreground)' },
                      grid: { color: 'var(--border)' }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Analysis dashboard content - Third row - Vertical Layout */}
        <div className="grid grid-cols-1 gap-8 mb-8">
          {/* Word Frequency */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">Word Frequency</h2>
            <div className="h-64">
              <Bar 
                data={wordBarData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    x: {
                      ticks: { color: 'var(--foreground)' },
                      grid: { color: 'var(--border)' }
                    },
                    y: {
                      ticks: { color: 'var(--foreground)' },
                      grid: { color: 'var(--border)' }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Hashtag Frequency */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">Hashtag Frequency</h2>
            <div className="h-64">
              <Bar 
                data={hashtagBarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    x: {
                      ticks: { color: 'var(--foreground)' },
                      grid: { color: 'var(--border)' }
                    },
                    y: {
                      ticks: { color: 'var(--foreground)' },
                      grid: { color: 'var(--border)' }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Emoji Frequency */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">Emoji Frequency</h2>
            <div className="h-64">
              <Bar 
                data={emojiBarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    x: {
                      ticks: { color: 'var(--foreground)' },
                      grid: { color: 'var(--border)' }
                    },
                    y: {
                      ticks: { color: 'var(--foreground)' },
                      grid: { color: 'var(--border)' }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Deep Analysis Button */}
        <div className="text-center mt-12">
          <button
            onClick={handleDeepAnalysis}
            disabled={deepLoading}
            className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors mb-4"
          >
            {deepLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                Running AI Analysis...
              </>
            ) : (
              "Get AI Analysis Report"
            )}
          </button>
          <p className="text-muted-foreground text-sm mb-6">
            Get a detailed AI analysis of the video's content and audience reaction
          </p>
          
          {/* New feature buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <Link
              href={`/analyze/${videoId}/creator-health`}
              className="px-8 py-3 bg-secondary text-secondary-foreground font-semibold rounded-full hover:bg-secondary/90 transition-colors inline-flex items-center justify-center"
            >
              <Heart className="w-5 h-5 mr-2" />
              Creator Health Analysis
            </Link>
            <Link
              href={`/analyze/${videoId}/chat`}
              className="px-8 py-3 bg-accent text-accent-foreground font-semibold rounded-full hover:bg-accent/90 transition-colors inline-flex items-center justify-center"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Chat About This Video
            </Link>
          </div>
          <p className="text-muted-foreground text-sm mt-4">
            New features powered by AI to get deeper insights and interact with your content
          </p>
        </div>
      </div>
    </div>
  );
};

const fetchYouTubeData = async (videoId: string): Promise<VideoDetails | null> => {
  try {
    const response = await fetch(`/api/videoDetails?videoId=${videoId}`);
    if (!response.ok) throw new Error("Failed to fetch video details");
    return await response.json();
  } catch (error) {
    console.error("Error fetching YouTube data:", error);
    return null;
  }
};

const fetchYouTubeComments = async (videoId: string) => {
  try {
    // First try to fetch from our MongoDB (already analyzed comments)
    const response = await fetch(`/api/comments?videoId=${videoId}`);
    if (!response.ok) {
      console.error("Failed to fetch comments from API, waiting for analysis to complete");
      
      // Poll for comments to be ready
      let attempts = 0;
      const maxAttempts = 5;
      let fetchedComments = [];
      
      while (attempts < maxAttempts) {
        console.log(`Attempt ${attempts + 1}/${maxAttempts} to get analyzed comments...`);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds between attempts
        
        const retryResponse = await fetch(`/api/comments?videoId=${videoId}`);
        if (retryResponse.ok) {
          fetchedComments = await retryResponse.json();
          if (fetchedComments.length > 0) {
            console.log(`✅ Successfully fetched ${fetchedComments.length} analyzed comments on retry`);
            return fetchedComments;
          }
        }
        
        attempts++;
      }
      
      // If still no comments, use a minimal set for the UI to work
      console.warn("⚠️ Couldn't fetch analyzed comments after retries, using minimal set");
      return [
        {
          text: "Comments are still being analyzed",
          time: new Date(),
          votes: 0,
          hearted: false,
          replies: 0,
          videoId,
          sentiment: "neutral"
        }
      ];
    }
    
    const comments = await response.json();
    return comments;
  } catch (error) {
    console.error("Error fetching YouTube comments:", error);
    return [];
  }
};

export default AnalysisDashboard;