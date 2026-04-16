# Implementation Plan: HTML/CSS/JS + Express.js Migration

## Overview

This implementation plan guides the migration of a social media application from React/TypeScript/Supabase to vanilla HTML/CSS/JavaScript with Express.js backend. The migration preserves all existing features including authentication, posts, feeds, comments, likes, follows, messages, notifications, hashtags, search, and real-time updates. The implementation follows an incremental approach, building core infrastructure first, then adding features layer by layer, with testing and validation at each checkpoint.

## Tasks

- [ ] 1. Set up Express.js server and project structure
  - Create Express.js application with middleware configuration
  - Set up EJS or Handlebars template engine for server-side rendering
  - Configure static file serving for CSS, JavaScript, and images
  - Set up environment variables and configuration management
  - Create directory structure: `/views`, `/public`, `/routes`, `/middleware`, `/models`, `/utils`
  - Install core dependencies: express, dotenv, cookie-parser, cors, helmet
  - _Requirements: 13.1, 13.2, 13.3, 13.6_

- [ ] 2. Implement database connection and schema
  - [ ] 2.1 Set up PostgreSQL connection pool
    - Configure pg library with connection pooling
    - Create database connection module with error handling
    - Implement connection health check endpoint
    - _Requirements: 1.1, 1.6, 20.7_
  
  - [ ] 2.2 Create database schema migration
    - Create tables: users, posts, comments, likes, follows, messages, notifications, hashtags, post_hashtags, bookmarks, activity_logs
    - Add indexes on frequently queried columns (user_id, created_at, post_id)
    - Set up foreign key constraints and cascading deletes
    - _Requirements: 1.1, 3.1, 6.1, 7.1, 8.1, 9.1, 10.1, 19.5_
  
  - [ ]* 2.3 Write database schema validation tests
    - Test table existence and column definitions
    - Test foreign key constraints
    - Test index creation
    - _Requirements: 1.1, 3.1, 19.5_

- [ ] 3. Implement authentication system
  - [ ] 3.1 Create user registration endpoint
    - Implement POST /auth/register with email, username, password validation
    - Hash passwords using bcrypt before storage
    - Validate unique email and username constraints
    - Return appropriate error messages for validation failures
    - _Requirements: 1.1, 1.6, 1.7, 20.1, 20.2, 20.3, 20.4, 20.5_
  
  - [ ] 3.2 Create user login endpoint
    - Implement POST /auth/login with credential validation
    - Verify password using bcrypt.compare
    - Generate JWT token with 7-day expiration
    - Set HTTP-only secure cookie with token
    - _Requirements: 1.2, 1.3, 14.1, 14.2, 14.4, 14.6_
  
  - [ ] 3.3 Create JWT authentication middleware
    - Implement middleware to verify JWT tokens from cookies
    - Extract user ID from valid tokens
    - Reject requests with expired or invalid tokens
    - Attach user object to request for downstream handlers
    - _Requirements: 1.3, 1.4, 12.6, 18.1_
  
  - [ ] 3.4 Create logout endpoint
    - Implement POST /auth/logout to clear session cookie
    - Return success response
    - _Requirements: 1.5, 14.5_
  
  - [ ]* 3.5 Write authentication unit tests
    - Test registration with valid and invalid inputs
    - Test login with correct and incorrect credentials
    - Test JWT token generation and verification
    - Test middleware authentication flow
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7_

- [ ] 4. Checkpoint - Verify authentication system
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement user profile management
  - [ ] 5.1 Create profile view endpoint
    - Implement GET /profile/:username to retrieve user profile data
    - Include username, bio, avatar, post count, follower count, following count
    - Determine if current user is viewing their own profile or another user's
    - Render profile page with appropriate controls (edit vs follow/message)
    - _Requirements: 2.1, 2.4, 2.5, 7.4_
  
  - [ ] 5.2 Create profile update endpoint
    - Implement POST /profile/update for bio and avatar updates
    - Validate bio length (max 500 characters)
    - Handle avatar file upload with size validation (max 2MB)
    - Store avatar in file storage and update database with URL
    - _Requirements: 2.2, 2.3, 2.6, 2.7, 15.1, 15.2, 15.3, 15.4_
  
  - [ ]* 5.3 Write profile management tests
    - Test profile retrieval with valid and invalid usernames
    - Test bio update with valid and invalid lengths
    - Test avatar upload with valid and oversized files
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 2.7_

