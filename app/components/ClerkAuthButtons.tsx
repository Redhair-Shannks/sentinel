"use client";

import { useRouter } from "next/navigation";

// This component provides buttons for Clerk authentication
export default function ClerkAuthButtons({ 
  type = "signup", 
  className = "", 
  text = "Sign Up" 
}: { 
  type?: "signup" | "signin"; 
  className?: string;
  text?: string;
}) {
  const router = useRouter();
  
  const handleClick = () => {
    if (type === "signup") {
      router.push("/sign-up");
    } else {
      router.push("/sign-in");
    }
  };
  
  return (
    <button
      onClick={handleClick}
      className={className}
    >
      {text}
    </button>
  );
} 