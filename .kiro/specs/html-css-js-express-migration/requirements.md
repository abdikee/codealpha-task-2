# Requirements Document: HTML/CSS/JS + Express.js Migration

## Introduction

This document specifies the requirements for migrating a social media application from React/TypeScript/Supabase to vanilla HTML/CSS/JavaScript with Express.js backend. The migration must preserve all existing functionality including user authentication, posts, comments, likes, follows, messages, notifications, hashtags, search, and real-time updates while transitioning to a framework-free architecture.

## Glossary

- **System**: The complete social media application including frontend and backend
- **Frontend**: The client-side HTML/CSS/JavaScript application
- **Backend**: The Express.js server application
- **Auth_Service**: The authentication and authorization module using JWT
- **Database**: The PostgreSQL database
- **Socket_Server**: The Socket.io real-time communication server
- **User**: An authenticated person using the application
- **Post**: User-generated content with optional image
- **Comment**: User response to a post or another comment
- **Hashtag**: A tag prefixed with # used to categorize posts
- **Feed**: A chronological list of posts from followed users
- **Notification**: An alert about user interactions (likes, comments, follows, etc.)
- **Message**: A direct message between two users
- **Session**: An authenticated user session managed via JWT token
- **Profile**: User account information including username, bio, and avatar

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to register and log in to the application, so that I can access personalized features and create content.

#### Acceptance Criteria

1. WHEN a user submits valid registration credentials (email, username, password), THE Auth_Service SHALL create a new user account and store hashed credentials in the Database
2. WHEN a user submits valid login credentials, THE Auth_Service SHALL generate a JWT token and return it to the Frontend
3. WHEN a user's JWT token is valid, THE Backend SHALL authenticate the user and grant access to protected resources
4. WHEN a user's JWT token is expired or invalid, THE Backend SHALL reject the request and return an authentication error
5. WHEN a user logs out, THE Frontend SHALL remove the JWT token from storage
6. THE Auth_Service SHALL hash passwords using bcrypt before storing them in the Database
7. WHEN a user attempts to register with an existing email or username, THE Auth_Service SHALL reject the registration and return an error

### Requirement 2: User Profiles

**User Story:** As a user, I want to view and edit my profile, so that I can present myself to other users and manage my account information.

#### Acceptance Criteria

1. WHEN a user views a profile page, THE Backend SHALL retrieve and display the user's username, bio, avatar, post count, follower count, and following count
2. WHEN a user uploads an avatar image, THE Backend SHALL store the image in file storage and update the user's profile with the image URL
3. WHEN a user updates their bio, THE Backend SHALL validate the content and save it to the Database
4. WHEN a user views their own profile, THE Frontend SHALL display edit controls for bio and avatar
5. WHEN a user views another user's profile, THE Frontend SHALL display follow and message buttons
6. THE Backend SHALL limit avatar file size to 2MB
7. THE Backend SHALL limit bio length to 500 characters

### Requirement 3: Posts

**User Story:** As a user, I want to create, view, and delete posts, so that I can share content with my followers.

#### Acceptance Criteria

1. WHEN a user creates a post with text content, THE Backend SHALL store the post in the Database with the user's ID and timestamp
2. WHEN a user creates a post with an image, THE Backend SHALL upload the image to file storage and store the URL with the post
3. WHEN a user deletes their own post, THE Backend SHALL remove the post and associated data (comments, likes, hashtags) from the Database
4. WHEN a user views a post, THE Frontend SHALL display the post content, author information, timestamp, like count, and comment count
5. THE Backend SHALL limit post content to 500 characters
6. THE Backend SHALL extract hashtags from post content and create associations in the Database
7. WHEN a post contains hashtags, THE Backend SHALL create or link to existing hashtag records

### Requirement 4: Feed and Discovery

**User Story:** As a user, I want to see posts from people I follow and discover new content, so that I can stay updated and find interesting posts.

#### Acceptance Criteria