- [ ] 6. Implement post creation and management
  - [ ] 6.1 Create post creation endpoint
    - Implement POST /posts/create with text content and optional image
    - Validate content length (max 500 characters)
    - Handle image upload with size validation (max 5MB)
    - Extract hashtags from content using regex pattern #[word]
    - Create post record and hashtag associations
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 3.7, 10.1, 10.2, 10.5, 15.1, 15.2, 15.3, 15.5_
  
  - [ ] 6.2 Create post view endpoint
    - Implement GET /posts/:id to retrieve single post with metadata
    - Include author information, timestamp, like count, comment count
    - Render post detail page with comments
    - _Requirements: 3.4, 4.6_
  
  - [ ] 6.3 Create post deletion endpoint
    - Implement DELETE /posts/:id to remove post
    - Verify user owns the post before deletion
    - Delete associated comments, likes, hashtag associations
    - Delete associated image file from storage if present
    - _Requirements: 3.3, 15.6, 15.7_
  
  - [ ]* 6.4 Write post management tests
    - Test post creation with valid and invalid content
    - Test post creation with and without images
    - Test hashtag extraction and association
    - Test post deletion authorization
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 3.7_

- [ ] 7. Implement feed and discovery features
  - [ ] 7.1 Create home feed endpoint
    - Implement GET /home to retrieve posts from followed users and self
    - Order posts by creation time (most recent first)
    - Implement pagination with configurable page size (default 10)
    - Include author profile information with each post
    - Render home page with feed
    - _Requirements: 4.1, 4.4, 4.6, 13.1, 13.4_
  
  - [ ] 7.2 Create explore feed endpoint
    - Implement GET /explore to retrieve recent posts from all users
    - Order posts by creation time (most recent first)
    - Implement pagination with configurable page size (default 10)
    - Include author profile information with each post
    - Render explore page with feed
    - _Requirements: 4.2, 4.4, 4.6_
  
  - [ ] 7.3 Implement client-side infinite scroll
    - Create vanilla JavaScript module for infinite scroll detection
    - Fetch next page of posts when user scrolls to bottom
    - Append new posts to feed dynamically
    - Display empty state message when no posts available
    - _Requirements: 4.3, 4.5, 13.5_
  
  - [ ]* 7.4 Write feed tests
    - Test home feed returns only followed users' posts
    - Test explore feed returns all posts
    - Test pagination with different page sizes
    - Test empty feed state
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [ ] 8. Checkpoint - Verify core post and feed functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement likes and bookmarks
  - [ ] 9.1 Create like/unlike endpoints
    - Implement POST /posts/:id/like to create like record
    - Implement DELETE /posts/:id/like to remove like record
    - Update post like count atomically
    - Create notification for post author (unless self-like)
    - Return updated like state and count
    - _Requirements: 5.1, 5.2, 5.3, 16.1_
  
  - [ ] 9.2 Create bookmark/unbookmark endpoints
    - Implement POST /posts/:id/bookmark to create bookmark record
    - Implement DELETE /posts/:id/bookmark to remove bookmark record
    - Return updated bookmark state
    - _Requirements: 5.4, 5.5, 16.4_
  
  - [ ] 9.3 Create bookmarks view endpoint
    - Implement GET /bookmarks to retrieve user's bookmarked posts
    - Order by bookmark creation time (most recent first)
    - Implement pagination
    - Render bookmarks page
    - _Requirements: 5.6_
  
  - [ ] 9.4 Implement client-side like and bookmark interactions
    - Create vanilla JavaScript module for like button interactions
    - Update UI optimistically when user clicks like/unlike
    - Update UI optimistically when user clicks bookmark/unbookmark
    - Display current like and bookmark state for each post
    - _Requirements: 5.7, 13.5_
  
  - [ ]* 9.5 Write likes and bookmarks tests
    - Test like creation and removal
    - Test like count updates
    - Test bookmark creation and removal
    - Test notification creation on like
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 10. Implement comments and replies
  - [ ] 10.1 Create comment creation endpoint
    - Implement POST /posts/:id/comments with content and optional parent_comment_id
    - Validate content length (max 300 characters)
    - Create comment record with post ID, user ID, timestamp
    - Create notification for post author or comment author (for replies)
    - Return created comment with author information
    - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6, 16.2_
  
  - [ ] 10.2 Create comments retrieval endpoint
    - Implement GET /posts/:id/comments to retrieve all comments
    - Build hierarchical structure with parent-child relationships
    - Include author profile information for each comment
    - Order comments by creation time
    - _Requirements: 6.3_
  
  - [ ] 10.3 Create comment deletion endpoint
    - Implement DELETE /comments/:id to remove comment
    - Verify user owns the comment before deletion
    - Delete all child replies recursively
    - _Requirements: 6.7_
  
  - [ ] 10.4 Implement client-side comment interactions
    - Create vanilla JavaScript module for comment submission
    - Display comments in hierarchical structure
    - Handle reply button to show reply form
    - Update comment list dynamically after submission
    - _Requirements: 13.5_
  
  - [ ]* 10.5 Write comment tests
    - Test comment creation with valid and invalid content
    - Test reply creation with parent comment ID
    - Test hierarchical comment retrieval
    - Test comment deletion with cascading replies
    - _Requirements: 6.1, 6.2, 6.3, 6.6, 6.7_

