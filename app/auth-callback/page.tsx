"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main project page after auth
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Authentication successful!</h2>
        <p className="mb-4">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
} 