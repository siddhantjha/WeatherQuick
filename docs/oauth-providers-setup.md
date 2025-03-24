# OAuth Providers Setup for WeatherQuick

This document outlines the process for setting up OAuth providers (Google and Apple) for the WeatherQuick app using Supabase authentication.

## Prerequisites

- WeatherQuick app repository
- Access to Supabase project
- Apple Developer account (for Apple Sign-In)
- Google Cloud Platform account (for Google Sign-In)

## Google OAuth Setup

1. **Create a project in Google Cloud Platform**

   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to "APIs & Services" > "Credentials"

2. **Configure OAuth consent screen**

   - Go to "OAuth consent screen" tab
   - Select "External" for user type
   - Fill in the required app information:
     - App name: "WeatherQuick"
     - User support email: Your support email
     - Developer contact information: Your email
   - Add the following scopes:
     - `./auth/userinfo.email`
     - `./auth/userinfo.profile`
   - Save and continue

3. **Create OAuth client ID**

   - Go to "Credentials" tab
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "WeatherQuick Web"
   - Authorized JavaScript origins:
     - `https://your-project-ref.supabase.co`
     - `http://localhost:3000` (for local development)
   - Authorized redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/v1/callback` (for local development)
   - Click "Create"
   - Note your Client ID and Client Secret

4. **Create OAuth client ID for mobile apps**

   - Go to "Credentials" tab again
   - Click "Create Credentials" > "OAuth client ID"
   - For iOS:
     - Application type: "iOS"
     - Name: "WeatherQuick iOS"
     - Bundle ID: "com.weatherquick.app"
   - For Android:
     - Application type: "Android"
     - Name: "WeatherQuick Android"
     - Package name: "com.weatherquick.app"
     - SHA-1 certificate fingerprint: (Generate using keytool)

5. **Configure Supabase**

   - Go to your Supabase project dashboard
   - Navigate to Authentication > Providers
   - Find Google in the list and enable it
   - Enter the Client ID and Client Secret obtained from Google Cloud Console
   - Save changes

## Apple Sign-In Setup

1. **Configure your Apple Developer account**

   - Go to the [Apple Developer portal](https://developer.apple.com/)
   - Navigate to "Certificates, Identifiers & Profiles"
   - Select "Identifiers" and add a new App ID if you haven't already
   - Enable "Sign In with Apple" capability
   - Click "Configure" next to "Sign In with Apple" and add your domain and return URLs

2. **Create a Service ID**

   - In "Identifiers", create a new "Services ID"
   - Name: "WeatherQuick Sign In"
   - Identifier: "com.weatherquick.signin"
   - Enable "Sign In with Apple"
   - Configure the service with:
     - Web Domain: Your app's domain or Supabase project domain
     - Return URLs: 
       - `https://your-project-ref.supabase.co/auth/v1/callback`
       - App return URL scheme for mobile

3. **Create a private key**

   - Go to "Keys" in the Apple Developer portal
   - Add a new key with "Sign In with Apple" enabled
   - Register the key and download the .p8 file
   - Note the Key ID

4. **Configure Supabase**

   - Go to your Supabase project dashboard
   - Navigate to Authentication > Providers
   - Find Apple in the list and enable it
   - Enter the following information:
     - Service ID: The identifier created in step 2
     - Team ID: Your Apple Developer Team ID
     - Key ID: The ID of the private key from step 3
     - Private Key: Copy the contents of the .p8 file
   - Save changes

## Implementation in the WeatherQuick App

### Update Environment Variables

Add the following variables to your `.env` file or environment configuration:

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
GOOGLE_CLIENT_ID=your-google-client-id
```

### Implementing in the App

The WeatherQuick app already has the UI components for Google and Apple sign-in buttons. The integration with the auth providers is handled through the `useAuth` hook which interacts with Supabase.

## Testing OAuth Configuration

1. **Test in Development Environment**

   - Run the app in development mode
   - Navigate to the login screen
   - Click on Google or Apple sign-in buttons
   - Verify that you're redirected to the respective OAuth provider
   - Confirm that after authentication, you're redirected back to the app

2. **Common Issues and Troubleshooting**

   - **Redirect URI Mismatch**: Ensure that the redirect URIs in both Google/Apple configuration and Supabase match exactly
   - **CORS Issues**: Check that your domains are properly configured
   - **Invalid Client ID**: Verify that you're using the correct client IDs in your app
   - **Scope issues**: Ensure that the necessary scopes are configured correctly

## Security Considerations

- Store all OAuth secrets securely
- Don't include client secrets in client-side code
- Regularly rotate and update OAuth keys and secrets
- Monitor authentication logs for unusual activity

## Related Documentation

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/) 