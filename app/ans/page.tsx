// app/ans/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const AIAnalysisPage = () => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [transcript, setTranscript] = useState<string>("No transcript available");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const videoId = searchParams.get("videoId");

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        // Fetch AI analysis using videoId
        const analysisResponse = await fetch(`/api/fetchDeepSeek?videoId=${videoId}`);
        if (!analysisResponse.ok) {
          throw new Error(`API Error: ${analysisResponse.statusText}`);
        }
        const analysisData = await analysisResponse.json();
        if (analysisData.error) throw new Error(analysisData.error);
        setAnalysis(analysisData.result);

        // Fetch summary for sentiment analysis
        if (videoId) {
          const summaryResponse = await fetch(`/api/summary?videoId=${videoId}`);
          if (!summaryResponse.ok) {
            throw new Error(`Summary API Error: ${summaryResponse.statusText}`);
          }
          const summaryData = await summaryResponse.json();
          if (summaryData.error) throw new Error(summaryData.error);
          setSummary(summaryData.summary);

          // Fetch transcript
          console.log("📜 Fetching transcript for videoId:", videoId);
          const transcriptResponse = await fetch("/api/getTranscript", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ videoId }),
          });
          if (!transcriptResponse.ok) {
            console.error("❌ Transcript fetch failed:", await transcriptResponse.text());
            setTranscript("No transcript available");
          } else {
            const transcriptData = await transcriptResponse.json();
            const transcriptText = transcriptData.fullText || "No transcript available";
            console.log("✅ Transcript fetched:", transcriptText.slice(0, 100) + "...");
            setTranscript(transcriptText);
          }
        } else {
          throw new Error("Video ID is missing");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [videoId]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative max-w-4xl mx-auto px-4 py-12">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background/0 rounded-3xl -z-10"></div>
        
        <div className="bg-card border border-border rounded-xl p-8 shadow-md">
          <h1 className="text-3xl font-bold text-center text-primary mb-6">AI-Powered Analysis</h1>

          {loading && (
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-lg text-muted-foreground text-center animate-pulse">Fetching AI Analysis...</p>
            </div>
          )}

          {error && (
            <div className="p-6 bg-card border border-destructive/20 rounded-lg text-center">
              <p className="text-destructive text-lg font-medium mb-2">Error</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
          )}

          {analysis && (
            <div className="mt-6 p-6 border border-border rounded-lg bg-background shadow-sm">
              <h2 className="text-xl font-semibold text-card-foreground mb-4">AI Analysis Output</h2>
              <pre className="whitespace-pre-wrap text-foreground text-base leading-relaxed overflow-auto max-h-96 scrollbar-thin scrollbar-thumb-primary scrollbar-track-background">
                {analysis}
              </pre>
            </div>
          )}

          {!loading && !error && !analysis && (
            <p className="text-lg text-muted-foreground text-center py-6">No analysis data available.</p>
          )}

          {/* Navigation Links */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href={videoId ? `/analyze/${videoId}` : "/"} 
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors text-center"
            >
              Back to Analysis
            </Link>
            
            <Link 
              href="/" 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-center"
            >
              Try Another Video
            </Link>
          </div>

          {/* Chatbot Component */}
          {analysis && summary && transcript && <Chatbot analysis={analysis} summary={summary} transcript={transcript} />}
        </div>
      </div>
    </div>
  );
};

// Chatbot Component
const Chatbot = ({ analysis, summary, transcript }: { analysis: string; summary: any; transcript: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sentimentData, setSentimentData] = useState<any>(null);
  const [modelInfo, setModelInfo] = useState<string>("Claude 3 Haiku");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userQuestion = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userQuestion }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userQuestion,
          transcript,
          analysis,
          videoDetails: summary?.videoDetails || {},
          chatHistory: messages
        })
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
      if (data.sentimentAnalysis) {
        setSentimentData(data.sentimentAnalysis);
      }
      if (data.model) {
        setModelInfo(data.model);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I apologize, but I encountered an error while processing your request. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 border border-border rounded-lg overflow-hidden">
      <div className="bg-primary/5 p-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">AI Assistant <span className="text-xs text-muted-foreground ml-2">({modelInfo})</span></h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-primary hover:text-primary/80"
        >
          {isOpen ? "Minimize" : "Open Chat"}
        </button>
      </div>

      {isOpen && (
        <>
          <div className="h-96 overflow-y-auto p-4 space-y-4 bg-card">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground p-4">
                <p>Ask me anything about this video, the creator's emotions, or audience reception!</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground max-w-[80%] rounded-lg p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          
          <div className="p-4 bg-background">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask specifically about this video and its content, not general questions..."
                className="flex-1 p-2 rounded-md border border-input bg-background text-foreground"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>

          {sentimentData && (
            <div className="p-4 bg-card/50 border-t border-border">
              <h4 className="text-sm font-medium mb-2">Content Sentiment Analysis</h4>
              <div className="flex gap-4 text-sm">
                <div className="flex-1">
                  <p>Overall: <span className="font-medium">{sentimentData.overall}</span></p>
                  <p>Score: <span className="font-medium">{sentimentData.score.toFixed(2)}</span></p>
                  {sentimentData.details && (
                    <>
                      <p>Positive comments: <span className="font-medium">{sentimentData.details.positive}</span></p>
                      <p>Negative comments: <span className="font-medium">{sentimentData.details.negative}</span></p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AIAnalysisPage;