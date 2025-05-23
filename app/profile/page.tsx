"use client";

import ProtectedRoute from '../components/ProtectedRoute';
import UserProfile from '../components/UserProfile';
import Link from 'next/link';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-foreground">Your Profile</h1>
            <Link href="/" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              Back to Dashboard
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <UserProfile />
            </div>
            
            <div className="md:col-span-2 space-y-6">
              <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <h2 className="text-xl font-semibold mb-4 text-card-foreground">Recent Activity</h2>
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-md">
                    <p className="text-muted-foreground">No recent activity yet.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Start analyzing YouTube videos to see your activity here.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <h2 className="text-xl font-semibold mb-4 text-card-foreground">Saved Analyses</h2>
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-md">
                    <p className="text-muted-foreground">No saved analyses yet.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Your saved analyses will appear here.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 