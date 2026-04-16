# OAuth Social Login Implementation Guide

## ✅ What's Been Implemented

Complete OAuth social login system supporting:
- **Google** Sign-In
- **Facebook** Login
- **Twitter** OAuth
- **GitHub** Authentication

## Features

### 1. Multiple OAuth Providers
Users can sign in with any of the supported social platforms. The system automatically:
- Creates new accounts for first-time users
- Links existing accounts
- Generates unique usernames
- Imports profile pictures
- Sets up JWT authentication

### 2. Seamless Integration
- Works alongside traditional email/password authentication
- Automatic JWT token generation
- HTTP-only secure cookies
- Session management

### 3. Database Schema Updates
Updated `users` table to support OAuth:
```sql
- oauth_provider VARCHAR(20)  -- 'google', 'facebook', 'twitter', 'github'
- oauth_id VARCHAR(255)        -- User ID from OAuth provider
- email VARCHAR(255) UNIQUE    -- Now nullable (some OAuth providers don't share email)
- password_hash VARCHAR(255)   -- Empty for OAuth users
```

## Setup Instructions

### 1. Install Dependencies

Already installed:
```bash
npm install passport passport-google-oauth20 passport-facebook passport-twitter passport-github2 express-validator
```

### 2. Configure OAuth Providers

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`:
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

#### Facebook OAuth Setup
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add "Facebook Login" product
4. Set Valid OAuth Redirect URIs: `http://localhost:3000/auth/facebook/callback`
5. Copy App ID and App Secret to `.env`:
```env
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
FACEBOOK_CALLBACK_URL=http://localhost:3000/auth/facebook/callback
```

#### Twitter OAuth Setup
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Enable "Request email address from users"
4. Set Callback URL: `http://localhost:3000/auth/twitter/callback`
5. Copy API Key and API Secret to `.env`:
```env
TWITTER_CONSUMER_KEY=your_twitter_consumer_key_here
TWITTER_CONSUMER_SECRET=your_twitter_consumer_secret_here
TWITTER_CALLBACK_URL=http://localhost:3000/auth/twitter/callback
```

#### GitHub OAuth Setup
1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set Authorization callback URL: `http://localhost:3000/auth/github/callback`
4. Copy Client ID and Client Secret to `.env`:
```env
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
```

### 3. Update Database Schema

Run the migration to add OAuth fields:
```bash
cd server
node migrate.js up
```

Or manually add columns if database already exists:
```sql
ALTER TABLE users 
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN password_hash SET DEFAULT '',
  ADD COLUMN oauth_provider VARCHAR(20),
  ADD COLUMN oauth_id VARCHAR(255),
  ADD CONSTRAINT oauth_unique UNIQUE(oauth_provider, oauth_id);

CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);
```

## API Endpoints

### OAuth Login Endpoints

#### Google
- **Initiate**: `GET /auth/google`
- **Callback**: `GET /auth/google/callback`

#### Facebook
- **Initiate**: `GET /auth/facebook`
- **Callback**: `GET /auth/facebook/callback`

#### Twitter
- **Initiate**: `GET /auth/twitter`
- **Callback**: `GET /auth/twitter/callback`

#### GitHub
- **Initiate**: `GET /auth/github`
- **Callback**: `GET /auth/github/callback`

### Traditional Authentication
- **Register**: `POST /auth/register`
- **Login**: `POST /auth/login`
- **Logout**: `POST /auth/logout`

## Frontend Integration

### HTML Login Page Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - Social Media</title>
  <link rel="stylesheet" href="/css/auth.css">
</head>
<body>
  <div class="auth-container">
    <h1>Sign In</h1>
    
    <!-- Social Login Buttons -->
    <div class="social-login">
      <a href="/auth/google" class="btn btn-google">
        <img src="/images/google-icon.svg" alt="Google">
        Continue with Google
      </a>
      
      <a href="/auth/facebook" class="btn btn-facebook">
        <img src="/images/facebook-icon.svg" alt="Facebook">
        Continue with Facebook
      </a>
      
      <a href="/auth/twitter" class="btn btn-twitter">
        <img src="/images/twitter-icon.svg" alt="Twitter">
        Continue with Twitter
      </a>
      
      <a href="/auth/github" class="btn btn-github">
        <img src="/images/github-icon.svg" alt="GitHub">
        Continue with GitHub
      </a>
    </div>
    
    <div class="divider">
      <span>OR</span>
    </div>
    
    <!-- Traditional Login Form -->
    <form id="loginForm">
      <input type="email" name="email" placeholder="Email" required>
      <input type="password" name="password" placeholder="Password" required>
      <button type="submit">Sign In</button>
    </form>
    
    <p>Don't have an account? <a href="/auth/register">Sign up</a></p>
  </div>
  
  <script src="/js/auth.js"></script>
