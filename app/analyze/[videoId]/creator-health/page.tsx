"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Brain, Heart, MessageCircle, TrendingUp, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface HealthMetrics {
  transcriptSentiment: {
    sentiment: string;
    score: number;
    stressLevel: number;
    details: {
      positivePatterns: string[];
      negativePatterns: string[];
      stressSignals: string[];
    }
  };
  commentSentiment: {
    average: number;
    stressLevel: number;
    totalComments: number;
  };
}

const CreatorHealthPage = () => {
  const { videoId } = useParams();
  const [analysis, setAnalysis] = useState<string>("");
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/creator-health?videoId=${videoId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch analysis");
        }
        const data = await response.json();
        setAnalysis(data.analysis);
        setMetrics(data.metrics);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchAnalysis();
    } else {
      setError("No video ID provided");
      setLoading(false);
    }
  }, [videoId]);

  const getSentimentColor = (score: number) => {
    if (score > 0.2) return "text-green-500";
    if (score < -0.2) return "text-red-500";
    return "text-yellow-500";
  };

  const getStressLevelColor = (level: number) => {
    if (level < 0.1) return "text-green-500";
    if (level > 0.3) return "text-red-500";
    return "text-yellow-500";
  };

  const renderEmotionalIndicators = (indicators: string[], type: 'positive' | 'negative' | 'stress') => {
    const colors = {
      positive: 'bg-green-100 text-green-800',
      negative: 'bg-red-100 text-red-800',
      stress: 'bg-yellow-100 text-yellow-800'
    };

    return indicators.map((indicator, index) => (
      <span
        key={index}
        className={`inline-block px-2 py-1 rounded-full text-xs font-medium mr-2 mb-2 ${colors[type]}`}
      >
        {indicator}
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-lg text-muted-foreground">Analyzing creator well-being...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto bg-card border border-destructive/20 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
          <h1 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
            <Brain className="w-6 h-6" />
            Creator Mental Health Analysis
          </h1>

          {metrics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-card/50 border border-border rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" />
                    Content Sentiment
                  </h2>
                  <div className="space-y-2">
                    <p>
                      Overall Tone:{" "}
                      <span className={getSentimentColor(metrics.transcriptSentiment.score)}>
                        {metrics.transcriptSentiment.sentiment}
                      </span>
                    </p>
                    <p>
                      Emotional Score:{" "}
                      <span className={getSentimentColor(metrics.transcriptSentiment.score)}>
                        {metrics.transcriptSentiment.score.toFixed(2)}
                      </span>
                    </p>
                    <p>
                      Stress Level:{" "}
                      <span className={getStressLevelColor(metrics.transcriptSentiment.stressLevel)}>
                        {(metrics.transcriptSentiment.stressLevel * 100).toFixed(1)}%
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-card/50 border border-border rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    Audience Interaction
                  </h2>
                  <div className="space-y-2">
                    <p>
                      Comments Analyzed: <span className="font-medium">{metrics.commentSentiment.totalComments}</span>
                    </p>
                    <p>
                      Comment Sentiment:{" "}
                      <span className={getSentimentColor(metrics.commentSentiment.average)}>
                        {metrics.commentSentiment.average.toFixed(2)}
                      </span>
                    </p>
                    <p>
                      Community Stress:{" "}
                      <span className={getStressLevelColor(metrics.commentSentiment.stressLevel)}>
                        {(metrics.commentSentiment.stressLevel * 100).toFixed(1)}%
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card/50 border border-border rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold mb-3">Emotional Indicators</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-green-600 mb-2">Positive Patterns</h3>
                    <div>
                      {renderEmotionalIndicators(metrics.transcriptSentiment.details.positivePatterns, 'positive')}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-red-600 mb-2">Concerning Patterns</h3>
                    <div>
                      {renderEmotionalIndicators(metrics.transcriptSentiment.details.negativePatterns, 'negative')}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-600 mb-2">Stress Indicators</h3>
                    <div>
                      {renderEmotionalIndicators(metrics.transcriptSentiment.details.stressSignals, 'stress')}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="bg-card/50 border border-border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Detailed Analysis
            </h2>
            <div className="prose prose-sm max-w-none">
              {analysis.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4 text-card-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-4">
            <Link
              href={`/analyze/${videoId}`}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
            >
              Back to Analysis
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Analyze Another Video
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorHealthPage; 