import { NextResponse } from "next/server";

// Log environment variables for debugging
console.log('⚡ test-env route loaded');
console.log('🔑 Process env keys:', Object.keys(process.env).filter(key => 
  key.includes('ROUTER') || key.includes('API') || key.includes('KEY')
));

export async function GET() {
  // Return masked API keys for debugging
  const apiKeyInfo = {
    hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
    openRouterKeyLastChars: process.env.OPENROUTER_API_KEY ? 
      process.env.OPENROUTER_API_KEY.slice(-6) : 'missing',
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('ROUTER') || key.includes('API') || key.includes('KEY')
    )
  };
  
  return NextResponse.json(apiKeyInfo);
} 