"use client";
import { Geist_Mono as GeistMono, Geist as GeistSans } from "next/font/google";
import { useEffect, useState } from "react";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { FlaskResponseProvider } from "./context/FlaskResponseContext";
import Link from "next/link";

const geistSans = GeistSans({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = GeistMono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check system preference on initial load
    const darkModePreference = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(darkModePreference);

    // Add listener for changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    // Apply dark mode class to html element
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);
  
  return (
    <ClerkProvider>
      <FlaskResponseProvider>
        <html lang="en" className={isDarkMode ? "dark" : ""}>
          <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-10">
              <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-xl font-bold text-primary">
                  YouTube Analytics
                </Link>
                
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {isDarkMode ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="5" />
                        <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                      </svg>
                    )}
                  </button>

                  <SignedOut>
                    <div className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors">
                      <SignInButton />
                    </div>
                  </SignedOut>

                  <SignedIn>
                    <UserButton
                      showName
                      appearance={{
                        elements: {
                          userButtonBox: "bg-primary/10 text-primary hover:bg-primary/20 rounded-full p-1",
                          userButtonText: "font-medium",
                        },
                      }}
                    />
                  </SignedIn>
                </div>
              </div>
            </header>
            
            <main className="container mx-auto px-4 py-6">
              {children}
            </main>
          </body>
        </html>
      </FlaskResponseProvider>
    </ClerkProvider>
  );
}