1. WHEN a user views their home feed, THE Backend SHALL retrieve posts from users they follow and their own posts, ordered by creation time
2. WHEN a user views the explore page, THE Backend SHALL retrieve recent posts from all users, ordered by creation time
3. WHEN a user scrolls to the bottom of a feed, THE Frontend SHALL request the next page of posts from the Backend
4. THE Backend SHALL implement pagination with configurable page size (default 10 posts per page)
5. WHEN a feed has no posts, THE Frontend SHALL display an empty state message
6. THE Backend SHALL include author profile information (username, avatar) with each post in the feed

### Requirement 5: Likes and Bookmarks

**User Story:** As a user, I want to like and bookmark posts, so that I can show appreciation and save posts for later.

#### Acceptance Criteria

1. WHEN a user likes a post, THE Backend SHALL create a like record in the Database and increment the post's like count
2. WHEN a user unlikes a post, THE Backend SHALL remove the like record and decrement the post's like count
3. WHEN a user likes a post, THE Backend SHALL create a notification for the post author (unless the user is the author)
4. WHEN a user bookmarks a post, THE Backend SHALL create a bookmark record associated with the user
5. WHEN a user unbookmarks a post, THE Backend SHALL remove the bookmark record
6. WHEN a user views their bookmarks, THE Backend SHALL retrieve all bookmarked posts ordered by bookmark creation time
7. THE Frontend SHALL display the current like state (liked/not liked) and bookmark state (bookmarked/not bookmarked) for each post

### Requirement 6: Comments and Replies

**User Story:** As a user, I want to comment on posts and reply to comments, so that I can engage in conversations.

#### Acceptance Criteria

1. WHEN a user submits a comment on a post, THE Backend SHALL store the comment in the Database with the post ID, user ID, and timestamp
2. WHEN a user submits a reply to a comment, THE Backend SHALL store the reply with a parent comment ID
3. WHEN a user views a post, THE Backend SHALL retrieve all comments and replies in a hierarchical structure
4. WHEN a user comments on a post, THE Backend SHALL create a notification for the post author
5. WHEN a user replies to a comment, THE Backend SHALL create a notification for the comment author
6. THE Backend SHALL limit comment content to 300 characters
7. WHEN a user deletes their own comment, THE Backend SHALL remove the comment and all child replies

### Requirement 7: Follow System

**User Story:** As a user, I want to follow and unfollow other users, so that I can curate my feed and see content from people I'm interested in.

#### Acceptance Criteria

1. WHEN a user follows another user, THE Backend SHALL create a follow relationship in the Database
2. WHEN a user unfollows another user, THE Backend SHALL remove the follow relationship
3. WHEN a user follows another user, THE Backend SHALL create a notification for the followed user
4. WHEN a user views a profile, THE Backend SHALL indicate whether the current user is following that profile
5. WHEN a user views their followers list, THE Backend SHALL retrieve all users who follow them
6. WHEN a user views their following list, THE Backend SHALL retrieve all users they follow
7. THE Backend SHALL prevent users from following themselves

### Requirement 8: Direct Messages

**User Story:** As a user, I want to send and receive direct messages, so that I can have private conversations with other users.

#### Acceptance Criteria

1. WHEN a user sends a message to another user, THE Backend SHALL store the message in the Database with sender ID, receiver ID, and timestamp
2. WHEN a user views their messages, THE Backend SHALL retrieve all conversations ordered by most recent message
3. WHEN a user opens a conversation, THE Backend SHALL retrieve all messages between the two users ordered by timestamp
4. WHEN a user receives a new message, THE Socket_Server SHALL push the message to the user's connected client in real-time
5. WHEN a user views a conversation, THE Backend SHALL mark all messages in that conversation as read
6. THE Backend SHALL track unread message counts per conversation
7. WHEN a user sends a message, THE Backend SHALL create a notification for the receiver

### Requirement 9: Notifications

**User Story:** As a user, I want to receive notifications about interactions, so that I can stay informed about activity related to my content and account.

#### Acceptance Criteria

