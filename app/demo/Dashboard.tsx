"use client";
import React, { useEffect, useState } from 'react';
import Chart from 'chart.js/auto';
import { Pie, Bar, Line } from 'react-chartjs-2';
// Word Cloud plugin
import { WordCloudController, WordElement } from 'chartjs-chart-wordcloud';

// Register WordCloud plugin with Chart.js
Chart.register(WordCloudController, WordElement);

interface CommentData {
  _id: string;
  text: string;
  votes: number;
  hearted: boolean;
  replies: number;
  time: string;      // e.g., '2 months ago', '9 months ago'
  sentiment: string; // e.g., 'Neutral', 'Positive', 'Negative'
}

const YouTubeCommentsDashboard: React.FC = () => {
  // Simulated comment data from MongoDB
  const [comments, setComments] = useState<CommentData[]>([
    {
      _id: '67b0ce3e88a311c3da91dcd',
      text: 'COD Fee in shopify: https://youtu.be/rJYSBrmBiZs',
      votes: 0,
      hearted: false,
      replies: 0,
      time: '2 months ago',
      sentiment: 'Neutral',
    },
    {
      _id: '67b0ce3e88a311c3da91dce',
      text: 'How to set domain on localhost?',
      votes: 1,
      hearted: false,
      replies: 0,
      time: '9 months ago',
      sentiment: 'Neutral',
    },
  ]);

  // (Optional) In a real scenario, fetch from your API/MongoDB
  // useEffect(() => {
  //   fetch('/api/comments')
  //     .then((res) => res.json())
  //     .then((data) => setComments(data));
  // }, []);

  /**
   * 1) SENTIMENT INSIGHTS (Pie Chart)
   */
  const sentimentCounts = comments.reduce(
    (acc, comment) => {
      if (comment.sentiment === 'Positive') acc.positive++;
      else if (comment.sentiment === 'Negative') acc.negative++;
      else acc.neutral++;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );

  const sentimentPieData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        label: 'Sentiment Distribution',
        data: [
          sentimentCounts.positive,
          sentimentCounts.neutral,
          sentimentCounts.negative,
        ],
        backgroundColor: ['#4caf50', '#ffeb3b', '#f44336'],
      },
    ],
  };

  /**
   * 2) ENGAGEMENT METRICS (Grouped Bar Chart by Sentiment)
   */
  const sentimentEngagement = comments.reduce((acc, comment) => {
    const s = comment.sentiment || 'Neutral';
    if (!acc[s]) {
      acc[s] = { votes: 0, hearted: 0, replies: 0 };
    }
    acc[s].votes += comment.votes;
    acc[s].hearted += comment.hearted ? 1 : 0;
    acc[s].replies += comment.replies;
    return acc;
  }, {} as Record<string, { votes: number; hearted: number; replies: number }>);

  const sentiments = Object.keys(sentimentEngagement); // e.g. ['Neutral', 'Positive', 'Negative']
  const votesData = sentiments.map((s) => sentimentEngagement[s].votes);
  const heartedData = sentiments.map((s) => sentimentEngagement[s].hearted);
  const repliesData = sentiments.map((s) => sentimentEngagement[s].replies);

  const engagementBarData = {
    labels: sentiments,
    datasets: [
      {
        label: 'Votes',
        data: votesData,
        backgroundColor: '#42a5f5',
      },
      {
        label: 'Hearted',
        data: heartedData,
        backgroundColor: '#ab47bc',
      },
      {
        label: 'Replies',
        data: repliesData,
        backgroundColor: '#ff7043',
      },
    ],
  };

  /**
   * 3) TIME ANALYSIS
   */
  function parseMonthsAgo(timeStr: string): number {
    // e.g. '9 months ago' -> 9
    const match = timeStr.match(/(\\d+)\\s+months?/);
    if (!match) return 0;
    return parseInt(match[1], 10);
  }

  // Build stats by month
  const monthlyStats: Record<
    number,
    { count: number; positive: number; neutral: number; negative: number }
  > = {};

  comments.forEach((comment) => {
    const months = parseMonthsAgo(comment.time);
    if (!monthlyStats[months]) {
      monthlyStats[months] = { count: 0, positive: 0, neutral: 0, negative: 0 };
    }
    monthlyStats[months].count++;
    if (comment.sentiment === 'Positive') {
      monthlyStats[months].positive++;
    } else if (comment.sentiment === 'Negative') {
      monthlyStats[months].negative++;
    } else {
      monthlyStats[months].neutral++;
    }
  });

  const sortedMonths = Object.keys(monthlyStats)
    .map((m) => parseInt(m, 10))
    .sort((a, b) => a - b);

  // Bar Chart: Comments by month
  const commentsByMonthData = {
    labels: sortedMonths.map((m) => `${m} months ago`),
    datasets: [
      {
        label: 'Comments',
        data: sortedMonths.map((m) => monthlyStats[m].count),
        backgroundColor: '#66bb6a',
      },
    ],
  };

  // Line Chart: Sentiment over time
  const sentimentOverTimeData = {
    labels: sortedMonths.map((m) => `${m} months ago`), // FIXED: Use backticks!
    datasets: [
      {
        label: 'Positive',
        data: sortedMonths.map((m) => monthlyStats[m].positive),
        borderColor: '#4caf50',
        fill: false,
      },
      {
        label: 'Neutral',
        data: sortedMonths.map((m) => monthlyStats[m].neutral),
        borderColor: '#ffeb3b',
        fill: false,
      },
      {
        label: 'Negative',
        data: sortedMonths.map((m) => monthlyStats[m].negative),
        borderColor: '#f44336',
        fill: false,
      },
    ],
  };

  /**
   * 4) WORD & EMOJI TRENDS (Word Cloud, Hashtags, Emojis)
   */
  const stopWords = ['in', 'on', 'the', 'a', 'to', 'for', 'and', 'is', 'it'];
  const wordFrequency: Record<string, number> = {};
  const hashtagFrequency: Record<string, number> = {};
  const emojiFrequency: Record<string, number> = {};

  const hashtagRegex = /#[\\w]+/g;
  const emojiRegex =
    /([\\u2700-\\u27BF]|[\\uE000-\\uF8FF]|[\\u1F000-\\u1FAFF]|[\\u1F300-\\u1F5FF]|[\\u1F600-\\u1F64F]|[\\u1F680-\\u1F6FF])/g;

  comments.forEach((comment) => {
    const tokens = comment.text.split(/\\s+/);

    tokens.forEach((token) => {
      // Hashtags
      const hashtags = token.match(hashtagRegex);
      if (hashtags) {
        hashtags.forEach((h) => {
          hashtagFrequency[h] = (hashtagFrequency[h] || 0) + 1;
        });
      }
      // Emojis
      const emojis = token.match(emojiRegex);
      if (emojis) {
        emojis.forEach((e) => {
          emojiFrequency[e] = (emojiFrequency[e] || 0) + 1;
        });
      }

      // Normal words
      const clean = token.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (!stopWords.includes(clean) && clean.length > 1) {
        wordFrequency[clean] = (wordFrequency[clean] || 0) + 1;
      }
    });
  });

  // Word Cloud data
  const wordCloudDataArray = Object.keys(wordFrequency).map((word) => ({
    word,
    weight: wordFrequency[word],
  }));
  
  const wordCloudChartData = {
    labels: wordCloudDataArray.map((w) => w.word), // Words as labels
    datasets: [
      {
        label: "Word Cloud",
        data: wordCloudDataArray.map((w) => w.weight), // Weights as data
      },
    ],
  };
  

  // Top Hashtags
  const topHashtags = Object.entries(hashtagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const hashtagsBarData = {
    labels: topHashtags.map((t) => t[0]),
    datasets: [
      {
        label: 'Hashtag Frequency',
        data: topHashtags.map((t) => t[1]),
        backgroundColor: '#ff9800',
      },
    ],
  };

  // Top Emojis
  const topEmojis = Object.entries(emojiFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const emojisBarData = {
    labels: topEmojis.map((t) => t[0]),
    datasets: [
      {
        label: 'Emoji Frequency',
        data: topEmojis.map((t) => t[1]),
        backgroundColor: '#ef5350',
      },
    ],
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        YouTube Comment Analysis Dashboard
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* SENTIMENT PIE CHART */}
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px' }}>
          <h2>Sentiment Distribution</h2>
          <Pie data={sentimentPieData} />
        </div>

        {/* ENGAGEMENT METRICS BAR CHART */}
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px' }}>
          <h2>Engagement by Sentiment</h2>
          <Bar
            data={engagementBarData}
            options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
          />
        </div>

        {/* COMMENTS BY MONTH (Bar) */}
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px' }}>
          <h2>Monthly Comment Count</h2>
          <Bar data={commentsByMonthData} />
        </div>

        {/* SENTIMENT OVER TIME (Line) */}
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px' }}>
          <h2>Sentiment Trend Over Months</h2>
          <Line data={sentimentOverTimeData} />
        </div>

        {/* WORD CLOUD */}
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px' }}>
          <h2>Word Cloud</h2>
          {/* Using type: 'wordCloud' requires chartjs-chart-wordcloud plugin */}
          <canvas
            id='wordCloudCanvas'
            style={{ width: '100%', height: '400px' }}
          />
        </div>

        {/* TOP HASHTAGS */}
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px' }}>
          <h2>Top Hashtags</h2>
          <Bar data={hashtagsBarData} />
        </div>

        {/* TOP EMOJIS */}
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px' }}>
          <h2>Top Emojis</h2>
          <Bar data={emojisBarData} />
        </div>
      </div>

      {/* Word Cloud Initialization */}
      <script>{`
        (function() {
          var ctx = document.getElementById('wordCloudCanvas').getContext('2d');
          new Chart(ctx, {
            type: 'wordCloud',
            data: ${JSON.stringify(wordCloudChartData)},
            options: {
              title: {
                display: false,
                text: 'Word Cloud'
              },
              plugins: {
                legend: { display: false }
              }
            }
          });
        })();
      `}</script>
    </div>
  );
};

export default YouTubeCommentsDashboard;