- [ ] 11. Implement follow system
  - [ ] 11.1 Create follow/unfollow endpoints
    - Implement POST /users/:username/follow to create follow relationship
    - Implement DELETE /users/:username/follow to remove follow relationship
    - Prevent users from following themselves
    - Create notification for followed user
    - Return updated follow state
    - _Requirements: 7.1, 7.2, 7.3, 7.7_
  
  - [ ] 11.2 Create followers and following list endpoints
    - Implement GET /users/:username/followers to retrieve followers list
    - Implement GET /users/:username/following to retrieve following list
    - Include profile information for each user
    - Implement pagination
    - _Requirements: 7.5, 7.6_
  
  - [ ] 11.3 Implement client-side follow interactions
    - Create vanilla JavaScript module for follow button
    - Update UI optimistically when user clicks follow/unfollow
    - Display current follow state on profile pages
    - _Requirements: 7.4, 13.5_
  
  - [ ]* 11.4 Write follow system tests
    - Test follow relationship creation
    - Test unfollow relationship removal
    - Test self-follow prevention
    - Test followers and following list retrieval
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 7.6, 7.7_

- [ ] 12. Checkpoint - Verify interactions and social features
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement direct messaging
  - [ ] 13.1 Create message sending endpoint
    - Implement POST /messages/send with receiver username and content
    - Validate receiver exists
    - Create message record with sender ID, receiver ID, timestamp
    - Create notification for receiver
    - Return created message
    - _Requirements: 8.1, 8.7_
  
  - [ ] 13.2 Create conversations list endpoint
    - Implement GET /messages to retrieve all conversations
    - Group messages by conversation partner
    - Include most recent message and unread count for each conversation
    - Order by most recent message timestamp
    - Render messages page with conversation list
    - _Requirements: 8.2, 8.6_
  
  - [ ] 13.3 Create conversation view endpoint
    - Implement GET /messages/:username to retrieve conversation with specific user
    - Retrieve all messages between current user and specified user
    - Order messages by timestamp
    - Mark all messages in conversation as read
    - Render conversation page
    - _Requirements: 8.3, 8.5_
  
  - [ ] 13.4 Implement client-side messaging interface
    - Create vanilla JavaScript module for message submission
    - Display messages in chronological order
    - Update conversation dynamically after sending message
    - Show typing indicators and message status
    - _Requirements: 13.5_
  
  - [ ]* 13.5 Write messaging tests
    - Test message sending with valid receiver
    - Test message sending with invalid receiver
    - Test conversation list retrieval
    - Test conversation view and read status updates
    - _Requirements: 8.1, 8.2, 8.3, 8.5, 8.6_

