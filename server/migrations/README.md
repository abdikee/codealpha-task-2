# Database Migrations

This directory contains SQL migration files for the social media application database schema.

## Migration Files

- `001_initial_schema.sql` - Initial database schema with all tables, indexes, and constraints

## Running Migrations

### Apply All Pending Migrations

```bash
cd server
node migrate.js up
```

### Check Migration Status

```bash
cd server
node migrate.js status
```

### View Rollback Instructions

```bash
cd server
node migrate.js rollback
```

## Database Schema Overview

### Tables

1. **users** - User accounts with authentication credentials
   - Columns: id, email, username, password_hash, bio, avatar_url, created_at, updated_at
   - Indexes: email, username, created_at

2. **posts** - User-generated posts with optional images
   - Columns: id, user_id, content, image_url, created_at, updated_at
   - Indexes: user_id, created_at, (user_id, created_at)

3. **comments** - Comments on posts with support for nested replies
   - Columns: id, post_id, user_id, parent_id, content, created_at, updated_at
   - Indexes: post_id, user_id, parent_id, created_at, (post_id, created_at)

4. **likes** - User likes on posts
   - Columns: id, post_id, user_id, created_at
   - Indexes: post_id, user_id, created_at
   - Unique constraint: (post_id, user_id)

5. **follows** - User follow relationships
   - Columns: id, follower_id, following_id, created_at
   - Indexes: follower_id, following_id, created_at
   - Unique constraint: (follower_id, following_id)

6. **messages** - Direct messages between users
   - Columns: id, sender_id, receiver_id, content, read, created_at
   - Indexes: sender_id, receiver_id, created_at, (sender_id, receiver_id, created_at), unread messages

7. **notifications** - User notifications for various activities
   - Columns: id, user_id, type, related_id, read, created_at
   - Indexes: user_id, created_at, (user_id, created_at), unread notifications

8. **hashtags** - Hashtags extracted from post content
   - Columns: id, name, created_at
   - Indexes: name, created_at

9. **post_hashtags** - Junction table linking posts to hashtags
   - Columns: post_id, hashtag_id
   - Indexes: post_id, hashtag_id
   - Primary key: (post_id, hashtag_id)

10. **bookmarks** - User bookmarks for saving posts
    - Columns: id, user_id, post_id, created_at
    - Indexes: user_id, post_id, created_at, (user_id, created_at)
    - Unique constraint: (user_id, post_id)

11. **activity_logs** - Log of user activities for tracking
    - Columns: id, user_id, action_type, related_id, created_at
    - Indexes: user_id, created_at, (user_id, created_at)

### Views

- **user_post_counts** - Post counts per user
- **user_follow_counts** - Follower and following counts per user
- **post_engagement** - Like, comment, and bookmark counts per post

### Triggers

- **update_updated_at_column()** - Automatically updates updated_at timestamp on users, posts, and comments

## Index Strategy

Indexes are created on:
- Primary keys (automatic)
- Foreign keys for join performance
- Frequently queried columns (user_id, created_at)
- Composite indexes for common query patterns
- Partial indexes for filtered queries (unread messages/notifications)

## Constraints

- **Foreign keys** - Ensure referential integrity with CASCADE delete
- **Unique constraints** - Prevent duplicate likes, follows, and bookmarks
- **Check constraints** - Validate data format and length
- **NOT NULL** - Enforce required fields

## Creating New Migrations

1. Create a new SQL file in this directory with a sequential number:
   ```
   002_add_feature.sql
   ```

2. Write your migration SQL (CREATE, ALTER, etc.)

3. Run the migration:
   ```bash
   node migrate.js up
   ```

## Best Practices

- Always test migrations on a development database first
- Use transactions for complex migrations
- Add indexes for frequently queried columns
- Document breaking changes
- Keep migrations small and focused
- Never modify existing migration files after they've been applied

## Troubleshooting

### Migration Fails

If a migration fails:
1. Check the error message in the console
2. Fix the SQL in the migration file
3. Manually rollback any partial changes
4. Delete the failed migration from `schema_migrations` table
5. Re-run the migration

### Reset Database

To completely reset the database:
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Drop and recreate database
DROP DATABASE IF EXISTS social_media;
CREATE DATABASE social_media;

-- Exit and run migrations
\q
node migrate.js up
```
