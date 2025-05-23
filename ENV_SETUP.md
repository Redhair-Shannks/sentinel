# Environment Setup for Clerk Authentication

To properly configure Clerk authentication, you need to create a `.env.local` file in the root of your project with the following environment variables:

```
# Clerk Authentication (required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Clerk URLs (optional - defaults to /)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

## Getting your Clerk Keys

1. Sign up or log in to your Clerk account at https://clerk.dev/
2. Create a new application or select an existing one
3. Go to the API Keys section in your Clerk dashboard
4. Copy your "Publishable Key" and "Secret Key"
5. Paste them into your `.env.local` file

## Customizing OAuth Providers

To enable social sign-in providers like Google, GitHub, etc.:

1. Go to your Clerk dashboard
2. Navigate to "Social Connections"
3. Enable the providers you want to use
4. Configure each provider with their respective credentials

For more details, see the [Clerk documentation](https://clerk.com/docs/authentication/social-connections/overview). 