- [ ] 14. Implement notifications system
  - [ ] 14.1 Create notification creation service
    - Implement notification service module with methods for each notification type
    - Support notification types: like, comment, follow, reply, mention, dm
    - Create notification records with type, actor, target, and metadata
    - _Requirements: 9.1, 9.6_
  
  - [ ] 14.2 Create notifications view endpoint
    - Implement GET /notifications to retrieve user's notifications
    - Order by creation time (most recent first)
    - Include actor profile information and target metadata
    - Implement pagination
    - Render notifications page
    - _Requirements: 9.2_
  
  - [ ] 14.3 Create mark as read endpoint
    - Implement POST /notifications/read to mark all notifications as read
    - Update unread status for all user's notifications
    - Return success response
    - _Requirements: 9.4_
  
  - [ ] 14.4 Implement client-side notification display
    - Create vanilla JavaScript module for notification badge
    - Display unread count on notifications icon
    - Handle notification click to navigate to relevant content
    - Update badge count dynamically
    - _Requirements: 9.5, 9.7, 13.5_
  
  - [ ]* 14.5 Write notification tests
    - Test notification creation for each type
    - Test notification retrieval and ordering
    - Test mark as read functionality
    - _Requirements: 9.1, 9.2, 9.4, 9.6_

- [ ] 15. Implement hashtag system
  - [ ] 15.1 Create hashtag extraction utility
    - Implement regex-based hashtag extraction from post content
    - Normalize hashtags to lowercase
    - Return array of unique hashtags
    - _Requirements: 10.1, 10.5_
  
  - [ ] 15.2 Create hashtag page endpoint
    - Implement GET /hashtags/:tag to retrieve posts with specific hashtag
    - Order posts by creation time (most recent first)
    - Implement pagination
    - Render hashtag page with post list
    - _Requirements: 10.3, 10.4, 10.6_
  
  - [ ] 15.3 Implement client-side hashtag links
    - Create vanilla JavaScript to make hashtags clickable in post content
    - Navigate to hashtag page when hashtag is clicked
    - _Requirements: 10.3, 13.5_
  
  - [ ]* 15.4 Write hashtag tests
    - Test hashtag extraction from various content patterns
    - Test hashtag normalization to lowercase
    - Test hashtag page post retrieval
    - Test case-insensitive hashtag matching
    - _Requirements: 10.1, 10.2, 10.4, 10.5_

- [ ] 16. Implement search functionality
  - [ ] 16.1 Create search endpoint
    - Implement GET /search with query parameter and type (posts/users)
    - Search post content using case-insensitive pattern matching
    - Search usernames and bios using case-insensitive pattern matching
    - Validate query length (max 100 characters)
    - Implement pagination for results
    - Render search results page
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_
  
  - [ ] 16.2 Implement client-side search interface
    - Create vanilla JavaScript module for search form
    - Handle search submission and result display
    - Support switching between posts and users search
    - Display empty state for no results
    - _Requirements: 11.5, 13.5_
  
  - [ ]* 16.3 Write search tests
    - Test post content search with various queries
    - Test user search with username and bio matching
    - Test empty query handling
    - Test query length validation
    - _Requirements: 11.1, 11.2, 11.5, 11.6_

