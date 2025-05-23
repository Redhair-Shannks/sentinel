"use client";

import { ClerkProvider, SignedIn, SignedOut, SignIn, UserButton } from "@clerk/nextjs";
import { Geist_Mono as GeistMono, Geist as GeistSans } from "next/font/google";

const geistSans = GeistSans({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = GeistMono({ subsets: ["latin"], variable: "--font-geist-mono" });

export default function ClerkWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <header className="flex justify-between">
            <UserButton showName />
          </header>
          <SignedOut>
            <SignIn routing="hash" />
          </SignedOut>
          <SignedIn>{children}</SignedIn>
        </body>
      </html>
    </ClerkProvider>
  );
}
