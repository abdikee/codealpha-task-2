import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { query } from './db.js';
import { generateToken } from './auth.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * OAuth Authentication Module
 * Supports: Google, Facebook, Twitter, GitHub
 */

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

/**
 * Find or create user from OAuth profile
 * @param {string} provider - OAuth provider name
 * @param {string} providerId - User ID from provider
 * @param {Object} profile - User profile from provider
 * @returns {Promise<Object>} User object
 */
async function findOrCreateOAuthUser(provider, providerId, profile) {
  try {
    // Check if user exists with this OAuth provider
    const existingUser = await query(
      'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2',
      [provider, providerId]
    );

    if (existingUser.rows.length > 0) {
      return existingUser.rows[0];
    }

    // Extract user information from profile
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    const displayName = profile.displayName || profile.username || 'User';
    const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : '';

    // Generate unique username from display name
    let username = displayName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    
    // Check if username exists and make it unique
    let uniqueUsername = username;
    let counter = 1;
    while (true) {
      const usernameCheck = await query(
        'SELECT id FROM users WHERE username = $1',
        [uniqueUsername]
      );
      if (usernameCheck.rows.length === 0) break;
      uniqueUsername = `${username}_${counter}`;
      counter++;
    }

    // Create new user
    const newUser = await query(
      `INSERT INTO users (email, username, password_hash, avatar_url, oauth_provider, oauth_id, bio)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        email,
        uniqueUsername,
        '', // No password for OAuth users
        avatarUrl,
        provider,
        providerId,
        `Joined via ${provider}`
      ]
    );

    return newUser.rows[0];
  } catch (error) {
    console.error('Error in findOrCreateOAuthUser:', error);
    throw error;
  }
}

// ============================================================================
// GOOGLE OAUTH STRATEGY
// ============================================================================
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser('google', profile.id, profile);
          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
}

// ============================================================================
// FACEBOOK OAUTH STRATEGY
// ============================================================================
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3000/auth/facebook/callback',
        profileFields: ['id', 'displayName', 'photos', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser('facebook', profile.id, profile);
          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
}

// ============================================================================
// TWITTER OAUTH STRATEGY
// ============================================================================
if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
  passport.use(
    new TwitterStrategy(
      {
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        callbackURL: process.env.TWITTER_CALLBACK_URL || 'http://localhost:3000/auth/twitter/callback',
        includeEmail: true
      },
      async (token, tokenSecret, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser('twitter', profile.id, profile);
          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
}

// ============================================================================
// GITHUB OAUTH STRATEGY
// ============================================================================
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback',
        scope: ['user:email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser('github', profile.id, profile);
          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
}

/**
 * OAuth callback handler
 * Generates JWT token and sets cookie after successful OAuth
 */
export function handleOAuthCallback(req, res) {
  try {
    if (!req.user) {
      return res.redirect('/auth/login?error=oauth_failed');
    }

    // Generate JWT token
    const token = generateToken(req.user.id, {
      username: req.user.username,
      email: req.user.email
    });

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Redirect to home page
    res.redirect('/home');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/auth/login?error=oauth_failed');
  }
}

export default passport;