- [ ] 17. Checkpoint - Verify messaging, notifications, hashtags, and search
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Implement real-time updates with Socket.io
  - [ ] 18.1 Set up Socket.io server
    - Install and configure Socket.io with Express server
    - Implement JWT authentication for socket connections
    - Handle connection and disconnection events
    - Create user socket mapping for targeted message delivery
    - _Requirements: 12.1, 12.4, 12.6_
  
  - [ ] 18.2 Implement real-time message delivery
    - Emit new messages to receiver's connected socket
    - Update conversation list in real-time for both sender and receiver
    - Handle offline users gracefully
    - _Requirements: 8.4, 12.2_
  
  - [ ] 18.3 Implement real-time notification delivery
    - Emit new notifications to user's connected socket
    - Update notification badge count in real-time
    - _Requirements: 9.3, 12.3_
  
  - [ ] 18.4 Implement real-time post updates
    - Emit like and comment updates to clients viewing the post
    - Update like count and comment count in real-time
    - _Requirements: 12.7_
  
  - [ ] 18.5 Implement client-side Socket.io connection
    - Create vanilla JavaScript module for Socket.io client
    - Establish connection on page load with JWT token
    - Handle reconnection logic and sync missed updates
    - Listen for message, notification, and post update events
    - _Requirements: 12.1, 12.5, 13.5_
  
  - [ ]* 18.6 Write real-time update tests
    - Test socket connection with valid and invalid tokens
    - Test message delivery to correct recipient
    - Test notification delivery to correct user
    - Test reconnection and sync logic
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 19. Implement Redis caching
  - [ ] 19.1 Set up Redis connection
    - Install and configure Redis client
    - Create Redis connection module with error handling
    - Implement connection health check
    - _Requirements: 19.1_
  
  - [ ] 19.2 Implement cache middleware
    - Create cache middleware for GET requests
    - Implement cache key generation based on route and user
    - Set appropriate TTL for different data types
    - _Requirements: 19.1, 19.2, 19.3_
  
  - [ ] 19.3 Implement cache invalidation
    - Create cache invalidation utility for data updates
    - Invalidate user profile cache on profile updates
    - Invalidate feed cache on new posts, likes, comments
    - Invalidate relevant caches on follow/unfollow
    - _Requirements: 19.4_
  
  - [ ]* 19.4 Write caching tests
    - Test cache hit and miss scenarios
    - Test cache TTL expiration
    - Test cache invalidation on updates
    - _Requirements: 19.1, 19.2, 19.3, 19.4_

