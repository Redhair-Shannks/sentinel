"use client";

import { useRouter } from "next/navigation";
import VideoSelector from "../components/VideoSelector";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

const DashboardPage = () => {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // Redirect to sign-in if not authenticated
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state while checking auth
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with navigation */}
      <header className="bg-primary/10 py-4 shadow-sm">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">YouTube Video Analyzer</h2>
          <Link 
            href="/landing" 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Gradient background effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-background/0 rounded-3xl -z-10"></div>
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-chart-4">
            Analyze Your Videos
          </h1>
        </div>
        
        <VideoSelector />

        {/* Footer with navigation */}
        <div className="mt-12 pt-6 border-t border-border text-center">
          <Link 
            href="/landing"
            className="text-primary hover:underline"
          >
            Return to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 