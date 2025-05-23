"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ClerkAuthButtons from "../components/ClerkAuthButtons";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the static landing page
    router.replace("/landing/index.html");
    
    // Add event listeners to handle auth buttons on the landing page
    const setupAuthButtons = () => {
      // Give the page some time to load
      setTimeout(() => {
        try {
          // Try to modify the landing page DOM once it loads
          if (typeof window !== 'undefined') {
            const signUpButtons = document.querySelectorAll('a[href="/sign-up"]');
            const signInButtons = document.querySelectorAll('a[href="/sign-in"]');
            
            // Add click handlers to direct to Clerk auth pages
            signUpButtons.forEach(button => {
              button.addEventListener('click', (e) => {
                e.preventDefault();
                router.push('/sign-up');
              });
            });
            
            signInButtons.forEach(button => {
              button.addEventListener('click', (e) => {
                e.preventDefault();
                router.push('/sign-in');
              });
            });
          }
        } catch (error) {
          console.error("Error setting up auth buttons:", error);
        }
      }, 1500);
    };
    
    setupAuthButtons();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Redirecting to landing page...</h2>
        <p className="mt-2 text-muted-foreground">Please wait</p>
      </div>
    </div>
  );
} 