1. WHEN a user receives a like, comment, follow, or message, THE Backend SHALL create a notification record in the Database
2. WHEN a user views their notifications page, THE Backend SHALL retrieve all notifications ordered by creation time
3. WHEN a user receives a new notification, THE Socket_Server SHALL push the notification to the user's connected client in real-time
4. WHEN a user marks all notifications as read, THE Backend SHALL update all unread notifications for that user
5. THE Frontend SHALL display an unread count badge on the notifications icon
6. THE Backend SHALL support notification types: like, comment, follow, reply, mention, and dm
7. WHEN a user clicks a notification, THE Frontend SHALL navigate to the relevant content (post, profile, or messages)

### Requirement 10: Hashtags

**User Story:** As a user, I want to use and search hashtags, so that I can categorize my posts and discover content by topic.

#### Acceptance Criteria

1. WHEN a post contains text matching the pattern #[word], THE Backend SHALL extract the hashtag and create a hashtag record if it doesn't exist
2. WHEN a post contains hashtags, THE Backend SHALL create associations between the post and hashtag records
3. WHEN a user clicks a hashtag, THE Frontend SHALL navigate to a hashtag page showing all posts with that tag
4. WHEN a user views a hashtag page, THE Backend SHALL retrieve all posts associated with that hashtag ordered by creation time
5. THE Backend SHALL store hashtags in lowercase for case-insensitive matching
6. THE Backend SHALL implement pagination for hashtag post listings

### Requirement 11: Search

**User Story:** As a user, I want to search for posts and users, so that I can find specific content and people.

#### Acceptance Criteria

1. WHEN a user submits a search query, THE Backend SHALL search post content for matching text using case-insensitive pattern matching
2. WHEN a user searches for users, THE Backend SHALL search usernames and bios for matching text
3. WHEN search results are returned, THE Backend SHALL include relevant metadata (author info for posts, profile info for users)
4. THE Backend SHALL implement pagination for search results
5. WHEN a search query is empty, THE Backend SHALL return an empty result set
6. THE Backend SHALL limit search queries to 100 characters

### Requirement 12: Real-time Updates

**User Story:** As a user, I want to see real-time updates for messages and notifications, so that I can stay current without refreshing the page.

#### Acceptance Criteria

1. WHEN a user connects to the application, THE Frontend SHALL establish a Socket.io connection to the Socket_Server
2. WHEN a new message is sent to a user, THE Socket_Server SHALL emit the message to the receiver's connected client
3. WHEN a new notification is created for a user, THE Socket_Server SHALL emit the notification to the user's connected client
4. WHEN a user disconnects, THE Socket_Server SHALL clean up the connection
5. WHEN a user reconnects, THE Frontend SHALL re-establish the Socket.io connection and sync missed updates
6. THE Socket_Server SHALL authenticate connections using JWT tokens
7. WHEN a post receives a new like or comment, THE Socket_Server SHALL emit an update to clients viewing that post

### Requirement 13: Server-Side Rendering

**User Story:** As a user, I want pages to load quickly with content visible immediately, so that I have a fast and responsive experience.

#### Acceptance Criteria

1. WHEN a user requests a page, THE Backend SHALL render the complete HTML with data from the Database before sending the response
2. WHEN a user navigates to a protected page without authentication, THE Backend SHALL redirect to the login page
3. WHEN a user navigates to a public page, THE Backend SHALL render the page without requiring authentication
4. THE Backend SHALL include initial page data in the rendered HTML to avoid additional API requests
5. THE Frontend SHALL progressively enhance server-rendered pages with JavaScript for interactivity
6. THE Backend SHALL use template rendering (EJS, Handlebars, or similar) to generate HTML

### Requirement 14: Session Management

**User Story:** As a user, I want my login session to persist across page refreshes, so that I don't have to log in repeatedly.

#### Acceptance Criteria

1. WHEN a user logs in, THE Backend SHALL set an HTTP-only cookie containing the JWT token
2. WHEN a user makes a request with a valid session cookie, THE Backend SHALL authenticate the user automatically
3. WHEN a user's session expires, THE Backend SHALL require re-authentication
4. THE Backend SHALL set JWT token expiration to 7 days
5. WHEN a user logs out, THE Backend SHALL clear the session cookie
6. THE Backend SHALL use secure cookie flags (HttpOnly, Secure, SameSite) for production environments

