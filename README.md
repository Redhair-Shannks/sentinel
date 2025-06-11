# Sentinel-Video: AI-Powered YouTube Content Analysis 🎥🧠

**Empowering content creators with AI-driven mental health insights and audience feedback analysis**

[![Next.js](https://img.shields.io/badge/Next.js-13.0+-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)](https://www.mongodb.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-orange.svg)](https://deepmind.google/technologies/gemini/)

Sentinel-Video is a cutting-edge platform that analyzes YouTube content and audience feedback to provide creators with valuable insights into their mental well-being and content impact. Using advanced AI technologies, it processes video transcripts, comments, and engagement metrics to generate comprehensive reports and personalized recommendations.

## 🎥 Demo

[Demo Video Link to be added]

## ✨ Key Features

- 🎯 **Multi-Source Analysis**: Analyze individual videos or entire channels
- 💬 **Advanced Comment Analysis**: AI-powered sentiment analysis of viewer comments
- 📝 **Transcript Processing**: Deep analysis of video content and creator's tone
- 🧠 **Mental Health Insights**: Personalized recommendations for creator well-being
- 🤖 **AI Chatbot**: Interactive assistant for mental health support and content advice
- 📊 **Comprehensive Dashboard**: Visual analytics of audience engagement and sentiment
- 🔍 **Channel Analysis**: Analyze top 10 videos by popularity, views, or recency
- 💾 **MongoDB Integration**: Efficient storage and retrieval of analysis data
- 🔒 **Secure Authentication**: Protected user accounts and data privacy
- 🌐 **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS

## 🎯 Use Cases

- **🎥 Content Creators**: Understand audience impact on mental health
- **📈 Channel Managers**: Track content performance and audience sentiment
- **👥 Mental Health Professionals**: Support creators with data-driven insights
- **📊 Social Media Analysts**: Study content impact and audience engagement
- **🎓 Educational Content**: Analyze teaching effectiveness and student feedback
- **💼 Brand Channels**: Monitor brand perception and audience reception

## 🚀 Why Sentinel-Video?

### Innovative Features
- **AI-Powered Analysis**: Gemini AI for deep content and sentiment analysis
- **Comprehensive Insights**: Combine comment sentiment, transcript analysis, and engagement metrics
- **Mental Health Focus**: Prioritize creator well-being with personalized recommendations
- **Interactive Support**: AI chatbot for real-time assistance and guidance
- **Channel-Wide Analysis**: Understand content impact across multiple videos

### Technical Excellence
- **Modern Stack**: Built with Next.js, TypeScript, and MongoDB
- **Scalable Architecture**: Efficient processing of large video datasets
- **Real-time Updates**: Live dashboard with instant analysis results
- **Secure & Private**: Protected user data and secure authentication
- **Responsive Design**: Beautiful UI that works on all devices

## 📦 Installation

### Prerequisites
- Node.js 18.0 or higher
- MongoDB 6.0 or higher
- Google Cloud API Key (for YouTube Data API)
- OpenRouter API Key (for Gemini AI)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/yourusername/sentinel-video.git
cd sentinel-video

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

### Environment Variables
```env
# Required API Keys
YOUTUBE_API_KEY=your_youtube_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
MONGODB_URI=your_mongodb_connection_string

# Optional Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🎯 Quick Start Guide

### 1. Video Analysis
```typescript
// Example: Analyze a single video
const videoId = "dQw4w9WgXcQ";
const analysis = await analyzeVideo(videoId);
console.log(analysis.sentiment);
console.log(analysis.mentalHealthInsights);
```

### 2. Channel Analysis
```typescript
// Example: Get top videos from a channel
const channelId = "UC...";
const videos = await getChannelVideos(channelId, {
  sortBy: "popular", // or "recent", "views"
  limit: 10
});
```

### 3. Using the Chatbot
```typescript
// Example: Interact with the AI assistant
const response = await chatWithAssistant({
  question: "How can I improve my content's impact?",
  videoContext: videoId,
  chatHistory: previousMessages
});
```

## 🛠️ Advanced Features

### Custom Analysis Configuration
```typescript
// Configure analysis parameters
const config = {
  sentimentThreshold: 0.7,
  includeTranscript: true,
  analyzeEmotions: true,
  generateRecommendations: true
};

const analysis = await analyzeVideo(videoId, config);
```

### Dashboard Customization
```typescript
// Customize dashboard metrics
const dashboardConfig = {
  metrics: ["sentiment", "engagement", "mentalHealth"],
  timeRange: "last30days",
  comparison: "previousPeriod"
};
```

## 🐛 Troubleshooting

### Common Issues

**API Key Errors**
```bash
# Check your environment variables
echo $YOUTUBE_API_KEY
echo $OPENROUTER_API_KEY
```

**MongoDB Connection Issues**
```bash
# Verify MongoDB connection
mongosh "your_connection_string"
```

**Analysis Failures**
```typescript
// Enable debug logging
const analysis = await analyzeVideo(videoId, {
  debug: true,
  verbose: true
});
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Format code
npm run format
```

## 🆚 Comparison with Other Solutions

| Feature | Sentinel-Video | Traditional Analytics | Basic Sentiment Tools |
|---------|---------------|----------------------|----------------------|
| Mental Health Focus | ✅ | ❌ | ❌ |
| AI-Powered Analysis | ✅ | ❌ | ⚠️ |
| Channel Analysis | ✅ | ✅ | ❌ |
| Interactive Chatbot | ✅ | ❌ | ❌ |
| Real-time Updates | ✅ | ⚠️ | ❌ |
| Cost | Free | $$$ | $ |

## 📚 Documentation

- [API Reference](docs/API.md)
- [User Guide](docs/USER_GUIDE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Contributing](CONTRIBUTING.md)

## 🆘 Getting Help

- 📖 [Documentation](docs/) - Comprehensive guides
- 💬 [Discussions](https://github.com/yourusername/sentinel-video/discussions) - Ask questions
- 🐛 [Issue Tracker](https://github.com/yourusername/sentinel-video/issues) - Report bugs
- 🌟 [Show & Tell](https://github.com/yourusername/sentinel-video/discussions/categories/show-and-tell) - Share your projects

## 🔗 Links

- [GitHub Repository](https://github.com/yourusername/sentinel-video)
- [Live Demo](https://sentinel-video.vercel.app)
- [Changelog](CHANGELOG.md)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with ❤️ using:
- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [MongoDB](https://www.mongodb.com/) - Database
- [Gemini AI](https://deepmind.google/technologies/gemini/) - AI analysis
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [YouTube Data API](https://developers.google.com/youtube/v3) - Video data

Special thanks to all contributors who help make Sentinel-Video better!

---

**Ready to transform your content creation journey? Try Sentinel-Video today!** 🚀
