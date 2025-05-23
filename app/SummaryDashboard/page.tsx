"use client"

import { useEffect, useState } from "react"
import { Pie, Bar } from "react-chartjs-2"
import { Chart as ChartJS, registerables } from "chart.js"
import { WordCloudController, WordElement } from "chartjs-chart-wordcloud"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import Link from "next/link"

// Register Chart.js components and the word cloud plugin.
ChartJS.register(...registerables, WordCloudController, WordElement)

const SummaryDashboard = () => {
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [deepLoading, setDeepLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch("/api/summary", { method: "GET" })
        if (!res.ok) {
          throw new Error(`Error: ${res.statusText}`)
        }
        const data = await res.json()
        setSummary(data.summary)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [])

  const handleDeepAnalysis = () => {
    setDeepLoading(true)
    router.push("/ans")
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-red-500 text-xl">Error: {error}</p>
      </div>
    )
  if (!summary)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-gray-400 text-xl">No summary data available.</p>
      </div>
    )

  // Destructure the summary object.
  const { sentimentDistribution, engagementMetrics, wordAndEmojiTrends } = summary

  // Pie Chart: Sentiment Insights
  const sentimentPieData = {
    labels: ["Positive", "Neutral", "Negative"],
    datasets: [
      {
        data: [sentimentDistribution.positive, sentimentDistribution.neutral, sentimentDistribution.negative],
        backgroundColor: ["#4caf50", "#ffeb3b", "#f44336"],
      },
    ],
  }

  // Bar Chart: Engagement Metrics
  const engagementBarData = {
    labels: ["Votes", "Hearted", "Replies"],
    datasets: [
      {
        label: "Positive",
        data: [
          engagementMetrics.positive.votes,
          engagementMetrics.positive.hearted,
          engagementMetrics.positive.replies,
        ],
        backgroundColor: "#4caf50",
      },
      {
        label: "Neutral",
        data: [engagementMetrics.neutral.votes, engagementMetrics.neutral.hearted, engagementMetrics.neutral.replies],
        backgroundColor: "#ffeb3b",
      },
      {
        label: "Negative",
        data: [
          engagementMetrics.negative.votes,
          engagementMetrics.negative.hearted,
          engagementMetrics.negative.replies,
        ],
        backgroundColor: "#f44336",
      },
    ],
  }

  const topWords = [...wordAndEmojiTrends.wordFrequency].sort((a: any, b: any) => b.count - a.count).slice(0, 10)

  const wordBarData = {
    labels: topWords.map((item: any) => item.word),
    datasets: [
      {
        label: "Word Frequency",
        data: topWords.map((item: any) => item.count),
        backgroundColor: "#4caf50",
      },
    ],
  }

  // Bar Chart: Hashtag Frequency
  const hashtagBarData = {
    labels: wordAndEmojiTrends.hashtagFrequency.map((item: any) => item.hashtag),
    datasets: [
      {
        label: "Hashtag Frequency",
        data: wordAndEmojiTrends.hashtagFrequency.map((item: any) => item.count),
        backgroundColor: "#2196f3",
      },
    ],
  }

  // Bar Chart: Emoji Frequency
  const emojiBarData = {
    labels: wordAndEmojiTrends.emojiFrequency.map((item: any) => item.emoji),
    datasets: [
      {
        label: "Emoji Frequency",
        data: wordAndEmojiTrends.emojiFrequency.map((item: any) => item.count),
        backgroundColor: "#ff5722",
      },
    ],
  }

  return (
    <div className="min-h-screen bg-gray-900 bg-opacity-30 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-extrabold text-center text-purple-400 mb-10 glow">6️⃣ Summary Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="p-6 bg-gray-800 rounded-lg shadow-lg glow-card">
            <h2 className="text-2xl font-bold text-purple-300 mb-4">📊 Sentiment Insights</h2>
            <Pie data={sentimentPieData} options={{ plugins: { legend: { labels: { color: "white" } } } }} />
          </section>

          <section className="p-6 bg-gray-800 rounded-lg shadow-lg glow-card">
            <h2 className="text-2xl font-bold text-purple-300 mb-4">🔥 Engagement Metrics</h2>
            <Bar
              data={engagementBarData}
              options={{
                responsive: true,
                plugins: { legend: { position: "top", labels: { color: "white" } } },
                scales: { x: { ticks: { color: "white" } }, y: { ticks: { color: "white" } } },
              }}
            />
          </section>
        </div>

        <section className="mt-10 p-6 bg-gray-800 rounded-lg shadow-lg glow-card">
          <h2 className="text-2xl font-bold text-purple-300 mb-4">🔠 Word & Emoji Trends</h2>
          <div className="p-4 bg-gray-700 rounded-lg shadow mb-6">
            <h3 className="text-xl font-semibold text-purple-200 mb-2">Most Used Words</h3>
            <Bar
              data={wordBarData}
              options={{
                responsive: true,
                plugins: { legend: { position: "top", labels: { color: "white" } } },
                scales: { x: { ticks: { color: "white" } }, y: { ticks: { color: "white" } } },
              }}
            />
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-purple-200 mb-2">Top Hashtags</h3>
            <Bar
              data={hashtagBarData}
              options={{
                responsive: true,
                plugins: { legend: { position: "top", labels: { color: "white" } } },
                scales: { x: { ticks: { color: "white" } }, y: { ticks: { color: "white" } } },
              }}
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-purple-200 mb-2">Top Emojis</h3>
            <Bar
              data={emojiBarData}
              options={{
                responsive: true,
                plugins: { legend: { position: "top", labels: { color: "white" } } },
                scales: { x: { ticks: { color: "white" } }, y: { ticks: { color: "white" } } },
              }}
            />
          </div>
        </section>

        <p className="mt-10 text-center text-gray-400 text-lg">
          This dashboard provides a comprehensive view of YouTube comment sentiment, engagement, and trends. 🚀
        </p>

        <div className="flex justify-center mt-10">
          <button
            onClick={handleDeepAnalysis}
            disabled={deepLoading}
            className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg shadow hover:bg-purple-700 transition duration-300 glow-button"
          >
            {deepLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                Processing Deep Analysis...
              </>
            ) : (
              "Run Deep Analysis & Go to Answer Page"
            )}
          </button>
          </div>
          <div className="mt-12 text-center">
          <Link href="/" className="block mt-6  text-center text-purple-300 text-lg hover:text-purple-500 transition duration-300">
  Try For Another YouTube Video
</Link>
</div>

        </div>
      </div>
  )
}

export default SummaryDashboard;