### Requirement 15: File Upload and Storage

**User Story:** As a user, I want to upload images for posts and avatars, so that I can share visual content and personalize my profile.

#### Acceptance Criteria

1. WHEN a user uploads an image, THE Backend SHALL validate the file type (JPEG, PNG, GIF, WebP)
2. WHEN a user uploads an image, THE Backend SHALL validate the file size does not exceed the maximum limit
3. WHEN an image upload is valid, THE Backend SHALL store the file in the file storage system and return a public URL
4. THE Backend SHALL limit avatar uploads to 2MB
5. THE Backend SHALL limit post image uploads to 5MB
6. WHEN a user deletes a post with an image, THE Backend SHALL delete the associated image file from storage
7. THE Backend SHALL generate unique filenames to prevent collisions

### Requirement 16: Activity Logging

**User Story:** As a user, I want to view my activity history, so that I can track my interactions on the platform.

#### Acceptance Criteria

1. WHEN a user likes a post, THE Backend SHALL create an activity log entry with action type "liked_post"
2. WHEN a user comments on a post, THE Backend SHALL create an activity log entry with action type "commented"
3. WHEN a user follows another user, THE Backend SHALL create an activity log entry with action type "followed"
4. WHEN a user bookmarks a post, THE Backend SHALL create an activity log entry with action type "bookmarked"
5. WHEN a user views their activity log, THE Backend SHALL retrieve all activity entries ordered by creation time
6. THE Backend SHALL limit activity log retrieval to 50 most recent entries

### Requirement 17: User Suggestions

**User Story:** As a user, I want to see suggested users to follow, so that I can discover new people and grow my network.

#### Acceptance Criteria

1. WHEN a user views their home feed, THE Backend SHALL retrieve a list of suggested users to follow
2. THE Backend SHALL exclude users the current user already follows from suggestions
3. THE Backend SHALL exclude the current user from suggestions
4. THE Backend SHALL limit suggestions to 5 users
5. THE Backend SHALL prioritize users with recent activity or high follower counts in suggestions

### Requirement 18: Error Handling

**User Story:** As a user, I want to see clear error messages when something goes wrong, so that I understand what happened and how to fix it.

#### Acceptance Criteria

1. WHEN a request fails due to authentication, THE Backend SHALL return a 401 status code with an error message
2. WHEN a request fails due to authorization, THE Backend SHALL return a 403 status code with an error message
3. WHEN a request fails due to invalid input, THE Backend SHALL return a 400 status code with validation error details
4. WHEN a request fails due to a server error, THE Backend SHALL return a 500 status code and log the error
5. WHEN a resource is not found, THE Backend SHALL return a 404 status code
6. THE Frontend SHALL display user-friendly error messages for all error responses
7. THE Backend SHALL validate all user input before processing

### Requirement 19: Performance and Caching

**User Story:** As a user, I want the application to load quickly and respond promptly, so that I have a smooth experience.

#### Acceptance Criteria

1. WHEN frequently accessed data is requested, THE Backend SHALL use Redis cache to reduce database queries
2. THE Backend SHALL cache user profile data for 5 minutes
3. THE Backend SHALL cache feed data for 1 minute
4. WHEN cached data is updated, THE Backend SHALL invalidate the relevant cache entries
5. THE Backend SHALL implement database indexes on frequently queried columns (user_id, created_at, post_id)
6. THE Frontend SHALL lazy-load images to improve initial page load time

### Requirement 20: Data Validation

**User Story:** As a system administrator, I want all user input to be validated, so that data integrity is maintained and security vulnerabilities are prevented.

#### Acceptance Criteria

1. WHEN a user submits a form, THE Backend SHALL validate all required fields are present
2. THE Backend SHALL validate email addresses match a valid email pattern
3. THE Backend SHALL validate usernames contain only alphanumeric characters, underscores, and hyphens
4. THE Backend SHALL validate usernames are between 3 and 30 characters
5. THE Backend SHALL validate passwords are at least 8 characters long
6. THE Backend SHALL sanitize all user input to prevent XSS attacks
7. THE Backend SHALL use parameterized queries to prevent SQL injection
