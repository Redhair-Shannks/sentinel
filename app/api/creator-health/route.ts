import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import { Comment } from "@/lib/models/comment";
import mongoose from "mongoose";

// Get the latest OpenRouter API key - try both keys
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Define a schema for caching creator health analysis results
let CreatorHealthCache;
try {
  CreatorHealthCache = mongoose.model("CreatorHealthCache");
} catch {
  const creatorHealthCacheSchema = new mongoose.Schema({
    videoId: { type: String, required: true, unique: true },
    analysisResult: { type: Object, required: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 } // Cache for 24 hours
  });
  
  CreatorHealthCache = mongoose.model("CreatorHealthCache", creatorHealthCacheSchema);
}

// Log which API key is being used (without revealing the full key)
console.log('Using OpenRouter API Key ending with:', OPENROUTER_API_KEY ? OPENROUTER_API_KEY.slice(-6) : 'undefined');

// Emotional and mental health indicators
const INDICATORS = {
  positive: {
    emotions: new Set([
      'happy', 'great', 'awesome', 'excellent', 'love', 'amazing', 'excited', 'passionate',
      'energetic', 'grateful', 'joy', 'wonderful', 'fun', 'positive', 'inspired', 'proud',
      'confident', 'motivated', 'enthusiastic', 'peaceful', 'satisfied', 'accomplished'
    ]),
    engagement: new Set([
      'connect', 'share', 'help', 'support', 'community', 'together', 'collaboration',
      'feedback', 'interaction', 'discussion', 'conversation', 'engagement'
    ]),
    resilience: new Set([
      'overcome', 'learn', 'grow', 'improve', 'adapt', 'progress', 'develop',
      'balance', 'mindful', 'self-care', 'rest', 'recharge', 'boundaries'
    ])
  },
  negative: {
    emotions: new Set([
      'sad', 'bad', 'awful', 'terrible', 'hate', 'angry', 'frustrated', 'depressed',
      'unhappy', 'anxious', 'worried', 'scared', 'lonely', 'hopeless', 'overwhelmed',
      'discouraged', 'disappointed', 'insecure', 'inadequate', 'worthless'
    ]),
    burnout: new Set([
      'exhausted', 'drained', 'tired', 'burnt', 'overworked', 'stressed',
      'pressure', 'deadline', 'behind', 'struggle', 'failing', 'quit'
    ]),
    isolation: new Set([
      'alone', 'isolated', 'disconnected', 'ignored', 'rejected', 'misunderstood',
      'unsupported', 'abandoned', 'excluded', 'distant'
    ])
  },
  workLifeBalance: {
    positive: new Set([
      'break', 'vacation', 'rest', 'relax', 'family', 'friends', 'hobby', 'exercise',
      'sleep', 'meditation', 'balance', 'boundaries', 'schedule', 'routine'
    ]),
    negative: new Set([
      'overwork', 'nonstop', 'always', 'constant', 'never', 'sacrifice', 'miss',
      'cancel', 'postpone', 'delay', 'neglect', 'ignore'
    ])
  },
  mentalHealth: {
    awareness: new Set([
      'therapy', 'counseling', 'mental health', 'self-care', 'wellbeing', 'support',
      'help', 'professional', 'treatment', 'recovery', 'healing'
    ]),
    warning: new Set([
      'anxiety', 'depression', 'panic', 'crisis', 'breakdown', 'burnout',
      'trauma', 'stress', 'pressure', 'overwhelming', 'suicide', 'self-harm'
    ])
  }
};

interface SentimentAnalysis {
  sentiment: string;
  score: number;
  details: {
    emotions: {
      positive: string[];
      negative: string[];
    };
    workLifeBalance: {
      positive: string[];
      negative: string[];
    };
    mentalHealth: {
      awareness: string[];
      warning: string[];
    };
    engagement: string[];
    burnout: string[];
    isolation: string[];
    resilience: string[];
  };
  patterns: {
    emotionalState: number;
    burnoutRisk: number;
    workLifeBalance: number;
    communitySupport: number;
    mentalHealthAwareness: number;
  };
}

