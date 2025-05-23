import { SignIn } from '@clerk/nextjs'
import React from 'react'

const Page = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background p-5">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">Welcome Back</h1>
        <p className="text-muted-foreground max-w-md">
          Sign in to continue analyzing YouTube content and gaining insights.
        </p>
      </div>
      
      <div className="bg-card rounded-xl shadow-lg overflow-hidden w-full max-w-md border border-border">
        <div className="p-6">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
                card: 'bg-card shadow-none',
                headerTitle: 'text-xl font-semibold text-card-foreground',
                headerSubtitle: 'text-muted-foreground',
                socialButtonsBlockButton: 'border border-border hover:bg-secondary text-foreground',
                formFieldLabel: 'text-foreground',
                formFieldInput: 'bg-background border border-input text-foreground',
                footerActionText: 'text-muted-foreground',
                footerActionLink: 'text-primary hover:text-primary/90'
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default Page