"use client";

import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import Image from 'next/image';

export default function UserProfile() {
  const { isLoaded, isSignedIn, user } = useUser();
  
  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-sm border border-border">
      <div className="mb-4">
        <UserButton 
          appearance={{
            elements: {
              userButtonAvatarBox: "w-20 h-20"
            }
          }} 
        />
      </div>
      
      <h2 className="text-xl font-semibold text-card-foreground">
        {user.firstName} {user.lastName}
      </h2>
      
      <p className="text-muted-foreground mt-1 text-sm">
        {user.primaryEmailAddress?.emailAddress}
      </p>
      
      <div className="mt-6 w-full">
        <h3 className="text-sm uppercase font-medium text-muted-foreground mb-2">
          Account Details
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">User ID</span>
            <span className="text-foreground font-mono text-xs">{user.id.substring(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created</span>
            <span className="text-foreground">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 