- [ ] 20. Implement file upload and storage
  - [ ] 20.1 Set up file storage system
    - Configure multer for multipart form data handling
    - Create file storage directory structure
    - Implement unique filename generation
    - _Requirements: 15.3, 15.7_
  
  - [ ] 20.2 Create file upload middleware
    - Implement middleware for file type validation (JPEG, PNG, GIF, WebP)
    - Implement middleware for file size validation
    - Handle upload errors gracefully
    - _Requirements: 15.1, 15.2, 15.4, 15.5_
  
  - [ ] 20.3 Implement file deletion utility
    - Create utility to delete files from storage
    - Call deletion utility when posts or avatars are removed
    - _Requirements: 15.6_
  
  - [ ]* 20.4 Write file upload tests
    - Test file upload with valid file types
    - Test file upload with invalid file types
    - Test file size validation
    - Test file deletion
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [ ] 21. Implement activity logging
  - [ ] 21.1 Create activity logging service
    - Implement activity logging module with methods for each action type
    - Support action types: liked_post, commented, followed, bookmarked
    - Create activity log records with user ID, action type, target, and timestamp
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
  
  - [ ] 21.2 Create activity log view endpoint
    - Implement GET /activity to retrieve user's activity log
    - Order by creation time (most recent first)
    - Limit to 50 most recent entries
    - Render activity page
    - _Requirements: 16.5, 16.6_
  
  - [ ]* 21.3 Write activity logging tests
    - Test activity log creation for each action type
    - Test activity log retrieval and ordering
    - Test activity log limit
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [ ] 22. Implement user suggestions
  - [ ] 22.1 Create user suggestions endpoint
    - Implement GET /suggestions to retrieve suggested users
    - Exclude users already followed by current user
    - Exclude current user from suggestions
    - Prioritize users with recent activity or high follower counts
    - Limit to 5 users
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_
  
  - [ ] 22.2 Display suggestions on home page
    - Render suggestions sidebar on home page
    - Include follow button for each suggested user
    - _Requirements: 17.1_
  
  - [ ]* 22.3 Write user suggestions tests
    - Test suggestions exclude followed users
    - Test suggestions exclude current user
    - Test suggestions limit
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 23. Checkpoint - Verify real-time, caching, and auxiliary features
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 24. Implement comprehensive error handling
  - [ ] 24.1 Create error handling middleware
    - Implement global error handler for Express
    - Map error types to appropriate HTTP status codes
    - Return consistent error response format
    - Log errors with stack traces for debugging
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_
  
  - [ ] 24.2 Implement input validation middleware
    - Create validation middleware using express-validator or joi
    - Validate all required fields for each endpoint
    - Validate email format, username format, password strength
    - Sanitize user input to prevent XSS attacks
    - _Requirements: 18.7, 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_
  
  - [ ] 24.3 Implement client-side error display
    - Create vanilla JavaScript module for error toast notifications
    - Display user-friendly error messages for all error responses
    - Handle network errors and timeouts
    - _Requirements: 18.6, 13.5_
  
  - [ ]* 24.4 Write error handling tests
    - Test authentication errors (401)
    - Test authorization errors (403)
    - Test validation errors (400)
    - Test not found errors (404)
    - Test server errors (500)
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 25. Implement frontend styling and responsive design
  - [ ] 25.1 Create base CSS styles
    - Create CSS reset and base styles
    - Define color scheme and typography
    - Create utility classes for common patterns
    - _Requirements: 13.1, 13.5_
  
  - [ ] 25.2 Style authentication pages
    - Create styles for login and registration forms
    - Implement responsive layout for mobile and desktop
    - Add form validation styling
    - _Requirements: 13.1, 13.5_
  
  - [ ] 25.3 Style main application pages
    - Create styles for home feed, explore, profile, post detail
    - Implement navigation bar and sidebar styles
    - Create post card component styles
    - Implement responsive layout for all pages
    - _Requirements: 13.1, 13.5_
  
  - [ ] 25.4 Style messaging and notifications
    - Create styles for messages page and conversation view
    - Create styles for notifications page
    - Implement notification badge styling
    - _Requirements: 13.1, 13.5_
  
  - [ ] 25.5 Implement image lazy loading
    - Create vanilla JavaScript module for lazy loading images
    - Apply lazy loading to post images and avatars
    - Add loading placeholders
    - _Requirements: 19.6_

- [ ] 26. Production hardening and optimization
  - [ ] 26.1 Implement security headers
    - Configure helmet middleware for security headers
    - Set Content-Security-Policy headers
    - Configure CORS appropriately
    - _Requirements: 14.6, 20.6_
  
  - [ ] 26.2 Implement rate limiting
    - Install and configure express-rate-limit
    - Apply rate limiting to authentication endpoints
    - Apply rate limiting to API endpoints
    - _Requirements: 18.7_
  
  - [ ] 26.3 Optimize database queries
    - Review and optimize N+1 query patterns
    - Add database indexes for slow queries
    - Implement query result caching where appropriate
    - _Requirements: 19.5_
  
  - [ ] 26.4 Set up logging and monitoring
    - Configure winston or pino for structured logging
    - Log all errors with context
    - Log authentication events
    - Set up health check endpoint
    - _Requirements: 18.4_
  
  - [ ]* 26.5 Write integration tests
    - Test complete user registration and login flow
    - Test complete post creation and interaction flow
    - Test complete messaging flow
    - Test complete notification flow
    - _Requirements: 1.1, 1.2, 3.1, 8.1, 9.1_

- [ ] 27. Final checkpoint and deployment preparation
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all features work end-to-end
  - Review security configurations
  - Document environment variables and deployment steps

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- The implementation uses vanilla JavaScript for frontend and Express.js/Node.js for backend
- All database operations use parameterized queries to prevent SQL injection
- All user input is validated and sanitized to prevent XSS attacks
- Authentication uses JWT tokens stored in HTTP-only cookies
- Real-time features use Socket.io with JWT authentication
- Caching uses Redis with appropriate TTL values
- File uploads are validated for type and size before storage
