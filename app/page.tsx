"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@clerk/nextjs';

const Page = () => {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  
  useEffect(() => {
    if (isLoaded) {
      // If user is already signed in, redirect to dashboard
      if (isSignedIn) {
        router.replace("/dashboard");
      } else {
        // Otherwise redirect to landing page
        router.replace("/landing");
      }
    }
  }, [router, isLoaded, isSignedIn]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Redirecting...</h2>
      </div>
    </div>
  );
};

export default Page;