</body>
</html>
```

### CSS Styling Example

```css
.social-login {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 24px;
  border: 1px solid #ddd;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-google {
  background: white;
  color: #333;
}

.btn-facebook {
  background: #1877f2;
  color: white;
}

.btn-twitter {
  background: #1da1f2;
  color: white;
}

.btn-github {
  background: #24292e;
  color: white;
}

.btn img {
  width: 20px;
  height: 20px;
}
```

## How It Works

### 1. User Clicks Social Login Button
```
User clicks "Continue with Google" → Redirects to /auth/google
```

### 2. OAuth Provider Authentication
```
Google shows login/consent screen → User approves → Redirects to callback
```

### 3. Callback Processing
```javascript
// server/routes/auth.js
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  handleOAuthCallback
);
```

### 4. User Creation or Retrieval
```javascript
// server/oauth.js
async function findOrCreateOAuthUser(provider, providerId, profile) {
  // Check if user exists
  // If not, create new user with OAuth data
  // Return user object
}
```

### 5. JWT Token Generation
```javascript
// Generate JWT token
const token = generateToken(user.id, {
  username: user.username,
  email: user.email
});

// Set HTTP-only cookie
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

### 6. Redirect to Home
```
User is redirected to /home with authenticated session
```

## Security Features

### 1. HTTP-Only Cookies
JWT tokens are stored in HTTP-only cookies, preventing XSS attacks.

### 2. Secure Flag in Production
Cookies are marked as secure in production, ensuring HTTPS-only transmission.

### 3. SameSite Protection
SameSite=lax prevents CSRF attacks.

### 4. OAuth State Parameter
Passport.js automatically handles state parameter for CSRF protection.

### 5. Token Expiration
JWT tokens expire after 7 days, requiring re-authentication.

## Error Handling

### OAuth Failure
If OAuth fails, user is redirected to login page with error:
```
/auth/login?error=oauth_failed
```

### Email Conflict
If OAuth email already exists with password account:
- User can link accounts (future feature)
- Or use password login

### Missing Email
Some OAuth providers don't share email:
- System generates account without email
- User can add email later in settings

## Testing

### Test OAuth Flow
1. Start server: `npm start`
2. Visit: `http://localhost:3000/auth/google`
3. Complete OAuth flow
4. Check database for new user
5. Verify JWT cookie is set
6. Access protected routes

### Test Account Linking
1. Create account with email/password
2. Try OAuth with same email
3. Verify behavior

## Production Considerations

### 1. Update Callback URLs
Change callback URLs in `.env` and OAuth provider settings:
```env
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
FACEBOOK_CALLBACK_URL=https://yourdomain.com/auth/facebook/callback
TWITTER_CALLBACK_URL=https://yourdomain.com/auth/twitter/callback
GITHUB_CALLBACK_URL=https://yourdomain.com/auth/github/callback
```

### 2. Enable HTTPS
Ensure your production server uses HTTPS for secure cookie transmission.

### 3. Configure CORS
If frontend is on different domain, configure CORS properly.

### 4. Rate Limiting
Add rate limiting to OAuth endpoints to prevent abuse.

### 5. Monitoring
Log OAuth events for security monitoring and debugging.

## Files Created

1. **server/oauth.js** - OAuth configuration and strategies
2. **server/routes/auth.js** - Authentication routes (traditional + OAuth)
3. **server/migrations/001_initial_schema.sql** - Updated with OAuth fields
4. **.env.example** - Added OAuth configuration variables

## Next Steps

1. Create login/register pages with social login buttons
2. Add account linking functionality
3. Implement email verification for OAuth accounts
4. Add profile completion flow for OAuth users
5. Create admin panel to manage OAuth providers

## Status

✅ **OAuth Implementation Complete**
- Google, Facebook, Twitter, GitHub support
- Database schema updated
- Routes configured
- Security implemented
- Ready for frontend integration

## Support

For issues or questions:
1. Check OAuth provider documentation
2. Verify callback URLs match exactly
3. Ensure environment variables are set
4. Check server logs for detailed errors