function analyzeSentiment(text: string): SentimentAnalysis {
  const words = text.toLowerCase().split(/\s+/);
  const wordPairs = [];
  for (let i = 0; i < words.length - 1; i++) {
    wordPairs.push(`${words[i]} ${words[i + 1]}`);
  }

  // Initialize counters for each category
  const counts = {
    positiveEmotions: 0,
    negativeEmotions: 0,
    positiveEngagement: 0,
    burnout: 0,
    isolation: 0,
    resilience: 0,
    positiveWorkLife: 0,
    negativeWorkLife: 0,
    mentalHealthAwareness: 0,
    mentalHealthWarning: 0
  };

  // Initialize arrays to store found indicators
  const found = {
    emotions: { positive: new Set(), negative: new Set() },
    workLifeBalance: { positive: new Set(), negative: new Set() },
    mentalHealth: { awareness: new Set(), warning: new Set() },
    engagement: new Set(),
    burnout: new Set(),
    isolation: new Set(),
    resilience: new Set()
  };

  // Check single words and word pairs
  [...words, ...wordPairs].forEach(term => {
    // Check each category
    if (INDICATORS.positive.emotions.has(term)) {
      counts.positiveEmotions++;
      found.emotions.positive.add(term);
    }
    if (INDICATORS.negative.emotions.has(term)) {
      counts.negativeEmotions++;
      found.emotions.negative.add(term);
    }
    if (INDICATORS.positive.engagement.has(term)) {
      counts.positiveEngagement++;
      found.engagement.add(term);
    }
    if (INDICATORS.negative.burnout.has(term)) {
      counts.burnout++;
      found.burnout.add(term);
    }
    if (INDICATORS.negative.isolation.has(term)) {
      counts.isolation++;
      found.isolation.add(term);
    }
    if (INDICATORS.positive.resilience.has(term)) {
      counts.resilience++;
      found.resilience.add(term);
    }
    if (INDICATORS.workLifeBalance.positive.has(term)) {
      counts.positiveWorkLife++;
      found.workLifeBalance.positive.add(term);
    }
    if (INDICATORS.workLifeBalance.negative.has(term)) {
      counts.negativeWorkLife++;
      found.workLifeBalance.negative.add(term);
    }
    if (INDICATORS.mentalHealth.awareness.has(term)) {
      counts.mentalHealthAwareness++;
      found.mentalHealth.awareness.add(term);
    }
    if (INDICATORS.mentalHealth.warning.has(term)) {
      counts.mentalHealthWarning++;
      found.mentalHealth.warning.add(term);
    }
  });

  // Calculate normalized scores (0 to 1)
  const totalWords = words.length;
  const patterns = {
    emotionalState: (counts.positiveEmotions - counts.negativeEmotions) / totalWords,
    burnoutRisk: (counts.burnout + counts.negativeWorkLife) / totalWords,
    workLifeBalance: (counts.positiveWorkLife - counts.negativeWorkLife) / totalWords,
    communitySupport: (counts.positiveEngagement - counts.isolation) / totalWords,
    mentalHealthAwareness: counts.mentalHealthAwareness / totalWords
  };

  return {
    sentiment: patterns.emotionalState > 0 ? 'positive' : patterns.emotionalState < 0 ? 'negative' : 'neutral',
    score: patterns.emotionalState,
    details: {
      emotions: {
        positive: Array.from(found.emotions.positive),
        negative: Array.from(found.emotions.negative)
      },
      workLifeBalance: {
        positive: Array.from(found.workLifeBalance.positive),
        negative: Array.from(found.workLifeBalance.negative)
      },
      mentalHealth: {
        awareness: Array.from(found.mentalHealth.awareness),
        warning: Array.from(found.mentalHealth.warning)
      },
      engagement: Array.from(found.engagement),
      burnout: Array.from(found.burnout),
      isolation: Array.from(found.isolation),
      resilience: Array.from(found.resilience)
    },
    patterns
  };
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const videoId = req.nextUrl.searchParams.get('videoId');
    if (!videoId) {
      return NextResponse.json({ error: "No video ID provided" }, { status: 400 });
    }

    console.log(`🔍 Analyzing creator health for video: ${videoId}`);
    
    // First check for cached analysis
    try {
      const cachedAnalysis = await CreatorHealthCache.findOne({ videoId }).lean();
      if (cachedAnalysis) {
        console.log(`✅ Found cached creator health analysis for video ${videoId}`);
        return NextResponse.json({ 
          ...cachedAnalysis.analysisResult,
          cached: true 
        });
      }
      console.log("🔄 No cached analysis found, performing new analysis");
    } catch (cacheError) {
      console.error("💾 Cache check error:", cacheError);
      // Continue with a fresh analysis
    }

    // Fetch all comments for the video - ensure we're using all available comments
    const comments = await Comment.find({ videoId })
      .sort({ time: -1 })
      .lean();
      
    console.log(`📊 Analyzing ${comments.length} comments for creator health assessment`);
    
    if (!comments || comments.length === 0) {
      console.log("⚠️ No comments found for video");
    }

    // Fetch transcript
    let transcript = "";
    let transcriptError = null;
    
    try {
      console.log("📜 Fetching transcript...");
      const transcriptResponse = await fetch(`${req.nextUrl.origin}/api/getTranscript`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...req.headers
        },
        body: JSON.stringify({ videoId }),
      });
      
      const transcriptData = await transcriptResponse.json();
      
      if (!transcriptResponse.ok) {
        transcriptError = transcriptData.error || "Failed to fetch transcript";
        console.error("❌ Failed to fetch transcript:", transcriptError);
      } else {
        transcript = transcriptData.fullText || "";
        console.log("✅ Transcript fetched:", transcript.slice(0, 100) + "...");
      }
    } catch (error) {
      transcriptError = error.message || "Error processing transcript";
      console.error("❌ Error fetching transcript:", error);
    }

    if (!transcript) {
      console.log("⚠️ No transcript available for video");
    }

    // Analyze content and comments
    const transcriptAnalysis = analyzeSentiment(transcript);
    const commentAnalyses = comments.map(comment => analyzeSentiment(comment.text));

    // Calculate aggregate metrics
    const aggregateCommentMetrics = commentAnalyses.reduce((acc, curr) => ({
      emotionalState: acc.emotionalState + curr.patterns.emotionalState,
      burnoutRisk: acc.burnoutRisk + curr.patterns.burnoutRisk,
      workLifeBalance: acc.workLifeBalance + curr.patterns.workLifeBalance,
      communitySupport: acc.communitySupport + curr.patterns.communitySupport,
      mentalHealthAwareness: acc.mentalHealthAwareness + curr.patterns.mentalHealthAwareness
    }), {
      emotionalState: 0,
      burnoutRisk: 0,
      workLifeBalance: 0,
      communitySupport: 0,
      mentalHealthAwareness: 0
    });

    const commentMetrics = {
      total: comments.length,
      patterns: Object.entries(aggregateCommentMetrics).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: comments.length ? value / comments.length : 0
      }), {} as typeof aggregateCommentMetrics)
    };

    // Generate analysis with Gemini
    console.log('Sending request to OpenRouter API with Claude model');
    
    try {
      const modelResponse = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': req.headers.get('referer') || 'https://localhost:3000',
          'X-Title': 'YouTube Creator Health Analysis'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-sonnet-20240229',
          messages: [
            {
              role: "system",
              content: `You are an AI specialized in analyzing YouTube creator mental health and well-being. 
              Focus on:
              1. Speech patterns and emotional indicators in transcripts
              2. Signs of stress, burnout, or fatigue
              3. Creator-audience relationship
              4. Work-life balance indicators
              5. Overall emotional state
              
              Provide actionable insights and recommendations for maintaining good mental health.
              If there are concerning patterns, suggest professional resources or coping strategies.
              Be empathetic but professional in your analysis.`
            },
            {
              role: "user",
              content: `Analyze this creator's mental health based on their video transcript and audience comments:
              
              CONTENT ANALYSIS:
              - Overall Sentiment: ${transcriptAnalysis.sentiment}
              - Emotional State Score: ${transcriptAnalysis.patterns.emotionalState.toFixed(2)}
              - Burnout Risk Level: ${transcriptAnalysis.patterns.burnoutRisk.toFixed(2)}
              - Work-Life Balance: ${transcriptAnalysis.patterns.workLifeBalance.toFixed(2)}
              
              Positive Emotions: ${transcriptAnalysis.details.emotions.positive.join(', ')}
              Negative Emotions: ${transcriptAnalysis.details.emotions.negative.join(', ')}
              
              MENTAL HEALTH INDICATORS:
              - Awareness Terms: ${transcriptAnalysis.details.mentalHealth.awareness.join(', ')}
              - Warning Signs: ${transcriptAnalysis.details.mentalHealth.warning.join(', ')}
              - Resilience Indicators: ${transcriptAnalysis.details.resilience.join(', ')}
              
              AUDIENCE INTERACTION (${commentMetrics.total} comments):
              - Community Support: ${commentMetrics.patterns.communitySupport.toFixed(2)}
              - Audience Emotional State: ${commentMetrics.patterns.emotionalState.toFixed(2)}
              - Community Mental Health Awareness: ${commentMetrics.patterns.mentalHealthAwareness.toFixed(2)}
              
              ${transcript ? `TRANSCRIPT EXCERPT:\n"${transcript.slice(0, 1000)}..."` : 'No transcript available. ' + (transcriptError ? `Reason: ${transcriptError}` : 'The video might not have captions.')}
              
              ${comments.length > 0 
                ? `SAMPLE COMMENTS (from ${comments.length} total):\n${comments.slice(0, 10).map(c => `- "${c.text}"`).join('\n')}` 
                : 'No comments available'}
              
              Please provide:
              1. A comprehensive analysis of the creator's mental well-being
              2. Specific stress or burnout indicators identified
              3. Work-life balance assessment
              4. Community support evaluation
              5. Actionable recommendations for:
                 - Immediate stress relief
                 - Long-term mental health maintenance
                 - Work-life balance improvement
                 - Community engagement
              6. Professional support suggestions if needed
              
              Note: ${transcript ? 'Full transcript was analyzed.' : 'No transcript was available for this video. The analysis is based primarily on audience comments.'}`
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });
      
      console.log('Response status:', modelResponse.status, modelResponse.statusText);
      
      if (!modelResponse.ok) {
        const errorText = await modelResponse.text();
        throw new Error(`OpenRouter API Error with Claude model: ${errorText}`);
      }
      
      const result = await modelResponse.json();
      
      // Format the metrics to match what the frontend expects
      const formattedMetrics = {
        transcriptSentiment: {
          sentiment: transcriptAnalysis.sentiment,
          score: transcriptAnalysis.score,
          stressLevel: transcriptAnalysis.patterns.burnoutRisk,
          details: {
            positivePatterns: transcriptAnalysis.details.emotions.positive,
            negativePatterns: transcriptAnalysis.details.emotions.negative,
            stressSignals: transcriptAnalysis.details.burnout
          }
        },
        commentSentiment: {
          average: commentMetrics.patterns.emotionalState,
          stressLevel: commentMetrics.patterns.burnoutRisk,
          totalComments: commentMetrics.total
        },
        transcriptAvailable: Boolean(transcript)
      };
      
      // Cache the analysis result
      await CreatorHealthCache.create({
        videoId,
        analysisResult: {
          analysis: result.choices[0].message.content,
          metrics: formattedMetrics,
          model: 'claude-3-sonnet'
        }
      });
      
      return NextResponse.json({
        analysis: result.choices[0].message.content,
        metrics: formattedMetrics,
        model: 'claude-3-sonnet'
      });
    } catch (error) {
      console.error("Error with Claude model:", error);
      
      // Fall back to other models
      console.log("Falling back to alternative models...");
      
      // Create a wrapped function to try different models
      async function tryWithModel(modelName) {
        console.log(`Attempting with model: ${modelName}`);
        try {
          const modelResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': req.headers.get('referer') || 'https://localhost:3000',
              'X-Title': 'YouTube Creator Health Analysis'
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                {
                  role: "system",
                  content: `You are an AI specialized in analyzing YouTube creator mental health and well-being. 
                  Focus on:
                  1. Speech patterns and emotional indicators in transcripts
                  2. Signs of stress, burnout, or fatigue
                  3. Creator-audience relationship
                  4. Work-life balance indicators
                  5. Overall emotional state
                  
                  Provide actionable insights and recommendations for maintaining good mental health.
                  If there are concerning patterns, suggest professional resources or coping strategies.
                  Be empathetic but professional in your analysis.`
                },
                {
                  role: "user",
                  content: `Analyze this creator's mental health based on their video transcript and audience comments:
                  
                  CONTENT ANALYSIS:
                  - Overall Sentiment: ${transcriptAnalysis.sentiment}
                  - Emotional State Score: ${transcriptAnalysis.patterns.emotionalState.toFixed(2)}
                  - Burnout Risk Level: ${transcriptAnalysis.patterns.burnoutRisk.toFixed(2)}
                  - Work-Life Balance: ${transcriptAnalysis.patterns.workLifeBalance.toFixed(2)}
                  
                  Positive Emotions: ${transcriptAnalysis.details.emotions.positive.join(', ')}
                  Negative Emotions: ${transcriptAnalysis.details.emotions.negative.join(', ')}
                  
                  MENTAL HEALTH INDICATORS:
                  - Awareness Terms: ${transcriptAnalysis.details.mentalHealth.awareness.join(', ')}
                  - Warning Signs: ${transcriptAnalysis.details.mentalHealth.warning.join(', ')}
                  - Resilience Indicators: ${transcriptAnalysis.details.resilience.join(', ')}
                  
                  AUDIENCE INTERACTION (${commentMetrics.total} comments):
                  - Community Support: ${commentMetrics.patterns.communitySupport.toFixed(2)}
                  - Audience Emotional State: ${commentMetrics.patterns.emotionalState.toFixed(2)}
                  - Community Mental Health Awareness: ${commentMetrics.patterns.mentalHealthAwareness.toFixed(2)}
                  
                  ${transcript ? `TRANSCRIPT EXCERPT:\n"${transcript.slice(0, 1000)}..."` : 'No transcript available. ' + (transcriptError ? `Reason: ${transcriptError}` : 'The video might not have captions.')}
                  
                  ${comments.length > 0 
                    ? `SAMPLE COMMENTS (from ${comments.length} total):\n${comments.slice(0, 10).map(c => `- "${c.text}"`).join('\n')}` 
                    : 'No comments available'}
                  
                  Please provide:
                  1. A comprehensive analysis of the creator's mental well-being
                  2. Specific stress or burnout indicators identified
                  3. Work-life balance assessment
                  4. Community support evaluation
                  5. Actionable recommendations for:
                     - Immediate stress relief
                     - Long-term mental health maintenance
                     - Work-life balance improvement
                     - Community engagement
                  6. Professional support suggestions if needed
                  
                  Note: ${transcript ? 'Full transcript was analyzed.' : 'No transcript was available for this video. The analysis is based primarily on audience comments.'}`
                }
              ],
              temperature: 0.7,
              max_tokens: 1500
            })
          });
          
          console.log('Response status:', modelResponse.status, modelResponse.statusText);
          
          if (!modelResponse.ok) {
            const errorText = await modelResponse.text();
            console.error(`Error with model ${modelName}:`, errorText);
            return { success: false, error: errorText, status: modelResponse.status };
          }
          
          const resultData = await modelResponse.json();
          return { success: true, data: resultData, model: modelName };
        } catch (error) {
          console.error(`Exception with model ${modelName}:`, error.message);
          return { success: false, error: error.message };
        }
      }
      
      // Try with different model configurations
      const modelOptions = [
        'anthropic/claude-3-haiku',
        'openai/gpt-3.5-turbo',
        'meta-llama/llama-3-8b-instruct',
        'mistralai/mistral-7b-instruct'
      ];
      
      let result = null;
      let successfulModel = null;
      
      for (const model of modelOptions) {
        const response = await tryWithModel(model);
        if (response.success) {
          result = response.data;
          successfulModel = response.model;
          console.log(`Successfully used model: ${model}`);
          break;
        }
        console.log(`Failed with model: ${model}, trying next option...`);
      }
      
      if (!result) {
        throw new Error(`All OpenRouter API attempts failed. Please check your API key and try again.`);
      }
      
      // Format the metrics to match what the frontend expects
      const formattedMetrics = {
        transcriptSentiment: {
          sentiment: transcriptAnalysis.sentiment,
          score: transcriptAnalysis.score,
          stressLevel: transcriptAnalysis.patterns.burnoutRisk,
          details: {
            positivePatterns: transcriptAnalysis.details.emotions.positive,
            negativePatterns: transcriptAnalysis.details.emotions.negative,
            stressSignals: transcriptAnalysis.details.burnout
          }
        },
        commentSentiment: {
          average: commentMetrics.patterns.emotionalState,
          stressLevel: commentMetrics.patterns.burnoutRisk,
          totalComments: commentMetrics.total
        },
        transcriptAvailable: Boolean(transcript)
      };
      
      // Cache the analysis result
      await CreatorHealthCache.create({
        videoId,
        analysisResult: {
          analysis: result.choices[0].message.content,
          metrics: formattedMetrics,
          model: successfulModel
        }
      });
      
      return NextResponse.json({
        analysis: result.choices[0].message.content,
        metrics: formattedMetrics,
        model: successfulModel
      });
    }
    
  } catch (error) {
    console.error("Error in creator health analysis:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to analyze creator health" },
      { status: 500 }
    );
  }
} 